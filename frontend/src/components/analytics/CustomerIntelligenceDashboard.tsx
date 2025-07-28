/**
 * Customer Intelligence Dashboard Component
 * Real-time customer analytics and insights visualization
 * Part of Phase 8 R1 implementation
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CustomerIntelligenceService, 
  type CustomerProfile, 
  type CustomerInsight, 
  type RealtimeMetrics 
} from '@/lib/analytics';
import { 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  Target, 
  Activity, 
  Clock, 
  ShoppingCart,
  Eye,
  MousePointer,
  Smartphone,
  Monitor,
  Tablet
} from 'lucide-react';

interface CustomerIntelligenceDashboardProps {
  analyticsService: CustomerIntelligenceService;
  className?: string;
}

interface MetricCard {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<any>;
  color?: string;
}

const CustomerIntelligenceDashboard: React.FC<CustomerIntelligenceDashboardProps> = ({
  analyticsService,
  className = ''
}) => {
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile | null>(null);
  const [customerInsights, setCustomerInsights] = useState<CustomerInsight[]>([]);
  const [realtimeMetrics, setRealtimeMetrics] = useState<RealtimeMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
    
    // Set up real-time updates
    const interval = setInterval(loadDashboardData, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, [analyticsService]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load customer profile
      const profile = await analyticsService.loadCustomerProfile();
      setCustomerProfile(profile);
      
      // Load customer insights
      const insights = await analyticsService.getCustomerInsights();
      setCustomerInsights(insights);
      
      // Load real-time metrics
      const metrics = analyticsService.getRealtimeMetrics();
      setRealtimeMetrics(metrics);
      
      setError(null);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getMetricCards = (): MetricCard[] => {
    if (!realtimeMetrics) return [];
    
    return [
      {
        title: 'Active Users',
        value: realtimeMetrics.activeUsers,
        change: '+12%',
        changeType: 'positive',
        icon: Users,
        color: 'text-blue-600'
      },
      {
        title: 'Active Sessions',
        value: realtimeMetrics.activeSessions,
        change: '+8%',
        changeType: 'positive',
        icon: Activity,
        color: 'text-green-600'
      },
      {
        title: 'Events/Min',
        value: realtimeMetrics.eventsPerMinute,
        change: '+15%',
        changeType: 'positive',
        icon: TrendingUp,
        color: 'text-purple-600'
      },
      {
        title: 'Conversions',
        value: realtimeMetrics.conversions,
        change: '+3%',
        changeType: 'positive',
        icon: Target,
        color: 'text-orange-600'
      }
    ];
  };

  const getInsightPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getInsightTypeIcon = (type: string) => {
    switch (type) {
      case 'behavior': return <Eye className="w-4 h-4" />;
      case 'conversion': return <Target className="w-4 h-4" />;
      case 'risk': return <AlertTriangle className="w-4 h-4" />;
      case 'opportunity': return <TrendingUp className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case 'mobile': return <Smartphone className="w-4 h-4" />;
      case 'tablet': return <Tablet className="w-4 h-4" />;
      case 'desktop': return <Monitor className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading customer intelligence...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-8 ${className}`}>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">Error Loading Dashboard</span>
            </div>
            <p className="text-red-700 mt-2">{error}</p>
            <Button 
              onClick={loadDashboardData}
              className="mt-4"
              variant="outline"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customer Intelligence</h2>
          <p className="text-gray-600">Real-time customer analytics and behavioral insights</p>
        </div>
        <Button onClick={loadDashboardData} variant="outline" size="sm">
          <Activity className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {getMetricCards().map((metric, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                  {metric.change && (
                    <p className={`text-sm ${
                      metric.changeType === 'positive' ? 'text-green-600' : 
                      metric.changeType === 'negative' ? 'text-red-600' : 
                      'text-gray-600'
                    }`}>
                      {metric.change}
                    </p>
                  )}
                </div>
                <div className={`p-3 rounded-full bg-gray-100 ${metric.color}`}>
                  <metric.icon className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Dashboard Content */}
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Customer Profile</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="behavior">Behavior</TabsTrigger>
          <TabsTrigger value="realtime">Real-time</TabsTrigger>
        </TabsList>

        {/* Customer Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          {customerProfile ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Profile Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>Profile Overview</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Customer ID</p>
                      <p className="font-medium">{customerProfile.fingerprint.substring(0, 8)}...</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Segment</p>
                      <Badge variant="outline">{customerProfile.segment}</Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Device Type</p>
                      <div className="flex items-center space-x-1">
                        {getDeviceIcon(customerProfile.preferences.deviceType)}
                        <span className="text-sm">{customerProfile.preferences.deviceType}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Sessions</p>
                      <p className="font-medium">{customerProfile.totalSessions}</p>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Journey Stage</span>
                      <span className="text-sm font-medium">{customerProfile.journey.currentStage}</span>
                    </div>
                    <div className="space-y-2">
                      {customerProfile.journey.touchpoints.map((touchpoint, index) => (
                        <Badge key={index} variant="secondary" className="mr-2">
                          {touchpoint}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Scoring Dashboard */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="w-5 h-5" />
                    <span>AI Scoring</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600">Engagement Score</span>
                        <span className="text-sm font-medium">{customerProfile.engagement.score}/100</span>
                      </div>
                      <Progress value={customerProfile.engagement.score} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600">Lead Score</span>
                        <span className="text-sm font-medium">{customerProfile.conversion.leadScore}/100</span>
                      </div>
                      <Progress value={customerProfile.conversion.leadScore} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600">Conversion Probability</span>
                        <span className="text-sm font-medium">{formatPercentage(customerProfile.conversion.conversionProbability * 100)}</span>
                      </div>
                      <Progress value={customerProfile.conversion.conversionProbability * 100} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600">Churn Risk</span>
                        <span className="text-sm font-medium">{customerProfile.churnRisk.score}/100</span>
                      </div>
                      <Progress 
                        value={customerProfile.churnRisk.score} 
                        className="h-2"
                        // Add red color for high risk
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Business Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <ShoppingCart className="w-5 h-5" />
                    <span>Business Metrics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Total Bookings</p>
                      <p className="text-2xl font-bold">{customerProfile.conversion.totalBookings}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Value</p>
                      <p className="text-2xl font-bold">£{customerProfile.conversion.totalValue}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Avg Order Value</p>
                      <p className="text-lg font-medium">£{customerProfile.conversion.averageOrderValue.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Time on Site</p>
                      <p className="text-lg font-medium">{formatDuration(customerProfile.engagement.timeOnSite)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Engagement Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MousePointer className="w-5 h-5" />
                    <span>Engagement Metrics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Pages per Session</p>
                      <p className="text-xl font-bold">{customerProfile.engagement.pagesPerSession.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Avg Session Duration</p>
                      <p className="text-xl font-bold">{formatDuration(customerProfile.engagement.averageSessionDuration)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Bounce Rate</p>
                      <p className="text-xl font-bold">{formatPercentage(customerProfile.engagement.bounceRate * 100)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Days Since Last Visit</p>
                      <p className="text-xl font-bold">{customerProfile.churnRisk.daysSinceLastVisit}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No customer profile data available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {customerInsights.map((insight, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2 text-lg">
                      {getInsightTypeIcon(insight.type)}
                      <span>{insight.title}</span>
                    </CardTitle>
                    <Badge 
                      variant="outline" 
                      className={getInsightPriorityColor(insight.priority)}
                    >
                      {insight.priority}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700">{insight.description}</p>
                  
                  {insight.actionable && insight.actions && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-600">Recommended Actions:</p>
                      {insight.actions.map((action, actionIndex) => (
                        <div key={actionIndex} className="flex items-center space-x-2">
                          <Button size="sm" variant="outline">
                            {action.title}
                          </Button>
                          <span className="text-sm text-gray-600">{action.description}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          
          {customerInsights.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <TrendingUp className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No actionable insights available at this time</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Behavior Tab */}
        <TabsContent value="behavior" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Behavioral Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">15+</div>
                    <div className="text-sm text-gray-600">Event Types Tracked</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">Real-time</div>
                    <div className="text-sm text-gray-600">Event Processing</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">ML-Powered</div>
                    <div className="text-sm text-gray-600">Behavioral Scoring</div>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-2">Tracked Events Include:</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {[
                      'Page Views', 'Scroll Depth', 'Click Heatmaps', 'Form Interactions',
                      'Exit Intent', 'Rage Clicks', 'Service Interest', 'Price Checks',
                      'Booking Steps', 'Device Selection', 'Search Behavior', 'Contact Interactions',
                      'Performance Metrics', 'Journey Progression', 'Conversion Events'
                    ].map((event, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {event}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Real-time Tab */}
        <TabsContent value="realtime" className="space-y-4">
          {realtimeMetrics ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="w-5 h-5" />
                    <span>Live Activity</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Top Pages</p>
                        <div className="space-y-2">
                          {realtimeMetrics.topPages.map((page, index) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <span className="truncate">{page.url}</span>
                              <Badge variant="outline">{page.views} views</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Device Breakdown</p>
                        <div className="space-y-2">
                          {Object.entries(realtimeMetrics.deviceBreakdown).map(([device, count]) => (
                            <div key={device} className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                {getDeviceIcon(device)}
                                <span className="text-sm">{device}</span>
                              </div>
                              <Badge variant="outline">{count}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Clock className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">Real-time data not available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CustomerIntelligenceDashboard;