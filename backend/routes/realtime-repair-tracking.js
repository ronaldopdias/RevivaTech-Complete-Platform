/**
 * Real-Time Repair Tracking API Routes
 * 
 * RESTful API endpoints for managing real-time repair tracking
 * Integrates with WebSocket service for live updates
 */

const express = require('express');
const { body, param, validationResult } = require('express-validator');

// Import Better Auth middleware
const { authenticateBetterAuth, requireRole } = require('../middleware/better-auth-official');

const router = express.Router();

// Apply Better Auth authentication to all routes
router.use(authenticateBetterAuth);

// Middleware to check admin/technician role
const requireStaffRole = (req, res, next) => {
  if (!['admin', 'technician'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Staff access required' });
  }
  next();
};

/**
 * @swagger
 * components:
 *   schemas:
 *     RepairStatus:
 *       type: object
 *       properties:
 *         repairId:
 *           type: string
 *         status:
 *           type: string
 *           enum: [received, diagnosis_started, diagnosed, parts_ordered, repair_in_progress, quality_check, quality_approved, ready_for_pickup, completed]
 *         message:
 *           type: string
 *         estimatedCompletion:
 *           type: string
 *           format: date-time
 *         photos:
 *           type: array
 *           items:
 *             type: string
 */

/**
 * @swagger
 * /api/repairs/{repairId}/status:
 *   get:
 *     summary: Get current repair status
 *     tags: [Repair Tracking]
 *     parameters:
 *       - in: path
 *         name: repairId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Current repair status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RepairStatus'
 */
router.get('/repairs/:repairId/status', 
  param('repairId').isUUID(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { repairId } = req.params;
      
      // Check if user has access to this repair
      let accessQuery;
      let accessParams;
      
      if (req.user.role === 'customer') {
        accessQuery = `
          SELECT rb.*, c.email as customer_email 
          FROM repair_bookings rb 
          JOIN customers c ON rb.customer_id = c.id 
          WHERE rb.id = $1 AND c.id = $2
        `;
        accessParams = [repairId, req.user.id];
      } else {
        // Staff can access all repairs
        accessQuery = `
          SELECT rb.*, c.email as customer_email 
          FROM repair_bookings rb 
          JOIN customers c ON rb.customer_id = c.id 
          WHERE rb.id = $1
        `;
        accessParams = [repairId];
      }

      const repairResult = await req.pool.query(accessQuery, accessParams);
      
      if (repairResult.rows.length === 0) {
        return res.status(404).json({ error: 'Repair not found or access denied' });
      }

      const repair = repairResult.rows[0];

      // Get latest status updates
      const statusQuery = `
        SELECT * FROM repair_status_updates 
        WHERE repair_id = $1 
        ORDER BY created_at DESC 
        LIMIT 1
      `;
      const statusResult = await req.pool.query(statusQuery, [repairId]);

      // Get progress information
      const progressQuery = `
        SELECT * FROM repair_progress 
        WHERE repair_id = $1 
        ORDER BY updated_at DESC 
        LIMIT 1
      `;
      const progressResult = await req.pool.query(progressQuery, [repairId]);

      const response = {
        repairId,
        basicInfo: {
          status: repair.status,
          createdAt: repair.created_at,
          deviceInfo: repair.device_info
        },
        currentStatus: statusResult.rows[0] || null,
        progress: progressResult.rows[0] || null
      };

      res.json(response);

    } catch (error) {
      req.logger?.error('Error fetching repair status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * @swagger
 * /api/repairs/{repairId}/status:
 *   post:
 *     summary: Update repair status (Staff only)
 *     tags: [Repair Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: repairId
 *         required: true
 *         schema:
 *           type: string
 */
router.post('/repairs/:repairId/status',
  requireStaffRole,
  [
    param('repairId').isUUID(),
    body('status').isIn(['received', 'diagnosis_started', 'diagnosed', 'parts_ordered', 'repair_in_progress', 'quality_check', 'quality_approved', 'ready_for_pickup', 'completed']),
    body('message').isString().isLength({ min: 1, max: 500 }),
    body('estimatedCompletion').optional().isISO8601(),
    body('photos').optional().isArray()
  ],
  async (req, res) => {
    const client = await req.pool.connect();
    
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { repairId } = req.params;
      const { status, message, estimatedCompletion, photos } = req.body;

      await client.query('BEGIN');

      // Verify repair exists
      const repairCheck = await client.query(
        'SELECT id, customer_id FROM repair_bookings WHERE id = $1',
        [repairId]
      );

      if (repairCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Repair not found' });
      }

      const customerId = repairCheck.rows[0].customer_id;

      // Update main repair status
      await client.query(
        'UPDATE repair_bookings SET status = $1, updated_at = NOW() WHERE id = $2',
        [status, repairId]
      );

      // Insert status update record
      const statusUpdateQuery = `
        INSERT INTO repair_status_updates (
          repair_id, status, message, estimated_completion, 
          photos, updated_by, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING *
      `;

      const statusUpdateResult = await client.query(statusUpdateQuery, [
        repairId,
        status,
        message,
        estimatedCompletion || null,
        JSON.stringify(photos || []),
        req.user.id
      ]);

      const statusUpdate = statusUpdateResult.rows[0];

      await client.query('COMMIT');

      // Broadcast real-time update via WebSocket
      const realtimeTracker = req.app.locals.realtimeRepairTracker;
      if (realtimeTracker) {
        await realtimeTracker.broadcastRepairUpdate({
          repairId,
          status,
          message,
          estimatedCompletion,
          photos: photos || [],
          customerId,
          updatedBy: {
            id: req.user.id,
            email: req.user.email,
            role: req.user.role
          }
        });
      }

      req.logger?.info(`Repair ${repairId} status updated to ${status} by ${req.user.email}`);

      res.json({
        success: true,
        statusUpdate,
        message: 'Repair status updated successfully'
      });

    } catch (error) {
      await client.query('ROLLBACK');
      req.logger?.error('Error updating repair status:', error);
      res.status(500).json({ error: 'Failed to update repair status' });
    } finally {
      client.release();
    }
  }
);

/**
 * @swagger
 * /api/repairs/{repairId}/progress:
 *   post:
 *     summary: Update repair progress (Staff only)
 *     tags: [Repair Tracking]
 */
router.post('/repairs/:repairId/progress',
  requireStaffRole,
  [
    param('repairId').isUUID(),
    body('milestone').isString().isLength({ min: 1, max: 100 }),
    body('progress').isInt({ min: 0, max: 100 }),
    body('notes').optional().isString().isLength({ max: 1000 }),
    body('timeSpent').optional().isFloat({ min: 0 }),
    body('nextSteps').optional().isString().isLength({ max: 500 })
  ],
  async (req, res) => {
    const client = await req.pool.connect();
    
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { repairId } = req.params;
      const { milestone, progress, notes, timeSpent, nextSteps } = req.body;

      await client.query('BEGIN');

      // Verify repair exists
      const repairCheck = await client.query(
        'SELECT id FROM repair_bookings WHERE id = $1',
        [repairId]
      );

      if (repairCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Repair not found' });
      }

      // Insert or update progress record
      const progressQuery = `
        INSERT INTO repair_progress (
          repair_id, milestone, progress, notes, time_spent, 
          next_steps, updated_by, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        ON CONFLICT (repair_id) DO UPDATE SET
          milestone = EXCLUDED.milestone,
          progress = EXCLUDED.progress,
          notes = EXCLUDED.notes,
          time_spent = EXCLUDED.time_spent,
          next_steps = EXCLUDED.next_steps,
          updated_by = EXCLUDED.updated_by,
          updated_at = NOW()
        RETURNING *
      `;

      const progressResult = await client.query(progressQuery, [
        repairId,
        milestone,
        progress,
        notes || null,
        timeSpent || null,
        nextSteps || null,
        req.user.id
      ]);

      const progressUpdate = progressResult.rows[0];

      await client.query('COMMIT');

      // Broadcast real-time progress update
      const realtimeTracker = req.app.locals.realtimeRepairTracker;
      if (realtimeTracker) {
        await realtimeTracker.updateRepairProgress({
          repairId,
          milestone,
          progress,
          notes,
          timeSpent,
          nextSteps
        }, {
          id: req.user.id,
          email: req.user.email,
          role: req.user.role
        });
      }

      req.logger?.info(`Repair ${repairId} progress updated to ${progress}% by ${req.user.email}`);

      res.json({
        success: true,
        progressUpdate,
        message: 'Repair progress updated successfully'
      });

    } catch (error) {
      await client.query('ROLLBACK');
      req.logger?.error('Error updating repair progress:', error);
      res.status(500).json({ error: 'Failed to update repair progress' });
    } finally {
      client.release();
    }
  }
);

/**
 * @swagger
 * /api/repairs/{repairId}/notes:
 *   post:
 *     summary: Add a note to repair
 *     tags: [Repair Tracking]
 */
router.post('/repairs/:repairId/notes',
  [
    param('repairId').isUUID(),
    body('note').isString().isLength({ min: 1, max: 1000 }),
    body('priority').optional().isIn(['low', 'normal', 'high', 'urgent']),
    body('isPrivate').optional().isBoolean()
  ],
  async (req, res) => {
    const client = await req.pool.connect();
    
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { repairId } = req.params;
      const { note, priority = 'normal', isPrivate = false } = req.body;

      // Customers cannot add private notes
      if (isPrivate && req.user.role === 'customer') {
        return res.status(403).json({ error: 'Customers cannot add private notes' });
      }

      // Verify repair access
      let accessQuery;
      let accessParams;
      
      if (req.user.role === 'customer') {
        accessQuery = `
          SELECT rb.id 
          FROM repair_bookings rb 
          JOIN customers c ON rb.customer_id = c.id 
          WHERE rb.id = $1 AND c.id = $2
        `;
        accessParams = [repairId, req.user.id];
      } else {
        accessQuery = 'SELECT id FROM repair_bookings WHERE id = $1';
        accessParams = [repairId];
      }

      const repairCheck = await client.query(accessQuery, accessParams);

      if (repairCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Repair not found or access denied' });
      }

      await client.query('BEGIN');

      // Insert note
      const noteQuery = `
        INSERT INTO repair_notes (
          repair_id, note, priority, is_private, 
          added_by, created_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING *
      `;

      const noteResult = await client.query(noteQuery, [
        repairId,
        note,
        priority,
        isPrivate,
        req.user.id
      ]);

      const newNote = noteResult.rows[0];

      await client.query('COMMIT');

      // Broadcast real-time note update
      const realtimeTracker = req.app.locals.realtimeRepairTracker;
      if (realtimeTracker) {
        await realtimeTracker.addRepairNote({
          repairId,
          note,
          priority,
          isPrivate
        }, {
          id: req.user.id,
          email: req.user.email,
          role: req.user.role
        });
      }

      req.logger?.info(`Note added to repair ${repairId} by ${req.user.email}`);

      res.json({
        success: true,
        note: newNote,
        message: 'Note added successfully'
      });

    } catch (error) {
      await client.query('ROLLBACK');
      req.logger?.error('Error adding repair note:', error);
      res.status(500).json({ error: 'Failed to add note' });
    } finally {
      client.release();
    }
  }
);

/**
 * @swagger
 * /api/repairs/{repairId}/photos:
 *   post:
 *     summary: Upload repair photo
 *     tags: [Repair Tracking]
 */
router.post('/repairs/:repairId/photos',
  [
    param('repairId').isUUID(),
    body('photoUrl').isURL(),
    body('description').optional().isString().isLength({ max: 200 }),
    body('category').optional().isIn(['before', 'progress', 'after', 'issue', 'solution'])
  ],
  async (req, res) => {
    const client = await req.pool.connect();
    
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { repairId } = req.params;
      const { photoUrl, description, category = 'progress' } = req.body;

      // Verify repair access (staff only for photo uploads)
      if (!['admin', 'technician'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Staff access required for photo uploads' });
      }

      const repairCheck = await client.query(
        'SELECT id FROM repair_bookings WHERE id = $1',
        [repairId]
      );

      if (repairCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Repair not found' });
      }

      await client.query('BEGIN');

      // Insert photo record
      const photoQuery = `
        INSERT INTO repair_photos (
          repair_id, photo_url, description, category, 
          uploaded_by, created_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING *
      `;

      const photoResult = await client.query(photoQuery, [
        repairId,
        photoUrl,
        description || null,
        category,
        req.user.id
      ]);

      const newPhoto = photoResult.rows[0];

      await client.query('COMMIT');

      // Broadcast real-time photo upload notification
      const realtimeTracker = req.app.locals.realtimeRepairTracker;
      if (realtimeTracker) {
        await realtimeTracker.notifyPhotoUpload({
          repairId,
          photoUrl,
          description,
          category
        }, {
          id: req.user.id,
          email: req.user.email,
          role: req.user.role
        });
      }

      req.logger?.info(`Photo uploaded for repair ${repairId} by ${req.user.email}`);

      res.json({
        success: true,
        photo: newPhoto,
        message: 'Photo uploaded successfully'
      });

    } catch (error) {
      await client.query('ROLLBACK');
      req.logger?.error('Error uploading repair photo:', error);
      res.status(500).json({ error: 'Failed to upload photo' });
    } finally {
      client.release();
    }
  }
);

/**
 * @swagger
 * /api/repairs/{repairId}/quality-check:
 *   post:
 *     summary: Submit quality check results (Staff only)
 *     tags: [Repair Tracking]
 */
router.post('/repairs/:repairId/quality-check',
  requireStaffRole,
  [
    param('repairId').isUUID(),
    body('passed').isBoolean(),
    body('score').isInt({ min: 1, max: 10 }),
    body('issues').optional().isArray(),
    body('recommendations').optional().isArray()
  ],
  async (req, res) => {
    const client = await req.pool.connect();
    
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { repairId } = req.params;
      const { passed, score, issues = [], recommendations = [] } = req.body;

      const repairCheck = await client.query(
        'SELECT id FROM repair_bookings WHERE id = $1',
        [repairId]
      );

      if (repairCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Repair not found' });
      }

      await client.query('BEGIN');

      // Insert quality check record
      const qualityQuery = `
        INSERT INTO repair_quality_checks (
          repair_id, passed, score, issues, recommendations, 
          checked_by, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING *
      `;

      const qualityResult = await client.query(qualityQuery, [
        repairId,
        passed,
        score,
        JSON.stringify(issues),
        JSON.stringify(recommendations),
        req.user.id
      ]);

      const qualityCheck = qualityResult.rows[0];

      await client.query('COMMIT');

      // Broadcast real-time quality check update
      const realtimeTracker = req.app.locals.realtimeRepairTracker;
      if (realtimeTracker) {
        await realtimeTracker.updateQualityCheck({
          repairId,
          passed,
          score,
          issues,
          recommendations
        }, {
          id: req.user.id,
          email: req.user.email,
          role: req.user.role
        });
      }

      req.logger?.info(`Quality check for repair ${repairId}: ${passed ? 'PASSED' : 'FAILED'} (Score: ${score}) by ${req.user.email}`);

      res.json({
        success: true,
        qualityCheck,
        message: 'Quality check submitted successfully'
      });

    } catch (error) {
      await client.query('ROLLBACK');
      req.logger?.error('Error submitting quality check:', error);
      res.status(500).json({ error: 'Failed to submit quality check' });
    } finally {
      client.release();
    }
  }
);

/**
 * @swagger
 * /api/repairs/stats:
 *   get:
 *     summary: Get repair tracking statistics (Admin only)
 *     tags: [Repair Tracking]
 */
router.get('/stats',
  async (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      // Get real-time service stats
      const realtimeTracker = req.app.locals.realtimeRepairTracker;
      const serviceStats = realtimeTracker ? realtimeTracker.getServiceStats() : null;

      // Get database stats
      const statusStatsQuery = `
        SELECT status, COUNT(*) as count 
        FROM repair_bookings 
        GROUP BY status
      `;
      const statusStats = await req.pool.query(statusStatsQuery);

      const dailyStatsQuery = `
        SELECT DATE(created_at) as date, COUNT(*) as count 
        FROM repair_bookings 
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `;
      const dailyStats = await req.pool.query(dailyStatsQuery);

      res.json({
        success: true,
        serviceStats,
        databaseStats: {
          statusDistribution: statusStats.rows,
          dailyVolume: dailyStats.rows
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      req.logger?.error('Error fetching repair stats:', error);
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  }
);

module.exports = router;