const express = require('express');
const Joi = require('joi');
const { authenticateBetterAuth: authenticateToken, optionalAuth, requireRole, requireAdmin } = require('../middleware/better-auth-official');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();
const { prisma, executeTransaction } = require('../lib/prisma');

// Email confirmation helper function
async function sendBookingConfirmationEmail(emailService, userId, bookingData) {
  try {
    // Get user information using Prisma
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        firstName: true,
        lastName: true
      }
    });
    
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }
    
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
    console.log(`✅ Booking confirmation email sent: ${result.messageId} to ${user.email}`);
    
    return result;
  } catch (error) {
    console.error(`❌ Failed to send booking confirmation email:`, error);
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
  deviceModelId: Joi.string().required(),
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
  technicianId: Joi.string().optional(),
  internalNotes: Joi.string().max(1000).optional(),
  customerNotes: Joi.string().max(500).optional()
});

// Get all bookings (admin/technician only)
router.get('/', authenticateToken, requireRole(['ADMIN', 'SUPER_ADMIN', 'TECHNICIAN']), async (req, res) => {
  try {
    const { status, customerId, limit = 50, offset = 0, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;
    
    // Build where clause
    const where = {};
    
    if (status) {
      where.status = status;
    }
    
    if (customerId) {
      where.customerId = customerId;
    }
    
    // Count total bookings
    const total = await prisma.booking.count({ where });
    
    // Fetch bookings with relations using Prisma
    const bookings = await prisma.booking.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        },
        deviceModel: {
          include: {
            brand: {
              include: {
                category: true
              }
            }
          }
        },
        technician: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        [sortBy]: sortOrder.toLowerCase()
      },
      skip: parseInt(offset),
      take: parseInt(limit)
    });

    res.json({
      success: true,
      data: bookings,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: total > parseInt(offset) + parseInt(limit)
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

// Get customer's bookings
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    
    // Build where clause for current user's bookings
    const where = {
      customerId: req.user.id
    };
    
    if (status) {
      where.status = status;
    }
    
    // Count total bookings for user
    const total = await prisma.booking.count({ where });
    
    // Fetch user's bookings with relations using Prisma
    const bookings = await prisma.booking.findMany({
      where,
      include: {
        deviceModel: {
          include: {
            brand: {
              include: {
                category: true
              }
            }
          }
        },
        technician: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: parseInt(offset),
      take: parseInt(limit)
    });

    res.json({
      success: true,
      data: bookings,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: total > parseInt(offset) + parseInt(limit)
      }
    });

  } catch (error) {
    req.logger.error('Get customer bookings error:', error);
    res.status(500).json({
      error: 'Failed to fetch your bookings',
      code: 'FETCH_BOOKINGS_ERROR'
    });
  }
});

