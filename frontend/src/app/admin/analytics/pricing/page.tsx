'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calculator, 
  Target,
  Calendar,
  Download,
  RefreshCw,
  Filter,
  Users,
  Wrench,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

interface PricingAnalytics {
  overview: {
    totalRules: number;
    activeRules: number;
    avgBasePrice: number;
    avgFinalPrice: number;
    priceVariance: number;
    mostCommonRepairType: string;
  };
  trends: {
    period: string;
    priceChanges: number;
    demandChanges: number;
    seasonalImpact: number;
  };
  distribution: {
    byRepairType: Array<{ type: string; count: number; avgPrice: number }>;
    byBrand: Array<{ brand: string; count: number; avgPrice: number }>;
    byPriceRange: Array<{ range: string; count: number; percentage: number }>;
  };
  performance: {
    topPerformingRules: Array<{ id: string; deviceModel: string; repairType: string; efficiency: number }>;
    underperformingRules: Array<{ id: string; deviceModel: string; repairType: string; issues: string[] }>;
  };
  forecasting: {
    nextQuarterTrends: Array<{ month: string; predictedDemand: number; suggestedPricing: number }>;
    recommendations: Array<{ type: string; description: string; impact: string; priority: 'high' | 'medium' | 'low' }>;
  };
}

export default function PricingAnalyticsPage() {
  const [analytics, setAnalytics] = useState<PricingAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('30d');
  const [category, setCategory] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch analytics data
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        timeRange,
        category: category !== 'all' ? category : '',
      });

      const response = await fetch(`/api/pricing/analytics?${params}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Failed to load pricing analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load and refresh on filter changes
  useEffect(() => {
    fetchAnalytics();
  }, [timeRange, category]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
  };

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/pricing/analytics/export?timeRange=${timeRange}&category=${category}`);
      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pricing-analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  if (loading && !analytics) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-neutral-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-neutral-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 bg-neutral-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-neutral-700 mb-2">Analytics Unavailable</h3>
          <p className="text-neutral-600 mb-4">{error}</p>
          <Button onClick={fetchAnalytics} className="bg-trust-500 hover:bg-trust-700 text-white">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Pricing Analytics</h1>
          <p className="text-neutral-600 mt-2">
            Comprehensive insights into pricing performance and market trends
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
          >
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-neutral-500" />
            <Select value={timeRange} onValueChange={setTimeRange}>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 3 months</option>
              <option value="1y">Last year</option>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-neutral-500" />
            <Select value={category} onValueChange={setCategory}>
              <option value="all">All Categories</option>
              <option value="smartphones">Smartphones</option>
              <option value="tablets">Tablets</option>
              <option value="laptops">Laptops</option>
              <option value="gaming">Gaming Consoles</option>
            </Select>
          </div>
        </div>
      </Card>

      {analytics && (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Total Rules</p>
                  <p className="text-2xl font-bold text-neutral-900">{analytics.overview.totalRules}</p>
                  <p className="text-xs text-neutral-500 mt-1">
                    {analytics.overview.activeRules} active
                  </p>
                </div>
                <div className="w-12 h-12 bg-trust-100 rounded-lg flex items-center justify-center">
                  <Calculator className="w-6 h-6 text-trust-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Avg Base Price</p>
                  <p className="text-2xl font-bold text-neutral-900">
                    {formatCurrency(analytics.overview.avgBasePrice)}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    <TrendingUp className="w-3 h-3 inline mr-1" />
                    {formatPercentage(5.2)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-professional-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-professional-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Avg Final Price</p>
                  <p className="text-2xl font-bold text-neutral-900">
                    {formatCurrency(analytics.overview.avgFinalPrice)}
                  </p>
                  <p className="text-xs text-orange-600 mt-1">
                    <TrendingDown className="w-3 h-3 inline mr-1" />
                    {formatPercentage(-2.1)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Price Variance</p>
                  <p className="text-2xl font-bold text-neutral-900">
                    {formatPercentage(analytics.overview.priceVariance)}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    {analytics.overview.mostCommonRepairType}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Repair Type Distribution */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                Distribution by Repair Type
              </h3>
              <div className="space-y-4">
                {analytics.distribution.byRepairType.map((item, index) => (
                  <div key={item.type} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full bg-trust-${500 + (index * 100)}`}></div>
                      <span className="text-sm font-medium text-neutral-700">
                        {item.type.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-neutral-900">
                        {formatCurrency(item.avgPrice)}
                      </div>
                      <div className="text-xs text-neutral-500">{item.count} rules</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Brand Performance */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                Performance by Brand
              </h3>
              <div className="space-y-4">
                {analytics.distribution.byBrand.map((item, index) => (
                  <div key={item.brand} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full bg-professional-${500 + (index * 100)}`}></div>
                      <span className="text-sm font-medium text-neutral-700">{item.brand}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-neutral-900">
                        {formatCurrency(item.avgPrice)}
                      </div>
                      <div className="text-xs text-neutral-500">{item.count} rules</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Performance Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performing Rules */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center">
                <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
                Top Performing Rules
              </h3>
              <div className="space-y-3">
                {analytics.performance.topPerformingRules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <div className="font-medium text-neutral-900">{rule.deviceModel}</div>
                      <div className="text-sm text-neutral-600">{rule.repairType}</div>
                    </div>
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                      {rule.efficiency}% efficient
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>

            {/* Underperforming Rules */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center">
                <AlertTriangle className="w-5 h-5 text-orange-500 mr-2" />
                Needs Attention
              </h3>
              <div className="space-y-3">
                {analytics.performance.underperformingRules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div>
                      <div className="font-medium text-neutral-900">{rule.deviceModel}</div>
                      <div className="text-sm text-neutral-600">{rule.repairType}</div>
                      <div className="text-xs text-orange-600 mt-1">
                        {rule.issues.join(', ')}
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
                      Review
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Recommendations */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              AI-Powered Recommendations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analytics.forecasting.recommendations.map((rec, index) => (
                <div key={index} className="p-4 border border-neutral-200 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <Badge 
                      variant={rec.priority === 'high' ? 'default' : rec.priority === 'medium' ? 'secondary' : 'outline'}
                      className={
                        rec.priority === 'high' ? 'bg-red-100 text-red-800 border-red-200' :
                        rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                        'bg-neutral-100 text-neutral-600 border-neutral-200'
                      }
                    >
                      {rec.priority} priority
                    </Badge>
                  </div>
                  <div className="font-medium text-neutral-900 mb-1">{rec.type}</div>
                  <div className="text-sm text-neutral-600 mb-2">{rec.description}</div>
                  <div className="text-xs text-professional-600 font-medium">
                    Expected Impact: {rec.impact}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}