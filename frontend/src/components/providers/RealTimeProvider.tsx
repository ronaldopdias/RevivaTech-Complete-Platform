'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useWebSocket, useNotifications, useRepairUpdates } from '@/lib/services/websocketService';
import { NotificationMessage, RepairUpdateMessage } from '@/lib/services/websocketService';

interface RealTimeContextType {
  isConnected: boolean;
  notifications: NotificationMessage[];
  repairUpdates: RepairUpdateMessage[];
  unreadCount: number;
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;
  latestRepairUpdate: RepairUpdateMessage | null;
}

const RealTimeContext = createContext<RealTimeContextType | undefined>(undefined);

export const useRealTime = () => {
  const context = useContext(RealTimeContext);
  if (!context) {
    throw new Error('useRealTime must be used within a RealTimeProvider');
  }
  return context;
};

interface RealTimeProviderProps {
  children: React.ReactNode;
  userId?: string;
}

export const RealTimeProvider: React.FC<RealTimeProviderProps> = ({
  children,
  userId,
}) => {
  const { isConnected } = useWebSocket(userId);
  const { 
    notifications, 
    markAsRead, 
    clearAll, 
    unreadCount 
  } = useNotifications(userId);
  const { 
    repairUpdates, 
    latestUpdate 
  } = useRepairUpdates(userId);

  // Show toast notifications for new notifications
  useEffect(() => {
    if (notifications.length > 0) {
      const latestNotification = notifications[0];
      if (!latestNotification.data.read) {
        // You can integrate with a toast library here
        console.log('New notification:', latestNotification.data);
        
        // Show browser notification if permission granted
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(latestNotification.data.title, {
            body: latestNotification.data.message,
            icon: '/revivatech-logo.svg',
          });
        }
      }
    }
  }, [notifications]);

  // Show toast for repair updates
  useEffect(() => {
    if (latestUpdate) {
      console.log('Repair update:', latestUpdate.data);
      
      // Show browser notification if permission granted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Repair Status Update', {
          body: latestUpdate.data.message,
          icon: '/revivatech-logo.svg',
        });
      }
    }
  }, [latestUpdate]);

  const value: RealTimeContextType = {
    isConnected,
    notifications,
    repairUpdates,
    unreadCount,
    markNotificationAsRead: markAsRead,
    clearAllNotifications: clearAll,
    latestRepairUpdate: latestUpdate,
  };

  return (
    <RealTimeContext.Provider value={value}>
      {children}
    </RealTimeContext.Provider>
  );
};

export default RealTimeProvider;