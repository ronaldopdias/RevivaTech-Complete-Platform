// Production email service with SendGrid and AWS SES support
import nodemailer from 'nodemailer';
import { PrismaClient } from '../../generated/prisma';
import { z } from 'zod';

const prisma = new PrismaClient();

export type EmailTemplate = 
  | 'booking-confirmation'
  | 'payment-confirmation'
  | 'repair-status-update'
  | 'password-reset'
  | 'invoice'
  | 'welcome'
  | 'appointment-reminder'
  | 'repair-complete'
  | 'parts-arrived'
  | 'diagnostic-complete'
  | 'quote-approved'
  | 'device-ready'
  | 'feedback-request'
  | 'newsletter'
  | 'marketing-offer';

export type EmailProvider = 'sendgrid' | 'aws-ses' | 'smtp' | 'gmail';

export interface EmailData {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  template: EmailTemplate;
  data: Record<string, any>;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  scheduleAt?: Date;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface EmailQueueItem extends EmailData {
  id: string;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  scheduledAt: Date;
  lastAttempt?: Date;
  sentAt?: Date;
  error?: string;
  status: 'pending' | 'scheduled' | 'sending' | 'sent' | 'failed' | 'cancelled';
  provider: EmailProvider;
  messageId?: string;
  opens: number;
  clicks: number;
  bounced: boolean;
  complained: boolean;
}

// Configuration validation
const EmailConfigSchema = z.object({
  provider: z.enum(['sendgrid', 'aws-ses', 'smtp', 'gmail']),
  sendgrid: z.object({
    apiKey: z.string().optional(),
    fromEmail: z.string().email().optional(),
    fromName: z.string().optional(),
  }).optional(),
  awsSes: z.object({
    region: z.string().optional(),
    accessKeyId: z.string().optional(),
    secretAccessKey: z.string().optional(),
    fromEmail: z.string().email().optional(),
  }).optional(),
  smtp: z.object({
    host: z.string().optional(),
    port: z.number().optional(),
    secure: z.boolean().optional(),
    user: z.string().optional(),
    pass: z.string().optional(),
    fromEmail: z.string().email().optional(),
  }).optional(),
  gmail: z.object({
    user: z.string().email().optional(),
    pass: z.string().optional(),
    fromEmail: z.string().email().optional(),
  }).optional(),
  rateLimits: z.object({
    perSecond: z.number().default(10),
    perMinute: z.number().default(600),
    perHour: z.number().default(10000),
    perDay: z.number().default(50000),
  }).optional(),
  retryPolicy: z.object({
    maxAttempts: z.number().default(3),
    backoffMultiplier: z.number().default(2),
    initialDelay: z.number().default(1000),
  }).optional(),
});

class ProductionEmailService {
  private queue: EmailQueueItem[] = [];
  private isProcessing: boolean = false;
  private transporter: nodemailer.Transporter | null = null;
  private config: z.infer<typeof EmailConfigSchema>;
  private rateLimitTracker = {
    perSecond: { count: 0, resetAt: 0 },
    perMinute: { count: 0, resetAt: 0 },
    perHour: { count: 0, resetAt: 0 },
    perDay: { count: 0, resetAt: 0 },
  };

  constructor() {
    this.loadConfiguration();
    this.initializeTransporter();
    this.loadQueueFromDatabase();
    
    // Start queue processor
    setInterval(() => this.processQueue(), 5000);
    
    console.log(`Production Email Service initialized with provider: ${this.config.provider}`);
  }

