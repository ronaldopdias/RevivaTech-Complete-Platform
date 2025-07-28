import { emailService } from './emailService';

export interface SMTPConfiguration {
  provider: 'gmail' | 'outlook' | 'sendgrid' | 'ses' | 'custom';
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: {
    email: string;
    name: string;
  };
  testConnection?: boolean;
  enabled: boolean;
}

export interface EmailConfigStatus {
  configured: boolean;
  connected: boolean;
  lastTest?: string;
  error?: string;
  provider?: string;
  queueStatus: {
    total: number;
    pending: number;
    sending: number;
    failed: number;
  };
}

// SMTP Provider Presets
export const SMTP_PROVIDERS = {
  gmail: {
    name: 'Gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    instructions: 'Use your Gmail address and App Password (not regular password). Enable 2FA first.',
    setupUrl: 'https://myaccount.google.com/apppasswords'
  },
  outlook: {
    name: 'Outlook/Hotmail',
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false,
    instructions: 'Use your Outlook/Hotmail email and password.',
    setupUrl: 'https://support.microsoft.com/en-us/office/pop-imap-and-smtp-settings-for-outlook-com-d088b986-291d-42b8-9564-9c329d6d1c8b'
  },
  sendgrid: {
    name: 'SendGrid',
    host: 'smtp.sendgrid.net',
    port: 587,
    secure: false,
    instructions: 'Use "apikey" as username and your API key as password.',
    setupUrl: 'https://docs.sendgrid.com/for-developers/sending-email/smtp-api-tutorial'
  },
  ses: {
    name: 'Amazon SES',
    host: 'email-smtp.eu-west-1.amazonaws.com',
    port: 587,
    secure: false,
    instructions: 'Use your SES SMTP credentials (not AWS access keys).',
    setupUrl: 'https://docs.aws.amazon.com/ses/latest/dg/smtp-credentials.html'
  },
  custom: {
    name: 'Custom SMTP',
    host: '',
    port: 587,
    secure: false,
    instructions: 'Configure your own SMTP server settings.',
    setupUrl: ''
  }
} as const;

class EmailConfigService {
  private config: SMTPConfiguration | null = null;
  
  /**
   * Get current email configuration status
   */
  async getStatus(): Promise<EmailConfigStatus> {
    try {
      // Get queue status from email service
      const queueStatus = emailService.getQueueStatus();
      
      // Test connection if configured
      let connected = false;
      let error: string | undefined;
      
      if (queueStatus.smtpConfigured) {
        const testResult = await emailService.testConnection();
        connected = testResult.success;
        error = testResult.error;
      }
      
      return {
        configured: queueStatus.smtpConfigured,
        connected,
        error,
        provider: this.config?.provider,
        lastTest: new Date().toISOString(),
        queueStatus: {
          total: queueStatus.total,
          pending: queueStatus.pending,
          sending: queueStatus.sending,
          failed: queueStatus.failed
        }
      };
    } catch (error) {
      console.error('Failed to get email status:', error);
      return {
        configured: false,
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        queueStatus: {
          total: 0,
          pending: 0,
          sending: 0,
          failed: 0
        }
      };
    }
  }
  
  /**
   * Validate SMTP configuration
   */
  async validateSMTPConfig(config: SMTPConfiguration): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    // Basic validation
    if (!config.host?.trim()) {
      errors.push('SMTP host is required');
    }
    
    if (!config.port || config.port < 1 || config.port > 65535) {
      errors.push('Valid SMTP port (1-65535) is required');
    }
    
    if (!config.auth.user?.trim()) {
      errors.push('SMTP username is required');
    }
    
    if (!config.auth.pass?.trim()) {
      errors.push('SMTP password is required');
    }
    
