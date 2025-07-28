import React, { useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface BookingData {
  id?: string;
  deviceModel?: any;
  issues?: string[];
  customerInfo?: any;
  status?: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  urgency?: string;
  timeline?: string;
  estimatedCost?: number;
  actualCost?: number;
  technicianId?: string;
  technicianName?: string;
}

interface RealtimeBookingNotificationsProps {
  bookingData: BookingData;
  userId: string;
  onBookingUpdate?: (data: BookingData) => void;
  onNotificationSent?: (notificationId: string) => void;
  className?: string;
}

export const RealtimeBookingNotifications: React.FC<RealtimeBookingNotificationsProps> = ({
  bookingData,
  userId,
  onBookingUpdate,
  onNotificationSent,
  className,
}) => {
  // Send notification based on booking status changes
  const sendBookingNotification = useCallback(async (
    templateId: string,
    data: Record<string, any>
  ) => {
    if (!userId || !bookingData.id) return;

    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          userId,
          templateId,
          data: {
            ...data,
            bookingId: bookingData.id,
            device: bookingData.deviceModel?.name || 'your device',
            amount: data.amount || (bookingData.estimatedCost ? `$${bookingData.estimatedCost}` : ''),
            technician: bookingData.technicianName || 'our technician'
          }
        })
      });

      const result = await response.json();
      if (result.success && onNotificationSent) {
        onNotificationSent(result.notification.id);
      }
    } catch (error) {
      console.error('Error sending booking notification:', error);
    }
  }, [userId, bookingData, onNotificationSent]);

  // React to booking status changes
  useEffect(() => {
    if (!bookingData.status || !bookingData.id) return;

    switch (bookingData.status) {
      case 'confirmed':
        sendBookingNotification('booking-confirmed', {
          date: 'Tomorrow',
          time: '2:00 PM'
        });
        break;

      case 'in-progress':
        sendBookingNotification('repair-started', {});
        break;

      case 'completed':
        sendBookingNotification('repair-completed', {
          amount: bookingData.actualCost ? `$${bookingData.actualCost}` : undefined
        });
        
        // Send device ready notification after completion
        setTimeout(() => {
          sendBookingNotification('device-ready', {});
        }, 2000);
        break;

      case 'cancelled':
        // Could send cancellation notification if needed
        break;
    }
  }, [bookingData.status, sendBookingNotification]);

  // Handle quote generation
  const handleQuoteGenerated = useCallback((quoteAmount: number) => {
    sendBookingNotification('quote-ready', {
      amount: `$${quoteAmount}`
    });
  }, [sendBookingNotification]);

  // Handle payment requirement
  const handlePaymentRequired = useCallback((amount: number) => {
    sendBookingNotification('payment-required', {
      amount: `$${amount}`
    });
  }, [sendBookingNotification]);

  // Handle technician assignment
  const handleTechnicianAssigned = useCallback((technicianName: string) => {
    sendBookingNotification('repair-started', {
      technician: technicianName
    });
  }, [sendBookingNotification]);

  // Simulate booking workflow for demo
  const simulateBookingWorkflow = async () => {
    if (!bookingData.id) return;

    const workflow = [
      { delay: 1000, action: () => onBookingUpdate?.({ ...bookingData, status: 'confirmed' }) },
      { delay: 3000, action: () => handleQuoteGenerated(299) },
      { delay: 5000, action: () => onBookingUpdate?.({ ...bookingData, status: 'in-progress', technicianName: 'John Smith' }) },
      { delay: 8000, action: () => onBookingUpdate?.({ ...bookingData, status: 'completed', actualCost: 299 }) },
    ];

    workflow.forEach(({ delay, action }) => {
      setTimeout(action, delay);
    });
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Booking Status Integration */}
      {bookingData.id && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-blue-900">Real-time Booking Notifications</h4>
            <div className="text-sm text-blue-700">
              Booking: {bookingData.id}
            </div>
          </div>
          
          <div className="text-sm text-blue-800 mb-3">
            Status: <span className="font-medium capitalize">{bookingData.status || 'pending'}</span>
          </div>

          {/* Demo Controls */}
          <div className="space-y-2">
            <div className="text-xs text-blue-700 mb-2">Demo Controls:</div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={simulateBookingWorkflow}
                className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
              >
                🚀 Simulate Full Workflow
              </button>
              <button
                onClick={() => sendBookingNotification('booking-confirmed', { date: 'Today', time: '3:00 PM' })}
                className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
              >
                ✅ Confirm Booking
              </button>
              <button
                onClick={() => handleQuoteGenerated(199)}
                className="px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700"
              >
                💰 Send Quote
              </button>
              <button
                onClick={() => handlePaymentRequired(199)}
                className="px-3 py-1 bg-orange-600 text-white text-xs rounded hover:bg-orange-700"
              >
                💳 Request Payment
              </button>
              <button
                onClick={() => handleTechnicianAssigned('Sarah Johnson')}
                className="px-3 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700"
              >
                👨‍🔧 Assign Technician
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Events Log */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Booking Notification Events</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <div>• Status changes trigger automatic notifications</div>
          <div>• Quote generation sends real-time updates</div>
          <div>• Payment requests create urgent notifications</div>
          <div>• Technician assignment notifies customers</div>
          <div>• Completion triggers pickup notifications</div>
        </div>
      </div>

      {/* Integration Benefits */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
          <div className="text-2xl mb-1">📱</div>
          <div className="font-medium text-green-800">Instant Updates</div>
          <div className="text-xs text-green-700">Real-time status changes</div>
        </div>
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
          <div className="text-2xl mb-1">🔔</div>
          <div className="font-medium text-blue-800">Smart Notifications</div>
          <div className="text-xs text-blue-700">Context-aware messaging</div>
        </div>
        <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-center">
          <div className="text-2xl mb-1">🚀</div>
          <div className="font-medium text-purple-800">Better Experience</div>
          <div className="text-xs text-purple-700">Proactive communication</div>
        </div>
      </div>
    </div>
  );
};

export default RealtimeBookingNotifications;