// Get single booking
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Fetch booking with all relations using Prisma
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        },
        deviceModel: {
          include: {
            brand: {
              include: {
                category: true
              }
            }
          }
        },
        technician: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
    
    if (!booking) {
      return res.status(404).json({
        error: 'Booking not found',
        code: 'BOOKING_NOT_FOUND'
      });
    }
    
    // Check if user can access this booking
    const canAccess = req.user.role === 'ADMIN' || 
                     req.user.role === 'SUPER_ADMIN' || 
                     req.user.role === 'TECHNICIAN' || 
                     booking.customerId === req.user.id;
    
    if (!canAccess) {
      return res.status(403).json({
        error: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }
    
    res.json({
      success: true,
      data: booking
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
  try {
    // Validate request body
    const { error, value } = createBookingSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(detail => detail.message)
      });
    }

    const {
      deviceModelId,
      repairType,
      problemDescription,
      urgencyLevel,
      preferredDate,
      customerInfo,
      deviceCondition,
      customerNotes
    } = value;

    // Execute transaction using Prisma
    const result = await executeTransaction(async (tx) => {
      // Verify device model exists
      const deviceModel = await tx.deviceModel.findUnique({
        where: { id: deviceModelId },
        include: {
          brand: true,
          pricingRules: {
            where: {
              repairType: repairType,
              isActive: true
            }
          }
        }
      });

      if (!deviceModel) {
        throw new Error('Invalid device model');
      }

      // Determine customer
      let customerId;
      
      if (req.user) {
        // Authenticated user
        customerId = req.user.id;
      } else {
        // Guest booking
        if (!customerInfo || !customerInfo.email) {
          throw new Error('Customer information required for guest bookings');
        }

        // Create or find guest customer
        const guestEmail = customerInfo.email.toLowerCase();
        let customer = await tx.user.findUnique({
          where: { email: guestEmail }
        });

        if (!customer) {
          // Create new guest customer
          customer = await tx.user.create({
            data: {
              id: crypto.randomBytes(16).toString('hex'),
              email: guestEmail,
              firstName: customerInfo.firstName || 'Guest',
              lastName: customerInfo.lastName || 'User',
              phone: customerInfo.phone || null,
              role: 'CUSTOMER',
              isActive: true,
              emailVerified: false
            }
          });
        }
        
        customerId = customer.id;
      }

      // Calculate pricing
      const pricingRule = deviceModel.pricingRules[0];
      let basePrice = 50; // Default price
      let finalPrice = 50;

      if (pricingRule) {
        basePrice = parseFloat(pricingRule.basePrice);
        finalPrice = basePrice;

        // Apply urgency multiplier
        if (urgencyLevel === 'URGENT') {
          finalPrice = basePrice * 1.5;
        } else if (urgencyLevel === 'EMERGENCY') {
          finalPrice = basePrice * 2;
        }
      }

      // Create booking
      const bookingId = crypto.randomBytes(16).toString('hex');
      const booking = await tx.booking.create({
        data: {
          id: bookingId,
          customerId: customerId,
          deviceModelId: deviceModelId,
          repairType: repairType,
          problemDescription: problemDescription,
          urgencyLevel: urgencyLevel,
          preferredDate: preferredDate ? new Date(preferredDate) : null,
          status: 'PENDING',
          basePrice: basePrice,
          finalPrice: finalPrice,
          deviceCondition: deviceCondition || {},
          customerNotes: customerNotes || null,
          trackingNumber: `RT${Date.now().toString(36).toUpperCase()}`
        },
        include: {
          customer: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          },
          deviceModel: {
            include: {
              brand: {
                include: {
                  category: true
                }
              }
            }
          }
        }
      });

      return booking;
    });

    req.logger.info(`Booking created: ${result.id} for customer: ${result.customerId}`);

    // Send confirmation email (async - don't wait)
    if (req.emailService) {
      const bookingData = {
        ...result,
        deviceBrand: result.deviceModel.brand.name,
        deviceModel: result.deviceModel.name
      };
      
      sendBookingConfirmationEmail(req.emailService, result.customerId, bookingData)
        .catch(error => req.logger.error('Email send error:', error));
    }

    res.status(201).json({
      success: true,
      data: result,
      message: 'Booking created successfully'
    });

  } catch (error) {
    req.logger.error('Create booking error:', error);
    res.status(500).json({
      error: 'Failed to create booking',
      code: 'CREATE_BOOKING_ERROR',
      details: error.message
    });
  }
});

