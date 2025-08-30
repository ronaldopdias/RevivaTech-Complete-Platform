/**
 * Real-Time Booking Status Tracking Service
 * 
 * Provides comprehensive booking lifecycle management with:
 * - Real-time status updates via WebSocket
 * - Status change notifications
 * - Progress tracking and milestones
 * - Customer communication management
 * - Admin dashboard integration
 * 
 * Configuration-driven architecture following Nordic design principles
 */

import { webSocketService, WebSocketEventType } from './websocket.service';

// Booking Status Types
export type BookingStatus = 
  | 'pending'           // Initial booking submitted
  | 'confirmed'         // Booking confirmed by admin
  | 'device-received'   // Device received at shop
  | 'diagnosis'         // Initial diagnosis in progress
  | 'diagnosis-complete'// Diagnosis completed, quote provided
  | 'quote-pending'     // Awaiting customer quote approval
  | 'quote-approved'    // Customer approved quote
  | 'quote-rejected'    // Customer rejected quote
  | 'repair-queued'     // Repair added to queue
  | 'repair-started'    // Repair work began
  | 'repair-progress'   // Repair in progress
  | 'repair-complete'   // Repair finished
  | 'testing'           // Quality testing in progress
  | 'ready-pickup'      // Ready for customer pickup
  | 'delivered'         // Device delivered to customer
  | 'completed'         // Booking fully completed
  | 'cancelled'         // Booking cancelled
  | 'on-hold';          // Repair paused/on hold

export interface BookingStatusUpdate {
  bookingId: string;
  status: BookingStatus;
  timestamp: number;
  updatedBy: string;
  notes?: string;
  estimatedCompletion?: string;
  nextSteps?: string[];
  customerNotification?: boolean;
  adminNotes?: string;
}

export interface BookingProgress {
  bookingId: string;
  currentStatus: BookingStatus;
  statusHistory: BookingStatusUpdate[];
  progressPercentage: number;
  estimatedCompletion?: string;
  milestones: BookingMilestone[];
  nextSteps: string[];
  customerMessages: CustomerMessage[];
}

export interface BookingMilestone {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'skipped';
  completedAt?: number;
  estimatedDuration?: number;
  actualDuration?: number;
}

export interface CustomerMessage {
  id: string;
  bookingId: string;
  type: 'status-update' | 'quote-request' | 'completion-notice' | 'delay-notice' | 'general';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  actionRequired?: boolean;
  actions?: MessageAction[];
}

export interface MessageAction {
  id: string;
  label: string;
  type: 'approve-quote' | 'reject-quote' | 'schedule-pickup' | 'contact-support' | 'view-details';
  url?: string;
  data?: any;
}

interface BookingStatusServiceConfig {
  autoConnect: boolean;
  customerNotifications: boolean;
  adminNotifications: boolean;
  progressUpdateInterval: number;
  debug: boolean;
}

type BookingStatusEventCallback = (progress: BookingProgress) => void;
type StatusChangeCallback = (update: BookingStatusUpdate) => void;
type CustomerMessageCallback = (message: CustomerMessage) => void;

class BookingStatusService {
  private config: BookingStatusServiceConfig;
  private subscriptions = new Map<string, string>(); // bookingId -> subscriptionId
  private statusCallbacks = new Map<string, Set<BookingStatusEventCallback>>();
  private changeCallbacks = new Set<StatusChangeCallback>();
  private messageCallbacks = new Set<CustomerMessageCallback>();
  private isConnected = false;

  constructor(config?: Partial<BookingStatusServiceConfig>) {
    this.config = {
      autoConnect: true,
      customerNotifications: true,
      adminNotifications: false,
      progressUpdateInterval: 5000,
      debug: process.env.NODE_ENV === 'development',
      ...config,
    };

    this.setupWebSocketListeners();

    if (this.config.autoConnect) {
      this.connect();
    }
  }

