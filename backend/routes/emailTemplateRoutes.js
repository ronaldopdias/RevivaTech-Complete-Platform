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
        id, name, subject, category, template_type,
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
        success: false,
        error: 'Template not found',
        message: `Template with ID '${templateId}' does not exist`
      });
    }
    
    const template = templateResult.rows[0];
    
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
    const existingQuery = 'SELECT id FROM email_templates WHERE name = $1';
    const existingResult = await req.pool.query(existingQuery, [name]);
    
    if (existingResult.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Template name already exists',
        message: `A template with name '${name}' already exists`
      });
    }

    // Insert new template
    const insertQuery = `
      INSERT INTO email_templates (
        name, subject, html_template, text_template, 
        template_type, category, is_active, version,
        variables, personalization_rules, compliance_settings,
        created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      RETURNING *
    `;

    const values = [
      name,
      subject,
      html_template,
      text_template,
      template_type,
      category,
      true, // is_active
      1, // version
      JSON.stringify(variables),
      JSON.stringify(personalization_rules),
      JSON.stringify(compliance_settings),
      1 // created_by (system user)
    ];

    const result = await req.pool.query(insertQuery, values);
    const newTemplate = result.rows[0];

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
    const existingQuery = 'SELECT * FROM email_templates WHERE id = $1';
    const existingResult = await req.pool.query(existingQuery, [templateId]);
    
    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Template not found',
        message: `Template with ID '${templateId}' does not exist`
      });
    }

    const existingTemplate = existingResult.rows[0];

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (name !== undefined) {
      // Check if new name conflicts with existing templates (excluding current)
      const nameCheckQuery = 'SELECT id FROM email_templates WHERE name = $1 AND id != $2';
      const nameCheckResult = await req.pool.query(nameCheckQuery, [name, templateId]);
      
      if (nameCheckResult.rows.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'Template name already exists',
          message: `A template with name '${name}' already exists`
        });
      }
      
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }

    if (subject !== undefined) {
      updates.push(`subject = $${paramIndex++}`);
      values.push(subject);
    }

    if (html_template !== undefined) {
      updates.push(`html_template = $${paramIndex++}`);
      values.push(html_template);
    }

    if (text_template !== undefined) {
      updates.push(`text_template = $${paramIndex++}`);
      values.push(text_template);
    }

    if (template_type !== undefined) {
      updates.push(`template_type = $${paramIndex++}`);
      values.push(template_type);
    }

    if (category !== undefined) {
      updates.push(`category = $${paramIndex++}`);
      values.push(category);
    }

    if (is_active !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(is_active);
    }

    if (variables !== undefined) {
      updates.push(`variables = $${paramIndex++}`);
      values.push(JSON.stringify(variables));
    }

    if (personalization_rules !== undefined) {
      updates.push(`personalization_rules = $${paramIndex++}`);
      values.push(JSON.stringify(personalization_rules));
    }

    if (compliance_settings !== undefined) {
      updates.push(`compliance_settings = $${paramIndex++}`);
      values.push(JSON.stringify(compliance_settings));
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No updates provided',
        message: 'At least one field must be provided for update'
      });
    }

    // Increment version number
    updates.push(`version = version + 1`);
    updates.push(`updated_at = NOW()`);
    
    // Add template ID for WHERE clause
    values.push(templateId);
    const whereParamIndex = values.length;

    const updateQuery = `
      UPDATE email_templates 
      SET ${updates.join(', ')}
      WHERE id = $${whereParamIndex}
      RETURNING *
    `;

    const result = await req.pool.query(updateQuery, values);
    const updatedTemplate = result.rows[0];

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
    const existingQuery = 'SELECT * FROM email_templates WHERE id = $1';
    const existingResult = await req.pool.query(existingQuery, [templateId]);
    
    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Template not found',
        message: `Template with ID '${templateId}' does not exist`
      });
    }

    const template = existingResult.rows[0];

    if (soft_delete === 'true' || soft_delete === true) {
      // Soft delete - just mark as inactive
      const softDeleteQuery = `
        UPDATE email_templates 
        SET is_active = false, updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;
      
      const result = await req.pool.query(softDeleteQuery, [templateId]);
      const deletedTemplate = result.rows[0];

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
      const hardDeleteQuery = 'DELETE FROM email_templates WHERE id = $1 RETURNING *';
      const result = await req.pool.query(hardDeleteQuery, [templateId]);

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
    const originalQuery = 'SELECT * FROM email_templates WHERE id = $1';
    const originalResult = await req.pool.query(originalQuery, [templateId]);
    
    if (originalResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Template not found',
        message: `Template with ID '${templateId}' does not exist`
      });
    }

    const originalTemplate = originalResult.rows[0];
    const duplicateName = new_name || `${originalTemplate.name} (Copy)`;

    // Check if duplicate name already exists
    const nameCheckQuery = 'SELECT id FROM email_templates WHERE name = $1';
    const nameCheckResult = await req.pool.query(nameCheckQuery, [duplicateName]);
    
    if (nameCheckResult.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Template name already exists',
        message: `A template with name '${duplicateName}' already exists`
      });
    }

    // Create duplicate
    const duplicateQuery = `
      INSERT INTO email_templates (
        name, subject, html_template, text_template, 
        template_type, category, is_active, version,
        variables, personalization_rules, compliance_settings,
        parent_template_id, created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
      RETURNING *
    `;

    const values = [
      duplicateName,
      originalTemplate.subject,
      originalTemplate.html_template,
      originalTemplate.text_template,
      originalTemplate.template_type,
      originalTemplate.category,
      false, // Start duplicates as inactive
      1, // Reset version
      originalTemplate.variables,
      originalTemplate.personalization_rules,
      originalTemplate.compliance_settings,
      templateId, // parent_template_id
      1 // created_by
    ];

    const result = await req.pool.query(duplicateQuery, values);
    const duplicatedTemplate = result.rows[0];

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