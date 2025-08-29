/**
 * PRISMA MIGRATION: Revenue Intelligence Service
 * Converted from raw SQL to Prisma ORM operations
 * Advanced financial analytics and revenue forecasting
 * Part of Phase 8 R2.2 implementation
 */

const { prisma } = require('../lib/prisma');
const Redis = require('redis');

/**
 * Revenue Intelligence Service
 * Financial analytics, forecasting, and business metrics using Prisma
 */
class RevenueIntelligenceService {
  constructor() {
    // Initialize Redis connection for caching
    const redisConfig = {
      url: process.env.REDIS_URL || process.env.REDIS_INTERNAL_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`
    };
    this.redis = Redis.createClient(redisConfig);

    this.redis.on('error', (err) => console.error('Redis Client Error', err));
    this.redis.connect();
  }

  /**
   * Get comprehensive revenue analytics using Prisma
   */
  async getRevenueAnalytics(timeframe = '30d') {
    try {
      const { startDate, endDate } = this.getDateRange(timeframe);
      
      const [
        overview,
        trends,
        breakdown,
        profitability,
        customerMetrics,
        serviceTypeAnalysis,
        forecasting
      ] = await Promise.all([
        this.getRevenueOverview(startDate, endDate),
        this.getRevenueTrends(startDate, endDate),
        this.getRevenueBreakdown(startDate, endDate),
        this.getProfitabilityAnalysis(startDate, endDate),
        this.getCustomerRevenueMetrics(startDate, endDate),
        this.getServiceTypeAnalysis(startDate, endDate),
        this.generateRevenueForecasting(timeframe)
      ]);

      return {
        timeframe,
        period: {
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString()
        },
        overview,
        trends,
        breakdown,
        profitability,
        customer_metrics: customerMetrics,
        service_analysis: serviceTypeAnalysis,
        forecasting,
        generated_at: new Date().toISOString()
      };

    } catch (error) {
      console.error('Revenue analytics error:', error);
      throw error;
    }
  }

  /**
   * Get revenue overview using Prisma aggregations
   */
  async getRevenueOverview(startDate, endDate) {
    const [current, previous] = await Promise.all([
      // Current period revenue
      prisma.booking.aggregate({
        where: {
          status: 'COMPLETED',
          completedAt: {
            gte: startDate,
            lte: endDate
          }
        },
        _sum: { finalPrice: true },
        _avg: { finalPrice: true },
        _count: { id: true }
      }),

      // Previous period revenue (for comparison)
      prisma.booking.aggregate({
        where: {
          status: 'COMPLETED',
          completedAt: {
            gte: new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime())),
            lt: startDate
          }
        },
        _sum: { finalPrice: true },
        _avg: { finalPrice: true },
        _count: { id: true }
      })
    ]);

    const currentRevenue = parseFloat(current._sum.finalPrice || 0);
    const previousRevenue = parseFloat(previous._sum.finalPrice || 0);
    const growthRate = previousRevenue > 0 
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
      : 0;

    return {
      total_revenue: currentRevenue,
      completed_bookings: current._count.id,
      average_order_value: parseFloat(current._avg.finalPrice || 0),
      growth_rate: parseFloat(growthRate.toFixed(2)),
      previous_period_revenue: previousRevenue,
      revenue_per_booking: current._count.id > 0 
        ? currentRevenue / current._count.id 
        : 0
    };
  }

  /**
   * Get revenue trends using Prisma with date grouping
   */
  async getRevenueTrends(startDate, endDate) {
    // Get daily revenue data
    const dailyRevenue = await prisma.booking.findMany({
      where: {
        status: 'COMPLETED',
        completedAt: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        finalPrice: true,
        completedAt: true,
        repairType: true
      },
      orderBy: { completedAt: 'asc' }
    });

    // Group by date
    const dailyTrends = {};
    dailyRevenue.forEach(booking => {
      const date = booking.completedAt.toISOString().split('T')[0];
      if (!dailyTrends[date]) {
        dailyTrends[date] = {
          date,
          revenue: 0,
          bookings: 0,
          repair_types: {}
        };
      }
      
      dailyTrends[date].revenue += parseFloat(booking.finalPrice || 0);
      dailyTrends[date].bookings += 1;
      
      const repairType = booking.repairType || 'Other';
      dailyTrends[date].repair_types[repairType] = 
        (dailyTrends[date].repair_types[repairType] || 0) + 1;
    });

    // Convert to array and calculate moving averages
    const trendsArray = Object.values(dailyTrends);
    const movingAverageRevenue = this.calculateMovingAverage(
      trendsArray.map(t => t.revenue), 7
    );

    return {
      daily_trends: trendsArray,
      moving_average_revenue: movingAverageRevenue,
      peak_revenue_day: trendsArray.reduce((max, day) => 
        day.revenue > max.revenue ? day : max, trendsArray[0] || { revenue: 0 }),
      trend_direction: this.calculateTrendDirection(trendsArray)
    };
  }

  /**
   * Get revenue breakdown by various dimensions
   */
  async getRevenueBreakdown(startDate, endDate) {
    const [
      byRepairType,
      byDeviceCategory,
      byCustomerType,
      byUrgencyLevel
    ] = await Promise.all([
      // By repair type
      prisma.booking.groupBy({
        by: ['repairType'],
        where: {
          status: 'COMPLETED',
          completedAt: { gte: startDate, lte: endDate }
        },
        _sum: { finalPrice: true },
        _count: { id: true },
        _avg: { finalPrice: true }
      }),

      // By device category (through device model relations)
      prisma.booking.findMany({
        where: {
          status: 'COMPLETED',
          completedAt: { gte: startDate, lte: endDate }
        },
        include: {
          deviceModel: {
            include: {
              brand: {
                include: { category: true }
              }
            }
          }
        },
        select: {
          finalPrice: true,
          deviceModel: {
            select: {
              brand: {
                select: {
                  category: {
                    select: { name: true }
                  }
                }
              }
            }
          }
        }
      }).then(bookings => {
        const categoryRevenue = {};
        bookings.forEach(booking => {
          const category = booking.deviceModel?.brand?.category?.name || 'Unknown';
          categoryRevenue[category] = (categoryRevenue[category] || 0) + 
            parseFloat(booking.finalPrice || 0);
        });
        return Object.entries(categoryRevenue).map(([category, revenue]) => ({
          category,
          revenue: parseFloat(revenue.toFixed(2))
        }));
      }),

      // By customer type (new vs returning)
      prisma.booking.findMany({
        where: {
          status: 'COMPLETED',
          completedAt: { gte: startDate, lte: endDate }
        },
        include: {
          customer: {
            select: {
              id: true,
              createdAt: true
            }
          }
        },
        select: {
          finalPrice: true,
          customer: {
            select: {
              id: true,
              createdAt: true
            }
          }
        }
      }).then(async bookings => {
        const customerTypes = { new: 0, returning: 0 };
        
        for (const booking of bookings) {
          const isNewCustomer = await this.isNewCustomer(
            booking.customer.id, booking.customer.createdAt, startDate
          );
          
          customerTypes[isNewCustomer ? 'new' : 'returning'] += 
            parseFloat(booking.finalPrice || 0);
        }
        
        return customerTypes;
      }),

      // By urgency level
      prisma.booking.groupBy({
        by: ['urgencyLevel'],
        where: {
          status: 'COMPLETED',
          completedAt: { gte: startDate, lte: endDate }
        },
        _sum: { finalPrice: true },
        _count: { id: true },
        _avg: { finalPrice: true }
      })
    ]);

    return {
      by_repair_type: byRepairType.map(item => ({
        repair_type: item.repairType || 'Unknown',
        revenue: parseFloat(item._sum.finalPrice || 0),
        bookings: item._count.id,
        avg_price: parseFloat(item._avg.finalPrice || 0)
      })),
      by_device_category: byDeviceCategory,
      by_customer_type: byCustomerType,
      by_urgency_level: byUrgencyLevel.map(item => ({
        urgency_level: item.urgencyLevel || 'STANDARD',
        revenue: parseFloat(item._sum.finalPrice || 0),
        bookings: item._count.id,
        avg_price: parseFloat(item._avg.finalPrice || 0)
      }))
    };
  }

  /**
   * Get profitability analysis
   */
  async getProfitabilityAnalysis(startDate, endDate) {
    // Get completed bookings with pricing details
    const bookings = await prisma.booking.findMany({
      where: {
        status: 'COMPLETED',
        completedAt: { gte: startDate, lte: endDate }
      },
      select: {
        basePrice: true,
        finalPrice: true,
        repairType: true,
        urgencyLevel: true,
        estimatedCompletion: true,
        completedAt: true,
        createdAt: true
      }
    });

    // Calculate profitability metrics
    let totalRevenue = 0;
    let totalCost = 0;
    let totalBookings = bookings.length;
    
    const profitabilityByType = {};
    
    bookings.forEach(booking => {
      const revenue = parseFloat(booking.finalPrice || 0);
      const cost = parseFloat(booking.basePrice || 0);
      const profit = revenue - cost;
      
      totalRevenue += revenue;
      totalCost += cost;
      
      const type = booking.repairType || 'Unknown';
      if (!profitabilityByType[type]) {
        profitabilityByType[type] = {
          revenue: 0,
          cost: 0,
          profit: 0,
          bookings: 0,
          margin: 0
        };
      }
      
      profitabilityByType[type].revenue += revenue;
      profitabilityByType[type].cost += cost;
      profitabilityByType[type].profit += profit;
      profitabilityByType[type].bookings += 1;
      profitabilityByType[type].margin = 
        (profitabilityByType[type].profit / profitabilityByType[type].revenue) * 100;
    });

    const totalProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return {
      overview: {
        total_revenue: parseFloat(totalRevenue.toFixed(2)),
        total_cost: parseFloat(totalCost.toFixed(2)),
        total_profit: parseFloat(totalProfit.toFixed(2)),
        profit_margin: parseFloat(profitMargin.toFixed(2)),
        profit_per_booking: totalBookings > 0 ? totalProfit / totalBookings : 0
      },
      by_repair_type: Object.entries(profitabilityByType).map(([type, data]) => ({
        repair_type: type,
        ...data,
        margin: parseFloat(data.margin.toFixed(2))
      })),
      high_margin_services: Object.entries(profitabilityByType)
        .filter(([, data]) => data.margin > 20)
        .map(([type, data]) => ({ repair_type: type, margin: data.margin })),
      cost_efficiency: {
        cost_to_revenue_ratio: totalRevenue > 0 ? (totalCost / totalRevenue) * 100 : 0,
        break_even_point: totalCost > 0 ? totalCost / (totalRevenue / totalBookings) : 0
      }
    };
  }

  /**
   * Get customer revenue metrics using Prisma
   */
  async getCustomerRevenueMetrics(startDate, endDate) {
    // Top revenue customers
    const topCustomers = await prisma.booking.groupBy({
      by: ['customerId'],
      where: {
        status: 'COMPLETED',
        completedAt: { gte: startDate, lte: endDate }
      },
      _sum: { finalPrice: true },
      _count: { id: true },
      orderBy: { _sum: { finalPrice: 'desc' } },
      take: 10
    });

    // Get customer details for top customers
    const customerDetails = await Promise.all(
      topCustomers.map(async customer => {
        const user = await prisma.user.findUnique({
          where: { id: customer.customerId },
          select: {
            firstName: true,
            lastName: true,
            email: true,
            createdAt: true
          }
        });
        
        return {
          customer_id: customer.customerId,
          customer_name: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
          customer_email: user?.email,
          total_revenue: parseFloat(customer._sum.finalPrice || 0),
          total_bookings: customer._count.id,
          avg_order_value: parseFloat((customer._sum.finalPrice || 0) / customer._count.id),
          customer_since: user?.createdAt
        };
      })
    );

    // Customer lifetime value analysis
    const customerLifetimeMetrics = await prisma.user.findMany({
      where: {
        role: 'CUSTOMER',
        bookings: {
          some: {
            status: 'COMPLETED'
          }
        }
      },
      include: {
        bookings: {
          where: { status: 'COMPLETED' },
          select: {
            finalPrice: true,
            completedAt: true
          }
        }
      }
    });

    const lifetimeAnalysis = customerLifetimeMetrics.map(customer => {
      const totalSpent = customer.bookings.reduce((sum, booking) => 
        sum + parseFloat(booking.finalPrice || 0), 0);
      const bookingCount = customer.bookings.length;
      const avgOrderValue = bookingCount > 0 ? totalSpent / bookingCount : 0;
      
      return {
        customer_id: customer.id,
        lifetime_value: totalSpent,
        booking_count: bookingCount,
        avg_order_value: avgOrderValue,
        first_booking: customer.bookings.sort((a, b) => 
          new Date(a.completedAt) - new Date(b.completedAt))[0]?.completedAt,
        last_booking: customer.bookings.sort((a, b) => 
          new Date(b.completedAt) - new Date(a.completedAt))[0]?.completedAt
      };
    });

    // Calculate averages
    const avgLifetimeValue = lifetimeAnalysis.reduce((sum, customer) => 
      sum + customer.lifetime_value, 0) / lifetimeAnalysis.length || 0;
    
    const avgBookingsPerCustomer = lifetimeAnalysis.reduce((sum, customer) => 
      sum + customer.booking_count, 0) / lifetimeAnalysis.length || 0;

    return {
      top_customers: customerDetails,
      lifetime_value: {
        avg_lifetime_value: parseFloat(avgLifetimeValue.toFixed(2)),
        avg_bookings_per_customer: parseFloat(avgBookingsPerCustomer.toFixed(2)),
        high_value_customers: lifetimeAnalysis.filter(c => c.lifetime_value > avgLifetimeValue * 2).length,
        total_customers_analyzed: lifetimeAnalysis.length
      },
      customer_segments: this.analyzeCustomerSegments(lifetimeAnalysis)
    };
  }

  /**
   * Get service type analysis
   */
  async getServiceTypeAnalysis(startDate, endDate) {
    const serviceMetrics = await prisma.booking.groupBy({
      by: ['repairType'],
      where: {
        status: 'COMPLETED',
        completedAt: { gte: startDate, lte: endDate }
      },
      _sum: { finalPrice: true },
      _count: { id: true },
      _avg: { finalPrice: true }
    });

    const totalRevenue = serviceMetrics.reduce((sum, service) => 
      sum + parseFloat(service._sum.finalPrice || 0), 0);

    return serviceMetrics
      .map(service => ({
        service_type: service.repairType || 'Unknown',
        revenue: parseFloat(service._sum.finalPrice || 0),
        bookings: service._count.id,
        avg_price: parseFloat(service._avg.finalPrice || 0),
        market_share: totalRevenue > 0 
          ? ((parseFloat(service._sum.finalPrice || 0) / totalRevenue) * 100).toFixed(2)
          : 0
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }

  /**
   * Generate revenue forecasting
   */
  async generateRevenueForecasting(timeframe) {
    // Get historical data for the same period
    const { startDate, endDate } = this.getDateRange(timeframe);
    const periodLength = endDate.getTime() - startDate.getTime();
    
    const historicalPeriods = [];
    for (let i = 1; i <= 6; i++) {
      const periodStart = new Date(startDate.getTime() - (periodLength * i));
      const periodEnd = new Date(endDate.getTime() - (periodLength * i));
      
      const periodRevenue = await prisma.booking.aggregate({
        where: {
          status: 'COMPLETED',
          completedAt: { gte: periodStart, lte: periodEnd }
        },
        _sum: { finalPrice: true }
      });
      
      historicalPeriods.push(parseFloat(periodRevenue._sum.finalPrice || 0));
    }

    // Calculate trend and forecast
    const avgGrowthRate = this.calculateGrowthRate(historicalPeriods.reverse());
    const currentRevenue = historicalPeriods[historicalPeriods.length - 1];
    
    const forecast = {
      next_period: currentRevenue * (1 + avgGrowthRate),
      confidence_interval: {
        lower: currentRevenue * (1 + avgGrowthRate - 0.1),
        upper: currentRevenue * (1 + avgGrowthRate + 0.1)
      },
      trend: avgGrowthRate > 0 ? 'growing' : avgGrowthRate < 0 ? 'declining' : 'stable',
      growth_rate: avgGrowthRate * 100
    };

    return {
      historical_data: historicalPeriods,
      forecast,
      assumptions: [
        'Based on historical trend analysis',
        'Assumes consistent market conditions',
        'Seasonal variations not accounted for'
      ]
    };
  }

  // Helper methods

  getDateRange(timeframe) {
    const endDate = new Date();
    const startDate = new Date();
    
    const days = parseInt(timeframe.replace('d', ''));
    startDate.setDate(startDate.getDate() - days);
    
    return { startDate, endDate };
  }

  async isNewCustomer(customerId, customerCreatedAt, periodStartDate) {
    const createdDate = new Date(customerCreatedAt);
    return createdDate >= periodStartDate;
  }

  calculateMovingAverage(data, windowSize) {
    const result = [];
    for (let i = windowSize - 1; i < data.length; i++) {
      const sum = data.slice(i - windowSize + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / windowSize);
    }
    return result;
  }

  calculateTrendDirection(trendsArray) {
    if (trendsArray.length < 2) return 'insufficient_data';
    
    const firstHalf = trendsArray.slice(0, Math.floor(trendsArray.length / 2));
    const secondHalf = trendsArray.slice(Math.floor(trendsArray.length / 2));
    
    const firstHalfAvg = firstHalf.reduce((sum, t) => sum + t.revenue, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, t) => sum + t.revenue, 0) / secondHalf.length;
    
    if (secondHalfAvg > firstHalfAvg * 1.05) return 'upward';
    if (secondHalfAvg < firstHalfAvg * 0.95) return 'downward';
    return 'stable';
  }

  calculateGrowthRate(periods) {
    if (periods.length < 2) return 0;
    
    let totalGrowthRate = 0;
    let validPeriods = 0;
    
    for (let i = 1; i < periods.length; i++) {
      if (periods[i - 1] > 0) {
        totalGrowthRate += (periods[i] - periods[i - 1]) / periods[i - 1];
        validPeriods++;
      }
    }
    
    return validPeriods > 0 ? totalGrowthRate / validPeriods : 0;
  }

  analyzeCustomerSegments(customers) {
    const segments = {
      high_value: customers.filter(c => c.lifetime_value > 1000).length,
      medium_value: customers.filter(c => c.lifetime_value >= 300 && c.lifetime_value <= 1000).length,
      low_value: customers.filter(c => c.lifetime_value < 300).length,
      frequent_customers: customers.filter(c => c.booking_count >= 3).length,
      one_time_customers: customers.filter(c => c.booking_count === 1).length
    };
    
    return segments;
  }

  /**
   * Close connections gracefully
   */
  async close() {
    try {
      await this.redis.quit();
    } catch (error) {
      console.error('Service cleanup error:', error);
    }
  }
}

module.exports = new RevenueIntelligenceService();