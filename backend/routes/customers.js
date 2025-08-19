const express = require('express');
const Joi = require('joi');
const rateLimit = require('express-rate-limit');
const { authenticateBetterAuth: authenticateToken } = require('../middleware/better-auth-db-direct');
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
    const userId = req.user.id;
    
    // Get all bookings for the authenticated customer - FIXED QUERY
    const bookingsQuery = `
      SELECT 
        b.id,
        dm.name as device_model,
        db.name as device_brand,
        dc.name as device_category,
        b."repairType" as repair_type,
        b.status,
        b."problemDescription" as problem_description,
        b."basePrice" as base_price,
        b."finalPrice" as final_price,
        b."createdAt" as created_at,
        b."updatedAt" as updated_at,
        b."scheduledDate" as estimated_completion,
        u."firstName" as technician_first_name,
        u."lastName" as technician_last_name
      FROM bookings b
      LEFT JOIN device_models dm ON b."deviceModelId" = dm.id
      LEFT JOIN device_brands db ON dm."brandId" = db.id
      LEFT JOIN device_categories dc ON db."categoryId" = dc.id
      LEFT JOIN users u ON b."assignedTechnicianId" = u.id
      WHERE b."customerId" = $1
      ORDER BY b."createdAt" DESC
    `;
    
    const bookingsResult = await client.query(bookingsQuery, [userId]);
    
    // Transform the data to match frontend interface
    const bookings = bookingsResult.rows.map(row => ({
      id: row.id,
      deviceModel: row.device_model,
      deviceBrand: row.device_brand,
      deviceCategory: row.device_category,
      repairType: row.repair_type,
      status: row.status,
      problemDescription: row.problem_description,
      basePrice: parseFloat(row.base_price),
      finalPrice: parseFloat(row.final_price),
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
      estimatedCompletion: row.estimated_completion?.toISOString(),
      technicianName: row.technician_first_name && row.technician_last_name 
        ? `${row.technician_first_name} ${row.technician_last_name}` 
        : null
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
    const userId = req.user.id;
    
    // Get statistics from bookings
    const statsQuery = `
      SELECT 
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN status IN ('PENDING', 'CONFIRMED', 'IN_PROGRESS') THEN 1 END) as active_bookings,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_bookings,
        COALESCE(SUM(CASE WHEN status = 'COMPLETED' THEN "finalPrice" END), 0) as total_spent,
        AVG(CASE WHEN status = 'COMPLETED' THEN 5.0 END) as average_rating,
        MAX("createdAt") as last_booking_date
      FROM bookings
      WHERE "customerId" = $1
    `;
    
    const statsResult = await client.query(statsQuery, [userId]);
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
    const userId = req.user.id;
    
    // Get recent booking status changes - FIXED QUERY
    const activityQuery = `
      SELECT 
        b.id,
        b.status,
        b."updatedAt" as updated_at,
        dm.name as device_model,
        db.name as device_brand,
        u."firstName" as technician_first_name,
        u."lastName" as technician_last_name
      FROM bookings b
      LEFT JOIN device_models dm ON b."deviceModelId" = dm.id
      LEFT JOIN device_brands db ON dm."brandId" = db.id
      LEFT JOIN users u ON b."assignedTechnicianId" = u.id
      WHERE b."customerId" = $1 
        AND b."updatedAt" >= NOW() - INTERVAL '7 days'
      ORDER BY b."updatedAt" DESC
      LIMIT 10
    `;
    
    const activityResult = await client.query(activityQuery, [userId]);
    
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