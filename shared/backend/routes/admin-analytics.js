const express = require('express');
const router = express.Router();

/**
 * Admin Analytics API - Real-time Dashboard Data
 * Provides live data for admin dashboard components
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

    // Get device type distribution
    const deviceStats = await pool.query(`
      SELECT 
        device_type,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
      FROM bookings 
      WHERE created_at >= $1
      GROUP BY device_type
      ORDER BY count DESC
    `, [startDate.toISOString()]);

    // Get customer satisfaction metrics
    const customerStats = await pool.query(`
      SELECT 
        COUNT(DISTINCT customer_id) as unique_customers,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as satisfied_customers,
        ROUND(COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 2) as satisfaction_rate
      FROM bookings
      WHERE created_at >= $1
    `, [startDate.toISOString()]);

    // Get technician performance
    const techStats = await pool.query(`
      SELECT 
        assigned_technician,
        COUNT(*) as total_repairs,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_repairs,
        AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/3600) as avg_completion_hours,
        ROUND(COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 2) as completion_rate
      FROM bookings
      WHERE created_at >= $1 AND assigned_technician IS NOT NULL
      GROUP BY assigned_technician
      ORDER BY completion_rate DESC, completed_repairs DESC
    `, [startDate.toISOString()]);

    // Get hourly booking trends
    const hourlyTrends = await pool.query(`
      SELECT 
        EXTRACT(HOUR FROM created_at) as hour,
        COUNT(*) as bookings,
        ROUND(AVG(estimated_cost), 2) as avg_cost
      FROM bookings
      WHERE created_at >= $1
      GROUP BY EXTRACT(HOUR FROM created_at)
      ORDER BY hour
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
        technicianPerformance: techStats.rows,
        hourlyTrends: hourlyTrends.rows,
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

// Get recent activity feed
router.get('/activity', async (req, res) => {
  try {
    const pool = req.pool;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const activities = await pool.query(`
      SELECT 
        id,
        customer_id,
        device_type,
        device_model,
        issue_description,
        status,
        created_at,
        updated_at,
        assigned_technician,
        estimated_cost,
        urgency_level,
        customer_name,
        customer_email,
        customer_phone
      FROM bookings
      ORDER BY updated_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    // Format activities for dashboard
    const formattedActivities = activities.rows.map(activity => ({
      id: activity.id,
      type: 'booking_update',
      title: `${activity.status.toUpperCase()}: ${activity.device_type} ${activity.device_model}`,
      description: activity.issue_description,
      customer: {
        name: activity.customer_name,
        email: activity.customer_email,
        phone: activity.customer_phone
      },
      technician: activity.assigned_technician,
      status: activity.status,
      priority: activity.urgency_level,
      cost: activity.estimated_cost,
      timestamp: activity.updated_at,
      createdAt: activity.created_at,
      icon: getActivityIcon(activity.status),
      color: getActivityColor(activity.status)
    }));

    res.json({
      success: true,
      data: {
        activities: formattedActivities,
        pagination: {
          limit,
          offset,
          total: activities.rows.length
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Activity feed error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activity feed',
      details: error.message
    });
  }
});

// Get repair queue with real-time status
router.get('/repair-queue', async (req, res) => {
  try {
    const pool = req.pool;
    const status = req.query.status || 'all';
    const technician = req.query.technician;
    const priority = req.query.priority;

    let statusFilter = '';
    let params = [];
    let paramIndex = 1;

    if (status !== 'all') {
      statusFilter += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (technician) {
      statusFilter += ` AND assigned_technician = $${paramIndex}`;
      params.push(technician);
      paramIndex++;
    }

    if (priority) {
      statusFilter += ` AND urgency_level = $${paramIndex}`;
      params.push(priority);
      paramIndex++;
    }

    const queue = await pool.query(`
      SELECT 
        id,
        customer_name,
        customer_email,
        customer_phone,
        device_type,
        device_model,
        issue_description,
        status,
        urgency_level,
        estimated_cost,
        assigned_technician,
        created_at,
        updated_at,
        expected_completion,
        progress_percentage
      FROM bookings
      WHERE TRUE ${statusFilter}
      ORDER BY 
        CASE urgency_level 
          WHEN 'urgent' THEN 1 
          WHEN 'high' THEN 2 
          WHEN 'normal' THEN 3 
          WHEN 'low' THEN 4 
        END,
        created_at ASC
    `, params);

    const formattedQueue = queue.rows.map(item => ({
      id: item.id,
      customer: {
        name: item.customer_name,
        email: item.customer_email,
        phone: item.customer_phone
      },
      device: {
        type: item.device_type,
        model: item.device_model,
        issue: item.issue_description
      },
      repair: {
        status: item.status,
        priority: item.urgency_level,
        technician: item.assigned_technician,
        cost: item.estimated_cost,
        progress: item.progress_percentage || 0,
        expectedCompletion: item.expected_completion,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      },
      statusColor: getStatusColor(item.status),
      priorityColor: getPriorityColor(item.urgency_level),
      canUpdate: ['pending', 'in_progress', 'waiting_parts'].includes(item.status)
    }));

    res.json({
      success: true,
      data: {
        queue: formattedQueue,
        summary: {
          total: formattedQueue.length,
          pending: formattedQueue.filter(item => item.repair.status === 'pending').length,
          inProgress: formattedQueue.filter(item => item.repair.status === 'in_progress').length,
          completed: formattedQueue.filter(item => item.repair.status === 'completed').length,
          urgent: formattedQueue.filter(item => item.repair.priority === 'urgent').length
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
    const { status, technician, notes, progressPercentage } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }

    const validStatuses = ['pending', 'confirmed', 'in_progress', 'waiting_parts', 'completed', 'cancelled'];
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
        assigned_technician = COALESCE($2, assigned_technician),
        progress_percentage = COALESCE($3, progress_percentage),
        updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `, [status, technician, progressPercentage, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Log the status change
    await pool.query(`
      INSERT INTO audit_logs (table_name, record_id, action, changes, user_id, timestamp)
      VALUES ('bookings', $1, 'UPDATE', $2, $3, NOW())
    `, [id, JSON.stringify({ status, technician, notes, progressPercentage }), 'admin']);

    const updatedBooking = result.rows[0];

    // Emit real-time update via WebSocket
    if (req.app.locals.io) {
      req.app.locals.io.emit('repair_status_update', {
        bookingId: id,
        newStatus: status,
        technician,
        progressPercentage,
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

// Get business intelligence metrics
router.get('/business-intelligence', async (req, res) => {
  try {
    const pool = req.pool;
    const timeRange = req.query.timeRange || '30d';
    
    const now = new Date();
    let startDate;
    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Revenue analysis
    const revenueAnalysis = await pool.query(`
      SELECT 
        DATE_TRUNC('day', created_at) as date,
        COUNT(*) as bookings,
        SUM(estimated_cost) as revenue,
        AVG(estimated_cost) as avg_cost,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_bookings,
        SUM(CASE WHEN status = 'completed' THEN estimated_cost ELSE 0 END) as completed_revenue
      FROM bookings
      WHERE created_at >= $1
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY date
    `, [startDate.toISOString()]);

    // Customer acquisition analysis
    const customerAnalysis = await pool.query(`
      SELECT 
        COUNT(DISTINCT customer_id) as unique_customers,
        COUNT(*) as total_bookings,
        ROUND(COUNT(*) * 1.0 / COUNT(DISTINCT customer_id), 2) as avg_bookings_per_customer,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_repairs,
        ROUND(COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 2) as success_rate
      FROM bookings
      WHERE created_at >= $1
    `, [startDate.toISOString()]);

    // Device popularity trends
    const deviceTrends = await pool.query(`
      SELECT 
        device_type,
        device_model,
        COUNT(*) as frequency,
        AVG(estimated_cost) as avg_cost,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_repairs,
        ROUND(COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 2) as success_rate
      FROM bookings
      WHERE created_at >= $1
      GROUP BY device_type, device_model
      ORDER BY frequency DESC
      LIMIT 10
    `, [startDate.toISOString()]);

    res.json({
      success: true,
      data: {
        period: {
          timeRange,
          startDate: startDate.toISOString(),
          endDate: now.toISOString()
        },
        revenue: {
          trends: revenueAnalysis.rows,
          summary: {
            totalRevenue: revenueAnalysis.rows.reduce((sum, row) => sum + parseFloat(row.revenue || 0), 0),
            completedRevenue: revenueAnalysis.rows.reduce((sum, row) => sum + parseFloat(row.completed_revenue || 0), 0),
            avgDailyRevenue: revenueAnalysis.rows.reduce((sum, row) => sum + parseFloat(row.revenue || 0), 0) / revenueAnalysis.rows.length || 0
          }
        },
        customers: customerAnalysis.rows[0],
        deviceTrends: deviceTrends.rows,
        insights: generateBusinessInsights(revenueAnalysis.rows, customerAnalysis.rows[0], deviceTrends.rows)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Business intelligence error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch business intelligence data',
      details: error.message
    });
  }
});

// Helper functions
function getActivityIcon(status) {
  const icons = {
    pending: '📋',
    confirmed: '✅',
    in_progress: '🔧',
    waiting_parts: '📦',
    completed: '🎉',
    cancelled: '❌'
  };
  return icons[status] || '📄';
}

function getActivityColor(status) {
  const colors = {
    pending: 'text-yellow-600',
    confirmed: 'text-blue-600',
    in_progress: 'text-orange-600',
    waiting_parts: 'text-purple-600',
    completed: 'text-green-600',
    cancelled: 'text-red-600'
  };
  return colors[status] || 'text-gray-600';
}

function getStatusColor(status) {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-orange-100 text-orange-800',
    waiting_parts: 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

function getPriorityColor(priority) {
  const colors = {
    urgent: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    normal: 'bg-blue-100 text-blue-800',
    low: 'bg-green-100 text-green-800'
  };
  return colors[priority] || 'bg-gray-100 text-gray-800';
}

function generateBusinessInsights(revenueData, customerData, deviceData) {
  const insights = [];

  // Revenue insights
  if (revenueData.length > 1) {
    const recentRevenue = revenueData.slice(-7).reduce((sum, row) => sum + parseFloat(row.revenue || 0), 0);
    const previousRevenue = revenueData.slice(-14, -7).reduce((sum, row) => sum + parseFloat(row.revenue || 0), 0);
    const growth = previousRevenue > 0 ? ((recentRevenue - previousRevenue) / previousRevenue * 100).toFixed(1) : 0;
    
    insights.push({
      type: 'revenue',
      title: 'Weekly Revenue Trend',
      message: `Revenue ${growth > 0 ? 'increased' : 'decreased'} by ${Math.abs(growth)}% compared to last week`,
      trend: growth > 0 ? 'up' : 'down',
      value: `${growth}%`
    });
  }

  // Customer insights
  if (customerData.avg_bookings_per_customer > 1.5) {
    insights.push({
      type: 'customer',
      title: 'Customer Loyalty',
      message: `High customer retention with ${customerData.avg_bookings_per_customer} bookings per customer on average`,
      trend: 'up',
      value: `${customerData.avg_bookings_per_customer}x`
    });
  }

  // Device insights
  if (deviceData.length > 0) {
    const topDevice = deviceData[0];
    insights.push({
      type: 'device',
      title: 'Popular Device',
      message: `${topDevice.device_type} ${topDevice.device_model} is most requested with ${topDevice.frequency} bookings`,
      trend: 'neutral',
      value: `${topDevice.frequency} bookings`
    });
  }

  return insights;
}

module.exports = router;