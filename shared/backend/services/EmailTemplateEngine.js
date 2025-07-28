const EventEmitter = require('events');

class EmailTemplateEngine extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      enablePersonalization: true,
      enableTracking: true,
      enableABTesting: true,
      complianceMode: 'strict', // strict, moderate, basic
      cacheTemplates: true,
      maxCacheSize: 1000,
      ...options
    };
    
    this.templateCache = new Map();
    this.variableProcessors = new Map();
    this.personalizationRules = new Map();
    this.complianceCheckers = new Map();
    
    this.setupVariableProcessors();
    this.setupComplianceCheckers();
  }

  async initialize() {
    try {
      console.log('🚀 Initializing Email Template Engine...');
      
      // Load templates into cache if enabled
      if (this.options.cacheTemplates) {
        await this.preloadTemplates();
      }
      
      console.log('✅ Email Template Engine initialized');
      return true;
    } catch (error) {
      console.error('❌ Email Template Engine initialization failed:', error);
      throw error;
    }
  }

  setupVariableProcessors() {
    // Built-in variable processors
    this.variableProcessors.set('user', (data, variable) => {
      const userPaths = {
        'user.name': data.user?.name || data.user?.first_name || 'Valued Customer',
        'user.first_name': data.user?.first_name || 'Friend',
        'user.email': data.user?.email || '',
        'user.phone': data.user?.phone || '',
        'user.company': data.user?.company || '',
        'user.title': data.user?.title || ''
      };
      return userPaths[variable] || '';
    });

    this.variableProcessors.set('repair', (data, variable) => {
      const repairPaths = {
        'repair.id': data.repair?.id || '',
        'repair.device': data.repair?.device || '',
        'repair.brand': data.repair?.brand || '',
        'repair.model': data.repair?.model || '',
        'repair.issue': data.repair?.issue || '',
        'repair.status': data.repair?.status || '',
        'repair.estimated_completion': data.repair?.estimated_completion || '',
        'repair.cost_estimate': data.repair?.cost_estimate || '',
        'repair.technician': data.repair?.technician || '',
        'repair.created_at': data.repair?.created_at || ''
      };
      return repairPaths[variable] || '';
    });

    this.variableProcessors.set('booking', (data, variable) => {
      const bookingPaths = {
        'booking.id': data.booking?.id || '',
        'booking.service_type': data.booking?.service_type || '',
        'booking.appointment_date': data.booking?.appointment_date || '',
        'booking.time_slot': data.booking?.time_slot || '',
        'booking.location': data.booking?.location || '',
        'booking.notes': data.booking?.notes || ''
      };
      return bookingPaths[variable] || '';
    });

    this.variableProcessors.set('company', (data, variable) => {
      const companyPaths = {
        'company.name': 'RevivaTech',
        'company.phone': '+44 20 1234 5678',
        'company.email': 'support@revivatech.co.uk',
        'company.address': '123 Tech Street, London, UK',
        'company.website': 'https://revivatech.co.uk',
        'company.support_hours': 'Monday - Friday, 9 AM - 6 PM GMT'
      };
      return companyPaths[variable] || '';
    });

    this.variableProcessors.set('system', (data, variable) => {
      const now = new Date();
      const systemPaths = {
        'system.date': now.toLocaleDateString(),
        'system.time': now.toLocaleTimeString(),
        'system.year': now.getFullYear().toString(),
        'system.unsubscribe_url': data.unsubscribe_url || '#',
        'system.preferences_url': data.preferences_url || '#',
        'system.tracking_pixel': data.tracking_pixel || ''
      };
      return systemPaths[variable] || '';
    });
  }

  setupComplianceCheckers() {
    // GDPR Compliance Checker
    this.complianceCheckers.set('gdpr', (template, data) => {
      const issues = [];
      
      // Check for unsubscribe link
      if (!template.includes('{{system.unsubscribe_url}}') && 
          !template.includes('unsubscribe')) {
        issues.push('Missing unsubscribe link for GDPR compliance');
      }
      
      // Check for data processing notice
      if (template.includes('personal data') || template.includes('information')) {
        if (!template.includes('privacy') && !template.includes('data protection')) {
          issues.push('Consider adding privacy/data protection notice');
        }
      }
      
      return issues;
    });

    // CAN-SPAM Compliance Checker
    this.complianceCheckers.set('can_spam', (template, data) => {
      const issues = [];
      
      // Check for physical address
      if (!template.includes('{{company.address}}') && 
          !template.includes('address')) {
        issues.push('Missing physical address for CAN-SPAM compliance');
      }
      
      // Check for clear identification
      if (!template.includes('{{company.name}}')) {
        issues.push('Company name should be clearly visible');
      }
      
      return issues;
    });

    // Accessibility Checker
    this.complianceCheckers.set('accessibility', (template, data) => {
      const issues = [];
      
      // Check for alt text on images
      if (template.includes('<img') && !template.includes('alt=')) {
        issues.push('Images should include alt text for accessibility');
      }
      
      // Check for proper heading structure
      if (template.includes('<h2') && !template.includes('<h1')) {
        issues.push('Use proper heading hierarchy (h1 before h2)');
      }
      
      return issues;
    });
  }

  async renderTemplate(templateId, data = {}, options = {}) {
    try {
      const template = await this.getTemplate(templateId);
      if (!template) {
        throw new Error(`Template not found: ${templateId}`);
      }

      // Check compliance if enabled
      const complianceIssues = await this.checkCompliance(template, data);
      if (complianceIssues.length > 0 && this.options.complianceMode === 'strict') {
        throw new Error(`Compliance issues: ${complianceIssues.join(', ')}`);
      }

      // Apply personalization
      const personalizedTemplate = await this.applyPersonalization(template, data);
      
      // Process variables
      const renderedContent = await this.processVariables(personalizedTemplate, data);
      
      // Add tracking if enabled
      const finalContent = await this.addTracking(renderedContent, data, options);
      
      // Emit render event
      this.emit('templateRendered', {
        templateId,
        dataKeys: Object.keys(data),
        complianceIssues: complianceIssues.length,
        timestamp: Date.now()
      });

      return {
        html: finalContent.html,
        text: finalContent.text,
        subject: await this.processVariables(template.subject, data),
        metadata: {
          templateId,
          version: template.version,
          personalizationApplied: personalizedTemplate !== template,
          complianceIssues,
          renderTime: Date.now()
        }
      };
    } catch (error) {
      console.error('❌ Template rendering failed:', error);
      throw error;
    }
  }

  async getTemplate(templateId) {
    // Check cache first
    if (this.options.cacheTemplates && this.templateCache.has(templateId)) {
      return this.templateCache.get(templateId);
    }

    // Simulate database fetch (replace with actual DB call)
    const template = await this.fetchTemplateFromDatabase(templateId);
    
    if (template && this.options.cacheTemplates) {
      // Manage cache size
      if (this.templateCache.size >= this.options.maxCacheSize) {
        const firstKey = this.templateCache.keys().next().value;
        this.templateCache.delete(firstKey);
      }
      this.templateCache.set(templateId, template);
    }

    return template;
  }

  async fetchTemplateFromDatabase(templateId) {
    // This would be replaced with actual database query
    // For now, return a mock template structure
    return {
      id: templateId,
      name: `Template ${templateId}`,
      subject: 'Welcome to {{company.name}}, {{user.first_name}}!',
      html_template: `
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{{subject}}</title>
          </head>
          <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px;">
              <h1 style="color: #333;">Hello {{user.first_name}}!</h1>
              <p>Welcome to {{company.name}}. We're excited to help you with your repair needs.</p>
              {{#if repair}}
              <div style="background-color: #f0f8ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3>Your Repair Details:</h3>
                <p><strong>Device:</strong> {{repair.brand}} {{repair.model}}</p>
                <p><strong>Issue:</strong> {{repair.issue}}</p>
                <p><strong>Status:</strong> {{repair.status}}</p>
              </div>
              {{/if}}
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
              <p style="font-size: 12px; color: #666;">
                {{company.name}}<br>
                {{company.address}}<br>
                <a href="{{system.unsubscribe_url}}">Unsubscribe</a> | 
                <a href="{{system.preferences_url}}">Email Preferences</a>
              </p>
              {{system.tracking_pixel}}
            </div>
          </body>
        </html>
      `,
      text_template: `Hello {{user.first_name}}!\n\nWelcome to {{company.name}}. We're excited to help you with your repair needs.\n\n{{#if repair}}Your Repair Details:\nDevice: {{repair.brand}} {{repair.model}}\nIssue: {{repair.issue}}\nStatus: {{repair.status}}\n\n{{/if}}---\n{{company.name}}\n{{company.address}}\n\nUnsubscribe: {{system.unsubscribe_url}}`,
      version: 1,
      template_type: 'transactional',
      category: 'repair',
      variables: {
        'user.first_name': { type: 'string', required: true },
        'repair.brand': { type: 'string', required: false },
        'repair.model': { type: 'string', required: false },
        'repair.issue': { type: 'string', required: false },
        'repair.status': { type: 'string', required: false }
      },
      personalization_rules: {},
      is_active: true
    };
  }

  async applyPersonalization(template, data) {
    if (!this.options.enablePersonalization) {
      return template;
    }

    let personalizedTemplate = { ...template };

    // Apply time-based personalization
    const hour = new Date().getHours();
    let greeting = 'Hello';
    if (hour < 12) greeting = 'Good morning';
    else if (hour < 17) greeting = 'Good afternoon';
    else greeting = 'Good evening';

    // Replace greeting placeholder
    personalizedTemplate.html_template = personalizedTemplate.html_template.replace(
      /\{\{greeting\}\}/g, 
      greeting
    );
    personalizedTemplate.text_template = personalizedTemplate.text_template?.replace(
      /\{\{greeting\}\}/g, 
      greeting
    );

    // Apply customer segment personalization
    if (data.customer_segment) {
      const segment = data.customer_segment;
      if (segment === 'premium') {
        personalizedTemplate.html_template = personalizedTemplate.html_template.replace(
          '{{user.first_name}}',
          `{{user.first_name}} <span style="color: gold;">⭐ Premium Customer</span>`
        );
      }
    }

    return personalizedTemplate;
  }

  async processVariables(content, data) {
    if (!content) return '';

    let processedContent = content;

    // Process simple variables like {{variable.path}}
    const simpleVariableRegex = /\{\{([^}#\/\s]+)\}\}/g;
    processedContent = processedContent.replace(simpleVariableRegex, (match, variable) => {
      return this.resolveVariable(variable.trim(), data);
    });

    // Process conditional blocks like {{#if condition}}...{{/if}}
    const conditionalRegex = /\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
    processedContent = processedContent.replace(conditionalRegex, (match, condition, content) => {
      const value = this.resolveVariable(condition.trim(), data);
      return value ? content : '';
    });

    // Process loops like {{#each items}}...{{/each}}
    const loopRegex = /\{\{#each\s+([^}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g;
    processedContent = processedContent.replace(loopRegex, (match, arrayPath, loopContent) => {
      const array = this.resolveVariable(arrayPath.trim(), data);
      if (!Array.isArray(array)) return '';
      
      return array.map(item => {
        let itemContent = loopContent;
        // Replace {{this}} with current item
        itemContent = itemContent.replace(/\{\{this\}\}/g, item);
        // Replace {{@index}} with current index
        const index = array.indexOf(item);
        itemContent = itemContent.replace(/\{\{@index\}\}/g, index);
        return itemContent;
      }).join('');
    });

    return processedContent;
  }

  resolveVariable(variablePath, data) {
    // Check if it's a built-in processor
    const [category] = variablePath.split('.');
    if (this.variableProcessors.has(category)) {
      const processor = this.variableProcessors.get(category);
      return processor(data, variablePath);
    }

    // Navigate object path
    const pathSegments = variablePath.split('.');
    let value = data;
    
    for (const segment of pathSegments) {
      if (value && typeof value === 'object' && segment in value) {
        value = value[segment];
      } else {
        return '';
      }
    }

    return value || '';
  }

  async addTracking(content, data, options) {
    if (!this.options.enableTracking) {
      return content;
    }

    const trackingPixel = options.trackingPixel || this.generateTrackingPixel(data);
    const unsubscribeUrl = options.unsubscribeUrl || this.generateUnsubscribeUrl(data);
    const preferencesUrl = options.preferencesUrl || this.generatePreferencesUrl(data);

    // Add tracking data to context
    const trackingData = {
      ...data,
      tracking_pixel: trackingPixel,
      unsubscribe_url: unsubscribeUrl,
      preferences_url: preferencesUrl
    };

    return {
      html: await this.processVariables(content.html_template, trackingData),
      text: await this.processVariables(content.text_template, trackingData)
    };
  }

  generateTrackingPixel(data) {
    const emailId = data.email_send_id || 'unknown';
    return `<img src="https://revivatech.co.uk/api/email/track/open/${emailId}" width="1" height="1" style="display:none;" alt="">`;
  }

  generateUnsubscribeUrl(data) {
    const token = data.unsubscribe_token || 'token';
    return `https://revivatech.co.uk/unsubscribe?token=${token}`;
  }

  generatePreferencesUrl(data) {
    const token = data.preference_token || 'token';
    return `https://revivatech.co.uk/email-preferences?token=${token}`;
  }

  async checkCompliance(template, data) {
    const allIssues = [];

    for (const [checkerName, checker] of this.complianceCheckers) {
      try {
        const issues = checker(template.html_template, data);
        allIssues.push(...issues.map(issue => `${checkerName}: ${issue}`));
      } catch (error) {
        console.error(`❌ Compliance checker ${checkerName} failed:`, error);
      }
    }

    return allIssues;
  }

  async preloadTemplates() {
    // This would fetch commonly used templates from database
    console.log('📋 Preloading email templates into cache...');
    
    // Mock preload - replace with actual DB queries
    const commonTemplates = ['welcome', 'booking_confirmation', 'repair_update'];
    
    for (const templateId of commonTemplates) {
      try {
        await this.getTemplate(templateId);
      } catch (error) {
        console.warn(`⚠️ Failed to preload template ${templateId}:`, error.message);
      }
    }
  }

  // Template management methods
  async createTemplate(templateData) {
    // Validate template
    const validation = await this.validateTemplate(templateData);
    if (!validation.valid) {
      throw new Error(`Template validation failed: ${validation.errors.join(', ')}`);
    }

    // Check compliance
    const complianceIssues = await this.checkCompliance(templateData, {});
    if (complianceIssues.length > 0 && this.options.complianceMode === 'strict') {
      throw new Error(`Compliance issues: ${complianceIssues.join(', ')}`);
    }

    // Save to database (mock implementation)
    const template = {
      ...templateData,
      id: Date.now(), // Mock ID
      version: 1,
      created_at: new Date(),
      updated_at: new Date(),
      usage_count: 0
    };

    // Clear cache for this template if it exists
    if (this.templateCache.has(template.id)) {
      this.templateCache.delete(template.id);
    }

    return template;
  }

  async validateTemplate(templateData) {
    const errors = [];

    // Required fields
    if (!templateData.name) errors.push('Template name is required');
    if (!templateData.subject) errors.push('Subject is required');
    if (!templateData.html_template) errors.push('HTML template is required');
    if (!templateData.category) errors.push('Category is required');

    // Template syntax validation
    try {
      await this.processVariables(templateData.html_template, {});
    } catch (error) {
      errors.push(`HTML template syntax error: ${error.message}`);
    }

    if (templateData.text_template) {
      try {
        await this.processVariables(templateData.text_template, {});
      } catch (error) {
        errors.push(`Text template syntax error: ${error.message}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async getTemplatePreview(templateId, sampleData = {}) {
    const defaultSampleData = {
      user: {
        first_name: 'John',
        name: 'John Doe',
        email: 'john.doe@example.com'
      },
      repair: {
        id: 'R123',
        brand: 'Apple',
        model: 'MacBook Pro 13"',
        issue: 'Screen replacement',
        status: 'In Progress'
      },
      booking: {
        id: 'B456',
        service_type: 'Screen Repair',
        appointment_date: '2025-07-20',
        time_slot: '10:00 AM'
      }
    };

    const mergedData = { ...defaultSampleData, ...sampleData };
    return await this.renderTemplate(templateId, mergedData, { preview: true });
  }

  // Performance and monitoring
  getMetrics() {
    return {
      cacheSize: this.templateCache.size,
      maxCacheSize: this.options.maxCacheSize,
      cacheHitRate: this.calculateCacheHitRate(),
      templateProcessors: this.variableProcessors.size,
      complianceCheckers: this.complianceCheckers.size
    };
  }

  calculateCacheHitRate() {
    // This would be implemented with actual hit/miss tracking
    return 0.85; // Mock 85% hit rate
  }

  clearCache() {
    this.templateCache.clear();
    console.log('📋 Template cache cleared');
  }

  // A/B Testing support
  async renderABTestTemplate(campaignId, data = {}, options = {}) {
    // Get A/B test configuration for campaign
    const abConfig = await this.getABTestConfig(campaignId);
    
    if (!abConfig || !abConfig.enabled) {
      return await this.renderTemplate(abConfig.default_template_id, data, options);
    }

    // Determine which variant to show
    const variant = this.selectABVariant(abConfig, data);
    const templateId = variant === 'A' ? abConfig.template_a_id : abConfig.template_b_id;

    const result = await this.renderTemplate(templateId, data, options);
    
    // Add A/B test metadata
    result.metadata.abTest = {
      campaignId,
      variant,
      templateId
    };

    return result;
  }

  selectABVariant(abConfig, data) {
    // Use user ID for consistent assignment
    const userId = data.user?.id || data.email_address || Math.random();
    const hash = this.hashString(userId.toString());
    const percentage = (hash % 100) / 100;
    
    return percentage < abConfig.split_percentage ? 'A' : 'B';
  }

  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  async getABTestConfig(campaignId) {
    // Mock A/B test configuration
    return {
      enabled: true,
      campaign_id: campaignId,
      template_a_id: 'template_a',
      template_b_id: 'template_b',
      split_percentage: 0.5,
      default_template_id: 'template_a'
    };
  }
}

module.exports = EmailTemplateEngine;