// Simplified email service for testing without SMTP dependencies

export type EmailTemplate = 
  | 'booking-confirmation'
  | 'payment-confirmation'
  | 'repair-status-update'
  | 'password-reset'
  | 'invoice';

export interface EmailData {
  to: string;
  subject: string;
  template: EmailTemplate;
  data: Record<string, any>;
}

export interface EmailQueueItem extends EmailData {
  id: string;
  attempts: number;
  createdAt: Date;
  lastAttempt?: Date;
  error?: string;
  status: 'pending' | 'sending' | 'sent' | 'failed';
}

class SimpleEmailService {
  private queue: EmailQueueItem[] = [];
  private isProcessing: boolean = false;

  constructor() {
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

  // Process email queue (simulate sending)
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
        // Simulate email sending (render template and log)
        const html = await this.renderTemplate(item.template, item.data);
        
        console.log('=== EMAIL SENT (SIMULATED) ===');
        console.log(`To: ${item.to}`);
        console.log(`Subject: ${item.subject}`);
        console.log(`Template: ${item.template}`);
        console.log(`HTML Length: ${html.length} characters`);
        console.log('=== END EMAIL ===');

        item.status = 'sent';
        // Remove from queue after successful send
        this.queue = this.queue.filter(i => i.id !== item.id);
        
        console.log(`Email sent successfully (simulated): ${item.id} to ${item.to}`);
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
          await new Promise(resolve => setTimeout(resolve, 1000 * item.attempts));
        }
      }
    }

    this.isProcessing = false;
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
  } {
    return {
      total: this.queue.length,
      pending: this.queue.filter(i => i.status === 'pending').length,
      sending: this.queue.filter(i => i.status === 'sending').length,
      failed: this.queue.filter(i => i.status === 'failed').length
    };
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
export const emailService = new SimpleEmailService();