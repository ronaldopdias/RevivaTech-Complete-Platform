/**
 * Customer Components Index
 * 
 * Centralized exports for all customer-facing components including
 * real-time dashboards, repair tracking, notifications, and photo galleries.
 */

// Main Dashboard Components
export { default as AdvancedCustomerDashboard } from './AdvancedCustomerDashboard';
export { default as RepairTracker } from './RepairTracker';
export { default as NotificationCenter } from './NotificationCenter';
export { default as PhotoGallery } from './PhotoGallery';

// Phase 3 Enhanced Components
export { default as UnifiedCustomerDashboard } from './UnifiedCustomerDashboard';
export { default as CustomerAnalyticsWidgets } from './CustomerAnalyticsWidgets';

// Type Exports
export type { RepairProgress, RepairStep } from './RepairTracker';
export type { Notification, NotificationAction } from './NotificationCenter';
export type { RepairPhoto, PhotoAnnotation } from './PhotoGallery';

// Component Props Types
export type CustomerDashboardProps = {
  customerId?: string;
  authToken?: string;
};

export type RepairTrackerProps = {
  repairId: string;
  onStatusChange?: (status: any) => void;
  showDetailedView?: boolean;
  enableNotifications?: boolean;
};

export type NotificationCenterProps = {
  customerId?: string;
  maxNotifications?: number;
  autoMarkAsRead?: boolean;
  enablePushNotifications?: boolean;
  enableSound?: boolean;
  onNotificationClick?: (notification: any) => void;
  className?: string;
};

export type PhotoGalleryProps = {
  repairId: string;
  customerId?: string;
  showPrivatePhotos?: boolean;
  enableDownload?: boolean;
  enableSharing?: boolean;
  enableComparison?: boolean;
  groupByStep?: boolean;
  className?: string;
};