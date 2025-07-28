/**
 * PDF Template Service for RevivaTech
 * 
 * Extends existing EmailTemplateEngine and AIDocumentationService 
 * to provide PDF generation capabilities using puppeteer
 * 
 * Integration Strategy: Leverage existing template HTML and convert to PDF
 * Business Impact: Professional PDF invoices, reports, and documents
 */

const puppeteer = require('puppeteer');
const EmailTemplateEngine = require('./EmailTemplateEngine');
const AIDocumentationService = require('./AIDocumentationService');

class PDFTemplateService {
  constructor() {
    this.emailEngine = new EmailTemplateEngine();
    this.aiDocService = new AIDocumentationService();
    this.browser = null;
    this.isInitialized = false;
    
    // PDF generation options
    this.defaultPDFOptions = {
      format: 'A4',
      margin: { 
        top: '20mm', 
        right: '15mm', 
        bottom: '20mm', 
        left: '15mm' 
      },
      displayHeaderFooter: true,
      printBackground: true,
      preferCSSPageSize: true
    };
    
    // RevivaTech branding styles for PDF
    this.brandingCSS = `
      <style>
        @page {
          margin: 20mm 15mm;
          @top-center {
            content: "RevivaTech Professional Services";
            font-size: 10px;
            color: #4A9FCC;
          }
          @bottom-center {
            content: "Page " counter(page) " of " counter(pages);
            font-size: 10px;
            color: #666;
          }
        }
        
        body {
          font-family: 'Arial', 'Helvetica', sans-serif;
          line-height: 1.4;
          color: #1D1D1F;
          margin: 0;
          padding: 0;
        }
        
        .pdf-header {
          background: linear-gradient(135deg, #ADD8E6 0%, #4A9FCC 100%);
          color: white;
          padding: 20px;
          margin-bottom: 30px;
          border-radius: 8px;
        }
        
        .pdf-footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #ADD8E6;
          font-size: 12px;
          color: #666;
          text-align: center;
        }
        
        .invoice-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin: 20px 0;
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        
        .items-table th {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          padding: 12px;
          text-align: left;
          font-weight: 600;
          color: #1A5266;
        }
        
        .items-table td {
          border: 1px solid #dee2e6;
          padding: 12px;
        }
        
        .total-section {
          margin-left: auto;
          width: 300px;
          margin-top: 20px;
        }
        
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #eee;
        }
        
        .total-row.final {
          font-weight: 600;
          font-size: 18px;
          color: #1A5266;
          border-bottom: 2px solid #ADD8E6;
          padding-top: 15px;
        }
        
        .diagnostic-section {
          background: #f8f9fa;
          border-left: 4px solid #008080;
          padding: 20px;
          margin: 20px 0;
          border-radius: 0 8px 8px 0;
        }
        
        .print-only {
          display: block !important;
        }
        
        .no-print {
          display: none !important;
        }
      </style>
    `;
  }

  async initialize() {
    try {
      console.log('🚀 Initializing PDF Template Service...');
      
      // Initialize dependencies
      await this.emailEngine.initialize();
      console.log('✅ EmailTemplateEngine initialized');
      
      // Launch puppeteer browser
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      });
      console.log('✅ Puppeteer browser launched');
      
      this.isInitialized = true;
      console.log('✅ PDF Template Service initialized successfully');
      
