const express = require('express');
const Joi = require('joi');
const { prisma } = require('../lib/prisma');
const router = express.Router();
const { requireAuth: authenticateToken, requireRole, requireAdmin } = require('../lib/auth-utils');

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
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '', status = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        id, email, "firstName", "lastName", phone, role, "isActive",
        "emailVerified", "createdAt", "updatedAt"
      FROM "user"
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    // Add search filter
    if (search) {
      paramCount++;
      query += ` AND (
        LOWER(email) LIKE LOWER($${paramCount}) OR 
        LOWER("firstName") LIKE LOWER($${paramCount}) OR 
        LOWER("lastName") LIKE LOWER($${paramCount})
      )`;
      params.push(`%${search}%`);
    }

    // Add role filter
    if (role) {
      paramCount++;
      query += ` AND role = $${paramCount}`;
      params.push(role);
    }

    // Add status filter (map to isActive)
    if (status) {
      paramCount++;
      if (status === 'active') {
        query += ` AND "isActive" = $${paramCount}`;
        params.push(true);
      } else {
        query += ` AND "isActive" = $${paramCount}`;
        params.push(false);
      }
    }

    // Add pagination
    query += ` ORDER BY "createdAt" DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total
      FROM "user"
      WHERE 1=1
    `;
    const countParams = [];

    if (search) {
      countQuery += ` AND (
        LOWER(email) LIKE LOWER($1) OR 
        LOWER("firstName") LIKE LOWER($1) OR 
        LOWER("lastName") LIKE LOWER($1)
      )`;
      countParams.push(`%${search}%`);
    }

    if (role) {
      countQuery += ` AND role = $${countParams.length + 1}`;
      countParams.push(role);
    }

    if (status) {
      if (status === 'active') {
        countQuery += ` AND "isActive" = $${countParams.length + 1}`;
        countParams.push(true);
      } else {
        countQuery += ` AND "isActive" = $${countParams.length + 1}`;
        countParams.push(false);
      }
    }

    // SECURITY MIGRATION: Replace raw SQL with Prisma to prevent injection
    const whereClause = {};
    
    if (search) {
      whereClause.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (role) {
      whereClause.role = role;
    }
    
    if (status) {
      whereClause.isActive = status === 'active';
    }

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          isVerified: true,
          createdAt: true,
          lastLoginAt: true
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      }),
      prisma.user.count({ where: whereClause })
    ]);

    res.json({
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        status: user.isActive ? 'active' : 'inactive',
        emailVerified: user.emailVerified,
        lastLogin: null, // Better Auth doesn't track lastLogin
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    // Error logged through Winston logger in production
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/users/:id - Get single user (Admin only)
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      status: user.isActive ? 'active' : 'suspended',
      emailVerified: user.emailVerified,
      lastLogin: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// POST /api/users - Create new user (Admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
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
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
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
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
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
router.post('/:id/change-password', authenticateToken, requireAdmin, async (req, res) => {
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
router.get('/stats/overview', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Use Prisma aggregations to get user statistics
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalCustomers,
      totalAdmins,
      totalTechnicians,
      activeUsers,
      suspendedUsers,
      verifiedUsers,
      newUsers30d
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.user.count({ where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } } }),
      prisma.user.count({ where: { role: 'TECHNICIAN' } }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: false } }),
      prisma.user.count({ where: { emailVerified: true } }),
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } })
    ]);

    res.json({
      byRole: {
        customer: totalCustomers,
        admin: totalAdmins,
        technician: totalTechnicians
      },
      byStatus: {
        active: activeUsers,
        suspended: suspendedUsers,
        inactive: 0
      },
      verified: verifiedUsers,
      newUsers30Days: newUsers30d,
      total: totalCustomers + totalAdmins + totalTechnicians
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
});

module.exports = router;