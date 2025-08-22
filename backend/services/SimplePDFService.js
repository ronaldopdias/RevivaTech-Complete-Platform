/**
 * Simple PDF Service for RevivaTech
 * 
 * Uses jsPDF for simple PDF generation without requiring Chrome/Puppeteer
 * Perfect for invoice generation and text-based documents
 * 
 * Business Impact: Fast PDF generation for invoices and reports
 */

const { jsPDF } = require('jspdf');

class SimplePDFService {
  constructor() {
    this.isInitialized = false;
    
    // RevivaTech branding colors (RGB values)
    this.colors = {
      primary: [173, 216, 230],    // #ADD8E6 - Trust Blue
      secondary: [0, 128, 128],    // #008080 - Professional Teal  
      text: [54, 69, 79],          // #36454F - Neutral Grey
      accent: [74, 159, 204]       // #4A9FCC - Trust Blue 700
    };
    
    this.fonts = {
      regular: 'helvetica',
      bold: 'helvetica',
      light: 'helvetica'
    };
  }

  async initialize() {
    try {
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('❌ Simple PDF Service initialization failed:', error);
      throw error;
    }
  }

  generateInvoicePDF(invoiceData) {
    try {
      if (!this.isInitialized) {
        this.initialize();
      }

      console.log('📄 Generating simple invoice PDF for:', invoiceData.invoiceNumber);

      const doc = new jsPDF();
      let yPosition = 20;

      // Header
      doc.setFillColor(...this.colors.primary);
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setFontSize(24);
      doc.setFont(this.fonts.bold, 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('RevivaTech', 20, 25);
      
      doc.setFontSize(12);
      doc.setFont(this.fonts.regular, 'normal');
      doc.text('Professional Computer Repair Services', 20, 32);

      // Reset colors for content
      doc.setTextColor(...this.colors.text);
      yPosition = 60;

      // Invoice title and number
      doc.setFontSize(20);
      doc.setFont(this.fonts.bold, 'bold');
      doc.text('INVOICE', 150, yPosition);
      
      doc.setFontSize(14);
      doc.setFont(this.fonts.regular, 'normal');
      doc.text(`#${invoiceData.invoiceNumber}`, 150, yPosition + 8);

      // Customer details
      yPosition = 80;
      doc.setFontSize(12);
      doc.setFont(this.fonts.bold, 'bold');
      doc.text('Bill To:', 20, yPosition);
      
      yPosition += 10;
      doc.setFont(this.fonts.regular, 'normal');
      doc.text(invoiceData.customerName, 20, yPosition);
      
      if (invoiceData.customerEmail) {
        yPosition += 7;
        doc.text(invoiceData.customerEmail, 20, yPosition);
      }
      
      if (invoiceData.customerAddress) {
        yPosition += 7;
        doc.text(invoiceData.customerAddress.line1, 20, yPosition);
        if (invoiceData.customerAddress.line2) {
          yPosition += 7;
          doc.text(invoiceData.customerAddress.line2, 20, yPosition);
        }
        yPosition += 7;
        doc.text(`${invoiceData.customerAddress.city}, ${invoiceData.customerAddress.postcode}`, 20, yPosition);
        yPosition += 7;
        doc.text(invoiceData.customerAddress.country, 20, yPosition);
      }

      // Invoice details (right side)
      let rightYPosition = 80;
      doc.setFont(this.fonts.bold, 'bold');
      doc.text('Invoice Details:', 120, rightYPosition);
      
      rightYPosition += 10;
      doc.setFont(this.fonts.regular, 'normal');
      doc.text(`Date: ${invoiceData.invoiceDate}`, 120, rightYPosition);
      
      if (invoiceData.dueDate) {
        rightYPosition += 7;
        doc.text(`Due: ${invoiceData.dueDate}`, 120, rightYPosition);
      }
      
      rightYPosition += 7;
      doc.text(`Booking: ${invoiceData.bookingReference}`, 120, rightYPosition);

      // Items table
      yPosition = Math.max(yPosition, rightYPosition) + 20;
      
      // Table header
      doc.setFillColor(248, 249, 250);
      doc.rect(20, yPosition - 5, 170, 12, 'F');
      
      doc.setFont(this.fonts.bold, 'bold');
      doc.text('Description', 25, yPosition + 2);
      doc.text('Qty', 120, yPosition + 2);
      doc.text('Price', 140, yPosition + 2);
      doc.text('Total', 165, yPosition + 2);
      
      yPosition += 15;

      // Table items
      doc.setFont(this.fonts.regular, 'normal');
      invoiceData.items.forEach((item, index) => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        
        // Alternate row coloring
        if (index % 2 === 1) {
          doc.setFillColor(250, 250, 250);
          doc.rect(20, yPosition - 5, 170, 10, 'F');
        }
        
        doc.text(item.description, 25, yPosition);
        doc.text(item.quantity.toString(), 125, yPosition);
        doc.text(`£${item.unitPrice.toFixed(2)}`, 140, yPosition);
        doc.text(`£${item.total.toFixed(2)}`, 165, yPosition);
        
        yPosition += 12;
      });

      // Totals section
      yPosition += 10;
      const totalsX = 120;
      
      doc.text(`Subtotal: £${invoiceData.subtotal.toFixed(2)}`, totalsX, yPosition);
      yPosition += 10;
      
      if (invoiceData.discount) {
        doc.text(`${invoiceData.discount.description}: -£${invoiceData.discount.amount.toFixed(2)}`, totalsX, yPosition);
        yPosition += 10;
      }
      
      doc.text(`VAT (${invoiceData.taxRate}%): £${invoiceData.tax.toFixed(2)}`, totalsX, yPosition);
      yPosition += 15;
      
      // Final total
      doc.setFont(this.fonts.bold, 'bold');
      doc.setFontSize(14);
      doc.text(`TOTAL: £${invoiceData.total.toFixed(2)}`, totalsX, yPosition);

      // Footer
      yPosition = 270;
      doc.setFontSize(10);
      doc.setFont(this.fonts.regular, 'normal');
      doc.setTextColor(100, 100, 100);
      
      doc.text('RevivaTech Ltd | Professional Computer Repair Services', 20, yPosition);
      doc.text('Email: support@revivatech.co.uk | Phone: +44 123 456 789', 20, yPosition + 5);
      doc.text('Website: www.revivatech.co.uk', 20, yPosition + 10);
      
      doc.text(`Thank you for choosing RevivaTech. Payment terms: ${invoiceData.dueDate ? 'Net 30 days' : 'Due upon completion'}`, 20, yPosition + 20);

      return doc.output('arraybuffer');

    } catch (error) {
      console.error('❌ Simple invoice PDF generation failed:', error);
      throw error;
    }
  }

