'use client';

/**
 * Real-Time Repair Tracker Component
 * 
 * Advanced real-time repair tracking with:
 * - Live status updates via WebSocket
 * - Interactive timeline with milestones
 * - Real-time technician communication
 * - Photo gallery with repair progress
 * - Estimated completion time tracking
 * - Mobile-optimized responsive design
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useRealTimeRepairTracking } from '@/hooks/useRealTimeRepairTracking';
import { Clock, MapPin, User, Camera, MessageCircle, CheckCircle, AlertCircle, Wrench } from 'lucide-react';

interface RepairMilestone {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'pending' | 'delayed';
  timestamp?: string;
  estimatedDuration: string;
  technician?: {
    name: string;
    avatar?: string;
    isOnline: boolean;
  };
  photos: RepairPhoto[];
  notes?: string;
}

interface RepairPhoto {
  id: string;
  url: string;
  caption: string;
  timestamp: string;
  type: 'diagnostic' | 'progress' | 'completion' | 'quality_check';
}

interface RepairTrackingData {
  repairId: string;
  deviceName: string;
  repairType: string;
  currentStatus: 'received' | 'diagnosing' | 'parts_ordered' | 'in_progress' | 'testing' | 'completed' | 'ready_pickup';
  overallProgress: number;
  estimatedCompletion: string;
  currentMilestone: string;
  milestones: RepairMilestone[];
  priority: 'standard' | 'express' | 'urgent';
  location: string;
  customerNotes?: string;
}

interface RealTimeRepairTrackerProps {
  repairId: string;
  customerId?: string;
  className?: string;
}

export default function RealTimeRepairTracker({ 
  repairId, 
  customerId = 'demo-customer', 
  className = '' 
}: RealTimeRepairTrackerProps) {
  const [repairData, setRepairData] = useState<RepairTrackingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<RepairPhoto | null>(null);
  const [newMessage, setNewMessage] = useState('');

  // Real-time tracking hook
  const {
    isConnected,
    lastUpdate,
    trackingData,
    notifications,
    sendMessage,
    requestPhotoUpdate,
    requestStatusUpdate
  } = useRealTimeRepairTracking({
    repairId,
    customerId,
    onStatusUpdate: (update) => {
      console.log('Status update received:', update);
      setRepairData(prev => prev ? { ...prev, ...update } : null);
    },
    onMilestoneUpdate: (milestone) => {
      console.log('Milestone update:', milestone);
      setRepairData(prev => {
        if (!prev) return null;
        const updatedMilestones = prev.milestones.map(m => 
          m.id === milestone.id ? { ...m, ...milestone } : m
        );
        return { ...prev, milestones: updatedMilestones };
      });
    },
    onPhotoAdded: (photo) => {
      console.log('New photo added:', photo);
      setRepairData(prev => {
        if (!prev) return null;
        const milestoneIndex = prev.milestones.findIndex(m => m.id === photo.milestoneId);
        if (milestoneIndex === -1) return prev;
        
        const updatedMilestones = [...prev.milestones];
        updatedMilestones[milestoneIndex] = {
          ...updatedMilestones[milestoneIndex],
          photos: [...updatedMilestones[milestoneIndex].photos, photo]
        };
        return { ...prev, milestones: updatedMilestones };
      });
    }
  });

  // Load initial repair data
  useEffect(() => {
    // Mock data - replace with real API call
    const mockRepairData: RepairTrackingData = {
      repairId: repairId,
      deviceName: 'MacBook Pro 16" M1 Max',
      repairType: 'Screen Replacement',
      currentStatus: 'in_progress',
      overallProgress: 65,
      estimatedCompletion: '2025-07-20T14:00:00Z',
      currentMilestone: 'repair-in-progress',
      priority: 'express',
      location: 'Workshop Station 3',
      customerNotes: 'Handle with care - important work files on device',
      milestones: [
        {
          id: 'device-received',
          title: 'Device Received',
          description: 'Your device has been safely received and logged into our system',
          status: 'completed',
          timestamp: '2025-07-18T09:00:00Z',
          estimatedDuration: '15 minutes',
          technician: {
            name: 'James Mitchell',
            avatar: '/avatars/james.jpg',
            isOnline: false
          },
          photos: [
            {
              id: 'photo-receive-1',
              url: '/repair-photos/macbook-received-condition.jpg',
              caption: 'Device condition upon arrival - noting existing damage',
              timestamp: '2025-07-18T09:15:00Z',
              type: 'diagnostic'
            }
          ],
          notes: 'Device received in good condition with cracked screen as reported'
        },
        {
          id: 'initial-diagnosis',
          title: 'Diagnostic Assessment',
          description: 'Comprehensive diagnostic to assess damage and determine repair approach',
          status: 'completed',
          timestamp: '2025-07-18T10:30:00Z',
          estimatedDuration: '45 minutes',
          technician: {
            name: 'Sarah Johnson',
            avatar: '/avatars/sarah.jpg',
            isOnline: true
          },
          photos: [
            {
              id: 'photo-diag-1',
              url: '/repair-photos/macbook-diagnostic-1.jpg',
              caption: 'Detailed examination of screen damage extent',
              timestamp: '2025-07-18T10:45:00Z',
              type: 'diagnostic'
            },
            {
              id: 'photo-diag-2',
              url: '/repair-photos/macbook-diagnostic-2.jpg',
              caption: 'Internal connection inspection - all cables intact',
              timestamp: '2025-07-18T11:00:00Z',
              type: 'diagnostic'
            }
          ],
          notes: 'Screen assembly replacement required. LCD panel damaged but digitizer functional. Internal components unaffected.'
        },
        {
          id: 'parts-procurement',
          title: 'Parts Procurement',
          description: 'Ordering genuine replacement parts from authorized suppliers',
          status: 'completed',
          timestamp: '2025-07-18T11:30:00Z',
          estimatedDuration: '24-48 hours',
          technician: {
            name: 'Sarah Johnson',
            avatar: '/avatars/sarah.jpg',
            isOnline: true
          },
          photos: [],
          notes: 'Genuine Apple Liquid Retina XDR display assembly ordered. Express delivery confirmed for next business day.'
        },
        {
          id: 'repair-in-progress',
          title: 'Repair in Progress',
          description: 'Professional screen replacement and calibration in progress',
          status: 'current',
          timestamp: '2025-07-19T14:00:00Z',
          estimatedDuration: '2-3 hours',
          technician: {
            name: 'Sarah Johnson',
            avatar: '/avatars/sarah.jpg',
            isOnline: true
          },
          photos: [
            {
              id: 'photo-progress-1',
              url: '/repair-photos/macbook-disassembly.jpg',
              caption: 'Careful disassembly of device housing',
              timestamp: '2025-07-19T14:30:00Z',
              type: 'progress'
            },
            {
              id: 'photo-progress-2',
              url: '/repair-photos/macbook-screen-removal.jpg',
              caption: 'Removing damaged screen assembly',
              timestamp: '2025-07-19T15:15:00Z',
              type: 'progress'
            }
          ],
          notes: 'Screen replacement in progress. All safety protocols being followed. Expected completion in 90 minutes.'
        },
        {
          id: 'quality-testing',
          title: 'Quality Assurance',
          description: 'Comprehensive testing and calibration of repaired device',
          status: 'pending',
          estimatedDuration: '30 minutes',
          technician: {
            name: 'Sarah Johnson',
            avatar: '/avatars/sarah.jpg',
            isOnline: true
          },
          photos: [],
          notes: ''
        },
        {
          id: 'final-inspection',
          title: 'Final Inspection',
          description: 'Final quality check and preparation for customer pickup',
          status: 'pending',
          estimatedDuration: '15 minutes',
          technician: {
            name: 'Sarah Johnson',
            avatar: '/avatars/sarah.jpg',
            isOnline: true
          },
          photos: [],
          notes: ''
        },
        {
          id: 'ready-for-pickup',
          title: 'Ready for Pickup',
          description: 'Repair completed successfully and device ready for collection',
          status: 'pending',
          estimatedDuration: '5 minutes',
          technician: {
            name: 'Front Desk',
            isOnline: true
          },
          photos: [],
          notes: ''
        }
      ]
    };

    setRepairData(mockRepairData);
    setIsLoading(false);
  }, [repairId]);

  const getStatusColor = (status: RepairTrackingData['currentStatus']) => {
    const colors = {
      received: 'bg-blue-100 text-blue-800',
      diagnosing: 'bg-purple-100 text-purple-800',
      parts_ordered: 'bg-orange-100 text-orange-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      testing: 'bg-indigo-100 text-indigo-800',
      completed: 'bg-green-100 text-green-800',
      ready_pickup: 'bg-emerald-100 text-emerald-800',
    };
    return colors[status] || colors.received;
  };

  const getPriorityColor = (priority: RepairTrackingData['priority']) => {
    const colors = {
      standard: 'bg-gray-100 text-gray-800',
      express: 'bg-blue-100 text-blue-800',
      urgent: 'bg-red-100 text-red-800',
    };
    return colors[priority];
  };

  const getMilestoneIcon = (status: RepairMilestone['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'current':
        return <Wrench className="w-5 h-5 text-blue-600 animate-pulse" />;
      case 'delayed':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const handleSendMessage = useCallback(() => {
    if (!newMessage.trim() || !repairData) return;
    
    sendMessage(repairData.repairId, newMessage.trim());
    setNewMessage('');
  }, [newMessage, repairData, sendMessage]);

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading repair tracking...</p>
        </div>
      </div>
    );
  }

  if (!repairData) {
    return (
      <Card className="p-8 text-center">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Repair Not Found</h3>
        <p className="text-gray-600">Unable to load tracking information for repair ID: {repairId}</p>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with live status */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">{repairData.deviceName}</h1>
            <p className="text-gray-600">{repairData.repairType}</p>
          </div>
          <div className="text-right">
            <Badge className={getStatusColor(repairData.currentStatus)}>
              {repairData.currentStatus.replace('_', ' ').toUpperCase()}
            </Badge>
            <Badge className={`ml-2 ${getPriorityColor(repairData.priority)}`}>
              {repairData.priority.toUpperCase()}
            </Badge>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
            <span className="text-sm text-gray-600">{repairData.overallProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${repairData.overallProgress}%` }}
            ></div>
          </div>
        </div>

        {/* Key info grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Estimated Completion</p>
              <p className="text-sm font-medium">
                {new Date(repairData.estimatedCompletion).toLocaleDateString()} at {new Date(repairData.estimatedCompletion).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Current Location</p>
              <p className="text-sm font-medium">{repairData.location}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <div>
              <p className="text-xs text-gray-500">Live Updates</p>
              <p className="text-sm font-medium">
                {isConnected ? 'Active' : 'Disconnected'}
              </p>
            </div>
          </div>
        </div>

        {/* Customer notes */}
        {repairData.customerNotes && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-600 font-medium mb-1">Your Notes</p>
            <p className="text-sm text-blue-800">{repairData.customerNotes}</p>
          </div>
        )}
      </Card>

      {/* Milestone Timeline */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-6">Repair Timeline</h2>
        <div className="space-y-6">
          {repairData.milestones.map((milestone, index) => (
            <div key={milestone.id} className="relative">
              {/* Timeline line */}
              {index < repairData.milestones.length - 1 && (
                <div className="absolute left-6 top-12 w-0.5 h-16 bg-gray-200"></div>
              )}
              
              <div className="flex items-start space-x-4">
                {/* Icon */}
                <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                  milestone.status === 'completed' ? 'bg-green-100 border-green-200' :
                  milestone.status === 'current' ? 'bg-blue-100 border-blue-200' :
                  milestone.status === 'delayed' ? 'bg-red-100 border-red-200' :
                  'bg-gray-100 border-gray-200'
                }`}>
                  {getMilestoneIcon(milestone.status)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className={`font-semibold ${
                      milestone.status === 'current' ? 'text-blue-600' : 'text-gray-900'
                    }`}>
                      {milestone.title}
                    </h3>
                    <div className="flex items-center space-x-2">
                      {milestone.timestamp && (
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(milestone.timestamp)}
                        </span>
                      )}
                      {milestone.technician && (
                        <div className="flex items-center space-x-1">
                          <User className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-600">{milestone.technician.name}</span>
                          {milestone.technician.isOnline && (
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">{milestone.description}</p>
                  
                  {milestone.notes && (
                    <div className="mb-3 p-2 bg-gray-50 rounded text-xs text-gray-700">
                      <strong>Technician Notes:</strong> {milestone.notes}
                    </div>
                  )}

                  {/* Photos */}
                  {milestone.photos.length > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <Camera className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">
                          Progress Photos ({milestone.photos.length})
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {milestone.photos.map((photo) => (
                          <div
                            key={photo.id}
                            className="relative aspect-square bg-gray-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => setSelectedPhoto(photo)}
                          >
                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
                              <Camera className="w-8 h-8 text-gray-400" />
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 p-2 bg-black bg-opacity-75 text-white text-xs">
                              {photo.caption}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Duration estimate */}
                  <div className="mt-2 text-xs text-gray-500">
                    Duration: {milestone.estimatedDuration}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Real-time Communication */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Live Communication</h2>
          {isConnected && (
            <div className="flex items-center space-x-2 text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm">Live</span>
            </div>
          )}
        </div>

        {/* Quick action buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => requestStatusUpdate(repairData.repairId)}
            disabled={!isConnected}
          >
            Request Update
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => requestPhotoUpdate(repairData.repairId)}
            disabled={!isConnected}
          >
            Request Photos
          </Button>
        </div>

        {/* Message input */}
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Send a message to your technician..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={!isConnected}
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || !isConnected}
          >
            <MessageCircle className="w-4 h-4" />
          </Button>
        </div>

        {/* Last update timestamp */}
        {lastUpdate && (
          <p className="text-xs text-gray-500 mt-2">
            Last update: {new Date(lastUpdate).toLocaleString()}
          </p>
        )}
      </Card>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{selectedPhoto.caption}</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedPhoto(null)}
                >
                  Close
                </Button>
              </div>
              <p className="text-sm text-gray-600">
                {new Date(selectedPhoto.timestamp).toLocaleString()}
              </p>
            </div>
            <div className="p-4">
              <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                <Camera className="w-16 h-16 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      {notifications.length > 0 && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center space-x-2 mb-2">
            <AlertCircle className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-blue-800">Recent Updates</span>
          </div>
          <div className="space-y-1">
            {notifications.slice(0, 3).map((notification, index) => (
              <p key={index} className="text-sm text-blue-700">
                {notification.message}
              </p>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}