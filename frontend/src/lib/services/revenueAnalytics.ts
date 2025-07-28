/**
 * Revenue Analytics and Forecasting Service
 * Provides comprehensive revenue tracking, analysis, and predictive forecasting
 */

export interface RevenueDataPoint {
  date: string;
  revenue: number;
  transactions: number;
  averageOrderValue: number;
  newCustomers: number;
  returningCustomers: number;
  refunds: number;
  netRevenue: number;
}

export interface RevenueSegment {
  name: string;
  revenue: number;
  percentage: number;
  growth: number;
  transactions: number;
  averageValue: number;
}

export interface RevenueForecast {
  period: string;
  predicted: number;
  confidence: number;
  lowerBound: number;
  upperBound: number;
  factors: string[];
}

export interface RevenueMetrics {
  totalRevenue: number;
  netRevenue: number;
  growth: {
    daily: number;
    weekly: number;
    monthly: number;
    quarterly: number;
    yearly: number;
  };
  segments: RevenueSegment[];
  trends: {
    direction: 'up' | 'down' | 'stable';
    strength: 'strong' | 'moderate' | 'weak';
    momentum: number;
  };
  kpis: {
    monthlyRecurringRevenue: number;
    annualRecurringRevenue: number;
    customerLifetimeValue: number;
    paybackPeriod: number;
    churnRate: number;
    expansionRate: number;
  };
}

export interface RevenueAnalysis {
  metrics: RevenueMetrics;
  forecast: RevenueForecast[];
  insights: string[];
  recommendations: string[];
  risks: string[];
  opportunities: string[];
}

class RevenueAnalyticsService {
  private historicalData: RevenueDataPoint[] = [];
  private segments: RevenueSegment[] = [];
  private forecastModel: any = null;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    // Generate mock historical data for demonstration
    this.generateMockData();
    
