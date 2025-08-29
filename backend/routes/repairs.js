const express = require('express');
const Joi = require('joi');
const { requireAuth: authenticateToken, requireRole, requireAdmin } = require('../lib/auth-utils');
const { prisma } = require('../lib/prisma');
const crypto = require('crypto');
const router = express.Router();

// Validation schemas
const updateRepairStatusSchema = Joi.object({
  status: Joi.string().valid('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'READY_FOR_PICKUP', 'COMPLETED', 'CANCELLED').required(),
  technicianNotes: Joi.string().max(1000).optional(),
  estimatedCompletion: Joi.date().iso().optional(),
  finalPrice: Joi.number().min(0).optional()
});

const addRepairNoteSchema = Joi.object({
  note: Joi.string().min(1).max(1000).required(),
  isVisibleToCustomer: Joi.boolean().default(false),
  milestone: Joi.string().optional()
});

// Health check endpoint (no authentication required)
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'repairs-api',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Get all active repairs (staff only)
router.get('/', authenticateToken, requireRole(['ADMIN', 'SUPER_ADMIN', 'TECHNICIAN']), async (req, res) => {
  try {
    const { status, technicianId, limit = 50, offset = 0 } = req.query;

    // Build where clause for Prisma
    let whereClause = {
      status: { in: ['CONFIRMED', 'IN_PROGRESS', 'READY_FOR_PICKUP'] }
    };

    // Status filter override
    if (status && ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'READY_FOR_PICKUP', 'COMPLETED', 'CANCELLED'].includes(status)) {
      whereClause.status = status;
    }

    // Technician filter
    if (technicianId) {
      whereClause.assignedTechnicianId = technicianId;
    }

    const repairs = await prisma.booking.findMany({
      where: whereClause,
      include: {
        customer: {
          select: {
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
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: [
        // Custom urgency ordering - emergency first
        {
          urgencyLevel: 'desc' // EMERGENCY > URGENT > STANDARD
        },
        {
          createdAt: 'asc'
        }
      ],
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    // Transform to match original API structure
    const transformedRepairs = repairs.map(booking => ({
      id: booking.id,
      status: booking.status,
      repairType: booking.repairType,
      problemDescription: booking.problemDescription,
      urgencyLevel: booking.urgencyLevel,
      basePrice: parseFloat(booking.basePrice),
      finalPrice: parseFloat(booking.finalPrice),
      preferredDate: booking.preferredDate?.toISOString(),
      scheduledDate: booking.scheduledDate?.toISOString(),
      estimatedCompletion: booking.estimatedCompletion?.toISOString(),
      completedAt: booking.completedAt?.toISOString(),
      customerNotes: booking.customerNotes,
      internalNotes: booking.internalNotes,
      createdAt: booking.createdAt.toISOString(),
      updatedAt: booking.updatedAt.toISOString(),
      customerEmail: booking.customer.email,
      customerFirstName: booking.customer.firstName,
      customerLastName: booking.customer.lastName,
      customerPhone: booking.customer.phone,
      deviceModel: booking.deviceModel?.name,
      deviceVariant: null, // Would need deviceVariant relation if exists
      deviceYear: booking.deviceModel?.year,
      deviceBrand: booking.deviceModel?.brand?.name,
      deviceCategory: booking.deviceModel?.brand?.category?.name,
      technicianFirstName: booking.technician?.firstName,
      technicianLastName: booking.technician?.lastName
    }));

    res.json({
      success: true,
      repairs: transformedRepairs
    });

  } catch (error) {
    req.logger?.error('Get repairs error:', error);
    res.status(500).json({
      error: 'Failed to fetch repairs',
      code: 'FETCH_REPAIRS_ERROR'
    });
  }
});

// Get specific repair by ID (staff only)
router.get('/:id', authenticateToken, requireRole(['ADMIN', 'SUPER_ADMIN', 'TECHNICIAN']), async (req, res) => {
  try {
    const repairId = req.params.id;

    const repair = await prisma.booking.findUnique({
      where: { id: repairId },
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

    if (!repair) {
      return res.status(404).json({
        error: 'Repair not found',
        code: 'REPAIR_NOT_FOUND'
      });
    }

    // Transform to match expected structure
    const transformedRepair = {
      id: repair.id,
      status: repair.status,
      repairType: repair.repairType,
      problemDescription: repair.problemDescription,
      urgencyLevel: repair.urgencyLevel,
      basePrice: parseFloat(repair.basePrice),
      finalPrice: parseFloat(repair.finalPrice),
      preferredDate: repair.preferredDate?.toISOString(),
      scheduledDate: repair.scheduledDate?.toISOString(),
      estimatedCompletion: repair.estimatedCompletion?.toISOString(),
      completedAt: repair.completedAt?.toISOString(),
      customerNotes: repair.customerNotes,
      internalNotes: repair.internalNotes,
      createdAt: repair.createdAt.toISOString(),
      updatedAt: repair.updatedAt.toISOString(),
      customer: {
        id: repair.customer.id,
        email: repair.customer.email,
        firstName: repair.customer.firstName,
        lastName: repair.customer.lastName,
        phone: repair.customer.phone
      },
      device: {
        model: repair.deviceModel?.name,
        year: repair.deviceModel?.year,
        brand: repair.deviceModel?.brand?.name,
        category: repair.deviceModel?.brand?.category?.name
      },
      technician: repair.technician ? {
        id: repair.technician.id,
        firstName: repair.technician.firstName,
        lastName: repair.technician.lastName,
        email: repair.technician.email
      } : null
    };

    res.json({
      success: true,
      repair: transformedRepair
    });

  } catch (error) {
    req.logger?.error('Get repair details error:', error);
    res.status(500).json({
      error: 'Failed to fetch repair details',
      code: 'FETCH_REPAIR_DETAILS_ERROR'
    });
  }
});

// Update repair status (staff only)
router.put('/:id/status', authenticateToken, requireRole(['ADMIN', 'SUPER_ADMIN', 'TECHNICIAN']), async (req, res) => {
  try {
    const repairId = req.params.id;
    const { error, value } = updateRepairStatusSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.details[0].message
      });
    }

    const { status, technicianNotes, estimatedCompletion, finalPrice } = value;

    // Check if repair exists
    const existingRepair = await prisma.booking.findUnique({
      where: { id: repairId },
      select: { id: true, status: true }
    });

    if (!existingRepair) {
      return res.status(404).json({
        error: 'Repair not found',
        code: 'REPAIR_NOT_FOUND'
      });
    }

    // Build update data
    const updateData = {
      status,
      updatedAt: new Date()
    };

    if (technicianNotes) updateData.internalNotes = technicianNotes;
    if (estimatedCompletion) updateData.estimatedCompletion = new Date(estimatedCompletion);
    if (finalPrice !== undefined) updateData.finalPrice = finalPrice;
    if (status === 'COMPLETED' && !existingRepair.completedAt) {
      updateData.completedAt = new Date();
    }

    // Update the repair
    const updatedRepair = await prisma.booking.update({
      where: { id: repairId },
      data: updateData,
      select: {
        id: true,
        status: true,
        finalPrice: true,
        estimatedCompletion: true,
        completedAt: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      message: 'Repair status updated successfully',
      repair: {
        ...updatedRepair,
        finalPrice: parseFloat(updatedRepair.finalPrice),
        estimatedCompletion: updatedRepair.estimatedCompletion?.toISOString(),
        completedAt: updatedRepair.completedAt?.toISOString(),
        updatedAt: updatedRepair.updatedAt.toISOString()
      }
    });

  } catch (error) {
    req.logger?.error('Update repair status error:', error);
    res.status(500).json({
      error: 'Failed to update repair status',
      code: 'UPDATE_REPAIR_STATUS_ERROR'
    });
  }
});

// Assign technician to repair (admin only)
router.put('/:id/assign', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const repairId = req.params.id;
    const { technicianId } = req.body;

    if (!technicianId) {
      return res.status(400).json({
        error: 'Technician ID is required'
      });
    }

    // Verify technician exists and has correct role
    const technician = await prisma.user.findUnique({
      where: { id: technicianId },
      select: { id: true, role: true, firstName: true, lastName: true }
    });

    if (!technician) {
      return res.status(404).json({
        error: 'Technician not found'
      });
    }

    if (!['TECHNICIAN', 'ADMIN', 'SUPER_ADMIN'].includes(technician.role)) {
      return res.status(400).json({
        error: 'User is not authorized to be assigned as technician'
      });
    }

    // Update repair assignment
    const updatedRepair = await prisma.booking.update({
      where: { id: repairId },
      data: {
        assignedTechnicianId: technicianId,
        updatedAt: new Date()
      },
      select: {
        id: true,
        assignedTechnicianId: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      message: 'Technician assigned successfully',
      repair: {
        id: updatedRepair.id,
        assignedTechnicianId: updatedRepair.assignedTechnicianId,
        assignedTechnician: {
          id: technician.id,
          firstName: technician.firstName,
          lastName: technician.lastName
        },
        updatedAt: updatedRepair.updatedAt.toISOString()
      }
    });

  } catch (error) {
    req.logger?.error('Assign technician error:', error);
    res.status(500).json({
      error: 'Failed to assign technician',
      code: 'ASSIGN_TECHNICIAN_ERROR'
    });
  }
});

// Get repair statistics (admin only) 
router.get('/stats/summary', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // Calculate time period
    let startDate;
    const now = new Date();
    
    switch (period) {
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
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get repair statistics using Prisma aggregations
    const [
      totalRepairs,
      pendingRepairs,
      inProgressRepairs,
      completedRepairs,
      revenueStats,
      urgencyStats,
      avgCompletionTime
    ] = await Promise.all([
      // Total repairs in period
      prisma.booking.count({
        where: { createdAt: { gte: startDate } }
      }),
      
      // Pending repairs
      prisma.booking.count({
        where: {
          status: 'PENDING',
          createdAt: { gte: startDate }
        }
      }),
      
      // In progress repairs
      prisma.booking.count({
        where: {
          status: { in: ['CONFIRMED', 'IN_PROGRESS'] },
          createdAt: { gte: startDate }
        }
      }),
      
      // Completed repairs
      prisma.booking.count({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: startDate }
        }
      }),
      
      // Revenue statistics
      prisma.booking.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: startDate }
        },
        _sum: { finalPrice: true },
        _avg: { finalPrice: true }
      }),
      
      // Urgency level distribution
      prisma.booking.groupBy({
        by: ['urgencyLevel'],
        where: { createdAt: { gte: startDate } },
        _count: { id: true }
      }),
      
      // Average completion time (completed repairs only)
      prisma.booking.findMany({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: startDate },
          completedAt: { not: null }
        },
        select: {
          createdAt: true,
          completedAt: true
        }
      })
    ]);

    // Calculate average completion time
    let avgDays = 0;
    if (avgCompletionTime.length > 0) {
      const totalTime = avgCompletionTime.reduce((sum, repair) => {
        const diffMs = new Date(repair.completedAt) - new Date(repair.createdAt);
        return sum + diffMs;
      }, 0);
      avgDays = totalTime / (avgCompletionTime.length * 24 * 60 * 60 * 1000);
    }

    // Transform urgency statistics
    const urgencyDistribution = {};
    urgencyStats.forEach(stat => {
      urgencyDistribution[stat.urgencyLevel.toLowerCase()] = stat._count.id;
    });

    res.json({
      success: true,
      period,
      statistics: {
        totalRepairs,
        pendingRepairs,
        inProgressRepairs,
        completedRepairs,
        cancelledRepairs: totalRepairs - (pendingRepairs + inProgressRepairs + completedRepairs),
        revenue: {
          total: parseFloat(revenueStats._sum.finalPrice || 0),
          average: parseFloat(revenueStats._avg.finalPrice || 0)
        },
        urgencyDistribution: {
          emergency: urgencyDistribution.emergency || 0,
          urgent: urgencyDistribution.urgent || 0,
          standard: urgencyDistribution.standard || 0
        },
        performance: {
          completionRate: totalRepairs > 0 ? ((completedRepairs / totalRepairs) * 100).toFixed(1) : '0.0',
          avgCompletionDays: avgDays.toFixed(1)
        }
      },
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    req.logger?.error('Get repair stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch repair statistics',
      code: 'FETCH_REPAIR_STATS_ERROR'
    });
  }
});

module.exports = router;