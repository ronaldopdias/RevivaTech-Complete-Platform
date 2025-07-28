'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, Clock, AlertCircle, CheckCircle, RefreshCw, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { offlineStorage, type OfflineBooking } from '@/lib/pwa/offlineStorage';
import { haptics } from '@/components/mobile/NativeFeatures';

interface OfflineBookingManagerProps {
  onBookingSubmit?: (bookingData: any) => void;
  className?: string;
}

export function OfflineBookingManager({ onBookingSubmit, className = '' }: OfflineBookingManagerProps) {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [pendingBookings, setPendingBookings] = useState<OfflineBooking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  useEffect(() => {
    // Monitor online status
    const handleOnline = () => {
      setIsOnline(true);
      console.log('📡 Back online - triggering sync');
      handleManualSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('📡 Gone offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load pending bookings
    loadPendingBookings();

    // Set up periodic refresh
    const interval = setInterval(loadPendingBookings, 30000); // Every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const loadPendingBookings = async () => {
    try {
      const pending = await offlineStorage.getOfflineBookings('pending');
      const failed = await offlineStorage.getOfflineBookings('failed');
      setPendingBookings([...pending, ...failed]);
    } catch (error) {
      console.error('Failed to load pending bookings:', error);
    }
  };

  const handleManualSync = async () => {
    if (!isOnline) {
      console.warn('Cannot sync while offline');
      return;
    }

    setIsLoading(true);
    setSyncStatus('syncing');

    try {
      // Request background sync
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if ('sync' in registration) {
          await registration.sync.register('background-booking');
          haptics.light();
        }
      }

      // Wait a moment for sync to potentially complete
      setTimeout(async () => {
        await loadPendingBookings();
        setSyncStatus('success');
        haptics.success();
        
        setTimeout(() => setSyncStatus('idle'), 3000);
      }, 2000);

    } catch (error) {
      console.error('Manual sync failed:', error);
      setSyncStatus('error');
      haptics.error();
      
      setTimeout(() => setSyncStatus('idle'), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    try {
      await offlineStorage.deleteBooking(bookingId);
      await loadPendingBookings();
      haptics.light();
    } catch (error) {
      console.error('Failed to delete booking:', error);
      haptics.error();
    }
  };

  const handleRetryBooking = async (booking: OfflineBooking) => {
    try {
      // Reset retry count and status
      await offlineStorage.updateBookingStatus(booking.id, 'pending');
      await loadPendingBookings();
      
      // Trigger sync
      if (isOnline) {
        handleManualSync();
      }
      
      haptics.medium();
    } catch (error) {
      console.error('Failed to retry booking:', error);
      haptics.error();
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const getStatusIcon = (status: OfflineBooking['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'syncing':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: OfflineBooking['status']) => {
    switch (status) {
      case 'pending':
        return 'Waiting to sync';
      case 'syncing':
        return 'Syncing...';
      case 'failed':
        return 'Sync failed';
      case 'completed':
        return 'Synced';
      default:
        return 'Unknown';
    }
  };

  if (pendingBookings.length === 0) {
    return null;
  }

  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
            <h3 className="font-semibold text-gray-900">
              {isOnline ? 'Online' : 'Offline'} Bookings
            </h3>
            <span className="text-sm text-gray-500">
              {pendingBookings.length} pending
            </span>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleManualSync}
            disabled={!isOnline || isLoading}
            className="h-8 px-3"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Syncing...' : 'Sync'}
          </Button>
        </div>

        {/* Sync Status */}
        <AnimatePresence>
          {syncStatus !== 'idle' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3"
            >
              <div className={`
                flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                ${syncStatus === 'syncing' ? 'bg-blue-50 text-blue-700' : ''}
                ${syncStatus === 'success' ? 'bg-green-50 text-green-700' : ''}
                ${syncStatus === 'error' ? 'bg-red-50 text-red-700' : ''}
              `}>
                {syncStatus === 'syncing' && <RefreshCw className="w-4 h-4 animate-spin" />}
                {syncStatus === 'success' && <CheckCircle className="w-4 h-4" />}
                {syncStatus === 'error' && <AlertCircle className="w-4 h-4" />}
                
                <span>
                  {syncStatus === 'syncing' && 'Syncing bookings...'}
                  {syncStatus === 'success' && 'Sync completed successfully'}
                  {syncStatus === 'error' && 'Sync failed - check connection'}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Booking List */}
      <div className="divide-y divide-gray-100">
        {pendingBookings.map((booking) => (
          <motion.div
            key={booking.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                {getStatusIcon(booking.status)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 truncate">
                      {booking.data.device?.name || 'Device Repair'}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {booking.data.issues?.length || 0} issue(s) • £{booking.data.estimatedCost || 0}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span>{formatTimeAgo(booking.timestamp)}</span>
                      <span>{getStatusText(booking.status)}</span>
                      {booking.retryCount > 0 && (
                        <span className="text-amber-600">
                          Retry {booking.retryCount}/3
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-3">
                    {booking.status === 'failed' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRetryBooking(booking)}
                        className="h-7 px-2 text-xs"
                      >
                        <Send className="w-3 h-3" />
                        Retry
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteBooking(booking.id)}
                      className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Remove
                    </Button>
                  </div>
                </div>

                {/* Customer Info Preview */}
                <div className="mt-3 p-2 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-600">
                    <div>Customer: {booking.data.customerInfo?.name || 'Anonymous'}</div>
                    <div>Email: {booking.data.customerInfo?.email || 'Not provided'}</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      {!isOnline && (
        <div className="p-4 bg-amber-50 border-t border-amber-100">
          <div className="flex items-center gap-2 text-sm text-amber-700">
            <WifiOff className="w-4 h-4" />
            <span>
              You're offline. Bookings will sync automatically when connection is restored.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default OfflineBookingManager;