/**
 * PRISMA MIGRATION: Admin Analytics API
 * Converted from raw SQL to Prisma ORM operations
 * Dashboard data and ML metrics integration
 */

const express = require('express');
const router = express.Router();
const { prisma } = require('../../lib/prisma');
const { requireAuth: authenticateToken, requireAdmin } = require('../../lib/auth-utils');
const axios = require('axios');

// Phase 4 AI server connection  
const PHASE4_SERVER_URL = process.env.PHASE4_SERVER_URL || 'http://localhost:3015';

// Helper function to fetch ML metrics from Phase 4 server
const fetchPhase4Metrics = async () => {
    try {
        const response = await axios.get(`${PHASE4_SERVER_URL}/api/ai-advanced/metrics`, {
            timeout: 5000
        });
        return response.data;
    } catch (error) {
        // Warning: Cannot connect to Phase 4 server
        return null;
    }
};

// Helper function to calculate time periods
const getTimePeriod = (period) => {
    const now = new Date();
    let startDate;

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

    return { startDate, endDate: now };
};

// Helper function for safe division
const safeDivision = (numerator, denominator) => {
    return denominator === 0 ? 0 : (numerator / denominator);
};

// Helper function to safely count Prisma models that may not exist
const safeModelCount = async (modelName) => {
    try {
        // Check if the model exists in Prisma client
        if (!(modelName in prisma)) {
            console.warn(`Model ${modelName} not found in Prisma client`);
            return 0;
        }
        
        const count = await prisma[modelName].count();
        return count;
    } catch (error) {
        // Handle different types of Prisma errors
        if (error.code === 'P2021') {
            // Table does not exist in database
            console.error(`Table for model ${modelName} does not exist in database`);
            return 0;
        } else if (error.code === 'P1001') {
            // Database connection error
            console.error(`Database connection error when counting ${modelName}:`, error.message);
            return 0;
        }
        
        // Other unexpected errors
        console.error(`Unexpected error counting ${modelName}:`, error.message);
        return 0;
    }
};

