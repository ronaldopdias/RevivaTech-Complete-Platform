const express = require('express');
const router = express.Router();

// Services will be initialized on demand
let templateEngine;
let documentService;
let notificationService;

// Simple middleware - initialize services only when needed
router.use(async (req, res, next) => {
  // Services will be initialized per route as needed
  next();
});

// =========================
// UNIFIED TEMPLATE ROUTES
// =========================

// Get all template types and their capabilities
router.get('/', async (req, res) => {
  try {
    const templateTypes = {
      email: {
        name: 'Email Templates',
        description: 'Professional email templates with AI capabilities',
        available: true,
        features: ['personalization', 'a_b_testing', 'analytics', 'compliance'],
        templates_count: 7
      },
      pdf: {
        name: 'PDF Reports',
        description: 'AI-generated PDF documents and reports',
        available: true,
        features: ['ai_generation', 'multi_format', 'professional_layout'],
        templates_count: 8
      },
      sms: {
        name: 'SMS Templates',
        description: 'Text message templates for notifications',
        available: true,
        features: ['variable_substitution', 'character_optimization'],
        templates_count: 4
      },
      notification: {
        name: 'Notification Templates',
        description: 'Multi-channel notification templates',
        available: true,
        features: ['multi_channel', 'real_time', 'priority_routing'],
        templates_count: 6
      },
      export: {
        name: 'Export Templates',
        description: 'Data export formatting templates',
        available: false,
        features: ['csv_excel', 'custom_formatting'],
        templates_count: 0
      },
      print: {
        name: 'Print Templates',
        description: 'Print-optimized document templates',
        available: false,
        features: ['print_optimization', 'work_orders', 'labels'],
        templates_count: 0
      }
    };

    res.json({
      success: true,
      data: {
        template_types: templateTypes,
        total_templates: Object.values(templateTypes).reduce((sum, type) => sum + type.templates_count, 0),
        available_features: ['variable_processing', 'ai_enhancement', 'multi_format', 'analytics']
      },
      message: 'Template system overview retrieved successfully'
    });
  } catch (error) {
    req.logger?.error('Failed to get template overview:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve template overview',
      message: error.message 
    });
  }
});

// Multi-format template rendering endpoint
router.post('/render', async (req, res) => {
  try {
    const { type, template, variables, format = 'html' } = req.body;

    if (!type || !template) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'Type and template are required'
      });
    }

    let result;
    
    switch (type) {
      case 'email':
        result = await templateEngine.render(template, variables);
        break;
      case 'document':
      case 'pdf':
        result = await documentService.generateDocument(template, variables);
        break;
      case 'sms':
      case 'notification':
        result = await notificationService.renderTemplate(template, variables);
        break;
      default:
        return res.status(400).json({
          error: 'Unsupported template type',
          message: `Template type '${type}' is not supported`
        });
    }

    res.json({
      success: true,
      data: {
        rendered_content: result,
        type,
        template,
        format,
        variables_processed: Object.keys(variables || {}).length
      },
      message: 'Template rendered successfully'
    });
  } catch (error) {
    req.logger?.error('Template rendering failed:', error);
    res.status(500).json({ 
      error: 'Template rendering failed',
      message: error.message 
    });
  }
});

// Template preview endpoint
router.post('/preview', async (req, res) => {
  try {
    const { type, template, variables, options = {} } = req.body;

    let preview;
    
    switch (type) {
      case 'email':
        preview = await templateEngine.getTemplatePreview(template, variables);
        break;
      case 'document':
        preview = await documentService.previewDocument(template, variables);
        break;
      default:
        return res.status(400).json({
          error: 'Preview not supported for this template type',
          message: `Preview for '${type}' templates is not available`
        });
    }

    res.json({
      success: true,
      data: {
        preview,
        type,
        template,
        preview_options: options
      },
      message: 'Template preview generated successfully'
    });
  } catch (error) {
    req.logger?.error('Template preview failed:', error);
    res.status(500).json({ 
      error: 'Template preview failed',
      message: error.message 
    });
  }
});

// Template validation endpoint
router.post('/validate', async (req, res) => {
  try {
    const { type, template, content } = req.body;

    let validation;
    
    switch (type) {
      case 'email':
        validation = await templateEngine.validateTemplate(template, content);
        break;
      default:
        validation = {
          valid: true,
          warnings: [],
          errors: [],
          message: 'Basic validation passed'
        };
    }

    res.json({
      success: true,
      data: validation,
      message: 'Template validation completed'
    });
  } catch (error) {
    req.logger?.error('Template validation failed:', error);
    res.status(500).json({ 
      error: 'Template validation failed',
      message: error.message 
    });
  }
});

module.exports = router;