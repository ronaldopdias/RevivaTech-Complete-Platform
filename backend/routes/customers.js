const express = require('express');
const Joi = require('joi');
const rateLimit = require('express-rate-limit');
const { authenticateBetterAuth: authenticateToken } = require('../middleware/better-auth-official');
const router = express.Router();

// Rate limiting for customer endpoints
const customerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per window
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting and authentication to all routes
router.use(customerLimiter);
router.use(authenticateToken);

/**
 * GET /api/customers/my-bookings
 * Get customer's bookings and repair history
 */
router.get('/my-bookings', async (req, res) => {
  const client = await req.pool.connect();
  
  try {
    const userEmail = req.user.email;
    
    // Find customer by email (Better Auth user email -> Customer record)
    const customerQuery = 'SELECT id FROM customers WHERE email = $1';
    const customerResult = await client.query(customerQuery, [userEmail]);
    
    if (customerResult.rows.length === 0) {
      client.release();
      return res.status(404).json({
        error: 'Customer not found',
        message: 'No customer record found for this user'
      });
    }
    
    const customerId = customerResult.rows[0].id;
    
    // Get all bookings for the authenticated customer - FIXED QUERY  
    const bookingsQuery = `
      SELECT 
        b.id,
        d.name as device_model,
        db.name as device_brand, 
        dc.name as device_category,
        b.selected_repairs,
        b.booking_status,
        b.issue_description as problem_description,
        b.quote_base_price as base_price,
        b.quote_total_price as final_price,
        b.created_at,
        b.updated_at,
        b.scheduled_date as estimated_completion
      FROM bookings b
      LEFT JOIN devices d ON b.device_id = d.id
      LEFT JOIN device_variants dv ON b.device_variant_id = dv.id
      LEFT JOIN device_brands db ON d.brand_id = db.id
      LEFT JOIN device_categories dc ON d.category_id = dc.id
      WHERE b.customer_id = $1
      ORDER BY b.created_at DESC
    `;
    
    const bookingsResult = await client.query(bookingsQuery, [customerId]);
    
    // Transform the data to match frontend interface
    const bookings = bookingsResult.rows.map(row => ({
      id: row.id,
      deviceModel: row.device_model || 'Unknown Device',
      deviceBrand: row.device_brand || 'Unknown Brand',
      deviceCategory: row.device_category || 'Device',
      repairType: Array.isArray(row.selected_repairs) ? row.selected_repairs.join(', ') : 'General Repair',
      status: row.booking_status || 'draft',
      problemDescription: row.problem_description || 'No description provided',
      basePrice: parseFloat(row.base_price) || 0,
      finalPrice: parseFloat(row.final_price) || 0,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
      estimatedCompletion: row.estimated_completion?.toISOString(),
    }));

    client.release();
    
    res.json({
      success: true,
      data: bookings
    });
    
  } catch (error) {
    client.release();
    req.logger.error('Error fetching customer bookings:', error);
    res.status(500).json({
      error: 'Failed to fetch bookings',
      message: error.message
    });
  }
});

/**
 * GET /api/customers/dashboard-stats
 * Get customer dashboard statistics
 */
router.get('/dashboard-stats', async (req, res) => {
  const client = await req.pool.connect();
  
  try {
    const userEmail = req.user.email;
    
    // Find customer by email (Better Auth user email -> Customer record)
    const customerQuery = 'SELECT id FROM customers WHERE email = $1';
    const customerResult = await client.query(customerQuery, [userEmail]);
    
    if (customerResult.rows.length === 0) {
      client.release();
      return res.status(404).json({
        error: 'Customer not found',
        message: 'No customer record found for this user'
      });
    }
    
    const customerId = customerResult.rows[0].id;
    
    // Get statistics from bookings
    const statsQuery = `
      SELECT 
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN booking_status IN ('confirmed', 'in_progress', 'scheduled') THEN 1 END) as active_bookings,
        COUNT(CASE WHEN booking_status = 'completed' THEN 1 END) as completed_bookings,
        COALESCE(SUM(CASE WHEN booking_status = 'completed' THEN quote_total_price END), 0) as total_spent,
        AVG(CASE WHEN booking_status = 'completed' THEN 5.0 END) as average_rating,
        MAX(created_at) as last_booking_date
      FROM bookings
      WHERE customer_id = $1
    `;
    
    const statsResult = await client.query(statsQuery, [customerId]);
    const stats = statsResult.rows[0];
    
    client.release();
    
    res.json({
      success: true,
      data: {
        totalBookings: parseInt(stats.total_bookings),
        activeBookings: parseInt(stats.active_bookings),
        completedBookings: parseInt(stats.completed_bookings),
        totalSpent: parseFloat(stats.total_spent),
        averageRating: parseFloat(stats.average_rating) || 0,
        lastBookingDate: stats.last_booking_date?.toISOString() || null
      }
    });
    
  } catch (error) {
    client.release();
    req.logger.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard stats',
      message: error.message
    });
  }
});

/**
 * GET /api/customers/recent-activity
 * Get customer's recent activity/updates
 */
router.get('/recent-activity', async (req, res) => {
  const client = await req.pool.connect();
  
  try {
    const userEmail = req.user.email;
    
    // Find customer by email (Better Auth user email -> Customer record)
    const customerQuery = 'SELECT id FROM customers WHERE email = $1';
    const customerResult = await client.query(customerQuery, [userEmail]);
    
    if (customerResult.rows.length === 0) {
      client.release();
      return res.status(404).json({
        error: 'Customer not found',
        message: 'No customer record found for this user'
      });
    }
    
    const customerId = customerResult.rows[0].id;
    
    // Get recent booking status changes - FIXED QUERY
    const activityQuery = `
      SELECT 
        b.id,
        b.booking_status,
        b.updated_at,
        d.name as device_model,
        db.name as device_brand
      FROM bookings b
      LEFT JOIN devices d ON b.device_id = d.id
      LEFT JOIN device_brands db ON d.brand_id = db.id
      WHERE b.customer_id = $1 
        AND b.updated_at >= NOW() - INTERVAL '7 days'
      ORDER BY b.updated_at DESC
      LIMIT 10
    `;
    
    const activityResult = await client.query(activityQuery, [customerId]);
    
    // Transform to activity feed format
    const activities = activityResult.rows.map(row => {
      let message = '';
      let type = 'status_change';
      
      switch (row.status) {
        case 'CONFIRMED':
          message = `Your ${row.device_brand} ${row.device_model} repair has been confirmed`;
          break;
        case 'IN_PROGRESS':
          message = `Your ${row.device_brand} ${row.device_model} repair is now in progress`;
          break;
        case 'READY_FOR_PICKUP':
          message = `Your ${row.device_brand} ${row.device_model} is ready for pickup!`;
          break;
        case 'COMPLETED':
          message = `Your ${row.device_brand} ${row.device_model} repair has been completed`;
          break;
        default:
          message = `Update on your ${row.device_brand} ${row.device_model} repair`;
      }
      
      return {
        id: `activity_${row.id}_${row.updated_at.getTime()}`,
        type,
        message,
        timestamp: row.updated_at.toISOString(),
        bookingId: row.id,
        technicianName: row.technician_first_name && row.technician_last_name 
          ? `${row.technician_first_name} ${row.technician_last_name}` 
          : null
      };
    });

    client.release();
    
    res.json({
      success: true,
      data: activities
    });
    
  } catch (error) {
    client.release();
    req.logger.error('Error fetching recent activity:', error);
    res.status(500).json({
      error: 'Failed to fetch recent activity',
      message: error.message
    });
  }
});

module.exports = router;