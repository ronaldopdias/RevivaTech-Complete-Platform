'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { useIsMobile } from '@/hooks/useIsMobile';
import { io, Socket } from 'socket.io-client';
import dynamic from 'next/dynamic';
import { useServices } from '@/lib/services/serviceFactory';

// Dynamically import mobile dashboard to avoid SSR issues
const MobileAdminDashboard = dynamic(() => import('../mobile/MobileAdminDashboard'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading mobile dashboard...</p>
      </div>
    </div>
  )
});
import AdminLayout from './AdminLayout';
import DashboardStats from './DashboardStats';
import RepairQueue from './RepairQueue';
import RecentActivity from './RecentActivity';
import QuickActions from './QuickActions';
import CRMIntegrationStatus from './CRMIntegrationStatus';
import AdvancedAnalytics from './AdvancedAnalytics';
import BusinessIntelligence from './BusinessIntelligence';
import PerformanceOptimization from './PerformanceOptimization';
import { RealTimeAnalyticsDashboard } from '@/components/analytics/RealTimeAnalyticsDashboard';
import { Button } from '@/components/ui/Button';
import ComponentShowcase from './ComponentShowcase';
import DesignSystemDocs from './DesignSystemDocs';

interface AdminDashboardProps {
  className?: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  className,
}) => {
  const { user } = useAuth();
  const { isMobile, isTablet } = useIsMobile();
  const { booking } = useServices();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [realtimeStats, setRealtimeStats] = useState({
    newBookings: 0,
    activeRepairs: 24,
    pendingRepairs: 8,
    completedToday: 12
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'intelligence' | 'performance' | 'components' | 'design-system'>('overview');
  
  // Render mobile-optimized dashboard for mobile and tablet devices
  if (isMobile || isTablet) {
    return <MobileAdminDashboard className={className} />;
  }

  const currentUser = user ? {
    name: `${user.firstName} ${user.lastName}`,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
  } : undefined;

  // Socket.IO connection setup
  useEffect(() => {
    const newSocket = io('http://localhost:3011', {
      auth: {
        token: user?.id || 'admin-demo',
        role: 'admin'
      },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('✅ Admin Dashboard connected to Socket.IO server');
      setIsConnected(true);
      
      // Subscribe to admin-specific events
      newSocket.emit('subscribe:admin', { userId: user?.id || 'admin-demo' });
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Admin Dashboard disconnected from Socket.IO server:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Admin Dashboard connection error:', error);
      setIsConnected(false);
    });

    // Real-time event handlers
    newSocket.on('new_booking', (data) => {
      console.log('New booking received:', data);
      setRealtimeStats(prev => ({
        ...prev,
        newBookings: prev.newBookings + 1,
        pendingRepairs: prev.pendingRepairs + 1
      }));
    });

    newSocket.on('repair_status_update', (data) => {
      console.log('Repair status update:', data);
      if (data.newStatus === 'completed') {
        setRealtimeStats(prev => ({
          ...prev,
          completedToday: prev.completedToday + 1,
          activeRepairs: Math.max(0, prev.activeRepairs - 1)
        }));
      } else if (data.newStatus === 'in_progress') {
        setRealtimeStats(prev => ({
          ...prev,
          activeRepairs: prev.activeRepairs + 1,
          pendingRepairs: Math.max(0, prev.pendingRepairs - 1)
        }));
      }
    });

    newSocket.on('admin_stats_update', (data) => {
      console.log('Admin stats update:', data);
      setRealtimeStats(data);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [user?.id]);

  // Fetch real statistics on component mount and periodically
  useEffect(() => {
    const fetchRealStats = async () => {
      try {
        setLoadingStats(true);
        const response = await booking.getBookingStatistics();
        const apiStats = response.data.stats;
        
        // Update real-time stats with API data
        setRealtimeStats({
          newBookings: apiStats.total_bookings || 0,
          activeRepairs: apiStats.in_progress_bookings || 0,
          pendingRepairs: apiStats.pending_bookings || 0,
          completedToday: apiStats.completed_bookings || 0
        });
      } catch (error) {
        console.error('Failed to fetch real statistics:', error);
        // Keep default values on error
      } finally {
        setLoadingStats(false);
      }
    };

    // Fetch immediately
    fetchRealStats();

    // Set up periodic refresh every 30 seconds
    const interval = setInterval(fetchRealStats, 30000);

    return () => clearInterval(interval);
  }, [booking]);

  const handleTicketSelect = (ticket: any) => {
    console.log('Selected ticket:', ticket);
    // Navigate to ticket details or open modal
  };

  const handleStatusUpdate = (ticketId: string, status: string) => {
    console.log('Update status:', ticketId, status);
    // Call API to update ticket status
  };

  const handleQuickAction = (actionId: string) => {
    console.log('Quick action:', actionId);
    // Handle quick action click
  };

  const sendMessage = (message: any) => {
    if (socket && isConnected) {
      socket.emit('admin_action', message);
    } else {
      console.warn('Socket not connected. Message not sent:', message);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'intelligence', label: 'Business Intelligence', icon: '🧠' },
    { id: 'performance', label: 'Performance', icon: '⚡' },
    { id: 'components', label: 'Components', icon: '🎨' },
    { id: 'design-system', label: 'Design System', icon: '🎭' }
  ] as const;

  return (
    <AdminLayout currentUser={currentUser} className={className}>
      <div className="space-y-8">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between p-4 bg-card border rounded-lg">
          <div>
            <h2 className="text-lg font-semibold">Admin Dashboard</h2>
            <div className="flex items-center space-x-3">
              <p className="text-sm text-muted-foreground">Comprehensive management and analytics system</p>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-xs text-muted-foreground">
                  {isConnected ? 'Real-time connected' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-2">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab(tab.id)}
                className="text-sm"
              >
                <span className="mr-1">{tab.icon}</span>
                {tab.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <>
            {/* Real-time Status Header */}
            <div className="flex items-center justify-between p-4 bg-card border rounded-lg">
              <div>
                <h3 className="text-lg font-semibold">Real-time Overview</h3>
                <p className="text-sm text-muted-foreground">Live repair management system</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className={`text-sm font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                    {isConnected ? 'Real-time Connected' : 'Disconnected'}
                  </span>
                </div>
                {/* Test Controls */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => sendMessage({
                      type: 'new_booking',
                      payload: {
                        customerName: `Test Customer ${Date.now()}`,
                        deviceType: 'MacBook Pro',
                        issueType: 'Screen Repair'
                      },
                      timestamp: new Date().toISOString()
                    })}
                    disabled={!isConnected}
                    className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                  >
                    Test New Booking
                  </button>
                  <button
                    onClick={() => sendMessage({
                      type: 'repair_status_update',
                      payload: {
                        repairId: 'test-123',
                        newStatus: 'completed'
                      },
                      timestamp: new Date().toISOString()
                    })}
                    disabled={!isConnected}
                    className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                  >
                    Test Completion
                  </button>
                </div>
              </div>
            </div>

            {/* Real-time Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Bookings</p>
                    {loadingStats ? (
                      <div className="h-8 w-16 bg-muted rounded animate-pulse"></div>
                    ) : (
                      <p className="text-2xl font-bold text-blue-600">{realtimeStats.newBookings}</p>
                    )}
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    📋
                  </div>
                </div>
              </div>
              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Repairs</p>
                    {loadingStats ? (
                      <div className="h-8 w-16 bg-muted rounded animate-pulse"></div>
                    ) : (
                      <p className="text-2xl font-bold text-orange-600">{realtimeStats.activeRepairs}</p>
                    )}
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    🔧
                  </div>
                </div>
              </div>
              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pending Queue</p>
                    {loadingStats ? (
                      <div className="h-8 w-16 bg-muted rounded animate-pulse"></div>
                    ) : (
                      <p className="text-2xl font-bold text-yellow-600">{realtimeStats.pendingRepairs}</p>
                    )}
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    ⏱️
                  </div>
                </div>
              </div>
              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Completed</p>
                    {loadingStats ? (
                      <div className="h-8 w-16 bg-muted rounded animate-pulse"></div>
                    ) : (
                      <p className="text-2xl font-bold text-green-600">{realtimeStats.completedToday}</p>
                    )}
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    ✅
                  </div>
                </div>
              </div>
            </div>

        {/* CRM Integration Status */}
        <div className="bg-card border rounded-lg p-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">🔗 CRM Integration</h3>
              <p className="text-sm text-muted-foreground">
                Integration with external CRM system at /opt/webapps/CRM
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <CRMIntegrationStatus />
              </div>
              
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Data Flow</h4>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>1. Customer registers → CRM notification</div>
                    <div>2. Booking created → CRM approval queue</div>
                    <div>3. CRM approves → Data stored in CRM DB</div>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">CRM Ports</h4>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>Frontend: 3001</div>
                    <div>Backend: 5001</div>
                    <div>Database: 5433</div>
                    <div>Redis: 6381</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <p className="text-xs text-muted-foreground">
                The external CRM system runs independently and receives notifications from RevivaTech for approval and processing.
              </p>
            </div>
          </div>
        </div>

        {/* Dashboard Stats */}
        <DashboardStats />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Repair Queue */}
          <div className="lg:col-span-2">
            <RepairQueue
              onTicketSelect={handleTicketSelect}
              onStatusUpdate={handleStatusUpdate}
            />
          </div>

          {/* Right Column - Activity & Actions */}
          <div className="space-y-6">
            <RecentActivity maxItems={6} />
            <QuickActions onActionClick={handleQuickAction} />
          </div>
        </div>

        {/* Additional Dashboard Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Performance Chart Placeholder */}
          <div className="lg:col-span-2 bg-card border rounded-lg p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Repair Performance</h3>
                <p className="text-sm text-muted-foreground">
                  Weekly repair completion trends
                </p>
              </div>
              <div className="h-64 bg-muted/50 rounded-lg flex items-center justify-center">
                <div className="text-center space-y-2">
                  <div className="text-3xl">📈</div>
                  <p className="text-sm text-muted-foreground">
                    Chart will be implemented with Chart.js or similar
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Team Performance */}
          <div className="bg-card border rounded-lg p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Team Performance</h3>
                <p className="text-sm text-muted-foreground">
                  This week's technician stats
                </p>
              </div>
              
              <div className="space-y-3">
                {[
                  { name: 'Sarah Chen', repairs: 12, rating: 4.9 },
                  { name: 'Mike Johnson', repairs: 8, rating: 4.8 },
                  { name: 'Alex Rodriguez', repairs: 6, rating: 4.7 },
                ].map((tech, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <div className="font-medium text-sm">{tech.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {tech.repairs} repairs
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">⭐ {tech.rating}</div>
                      <div className="text-xs text-muted-foreground">rating</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              title: 'Customer Satisfaction',
              value: '96%',
              change: '+2%',
              icon: '😊',
              description: 'Based on 127 reviews this month',
            },
            {
              title: 'Avg Response Time',
              value: '18 min',
              change: '-5 min',
              icon: '⚡',
              description: 'Time to first customer response',
            },
            {
              title: 'Parts Accuracy',
              value: '98.5%',
              change: '+1.2%',
              icon: '🎯',
              description: 'Correct parts ordered first time',
            },
            {
              title: 'Warranty Claims',
              value: '2.1%',
              change: '-0.3%',
              icon: '🛡️',
              description: 'Repairs requiring warranty work',
            },
          ].map((stat, index) => (
            <div key={index} className="bg-card border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-xl">
                  {stat.icon}
                </div>
                <div className="text-xs text-green-600 font-medium">
                  {stat.change}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </div>
                <div className="text-xs text-muted-foreground">
                  {stat.description}
                </div>
              </div>
            </div>
          ))}
        </div>
          </>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <RealTimeAnalyticsDashboard
              refreshInterval={5000}
              showDebugInfo={false}
              userRole={user?.role === 'SUPER_ADMIN' ? 'super_admin' : 'admin'}
            />
            <AdvancedAnalytics />
          </div>
        )}

        {/* Business Intelligence Tab */}
        {activeTab === 'intelligence' && (
          <BusinessIntelligence />
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <PerformanceOptimization />
        )}

        {/* Components Tab */}
        {activeTab === 'components' && (
          <ComponentShowcase />
        )}

        {/* Design System Tab */}
        {activeTab === 'design-system' && (
          <DesignSystemDocs />
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;