const express = require('express');
const router = express.Router();
const EmailService = require('../services/EmailService');
const EmailTemplateEngine = require('../services/EmailTemplateEngine');
const EmailAutomationService = require('../services/EmailAutomationService');
const EmailAnalyticsService = require('../services/EmailAnalyticsService');

// Initialize services (these would be singletons in a real app)
const emailService = new EmailService();
const templateEngine = new EmailTemplateEngine();
const automationService = new EmailAutomationService();
const analyticsService = new EmailAnalyticsService();

// Initialize services
let servicesInitialized = false;
async function initializeServices() {
  if (!servicesInitialized) {
    try {
      await emailService.initialize();
      await templateEngine.initialize();
      await automationService.initialize();
      await analyticsService.initialize();
      servicesInitialized = true;
      console.log('✅ All email services initialized');
    } catch (error) {
      console.error('❌ Email services initialization failed:', error);
      throw error;
    }
  }
}

// Middleware to ensure services are initialized
router.use(async (req, res, next) => {
  try {
    await initializeServices();
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Email services initialization failed',
      message: error.message
    });
  }
});

// =========================
// EMAIL SENDING ENDPOINTS
// =========================

// Send single email
router.post('/send', async (req, res) => {
  try {
    const emailData = {
      id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      to: req.body.to,
      subject: req.body.subject,
      html: req.body.html,
      text: req.body.text,
      from: req.body.from,
      fromName: req.body.fromName,
      replyTo: req.body.replyTo,
      attachments: req.body.attachments,
      metadata: req.body.metadata,
      categories: req.body.categories
    };

    const result = await emailService.sendEmail(emailData);
    
    res.json({
      success: true,
      data: result,
      message: 'Email sent successfully'
    });
  } catch (error) {
    console.error('❌ Email send failed:', error);
    res.status(400).json({
      success: false,
      error: error.message,
      message: 'Failed to send email'
    });
  }
});

