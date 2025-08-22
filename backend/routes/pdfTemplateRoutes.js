const express = require('express');
const router = express.Router();
const TemplateScanner = require('../services/TemplateScanner');

// Initialize template scanner
const templateScanner = new TemplateScanner();

// =========================
// PDF TEMPLATE ROUTES
// =========================

// Get all PDF templates
router.get('/', async (req, res) => {
  try {
    // Scan for PDF templates in file system
    const scannedTemplates = await templateScanner.scanPDFTemplates();
    
    // Add some default PDF templates
    const defaultTemplates = [
      {
        id: 'invoice',
        name: 'Repair Invoice',
        type: 'pdf',
        format: 'html',
        description: 'Professional invoice for completed repairs',
        template_engine: 'puppeteer',
        estimated_pages: 1,
        variables: [
          'invoice_number', 'customer_name', 'customer_address',
          'device', 'services', 'parts', 'labor_cost', 'parts_cost',
          'subtotal', 'tax', 'total', 'payment_method'
        ],
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'quote_pdf',
        name: 'Repair Quote PDF',
        type: 'pdf',
        format: 'html',
        description: 'Detailed repair quote with itemized pricing',
        template_engine: 'puppeteer',
        estimated_pages: 2,
        variables: [
          'quote_number', 'customer_name', 'device', 'model',
          'issue_description', 'diagnostic_fee', 'repair_cost',
          'parts_needed', 'labor_hours', 'total_estimate'
        ],
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'diagnostic_report',
        name: 'Diagnostic Report',
        type: 'pdf',
        format: 'html',
        description: 'Technical diagnostic report with findings and recommendations',
        template_engine: 'puppeteer',
        estimated_pages: 2,
        variables: [
          'report_number', 'device', 'model', 'serial_number',
          'issues_found', 'tests_performed', 'recommendations',
          'technician_name', 'test_date', 'next_steps'
        ],
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'warranty_certificate',
        name: 'Warranty Certificate',
        type: 'pdf',
        format: 'html',
        description: 'Warranty certificate for completed repairs',
        template_engine: 'puppeteer',
        estimated_pages: 1,
        variables: [
          'warranty_number', 'customer_name', 'device', 'repair_date',
          'services_covered', 'warranty_period', 'expiry_date',
          'terms_conditions', 'contact_info'
        ],
        is_active: true,
        created_at: new Date().toISOString()
      }
    ];

    // Combine scanned and default templates
    const allTemplates = [...defaultTemplates, ...scannedTemplates];

    res.json({
      success: true,
      data: {
        templates: allTemplates,
        count: allTemplates.length,
        total_estimated_pages: allTemplates.reduce((sum, t) => sum + (t.estimated_pages || 0), 0),
        supported_engines: ['puppeteer', 'jsPDF', 'PDFKit', 'html-pdf']
      },
      message: 'PDF templates retrieved successfully'
    });
  } catch (error) {
    console.error('Failed to retrieve PDF templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve PDF templates',
      message: error.message
    });
  }
});

// Get specific PDF template
router.get('/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params;
    
    // For now, return mock template data
    const template = {
      id: templateId,
      name: templateId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      type: 'pdf',
      format: 'html',
      description: 'Professional PDF document template',
      template_engine: 'puppeteer',
      estimated_pages: 2,
      variables: ['customer_name', 'date', 'content', 'footer'],
      content_sample: `
        <div class="pdf-document">
          <header>
            <h1>{{title}}</h1>
            <div class="date">{{date}}</div>
          </header>
          <main>
            <p>Dear {{customer_name}},</p>
            <div class="content">{{content}}</div>
          </main>
          <footer>{{footer}}</footer>
        </div>
      `,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    res.json({
      success: true,
      data: template,
      message: 'PDF template retrieved successfully'
    });
  } catch (error) {
    console.error('Failed to retrieve PDF template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve PDF template',
      message: error.message
    });
  }
});

// Generate PDF using template
router.post('/:templateId/generate', async (req, res) => {
  try {
    const { templateId } = req.params;
    const { variables = {}, options = {} } = req.body;
    
    // Mock PDF generation (in real implementation, use PDF library)
    const result = {
      pdf_id: `pdf_${Date.now()}`,
      template_id: templateId,
      file_name: `${templateId}_${Date.now()}.pdf`,
      file_size: 245760, // ~240KB
      page_count: 2,
      generated_at: new Date().toISOString(),
      download_url: `/api/pdf/download/pdf_${Date.now()}`,
      variables_used: Object.keys(variables)
    };

    res.json({
      success: true,
      data: result,
      message: 'PDF generated successfully using template'
    });
  } catch (error) {
    console.error('Failed to generate PDF template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate PDF template',
      message: error.message
    });
  }
});

// Get PDF template analytics
router.get('/:templateId/analytics', async (req, res) => {
  try {
    const { templateId } = req.params;
    
    // Mock analytics data
    const analytics = {
      template_id: templateId,
      total_generated: 89,
      total_downloads: 76,
      download_rate: 0.854,
      average_file_size: 267000, // ~260KB
      average_pages: 1.8,
      recent_generations: [
        { date: '2025-08-22', generated: 5, downloaded: 4, avg_size: 245000 },
        { date: '2025-08-21', generated: 3, downloaded: 3, avg_size: 278000 },
        { date: '2025-08-20', generated: 7, downloaded: 6, avg_size: 251000 }
      ]
    };

    res.json({
      success: true,
      data: analytics,
      message: 'PDF template analytics retrieved successfully'
    });
  } catch (error) {
    console.error('Failed to get PDF template analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get PDF template analytics',
      message: error.message
    });
  }
});

// Get PDF capabilities
router.get('/capabilities', async (req, res) => {
  try {
    const capabilities = {
      supported_engines: [
        {
          name: 'puppeteer',
          description: 'Chrome headless for HTML to PDF conversion',
          pros: ['High quality', 'CSS support', 'JavaScript execution'],
          cons: ['Memory intensive', 'Slower generation']
        },
        {
          name: 'jsPDF',
          description: 'Client-side PDF generation',
          pros: ['Fast', 'Lightweight', 'Browser compatible'],
          cons: ['Limited formatting', 'No complex layouts']
        },
        {
          name: 'PDFKit',
          description: 'Programmatic PDF creation',
          pros: ['Precise control', 'Vector graphics', 'Small files'],
          cons: ['More complex setup', 'No HTML input']
        }
      ],
      supported_formats: ['HTML', 'Markdown', 'JSON templates'],
      max_file_size: '10MB',
      supported_features: [
        'Variable substitution',
        'CSS styling',
        'Images and logos',
        'Headers and footers',
        'Page numbering',
        'Digital signatures (planned)'
      ],
      common_variables: [
        'customer_name', 'customer_address', 'customer_email',
        'device', 'model', 'serial_number',
        'technician_name', 'date', 'invoice_number',
        'total_cost', 'warranty_period'
      ]
    };

    res.json({
      success: true,
      data: capabilities,
      message: 'PDF capabilities retrieved successfully'
    });
  } catch (error) {
    console.error('Failed to get PDF capabilities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get PDF capabilities',
      message: error.message
    });
  }
});

module.exports = router;