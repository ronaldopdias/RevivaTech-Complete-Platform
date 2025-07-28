// Real-time components exports
export { default as RepairProgressTracker } from './RepairProgressTracker';
export { default as ChatWidget } from './ChatWidget';
export { default as BookingNotificationSystem } from './BookingNotificationSystem';

// Export types
export type { BookingStatus, BookingProgress, BookingStatusUpdate } from '@/services/booking-status.service';
export type { Notification, NotificationType, NotificationPriority } from '@/services/notification.service';
export type { DynamicPriceUpdate, DynamicPricingFactors } from '@/services/dynamic-pricing.service';