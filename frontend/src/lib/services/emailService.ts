import nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

// Email service configuration
export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

// Email template types
export type EmailTemplate = 
  | 'booking-confirmation'
  | 'payment-confirmation'
  | 'repair-status-update'
  | 'password-reset'
  | 'email-verification'
  | 'invoice';

// Email data interfaces
export interface EmailData {
  to: string;
  subject: string;
  template: EmailTemplate;
  data: Record<string, any>;
}

// Queue item interface
export interface EmailQueueItem extends EmailData {
  id: string;
  attempts: number;
  createdAt: Date;
  lastAttempt?: Date;
  error?: string;
  status: 'pending' | 'sending' | 'sent' | 'failed';
}

class EmailService {
  private transporter: Transporter<SMTPTransport.SentMessageInfo> | null = null;
  private config: EmailConfig;
  private queue: EmailQueueItem[] = [];
  private isProcessing: boolean = false;

  constructor() {
    this.config = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
      },
      from: process.env.SMTP_FROM_EMAIL || process.env.FROM_EMAIL || 'noreply@revivatech.co.uk'
    };

    this.initializeTransporter();
  }

  private async initializeTransporter() {
    try {
      // Only initialize if SMTP credentials are provided
      if (!this.config.auth.user || !this.config.auth.pass) {
        console.warn('⚠️ SMTP credentials not configured. Email service will log emails instead of sending.');
        this.transporter = null;
        return;
      }

      this.transporter = nodemailer.createTransporter({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
        auth: this.config.auth,
        tls: {
          rejectUnauthorized: process.env.NODE_ENV === 'production'
        },
        // Connection timeout
        connectionTimeout: 60000,
        greetingTimeout: 30000,
        socketTimeout: 60000
      });

      // Verify transporter configuration
      try {
        await this.transporter.verify();
        console.log('✅ Email service ready to send emails');
      } catch (error) {
        console.error('❌ Email transporter verification failed:', error);
        this.transporter = null;
      }
    } catch (error) {
      console.error('❌ Failed to initialize email transporter:', error);
      this.transporter = null;
    }
  }

  // Add email to queue
  public async queueEmail(emailData: EmailData): Promise<string> {
    const queueItem: EmailQueueItem = {
      ...emailData,
      id: this.generateId(),
      attempts: 0,
      createdAt: new Date(),
      status: 'pending'
    };

    this.queue.push(queueItem);
    
    // Start processing if not already running
    if (!this.isProcessing) {
      this.processQueue();
    }

    return queueItem.id;
  }

  // Process email queue
  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const item = this.queue.find(i => i.status === 'pending');
      if (!item) break;

      item.status = 'sending';
      item.attempts++;
      item.lastAttempt = new Date();

      try {
        const html = await this.renderTemplate(item.template, item.data);
        await this.sendEmail({
          to: item.to,
          subject: item.subject,
          html
        });

        item.status = 'sent';
        // Remove from queue after successful send
        this.queue = this.queue.filter(i => i.id !== item.id);
        
        // Log success
        console.log(`Email sent successfully: ${item.id} to ${item.to}`);
      } catch (error) {
        item.error = error instanceof Error ? error.message : 'Unknown error';
        
        if (item.attempts >= 3) {
          item.status = 'failed';
          console.error(`Email failed after 3 attempts: ${item.id}`, error);
          // Remove from queue after max attempts
          this.queue = this.queue.filter(i => i.id !== item.id);
        } else {
          item.status = 'pending';
          console.warn(`Email attempt ${item.attempts} failed: ${item.id}`, error);
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 5000 * item.attempts));
        }
      }
    }

    this.isProcessing = false;
  }

  // Send email immediately (bypasses queue)
  private async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    // If no transporter, log email instead
    if (!this.transporter) {
      console.log('=== EMAIL SENT (LOGGED - NO SMTP) ===');
      console.log(`From: ${this.config.from}`);
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`HTML Preview: ${options.html.substring(0, 200)}...`);
      console.log('=== END EMAIL ===');
      return;
    }

    const mailOptions = {
      from: {
        name: 'RevivaTech',
        address: this.config.from
      },
      to: options.to,
      subject: options.subject,
      html: options.html,
      // Add text version for better compatibility
      text: this.htmlToText(options.html),
      // Email headers for tracking
      headers: {
        'X-Mailer': 'RevivaTech Email Service v1.0',
        'X-Priority': '3'
      }
    };

    const info = await this.transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully. Message ID: ${info.messageId}`);
  }

  // Convert HTML to plain text (basic implementation)
  private htmlToText(html: string): string {
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
      .replace(/&amp;/g, '&') // Replace &amp; with &
      .replace(/&lt;/g, '<') // Replace &lt; with <
      .replace(/&gt;/g, '>') // Replace &gt; with >
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
  }

  // Render email template
  private async renderTemplate(template: EmailTemplate, data: Record<string, any>): Promise<string> {
    try {
      // Import the appropriate template renderer based on template type
      switch (template) {
        case 'booking-confirmation': {
          const { render } = await import('./emailTemplates/booking-confirmation');
          return render(data);
        }
        case 'payment-confirmation': {
          const { render } = await import('./emailTemplates/payment-confirmation');
          return render(data);
        }
        case 'repair-status-update': {
          const { render } = await import('./emailTemplates/repair-status-update');
          return render(data);
        }
        case 'password-reset': {
          const { render } = await import('./emailTemplates/password-reset');
          return render(data);
        }
        case 'email-verification': {
          const { render } = await import('./emailTemplates/email-verification');
          return render(data);
        }
        case 'invoice': {
          const { render } = await import('./emailTemplates/invoice');
          return render(data);
        }
        default:
          throw new Error(`Unknown email template: ${template}`);
      }
    } catch (error) {
      console.error(`Failed to render template ${template}:`, error);
      throw new Error(`Template rendering failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Generate unique ID
  private generateId(): string {
    return `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get queue status
  public getQueueStatus(): {
    total: number;
    pending: number;
    sending: number;
    failed: number;
    smtpConfigured: boolean;
    smtpReady: boolean;
  } {
    return {
      total: this.queue.length,
      pending: this.queue.filter(i => i.status === 'pending').length,
      sending: this.queue.filter(i => i.status === 'sending').length,
      failed: this.queue.filter(i => i.status === 'failed').length,
      smtpConfigured: !!(this.config.auth.user && this.config.auth.pass),
      smtpReady: this.transporter !== null
    };
  }

  // Test SMTP connection
  public async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.transporter) {
        return {
          success: false,
          error: 'SMTP not configured or transporter failed to initialize'
        };
      }

      await this.transporter.verify();
      return { success: true };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Send test email
  public async sendTestEmail(to: string): Promise<{ success: boolean; error?: string }> {
    try {
      const testEmailData: EmailData = {
        to,
        subject: 'RevivaTech Email Service Test',
        template: 'booking-confirmation',
        data: {
          customerName: 'Test Customer',
          bookingReference: 'TEST-' + Date.now(),
          device: {
            brand: 'Apple',
            model: 'MacBook Pro 2023',
            issues: ['Screen cracked', 'Battery issues']
          },
          service: {
            type: 'Screen Replacement + Battery',
            urgency: 'Standard',
            estimatedCost: 299.99,
            estimatedDays: 3
          },
          nextSteps: [
            'We will contact you within 2 hours to confirm your appointment',
            'Bring your device to our Bournemouth location',
            'Our technician will perform a free diagnostic',
            'You will receive a detailed quote before any work begins'
          ]
        }
      };

      const html = await this.renderTemplate(testEmailData.template, testEmailData.data);
      await this.sendEmail({
        to: testEmailData.to,
        subject: testEmailData.subject,
        html
      });

      return { success: true };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Send immediate email (public method for urgent emails)
  public async sendImmediate(emailData: EmailData): Promise<{ success: boolean; error?: string }> {
    try {
      const html = await this.renderTemplate(emailData.template, emailData.data);
      await this.sendEmail({
        to: emailData.to,
        subject: emailData.subject,
        html
      });

      return { success: true };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Retry failed emails
  public retryFailed(): void {
    this.queue.forEach(item => {
      if (item.status === 'failed') {
        item.status = 'pending';
        item.attempts = 0;
        item.error = undefined;
      }
    });

    if (!this.isProcessing) {
      this.processQueue();
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();