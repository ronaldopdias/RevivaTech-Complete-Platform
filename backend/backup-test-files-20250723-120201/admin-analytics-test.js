const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /api/admin/analytics/test:
 *   get:
 *     summary: Test database connection and basic analytics
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Database connection successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_bookings:
 *                       type: string
 *                       example: "2"
 *                     pending_bookings:
 *                       type: string
 *                       example: "2"
 *                     completed_bookings:
 *                       type: string
 *                       example: "0"
 *                     oldest_booking:
 *                       type: string
 *                       format: date-time
 *                     newest_booking:
 *                       type: string
 *                       format: date-time
 *                 message:
 *                   type: string
 *                   example: "Database connection successful"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       500:
 *         description: Database connection failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/test', async (req, res) => {
  try {
    const pool = req.pool;
    
    // Simple test query
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_bookings,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_bookings,
        MIN("createdAt") as oldest_booking,
        MAX("createdAt") as newest_booking
      FROM bookings
    `);

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Database connection successful',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Test query error:', error);
    res.status(500).json({
      success: false,
      error: 'Database test failed',
      details: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/analytics/stats:
 *   get:
 *     summary: Get comprehensive dashboard statistics
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     overview:
 *                       type: object
 *                       properties:
 *                         totalBookings:
 *                           type: integer
 *                           example: 2
 *                         pendingBookings:
 *                           type: integer
 *                           example: 2
 *                         activeRepairs:
 *                           type: integer
 *                           example: 0
 *                         completedBookings:
 *                           type: integer
 *                           example: 0
 *                         totalRevenue:
 *                           type: number
 *                           format: decimal
 *                           example: 260.00
 *                         avgBookingValue:
 *                           type: number
 *                           format: decimal
 *                           example: 130.00
 *                     today:
 *                       type: object
 *                       properties:
 *                         newBookings:
 *                           type: integer
 *                           example: 0
 *                         completedToday:
 *                           type: integer
 *                           example: 0
 *                         revenueToday:
 *                           type: number
 *                           format: decimal
 *                           example: 0.00
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       500:
 *         description: Failed to fetch statistics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/stats', async (req, res) => {
  try {
    const pool = req.pool;
    
    // Get basic booking statistics
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_bookings,
        COUNT(CASE WHEN status = 'CONFIRMED' THEN 1 END) as confirmed_bookings,
        COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END) as in_progress_bookings,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_bookings,
        COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) as cancelled_bookings,
        SUM("finalPrice") as total_revenue,
        AVG("finalPrice") as avg_booking_value
      FROM bookings
    `);

    // Get today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayStats = await pool.query(`
      SELECT 
        COUNT(*) as new_bookings_today,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_today,
        SUM(CASE WHEN status = 'COMPLETED' THEN "finalPrice" ELSE 0 END) as revenue_today
      FROM bookings 
      WHERE "createdAt" >= $1
    `, [today.toISOString()]);

    const data = {
      overview: {
        totalBookings: parseInt(stats.rows[0].total_bookings) || 0,
        pendingBookings: parseInt(stats.rows[0].pending_bookings) || 0,
        confirmedBookings: parseInt(stats.rows[0].confirmed_bookings) || 0,
        activeRepairs: parseInt(stats.rows[0].in_progress_bookings) || 0,
        completedBookings: parseInt(stats.rows[0].completed_bookings) || 0,
        cancelledBookings: parseInt(stats.rows[0].cancelled_bookings) || 0,
        totalRevenue: parseFloat(stats.rows[0].total_revenue) || 0,
        avgBookingValue: parseFloat(stats.rows[0].avg_booking_value) || 0
      },
      today: {
        newBookings: parseInt(todayStats.rows[0].new_bookings_today) || 0,
        completedToday: parseInt(todayStats.rows[0].completed_today) || 0,
        revenueToday: parseFloat(todayStats.rows[0].revenue_today) || 0
      }
    };

    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Stats query error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      details: error.message
    });
  }
});

// Get repair queue
router.get('/queue', async (req, res) => {
  try {
    const pool = req.pool;
    
    const queue = await pool.query(`
      SELECT 
        id,
        status,
        "urgencyLevel",
        "finalPrice",
        "createdAt",
        "updatedAt",
        "problemDescription",
        "customerInfo",
        "assignedTechnicianId"
      FROM bookings 
      ORDER BY "createdAt" DESC
      LIMIT 20
    `);

    const formattedQueue = queue.rows.map(item => ({
      id: item.id,
      status: item.status,
      priority: item.urgencyLevel,
      cost: item.finalPrice,
      description: item.problemDescription,
      customer: item.customerInfo,
      technician: item.assignedTechnicianId,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }));

    res.json({
      success: true,
      data: {
        queue: formattedQueue,
        total: formattedQueue.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Queue query error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch repair queue',
      details: error.message
    });
  }
});

module.exports = router;