    // Initialize forecasting model
    this.initializeForecastModel();
  }

  private generateMockData(): void {
    const now = new Date();
    const data: RevenueDataPoint[] = [];

    // Generate 90 days of historical data
    for (let i = 90; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const baseRevenue = 1000 + Math.random() * 2000;
      const seasonalFactor = 1 + 0.3 * Math.sin((i / 30) * Math.PI);
      const trendFactor = 1 + (90 - i) * 0.002; // Slight upward trend
      const randomFactor = 0.8 + Math.random() * 0.4;
      
      const revenue = baseRevenue * seasonalFactor * trendFactor * randomFactor;
      const transactions = Math.floor(revenue / (50 + Math.random() * 100));
      const averageOrderValue = revenue / transactions;
      const newCustomers = Math.floor(transactions * (0.3 + Math.random() * 0.4));
      const returningCustomers = transactions - newCustomers;
      const refunds = revenue * (0.02 + Math.random() * 0.03);
      const netRevenue = revenue - refunds;

      data.push({
        date: date.toISOString().split('T')[0],
        revenue: Math.round(revenue),
        transactions,
        averageOrderValue: Math.round(averageOrderValue),
        newCustomers,
        returningCustomers,
        refunds: Math.round(refunds),
        netRevenue: Math.round(netRevenue)
      });
    }

    this.historicalData = data;
    this.generateSegments();
  }

  private generateSegments(): void {
    const totalRevenue = this.historicalData.reduce((sum, d) => sum + d.revenue, 0);
    
    this.segments = [
      {
        name: 'Screen Repairs',
        revenue: Math.round(totalRevenue * 0.45),
        percentage: 45,
        growth: 12.5,
        transactions: Math.floor(this.historicalData.reduce((sum, d) => sum + d.transactions, 0) * 0.45),
        averageValue: 85
      },
      {
        name: 'Battery Replacement',
        revenue: Math.round(totalRevenue * 0.25),
        percentage: 25,
        growth: 8.3,
        transactions: Math.floor(this.historicalData.reduce((sum, d) => sum + d.transactions, 0) * 0.25),
        averageValue: 65
      },
      {
        name: 'Data Recovery',
        revenue: Math.round(totalRevenue * 0.15),
        percentage: 15,
        growth: 15.7,
        transactions: Math.floor(this.historicalData.reduce((sum, d) => sum + d.transactions, 0) * 0.15),
        averageValue: 150
      },
      {
        name: 'Hardware Upgrades',
        revenue: Math.round(totalRevenue * 0.10),
        percentage: 10,
        growth: 22.1,
        transactions: Math.floor(this.historicalData.reduce((sum, d) => sum + d.transactions, 0) * 0.10),
        averageValue: 120
      },
      {
        name: 'Other Services',
        revenue: Math.round(totalRevenue * 0.05),
        percentage: 5,
        growth: 5.2,
        transactions: Math.floor(this.historicalData.reduce((sum, d) => sum + d.transactions, 0) * 0.05),
        averageValue: 75
      }
    ];
  }

  private initializeForecastModel(): void {
    // Simple linear regression model for forecasting
    this.forecastModel = {
      predict: (days: number) => {
        const recentData = this.historicalData.slice(-30);
        const trend = this.calculateTrend(recentData);
        const seasonal = this.calculateSeasonality(recentData);
        const baseValue = recentData[recentData.length - 1].revenue;
        
        return baseValue + (trend * days) + seasonal;
      },
      
      confidence: (days: number) => {
        // Confidence decreases with time
        return Math.max(0.5, 0.95 - (days * 0.01));
      }
    };
  }

  private calculateTrend(data: RevenueDataPoint[]): number {
    if (data.length < 2) return 0;
    
    const n = data.length;
    const sumX = n * (n - 1) / 2;
    const sumY = data.reduce((sum, d) => sum + d.revenue, 0);
    const sumXY = data.reduce((sum, d, i) => sum + (i * d.revenue), 0);
    const sumX2 = n * (n - 1) * (2 * n - 1) / 6;
    
    return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  }

  private calculateSeasonality(data: RevenueDataPoint[]): number {
    // Simple seasonal adjustment based on day of week
    const today = new Date();
    const dayOfWeek = today.getDay();
    
    // Weekend boost for repair services
    const weekendBoost = [1.2, 0.8, 0.9, 1.0, 1.1, 1.3, 1.4];
    return (weekendBoost[dayOfWeek] - 1) * 200;
  }

  /**
   * Get comprehensive revenue analytics
   */
  getRevenueAnalysis(timeRange: '7d' | '30d' | '90d' = '30d'): RevenueAnalysis {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const data = this.historicalData.slice(-days);
    
    const metrics = this.calculateMetrics(data);
    const forecast = this.generateForecast(30); // 30-day forecast
    const insights = this.generateInsights(metrics, data);
    const recommendations = this.generateRecommendations(metrics);
    const risks = this.identifyRisks(metrics, data);
    const opportunities = this.identifyOpportunities(metrics, data);

    return {
      metrics,
      forecast,
      insights,
      recommendations,
      risks,
      opportunities
    };
  }

  /**
   * Calculate revenue metrics
   */
  private calculateMetrics(data: RevenueDataPoint[]): RevenueMetrics {
    const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
    const netRevenue = data.reduce((sum, d) => sum + d.netRevenue, 0);
    const totalTransactions = data.reduce((sum, d) => sum + d.transactions, 0);
    
    // Calculate growth rates
    const growth = this.calculateGrowthRates(data);
    
    // Calculate trends
    const trends = this.analyzeTrends(data);
    
    // Calculate KPIs
    const kpis = this.calculateKPIs(data);

    return {
      totalRevenue,
      netRevenue,
      growth,
      segments: this.segments,
      trends,
      kpis
    };
  }

  private calculateGrowthRates(data: RevenueDataPoint[]): RevenueMetrics['growth'] {
    const daily = this.calculatePeriodGrowth(data, 1);
    const weekly = this.calculatePeriodGrowth(data, 7);
    const monthly = this.calculatePeriodGrowth(data, 30);
    const quarterly = this.calculatePeriodGrowth(data, 90);
    const yearly = this.calculatePeriodGrowth(data, 365);

    return { daily, weekly, monthly, quarterly, yearly };
  }

  private calculatePeriodGrowth(data: RevenueDataPoint[], period: number): number {
    if (data.length < period * 2) return 0;
    
    const currentPeriod = data.slice(-period);
    const previousPeriod = data.slice(-period * 2, -period);
    
    const currentRevenue = currentPeriod.reduce((sum, d) => sum + d.revenue, 0);
    const previousRevenue = previousPeriod.reduce((sum, d) => sum + d.revenue, 0);
    
    return previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;
  }

  private analyzeTrends(data: RevenueDataPoint[]): RevenueMetrics['trends'] {
    const trend = this.calculateTrend(data);
    const momentum = this.calculateMomentum(data);
    
    let direction: 'up' | 'down' | 'stable' = 'stable';
    let strength: 'strong' | 'moderate' | 'weak' = 'weak';
    
    if (Math.abs(trend) > 50) {
      direction = trend > 0 ? 'up' : 'down';
      strength = Math.abs(trend) > 100 ? 'strong' : 'moderate';
    }

    return { direction, strength, momentum };
  }

  private calculateMomentum(data: RevenueDataPoint[]): number {
    if (data.length < 7) return 0;
    
    const recent = data.slice(-7);
    const previous = data.slice(-14, -7);
    
    const recentAvg = recent.reduce((sum, d) => sum + d.revenue, 0) / recent.length;
    const previousAvg = previous.reduce((sum, d) => sum + d.revenue, 0) / previous.length;
    
    return previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg) * 100 : 0;
  }

  private calculateKPIs(data: RevenueDataPoint[]): RevenueMetrics['kpis'] {
    const avgDailyRevenue = data.reduce((sum, d) => sum + d.revenue, 0) / data.length;
    const monthlyRecurringRevenue = avgDailyRevenue * 30;
    const annualRecurringRevenue = monthlyRecurringRevenue * 12;
    
    // Mock values for other KPIs
    const customerLifetimeValue = 850;
    const paybackPeriod = 45; // days
    const churnRate = 5.2; // percentage
    const expansionRate = 12.5; // percentage

    return {
      monthlyRecurringRevenue,
      annualRecurringRevenue,
      customerLifetimeValue,
      paybackPeriod,
      churnRate,
      expansionRate
    };
  }

  /**
   * Generate revenue forecast
   */
  private generateForecast(days: number): RevenueForecast[] {
    const forecast: RevenueForecast[] = [];
    
    for (let i = 1; i <= days; i++) {
      const predicted = this.forecastModel.predict(i);
      const confidence = this.forecastModel.confidence(i);
      const margin = predicted * (1 - confidence);
      
      forecast.push({
        period: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        predicted: Math.round(predicted),
        confidence: Math.round(confidence * 100),
        lowerBound: Math.round(predicted - margin),
        upperBound: Math.round(predicted + margin),
        factors: this.getForecastFactors(i)
      });
    }
    
    return forecast;
  }

  private getForecastFactors(day: number): string[] {
    const factors = ['Historical trend', 'Seasonal patterns'];
    
    if (day <= 7) {
      factors.push('Recent performance');
    }
    
    if (day > 14) {
      factors.push('Market conditions', 'Competitive landscape');
    }
    
    return factors;
  }

  /**
   * Generate insights
   */
  private generateInsights(metrics: RevenueMetrics, data: RevenueDataPoint[]): string[] {
    const insights: string[] = [];
    
    // Revenue trend insights
    if (metrics.trends.direction === 'up') {
      insights.push(`Revenue is trending ${metrics.trends.strength === 'strong' ? 'strongly' : 'moderately'} upward with ${metrics.trends.momentum.toFixed(1)}% momentum`);
    } else if (metrics.trends.direction === 'down') {
      insights.push(`Revenue is declining with ${Math.abs(metrics.trends.momentum).toFixed(1)}% negative momentum`);
    } else {
      insights.push('Revenue is stable with consistent performance');
    }
    
    // Growth insights
    if (metrics.growth.monthly > 20) {
      insights.push(`Strong monthly growth of ${metrics.growth.monthly.toFixed(1)}% indicates healthy business expansion`);
    } else if (metrics.growth.monthly < -5) {
      insights.push(`Monthly revenue decline of ${Math.abs(metrics.growth.monthly).toFixed(1)}% requires attention`);
    }
    
    // Segment insights
    const topSegment = metrics.segments.reduce((prev, current) => 
      prev.revenue > current.revenue ? prev : current
    );
    insights.push(`${topSegment.name} is the top revenue driver, contributing ${topSegment.percentage}% of total revenue`);
    
    // KPI insights
    if (metrics.kpis.churnRate > 10) {
      insights.push(`Churn rate of ${metrics.kpis.churnRate}% is above industry average and needs improvement`);
    }
    
    if (metrics.kpis.customerLifetimeValue > 500) {
      insights.push(`High customer lifetime value of $${metrics.kpis.customerLifetimeValue} indicates strong customer loyalty`);
    }
    
    return insights;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(metrics: RevenueMetrics): string[] {
    const recommendations: string[] = [];
    
    // Growth recommendations
    if (metrics.growth.monthly < 10) {
      recommendations.push('Focus on customer acquisition and retention strategies to accelerate growth');
    }
    
    // Segment recommendations
    const fastestGrowingSegment = metrics.segments.reduce((prev, current) => 
      prev.growth > current.growth ? prev : current
    );
    recommendations.push(`Invest more in ${fastestGrowingSegment.name} as it shows the highest growth rate of ${fastestGrowingSegment.growth}%`);
    
    // Pricing recommendations
    const avgOrderValue = metrics.totalRevenue / metrics.segments.reduce((sum, s) => sum + s.transactions, 0);
    if (avgOrderValue < 100) {
      recommendations.push('Consider implementing upselling strategies to increase average order value');
    }
    
    // Retention recommendations
    if (metrics.kpis.churnRate > 8) {
      recommendations.push('Implement customer success programs to reduce churn and increase retention');
    }
    
    return recommendations;
  }

  /**
   * Identify risks
   */
  private identifyRisks(metrics: RevenueMetrics, data: RevenueDataPoint[]): string[] {
    const risks: string[] = [];
    
    // Revenue concentration risk
    const topSegmentPercentage = Math.max(...metrics.segments.map(s => s.percentage));
    if (topSegmentPercentage > 60) {
      risks.push(`High revenue concentration in one segment (${topSegmentPercentage}%) creates vulnerability`);
    }
    
    // Growth risk
    if (metrics.growth.monthly < -10) {
      risks.push('Significant revenue decline trend poses immediate business risk');
    }
    
    // Volatility risk
    const volatility = this.calculateVolatility(data);
    if (volatility > 30) {
      risks.push('High revenue volatility makes forecasting and planning challenging');
    }
    
    // Customer dependency risk
    if (metrics.kpis.customerLifetimeValue < 200) {
      risks.push('Low customer lifetime value suggests poor customer retention');
    }
    
    return risks;
  }

  /**
   * Identify opportunities
   */
  private identifyOpportunities(metrics: RevenueMetrics, data: RevenueDataPoint[]): string[] {
    const opportunities: string[] = [];
    
    // Growth opportunity
    const growingSegments = metrics.segments.filter(s => s.growth > 15);
    if (growingSegments.length > 0) {
      opportunities.push(`${growingSegments.length} service segments showing strong growth potential`);
    }
    
    // Pricing opportunity
    const highValueSegments = metrics.segments.filter(s => s.averageValue > 100);
    if (highValueSegments.length > 0) {
      opportunities.push(`Focus on high-value services like ${highValueSegments.map(s => s.name).join(', ')}`);
    }
    
    // Market opportunity
    if (metrics.trends.direction === 'up' && metrics.trends.strength === 'strong') {
      opportunities.push('Strong upward trend suggests market expansion opportunity');
    }
    
    // Retention opportunity
    if (metrics.kpis.expansionRate > 10) {
      opportunities.push(`${metrics.kpis.expansionRate}% expansion rate indicates upselling success`);
    }
    
    return opportunities;
  }

  private calculateVolatility(data: RevenueDataPoint[]): number {
    if (data.length < 2) return 0;
    
    const revenues = data.map(d => d.revenue);
    const mean = revenues.reduce((sum, r) => sum + r, 0) / revenues.length;
    const variance = revenues.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / revenues.length;
    const stdDev = Math.sqrt(variance);
    
    return (stdDev / mean) * 100;
  }

  /**
   * Get revenue data for charts
   */
  getRevenueData(timeRange: '7d' | '30d' | '90d' = '30d'): RevenueDataPoint[] {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    return this.historicalData.slice(-days);
  }

  /**
   * Get revenue segments
   */
  getRevenueSegments(): RevenueSegment[] {
    return [...this.segments];
  }

  /**
   * Get revenue forecast
   */
  getRevenueForecast(days: number = 30): RevenueForecast[] {
    return this.generateForecast(days);
  }

  /**
   * Calculate revenue metrics for a specific time range
   */
  getRevenueMetrics(timeRange: '7d' | '30d' | '90d' = '30d'): RevenueMetrics {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const data = this.historicalData.slice(-days);
    return this.calculateMetrics(data);
  }
}

// Export singleton instance
export const revenueAnalytics = new RevenueAnalyticsService();