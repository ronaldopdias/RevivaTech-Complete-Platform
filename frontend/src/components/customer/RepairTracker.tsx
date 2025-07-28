'use client';

/**
 * Real-time Repair Tracker Component
 * 
 * Features:
 * - WebSocket-powered real-time status updates
 * - Interactive timeline with live progress
 * - Estimated completion time with live updates
 * - Photo progression tracking
 * - Technician activity status
 * - Smart notifications for status changes
 */

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import useWebSocket from '@/hooks/useWebSocket';

interface RepairStep {
  id: string;
  name: string;
  status: 'completed' | 'current' | 'pending' | 'delayed';
  timestamp?: string;
  estimatedTime?: string;
  description?: string;
  technician?: string;
  photos?: string[];
  notes?: string;
  duration?: number; // in minutes
}

interface RepairProgress {
  repairId: string;
  deviceName: string;
  repairType: string;
  overallProgress: number;
  currentStep: string;
  estimatedCompletion: string;
  actualCompletion?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  steps: RepairStep[];
  technician: {
    id: string;
    name: string;
    avatar?: string;
    isOnline: boolean;
    lastActive?: string;
  };
  metadata: {
    createdAt: string;
    updatedAt: string;
    totalEstimatedTime: number;
    actualTimeSpent?: number;
    customerNotes?: string;
    internalNotes?: string;
  };
}

interface RepairTrackerProps {
  repairId: string;
  onStatusChange?: (status: RepairProgress) => void;
  showDetailedView?: boolean;
  enableNotifications?: boolean;
}

export default function RepairTracker({ 
  repairId, 
  onStatusChange, 
  showDetailedView = true,
  enableNotifications = true 
}: RepairTrackerProps) {
  const [repairData, setRepairData] = useState<RepairProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  // WebSocket connection for real-time updates
  const { 
    isConnected, 
    sendMessage, 
    lastMessage,
    error: wsError 
  } = useWebSocket({
    url: 'ws://localhost:3011',
    shouldReconnect: true,
    reconnectAttempts: 5,
    reconnectInterval: 3000,
  });

  // Load initial repair data
  const loadRepairData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Mock data for development - replace with real API call
      const mockData: RepairProgress = {
        repairId: repairId,
        deviceName: 'MacBook Pro 16" M1 Max',
        repairType: 'Screen Repair + Logic Board Diagnostics',
        overallProgress: 65,
        currentStep: 'Screen Assembly',
        estimatedCompletion: '2025-07-15T16:30:00Z',
        priority: 'normal',
        technician: {
          id: 'tech-sarah-001',
          name: 'Sarah Johnson',
          avatar: '/avatars/sarah.jpg',
          isOnline: true,
          lastActive: '2025-07-14T14:25:00Z'
        },
        steps: [
          {
            id: 'intake',
            name: 'Device Intake & Initial Assessment',
            status: 'completed',
            timestamp: '2025-07-13T09:00:00Z',
            estimatedTime: '2025-07-13T09:30:00Z',
            description: 'Device received and initial condition assessment completed',
            technician: 'Sarah Johnson',
            duration: 25,
            photos: ['/photos/intake-001.jpg', '/photos/intake-002.jpg'],
            notes: 'Customer reported screen flickering and dark spots. Physical inspection confirms LCD damage.'
          },
          {
            id: 'diagnostics',
            name: 'Comprehensive Diagnostics',
            status: 'completed',
            timestamp: '2025-07-13T10:15:00Z',
            estimatedTime: '2025-07-13T11:00:00Z',
            description: 'Full system diagnostics and component testing',
            technician: 'Sarah Johnson',
            duration: 45,
            photos: ['/photos/diagnostics-001.jpg'],
            notes: 'Logic board functioning normally. Screen assembly requires complete replacement. No liquid damage detected.'
          },
          {
            id: 'parts-order',
            name: 'Parts Procurement',
            status: 'completed',
            timestamp: '2025-07-13T11:30:00Z',
            estimatedTime: '2025-07-13T12:00:00Z',
            description: 'Genuine replacement parts ordered from authorized supplier',
            technician: 'Sarah Johnson',
            duration: 15,
            notes: 'Genuine Apple screen assembly ordered. Part number: 661-16728. Expected delivery: same day.'
          },
          {
            id: 'parts-arrival',
            name: 'Parts Verification',
            status: 'completed',
            timestamp: '2025-07-14T09:30:00Z',
            estimatedTime: '2025-07-14T10:00:00Z',
            description: 'Parts received and quality verified',
            technician: 'Sarah Johnson',
            duration: 20,
            photos: ['/photos/parts-001.jpg'],
            notes: 'Genuine Apple part verified. Serial numbers match. Quality inspection passed.'
          },
          {
            id: 'disassembly',
            name: 'Device Disassembly',
            status: 'completed',
            timestamp: '2025-07-14T10:30:00Z',
            estimatedTime: '2025-07-14T11:30:00Z',
            description: 'Careful disassembly and component removal',
            technician: 'Sarah Johnson',
            duration: 60,
            photos: ['/photos/disassembly-001.jpg', '/photos/disassembly-002.jpg'],
            notes: 'All screws accounted for. Logic board removed safely. Battery disconnected properly.'
          },
          {
            id: 'screen-replacement',
            name: 'Screen Assembly Replacement',
            status: 'current',
            timestamp: '2025-07-14T12:00:00Z',
            estimatedTime: '2025-07-14T14:00:00Z',
            description: 'Installing new screen assembly and connecting components',
            technician: 'Sarah Johnson',
            notes: 'Currently installing new screen assembly. Flex cables being connected carefully.'
          },
          {
            id: 'reassembly',
            name: 'Device Reassembly',
            status: 'pending',
            estimatedTime: '2025-07-14T14:30:00Z',
            description: 'Reassembling device with new components',
            technician: 'Sarah Johnson'
          },
          {
            id: 'testing',
            name: 'Quality Testing & Calibration',
            status: 'pending',
            estimatedTime: '2025-07-14T15:30:00Z',
            description: 'Comprehensive testing and display calibration',
            technician: 'Sarah Johnson'
          },
          {
            id: 'final-inspection',
            name: 'Final Quality Inspection',
            status: 'pending',
            estimatedTime: '2025-07-14T16:00:00Z',
            description: 'Final inspection and customer preparation',
            technician: 'Sarah Johnson'
          },
          {
            id: 'ready',
            name: 'Ready for Collection',
            status: 'pending',
            estimatedTime: '2025-07-14T16:30:00Z',
            description: 'Device ready for customer pickup',
            technician: 'Sarah Johnson'
          }
        ],
        metadata: {
          createdAt: '2025-07-13T09:00:00Z',
          updatedAt: '2025-07-14T14:25:00Z',
          totalEstimatedTime: 480, // 8 hours
          actualTimeSpent: 165, // 2h 45m so far
          customerNotes: 'Please handle with care - important work files on device',
          internalNotes: 'Customer is VIP - priority service. Device has important data.'
        }
      };

      setRepairData(mockData);
      setLastUpdate(new Date().toISOString());
      onStatusChange?.(mockData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load repair data');
    } finally {
      setIsLoading(false);
    }
  }, [repairId, onStatusChange]);

  // Handle real-time WebSocket updates
  useEffect(() => {
    if (lastMessage) {
      try {
        const data = typeof lastMessage === 'string' ? JSON.parse(lastMessage) : lastMessage;
        
        if (data.type === 'repair-update' && data.repairId === repairId) {
          console.log('Real-time repair update received:', data);
          
          setRepairData(prevData => {
            if (!prevData) return prevData;
            
            const updatedData = {
              ...prevData,
              ...data.updates,
              metadata: {
                ...prevData.metadata,
                updatedAt: new Date().toISOString()
              }
            };
            
            setLastUpdate(new Date().toISOString());
            onStatusChange?.(updatedData);
            
            // Trigger notification if enabled
            if (enableNotifications && 'Notification' in window && Notification.permission === 'granted') {
              new Notification('Repair Status Updated', {
                body: `${prevData.deviceName}: ${data.message || 'Status has been updated'}`,
                icon: '/favicon.ico'
              });
            }
            
            return updatedData;
          });
        }
      } catch (err) {
        console.warn('Failed to parse WebSocket message:', err);
      }
    }
  }, [lastMessage, repairId, onStatusChange, enableNotifications]);

  // Subscribe to repair updates when connected
  useEffect(() => {
    if (isConnected && repairId) {
      sendMessage({
        type: 'subscribe',
        channel: `repair:${repairId}`,
        timestamp: new Date().toISOString()
      });
      
      // Send heartbeat every 30 seconds
      const heartbeat = setInterval(() => {
        sendMessage({
          type: 'heartbeat',
          repairId: repairId,
          timestamp: new Date().toISOString()
        });
      }, 30000);

      return () => {
        clearInterval(heartbeat);
        sendMessage({
          type: 'unsubscribe',
          channel: `repair:${repairId}`,
          timestamp: new Date().toISOString()
        });
      };
    }
  }, [isConnected, repairId, sendMessage]);

  // Load initial data
  useEffect(() => {
    loadRepairData();
  }, [loadRepairData]);

  // Request notification permission
  useEffect(() => {
    if (enableNotifications && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [enableNotifications]);

  const getStepStatusColor = (status: RepairStep['status']) => {
    const colors = {
      completed: 'text-green-600 bg-green-100',
      current: 'text-blue-600 bg-blue-100',
      pending: 'text-gray-600 bg-gray-100',
      delayed: 'text-red-600 bg-red-100'
    };
    return colors[status];
  };

  const getStepIcon = (status: RepairStep['status']) => {
    const icons = {
      completed: '✅',
      current: '🔄',
      pending: '⏳',
      delayed: '⚠️'
    };
    return icons[status];
  };

  const getPriorityColor = (priority: RepairProgress['priority']) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      normal: 'bg-blue-100 text-blue-800',
      high: 'bg-yellow-100 text-yellow-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority];
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center min-h-32">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading repair status...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-600">
          <p className="font-medium">Error loading repair data</p>
          <p className="text-sm mt-1">{error}</p>
          <Button onClick={loadRepairData} className="mt-4">Retry</Button>
        </div>
      </Card>
    );
  }

  if (!repairData) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-600">
          <p>No repair data found for ID: {repairId}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with real-time status */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">{repairData.deviceName}</h2>
            <p className="text-gray-600">{repairData.repairType}</p>
          </div>
          <div className="flex items-center space-x-3">
            <Badge className={getPriorityColor(repairData.priority)}>
              {repairData.priority.toUpperCase()}
            </Badge>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600">
                {isConnected ? 'Live' : 'Offline'}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">Overall Progress</p>
            <div className="flex items-center space-x-2 mt-1">
              <div className="flex-1 bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${repairData.overallProgress}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium">{repairData.overallProgress}%</span>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600">Current Step</p>
            <p className="font-medium mt-1">{repairData.currentStep}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Estimated Completion</p>
            <p className="font-medium mt-1">
              {new Date(repairData.estimatedCompletion).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Technician Info */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="font-medium">{repairData.technician.name.split(' ').map(n => n[0]).join('')}</span>
            </div>
            <div>
              <p className="font-medium">{repairData.technician.name}</p>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${repairData.technician.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className="text-sm text-gray-600">
                  {repairData.technician.isOnline ? 'Online now' : 
                   `Last active: ${repairData.technician.lastActive ? new Date(repairData.technician.lastActive).toLocaleString() : 'Unknown'}`}
                </span>
              </div>
            </div>
          </div>
          {lastUpdate && (
            <div className="text-right">
              <p className="text-sm text-gray-600">Last Update</p>
              <p className="text-sm font-medium">
                {new Date(lastUpdate).toLocaleTimeString()}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Detailed Timeline */}
      {showDetailedView && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-6">Repair Timeline</h3>
          <div className="space-y-6">
            {repairData.steps.map((step, index) => (
              <div key={step.id} className="relative">
                {/* Connecting line */}
                {index < repairData.steps.length - 1 && (
                  <div className="absolute left-6 top-12 w-0.5 h-16 bg-gray-200"></div>
                )}
                
                <div className="flex items-start space-x-4">
                  {/* Step icon */}
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-lg ${getStepStatusColor(step.status)}`}>
                    {getStepIcon(step.status)}
                  </div>
                  
                  {/* Step content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className={`font-medium ${
                        step.status === 'current' ? 'text-blue-600' :
                        step.status === 'completed' ? 'text-green-600' :
                        step.status === 'delayed' ? 'text-red-600' : 'text-gray-500'
                      }`}>
                        {step.name}
                      </h4>
                      {step.duration && (
                        <span className="text-sm text-gray-500">
                          {formatDuration(step.duration)}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                    
                    {step.notes && (
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">{step.notes}</p>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center space-x-4">
                        {step.timestamp && (
                          <span className="text-xs text-gray-500">
                            Completed: {new Date(step.timestamp).toLocaleString()}
                          </span>
                        )}
                        {step.estimatedTime && !step.timestamp && (
                          <span className="text-xs text-gray-500">
                            Est: {new Date(step.estimatedTime).toLocaleString()}
                          </span>
                        )}
                        {step.technician && (
                          <span className="text-xs text-gray-500">
                            By: {step.technician}
                          </span>
                        )}
                      </div>
                      
                      {step.photos && step.photos.length > 0 && (
                        <div className="flex items-center space-x-1">
                          <span className="text-xs text-gray-500">📷</span>
                          <span className="text-xs text-gray-500">{step.photos.length} photos</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Time & Cost Summary */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Total Estimated Time</p>
            <p className="font-medium">{formatDuration(repairData.metadata.totalEstimatedTime)}</p>
          </div>
          {repairData.metadata.actualTimeSpent && (
            <div>
              <p className="text-sm text-gray-600">Time Spent</p>
              <p className="font-medium">{formatDuration(repairData.metadata.actualTimeSpent)}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-600">Started</p>
            <p className="font-medium">
              {new Date(repairData.metadata.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Last Updated</p>
            <p className="font-medium">
              {new Date(repairData.metadata.updatedAt).toLocaleString()}
            </p>
          </div>
        </div>
        
        {repairData.metadata.customerNotes && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-800">Customer Notes:</p>
            <p className="text-sm text-blue-700 mt-1">{repairData.metadata.customerNotes}</p>
          </div>
        )}
      </Card>

      {/* WebSocket Error Display */}
      {wsError && (
        <Card className="p-4 border-yellow-200 bg-yellow-50">
          <div className="flex items-center space-x-2">
            <span className="text-yellow-600">⚠️</span>
            <div>
              <p className="text-sm font-medium text-yellow-800">Real-time Updates Unavailable</p>
              <p className="text-xs text-yellow-700">Refresh the page to get the latest status</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// Export types for use in other components
export type { RepairProgress, RepairStep };