      return true;
    } catch (error) {
      console.error('❌ PDF Template Service initialization failed:', error);
      throw error;
    }
  }

  async generateInvoicePDF(invoiceData) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log('📄 Generating invoice PDF for:', invoiceData.invoiceNumber);

      // Generate HTML using existing template structure
      const htmlContent = this.generateInvoiceHTML(invoiceData);
      
      // Convert to PDF
      const page = await this.browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      const pdfOptions = {
        ...this.defaultPDFOptions,
        headerTemplate: `
          <div style="font-size: 10px; text-align: center; width: 100%; color: #4A9FCC;">
            RevivaTech Professional Invoice - ${invoiceData.invoiceNumber}
          </div>
        `,
        footerTemplate: `
          <div style="font-size: 10px; text-align: center; width: 100%; color: #666;">
            <span class="pageNumber"></span> of <span class="totalPages"></span> | 
            Generated: ${new Date().toLocaleDateString()} | 
            RevivaTech Ltd
          </div>
        `
      };

      const pdf = await page.pdf(pdfOptions);
      await page.close();

      console.log('✅ Invoice PDF generated successfully');
      return pdf;

    } catch (error) {
      console.error('❌ Invoice PDF generation failed:', error);
      throw error;
    }
  }

  generateInvoiceHTML(invoiceData) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Invoice ${invoiceData.invoiceNumber} - RevivaTech</title>
        ${this.brandingCSS}
      </head>
      <body>
        <div class="pdf-header">
          <h1 style="margin: 0; font-size: 28px;">RevivaTech</h1>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">Professional Computer Repair Services</p>
        </div>

        <div style="text-align: right; margin-bottom: 30px;">
          <h2 style="color: #1A5266; margin: 0;">INVOICE</h2>
          <p style="font-size: 18px; color: #666; margin: 5px 0;">#${invoiceData.invoiceNumber}</p>
        </div>

        <div class="invoice-details">
          <div>
            <h3 style="color: #1A5266;">Bill To:</h3>
            <p><strong>${invoiceData.customerName}</strong></p>
            <p>${invoiceData.customerEmail}</p>
            ${invoiceData.customerAddress ? `
              <p>${invoiceData.customerAddress.line1}<br>
              ${invoiceData.customerAddress.line2 ? invoiceData.customerAddress.line2 + '<br>' : ''}
              ${invoiceData.customerAddress.city}, ${invoiceData.customerAddress.postcode}<br>
              ${invoiceData.customerAddress.country}</p>
            ` : ''}
          </div>
          
          <div>
            <h3 style="color: #1A5266;">Invoice Details:</h3>
            <p><strong>Invoice Date:</strong> ${invoiceData.invoiceDate}</p>
            ${invoiceData.dueDate ? `<p><strong>Due Date:</strong> ${invoiceData.dueDate}</p>` : ''}
            <p><strong>Booking Reference:</strong> ${invoiceData.bookingReference}</p>
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Unit Price</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${invoiceData.items.map(item => `
              <tr>
                <td>${item.description}</td>
                <td style="text-align: center;">${item.quantity}</td>
                <td style="text-align: right;">£${item.unitPrice.toFixed(2)}</td>
                <td style="text-align: right;">£${item.total.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="total-section">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>£${invoiceData.subtotal.toFixed(2)}</span>
          </div>
          
          ${invoiceData.discount ? `
            <div class="total-row">
              <span>${invoiceData.discount.description}:</span>
              <span>-£${invoiceData.discount.amount.toFixed(2)}</span>
            </div>
          ` : ''}
          
          <div class="total-row">
            <span>VAT (${invoiceData.taxRate}%):</span>
            <span>£${invoiceData.tax.toFixed(2)}</span>
          </div>
          
          <div class="total-row final">
            <span>TOTAL:</span>
            <span>£${invoiceData.total.toFixed(2)}</span>
          </div>
        </div>

        <div class="pdf-footer">
          <p><strong>RevivaTech Ltd</strong> | Professional Computer Repair Services</p>
          <p>Email: support@revivatech.co.uk | Phone: +44 123 456 789</p>
          <p>Website: www.revivatech.co.uk</p>
          <p style="margin-top: 15px; font-size: 11px;">
            Thank you for choosing RevivaTech. Payment terms: ${invoiceData.dueDate ? 'Net 30 days' : 'Payment due upon completion'}
          </p>
        </div>
      </body>
      </html>
    `;
  }

  async generateDiagnosticPDF(diagnosticData) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log('📋 Generating diagnostic PDF for device:', diagnosticData.device?.model);

      // Use AI Documentation Service to generate content
      const diagnosticContent = await this.aiDocService.generateDiagnosticReport(
        diagnosticData.device, 
        diagnosticData.symptoms
      );

      const htmlContent = this.generateDiagnosticHTML(diagnosticData, diagnosticContent);
      
      const page = await this.browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      const pdfOptions = {
        ...this.defaultPDFOptions,
        headerTemplate: `
          <div style="font-size: 10px; text-align: center; width: 100%; color: #4A9FCC;">
            RevivaTech Diagnostic Report - ${diagnosticData.device?.brand} ${diagnosticData.device?.model}
          </div>
        `
      };

      const pdf = await page.pdf(pdfOptions);
      await page.close();

      console.log('✅ Diagnostic PDF generated successfully');
      return pdf;

    } catch (error) {
      console.error('❌ Diagnostic PDF generation failed:', error);
      throw error;
    }
  }

  generateDiagnosticHTML(diagnosticData, content) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Diagnostic Report - ${diagnosticData.device?.brand} ${diagnosticData.device?.model}</title>
        ${this.brandingCSS}
      </head>
      <body>
        <div class="pdf-header">
          <h1 style="margin: 0; font-size: 28px;">RevivaTech</h1>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">Professional Diagnostic Report</p>
        </div>

        <div class="diagnostic-section">
          <h2 style="color: #008080; margin-top: 0;">Device Information</h2>
          <p><strong>Brand:</strong> ${diagnosticData.device?.brand || 'N/A'}</p>
          <p><strong>Model:</strong> ${diagnosticData.device?.model || 'N/A'}</p>
          <p><strong>Serial Number:</strong> ${diagnosticData.device?.serialNumber || 'N/A'}</p>
          <p><strong>Issue Reported:</strong> ${diagnosticData.symptoms || 'N/A'}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>

        <div style="margin: 30px 0;">
          <h2 style="color: #1A5266;">Diagnostic Analysis</h2>
          <div style="white-space: pre-wrap; line-height: 1.6;">
            ${content || 'Diagnostic analysis in progress...'}
          </div>
        </div>

        <div class="pdf-footer">
          <p><strong>RevivaTech Ltd</strong> | Professional Computer Repair Services</p>
          <p>This diagnostic report is confidential and intended for the device owner only.</p>
        </div>
      </body>
      </html>
    `;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      console.log('✅ PDF browser closed');
    }
  }
}

module.exports = PDFTemplateService;