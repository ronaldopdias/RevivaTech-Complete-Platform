const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const securityService = require('../services/securityService');
const { validationResult } = require('express-validator');
const { param, query } = require('express-validator');

// Get security metrics
router.get('/metrics', 
  authenticate,
  authorize(['admin', 'super_admin']),
  async (req, res) => {
    try {
      const timeRange = req.query.timeRange || '24h';
      const metrics = await securityService.getSecurityMetrics(timeRange);
      
      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      console.error('Error fetching security metrics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch security metrics'
      });
    }
  }
);

// Get security alerts
router.get('/alerts',
  authenticate,
  authorize(['admin', 'super_admin']),
  [
    query('status').optional().isIn(['active', 'acknowledged', 'resolved']),
    query('severity').optional().isIn(['low', 'medium', 'high', 'critical']),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const filters = {
        status: req.query.status,
        severity: req.query.severity,
        limit: req.query.limit || 50,
        offset: req.query.offset || 0
      };

      const alerts = await securityService.getSecurityAlerts(filters);
      
      res.json({
        success: true,
        data: alerts
      });
    } catch (error) {
      console.error('Error fetching security alerts:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch security alerts'
      });
    }
  }
);

// Get active sessions
router.get('/sessions',
  authenticate,
  authorize(['admin', 'super_admin']),
  [
    query('userId').optional().isString(),
    query('status').optional().isIn(['active', 'suspicious', 'expired', 'terminated']),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const filters = {
        userId: req.query.userId,
        status: req.query.status,
        limit: req.query.limit || 50,
        offset: req.query.offset || 0
      };

      const sessions = await securityService.getActiveSessions(filters);
      
      res.json({
        success: true,
        data: sessions
      });
    } catch (error) {
      console.error('Error fetching active sessions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch active sessions'
      });
    }
  }
);

// Get audit logs
router.get('/audit-logs',
  authenticate,
  authorize(['admin', 'super_admin']),
  [
    query('category').optional().isString(),
    query('level').optional().isIn(['debug', 'info', 'warning', 'error', 'critical']),
    query('userId').optional().isString(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('search').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 1000 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const filters = {
        category: req.query.category,
        level: req.query.level,
        userId: req.query.userId,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        search: req.query.search,
        limit: req.query.limit || 100,
        offset: req.query.offset || 0
      };

      const auditLogs = await securityService.getAuditLogs(filters);
      
      res.json({
        success: true,
        data: auditLogs
      });
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch audit logs'
      });
    }
  }
);

// Acknowledge security alert
router.post('/alerts/:id/acknowledge',
  authenticate,
  authorize(['admin', 'super_admin']),
  [
    param('id').isUUID()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const acknowledgedBy = req.user.id;

      const result = await securityService.acknowledgeAlert(id, acknowledgedBy);
      
      if (!result) {
        return res.status(404).json({
          success: false,
          error: 'Alert not found'
        });
      }

      res.json({
        success: true,
        message: 'Alert acknowledged successfully'
      });
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to acknowledge alert'
      });
    }
  }
);

// Resolve security alert
router.post('/alerts/:id/resolve',
  authenticate,
  authorize(['admin', 'super_admin']),
  [
    param('id').isUUID()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { resolution } = req.body;
      const resolvedBy = req.user.id;

      const result = await securityService.resolveAlert(id, resolution, resolvedBy);
      
      if (!result) {
        return res.status(404).json({
          success: false,
          error: 'Alert not found'
        });
      }

      res.json({
        success: true,
        message: 'Alert resolved successfully'
      });
    } catch (error) {
      console.error('Error resolving alert:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to resolve alert'
      });
    }
  }
);

// Terminate session
router.delete('/sessions/:id',
  authenticate,
  authorize(['admin', 'super_admin']),
  [
    param('id').isString()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const terminatedBy = req.user.id;
      const reason = req.body.reason || 'Admin terminated';

      const result = await securityService.terminateSession(id, terminatedBy, reason);
      
      if (!result) {
        return res.status(404).json({
          success: false,
          error: 'Session not found'
        });
      }

      res.json({
        success: true,
        message: 'Session terminated successfully'
      });
    } catch (error) {
      console.error('Error terminating session:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to terminate session'
      });
    }
  }
);

// Export audit logs
router.get('/audit-logs/export',
  authenticate,
  authorize(['admin', 'super_admin']),
  [
    query('format').optional().isIn(['csv', 'json']).default('csv'),
    query('category').optional().isString(),
    query('level').optional().isIn(['debug', 'info', 'warning', 'error', 'critical']),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const filters = {
        category: req.query.category,
        level: req.query.level,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };

      const format = req.query.format || 'csv';
      const { data, filename, contentType } = await securityService.exportAuditLogs(filters, format);

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(data);
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to export audit logs'
      });
    }
  }
);

// Get failed login attempts
router.get('/login-attempts',
  authenticate,
  authorize(['admin', 'super_admin']),
  [
    query('userId').optional().isString(),
    query('ipAddress').optional().isIP(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const filters = {
        userId: req.query.userId,
        ipAddress: req.query.ipAddress,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        limit: req.query.limit || 50,
        offset: req.query.offset || 0
      };

      const loginAttempts = await securityService.getFailedLoginAttempts(filters);
      
      res.json({
        success: true,
        data: loginAttempts
      });
    } catch (error) {
      console.error('Error fetching login attempts:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch login attempts'
      });
    }
  }
);

// Block IP address
router.post('/block-ip',
  authenticate,
  authorize(['admin', 'super_admin']),
  async (req, res) => {
    try {
      const { ipAddress, reason, duration } = req.body;
      const blockedBy = req.user.id;

      if (!ipAddress || !reason) {
        return res.status(400).json({
          success: false,
          error: 'IP address and reason are required'
        });
      }

      const result = await securityService.blockIPAddress(ipAddress, reason, duration, blockedBy);
      
      res.json({
        success: true,
        message: 'IP address blocked successfully',
        data: result
      });
    } catch (error) {
      console.error('Error blocking IP address:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to block IP address'
      });
    }
  }
);

// Unblock IP address
router.delete('/block-ip/:ipAddress',
  authenticate,
  authorize(['admin', 'super_admin']),
  async (req, res) => {
    try {
      const { ipAddress } = req.params;
      const unblockedBy = req.user.id;

      const result = await securityService.unblockIPAddress(ipAddress, unblockedBy);
      
      if (!result) {
        return res.status(404).json({
          success: false,
          error: 'IP address not found in blocklist'
        });
      }

      res.json({
        success: true,
        message: 'IP address unblocked successfully'
      });
    } catch (error) {
      console.error('Error unblocking IP address:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to unblock IP address'
      });
    }
  }
);

// Get security configuration
router.get('/config',
  authenticate,
  authorize(['admin', 'super_admin']),
  async (req, res) => {
    try {
      const config = await securityService.getSecurityConfig();
      
      res.json({
        success: true,
        data: config
      });
    } catch (error) {
      console.error('Error fetching security config:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch security configuration'
      });
    }
  }
);

// Update security configuration
router.put('/config',
  authenticate,
  authorize(['super_admin']),
  async (req, res) => {
    try {
      const config = req.body;
      const updatedBy = req.user.id;

      const result = await securityService.updateSecurityConfig(config, updatedBy);
      
      res.json({
        success: true,
        message: 'Security configuration updated successfully',
        data: result
      });
    } catch (error) {
      console.error('Error updating security config:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update security configuration'
      });
    }
  }
);

module.exports = router;