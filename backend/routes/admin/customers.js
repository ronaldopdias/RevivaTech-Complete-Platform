const express = require('express');
const Joi = require('joi');
const rateLimit = require('express-rate-limit');
const { requireAuth: authenticateToken, requireRole } = require('../../lib/auth-utils');
const { prisma } = require('../../lib/prisma');
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
  try {
    // Get query parameters for filtering
    const { search, status, tier, limit = 50, offset = 0 } = req.query;
    
    // Build dynamic where clause for Prisma
    const whereClause = {
      role: 'CUSTOMER'
    };

    // Search filter
    if (search) {
      whereClause.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { id: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Status filter (active users with recent bookings vs inactive)
    if (status && status !== 'all') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      if (status.toLowerCase() === 'active') {
        whereClause.createdAt = { gte: thirtyDaysAgo };
      } else if (status.toLowerCase() === 'inactive') {
        whereClause.createdAt = { lt: thirtyDaysAgo };
      }
    }

    // Get customers with booking statistics using Prisma aggregations
    const customers = await prisma.user.findMany({
      where: whereClause,
      include: {
        bookings: {
          select: {
            id: true,
            status: true,
            finalPrice: true,
            updatedAt: true,
            createdAt: true
          }
        }
      },
      orderBy: [
        { createdAt: 'desc' }
      ],
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    // Transform data with calculated fields (replacing CTE with JS calculations)
    const transformedCustomers = customers.map(user => {
      const completedBookings = user.bookings.filter(b => b.status === 'COMPLETED');
      const totalSpent = completedBookings.reduce((sum, booking) => 
        sum + parseFloat(booking.finalPrice || 0), 0
      );
      
      const lastRepair = user.bookings.length > 0 
        ? Math.max(...user.bookings.map(b => new Date(b.updatedAt).getTime()))
        : null;

      // Status calculation
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const status = new Date(user.createdAt) >= thirtyDaysAgo ? 'Active' : 'Inactive';

      // Tier calculation
      let tier = 'Bronze';
      if (totalSpent >= 2000) tier = 'Platinum';
      else if (totalSpent >= 1000) tier = 'Gold';
      else if (totalSpent >= 500) tier = 'Silver';

      return {
        id: `CUST-${String(user.id.slice(-3)).padStart(3, '0')}`,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone || '+44 0000 000000',
        joinDate: user.createdAt.toISOString().split('T')[0],
        totalRepairs: user.bookings.length,
        totalSpent: parseFloat(totalSpent.toFixed(2)),
        lastRepair: lastRepair ? new Date(lastRepair).toISOString().split('T')[0] : '',
        status,
        tier,
        loyaltyPoints: Math.round(totalSpent * 0.1)
      };
    });

    // Apply tier filter after transformation if specified
    let filteredCustomers = transformedCustomers;
    if (tier && tier !== 'all') {
      filteredCustomers = transformedCustomers.filter(c => c.tier.toLowerCase() === tier.toLowerCase());
    }

    // Sort by totalSpent DESC, then by joinDate DESC (matching original query)
    filteredCustomers.sort((a, b) => {
      if (b.totalSpent !== a.totalSpent) {
        return b.totalSpent - a.totalSpent;
      }
      return new Date(b.joinDate) - new Date(a.joinDate);
    });

    // Get total count for pagination
    const totalCustomers = await prisma.user.count({
      where: whereClause
    });

    // Calculate summary statistics
    const activeCustomers = filteredCustomers.filter(c => c.status === 'Active').length;
    const totalRevenue = filteredCustomers.reduce((sum, c) => sum + c.totalSpent, 0);
    const averageValue = filteredCustomers.length > 0 ? totalRevenue / filteredCustomers.length : 0;

    res.json({
      success: true,
      data: filteredCustomers,
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
          Bronze: filteredCustomers.filter(c => c.tier === 'Bronze').length,
          Silver: filteredCustomers.filter(c => c.tier === 'Silver').length,
          Gold: filteredCustomers.filter(c => c.tier === 'Gold').length,
          Platinum: filteredCustomers.filter(c => c.tier === 'Platinum').length,
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    req.logger?.error('Error fetching admin customers:', error);
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
  try {
    const customerId = req.params.id.replace('CUST-', ''); // Remove prefix
    
    // Find user by partial ID match (since we're using the last 3 characters)
    const customer = await prisma.user.findFirst({
      where: {
        id: { endsWith: customerId.padStart(3, '0') },
        role: 'CUSTOMER'
      },
      include: {
        bookings: {
          select: {
            id: true,
            status: true,
            finalPrice: true,
            updatedAt: true,
            createdAt: true
          }
        }
      }
    });
    
    if (!customer) {
      return res.status(404).json({
        error: 'Customer not found'
      });
    }
    
    // Calculate statistics
    const completedBookings = customer.bookings.filter(b => b.status === 'COMPLETED');
    const totalSpent = completedBookings.reduce((sum, booking) => 
      sum + parseFloat(booking.finalPrice || 0), 0
    );
    
    const lastRepair = customer.bookings.length > 0 
      ? Math.max(...customer.bookings.map(b => new Date(b.updatedAt).getTime()))
      : null;

    // Status calculation
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const status = new Date(customer.createdAt) >= thirtyDaysAgo ? 'Active' : 'Inactive';

    // Tier calculation
    let tier = 'Bronze';
    if (totalSpent >= 2000) tier = 'Platinum';
    else if (totalSpent >= 1000) tier = 'Gold';
    else if (totalSpent >= 500) tier = 'Silver';

    const transformedCustomer = {
      id: `CUST-${String(customer.id.slice(-3)).padStart(3, '0')}`,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone || '+44 0000 000000',
      joinDate: customer.createdAt.toISOString().split('T')[0],
      totalRepairs: customer.bookings.length,
      totalSpent: parseFloat(totalSpent.toFixed(2)),
      lastRepair: lastRepair ? new Date(lastRepair).toISOString().split('T')[0] : '',
      status,
      tier,
      loyaltyPoints: Math.round(totalSpent * 0.1)
    };
    
    res.json({
      success: true,
      data: transformedCustomer
    });
    
  } catch (error) {
    req.logger?.error('Error fetching customer details:', error);
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
      return res.status(400).json({
        error: 'Validation error',
        message: error.details[0].message
      });
    }
    
    // Find customer first
    const existingCustomer = await prisma.user.findFirst({
      where: {
        id: { endsWith: customerId.padStart(3, '0') },
        role: 'CUSTOMER'
      }
    });

    if (!existingCustomer) {
      return res.status(404).json({
        error: 'Customer not found'
      });
    }
    
    // Update customer with only provided fields
    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    updateData.updatedAt = new Date();

    const updatedCustomer = await prisma.user.update({
      where: { id: existingCustomer.id },
      data: updateData
    });
    
    res.json({
      success: true,
      message: 'Customer updated successfully',
      data: updatedCustomer
    });
    
  } catch (error) {
    req.logger?.error('Error updating customer:', error);
    res.status(500).json({
      error: 'Failed to update customer',
      message: error.message
    });
  }
});

module.exports = router;