// Health check endpoint (no authentication required)
router.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'admin-analytics-api',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// DEV-ONLY Dashboard endpoint (no auth for development bypass)
if (process.env.NODE_ENV === 'development') {
  router.get('/dashboard-dev', async (req, res) => {
    try {
      const { period = '30d' } = req.query;
      const { startDate } = getTimePeriod(period);

      // Execute all analytics queries in parallel using Prisma
      const [
          totalCustomers,
          totalBookings, 
          totalRevenue,
          completedRepairs,
          pendingRepairs,
          recentBookings,
          customerGrowth,
          revenueGrowth,
          procedureStats,
          mediaStats,
          recentActivity
      ] = await Promise.all([
          // Total customers (users with CUSTOMER role)
          prisma.user.count({
              where: { role: 'CUSTOMER' }
          }),

          // Total bookings in period
          prisma.booking.count({
              where: { 
                  createdAt: { gte: startDate } 
              }
          }),

          // Total revenue from completed bookings
          prisma.booking.aggregate({
              where: {
                  status: 'COMPLETED',
                  createdAt: { gte: startDate }
              },
              _sum: { finalPrice: true }
          }),

          // Completed repairs count
          prisma.booking.count({
              where: {
                  status: 'COMPLETED',
                  createdAt: { gte: startDate }
              }
          }),

          // Pending repairs count
          prisma.booking.count({
              where: {
                  status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] },
                  createdAt: { gte: startDate }
              }
          }),

          // Recent bookings with customer info
          prisma.booking.findMany({
              take: 10,
              orderBy: { createdAt: 'desc' },
              include: {
                  customer: {
                      select: {
                          firstName: true,
                          lastName: true,
                          email: true
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
          }),

          // Customer growth (previous period comparison)
          prisma.user.count({
              where: {
                  role: 'CUSTOMER',
                  createdAt: { 
                      gte: new Date(startDate.getTime() - (Date.now() - startDate.getTime()))
                  }
              }
          }),

          // Revenue growth (previous period comparison) 
          prisma.booking.aggregate({
              where: {
                  status: 'COMPLETED',
                  createdAt: { 
                      gte: new Date(startDate.getTime() - (Date.now() - startDate.getTime())),
                      lt: startDate
                  }
              },
              _sum: { finalPrice: true }
          }),

          // Procedure statistics (if repair_procedures table exists)
          safeModelCount('repairProcedure'),

          // Media statistics (if media_files table exists)
          safeModelCount('mediaFile'),

          // Recent activity from various tables
          Promise.all([
              prisma.booking.findMany({
                  take: 5,
                  orderBy: { updatedAt: 'desc' },
                  select: {
                      id: true,
                      status: true,
                      updatedAt: true,
                      customer: {
                          select: { firstName: true, lastName: true }
                      }
                  }
              }),
              prisma.user.findMany({
                  take: 3,
                  where: { role: 'CUSTOMER' },
                  orderBy: { createdAt: 'desc' },
                  select: {
                      firstName: true,
                      lastName: true,
                      createdAt: true
                  }
              })
          ]).then(([bookings, customers]) => ({ bookings, customers }))
      ]);

      // Calculate metrics
      const currentRevenue = parseFloat(totalRevenue._sum.finalPrice || 0);
      const previousRevenue = parseFloat(revenueGrowth._sum.finalPrice || 0);
      const revenueGrowthPercent = previousRevenue > 0 
          ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
          : 0;

      const completionRate = totalBookings > 0 
          ? (completedRepairs / totalBookings) * 100 
          : 0;

      // Try to fetch Phase 4 ML metrics
      const mlMetrics = await fetchPhase4Metrics();

      // Build response
      const dashboardData = {
          period,
          overview: {
              totalCustomers,
              totalBookings,
              totalRevenue: currentRevenue,
              completedRepairs,
              pendingRepairs,
              completionRate: parseFloat(completionRate.toFixed(1)),
              revenueGrowth: parseFloat(revenueGrowthPercent.toFixed(1))
          },
          metrics: {
              customerGrowth: {
                  current: totalCustomers,
                  previous: customerGrowth,
                  growth: totalCustomers - customerGrowth
              },
              revenue: {
                  current: currentRevenue,
                  previous: previousRevenue, 
                  growth: revenueGrowthPercent
              }
          },
          stats: {
              procedures: procedureStats,
              mediaFiles: mediaStats
          },
          recentActivity: {
              bookings: recentActivity.bookings.map(booking => ({
                  id: booking.id,
                  status: booking.status,
                  customerName: `${booking.customer.firstName} ${booking.customer.lastName}`,
                  updatedAt: booking.updatedAt.toISOString(),
                  type: 'booking_update'
              })),
              customers: recentActivity.customers.map(customer => ({
                  name: `${customer.firstName} ${customer.lastName}`,
                  createdAt: customer.createdAt.toISOString(),
                  type: 'new_customer'
              }))
          },
          recentBookings: recentBookings.map(booking => ({
              id: booking.id,
              customerName: `${booking.customer.firstName} ${booking.customer.lastName}`,
              customerEmail: booking.customer.email,
              deviceInfo: `${booking.deviceModel?.brand?.name || 'Unknown'} ${booking.deviceModel?.name || 'Device'}`,
              repairType: booking.repairType,
              status: booking.status,
              finalPrice: parseFloat(booking.finalPrice || 0),
              createdAt: booking.createdAt.toISOString()
          })),
          mlMetrics: mlMetrics || {
              available: false,
              message: 'ML metrics server not available'
          },
          generatedAt: new Date().toISOString()
      };

      res.json({
          success: true,
          data: dashboardData
      });

    } catch (error) {
        req.logger?.error('Dashboard analytics error:', error);
        res.status(500).json({
            error: 'Failed to fetch dashboard analytics',
            code: 'DASHBOARD_ANALYTICS_ERROR',
            details: error.message
        });
    }
  });

  // DEV-ONLY Realtime endpoint (no auth for development bypass)
  router.get('/realtime-dev', async (req, res) => {
    try {
        const now = new Date();
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const [
            liveBookings,
            todayRevenue,
            activeCustomers,
            systemStatus
        ] = await Promise.all([
            // Live booking status
            prisma.booking.count({
                where: {
                    status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] }
                }
            }),

            // Today's revenue
            prisma.booking.aggregate({
                where: {
                    status: 'COMPLETED',
                    createdAt: { gte: last24Hours }
                },
                _sum: { finalPrice: true }
            }),

            // Active customers (customers with recent activity)
            prisma.user.count({
                where: {
                    role: 'CUSTOMER',
                    bookings: {
                        some: {
                            createdAt: { gte: last24Hours }
                        }
                    }
                }
            }),

            // System status checks
            Promise.all([
                prisma.$queryRaw`SELECT 1 as db_healthy`.then(() => ({ database: 'healthy' })).catch(() => ({ database: 'error' })),
                fetchPhase4Metrics().then(metrics => ({ mlServer: metrics ? 'healthy' : 'unavailable' }))
            ]).then(([dbStatus, mlStatus]) => ({ ...dbStatus, ...mlStatus }))
        ]);

        res.json({
            success: true,
            data: {
                timestamp: now.toISOString(),
                metrics: {
                    liveBookings,
                    todayRevenue: parseFloat(todayRevenue._sum.finalPrice || 0),
                    activeCustomers
                },
                systemStatus,
                refreshRate: '30s'
            }
        });

    } catch (error) {
        req.logger?.error('Real-time analytics error:', error);
        res.status(500).json({
            error: 'Failed to fetch real-time analytics',
            code: 'REALTIME_ANALYTICS_ERROR',
            details: error.message
        });
    }
  });
}

// Dashboard overview endpoint with Prisma aggregations
router.get('/dashboard', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { period = '30d' } = req.query;
        const { startDate } = getTimePeriod(period);

        // Execute all analytics queries in parallel using Prisma
        const [
            totalCustomers,
            totalBookings, 
            totalRevenue,
            completedRepairs,
            pendingRepairs,
            recentBookings,
            customerGrowth,
            revenueGrowth,
            procedureStats,
            mediaStats,
            recentActivity
        ] = await Promise.all([
            // Total customers (users with CUSTOMER role)
            prisma.user.count({
                where: { role: 'CUSTOMER' }
            }),

            // Total bookings in period
            prisma.booking.count({
                where: { 
                    createdAt: { gte: startDate } 
                }
            }),

            // Total revenue from completed bookings
            prisma.booking.aggregate({
                where: {
                    status: 'COMPLETED',
                    createdAt: { gte: startDate }
                },
                _sum: { finalPrice: true }
            }),

            // Completed repairs count
            prisma.booking.count({
                where: {
                    status: 'COMPLETED',
                    createdAt: { gte: startDate }
                }
            }),

            // Pending repairs count
            prisma.booking.count({
                where: {
                    status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] },
                    createdAt: { gte: startDate }
                }
            }),

            // Recent bookings with customer info
            prisma.booking.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' },
                include: {
                    customer: {
                        select: {
                            firstName: true,
                            lastName: true,
                            email: true
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
            }),

            // Customer growth (previous period comparison)
            prisma.user.count({
                where: {
                    role: 'CUSTOMER',
                    createdAt: { 
                        gte: new Date(startDate.getTime() - (Date.now() - startDate.getTime()))
                    }
                }
            }),

            // Revenue growth (previous period comparison) 
            prisma.booking.aggregate({
                where: {
                    status: 'COMPLETED',
                    createdAt: { 
                        gte: new Date(startDate.getTime() - (Date.now() - startDate.getTime())),
                        lt: startDate
                    }
                },
                _sum: { finalPrice: true }
            }),

            // Procedure statistics (if repair_procedures table exists)
            safeModelCount('repairProcedure'),

            // Media statistics (if media_files table exists)
            safeModelCount('mediaFile'),

            // Recent activity from various tables
            Promise.all([
                prisma.booking.findMany({
                    take: 5,
                    orderBy: { updatedAt: 'desc' },
                    select: {
                        id: true,
                        status: true,
                        updatedAt: true,
                        customer: {
                            select: { firstName: true, lastName: true }
                        }
                    }
                }),
                prisma.user.findMany({
                    take: 3,
                    where: { role: 'CUSTOMER' },
                    orderBy: { createdAt: 'desc' },
                    select: {
                        firstName: true,
                        lastName: true,
                        createdAt: true
                    }
                })
            ]).then(([bookings, customers]) => ({ bookings, customers }))
        ]);

        // Calculate metrics
        const currentRevenue = parseFloat(totalRevenue._sum.finalPrice || 0);
        const previousRevenue = parseFloat(revenueGrowth._sum.finalPrice || 0);
        const revenueGrowthPercent = previousRevenue > 0 
            ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
            : 0;

        const completionRate = totalBookings > 0 
            ? (completedRepairs / totalBookings) * 100 
            : 0;

        // Try to fetch Phase 4 ML metrics
        const mlMetrics = await fetchPhase4Metrics();

        // Build response
        const dashboardData = {
            period,
            overview: {
                totalCustomers,
                totalBookings,
                totalRevenue: currentRevenue,
                completedRepairs,
                pendingRepairs,
                completionRate: parseFloat(completionRate.toFixed(1)),
                revenueGrowth: parseFloat(revenueGrowthPercent.toFixed(1))
            },
            metrics: {
                customerGrowth: {
                    current: totalCustomers,
                    previous: customerGrowth,
                    growth: totalCustomers - customerGrowth
                },
                revenue: {
                    current: currentRevenue,
                    previous: previousRevenue, 
                    growth: revenueGrowthPercent
                }
            },
            stats: {
                procedures: procedureStats,
                mediaFiles: mediaStats
            },
            recentActivity: {
                bookings: recentActivity.bookings.map(booking => ({
                    id: booking.id,
                    status: booking.status,
                    customerName: `${booking.customer.firstName} ${booking.customer.lastName}`,
                    updatedAt: booking.updatedAt.toISOString(),
                    type: 'booking_update'
                })),
                customers: recentActivity.customers.map(customer => ({
                    name: `${customer.firstName} ${customer.lastName}`,
                    createdAt: customer.createdAt.toISOString(),
                    type: 'new_customer'
                }))
            },
            recentBookings: recentBookings.map(booking => ({
                id: booking.id,
                customerName: `${booking.customer.firstName} ${booking.customer.lastName}`,
                customerEmail: booking.customer.email,
                deviceInfo: `${booking.deviceModel?.brand?.name || 'Unknown'} ${booking.deviceModel?.name || 'Device'}`,
                repairType: booking.repairType,
                status: booking.status,
                finalPrice: parseFloat(booking.finalPrice || 0),
                createdAt: booking.createdAt.toISOString()
            })),
            mlMetrics: mlMetrics || {
                available: false,
                message: 'ML metrics server not available'
            },
            generatedAt: new Date().toISOString()
        };

        res.json({
            success: true,
            data: dashboardData
        });

    } catch (error) {
        req.logger?.error('Dashboard analytics error:', error);
        res.status(500).json({
            error: 'Failed to fetch dashboard analytics',
            code: 'DASHBOARD_ANALYTICS_ERROR'
        });
    }
});

