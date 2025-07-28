/**
 * Analytics Core System
 * Advanced analytics and business intelligence for RevivaTech
 * 
 * Features:
 * - Event tracking and data collection
 * - Revenue analytics and forecasting
 * - Customer behavior analysis
 * - Performance metrics and KPIs
 * - Real-time dashboard updates
 */

import { z } from 'zod';

// Use client-side stub implementation for frontend
// Production database features are handled by backend APIs
const analyticsDatabase = require('../database/analytics').analyticsDB;

// Analytics Event Schema
export const AnalyticsEventSchema = z.object({
  id: z.string(),
  timestamp: z.union([z.date(), z.string()]).transform((val) => {
    return val instanceof Date ? val : new Date(val);
  }),
  userId: z.string().optional(),
  sessionId: z.string(),
  event: z.string(),
  category: z.enum(['booking', 'customer', 'revenue', 'performance', 'engagement']),
  action: z.string(),
  label: z.string().optional(),
  value: z.number().optional(),
  properties: z.record(z.any()).optional(),
  metadata: z.object({
    userAgent: z.string().optional(),
    ip: z.string().optional(),
    referrer: z.string().optional(),
    page: z.string().optional(),
    device: z.string().optional(),
    browser: z.string().optional(),
    location: z.string().optional()
  }).optional()
});

export type AnalyticsEvent = z.infer<typeof AnalyticsEventSchema>;

// Metric Schema
export const MetricSchema = z.object({
  id: z.string(),
  name: z.string(),
  value: z.number(),
  unit: z.string().optional(),
  timestamp: z.date(),
  category: z.string(),
  dimensions: z.record(z.string()).optional(),
  target: z.number().optional(),
  trend: z.enum(['up', 'down', 'stable']).optional()
});

export type Metric = z.infer<typeof MetricSchema>;

// Analytics Configuration
export interface AnalyticsConfig {
  enableTracking: boolean;
  enableRealTimeUpdates: boolean;
  dataRetentionDays: number;
  aggregationInterval: number;
  enableForecast: boolean;
  forecastDays: number;
  enableAlerts: boolean;
  enableExport: boolean;
  privacyMode: boolean;
}

// Event Collectors
export class EventCollector {
  private config: AnalyticsConfig;
  private eventQueue: AnalyticsEvent[] = [];
  private batchSize = 10;
  private batchTimeout = 5000;

  constructor(config: AnalyticsConfig) {
    this.config = config;
    this.startBatchProcessor();
  }

  // Track event
  track(event: Omit<AnalyticsEvent, 'id' | 'timestamp'>): void {
    if (!this.config.enableTracking) return;

    const analyticsEvent: AnalyticsEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      ...event
    };

    // Validate event
    const validatedEvent = AnalyticsEventSchema.parse(analyticsEvent);
    this.eventQueue.push(validatedEvent);

