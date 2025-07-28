/**
 * Business Intelligence Service
 * Generates comprehensive business reports and insights
 */

import { revenueAnalytics } from './revenueAnalytics';
import { customerBehaviorAnalytics } from './customerBehaviorAnalytics';
import { analyticsService } from './analyticsService';

export interface BusinessReport {
  id: string;
  title: string;
  type: 'revenue' | 'customer' | 'operational' | 'market' | 'performance';
  timeRange: string;
  generatedAt: Date;
  summary: string;
  insights: string[];
  recommendations: string[];
  kpis: Record<string, number>;
  charts: ChartData[];
  tables: TableData[];
}

export interface ChartData {
  type: 'line' | 'bar' | 'pie' | 'area';
  title: string;
  data: any[];
  config: Record<string, any>;
}

export interface TableData {
  title: string;
  columns: string[];
  rows: any[][];
}

class BusinessIntelligenceService {
  generateMonthlyReport(): BusinessReport {
    const revenueAnalysis = revenueAnalytics.getRevenueAnalysis('30d');
    const behaviorAnalysis = customerBehaviorAnalytics.getBehaviorAnalysis();
    
    return {
      id: `monthly-${Date.now()}`,
      title: 'Monthly Business Intelligence Report',
      type: 'operational',
      timeRange: '30 days',
      generatedAt: new Date(),
      summary: 'Comprehensive 30-day business performance analysis showing strong growth across key metrics.',
      insights: [
        ...revenueAnalysis.insights,
        ...behaviorAnalysis.insights.map(i => i.description)
      ],
      recommendations: [
        ...revenueAnalysis.recommendations,
        ...behaviorAnalysis.insights.filter(i => i.actionable).map(i => i.recommendation || i.description)
      ],
      kpis: {
        totalRevenue: revenueAnalysis.metrics.totalRevenue,
        customerCount: behaviorAnalysis.metrics.totalCustomers,
        conversionRate: behaviorAnalysis.metrics.conversionRate,
        averageOrderValue: revenueAnalysis.metrics.totalRevenue / revenueAnalysis.metrics.segments.reduce((sum, s) => sum + s.transactions, 0)
      },
      charts: [
        {
          type: 'line',
          title: 'Revenue Trend',
          data: revenueAnalytics.getRevenueData('30d'),
          config: { xKey: 'date', yKey: 'revenue' }
        },
        {
          type: 'pie',
          title: 'Revenue by Service',
          data: revenueAnalysis.metrics.segments,
          config: { labelKey: 'name', valueKey: 'revenue' }
        }
      ],
      tables: [
        {
          title: 'Customer Segments',
          columns: ['Segment', 'Count', 'Average Value', 'Conversion Rate'],
          rows: behaviorAnalysis.segments.map(s => [
            s.name,
            s.customerCount,
            `$${s.averageValue}`,
            `${s.conversionRate}%`
          ])
        }
      ]
    };
  }

  generateCustomerReport(): BusinessReport {
    const behaviorAnalysis = customerBehaviorAnalytics.getBehaviorAnalysis();
    
    return {
      id: `customer-${Date.now()}`,
      title: 'Customer Behavior Analysis Report',
      type: 'customer',
      timeRange: '30 days',
      generatedAt: new Date(),
      summary: 'Detailed analysis of customer behavior patterns and journey optimization opportunities.',
      insights: behaviorAnalysis.insights.map(i => i.description),
      recommendations: behaviorAnalysis.insights.filter(i => i.actionable).map(i => i.recommendation || i.description),
      kpis: {
        totalCustomers: behaviorAnalysis.metrics.totalCustomers,
        activeCustomers: behaviorAnalysis.metrics.activeCustomers,
        conversionRate: behaviorAnalysis.metrics.conversionRate,
        returnRate: behaviorAnalysis.metrics.returnRate
      },
      charts: [
        {
          type: 'bar',
          title: 'Customer Segments',
          data: behaviorAnalysis.segments,
          config: { xKey: 'name', yKey: 'customerCount' }
        },
        {
          type: 'line',
          title: 'Behavior Patterns',
          data: behaviorAnalysis.patterns,
          config: { xKey: 'pattern', yKey: 'frequency' }
        }
      ],
      tables: [
        {
          title: 'Behavior Patterns',
          columns: ['Pattern', 'Frequency', 'Customers', 'Conversion Rate'],
          rows: behaviorAnalysis.patterns.map(p => [
            p.pattern,
            `${p.frequency}%`,
            p.customers,
            `${p.conversionRate}%`
          ])
        }
      ]
    };
  }

  generateRevenueReport(): BusinessReport {
    const revenueAnalysis = revenueAnalytics.getRevenueAnalysis('30d');
    
    return {
      id: `revenue-${Date.now()}`,
      title: 'Revenue Performance Report',
      type: 'revenue',
      timeRange: '30 days',
      generatedAt: new Date(),
      summary: 'Comprehensive revenue analysis with forecasting and optimization recommendations.',
      insights: revenueAnalysis.insights,
      recommendations: revenueAnalysis.recommendations,
      kpis: {
        totalRevenue: revenueAnalysis.metrics.totalRevenue,
        netRevenue: revenueAnalysis.metrics.netRevenue,
        monthlyGrowth: revenueAnalysis.metrics.growth.monthly,
        annualRecurringRevenue: revenueAnalysis.metrics.kpis.annualRecurringRevenue
      },
      charts: [
        {
          type: 'area',
          title: 'Revenue Forecast',
          data: revenueAnalytics.getRevenueForecast(30),
          config: { xKey: 'period', yKey: 'predicted' }
        },
        {
          type: 'bar',
          title: 'Revenue by Segment',
          data: revenueAnalysis.metrics.segments,
          config: { xKey: 'name', yKey: 'revenue' }
        }
      ],
      tables: [
        {
          title: 'Revenue Segments',
          columns: ['Service', 'Revenue', 'Growth', 'Transactions'],
          rows: revenueAnalysis.metrics.segments.map(s => [
            s.name,
            `$${s.revenue.toLocaleString()}`,
            `${s.growth}%`,
            s.transactions
          ])
        }
      ]
    };
  }

  exportToCSV(report: BusinessReport): string {
    let csv = `Business Intelligence Report\n`;
    csv += `Title: ${report.title}\n`;
    csv += `Generated: ${report.generatedAt.toISOString()}\n`;
    csv += `Time Range: ${report.timeRange}\n\n`;
    
    csv += `Summary:\n${report.summary}\n\n`;
    
    csv += `Key Performance Indicators:\n`;
    Object.entries(report.kpis).forEach(([key, value]) => {
      csv += `${key},${value}\n`;
    });
    
    csv += `\nInsights:\n`;
    report.insights.forEach(insight => {
      csv += `"${insight}"\n`;
    });
    
    csv += `\nRecommendations:\n`;
    report.recommendations.forEach(rec => {
      csv += `"${rec}"\n`;
    });
    
    return csv;
  }

  exportToJSON(report: BusinessReport): string {
    return JSON.stringify(report, null, 2);
  }
}

export const businessIntelligence = new BusinessIntelligenceService();