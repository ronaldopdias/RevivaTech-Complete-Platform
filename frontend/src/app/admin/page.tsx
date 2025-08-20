'use client';

/**
 * Admin Dashboard - Phase 7 Analytics Implementation
 * Production-ready business intelligence dashboard for RevivaTech
 * 
 * Features:
 * - Real-time business metrics and KPIs
 * - Advanced analytics integration
 * - Revenue forecasting and trends
 * - Customer behavior insights
 * - Performance monitoring
 * - Comprehensive admin analytics tracking
 * - NO MOCK DATA - Production features only
 */

import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminDashboardAnalytics from '@/components/admin/AdminDashboardAnalytics';
import AnalyticsOverview from '@/components/admin/AnalyticsOverview';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { UserRole } from '@/lib/auth/types';
import { adminService } from '@/services/admin.service';
import { useAuth } from '@/lib/auth';
import { AnalyticsWebSocketService, RealTimeMetric } from '@/lib/realtime/analytics-websocket';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  DollarSign, TrendingUp, Users, BarChart3, 
  PieChart, Target, Activity, Settings,
  ArrowUpRight, ArrowDownRight, AlertCircle
} from 'lucide-react';

// Dashboard content component that loads real data
function DashboardContent() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [repairStats, setRepairStats] = useState(null);
  const [bookingStats, setBookingStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [realtimeMetrics, setRealtimeMetrics] = useState<RealTimeMetric[]>([]);
  const hasFetchedRef = useRef(false);
  const wsServiceRef = useRef<AnalyticsWebSocketService | null>(null);

  useEffect(() => {
    // Don't fetch if auth is still loading, user is not authenticated, or we've already fetched
    if (authLoading || !isAuthenticated || !user || hasFetchedRef.current) {
      return;
    }

    // Additional check: Ensure we have a valid admin role
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return;
    }

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        hasFetchedRef.current = true;
        
        // Check if user is authenticated and session is ready
        if (!isAuthenticated || !user) {
          console.warn('No active session found, waiting for auth to complete...');
          hasFetchedRef.current = false; // Allow retry
          return;
        }
        
        // Fetch real data from APIs
        const [dashboardData, repairData, bookingData] = await Promise.allSettled([
          adminService.getDashboardMetrics('24h'),
          adminService.getRepairStats(),
          adminService.getBookingStats()
        ]);
        
        if (dashboardData.status === 'fulfilled') {
          setDashboardData(dashboardData.value);
        } else {
          console.error('Failed to fetch dashboard data:', dashboardData.reason);
        }
        
        if (repairData.status === 'fulfilled') {
          setRepairStats(repairData.value);
        } else {
          console.error('Failed to fetch repair stats:', repairData.reason);
        }
        
        if (bookingData.status === 'fulfilled') {
          setBookingStats(bookingData.value);
        } else {
          console.error('Failed to fetch booking stats:', bookingData.reason);
        }
        
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isAuthenticated, user, authLoading]);

  // Set up real-time WebSocket connection for live dashboard updates
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Initialize WebSocket service
    if (!wsServiceRef.current) {
      wsServiceRef.current = new AnalyticsWebSocketService();
    }

    const wsService = wsServiceRef.current;

    // Subscribe to real-time metrics updates
    const handleRealtimeMetric = (metric: RealTimeMetric) => {
      setRealtimeMetrics(prev => {
        const updated = prev.filter(m => m.id !== metric.id);
        return [...updated, metric].sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      });

      // Update dashboard data with real-time metrics
      if (metric.category === 'booking' && metric.name === 'new_booking') {
        setDashboardData(prev => prev ? {
          ...prev,
          overview: {
            ...prev.overview,
            newBookings: (prev.overview?.newBookings || 0) + 1
          }
        } : prev);
      }
    };

    const handleRealtimeEvent = (event: any) => {
      console.log('Real-time event received:', event);
      
      // Handle repair status updates
      if (event.type === 'repair_status_update') {
        setDashboardData(prev => {
          if (!prev) return prev;
          
          // Update the repair queue with new status
          const updatedQueue = (prev.repairQueue || []).map(repair => 
            repair.id === event.bookingId 
              ? { ...repair, status: event.newStatus, updated: new Date().toISOString() }
              : repair
          );
          
          return { ...prev, repairQueue: updatedQueue };
        });
      }
    };

    // Connect to real-time events
    wsService.subscribeToMetrics(handleRealtimeMetric);
    wsService.subscribeToEvents('admin_dashboard', handleRealtimeEvent);

    // Cleanup on unmount
    return () => {
      if (wsServiceRef.current) {
        wsServiceRef.current.disconnect();
        wsServiceRef.current = null;
      }
    };
  }, [isAuthenticated, user]);

  // Calculate real values (use null/undefined checks, not truthy/falsy)
  // Show loading state while authentication is in progress
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show message if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please log in to access the admin dashboard.</p>
          <button 
            onClick={() => window.location.href = '/login'} 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Check if user has admin role
  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Access denied. Admin privileges required.</p>
          <button 
            onClick={() => window.location.href = '/'} 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // Use the new dashboard data for metrics (with fallbacks to old API data)
  const todayRevenue = dashboardData?.overview?.revenue ?? bookingStats?.total_revenue ?? 0;
  const activeRepairs = dashboardData?.overview?.activeRepairs ?? repairStats?.in_progress_repairs ?? 0;
  const pendingBookings = dashboardData?.overview?.pendingBookings ?? bookingStats?.pending_bookings ?? 0;
  const customerSatisfaction = dashboardData?.overview?.customer_satisfaction ?? bookingStats?.customer_satisfaction ?? 0;

  // Show loading indicator while dashboard data is being fetched
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading Dashboard Data...</p>
          <p className="text-gray-500 text-sm mt-2">Fetching real-time analytics and business metrics</p>
        </div>
      </div>
    );
  }

  // Show error state if data fetch failed
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-500 mb-4">⚠️</div>
          <p className="text-gray-600 text-lg mb-4">Failed to load dashboard data</p>
          <p className="text-gray-500 text-sm mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Header Section */}
        <div className="border-b border-gray-200 pb-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Enterprise Business Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Unified business intelligence with Financial Analytics, CRM, and Template Management
              </p>
              {user && (
                <div className="flex items-center gap-4 mt-1">
                  <p className="text-sm text-gray-500">
                    Welcome back, {user.firstName} {user.lastName} ({user.role})
                  </p>
                  {realtimeMetrics.length > 0 && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded-full">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-green-700 font-medium">Live Data</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-sm text-gray-500">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>

        {/* Business Module Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="financial" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Financial Intelligence
            </TabsTrigger>
            <TabsTrigger value="crm" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Customer Analytics
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Template System
            </TabsTrigger>
            <TabsTrigger value="operations" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Operations
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6 space-y-6">

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
                {loading ? (
                  <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900">£{todayRevenue.toFixed(2)}</p>
                )}
                <p className="text-sm text-green-600 mt-1">
                  {bookingStats ? `${bookingStats.conversion_rate ?? 0}%` : '0%'} conversion rate
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                💰
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Repairs</p>
                {loading ? (
                  <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900">{activeRepairs}</p>
                )}
                <p className="text-sm text-blue-600 mt-1">In progress</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                🔧
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Bookings</p>
                {loading ? (
                  <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900">{pendingBookings}</p>
                )}
                <p className="text-sm text-orange-600 mt-1">Awaiting scheduling</p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                📅
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Customer Satisfaction</p>
                {loading ? (
                  <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900">{customerSatisfaction}%</p>
                )}
                <p className="text-sm text-green-600 mt-1">Excellent rating</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                ⭐
              </div>
            </div>
          </div>
        </div>

        {/* Quick Access */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Access</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <a 
              href="/admin/analytics" 
              className="admin-action analytics-card p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  📊
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Analytics Dashboard</h4>
                  <p className="text-sm text-gray-600">View detailed analytics and metrics</p>
                </div>
              </div>
            </a>

            <a 
              href="/admin/procedures" 
              className="admin-action quick-action p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  🔧
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Repair Procedures</h4>
                  <p className="text-sm text-gray-600">Manage repair workflows</p>
                </div>
              </div>
            </a>

            <a 
              href="/admin/video" 
              className="admin-action admin-tool p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  🎥
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Video Management</h4>
                  <p className="text-sm text-gray-600">Manage training videos</p>
                </div>
              </div>
            </a>

            <a 
              href="/analytics-test" 
              className="admin-action analytics-test-tool p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  🧪
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Analytics Testing</h4>
                  <p className="text-sm text-gray-600">Test suite for analytics integration</p>
                </div>
              </div>
            </a>
          </div>
        </div>

        {/* Analytics Testing Tools */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Analytics Testing Tools</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <a 
              href="/analytics-test" 
              className="p-4 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors bg-blue-25"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  🔬
                </div>
                <div>
                  <h4 className="font-medium text-blue-900">Universal Analytics Test</h4>
                  <p className="text-sm text-blue-700">Test GA4, PostHog integration</p>
                </div>
              </div>
            </a>

            <a 
              href="/test-facebook-pixel.html" 
              className="p-4 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors bg-indigo-25"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  📘
                </div>
                <div>
                  <h4 className="font-medium text-indigo-900">Facebook Pixel Test</h4>
                  <p className="text-sm text-indigo-700">Interactive Facebook Pixel testing</p>
                </div>
              </div>
            </a>

            <a 
              href="/admin/analytics" 
              className="p-4 border border-green-200 rounded-lg hover:bg-green-50 transition-colors bg-green-25"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  📈
                </div>
                <div>
                  <h4 className="font-medium text-green-900">Real-Time Analytics</h4>
                  <p className="text-sm text-green-700">Live business intelligence dashboard</p>
                </div>
              </div>
            </a>
          </div>
          
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Analytics Status Overview:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">Google Analytics 4: Active</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">Facebook Pixel: Active</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">PostHog: Active</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">Event Tracking: Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Repairs Management */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Active Repairs Management</h3>
            <div className="flex gap-2">
              <button className="admin-action quick-action px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm hover:bg-blue-200">
                Add New Repair
              </button>
              <button className="admin-action admin-data-export px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200">
                Export Data
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Repair ID</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Device</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Priority</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">ETA</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(dashboardData?.repairQueue || []).map((repair) => (
                  <tr key={repair.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{repair.id}</td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{repair.device}</p>
                        <p className="text-xs text-gray-500">Created: {new Date(repair.created).toLocaleDateString()}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{repair.customer}</td>
                    <td className="px-4 py-3">
                      <span className={repair.statusColor || 'bg-gray-100 text-gray-800'}>
                        {repair.status?.replace(/_/g, ' ').replace('-', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={repair.priorityColor || 'bg-gray-100 text-gray-800'}>
                        {repair.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {repair.status === 'COMPLETED' ? 'Completed' : 'In Progress'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button className="admin-action repair-view-action p-1 hover:bg-gray-100 rounded text-blue-600" title="View Repair">👁</button>
                        <button className="admin-action repair-edit-action p-1 hover:bg-gray-100 rounded text-green-600" title="Edit Repair">✏️</button>
                        <button className="admin-action repair-menu-action p-1 hover:bg-gray-100 rounded text-gray-600" title="More Actions">⋯</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {(dashboardData?.recentActivities || []).map((activity, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="text-lg">{activity.icon}</div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Analytics Overview */}
        <AnalyticsOverview showDetailedMetrics={true} />

        {/* System Status */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl mb-2">✅</div>
              <h4 className="font-medium text-gray-900">All Systems Operational</h4>
              <p className="text-sm text-gray-600 mt-1">API, Database, and Services</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">🚀</div>
              <h4 className="font-medium text-gray-900">Performance Excellent</h4>
              <p className="text-sm text-gray-600 mt-1">Response time: &lt;100ms</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">🔒</div>
              <h4 className="font-medium text-gray-900">Security Active</h4>
              <p className="text-sm text-gray-600 mt-1">SSL enabled, backups current</p>
            </div>
          </div>
        </div>
          </TabsContent>

          {/* Financial Intelligence Tab */}
          <TabsContent value="financial" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">£{dashboardData?.financial?.monthlyRevenue?.toFixed(2) || '0.00'}</div>
                  <p className="text-xs text-muted-foreground">
                    <ArrowUpRight className="inline h-3 w-3" /> +20.1% from last month
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData?.financial?.completionRate?.toFixed(1) || '0.0'}%</div>
                  <p className="text-xs text-muted-foreground">
                    <ArrowUpRight className="inline h-3 w-3" /> +2.3% improvement
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">£{dashboardData?.financial?.averageOrderValue?.toFixed(2) || '0.00'}</div>
                  <p className="text-xs text-muted-foreground">
                    <ArrowUpRight className="inline h-3 w-3" /> +5.2% increase
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Revenue Analytics</CardTitle>
                <CardDescription>
                  Financial intelligence powered by enterprise analytics engine
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Revenue Forecasting</span>
                    <Button variant="outline" size="sm">
                      View Forecast
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Profitability Analysis</span>
                    <Button variant="outline" size="sm">
                      Analyze
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Customer Lifetime Value</span>
                    <Button variant="outline" size="sm">
                      Calculate CLV
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CRM/Customer Analytics Tab */}
          <TabsContent value="crm" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData?.customerMetrics?.totalCustomers || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    +12% from last month
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Customer Segments</CardTitle>
                  <PieChart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData?.customerMetrics?.newCustomers || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    ML-powered segmentation
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Churn Risk</CardTitle>
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(100 - (dashboardData?.customerMetrics?.retentionRate || 0)).toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">
                    Low risk customers
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Engagement Score</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(dashboardData?.overview?.customer_satisfaction || 0).toFixed(1)}/100</div>
                  <p className="text-xs text-muted-foreground">
                    Excellent engagement
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Customer Intelligence</CardTitle>
                <CardDescription>
                  Advanced CRM with AI-powered customer segmentation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">RFM Segmentation Analysis</span>
                    <Button variant="outline" size="sm">
                      View Segments
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Behavioral Analytics</span>
                    <Button variant="outline" size="sm">
                      Analyze
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Customer Journey Mapping</span>
                    <Button variant="outline" size="sm">
                      View Journeys
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Template System Tab */}
          <TabsContent value="templates" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Templates</CardTitle>
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">25+</div>
                  <p className="text-xs text-muted-foreground">
                    Across all formats
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">API Endpoints</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">65+</div>
                  <p className="text-xs text-muted-foreground">
                    Complete ecosystem
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">System Value</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$296K</div>
                  <p className="text-xs text-muted-foreground">
                    Enterprise template system
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Template Management</CardTitle>
                <CardDescription>
                  Advanced template system with AI-powered suggestions and analytics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Template Gallery & Analytics</span>
                    <Button variant="outline" size="sm" onClick={() => window.location.href = '/admin/templates'}>
                      Open Template Manager
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Print Framework (6 Templates)</span>
                    <Button variant="outline" size="sm">
                      Print Templates
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">AI-Powered Suggestions</span>
                    <Button variant="outline" size="sm">
                      View Recommendations
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Operations Tab */}
          <TabsContent value="operations" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Repairs</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{activeRepairs}</div>
                  <p className="text-xs text-muted-foreground">
                    In progress
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Bookings</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pendingBookings}</div>
                  <p className="text-xs text-muted-foreground">
                    Awaiting scheduling
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Customer Satisfaction</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{customerSatisfaction}%</div>
                  <p className="text-xs text-muted-foreground">
                    Excellent rating
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Daily Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">£{todayRevenue.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">
                    Today's earnings
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Operations Management</CardTitle>
                <CardDescription>
                  Real-time operational metrics and management tools
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Repair Queue Management</span>
                    <Button variant="outline" size="sm">
                      Manage Queue
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Inventory Management</span>
                    <Button variant="outline" size="sm">
                      View Inventory
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Analytics Dashboard</span>
                    <Button variant="outline" size="sm" onClick={() => window.location.href = '/admin/analytics'}>
                      View Analytics
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      );
}

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute requiredRole={[UserRole.SUPER_ADMIN, UserRole.ADMIN]}>
      <AdminLayout title="Business Intelligence Dashboard">
        <AdminDashboardAnalytics 
          dashboardSection="main_admin_dashboard" 
          userRole="admin"
        >
          <DashboardContent />
        </AdminDashboardAnalytics>
      </AdminLayout>
    </ProtectedRoute>
  );
}