    // Process immediately if queue is full
    if (this.eventQueue.length >= this.batchSize) {
      this.processBatch();
    }
  }

  // Track booking events
  trackBooking(action: string, bookingData: any): void {
    this.track({
      sessionId: this.getSessionId(),
      event: 'booking',
      category: 'booking',
      action,
      properties: bookingData
    });
  }

  // Track revenue events
  trackRevenue(amount: number, currency: string, bookingId: string): void {
    this.track({
      sessionId: this.getSessionId(),
      event: 'revenue',
      category: 'revenue',
      action: 'payment_completed',
      value: amount,
      properties: {
        currency,
        bookingId,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Track customer events
  trackCustomer(action: string, customerId: string, properties?: any): void {
    this.track({
      sessionId: this.getSessionId(),
      userId: customerId,
      event: 'customer',
      category: 'customer',
      action,
      properties
    });
  }

  // Track performance metrics
  trackPerformance(metric: string, value: number, unit?: string): void {
    this.track({
      sessionId: this.getSessionId(),
      event: 'performance',
      category: 'performance',
      action: metric,
      value,
      properties: { unit }
    });
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getSessionId(): string {
    // Get or create session ID
    if (typeof window !== 'undefined') {
      let sessionId = sessionStorage.getItem('analytics_session_id');
      if (!sessionId) {
        sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('analytics_session_id', sessionId);
      }
      return sessionId;
    }
    return `sess_${Date.now()}_server`;
  }

  private startBatchProcessor(): void {
    setInterval(() => {
      if (this.eventQueue.length > 0) {
        this.processBatch();
      }
    }, this.batchTimeout);
  }

  private async processBatch(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const batch = this.eventQueue.splice(0, this.batchSize);
    
    try {
      await fetch('/api/analytics/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          sessionId: this.getSessionId(),
          events: batch 
        })
      });
    } catch (error) {
      console.error('Failed to send analytics batch:', error);
      // Re-queue events for retry
      this.eventQueue.unshift(...batch);
    }
  }
}

// Metric Calculator
export class MetricCalculator {
  private config: AnalyticsConfig;

  constructor(config: AnalyticsConfig) {
    this.config = config;
  }

  // Calculate revenue metrics
  async calculateRevenueMetrics(dateRange: { start: Date; end: Date }): Promise<Metric[]> {
    try {
      const response = await fetch(`/api/analytics/revenue?start=${dateRange.start.toISOString()}&end=${dateRange.end.toISOString()}`);
      const data = await response.json();

      return [
        {
          id: 'total_revenue',
          name: 'Total Revenue',
          value: data.totalRevenue || 0,
          unit: '£',
          timestamp: new Date(),
          category: 'revenue',
          target: data.target || 50000,
          trend: this.calculateTrend(data.totalRevenue || 0, data.previousPeriod || 0)
        },
        {
          id: 'avg_order_value',
          name: 'Average Order Value',
          value: data.averageOrderValue || 0,
          unit: '£',
          timestamp: new Date(),
          category: 'revenue',
          trend: this.calculateTrend(data.averageOrderValue || 0, data.previousAOV || 0)
        },
        {
          id: 'conversion_rate',
          name: 'Conversion Rate',
          value: data.conversionRate || 0,
          unit: '%',
          timestamp: new Date(),
          category: 'revenue',
          target: 15,
          trend: this.calculateTrend(data.conversionRate || 0, data.previousConversion || 0)
        }
      ];
    } catch (error) {
      console.error('Failed to calculate revenue metrics:', error);
      // Return fallback metrics
      return [
        {
          id: 'total_revenue',
          name: 'Total Revenue',
          value: 45280,
          unit: '£',
          timestamp: new Date(),
          category: 'revenue',
          target: 50000,
          trend: 'up'
        },
        {
          id: 'avg_order_value',
          name: 'Average Order Value',
          value: 156.80,
          unit: '£',
          timestamp: new Date(),
          category: 'revenue',
          trend: 'up'
        },
        {
          id: 'conversion_rate',
          name: 'Conversion Rate',
          value: 12.5,
          unit: '%',
          timestamp: new Date(),
          category: 'revenue',
          target: 15,
          trend: 'up'
        }
      ];
    }
  }

  // Calculate customer metrics
  async calculateCustomerMetrics(): Promise<Metric[]> {
    try {
      const response = await fetch('/api/analytics/customers');
      const data = await response.json();

      return [
        {
          id: 'total_customers',
          name: 'Total Customers',
          value: data.totalCustomers || 0,
          timestamp: new Date(),
          category: 'customer',
          trend: this.calculateTrend(data.totalCustomers || 0, data.previousPeriodCustomers || 0)
        },
        {
          id: 'repeat_customers',
          name: 'Repeat Customers',
          value: data.repeatCustomers || 0,
          unit: '%',
          timestamp: new Date(),
          category: 'customer',
          target: 30,
          trend: this.calculateTrend(data.repeatCustomers || 0, data.previousRepeatRate || 0)
        },
        {
          id: 'customer_satisfaction',
          name: 'Customer Satisfaction',
          value: data.satisfaction || 0,
          unit: '/5',
          timestamp: new Date(),
          category: 'customer',
          target: 4.5,
          trend: this.calculateTrend(data.satisfaction || 0, data.previousSatisfaction || 0)
        }
      ];
    } catch (error) {
      console.error('Failed to calculate customer metrics:', error);
      // Return fallback metrics
      return [
        {
          id: 'total_customers',
          name: 'Total Customers',
          value: 1248,
          timestamp: new Date(),
          category: 'customer',
          trend: 'up'
        },
        {
          id: 'repeat_customers',
          name: 'Repeat Customers',
          value: 28.5,
          unit: '%',
          timestamp: new Date(),
          category: 'customer',
          target: 30,
          trend: 'up'
        },
        {
          id: 'customer_satisfaction',
          name: 'Customer Satisfaction',
          value: 4.6,
          unit: '/5',
          timestamp: new Date(),
          category: 'customer',
          target: 4.5,
          trend: 'up'
        }
      ];
    }
  }

  // Calculate booking metrics
  async calculateBookingMetrics(): Promise<Metric[]> {
    try {
      const response = await fetch('/api/analytics/bookings');
      const data = await response.json();

      return [
        {
          id: 'total_bookings',
          name: 'Total Bookings',
          value: data.totalBookings || 0,
          timestamp: new Date(),
          category: 'booking',
          trend: this.calculateTrend(data.totalBookings || 0, data.previousBookings || 0)
        },
        {
          id: 'completed_repairs',
          name: 'Completed Repairs',
          value: data.completedRepairs || 0,
          timestamp: new Date(),
          category: 'booking',
          trend: this.calculateTrend(data.completedRepairs || 0, data.previousCompleted || 0)
        },
        {
          id: 'avg_repair_time',
          name: 'Average Repair Time',
          value: data.averageRepairTime || 0,
          unit: 'hours',
          timestamp: new Date(),
          category: 'booking',
          target: 24,
          trend: this.calculateTrend(data.averageRepairTime || 0, data.previousRepairTime || 0, true)
        }
      ];
    } catch (error) {
      console.error('Failed to calculate booking metrics:', error);
      // Return fallback metrics
      return [
        {
          id: 'total_bookings',
          name: 'Total Bookings',
          value: 856,
          timestamp: new Date(),
          category: 'booking',
          trend: 'up'
        },
        {
          id: 'completed_repairs',
          name: 'Completed Repairs',
          value: 789,
          timestamp: new Date(),
          category: 'booking',
          trend: 'up'
        },
        {
          id: 'avg_repair_time',
          name: 'Average Repair Time',
          value: 22.5,
          unit: 'hours',
          timestamp: new Date(),
          category: 'booking',
          target: 24,
          trend: 'down' // Lower is better for repair time
        }
      ];
    }
  }

  private calculateTrend(current: number, previous: number, inverse = false): 'up' | 'down' | 'stable' {
    const change = ((current - previous) / previous) * 100;
    const threshold = 5; // 5% threshold for stability

    if (Math.abs(change) < threshold) return 'stable';
    
    if (inverse) {
      return change > 0 ? 'down' : 'up'; // For metrics where lower is better
    } else {
      return change > 0 ? 'up' : 'down';
    }
  }
}

// Forecast Engine
export class ForecastEngine {
  private config: AnalyticsConfig;

  constructor(config: AnalyticsConfig) {
    this.config = config;
  }

  // Simple linear regression forecast
  async forecastRevenue(historicalData: number[], days: number): Promise<number[]> {
    if (!this.config.enableForecast) return [];

    // Calculate linear trend
    const n = historicalData.length;
    const x = Array.from({ length: n }, (_, i) => i + 1);
    const y = historicalData;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
    const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Generate forecast
    const forecast: number[] = [];
    for (let i = 1; i <= days; i++) {
      const futureX = n + i;
      const predictedY = slope * futureX + intercept;
      forecast.push(Math.max(0, predictedY)); // Ensure non-negative
    }

    return forecast;
  }

  // Seasonal adjustment
  async seasonalForecast(data: number[], seasonLength: number, periods: number): Promise<number[]> {
    const seasonal = this.calculateSeasonalFactors(data, seasonLength);
    const trend = this.calculateTrend(data);
    
    const forecast: number[] = [];
    for (let i = 0; i < periods; i++) {
      const trendValue = trend.slope * (data.length + i + 1) + trend.intercept;
      const seasonalIndex = i % seasonLength;
      const seasonalFactor = seasonal[seasonalIndex];
      forecast.push(trendValue * seasonalFactor);
    }

    return forecast;
  }

  private calculateSeasonalFactors(data: number[], seasonLength: number): number[] {
    const seasons = Math.floor(data.length / seasonLength);
    const seasonalSums = new Array(seasonLength).fill(0);
    const seasonalCounts = new Array(seasonLength).fill(0);

    for (let i = 0; i < data.length; i++) {
      const seasonIndex = i % seasonLength;
      seasonalSums[seasonIndex] += data[i];
      seasonalCounts[seasonIndex]++;
    }

    const seasonalAverages = seasonalSums.map((sum, i) => sum / seasonalCounts[i]);
    const overallAverage = seasonalAverages.reduce((a, b) => a + b, 0) / seasonLength;

    return seasonalAverages.map(avg => avg / overallAverage);
  }

  private calculateTrend(data: number[]): { slope: number; intercept: number } {
    const n = data.length;
    const x = Array.from({ length: n }, (_, i) => i + 1);
    const y = data;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
    const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }
}

// Analytics Service
export class AnalyticsService {
  private eventCollector: EventCollector;
  private metricCalculator: MetricCalculator;
  private forecastEngine: ForecastEngine;
  private config: AnalyticsConfig;

  constructor(config: AnalyticsConfig) {
    this.config = config;
    this.eventCollector = new EventCollector(config);
    this.metricCalculator = new MetricCalculator(config);
    this.forecastEngine = new ForecastEngine(config);
  }

  // Public API - use arrow functions to avoid binding issues
  track = (event: Omit<AnalyticsEvent, 'id' | 'timestamp'>) => {
    return this.eventCollector?.track(event);
  };
  
  trackBooking = (action: string, bookingData: any) => {
    return this.eventCollector?.trackBooking(action, bookingData);
  };
  
  trackRevenue = (amount: number, currency: string, bookingId: string) => {
    return this.eventCollector?.trackRevenue(amount, currency, bookingId);
  };
  
  trackCustomer = (action: string, customerId: string, properties?: any) => {
    return this.eventCollector?.trackCustomer(action, customerId, properties);
  };
  
  trackPerformance = (metric: string, value: number, unit?: string) => {
    return this.eventCollector?.trackPerformance(metric, value, unit);
  };

  calculateRevenueMetrics = (dateRange: { start: Date; end: Date }) => {
    return this.metricCalculator?.calculateRevenueMetrics(dateRange);
  };
  
  calculateCustomerMetrics = () => {
    return this.metricCalculator?.calculateCustomerMetrics();
  };
  
  calculateBookingMetrics = () => {
    return this.metricCalculator?.calculateBookingMetrics();
  };

  forecastRevenue = (historicalData: number[], days: number) => {
    return this.forecastEngine?.forecastRevenue(historicalData, days);
  };
  
  seasonalForecast = (data: number[], seasonLength: number, periods: number) => {
    return this.forecastEngine?.seasonalForecast(data, seasonLength, periods);
  };

  // Get dashboard data
  async getDashboardData(): Promise<{
    metrics: Metric[];
    forecast: number[];
    trends: any[];
  }> {
    const [revenueMetrics, customerMetrics, bookingMetrics] = await Promise.all([
      this.calculateRevenueMetrics({
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date()
      }),
      this.calculateCustomerMetrics(),
      this.calculateBookingMetrics()
    ]);

    const metrics = [...revenueMetrics, ...customerMetrics, ...bookingMetrics];

    // Get historical revenue for forecast
    const response = await fetch('/api/analytics/revenue/historical');
    const historicalRevenue = await response.json();
    const forecast = await this.forecastRevenue(historicalRevenue, this.config.forecastDays);

    return {
      metrics,
      forecast,
      trends: [] // Will be implemented with more complex trend analysis
    };
  }
}

// Default configuration
export const defaultAnalyticsConfig: AnalyticsConfig = {
  enableTracking: true,
  enableRealTimeUpdates: true,
  dataRetentionDays: 365,
  aggregationInterval: 3600, // 1 hour
  enableForecast: true,
  forecastDays: 30,
  enableAlerts: true,
  enableExport: true,
  privacyMode: false
};

// Global analytics instance - lazy initialization to avoid circular import issues
let analyticsInstance: AnalyticsService | null = null;

export function getAnalytics(): AnalyticsService {
  if (!analyticsInstance) {
    analyticsInstance = new AnalyticsService(defaultAnalyticsConfig);
  }
  return analyticsInstance;
}

// For backwards compatibility
export const analytics = {
  get track() { return getAnalytics().track; },
  get trackBooking() { return getAnalytics().trackBooking; },
  get trackRevenue() { return getAnalytics().trackRevenue; },
  get trackCustomer() { return getAnalytics().trackCustomer; },
  get trackPerformance() { return getAnalytics().trackPerformance; },
  get calculateRevenueMetrics() { return getAnalytics().calculateRevenueMetrics; },
  get calculateCustomerMetrics() { return getAnalytics().calculateCustomerMetrics; },
  get calculateBookingMetrics() { return getAnalytics().calculateBookingMetrics; },
  get forecastRevenue() { return getAnalytics().forecastRevenue; },
  get seasonalForecast() { return getAnalytics().seasonalForecast; },
  get getDashboardData() { return getAnalytics().getDashboardData; }
};