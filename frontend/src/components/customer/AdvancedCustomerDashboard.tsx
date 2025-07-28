'use client';

/**
 * Advanced Customer Dashboard Component
 * 
 * Features:
 * - Real-time repair tracking with WebSocket integration
 * - Interactive repair timeline
 * - Photo galleries for repair documentation
 * - Communication center with technicians
 * - Live status updates and notifications
 * - Quick actions and repair management
 */

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useRealTimeBookings } from '@/hooks/useRealTimeBookings';

interface RepairStatus {
  id: string;
  deviceName: string;
  repairType: string;
  status: 'pending' | 'diagnosis' | 'in-progress' | 'waiting-parts' | 'completed' | 'ready-for-pickup';
  progress: number;
  estimatedCompletion: string;
  technician?: {
    name: string;
    avatar?: string;
    isOnline: boolean;
  };
  timeline: {
    step: string;
    status: 'completed' | 'current' | 'pending';
    timestamp?: string;
    description?: string;
  }[];
  photos: {
    id: string;
    url: string;
    caption: string;
    type: 'before' | 'during' | 'after';
    timestamp: string;
  }[];
  messages: {
    id: string;
    from: 'technician' | 'system' | 'customer';
    message: string;
    timestamp: string;
    read: boolean;
  }[];
}

interface CustomerDashboardProps {
  customerId?: string;
  authToken?: string;
}

