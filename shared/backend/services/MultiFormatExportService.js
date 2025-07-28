/**
 * Multi-Format Export Service for RevivaTech
 * 
 * Extends existing EmailTemplateEngine to provide CSV, Excel, and SMS export capabilities
 * 
 * Integration Strategy: Leverage existing template infrastructure for multi-format output
 * Business Impact: Complete template system with export capabilities
 */

const createCSVWriter = require('csv-writer').createObjectCsvWriter;
const XLSX = require('xlsx');
const EmailTemplateEngine = require('./EmailTemplateEngine');

class MultiFormatExportService {
  constructor() {
    this.emailEngine = new EmailTemplateEngine();
    this.isInitialized = false;
    
    // Export format mappings
    this.exportFormats = {
      CSV: 'csv',
      EXCEL: 'xlsx', 
      JSON: 'json',
      TXT: 'txt'
    };
    
    // SMS template configurations
    this.smsConfig = {
      maxLength: 160,
      encoding: 'GSM 7-bit',
      supportedVariables: [
        'customerName', 'deviceName', 'bookingId', 'repairStatus',
        'estimatedCompletion', 'totalCost', 'phoneNumber'
      ]
    };
  }

  async initialize() {
    try {
      console.log('🚀 Initializing Multi-Format Export Service...');
      
      // Initialize email template engine
      await this.emailEngine.initialize();
      console.log('✅ EmailTemplateEngine integration complete');
      
      this.isInitialized = true;
      console.log('✅ Multi-Format Export Service initialized successfully');
      
      return true;
    } catch (error) {
      console.error('❌ Multi-Format Export Service initialization failed:', error);
      throw error;
    }
  }

  // =========================
  // CSV EXPORT FUNCTIONALITY
  // =========================

  async exportTemplateDataToCSV(templateData, options = {}) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log('📊 Generating CSV export for template data...');

      const filename = options.filename || `template-export-${Date.now()}.csv`;
      const filePath = `/tmp/${filename}`;
      
      // Define CSV headers based on template data structure
      const headers = this.generateCSVHeaders(templateData);
      
      const csvWriter = createCSVWriter({
        path: filePath,
        header: headers
      });

      // Flatten template data for CSV export
      const csvData = this.flattenTemplateData(templateData);
      
      await csvWriter.writeRecords(csvData);
      
