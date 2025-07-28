'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Package, 
  Clock,
  Calendar,
  BarChart3,
  PieChart,
  Target,
  Award,
  ArrowUp,
  ArrowDown,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';

interface AnalyticsMetric {
  id: string;
  name: string;
  value: number;
  previousValue: number;
  change: number;
  changeType: 'increase' | 'decrease';
  format: 'currency' | 'percentage' | 'number' | 'time';
  period: string;
  trend: number[]; // Data points for mini chart
}

interface ChartData {
  id: string;
  title: string;
  type: 'line' | 'bar' | 'pie' | 'area';
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string;
      fill?: boolean;
    }[];
  };
  options?: any;
}

interface AnalyticsData {
  overview: AnalyticsMetric[];
  charts: ChartData[];
  insights: {
    id: string;
    title: string;
    description: string;
    type: 'positive' | 'negative' | 'neutral';
    action?: string;
  }[];
}

const mockAnalyticsData: AnalyticsData = {
  overview: [
    {
      id: 'total-revenue',
      name: 'Total Revenue',
      value: 24650,
      previousValue: 22100,
      change: 11.5,
      changeType: 'increase',
      format: 'currency',
      period: 'This Month',
      trend: [18500, 19200, 20100, 21300, 22100, 23400, 24650]
    },
    {
      id: 'total-repairs',
      name: 'Total Repairs',
      value: 156,
      previousValue: 142,
      change: 9.9,
      changeType: 'increase',
      format: 'number',
      period: 'This Month',
      trend: [120, 125, 135, 140, 142, 148, 156]
    },
    {
      id: 'avg-repair-time',
      name: 'Avg Repair Time',
      value: 2.8,
      previousValue: 3.2,
      change: -12.5,
      changeType: 'decrease',
      format: 'time',
      period: 'This Month',
      trend: [3.5, 3.3, 3.2, 3.1, 3.2, 2.9, 2.8]
    },
    {
      id: 'customer-satisfaction',
      name: 'Customer Satisfaction',
      value: 94.2,
      previousValue: 91.8,
      change: 2.6,
      changeType: 'increase',
      format: 'percentage',
      period: 'This Month',
      trend: [89.5, 90.2, 91.1, 91.8, 92.5, 93.8, 94.2]
    },
    {
      id: 'repeat-customers',
      name: 'Repeat Customers',
      value: 67.3,
      previousValue: 65.1,
      change: 3.4,
      changeType: 'increase',
      format: 'percentage',
      period: 'This Month',
      trend: [62.1, 63.8, 64.5, 65.1, 66.2, 66.8, 67.3]
    },
    {
      id: 'conversion-rate',
      name: 'Quote Conversion',
      value: 78.5,
      previousValue: 75.2,
      change: 4.4,
      changeType: 'increase',
      format: 'percentage',
      period: 'This Month',
      trend: [72.8, 74.1, 75.2, 76.0, 77.1, 77.8, 78.5]
    }
  ],
  charts: [
    {
      id: 'revenue-trend',
      title: 'Revenue Trend',
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
        datasets: [{
          label: 'Revenue',
          data: [18500, 19200, 20100, 21300, 22100, 23400, 24650],
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true
        }]
      }
    },
    {
      id: 'repair-categories',
      title: 'Repair Categories',
      type: 'pie',
      data: {
        labels: ['Screen Repair', 'Battery Replacement', 'Water Damage', 'Software Issues', 'Other'],
        datasets: [{
          label: 'Repairs',
          data: [45, 28, 15, 8, 4],
          backgroundColor: [
            '#3B82F6',
            '#10B981',
            '#F59E0B',
            '#EF4444',
            '#8B5CF6'
          ]
        }]
      }
    },
    {
      id: 'monthly-repairs',
      title: 'Monthly Repairs by Device',
      type: 'bar',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
        datasets: [
          {
            label: 'iPhone',
            data: [45, 52, 48, 55, 60, 58, 62],
            backgroundColor: '#3B82F6'
          },
          {
            label: 'Samsung',
            data: [32, 28, 35, 30, 38, 42, 40],
            backgroundColor: '#10B981'
          },
          {
            label: 'iPad',
            data: [18, 22, 20, 25, 22, 28, 30],
            backgroundColor: '#F59E0B'
          },
          {
            label: 'MacBook',
            data: [12, 15, 18, 16, 20, 18, 24],
            backgroundColor: '#8B5CF6'
          }
        ]
      }
    },
    {
      id: 'performance-metrics',
      title: 'Performance Metrics',
      type: 'area',
      data: {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        datasets: [
          {
            label: 'Completion Rate',
            data: [92, 94, 91, 96],
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true
          },
          {
            label: 'On-Time Delivery',
            data: [88, 90, 87, 93],
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true
          }
        ]
      }
    }
  ],
  insights: [
    {
      id: 'revenue-growth',
      title: 'Strong Revenue Growth',
      description: 'Revenue increased by 11.5% compared to last month, driven by higher demand for screen repairs.',
      type: 'positive',
      action: 'Consider expanding screen repair capacity'
    },
    {
      id: 'repair-time-improvement',
      title: 'Improved Repair Times',
      description: 'Average repair time decreased by 12.5%, indicating improved operational efficiency.',
      type: 'positive'
    },
    {
      id: 'water-damage-trend',
      title: 'Increasing Water Damage Cases',
      description: 'Water damage repairs increased by 25% this month. Consider promotional campaigns for waterproof accessories.',
      type: 'neutral',
      action: 'Launch waterproof accessory promotions'
    }
  ]
};

