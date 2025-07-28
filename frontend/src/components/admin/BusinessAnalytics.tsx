'use client';

import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Wrench, 
  Calendar, 
  Target,
  Clock,
  Award,
  AlertTriangle
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

// Mock analytics data
const analyticsData = {
  revenue: {
    today: 1240,
    yesterday: 1050,
    thisWeek: 7800,
    lastWeek: 6900,
    thisMonth: 28400,
    lastMonth: 24600
  },
  customers: {
    total: 1247,
    new: 23,
    returning: 45,
    satisfaction: 4.8
  },
  repairs: {
    total: 89,
    pending: 12,
    inProgress: 24,
    completed: 53,
    avgCompletionTime: 2.3 // days
  },
  performance: {
    technicianEfficiency: 87,
    firstTimeFixRate: 94,
    warrantyClaimRate: 2.1,
    avgResponseTime: 1.2 // hours
  },
  trends: {
    revenue: '+18%',
    customers: '+12%',
    repairs: '+8%',
    satisfaction: '+2%'
  }
};

const recentRepairs = [
  { id: 'REP_001', customer: 'John Smith', device: 'iPhone 14 Pro', value: 149.99, status: 'completed' },
  { id: 'REP_002', customer: 'Sarah Wilson', device: 'MacBook Air', value: 89.99, status: 'in_progress' },
  { id: 'REP_003', customer: 'Mike Johnson', device: 'Samsung S23', value: 199.99, status: 'pending' },
  { id: 'REP_004', customer: 'Emma Davis', device: 'iPad Pro', value: 79.99, status: 'completed' },
  { id: 'REP_005', customer: 'David Brown', device: 'Surface Laptop', value: 299.99, status: 'diagnostic' }
];

const topServices = [
  { name: 'Screen Replacement', count: 34, revenue: 3400, trend: '+12%' },
  { name: 'Battery Replacement', count: 28, revenue: 1680, trend: '+8%' },
  { name: 'Water Damage Repair', count: 15, revenue: 2999, trend: '+25%' },
  { name: 'Software Repair', count: 22, revenue: 879, trend: '+5%' },
  { name: 'Logic Board Repair', count: 8, revenue: 1999, trend: '+15%' }
];

