const express = require('express');
const Joi = require('joi');
const rateLimit = require('express-rate-limit');
const { requireAuth: authenticateToken } = require('../lib/auth-utils');
const { prisma } = require('../lib/prisma');
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
  try {
    const userEmail = req.user.email;
    
    // Find user by email (Better Auth user email -> User record)
    const user = await prisma.user.findUnique({
      where: {
        email: userEmail
      }
    });
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'No user record found for this email'
      });
    }
    
    // Get all bookings for the authenticated user with comprehensive relations
    const bookings = await prisma.booking.findMany({
      where: {
        customerId: user.id
      },
      include: {
        deviceModel: {
          include: {
            brand: {
              include: {
                category: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Transform the data to match frontend interface
    const transformedBookings = bookings.map(booking => ({
      id: booking.id,
      deviceModel: booking.deviceModel?.name || 'Unknown Device',
      deviceBrand: booking.deviceModel?.brand?.name || 'Unknown Brand',
      deviceCategory: booking.deviceModel?.brand?.category?.name || 'Device',
      repairType: Array.isArray(booking.selectedRepairs) 
        ? booking.selectedRepairs.join(', ') 
        : 'General Repair',
      status: booking.bookingStatus || 'draft',
      problemDescription: booking.issueDescription || 'No description provided',
      basePrice: parseFloat(booking.quoteBasePrice) || 0,
      finalPrice: parseFloat(booking.quoteTotalPrice) || 0,
      createdAt: booking.createdAt.toISOString(),
      updatedAt: booking.updatedAt.toISOString(),
      estimatedCompletion: booking.scheduledDate?.toISOString(),
    }));

    res.json({
      success: true,
      data: transformedBookings
    });
    
  } catch (error) {
    req.logger?.error('Error fetching customer bookings:', error);
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
  try {
    const userEmail = req.user.email;
    
    // Find user by email (Better Auth user email -> User record)
    const user = await prisma.user.findUnique({
      where: {
        email: userEmail
      }
    });
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'No user record found for this email'
      });
    }
    
    // Get statistics using Prisma aggregations
    const [
      totalBookings,
      activeBookings,
      completedBookings,
      totalSpentAgg,
      lastBooking
    ] = await Promise.all([
      // Total bookings count
      prisma.booking.count({
        where: { customerId: user.id }
      }),
      
      // Active bookings count
      prisma.booking.count({
        where: {
          customerId: user.id,
          bookingStatus: {
            in: ['confirmed', 'in_progress', 'scheduled']
          }
        }
      }),
      
      // Completed bookings count
      prisma.booking.count({
        where: {
          customerId: user.id,
          bookingStatus: 'completed'
        }
      }),
      
      // Total spent calculation
      prisma.booking.aggregate({
        where: {
          customerId: user.id,
          bookingStatus: 'completed'
        },
        _sum: {
          quoteTotalPrice: true
        }
      }),
      
      // Last booking date
      prisma.booking.findFirst({
        where: { customerId: user.id },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true }
      })
    ]);
    
    const totalSpent = totalSpentAgg._sum.quoteTotalPrice || 0;
    const averageRating = completedBookings > 0 ? 5.0 : 0; // Default to 5.0 for completed bookings
    
    res.json({
      success: true,
      data: {
        totalBookings: totalBookings,
        activeBookings: activeBookings,
        completedBookings: completedBookings,
        totalSpent: parseFloat(totalSpent),
        averageRating: averageRating,
        lastBookingDate: lastBooking?.createdAt?.toISOString() || null
      }
    });
    
  } catch (error) {
    req.logger?.error('Error fetching dashboard stats:', error);
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
  try {
    const userEmail = req.user.email;
    
    // Find user by email (Better Auth user email -> User record)
    const user = await prisma.user.findUnique({
      where: {
        email: userEmail
      }
    });
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'No user record found for this email'
      });
    }
    
    // Get recent booking status changes (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentBookings = await prisma.booking.findMany({
      where: {
        customerId: user.id,
        updatedAt: {
          gte: sevenDaysAgo
        }
      },
      include: {
        deviceModel: {
          include: {
            brand: true
          }
        },
        technician: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 10
    });
    
    // Transform to activity feed format
    const activities = recentBookings.map(booking => {
      let message = '';
      let type = 'status_change';
      
      const deviceBrand = booking.deviceModel?.brand?.name || 'Unknown Brand';
      const deviceModel = booking.deviceModel?.name || 'Unknown Device';
      
      switch (booking.bookingStatus) {
        case 'confirmed':
          message = `Your ${deviceBrand} ${deviceModel} repair has been confirmed`;
          break;
        case 'in_progress':
          message = `Your ${deviceBrand} ${deviceModel} repair is now in progress`;
          break;
        case 'ready_for_pickup':
          message = `Your ${deviceBrand} ${deviceModel} is ready for pickup!`;
          break;
        case 'completed':
          message = `Your ${deviceBrand} ${deviceModel} repair has been completed`;
          break;
        default:
          message = `Update on your ${deviceBrand} ${deviceModel} repair`;
      }
      
      return {
        id: `activity_${booking.id}_${booking.updatedAt.getTime()}`,
        type,
        message,
        timestamp: booking.updatedAt.toISOString(),
        bookingId: booking.id,
        technicianName: booking.technician?.firstName && booking.technician?.lastName 
          ? `${booking.technician.firstName} ${booking.technician.lastName}` 
          : null
      };
    });

    res.json({
      success: true,
      data: activities
    });
    
  } catch (error) {
    req.logger?.error('Error fetching recent activity:', error);
    res.status(500).json({
      error: 'Failed to fetch recent activity',
      message: error.message
    });
  }
});

module.exports = router;