  // Load configuration from environment variables
  private loadConfiguration() {
    const rawConfig = {
      provider: (process.env.EMAIL_PROVIDER || 'smtp') as EmailProvider,
      sendgrid: {
        apiKey: process.env.SENDGRID_API_KEY,
        fromEmail: process.env.SENDGRID_FROM_EMAIL || process.env.SMTP_FROM_EMAIL,
        fromName: process.env.SENDGRID_FROM_NAME || 'RevivaTech',
      },
      awsSes: {
        region: process.env.AWS_SES_REGION || 'eu-west-1',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        fromEmail: process.env.AWS_SES_FROM_EMAIL || process.env.SMTP_FROM_EMAIL,
      },
      smtp: {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
        fromEmail: process.env.SMTP_FROM_EMAIL,
      },
      gmail: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
        fromEmail: process.env.GMAIL_FROM_EMAIL || process.env.GMAIL_USER,
      },
      rateLimits: {
        perSecond: parseInt(process.env.EMAIL_RATE_LIMIT_PER_SECOND || '10'),
        perMinute: parseInt(process.env.EMAIL_RATE_LIMIT_PER_MINUTE || '600'),
        perHour: parseInt(process.env.EMAIL_RATE_LIMIT_PER_HOUR || '10000'),
        perDay: parseInt(process.env.EMAIL_RATE_LIMIT_PER_DAY || '50000'),
      },
      retryPolicy: {
        maxAttempts: parseInt(process.env.EMAIL_MAX_ATTEMPTS || '3'),
        backoffMultiplier: parseFloat(process.env.EMAIL_BACKOFF_MULTIPLIER || '2'),
        initialDelay: parseInt(process.env.EMAIL_INITIAL_DELAY || '1000'),
      },
    };

    this.config = EmailConfigSchema.parse(rawConfig);
  }

  // Initialize email transporter based on provider
  private async initializeTransporter() {
    try {
      switch (this.config.provider) {
        case 'sendgrid':
          if (!this.config.sendgrid?.apiKey) {
            throw new Error('SendGrid API key not configured');
          }
          this.transporter = nodemailer.createTransporter({
            service: 'SendGrid',
            auth: {
              user: 'apikey',
              pass: this.config.sendgrid.apiKey,
            },
          });
          break;

        case 'aws-ses':
          if (!this.config.awsSes?.accessKeyId || !this.config.awsSes?.secretAccessKey) {
            throw new Error('AWS SES credentials not configured');
          }
          this.transporter = nodemailer.createTransporter({
            service: 'AWS-SES',
            region: this.config.awsSes.region,
            auth: {
              user: this.config.awsSes.accessKeyId,
              pass: this.config.awsSes.secretAccessKey,
            },
          });
          break;

        case 'gmail':
          if (!this.config.gmail?.user || !this.config.gmail?.pass) {
            throw new Error('Gmail credentials not configured');
          }
          this.transporter = nodemailer.createTransporter({
            service: 'gmail',
            auth: {
              user: this.config.gmail.user,
              pass: this.config.gmail.pass,
            },
          });
          break;

        case 'smtp':
        default:
          if (!this.config.smtp?.host || !this.config.smtp?.user || !this.config.smtp?.pass) {
            throw new Error('SMTP configuration incomplete');
          }
          this.transporter = nodemailer.createTransporter({
            host: this.config.smtp.host,
            port: this.config.smtp.port,
            secure: this.config.smtp.secure,
            auth: {
              user: this.config.smtp.user,
              pass: this.config.smtp.pass,
            },
            tls: {
              rejectUnauthorized: false, // Allow self-signed certificates
            },
          });
          break;
      }

      // Verify transporter configuration
      if (this.transporter && process.env.NODE_ENV !== 'test') {
        await this.transporter.verify();
        console.log(`Email transporter verified for provider: ${this.config.provider}`);
      }
    } catch (error) {
      console.error(`Failed to initialize email transporter:`, error);
      // Fallback to console logging in development
      if (process.env.NODE_ENV === 'development') {
        console.warn('Email will be logged to console instead of sent');
      } else {
        throw error;
      }
    }
  }

  // Load existing queue items from database
  private async loadQueueFromDatabase() {
    try {
      const queueItems = await prisma.emailQueue.findMany({
        where: {
          status: { in: ['pending', 'scheduled', 'sending'] },
        },
        orderBy: { priority: 'desc' },
      });

      this.queue = queueItems.map(item => ({
        id: item.id,
        to: Array.isArray(item.to) ? item.to : [item.to as string],
        cc: item.cc ? (Array.isArray(item.cc) ? item.cc : [item.cc as string]) : undefined,
        bcc: item.bcc ? (Array.isArray(item.bcc) ? item.bcc : [item.bcc as string]) : undefined,
        subject: item.subject,
        template: item.template as EmailTemplate,
        data: item.data as Record<string, any>,
        priority: (item.priority as 'low' | 'normal' | 'high' | 'urgent') || 'normal',
        scheduleAt: item.scheduledAt,
        tags: item.tags || [],
        metadata: item.metadata as Record<string, any> || {},
        attempts: item.attempts,
        maxAttempts: item.maxAttempts,
        createdAt: item.createdAt,
        scheduledAt: item.scheduledAt,
        lastAttempt: item.lastAttempt || undefined,
        sentAt: item.sentAt || undefined,
        error: item.error || undefined,
        status: item.status as EmailQueueItem['status'],
        provider: this.config.provider,
        messageId: item.messageId || undefined,
        opens: item.opens || 0,
        clicks: item.clicks || 0,
        bounced: item.bounced || false,
        complained: item.complained || false,
      }));

      console.log(`Loaded ${this.queue.length} email items from database`);
    } catch (error) {
      console.error('Failed to load email queue from database:', error);
      this.queue = [];
    }
  }