export default function AdvancedCustomerDashboard({ customerId, authToken }: CustomerDashboardProps) {
  const [repairs, setRepairs] = useState<RepairStatus[]>([]);
  const [selectedRepair, setSelectedRepair] = useState<RepairStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [messageInput, setMessageInput] = useState('');

  // Generate demo token for development
  const generateDemoToken = () => {
    // For development mode, the backend accepts any demo token
    return 'demo-customer-token';
  };

  // Real-time WebSocket integration
  const {
    isConnected,
    isConnecting,
    notifications,
    unreadCount,
    subscribeToRepair,
    unsubscribeFromRepair,
    sendMessageToTechnician,
    markNotificationAsRead,
    clearNotifications,
  } = useRealTimeBookings({
    customerId: customerId || 'demo-customer',
    authToken: authToken || generateDemoToken(),
    onRepairUpdate: (update) => {
      console.log('Repair update received:', update);
      // Update the repair in the local state
      setRepairs(prev => prev.map(repair => 
        repair.id === update.repairId 
          ? { ...repair, ...update.data }
          : repair
      ));
    },
    onNewMessage: (message) => {
      console.log('New message received:', message);
      // Add message to the selected repair
      if (selectedRepair && message.repairId === selectedRepair.id) {
        setSelectedRepair(prev => prev ? {
          ...prev,
          messages: [...prev.messages, {
            id: message.id || Date.now().toString(),
            from: message.from,
            message: message.content,
            timestamp: message.timestamp,
            read: false,
          }]
        } : null);
      }
    },
    onConnectionChange: (connected) => {
      console.log('Connection status changed:', connected);
    },
  });

  // Load initial repair data
  useEffect(() => {
    // Mock data - replace with real API call
    const mockRepairs: RepairStatus[] = [
      {
        id: 'repair-001',
        deviceName: 'MacBook Pro 16" M1 Max',
        repairType: 'Screen Repair',
        status: 'in-progress',
        progress: 65,
        estimatedCompletion: '2025-07-15T14:00:00Z',
        technician: {
          name: 'Sarah Johnson',
          avatar: '/avatars/sarah.jpg',
          isOnline: true,
        },
        timeline: [
          {
            step: 'Booking Received',
            status: 'completed',
            timestamp: '2025-07-13T09:00:00Z',
            description: 'Your repair booking has been confirmed'
          },
          {
            step: 'Initial Diagnosis',
            status: 'completed',
            timestamp: '2025-07-13T10:30:00Z',
            description: 'Device inspected and diagnosis completed'
          },
          {
            step: 'Parts Ordered',
            status: 'completed',
            timestamp: '2025-07-13T11:00:00Z',
            description: 'Genuine Apple screen ordered from supplier'
          },
          {
            step: 'Repair in Progress',
            status: 'current',
            timestamp: '2025-07-13T14:00:00Z',
            description: 'Screen replacement currently being performed'
          },
          {
            step: 'Quality Testing',
            status: 'pending',
            description: 'Comprehensive testing and quality assurance'
          },
          {
            step: 'Ready for Collection',
            status: 'pending',
            description: 'Device ready for customer pickup'
          },
        ],
        photos: [
          {
            id: 'photo-001',
            url: '/repair-photos/macbook-before.jpg',
            caption: 'Device condition upon arrival',
            type: 'before',
            timestamp: '2025-07-13T09:15:00Z'
          },
          {
            id: 'photo-002',
            url: '/repair-photos/macbook-diagnosis.jpg',
            caption: 'Detailed damage assessment',
            type: 'during',
            timestamp: '2025-07-13T10:30:00Z'
          },
        ],
        messages: [
          {
            id: 'msg-001',
            from: 'system',
            message: 'Your repair has been assigned to technician Sarah Johnson',
            timestamp: '2025-07-13T09:30:00Z',
            read: true
          },
          {
            id: 'msg-002',
            from: 'technician',
            message: 'Hi! I\'ve completed the initial diagnosis. The screen assembly needs to be replaced. I\'ve ordered a genuine Apple part which should arrive tomorrow morning.',
            timestamp: '2025-07-13T11:15:00Z',
            read: true
          },
          {
            id: 'msg-003',
            from: 'technician',
            message: 'Great news! The part arrived early and I\'m starting the repair now. Should be completed by 2 PM today.',
            timestamp: '2025-07-13T14:00:00Z',
            read: false
          },
        ]
      },
      {
        id: 'repair-002',
        deviceName: 'iPhone 14 Pro',
        repairType: 'Battery Replacement',
        status: 'waiting-parts',
        progress: 30,
        estimatedCompletion: '2025-07-16T16:00:00Z',
        technician: {
          name: 'Mike Chen',
          avatar: '/avatars/mike.jpg',
          isOnline: false,
        },
        timeline: [
          {
            step: 'Booking Received',
            status: 'completed',
            timestamp: '2025-07-12T15:00:00Z',
            description: 'Your repair booking has been confirmed'
          },
          {
            step: 'Initial Diagnosis',
            status: 'completed',
            timestamp: '2025-07-13T09:00:00Z',
            description: 'Battery health confirmed at 67%, replacement recommended'
          },
          {
            step: 'Parts Ordered',
            status: 'current',
            timestamp: '2025-07-13T09:30:00Z',
            description: 'Genuine Apple battery ordered - arriving Monday'
          },
          {
            step: 'Battery Replacement',
            status: 'pending',
            description: 'Professional battery replacement service'
          },
          {
            step: 'Testing & Calibration',
            status: 'pending',
            description: 'Battery calibration and device testing'
          },
          {
            step: 'Ready for Collection',
            status: 'pending',
            description: 'Device ready for customer pickup'
          },
        ],
        photos: [
          {
            id: 'photo-003',
            url: '/repair-photos/iphone-battery-test.jpg',
            caption: 'Battery health diagnostic results',
            type: 'before',
            timestamp: '2025-07-13T09:00:00Z'
          },
        ],
        messages: [
          {
            id: 'msg-004',
            from: 'technician',
            message: 'Battery diagnostic complete. Your battery is at 67% health which explains the short battery life. I\'ve ordered a genuine replacement.',
            timestamp: '2025-07-13T09:30:00Z',
            read: true
          },
        ]
      }
    ];

    setRepairs(mockRepairs);
    setSelectedRepair(mockRepairs[0]);
    setIsLoading(false);

    // Subscribe to repair updates for all repairs
    mockRepairs.forEach(repair => {
      subscribeToRepair(repair.id);
    });
  }, [subscribeToRepair]);

  // Handle sending messages to technician
  const handleSendMessage = useCallback((repairId: string, message: string) => {
    if (!message.trim()) return;
    
    sendMessageToTechnician(repairId, message);
    
    // Optimistically add message to UI
    if (selectedRepair && repairId === selectedRepair.id) {
      setSelectedRepair(prev => prev ? {
        ...prev,
        messages: [...prev.messages, {
          id: Date.now().toString(),
          from: 'customer',
          message: message.trim(),
          timestamp: new Date().toISOString(),
          read: true,
        }]
      } : null);
    }
    
    setMessageInput('');
  }, [sendMessageToTechnician, selectedRepair]);

  // Handle notification clicks
  const handleNotificationClick = useCallback((notificationId: string) => {
    markNotificationAsRead(notificationId);
  }, [markNotificationAsRead]);

  const getStatusColor = (status: RepairStatus['status']) => {
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

  const getTimelineStepIcon = (status: 'completed' | 'current' | 'pending') => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'current':
        return '🔄';
      default:
        return '⏳';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your repairs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with real-time connection status */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Repairs</h1>
        <div className="flex items-center space-x-4">
          {/* Real-time connection status */}
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : isConnecting ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">
              {isConnected ? 'Live Updates Active' : isConnecting ? 'Connecting...' : 'Offline'}
            </span>
          </div>
          
          {/* Notifications indicator */}
          {unreadCount > 0 && (
            <div className="relative">
              <button 
                onClick={() => clearNotifications()}
                className="flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm hover:bg-blue-200 transition-colors"
              >
                <span>🔔</span>
                <span>{unreadCount}</span>
                <span className="text-xs">new</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-blue-600">{repairs.length}</div>
          <div className="text-sm text-gray-600">Active Repairs</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">
            {repairs.filter(r => r.status === 'completed').length}
          </div>
          <div className="text-sm text-gray-600">Completed</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-yellow-600">
            {repairs.filter(r => r.status === 'in-progress').length}
          </div>
          <div className="text-sm text-gray-600">In Progress</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-orange-600">
            {unreadCount}
          </div>
          <div className="text-sm text-gray-600">New Updates</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Repairs List */}
        <div className="lg:col-span-1">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Your Repairs</h2>
            <div className="space-y-4">
              {repairs.map((repair) => (
                <div
                  key={repair.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedRepair?.id === repair.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedRepair(repair)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{repair.deviceName}</h3>
                    <Badge className={getStatusColor(repair.status)}>
                      {repair.status.replace('-', ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{repair.repairType}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {repair.progress}% complete
                    </span>
                    {repair.technician?.isOnline && (
                      <span className="text-xs text-green-600">● Technician online</span>
                    )}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${repair.progress}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Detailed View */}
        <div className="lg:col-span-2">
          {selectedRepair && (
            <div className="space-y-6">
              {/* Repair Header */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-semibold">{selectedRepair.deviceName}</h2>
                  <Badge className={getStatusColor(selectedRepair.status)}>
                    {selectedRepair.status.replace('-', ' ')}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Repair Type</p>
                    <p className="font-medium">{selectedRepair.repairType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Estimated Completion</p>
                    <p className="font-medium">
                      {new Date(selectedRepair.estimatedCompletion).toLocaleDateString()}
                    </p>
                  </div>
                  {selectedRepair.technician && (
                    <div>
                      <p className="text-sm text-gray-600">Technician</p>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${
                          selectedRepair.technician.isOnline ? 'bg-green-500' : 'bg-gray-400'
                        }`}></div>
                        <p className="font-medium">{selectedRepair.technician.name}</p>
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600">Progress</p>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${selectedRepair.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{selectedRepair.progress}%</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Timeline */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Repair Timeline</h3>
                <div className="space-y-4">
                  {selectedRepair.timeline.map((step, index) => (
                    <div key={index} className="flex items-start space-x-4">
                      <div className="flex-shrink-0 text-lg">
                        {getTimelineStepIcon(step.status)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className={`font-medium ${
                            step.status === 'current' ? 'text-blue-600' : 
                            step.status === 'completed' ? 'text-green-600' : 'text-gray-500'
                          }`}>
                            {step.step}
                          </h4>
                          {step.timestamp && (
                            <span className="text-xs text-gray-500">
                              {new Date(step.timestamp).toLocaleString()}
                            </span>
                          )}
                        </div>
                        {step.description && (
                          <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Messages */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Messages</h3>
                <div className="space-y-4 max-h-64 overflow-y-auto">
                  {selectedRepair.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-3 rounded-lg ${
                        message.from === 'technician' ? 'bg-blue-50' :
                        message.from === 'customer' ? 'bg-green-50' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium capitalize">{message.from}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(message.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm">{message.message}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex space-x-2">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(selectedRepair.id, messageInput);
                      }
                    }}
                  />
                  <Button 
                    onClick={() => handleSendMessage(selectedRepair.id, messageInput)}
                    disabled={!messageInput.trim() || !isConnected}
                  >
                    Send
                  </Button>
                </div>
              </Card>

              {/* Photos */}
              {selectedRepair.photos.length > 0 && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Repair Photos</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedRepair.photos.map((photo) => (
                      <div key={photo.id} className="relative">
                        <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-gray-500">Photo Preview</span>
                        </div>
                        <div className="mt-2">
                          <p className="text-sm font-medium">{photo.caption}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(photo.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Real-time Notifications Panel */}
      {notifications.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Recent Updates</h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={clearNotifications}
            >
              Clear All
            </Button>
          </div>
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {notifications.slice(0, 5).map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg border-l-4 cursor-pointer transition-all ${
                  notification.read 
                    ? 'border-gray-300 bg-gray-50' 
                    : 'border-blue-500 bg-blue-50 hover:bg-blue-100'
                }`}
                onClick={() => handleNotificationClick(notification.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-sm">{notification.title}</h4>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(notification.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-lg">
                    {notification.type === 'repair_update' ? '🔧' : 
                     notification.type === 'message' ? '💬' : '📢'}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {notifications.length > 5 && (
            <div className="mt-3 text-center">
              <span className="text-sm text-gray-500">
                +{notifications.length - 5} more notifications
              </span>
            </div>
          )}
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-4">
          <Button>Book New Repair</Button>
          <Button variant="secondary">Contact Support</Button>
          <Button variant="outline">Download Invoice</Button>
          <Button variant="outline">Leave Review</Button>
        </div>
      </Card>
    </div>
  );
}