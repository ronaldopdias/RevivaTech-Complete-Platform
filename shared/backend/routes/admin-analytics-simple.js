const express = require('express');
const router = express.Router();

/**
 * Admin Analytics API - Real-time Dashboard Data (Simple Version)
 * Provides live data for admin dashboard components using actual database schema
 */

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const pool = req.pool;
    const timeRange = req.query.timeRange || '24h';
    
    // Calculate date range
    const now = new Date();
    let startDate;
    switch (timeRange) {
      case '1h':
        startDate = new Date(now.getTime() - 1 * 60 * 60 * 1000);
        break;
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    // Get booking statistics
    const bookingStats = await pool.query(`
      SELECT 
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_bookings,
        COUNT(CASE WHEN status = 'CONFIRMED' THEN 1 END) as confirmed_bookings,
        COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END) as in_progress_bookings,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_bookings,
        COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) as cancelled_bookings,
        COUNT(CASE WHEN "createdAt" > $1 THEN 1 END) as new_bookings_period,
        AVG(EXTRACT(EPOCH FROM ("updatedAt" - "createdAt"))/3600) as avg_processing_hours,
        SUM(CASE WHEN status = 'COMPLETED' THEN "finalPrice" ELSE 0 END) as completed_revenue,
        SUM("finalPrice") as total_potential_revenue
      FROM bookings
      WHERE "createdAt" >= $2
    `, [startDate.toISOString(), startDate.toISOString()]);

    // Get device type distribution from device_models
    const deviceStats = await pool.query(`
      SELECT 
        dc.name as device_type,
        COUNT(b.id) as count,
        ROUND(COUNT(b.id) * 100.0 / NULLIF(SUM(COUNT(b.id)) OVER(), 0), 2) as percentage
      FROM device_models dm
      LEFT JOIN device_categories dc ON dm."categoryId" = dc.id
      LEFT JOIN bookings b ON b."deviceModelId" = dm.id AND b."createdAt" >= $1
      GROUP BY dc.name
      HAVING COUNT(b.id) > 0
      ORDER BY count DESC
    `, [startDate.toISOString()]);

    // Get customer satisfaction metrics
    const customerStats = await pool.query(`
      SELECT 
        COUNT(DISTINCT "customerId") as unique_customers,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as satisfied_customers,
        ROUND(COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 2) as satisfaction_rate
      FROM bookings
      WHERE "createdAt" >= $1
    `, [startDate.toISOString()]);

    // Get recent activity (simple version)
    const recentActivity = await pool.query(`
      SELECT 
        b.id,
        b.status,
        b."createdAt",
        b."updatedAt",
        b."finalPrice",
        b."urgencyLevel",
        b."problemDescription",
        b."customerInfo",
        dm.name as device_model,
        dc.name as device_type
      FROM bookings b
      LEFT JOIN device_models dm ON b."deviceModelId" = dm.id
      LEFT JOIN device_categories dc ON dm."categoryId" = dc.id
      WHERE b."createdAt" >= $1
      ORDER BY b."updatedAt" DESC
      LIMIT 10
    `, [startDate.toISOString()]);

    const stats = bookingStats.rows[0];
    
    res.json({
      success: true,
      data: {
        overview: {
          totalBookings: parseInt(stats.total_bookings) || 0,
          newBookings: parseInt(stats.new_bookings_period) || 0,
          pendingBookings: parseInt(stats.pending_bookings) || 0,
          activeRepairs: parseInt(stats.in_progress_bookings) || 0,
          completedBookings: parseInt(stats.completed_bookings) || 0,
          cancelledBookings: parseInt(stats.cancelled_bookings) || 0,
          avgProcessingHours: parseFloat(stats.avg_processing_hours) || 0,
          completedRevenue: parseFloat(stats.completed_revenue) || 0,
          totalPotentialRevenue: parseFloat(stats.total_potential_revenue) || 0
        },
        deviceDistribution: deviceStats.rows,
        customerMetrics: {
          uniqueCustomers: parseInt(customerStats.rows[0]?.unique_customers) || 0,
          satisfiedCustomers: parseInt(customerStats.rows[0]?.satisfied_customers) || 0,
          satisfactionRate: parseFloat(customerStats.rows[0]?.satisfaction_rate) || 0
        },
        recentActivity: recentActivity.rows.map(activity => ({
          id: activity.id,
          type: 'booking_update',
          title: `${activity.status}: ${activity.device_type} ${activity.device_model}`,
          description: activity.problemDescription,
          customer: activity.customerInfo,
          status: activity.status,
          priority: activity.urgencyLevel,
          cost: activity.finalPrice,
          timestamp: activity.updatedAt,
          createdAt: activity.createdAt,
          icon: getActivityIcon(activity.status),
          color: getActivityColor(activity.status)
        })),
        period: {
          timeRange,
          startDate: startDate.toISOString(),
          endDate: now.toISOString()
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Analytics stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics statistics',
      details: error.message
    });
  }
});

// Get repair queue with real-time status
router.get('/repair-queue', async (req, res) => {
  try {
    const pool = req.pool;
    const status = req.query.status || 'all';
    const priority = req.query.priority;

    let statusFilter = '';
    let params = [];
    let paramIndex = 1;

    if (status !== 'all') {
      statusFilter += ` AND b.status = $${paramIndex}`;
      params.push(status.toUpperCase());
      paramIndex++;
    }

    if (priority) {
      statusFilter += ` AND b."urgencyLevel" = $${paramIndex}`;
      params.push(priority.toUpperCase());
      paramIndex++;
    }

    const queue = await pool.query(`
      SELECT 
        b.id,
        b.status,
        b."urgencyLevel",
        b."finalPrice",
        b."assignedTechnicianId",
        b."createdAt",
        b."updatedAt",
        b."estimatedCompletion",
        b."problemDescription",
        b."customerInfo",
        dm.name as device_model,
        dc.name as device_type
      FROM bookings b
      LEFT JOIN device_models dm ON b."deviceModelId" = dm.id
      LEFT JOIN device_categories dc ON dm."categoryId" = dc.id
      WHERE TRUE ${statusFilter}
      ORDER BY 
        CASE b."urgencyLevel"
          WHEN 'URGENT' THEN 1 
          WHEN 'HIGH' THEN 2 
          WHEN 'STANDARD' THEN 3 
          WHEN 'LOW' THEN 4 
        END,
        b."createdAt" ASC
    `, params);

    const formattedQueue = queue.rows.map(item => ({
      id: item.id,
      customer: item.customerInfo,
      device: {
        type: item.device_type,
        model: item.device_model,
        issue: item.problemDescription
      },
      repair: {
        status: item.status,
        priority: item.urgencyLevel,
        technician: item.assignedTechnicianId,
        cost: item.finalPrice,
        progress: 0, // Default progress
        expectedCompletion: item.estimatedCompletion,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      },
      statusColor: getStatusColor(item.status),
      priorityColor: getPriorityColor(item.urgencyLevel),
      canUpdate: ['PENDING', 'IN_PROGRESS', 'CONFIRMED'].includes(item.status)
    }));

    res.json({
      success: true,
      data: {
        queue: formattedQueue,
        summary: {
          total: formattedQueue.length,
          pending: formattedQueue.filter(item => item.repair.status === 'PENDING').length,
          inProgress: formattedQueue.filter(item => item.repair.status === 'IN_PROGRESS').length,
          completed: formattedQueue.filter(item => item.repair.status === 'COMPLETED').length,
          urgent: formattedQueue.filter(item => item.repair.priority === 'URGENT').length
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Repair queue error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch repair queue',
      details: error.message
    });
  }
});

// Update repair status
router.put('/repair-queue/:id/status', async (req, res) => {
  try {
    const pool = req.pool;
    const { id } = req.params;
    const { status, technician, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }

    const validStatuses = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status value'
      });
    }

    // Update booking status
    const result = await pool.query(`
      UPDATE bookings 
      SET 
        status = $1,
        "assignedTechnicianId" = COALESCE($2, "assignedTechnicianId"),
        "updatedAt" = NOW()
      WHERE id = $3
      RETURNING *
    `, [status, technician, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Log the status change in booking_status_history
    await pool.query(`
      INSERT INTO booking_status_history ("bookingId", status, notes, "changedAt", "changedBy")
      VALUES ($1, $2, $3, NOW(), $4)
    `, [id, status, notes, technician || 'admin']);

    const updatedBooking = result.rows[0];

    // Emit real-time update via WebSocket
    if (req.app.locals.io) {
      req.app.locals.io.emit('repair_status_update', {
        bookingId: id,
        newStatus: status,
        technician,
        timestamp: new Date().toISOString(),
        booking: updatedBooking
      });
    }

    res.json({
      success: true,
      data: {
        booking: updatedBooking,
        message: `Repair status updated to ${status}`
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update repair status',
      details: error.message
    });
  }
});

// Get real-time dashboard metrics
router.get('/realtime-metrics', async (req, res) => {
  try {
    const pool = req.pool;
    
    // Get today's metrics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const metrics = await pool.query(`
      SELECT 
        COUNT(*) as total_today,
        COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_today,
        COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END) as active_today,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_today,
        SUM(CASE WHEN status = 'COMPLETED' THEN "finalPrice" ELSE 0 END) as revenue_today,
        AVG(CASE WHEN status = 'COMPLETED' THEN "finalPrice" END) as avg_repair_cost
      FROM bookings 
      WHERE "createdAt" >= $1
    `, [today.toISOString()]);

    // Get technician workload
    const techWorkload = await pool.query(`
      SELECT 
        "assignedTechnicianId",
        COUNT(*) as active_repairs,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_repairs
      FROM bookings 
      WHERE "assignedTechnicianId" IS NOT NULL 
        AND status IN ('IN_PROGRESS', 'CONFIRMED', 'COMPLETED')
        AND "createdAt" >= $1
      GROUP BY "assignedTechnicianId"
      ORDER BY active_repairs DESC
    `, [today.toISOString()]);

    const todayStats = metrics.rows[0];

    res.json({
      success: true,
      data: {
        todayMetrics: {
          totalBookings: parseInt(todayStats.total_today) || 0,
          pendingRepairs: parseInt(todayStats.pending_today) || 0,
          activeRepairs: parseInt(todayStats.active_today) || 0,
          completedRepairs: parseInt(todayStats.completed_today) || 0,
          todayRevenue: parseFloat(todayStats.revenue_today) || 0,
          avgRepairCost: parseFloat(todayStats.avg_repair_cost) || 0
        },
        technicianWorkload: techWorkload.rows,
        lastUpdated: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Real-time metrics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch real-time metrics',
      details: error.message
    });
  }
});

// Helper functions
function getActivityIcon(status) {
  const icons = {
    PENDING: '📋',
    CONFIRMED: '✅',
    IN_PROGRESS: '🔧',
    COMPLETED: '🎉',
    CANCELLED: '❌'
  };
  return icons[status] || '📄';
}

function getActivityColor(status) {
  const colors = {
    PENDING: 'text-yellow-600',
    CONFIRMED: 'text-blue-600',
    IN_PROGRESS: 'text-orange-600',
    COMPLETED: 'text-green-600',
    CANCELLED: 'text-red-600'
  };
  return colors[status] || 'text-gray-600';
}

function getStatusColor(status) {
  const colors = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-blue-100 text-blue-800',
    IN_PROGRESS: 'bg-orange-100 text-orange-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

function getPriorityColor(priority) {
  const colors = {
    URGENT: 'bg-red-100 text-red-800',
    HIGH: 'bg-orange-100 text-orange-800',
    STANDARD: 'bg-blue-100 text-blue-800',
    LOW: 'bg-green-100 text-green-800'
  };
  return colors[priority] || 'bg-gray-100 text-gray-800';
}

module.exports = router;