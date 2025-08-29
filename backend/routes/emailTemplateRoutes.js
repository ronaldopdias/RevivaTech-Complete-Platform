const express = require('express');
const { prisma } = require('../lib/prisma');
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
        id, name, subject, category, template_type,
        is_active, usage_count, created_at, updated_at, version
      FROM email_templates 
      ORDER BY updated_at DESC
      LIMIT $1 OFFSET $2
    `;
    
    const params = [parseInt(limit), offset];

    // SECURITY MIGRATION: Replace raw SQL with Prisma to prevent injection
    const [templates, totalCount] = await Promise.all([
      prisma.email_templates.findMany({
        orderBy: { updated_at: 'desc' },
        skip: offset,
        take: parseInt(limit)
      }),
      prisma.email_templates.count()
    ]);

    res.json({
      success: true,
      data: {
        templates: templates,
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
    
    const template = await prisma.email_templates.findUnique({
      where: { id: templateId }
    });
    
    if (!template) {
      return res.status(404).json({
        error: 'Template not found',
        message: `Template with ID '${templateId}' does not exist`
      });
    }

    res.json({
      success: true,
      data: template,
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
    const template = await prisma.email_templates.findUnique({
      where: { id: templateId }
    });
    
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found',
        message: `Template with ID '${templateId}' does not exist`
      });
    }
    
    // Simple variable replacement for preview
    const processTemplate = (content, data) => {
      if (!content) return '';
      
      let processed = content;
      
      // Replace simple {{variable}} patterns
      const variableRegex = /\{\{([^}]+)\}\}/g;
      processed = processed.replace(variableRegex, (match, variable) => {
        const trimmed = variable.trim();
        const keys = trimmed.split('.');
        let value = data;
        
        for (const key of keys) {
          if (value && typeof value === 'object' && key in value) {
            value = value[key];
          } else {
            return `[${trimmed}]`; // Show placeholder for missing variables
          }
        }
        
        return value !== null && value !== undefined ? value : `[${trimmed}]`;
      });
      
      return processed;
    };

    // Default sample data for preview
    const defaultData = {
      customer_name: 'John Doe',
      user: { first_name: 'John', name: 'John Doe' },
      company: { name: 'RevivaTech', phone: '+44 123 456 7890', email: 'hello@revivatech.co.uk' },
      repair: { brand: 'Apple', model: 'iPhone 14', issue: 'Screen replacement', status: 'In Progress' },
      booking: { id: 'B123', service_type: 'Screen Repair', appointment_date: '2025-08-25' },
      system: { year: '2025' },
      ...variables
    };

    // Process templates
    const processedHtml = processTemplate(template.html_template, defaultData);
    const processedText = processTemplate(template.text_template, defaultData);
    const processedSubject = processTemplate(template.subject, defaultData);

    res.json({
      success: true,
      data: {
        template_id: templateId,
        template_name: template.name,
        preview: {
          html: processedHtml,
          text: processedText,
          subject: processedSubject
        },
        variables_used: Object.keys(variables),
        sample_data_used: Object.keys(defaultData)
      },
      message: 'Email template preview generated successfully'
    });
  } catch (error) {
    req.logger?.error('Failed to preview email template:', error);
    res.status(500).json({ 
      success: false,
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

// Create new email template
router.post('/', async (req, res) => {
  try {
    const {
      name,
      subject,
      html_template,
      text_template,
      template_type = 'marketing',
      category,
      variables = {},
      personalization_rules = {},
      compliance_settings = {}
    } = req.body;

    // Validate required fields
    if (!name || !subject || !html_template || !category) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Name, subject, html_template, and category are required'
      });
    }

    // Check if template name already exists
    const existingTemplate = await prisma.email_templates.findFirst({
      where: { name },
      select: { id: true }
    });
    
    if (existingTemplate) {
      return res.status(409).json({
        success: false,
        error: 'Template name already exists',
        message: `A template with name '${name}' already exists`
      });
    }

    // Insert new template
    const newTemplate = await prisma.email_templates.create({
      data: {
        name,
        subject,
        html_template,
        text_template,
        template_type,
        category,
        is_active: true,
        version: 1,
        variables,
        personalization_rules,
        compliance_settings,
        created_by: 1, // system user
        created_at: new Date(),
        updated_at: new Date()
      }
    });

    res.status(201).json({
      success: true,
      data: newTemplate,
      message: 'Email template created successfully'
    });
  } catch (error) {
    req.logger?.error('Failed to create email template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create email template',
      message: error.message
    });
  }
});

// Update email template
router.put('/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params;
    const {
      name,
      subject,
      html_template,
      text_template,
      template_type,
      category,
      is_active,
      variables,
      personalization_rules,
      compliance_settings
    } = req.body;

    // Check if template exists
    const existingTemplate = await prisma.email_templates.findUnique({
      where: { id: templateId }
    });
    
    if (!existingTemplate) {
      return res.status(404).json({
        success: false,
        error: 'Template not found',
        message: `Template with ID '${templateId}' does not exist`
      });
    }

    // Build update data for Prisma
    const updateData = {};
    let hasUpdates = false;

    if (name !== undefined) {
      updateData.name = name;
      hasUpdates = true;
    }

    if (subject !== undefined) {
      updateData.subject = subject;
      hasUpdates = true;
    }

    if (html_template !== undefined) {
      updateData.html_template = html_template;
      hasUpdates = true;
    }

    if (text_template !== undefined) {
      updateData.text_template = text_template;
      hasUpdates = true;
    }

    if (template_type !== undefined) {
      updateData.template_type = template_type;
      hasUpdates = true;
    }

    if (category !== undefined) {
      updateData.category = category;
      hasUpdates = true;
    }

    if (is_active !== undefined) {
      updateData.is_active = is_active;
      hasUpdates = true;
    }

    if (variables !== undefined) {
      updateData.variables = variables;
      hasUpdates = true;
    }

    if (personalization_rules !== undefined) {
      updateData.personalization_rules = personalization_rules;
      hasUpdates = true;
    }

    if (compliance_settings !== undefined) {
      updateData.compliance_settings = compliance_settings;
      hasUpdates = true;
    }

    if (!hasUpdates) {
      return res.status(400).json({
        success: false,
        error: 'No updates provided',
        message: 'At least one field must be provided for update'
      });
    }

    // Always increment version and update timestamp
    updateData.version = existingTemplate.version + 1;
    updateData.updated_at = new Date();

    const updatedTemplate = await prisma.email_templates.update({
      where: { id: templateId },
      data: updateData
    });

    res.json({
      success: true,
      data: updatedTemplate,
      message: 'Email template updated successfully'
    });
  } catch (error) {
    req.logger?.error('Failed to update email template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update email template',
      message: error.message
    });
  }
});

// Delete email template
router.delete('/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params;
    const { soft_delete = true } = req.query;

    // Check if template exists
    const template = await prisma.email_templates.findUnique({
      where: { id: templateId }
    });
    
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found',
        message: `Template with ID '${templateId}' does not exist`
      });
    }

    if (soft_delete === 'true' || soft_delete === true) {
      // Soft delete - just mark as inactive
      const deletedTemplate = await prisma.email_templates.update({
        where: { id: templateId },
        data: {
          is_active: false,
          updated_at: new Date()
        }
      });

      res.json({
        success: true,
        data: {
          template: deletedTemplate,
          deleted_type: 'soft'
        },
        message: 'Email template deactivated successfully'
      });
    } else {
      // Hard delete - remove from database
      await prisma.email_templates.delete({
        where: { id: templateId }
      });

      res.json({
        success: true,
        data: {
          template: template,
          deleted_type: 'hard'
        },
        message: 'Email template deleted permanently'
      });
    }
  } catch (error) {
    req.logger?.error('Failed to delete email template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete email template',
      message: error.message
    });
  }
});

// Duplicate email template
router.post('/:templateId/duplicate', async (req, res) => {
  try {
    const { templateId } = req.params;
    const { new_name } = req.body;

    // Get original template
    const originalTemplate = await prisma.email_templates.findUnique({
      where: { id: templateId }
    });
    
    if (!originalTemplate) {
      return res.status(404).json({
        success: false,
        error: 'Template not found',
        message: `Template with ID '${templateId}' does not exist`
      });
    }
    const duplicateName = new_name || `${originalTemplate.name} (Copy)`;

    // Check if duplicate name already exists
    const existingDuplicate = await prisma.email_templates.findFirst({
      where: { name: duplicateName },
      select: { id: true }
    });
    
    if (existingDuplicate) {
      return res.status(409).json({
        success: false,
        error: 'Template name already exists',
        message: `A template with name '${duplicateName}' already exists`
      });
    }

    // Create duplicate
    const duplicatedTemplate = await prisma.email_templates.create({
      data: {
        name: duplicateName,
        subject: originalTemplate.subject,
        html_template: originalTemplate.html_template,
        text_template: originalTemplate.text_template,
        template_type: originalTemplate.template_type,
        category: originalTemplate.category,
        is_active: false, // Start duplicates as inactive
        version: 1, // Reset version
        variables: originalTemplate.variables,
        personalization_rules: originalTemplate.personalization_rules,
        compliance_settings: originalTemplate.compliance_settings,
        parent_template_id: templateId,
        created_by: 1, // created_by
        created_at: new Date(),
        updated_at: new Date()
      }
    });

    res.status(201).json({
      success: true,
      data: {
        original: originalTemplate,
        duplicate: duplicatedTemplate
      },
      message: 'Email template duplicated successfully'
    });
  } catch (error) {
    req.logger?.error('Failed to duplicate email template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to duplicate email template',
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