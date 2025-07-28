'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Users, 
  PoundSterling, 
  Clock, 
  Star,
  AlertTriangle,
  CheckCircle,
  BrainCircuit,
  Zap,
  Target,
  Calendar,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface BusinessMetrics {
  revenue: {
    current: number;
    previous: number;
    growth: number;
    forecast: number;
  };
  repairs: {
    completed: number;
    pending: number;
    average_time: number;
    success_rate: number;
  };
  customers: {
    total: number;
    new: number;
    returning: number;
    satisfaction: number;
  };
  efficiency: {
    technician_utilization: number;
    queue_optimization: number;
    cost_efficiency: number;
    quality_score: number;
  };
}

interface TrendData {
  date: string;
  revenue: number;
  repairs: number;
  satisfaction: number;
  efficiency: number;
}

interface DeviceInsight {
  device: string;
  count: number;
  avgRepairTime: number;
  avgCost: number;
  successRate: number;
  profitMargin: number;
  trend: 'up' | 'down' | 'stable';
}

interface PredictiveInsight {
  type: 'opportunity' | 'risk' | 'optimization' | 'trend';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  actionable: boolean;
  recommendations: string[];
}

interface AdvancedBusinessIntelligenceProps {
  timeRange: '7d' | '30d' | '90d' | '1y';
  onTimeRangeChange?: (range: string) => void;
  showPredictions?: boolean;
  showDetailedInsights?: boolean;
  className?: string;
}

