const express = require('express');
const Joi = require('joi');
const rateLimit = require('express-rate-limit');
const { authenticateBetterAuth: authenticateToken, requireRole } = require('../../middleware/better-auth-db-direct');
const router = express.Router();

// Rate limiting for admin endpoints
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Higher limit for admin operations
  message: 'Too many admin requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting and admin authentication to all routes
router.use(adminLimiter);
router.use(authenticateToken);
router.use(requireRole(['ADMIN', 'SUPER_ADMIN']));

/**
 * GET /api/admin/customers
 * Get all customers with admin-level details and filtering
 */
router.get('/', async (req, res) => {
  const client = await req.pool.connect();
  
  try {
    // Get query parameters for filtering
    const { search, status, tier, limit = 50, offset = 0 } = req.query;
    
    // Build dynamic query based on filters
    let whereConditions = ['1=1'];
    let queryParams = [];
    let paramCount = 0;

    // Search filter
    if (search) {
      paramCount++;
      whereConditions.push(`(
        u."firstName" ILIKE $${paramCount} OR 
        u."lastName" ILIKE $${paramCount} OR 
        u.email ILIKE $${paramCount} OR
        u.id::text ILIKE $${paramCount}
      )`);
      queryParams.push(`%${search}%`);
    }

    // Status filter (active users with recent bookings vs inactive)
    if (status && status !== 'all') {
      paramCount++;
      if (status.toLowerCase() === 'active') {
        whereConditions.push(`u."lastLoginAt" >= NOW() - INTERVAL '30 days' OR u."createdAt" >= NOW() - INTERVAL '30 days'`);
      } else if (status.toLowerCase() === 'inactive') {
        whereConditions.push(`(u."lastLoginAt" < NOW() - INTERVAL '30 days' OR u."lastLoginAt" IS NULL) AND u."createdAt" < NOW() - INTERVAL '30 days'`);
      }
    }

    // Main query to get customers with aggregated booking data
    const customersQuery = `
      WITH customer_stats AS (
        SELECT 
          u.id,
          u."firstName",
          u."lastName", 
          u.email,
          u.phone,
          u."createdAt" as join_date,
          u."lastLoginAt",
          COUNT(b.id) as total_repairs,
          COALESCE(SUM(CASE WHEN b.status = 'COMPLETED' THEN b."finalPrice" END), 0) as total_spent,
          MAX(b."updatedAt") as last_repair,
          CASE 
            WHEN u."lastLoginAt" >= NOW() - INTERVAL '30 days' OR u."createdAt" >= NOW() - INTERVAL '30 days' THEN 'Active'
            ELSE 'Inactive'
          END as status,
          CASE 
            WHEN COALESCE(SUM(CASE WHEN b.status = 'COMPLETED' THEN b."finalPrice" END), 0) >= 2000 THEN 'Platinum'
            WHEN COALESCE(SUM(CASE WHEN b.status = 'COMPLETED' THEN b."finalPrice" END), 0) >= 1000 THEN 'Gold'
            WHEN COALESCE(SUM(CASE WHEN b.status = 'COMPLETED' THEN b."finalPrice" END), 0) >= 500 THEN 'Silver'
            ELSE 'Bronze'
          END as tier,
          COALESCE(SUM(CASE WHEN b.status = 'COMPLETED' THEN b."finalPrice" END), 0) * 0.1 as loyalty_points
        FROM users u
        LEFT JOIN bookings b ON u.id = b."customerId"
        WHERE u.role = 'CUSTOMER' AND ${whereConditions.join(' AND ')}
        GROUP BY u.id, u."firstName", u."lastName", u.email, u.phone, u."createdAt", u."lastLoginAt"
      )
      SELECT * FROM customer_stats
      ORDER BY total_spent DESC, join_date DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    queryParams.push(parseInt(limit), parseInt(offset));
    
    const customersResult = await client.query(customersQuery, queryParams);
    
    // Transform data to match frontend interface
    const customers = customersResult.rows.map(row => ({
      id: `CUST-${String(row.id).padStart(3, '0')}`,
      firstName: row.firstName,
      lastName: row.lastName,
      email: row.email,
      phone: row.phone || '+44 0000 000000',
      joinDate: row.join_date.toISOString().split('T')[0],
      totalRepairs: parseInt(row.total_repairs),
      totalSpent: parseFloat(row.total_spent),
      lastRepair: row.last_repair ? row.last_repair.toISOString().split('T')[0] : '',
      status: row.status,
      tier: row.tier,
      loyaltyPoints: Math.round(parseFloat(row.loyalty_points))
    }));

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(DISTINCT u.id) as total
      FROM users u
      LEFT JOIN bookings b ON u.id = b."customerId"
      WHERE u.role = 'CUSTOMER' AND ${whereConditions.join(' AND ')}
    `;
    
    const countResult = await client.query(countQuery, queryParams.slice(0, -2));
    const totalCustomers = parseInt(countResult.rows[0].total);

    // Calculate summary statistics
    const activeCustomers = customers.filter(c => c.status === 'Active').length;
    const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
    const averageValue = customers.length > 0 ? totalRevenue / customers.length : 0;

    client.release();
    
    res.json({
      success: true,
      data: customers,
      pagination: {
        total: totalCustomers,
        offset: parseInt(offset),
        limit: parseInt(limit),
        hasMore: parseInt(offset) + parseInt(limit) < totalCustomers
      },
      summary: {
        totalCustomers,
        activeCustomers,
        inactiveCustomers: totalCustomers - activeCustomers,
        totalRevenue: Math.round(totalRevenue),
        averageValue: Math.round(averageValue),
        tierDistribution: {
          Bronze: customers.filter(c => c.tier === 'Bronze').length,
          Silver: customers.filter(c => c.tier === 'Silver').length,
          Gold: customers.filter(c => c.tier === 'Gold').length,
          Platinum: customers.filter(c => c.tier === 'Platinum').length,
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    client.release();
    req.logger.error('Error fetching admin customers:', error);
    res.status(500).json({
      error: 'Failed to fetch customers',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/customers/:id
 * Get specific customer details
 */
router.get('/:id', async (req, res) => {
  const client = await req.pool.connect();
  
  try {
    const customerId = req.params.id.replace('CUST-', ''); // Remove prefix
    
    const customerQuery = `
      SELECT 
        u.id,
        u."firstName",
        u."lastName", 
        u.email,
        u.phone,
        u."createdAt",
        u."lastLoginAt",
        COUNT(b.id) as total_repairs,
        COALESCE(SUM(CASE WHEN b.status = 'COMPLETED' THEN b."finalPrice" END), 0) as total_spent,
        MAX(b."updatedAt") as last_repair
      FROM users u
      LEFT JOIN bookings b ON u.id = b."customerId"
      WHERE u.id = $1 AND u.role = 'CUSTOMER'
      GROUP BY u.id, u."firstName", u."lastName", u.email, u.phone, u."createdAt", u."lastLoginAt"
    `;
    
    const customerResult = await client.query(customerQuery, [customerId]);
    
    if (customerResult.rows.length === 0) {
      client.release();
      return res.status(404).json({
        error: 'Customer not found'
      });
    }
    
    const row = customerResult.rows[0];
    const customer = {
      id: `CUST-${String(row.id).padStart(3, '0')}`,
      firstName: row.firstName,
      lastName: row.lastName,
      email: row.email,
      phone: row.phone || '+44 0000 000000',
      joinDate: row.createdAt.toISOString().split('T')[0],
      totalRepairs: parseInt(row.total_repairs),
      totalSpent: parseFloat(row.total_spent),
      lastRepair: row.last_repair ? row.last_repair.toISOString().split('T')[0] : '',
      status: row.lastLoginAt && row.lastLoginAt >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) ? 'Active' : 'Inactive',
      tier: row.total_spent >= 2000 ? 'Platinum' : row.total_spent >= 1000 ? 'Gold' : row.total_spent >= 500 ? 'Silver' : 'Bronze',
      loyaltyPoints: Math.round(parseFloat(row.total_spent) * 0.1)
    };

    client.release();
    
    res.json({
      success: true,
      data: customer
    });
    
  } catch (error) {
    client.release();
    req.logger.error('Error fetching customer details:', error);
    res.status(500).json({
      error: 'Failed to fetch customer details',
      message: error.message
    });
  }
});

/**
 * PUT /api/admin/customers/:id
 * Update customer information
 */
router.put('/:id', async (req, res) => {
  const client = await req.pool.connect();
  
  try {
    const customerId = req.params.id.replace('CUST-', '');
    const { firstName, lastName, email, phone } = req.body;
    
    // Validation
    const schema = Joi.object({
      firstName: Joi.string().min(1).max(50),
      lastName: Joi.string().min(1).max(50),
      email: Joi.string().email(),
      phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/)
    });
    
    const { error } = schema.validate(req.body);
    if (error) {
      client.release();
      return res.status(400).json({
        error: 'Validation error',
        message: error.details[0].message
      });
    }
    
    // Update customer
    const updateQuery = `
      UPDATE users 
      SET "firstName" = COALESCE($1, "firstName"),
          "lastName" = COALESCE($2, "lastName"),
          email = COALESCE($3, email),
          phone = COALESCE($4, phone),
          "updatedAt" = NOW()
      WHERE id = $5 AND role = 'CUSTOMER'
      RETURNING *
    `;
    
    const updateResult = await client.query(updateQuery, [firstName, lastName, email, phone, customerId]);
    
    if (updateResult.rows.length === 0) {
      client.release();
      return res.status(404).json({
        error: 'Customer not found'
      });
    }
    
    client.release();
    
    res.json({
      success: true,
      message: 'Customer updated successfully',
      data: updateResult.rows[0]
    });
    
  } catch (error) {
    client.release();
    req.logger.error('Error updating customer:', error);
    res.status(500).json({
      error: 'Failed to update customer',
      message: error.message
    });
  }
});

module.exports = router;