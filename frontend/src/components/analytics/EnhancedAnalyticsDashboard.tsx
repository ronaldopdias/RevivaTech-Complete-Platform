/**
 * Enhanced Analytics Dashboard with Customer Journey Integration
 * Combines existing business metrics with new journey mapping and funnel analysis
 */

'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  ShoppingCart, 
  Eye,
  Clock,
  Target,
  BarChart3,
  PieChart,
  LineChart,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Download,
  RefreshCw,
  MapPin,
  Zap,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

// Import our new journey components
import CustomerJourneyMapComponent from './CustomerJourneyMap';
import ConversionFunnelAnalysis from './ConversionFunnelAnalysis';
import { journeyAnalytics, CustomerJourneyMap } from '../../services/journeyAnalytics';

interface EnhancedAnalyticsDashboardProps {
  initialDateRange?: {
    startDate: Date;
    endDate: Date;
  };
}

interface DashboardMetrics {
  totalRevenue: number;
  revenueChange: number;
  totalOrders: number;
  ordersChange: number;
  conversionRate: number;
  conversionChange: number;
  averageOrderValue: number;
  aovChange: number;
  websiteTraffic: number;
  trafficChange: number;
  customerRetention: number;
  retentionChange: number;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

function MetricCard({ title, value, change, changeType, icon: Icon, description }: MetricCardProps) {
  const getChangeColor = () => {
    switch (changeType) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getChangeIcon = () => {
    switch (changeType) {
      case 'positive': return <ArrowUpRight className="w-4 h-4" />;
      case 'negative': return <ArrowDownRight className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className={`flex items-center text-xs ${getChangeColor()}`}>
          {getChangeIcon()}
          <span className="ml-1">
            {change > 0 ? '+' : ''}{change.toFixed(1)}% from last period
          </span>
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

const EnhancedAnalyticsDashboard: React.FC<EnhancedAnalyticsDashboardProps> = ({
  initialDateRange
}) => {
  const [dateRange, setDateRange] = useState(
    initialDateRange || {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date()
    }
  );
  
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedJourney, setSelectedJourney] = useState<CustomerJourneyMap | null>(null);
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch dashboard metrics
  useEffect(() => {
    const fetchDashboardMetrics = async () => {
      try {
        setIsLoading(true);
        
        // Simulate fetching business metrics
        // In a real implementation, this would call your business metrics API
        const metrics: DashboardMetrics = {
          totalRevenue: 125000,
          revenueChange: 12.5,
          totalOrders: 342,
          ordersChange: 8.2,
          conversionRate: 3.4,
          conversionChange: -0.3,
          averageOrderValue: 365.50,
          aovChange: 4.1,
          websiteTraffic: 12500,
          trafficChange: 15.7,
          customerRetention: 68.5,
          retentionChange: 2.3
        };

        setDashboardMetrics(metrics);
      } catch (error) {
        console.error('Failed to fetch dashboard metrics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardMetrics();
  }, [dateRange]);

  const handleDateRangeChange = (field: 'startDate' | 'endDate', value: string) => {
    setDateRange(prev => ({
      ...prev,
      [field]: new Date(value)
    }));
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Trigger refresh of all components
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const handleJourneySelect = (journey: CustomerJourneyMap) => {
    setSelectedJourney(journey);
    setActiveTab('journey-individual');
  };

  const renderOverviewTab = () => {
    if (!dashboardMetrics) return null;

    return (
      <div className="space-y-6">
        {/* Key Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Revenue"
            value={`$${dashboardMetrics.totalRevenue.toLocaleString()}`}
            change={dashboardMetrics.revenueChange}
            changeType="positive"
            icon={DollarSign}
            description="Total revenue for selected period"
          />
          <MetricCard
            title="Total Orders"
            value={dashboardMetrics.totalOrders.toLocaleString()}
            change={dashboardMetrics.ordersChange}
            changeType="positive"
            icon={ShoppingCart}
            description="Number of completed bookings"
          />
          <MetricCard
            title="Conversion Rate"
            value={`${dashboardMetrics.conversionRate}%`}
            change={dashboardMetrics.conversionChange}
            changeType="negative"
            icon={Target}
            description="Visitors to booking completion"
          />
          <MetricCard
            title="Avg Order Value"
            value={`$${dashboardMetrics.averageOrderValue.toFixed(2)}`}
            change={dashboardMetrics.aovChange}
            changeType="positive"
            icon={TrendingUp}
            description="Average booking value"
          />
        </div>

        {/* Secondary Metrics */}
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            title="Website Traffic"
            value={dashboardMetrics.websiteTraffic.toLocaleString()}
            change={dashboardMetrics.trafficChange}
            changeType="positive"
            icon={Eye}
            description="Unique visitors"
          />
          <MetricCard
            title="Customer Retention"
            value={`${dashboardMetrics.customerRetention}%`}
            change={dashboardMetrics.retentionChange}
            changeType="positive"
            icon={Users}
            description="Returning customers"
          />
          <MetricCard
            title="Performance Score"
            value="A+"
            change={5.2}
            changeType="positive"
            icon={CheckCircle}
            description="Overall business health"
          />
        </div>

        {/* Quick Journey Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Quick Journey Insights
            </CardTitle>
            <CardDescription>
              High-level overview of customer journey performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">85%</div>
                <div className="text-sm text-gray-600">Land on homepage</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">42%</div>
                <div className="text-sm text-gray-600">View pricing</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">12%</div>
                <div className="text-sm text-gray-600">Complete booking</div>
              </div>
            </div>
            <div className="mt-4 flex justify-center">
              <Button 
                variant="outline" 
                onClick={() => setActiveTab('journey-map')}
                className="flex items-center"
              >
                <MapPin className="w-4 h-4 mr-2" />
                View Full Journey Map
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive business intelligence and customer journey insights
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Date Range Selectors */}
          <div className="flex space-x-2">
            <input
              type="date"
              value={dateRange.startDate.toISOString().split('T')[0]}
              onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
            <input
              type="date"
              value={dateRange.endDate.toISOString().split('T')[0]}
              onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          
          {/* Action Buttons */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="journey-map">Journey Map</TabsTrigger>
          <TabsTrigger value="funnel-analysis">Funnel Analysis</TabsTrigger>
          <TabsTrigger value="journey-individual">Individual Journeys</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {renderOverviewTab()}
        </TabsContent>

        <TabsContent value="journey-map" className="space-y-4">
          <CustomerJourneyMapComponent
            dateRange={dateRange}
            selectedJourney={selectedJourney}
            onJourneySelect={handleJourneySelect}
          />
        </TabsContent>

        <TabsContent value="funnel-analysis" className="space-y-4">
          <ConversionFunnelAnalysis
            dateRange={dateRange}
            selectedSegment="all"
          />
        </TabsContent>

        <TabsContent value="journey-individual" className="space-y-4">
          {selectedJourney ? (
            <CustomerJourneyMapComponent
              dateRange={dateRange}
              selectedJourney={selectedJourney}
              onJourneySelect={handleJourneySelect}
            />
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Journey Selected</h3>
                  <p className="text-gray-500 mb-4">
                    Select a customer journey from the Journey Map tab to view detailed analysis.
                  </p>
                  <Button onClick={() => setActiveTab('journey-map')}>
                    Go to Journey Map
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="optimization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="w-5 h-5 mr-2" />
                Optimization Opportunities
              </CardTitle>
              <CardDescription>
                AI-powered recommendations to improve conversion rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-4 bg-red-50 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-800">High Drop-off at Pricing Stage</h4>
                    <p className="text-sm text-red-600 mt-1">
                      58% of users drop off when viewing pricing. Consider clearer pricing display.
                    </p>
                    <Button size="sm" variant="outline" className="mt-2">
                      View Details
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-4 bg-yellow-50 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Mobile Conversion Issues</h4>
                    <p className="text-sm text-yellow-600 mt-1">
                      Mobile users convert 40% less than desktop. Check mobile UX.
                    </p>
                    <Button size="sm" variant="outline" className="mt-2">
                      View Details
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-800">Strong Homepage Performance</h4>
                    <p className="text-sm text-green-600 mt-1">
                      Homepage has 85% engagement rate. Consider applying similar design patterns.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Scheduled Reports
              </CardTitle>
              <CardDescription>
                Automated reports and data exports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Weekly Journey Analysis</h4>
                    <p className="text-sm text-gray-500">Every Monday at 9:00 AM</p>
                  </div>
                  <Badge variant="secondary">Active</Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Monthly Conversion Report</h4>
                    <p className="text-sm text-gray-500">First day of each month</p>
                  </div>
                  <Badge variant="secondary">Active</Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Optimization Insights</h4>
                    <p className="text-sm text-gray-500">Bi-weekly recommendations</p>
                  </div>
                  <Badge variant="outline">Paused</Badge>
                </div>
              </div>
              
              <div className="mt-6">
                <Button className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Create New Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedAnalyticsDashboard;