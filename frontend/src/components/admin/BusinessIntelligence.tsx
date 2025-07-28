'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface KPIData {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  category: 'financial' | 'operational' | 'customer' | 'growth';
  priority: 'high' | 'medium' | 'low';
  description: string;
}

interface BusinessIntelligenceProps {
  className?: string;
}

const kpiData: KPIData[] = [
  // Financial KPIs
  {
    id: 'revenue_growth',
    name: 'Revenue Growth Rate',
    value: 24.8,
    target: 20.0,
    unit: '%',
    trend: 'up',
    category: 'financial',
    priority: 'high',
    description: 'Month-over-month revenue growth rate'
  },
  {
    id: 'gross_margin',
    name: 'Gross Profit Margin',
    value: 68.5,
    target: 65.0,
    unit: '%',
    trend: 'up',
    category: 'financial',
    priority: 'high',
    description: 'Gross profit as percentage of revenue'
  },
  {
    id: 'customer_acquisition_cost',
    name: 'Customer Acquisition Cost',
    value: 42,
    target: 50,
    unit: '£',
    trend: 'down',
    category: 'financial',
    priority: 'medium',
    description: 'Average cost to acquire a new customer'
  },
  {
    id: 'arpu',
    name: 'Average Revenue Per User',
    value: 156,
    target: 150,
    unit: '£',
    trend: 'up',
    category: 'financial',
    priority: 'medium',
    description: 'Average revenue generated per customer'
  },

  // Operational KPIs
  {
    id: 'repair_completion_time',
    name: 'Avg Repair Completion Time',
    value: 2.8,
    target: 3.0,
    unit: 'days',
    trend: 'down',
    category: 'operational',
    priority: 'high',
    description: 'Average time from booking to completion'
  },
  {
    id: 'technician_utilization',
    name: 'Technician Utilization Rate',
    value: 89.2,
    target: 85.0,
    unit: '%',
    trend: 'up',
    category: 'operational',
    priority: 'high',
    description: 'Percentage of productive technician time'
  },
  {
    id: 'first_time_fix_rate',
    name: 'First Time Fix Rate',
    value: 94.1,
    target: 90.0,
    unit: '%',
    trend: 'up',
    category: 'operational',
    priority: 'medium',
    description: 'Repairs completed without return visits'
  },
  {
    id: 'parts_availability',
    name: 'Parts Availability Rate',
    value: 96.8,
    target: 95.0,
    unit: '%',
    trend: 'stable',
    category: 'operational',
    priority: 'medium',
    description: 'Percentage of required parts in stock'
  },

  // Customer KPIs
  {
    id: 'customer_satisfaction',
    name: 'Customer Satisfaction Score',
    value: 4.8,
    target: 4.5,
    unit: '/5',
    trend: 'up',
    category: 'customer',
    priority: 'high',
    description: 'Average customer rating score'
  },
  {
    id: 'nps_score',
    name: 'Net Promoter Score',
    value: 68,
    target: 60,
    unit: '',
    trend: 'up',
    category: 'customer',
    priority: 'high',
    description: 'Customer loyalty and recommendation metric'
  },
  {
    id: 'customer_retention_rate',
    name: 'Customer Retention Rate',
    value: 87.3,
    target: 85.0,
    unit: '%',
    trend: 'up',
    category: 'customer',
    priority: 'medium',
    description: 'Percentage of customers returning for services'
  },
  {
    id: 'support_response_time',
    name: 'Support Response Time',
    value: 18,
    target: 30,
    unit: 'min',
    trend: 'down',
    category: 'customer',
    priority: 'medium',
    description: 'Average time to first customer response'
  },

  // Growth KPIs
  {
    id: 'new_customer_growth',
    name: 'New Customer Growth',
    value: 18.2,
    target: 15.0,
    unit: '%',
    trend: 'up',
    category: 'growth',
    priority: 'high',
    description: 'Monthly new customer acquisition rate'
  },
  {
    id: 'market_share',
    name: 'Local Market Share',
    value: 12.4,
    target: 15.0,
    unit: '%',
    trend: 'up',
    category: 'growth',
    priority: 'medium',
    description: 'Estimated share of local repair market'
  },
  {
    id: 'service_expansion',
    name: 'Service Line Growth',
    value: 3,
    target: 5,
    unit: 'new',
    trend: 'stable',
    category: 'growth',
    priority: 'low',
    description: 'Number of new service offerings launched'
  },
  {
    id: 'referral_rate',
    name: 'Customer Referral Rate',
    value: 23.5,
    target: 20.0,
    unit: '%',
    trend: 'up',
    category: 'growth',
    priority: 'medium',
    description: 'Percentage of customers who refer others'
  }
];