    if (!config.from.email?.trim()) {
      errors.push('From email is required');
    } else {
      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(config.from.email)) {
        errors.push('From email must be a valid email address');
      }
    }
    
    if (!config.from.name?.trim()) {
      errors.push('From name is required');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Test SMTP connection with given configuration
   */
  async testSMTPConnection(config: SMTPConfiguration): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate configuration first
      const validation = await this.validateSMTPConfig(config);
      if (!validation.valid) {
        return {
          success: false,
          error: `Configuration invalid: ${validation.errors.join(', ')}`
        };
      }
      
      // Set environment variables temporarily for testing
      const originalEnv = {
        SMTP_HOST: process.env.SMTP_HOST,
        SMTP_PORT: process.env.SMTP_PORT,
        SMTP_SECURE: process.env.SMTP_SECURE,
        SMTP_USER: process.env.SMTP_USER,
        SMTP_PASS: process.env.SMTP_PASS,
        SMTP_FROM_EMAIL: process.env.SMTP_FROM_EMAIL,
        FROM_EMAIL: process.env.FROM_EMAIL
      };
      
      // Apply test configuration
      process.env.SMTP_HOST = config.host;
      process.env.SMTP_PORT = config.port.toString();
      process.env.SMTP_SECURE = config.secure.toString();
      process.env.SMTP_USER = config.auth.user;
      process.env.SMTP_PASS = config.auth.pass;
      process.env.SMTP_FROM_EMAIL = config.from.email;
      process.env.FROM_EMAIL = config.from.email;
      
      // Test connection
      const result = await emailService.testConnection();
      
      // Restore original environment
      Object.entries(originalEnv).forEach(([key, value]) => {
        if (value !== undefined) {
          process.env[key] = value;
        } else {
          delete process.env[key];
        }
      });
      
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Send test email using current or provided configuration
   */
  async sendTestEmail(to: string, config?: SMTPConfiguration): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate email address
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(to)) {
        return {
          success: false,
          error: 'Invalid email address'
        };
      }
      
      if (config) {
        // Test with provided configuration
        const validation = await this.validateSMTPConfig(config);
        if (!validation.valid) {
          return {
            success: false,
            error: `Configuration invalid: ${validation.errors.join(', ')}`
          };
        }
        
        // Apply configuration temporarily
        await this.applySMTPConfig(config, false); // Don't save permanently
      }
      
      // Send test email
      const result = await emailService.sendTestEmail(to);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Apply SMTP configuration to the email service
   */
  async applySMTPConfig(config: SMTPConfiguration, permanent: boolean = true): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate configuration
      const validation = await this.validateSMTPConfig(config);
      if (!validation.valid) {
        return {
          success: false,
          error: `Configuration invalid: ${validation.errors.join(', ')}`
        };
      }
      
      if (permanent) {
        // Store configuration for permanent use
        this.config = { ...config };
        
        // In production, you would save to database or persistent storage
        console.log('📧 SMTP Configuration applied:', {
          provider: config.provider,
          host: config.host,
          port: config.port,
          secure: config.secure,
          user: config.auth.user,
          from: config.from.email,
          enabled: config.enabled
        });
        
        // Save to environment variables (would be persistent storage in production)
        this.saveToEnvironment(config);
      } else {
        // Temporary configuration for testing
        this.saveToEnvironment(config);
      }
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Save configuration to environment variables
   */
  private saveToEnvironment(config: SMTPConfiguration): void {
    process.env.SMTP_HOST = config.host;
    process.env.SMTP_PORT = config.port.toString();
    process.env.SMTP_SECURE = config.secure.toString();
    process.env.SMTP_USER = config.auth.user;
    process.env.SMTP_PASS = config.auth.pass;
    process.env.SMTP_FROM_EMAIL = config.from.email;
    process.env.FROM_EMAIL = config.from.email;
    process.env.BUSINESS_NAME = config.from.name;
    process.env.ENABLE_EMAIL_SENDING = config.enabled.toString();
  }
  
  /**
   * Get configuration for a specific provider
   */
  getProviderConfig(provider: keyof typeof SMTP_PROVIDERS): Partial<SMTPConfiguration> {
    const providerInfo = SMTP_PROVIDERS[provider];
    return {
      provider,
      host: providerInfo.host,
      port: providerInfo.port,
      secure: providerInfo.secure,
      enabled: true
    };
  }
  
  /**
   * Configure default SMTP (Gmail setup)
   */
  async configureDefaultSMTP(): Promise<SMTPConfiguration> {
    const defaultConfig: SMTPConfiguration = {
      provider: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: '',
        pass: ''
      },
      from: {
        email: 'noreply@revivatech.co.uk',
        name: 'RevivaTech'
      },
      enabled: false // Disabled until credentials are provided
    };
    
    return defaultConfig;
  }
  
  /**
   * Retry failed emails in queue
   */
  retryFailedEmails(): void {
    emailService.retryFailed();
  }
  
  /**
   * Get email queue information
   */
  getQueueInfo() {
    return emailService.getQueueStatus();
  }
}

// Export singleton instance
export const emailConfigService = new EmailConfigService();
export default emailConfigService;