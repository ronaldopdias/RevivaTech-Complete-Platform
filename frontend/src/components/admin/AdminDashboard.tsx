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
import BusinessAnalytics from './BusinessAnalytics';
import PerformanceOptimization from './PerformanceOptimization';
import { RealTimeAnalyticsDashboard } from '@/components/analytics/RealTimeAnalyticsDashboard';
import { Button } from '@/components/ui/Button';
import ComponentShowcase from './ComponentShowcase';
import DesignSystemDocs from './DesignSystemDocs';

interface AdminDashboardProps {
  className?: string;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState(null);
  const [realtimeStats, setRealtimeStats] = useState({
    newBookings: 0,
    completedToday: 0,
    activeRepairs: 0,
    pendingRepairs: 0,
    technicianActivity: 0
  });

  const { user } = useAuth();

  // Socket.io setup for real-time updates
  useEffect(() => {
    // Only connect for authenticated admin users
    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return;
    }

    console.log('🚀 Admin Dashboard initializing WebSocket connection...');
    
    const newSocket = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3011', {
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      forceNew: true
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      
      // Subscribe to admin-specific events
      newSocket.emit('subscribe:admin', { userId: user?.id || 'admin-demo' });
    });

    newSocket.on('disconnect', (reason) => {
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

    newSocket.on('technician_activity', (data) => {
      console.log('Technician activity:', data);
      setRealtimeStats(prev => ({
        ...prev,
        technicianActivity: data.activeCount || 0
      }));
    });

    // Cleanup on unmount
    return () => {
      console.log('🔌 Admin Dashboard disconnecting WebSocket...');
      newSocket.disconnect();
    };
  }, [user]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'intelligence', label: 'Business Intelligence', icon: '🧠' },
    { id: 'procedures', label: 'Procedures', icon: '🔧' },
    { id: 'media', label: 'Media', icon: '🖼️' },
    { id: 'customers', label: 'Customers', icon: '👥' },
    { id: 'performance', label: 'Performance', icon: '⚡' },
    { id: 'components', label: 'Components', icon: '🧩' },
    { id: 'design-system', label: 'Design System', icon: '🎨' }
  ];

  // Check if user is authenticated and has admin role
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user session...</p>
        </div>
      </div>
    );
  }

  if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have permission to access the admin dashboard.</p>
          <p className="text-sm text-gray-500">Current role: {user.role}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <div className="flex items-center space-x-2">
                <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user.name || user.email}</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {user.role}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Stats Bar */}
      <div className="bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex justify-between items-center text-sm">
            <div className="flex space-x-6">
              <span>📋 New Bookings: {realtimeStats.newBookings}</span>
              <span>✅ Completed Today: {realtimeStats.completedToday}</span>
              <span>🔧 Active Repairs: {realtimeStats.activeRepairs}</span>
              <span>⏳ Pending: {realtimeStats.pendingRepairs}</span>
            </div>
            <div>
              <span>👨‍🔧 Active Technicians: {realtimeStats.technicianActivity}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Quick Stats Cards */}
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm">📋</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                    <p className="text-2xl font-semibold text-gray-900">1,234</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm">✅</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-2xl font-semibold text-gray-900">987</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm">🔧</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">In Progress</p>
                    <p className="text-2xl font-semibold text-gray-900">156</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm">👥</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Customers</p>
                    <p className="text-2xl font-semibold text-gray-900">789</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">New booking from John Doe</span>
                    <span className="text-xs text-gray-400">2 min ago</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Repair completed for Jane Smith</span>
                    <span className="text-xs text-gray-400">15 min ago</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Quote sent to Mike Johnson</span>
                    <span className="text-xs text-gray-400">1 hour ago</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button className="p-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-center transition-colors">
                    <div className="text-2xl mb-2">📋</div>
                    <div className="text-sm font-medium">New Booking</div>
                  </button>
                  <button className="p-3 bg-green-50 hover:bg-green-100 rounded-lg text-center transition-colors">
                    <div className="text-2xl mb-2">👥</div>
                    <div className="text-sm font-medium">Add Customer</div>
                  </button>
                  <button className="p-3 bg-purple-50 hover:bg-purple-100 rounded-lg text-center transition-colors">
                    <div className="text-2xl mb-2">📊</div>
                    <div className="text-sm font-medium">View Reports</div>
                  </button>
                  <button className="p-3 bg-yellow-50 hover:bg-yellow-100 rounded-lg text-center transition-colors">
                    <div className="text-2xl mb-2">⚙️</div>
                    <div className="text-sm font-medium">Settings</div>
                  </button>
                </div>
              </div>
            </div>
          </div>
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
            <BusinessAnalytics />
          </div>
        )}

        {/* Business Intelligence Tab */}
        {activeTab === 'intelligence' && (
          <BusinessIntelligence />
        )}

        {/* Procedures Tab */}
        {activeTab === 'procedures' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium">Procedures Manager</h3>
            <p className="text-gray-600">Component coming soon...</p>
          </div>
        )}

        {/* Media Tab */}
        {activeTab === 'media' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium">Media Manager</h3>
            <p className="text-gray-600">Component coming soon...</p>
          </div>
        )}

        {/* Customers Tab */}
        {activeTab === 'customers' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium">Customer Manager</h3>
            <p className="text-gray-600">Component coming soon...</p>
          </div>
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
          <DesignSystemShowcase />
        )}
      </div>
    </div>
  );
};