  generateQuotePDF(quoteData) {
    try {
      if (!this.isInitialized) {
        this.initialize();
      }

      const doc = new jsPDF();
      let yPosition = 20;

      // Header (similar to invoice but with "QUOTE")
      doc.setFillColor(...this.colors.secondary);
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setFontSize(24);
      doc.setFont(this.fonts.bold, 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('RevivaTech', 20, 25);
      
      doc.setFontSize(12);
      doc.text('Professional Computer Repair Services', 20, 32);

      doc.setTextColor(...this.colors.text);
      yPosition = 60;

      // Quote title
      doc.setFontSize(20);
      doc.setFont(this.fonts.bold, 'bold');
      doc.text('REPAIR QUOTE', 130, yPosition);
      
      doc.setFontSize(14);
      doc.text(`#${quoteData.quoteNumber}`, 150, yPosition + 8);

      // Quote details
      yPosition = 80;
      doc.setFontSize(12);
      doc.setFont(this.fonts.regular, 'normal');
      
      doc.text(`Customer: ${quoteData.customerName}`, 20, yPosition);
      yPosition += 10;
      doc.text(`Device: ${quoteData.deviceName}`, 20, yPosition);
      yPosition += 10;
      doc.text(`Service: ${quoteData.serviceName}`, 20, yPosition);
      yPosition += 15;
      
      // Estimated cost box
      doc.setFillColor(248, 249, 250);
      doc.rect(20, yPosition - 5, 170, 25, 'F');
      doc.setFont(this.fonts.bold, 'bold');
      doc.setFontSize(16);
      doc.text(`Estimated Cost: £${quoteData.totalCost}`, 25, yPosition + 5);
      
      doc.setFont(this.fonts.regular, 'normal');
      doc.setFontSize(12);
      doc.text(`Valid until: ${quoteData.validUntil}`, 25, yPosition + 15);

      yPosition += 40;
      
      // Service description
      if (quoteData.description) {
        doc.setFont(this.fonts.bold, 'bold');
        doc.text('Service Description:', 20, yPosition);
        yPosition += 10;
        
        doc.setFont(this.fonts.regular, 'normal');
        const splitText = doc.splitTextToSize(quoteData.description, 170);
        doc.text(splitText, 20, yPosition);
        yPosition += splitText.length * 7 + 10;
      }

      // Footer
      yPosition = 270;
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('This quote is valid for 30 days from the date issued.', 20, yPosition);
      doc.text('Final cost may vary based on actual repair complexity.', 20, yPosition + 5);

      return doc.output('arraybuffer');

    } catch (error) {
      console.error('❌ Quote PDF generation failed:', error);
      throw error;
    }
  }
}

module.exports = SimplePDFService;