const express = require('express');
const Joi = require('joi');
const bcrypt = require('bcryptjs');
const { requireAuth: authenticateToken, requireRole } = require('../lib/auth-utils');
const { prisma } = require('../lib/prisma');
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
    const accounts = await prisma.email_accounts.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        purpose: true,
        provider: true,
        smtp_host: true,
        smtp_port: true,
        smtp_secure: true,
        smtp_user: true,
        from_name: true,
        reply_to_email: true,
        is_active: true,
        is_primary: true,
        priority: true,
        daily_limit: true,
        hourly_limit: true,
        created_at: true,
        updated_at: true,
        last_used_at: true,
        total_sent: true,
        total_failed: true,
        last_error: true
      },
      orderBy: [
        { priority: 'asc' },
        { created_at: 'desc' }
      ]
    });
    
    res.json({
      success: true,
      accounts: accounts,
      total: accounts.length
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

    const account = await prisma.email_accounts.findUnique({
      where: { id: id },
      select: {
        id: true,
        name: true,
        email: true,
        purpose: true,
        provider: true,
        smtp_host: true,
        smtp_port: true,
        smtp_secure: true,
        smtp_user: true,
        from_name: true,
        reply_to_email: true,
        is_active: true,
        is_primary: true,
        priority: true,
        daily_limit: true,
        hourly_limit: true,
        created_at: true,
        updated_at: true,
        last_used_at: true,
        total_sent: true,
        total_failed: true,
        last_error: true
      }
    });
    
    if (!account) {
      return res.status(404).json({
        error: 'Email account not found',
        code: 'EMAIL_ACCOUNT_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      account: account
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
  try {
    // Validate input
    const { error, value } = emailAccountSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(detail => detail.message)
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Check if email already exists
      const existingAccount = await tx.email_accounts.findUnique({
        where: { email: value.email },
        select: { id: true }
      });

      if (existingAccount) {
        throw new Error('EMAIL_ACCOUNT_EXISTS');
      }

      // If this is being set as primary, unset other primary accounts
      if (value.is_primary) {
        await tx.email_accounts.updateMany({
          where: {},
          data: { is_primary: false }
        });
      }

      // Encrypt password before storing
      const encryptedPassword = await bcrypt.hash(value.smtp_password, 10);

      // Insert new email account
      const newAccount = await tx.email_accounts.create({
        data: {
          name: value.name,
          email: value.email,
          purpose: value.purpose,
          provider: value.provider,
          smtp_host: value.smtp_host,
          smtp_port: value.smtp_port,
          smtp_secure: value.smtp_secure,
          smtp_user: value.smtp_user,
          smtp_password: encryptedPassword,
          from_name: value.from_name,
          reply_to_email: value.reply_to_email,
          is_active: value.is_active,
          is_primary: value.is_primary,
          priority: value.priority,
          daily_limit: value.daily_limit,
          hourly_limit: value.hourly_limit,
          created_by: req.user.id,
          updated_by: req.user.id
        },
        select: {
          id: true,
          name: true,
          email: true,
          purpose: true,
          provider: true,
          smtp_host: true,
          smtp_port: true,
          smtp_secure: true,
          smtp_user: true,
          from_name: true,
          reply_to_email: true,
          is_active: true,
          is_primary: true,
          priority: true,
          daily_limit: true,
          hourly_limit: true,
          created_at: true,
          updated_at: true
        }
      });

      return newAccount;
    });

    req.logger.info(`Email account created: ${result.email} by: ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Email account created successfully',
      account: result
    });

  } catch (error) {
    if (error.message === 'EMAIL_ACCOUNT_EXISTS') {
      return res.status(409).json({
        error: 'Email account already exists',
        code: 'EMAIL_ACCOUNT_EXISTS'
      });
    }

    req.logger.error('Create email account error:', error);
    res.status(500).json({
      error: 'Failed to create email account',
      code: 'CREATE_EMAIL_ACCOUNT_ERROR'
    });
  }
});

// Update email account (admin only)
router.put('/:id',  async (req, res) => {
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

    const result = await prisma.$transaction(async (tx) => {
      // Check if account exists
      const existingAccount = await tx.email_accounts.findUnique({
        where: { id: id },
        select: { id: true, email: true }
      });

      if (!existingAccount) {
        throw new Error('EMAIL_ACCOUNT_NOT_FOUND');
      }

      // Check if email is being changed and if new email already exists
      if (value.email !== existingAccount.email) {
        const emailCheck = await tx.email_accounts.findFirst({
          where: {
            email: value.email,
            id: { not: id }
          },
          select: { id: true }
        });

        if (emailCheck) {
          throw new Error('EMAIL_ALREADY_EXISTS');
        }
      }

      // If this is being set as primary, unset other primary accounts
      if (value.is_primary) {
        await tx.email_accounts.updateMany({
          where: { id: { not: id } },
          data: { is_primary: false }
        });
      }

      // Build update data dynamically
      const updateData = {
        updated_by: req.user.id,
        updated_at: new Date()
      };

      // Add all fields except password
      for (const [key, val] of Object.entries(value)) {
        if (key === 'smtp_password' && val) {
          // Encrypt password if provided
          const encryptedPassword = await bcrypt.hash(val, 10);
          updateData.smtp_password = encryptedPassword;
        } else if (key !== 'smtp_password') {
          updateData[key] = val;
        }
      }

      // Update the account
      const updatedAccount = await tx.email_accounts.update({
        where: { id: id },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          purpose: true,
          provider: true,
          smtp_host: true,
          smtp_port: true,
          smtp_secure: true,
          smtp_user: true,
          from_name: true,
          reply_to_email: true,
          is_active: true,
          is_primary: true,
          priority: true,
          daily_limit: true,
          hourly_limit: true,
          created_at: true,
          updated_at: true
        }
      });

      return updatedAccount;
    });

    req.logger.info(`Email account updated: ${result.email} by: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Email account updated successfully',
      account: result
    });

  } catch (error) {
    if (error.message === 'EMAIL_ACCOUNT_NOT_FOUND') {
      return res.status(404).json({
        error: 'Email account not found',
        code: 'EMAIL_ACCOUNT_NOT_FOUND'
      });
    }

    if (error.message === 'EMAIL_ALREADY_EXISTS') {
      return res.status(409).json({
        error: 'Email address already in use by another account',
        code: 'EMAIL_ALREADY_EXISTS'
      });
    }

    req.logger.error('Update email account error:', error);
    res.status(500).json({
      error: 'Failed to update email account',
      code: 'UPDATE_EMAIL_ACCOUNT_ERROR'
    });
  }
});

// Delete email account (admin only)
router.delete('/:id',  async (req, res) => {
  try {
    const { id } = req.params;

    const result = await prisma.$transaction(async (tx) => {
      // Check if account exists and get details
      const account = await tx.email_accounts.findUnique({
        where: { id: id },
        select: { id: true, email: true, is_primary: true }
      });

      if (!account) {
        throw new Error('EMAIL_ACCOUNT_NOT_FOUND');
      }

      // Prevent deletion of primary account if it's the only one
      if (account.is_primary) {
        const totalAccounts = await tx.email_accounts.count();
        if (totalAccounts === 1) {
          throw new Error('CANNOT_DELETE_ONLY_ACCOUNT');
        }
      }

      // Delete the account
      await tx.email_accounts.delete({
        where: { id: id }
      });

      // If we deleted the primary account, set another account as primary
      if (account.is_primary) {
        // Find the next account to set as primary
        const nextPrimaryAccount = await tx.email_accounts.findFirst({
          orderBy: [
            { priority: 'asc' },
            { created_at: 'asc' }
          ],
          select: { id: true }
        });

        if (nextPrimaryAccount) {
          await tx.email_accounts.update({
            where: { id: nextPrimaryAccount.id },
            data: { is_primary: true }
          });
        }
      }

      return account;
    });

    req.logger.info(`Email account deleted: ${result.email} by: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Email account deleted successfully'
    });

  } catch (error) {
    if (error.message === 'EMAIL_ACCOUNT_NOT_FOUND') {
      return res.status(404).json({
        error: 'Email account not found',
        code: 'EMAIL_ACCOUNT_NOT_FOUND'
      });
    }

    if (error.message === 'CANNOT_DELETE_ONLY_ACCOUNT') {
      return res.status(400).json({
        error: 'Cannot delete the only email account',
        code: 'CANNOT_DELETE_ONLY_ACCOUNT'
      });
    }

    req.logger.error('Delete email account error:', error);
    res.status(500).json({
      error: 'Failed to delete email account',
      code: 'DELETE_EMAIL_ACCOUNT_ERROR'
    });
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
    const account = await prisma.email_accounts.findFirst({
      where: { 
        id: id,
        is_active: true 
      },
      select: {
        id: true,
        name: true,
        email: true,
        smtp_host: true,
        smtp_port: true,
        smtp_secure: true,
        smtp_user: true,
        smtp_password: true,
        from_name: true,
        provider: true
      }
    });
    
    if (!account) {
      return res.status(404).json({
        error: 'Email account not found or inactive',
        code: 'EMAIL_ACCOUNT_NOT_FOUND'
      });
    }

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

    // Log the test email and update usage stats in a transaction
    await prisma.$transaction([
      // Log the test email
      prisma.email_logs.create({
        data: {
          to_email: to_email,
          from_email: account.email,
          subject: mailOptions.subject,
          provider: account.provider,
          status: 'sent',
          message_id: info.messageId,
          sent_at: new Date(),
          user_id: req.user.id
        }
      }),
      // Update account usage stats
      prisma.email_accounts.update({
        where: { id: id },
        data: {
          total_sent: { increment: 1 },
          last_used_at: new Date()
        }
      })
    ]);

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
      await prisma.email_logs.create({
        data: {
          to_email: req.body.to_email || 'unknown',
          from_email: 'test',
          subject: 'Email Account Test',
          provider: 'unknown',
          status: 'failed',
          error_message: error.message,
          user_id: req.user.id
        }
      });
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
    let dateFilter = new Date();
    if (period === '1d') {
      dateFilter.setDate(dateFilter.getDate() - 1);
    } else if (period === '30d') {
      dateFilter.setDate(dateFilter.getDate() - 30);
    } else { // default '7d'
      dateFilter.setDate(dateFilter.getDate() - 7);
    }

    // Get account details first
    const account = await prisma.email_accounts.findUnique({
      where: { id: id },
      select: {
        id: true,
        name: true,
        email: true,
        total_sent: true,
        total_failed: true,
        last_used_at: true
      }
    });

    if (!account) {
      return res.status(404).json({
        error: 'Email account not found',
        code: 'EMAIL_ACCOUNT_NOT_FOUND'
      });
    }

    // Get period statistics using the account email
    const emailLogs = await prisma.email_logs.findMany({
      where: {
        from_email: account.email,
        created_at: {
          gte: dateFilter
        }
      },
      select: {
        status: true
      }
    });

    // Calculate statistics manually since Prisma doesn't support conditional aggregation directly
    const totalEmails = emailLogs.length;
    const sentEmails = emailLogs.filter(log => log.status === 'sent').length;
    const failedEmails = emailLogs.filter(log => log.status === 'failed').length;
    const successRate = totalEmails > 0 ? ((sentEmails / totalEmails) * 100).toFixed(2) : 0;

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
        total_emails: totalEmails,
        sent_emails: sentEmails,
        failed_emails: failedEmails,
        success_rate: parseFloat(successRate)
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