export const AnalyticsDashboard: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>(mockAnalyticsData);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [loading, setLoading] = useState(false);
  const [selectedChart, setSelectedChart] = useState<ChartData | null>(null);

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedPeriod]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      // In real implementation, fetch data based on selectedPeriod
      setAnalyticsData(mockAnalyticsData);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (value: number, format: AnalyticsMetric['format']): string => {
    switch (format) {
      case 'currency':
        return `£${value.toLocaleString()}`;
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'time':
        return `${value.toFixed(1)} days`;
      case 'number':
      default:
        return value.toLocaleString();
    }
  };

  const getChangeIcon = (changeType: 'increase' | 'decrease') => {
    return changeType === 'increase' ? 
      <ArrowUp className="h-4 w-4 text-green-500" /> : 
      <ArrowDown className="h-4 w-4 text-red-500" />;
  };

  const getChangeColor = (changeType: 'increase' | 'decrease', isPositive: boolean = true) => {
    const isGood = isPositive ? changeType === 'increase' : changeType === 'decrease';
    return isGood ? 'text-green-600' : 'text-red-600';
  };

  const getInsightIcon = (type: 'positive' | 'negative' | 'neutral') => {
    switch (type) {
      case 'positive':
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'negative':
        return <TrendingDown className="h-5 w-5 text-red-500" />;
      default:
        return <Target className="h-5 w-5 text-blue-500" />;
    }
  };

  const exportData = () => {
    // Implement data export functionality
    console.log('Exporting analytics data...');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Comprehensive insights into business performance and trends.
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="12m">Last 12 months</option>
          </select>
          
          <button
            onClick={exportData}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          
          <button
            onClick={loadAnalyticsData}
            disabled={loading}
            className="flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {analyticsData.overview.map((metric) => (
          <div key={metric.id} className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {metric.name}
                </h3>
                <div className="mt-2 flex items-baseline">
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {formatValue(metric.value, metric.format)}
                  </p>
                  <div className={`ml-2 flex items-center text-sm ${getChangeColor(metric.changeType, metric.id !== 'avg-repair-time')}`}>
                    {getChangeIcon(metric.changeType)}
                    <span className="ml-1">{Math.abs(metric.change).toFixed(1)}%</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  vs previous {metric.period.toLowerCase()}
                </p>
              </div>
              
              {/* Mini trend chart placeholder */}
              <div className="ml-4">
                <div className="w-16 h-8 bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded opacity-50"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {analyticsData.charts.map((chart) => (
          <div key={chart.id} className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {chart.title}
              </h3>
              <button
                onClick={() => setSelectedChart(chart)}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                View Details
              </button>
            </div>
            
            {/* Chart placeholder - in real implementation, use a chart library like Chart.js or Recharts */}
            <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500 dark:text-gray-400">
                {chart.type === 'line' && <BarChart3 className="h-12 w-12 mx-auto mb-2" />}
                {chart.type === 'bar' && <BarChart3 className="h-12 w-12 mx-auto mb-2" />}
                {chart.type === 'pie' && <PieChart className="h-12 w-12 mx-auto mb-2" />}
                {chart.type === 'area' && <TrendingUp className="h-12 w-12 mx-auto mb-2" />}
                <p className="text-sm">{chart.title} Chart</p>
                <p className="text-xs mt-1">Chart visualization would render here</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Insights Section */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Award className="h-5 w-5 text-blue-500 mr-2" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Key Insights
            </h3>
          </div>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            {analyticsData.insights.map((insight) => (
              <div
                key={insight.id}
                className={`p-4 rounded-lg border-l-4 ${
                  insight.type === 'positive' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' :
                  insight.type === 'negative' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
                  'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getInsightIcon(insight.type)}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      {insight.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {insight.description}
                    </p>
                    {insight.action && (
                      <button className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                        {insight.action} →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Detail Modal */}
      {selectedChart && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setSelectedChart(null)} />
            
            <div className="relative bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-4xl sm:w-full sm:p-6">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {selectedChart.title} - Detailed View
                </h3>
              </div>

              {/* Expanded chart would go here */}
              <div className="h-96 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <BarChart3 className="h-16 w-16 mx-auto mb-4" />
                  <p>Detailed {selectedChart.title} Chart</p>
                  <p className="text-sm mt-2">Full-size chart visualization would render here</p>
                </div>
              </div>

              {/* Chart data summary */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedChart.data.datasets[0]?.data.reduce((a, b) => a + b, 0) || 0}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Total</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedChart.data.datasets[0]?.data.length || 0}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Data Points</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {Math.round((selectedChart.data.datasets[0]?.data.reduce((a, b) => a + b, 0) || 0) / (selectedChart.data.datasets[0]?.data.length || 1))}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Average</div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedChart(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  Close
                </button>
                <button
                  onClick={exportData}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Export Chart Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;