  /**
   * Connect to real-time booking updates
   */
  async connect(): Promise<void> {
    try {
      await webSocketService.connect();
      this.isConnected = true;
      this.log('BookingStatusService connected');
    } catch (error) {
      this.log('Failed to connect BookingStatusService', error);
      throw error;
    }
  }

  /**
   * Disconnect from real-time updates
   */
  disconnect(): void {
    // Unsubscribe from all bookings
    this.subscriptions.forEach((subscriptionId) => {
      webSocketService.unsubscribe(subscriptionId);
    });
    this.subscriptions.clear();
    this.statusCallbacks.clear();
    this.isConnected = false;
    this.log('BookingStatusService disconnected');
  }

  /**
   * Track specific booking for real-time updates
   */
  trackBooking(
    bookingId: string, 
    callback: BookingStatusEventCallback
  ): () => void {
    if (!this.isConnected) {
      throw new Error('BookingStatusService not connected');
    }

    // Add callback to the set for this booking
    if (!this.statusCallbacks.has(bookingId)) {
      this.statusCallbacks.set(bookingId, new Set());
    }
    this.statusCallbacks.get(bookingId)!.add(callback);

    // Subscribe to WebSocket updates if not already subscribed
    if (!this.subscriptions.has(bookingId)) {
      const subscriptionId = webSocketService.subscribe(
        'booking-status-update',
        this.handleBookingUpdate.bind(this),
        (data) => data.bookingId === bookingId
      );
      this.subscriptions.set(bookingId, subscriptionId);
      this.log('Started tracking booking', bookingId);
    }

    // Return unsubscribe function
    return () => {
      this.untrackBooking(bookingId, callback);
    };
  }

