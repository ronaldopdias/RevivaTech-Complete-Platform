const express = require('express');
const Joi = require('joi');
const bcrypt = require('bcryptjs');
const { requireAuth: authenticateToken, requireRole } = require('../lib/auth-utils');
const { prisma } = require('../lib/prisma');
const router = express.Router();

// Validation schemas
const emailSettingsSchema = Joi.object({
  provider: Joi.string().valid('zoho', 'gmail', 'sendgrid', 'smtp').required(),
  smtp_host: Joi.string().hostname().required(),
  smtp_port: Joi.number().integer().min(1).max(65535).required(),
  smtp_secure: Joi.boolean().required(),
  smtp_user: Joi.string().email().required(),
  smtp_password: Joi.string().min(1).required(),
  from_email: Joi.string().email().required(),
  from_name: Joi.string().min(1).max(100).required(),
  reply_to_email: Joi.string().email().optional(),
  test_email: Joi.string().email().optional(),
  backup_provider: Joi.string().valid('zoho', 'gmail', 'sendgrid', 'smtp').optional(),
  retry_attempts: Joi.number().integer().min(1).max(10).default(3),
  queue_enabled: Joi.boolean().default(true)
});

const testEmailSchema = Joi.object({
  to_email: Joi.string().email().required(),
  subject: Joi.string().min(1).max(500).default('RevivaTech Email Configuration Test'),
  message: Joi.string().min(1).max(5000).default('This is a test email to verify your email configuration is working correctly.')
});

// Get current email settings (admin only)
router.get('/settings', authenticateToken, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const settings = await prisma.email_settings.findFirst({
      where: {
        is_active: true
      },
      select: {
        id: true,
        provider: true,
        smtp_host: true,
        smtp_port: true,
        smtp_secure: true,
        smtp_user: true,
        from_email: true,
        from_name: true,
        reply_to_email: true,
        test_email: true,
        is_active: true,
        backup_provider: true,
        retry_attempts: true,
        queue_enabled: true,
        created_at: true,
        updated_at: true
        // Explicitly exclude smtp_password for security
      },
      orderBy: {
        created_at: 'desc'
      }
    });
    
    if (!settings) {
      return res.status(404).json({
        error: 'No email configuration found',
        code: 'NO_EMAIL_CONFIG'
      });
    }

    res.json({
      success: true,
      settings
    });

  } catch (error) {
    req.logger.error('Get email settings error:', error);
    res.status(500).json({
      error: 'Failed to fetch email settings',
      code: 'FETCH_EMAIL_SETTINGS_ERROR'
    });
  }
});

// Update email settings (admin only)
router.put('/settings', authenticateToken, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    // Validate input
    const { error, value } = emailSettingsSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(detail => detail.message)
      });
    }

    // Encrypt password before storing (simple encryption for demo)
    const encryptedPassword = await bcrypt.hash(value.smtp_password, 10);

    // Use Prisma transaction to ensure atomicity
    const result = await prisma.$transaction(async (prismaTransaction) => {
      // Deactivate current settings
      await prismaTransaction.email_settings.updateMany({
        data: {
          is_active: false
        }
      });

      // Insert new settings
      const newSettings = await prismaTransaction.email_settings.create({
        data: {
          provider: value.provider,
          smtp_host: value.smtp_host,
          smtp_port: value.smtp_port,
          smtp_secure: value.smtp_secure,
          smtp_user: value.smtp_user,
          smtp_password: encryptedPassword,
          from_email: value.from_email,
          from_name: value.from_name,
          reply_to_email: value.reply_to_email,
          test_email: value.test_email,
          backup_provider: value.backup_provider,
          retry_attempts: value.retry_attempts,
          queue_enabled: value.queue_enabled,
          is_active: true,
          created_by: req.user.id,
          updated_by: req.user.id
        },
        select: {
          id: true,
          provider: true,
          smtp_host: true,
          smtp_port: true,
          smtp_secure: true,
          smtp_user: true,
          from_email: true,
          from_name: true,
          reply_to_email: true,
          test_email: true,
          is_active: true,
          backup_provider: true,
          retry_attempts: true,
          queue_enabled: true,
          created_at: true
          // Explicitly exclude smtp_password for security
        }
      });

      return newSettings;
    });

    req.logger.info(`Email settings updated by: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Email settings updated successfully',
      settings: result
    });

  } catch (error) {
    req.logger.error('Update email settings error:', error);
    res.status(500).json({
      error: 'Failed to update email settings',
      code: 'UPDATE_EMAIL_SETTINGS_ERROR'
    });
  }
});

// Test email configuration (admin only)
router.post('/test', authenticateToken, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    // Validate input
    const { error, value } = testEmailSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(detail => detail.message)
      });
    }

    // Get current email settings
    const settings = await prisma.email_settings.findFirst({
      where: {
        is_active: true
      },
      select: {
        smtp_host: true,
        smtp_port: true,
        smtp_secure: true,
        smtp_user: true,
        smtp_password: true,
        from_email: true,
        from_name: true,
        provider: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });
    
    if (!settings) {
      return res.status(400).json({
        error: 'No active email configuration found',
        code: 'NO_ACTIVE_EMAIL_CONFIG'
      });
    }

    // Import nodemailer dynamically
    const nodemailer = require('nodemailer');

    // Decrypt password (for demo, in production use proper encryption)
    const isValidPassword = await bcrypt.compare(req.body.smtp_password || 'test', settings.smtp_password);
    
    // Create transporter with current settings
    const transporter = nodemailer.createTransporter({
      host: settings.smtp_host,
      port: settings.smtp_port,
      secure: settings.smtp_secure,
      auth: {
        user: settings.smtp_user,
        pass: req.body.smtp_password || 'use-stored-password' // In production, decrypt stored password
      }
    });

    // Prepare test email
    const mailOptions = {
      from: `${settings.from_name} <${settings.from_email}>`,
      to: value.to_email,
      subject: value.subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">RevivaTech Email Configuration Test</h2>
          <p>${value.message}</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p><strong>Configuration Details:</strong></p>
          <ul>
            <li><strong>Provider:</strong> ${settings.provider}</li>
            <li><strong>SMTP Host:</strong> ${settings.smtp_host}</li>
            <li><strong>SMTP Port:</strong> ${settings.smtp_port}</li>
            <li><strong>From Email:</strong> ${settings.from_email}</li>
            <li><strong>Test Time:</strong> ${new Date().toISOString()}</li>
          </ul>
          <p style="color: #666; font-size: 12px;">
            This is an automated test email from RevivaTech email configuration system.
          </p>
        </div>
      `,
      text: `${value.message}\n\nConfiguration Test - Provider: ${settings.provider}, Host: ${settings.smtp_host}, Port: ${settings.smtp_port}`
    };

    // Send test email
    const info = await transporter.sendMail(mailOptions);

    // Log the test email
    await prisma.email_logs.create({
      data: {
        to_email: value.to_email,
        from_email: settings.from_email,
        subject: value.subject,
        provider: settings.provider,
        status: 'sent',
        message_id: info.messageId,
        sent_at: new Date(),
        user_id: req.user.id
      }
    });

    req.logger.info(`Test email sent successfully to: ${value.to_email} by: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Test email sent successfully',
      details: {
        messageId: info.messageId,
        to: value.to_email,
        from: settings.from_email,
        provider: settings.provider,
        sentAt: new Date().toISOString()
      }
    });

  } catch (error) {
    req.logger.error('Send test email error:', error);
    
    // Log failed email attempt
    try {
      await prisma.email_logs.create({
        data: {
          to_email: req.body.to_email || 'unknown',
          from_email: 'system',
          subject: req.body.subject || 'Test Email',
          provider: 'unknown',
          status: 'failed',
          error_message: error.message,
          user_id: req.user.id
        }
      });
    } catch (logError) {
      req.logger.error('Failed to log email error:', logError);
    }

    res.status(500).json({
      error: 'Failed to send test email',
      code: 'SEND_TEST_EMAIL_ERROR',
      details: error.message
    });
  }
});

// Get email logs (admin only)
router.get('/logs', authenticateToken, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { limit = 50, offset = 0, status, provider } = req.query;

    // Build where conditions
    const whereConditions = {};
    
    if (status) {
      whereConditions.status = status;
    }

    if (provider) {
      whereConditions.provider = provider;
    }

    // Execute both queries in parallel
    const [logs, total] = await Promise.all([
      prisma.email_logs.findMany({
        where: whereConditions,
        select: {
          id: true,
          to_email: true,
          from_email: true,
          subject: true,
          provider: true,
          status: true,
          error_message: true,
          message_id: true,
          sent_at: true,
          retry_count: true,
          created_at: true,
          booking_id: true,
          user_id: true
        },
        orderBy: {
          created_at: 'desc'
        },
        take: parseInt(limit),
        skip: parseInt(offset)
      }),
      prisma.email_logs.count({
        where: whereConditions
      })
    ]);

    res.json({
      success: true,
      logs,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < total
      }
    });

  } catch (error) {
    req.logger.error('Get email logs error:', error);
    res.status(500).json({
      error: 'Failed to fetch email logs',
      code: 'FETCH_EMAIL_LOGS_ERROR'
    });
  }
});

// Get email statistics (admin only)
router.get('/stats', authenticateToken, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    // Calculate date range based on period
    let dateThreshold;
    const now = new Date();
    
    switch (period) {
      case '1d':
        dateThreshold = new Date(now.getTime() - (24 * 60 * 60 * 1000));
        break;
      case '30d':
        dateThreshold = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        break;
      case '90d':
        dateThreshold = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
        break;
      default: // '7d'
        dateThreshold = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    }

    // Use Prisma aggregation with complex counting
    const [
      totalEmails,
      sentEmails, 
      failedEmails,
      pendingEmails,
      uniqueProviders,
      uniqueRecipients
    ] = await Promise.all([
      // Total emails in period
      prisma.email_logs.count({
        where: {
          created_at: {
            gte: dateThreshold
          }
        }
      }),
      // Sent emails
      prisma.email_logs.count({
        where: {
          created_at: {
            gte: dateThreshold
          },
          status: 'sent'
        }
      }),
      // Failed emails
      prisma.email_logs.count({
        where: {
          created_at: {
            gte: dateThreshold
          },
          status: 'failed'
        }
      }),
      // Pending emails
      prisma.email_logs.count({
        where: {
          created_at: {
            gte: dateThreshold
          },
          status: 'pending'
        }
      }),
      // Unique providers
      prisma.email_logs.findMany({
        where: {
          created_at: {
            gte: dateThreshold
          }
        },
        select: {
          provider: true
        },
        distinct: ['provider']
      }),
      // Unique recipients
      prisma.email_logs.findMany({
        where: {
          created_at: {
            gte: dateThreshold
          }
        },
        select: {
          to_email: true
        },
        distinct: ['to_email']
      })
    ]);

    // Calculate success rate
    const successRate = totalEmails > 0 
      ? Math.round((sentEmails / totalEmails) * 100 * 100) / 100 
      : 0;

    const stats = {
      total_emails: totalEmails,
      sent_emails: sentEmails,
      failed_emails: failedEmails,
      pending_emails: pendingEmails,
      success_rate: successRate,
      providers_used: uniqueProviders.length,
      unique_recipients: uniqueRecipients.length
    };

    res.json({
      success: true,
      stats,
      period,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    req.logger.error('Get email stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch email statistics',
      code: 'FETCH_EMAIL_STATS_ERROR'
    });
  }
});

module.exports = router;