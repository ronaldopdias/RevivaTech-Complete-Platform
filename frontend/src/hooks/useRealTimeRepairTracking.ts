/**
 * Real-Time Repair Tracking Hook
 * 
 * React hook for real-time repair tracking with WebSocket integration
 * Provides comprehensive repair status monitoring, progress tracking, and live updates
 * 
 * Features:
 * - Real-time repair status updates
 * - Progress milestone tracking
 * - Photo upload notifications
 * - Quality check notifications
 * - Automatic reconnection
 * - Optimistic updates
 * - Error handling and recovery
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export interface RepairStatus {
  repairId: string;
  status: string;
  message: string;
  estimatedCompletion?: string;
  photos?: string[];
  updatedBy?: {
    id: string;
    email: string;
    role: string;
  };
  timestamp: string;
  type: string;
}

export interface RepairProgress {
  repairId: string;
  milestone: string;
  progress: number; // 0-100
  notes?: string;
  timeSpent?: number;
  nextSteps?: string;
  updatedBy?: {
    id: string;
    email: string;
    role: string;
  };
  timestamp: string;
  type: string;
}

export interface RepairNote {
  repairId: string;
  note: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  isPrivate: boolean;
  addedBy: {
    id: string;
    email: string;
    role: string;
  };
  timestamp: string;
  type: string;
}

export interface PhotoUpload {
  repairId: string;
  photoUrl: string;
  description?: string;
  category: 'before' | 'progress' | 'after' | 'issue' | 'solution';
  uploadedBy: {
    id: string;
    email: string;
    role: string;
  };
  timestamp: string;
  type: string;
}

export interface QualityCheck {
  repairId: string;
  qualityCheck: {
    passed: boolean;
    issues: string[];
    score: number; // 1-10
    recommendations: string[];
  };
  checkedBy: {
    id: string;
    email: string;
    role: string;
  };
  timestamp: string;
  type: string;
}

export interface ConnectionStatus {
  connected: boolean;
  authenticated: boolean;
  reconnecting: boolean;
  error?: string;
  lastConnected?: Date;
}

export interface RealTimeRepairTrackingOptions {
  autoConnect?: boolean;
  reconnectAttempts?: number;
  enableOptimisticUpdates?: boolean;
  enableNotifications?: boolean;
}

export interface RepairTrackingState {
  // Connection state
  connectionStatus: ConnectionStatus;
  
  // Repair data
  subscribedRepairs: Map<string, {
    status?: RepairStatus;
    progress?: RepairProgress;
    notes: RepairNote[];
    photos: PhotoUpload[];
    qualityChecks: QualityCheck[];
  }>;
  
  // Real-time updates
  liveUpdates: Array<RepairStatus | RepairProgress | RepairNote | PhotoUpload | QualityCheck>;
  
  // Notifications
  notifications: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: Date;
    read: boolean;
  }>;
  
  // Performance metrics
  latency: number;
  updateCount: number;
}

export const useRealTimeRepairTracking = (
  userToken?: string,
  options: RealTimeRepairTrackingOptions = {}
) => {
  const {
    autoConnect = true,
    reconnectAttempts = 5,
    enableOptimisticUpdates = true,
    enableNotifications = true
  } = options;

  // State management
  const [state, setState] = useState<RepairTrackingState>({
    connectionStatus: {
      connected: false,
      authenticated: false,
      reconnecting: false
    },
    subscribedRepairs: new Map(),
    liveUpdates: [],
    notifications: [],
    latency: 0,
    updateCount: 0
  });

  // Refs for stable references
  const socketRef = useRef<Socket | null>(null);
  const userTokenRef = useRef<string | undefined>(userToken);
  const reconnectAttemptsRef = useRef(0);
  const latencyTimerRef = useRef<Map<string, number>>(new Map());

  // Update token ref when it changes
  useEffect(() => {
    userTokenRef.current = userToken;
  }, [userToken]);

  // Connection management
  const connect = useCallback(async () => {
    if (socketRef.current?.connected) {
      return;
    }

    setState(prev => ({
      ...prev,
      connectionStatus: {
        ...prev.connectionStatus,
        reconnecting: true,
        error: undefined
      }
    }));

    try {
      const socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3011', {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        autoConnect: false
      });

      socketRef.current = socket;

      // Connection event handlers
      socket.on('connect', () => {
        console.log('🔌 Connected to repair tracking service');
        
        setState(prev => ({
          ...prev,
          connectionStatus: {
            connected: true,
            authenticated: false,
            reconnecting: false,
            lastConnected: new Date()
          }
        }));

        reconnectAttemptsRef.current = 0;

        // Authenticate if token available
        if (userTokenRef.current) {
          socket.emit('authenticate', { token: userTokenRef.current });
        }
      });

      socket.on('authenticated', (data) => {
        console.log('✅ Authenticated with repair tracking service', data);
        
        setState(prev => ({
          ...prev,
          connectionStatus: {
            ...prev.connectionStatus,
            authenticated: true,
            error: undefined
          }
        }));
      });

      socket.on('auth_error', (error) => {
        console.error('❌ Authentication failed:', error);
        
        setState(prev => ({
          ...prev,
          connectionStatus: {
            ...prev.connectionStatus,
            authenticated: false,
            error: error.message
          }
        }));
      });

      socket.on('disconnect', (reason) => {
        console.log('🔌 Disconnected from repair tracking service:', reason);
        
        setState(prev => ({
          ...prev,
          connectionStatus: {
            connected: false,
            authenticated: false,
            reconnecting: false,
            error: reason === 'io server disconnect' ? 'Server disconnected' : undefined
          }
        }));

        // Attempt reconnection
        if (reason !== 'io client disconnect' && reconnectAttemptsRef.current < reconnectAttempts) {
          setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000));
        }
      });

      // Repair event handlers
      socket.on('repair_status_updated', (update: RepairStatus) => {
        console.log('📋 Repair status updated:', update);
        handleRepairUpdate(update);
      });

      socket.on('repair_progress_updated', (progress: RepairProgress) => {
        console.log('📈 Repair progress updated:', progress);
        handleProgressUpdate(progress);
      });

      socket.on('repair_note_added', (note: RepairNote) => {
        console.log('📝 Repair note added:', note);
        handleNoteAdded(note);
      });

      socket.on('repair_photo_uploaded', (photo: PhotoUpload) => {
        console.log('📸 Repair photo uploaded:', photo);
        handlePhotoUploaded(photo);
      });

      socket.on('repair_quality_checked', (qualityCheck: QualityCheck) => {
        console.log('✅ Quality check completed:', qualityCheck);
        handleQualityCheck(qualityCheck);
      });

      socket.on('notification', (notification) => {
        if (enableNotifications) {
          handleNotification(notification);
        }
      });

      socket.on('error', (error) => {
        console.error('❌ Socket error:', error);
        setState(prev => ({
          ...prev,
          connectionStatus: {
            ...prev.connectionStatus,
            error: error.message
          }
        }));
      });

      // Connect the socket
      socket.connect();

    } catch (error) {
      console.error('❌ Failed to connect:', error);
      setState(prev => ({
        ...prev,
        connectionStatus: {
          connected: false,
          authenticated: false,
          reconnecting: false,
          error: 'Connection failed'
        }
      }));
    }
  }, [reconnectAttempts, enableNotifications]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    setState(prev => ({
      ...prev,
      connectionStatus: {
        connected: false,
        authenticated: false,
        reconnecting: false
      }
    }));
  }, []);

  // Event handlers
  const handleRepairUpdate = useCallback((update: RepairStatus) => {
    setState(prev => {
      const newSubscribedRepairs = new Map(prev.subscribedRepairs);
      const existing = newSubscribedRepairs.get(update.repairId) || {
        notes: [],
        photos: [],
        qualityChecks: []
      };
      
      newSubscribedRepairs.set(update.repairId, {
        ...existing,
        status: update
      });

      return {
        ...prev,
        subscribedRepairs: newSubscribedRepairs,
        liveUpdates: [update, ...prev.liveUpdates].slice(0, 100), // Keep last 100 updates
        updateCount: prev.updateCount + 1
      };
    });
  }, []);

  const handleProgressUpdate = useCallback((progress: RepairProgress) => {
    setState(prev => {
      const newSubscribedRepairs = new Map(prev.subscribedRepairs);
      const existing = newSubscribedRepairs.get(progress.repairId) || {
        notes: [],
        photos: [],
        qualityChecks: []
      };
      
      newSubscribedRepairs.set(progress.repairId, {
        ...existing,
        progress
      });

      return {
        ...prev,
        subscribedRepairs: newSubscribedRepairs,
        liveUpdates: [progress, ...prev.liveUpdates].slice(0, 100),
        updateCount: prev.updateCount + 1
      };
    });
  }, []);

  const handleNoteAdded = useCallback((note: RepairNote) => {
    setState(prev => {
      const newSubscribedRepairs = new Map(prev.subscribedRepairs);
      const existing = newSubscribedRepairs.get(note.repairId) || {
        notes: [],
        photos: [],
        qualityChecks: []
      };
      
      newSubscribedRepairs.set(note.repairId, {
        ...existing,
        notes: [note, ...existing.notes]
      });

      return {
        ...prev,
        subscribedRepairs: newSubscribedRepairs,
        liveUpdates: [note, ...prev.liveUpdates].slice(0, 100),
        updateCount: prev.updateCount + 1
      };
    });
  }, []);

  const handlePhotoUploaded = useCallback((photo: PhotoUpload) => {
    setState(prev => {
      const newSubscribedRepairs = new Map(prev.subscribedRepairs);
      const existing = newSubscribedRepairs.get(photo.repairId) || {
        notes: [],
        photos: [],
        qualityChecks: []
      };
      
      newSubscribedRepairs.set(photo.repairId, {
        ...existing,
        photos: [photo, ...existing.photos]
      });

      return {
        ...prev,
        subscribedRepairs: newSubscribedRepairs,
        liveUpdates: [photo, ...prev.liveUpdates].slice(0, 100),
        updateCount: prev.updateCount + 1
      };
    });
  }, []);

  const handleQualityCheck = useCallback((qualityCheck: QualityCheck) => {
    setState(prev => {
      const newSubscribedRepairs = new Map(prev.subscribedRepairs);
      const existing = newSubscribedRepairs.get(qualityCheck.repairId) || {
        notes: [],
        photos: [],
        qualityChecks: []
      };
      
      newSubscribedRepairs.set(qualityCheck.repairId, {
        ...existing,
        qualityChecks: [qualityCheck, ...existing.qualityChecks]
      });

      return {
        ...prev,
        subscribedRepairs: newSubscribedRepairs,
        liveUpdates: [qualityCheck, ...prev.liveUpdates].slice(0, 100),
        updateCount: prev.updateCount + 1
      };
    });
  }, []);

  const handleNotification = useCallback((notification: any) => {
    const newNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: notification.type,
      message: notification.message || notification.title,
      timestamp: new Date(),
      read: false
    };

    setState(prev => ({
      ...prev,
      notifications: [newNotification, ...prev.notifications].slice(0, 50) // Keep last 50
    }));
  }, []);

  // Public API methods
  const subscribeToRepair = useCallback((repairId: string) => {
    if (!socketRef.current?.connected) {
      console.warn('Cannot subscribe to repair - not connected');
      return false;
    }

    socketRef.current.emit('subscribe_repair', repairId);
    
    // Initialize repair data
    setState(prev => {
      const newSubscribedRepairs = new Map(prev.subscribedRepairs);
      if (!newSubscribedRepairs.has(repairId)) {
        newSubscribedRepairs.set(repairId, {
          notes: [],
          photos: [],
          qualityChecks: []
        });
      }
      return {
        ...prev,
        subscribedRepairs: newSubscribedRepairs
      };
    });

    return true;
  }, []);

  const unsubscribeFromRepair = useCallback((repairId: string) => {
    if (!socketRef.current?.connected) {
      return false;
    }

    socketRef.current.emit('unsubscribe_repair', repairId);
    
    setState(prev => {
      const newSubscribedRepairs = new Map(prev.subscribedRepairs);
      newSubscribedRepairs.delete(repairId);
      return {
        ...prev,
        subscribedRepairs: newSubscribedRepairs
      };
    });

    return true;
  }, []);

  const addRepairNote = useCallback((repairId: string, note: string, priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal') => {
    if (!socketRef.current?.connected) {
      return false;
    }

    // Optimistic update
    if (enableOptimisticUpdates) {
      const optimisticNote: RepairNote = {
        repairId,
        note,
        priority,
        isPrivate: false,
        addedBy: {
          id: 'current-user',
          email: 'current-user@example.com',
          role: 'customer'
        },
        timestamp: new Date().toISOString(),
        type: 'note_added'
      };
      handleNoteAdded(optimisticNote);
    }

    socketRef.current.emit('add_repair_note', { repairId, note, priority });
    return true;
  }, [enableOptimisticUpdates, handleNoteAdded]);

  const markNotificationRead = useCallback((notificationId: string) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    }));
  }, []);

  const clearNotifications = useCallback(() => {
    setState(prev => ({
      ...prev,
      notifications: []
    }));
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && userToken) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, userToken, connect, disconnect]);

  // Calculate latency from ping responses
  useEffect(() => {
    const interval = setInterval(() => {
      if (socketRef.current?.connected) {
        const pingStart = Date.now();
        const pingId = `ping_${pingStart}`;
        latencyTimerRef.current.set(pingId, pingStart);
        
        socketRef.current.emit('ping', pingId);
        
        const handlePong = (pongId: string) => {
          const startTime = latencyTimerRef.current.get(pongId);
          if (startTime) {
            const latency = Date.now() - startTime;
            setState(prev => ({ ...prev, latency }));
            latencyTimerRef.current.delete(pongId);
          }
        };

        socketRef.current.once('pong', handlePong);
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return {
    // State
    connectionStatus: state.connectionStatus,
    subscribedRepairs: state.subscribedRepairs,
    liveUpdates: state.liveUpdates,
    notifications: state.notifications,
    latency: state.latency,
    updateCount: state.updateCount,
    
    // Actions
    connect,
    disconnect,
    subscribeToRepair,
    unsubscribeFromRepair,
    addRepairNote,
    markNotificationRead,
    clearNotifications,
    
    // Computed values
    isConnected: state.connectionStatus.connected && state.connectionStatus.authenticated,
    hasUnreadNotifications: state.notifications.some(n => !n.read),
    unreadNotificationCount: state.notifications.filter(n => !n.read).length
  };
};

export default useRealTimeRepairTracking;