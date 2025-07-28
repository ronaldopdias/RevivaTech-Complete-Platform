'use client';

import React, { useState, useEffect } from 'react';

interface KPIData {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
}

interface SimpleAnalyticsDashboardProps {
  className?: string;
}

const mockKPIData: KPIData[] = [
  {
    title: 'Total Revenue',
    value: '£47,230',
    change: '+18.5%',
    isPositive: true
  },
  {
    title: 'Repairs Completed',
    value: '127',
    change: '+12.3%',
    isPositive: true
  },
  {
    title: 'Customer Satisfaction',
    value: '4.8/5',
    change: '+4.2%',
    isPositive: true
  },
  {
    title: 'Response Time',
    value: '2.1 hrs',
    change: '-15.7%',
    isPositive: true
  }
];

const repairTypes = [
  { name: 'Screen Repairs', value: 45, color: '#3B82F6' },
  { name: 'Battery Issues', value: 28, color: '#10B981' },
  { name: 'Water Damage', value: 18, color: '#F59E0B' },
  { name: 'Software Issues', value: 23, color: '#8B5CF6' },
  { name: 'Hardware Faults', value: 13, color: '#EF4444' }
];

const technicianData = [
  { name: 'Sarah M.', score: 92 },
  { name: 'James L.', score: 88 },
  { name: 'Alex R.', score: 85 },
  { name: 'Mike T.', score: 91 },
  { name: 'Emma W.', score: 94 }
];

export const SimpleAnalyticsDashboard: React.FC<SimpleAnalyticsDashboardProps> = ({
  className = ''
}) => {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const timeRanges = ['7d', '30d', '3m', '1y'];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600">
              Comprehensive business intelligence and performance insights
            </p>
            <p className="text-xs text-green-600 flex items-center mt-1">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
              Live data • Last updated {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
          
          <div className="flex gap-2 mt-4 sm:mt-0">
            <button className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
              📊 Export
            </button>
            <button className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Time Range Controls */}
        <div className="flex gap-2">
          {timeRanges.map((range) => (
            <button
              key={range}
              onClick={() => setSelectedTimeRange(range)}
              className={`px-3 py-1 text-xs rounded-md border ${
                selectedTimeRange === range
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '3m' ? '3 Months' : '1 Year'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {mockKPIData.map((kpi, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <h3 className="text-sm font-medium text-gray-500">{kpi.title}</h3>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                kpi.isPositive ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
              }`}>
                {kpi.change}
              </span>
            </div>
            <div className="mt-2">
              <div className="text-3xl font-bold text-gray-900">{kpi.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Repair Types Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">🔧</span>
            Repair Trends
          </h2>
          <div className="space-y-3">
            {repairTypes.map((type, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{type.name}</span>
                  <span className="text-gray-500">{type.value}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{
                      backgroundColor: type.color,
                      width: `${type.value}%`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Technician Performance */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">👨‍🔧</span>
            Technician Performance
          </h2>
          <div className="space-y-3">
            {technicianData.map((tech, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{tech.name}</span>
                  <span className="text-gray-500">{tech.score}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${tech.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Business Intelligence Insights */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="mr-2">🧠</span>
          Business Intelligence Insights
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-semibold text-green-800">Growth Opportunities</h4>
            <div className="space-y-3">
              <div className="border-l-4 border-green-500 pl-4">
                <p className="text-sm font-medium text-green-800">Screen Repair Demand</p>
                <p className="text-xs text-green-600">
                  45% increase in screen repairs. Consider expanding screen repair capacity.
                </p>
              </div>
              <div className="border-l-4 border-blue-500 pl-4">
                <p className="text-sm font-medium text-blue-800">Customer Retention</p>
                <p className="text-xs text-blue-600">
                  87% retention rate exceeds industry average. Implement referral program.
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-semibold text-orange-800">Areas for Improvement</h4>
            <div className="space-y-3">
              <div className="border-l-4 border-orange-500 pl-4">
                <p className="text-sm font-medium text-orange-800">Response Time</p>
                <p className="text-xs text-orange-600">
                  2.1 hour average response time. Target: under 2 hours for better satisfaction.
                </p>
              </div>
              <div className="border-l-4 border-red-500 pl-4">
                <p className="text-sm font-medium text-red-800">Service Diversification</p>
                <p className="text-xs text-red-600">
                  70% revenue from iPhone/MacBook. Consider expanding other device services.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 p-6 rounded-lg">
          <div className="flex items-center">
            <div className="p-2 bg-green-500 rounded-lg text-white mr-4">
              <span className="text-xl">📈</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-900">+18.5%</p>
              <p className="text-sm text-green-700">Monthly Growth</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 p-6 rounded-lg">
          <div className="flex items-center">
            <div className="p-2 bg-blue-500 rounded-lg text-white mr-4">
              <span className="text-xl">⚡</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-900">96.4%</p>
              <p className="text-sm text-blue-700">Efficiency Score</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 p-6 rounded-lg">
          <div className="flex items-center">
            <div className="p-2 bg-purple-500 rounded-lg text-white mr-4">
              <span className="text-xl">⭐</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-900">4.8/5</p>
              <p className="text-sm text-purple-700">Quality Rating</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 p-6 rounded-lg">
          <div className="flex items-center">
            <div className="p-2 bg-orange-500 rounded-lg text-white mr-4">
              <span className="text-xl">🎯</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-900">127</p>
              <p className="text-sm text-orange-700">Repairs Completed</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleAnalyticsDashboard;