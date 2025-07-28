const express = require('express');
const Joi = require('joi');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/authentication');
const { hashPassword } = require('../middleware/authentication');

// Validation schemas
const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required()
    .messages({
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    }),
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).optional(),
  role: Joi.string().valid('customer', 'admin', 'technician').required(),
  status: Joi.string().valid('active', 'suspended', 'inactive').default('active')
});

const updateUserSchema = Joi.object({
  email: Joi.string().email().optional(),
  firstName: Joi.string().min(2).max(50).optional(),
  lastName: Joi.string().min(2).max(50).optional(),
  phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).optional().allow(''),
  role: Joi.string().valid('customer', 'admin', 'technician').optional(),
  status: Joi.string().valid('active', 'suspended', 'inactive').optional()
});

const changePasswordSchema = Joi.object({
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required()
});

// GET /api/users - List all users (Admin only)
router.get('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '', status = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        id, email, first_name, last_name, phone, role, status, 
        email_verified, last_login, created_at, updated_at
      FROM users
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    // Add search filter
    if (search) {
      paramCount++;
      query += ` AND (
        LOWER(email) LIKE LOWER($${paramCount}) OR 
        LOWER(first_name) LIKE LOWER($${paramCount}) OR 
        LOWER(last_name) LIKE LOWER($${paramCount})
      )`;
      params.push(`%${search}%`);
    }

    // Add role filter
    if (role) {
      paramCount++;
      query += ` AND role = $${paramCount}`;
      params.push(role);
    }

    // Add status filter
    if (status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(status);
    }

    // Add pagination
    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total
      FROM users
      WHERE 1=1
    `;
    const countParams = [];

    if (search) {
      countQuery += ` AND (
        LOWER(email) LIKE LOWER($1) OR 
        LOWER(first_name) LIKE LOWER($1) OR 
        LOWER(last_name) LIKE LOWER($1)
      )`;
      countParams.push(`%${search}%`);
    }

    if (role) {
      countQuery += ` AND role = $${countParams.length + 1}`;
      countParams.push(role);
    }

    if (status) {
      countQuery += ` AND status = $${countParams.length + 1}`;
      countParams.push(status);
    }

    const [usersResult, countResult] = await Promise.all([
      req.pool.query(query, params),
      req.pool.query(countQuery, countParams)
    ]);

    res.json({
      users: usersResult.rows.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        role: user.role,
        status: user.status,
        emailVerified: user.email_verified,
        lastLogin: user.last_login,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total),
        pages: Math.ceil(countResult.rows[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/users/:id - Get single user (Admin only)
router.get('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await req.pool.query(
      `SELECT 
        id, email, first_name, last_name, phone, role, status, 
        email_verified, last_login, created_at, updated_at
      FROM users
      WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    res.json({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      role: user.role,
      status: user.status,
      emailVerified: user.email_verified,
      lastLogin: user.last_login,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// POST /api/users - Create new user (Admin only)
router.post('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  const client = await req.pool.connect();

  try {
    // Validate input
    const { error, value } = createUserSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(detail => detail.message)
      });
    }

    const { email, password, firstName, lastName, phone, role, status } = value;

    await client.query('BEGIN');

    // Check if user already exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        error: 'Email already registered',
        code: 'EMAIL_EXISTS'
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const result = await client.query(
      `INSERT INTO users (
        email, password_hash, first_name, last_name, phone, role, status, email_verified
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, email, first_name, last_name, phone, role, status, created_at`,
      [
        email.toLowerCase(),
        passwordHash,
        firstName,
        lastName,
        phone || null,
        role,
        status,
        true // Set as verified when created by admin
      ]
    );

    await client.query('COMMIT');

    const newUser = result.rows[0];
    res.status(201).json({
      id: newUser.id,
      email: newUser.email,
      firstName: newUser.first_name,
      lastName: newUser.last_name,
      phone: newUser.phone,
      role: newUser.role,
      status: newUser.status,
      createdAt: newUser.created_at
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  } finally {
    client.release();
  }
});

// PUT /api/users/:id - Update user (Admin only)
router.put('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  const client = await req.pool.connect();

  try {
    const { id } = req.params;

    // Validate input
    const { error, value } = updateUserSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(detail => detail.message)
      });
    }

    await client.query('BEGIN');

    // Check if user exists
    const existingUser = await client.query(
      'SELECT id, email FROM users WHERE id = $1',
      [id]
    );

    if (existingUser.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'User not found' });
    }

    // If email is being changed, check if new email already exists
    if (value.email && value.email !== existingUser.rows[0].email) {
      const emailCheck = await client.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [value.email.toLowerCase(), id]
      );

      if (emailCheck.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({
          error: 'Email already in use',
          code: 'EMAIL_EXISTS'
        });
      }
    }

    // Build update query dynamically
    const updates = [];
    const params = [];
    let paramCount = 0;

    if (value.email) {
      paramCount++;
      updates.push(`email = $${paramCount}`);
      params.push(value.email.toLowerCase());
    }

    if (value.firstName) {
      paramCount++;
      updates.push(`first_name = $${paramCount}`);
      params.push(value.firstName);
    }

    if (value.lastName) {
      paramCount++;
      updates.push(`last_name = $${paramCount}`);
      params.push(value.lastName);
    }

    if (value.phone !== undefined) {
      paramCount++;
      updates.push(`phone = $${paramCount}`);
      params.push(value.phone || null);
    }

    if (value.role) {
      paramCount++;
      updates.push(`role = $${paramCount}`);
      params.push(value.role);
    }

    if (value.status) {
      paramCount++;
      updates.push(`status = $${paramCount}`);
      params.push(value.status);
    }

    // Always update updated_at
    updates.push('updated_at = CURRENT_TIMESTAMP');

    paramCount++;
    params.push(id);

    const result = await client.query(
      `UPDATE users SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, email, first_name, last_name, phone, role, status, updated_at`,
      params
    );

    await client.query('COMMIT');

    const updatedUser = result.rows[0];
    res.json({
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.first_name,
      lastName: updatedUser.last_name,
      phone: updatedUser.phone,
      role: updatedUser.role,
      status: updatedUser.status,
      updatedAt: updatedUser.updated_at
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  } finally {
    client.release();
  }
});

// DELETE /api/users/:id - Delete user (Admin only)
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  const client = await req.pool.connect();

  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await client.query('BEGIN');

    // Check if user exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE id = $1',
      [id]
    );

    if (existingUser.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete user (cascading will handle related records)
    await client.query('DELETE FROM users WHERE id = $1', [id]);

    await client.query('COMMIT');

    res.status(204).send();
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  } finally {
    client.release();
  }
});

// POST /api/users/:id/change-password - Change user password (Admin only)
router.post('/:id/change-password', authenticateToken, requireRole(['admin']), async (req, res) => {
  const client = await req.pool.connect();

  try {
    const { id } = req.params;

    // Validate input
    const { error, value } = changePasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(detail => detail.message)
      });
    }

    await client.query('BEGIN');

    // Check if user exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE id = $1',
      [id]
    );

    if (existingUser.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'User not found' });
    }

    // Hash new password
    const passwordHash = await hashPassword(value.password);

    // Update password
    await client.query(
      `UPDATE users 
      SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2`,
      [passwordHash, id]
    );

    // Revoke all existing sessions for the user
    await client.query(
      'DELETE FROM user_sessions WHERE user_id = $1',
      [id]
    );

    await client.query('COMMIT');

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Failed to change password' });
  } finally {
    client.release();
  }
});

// GET /api/users/stats - Get user statistics (Admin only)
router.get('/stats/overview', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) FILTER (WHERE role = 'customer') as total_customers,
        COUNT(*) FILTER (WHERE role = 'admin') as total_admins,
        COUNT(*) FILTER (WHERE role = 'technician') as total_technicians,
        COUNT(*) FILTER (WHERE status = 'active') as active_users,
        COUNT(*) FILTER (WHERE status = 'suspended') as suspended_users,
        COUNT(*) FILTER (WHERE status = 'inactive') as inactive_users,
        COUNT(*) FILTER (WHERE email_verified = true) as verified_users,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_users_30d
      FROM users
    `;

    const result = await req.pool.query(statsQuery);
    const stats = result.rows[0];

    res.json({
      byRole: {
        customer: parseInt(stats.total_customers),
        admin: parseInt(stats.total_admins),
        technician: parseInt(stats.total_technicians)
      },
      byStatus: {
        active: parseInt(stats.active_users),
        suspended: parseInt(stats.suspended_users),
        inactive: parseInt(stats.inactive_users)
      },
      verified: parseInt(stats.verified_users),
      newUsers30Days: parseInt(stats.new_users_30d),
      total: parseInt(stats.total_customers) + parseInt(stats.total_admins) + parseInt(stats.total_technicians)
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
});

module.exports = router;