  /**
   * Stop tracking specific booking
   */
  untrackBooking(
    bookingId: string, 
    callback?: BookingStatusEventCallback
  ): void {
    const callbacks = this.statusCallbacks.get(bookingId);
    if (!callbacks) return;

    if (callback) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.statusCallbacks.delete(bookingId);
        this.unsubscribeFromBooking(bookingId);
      }
    } else {
      // Remove all callbacks for this booking
      this.statusCallbacks.delete(bookingId);
      this.unsubscribeFromBooking(bookingId);
    }
  }

  /**
   * Subscribe to all status change events
   */
  onStatusChange(callback: StatusChangeCallback): () => void {
    this.changeCallbacks.add(callback);
    
    return () => {
      this.changeCallbacks.delete(callback);
    };
  }

  /**
   * Subscribe to customer message events
   */
  onCustomerMessage(callback: CustomerMessageCallback): () => void {
    this.messageCallbacks.add(callback);
    
    // Subscribe to WebSocket customer messages
    const subscriptionId = webSocketService.subscribe(
      'notification',
      (data) => {
        if (data.type === 'customer-message') {
          callback(data.message);
        }
      }
    );

    return () => {
      this.messageCallbacks.delete(callback);
      webSocketService.unsubscribe(subscriptionId);
    };
  }

  /**
   * Get current booking progress
   */
  async getBookingProgress(bookingId: string): Promise<BookingProgress | null> {
    try {
      const response = await fetch(`/api/bookings/${bookingId}/progress`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch booking progress');
      }
      return await response.json();
    } catch (error) {
      this.log('Error fetching booking progress', error);
      return null;
    }
  }

  /**
   * Get status history for booking
   */
  async getStatusHistory(bookingId: string): Promise<BookingStatusUpdate[]> {
    try {
      const response = await fetch(`/api/bookings/${bookingId}/status-history`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch status history');
      }
      return await response.json();
    } catch (error) {
      this.log('Error fetching status history', error);
      return [];
    }
  }

  /**
   * Get customer messages for booking
   */
  async getCustomerMessages(bookingId: string): Promise<CustomerMessage[]> {
    try {
      const response = await fetch(`/api/bookings/${bookingId}/messages`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch customer messages');
      }
      return await response.json();
    } catch (error) {
      this.log('Error fetching customer messages', error);
      return [];
    }
  }

  /**
   * Mark customer message as read
   */
  async markMessageRead(messageId: string): Promise<void> {
    try {
      await fetch(`/api/messages/${messageId}/read`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      this.log('Error marking message as read', error);
    }
  }

  /**
   * Perform message action (approve quote, schedule pickup, etc.)
   */
  async performMessageAction(
    messageId: string, 
    actionId: string, 
    data?: any
  ): Promise<void> {
    try {
      await fetch(`/api/messages/${messageId}/actions/${actionId}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data }),
      });
    } catch (error) {
      this.log('Error performing message action', error);
      throw error;
    }
  }

  /**
   * Calculate progress percentage based on status
   */
  static calculateProgress(status: BookingStatus): number {
    const progressMap: Record<BookingStatus, number> = {
      'pending': 5,
      'confirmed': 10,
      'device-received': 15,
      'diagnosis': 25,
      'diagnosis-complete': 35,
      'quote-pending': 40,
      'quote-approved': 45,
      'quote-rejected': 0,
      'repair-queued': 50,
      'repair-started': 60,
      'repair-progress': 75,
      'repair-complete': 85,
      'testing': 90,
      'ready-pickup': 95,
      'delivered': 100,
      'completed': 100,
      'cancelled': 0,
      'on-hold': 0,
    };

    return progressMap[status] || 0;
  }

  /**
   * Get user-friendly status display name
   */
  static getStatusDisplayName(status: BookingStatus): string {
    const displayNames: Record<BookingStatus, string> = {
      'pending': 'Booking Pending',
      'confirmed': 'Booking Confirmed',
      'device-received': 'Device Received',
      'diagnosis': 'Diagnosis in Progress',
      'diagnosis-complete': 'Diagnosis Complete',
      'quote-pending': 'Quote Pending Approval',
      'quote-approved': 'Quote Approved',
      'quote-rejected': 'Quote Rejected',
      'repair-queued': 'Queued for Repair',
      'repair-started': 'Repair Started',
      'repair-progress': 'Repair in Progress',
      'repair-complete': 'Repair Complete',
      'testing': 'Quality Testing',
      'ready-pickup': 'Ready for Pickup',
      'delivered': 'Delivered',
      'completed': 'Completed',
      'cancelled': 'Cancelled',
      'on-hold': 'On Hold',
    };

    return displayNames[status] || status;
  }

  // Private methods

  private setupWebSocketListeners(): void {
    webSocketService.addEventListener('connection-state', (state) => {
      this.isConnected = state === 'connected';
      this.log('WebSocket connection state changed', state);
    });
  }

  private handleBookingUpdate(update: BookingStatusUpdate): void {
    this.log('Received booking update', update);

    // Notify status change callbacks
    this.changeCallbacks.forEach((callback) => {
      try {
        callback(update);
      } catch (error) {
        this.log('Error in status change callback', error);
      }
    });

    // Notify specific booking callbacks
    const callbacks = this.statusCallbacks.get(update.bookingId);
    if (callbacks) {
      // Fetch updated progress and notify callbacks
      this.getBookingProgress(update.bookingId).then((progress) => {
        if (progress) {
          callbacks.forEach((callback) => {
            try {
              callback(progress);
            } catch (error) {
              this.log('Error in booking callback', error);
            }
          });
        }
      });
    }
  }

  private unsubscribeFromBooking(bookingId: string): void {
    const subscriptionId = this.subscriptions.get(bookingId);
    if (subscriptionId) {
      webSocketService.unsubscribe(subscriptionId);
      this.subscriptions.delete(bookingId);
      this.log('Stopped tracking booking', bookingId);
    }
  }

  private log(message: string, data?: any): void {
    if (this.config.debug) {
      console.log(`[BookingStatusService] ${message}`, data || '');
    }
  }
}

// Create singleton instance
export const bookingStatusService = new BookingStatusService();

export default BookingStatusService;