export default function BusinessAnalytics() {
  const [timeRange, setTimeRange] = useState('today');

  const getChangeIcon = (trend: string) => {
    return trend.startsWith('+') ? 
      <TrendingUp className="w-4 h-4 text-green-600" /> : 
      <TrendingDown className="w-4 h-4 text-red-600" />;
  };

  const getChangeColor = (trend: string) => {
    return trend.startsWith('+') ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Business Analytics</h2>
        <div className="flex space-x-2">
          {['today', 'week', 'month'].map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(range)}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Revenue {timeRange === 'today' ? 'Today' : `This ${timeRange}`}</p>
              <p className="text-3xl font-bold text-gray-900">
                £{timeRange === 'today' ? analyticsData.revenue.today : 
                   timeRange === 'week' ? analyticsData.revenue.thisWeek : 
                   analyticsData.revenue.thisMonth}
              </p>
              <div className="flex items-center mt-2">
                {getChangeIcon(analyticsData.trends.revenue)}
                <span className={`ml-1 text-sm font-medium ${getChangeColor(analyticsData.trends.revenue)}`}>
                  {analyticsData.trends.revenue}
                </span>
                <span className="text-sm text-gray-500 ml-1">vs last {timeRange}</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        {/* Customers */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Customers</p>
              <p className="text-3xl font-bold text-gray-900">{analyticsData.customers.total}</p>
              <div className="flex items-center mt-2">
                {getChangeIcon(analyticsData.trends.customers)}
                <span className={`ml-1 text-sm font-medium ${getChangeColor(analyticsData.trends.customers)}`}>
                  {analyticsData.trends.customers}
                </span>
                <span className="text-sm text-gray-500 ml-1">new customers</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        {/* Active Repairs */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Repairs</p>
              <p className="text-3xl font-bold text-gray-900">{analyticsData.repairs.inProgress}</p>
              <div className="flex items-center mt-2">
                {getChangeIcon(analyticsData.trends.repairs)}
                <span className={`ml-1 text-sm font-medium ${getChangeColor(analyticsData.trends.repairs)}`}>
                  {analyticsData.trends.repairs}
                </span>
                <span className="text-sm text-gray-500 ml-1">from yesterday</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Wrench className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>

        {/* Customer Satisfaction */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Satisfaction</p>
              <p className="text-3xl font-bold text-gray-900">{analyticsData.customers.satisfaction}<span className="text-lg text-gray-500">/5</span></p>
              <div className="flex items-center mt-2">
                {getChangeIcon(analyticsData.trends.satisfaction)}
                <span className={`ml-1 text-sm font-medium ${getChangeColor(analyticsData.trends.satisfaction)}`}>
                  {analyticsData.trends.satisfaction}
                </span>
                <span className="text-sm text-gray-500 ml-1">this month</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Technician Efficiency</span>
              <span className="text-sm font-medium">{analyticsData.performance.technicianEfficiency}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${analyticsData.performance.technicianEfficiency}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">First-Time Fix Rate</span>
              <span className="text-sm font-medium">{analyticsData.performance.firstTimeFixRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full" 
                style={{ width: `${analyticsData.performance.firstTimeFixRate}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Avg Response Time</span>
              <span className="text-sm font-medium">{analyticsData.performance.avgResponseTime}h</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Warranty Claims</span>
              <span className="text-sm font-medium">{analyticsData.performance.warrantyClaimRate}%</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Services</h3>
          <div className="space-y-3">
            {topServices.map((service, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{service.name}</p>
                  <p className="text-xs text-gray-600">{service.count} repairs • £{service.revenue}</p>
                </div>
                <div className="flex items-center">
                  {getChangeIcon(service.trend)}
                  <span className={`ml-1 text-xs font-medium ${getChangeColor(service.trend)}`}>
                    {service.trend}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentRepairs.map((repair) => (
              <div key={repair.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{repair.customer}</p>
                  <p className="text-xs text-gray-600">{repair.device} • {repair.id}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">£{repair.value}</p>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    repair.status === 'completed' ? 'bg-green-100 text-green-800' :
                    repair.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    repair.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {repair.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button variant="outline" className="flex items-center justify-center p-4 h-auto">
            <div className="text-center">
              <Calendar className="w-6 h-6 mx-auto mb-2 text-blue-600" />
              <span className="text-sm">Schedule</span>
            </div>
          </Button>
          <Button variant="outline" className="flex items-center justify-center p-4 h-auto">
            <div className="text-center">
              <Users className="w-6 h-6 mx-auto mb-2 text-green-600" />
              <span className="text-sm">Customers</span>
            </div>
          </Button>
          <Button variant="outline" className="flex items-center justify-center p-4 h-auto">
            <div className="text-center">
              <Target className="w-6 h-6 mx-auto mb-2 text-purple-600" />
              <span className="text-sm">Reports</span>
            </div>
          </Button>
          <Button variant="outline" className="flex items-center justify-center p-4 h-auto">
            <div className="text-center">
              <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-orange-600" />
              <span className="text-sm">Alerts</span>
            </div>
          </Button>
        </div>
      </Card>

      {/* Alerts & Notifications */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Alerts</h3>
        <div className="space-y-3">
          <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800">Low Stock Alert</p>
              <p className="text-xs text-yellow-600">iPhone 14 Pro screens running low (3 remaining)</p>
            </div>
          </div>
          <div className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Clock className="w-5 h-5 text-blue-600 mr-3" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-800">Overdue Repair</p>
              <p className="text-xs text-blue-600">REP_003 - Samsung S23 water damage repair is 2 days overdue</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}