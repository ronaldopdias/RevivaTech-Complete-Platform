'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { io, Socket } from 'socket.io-client';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import DashboardStats from '../admin/DashboardStats';
import RepairQueue from '../admin/RepairQueue';
import RecentActivity from '../admin/RecentActivity';
import QuickActions from '../admin/QuickActions';
import CRMIntegrationStatus from '../admin/CRMIntegrationStatus';
import AdvancedAnalytics from '../admin/AdvancedAnalytics';
import BusinessIntelligence from '../admin/BusinessIntelligence';
import PerformanceOptimization from '../admin/PerformanceOptimization';
import ComponentShowcase from '../admin/ComponentShowcase';
import DesignSystemDocs from '../admin/DesignSystemDocs';

interface MobileAdminDashboardProps {
  className?: string;
}

export const MobileAdminDashboard: React.FC<MobileAdminDashboardProps> = ({
  className,
}) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [realtimeStats, setRealtimeStats] = useState({
    newBookings: 0,
    activeRepairs: 24,
    pendingRepairs: 8,
    completedToday: 12
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'intelligence' | 'performance' | 'components' | 'design-system'>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [lastTouchEnd, setLastTouchEnd] = useState(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Touch gesture handling for mobile navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    
    // Horizontal swipe detection
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0 && !isSidebarOpen) {
        // Swipe right to open sidebar
        setIsSidebarOpen(true);
      } else if (deltaX < 0 && isSidebarOpen) {
        // Swipe left to close sidebar
        setIsSidebarOpen(false);
      }
    }
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      // Double tap detected
      return;
    }
    setLastTouchEnd(now);
  };

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
      setIsConnected(true);
      newSocket.emit('subscribe:admin', { userId: user?.id || 'admin-demo' });
    });

    newSocket.on('disconnect', (reason) => {
      setIsConnected(false);
    });

    // Real-time event handlers
    newSocket.on('new_booking', (data) => {
      setRealtimeStats(prev => ({
        ...prev,
        newBookings: prev.newBookings + 1,
        pendingRepairs: prev.pendingRepairs + 1
      }));
      
      // Show native mobile notification
      if ('serviceWorker' in navigator && 'Notification' in window) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification('New Repair Booking! 📱', {
            body: `Device: ${data.device?.name || 'Unknown'} - ${data.issue}`,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/badge-72x72.png',
            tag: 'new-booking',
            vibrate: [200, 100, 200],
            actions: [
              { action: 'view', title: 'View Details' },
              { action: 'assign', title: 'Assign Technician' }
            ]
          });
        });
      }
    });

    newSocket.on('repair_status_update', (data) => {
      if (data.newStatus === 'completed') {
        setRealtimeStats(prev => ({
          ...prev,
          completedToday: prev.completedToday + 1,
          activeRepairs: Math.max(0, prev.activeRepairs - 1)
        }));
      }
    });

    setSocket(newSocket);
    return () => newSocket.close();
  }, [user?.id]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊', color: 'text-blue-600' },
    { id: 'analytics', label: 'Analytics', icon: '📈', color: 'text-green-600' },
    { id: 'intelligence', label: 'Intelligence', icon: '🧠', color: 'text-purple-600' },
    { id: 'performance', label: 'Performance', icon: '⚡', color: 'text-yellow-600' },
    { id: 'components', label: 'Components', icon: '🎨', color: 'text-pink-600' },
    { id: 'design-system', label: 'Design', icon: '🎭', color: 'text-indigo-600' }
  ] as const;

  const currentTab = tabs.find(tab => tab.id === activeTab);

  return (
    <div 
      className={cn(
        'pwa-app mobile-admin-dashboard',
        'min-h-screen bg-background',
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Mobile Header */}
      <header className="mobile-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="touch-target p-2"
            >
              <div className="space-y-1">
                <div className="w-5 h-0.5 bg-current"></div>
                <div className="w-5 h-0.5 bg-current"></div>
                <div className="w-5 h-0.5 bg-current"></div>
              </div>
            </Button>
            
            <div>
              <h1 className="text-lg font-semibold">RevivaTech Admin</h1>
              <div className="flex items-center space-x-2">
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                )}></div>
                <span className="text-xs text-muted-foreground">
                  {isConnected ? 'Live' : 'Offline'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className={cn('text-2xl', currentTab?.color)}>
              {currentTab?.icon}
            </span>
            <div className="text-sm font-medium">
              {currentTab?.label}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={cn(
        'fixed top-0 left-0 h-full w-80 bg-card border-r z-50 transform transition-transform duration-300',
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Admin Menu</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(false)}
              className="touch-target"
            >
              ✕
            </Button>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'ghost'}
              className={cn(
                'w-full justify-start touch-target',
                'text-left p-4 h-auto'
              )}
              onClick={() => {
                setActiveTab(tab.id);
                setIsSidebarOpen(false);
              }}
            >
              <span className={cn('text-xl mr-3', tab.color)}>
                {tab.icon}
              </span>
              <div>
                <div className="font-medium">{tab.label}</div>
                <div className="text-xs text-muted-foreground">
                  {tab.id === 'overview' && 'Main dashboard'}
                  {tab.id === 'analytics' && 'Performance metrics'}
                  {tab.id === 'intelligence' && 'Business insights'}
                  {tab.id === 'performance' && 'System optimization'}
                  {tab.id === 'components' && 'UI component library'}
                  {tab.id === 'design-system' && 'Design documentation'}
                </div>
              </div>
            </Button>
          ))}
        </nav>

        {/* Quick Stats in Sidebar */}
        <div className="p-4 border-t">
          <h3 className="text-sm font-medium mb-3">Quick Stats</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-lg font-bold text-blue-600">
                {realtimeStats.newBookings}
              </div>
              <div className="text-xs text-muted-foreground">New Today</div>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-lg font-bold text-green-600">
                {realtimeStats.activeRepairs}
              </div>
              <div className="text-xs text-muted-foreground">Active</div>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-lg font-bold text-yellow-600">
                {realtimeStats.pendingRepairs}
              </div>
              <div className="text-xs text-muted-foreground">Pending</div>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-lg font-bold text-purple-600">
                {realtimeStats.completedToday}
              </div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="mobile-content">
        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Mobile Dashboard Stats */}
            <div className="dashboard-stats">
              <div className="stat-card">
                <div className="stat-number text-blue-600">
                  {realtimeStats.newBookings}
                </div>
                <div className="stat-label">New Bookings</div>
              </div>
              <div className="stat-card">
                <div className="stat-number text-green-600">
                  {realtimeStats.activeRepairs}
                </div>
                <div className="stat-label">Active Repairs</div>
              </div>
              <div className="stat-card">
                <div className="stat-number text-yellow-600">
                  {realtimeStats.pendingRepairs}
                </div>
                <div className="stat-label">Pending Queue</div>
              </div>
              <div className="stat-card">
                <div className="stat-number text-purple-600">
                  {realtimeStats.completedToday}
                </div>
                <div className="stat-label">Completed Today</div>
              </div>
            </div>

            {/* Mobile Quick Actions */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="quick-actions">
                <div className="quick-action">
                  <div className="quick-action-icon">📝</div>
                  <div className="quick-action-label">New Repair</div>
                </div>
                <div className="quick-action">
                  <div className="quick-action-icon">👤</div>
                  <div className="quick-action-label">Find Customer</div>
                </div>
                <div className="quick-action">
                  <div className="quick-action-icon">📦</div>
                  <div className="quick-action-label">Check Stock</div>
                </div>
                <div className="quick-action">
                  <div className="quick-action-icon">📊</div>
                  <div className="quick-action-label">View Reports</div>
                </div>
                <div className="quick-action">
                  <div className="quick-action-icon">⚙️</div>
                  <div className="quick-action-label">Settings</div>
                </div>
                <div className="quick-action">
                  <div className="quick-action-icon">🔔</div>
                  <div className="quick-action-label">Notifications</div>
                </div>
              </div>
            </Card>

            {/* Mobile Repair Queue */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Active Repairs</h3>
              <div className="repair-queue">
                <div className="queue-item">
                  <div className="queue-item-header">
                    <div className="queue-item-title">MacBook Pro 16" 2023</div>
                    <div className="queue-item-status bg-yellow-100 text-yellow-800">
                      In Progress
                    </div>
                  </div>
                  <div className="queue-item-details">
                    Screen replacement • Assigned to John • Est. 2 hours
                  </div>
                </div>
                
                <div className="queue-item">
                  <div className="queue-item-header">
                    <div className="queue-item-title">iPhone 15 Pro</div>
                    <div className="queue-item-status bg-blue-100 text-blue-800">
                      Pending
                    </div>
                  </div>
                  <div className="queue-item-details">
                    Battery replacement • Waiting for parts • Priority: High
                  </div>
                </div>
                
                <div className="queue-item">
                  <div className="queue-item-header">
                    <div className="queue-item-title">Dell XPS 13</div>
                    <div className="queue-item-status bg-red-100 text-red-800">
                      Urgent
                    </div>
                  </div>
                  <div className="queue-item-details">
                    Data recovery • Customer waiting • Deadline: Today
                  </div>
                </div>
              </div>
            </Card>

            {/* CRM Integration Status */}
            <Card className="p-6">
              <CRMIntegrationStatus />
            </Card>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <AdvancedAnalytics />
          </div>
        )}

        {activeTab === 'intelligence' && (
          <div className="space-y-6">
            <BusinessIntelligence />
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="space-y-6">
            <PerformanceOptimization />
          </div>
        )}

        {activeTab === 'components' && (
          <div className="space-y-6">
            <ComponentShowcase />
          </div>
        )}

        {activeTab === 'design-system' && (
          <div className="space-y-6">
            <DesignSystemDocs />
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-navigation">
        <div className="flex justify-around items-center">
          {tabs.slice(0, 4).map((tab) => (
            <Button
              key={tab.id}
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 flex flex-col items-center justify-center',
                'py-2 touch-target min-h-12',
                activeTab === tab.id && 'bg-primary/10'
              )}
            >
              <span className={cn(
                'text-lg',
                activeTab === tab.id ? tab.color : 'text-muted-foreground'
              )}>
                {tab.icon}
              </span>
              <span className={cn(
                'text-xs mt-1',
                activeTab === tab.id ? 'text-primary font-medium' : 'text-muted-foreground'
              )}>
                {tab.label === 'Intelligence' ? 'Intel' : tab.label}
              </span>
            </Button>
          ))}
          
          {/* More menu for additional tabs */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSidebarOpen(true)}
            className={cn(
              'flex-1 flex flex-col items-center justify-center',
              'py-2 touch-target min-h-12'
            )}
          >
            <span className="text-lg text-muted-foreground">⋯</span>
            <span className="text-xs mt-1 text-muted-foreground">More</span>
          </Button>
        </div>
      </nav>
    </div>
  );
};

export default MobileAdminDashboard;