export const BusinessIntelligence: React.FC<BusinessIntelligenceProps> = ({
  className
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All KPIs', icon: '📊' },
    { id: 'financial', label: 'Financial', icon: '💰' },
    { id: 'operational', label: 'Operational', icon: '⚙️' },
    { id: 'customer', label: 'Customer', icon: '👥' },
    { id: 'growth', label: 'Growth', icon: '📈' }
  ];

  const priorities = [
    { id: 'all', label: 'All Priorities' },
    { id: 'high', label: 'High Priority' },
    { id: 'medium', label: 'Medium Priority' },
    { id: 'low', label: 'Low Priority' }
  ];

  const filteredKPIs = kpiData.filter(kpi => 
    (selectedCategory === 'all' || kpi.category === selectedCategory) &&
    (selectedPriority === 'all' || kpi.priority === selectedPriority)
  );

  const getPerformanceStatus = (value: number, target: number, trend: string) => {
    const performance = (value / target) * 100;
    if (performance >= 100) return 'excellent';
    if (performance >= 90) return 'good';
    if (performance >= 80) return 'warning';
    return 'poor';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-50 border-green-200';
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'warning': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'poor': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      default: return '➡️';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Business Intelligence Dashboard</h2>
          <p className="text-muted-foreground">
            Key Performance Indicators and strategic metrics
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="text-sm"
              >
                <span className="mr-1">{category.icon}</span>
                {category.label}
              </Button>
            ))}
          </div>

          <div className="flex gap-2 ml-auto">
            {priorities.map((priority) => (
              <Button
                key={priority.id}
                variant={selectedPriority === priority.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPriority(priority.id)}
                className="text-xs"
              >
                {priority.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">KPIs On Target</p>
                <p className="text-2xl font-bold text-green-900">
                  {kpiData.filter(kpi => getPerformanceStatus(kpi.value, kpi.target, kpi.trend) === 'excellent').length}
                </p>
              </div>
              <div className="text-2xl">🎯</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-800">Need Attention</p>
                <p className="text-2xl font-bold text-orange-900">
                  {kpiData.filter(kpi => getPerformanceStatus(kpi.value, kpi.target, kpi.trend) === 'warning').length}
                </p>
              </div>
              <div className="text-2xl">⚠️</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">Trending Up</p>
                <p className="text-2xl font-bold text-blue-900">
                  {kpiData.filter(kpi => kpi.trend === 'up').length}
                </p>
              </div>
              <div className="text-2xl">📈</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-800">High Priority</p>
                <p className="text-2xl font-bold text-purple-900">
                  {kpiData.filter(kpi => kpi.priority === 'high').length}
                </p>
              </div>
              <div className="text-2xl">🔥</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredKPIs.map((kpi) => {
          const status = getPerformanceStatus(kpi.value, kpi.target, kpi.trend);
          const performance = (kpi.value / kpi.target) * 100;
          
          return (
            <Card key={kpi.id} className={cn('border', getStatusColor(status))}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm font-medium">
                    {kpi.name}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <span className={cn(
                      'px-2 py-1 text-xs font-medium rounded',
                      getPriorityBadge(kpi.priority)
                    )}>
                      {kpi.priority}
                    </span>
                    <span className="text-lg">{getTrendIcon(kpi.trend)}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-2xl font-bold">
                        {kpi.value}{kpi.unit}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Target: {kpi.target}{kpi.unit}
                      </div>
                    </div>
                    <div className={cn(
                      'text-xs font-medium px-2 py-1 rounded',
                      performance >= 100 ? 'bg-green-100 text-green-800' :
                      performance >= 90 ? 'bg-blue-100 text-blue-800' :
                      performance >= 80 ? 'bg-orange-100 text-orange-800' :
                      'bg-red-100 text-red-800'
                    )}>
                      {performance.toFixed(0)}%
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={cn(
                        'h-2 rounded-full transition-all',
                        performance >= 100 ? 'bg-green-500' :
                        performance >= 90 ? 'bg-blue-500' :
                        performance >= 80 ? 'bg-orange-500' :
                        'bg-red-500'
                      )}
                      style={{ width: `${Math.min(performance, 100)}%` }}
                    />
                  </div>
                  
                  <CardDescription className="text-xs">
                    {kpi.description}
                  </CardDescription>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Strategic Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <span className="mr-2">🧠</span>
            Strategic Insights & Recommendations
          </CardTitle>
          <CardDescription>
            AI-powered analysis of your KPI performance and actionable recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-green-800">Strengths</h4>
              <div className="space-y-3">
                <div className="border-l-4 border-green-500 pl-3">
                  <p className="text-sm font-medium">Exceptional Customer Satisfaction</p>
                  <p className="text-xs text-muted-foreground">
                    4.8/5 rating exceeds target by 6.7%. Consider leveraging for marketing.
                  </p>
                </div>
                <div className="border-l-4 border-green-500 pl-3">
                  <p className="text-sm font-medium">Revenue Growth Momentum</p>
                  <p className="text-xs text-muted-foreground">
                    24.8% growth rate significantly exceeds 20% target. Scale operations to maintain.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-orange-800">Improvement Areas</h4>
              <div className="space-y-3">
                <div className="border-l-4 border-orange-500 pl-3">
                  <p className="text-sm font-medium">Market Share Growth</p>
                  <p className="text-xs text-muted-foreground">
                    12.4% vs 15% target. Increase marketing spend and service expansion.
                  </p>
                </div>
                <div className="border-l-4 border-orange-500 pl-3">
                  <p className="text-sm font-medium">Service Line Expansion</p>
                  <p className="text-xs text-muted-foreground">
                    Only 3 new services vs 5 target. Explore emerging repair categories.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessIntelligence;