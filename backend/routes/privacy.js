const express = require('express');
const router = express.Router();
const PrivacyService = require('../services/PrivacyService');
const PrivacyAuditService = require('../services/PrivacyAuditService');
const DataRetentionService = require('../services/DataRetentionService');
const PrivacyMiddleware = require('../middleware/PrivacyMiddleware');

// Initialize services
const privacyService = new PrivacyService();
const auditService = new PrivacyAuditService();
const retentionService = new DataRetentionService();
const privacyMiddleware = new PrivacyMiddleware();

// Get middleware routes
const middlewareRoutes = privacyMiddleware.getRoutes();

// === CONSENT MANAGEMENT ROUTES ===

// Save consent preferences
router.post('/consent/save', middlewareRoutes.saveConsent);

// Revoke consent
router.post('/consent/revoke', middlewareRoutes.revokeConsent);

// Get user consent status
router.get('/consent/status', async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.id;
    if (!userId) {
      return res.status(400).json({
        error: 'User ID required',
        code: 'USER_ID_REQUIRED'
      });
    }

    const consent = await privacyService.getUserConsent(userId);
    res.json({
      consent: consent,
      hasConsent: !!consent
    });
  } catch (error) {
    console.error('Error getting consent status:', error);
    res.status(500).json({
      error: 'Failed to get consent status',
      code: 'CONSENT_STATUS_ERROR'
    });
  }
});

// Check specific consent type
router.get('/consent/check/:type', async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.id;
    const consentType = req.params.type;
    
    if (!userId) {
      return res.status(400).json({
        error: 'User ID required',
        code: 'USER_ID_REQUIRED'
      });
    }

    const hasConsent = await privacyService.hasConsent(userId, consentType);
    res.json({
      consentType,
      hasConsent
    });
  } catch (error) {
    console.error('Error checking consent:', error);
    res.status(500).json({
      error: 'Failed to check consent',
      code: 'CONSENT_CHECK_ERROR'
    });
  }
});

// === DATA RIGHTS ROUTES ===

// Create data request (access, deletion, portability, rectification)
router.post('/data-request', middlewareRoutes.createDataRequest);

// Verify data request
router.post('/data-request/verify/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const result = await privacyService.verifyDataRequest(token);
    
    if (result) {
      res.json({
        success: true,
        message: 'Data request verified and is being processed',
        requestId: result.id
      });
    } else {
      res.status(404).json({
        error: 'Invalid or expired verification token',
        code: 'INVALID_TOKEN'
      });
    }
  } catch (error) {
    console.error('Error verifying data request:', error);
    res.status(500).json({
      error: 'Failed to verify data request',
      code: 'VERIFICATION_ERROR'
    });
  }
});

// Get user's data requests
router.get('/data-requests', async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.id;
    if (!userId) {
      return res.status(400).json({
        error: 'User ID required',
        code: 'USER_ID_REQUIRED'
      });
    }

    const requests = await privacyService.getUserDataRequests(userId);
    res.json(requests);
  } catch (error) {
    console.error('Error getting data requests:', error);
    res.status(500).json({
      error: 'Failed to get data requests',
      code: 'DATA_REQUESTS_ERROR'
    });
  }
});

// === PRIVACY DASHBOARD ROUTES ===

// Get privacy dashboard
router.get('/dashboard', middlewareRoutes.getPrivacyDashboard);

// Get retention policies
router.get('/retention-policies', async (req, res) => {
  try {
    const policies = await retentionService.getRetentionPolicies();
    res.json(policies);
  } catch (error) {
    console.error('Error getting retention policies:', error);
    res.status(500).json({
      error: 'Failed to get retention policies',
      code: 'RETENTION_POLICIES_ERROR'
    });
  }
});

// Get cleanup history
router.get('/cleanup-history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const history = await retentionService.getCleanupHistory(limit);
    res.json(history);
  } catch (error) {
    console.error('Error getting cleanup history:', error);
    res.status(500).json({
      error: 'Failed to get cleanup history',
      code: 'CLEANUP_HISTORY_ERROR'
    });
  }
});

// === AUDIT ROUTES ===

// Get audit logs
router.get('/audit/logs', async (req, res) => {
  try {
    const filters = {
      userId: req.query.userId,
      eventType: req.query.eventType,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      limit: parseInt(req.query.limit) || 100
    };

    const logs = await auditService.getAuditLogs(filters);
    res.json(logs);
  } catch (error) {
    console.error('Error getting audit logs:', error);
    res.status(500).json({
      error: 'Failed to get audit logs',
      code: 'AUDIT_LOGS_ERROR'
    });
  }
});

// Get compliance status
router.get('/audit/compliance-status', async (req, res) => {
  try {
    const status = await auditService.getComplianceStatus();
    res.json(status);
  } catch (error) {
    console.error('Error getting compliance status:', error);
    res.status(500).json({
      error: 'Failed to get compliance status',
      code: 'COMPLIANCE_STATUS_ERROR'
    });
  }
});

// Generate audit report
router.post('/audit/report', async (req, res) => {
  try {
    const { reportType, startDate, endDate } = req.body;
    
    if (!reportType || !startDate || !endDate) {
      return res.status(400).json({
        error: 'Report type and date range required',
        code: 'INVALID_REPORT_PARAMS'
      });
    }

    const report = await auditService.generateAuditReport(reportType, {
      startDate: new Date(startDate),
      endDate: new Date(endDate)
    });

    res.json(report);
  } catch (error) {
    console.error('Error generating audit report:', error);
    res.status(500).json({
      error: 'Failed to generate audit report',
      code: 'AUDIT_REPORT_ERROR'
    });
  }
});

// === ADMIN ROUTES (require admin authentication) ===

// Update retention policy (admin only)
router.put('/admin/retention-policy/:dataType', async (req, res) => {
  try {
    // Add admin authentication check here
    const { dataType } = req.params;
    const updates = req.body;
    
    const result = await retentionService.updateRetentionPolicy(dataType, updates);
    
    if (result) {
      res.json({
        success: true,
        policy: result
      });
    } else {
      res.status(404).json({
        error: 'Retention policy not found',
        code: 'POLICY_NOT_FOUND'
      });
    }
  } catch (error) {
    console.error('Error updating retention policy:', error);
    res.status(500).json({
      error: 'Failed to update retention policy',
      code: 'POLICY_UPDATE_ERROR'
    });
  }
});

// Trigger manual cleanup (admin only)
router.post('/admin/cleanup/trigger', async (req, res) => {
  try {
    // Add admin authentication check here
    const { dataType } = req.body;
    
    if (dataType) {
      // Cleanup specific data type
      await retentionService.cleanupDataType(dataType);
    } else {
      // Run full cleanup
      await retentionService.runRetentionCleanup();
    }
    
    res.json({
      success: true,
      message: 'Cleanup triggered successfully'
    });
  } catch (error) {
    console.error('Error triggering cleanup:', error);
    res.status(500).json({
      error: 'Failed to trigger cleanup',
      code: 'CLEANUP_TRIGGER_ERROR'
    });
  }
});

// Get system health (admin only)
router.get('/admin/health', async (req, res) => {
  try {
    // Add admin authentication check here
    const health = await retentionService.healthCheck();
    res.json(health);
  } catch (error) {
    console.error('Error getting system health:', error);
    res.status(500).json({
      error: 'Failed to get system health',
      code: 'HEALTH_CHECK_ERROR'
    });
  }
});

// === WEBHOOK ROUTES ===

// Consent webhook (for external systems)
router.post('/webhook/consent', async (req, res) => {
  try {
    const { userId, consentData, source } = req.body;
    
    // Validate webhook signature here
    
    // Record consent from external source
    await privacyService.recordConsent({
      userId,
      preferences: consentData.preferences,
      actionType: consentData.actionType,
      source: source || 'webhook',
      timestamp: new Date().toISOString()
    });

    // Emit audit event
    auditService.emit('consent-granted', {
      userId,
      consentType: 'external',
      consentStatus: consentData.actionType,
      consentMechanism: 'webhook',
      consentEvidence: consentData,
      source
    });

    res.json({
      success: true,
      message: 'Consent processed successfully'
    });
  } catch (error) {
    console.error('Error processing consent webhook:', error);
    res.status(500).json({
      error: 'Failed to process consent webhook',
      code: 'WEBHOOK_ERROR'
    });
  }
});

// === INTEGRATION ROUTES ===

// Google Analytics consent signal
router.post('/integrations/google-analytics/consent', 
  privacyMiddleware.checkAnalyticsConsent(),
  async (req, res) => {
    try {
      const userId = req.user?.id || req.session?.id;
      
      // Emit audit event
      auditService.emit('data-processed', {
        userId,
        processingActivity: 'google_analytics',
        dataCategories: ['usage_data', 'device_information'],
        processingPurposes: ['analytics', 'performance_monitoring'],
        legalBasis: 'consent',
        thirdPartyInvolved: true
      });

      res.json({
        success: true,
        message: 'Analytics consent verified'
      });
    } catch (error) {
      console.error('Error processing analytics consent:', error);
      res.status(500).json({
        error: 'Failed to process analytics consent',
        code: 'ANALYTICS_CONSENT_ERROR'
      });
    }
  }
);

// Marketing platform consent signal
router.post('/integrations/marketing/consent',
  privacyMiddleware.checkMarketingConsent(),
  async (req, res) => {
    try {
      const userId = req.user?.id || req.session?.id;
      
      // Emit audit event
      auditService.emit('data-processed', {
        userId,
        processingActivity: 'marketing_automation',
        dataCategories: ['contact_information', 'behavioral_data'],
        processingPurposes: ['marketing', 'advertising'],
        legalBasis: 'consent',
        thirdPartyInvolved: true
      });

      res.json({
        success: true,
        message: 'Marketing consent verified'
      });
    } catch (error) {
      console.error('Error processing marketing consent:', error);
      res.status(500).json({
        error: 'Failed to process marketing consent',
        code: 'MARKETING_CONSENT_ERROR'
      });
    }
  }
);

// === ERROR HANDLING ===

// Global error handler for privacy routes
router.use((error, req, res, next) => {
  console.error('Privacy API error:', error);
  
  // Log error to audit system
  auditService.emit('security-error', {
    eventType: 'api_error',
    userId: req.user?.id || req.session?.id,
    sessionId: req.session?.id,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    eventDetails: {
      error: error.message,
      stack: error.stack,
      endpoint: req.originalUrl,
      method: req.method
    },
    riskLevel: 'medium'
  });

  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    requestId: req.id || 'unknown'
  });
});

module.exports = router;