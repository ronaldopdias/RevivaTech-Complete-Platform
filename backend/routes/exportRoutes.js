const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// Export service will be initialized on demand
let exportService;

// Middleware to ensure export service is initialized
router.use(async (req, res, next) => {
  try {
    if (!exportService) {
      const MultiFormatExportService = require('../services/MultiFormatExportService');
      exportService = new MultiFormatExportService();
      // Pass database pool to service
      exportService.pool = req.pool;
      await exportService.initialize();
    }
    next();
  } catch (error) {
    req.logger?.error('Export service initialization failed:', error);
    res.status(500).json({ 
      error: 'Export service unavailable',
      message: 'Multi-format export service initialization failed'
    });
  }
});

// =========================
// CSV EXPORT ROUTES
// =========================

// Export email templates to CSV
router.get('/csv/email-templates', async (req, res) => {
  try {
    const filters = req.query;
    
    console.log('📊 CSV export request for email templates');
    
    const exportResult = await exportService.exportEmailTemplatesCSV(filters);
    
    // Set response headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);
    
    // Send file
    const fileBuffer = fs.readFileSync(exportResult.filePath);
    res.send(fileBuffer);
    
    // Clean up temporary file
    fs.unlinkSync(exportResult.filePath);
    
  } catch (error) {
    req.logger?.error('CSV export failed:', error);
    res.status(500).json({ 
      error: 'CSV export failed',
      message: error.message 
    });
  }
});

// =========================
// EXCEL EXPORT ROUTES
// =========================

// Export email templates to Excel
router.get('/excel/email-templates', async (req, res) => {
  try {
    const filters = req.query;
    
    console.log('📊 Excel export request for email templates');
    
    const exportResult = await exportService.exportEmailTemplatesExcel(filters);
    
    // Set response headers for Excel download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);
    
    // Send file
    const fileBuffer = fs.readFileSync(exportResult.filePath);
    res.send(fileBuffer);
    
    // Clean up temporary file
    fs.unlinkSync(exportResult.filePath);
    
  } catch (error) {
    req.logger?.error('Excel export failed:', error);
    res.status(500).json({ 
      error: 'Excel export failed',
      message: error.message 
    });
  }
});

// =========================
// SMS TEMPLATE ROUTES
// =========================

// Get all SMS templates
router.get('/sms/templates', async (req, res) => {
  try {
    console.log('📱 SMS templates request');
    
    const smsTemplates = await exportService.getAllSMSTemplates();
    
    res.json({
      success: true,
      data: {
        templates: smsTemplates,
        count: smsTemplates.length,
        config: {
          maxLength: 160,
          encoding: 'GSM 7-bit'
        }
      },
      message: 'SMS templates retrieved successfully'
    });
    
  } catch (error) {
    req.logger?.error('SMS templates retrieval failed:', error);
    res.status(500).json({ 
      error: 'SMS templates retrieval failed',
      message: error.message 
    });
  }
});

// Generate SMS template with variables
router.post('/sms/generate', async (req, res) => {
  try {
    const { templateType, variables = {} } = req.body;
    
    if (!templateType) {
      return res.status(400).json({
        error: 'Missing template type',
        message: 'templateType is required'
      });
    }

    console.log('📱 Generating SMS template for:', templateType);
    
    const smsResult = exportService.generateSMSTemplate(templateType, variables);
    
    res.json({
      success: true,
      data: smsResult,
      message: 'SMS template generated successfully'
    });
    
  } catch (error) {
    req.logger?.error('SMS template generation failed:', error);
    res.status(500).json({ 
      error: 'SMS template generation failed',
      message: error.message 
    });
  }
});

// =========================
// MULTI-FORMAT EXPORTS
// =========================

// Export custom data to specified format
router.post('/data/:format', async (req, res) => {
  try {
    const format = req.params.format.toLowerCase();
    const { data, options = {} } = req.body;
    
    if (!data || !Array.isArray(data)) {
      return res.status(400).json({
        error: 'Invalid data',
        message: 'Data must be an array of objects'
      });
    }

    console.log(`📊 Custom data export request - Format: ${format}, Records: ${data.length}`);
    
    let exportResult;
    
    switch (format) {
      case 'csv':
        exportResult = await exportService.exportTemplateDataToCSV(data, options);
        res.setHeader('Content-Type', 'text/csv');
        break;
        
      case 'excel':
      case 'xlsx':
        exportResult = await exportService.exportTemplateDataToExcel(data, options);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        break;
        
      case 'json':
        return res.json({
          success: true,
          data: data,
          recordCount: data.length,
          format: 'JSON'
        });
        
      default:
        return res.status(400).json({
          error: 'Unsupported format',
          message: `Format '${format}' is not supported. Use: csv, excel, json`
        });
    }
    
    if (exportResult) {
      // Set download headers
      res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);
      
      // Send file
      const fileBuffer = fs.readFileSync(exportResult.filePath);
      res.send(fileBuffer);
      
      // Clean up temporary file
      fs.unlinkSync(exportResult.filePath);
    }
    
  } catch (error) {
    req.logger?.error('Multi-format export failed:', error);
    res.status(500).json({ 
      error: 'Multi-format export failed',
      message: error.message 
    });
  }
});

// =========================
// EXPORT CAPABILITIES
// =========================

// Get export service capabilities
router.get('/capabilities', async (req, res) => {
  try {
    const capabilities = await exportService.getExportCapabilities();
    
    res.json({
      success: true,
      data: {
        service: 'Multi-Format Export Service',
        capabilities,
        endpoints: {
          csv: '/api/export/csv/email-templates',
          excel: '/api/export/excel/email-templates',
          sms: '/api/export/sms/templates',
          custom: '/api/export/data/{format}'
        }
      },
      message: 'Export capabilities retrieved successfully'
    });
    
  } catch (error) {
    req.logger?.error('Export capabilities check failed:', error);
    res.status(500).json({ 
      error: 'Export capabilities check failed',
      message: error.message 
    });
  }
});

module.exports = router;