// Revenue analytics endpoint
router.get('/revenue', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { period = '30d', groupBy = 'day' } = req.query;
        const { startDate } = getTimePeriod(period);

        // Get revenue data grouped by time period using Prisma
        const revenueData = await prisma.booking.findMany({
            where: {
                status: 'COMPLETED',
                createdAt: { gte: startDate },
                finalPrice: { not: null }
            },
            select: {
                finalPrice: true,
                createdAt: true,
                repairType: true
            },
            orderBy: { createdAt: 'asc' }
        });

        // Group data by specified period
        const groupedRevenue = {};
        revenueData.forEach(booking => {
            let key;
            const date = new Date(booking.createdAt);
            
            switch (groupBy) {
                case 'hour':
                    key = date.toISOString().slice(0, 13) + ':00:00.000Z';
                    break;
                case 'day':
                    key = date.toISOString().slice(0, 10);
                    break;
                case 'week':
                    const weekStart = new Date(date);
                    weekStart.setDate(date.getDate() - date.getDay());
                    key = weekStart.toISOString().slice(0, 10);
                    break;
                case 'month':
                    key = date.toISOString().slice(0, 7);
                    break;
                default:
                    key = date.toISOString().slice(0, 10);
            }

            if (!groupedRevenue[key]) {
                groupedRevenue[key] = {
                    date: key,
                    revenue: 0,
                    bookings: 0,
                    repairTypes: {}
                };
            }

            groupedRevenue[key].revenue += parseFloat(booking.finalPrice);
            groupedRevenue[key].bookings += 1;

            if (!groupedRevenue[key].repairTypes[booking.repairType]) {
                groupedRevenue[key].repairTypes[booking.repairType] = 0;
            }
            groupedRevenue[key].repairTypes[booking.repairType] += 1;
        });

        // Convert to array and sort by date
        const revenueArray = Object.values(groupedRevenue).sort((a, b) => 
            new Date(a.date) - new Date(b.date)
        );

        // Calculate totals
        const totalRevenue = revenueArray.reduce((sum, item) => sum + item.revenue, 0);
        const totalBookings = revenueArray.reduce((sum, item) => sum + item.bookings, 0);
        const averageOrderValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

        res.json({
            success: true,
            data: {
                period,
                groupBy,
                summary: {
                    totalRevenue: parseFloat(totalRevenue.toFixed(2)),
                    totalBookings,
                    averageOrderValue: parseFloat(averageOrderValue.toFixed(2))
                },
                timeline: revenueArray.map(item => ({
                    ...item,
                    revenue: parseFloat(item.revenue.toFixed(2))
                }))
            }
        });

    } catch (error) {
        req.logger?.error('Revenue analytics error:', error);
        res.status(500).json({
            error: 'Failed to fetch revenue analytics', 
            code: 'REVENUE_ANALYTICS_ERROR'
        });
    }
});

// Customer analytics endpoint
router.get('/customers', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { period = '30d' } = req.query;
        const { startDate } = getTimePeriod(period);

        const [
            newCustomers,
            returningCustomers,
            customersByLocation,
            topCustomers,
            customerGrowth
        ] = await Promise.all([
            // New customers in period
            prisma.user.count({
                where: {
                    role: 'CUSTOMER',
                    createdAt: { gte: startDate }
                }
            }),

            // Returning customers (customers with multiple bookings)
            prisma.user.count({
                where: {
                    role: 'CUSTOMER',
                    bookings: {
                        some: {
                            createdAt: { gte: startDate }
                        }
                    }
                }
            }),

            // Customer distribution (would need location data)
            prisma.user.groupBy({
                by: ['role'],
                where: {
                    role: 'CUSTOMER',
                    createdAt: { gte: startDate }
                },
                _count: { id: true }
            }),

            // Top customers by revenue
            prisma.user.findMany({
                where: { role: 'CUSTOMER' },
                include: {
                    bookings: {
                        where: {
                            status: 'COMPLETED',
                            createdAt: { gte: startDate }
                        },
                        select: {
                            finalPrice: true
                        }
                    }
                },
                take: 10
            }).then(customers => 
                customers
                    .map(customer => ({
                        id: customer.id,
                        name: `${customer.firstName} ${customer.lastName}`,
                        email: customer.email,
                        totalSpent: customer.bookings.reduce((sum, booking) => 
                            sum + parseFloat(booking.finalPrice || 0), 0
                        ),
                        bookingCount: customer.bookings.length
                    }))
                    .filter(customer => customer.totalSpent > 0)
                    .sort((a, b) => b.totalSpent - a.totalSpent)
                    .slice(0, 10)
            ),

            // Customer growth over time
            prisma.user.groupBy({
                by: ['createdAt'],
                where: {
                    role: 'CUSTOMER',
                    createdAt: { gte: startDate }
                },
                _count: { id: true },
                orderBy: { createdAt: 'asc' }
            })
        ]);

        res.json({
            success: true,
            data: {
                period,
                summary: {
                    newCustomers,
                    returningCustomers,
                    totalCustomers: newCustomers
                },
                topCustomers: topCustomers.map(customer => ({
                    ...customer,
                    totalSpent: parseFloat(customer.totalSpent.toFixed(2))
                })),
                growth: customerGrowth.map(item => ({
                    date: item.createdAt.toISOString().slice(0, 10),
                    customers: item._count.id
                }))
            }
        });

    } catch (error) {
        req.logger?.error('Customer analytics error:', error);
        res.status(500).json({
            error: 'Failed to fetch customer analytics',
            code: 'CUSTOMER_ANALYTICS_ERROR'
        });
    }
});

