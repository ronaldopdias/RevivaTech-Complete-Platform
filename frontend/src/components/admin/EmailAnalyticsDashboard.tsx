'use client';

import React, { useState, useEffect } from 'react';

interface AnalyticsData {
  summary: {
    emails_sent_today: number;
    emails_sent_week: number;
    emails_sent_month: number;
    open_rate_week: number;
    click_rate_week: number;
    bounce_rate_week: number;
    unsubscribe_rate_week: number;
  };
  performance_trends: {
    daily_volume: Array<{
      date: string;
      sent: number;
      opened: number;
      clicked: number;
    }>;
  };
  top_templates: Array<{
    id: string;
    name: string;
    sent: number;
    open_rate: number;
    click_rate: number;
  }>;
  device_breakdown: {
    desktop: { percentage: number; opens: number; clicks: number };
    mobile: { percentage: number; opens: number; clicks: number };
    tablet: { percentage: number; opens: number; clicks: number };
  };
}

interface EmailAnalyticsDashboardProps {
  className?: string;
}

const EmailAnalyticsDashboard: React.FC<EmailAnalyticsDashboardProps> = ({ className = '' }) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('sent');

  // Mock data for demonstration
  useEffect(() => {
    const mockData: AnalyticsData = {
      summary: {
        emails_sent_today: 156,
        emails_sent_week: 1089,
        emails_sent_month: 4567,
        open_rate_week: 0.67,
        click_rate_week: 0.14,
        bounce_rate_week: 0.03,
        unsubscribe_rate_week: 0.008
      },
      performance_trends: {
        daily_volume: [
          { date: '2025-07-11', sent: 145, opened: 97, clicked: 18 },
          { date: '2025-07-12', sent: 167, opened: 112, clicked: 22 },
          { date: '2025-07-13', sent: 134, opened: 89, clicked: 15 },
          { date: '2025-07-14', sent: 189, opened: 127, clicked: 28 },
          { date: '2025-07-15', sent: 156, opened: 104, clicked: 19 },
          { date: '2025-07-16', sent: 178, opened: 119, clicked: 25 },
          { date: '2025-07-17', sent: 120, opened: 78, clicked: 14 }
        ]
      },
      top_templates: [
        { id: 'booking_reminder', name: 'Appointment Reminder', sent: 156, open_rate: 0.82, click_rate: 0.28 },
        { id: 'repair_complete', name: 'Repair Completed', sent: 89, open_rate: 0.78, click_rate: 0.34 },
        { id: 'welcome_series', name: 'Welcome Email', sent: 67, open_rate: 0.65, click_rate: 0.12 },
        { id: 'feedback_request', name: 'Feedback Request', sent: 45, open_rate: 0.58, click_rate: 0.15 }
      ],
      device_breakdown: {
        desktop: { percentage: 45, opens: 234, clicks: 67 },
        mobile: { percentage: 42, opens: 198, clicks: 45 },
        tablet: { percentage: 13, opens: 67, clicks: 22 }
      }
    };

    setTimeout(() => {
      setAnalyticsData(mockData);
      setLoading(false);
    }, 1000);
  }, [timeRange]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  };

  const getMetricValue = (data: any, metric: string) => {
    return data[metric] || 0;
  };

  const getMaxValue = (data: any[], metric: string) => {
    return Math.max(...data.map(d => getMetricValue(d, metric)));
  };

  const getChangeColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-24 rounded-lg"></div>
            ))}
          </div>
          <div className="bg-gray-200 h-96 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!analyticsData) return null;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Email Analytics</h2>
        <div className="flex gap-2">
          {['7d', '30d', '90d'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(analyticsData.summary.emails_sent_today)}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className={getChangeColor(12)}>+12%</span>
            <span className="text-gray-500 ml-2">vs yesterday</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Open Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPercentage(analyticsData.summary.open_rate_week)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className={getChangeColor(5.2)}>+5.2%</span>
            <span className="text-gray-500 ml-2">vs last week</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Click Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPercentage(analyticsData.summary.click_rate_week)}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className={getChangeColor(-1.3)}>-1.3%</span>
            <span className="text-gray-500 ml-2">vs last week</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Bounce Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPercentage(analyticsData.summary.bounce_rate_week)}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className={getChangeColor(-0.5)}>-0.5%</span>
            <span className="text-gray-500 ml-2">vs last week</span>
          </div>
        </div>
      </div>

      {/* Performance Chart */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Email Performance Trends</h3>
          <div className="flex gap-2">
            {[
              { key: 'sent', label: 'Sent', color: 'bg-blue-600' },
              { key: 'opened', label: 'Opened', color: 'bg-green-600' },
              { key: 'clicked', label: 'Clicked', color: 'bg-purple-600' }
            ].map((metric) => (
              <button
                key={metric.key}
                onClick={() => setSelectedMetric(metric.key)}
                className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm transition-colors ${
                  selectedMetric === metric.key
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className={`w-3 h-3 rounded-full ${metric.color}`}></div>
                {metric.label}
              </button>
            ))}
          </div>
        </div>

        <div className="h-64 flex items-end justify-between gap-2">
          {analyticsData.performance_trends.daily_volume.map((day, index) => {
            const value = getMetricValue(day, selectedMetric);
            const maxValue = getMaxValue(analyticsData.performance_trends.daily_volume, selectedMetric);
            const height = (value / maxValue) * 100;

            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className={`w-full rounded-t transition-all duration-300 ${
                    selectedMetric === 'sent' ? 'bg-blue-600' :
                    selectedMetric === 'opened' ? 'bg-green-600' : 'bg-purple-600'
                  }`}
                  style={{ height: `${height}%` }}
                  title={`${day.date}: ${value}`}
                ></div>
                <div className="mt-2 text-xs text-gray-500">
                  {formatDate(day.date)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Templates */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Top Performing Templates</h3>
          <div className="space-y-4">
            {analyticsData.top_templates.map((template, index) => (
              <div key={template.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{template.name}</p>
                    <p className="text-sm text-gray-500">{formatNumber(template.sent)} sent</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-green-600">
                    {formatPercentage(template.open_rate)} open
                  </p>
                  <p className="text-sm text-purple-600">
                    {formatPercentage(template.click_rate)} click
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Device Breakdown */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Device Breakdown</h3>
          <div className="space-y-4">
            {Object.entries(analyticsData.device_breakdown).map(([device, data]) => (
              <div key={device} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full ${
                    device === 'desktop' ? 'bg-blue-600' :
                    device === 'mobile' ? 'bg-green-600' : 'bg-purple-600'
                  }`}></div>
                  <span className="font-medium capitalize">{device}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-medium">{data.percentage}%</div>
                    <div className="text-xs text-gray-500">{formatNumber(data.opens)} opens</div>
                  </div>
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        device === 'desktop' ? 'bg-blue-600' :
                        device === 'mobile' ? 'bg-green-600' : 'bg-purple-600'
                      }`}
                      style={{ width: `${data.percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailAnalyticsDashboard;