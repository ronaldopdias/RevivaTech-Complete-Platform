/**
 * Data Visualization and Export Service
 * Handles chart generation and data export functionality
 */

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'funnel';
  title: string;
  width?: number;
  height?: number;
  responsive?: boolean;
  theme?: 'light' | 'dark';
  colors?: string[];
  animations?: boolean;
}

export interface ExportOptions {
  format: 'csv' | 'json' | 'pdf' | 'xlsx' | 'png' | 'svg';
  filename?: string;
  includeHeaders?: boolean;
  compression?: boolean;
}

class DataVisualizationService {
  private defaultColors = [
    '#007AFF', '#FF3B30', '#FF9500', '#FFCC00', '#34C759',
    '#5AC8FA', '#AF52DE', '#FF2D92', '#A2845E', '#8E8E93'
  ];

  /**
   * Generate chart configuration for different chart types
   */
  generateChartConfig(type: ChartConfig['type'], data: any[], options: Partial<ChartConfig> = {}): ChartConfig {
    return {
      type,
      title: options.title || 'Chart',
      width: options.width || 600,
      height: options.height || 400,
      responsive: options.responsive ?? true,
      theme: options.theme || 'light',
      colors: options.colors || this.defaultColors,
      animations: options.animations ?? true
    };
  }

  /**
   * Export data to CSV format
   */
  exportToCSV(data: any[], filename: string = 'data.csv'): void {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
        }).join(',')
      )
    ].join('\n');

    this.downloadFile(csvContent, filename, 'text/csv');
  }

  /**
   * Export data to JSON format
   */
  exportToJSON(data: any, filename: string = 'data.json'): void {
    const jsonContent = JSON.stringify(data, null, 2);
    this.downloadFile(jsonContent, filename, 'application/json');
  }

  /**
   * Export data to Excel format (simplified)
   */
  exportToExcel(data: any[], filename: string = 'data.xlsx'): void {
    // Simplified Excel export - in production, use a library like xlsx
    const headers = Object.keys(data[0] || {});
    const csvContent = [
      headers.join('\t'),
      ...data.map(row => 
        headers.map(header => row[header]).join('\t')
      )
    ].join('\n');

    this.downloadFile(csvContent, filename, 'application/vnd.ms-excel');
  }

  /**
   * Generate analytics report
   */
  generateAnalyticsReport(data: {
    revenue: any[];
    customers: any[];
    performance: any[];
    timeRange: string;
  }): string {
    const report = `
# Analytics Report
Generated: ${new Date().toISOString()}
Time Range: ${data.timeRange}

## Revenue Summary
Total Revenue: $${data.revenue.reduce((sum, item) => sum + (item.revenue || 0), 0).toLocaleString()}
Total Transactions: ${data.revenue.reduce((sum, item) => sum + (item.transactions || 0), 0)}
Average Order Value: $${(data.revenue.reduce((sum, item) => sum + (item.revenue || 0), 0) / data.revenue.reduce((sum, item) => sum + (item.transactions || 0), 1)).toFixed(2)}

## Customer Metrics
Total Customers: ${data.customers.length}
Active Customers: ${data.customers.filter(c => c.active).length}
Conversion Rate: ${((data.customers.filter(c => c.converted).length / data.customers.length) * 100).toFixed(1)}%

## Performance Insights
Page Views: ${data.performance.reduce((sum, item) => sum + (item.pageViews || 0), 0)}
Sessions: ${data.performance.reduce((sum, item) => sum + (item.sessions || 0), 0)}
Bounce Rate: ${(data.performance.reduce((sum, item) => sum + (item.bounceRate || 0), 0) / data.performance.length).toFixed(1)}%

## Key Recommendations
1. Focus on high-performing customer segments
2. Optimize conversion funnel bottlenecks
3. Improve mobile user experience
4. Implement retention strategies for new customers
5. Enhance value proposition for price-sensitive segments
`;

    return report;
  }

  /**
   * Create dashboard export with multiple formats
   */
  exportDashboard(dashboardData: {
    metrics: any;
    charts: any[];
    tables: any[];
    insights: string[];
  }, options: ExportOptions): void {
    const { format, filename = 'dashboard', includeHeaders = true } = options;

    switch (format) {
      case 'json':
        this.exportToJSON(dashboardData, `${filename}.json`);
        break;
      case 'csv':
        // Export tables as CSV
        dashboardData.tables.forEach((table, index) => {
          const csvData = [
            ...(includeHeaders ? [table.columns] : []),
            ...table.rows
          ];
          this.exportToCSV(csvData, `${filename}_table_${index + 1}.csv`);
        });
        break;
      case 'xlsx':
        // Export combined data as Excel
        const combinedData = dashboardData.tables.reduce((acc, table) => {
          return [...acc, ...table.rows.map(row => {
            const obj: any = {};
            table.columns.forEach((col, index) => {
              obj[col] = row[index];
            });
            return obj;
          })];
        }, [] as any[]);
        this.exportToExcel(combinedData, `${filename}.xlsx`);
        break;
      default:
        this.exportToJSON(dashboardData, `${filename}.json`);
    }
  }

  /**
   * Generate comparative analysis report
   */
  generateComparativeReport(currentData: any, previousData: any): string {
    const calculateChange = (current: number, previous: number): string => {
      if (previous === 0) return current > 0 ? '+100%' : '0%';
      const change = ((current - previous) / previous) * 100;
      return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
    };

    return `
# Comparative Analysis Report
Generated: ${new Date().toISOString()}

## Period Comparison
Current Period: ${currentData.period || 'Current'}
Previous Period: ${previousData.period || 'Previous'}

## Revenue Comparison
Current: $${currentData.revenue?.toLocaleString() || '0'}
Previous: $${previousData.revenue?.toLocaleString() || '0'}
Change: ${calculateChange(currentData.revenue || 0, previousData.revenue || 0)}

## Customer Metrics Comparison
Current Customers: ${currentData.customers || 0}
Previous Customers: ${previousData.customers || 0}
Change: ${calculateChange(currentData.customers || 0, previousData.customers || 0)}

## Performance Metrics
Current Conversion Rate: ${currentData.conversionRate || 0}%
Previous Conversion Rate: ${previousData.conversionRate || 0}%
Change: ${calculateChange(currentData.conversionRate || 0, previousData.conversionRate || 0)}

## Key Insights
- ${currentData.revenue > previousData.revenue ? 'Revenue growth indicates positive business trajectory' : 'Revenue decline requires immediate attention'}
- ${currentData.customers > previousData.customers ? 'Customer base expansion shows healthy growth' : 'Customer acquisition needs improvement'}
- ${currentData.conversionRate > previousData.conversionRate ? 'Conversion rate improvement demonstrates optimization success' : 'Conversion rate decline suggests funnel optimization needed'}
`;
  }

  /**
   * Create automated report scheduling
   */
  scheduleReport(type: 'daily' | 'weekly' | 'monthly', config: {
    recipients: string[];
    format: ExportOptions['format'];
    includeCharts: boolean;
  }): void {
    // In production, this would integrate with a job scheduler
    console.log(`Scheduling ${type} report for ${config.recipients.join(', ')}`);
    console.log(`Format: ${config.format}, Include Charts: ${config.includeCharts}`);
  }

  /**
   * Generate real-time dashboard snapshot
   */
  generateSnapshot(dashboardData: any): string {
    return `
# Dashboard Snapshot
Timestamp: ${new Date().toISOString()}

## Current Metrics
Active Users: ${dashboardData.activeUsers || 0}
Page Views (Last Hour): ${dashboardData.pageViewsLastHour || 0}
Conversions Today: ${dashboardData.conversionsToday || 0}
Revenue Today: $${dashboardData.revenueToday || 0}

## System Status
- Analytics: ${dashboardData.analyticsStatus || 'Active'}
- Database: ${dashboardData.databaseStatus || 'Connected'}
- Cache: ${dashboardData.cacheStatus || 'Operational'}
- CDN: ${dashboardData.cdnStatus || 'Active'}

## Recent Activity
${dashboardData.recentActivity?.map((activity: any, index: number) => 
  `${index + 1}. ${activity.description} (${new Date(activity.timestamp).toLocaleTimeString()})`
).join('\n') || 'No recent activity'}
`;
  }

  /**
   * Download file helper
   */
  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Format data for different chart types
   */
  formatChartData(data: any[], chartType: ChartConfig['type']): any[] {
    switch (chartType) {
      case 'pie':
        return data.map(item => ({
          label: item.name || item.label,
          value: item.value || item.revenue || item.count,
          percentage: item.percentage
        }));
      case 'line':
      case 'area':
        return data.map(item => ({
          x: item.date || item.period || item.timestamp,
          y: item.value || item.revenue || item.count
        }));
      case 'bar':
        return data.map(item => ({
          category: item.name || item.category,
          value: item.value || item.revenue || item.count
        }));
      case 'funnel':
        return data.map((item, index) => ({
          stage: item.name || item.stage,
          value: item.value || item.users || item.count,
          percentage: item.percentage || ((item.value / data[0].value) * 100)
        }));
      default:
        return data;
    }
  }
}

export const dataVisualization = new DataVisualizationService();