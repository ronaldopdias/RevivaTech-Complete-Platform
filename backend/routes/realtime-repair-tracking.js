/**
 * Real-Time Repair Tracking API Routes
 * 
 * RESTful API endpoints for managing real-time repair tracking
 * Integrates with WebSocket service for live updates
 */

const express = require('express');
const { prisma } = require('../lib/prisma');
const { body, param, validationResult } = require('express-validator');

// Import Better Auth middleware
const { requireAuth: authenticateBetterAuth, requireRole } = require('../lib/auth-utils');

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
      
      // Check if user has access to this repair using Prisma
      let repairWhere;
      
      if (req.user.role === 'customer') {
        repairWhere = {
          id: repairId,
          customerId: req.user.id
        };
      } else {
        // Staff can access all repairs
        repairWhere = {
          id: repairId
        };
      }

      const repair = await prisma.repairBooking.findFirst({
        where: repairWhere,
        include: {
          customer: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });
      
      if (!repair) {
        return res.status(404).json({ error: 'Repair not found or access denied' });
      }

      // Get latest status updates using Prisma
      const latestStatus = await prisma.repairStatusUpdate.findFirst({
        where: {
          repairId: repairId
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Get progress information using Prisma
      const progressInfo = await prisma.repairProgress.findUnique({
        where: {
          repairId: repairId
        }
      });

      const response = {
        repairId,
        basicInfo: {
          status: repair.status,
          createdAt: repair.createdAt,
          deviceInfo: repair.deviceInfo
        },
        currentStatus: latestStatus || null,
        progress: progressInfo || null
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
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { repairId } = req.params;
      const { status, message, estimatedCompletion, photos } = req.body;

      // Use Prisma transaction
      const result = await prisma.$transaction(async (prisma) => {
        // Verify repair exists
        const repairCheck = await prisma.repairBooking.findUnique({
          where: { id: repairId },
          select: { id: true, customerId: true }
        });

        if (!repairCheck) {
          throw new Error('Repair not found');
        }

        // Update main repair status
        await prisma.repairBooking.update({
          where: { id: repairId },
          data: { 
            status: status,
            updatedAt: new Date()
          }
        });

        // Insert status update record
        const statusUpdate = await prisma.repairStatusUpdate.create({
          data: {
            repairId: repairId,
            status: status,
            message: message,
            estimatedCompletion: estimatedCompletion ? new Date(estimatedCompletion) : null,
            photos: photos || [],
            updatedBy: req.user.id
          }
        });

        return {
          statusUpdate,
          customerId: repairCheck.customerId
        };
      });

      // Broadcast real-time update via WebSocket
      const realtimeTracker = req.app.locals.realtimeRepairTracker;
      if (realtimeTracker) {
        await realtimeTracker.broadcastRepairUpdate({
          repairId,
          status,
          message,
          estimatedCompletion,
          photos: photos || [],
          customerId: result.customerId,
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
        statusUpdate: result.statusUpdate,
        message: 'Repair status updated successfully'
      });

    } catch (error) {
      if (error.message === 'Repair not found') {
        return res.status(404).json({ error: 'Repair not found' });
      }
      req.logger?.error('Error updating repair status:', error);
      res.status(500).json({ error: 'Failed to update repair status' });
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
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { repairId } = req.params;
      const { milestone, progress, notes, timeSpent, nextSteps } = req.body;

      // Use Prisma transaction
      const progressUpdate = await prisma.$transaction(async (prisma) => {
        // Verify repair exists
        const repairCheck = await prisma.repairBooking.findUnique({
          where: { id: repairId },
          select: { id: true }
        });

        if (!repairCheck) {
          throw new Error('Repair not found');
        }

        // Insert or update progress record using upsert
        const progressUpdate = await prisma.repairProgress.upsert({
          where: { repairId: repairId },
          create: {
            repairId: repairId,
            milestone: milestone,
            progress: progress,
            notes: notes || null,
            timeSpent: timeSpent || null,
            nextSteps: nextSteps || null,
            updatedBy: req.user.id
          },
          update: {
            milestone: milestone,
            progress: progress,
            notes: notes || null,
            timeSpent: timeSpent || null,
            nextSteps: nextSteps || null,
            updatedBy: req.user.id,
            updatedAt: new Date()
          }
        });

        return progressUpdate;
      });

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
      if (error.message === 'Repair not found') {
        return res.status(404).json({ error: 'Repair not found' });
      }
      req.logger?.error('Error updating repair progress:', error);
      res.status(500).json({ error: 'Failed to update repair progress' });
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

      // Verify repair access using Prisma
      let repairWhere;
      
      if (req.user.role === 'customer') {
        repairWhere = {
          id: repairId,
          customerId: req.user.id
        };
      } else {
        repairWhere = { id: repairId };
      }

      const repairExists = await prisma.repairBooking.findFirst({
        where: repairWhere,
        select: { id: true }
      });

      if (!repairExists) {
        return res.status(404).json({ error: 'Repair not found or access denied' });
      }

      // Insert note using Prisma
      const newNote = await prisma.repairNote.create({
        data: {
          repairId: repairId,
          note: note,
          priority: priority,
          isPrivate: isPrivate,
          addedBy: req.user.id
        }
      });

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
      req.logger?.error('Error adding repair note:', error);
      res.status(500).json({ error: 'Failed to add note' });
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

      const repairCheck = await prisma.repairBooking.findUnique({
        where: { id: repairId },
        select: { id: true }
      });

      if (!repairCheck) {
        return res.status(404).json({ error: 'Repair not found' });
      }

      // Insert photo record using Prisma
      const newPhoto = await prisma.repairPhoto.create({
        data: {
          repairId: repairId,
          photoUrl: photoUrl,
          description: description || null,
          category: category,
          uploadedBy: req.user.id
        }
      });

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
      req.logger?.error('Error uploading repair photo:', error);
      res.status(500).json({ error: 'Failed to upload photo' });
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
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { repairId } = req.params;
      const { passed, score, issues = [], recommendations = [] } = req.body;

      const repairCheck = await prisma.repairBooking.findUnique({
        where: { id: repairId },
        select: { id: true }
      });

      if (!repairCheck) {
        return res.status(404).json({ error: 'Repair not found' });
      }

      // Insert quality check record using Prisma
      const qualityCheck = await prisma.repairQualityCheck.create({
        data: {
          repairId: repairId,
          passed: passed,
          score: score,
          issues: issues,
          recommendations: recommendations,
          checkedBy: req.user.id
        }
      });

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
      req.logger?.error('Error submitting quality check:', error);
      res.status(500).json({ error: 'Failed to submit quality check' });
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

      // Get database stats using Prisma
      const statusStats = await prisma.repairBooking.groupBy({
        by: ['status'],
        _count: {
          status: true
        }
      });

      // Get daily stats for last 30 days using Prisma
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const dailyStatsRaw = await prisma.$queryRaw`
        SELECT DATE(created_at) as date, COUNT(*) as count 
        FROM repair_bookings 
        WHERE created_at >= ${thirtyDaysAgo}
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `;

      res.json({
        success: true,
        serviceStats,
        databaseStats: {
          statusDistribution: statusStats.map(stat => ({
            status: stat.status,
            count: stat._count.status
          })),
          dailyVolume: dailyStatsRaw
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