  // Add email to queue
  public async queueEmail(emailData: EmailData): Promise<string> {
    const now = new Date();
    const queueItem: EmailQueueItem = {
      ...emailData,
      id: this.generateId(),
      attempts: 0,
      maxAttempts: this.config.retryPolicy?.maxAttempts || 3,
      createdAt: now,
      scheduledAt: emailData.scheduleAt || now,
      status: emailData.scheduleAt && emailData.scheduleAt > now ? 'scheduled' : 'pending',
      provider: this.config.provider,
      opens: 0,
      clicks: 0,
      bounced: false,
      complained: false,
      priority: emailData.priority || 'normal',
      tags: emailData.tags || [],
      metadata: emailData.metadata || {},
    };

    // Store in database
    try {
      await prisma.emailQueue.create({
        data: {
          id: queueItem.id,
          to: Array.isArray(queueItem.to) ? queueItem.to : [queueItem.to],
          cc: queueItem.cc,
          bcc: queueItem.bcc,
          subject: queueItem.subject,
          template: queueItem.template,
          data: queueItem.data,
          priority: queueItem.priority,
          scheduledAt: queueItem.scheduledAt,
          tags: queueItem.tags,
          metadata: queueItem.metadata,
          attempts: queueItem.attempts,
          maxAttempts: queueItem.maxAttempts,
          status: queueItem.status,
          provider: queueItem.provider,
        },
      });
    } catch (error) {
      console.error('Failed to store email in database:', error);
    }

    this.queue.push(queueItem);
    
    // Sort queue by priority and schedule time
    this.queue.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      return a.scheduledAt.getTime() - b.scheduledAt.getTime();
    });

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
    const now = new Date();

    try {
      while (this.queue.length > 0) {
        // Check rate limits
        if (!this.checkRateLimits()) {
          console.log('Rate limit reached, pausing email processing');
          break;
        }

        // Find next email to process
        const item = this.queue.find(i => 
          (i.status === 'pending' || i.status === 'scheduled') &&
          i.scheduledAt <= now
        );

        if (!item) break;

        item.status = 'sending';
        item.attempts++;
        item.lastAttempt = now;

        try {
          await this.updateQueueItemInDatabase(item);
          
          // Send the email
          const result = await this.sendEmail(item);
          
          if (result.success) {
            item.status = 'sent';
            item.sentAt = now;
            item.messageId = result.messageId;
            
            // Track rate limits
            this.trackRateLimit();
            
            // Update database
            await this.updateQueueItemInDatabase(item);
            
            // Remove from memory queue
            this.queue = this.queue.filter(i => i.id !== item.id);
            
            console.log(`Email sent successfully: ${item.id} to ${Array.isArray(item.to) ? item.to.join(', ') : item.to}`);
            
            // Log email analytics
            await this.logEmailAnalytics(item, 'sent');
          } else {
            throw new Error(result.error || 'Unknown sending error');
          }
          
        } catch (error) {
          item.error = error instanceof Error ? error.message : 'Unknown error';
          
          if (item.attempts >= item.maxAttempts) {
            item.status = 'failed';
            console.error(`Email failed after ${item.maxAttempts} attempts: ${item.id}`, error);
            
            // Update database
            await this.updateQueueItemInDatabase(item);
            
            // Remove from queue
            this.queue = this.queue.filter(i => i.id !== item.id);
            
            // Log email analytics
            await this.logEmailAnalytics(item, 'failed');
          } else {
            item.status = 'pending';
            // Calculate next retry delay with exponential backoff
            const delay = (this.config.retryPolicy?.initialDelay || 1000) * 
                         Math.pow(this.config.retryPolicy?.backoffMultiplier || 2, item.attempts - 1);
            item.scheduledAt = new Date(now.getTime() + delay);
            
            console.warn(`Email attempt ${item.attempts} failed: ${item.id}`, error);
            
            // Update database
            await this.updateQueueItemInDatabase(item);
          }
        }

        // Brief pause between emails to avoid overwhelming servers
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error('Error processing email queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // Send individual email
  private async sendEmail(item: EmailQueueItem): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Render template
      const html = await this.renderTemplate(item.template, item.data);
      const fromEmail = this.getFromEmail();

      if (!this.transporter) {
        // Fallback to console logging in development
        if (process.env.NODE_ENV === 'development') {
          console.log('=== EMAIL SENT (DEVELOPMENT MODE) ===');
          console.log(`From: ${fromEmail}`);
          console.log(`To: ${Array.isArray(item.to) ? item.to.join(', ') : item.to}`);
          console.log(`Subject: ${item.subject}`);
          console.log(`Template: ${item.template}`);
          console.log(`HTML Length: ${html.length} characters`);
          console.log('=== END EMAIL ===');
          return { success: true, messageId: `dev_${item.id}` };
        } else {
          throw new Error('Email transporter not configured');
        }
      }

      // Send email
      const result = await this.transporter.sendMail({
        from: fromEmail,
        to: Array.isArray(item.to) ? item.to.join(', ') : item.to,
        cc: item.cc ? (Array.isArray(item.cc) ? item.cc.join(', ') : item.cc) : undefined,
        bcc: item.bcc ? (Array.isArray(item.bcc) ? item.bcc.join(', ') : item.bcc) : undefined,
        subject: item.subject,
        html: html,
        headers: {
          'X-Email-ID': item.id,
          'X-Email-Template': item.template,
          'X-Email-Provider': item.provider,
          ...(item.tags.length > 0 && { 'X-Email-Tags': item.tags.join(',') }),
        },
      });

      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Failed to send email:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Get appropriate from email based on provider
  private getFromEmail(): string {
    switch (this.config.provider) {
      case 'sendgrid':
        return this.config.sendgrid?.fromEmail || 'noreply@revivatech.co.uk';
      case 'aws-ses':
        return this.config.awsSes?.fromEmail || 'noreply@revivatech.co.uk';
      case 'gmail':
        return this.config.gmail?.fromEmail || this.config.gmail?.user || 'noreply@revivatech.co.uk';
      case 'smtp':
      default:
        return this.config.smtp?.fromEmail || 'noreply@revivatech.co.uk';
    }
  }

  // Check rate limits
  private checkRateLimits(): boolean {
    const now = Date.now();
    
    // Reset counters if time window passed
    if (now >= this.rateLimitTracker.perSecond.resetAt) {
      this.rateLimitTracker.perSecond = { count: 0, resetAt: now + 1000 };
    }
    if (now >= this.rateLimitTracker.perMinute.resetAt) {
      this.rateLimitTracker.perMinute = { count: 0, resetAt: now + 60000 };
    }
    if (now >= this.rateLimitTracker.perHour.resetAt) {
      this.rateLimitTracker.perHour = { count: 0, resetAt: now + 3600000 };
    }
    if (now >= this.rateLimitTracker.perDay.resetAt) {
      this.rateLimitTracker.perDay = { count: 0, resetAt: now + 86400000 };
    }

    // Check limits
    const limits = this.config.rateLimits!;
    return (
      this.rateLimitTracker.perSecond.count < limits.perSecond &&
      this.rateLimitTracker.perMinute.count < limits.perMinute &&
      this.rateLimitTracker.perHour.count < limits.perHour &&
      this.rateLimitTracker.perDay.count < limits.perDay
    );
  }

  // Track rate limit usage
  private trackRateLimit(): void {
    this.rateLimitTracker.perSecond.count++;
    this.rateLimitTracker.perMinute.count++;
    this.rateLimitTracker.perHour.count++;
    this.rateLimitTracker.perDay.count++;
  }

  // Render email template
  private async renderTemplate(template: EmailTemplate, data: Record<string, any>): Promise<string> {
    try {
      const templatePath = `./emailTemplates/${template}`;
      const { render } = await import(templatePath);
      return render(data);
    } catch (error) {
      console.error(`Failed to render template ${template}:`, error);
      throw new Error(`Template rendering failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Update queue item in database
  private async updateQueueItemInDatabase(item: EmailQueueItem): Promise<void> {
    try {
      await prisma.emailQueue.update({
        where: { id: item.id },
        data: {
          attempts: item.attempts,
          lastAttempt: item.lastAttempt,
          sentAt: item.sentAt,
          error: item.error,
          status: item.status,
          messageId: item.messageId,
          scheduledAt: item.scheduledAt,
        },
      });
    } catch (error) {
      console.error('Failed to update email queue item in database:', error);
    }
  }

  // Log email analytics
  private async logEmailAnalytics(item: EmailQueueItem, event: string): Promise<void> {
    try {
      await prisma.emailAnalytics.create({
        data: {
          emailId: item.id,
          event,
          timestamp: new Date(),
          recipient: Array.isArray(item.to) ? item.to[0] : item.to,
          template: item.template,
          provider: item.provider,
          metadata: {
            attempts: item.attempts,
            tags: item.tags,
            ...item.metadata,
          },
        },
      });
    } catch (error) {
      console.error('Failed to log email analytics:', error);
    }
  }

  // Generate unique ID
  private generateId(): string {
    return `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public methods for queue management
  
  public async getQueueStatus(): Promise<{
    total: number;
    pending: number;
    scheduled: number;
    sending: number;
    sent: number;
    failed: number;
    rateLimits: typeof this.rateLimitTracker;
  }> {
    const dbStats = await prisma.emailQueue.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    const stats = {
      total: 0,
      pending: 0,
      scheduled: 0,
      sending: 0,
      sent: 0,
      failed: 0,
    };

    dbStats.forEach(stat => {
      stats[stat.status as keyof typeof stats] = stat._count.status;
      stats.total += stat._count.status;
    });

    return {
      ...stats,
      rateLimits: this.rateLimitTracker,
    };
  }

  public async retryFailed(): Promise<number> {
    const failedCount = await prisma.emailQueue.updateMany({
      where: { status: 'failed' },
      data: { 
        status: 'pending',
        attempts: 0,
        error: null,
        scheduledAt: new Date(),
      },
    });

    // Reload queue from database
    await this.loadQueueFromDatabase();

    if (!this.isProcessing) {
      this.processQueue();
    }

    return failedCount.count;
  }

  public async cancelScheduledEmail(emailId: string): Promise<boolean> {
    try {
      await prisma.emailQueue.update({
        where: { id: emailId, status: 'scheduled' },
        data: { status: 'cancelled' },
      });

      // Remove from memory queue
      this.queue = this.queue.filter(i => i.id !== emailId);
      
      return true;
    } catch (error) {
      console.error('Failed to cancel scheduled email:', error);
      return false;
    }
  }

  public async getEmailAnalytics(dateFrom: Date, dateTo: Date): Promise<any> {
    return await prisma.emailAnalytics.groupBy({
      by: ['event', 'template', 'provider'],
      where: {
        timestamp: {
          gte: dateFrom,
          lte: dateTo,
        },
      },
      _count: { event: true },
      orderBy: { _count: { event: 'desc' } },
    });
  }

  // Test email configuration
  public async testConfiguration(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.transporter) {
        return { success: false, error: 'Email transporter not configured' };
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
}

// Export singleton instance
export const productionEmailService = new ProductionEmailService();
export { ProductionEmailService };