      console.log('✅ CSV export generated successfully');
      return {
        filePath,
        filename,
        recordCount: csvData.length,
        format: 'CSV'
      };

    } catch (error) {
      console.error('❌ CSV export failed:', error);
      throw error;
    }
  }

  async exportEmailTemplatesCSV(filters = {}) {
    try {
      // Get email templates from database using direct query (EmailTemplateEngine doesn't have bulk getTemplates)
      // This integrates with the existing template system database
      const query = `
        SELECT id, name, slug, subject, category, is_active, usage_count, 
               created_at, updated_at, version
        FROM email_templates 
        ORDER BY updated_at DESC
      `;
      
      // Use the pool connection if available (from route middleware)
      const result = await this.pool.query(query);
      const templates = result.rows;
      
      const templateData = templates.map(template => ({
        id: template.id,
        name: template.name,
        subject: template.subject,
        category: template.category,
        isActive: template.is_active,
        usageCount: template.usage_count,
        createdAt: template.created_at,
        updatedAt: template.updated_at,
        version: template.version
      }));

      return await this.exportTemplateDataToCSV(templateData, {
        filename: `email-templates-${Date.now()}.csv`
      });

    } catch (error) {
      console.error('❌ Email templates CSV export failed:', error);
      throw error;
    }
  }

  // =========================
  // EXCEL EXPORT FUNCTIONALITY  
  // =========================

  async exportTemplateDataToExcel(templateData, options = {}) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log('📊 Generating Excel export for template data...');

      const filename = options.filename || `template-export-${Date.now()}.xlsx`;
      const filePath = `/tmp/${filename}`;
      
      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(templateData);
      
      // Apply styling for professional appearance
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      
      // Style headers
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (worksheet[cellAddress]) {
          worksheet[cellAddress].s = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "4A9FCC" } }, // RevivaTech blue
            alignment: { horizontal: "center" }
          };
        }
      }
      
      // Set column widths
      const columnWidths = templateData.length > 0 ? 
        Object.keys(templateData[0]).map(() => ({ wch: 20 })) : [];
      worksheet['!cols'] = columnWidths;
      
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Templates');
      
      // Write file
      XLSX.writeFile(workbook, filePath);
      
      console.log('✅ Excel export generated successfully');
      return {
        filePath,
        filename,
        recordCount: templateData.length,
        format: 'Excel'
      };

    } catch (error) {
      console.error('❌ Excel export failed:', error);
      throw error;
    }
  }

  async exportEmailTemplatesExcel(filters = {}) {
    try {
      // Get email templates from database using direct query
      const query = `
        SELECT id, name, slug, subject, category, is_active, usage_count, 
               created_at, updated_at, version
        FROM email_templates 
        ORDER BY updated_at DESC
      `;
      
      const result = await this.pool.query(query);
      const templates = result.rows;
      
      const templateData = templates.map(template => ({
        ID: template.id,
        Name: template.name,
        Subject: template.subject,
        Category: template.category,
        Active: template.is_active ? 'Yes' : 'No',
        'Usage Count': template.usage_count,
        'Created Date': new Date(template.created_at).toLocaleDateString(),
        'Last Updated': new Date(template.updated_at).toLocaleDateString(),
        Version: template.version
      }));

      return await this.exportTemplateDataToExcel(templateData, {
        filename: `email-templates-${Date.now()}.xlsx`
      });

    } catch (error) {
      console.error('❌ Email templates Excel export failed:', error);
      throw error;
    }
  }

  // =========================
  // SMS TEMPLATE FUNCTIONALITY
  // =========================

  generateSMSTemplate(templateType, variables = {}) {
    try {
      console.log('📱 Generating SMS template for:', templateType);
      
      const smsTemplates = {
        booking_confirmation: `Hi {customerName}! Your {deviceName} repair is confirmed. Booking ID: {bookingId}. We'll update you soon. - RevivaTech`,
        
        repair_ready: `Good news {customerName}! Your {deviceName} repair is complete. Total: £{totalCost}. Ready for collection. - RevivaTech`,
        
        repair_update: `Update: Your {deviceName} repair is {repairStatus}. Est. completion: {estimatedCompletion}. Questions? Call us. - RevivaTech`,
        
        quote_ready: `{customerName}, your {deviceName} repair quote is ready: £{totalCost}. Valid for 30 days. Book online or call us. - RevivaTech`,
        
        reminder_collection: `Reminder: Your repaired {deviceName} is ready for collection. Booking: {bookingId}. Open Mon-Sat 9-6. - RevivaTech`,
        
        payment_reminder: `Payment reminder for {deviceName} repair. Amount: £{totalCost}. Pay online or in store. Thank you! - RevivaTech`
      };

      let template = smsTemplates[templateType] || smsTemplates.booking_confirmation;
      
      // Variable substitution
      Object.keys(variables).forEach(key => {
        const regex = new RegExp(`\\{${key}\\}`, 'g');
        template = template.replace(regex, variables[key] || '');
      });

      // Check SMS length
      const charCount = template.length;
      const isValid = charCount <= this.smsConfig.maxLength;
      
      console.log(`✅ SMS template generated: ${charCount}/${this.smsConfig.maxLength} chars`);
      
      return {
        template,
        charCount,
        maxLength: this.smsConfig.maxLength,
        isValid,
        segmentCount: Math.ceil(charCount / this.smsConfig.maxLength),
        templateType
      };

    } catch (error) {
      console.error('❌ SMS template generation failed:', error);
      throw error;
    }
  }

  async getAllSMSTemplates() {
    try {
      const templateTypes = [
        'booking_confirmation',
        'repair_ready', 
        'repair_update',
        'quote_ready',
        'reminder_collection',
        'payment_reminder'
      ];

      const smsTemplates = templateTypes.map(type => {
        const template = this.generateSMSTemplate(type);
        return {
          id: type,
          name: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          template: template.template,
          charCount: template.charCount,
          category: 'notification',
          type: 'sms'
        };
      });

      return smsTemplates;

    } catch (error) {
      console.error('❌ SMS templates retrieval failed:', error);
      throw error;
    }
  }

  // =========================
  // UTILITY FUNCTIONS
  // =========================

  generateCSVHeaders(data) {
    if (!data || data.length === 0) return [];
    
    const sampleObject = data[0];
    return Object.keys(sampleObject).map(key => ({
      id: key,
      title: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
    }));
  }

  flattenTemplateData(data) {
    return data.map(item => {
      const flattened = {};
      Object.keys(item).forEach(key => {
        if (typeof item[key] === 'object' && item[key] !== null) {
          flattened[key] = JSON.stringify(item[key]);
        } else {
          flattened[key] = item[key];
        }
      });
      return flattened;
    });
  }

  async getExportCapabilities() {
    return {
      csv: {
        available: true,
        description: 'Comma-separated values export',
        mimeType: 'text/csv',
        extension: '.csv'
      },
      excel: {
        available: true,
        description: 'Microsoft Excel workbook',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        extension: '.xlsx'
      },
      sms: {
        available: true,
        description: 'SMS template generation',
        maxLength: this.smsConfig.maxLength,
        templates: 6
      },
      json: {
        available: true,
        description: 'JSON data export',
        mimeType: 'application/json',
        extension: '.json'
      }
    };
  }
}

module.exports = MultiFormatExportService;