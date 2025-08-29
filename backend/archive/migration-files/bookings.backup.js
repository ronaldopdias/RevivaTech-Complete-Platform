const express = require('express');
const Joi = require('joi');
const { authenticateBetterAuth: authenticateToken, optionalAuth, requireRole, requireAdmin } = require('../middleware/better-auth-official');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();

// Email confirmation helper function
async function sendBookingConfirmationEmail(emailService, pool, logger, userId, bookingData) {
  try {
    // Get user information
    const userQuery = 'SELECT email, "firstName", "lastName" FROM "user" WHERE id = $1';
    const userResult = await pool.query(userQuery, [userId]);
    
    if (userResult.rows.length === 0) {
      throw new Error(`User not found: ${userId}`);
    }
    
    const user = userResult.rows[0];
    
    // Load email templates
    const templatePath = path.join(__dirname, '..', 'templates', 'booking-confirmation.html');
    const textTemplatePath = path.join(__dirname, '..', 'templates', 'booking-confirmation.txt');
    
    const htmlTemplate = await fs.readFile(templatePath, 'utf8');
    const textTemplate = await fs.readFile(textTemplatePath, 'utf8');
    
    // Prepare template data
    const templateData = {
      user: {
        first_name: user.firstName || 'Valued Customer',
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Valued Customer',
        email: user.email
      },
      booking: {
        id: bookingData.id,
        service_type: bookingData.repairType?.replace(/_/g, ' ') || 'Repair',
        appointment_date: bookingData.preferredDate ? new Date(bookingData.preferredDate).toLocaleDateString('en-GB') : 'To be scheduled',
        urgency_level: bookingData.urgencyLevel || 'Standard'
      },
      repair: {
        brand: bookingData.deviceBrand || 'Unknown',
        model: bookingData.deviceModel || 'Unknown',
        issue: bookingData.problemDescription || 'Issue description not provided',
        status: bookingData.status || 'PENDING',
        cost_estimate: bookingData.basePrice || bookingData.finalPrice || '0.00'
      },
      company: {
        name: 'RevivaTech',
        phone: '+44 20 1234 5678',
        email: 'support@revivatech.co.uk',
        address: '123 Tech Street, London, UK',
        support_hours: 'Monday - Friday, 9 AM - 6 PM GMT'
      },
      system: {
        date: new Date().toLocaleDateString(),
        year: new Date().getFullYear(),
        unsubscribe_url: `https://revivatech.co.uk/unsubscribe?token=${userId}`,
        preferences_url: `https://revivatech.co.uk/email-preferences?token=${userId}`,
        tracking_pixel: ''
      }
    };
    
    // Process templates
    const processedHtml = processEmailTemplate(htmlTemplate, templateData);
    const processedText = processEmailTemplate(textTemplate, templateData);
    
    // Send email
    const emailData = {
      id: `booking_conf_${bookingData.id}`,
      to: user.email,
      subject: `✅ Booking Confirmed - Your ${templateData.booking.service_type} Repair`,
      html: processedHtml,
      text: processedText,
      metadata: {
        userId,
        bookingId: bookingData.id,
        type: 'booking_confirmation'
      },
      categories: ['booking', 'confirmation', 'transactional']
    };
    
    const result = await emailService.sendEmail(emailData);
    logger.info(`✅ Booking confirmation email sent: ${result.messageId} to ${user.email}`);
    
    return result;
  } catch (error) {
    logger.error(`❌ Failed to send booking confirmation email:`, error);
    throw error;
  }
}

// Simple template processing function
function processEmailTemplate(template, data) {
  let processed = template;
  
  // Process {{variable.path}} syntax
  const variableRegex = /\{\{([^}#\/\s]+)\}\}/g;
  processed = processed.replace(variableRegex, (match, variable) => {
    const path = variable.trim();
    return getNestedValue(data, path) || '';
  });
  
  // Process {{#if condition}}...{{/if}} blocks
  const conditionalRegex = /\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
  processed = processed.replace(conditionalRegex, (match, condition, content) => {
    const value = getNestedValue(data, condition.trim());
    return value ? content : '';
  });
  
  // Add greeting based on time of day
  const hour = new Date().getHours();
  let greeting = 'Hello';
  if (hour < 12) greeting = 'Good morning';
  else if (hour < 17) greeting = 'Good afternoon';
  else greeting = 'Good evening';
  
  processed = processed.replace(/\{\{greeting\}\}/g, greeting);
  
  return processed;
}

function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current && current[key], obj);
}

// Validation schemas
const createBookingSchema = Joi.object({
  deviceId: Joi.string().required(),
  deviceVariantId: Joi.string().optional(),
  repairType: Joi.string().valid('SCREEN_REPAIR', 'BATTERY_REPLACEMENT', 'WATER_DAMAGE', 'DATA_RECOVERY', 'SOFTWARE_ISSUE', 'HARDWARE_DIAGNOSTIC', 'MOTHERBOARD_REPAIR', 'CAMERA_REPAIR', 'SPEAKER_REPAIR', 'CHARGING_PORT', 'BUTTON_REPAIR', 'CUSTOM_REPAIR').required(),
  problemDescription: Joi.string().min(10).max(1000).required(),
  urgencyLevel: Joi.string().valid('STANDARD', 'URGENT', 'EMERGENCY').default('STANDARD'),
  preferredDate: Joi.date().iso().optional(),
  customerInfo: Joi.object().optional(),
  deviceCondition: Joi.object().optional(),
  customerNotes: Joi.string().max(500).optional()
});

const updateBookingSchema = Joi.object({
  status: Joi.string().valid('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'READY_FOR_PICKUP', 'COMPLETED', 'CANCELLED').optional(),
  scheduledDate: Joi.date().iso().optional(),
  estimatedCompletion: Joi.date().iso().optional(),
  finalPrice: Joi.number().min(0).optional(),
  assignedTechnicianId: Joi.string().optional(),
  internalNotes: Joi.string().max(1000).optional(),
  customerNotes: Joi.string().max(500).optional()
});

// Get all bookings (admin/technician only)
router.get('/', authenticateToken, requireRole(['ADMIN', 'SUPER_ADMIN', 'TECHNICIAN']), async (req, res) => {
  try {
    const { status, customerId, limit = 50, offset = 0, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const queryParams = [];
    let paramIndex = 1;

    if (status) {
      whereClause += ` AND status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    if (customerId) {
      whereClause += ` AND "customerId" = $${paramIndex}`;
      queryParams.push(customerId);
      paramIndex++;
    }

    const validSortColumns = ['createdAt', 'updatedAt', 'status', 'preferredDate', 'finalPrice'];
    const orderBy = validSortColumns.includes(sortBy) ? sortBy : 'createdAt';
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const countQuery = `SELECT COUNT(*) FROM bookings ${whereClause}`;
    const countResult = await req.pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].count);

    const bookingsQuery = `
      SELECT 
        b.*,
        u.email as "customerEmail",
        u."firstName" as "customerFirstName",
        u."lastName" as "customerLastName",
        db.name as "deviceBrand",
        d.name as "deviceModel",
        dv.name as "deviceVariant",
        dc.name as "deviceCategory"
      FROM bookings b
      JOIN users u ON b.customer_id = u.id
      LEFT JOIN devices d ON b.device_id = d.id
      LEFT JOIN device_variants dv ON b.device_variant_id = dv.id
      LEFT JOIN device_brands db ON d.brand_id = db.id
      LEFT JOIN device_categories dc ON d.category_id = dc.id
      ${whereClause}
      ORDER BY "${orderBy}" ${order}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(parseInt(limit), parseInt(offset));
    const bookingsResult = await req.pool.query(bookingsQuery, queryParams);

    res.json({
      success: true,
      bookings: bookingsResult.rows,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    req.logger.error('Get bookings error:', error);
    res.status(500).json({
      error: 'Failed to fetch bookings',
      code: 'FETCH_BOOKINGS_ERROR'
    });
  }
});

// Get customer's own bookings
router.get('/my-bookings', authenticateToken, async (req, res) => {
  try {
    const { status, limit = 10, offset = 0 } = req.query;
    
    let whereClause = 'WHERE b."customerId" = $1';
    const queryParams = [req.user.id];
    let paramIndex = 2;

    if (status) {
      whereClause += ` AND status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    const bookingsQuery = `
      SELECT 
        b.*,
        db.name as "deviceBrand",
        d.name as "deviceModel",
        dv.name as "deviceVariant",
        dc.name as "deviceCategory"
      FROM bookings b
      LEFT JOIN devices d ON b.device_id = d.id
      LEFT JOIN device_variants dv ON b.device_variant_id = dv.id
      LEFT JOIN device_brands db ON d.brand_id = db.id
      LEFT JOIN device_categories dc ON d.category_id = dc.id
      ${whereClause}
      ORDER BY b."createdAt" DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(parseInt(limit), parseInt(offset));
    const bookingsResult = await req.pool.query(bookingsQuery, queryParams);

    res.json({
      success: true,
      bookings: bookingsResult.rows
    });

  } catch (error) {
    req.logger.error('Get customer bookings error:', error);
    res.status(500).json({
      error: 'Failed to fetch your bookings',
      code: 'FETCH_CUSTOMER_BOOKINGS_ERROR'
    });
  }
});

// Get single booking by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const bookingQuery = `
      SELECT 
        b.*,
        u.email as "customerEmail",
        u."firstName" as "customerFirstName",
        u."lastName" as "customerLastName",
        u.phone as "customerPhone",
        db.name as "deviceBrand",
        d.name as "deviceModel",
        dv.name as "deviceVariant",
        dc.name as "deviceCategory",
        tech."firstName" as "technicianFirstName",
        tech."lastName" as "technicianLastName"
      FROM bookings b
      JOIN users u ON b.customer_id = u.id
      LEFT JOIN devices d ON b.device_id = d.id
      LEFT JOIN device_variants dv ON b.device_variant_id = dv.id
      LEFT JOIN device_brands db ON d.brand_id = db.id
      LEFT JOIN device_categories dc ON d.category_id = dc.id
      LEFT JOIN users tech ON b."assignedTechnicianId" = tech.id
      WHERE b.id = $1
    `;

    const result = await req.pool.query(bookingQuery, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Booking not found',
        code: 'BOOKING_NOT_FOUND'
      });
    }

    const booking = result.rows[0];

    // Check if user has permission to view this booking
    const isCustomer = req.user.role === 'CUSTOMER' && booking.customerId === req.user.id;
    const isStaff = ['ADMIN', 'SUPER_ADMIN', 'TECHNICIAN'].includes(req.user.role);

    if (!isCustomer && !isStaff) {
      return res.status(403).json({
        error: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }

    res.json({
      success: true,
      booking
    });

  } catch (error) {
    req.logger.error('Get booking error:', error);
    res.status(500).json({
      error: 'Failed to fetch booking',
      code: 'FETCH_BOOKING_ERROR'
    });
  }
});

// Create new booking
router.post('/', optionalAuth, async (req, res) => {
  const client = await req.pool.connect();
  
  try {
    // Validate input
    const { error, value } = createBookingSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(detail => detail.message)
      });
    }

    const {
      deviceId,
      deviceVariantId,
      repairType,
      problemDescription,
      urgencyLevel,
      preferredDate,
      customerInfo,
      deviceCondition,
      customerNotes
    } = value;

    await client.query('BEGIN');

    // Verify device exists
    const deviceCheck = await client.query(
      'SELECT id FROM devices WHERE id = $1',
      [deviceId]
    );

    if (deviceCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'Invalid device',
        code: 'INVALID_DEVICE_MODEL'
      });
    }

    // Calculate base price based on repair type
    // TODO: Implement pricing rules table lookup
    const basePriceMap = {
      'SCREEN_REPAIR': 150.00,
      'BATTERY_REPLACEMENT': 80.00,
      'WATER_DAMAGE': 200.00,
      'DATA_RECOVERY': 180.00,
      'SOFTWARE_ISSUE': 60.00,
      'HARDWARE_DIAGNOSTIC': 40.00,
      'MOTHERBOARD_REPAIR': 250.00,
      'CAMERA_REPAIR': 120.00,
      'SPEAKER_REPAIR': 90.00,
      'CHARGING_PORT': 100.00,
      'BUTTON_REPAIR': 70.00,
      'CUSTOM_REPAIR': 150.00
    };
    const basePrice = basePriceMap[repairType] || 100.00;

    // Generate booking ID
    const bookingId = crypto.randomBytes(16).toString('hex');

    // Determine customer ID
    let customerId = req.user?.id;
    
    if (!customerId) {
      // For guest bookings, require customer info
      if (!customerInfo || !customerInfo.email) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: 'Customer information required for guest bookings',
          code: 'CUSTOMER_INFO_REQUIRED'
        });
      }
      
      // Create or find guest customer
      const guestEmail = customerInfo.email.toLowerCase();
      const existingCustomer = await client.query(
        'SELECT id FROM "user" WHERE email = $1',
        [guestEmail]
      );

      if (existingCustomer.rows.length > 0) {
        customerId = existingCustomer.rows[0].id;
      } else {
        // Create new guest customer
        const guestId = crypto.randomBytes(16).toString('hex');
        await client.query(
          'INSERT INTO "user" (id, email, "firstName", "lastName", phone, role, "isActive", "emailVerified", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())',
          [
            guestId,
            guestEmail,
            customerInfo.firstName || 'Guest',
            customerInfo.lastName || 'Customer',
            customerInfo.phone || null,
            'CUSTOMER',
            true,
            false
          ]
        );
        customerId = guestId;
      }
    }

    // Create booking
    const bookingQuery = `
      INSERT INTO bookings (
        id, customer_id, device_id, device_variant_id, selected_repairs, issue_description,
        urgency_level, booking_status, quote_base_price, quote_total_price, preferred_date,
        device_condition, special_instructions
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const bookingResult = await client.query(bookingQuery, [
      bookingId,
      customerId,
      deviceId,
      deviceVariantId || null,
      JSON.stringify([repairType]), // selected_repairs is JSON array
      problemDescription,
      urgencyLevel || 'STANDARD',
      'draft',
      basePrice || 0,
      basePrice || 0,
      preferredDate || null,
      deviceCondition || 'unknown',
      customerNotes || null
    ]);

    await client.query('COMMIT');

    req.logger.info(`Booking created: ${bookingId} for customer: ${customerId}`);

    // Get device information for email
    const deviceQuery = `
      SELECT 
        d.name as "deviceModel",
        db.name as "deviceBrand"
      FROM devices d
      JOIN device_brands db ON d.brand_id = db.id
      WHERE d.id = $1
    `;
    const deviceResult = await req.pool.query(deviceQuery, [deviceModelId]);
    
    // Prepare booking data for email
    const emailBookingData = {
      ...bookingResult.rows[0],
      deviceModel: deviceResult.rows[0]?.deviceModel || 'Unknown',
      deviceBrand: deviceResult.rows[0]?.deviceBrand || 'Unknown'
    };

    // Send booking confirmation email (async - don't wait for it)
    if (req.emailService) {
      // Send email asynchronously without blocking the response
      setImmediate(async () => {
        try {
          await sendBookingConfirmationEmail(req.emailService, req.pool, req.logger, customerId, emailBookingData);
          req.logger.info(`📧 Booking confirmation email sent for booking: ${bookingId}`);
        } catch (emailError) {
          req.logger.error(`⚠️ Failed to send confirmation email for booking ${bookingId}:`, emailError);
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking: bookingResult.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    req.logger.error('Create booking error:', error);
    res.status(500).json({
      error: 'Failed to create booking',
      code: 'CREATE_BOOKING_ERROR'
    });
  } finally {
    client.release();
  }
});

// Update booking (staff only)
router.put('/:id', authenticateToken, requireRole(['ADMIN', 'SUPER_ADMIN', 'TECHNICIAN']), async (req, res) => {
  try {
    const { id } = req.params;

    // Validate input
    const { error, value } = updateBookingSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(detail => detail.message)
      });
    }

    // Check if booking exists
    const existingBooking = await req.pool.query(
      'SELECT id FROM bookings WHERE id = $1',
      [id]
    );

    if (existingBooking.rows.length === 0) {
      return res.status(404).json({
        error: 'Booking not found',
        code: 'BOOKING_NOT_FOUND'
      });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, val] of Object.entries(value)) {
      if (val !== undefined) {
        updates.push(`"${key}" = $${paramIndex}`);
        values.push(val);
        paramIndex++;
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'No valid fields to update'
      });
    }

    updates.push('"updatedAt" = NOW()');
    values.push(id);

    const updateQuery = `
      UPDATE bookings 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await req.pool.query(updateQuery, values);

    req.logger.info(`Booking updated: ${id} by user: ${req.user.id}`);

    res.json({
      success: true,
      message: 'Booking updated successfully',
      booking: result.rows[0]
    });

  } catch (error) {
    req.logger.error('Update booking error:', error);
    res.status(500).json({
      error: 'Failed to update booking',
      code: 'UPDATE_BOOKING_ERROR'
    });
  }
});

// Cancel booking
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Get booking details
    const bookingQuery = `
      SELECT "customerId", status 
      FROM bookings 
      WHERE id = $1
    `;

    const bookingResult = await req.pool.query(bookingQuery, [id]);

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Booking not found',
        code: 'BOOKING_NOT_FOUND'
      });
    }

    const booking = bookingResult.rows[0];

    // Check permissions
    const isOwner = req.user.role === 'CUSTOMER' && booking.customerId === req.user.id;
    const isStaff = ['ADMIN', 'SUPER_ADMIN', 'TECHNICIAN'].includes(req.user.role);

    if (!isOwner && !isStaff) {
      return res.status(403).json({
        error: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }

    // Check if booking can be cancelled
    if (['COMPLETED', 'CANCELLED'].includes(booking.status)) {
      return res.status(400).json({
        error: 'Booking cannot be cancelled',
        code: 'BOOKING_NOT_CANCELLABLE'
      });
    }

    // Update booking status to cancelled
    const updateResult = await req.pool.query(
      'UPDATE bookings SET status = $1, "updatedAt" = NOW() WHERE id = $2 RETURNING *',
      ['CANCELLED', id]
    );

    req.logger.info(`Booking cancelled: ${id} by user: ${req.user.id}`);

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      booking: updateResult.rows[0]
    });

  } catch (error) {
    req.logger.error('Cancel booking error:', error);
    res.status(500).json({
      error: 'Failed to cancel booking',
      code: 'CANCEL_BOOKING_ERROR'
    });
  }
});

// Get booking statistics (admin only)
router.get('/stats/overview', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Get comprehensive booking statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN booking_status = 'pending' THEN 1 END) as pending_bookings,
        COUNT(CASE WHEN booking_status = 'in_progress' THEN 1 END) as in_progress_bookings,
        COUNT(CASE WHEN booking_status = 'completed' THEN 1 END) as completed_bookings,
        COUNT(CASE WHEN created_at::date = CURRENT_DATE AND booking_status = 'completed' THEN 1 END) as completed_today,
        AVG(quote_total_price) as average_price,
        SUM(CASE WHEN booking_status = 'completed' THEN quote_total_price ELSE 0 END) as total_revenue,
        SUM(CASE WHEN created_at::date = CURRENT_DATE AND booking_status = 'completed' THEN quote_total_price ELSE 0 END) as revenue_today
      FROM bookings
      WHERE created_at >= NOW() - INTERVAL '30 days'
    `;

    // Get additional metrics (customer satisfaction, avg repair time)
    const additionalStatsQuery = `
      SELECT 
        COUNT(DISTINCT customer_id) as total_customers,
        AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400) as avg_completion_days
      FROM bookings 
      WHERE booking_status = 'completed' 
        AND created_at >= NOW() - INTERVAL '30 days'
    `;

    // Get user count statistics  
    const userStatsQuery = `
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN "createdAt"::date = CURRENT_DATE THEN 1 END) as new_users_today,
        COUNT(CASE WHEN "updatedAt" >= NOW() - INTERVAL '7 days' THEN 1 END) as active_users_week
      FROM "user"
    `;

    const [bookingResult, additionalResult, userResult] = await Promise.all([
      req.pool.query(statsQuery),
      req.pool.query(additionalStatsQuery),
      req.pool.query(userStatsQuery)
    ]);

    const bookingStats = bookingResult.rows[0];
    const additionalStats = additionalResult.rows[0];
    const userStats = userResult.rows[0];

    // Convert and enhance stats to match frontend BookingStats interface
    const stats = {
      total_bookings: parseInt(bookingStats.total_bookings),
      active_customers: parseInt(additionalStats.total_customers) || 0,
      new_customers_today: parseInt(userStats.new_users_today),
      pending_bookings: parseInt(bookingStats.pending_bookings),
      in_progress_bookings: parseInt(bookingStats.in_progress_bookings),
      completed_bookings: parseInt(bookingStats.completed_bookings),
      cancelled_bookings: 0, // TODO: Add cancelled bookings count when available
      avg_completion_time: parseFloat(additionalStats.avg_completion_days) || 0,
      total_revenue: parseFloat(bookingStats.total_revenue) || 0,
      avg_order_value: parseFloat(bookingStats.average_price) || 0,
      completion_rate: bookingStats.total_bookings > 0 ? 
        Math.round((bookingStats.completed_bookings / bookingStats.total_bookings) * 100) : 0,
      low_stock_items: 3 // TODO: Connect to inventory system when available
    };

    res.json({
      success: true,
      stats,
      metadata: {
        period: '30 days',
        generated_at: new Date().toISOString(),
        data_sources: ['bookings', 'users']
      }
    });

  } catch (error) {
    console.error('🔥 BOOKING STATS ERROR:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    req.logger?.error('Get booking stats error:', error);
    
    res.status(500).json({
      error: 'Failed to fetch booking statistics',
      code: 'FETCH_STATS_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Database query failed'
    });
  }
});

module.exports = router;