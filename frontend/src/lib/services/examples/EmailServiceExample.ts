/**
 * Email Service Example - Demonstrates Service Abstraction Layer Usage
 * 
 * This example shows how to implement a service using the Service Abstraction Layer
 * with proper error handling, configuration, and health monitoring.
 */

import { AbstractService, ServiceAbstractionConfig, ServiceType } from '../serviceAbstraction';
import { ServiceHealthCheck, ApiResponse } from '../types';

// =============================================================================
// Email Service Configuration
// =============================================================================

export interface EmailServiceConfig extends ServiceAbstractionConfig {
  type: 'EMAIL';
  options: {
    provider: 'smtp' | 'sendgrid' | 'mailgun' | 'ses';
    host?: string;
    port?: number;
    secure?: boolean;
    auth?: {
      user: string;
      pass: string;
    };
    apiKey?: string;
    domain?: string;
    region?: string;
    from: string;
    replyTo?: string;
    templates?: {
      welcome: string;
      passwordReset: string;
      booking: string;
      invoice: string;
    };
    rateLimits?: {
      perMinute: number;
      perHour: number;
      perDay: number;
    };
  };
}

export interface EmailMessage {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: EmailAttachment[];
  templateId?: string;
  templateData?: Record<string, any>;
  priority?: 'low' | 'normal' | 'high';
  scheduled?: Date;
  metadata?: Record<string, any>;
}

export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType: string;
  size?: number;
  cid?: string;
}

export interface EmailResult {
  messageId: string;
  accepted: string[];
  rejected: string[];
  pending: string[];
  response: string;
  envelope: {
    from: string;
    to: string[];
  };
}

// =============================================================================
// Email Service Implementation
// =============================================================================

export class EmailService extends AbstractService {
  private config: EmailServiceConfig;
  private connection: any; // Would be actual email service connection
  private rateLimitCounter: Map<string, number> = new Map();
  private lastResetTime: Date = new Date();

  constructor(config: EmailServiceConfig) {
    super(config);
    this.config = config;
    this.validateConfiguration();
  }

  // =============================================================================
  // Lifecycle Methods
  // =============================================================================

  protected async doConnect(): Promise<boolean> {
    try {
      this.log('info', 'Connecting to email service', { provider: this.config.options.provider });
      
      // Simulate connection based on provider
      switch (this.config.options.provider) {
        case 'smtp':
          await this.connectSMTP();
          break;
        case 'sendgrid':
          await this.connectSendGrid();
          break;
        case 'mailgun':
          await this.connectMailgun();
          break;
        case 'ses':
          await this.connectSES();
          break;
        default:
          throw new Error(`Unsupported email provider: ${this.config.options.provider}`);
      }
      
      this.log('info', 'Email service connected successfully');
      return true;
    } catch (error) {
      this.log('error', 'Failed to connect to email service', { error: error.message });
      throw error;
    }
  }

  protected async doDisconnect(): Promise<void> {
    try {
      this.log('info', 'Disconnecting from email service');
      
      if (this.connection) {
        // Simulate disconnection
        await new Promise(resolve => setTimeout(resolve, 100));
        this.connection = null;
      }
      
      this.log('info', 'Email service disconnected');
    } catch (error) {
      this.log('error', 'Error disconnecting from email service', { error: error.message });
      throw error;
    }
  }

  protected async doHealthCheck(): Promise<ServiceHealthCheck> {
    const startTime = Date.now();
    
    try {
      // Simulate health check
      await this.pingEmailService();
      
      const responseTime = Date.now() - startTime;
      
      return {
        service: this.config.name,
        status: 'healthy',
        responseTime,
        timestamp: new Date(),
        metadata: {
          provider: this.config.options.provider,
          connected: !!this.connection,
          rateLimitStatus: this.getRateLimitStatus()
        }
      };
    } catch (error) {
      return {
        service: this.config.name,
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        timestamp: new Date(),
        error: error.message,
        metadata: {
          provider: this.config.options.provider,
          connected: false
        }
      };
    }
  }

  // =============================================================================
  // Email Operations
  // =============================================================================

