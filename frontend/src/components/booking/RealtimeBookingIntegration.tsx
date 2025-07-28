'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Bell,
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Zap,
  Camera,
  Calendar,
  User,
  Wifi,
  WifiOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRealTimeBookings } from '@/hooks/useRealTimeBookings';
import { webSocketService } from '@/services/websocket.service';
import { DiagnosticPhoto } from './DiagnosticPhotoUpload';
import { TimeSlot, AppointmentPreference } from '@/lib/data/appointment-scheduling';

interface BookingState {
  selectedBand: 'A' | 'B' | 'C' | null;
  selectedServices: string[];
  diagnosticPhotos: DiagnosticPhoto[];
  selectedAppointment: {
    slot: TimeSlot | null;
    preferences: AppointmentPreference | null;
  };
  discounts: {
    student: boolean;
    blueLightCard: boolean;
  };
  currentStep: 'band-selection' | 'service-selection' | 'photo-upload' | 'summary';
}

interface RealtimeBookingUpdate {
  type: 'step_completed' | 'services_updated' | 'photos_uploaded' | 'appointment_selected' | 'booking_submitted';
  step: string;
  data: any;
  timestamp: Date;
  userId?: string;
}

interface RealtimeBookingIntegrationProps {
  bookingState: BookingState;
  totalPrice: number;
  onBookingUpdate?: (update: RealtimeBookingUpdate) => void;
  userId?: string;
  authToken?: string;
  className?: string;
}