// Device analytics endpoint
router.get('/devices', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { period = '30d' } = req.query;
        const { startDate } = getTimePeriod(period);

        const [
            deviceStats,
            brandStats,
            categoryStats,
            repairTypeStats
        ] = await Promise.all([
            // Most repaired device models
            prisma.booking.groupBy({
                by: ['deviceModelId'],
                where: { createdAt: { gte: startDate } },
                _count: { id: true },
                orderBy: { _count: { id: 'desc' } },
                take: 10
            }).then(async results => {
                // Get device model details
                const modelIds = results.map(r => r.deviceModelId).filter(Boolean);
                const models = await prisma.deviceModel.findMany({
                    where: { id: { in: modelIds } },
                    include: {
                        brand: {
                            include: { category: true }
                        }
                    }
                });

                return results.map(result => {
                    const model = models.find(m => m.id === result.deviceModelId);
                    return {
                        deviceModel: model?.name || 'Unknown',
                        brand: model?.brand?.name || 'Unknown',
                        category: model?.brand?.category?.name || 'Unknown',
                        repairCount: result._count.id
                    };
                });
            }),

            // Brand statistics
            prisma.booking.findMany({
                where: { createdAt: { gte: startDate } },
                include: {
                    deviceModel: {
                        include: { brand: true }
                    }
                }
            }).then(bookings => {
                const brandCounts = {};
                bookings.forEach(booking => {
                    const brandName = booking.deviceModel?.brand?.name || 'Unknown';
                    brandCounts[brandName] = (brandCounts[brandName] || 0) + 1;
                });

                return Object.entries(brandCounts)
                    .map(([brand, count]) => ({ brand, count }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 10);
            }),

            // Category statistics
            prisma.booking.findMany({
                where: { createdAt: { gte: startDate } },
                include: {
                    deviceModel: {
                        include: {
                            brand: {
                                include: { category: true }
                            }
                        }
                    }
                }
            }).then(bookings => {
                const categoryCounts = {};
                bookings.forEach(booking => {
                    const categoryName = booking.deviceModel?.brand?.category?.name || 'Unknown';
                    categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1;
                });

                return Object.entries(categoryCounts)
                    .map(([category, count]) => ({ category, count }))
                    .sort((a, b) => b.count - a.count);
            }),

            // Repair type statistics
            prisma.booking.groupBy({
                by: ['repairType'],
                where: { createdAt: { gte: startDate } },
                _count: { id: true },
                orderBy: { _count: { id: 'desc' } }
            }).then(results => 
                results.map(result => ({
                    repairType: result.repairType || 'Unknown',
                    count: result._count.id
                }))
            )
        ]);

        res.json({
            success: true,
            data: {
                period,
                devices: deviceStats,
                brands: brandStats,
                categories: categoryStats,
                repairTypes: repairTypeStats
            }
        });

    } catch (error) {
        req.logger?.error('Device analytics error:', error);
        res.status(500).json({
            error: 'Failed to fetch device analytics',
            code: 'DEVICE_ANALYTICS_ERROR'
        });
    }
});

