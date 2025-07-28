const nodemailer = require('nodemailer');
const winston = require('winston');

// Initialize logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

class EmailService {
  constructor() {
    this.transporter = null;
    this.config = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
      },
      from: process.env.SMTP_FROM_EMAIL || 'noreply@revivatech.co.uk'
    };

    this.initializeTransporter();
  }

  async initializeTransporter() {
    try {
      // Only initialize if SMTP credentials are provided
      if (!this.config.auth.user || !this.config.auth.pass) {
        logger.warn('⚠️ SMTP credentials not configured. Email service will log emails instead of sending.');
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
        connectionTimeout: 60000,
        greetingTimeout: 30000,
        socketTimeout: 60000
      });

      // Verify transporter configuration
      try {
        await this.transporter.verify();
        logger.info('✅ Email service ready to send emails');
      } catch (error) {
        logger.error('❌ Email transporter verification failed:', error);
        this.transporter = null;
      }
    } catch (error) {
      logger.error('❌ Failed to initialize email transporter:', error);
      this.transporter = null;
    }
  }

  // Send booking confirmation email
  async sendBookingConfirmation(data) {
    const { to, customerName, bookingReference, device, service, nextSteps } = data;
    
    const html = this.renderBookingConfirmationTemplate({
      customerName,
      bookingReference,
      device,
      service,
      nextSteps
    });

    return this.sendEmail({
      to,
      subject: `Booking Confirmed - ${bookingReference} | RevivaTech`,
      html
    });
  }

  // Send repair status update email
  async sendRepairStatusUpdate(data) {
    const { to, customerName, bookingReference, status, message, estimatedCompletion } = data;
    
    const html = this.renderStatusUpdateTemplate({
      customerName,
      bookingReference,
      status,
      message,
      estimatedCompletion
    });

    return this.sendEmail({
      to,
      subject: `Repair Update - ${bookingReference} | RevivaTech`,
      html
    });
  }

  // Send email
  async sendEmail(options) {
    try {
      // If no transporter, log email instead
      if (!this.transporter) {
        logger.info('=== EMAIL SENT (LOGGED - NO SMTP) ===');
        logger.info(`From: ${this.config.from}`);
        logger.info(`To: ${options.to}`);
        logger.info(`Subject: ${options.subject}`);
        logger.info(`HTML Preview: ${options.html.substring(0, 200)}...`);
        logger.info('=== END EMAIL ===');
        return { success: true, messageId: 'logged-email-' + Date.now() };
      }

      const mailOptions = {
        from: {
          name: 'RevivaTech',
          address: this.config.from
        },
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: this.htmlToText(options.html),
        headers: {
          'X-Mailer': 'RevivaTech Email Service v1.0',
          'X-Priority': '3'
        }
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`✅ Email sent successfully. Message ID: ${info.messageId}`);
      
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error('❌ Failed to send email:', error);
      throw error;
    }
  }

  // Convert HTML to plain text
  htmlToText(html) {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Test SMTP connection
  async testConnection() {
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
        error: error.message
      };
    }
  }

  // Get service status
  getStatus() {
    return {
      smtpConfigured: !!(this.config.auth.user && this.config.auth.pass),
      smtpReady: this.transporter !== null,
      config: {
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
        from: this.config.from
      }
    };
  }

  // Render booking confirmation email template
  renderBookingConfirmationTemplate(data) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Booking Confirmation - RevivaTech</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #007AFF; color: white; padding: 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { background: white; padding: 30px; }
            .info-box { background: #f8f9fa; border-left: 4px solid #007AFF; padding: 15px; margin: 20px 0; }
            .info-box h3 { margin-top: 0; color: #007AFF; }
            .button { display: inline-block; background: #007AFF; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
            ul { padding-left: 20px; }
            li { margin: 5px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Booking Confirmed!</h1>
            </div>
            
            <div class="content">
              <h2>Hi ${data.customerName},</h2>
              <p>Thank you for choosing RevivaTech for your repair needs. We've successfully received your booking and our team will take great care of your device.</p>
              
              <div class="info-box">
                <h3>Booking Reference: ${data.bookingReference}</h3>
                <p><strong>Device:</strong> ${data.device.brand} ${data.device.model}</p>
                <p><strong>Issues:</strong> ${data.device.issues.join(', ')}</p>
                <p><strong>Service Type:</strong> ${data.service.type}</p>
                <p><strong>Priority:</strong> ${data.service.urgency}</p>
                <p><strong>Estimated Cost:</strong> £${data.service.estimatedCost.toFixed(2)}</p>
                <p><strong>Estimated Time:</strong> ${data.service.estimatedDays} business days</p>
              </div>
              
              <h3>What Happens Next?</h3>
              <ul>
                ${data.nextSteps.map(step => `<li>${step}</li>`).join('')}
              </ul>
              
              <p>You can track the progress of your repair in real-time using your booking reference:</p>
              <a href="https://revivatech.co.uk/track?ref=${data.bookingReference}" class="button">Track Your Repair</a>
              
              <p>If you have any questions, please don't hesitate to contact us:</p>
              <ul>
                <li><strong>Phone:</strong> +44 207 123 4567</li>
                <li><strong>Email:</strong> support@revivatech.co.uk</li>
                <li><strong>WhatsApp:</strong> +44 7700 900 123</li>
              </ul>
            </div>
            
            <div class="footer">
              <p><strong>RevivaTech</strong><br>
              123 Tech Street, Shoreditch, London EC2A 4DN<br>
              <a href="https://revivatech.co.uk">revivatech.co.uk</a></p>
              
              <p><small>This email was sent regarding your repair booking ${data.bookingReference}. 
              If you didn't make this booking, please contact us immediately.</small></p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  // Render status update email template
  renderStatusUpdateTemplate(data) {
    const statusEmojis = {
      'pending': '⏳',
      'diagnosis': '🔍',
      'in-progress': '🔧',
      'waiting-parts': '📦',
      'testing': '🧪',
      'completed': '✅',
      'ready-for-pickup': '📞'
    };

    const emoji = statusEmojis[data.status] || '📢';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Repair Update - RevivaTech</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #007AFF; color: white; padding: 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { background: white; padding: 30px; }
            .status-box { background: #f8f9fa; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; text-align: center; }
            .status-box h3 { margin-top: 0; color: #28a745; font-size: 20px; }
            .button { display: inline-block; background: #007AFF; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${emoji} Repair Update</h1>
            </div>
            
            <div class="content">
              <h2>Hi ${data.customerName},</h2>
              <p>We have an update on your repair booking <strong>${data.bookingReference}</strong>.</p>
              
              <div class="status-box">
                <h3>${emoji} Status: ${data.status.replace('-', ' ').toUpperCase()}</h3>
                <p>${data.message}</p>
                ${data.estimatedCompletion ? `<p><strong>Estimated Completion:</strong> ${data.estimatedCompletion}</p>` : ''}
              </div>
              
              <p>You can always track your repair progress in real-time:</p>
              <a href="https://revivatech.co.uk/track?ref=${data.bookingReference}" class="button">Track Your Repair</a>
              
              <p>If you have any questions about this update, please contact us:</p>
              <ul>
                <li><strong>Phone:</strong> +44 207 123 4567</li>
                <li><strong>Email:</strong> support@revivatech.co.uk</li>
                <li><strong>WhatsApp:</strong> +44 7700 900 123</li>
              </ul>
            </div>
            
            <div class="footer">
              <p><strong>RevivaTech</strong><br>
              123 Tech Street, Shoreditch, London EC2A 4DN<br>
              <a href="https://revivatech.co.uk">revivatech.co.uk</a></p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}

// Export singleton instance
module.exports = new EmailService();