const express = require('express');
const router = express.Router();
const TemplateScanner = require('../services/TemplateScanner');

// Initialize template scanner
const templateScanner = new TemplateScanner();

// =========================
// TEMPLATE SCANNER ROUTES
// =========================

// Scan all templates in file system
router.get('/scan', async (req, res) => {
  try {
    const results = await templateScanner.scanAllTemplates();
    
    res.json({
      success: true,
      data: results,
      message: 'Template scanning completed successfully'
    });
  } catch (error) {
    console.error('Template scan failed:', error);
    res.status(500).json({
      success: false,
      error: 'Template scanning failed',
      message: error.message
    });
  }
});

// Scan specific template type
router.get('/scan/:type', async (req, res) => {
  try {
    const { type } = req.params;
    let results;

    switch (type.toLowerCase()) {
      case 'email':
        results = await templateScanner.scanEmailTemplates();
        break;
      case 'sms':
        results = await templateScanner.scanSMSTemplates();
        break;
      case 'pdf':
        results = await templateScanner.scanPDFTemplates();
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid template type',
          message: 'Supported types: email, sms, pdf'
        });
    }

    res.json({
      success: true,
      data: {
        type: type.toLowerCase(),
        templates: results,
        count: results.length
      },
      message: `${type} template scanning completed successfully`
    });
  } catch (error) {
    console.error(`${type} template scan failed:`, error);
    res.status(500).json({
      success: false,
      error: `${type} template scanning failed`,
      message: error.message
    });
  }
});

// Get template scanner capabilities
router.get('/capabilities', async (req, res) => {
  try {
    const capabilities = {
      supported_formats: templateScanner.config.supportedFormats,
      templates_directory: templateScanner.config.templatesDir,
      scanner_features: [
        'Auto-detection of template types',
        'Variable extraction',
        'File size analysis',
        'Content estimation',
        'SMS cost calculation',
        'PDF page estimation'
      ],
      variable_patterns: [
        '{{variable}} - Handlebars style',
        '${variable} - ES6 template literal style'
      ]
    };

    res.json({
      success: true,
      data: capabilities,
      message: 'Template scanner capabilities retrieved'
    });
  } catch (error) {
    console.error('Failed to get scanner capabilities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get scanner capabilities',
      message: error.message
    });
  }
});

module.exports = router;