// Performance analytics endpoint
router.get('/performance', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { period = '30d' } = req.query;
        const { startDate } = getTimePeriod(period);

        const [
            completionTimes,
            statusDistribution,
            technicianPerformance
        ] = await Promise.all([
            // Average completion times
            prisma.booking.findMany({
                where: {
                    status: 'COMPLETED',
                    createdAt: { gte: startDate },
                    completedAt: { not: null }
                },
                select: {
                    createdAt: true,
                    completedAt: true,
                    repairType: true
                }
            }).then(bookings => {
                const completionData = {};
                let totalCompletionTime = 0;
                let totalBookings = 0;

                bookings.forEach(booking => {
                    const completionTime = new Date(booking.completedAt) - new Date(booking.createdAt);
                    const days = completionTime / (1000 * 60 * 60 * 24);

                    if (!completionData[booking.repairType]) {
                        completionData[booking.repairType] = {
                            totalTime: 0,
                            count: 0
                        };
                    }

                    completionData[booking.repairType].totalTime += days;
                    completionData[booking.repairType].count += 1;

                    totalCompletionTime += days;
                    totalBookings += 1;
                });

                return {
                    average: totalBookings > 0 ? totalCompletionTime / totalBookings : 0,
                    byRepairType: Object.entries(completionData).map(([type, data]) => ({
                        repairType: type,
                        averageDays: data.count > 0 ? data.totalTime / data.count : 0,
                        count: data.count
                    }))
                };
            }),

            // Status distribution
            prisma.booking.groupBy({
                by: ['status'],
                where: { createdAt: { gte: startDate } },
                _count: { id: true }
            }),

            // Technician performance (if assigned)
            prisma.booking.groupBy({
                by: ['assignedTechnicianId'],
                where: {
                    createdAt: { gte: startDate },
                    assignedTechnicianId: { not: null }
                },
                _count: { id: true }
            }).then(async results => {
                if (results.length === 0) return [];

                const technicianIds = results.map(r => r.assignedTechnicianId);
                const technicians = await prisma.user.findMany({
                    where: { id: { in: technicianIds } },
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                });

                return results.map(result => {
                    const tech = technicians.find(t => t.id === result.assignedTechnicianId);
                    return {
                        technicianId: result.assignedTechnicianId,
                        technicianName: tech ? `${tech.firstName} ${tech.lastName}` : 'Unknown',
                        assignedBookings: result._count.id
                    };
                }).sort((a, b) => b.assignedBookings - a.assignedBookings);
            })
        ]);

        res.json({
            success: true,
            data: {
                period,
                completionTimes: {
                    average: parseFloat(completionTimes.average.toFixed(2)),
                    byRepairType: completionTimes.byRepairType.map(item => ({
                        ...item,
                        averageDays: parseFloat(item.averageDays.toFixed(2))
                    }))
                },
                statusDistribution: statusDistribution.map(item => ({
                    status: item.status,
                    count: item._count.id
                })),
                technicianPerformance
            }
        });

    } catch (error) {
        req.logger?.error('Performance analytics error:', error);
        res.status(500).json({
            error: 'Failed to fetch performance analytics',
            code: 'PERFORMANCE_ANALYTICS_ERROR'
        });
    }
});

// Real-time metrics endpoint
router.get('/realtime', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const now = new Date();
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const [
            liveBookings,
            todayRevenue,
            activeCustomers,
            systemStatus
        ] = await Promise.all([
            // Live booking status
            prisma.booking.count({
                where: {
                    status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] }
                }
            }),

            // Today's revenue
            prisma.booking.aggregate({
                where: {
                    status: 'COMPLETED',
                    createdAt: { gte: last24Hours }
                },
                _sum: { finalPrice: true }
            }),

            // Active customers (customers with recent activity)
            prisma.user.count({
                where: {
                    role: 'CUSTOMER',
                    bookings: {
                        some: {
                            createdAt: { gte: last24Hours }
                        }
                    }
                }
            }),

            // System status checks
            Promise.all([
                prisma.$queryRaw`SELECT 1 as db_healthy`.then(() => ({ database: 'healthy' })).catch(() => ({ database: 'error' })),
                fetchPhase4Metrics().then(metrics => ({ mlServer: metrics ? 'healthy' : 'unavailable' }))
            ]).then(([dbStatus, mlStatus]) => ({ ...dbStatus, ...mlStatus }))
        ]);

        res.json({
            success: true,
            data: {
                timestamp: now.toISOString(),
                metrics: {
                    liveBookings,
                    todayRevenue: parseFloat(todayRevenue._sum.finalPrice || 0),
                    activeCustomers
                },
                systemStatus,
                refreshRate: '30s'
            }
        });

    } catch (error) {
        req.logger?.error('Real-time analytics error:', error);
        res.status(500).json({
            error: 'Failed to fetch real-time analytics',
            code: 'REALTIME_ANALYTICS_ERROR'
        });
    }
});

module.exports = router;