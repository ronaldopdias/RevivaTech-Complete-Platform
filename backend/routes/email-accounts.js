const express = require('express');
const Joi = require('joi');
const bcrypt = require('bcryptjs');
const { authenticateBetterAuth: authenticateToken, requireRole } = require('../middleware/better-auth-official');
const router = express.Router();

// Validation schemas
const emailAccountSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  email: Joi.string().email().required(),
  purpose: Joi.string().max(500).optional(),
  
  // SMTP Configuration
  provider: Joi.string().valid('zoho', 'gmail', 'sendgrid', 'smtp').required(),
  smtp_host: Joi.string().hostname().required(),
  smtp_port: Joi.number().integer().min(1).max(65535).required(),
  smtp_secure: Joi.boolean().required(),
  smtp_user: Joi.string().email().required(),
  smtp_password: Joi.string().min(1).required(),
  
  // Email Settings
  from_name: Joi.string().min(1).max(100).required(),
  reply_to_email: Joi.string().email().optional(),
  
  // Configuration
  is_active: Joi.boolean().default(true),
  is_primary: Joi.boolean().default(false),
  priority: Joi.number().integer().min(1).max(100).default(1),
  
  // Rate Limiting
  daily_limit: Joi.number().integer().min(1).default(1000),
  hourly_limit: Joi.number().integer().min(1).default(100)
});

// Get all email accounts (admin only)
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        id, name, email, purpose, provider, smtp_host, smtp_port, smtp_secure, 
        smtp_user, from_name, reply_to_email, is_active, is_primary, priority,
        daily_limit, hourly_limit, created_at, updated_at, last_used_at,
        total_sent, total_failed, last_error
      FROM email_accounts 
      ORDER BY priority ASC, created_at DESC
    `;

    const result = await req.pool.query(query);
    
    res.json({
      success: true,
      accounts: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    req.logger.error('Get email accounts error:', error);
    res.status(500).json({
      error: 'Failed to fetch email accounts',
      code: 'FETCH_EMAIL_ACCOUNTS_ERROR'
    });
  }
});

// Get single email account (admin only)
router.get('/:id',  async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        id, name, email, purpose, provider, smtp_host, smtp_port, smtp_secure, 
        smtp_user, from_name, reply_to_email, is_active, is_primary, priority,
        daily_limit, hourly_limit, created_at, updated_at, last_used_at,
        total_sent, total_failed, last_error
      FROM email_accounts 
      WHERE id = $1
    `;

    const result = await req.pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Email account not found',
        code: 'EMAIL_ACCOUNT_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      account: result.rows[0]
    });

  } catch (error) {
    req.logger.error('Get email account error:', error);
    res.status(500).json({
      error: 'Failed to fetch email account',
      code: 'FETCH_EMAIL_ACCOUNT_ERROR'
    });
  }
});

// Create new email account (admin only)
router.post('/',  async (req, res) => {
  const client = await req.pool.connect();
  
  try {
    // Validate input
    const { error, value } = emailAccountSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(detail => detail.message)
      });
    }

    await client.query('BEGIN');

    // Check if email already exists
    const existingCheck = await client.query(
      'SELECT id FROM email_accounts WHERE email = $1',
      [value.email]
    );

    if (existingCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        error: 'Email account already exists',
        code: 'EMAIL_ACCOUNT_EXISTS'
      });
    }

    // If this is being set as primary, unset other primary accounts
    if (value.is_primary) {
      await client.query('UPDATE email_accounts SET is_primary = false');
    }

    // Encrypt password before storing
    const encryptedPassword = await bcrypt.hash(value.smtp_password, 10);

    // Insert new email account
    const insertQuery = `
      INSERT INTO email_accounts (
        name, email, purpose, provider, smtp_host, smtp_port, smtp_secure,
        smtp_user, smtp_password, from_name, reply_to_email, is_active, 
        is_primary, priority, daily_limit, hourly_limit, created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $17)
      RETURNING id, name, email, purpose, provider, smtp_host, smtp_port, smtp_secure,
                smtp_user, from_name, reply_to_email, is_active, is_primary, priority,
                daily_limit, hourly_limit, created_at, updated_at
    `;

    const result = await client.query(insertQuery, [
      value.name, value.email, value.purpose, value.provider,
      value.smtp_host, value.smtp_port, value.smtp_secure,
      value.smtp_user, encryptedPassword, value.from_name, value.reply_to_email,
      value.is_active, value.is_primary, value.priority,
      value.daily_limit, value.hourly_limit, req.user.id
    ]);

    await client.query('COMMIT');

    const newAccount = result.rows[0];
    req.logger.info(`Email account created: ${newAccount.email} by: ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Email account created successfully',
      account: newAccount
    });

  } catch (error) {
    await client.query('ROLLBACK');
    req.logger.error('Create email account error:', error);
    res.status(500).json({
      error: 'Failed to create email account',
      code: 'CREATE_EMAIL_ACCOUNT_ERROR'
    });
  } finally {
    client.release();
  }
});

// Update email account (admin only)
router.put('/:id',  async (req, res) => {
  const client = await req.pool.connect();
  
  try {
    const { id } = req.params;

    // Validate input (password is optional for updates)
    const updateSchema = emailAccountSchema.fork(['smtp_password'], (schema) => schema.optional());
    const { error, value } = updateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(detail => detail.message)
      });
    }

    await client.query('BEGIN');

    // Check if account exists
    const existingAccount = await client.query(
      'SELECT id, email FROM email_accounts WHERE id = $1',
      [id]
    );

    if (existingAccount.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        error: 'Email account not found',
        code: 'EMAIL_ACCOUNT_NOT_FOUND'
      });
    }

    // Check if email is being changed and if new email already exists
    if (value.email !== existingAccount.rows[0].email) {
      const emailCheck = await client.query(
        'SELECT id FROM email_accounts WHERE email = $1 AND id != $2',
        [value.email, id]
      );

      if (emailCheck.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({
          error: 'Email address already in use by another account',
          code: 'EMAIL_ALREADY_EXISTS'
        });
      }
    }

    // If this is being set as primary, unset other primary accounts
    if (value.is_primary) {
      await client.query('UPDATE email_accounts SET is_primary = false WHERE id != $1', [id]);
    }

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    for (const [key, val] of Object.entries(value)) {
      if (key === 'smtp_password' && val) {
        // Encrypt password if provided
        const encryptedPassword = await bcrypt.hash(val, 10);
        updateFields.push(`smtp_password = $${paramIndex++}`);
        updateValues.push(encryptedPassword);
      } else if (key !== 'smtp_password') {
        updateFields.push(`${key} = $${paramIndex++}`);
        updateValues.push(val);
      }
    }

    // Add updated_by and updated_at
    updateFields.push(`updated_by = $${paramIndex++}`);
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(req.user.id);
    updateValues.push(id); // for WHERE clause

    const updateQuery = `
      UPDATE email_accounts 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, name, email, purpose, provider, smtp_host, smtp_port, smtp_secure,
                smtp_user, from_name, reply_to_email, is_active, is_primary, priority,
                daily_limit, hourly_limit, created_at, updated_at
    `;

    const result = await client.query(updateQuery, updateValues);
    await client.query('COMMIT');

    const updatedAccount = result.rows[0];
    req.logger.info(`Email account updated: ${updatedAccount.email} by: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Email account updated successfully',
      account: updatedAccount
    });

  } catch (error) {
    await client.query('ROLLBACK');
    req.logger.error('Update email account error:', error);
    res.status(500).json({
      error: 'Failed to update email account',
      code: 'UPDATE_EMAIL_ACCOUNT_ERROR'
    });
  } finally {
    client.release();
  }
});

// Delete email account (admin only)
router.delete('/:id',  async (req, res) => {
  const client = await req.pool.connect();
  
  try {
    const { id } = req.params;

    await client.query('BEGIN');

    // Check if account exists and get details
    const accountCheck = await client.query(
      'SELECT id, email, is_primary FROM email_accounts WHERE id = $1',
      [id]
    );

    if (accountCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        error: 'Email account not found',
        code: 'EMAIL_ACCOUNT_NOT_FOUND'
      });
    }

    const account = accountCheck.rows[0];

    // Prevent deletion of primary account if it's the only one
    if (account.is_primary) {
      const totalAccounts = await client.query('SELECT COUNT(*) as count FROM email_accounts');
      if (parseInt(totalAccounts.rows[0].count) === 1) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: 'Cannot delete the only email account',
          code: 'CANNOT_DELETE_ONLY_ACCOUNT'
        });
      }
    }

    // Delete the account
    await client.query('DELETE FROM email_accounts WHERE id = $1', [id]);

    // If we deleted the primary account, set another account as primary
    if (account.is_primary) {
      await client.query(`
        UPDATE email_accounts 
        SET is_primary = true 
        WHERE id = (
          SELECT id FROM email_accounts 
          ORDER BY priority ASC, created_at ASC 
          LIMIT 1
        )
      `);
    }

    await client.query('COMMIT');

    req.logger.info(`Email account deleted: ${account.email} by: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Email account deleted successfully'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    req.logger.error('Delete email account error:', error);
    res.status(500).json({
      error: 'Failed to delete email account',
      code: 'DELETE_EMAIL_ACCOUNT_ERROR'
    });
  } finally {
    client.release();
  }
});

// Test email account (admin only)
router.post('/:id/test',  async (req, res) => {
  try {
    const { id } = req.params;
    const { to_email, subject = 'Test Email', message = 'This is a test email.' } = req.body;

    if (!to_email) {
      return res.status(400).json({
        error: 'Recipient email address is required',
        code: 'MISSING_TO_EMAIL'
      });
    }

    // Get account details
    const accountQuery = `
      SELECT id, name, email, smtp_host, smtp_port, smtp_secure, smtp_user, 
             smtp_password, from_name, provider
      FROM email_accounts 
      WHERE id = $1 AND is_active = true
    `;

    const accountResult = await req.pool.query(accountQuery, [id]);
    
    if (accountResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Email account not found or inactive',
        code: 'EMAIL_ACCOUNT_NOT_FOUND'
      });
    }

    const account = accountResult.rows[0];

    // Import nodemailer
    const nodemailer = require('nodemailer');

    // Decrypt password (for production, implement proper decryption)
    const decryptedPassword = account.smtp_password; // Placeholder for actual decryption

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: account.smtp_host,
      port: account.smtp_port,
      secure: account.smtp_secure,
      auth: {
        user: account.smtp_user,
        pass: decryptedPassword
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Verify connection first
    await transporter.verify();

    // Send test email
    const mailOptions = {
      from: `${account.from_name} <${account.email}>`,
      to: to_email,
      subject: `[Test] ${subject} - ${account.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1A5266;">Email Account Test - ${account.name}</h2>
          <p>${message}</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p><strong>Account Details:</strong></p>
          <ul>
            <li><strong>Account Name:</strong> ${account.name}</li>
            <li><strong>Email:</strong> ${account.email}</li>
            <li><strong>Provider:</strong> ${account.provider}</li>
            <li><strong>SMTP Host:</strong> ${account.smtp_host}</li>
            <li><strong>Test Time:</strong> ${new Date().toISOString()}</li>
          </ul>
          <p style="color: #666; font-size: 12px;">
            This is a test email from RevivaTech email account management system.
          </p>
        </div>
      `,
      text: `Email Account Test - ${account.name}\n\n${message}\n\nAccount: ${account.email}\nProvider: ${account.provider}\nTest Time: ${new Date().toISOString()}`
    };

    const info = await transporter.sendMail(mailOptions);

    // Log the test email
    await req.pool.query(`
      INSERT INTO email_logs (to_email, from_email, subject, provider, status, message_id, sent_at, user_id)
      VALUES ($1, $2, $3, $4, 'sent', $5, NOW(), $6)
    `, [to_email, account.email, mailOptions.subject, account.provider, info.messageId, req.user.id]);

    // Update account usage stats
    await req.pool.query(`
      UPDATE email_accounts 
      SET total_sent = total_sent + 1, last_used_at = NOW() 
      WHERE id = $1
    `, [id]);

    req.logger.info(`Test email sent from account ${account.email} to ${to_email} by: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Test email sent successfully',
      details: {
        messageId: info.messageId,
        from: account.email,
        to: to_email,
        account: account.name,
        sentAt: new Date().toISOString()
      }
    });

  } catch (error) {
    req.logger.error('Test email error:', error);
    
    // Log failed test attempt
    try {
      await req.pool.query(`
        INSERT INTO email_logs (to_email, from_email, subject, provider, status, error_message, user_id)
        VALUES ($1, $2, $3, $4, 'failed', $5, $6)
      `, [
        req.body.to_email || 'unknown',
        'test',
        'Email Account Test',
        'unknown',
        error.message,
        req.user.id
      ]);
    } catch (logError) {
      req.logger.error('Failed to log test email error:', logError);
    }

    res.status(500).json({
      error: 'Failed to send test email',
      code: 'TEST_EMAIL_ERROR',
      details: error.message
    });
  }
});

// Get account usage statistics (admin only)
router.get('/:id/stats',  async (req, res) => {
  try {
    const { id } = req.params;
    const { period = '7d' } = req.query;

    // Calculate date range
    let dateFilter = "created_at >= NOW() - INTERVAL '7 days'";
    if (period === '1d') dateFilter = "created_at >= NOW() - INTERVAL '1 day'";
    if (period === '30d') dateFilter = "created_at >= NOW() - INTERVAL '30 days'";

    // Get account details
    const accountQuery = `
      SELECT id, name, email, total_sent, total_failed, last_used_at
      FROM email_accounts 
      WHERE id = $1
    `;

    // Get period statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_emails,
        COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_emails,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_emails,
        ROUND(
          (COUNT(CASE WHEN status = 'sent' THEN 1 END)::decimal / NULLIF(COUNT(*), 0)) * 100, 
          2
        ) as success_rate
      FROM email_logs 
      WHERE from_email = (SELECT email FROM email_accounts WHERE id = $1)
        AND ${dateFilter}
    `;

    const [accountResult, statsResult] = await Promise.all([
      req.pool.query(accountQuery, [id]),
      req.pool.query(statsQuery, [id])
    ]);

    if (accountResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Email account not found',
        code: 'EMAIL_ACCOUNT_NOT_FOUND'
      });
    }

    const account = accountResult.rows[0];
    const stats = statsResult.rows[0];

    res.json({
      success: true,
      account: {
        id: account.id,
        name: account.name,
        email: account.email,
        last_used_at: account.last_used_at
      },
      period_stats: {
        period,
        ...stats,
        total_emails: parseInt(stats.total_emails) || 0,
        sent_emails: parseInt(stats.sent_emails) || 0,
        failed_emails: parseInt(stats.failed_emails) || 0,
        success_rate: parseFloat(stats.success_rate) || 0
      },
      lifetime_stats: {
        total_sent: parseInt(account.total_sent) || 0,
        total_failed: parseInt(account.total_failed) || 0
      },
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    req.logger.error('Get account stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch account statistics',
      code: 'FETCH_ACCOUNT_STATS_ERROR'
    });
  }
});

module.exports = router;