const express = require('express');
const Joi = require('joi');
const { authenticateToken, requireRole } = require('../middleware/authentication');
const crypto = require('crypto');
const router = express.Router();

// Validation schemas
const updateRepairStatusSchema = Joi.object({
  status: Joi.string().valid('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'READY_FOR_PICKUP', 'COMPLETED', 'CANCELLED').required(),
  technicianNotes: Joi.string().max(1000).optional(),
  estimatedCompletion: Joi.date().iso().optional(),
  finalPrice: Joi.number().min(0).optional()
});

const addRepairNoteSchema = Joi.object({
  note: Joi.string().min(1).max(1000).required(),
  isVisibleToCustomer: Joi.boolean().default(false),
  milestone: Joi.string().optional()
});

// Get all active repairs (staff only)
router.get('/', authenticateToken, requireRole(['ADMIN', 'SUPER_ADMIN', 'TECHNICIAN']), async (req, res) => {
  try {
    const { status, technicianId, limit = 50, offset = 0 } = req.query;

    let whereClause = 'WHERE b.status IN ($1, $2, $3)';
    const queryParams = ['CONFIRMED', 'IN_PROGRESS', 'READY_FOR_PICKUP'];
    let paramIndex = 4;

    if (status && ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'READY_FOR_PICKUP', 'COMPLETED', 'CANCELLED'].includes(status)) {
      whereClause = 'WHERE b.status = $1';
      queryParams.length = 0;
      queryParams.push(status);
      paramIndex = 2;
    }

    if (technicianId) {
      whereClause += ` AND b."assignedTechnicianId" = $${paramIndex}`;
      queryParams.push(technicianId);
      paramIndex++;
    }

    const repairsQuery = `
      SELECT 
        b.id,
        b.status,
        b."repairType",
        b."problemDescription",
        b."urgencyLevel",
        b."basePrice",
        b."finalPrice",
        b."preferredDate",
        b."scheduledDate",
        b."estimatedCompletion",
        b."completedAt",
        b."customerNotes",
        b."internalNotes",
        b."createdAt",
        b."updatedAt",
        u.email as "customerEmail",
        u."firstName" as "customerFirstName", 
        u."lastName" as "customerLastName",
        u.phone as "customerPhone",
        dm.name as "deviceModel",
        dm.year as "deviceYear",
        db.name as "deviceBrand",
        dc.name as "deviceCategory",
        tech."firstName" as "technicianFirstName",
        tech."lastName" as "technicianLastName"
      FROM bookings b
      JOIN users u ON b."customerId" = u.id
      JOIN device_models dm ON b."deviceModelId" = dm.id
      JOIN device_brands db ON dm."brandId" = db.id
      JOIN device_categories dc ON db."categoryId" = dc.id
      LEFT JOIN users tech ON b."assignedTechnicianId" = tech.id
      ${whereClause}
      ORDER BY 
        CASE b."urgencyLevel"
          WHEN 'EMERGENCY' THEN 1
          WHEN 'URGENT' THEN 2
          ELSE 3
        END,
        b."createdAt" ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(parseInt(limit), parseInt(offset));
    const result = await req.pool.query(repairsQuery, queryParams);

    res.json({
      success: true,
      repairs: result.rows
    });

  } catch (error) {
    req.logger.error('Get repairs error:', error);
    res.status(500).json({
      error: 'Failed to fetch repairs',
      code: 'FETCH_REPAIRS_ERROR'
    });
  }
});

// Get repairs assigned to current technician
router.get('/my-repairs', authenticateToken, requireRole(['TECHNICIAN', 'ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { status, limit = 20, offset = 0 } = req.query;

    let whereClause = 'WHERE b."assignedTechnicianId" = $1';
    const queryParams = [req.user.id];
    let paramIndex = 2;

    if (status && ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'READY_FOR_PICKUP', 'COMPLETED', 'CANCELLED'].includes(status)) {
      whereClause += ` AND b.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    } else {
      // Default to active repairs only
      whereClause += ` AND b.status IN ($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2})`;
      queryParams.push('CONFIRMED', 'IN_PROGRESS', 'READY_FOR_PICKUP');
      paramIndex += 3;
    }

    const repairsQuery = `
      SELECT 
        b.id,
        b.status,
        b."repairType",
        b."problemDescription",
        b."urgencyLevel",
        b."finalPrice",
        b."scheduledDate",
        b."estimatedCompletion",
        b."customerNotes",
        b."internalNotes",
        b."createdAt",
        u.email as "customerEmail",
        u."firstName" as "customerFirstName", 
        u."lastName" as "customerLastName",
        u.phone as "customerPhone",
        dm.name as "deviceModel",
        dm.year as "deviceYear",
        db.name as "deviceBrand"
      FROM bookings b
      JOIN users u ON b."customerId" = u.id
      JOIN device_models dm ON b."deviceModelId" = dm.id
      JOIN device_brands db ON dm."brandId" = db.id
      ${whereClause}
      ORDER BY 
        CASE b."urgencyLevel"
          WHEN 'EMERGENCY' THEN 1
          WHEN 'URGENT' THEN 2
          ELSE 3
        END,
        b."createdAt" ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(parseInt(limit), parseInt(offset));
    const result = await req.pool.query(repairsQuery, queryParams);

    res.json({
      success: true,
      repairs: result.rows
    });

  } catch (error) {
    req.logger.error('Get my repairs error:', error);
    res.status(500).json({
      error: 'Failed to fetch your repairs',
      code: 'FETCH_MY_REPAIRS_ERROR'
    });
  }
});

// Get single repair details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const repairQuery = `
      SELECT 
        b.*,
        u.email as "customerEmail",
        u."firstName" as "customerFirstName", 
        u."lastName" as "customerLastName",
        u.phone as "customerPhone",
        dm.name as "deviceModel",
        dm.year as "deviceYear",
        dm.specs as "deviceSpecs",
        dm."imageUrl" as "deviceImageUrl",
        db.name as "deviceBrand",
        dc.name as "deviceCategory",
        tech."firstName" as "technicianFirstName",
        tech."lastName" as "technicianLastName",
        tech.email as "technicianEmail"
      FROM bookings b
      JOIN users u ON b."customerId" = u.id
      JOIN device_models dm ON b."deviceModelId" = dm.id
      JOIN device_brands db ON dm."brandId" = db.id
      JOIN device_categories dc ON db."categoryId" = dc.id
      LEFT JOIN users tech ON b."assignedTechnicianId" = tech.id
      WHERE b.id = $1
    `;

    const result = await req.pool.query(repairQuery, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Repair not found',
        code: 'REPAIR_NOT_FOUND'
      });
    }

    const repair = result.rows[0];

    // Check permissions
    const isCustomer = req.user.role === 'CUSTOMER' && repair.customerId === req.user.id;
    const isTechnician = req.user.role === 'TECHNICIAN' && repair.assignedTechnicianId === req.user.id;
    const isStaff = ['ADMIN', 'SUPER_ADMIN'].includes(req.user.role);

    if (!isCustomer && !isTechnician && !isStaff) {
      return res.status(403).json({
        error: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }

    res.json({
      success: true,
      repair
    });

  } catch (error) {
    req.logger.error('Get repair error:', error);
    res.status(500).json({
      error: 'Failed to fetch repair details',
      code: 'FETCH_REPAIR_ERROR'
    });
  }
});

// Update repair status (staff only)
router.put('/:id/status', authenticateToken, requireRole(['ADMIN', 'SUPER_ADMIN', 'TECHNICIAN']), async (req, res) => {
  try {
    const { id } = req.params;

    // Validate input
    const { error, value } = updateRepairStatusSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(detail => detail.message)
      });
    }

    const { status, technicianNotes, estimatedCompletion, finalPrice } = value;

    // Check if repair exists and user has permission
    const repairCheck = await req.pool.query(
      'SELECT "assignedTechnicianId", status as currentStatus FROM bookings WHERE id = $1',
      [id]
    );

    if (repairCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'Repair not found',
        code: 'REPAIR_NOT_FOUND'
      });
    }

    const currentRepair = repairCheck.rows[0];

    // Technicians can only update repairs assigned to them
    if (req.user.role === 'TECHNICIAN' && currentRepair.assignedTechnicianId !== req.user.id) {
      return res.status(403).json({
        error: 'You can only update repairs assigned to you',
        code: 'ACCESS_DENIED'
      });
    }

    // Build update query
    const updates = ['status = $2', '"updatedAt" = NOW()'];
    const queryParams = [id, status];
    let paramIndex = 3;

    if (technicianNotes !== undefined) {
      updates.push(`"internalNotes" = $${paramIndex}`);
      queryParams.push(technicianNotes);
      paramIndex++;
    }

    if (estimatedCompletion !== undefined) {
      updates.push(`"estimatedCompletion" = $${paramIndex}`);
      queryParams.push(estimatedCompletion);
      paramIndex++;
    }

    if (finalPrice !== undefined) {
      updates.push(`"finalPrice" = $${paramIndex}`);
      queryParams.push(finalPrice);
      paramIndex++;
    }

    // Set completion date if status is COMPLETED
    if (status === 'COMPLETED') {
      updates.push('"completedAt" = NOW()');
    }

    const updateQuery = `
      UPDATE bookings 
      SET ${updates.join(', ')}
      WHERE id = $1
      RETURNING *
    `;

    const result = await req.pool.query(updateQuery, queryParams);

    req.logger.info(`Repair status updated: ${id} -> ${status} by user: ${req.user.id}`);

    res.json({
      success: true,
      message: 'Repair status updated successfully',
      repair: result.rows[0]
    });

  } catch (error) {
    req.logger.error('Update repair status error:', error);
    res.status(500).json({
      error: 'Failed to update repair status',
      code: 'UPDATE_REPAIR_STATUS_ERROR'
    });
  }
});

// Assign repair to technician (admin only)
router.put('/:id/assign', authenticateToken, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { technicianId } = req.body;

    if (!technicianId) {
      return res.status(400).json({
        error: 'Technician ID is required'
      });
    }

    // Verify technician exists and has correct role
    const techCheck = await req.pool.query(
      'SELECT id FROM users WHERE id = $1 AND role IN ($2, $3) AND "isActive" = true',
      [technicianId, 'TECHNICIAN', 'ADMIN']
    );

    if (techCheck.rows.length === 0) {
      return res.status(400).json({
        error: 'Invalid technician ID',
        code: 'INVALID_TECHNICIAN'
      });
    }

    // Update repair assignment
    const result = await req.pool.query(
      'UPDATE bookings SET "assignedTechnicianId" = $1, "updatedAt" = NOW() WHERE id = $2 RETURNING *',
      [technicianId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Repair not found',
        code: 'REPAIR_NOT_FOUND'
      });
    }

    req.logger.info(`Repair assigned: ${id} -> technician: ${technicianId} by user: ${req.user.id}`);

    res.json({
      success: true,
      message: 'Repair assigned successfully',
      repair: result.rows[0]
    });

  } catch (error) {
    req.logger.error('Assign repair error:', error);
    res.status(500).json({
      error: 'Failed to assign repair',
      code: 'ASSIGN_REPAIR_ERROR'
    });
  }
});

// Get repair milestones
router.get('/milestones/list', authenticateToken, async (req, res) => {
  try {
    const milestonesQuery = `
      SELECT 
        id,
        name,
        description,
        typical_duration_hours as "typicalDurationHours",
        order_sequence as "orderSequence"
      FROM repair_milestones 
      WHERE is_active = true 
      ORDER BY order_sequence ASC
    `;

    const result = await req.pool.query(milestonesQuery);

    res.json({
      success: true,
      milestones: result.rows
    });

  } catch (error) {
    req.logger.error('Get milestones error:', error);
    res.status(500).json({
      error: 'Failed to fetch repair milestones',
      code: 'FETCH_MILESTONES_ERROR'
    });
  }
});

// Get repair statistics (admin only)
router.get('/stats/overview', authenticateToken, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_repairs,
        COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_repairs,
        COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END) as in_progress_repairs,
        COUNT(CASE WHEN status = 'READY_FOR_PICKUP' THEN 1 END) as ready_for_pickup,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_repairs,
        AVG(CASE 
          WHEN status = 'COMPLETED' AND "completedAt" IS NOT NULL 
          THEN EXTRACT(EPOCH FROM ("completedAt" - "createdAt")) / 3600 
        END) as avg_completion_hours,
        AVG("finalPrice") as average_price
      FROM bookings
      WHERE "createdAt" >= NOW() - INTERVAL '30 days'
    `;

    const result = await req.pool.query(statsQuery);
    const stats = result.rows[0];

    // Convert strings to numbers
    stats.total_repairs = parseInt(stats.total_repairs);
    stats.pending_repairs = parseInt(stats.pending_repairs);
    stats.in_progress_repairs = parseInt(stats.in_progress_repairs);
    stats.ready_for_pickup = parseInt(stats.ready_for_pickup);
    stats.completed_repairs = parseInt(stats.completed_repairs);
    stats.avg_completion_hours = parseFloat(stats.avg_completion_hours) || 0;
    stats.average_price = parseFloat(stats.average_price) || 0;

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    req.logger.error('Get repair stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch repair statistics',
      code: 'FETCH_REPAIR_STATS_ERROR'
    });
  }
});

module.exports = router;