// Update booking
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate request body
    const { error, value } = updateBookingSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(detail => detail.message)
      });
    }

    // Check if booking exists using Prisma
    const existingBooking = await prisma.booking.findUnique({
      where: { id },
      include: {
        customer: true
      }
    });

    if (!existingBooking) {
      return res.status(404).json({
        error: 'Booking not found',
        code: 'BOOKING_NOT_FOUND'
      });
    }

    // Check permissions
    const canUpdate = req.user.role === 'ADMIN' || 
                     req.user.role === 'SUPER_ADMIN' || 
                     req.user.role === 'TECHNICIAN' ||
                     (existingBooking.customerId === req.user.id && 
                      ['status', 'customerNotes'].every(field => !value[field] || field === 'customerNotes'));

    if (!canUpdate) {
      return res.status(403).json({
        error: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }

    // Build update data
    const updateData = {
      updatedAt: new Date()
    };

    // Add fields from validated data
    if (value.status !== undefined) updateData.status = value.status;
    if (value.scheduledDate !== undefined) updateData.scheduledDate = new Date(value.scheduledDate);
    if (value.estimatedCompletion !== undefined) updateData.estimatedCompletion = new Date(value.estimatedCompletion);
    if (value.finalPrice !== undefined) updateData.finalPrice = value.finalPrice;
    if (value.technicianId !== undefined) updateData.technicianId = value.technicianId;
    if (value.internalNotes !== undefined) updateData.internalNotes = value.internalNotes;
    if (value.customerNotes !== undefined) updateData.customerNotes = value.customerNotes;

    // Update booking using Prisma
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        deviceModel: {
          include: {
            brand: {
              include: {
                category: true
              }
            }
          }
        },
        technician: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    req.logger.info(`Booking updated: ${id} by user: ${req.user.id}`);

    res.json({
      success: true,
      data: updatedBooking,
      message: 'Booking updated successfully'
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
router.post('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Fetch booking using Prisma
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        customer: true
      }
    });

    if (!booking) {
      return res.status(404).json({
        error: 'Booking not found',
        code: 'BOOKING_NOT_FOUND'
      });
    }

    // Check permissions
    const canCancel = req.user.role === 'ADMIN' || 
                     req.user.role === 'SUPER_ADMIN' || 
                     booking.customerId === req.user.id;

    if (!canCancel) {
      return res.status(403).json({
        error: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }

    // Check if booking can be cancelled
    if (['COMPLETED', 'CANCELLED'].includes(booking.status)) {
      return res.status(400).json({
        error: 'Booking cannot be cancelled',
        code: 'INVALID_STATUS'
      });
    }

    // Update booking status to cancelled using Prisma
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        updatedAt: new Date(),
        cancellationReason: reason || 'Cancelled by user',
        cancelledAt: new Date(),
        cancelledBy: req.user.id
      },
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        deviceModel: {
          include: {
            brand: true
          }
        }
      }
    });

    req.logger.info(`Booking cancelled: ${id} by user: ${req.user.id}`);

    res.json({
      success: true,
      data: updatedBooking,
      message: 'Booking cancelled successfully'
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
    // Get statistics using Prisma aggregations
    const [
      totalBookings,
      pendingBookings,
      inProgressBookings,
      completedBookings,
      cancelledBookings,
      todayBookings,
      monthRevenue
    ] = await Promise.all([
      // Total bookings
      prisma.booking.count(),
      
      // Pending bookings
      prisma.booking.count({
        where: { status: 'PENDING' }
      }),
      
      // In progress bookings
      prisma.booking.count({
        where: { status: 'IN_PROGRESS' }
      }),
      
      // Completed bookings
      prisma.booking.count({
        where: { status: 'COMPLETED' }
      }),
      
      // Cancelled bookings
      prisma.booking.count({
        where: { status: 'CANCELLED' }
      }),
      
      // Today's bookings
      prisma.booking.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      
      // This month's revenue
      prisma.booking.aggregate({
        where: {
          status: 'COMPLETED',
          completedAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        },
        _sum: {
          finalPrice: true
        }
      })
    ]);

    // Get recent bookings
    const recentBookings = await prisma.booking.findMany({
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        deviceModel: {
          include: {
            brand: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    res.json({
      success: true,
      data: {
        overview: {
          total: totalBookings,
          pending: pendingBookings,
          inProgress: inProgressBookings,
          completed: completedBookings,
          cancelled: cancelledBookings,
          todayCount: todayBookings,
          monthRevenue: monthRevenue._sum.finalPrice || 0
        },
        recentBookings
      }
    });

  } catch (error) {
    req.logger.error('Get booking stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch booking statistics',
      code: 'FETCH_STATS_ERROR'
    });
  }
});

// Health check (open access)
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'bookings-service-prisma',
    timestamp: new Date().toISOString(),
    version: '2.0.0-prisma',
    database: 'prisma'
  });
});

module.exports = router;