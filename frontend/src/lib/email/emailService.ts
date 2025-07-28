/**
 * Email Service for RevivaTech
 * 
 * Handles sending booking confirmations, repair updates, and notifications
 * Supports multiple email providers and templates
 */

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface EmailConfig {
  provider: 'smtp' | 'sendgrid' | 'resend' | 'nodemailer';
  apiKey?: string;
  smtpConfig?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
}

interface BookingConfirmationData {
  customerName: string;
  customerEmail: string;
  deviceName: string;
  repairType: string;
  bookingId: string;
  estimatedCompletion: string;
  price: number;
  dropOffLocation: string;
  contactPhone: string;
}

interface RepairUpdateData {
  customerName: string;
  customerEmail: string;
  deviceName: string;
  repairId: string;
  status: string;
  message: string;
  estimatedCompletion?: string;
  technicianName?: string;
}

class EmailService {
  private config: EmailConfig;

  constructor(config: EmailConfig) {
    this.config = config;
  }

  // Generate booking confirmation email
  private generateBookingConfirmationTemplate(data: BookingConfirmationData): EmailTemplate {
    const subject = `Booking Confirmation - ${data.deviceName} Repair (${data.bookingId})`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>RevivaTech - Booking Confirmation</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #007AFF; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .highlight { background: #eff6ff; padding: 15px; border-radius: 6px; border-left: 4px solid #007AFF; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          .button { display: inline-block; background: #007AFF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔧 RevivaTech</h1>
            <p>Professional Computer & Device Repair</p>
          </div>
          
          <div class="content">
            <h2>Booking Confirmation</h2>
            <p>Dear ${data.customerName},</p>
            <p>Thank you for choosing RevivaTech! We've received your repair booking and our expert technicians are ready to restore your device.</p>
            
            <div class="card">
              <h3>📱 Repair Details</h3>
              <p><strong>Device:</strong> ${data.deviceName}</p>
              <p><strong>Repair Type:</strong> ${data.repairType}</p>
              <p><strong>Booking ID:</strong> <code>${data.bookingId}</code></p>
              <p><strong>Estimated Completion:</strong> ${new Date(data.estimatedCompletion).toLocaleDateString('en-GB', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
              <p><strong>Estimated Cost:</strong> £${data.price.toFixed(2)}</p>
            </div>
            
            <div class="highlight">
              <h3>📍 Drop-off Information</h3>
              <p><strong>Location:</strong> ${data.dropOffLocation}</p>
              <p><strong>Contact:</strong> ${data.contactPhone}</p>
              <p><strong>Hours:</strong> Mon-Fri 9:00-18:00, Sat 10:00-16:00</p>
            </div>
            
            <div class="card">
              <h3>🚀 What's Next?</h3>
              <ol>
                <li><strong>Bring your device</strong> to our location at your convenience</li>
                <li><strong>Free diagnosis</strong> - We'll confirm the issue and provide exact pricing</li>
                <li><strong>Approval</strong> - We'll contact you before starting any work</li>
                <li><strong>Expert repair</strong> - Our certified technicians will fix your device</li>
                <li><strong>Quality testing</strong> - Comprehensive testing before collection</li>
                <li><strong>90-day warranty</strong> - Complete peace of mind included</li>
              </ol>
            </div>
            
            <div class="card">
              <h3>📞 Need Help?</h3>
              <p>Our support team is here to help:</p>
              <p><strong>Phone:</strong> ${data.contactPhone}</p>
              <p><strong>Email:</strong> hello@revivatech.co.uk</p>
              <p><strong>Live Chat:</strong> Available on our website</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://revivatech.co.uk/track/${data.bookingId}" class="button">
                Track Your Repair
              </a>
            </div>
          </div>
          
          <div class="footer">
            <p>RevivaTech - Reviving Technology, Restoring Confidence</p>
            <p>8 GodsHill Close, Bournemouth, BH8 0EJ</p>
            <p>This email was sent regarding booking ${data.bookingId}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
RevivaTech - Booking Confirmation

Dear ${data.customerName},

Thank you for choosing RevivaTech! We've received your repair booking.

REPAIR DETAILS:
- Device: ${data.deviceName}
- Repair Type: ${data.repairType}
- Booking ID: ${data.bookingId}
- Estimated Completion: ${new Date(data.estimatedCompletion).toLocaleDateString()}
- Estimated Cost: £${data.price.toFixed(2)}

DROP-OFF LOCATION:
${data.dropOffLocation}
Contact: ${data.contactPhone}
Hours: Mon-Fri 9:00-18:00, Sat 10:00-16:00

WHAT'S NEXT:
1. Bring your device to our location
2. Free diagnosis and exact pricing
3. We'll contact you before starting work
4. Expert repair by certified technicians
5. Quality testing before collection
6. 90-day warranty included

Track your repair: https://revivatech.co.uk/track/${data.bookingId}

Need help? Contact us:
Phone: ${data.contactPhone}
Email: hello@revivatech.co.uk

RevivaTech - Reviving Technology, Restoring Confidence
8 GodsHill Close, Bournemouth, BH8 0EJ
    `;

    return { subject, html, text };
  }

  // Generate repair update email
  private generateRepairUpdateTemplate(data: RepairUpdateData): EmailTemplate {
    const subject = `Repair Update - ${data.deviceName} (${data.repairId})`;
    
    const statusEmojis = {
      'diagnosis': '🔍',
      'in-progress': '🔧',
      'waiting-parts': '📦',
      'completed': '✅',
      'ready-for-pickup': '🎉',
    };

    const emoji = statusEmojis[data.status] || '📱';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>RevivaTech - Repair Update</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #007AFF; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .status-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); text-align: center; }
          .status-icon { font-size: 48px; margin-bottom: 10px; }
          .button { display: inline-block; background: #007AFF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔧 RevivaTech</h1>
            <p>Repair Status Update</p>
          </div>
          
          <div class="content">
            <h2>Hello ${data.customerName},</h2>
            <p>We have an update on your ${data.deviceName} repair:</p>
            
            <div class="status-card">
              <div class="status-icon">${emoji}</div>
              <h3>Status: ${data.status.replace('-', ' ').replace(/\\b\\w/g, l => l.toUpperCase())}</h3>
              <p>${data.message}</p>
              ${data.technicianName ? `<p><strong>Technician:</strong> ${data.technicianName}</p>` : ''}
              ${data.estimatedCompletion ? `<p><strong>Estimated Completion:</strong> ${new Date(data.estimatedCompletion).toLocaleDateString('en-GB', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric'
              })}</p>` : ''}
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://revivatech.co.uk/track/${data.repairId}" class="button">
                View Full Details
              </a>
            </div>
            
            <p>Questions? Contact us at hello@revivatech.co.uk or +44 20 7123 4567</p>
          </div>
          
          <div class="footer">
            <p>RevivaTech - Reviving Technology, Restoring Confidence</p>
            <p>This update is for repair ${data.repairId}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
RevivaTech - Repair Update

Hello ${data.customerName},

Update on your ${data.deviceName} repair:

STATUS: ${data.status.replace('-', ' ').toUpperCase()}
${data.message}

${data.technicianName ? `Technician: ${data.technicianName}` : ''}
${data.estimatedCompletion ? `Estimated Completion: ${new Date(data.estimatedCompletion).toLocaleDateString()}` : ''}

View full details: https://revivatech.co.uk/track/${data.repairId}

Questions? Contact us:
Email: hello@revivatech.co.uk
Phone: +44 20 7123 4567

RevivaTech - Repair ${data.repairId}
    `;

    return { subject, html, text };
  }

  // Send booking confirmation email
  async sendBookingConfirmation(data: BookingConfirmationData): Promise<boolean> {
    try {
      const template = this.generateBookingConfirmationTemplate(data);
      
      const emailData = {
        to: data.customerEmail,
        from: 'hello@revivatech.co.uk',
        fromName: 'RevivaTech',
        subject: template.subject,
        html: template.html,
        text: template.text,
      };

      return await this.sendEmail(emailData);
    } catch (error) {
      console.error('Failed to send booking confirmation:', error);
      return false;
    }
  }

  // Send repair update email
  async sendRepairUpdate(data: RepairUpdateData): Promise<boolean> {
    try {
      const template = this.generateRepairUpdateTemplate(data);
      
      const emailData = {
        to: data.customerEmail,
        from: 'hello@revivatech.co.uk',
        fromName: 'RevivaTech',
        subject: template.subject,
        html: template.html,
        text: template.text,
      };

      return await this.sendEmail(emailData);
    } catch (error) {
      console.error('Failed to send repair update:', error);
      return false;
    }
  }

  // Generic email sending method
  private async sendEmail(emailData: any): Promise<boolean> {
    try {
      const apiUrl = process.env.NODE_ENV === 'development'
        ? 'http://localhost:3011/api/email/send'
        : '/api/email/send';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      if (!response.ok) {
        throw new Error(`Email API error: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Email sent successfully:', result);
      return true;
    } catch (error) {
      console.error('Email sending failed:', error);
      return false;
    }
  }

  // Test email configuration
  async testConfiguration(): Promise<boolean> {
    try {
      const testData: BookingConfirmationData = {
        customerName: 'Test Customer',
        customerEmail: 'test@example.com',
        deviceName: 'Test Device',
        repairType: 'Test Repair',
        bookingId: 'TEST-001',
        estimatedCompletion: new Date().toISOString(),
        price: 99.99,
        dropOffLocation: 'RevivaTech Test Location',
        contactPhone: '+44 20 7123 4567',
      };

      return await this.sendBookingConfirmation(testData);
    } catch (error) {
      console.error('Email configuration test failed:', error);
      return false;
    }
  }
}

// Export configured email service
export const emailService = new EmailService({
  provider: 'smtp', // Can be configured via environment variables
  smtpConfig: {
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  },
});

export type { BookingConfirmationData, RepairUpdateData };
export default EmailService;