const RealtimeBookingIntegration: React.FC<RealtimeBookingIntegrationProps> = ({
  bookingState,
  totalPrice,
  onBookingUpdate,
  userId,
  authToken,
  className
}) => {
  const [realtimeUpdates, setRealtimeUpdates] = useState<RealtimeBookingUpdate[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [pendingUpdates, setPendingUpdates] = useState<number>(0);

  // Initialize real-time booking hooks
  const {
    isConnected: socketConnected,
    notifications,
    unreadCount,
    subscribeToRepair,
    sendMessageToTechnician,
    markNotificationAsRead,
    clearNotifications
  } = useRealTimeBookings({
    customerId: userId,
    authToken,
    onRepairUpdate: (update) => {
      console.log('Real-time repair update received:', update);
    },
    onNewMessage: (message) => {
      console.log('Real-time message received:', message);
    },
    onConnectionChange: (connected) => {
      setIsConnected(connected);
      if (connected) {
        setLastSyncTime(new Date());
      }
    }
  });

  // Initialize WebSocket service
  useEffect(() => {
    if (authToken) {
      webSocketService.connect().then(() => {
        console.log('WebSocket service connected for booking integration');
        
        // Subscribe to booking-related events
        webSocketService.subscribe('booking-status-update', (data) => {
          console.log('Booking status update:', data);
        });

        webSocketService.subscribe('pricing-update', (data) => {
          console.log('Pricing update:', data);
        });
      }).catch((error) => {
        console.error('Failed to connect WebSocket service:', error);
      });
    }

    return () => {
      webSocketService.disconnect();
    };
  }, [authToken]);

  // Generate booking progress updates
  const generateBookingUpdate = useCallback((
    type: RealtimeBookingUpdate['type'],
    step: string,
    data: any
  ) => {
    const update: RealtimeBookingUpdate = {
      type,
      step,
      data,
      timestamp: new Date(),
      userId
    };

    setRealtimeUpdates(prev => [...prev, update]);
    onBookingUpdate?.(update);

    // Send real-time update via WebSocket
    if (webSocketService.isConnected()) {
      webSocketService.send('booking-status-update', {
        ...update,
        bookingId: `booking_${Date.now()}`,
        customerId: userId
      });
    }

    return update;
  }, [userId, onBookingUpdate]);

  // Track booking progress changes
  useEffect(() => {
    const { currentStep, selectedBand, selectedServices, diagnosticPhotos, selectedAppointment } = bookingState;

    switch (currentStep) {
      case 'band-selection':
        if (selectedBand) {
          generateBookingUpdate('step_completed', 'band-selection', {
            selectedBand,
            message: `Selected ${selectedBand} service band`,
            progress: 25
          });
        }
        break;

      case 'service-selection':
        if (selectedServices.length > 0) {
          generateBookingUpdate('services_updated', 'service-selection', {
            serviceCount: selectedServices.length,
            services: selectedServices,
            totalPrice,
            message: `Selected ${selectedServices.length} service${selectedServices.length !== 1 ? 's' : ''}`,
            progress: 50
          });
        }
        break;

      case 'photo-upload':
        if (diagnosticPhotos.length > 0) {
          generateBookingUpdate('photos_uploaded', 'photo-upload', {
            photoCount: diagnosticPhotos.length,
            photoCategories: diagnosticPhotos.map(p => p.category),
            message: `Uploaded ${diagnosticPhotos.length} diagnostic photo${diagnosticPhotos.length !== 1 ? 's' : ''}`,
            progress: 75
          });
        }
        break;

      case 'summary':
        if (selectedAppointment.slot) {
          generateBookingUpdate('appointment_selected', 'summary', {
            appointmentDate: selectedAppointment.slot.date,
            appointmentTime: selectedAppointment.slot.startTime,
            preferences: selectedAppointment.preferences,
            message: 'Appointment slot selected',
            progress: 90
          });
        }
        break;
    }
  }, [bookingState, totalPrice, generateBookingUpdate]);

  // Calculate real-time metrics
  const realtimeMetrics = useMemo(() => {
    const now = new Date();
    const recentUpdates = realtimeUpdates.filter(
      update => (now.getTime() - update.timestamp.getTime()) < 60000 // Last minute
    );

    return {
      totalUpdates: realtimeUpdates.length,
      recentUpdates: recentUpdates.length,
      completedSteps: realtimeUpdates.filter(u => u.type === 'step_completed').length,
      photosUploaded: bookingState.diagnosticPhotos.length,
      servicesSelected: bookingState.selectedServices.length,
      currentProgress: getCurrentProgress()
    };
  }, [realtimeUpdates, bookingState]);

  // Calculate current progress percentage
  function getCurrentProgress(): number {
    const { currentStep, selectedBand, selectedServices, selectedAppointment } = bookingState;
    
    let progress = 0;
    if (selectedBand) progress += 25;
    if (selectedServices.length > 0) progress += 25;
    if (currentStep === 'photo-upload' || currentStep === 'summary') progress += 25;
    if (selectedAppointment.slot) progress += 25;
    
    return progress;
  }

  // Handle real-time notification actions
  const handleNotificationAction = useCallback((action: string, data: any) => {
    switch (action) {
      case 'quick_quote':
        generateBookingUpdate('step_completed', 'quick-quote', {
          estimatedPrice: totalPrice,
          message: 'Quick quote generated',
          urgent: false
        });
        break;

      case 'priority_booking':
        generateBookingUpdate('appointment_selected', 'priority-booking', {
          message: 'Priority booking requested',
          urgent: true
        });
        break;

      case 'technician_notify':
        if (bookingState.diagnosticPhotos.length > 0) {
          generateBookingUpdate('photos_uploaded', 'technician-notification', {
            message: 'Photos sent to technician for pre-assessment',
            photoCount: bookingState.diagnosticPhotos.length
          });
        }
        break;
    }
  }, [totalPrice, bookingState.diagnosticPhotos, generateBookingUpdate]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Connection Status */}
      <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-center space-x-3">
          <div className={cn(
            "w-3 h-3 rounded-full",
            isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
          )} />
          <div className="text-sm">
            <span className="font-medium">Real-time Updates</span>
            <span className="text-gray-600 ml-2">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          {isConnected ? <Wifi className="w-4 h-4 text-green-600" /> : <WifiOff className="w-4 h-4 text-red-600" />}
        </div>
        
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          {lastSyncTime && (
            <span>Last sync: {lastSyncTime.toLocaleTimeString()}</span>
          )}
          {pendingUpdates > 0 && (
            <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">
              {pendingUpdates} pending
            </span>
          )}
        </div>
      </div>

      {/* Real-time Progress Tracker */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-900 flex items-center space-x-2">
            <Zap className="w-4 h-4 text-professional-600" />
            <span>Live Booking Progress</span>
          </h4>
          <div className="text-sm text-gray-600">
            {realtimeMetrics.currentProgress}% complete
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div 
            className="bg-gradient-to-r from-professional-500 to-trust-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${realtimeMetrics.currentProgress}%` }}
          />
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-professional-50 rounded-lg">
            <div className="text-2xl font-bold text-professional-700">
              {realtimeMetrics.completedSteps}
            </div>
            <div className="text-xs text-professional-600">Steps Completed</div>
          </div>
          <div className="text-center p-3 bg-trust-50 rounded-lg">
            <div className="text-2xl font-bold text-trust-700">
              {realtimeMetrics.servicesSelected}
            </div>
            <div className="text-xs text-trust-600">Services Selected</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-700">
              {realtimeMetrics.photosUploaded}
            </div>
            <div className="text-xs text-green-600">Photos Uploaded</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-700">
              {realtimeMetrics.recentUpdates}
            </div>
            <div className="text-xs text-purple-600">Recent Updates</div>
          </div>
        </div>
      </div>

      {/* Real-time Action Center */}
      <div className="bg-gradient-to-r from-professional-50 to-trust-50 border border-professional-200 rounded-xl p-4">
        <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
          <Bell className="w-4 h-4 text-professional-600" />
          <span>Smart Actions</span>
          {unreadCount > 0 && (
            <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
              {unreadCount} new
            </span>
          )}
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Quick Quote Action */}
          {bookingState.selectedServices.length > 0 && (
            <button
              onClick={() => handleNotificationAction('quick_quote', { price: totalPrice })}
              className="flex items-center space-x-2 p-3 bg-white border border-professional-200 rounded-lg hover:border-professional-300 transition-colors"
            >
              <CheckCircle className="w-4 h-4 text-green-600" />
              <div className="text-left">
                <div className="font-medium text-sm">Quick Quote</div>
                <div className="text-xs text-gray-600">£{totalPrice.toFixed(2)} estimated</div>
              </div>
            </button>
          )}

          {/* Priority Booking */}
          {bookingState.currentStep === 'summary' && (
            <button
              onClick={() => handleNotificationAction('priority_booking', {})}
              className="flex items-center space-x-2 p-3 bg-white border border-orange-200 rounded-lg hover:border-orange-300 transition-colors"
            >
              <Clock className="w-4 h-4 text-orange-600" />
              <div className="text-left">
                <div className="font-medium text-sm">Priority Booking</div>
                <div className="text-xs text-gray-600">Fast-track service</div>
              </div>
            </button>
          )}

          {/* Technician Notification */}
          {bookingState.diagnosticPhotos.length > 0 && (
            <button
              onClick={() => handleNotificationAction('technician_notify', {})}
              className="flex items-center space-x-2 p-3 bg-white border border-blue-200 rounded-lg hover:border-blue-300 transition-colors"
            >
              <Camera className="w-4 h-4 text-blue-600" />
              <div className="text-left">
                <div className="font-medium text-sm">Pre-Assessment</div>
                <div className="text-xs text-gray-600">{bookingState.diagnosticPhotos.length} photos ready</div>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Recent Updates Feed */}
      {realtimeUpdates.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h4 className="font-medium text-gray-900 mb-3">Recent Activity</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {realtimeUpdates.slice(-5).reverse().map((update, index) => {
              const getUpdateIcon = (type: string) => {
                switch (type) {
                  case 'step_completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
                  case 'services_updated': return <User className="w-4 h-4 text-blue-600" />;
                  case 'photos_uploaded': return <Camera className="w-4 h-4 text-purple-600" />;
                  case 'appointment_selected': return <Calendar className="w-4 h-4 text-orange-600" />;
                  default: return <Bell className="w-4 h-4 text-gray-600" />;
                }
              };

              return (
                <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                  {getUpdateIcon(update.type)}
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {update.data.message}
                    </div>
                    <div className="text-xs text-gray-600">
                      {update.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                  {update.data.urgent && (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Integration Benefits */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
          <Zap className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <div className="font-medium text-green-800">Instant Updates</div>
          <div className="text-sm text-green-700">Real-time progress tracking</div>
        </div>
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
          <Bell className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <div className="font-medium text-blue-800">Smart Notifications</div>
          <div className="text-sm text-blue-700">Context-aware alerts</div>
        </div>
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg text-center">
          <CheckCircle className="w-8 h-8 text-purple-600 mx-auto mb-2" />
          <div className="font-medium text-purple-800">Enhanced Experience</div>
          <div className="text-sm text-purple-700">Seamless booking flow</div>
        </div>
      </div>
    </div>
  );
};

export default RealtimeBookingIntegration;