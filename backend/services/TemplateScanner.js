const fs = require('fs');
const path = require('path');

/**
 * Template Scanner Service
 * Scans the file system for various template types and formats
 */
class TemplateScanner {
  constructor(config = {}) {
    this.config = {
      templatesDir: config.templatesDir || path.join(__dirname, '..', 'templates'),
      supportedFormats: config.supportedFormats || {
        email: ['.html', '.txt', '.js'],
        sms: ['.txt', '.js'],
        pdf: ['.js', '.json', '.html']
      },
      excludePatterns: config.excludePatterns || [
        /node_modules/,
        /\.test\./,
        /\.backup$/,
        /\.tmp$/
      ]
    };
  }

  /**
   * Scan for all templates in the file system
   */
  async scanAllTemplates() {
    try {
      const results = {
        email: await this.scanEmailTemplates(),
        sms: await this.scanSMSTemplates(),
        pdf: await this.scanPDFTemplates(),
        summary: {}
      };

      // Generate summary
      results.summary = {
        total_files: Object.values(results).reduce((total, typeResults) => {
          return total + (Array.isArray(typeResults) ? typeResults.length : 0);
        }, 0),
        by_type: {
          email: results.email.length,
          sms: results.sms.length,
          pdf: results.pdf.length
        },
        scan_timestamp: new Date().toISOString()
      };

      return results;
    } catch (error) {
      console.error('Template scan failed:', error);
      throw new Error(`Template scanning failed: ${error.message}`);
    }
  }

  /**
   * Scan for email templates
   */
  async scanEmailTemplates() {
    const emailTemplates = [];
    const templateFiles = await this.scanDirectory(this.config.templatesDir);

    for (const file of templateFiles) {
      const ext = path.extname(file.name).toLowerCase();
      
      if (this.config.supportedFormats.email.includes(ext)) {
        const templateInfo = await this.analyzeEmailTemplate(file);
        if (templateInfo) {
          emailTemplates.push(templateInfo);
        }
      }
    }

    return emailTemplates;
  }

  /**
   * Scan for SMS templates
   */
  async scanSMSTemplates() {
    const smsTemplates = [];
    
    // Look for SMS-specific patterns
    const patterns = [
      /sms/i,
      /text/i,
      /notification/i
    ];

    const templateFiles = await this.scanDirectory(this.config.templatesDir);

    for (const file of templateFiles) {
      const fileName = file.name.toLowerCase();
      const ext = path.extname(fileName);
      
      if (this.config.supportedFormats.sms.includes(ext)) {
        const matchesSMSPattern = patterns.some(pattern => pattern.test(fileName));
        
        if (matchesSMSPattern || this.looksLikeSMSTemplate(file.content)) {
          const templateInfo = await this.analyzeSMSTemplate(file);
          if (templateInfo) {
            smsTemplates.push(templateInfo);
          }
        }
      }
    }

    return smsTemplates;
  }

  /**
   * Scan for PDF templates
   */
  async scanPDFTemplates() {
    const pdfTemplates = [];
    
    // Look for PDF-specific patterns
    const patterns = [
      /pdf/i,
      /invoice/i,
      /quote/i,
      /report/i,
      /receipt/i
    ];

    const templateFiles = await this.scanDirectory(this.config.templatesDir);

    for (const file of templateFiles) {
      const fileName = file.name.toLowerCase();
      const ext = path.extname(fileName);
      
      if (this.config.supportedFormats.pdf.includes(ext)) {
        const matchesPDFPattern = patterns.some(pattern => pattern.test(fileName));
        
        if (matchesPDFPattern || this.looksLikePDFTemplate(file.content)) {
          const templateInfo = await this.analyzePDFTemplate(file);
          if (templateInfo) {
            pdfTemplates.push(templateInfo);
          }
        }
      }
    }

    return pdfTemplates;
  }

  /**
   * Scan directory for template files
   */
  async scanDirectory(dirPath) {
    const files = [];
    
    try {
      const items = await fs.promises.readdir(dirPath, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = path.join(dirPath, item.name);
        
        if (item.isDirectory()) {
          // Recursively scan subdirectories
          const subFiles = await this.scanDirectory(fullPath);
          files.push(...subFiles);
        } else if (item.isFile()) {
          // Skip excluded patterns
          if (this.shouldExclude(item.name)) {
            continue;
          }

          try {
            const content = await fs.promises.readFile(fullPath, 'utf8');
            files.push({
              name: item.name,
              path: fullPath,
              relativePath: path.relative(this.config.templatesDir, fullPath),
              size: (await fs.promises.stat(fullPath)).size,
              modified: (await fs.promises.stat(fullPath)).mtime,
              content: content.substring(0, 10000) // First 10KB for analysis
            });
          } catch (readError) {
            console.warn(`Could not read file ${fullPath}:`, readError.message);
          }
        }
      }
    } catch (error) {
      console.warn(`Could not scan directory ${dirPath}:`, error.message);
    }

    return files;
  }

