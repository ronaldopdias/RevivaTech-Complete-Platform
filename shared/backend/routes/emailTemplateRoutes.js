const express = require('express');
const router = express.Router();

// Email template engine will be initialized on demand
let templateEngine;

// Middleware to ensure template engine is initialized
router.use(async (req, res, next) => {
  try {
    if (!templateEngine) {
      const EmailTemplateEngine = require('../services/EmailTemplateEngine');
      templateEngine = new EmailTemplateEngine();
      await templateEngine.initialize();
    }
    next();
  } catch (error) {
    req.logger?.error('Email template engine initialization failed:', error);
    res.status(500).json({ 
      error: 'Email template service unavailable',
      message: 'Template engine initialization failed'
    });
  }
});

// =========================
// EMAIL TEMPLATE ROUTES
// =========================

// Get all email templates
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, category, status, search } = req.query;
    
    // Simple query for now - will enhance with filters later
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const query = `
      SELECT 
        id, name, slug, subject, category, 
        is_active, usage_count, created_at, updated_at, version
      FROM email_templates 
      ORDER BY updated_at DESC
      LIMIT $1 OFFSET $2
    `;
    
    const params = [parseInt(limit), offset];

    const result = await req.pool.query(query, params);
    
    // Get total count
    const countQuery = `SELECT COUNT(*) FROM email_templates`;
    const countResult = await req.pool.query(countQuery);
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        templates: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / parseInt(limit))
        }
      },
      message: 'Email templates retrieved successfully'
    });
  } catch (error) {
    req.logger?.error('Failed to retrieve email templates:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve email templates',
      message: error.message 
    });
  }
});

// Get specific email template
router.get('/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params;
    
    const query = `
      SELECT * FROM email_templates 
      WHERE id = $1
    `;
    
    const result = await req.pool.query(query, [templateId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Template not found',
        message: `Template with ID '${templateId}' does not exist`
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Email template retrieved successfully'
    });
  } catch (error) {
    req.logger?.error('Failed to retrieve email template:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve email template',
      message: error.message 
    });
  }
});

// Preview email template
router.post('/:templateId/preview', async (req, res) => {
  try {
    const { templateId } = req.params;
    const { variables = {} } = req.body;
    
    // Get template from database
    const templateQuery = `SELECT * FROM email_templates WHERE id = $1`;
    const templateResult = await req.pool.query(templateQuery, [templateId]);
    
    if (templateResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Template not found',
        message: `Template with ID '${templateId}' does not exist`
      });
    }
    
    const template = templateResult.rows[0];
    
    // Generate preview using EmailTemplateEngine
    const preview = await templateEngine.getTemplatePreview(templateId, variables);

    res.json({
      success: true,
      data: {
        template_id: templateId,
        template_name: template.name,
        preview: preview,
        variables_used: Object.keys(variables)
      },
      message: 'Email template preview generated successfully'
    });
  } catch (error) {
    req.logger?.error('Failed to preview email template:', error);
    res.status(500).json({ 
      error: 'Failed to preview email template',
      message: error.message 
    });
  }
});

// Send email using template
router.post('/:templateId/send', async (req, res) => {
  try {
    const { templateId } = req.params;
    const { recipient, variables = {}, options = {} } = req.body;
    
    if (!recipient) {
      return res.status(400).json({
        error: 'Recipient required',
        message: 'Email recipient is required'
      });
    }

    // Use EmailTemplateEngine to send email
    const result = await templateEngine.sendTemplateEmail(templateId, {
      recipient,
      variables,
      options
    });

    res.json({
      success: true,
      data: {
        email_id: result.emailId,
        template_id: templateId,
        recipient,
        sent_at: new Date().toISOString()
      },
      message: 'Email sent successfully using template'
    });
  } catch (error) {
    req.logger?.error('Failed to send email template:', error);
    res.status(500).json({ 
      error: 'Failed to send email template',
      message: error.message 
    });
  }
});

// Test email template
router.post('/:templateId/test', async (req, res) => {
  try {
    const { templateId } = req.params;
    const { testEmail, variables = {} } = req.body;
    
    if (!testEmail) {
      return res.status(400).json({
        error: 'Test email address required',
        message: 'A test email address is required'
      });
    }

    // Generate preview first
    const preview = await templateEngine.getTemplatePreview(templateId, variables);
    
    // Send test email with [TEST] prefix
    const result = await templateEngine.sendTemplateEmail(templateId, {
      recipient: testEmail,
      variables,
      options: { 
        test: true,
        subjectPrefix: '[TEST] '
      }
    });

    res.json({
      success: true,
      data: {
        test_email_id: result.emailId,
        template_id: templateId,
        test_recipient: testEmail,
        preview_subject: preview.subject,
        sent_at: new Date().toISOString()
      },
      message: 'Test email sent successfully'
    });
  } catch (error) {
    req.logger?.error('Failed to send test email:', error);
    res.status(500).json({ 
      error: 'Failed to send test email',
      message: error.message 
    });
  }
});

// Get template analytics
router.get('/:templateId/analytics', async (req, res) => {
  try {
    const { templateId } = req.params;
    const { timeRange = '30d' } = req.query;
    
    // Mock analytics data - in real implementation, query email_analytics_daily table
    const analytics = {
      template_id: templateId,
      time_range: timeRange,
      total_sent: 245,
      total_opened: 198,
      total_clicked: 67,
      open_rate: 0.808,
      click_rate: 0.273,
      bounce_rate: 0.024,
      unsubscribe_rate: 0.008,
      recent_sends: [
        { date: '2025-07-25', sent: 12, opened: 10, clicked: 3 },
        { date: '2025-07-24', sent: 8, opened: 6, clicked: 2 },
        { date: '2025-07-23', sent: 15, opened: 12, clicked: 4 }
      ]
    };

    res.json({
      success: true,
      data: analytics,
      message: 'Template analytics retrieved successfully'
    });
  } catch (error) {
    req.logger?.error('Failed to get template analytics:', error);
    res.status(500).json({ 
      error: 'Failed to get template analytics',
      message: error.message 
    });
  }
});

module.exports = router;