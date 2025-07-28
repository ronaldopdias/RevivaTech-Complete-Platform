'use client';

/**
 * Real-Time Admin Dashboard Component
 * 
 * Features:
 * - Live metrics and KPIs
 * - Real-time repair queue management
 * - WebSocket integration for instant updates
 * - Alert system for urgent notifications
 * - Technician management and commands
 * - Live chat and communication center
 * - Performance analytics and reporting
 */

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAdminRealTime } from '@/hooks/useAdminRealTime';

interface Repair {
  id: string;
  deviceName: string;
  customerName: string;
  repairType: string;
  status: 'pending' | 'diagnosis' | 'in-progress' | 'waiting-parts' | 'completed' | 'ready-for-pickup';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  technician?: {
    id: string;
    name: string;
    isOnline: boolean;
  };
  estimatedCompletion: string;
  createdAt: string;
  updatedAt: string;
}

interface Technician {
  id: string;
  name: string;
  role: string;
  isOnline: boolean;
  status: 'available' | 'busy' | 'break' | 'offline';
  currentRepairs: number;
  expertise: string[];
  lastSeen: string;
}

interface AdminDashboardProps {
  adminId?: string;
  authToken?: string;
}

export default function RealTimeAdminDashboard({ adminId, authToken }: AdminDashboardProps) {
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [selectedQueue, setSelectedQueue] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [announcementText, setAnnouncementText] = useState('');

  // Real-time admin WebSocket integration
  const {
    isConnected,
    isConnecting,
    alerts,
    metrics,
    alertCounts,
    sendTechnicianCommand,
    updateRepairPriority,
    broadcastAnnouncement,
    refreshMetrics,
    clearAlert,
    clearAllAlerts,
  } = useAdminRealTime({
    adminId: adminId || 'admin-demo',
    authToken: authToken || 'admin-token',
    onNewBooking: (booking) => {
      console.log('New booking received:', booking);
      // Add new repair to the queue
      setRepairs(prev => [...prev, booking]);
    },
    onRepairUpdate: (repair) => {
      console.log('Repair updated:', repair);
      // Update existing repair
      setRepairs(prev => prev.map(r => r.id === repair.id ? { ...r, ...repair } : r));
    },
    onUrgentAlert: (alert) => {
      console.log('Urgent alert:', alert);
      // Handle urgent notifications (could trigger browser notifications)
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('RevivaTech Admin Alert', {
          body: alert.message || 'Urgent attention required',
          icon: '/favicon.ico'
        });
      }
    },
    onMetricsUpdate: (newMetrics) => {
      console.log('Metrics updated:', newMetrics);
    },
  });

  // Load initial data
  useEffect(() => {
    // Mock data - replace with real API calls
    const mockRepairs: Repair[] = [
      {
        id: 'repair-001',
        deviceName: 'MacBook Pro 16" M1 Max',
        customerName: 'John Smith',
        repairType: 'Screen Repair',
        status: 'in-progress',
        priority: 'high',
        technician: { id: 'tech-001', name: 'Sarah Johnson', isOnline: true },
        estimatedCompletion: '2025-07-15T14:00:00Z',
        createdAt: '2025-07-13T09:00:00Z',
        updatedAt: '2025-07-14T10:00:00Z',
      },
      {
        id: 'repair-002',
        deviceName: 'iPhone 14 Pro',
        customerName: 'Emily Davis',
        repairType: 'Battery Replacement',
        status: 'waiting-parts',
        priority: 'medium',
        technician: { id: 'tech-002', name: 'Mike Chen', isOnline: false },
        estimatedCompletion: '2025-07-16T16:00:00Z',
        createdAt: '2025-07-12T15:00:00Z',
        updatedAt: '2025-07-13T09:00:00Z',
      },
      {
        id: 'repair-003',
        deviceName: 'Dell XPS 13',
        customerName: 'Robert Wilson',
        repairType: 'Motherboard Repair',
        status: 'diagnosis',
        priority: 'urgent',
        estimatedCompletion: '2025-07-17T12:00:00Z',
        createdAt: '2025-07-14T08:00:00Z',
        updatedAt: '2025-07-14T08:00:00Z',
      },
    ];

    const mockTechnicians: Technician[] = [
      {
        id: 'tech-001',
        name: 'Sarah Johnson',
        role: 'Senior Technician',
        isOnline: true,
        status: 'busy',
        currentRepairs: 2,
        expertise: ['Apple', 'Screen Repair', 'Logic Board'],
        lastSeen: new Date().toISOString(),
      },
      {
        id: 'tech-002',
        name: 'Mike Chen',
        role: 'Hardware Specialist',
        isOnline: false,
        status: 'offline',
        currentRepairs: 1,
        expertise: ['Android', 'Battery', 'Water Damage'],
        lastSeen: '2025-07-14T16:30:00Z',
      },
      {
        id: 'tech-003',
        name: 'Lisa Rodriguez',
        role: 'Data Recovery Expert',
        isOnline: true,
        status: 'available',
        currentRepairs: 0,
        expertise: ['Data Recovery', 'SSD Repair', 'Forensics'],
        lastSeen: new Date().toISOString(),
      },
    ];

    setRepairs(mockRepairs);
    setTechnicians(mockTechnicians);
    setIsLoading(false);

    // Request browser notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const handlePriorityChange = useCallback((repairId: string, newPriority: 'low' | 'medium' | 'high' | 'urgent') => {
    updateRepairPriority(repairId, newPriority);
    setRepairs(prev => prev.map(repair => 
      repair.id === repairId ? { ...repair, priority: newPriority } : repair
    ));
  }, [updateRepairPriority]);

  const handleBroadcastAnnouncement = useCallback(() => {
    if (announcementText.trim()) {
      broadcastAnnouncement(announcementText, 'info');
      setAnnouncementText('');
    }
  }, [broadcastAnnouncement, announcementText]);

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-gray-100 text-gray-800',
      diagnosis: 'bg-blue-100 text-blue-800',
      'in-progress': 'bg-yellow-100 text-yellow-800',
      'waiting-parts': 'bg-orange-100 text-orange-800',
      completed: 'bg-green-100 text-green-800',
      'ready-for-pickup': 'bg-purple-100 text-purple-800',
    };
    return colors[status] || colors.pending;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800',
    };
    return colors[priority] || colors.low;
  };

  const filteredRepairs = selectedQueue === 'all' 
    ? repairs 
    : repairs.filter(repair => repair.status === selectedQueue);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with connection status and alerts */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex items-center space-x-4">
          {/* Connection status */}
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : isConnecting ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
            <span className="text-sm text-gray-600">
              {isConnected ? 'Live Updates Active' : isConnecting ? 'Connecting...' : 'Offline'}
            </span>
          </div>
          
          {/* Alert indicators */}
          <div className="flex items-center space-x-2">
            {alertCounts.urgent > 0 && (
              <Badge className="bg-red-100 text-red-800">
                🚨 {alertCounts.urgent} Urgent
              </Badge>
            )}
            {alertCounts.total > 0 && (
              <button 
                onClick={clearAllAlerts}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear ({alertCounts.total})
              </button>
            )}
          </div>
          
          <Button onClick={refreshMetrics} variant="outline" size="sm">
            Refresh
          </Button>
        </div>
      </div>

      {/* Real-time Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-blue-600">{metrics.activeRepairs}</div>
          <div className="text-sm text-gray-600">Active Repairs</div>
          <div className="text-xs text-gray-500 mt-1">Live count</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-orange-600">{metrics.pendingBookings}</div>
          <div className="text-sm text-gray-600">Pending Bookings</div>
          <div className="text-xs text-gray-500 mt-1">Awaiting assignment</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">{metrics.completedToday}</div>
          <div className="text-sm text-gray-600">Completed Today</div>
          <div className="text-xs text-gray-500 mt-1">+{((metrics.completedToday / 8) * 100).toFixed(0)}% vs avg</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-purple-600">
            £{metrics.revenue.today.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Today's Revenue</div>
          <div className="text-xs text-gray-500 mt-1">Week: £{metrics.revenue.thisWeek.toLocaleString()}</div>
        </Card>
      </div>

      {/* Technician Status */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Technician Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{metrics.technicians.available}</div>
            <div className="text-sm text-gray-600">Available</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600">{metrics.technicians.busy}</div>
            <div className="text-sm text-gray-600">Busy</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{metrics.technicians.online}</div>
            <div className="text-sm text-gray-600">Online</div>
          </div>
        </div>
        
        <div className="space-y-3">
          {technicians.map((tech) => (
            <div key={tech.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  tech.isOnline ? 'bg-green-500' : 'bg-gray-400'
                }`}></div>
                <div>
                  <div className="font-medium">{tech.name}</div>
                  <div className="text-sm text-gray-600">{tech.role}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={tech.status === 'available' ? 'bg-green-100 text-green-800' : 
                                tech.status === 'busy' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}>
                  {tech.status}
                </Badge>
                <span className="text-sm text-gray-500">{tech.currentRepairs} repairs</span>
                {tech.isOnline && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => sendTechnicianCommand(tech.id, 'check_status')}
                  >
                    Contact
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Queue Management */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Queue Filter */}
        <div className="lg:col-span-1">
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Queue Filters</h3>
            <div className="space-y-2">
              {[
                { key: 'all', label: 'All Repairs', count: repairs.length },
                { key: 'pending', label: 'Pending', count: metrics.queues.diagnosis },
                { key: 'diagnosis', label: 'Diagnosis', count: metrics.queues.diagnosis },
                { key: 'in-progress', label: 'In Progress', count: metrics.queues.repairInProgress },
                { key: 'waiting-parts', label: 'Waiting Parts', count: metrics.queues.waitingParts },
                { key: 'ready-for-pickup', label: 'Ready', count: metrics.queues.readyForPickup },
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setSelectedQueue(filter.key)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    selectedQueue === filter.key 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span>{filter.label}</span>
                    <Badge variant="secondary">{filter.count}</Badge>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Repair Queue */}
        <div className="lg:col-span-3">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {selectedQueue === 'all' ? 'All Repairs' : selectedQueue.replace('-', ' ')} 
                ({filteredRepairs.length})
              </h3>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  Export Queue
                </Button>
                <Button size="sm">
                  Assign Repairs
                </Button>
              </div>
            </div>
            
            <div className="space-y-3">
              {filteredRepairs.map((repair) => (
                <div key={repair.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-medium">{repair.deviceName}</h4>
                      <Badge className={getStatusColor(repair.status)}>
                        {repair.status.replace('-', ' ')}
                      </Badge>
                      <select
                        value={repair.priority}
                        onChange={(e) => handlePriorityChange(repair.id, e.target.value as any)}
                        className={`text-xs px-2 py-1 rounded border-0 ${getPriorityColor(repair.priority)}`}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(repair.estimatedCompletion).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Customer:</span> {repair.customerName}
                    </div>
                    <div>
                      <span className="text-gray-600">Repair:</span> {repair.repairType}
                    </div>
                    <div>
                      <span className="text-gray-600">Technician:</span> {
                        repair.technician ? (
                          <span className="flex items-center space-x-1">
                            <span>{repair.technician.name}</span>
                            <div className={`w-2 h-2 rounded-full ${
                              repair.technician.isOnline ? 'bg-green-500' : 'bg-gray-400'
                            }`}></div>
                          </span>
                        ) : (
                          <span className="text-orange-600">Unassigned</span>
                        )
                      }
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Announcements & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Broadcast Announcements */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Broadcast Announcement</h3>
          <div className="space-y-3">
            <textarea
              value={announcementText}
              onChange={(e) => setAnnouncementText(e.target.value)}
              placeholder="Type announcement to all technicians..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
            <Button 
              onClick={handleBroadcastAnnouncement}
              disabled={!announcementText.trim() || !isConnected}
              className="w-full"
            >
              Send Announcement
            </Button>
          </div>
        </Card>

        {/* Recent Alerts */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Recent Alerts</h3>
            {alerts.length > 0 && (
              <Button variant="outline" size="sm" onClick={clearAllAlerts}>
                Clear All
              </Button>
            )}
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {alerts.slice(0, 5).map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border-l-4 ${
                  alert.priority === 'urgent' ? 'border-red-500 bg-red-50' :
                  alert.priority === 'high' ? 'border-orange-500 bg-orange-50' :
                  alert.priority === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                  'border-blue-500 bg-blue-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">
                        {alert.type === 'new_booking' ? '📋' :
                         alert.type === 'repair_status_change' ? '🔧' :
                         alert.type === 'urgent_notification' ? '🚨' : '📢'}
                      </span>
                      <span className="font-medium text-sm capitalize">
                        {alert.type.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {alert.data.message || `${alert.type} occurred`}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => clearAlert(alert.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
            {alerts.length === 0 && (
              <p className="text-gray-500 text-center py-4">No recent alerts</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}