  async sendEmail(message: EmailMessage): Promise<EmailResult> {
    return await this.withCircuitBreaker(async () => {
      return await this.withTimeout(async () => {
        return await this.withRetry(async () => {
          // Check rate limits
          await this.checkRateLimit();
          
          // Validate message
          this.validateMessage(message);
          
          // Send email
          return await this.doSendEmail(message);
        });
      });
    });
  }

  async sendBulkEmail(messages: EmailMessage[]): Promise<EmailResult[]> {
    return await this.withCircuitBreaker(async () => {
      const results: EmailResult[] = [];
      
      for (const message of messages) {
        try {
          const result = await this.sendEmail(message);
          results.push(result);
        } catch (error) {
          this.log('error', 'Failed to send email in bulk operation', { 
            error: error.message,
            to: message.to 
          });
          
          // Create error result
          results.push({
            messageId: '',
            accepted: [],
            rejected: Array.isArray(message.to) ? message.to : [message.to],
            pending: [],
            response: `Error: ${error.message}`,
            envelope: {
              from: this.config.options.from,
              to: Array.isArray(message.to) ? message.to : [message.to]
            }
          });
        }
      }
      
      return results;
    });
  }

  async sendTemplate(
    templateId: string,
    to: string | string[],
    data: Record<string, any>,
    options?: Partial<EmailMessage>
  ): Promise<EmailResult> {
    const message: EmailMessage = {
      to,
      subject: options?.subject || 'Notification',
      templateId,
      templateData: data,
      ...options
    };
    
    return await this.sendEmail(message);
  }

  async getTemplate(templateId: string): Promise<any> {
    return await this.withCircuitBreaker(async () => {
      // Simulate template retrieval
      const templates = this.config.options.templates || {};
      const template = templates[templateId as keyof typeof templates];
      
      if (!template) {
        throw new Error(`Template not found: ${templateId}`);
      }
      
      return {
        id: templateId,
        content: template,
        lastModified: new Date(),
        variables: this.extractTemplateVariables(template)
      };
    });
  }

  async validateEmailAddress(email: string): Promise<boolean> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // =============================================================================
  // Provider-Specific Connection Methods
  // =============================================================================

  private async connectSMTP(): Promise<void> {
    const { host, port, secure, auth } = this.config.options;
    
    if (!host || !auth) {
      throw new Error('SMTP configuration incomplete');
    }
    
    // Simulate SMTP connection
    this.connection = {
      type: 'smtp',
      host,
      port: port || (secure ? 465 : 587),
      secure: secure || false,
      auth
    };
  }

  private async connectSendGrid(): Promise<void> {
    const { apiKey } = this.config.options;
    
    if (!apiKey) {
      throw new Error('SendGrid API key required');
    }
    
    // Simulate SendGrid connection
    this.connection = {
      type: 'sendgrid',
      apiKey
    };
  }

  private async connectMailgun(): Promise<void> {
    const { apiKey, domain } = this.config.options;
    
    if (!apiKey || !domain) {
      throw new Error('Mailgun API key and domain required');
    }
    
    // Simulate Mailgun connection
    this.connection = {
      type: 'mailgun',
      apiKey,
      domain
    };
  }

  private async connectSES(): Promise<void> {
    const { region, apiKey } = this.config.options;
    
    if (!region || !apiKey) {
      throw new Error('AWS SES region and credentials required');
    }
    
    // Simulate SES connection
    this.connection = {
      type: 'ses',
      region,
      apiKey
    };
  }

  // =============================================================================
  // Email Sending Implementation
  // =============================================================================

  private async doSendEmail(message: EmailMessage): Promise<EmailResult> {
    if (!this.connection) {
      throw new Error('Email service not connected');
    }
    
    this.log('info', 'Sending email', { 
      to: message.to,
      subject: message.subject,
      provider: this.config.options.provider
    });
    
    // Simulate email sending
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Create result
    const toArray = Array.isArray(message.to) ? message.to : [message.to];
    const messageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const result: EmailResult = {
      messageId,
      accepted: toArray,
      rejected: [],
      pending: [],
      response: `Email sent successfully via ${this.config.options.provider}`,
      envelope: {
        from: this.config.options.from,
        to: toArray
      }
    };
    
    this.log('info', 'Email sent successfully', { messageId, to: message.to });
    
    // Increment rate limit counter
    this.incrementRateLimit();
    
    return result;
  }

  private async pingEmailService(): Promise<void> {
    if (!this.connection) {
      throw new Error('Email service not connected');
    }
    
    // Simulate ping
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  // =============================================================================
  // Rate Limiting
  // =============================================================================

  private async checkRateLimit(): Promise<void> {
    const rateLimits = this.config.options.rateLimits;
    if (!rateLimits) {
      return;
    }
    
    const now = new Date();
    const minutesSinceReset = (now.getTime() - this.lastResetTime.getTime()) / (1000 * 60);
    
    // Reset counter if it's been more than an hour
    if (minutesSinceReset >= 60) {
      this.rateLimitCounter.clear();
      this.lastResetTime = now;
    }
    
    const currentCount = this.rateLimitCounter.get('total') || 0;
    
    if (currentCount >= rateLimits.perMinute) {
      throw new Error('Rate limit exceeded: too many emails per minute');
    }
  }

  private incrementRateLimit(): void {
    const current = this.rateLimitCounter.get('total') || 0;
    this.rateLimitCounter.set('total', current + 1);
  }

  private getRateLimitStatus(): any {
    const rateLimits = this.config.options.rateLimits;
    if (!rateLimits) {
      return { enabled: false };
    }
    
    const current = this.rateLimitCounter.get('total') || 0;
    return {
      enabled: true,
      current,
      limit: rateLimits.perMinute,
      remaining: Math.max(0, rateLimits.perMinute - current)
    };
  }

  // =============================================================================
  // Validation Methods
  // =============================================================================

  private validateConfiguration(): void {
    if (!this.config.options.provider) {
      throw new Error('Email provider is required');
    }
    
    if (!this.config.options.from) {
      throw new Error('From email address is required');
    }
    
    const provider = this.config.options.provider;
    
    switch (provider) {
      case 'smtp':
        if (!this.config.options.host || !this.config.options.auth) {
          throw new Error('SMTP requires host and auth configuration');
        }
        break;
      case 'sendgrid':
        if (!this.config.options.apiKey) {
          throw new Error('SendGrid requires API key');
        }
        break;
      case 'mailgun':
        if (!this.config.options.apiKey || !this.config.options.domain) {
          throw new Error('Mailgun requires API key and domain');
        }
        break;
      case 'ses':
        if (!this.config.options.apiKey || !this.config.options.region) {
          throw new Error('AWS SES requires API key and region');
        }
        break;
    }
  }

  private validateMessage(message: EmailMessage): void {
    if (!message.to) {
      throw new Error('Recipient email address is required');
    }
    
    if (!message.subject) {
      throw new Error('Email subject is required');
    }
    
    if (!message.text && !message.html && !message.templateId) {
      throw new Error('Email content is required (text, html, or templateId)');
    }
    
    // Validate email addresses
    const toArray = Array.isArray(message.to) ? message.to : [message.to];
    for (const email of toArray) {
      if (!this.validateEmailAddress(email)) {
        throw new Error(`Invalid email address: ${email}`);
      }
    }
  }

  private extractTemplateVariables(template: string): string[] {
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const variables: string[] = [];
    let match;
    
    while ((match = variableRegex.exec(template)) !== null) {
      variables.push(match[1].trim());
    }
    
    return [...new Set(variables)];
  }
}

// =============================================================================
// Factory Registration Helper
// =============================================================================

export function createEmailService(config: Partial<EmailServiceConfig>): EmailService {
  const fullConfig: EmailServiceConfig = {
    id: config.id || 'email-service',
    type: 'EMAIL',
    name: config.name || 'Email Service',
    description: config.description || 'Email service for sending notifications',
    enabled: config.enabled !== false,
    priority: config.priority || 1,
    timeout: config.timeout || 30000,
    retryAttempts: config.retryAttempts || 3,
    retryDelay: config.retryDelay || 1000,
    circuitBreakerThreshold: config.circuitBreakerThreshold || 5,
    healthCheckInterval: config.healthCheckInterval || 60000,
    environment: config.environment || 'development',
    version: config.version || '1.0.0',
    createdAt: new Date(),
    updatedAt: new Date(),
    options: {
      provider: 'smtp',
      host: 'localhost',
      port: 587,
      secure: false,
      from: 'noreply@revivatech.co.uk',
      ...config.options
    }
  };
  
  return new EmailService(fullConfig);
}

export default EmailService;