// Send template-based email
router.post('/send-template', async (req, res) => {
  try {
    const { templateId, recipientData, options = {} } = req.body;

    // Render template
    const renderedEmail = await templateEngine.renderTemplate(templateId, recipientData, options);
    
    // Send email
    const emailData = {
      id: `template_${templateId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      to: recipientData.email,
      subject: renderedEmail.subject,
      html: renderedEmail.html,
      text: renderedEmail.text,
      metadata: {
        templateId,
        ...renderedEmail.metadata,
        ...options.metadata
      }
    };

    const result = await emailService.sendEmail(emailData);
    
    res.json({
      success: true,
      data: {
        ...result,
        templateData: renderedEmail.metadata
      },
      message: 'Template email sent successfully'
    });
  } catch (error) {
    console.error('❌ Template email send failed:', error);
    res.status(400).json({
      success: false,
      error: error.message,
      message: 'Failed to send template email'
    });
  }
});

// Send bulk emails
router.post('/send-bulk', async (req, res) => {
  try {
    const { emails, options = {} } = req.body;

    if (!Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'emails array is required and must not be empty'
      });
    }

    // Add IDs to emails if not present
    const emailsWithIds = emails.map((email, index) => ({
      id: email.id || `bulk_${Date.now()}_${index}`,
      ...email
    }));

    const result = await emailService.sendBulkEmails(emailsWithIds, options);
    
    res.json({
      success: true,
      data: result,
      message: `Bulk email send completed: ${result.successful} sent, ${result.failed} failed`
    });
  } catch (error) {
    console.error('❌ Bulk email send failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to send bulk emails'
    });
  }
});

// =========================
// TEMPLATE MANAGEMENT
// =========================

// Get template preview
router.get('/template/:templateId/preview', async (req, res) => {
  try {
    const { templateId } = req.params;
    const sampleData = req.query.sampleData ? JSON.parse(req.query.sampleData) : {};

    const preview = await templateEngine.getTemplatePreview(templateId, sampleData);
    
    res.json({
      success: true,
      data: preview,
      message: 'Template preview generated'
    });
  } catch (error) {
    console.error('❌ Template preview failed:', error);
    res.status(400).json({
      success: false,
      error: error.message,
      message: 'Failed to generate template preview'
    });
  }
});

// Create new template
router.post('/template', async (req, res) => {
  try {
    const templateData = req.body;
    const template = await templateEngine.createTemplate(templateData);
    
    res.json({
      success: true,
      data: template,
      message: 'Template created successfully'
    });
  } catch (error) {
    console.error('❌ Template creation failed:', error);
    res.status(400).json({
      success: false,
      error: error.message,
      message: 'Failed to create template'
    });
  }
});

// Get template metrics
router.get('/template/:templateId/metrics', async (req, res) => {
  try {
    const { templateId } = req.params;
    const timeRange = req.query.timeRange || '7d';
    
    const metrics = await analyticsService.getEmailMetrics(timeRange, { templateId });
    
    res.json({
      success: true,
      data: metrics,
      message: 'Template metrics retrieved'
    });
  } catch (error) {
    console.error('❌ Template metrics failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to retrieve template metrics'
    });
  }
});

// =========================
// AUTOMATION WORKFLOWS
// =========================

// Trigger workflow
router.post('/automation/trigger', async (req, res) => {
  try {
    const { triggerType, eventData, context = {} } = req.body;

    const result = await automationService.triggerWorkflow(triggerType, eventData, context);
    
    res.json({
      success: true,
      data: result,
      message: `Workflow triggered: ${result.triggeredWorkflows} workflows activated`
    });
  } catch (error) {
    console.error('❌ Workflow trigger failed:', error);
    res.status(400).json({
      success: false,
      error: error.message,
      message: 'Failed to trigger workflow'
    });
  }
});

// Create workflow
router.post('/automation/workflow', async (req, res) => {
  try {
    const workflowData = req.body;
    const workflow = await automationService.createWorkflow(workflowData);
    
    res.json({
      success: true,
      data: workflow,
      message: 'Workflow created successfully'
    });
  } catch (error) {
    console.error('❌ Workflow creation failed:', error);
    res.status(400).json({
      success: false,
      error: error.message,
      message: 'Failed to create workflow'
    });
  }
});

// Pause/Resume workflow
router.patch('/automation/workflow/:workflowId/:action', async (req, res) => {
  try {
    const { workflowId, action } = req.params;
    
    let result;
    if (action === 'pause') {
      result = await automationService.pauseWorkflow(workflowId);
    } else if (action === 'resume') {
      result = await automationService.resumeWorkflow(workflowId);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid action. Use "pause" or "resume"'
      });
    }

    if (result) {
      res.json({
        success: true,
        message: `Workflow ${action}d successfully`
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Workflow not found'
      });
    }
  } catch (error) {
    console.error(`❌ Workflow ${req.params.action} failed:`, error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: `Failed to ${req.params.action} workflow`
    });
  }
});

// Get workflow executions
router.get('/automation/workflow/:workflowId/executions', async (req, res) => {
  try {
    const { workflowId } = req.params;
    const limit = parseInt(req.query.limit) || 100;
    
    const executions = await automationService.getWorkflowExecutions(workflowId, limit);
    
    res.json({
      success: true,
      data: executions,
      message: 'Workflow executions retrieved'
    });
  } catch (error) {
    console.error('❌ Get workflow executions failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to retrieve workflow executions'
    });
  }
});

// =========================
// ANALYTICS ENDPOINTS
// =========================

// Get email analytics
router.get('/analytics', async (req, res) => {
  try {
    const timeRange = req.query.timeRange || '7d';
    const filters = {
      templateId: req.query.templateId,
      campaignId: req.query.campaignId,
      category: req.query.category
    };

    const analytics = await analyticsService.getEmailMetrics(timeRange, filters);
    
    res.json({
      success: true,
      data: analytics,
      message: 'Analytics retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Analytics retrieval failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to retrieve analytics'
    });
  }
});

// Get real-time metrics
router.get('/analytics/realtime', async (req, res) => {
  try {
    const metrics = analyticsService.getRealtimeMetrics();
    
    res.json({
      success: true,
      data: metrics,
      message: 'Real-time metrics retrieved'
    });
  } catch (error) {
    console.error('❌ Real-time metrics failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to retrieve real-time metrics'
    });
  }
});

// Get campaign analytics
router.get('/analytics/campaign/:campaignId', async (req, res) => {
  try {
    const { campaignId } = req.params;
    const analytics = await analyticsService.getCampaignAnalytics(campaignId);
    
    res.json({
      success: true,
      data: analytics,
      message: 'Campaign analytics retrieved'
    });
  } catch (error) {
    console.error('❌ Campaign analytics failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to retrieve campaign analytics'
    });
  }
});

// Get A/B test results
router.get('/analytics/ab-test/:testId', async (req, res) => {
  try {
    const { testId } = req.params;
    const results = await analyticsService.getABTestResults(testId);
    
    if (!results) {
      return res.status(404).json({
        success: false,
        error: 'A/B test not found'
      });
    }

    res.json({
      success: true,
      data: results,
      message: 'A/B test results retrieved'
    });
  } catch (error) {
    console.error('❌ A/B test results failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to retrieve A/B test results'
    });
  }
});

// Export analytics
router.get('/analytics/export', async (req, res) => {
  try {
    const format = req.query.format || 'json';
    const timeRange = req.query.timeRange || '30d';
    const filters = {
      templateId: req.query.templateId,
      campaignId: req.query.campaignId
    };

    const exportData = await analyticsService.exportAnalytics(format, timeRange, filters);
    
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="email-analytics-${timeRange}.csv"`);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="email-analytics-${timeRange}.json"`);
    }

    res.send(exportData);
  } catch (error) {
    console.error('❌ Analytics export failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to export analytics'
    });
  }
});

// =========================
// TRACKING ENDPOINTS
// =========================

// Email open tracking (pixel)
router.get('/track/open/:emailId', async (req, res) => {
  try {
    const { emailId } = req.params;
    const userAgent = req.get('User-Agent');
    const ipAddress = req.ip;

    // Track the open event
    await analyticsService.trackEvent('email_opened', {
      email_send_id: emailId,
      user_agent: userAgent,
      ip_address: ipAddress,
      timestamp: Date.now()
    });

    // Return 1x1 transparent pixel
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );

    res.setHeader('Content-Type', 'image/gif');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.send(pixel);
  } catch (error) {
    console.error('❌ Open tracking failed:', error);
    // Still return pixel even if tracking fails
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );
    res.setHeader('Content-Type', 'image/gif');
    res.send(pixel);
  }
});

// Email click tracking
router.get('/track/click/:emailId', async (req, res) => {
  try {
    const { emailId } = req.params;
    const targetUrl = req.query.url;
    const linkName = req.query.link;
    const userAgent = req.get('User-Agent');
    const ipAddress = req.ip;

    if (!targetUrl) {
      return res.status(400).json({
        success: false,
        error: 'url parameter is required'
      });
    }

    // Track the click event
    await analyticsService.trackEvent('email_clicked', {
      email_send_id: emailId,
      clicked_url: targetUrl,
      link_name: linkName,
      user_agent: userAgent,
      ip_address: ipAddress,
      timestamp: Date.now()
    });

    // Redirect to target URL
    res.redirect(302, targetUrl);
  } catch (error) {
    console.error('❌ Click tracking failed:', error);
    // Still redirect even if tracking fails
    const targetUrl = req.query.url;
    if (targetUrl) {
      res.redirect(302, targetUrl);
    } else {
      res.status(400).json({
        success: false,
        error: 'Click tracking failed and no valid URL to redirect'
      });
    }
  }
});

// =========================
// SUBSCRIPTION MANAGEMENT
// =========================

// Unsubscribe
router.get('/unsubscribe', async (req, res) => {
  try {
    const { token, email } = req.query;

    if (!token && !email) {
      return res.status(400).json({
        success: false,
        error: 'token or email parameter is required'
      });
    }

    const result = await emailService.handleUnsubscribe(email, token);
    
    // You could render an HTML page here instead
    res.json({
      success: true,
      data: result,
      message: 'Successfully unsubscribed'
    });
  } catch (error) {
    console.error('❌ Unsubscribe failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to process unsubscribe request'
    });
  }
});

// Update email preferences
router.post('/preferences', async (req, res) => {
  try {
    const { email, token, preferences } = req.body;

    if (!email || !preferences) {
      return res.status(400).json({
        success: false,
        error: 'email and preferences are required'
      });
    }

    const result = await emailService.updateEmailPreferences(email, preferences);
    
    res.json({
      success: true,
      data: result,
      message: 'Email preferences updated successfully'
    });
  } catch (error) {
    console.error('❌ Preference update failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to update email preferences'
    });
  }
});

// =========================
// WEBHOOK ENDPOINTS
// =========================

// SendGrid webhook handler
router.post('/webhook/sendgrid', async (req, res) => {
  try {
    const signature = req.get('X-Twilio-Email-Event-Webhook-Signature');
    const eventData = req.body;

    const result = await emailService.handleWebhook(eventData, signature);
    
    res.json({
      success: true,
      data: result,
      message: 'Webhook processed successfully'
    });
  } catch (error) {
    console.error('❌ Webhook processing failed:', error);
    res.status(400).json({
      success: false,
      error: error.message,
      message: 'Failed to process webhook'
    });
  }
});

// =========================
// SERVICE STATUS
// =========================

// Health check
router.get('/health', async (req, res) => {
  try {
    const emailHealth = await emailService.healthCheck();
    const templateMetrics = templateEngine.getMetrics();
    const automationMetrics = automationService.getMetrics();
    const analyticsMetrics = analyticsService.getMetrics();

    res.json({
      success: true,
      data: {
        email: emailHealth,
        template: {
          status: 'healthy',
          metrics: templateMetrics
        },
        automation: {
          status: 'healthy',
          metrics: automationMetrics
        },
        analytics: {
          status: 'healthy',
          metrics: analyticsMetrics
        },
        overall: 'healthy'
      },
      message: 'All email services are healthy'
    });
  } catch (error) {
    console.error('❌ Health check failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Health check failed'
    });
  }
});

// Service metrics
router.get('/metrics', async (req, res) => {
  try {
    const metrics = {
      email: emailService.getMetrics(),
      template: templateEngine.getMetrics(),
      automation: automationService.getMetrics(),
      analytics: analyticsService.getMetrics(),
      timestamp: Date.now()
    };

    res.json({
      success: true,
      data: metrics,
      message: 'Service metrics retrieved'
    });
  } catch (error) {
    console.error('❌ Metrics retrieval failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to retrieve service metrics'
    });
  }
});

module.exports = router;