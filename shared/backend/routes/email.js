const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');
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

/**
 * @swagger
 * /api/email/status:
 *   get:
 *     summary: Get email service status
 *     tags: [Email]
 *     responses:
 *       200:
 *         description: Email service status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 smtpConfigured:
 *                   type: boolean
 *                   example: true
 *                 smtpReady:
 *                   type: boolean
 *                   example: false
 *                 config:
 *                   type: object
 *                   properties:
 *                     host:
 *                       type: string
 *                       example: "smtp.gmail.com"
 *                     port:
 *                       type: integer
 *                       example: 587
 *                     secure:
 *                       type: boolean
 *                       example: false
 *                     from:
 *                       type: string
 *                       example: "noreply@revivatech.co.uk"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       500:
 *         description: Failed to get email service status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/status', async (req, res) => {
  try {
    const status = emailService.getStatus();
    res.json({
      success: true,
      ...status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get email service status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test SMTP connection
router.post('/test-connection', async (req, res) => {
  try {
    const result = await emailService.testConnection();
    res.json({
      success: result.success,
      message: result.success ? 'SMTP connection successful' : 'SMTP connection failed',
      error: result.error,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Email connection test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Send test email
router.post('/test', async (req, res) => {
  try {
    const { to } = req.body;
    
    if (!to) {
      return res.status(400).json({
        success: false,
        error: 'Email address (to) is required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email address format'
      });
    }

    const result = await emailService.sendBookingConfirmation({
      to,
      customerName: 'Test Customer',
      bookingReference: 'TEST-' + Date.now(),
      device: {
        brand: 'Apple',
        model: 'MacBook Pro 16" M3 (2023)',
        issues: ['Screen cracked', 'Battery draining fast']
      },
      service: {
        type: 'Screen Replacement + Battery Replacement',
        urgency: 'Standard',
        estimatedCost: 449.99,
        estimatedDays: 3
      },
      nextSteps: [
        'We will contact you within 2 hours to confirm your appointment',
        'Bring your device to our Shoreditch location at 123 Tech Street',
        'Our certified technician will perform a free 15-minute diagnostic',
        'You will receive a detailed quote before any work begins',
        'All repairs come with a 90-day warranty and genuine parts guarantee'
      ]
    });

    res.json({
      success: true,
      messageId: result.messageId,
      message: 'Test email sent successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Test email failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Send booking confirmation email
router.post('/booking-confirmation', async (req, res) => {
  try {
    const { to, customerName, bookingReference, device, service, nextSteps } = req.body;
    
    // Validate required fields
    if (!to || !customerName || !bookingReference || !device || !service) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, customerName, bookingReference, device, service'
      });
    }

    const result = await emailService.sendBookingConfirmation({
      to,
      customerName,
      bookingReference,
      device,
      service,
      nextSteps: nextSteps || [
        'We will contact you within 2 hours to confirm your appointment',
        'Bring your device to our location',
        'Our technician will perform a free diagnostic',
        'You will receive a detailed quote before any work begins'
      ]
    });

    res.json({
      success: true,
      messageId: result.messageId,
      message: 'Booking confirmation email sent successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Booking confirmation email failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Send repair status update email
router.post('/status-update', async (req, res) => {
  try {
    const { to, customerName, bookingReference, status, message, estimatedCompletion } = req.body;
    
    // Validate required fields
    if (!to || !customerName || !bookingReference || !status || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, customerName, bookingReference, status, message'
      });
    }

    const result = await emailService.sendRepairStatusUpdate({
      to,
      customerName,
      bookingReference,
      status,
      message,
      estimatedCompletion
    });

    res.json({
      success: true,
      messageId: result.messageId,
      message: 'Status update email sent successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Status update email failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Send custom email (for admin use)
router.post('/send', async (req, res) => {
  try {
    const { to, subject, html, type = 'custom' } = req.body;
    
    // Validate required fields
    if (!to || !subject || !html) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, subject, html'
      });
    }

    const result = await emailService.sendEmail({
      to,
      subject,
      html
    });

    res.json({
      success: true,
      messageId: result.messageId,
      message: 'Email sent successfully',
      type,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Custom email failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get email configuration (sanitized for security)
router.get('/config', (req, res) => {
  try {
    const status = emailService.getStatus();
    res.json({
      success: true,
      config: {
        ...status.config,
        // Don't expose sensitive auth info
        authConfigured: status.smtpConfigured
      },
      smtpReady: status.smtpReady,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get email config:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get email provider setup guide
router.get('/providers', (req, res) => {
  const providers = {
    gmail: {
      name: 'Gmail SMTP',
      recommended_for: 'Development & Small Scale',
      setup: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        requirements: [
          'Enable 2-factor authentication on Gmail account',
          'Generate app-specific password in Google Account settings',
          'Use Gmail address as SMTP_USER and app password as SMTP_PASS'
        ],
        notes: 'Free up to 500 emails/day. Perfect for development and small businesses.'
      }
    },
    sendgrid: {
      name: 'SendGrid',
      recommended_for: 'Production & High Volume',
      setup: {
        host: 'smtp.sendgrid.net',
        port: 587,
        user: 'apikey',
        requirements: [
          'Create SendGrid account at sendgrid.com',
          'Generate API key in SendGrid dashboard',
          'Use "apikey" as SMTP_USER and API key as SMTP_PASS'
        ],
        notes: 'Free tier: 100 emails/day. Excellent deliverability and analytics.'
      }
    },
    brevo: {
      name: 'Brevo (Sendinblue)',
      recommended_for: 'Small to Medium Business',
      setup: {
        host: 'smtp-relay.brevo.com',
        port: 587,
        requirements: [
          'Create Brevo account at brevo.com',
          'Generate SMTP key in account settings',
          'Use account email and SMTP key as credentials'
        ],
        notes: 'Free tier: 300 emails/day. Good balance of features and cost.'
      }
    },
    mailgun: {
      name: 'Mailgun',
      recommended_for: 'High Deliverability & Analytics',
      setup: {
        host: 'smtp.eu.mailgun.org',
        port: 587,
        requirements: [
          'Create Mailgun account',
          'Add and verify domain',
          'Get SMTP credentials from dashboard'
        ],
        notes: 'Free tier: 5,000 emails/month for 3 months. Great for developers.'
      }
    },
    ses: {
      name: 'AWS Simple Email Service',
      recommended_for: 'Enterprise & AWS Infrastructure',
      setup: {
        host: 'email-smtp.eu-west-1.amazonaws.com',
        port: 587,
        requirements: [
          'AWS account with SES access',
          'Verify domain or email addresses in SES console',
          'Create SMTP credentials in SES console'
        ],
        notes: 'Pay-per-use pricing. Excellent deliverability and scalability.'
      }
    }
  };

  res.json({
    success: true,
    data: {
      providers,
      current_configuration: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER,
        from: process.env.SMTP_FROM_EMAIL,
        configured: !!(process.env.SMTP_USER && process.env.SMTP_PASS)
      },
      setup_instructions: [
        '1. Choose an email provider based on your needs',
        '2. Follow the provider-specific setup requirements',
        '3. Update environment variables in .env file',
        '4. Restart the backend service',
        '5. Test the configuration using /api/email/test-connection'
      ]
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;