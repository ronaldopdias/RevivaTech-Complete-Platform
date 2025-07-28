const express = require('express');
const Joi = require('joi');
const bcrypt = require('bcryptjs');
const { authenticateToken, requireRole } = require('../middleware/authentication');
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
    const query = `
      SELECT 
        id, provider, smtp_host, smtp_port, smtp_secure, smtp_user,
        from_email, from_name, reply_to_email, test_email, is_active,
        backup_provider, retry_attempts, queue_enabled, created_at, updated_at
      FROM email_settings 
      WHERE is_active = true 
      ORDER BY created_at DESC 
      LIMIT 1
    `;

    const result = await req.pool.query(query);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'No email configuration found',
        code: 'NO_EMAIL_CONFIG'
      });
    }

    const settings = result.rows[0];
    // Don't expose password in response
    delete settings.smtp_password;

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
  const client = await req.pool.connect();
  
  try {
    // Validate input
    const { error, value } = emailSettingsSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(detail => detail.message)
      });
    }

    await client.query('BEGIN');

    // Deactivate current settings
    await client.query('UPDATE email_settings SET is_active = false');

    // Encrypt password before storing (simple encryption for demo)
    const encryptedPassword = await bcrypt.hash(value.smtp_password, 10);

    // Insert new settings
    const insertQuery = `
      INSERT INTO email_settings (
        provider, smtp_host, smtp_port, smtp_secure, smtp_user, smtp_password,
        from_email, from_name, reply_to_email, test_email, backup_provider,
        retry_attempts, queue_enabled, is_active, created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true, $14, $14)
      RETURNING id, provider, smtp_host, smtp_port, smtp_secure, smtp_user,
                from_email, from_name, reply_to_email, test_email, is_active,
                backup_provider, retry_attempts, queue_enabled, created_at
    `;

    const result = await client.query(insertQuery, [
      value.provider, value.smtp_host, value.smtp_port, value.smtp_secure,
      value.smtp_user, encryptedPassword, value.from_email, value.from_name,
      value.reply_to_email, value.test_email, value.backup_provider,
      value.retry_attempts, value.queue_enabled, req.user.userId
    ]);

    await client.query('COMMIT');

    const newSettings = result.rows[0];
    req.logger.info(`Email settings updated by: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Email settings updated successfully',
      settings: newSettings
    });

  } catch (error) {
    await client.query('ROLLBACK');
    req.logger.error('Update email settings error:', error);
    res.status(500).json({
      error: 'Failed to update email settings',
      code: 'UPDATE_EMAIL_SETTINGS_ERROR'
    });
  } finally {
    client.release();
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
    const settingsQuery = `
      SELECT smtp_host, smtp_port, smtp_secure, smtp_user, smtp_password,
             from_email, from_name, provider
      FROM email_settings 
      WHERE is_active = true 
      ORDER BY created_at DESC 
      LIMIT 1
    `;

    const settingsResult = await req.pool.query(settingsQuery);
    
    if (settingsResult.rows.length === 0) {
      return res.status(400).json({
        error: 'No active email configuration found',
        code: 'NO_ACTIVE_EMAIL_CONFIG'
      });
    }

    const settings = settingsResult.rows[0];

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
    await req.pool.query(`
      INSERT INTO email_logs (to_email, from_email, subject, provider, status, message_id, sent_at, user_id)
      VALUES ($1, $2, $3, $4, 'sent', $5, NOW(), $6)
    `, [value.to_email, settings.from_email, value.subject, settings.provider, info.messageId, req.user.userId]);

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
      await req.pool.query(`
        INSERT INTO email_logs (to_email, from_email, subject, provider, status, error_message, user_id)
        VALUES ($1, $2, $3, $4, 'failed', $5, $6)
      `, [
        req.body.to_email || 'unknown',
        'system',
        req.body.subject || 'Test Email',
        'unknown',
        error.message,
        req.user.userId
      ]);
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

    let whereClause = '1=1';
    const queryParams = [];
    let paramIndex = 1;

    if (status) {
      whereClause += ` AND status = $${paramIndex++}`;
      queryParams.push(status);
    }

    if (provider) {
      whereClause += ` AND provider = $${paramIndex++}`;
      queryParams.push(provider);
    }

    queryParams.push(parseInt(limit), parseInt(offset));

    const query = `
      SELECT id, to_email, from_email, subject, provider, status, 
             error_message, message_id, sent_at, retry_count, created_at,
             booking_id, user_id
      FROM email_logs 
      WHERE ${whereClause}
      ORDER BY created_at DESC 
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    const countQuery = `
      SELECT COUNT(*) as total 
      FROM email_logs 
      WHERE ${whereClause}
    `;

    const [logsResult, countResult] = await Promise.all([
      req.pool.query(query, queryParams),
      req.pool.query(countQuery, queryParams.slice(0, -2))
    ]);

    res.json({
      success: true,
      logs: logsResult.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < parseInt(countResult.rows[0].total)
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
    let dateFilter = "created_at >= NOW() - INTERVAL '7 days'";
    if (period === '1d') dateFilter = "created_at >= NOW() - INTERVAL '1 day'";
    if (period === '30d') dateFilter = "created_at >= NOW() - INTERVAL '30 days'";
    if (period === '90d') dateFilter = "created_at >= NOW() - INTERVAL '90 days'";

    const query = `
      SELECT 
        COUNT(*) as total_emails,
        COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_emails,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_emails,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_emails,
        ROUND(
          (COUNT(CASE WHEN status = 'sent' THEN 1 END)::decimal / NULLIF(COUNT(*), 0)) * 100, 
          2
        ) as success_rate,
        COUNT(DISTINCT provider) as providers_used,
        COUNT(DISTINCT to_email) as unique_recipients
      FROM email_logs 
      WHERE ${dateFilter}
    `;

    const result = await req.pool.query(query);
    const stats = result.rows[0];

    // Convert counts to numbers
    Object.keys(stats).forEach(key => {
      if (key !== 'success_rate') {
        stats[key] = parseInt(stats[key]) || 0;
      } else {
        stats[key] = parseFloat(stats[key]) || 0;
      }
    });

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