  /**
   * Analyze email template file
   */
  async analyzeEmailTemplate(file) {
    const ext = path.extname(file.name).toLowerCase();
    const baseName = path.basename(file.name, ext);
    
    let templateInfo = {
      id: baseName,
      name: baseName.replace(/[-_]/g, ' '),
      type: 'email',
      format: ext.substring(1), // Remove dot
      file_path: file.relativePath,
      file_size: file.size,
      last_modified: file.modified,
      variables: [],
      estimated_length: 0
    };

    // Extract template variables
    const variables = this.extractVariables(file.content);
    templateInfo.variables = variables;

    // Analyze content
    if (ext === '.html') {
      templateInfo.format = 'html';
      templateInfo.estimated_length = file.content.length;
      templateInfo.subject = this.extractEmailSubject(file.content);
    } else if (ext === '.txt') {
      templateInfo.format = 'text';
      templateInfo.estimated_length = file.content.length;
    } else if (ext === '.js') {
      templateInfo.format = 'javascript';
      templateInfo.estimated_length = this.estimateJSTemplateLength(file.content);
      templateInfo.subject = this.extractJSTemplateSubject(file.content);
    }

    return templateInfo;
  }

  /**
   * Analyze SMS template file
   */
  async analyzeSMSTemplate(file) {
    const ext = path.extname(file.name).toLowerCase();
    const baseName = path.basename(file.name, ext);
    
    return {
      id: baseName,
      name: baseName.replace(/[-_]/g, ' '),
      type: 'sms',
      format: ext === '.js' ? 'javascript' : 'text',
      file_path: file.relativePath,
      file_size: file.size,
      last_modified: file.modified,
      variables: this.extractVariables(file.content),
      character_count: this.estimateSMSLength(file.content),
      estimated_cost: this.estimateSMSCost(file.content)
    };
  }

  /**
   * Analyze PDF template file
   */
  async analyzePDFTemplate(file) {
    const ext = path.extname(file.name).toLowerCase();
    const baseName = path.basename(file.name, ext);
    
    return {
      id: baseName,
      name: baseName.replace(/[-_]/g, ' '),
      type: 'pdf',
      format: ext.substring(1),
      file_path: file.relativePath,
      file_size: file.size,
      last_modified: file.modified,
      variables: this.extractVariables(file.content),
      template_engine: this.detectPDFEngine(file.content),
      estimated_pages: this.estimatePDFPages(file.content)
    };
  }

  /**
   * Extract template variables ({{variable}} or ${variable} patterns)
   */
  extractVariables(content) {
    const variables = new Set();
    
    // Handlebars style: {{variable}}
    const handlebarsMatches = content.match(/\{\{([^}]+)\}\}/g) || [];
    handlebarsMatches.forEach(match => {
      const variable = match.replace(/[{}]/g, '').trim();
      variables.add(variable);
    });

    // ES6 template style: ${variable}
    const es6Matches = content.match(/\$\{([^}]+)\}/g) || [];
    es6Matches.forEach(match => {
      const variable = match.replace(/[\${}]/g, '').trim();
      variables.add(variable);
    });

    return Array.from(variables);
  }

  /**
   * Check if file should be excluded
   */
  shouldExclude(fileName) {
    return this.config.excludePatterns.some(pattern => pattern.test(fileName));
  }

  /**
   * Check if content looks like SMS template
   */
  looksLikeSMSTemplate(content) {
    return content.length < 500 && // SMS templates are typically short
           content.split('\n').length < 10 && // Few lines
           /\b(sms|text|notification|alert)\b/i.test(content);
  }

  /**
   * Check if content looks like PDF template
   */
  looksLikePDFTemplate(content) {
    return /\b(pdf|document|invoice|quote|report)\b/i.test(content) ||
           /\b(jsPDF|PDFKit|html-pdf)\b/i.test(content);
  }

  /**
   * Extract email subject from HTML content
   */
  extractEmailSubject(content) {
    const titleMatch = content.match(/<title[^>]*>([^<]+)<\/title>/i);
    return titleMatch ? titleMatch[1].trim() : null;
  }

  /**
   * Extract subject from JavaScript template
   */
  extractJSTemplateSubject(content) {
    const subjectMatch = content.match(/subject:\s*['"']([^'"]+)['"']/i);
    return subjectMatch ? subjectMatch[1].trim() : null;
  }

  /**
   * Estimate JavaScript template length
   */
  estimateJSTemplateLength(content) {
    const htmlMatch = content.match(/html:\s*`([^`]+)`/s);
    return htmlMatch ? htmlMatch[1].length : 0;
  }

  /**
   * Estimate SMS length
   */
  estimateSMSLength(content) {
    // Remove template variables for estimation
    const cleanContent = content.replace(/\{\{[^}]+\}\}/g, 'X').replace(/\$\{[^}]+\}/g, 'X');
    return cleanContent.length;
  }

  /**
   * Estimate SMS cost (UK rates)
   */
  estimateSMSCost(content) {
    const length = this.estimateSMSLength(content);
    const segments = Math.ceil(length / 160);
    return segments * 0.05; // £0.05 per segment estimate
  }

  /**
   * Detect PDF template engine
   */
  detectPDFEngine(content) {
    if (/jsPDF/i.test(content)) return 'jsPDF';
    if (/PDFKit/i.test(content)) return 'PDFKit';
    if (/html-pdf/i.test(content)) return 'html-pdf';
    if (/puppeteer/i.test(content)) return 'Puppeteer';
    return 'unknown';
  }

  /**
   * Estimate PDF pages
   */
  estimatePDFPages(content) {
    // Rough estimation based on content length
    const length = content.length;
    if (length < 2000) return 1;
    if (length < 5000) return 2;
    if (length < 10000) return 3;
    return Math.ceil(length / 3000);
  }
}

module.exports = TemplateScanner;