export default function AdvancedBusinessIntelligence({
  timeRange = '30d',
  onTimeRangeChange,
  showPredictions = true,
  showDetailedInsights = true,
  className = ''
}: AdvancedBusinessIntelligenceProps) {
  const [metrics, setMetrics] = useState<BusinessMetrics | null>(null);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [deviceInsights, setDeviceInsights] = useState<DeviceInsight[]>([]);
  const [predictiveInsights, setPredictiveInsights] = useState<PredictiveInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInsight, setSelectedInsight] = useState<PredictiveInsight | null>(null);

  // Mock advanced analytics data
  const generateBusinessMetrics = (): BusinessMetrics => {
    return {
      revenue: {
        current: 12450,
        previous: 10800,
        growth: 15.3,
        forecast: 14200
      },
      repairs: {
        completed: 89,
        pending: 12,
        average_time: 42,
        success_rate: 96.8
      },
      customers: {
        total: 234,
        new: 45,
        returning: 44,
        satisfaction: 4.7
      },
      efficiency: {
        technician_utilization: 87.5,
        queue_optimization: 92.3,
        cost_efficiency: 78.9,
        quality_score: 94.2
      }
    };
  };

  const generateTrendData = (): TrendData[] => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    const data: TrendData[] = [];
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      data.push({
        date: date.toISOString().split('T')[0],
        revenue: Math.floor(Math.random() * 500) + 200,
        repairs: Math.floor(Math.random() * 8) + 2,
        satisfaction: 4.2 + Math.random() * 0.8,
        efficiency: 75 + Math.random() * 20
      });
    }
    
    return data;
  };

  const generateDeviceInsights = (): DeviceInsight[] => {
    return [
      {
        device: 'iPhone',
        count: 34,
        avgRepairTime: 38,
        avgCost: 125,
        successRate: 98.2,
        profitMargin: 65.8,
        trend: 'up'
      },
      {
        device: 'MacBook',
        count: 18,
        avgRepairTime: 52,
        avgCost: 189,
        successRate: 94.4,
        profitMargin: 71.2,
        trend: 'stable'
      },
      {
        device: 'Samsung',
        count: 22,
        avgRepairTime: 35,
        avgCost: 98,
        successRate: 96.8,
        profitMargin: 58.3,
        trend: 'up'
      },
      {
        device: 'iPad',
        count: 15,
        avgRepairTime: 41,
        avgCost: 135,
        successRate: 97.1,
        profitMargin: 62.4,
        trend: 'down'
      }
    ];
  };

  const generatePredictiveInsights = (): PredictiveInsight[] => {
    return [
      {
        type: 'opportunity',
        title: 'Peak Season Revenue Opportunity',
        description: 'ML models predict 23% increase in iPhone screen repairs in next 2 weeks due to back-to-school season.',
        impact: 'high',
        confidence: 87,
        actionable: true,
        recommendations: [
          'Increase iPhone screen inventory by 30%',
          'Schedule additional technician hours',
          'Launch targeted marketing campaign'
        ]
      },
      {
        type: 'risk',
        title: 'MacBook Repair Complexity Trend',
        description: 'Recent MacBook repairs showing 15% longer completion times, potentially impacting customer satisfaction.',
        impact: 'medium',
        confidence: 92,
        actionable: true,
        recommendations: [
          'Provide advanced MacBook training to technicians',
          'Review diagnostic procedures for efficiency',
          'Consider specialized MacBook repair station'
        ]
      },
      {
        type: 'optimization',
        title: 'Queue Management Enhancement',
        description: 'AI analysis suggests optimizing repair queue could reduce average wait time by 18 minutes.',
        impact: 'medium',
        confidence: 84,
        actionable: true,
        recommendations: [
          'Implement priority-based queue system',
          'Balance workload across technicians',
          'Introduce express repair tier for simple fixes'
        ]
      },
      {
        type: 'trend',
        title: 'Customer Satisfaction Pattern',
        description: 'Data shows correlation between repair time communication and 0.3 point satisfaction increase.',
        impact: 'low',
        confidence: 78,
        actionable: true,
        recommendations: [
          'Implement real-time progress updates',
          'Send proactive communication messages',
          'Train staff on expectation management'
        ]
      }
    ];
  };

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    
    // Simulate API delay for realistic loading
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setMetrics(generateBusinessMetrics());
    setTrendData(generateTrendData());
    setDeviceInsights(generateDeviceInsights());
    setPredictiveInsights(generatePredictiveInsights());
    
    setIsLoading(false);
  };

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getGrowthIcon = (growth: number) => {
    return growth > 0 ? (
      <TrendingUp className="w-4 h-4 text-green-500" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-500" />
    );
  };

  const getGrowthColor = (growth: number): string => {
    return growth > 0 ? 'text-green-600' : 'text-red-600';
  };

  const getInsightIcon = (type: string) => {
    const icons = {
      opportunity: <TrendingUp className="w-5 h-5 text-green-500" />,
      risk: <AlertTriangle className="w-5 h-5 text-orange-500" />,
      optimization: <Zap className="w-5 h-5 text-blue-500" />,
      trend: <BarChart3 className="w-5 h-5 text-purple-500" />
    };
    return icons[type as keyof typeof icons];
  };

  const getImpactColor = (impact: string): string => {
    const colors = {
      low: 'text-blue-600 bg-blue-100',
      medium: 'text-yellow-600 bg-yellow-100',
      high: 'text-orange-600 bg-orange-100',
      critical: 'text-red-600 bg-red-100'
    };
    return colors[impact as keyof typeof colors] || colors.medium;
  };

  if (isLoading || !metrics) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center animate-pulse">
              <BrainCircuit className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Business Intelligence Loading</h3>
              <p className="text-sm text-gray-600">Processing advanced analytics...</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 h-20 rounded"></div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            <BrainCircuit className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Business Intelligence Dashboard</h2>
            <p className="text-sm text-gray-600">AI-powered insights and analytics</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <select 
            value={timeRange} 
            onChange={(e) => onTimeRangeChange?.(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          
          <Button variant="outline" size="sm" onClick={loadAnalyticsData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <PoundSterling className="w-5 h-5 text-green-600" />
              <span className="font-medium text-gray-700">Revenue</span>
            </div>
            {getGrowthIcon(metrics.revenue.growth)}
          </div>
          <div className="text-2xl font-bold text-gray-800">
            {formatCurrency(metrics.revenue.current)}
          </div>
          <div className={`text-sm ${getGrowthColor(metrics.revenue.growth)}`}>
            {metrics.revenue.growth > 0 ? '+' : ''}{metrics.revenue.growth}% vs previous
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Forecast: {formatCurrency(metrics.revenue.forecast)}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-gray-700">Repairs</span>
            </div>
            <div className="text-sm text-blue-600">{metrics.repairs.success_rate}%</div>
          </div>
          <div className="text-2xl font-bold text-gray-800">
            {metrics.repairs.completed}
          </div>
          <div className="text-sm text-gray-600">
            {metrics.repairs.pending} pending
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Avg: {metrics.repairs.average_time}min
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-purple-600" />
              <span className="font-medium text-gray-700">Customers</span>
            </div>
            <Star className="w-4 h-4 text-yellow-500" />
          </div>
          <div className="text-2xl font-bold text-gray-800">
            {metrics.customers.total}
          </div>
          <div className="text-sm text-gray-600">
            {metrics.customers.new} new, {metrics.customers.returning} returning
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {metrics.customers.satisfaction}/5 satisfaction
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-orange-600" />
              <span className="font-medium text-gray-700">Efficiency</span>
            </div>
            <div className="text-sm text-green-600">{metrics.efficiency.quality_score}%</div>
          </div>
          <div className="text-2xl font-bold text-gray-800">
            {metrics.efficiency.technician_utilization}%
          </div>
          <div className="text-sm text-gray-600">
            Utilization rate
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Queue: {metrics.efficiency.queue_optimization}%
          </div>
        </Card>
      </div>

      {/* Trend Analysis */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
          <BarChart3 className="w-5 h-5 text-blue-600 mr-2" />
          Performance Trends
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Revenue & Repairs Correlation</h4>
            <div className="h-32 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-700">+23% Revenue Growth</div>
                <div className="text-sm text-gray-600">Strong correlation with repair volume</div>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Efficiency Trends</h4>
            <div className="h-32 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-700">{metrics.efficiency.cost_efficiency}% Cost Efficiency</div>
                <div className="text-sm text-gray-600">Optimized operations performance</div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Device Insights */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
          <PieChart className="w-5 h-5 text-purple-600 mr-2" />
          Device Category Analysis
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="pb-3">Device</th>
                <th className="pb-3">Volume</th>
                <th className="pb-3">Avg Time</th>
                <th className="pb-3">Avg Cost</th>
                <th className="pb-3">Success Rate</th>
                <th className="pb-3">Profit Margin</th>
                <th className="pb-3">Trend</th>
              </tr>
            </thead>
            <tbody>
              {deviceInsights.map((insight, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="py-3 font-medium">{insight.device}</td>
                  <td className="py-3">{insight.count}</td>
                  <td className="py-3">{insight.avgRepairTime}min</td>
                  <td className="py-3">{formatCurrency(insight.avgCost)}</td>
                  <td className="py-3">
                    <span className="text-green-600">{insight.successRate}%</span>
                  </td>
                  <td className="py-3">
                    <span className="text-blue-600">{insight.profitMargin}%</span>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center">
                      {insight.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
                      {insight.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
                      {insight.trend === 'stable' && <div className="w-4 h-4 rounded-full bg-gray-400" />}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Predictive Insights */}
      {showPredictions && (
        <Card className="p-6">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
            <BrainCircuit className="w-5 h-5 text-purple-600 mr-2" />
            AI Predictive Insights
          </h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            {predictiveInsights.map((insight, index) => (
              <Card 
                key={index} 
                className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedInsight(insight)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {getInsightIcon(insight.type)}
                    <span className="font-medium text-gray-800">{insight.title}</span>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getImpactColor(insight.impact)}`}>
                    {insight.impact.toUpperCase()}
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
                
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    Confidence: {insight.confidence}%
                  </div>
                  {insight.actionable && (
                    <div className="text-xs text-blue-600 font-medium">
                      Actionable
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </Card>
      )}

      {/* Detailed Insight Modal */}
      {selectedInsight && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getInsightIcon(selectedInsight.type)}
                  <h3 className="text-lg font-semibold text-gray-800">{selectedInsight.title}</h3>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedInsight(null)}
                >
                  ×
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Analysis</h4>
                  <p className="text-gray-600">{selectedInsight.description}</p>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-800">{selectedInsight.confidence}%</div>
                    <div className="text-sm text-gray-600">Confidence</div>
                  </div>
                  <div className="text-center">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getImpactColor(selectedInsight.impact)}`}>
                      {selectedInsight.impact.toUpperCase()}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Impact Level</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Recommendations</h4>
                  <div className="space-y-2">
                    {selectedInsight.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <Zap className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-600">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex space-x-3 pt-4 border-t">
                  <Button className="flex-1">
                    Implement Recommendations
                  </Button>
                  <Button variant="outline" className="flex-1">
                    Schedule Review
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}