const express = require('express');
const { prisma } = require('../lib/prisma');
const router = express.Router();
const SimplePDFService = require('../services/SimplePDFService');

// PDF service will be initialized on demand
let pdfService;

// Middleware to ensure PDF service is initialized
router.use(async (req, res, next) => {
  try {
    if (!pdfService) {
      pdfService = new SimplePDFService();
      await pdfService.initialize();
    }
    next();
  } catch (error) {
    req.logger?.error('PDF service initialization failed:', error);
    res.status(500).json({ 
      error: 'PDF service unavailable',
      message: 'PDF generation service initialization failed'
    });
  }
});

// =========================
// PDF GENERATION ROUTES
// =========================

// Generate invoice PDF
router.post('/invoice', async (req, res) => {
  try {
    const invoiceData = req.body;
    
    // Validate required fields
    if (!invoiceData.customerName || !invoiceData.invoiceNumber || !invoiceData.items) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'customerName, invoiceNumber, and items are required'
      });
    }

    console.log('📄 Generating invoice PDF for:', invoiceData.invoiceNumber);
    
    const pdf = await pdfService.generateInvoicePDF(invoiceData);
    
    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoiceData.invoiceNumber}.pdf`);
    res.setHeader('Content-Length', pdf.byteLength);
    
    res.send(Buffer.from(pdf));
    
  } catch (error) {
    req.logger?.error('Invoice PDF generation failed:', error);
    res.status(500).json({ 
      error: 'Invoice PDF generation failed',
      message: error.message 
    });
  }
});

// Generate quote PDF using existing Repair Quote template
router.post('/quote', async (req, res) => {
  try {
    const quoteData = req.body;
    
    // Validate required fields
    if (!quoteData.customerName || !quoteData.quoteNumber || !quoteData.deviceName) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'customerName, quoteNumber, and deviceName are required'
      });
    }

    console.log('💰 Generating quote PDF for:', quoteData.quoteNumber);
    
    const pdf = await pdfService.generateQuotePDF(quoteData);
    
    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=quote-${quoteData.quoteNumber}.pdf`);
    res.setHeader('Content-Length', pdf.byteLength);
    
    res.send(Buffer.from(pdf));
    
  } catch (error) {
    req.logger?.error('Quote PDF generation failed:', error);
    res.status(500).json({ 
      error: 'Quote PDF generation failed',
      message: error.message 
    });
  }
});

// Generate diagnostic report PDF (Phase 3 feature)
router.post('/diagnostic', async (req, res) => {
  res.status(501).json({
    error: 'Diagnostic PDF generation not implemented',
    message: 'This feature will be enhanced in Phase 3 with AI integration.'
  });
});

// Generate PDF from existing email template
router.post('/from-template/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params;
    const { variables = {}, options = {} } = req.body;
    
    // Get template from database
    const template = await prisma.email_templates.findUnique({
      where: { id: templateId }
    });
    
    if (!template) {
      return res.status(404).json({
        error: 'Template not found',
        message: `Template with ID '${templateId}' does not exist`
      });
    }
    
    // Process template HTML with variables
    let htmlContent = template.html_content;
    
    // Simple variable replacement (can be enhanced with proper template engine)
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      htmlContent = htmlContent.replace(regex, variables[key] || '');
    });
    
    // Wrap in PDF-friendly layout
    const pdfHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${template.subject} - RevivaTech</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            line-height: 1.6; 
            color: #333;
          }
          .header { 
            text-align: center; 
            padding: 20px; 
            background: #f8f9fa; 
            border-bottom: 2px solid #ADD8E6;
            margin-bottom: 30px;
          }
          .content { 
            max-width: 600px; 
            margin: 0 auto; 
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="color: #1A5266; margin: 0;">RevivaTech</h1>
          <p style="margin: 5px 0 0 0;">${template.subject}</p>
        </div>
        <div class="content">
          ${htmlContent}
        </div>
        <div class="footer">
          <p>RevivaTech Professional Services | www.revivatech.co.uk</p>
          <p>Generated: ${new Date().toLocaleDateString()}</p>
        </div>
      </body>
      </html>
    `;
    
    // For now, return an error for template-to-PDF conversion
    // This feature will be enhanced in Phase 3
    return res.status(501).json({
      error: 'Template-to-PDF conversion not implemented',
      message: 'This feature will be available in Phase 3. Use /api/pdf/invoice or /api/pdf/quote for direct PDF generation.'
    });
    
    const filename = `${template.slug || template.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.pdf`;
    
    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-Length', pdf.length);
    
    res.send(pdf);
    
  } catch (error) {
    req.logger?.error('Template PDF generation failed:', error);
    res.status(500).json({ 
      error: 'Template PDF generation failed',
      message: error.message 
    });
  }
});

// Test PDF generation endpoint

// Get PDF service status
router.get('/status', async (req, res) => {
  try {
    const status = {
      service: 'PDF Template Service',
      initialized: pdfService ? pdfService.isInitialized : false,
      browser_active: pdfService && pdfService.browser ? true : false,
      capabilities: [
        'Invoice PDF Generation',
        'Diagnostic Report PDF',
        'Template-to-PDF Conversion',
        'Custom PDF Layouts'
      ],
      supported_formats: ['A4', 'Letter', 'Legal'],
      timestamp: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: status,
      message: 'PDF service status retrieved successfully'
    });
    
  } catch (error) {
    req.logger?.error('PDF status check failed:', error);
    res.status(500).json({ 
      error: 'PDF status check failed',
      message: error.message 
    });
  }
});

module.exports = router;