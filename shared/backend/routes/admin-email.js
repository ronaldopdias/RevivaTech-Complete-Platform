const express = require('express');
const emailService = require('../services/emailService');
const { validateAdmin } = require('../middleware/auth');
const winston = require('winston');

const router = express.Router();

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

// Get current email configuration
router.get('/config', async (req, res) => {
  try {
    const status = emailService.getStatus();
    
    // Don't expose sensitive credentials
    const safeConfig = {
      host: status.config.host,
      port: status.config.port,
      secure: status.config.secure,
      from: status.config.from,
      user: status.config.user ? status.config.user.replace(/(.{2}).*(@.*)/, '$1***$2') : '',
      configured: status.smtpConfigured
    };

    res.json({
      config: safeConfig,
      status: {
        configured: status.smtpConfigured,
        connected: status.smtpReady,
        lastTest: null
      }
    });
  } catch (error) {
    logger.error('Failed to get email config:', error);
    res.status(500).json({ error: 'Failed to get email configuration' });
  }
});

// Test SMTP connection
router.post('/test', async (req, res) => {
  try {
    const { host, port, secure, user, pass } = req.body;

    if (!host || !port || !user || !pass) {
      return res.status(400).json({
        success: false,
        error: 'Missing required SMTP configuration'
      });
    }

    // Create temporary transporter for testing
    const nodemailer = require('nodemailer');
    const testTransporter = nodemailer.createTransporter({
      host,
      port: parseInt(port),
      secure: secure === true,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production'
      },
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 10000
    });

    await testTransporter.verify();
    
    res.json({ success: true });
    
    logger.info('✅ SMTP connection test successful');
  } catch (error) {
    logger.error('❌ SMTP connection test failed:', error);
    res.json({
      success: false,
      error: error.message || 'Connection test failed'
    });
  }
});

// Update SMTP configuration
router.post('/config', async (req, res) => {
  try {
    const { host, port, secure, user, pass, from, fromName } = req.body;

    if (!host || !port || !user || !pass || !from) {
      return res.status(400).json({
        error: 'Missing required SMTP configuration fields'
      });
    }

    // Update environment variables (for current session)
    process.env.SMTP_HOST = host;
    process.env.SMTP_PORT = port.toString();
    process.env.SMTP_SECURE = secure.toString();
    process.env.SMTP_USER = user;
    process.env.SMTP_PASS = pass;
    process.env.SMTP_FROM_EMAIL = from;
    process.env.SMTP_FROM_NAME = fromName || 'RevivaTech';

    // Reinitialize email service
    await emailService.initializeTransporter();

    logger.info('✅ SMTP configuration updated successfully');
    
    res.json({ 
      success: true,
      message: 'SMTP configuration updated successfully'
    });
  } catch (error) {
    logger.error('❌ Failed to update SMTP config:', error);
    res.status(500).json({ error: 'Failed to update SMTP configuration' });
  }
});

// Send test email
router.post('/send-test', async (req, res) => {
  try {
    const { to, config } = req.body;

    if (!to) {
      return res.status(400).json({
        success: false,
        error: 'Recipient email address required'
      });
    }

    // If config provided, use it temporarily
    if (config) {
      const nodemailer = require('nodemailer');
      const testTransporter = nodemailer.createTransporter({
        host: config.host,
        port: parseInt(config.port),
        secure: config.secure === true,
        auth: {
          user: config.user,
          pass: config.pass
        },
        tls: {
          rejectUnauthorized: process.env.NODE_ENV === 'production'
        }
      });

      const testEmailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>SMTP Test - RevivaTech</title>
            <style>
              body { font-family: 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #007AFF; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: white; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 8px 8px; }
              .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🧪 SMTP Test Email</h1>
              </div>
              <div class="content">
                <div class="success">
                  <strong>✅ Success!</strong> Your SMTP configuration is working correctly.
                </div>
                <p>This is a test email from your RevivaTech email service configuration.</p>
                <p><strong>Sent at:</strong> ${new Date().toISOString()}</p>
                <p><strong>SMTP Host:</strong> ${config.host}</p>
                <p><strong>From:</strong> ${config.from} (${config.fromName})</p>
                <p>You can now use this configuration to send booking confirmations and repair status updates to your customers.</p>
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
                <p style="font-size: 14px; color: #666;">
                  <strong>RevivaTech Email Service</strong><br>
                  Professional Computer Repair Services<br>
                  <a href="https://revivatech.co.uk">revivatech.co.uk</a>
                </p>
              </div>
            </div>
          </body>
        </html>
      `;

      const mailOptions = {
        from: {
          name: config.fromName || 'RevivaTech',
          address: config.from
        },
        to: to,
        subject: '🧪 SMTP Test Email - RevivaTech',
        html: testEmailHtml
      };

      await testTransporter.sendMail(mailOptions);
    } else {
      // Use existing email service
      const testData = {
        to,
        customerName: 'Test User',
        bookingReference: 'TEST-' + Date.now(),
        device: {
          brand: 'Apple',
          model: 'MacBook Pro',
          issues: ['Screen replacement', 'Battery replacement']
        },
        service: {
          type: 'Express Service',
          urgency: 'High',
          estimatedCost: 299.99,
          estimatedDays: 2
        },
        nextSteps: [
          'Our technician will examine your device within 2 hours',
          'You will receive a detailed quote via email',
          'Repair will begin immediately upon your approval',
          'You will receive real-time updates on progress'
        ]
      };

      await emailService.sendBookingConfirmation(testData);
    }

    logger.info(`✅ Test email sent successfully to ${to}`);
    
    res.json({ 
      success: true,
      message: 'Test email sent successfully'
    });
  } catch (error) {
    logger.error('❌ Failed to send test email:', error);
    res.json({
      success: false,
      error: error.message || 'Failed to send test email'
    });
  }
});

// Get email service status
router.get('/status', async (req, res) => {
  try {
    const status = emailService.getStatus();
    const connectionTest = await emailService.testConnection();
    
    res.json({
      ...status,
      connectionStatus: connectionTest,
      uptime: process.uptime()
    });
  } catch (error) {
    logger.error('Failed to get email status:', error);
    res.status(500).json({ error: 'Failed to get email service status' });
  }
});

module.exports = router;