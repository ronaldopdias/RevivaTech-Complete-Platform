// Booking Progress Management System
// Handles saving and restoring booking progress with local storage and optional backend sync

import { DiagnosticPhoto } from '@/components/booking/DiagnosticPhotoUpload';

export interface BookingProgress {
  id: string;
  timestamp: Date;
  expiresAt: Date;
  step: 'band-selection' | 'service-selection' | 'photo-upload' | 'summary';
  data: {
    selectedBand: 'A' | 'B' | 'C' | null;
    selectedServices: string[];
    diagnosticPhotos: DiagnosticPhoto[];
    discounts: {
      student: boolean;
      blueLightCard: boolean;
    };
    customerInfo?: {
      email?: string;
      phone?: string;
      name?: string;
    };
  };
  metadata: {
    userAgent: string;
    totalPrice: number;
    estimatedTime: string;
    deviceInfo?: string;
  };
}

export interface SavedBooking {
  id: string;
  savedAt: Date;
  expiresAt: Date;
  summary: {
    services: number;
    photos: number;
    totalPrice: number;
    band: string;
  };
  title: string;
}

const STORAGE_KEY = 'revivatech_booking_progress';
const SAVED_BOOKINGS_KEY = 'revivatech_saved_bookings';
const PROGRESS_EXPIRY_HOURS = 24; // Progress expires after 24 hours
const SAVED_BOOKING_EXPIRY_DAYS = 7; // Saved bookings expire after 7 days

/**
 * Generates a unique booking ID
 */
function generateBookingId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `booking_${timestamp}_${random}`;
}

/**
 * Gets the current browser/device info for metadata
 */
function getDeviceInfo(): string {
  if (typeof window === 'undefined') return 'server';
  
  const ua = navigator.userAgent;
  if (ua.includes('Mobile') || ua.includes('Android') || ua.includes('iPhone')) {
    return 'mobile';
  } else if (ua.includes('Tablet') || ua.includes('iPad')) {
    return 'tablet';
  }
  return 'desktop';
}

/**
 * Estimates total repair time based on selected services
 */
function estimateRepairTime(serviceIds: string[]): string {
  // Simple estimation - in a real app, this would use actual service data
  if (serviceIds.length === 0) return '0 hours';
  if (serviceIds.length === 1) return '2-4 hours';
  if (serviceIds.length <= 3) return '4-8 hours';
  return '1-2 days';
}

/**
 * Generates a human-readable title for a saved booking
 */
function generateBookingTitle(progress: BookingProgress): string {
  const { selectedBand, selectedServices } = progress.data;
  if (!selectedBand || selectedServices.length === 0) {
    return 'Incomplete Booking';
  }
  
  return `Band ${selectedBand} - ${selectedServices.length} service${selectedServices.length !== 1 ? 's' : ''}`;
}

/**
 * Saves current booking progress to local storage
 */
export function saveProgress(
  step: BookingProgress['step'],
  data: BookingProgress['data'],
  totalPrice: number
): string {
  try {
    const bookingId = generateBookingId();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + PROGRESS_EXPIRY_HOURS * 60 * 60 * 1000);
    
    const progress: BookingProgress = {
      id: bookingId,
      timestamp: now,
      expiresAt,
      step,
      data,
      metadata: {
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
        totalPrice,
        estimatedTime: estimateRepairTime(data.selectedServices),
        deviceInfo: getDeviceInfo()
      }
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    return bookingId;
  } catch (error) {
    console.error('Failed to save booking progress:', error);
    throw new Error('Unable to save progress. Please check your browser settings.');
  }
}

/**
 * Loads current booking progress from local storage
 */
export function loadProgress(): BookingProgress | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    const progress: BookingProgress = JSON.parse(stored);
    const now = new Date();
    const expiresAt = new Date(progress.expiresAt);
    
    // Check if progress has expired
    if (now > expiresAt) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    
    return progress;
  } catch (error) {
    console.error('Failed to load booking progress:', error);
    // Clear corrupted data
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

/**
 * Clears current booking progress
 */
export function clearProgress(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear booking progress:', error);
  }
}

/**
 * Saves a booking for later retrieval (longer term storage)
 */
export function saveBookingForLater(
  progress: BookingProgress,
  customTitle?: string
): string {
  try {
    const savedBookings = getSavedBookings();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SAVED_BOOKING_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    
    const savedBooking: SavedBooking = {
      id: progress.id,
      savedAt: now,
      expiresAt,
      summary: {
        services: progress.data.selectedServices.length,
        photos: progress.data.diagnosticPhotos.length,
        totalPrice: progress.metadata.totalPrice,
        band: progress.data.selectedBand || 'None'
      },
      title: customTitle || generateBookingTitle(progress)
    };
    
    // Add to saved bookings list
    savedBookings.push(savedBooking);
    
    // Remove old expired bookings
    const validBookings = savedBookings.filter(booking => 
      new Date() < new Date(booking.expiresAt)
    );
    
    // Limit to 5 saved bookings maximum
    const limitedBookings = validBookings.slice(-5);
    
    localStorage.setItem(SAVED_BOOKINGS_KEY, JSON.stringify(limitedBookings));
    
    // Save the full progress data with a prefixed key
    localStorage.setItem(`${STORAGE_KEY}_saved_${progress.id}`, JSON.stringify(progress));
    
    return progress.id;
  } catch (error) {
    console.error('Failed to save booking for later:', error);
    throw new Error('Unable to save booking. Please check your browser settings.');
  }
}

/**
 * Gets list of all saved bookings
 */
export function getSavedBookings(): SavedBooking[] {
  try {
    const stored = localStorage.getItem(SAVED_BOOKINGS_KEY);
    if (!stored) return [];
    
    const bookings: SavedBooking[] = JSON.parse(stored);
    const now = new Date();
    
    // Filter out expired bookings
    const validBookings = bookings.filter(booking => 
      new Date(booking.expiresAt) > now
    );
    
    // Update storage with only valid bookings
    if (validBookings.length !== bookings.length) {
      localStorage.setItem(SAVED_BOOKINGS_KEY, JSON.stringify(validBookings));
    }
    
    return validBookings.sort((a, b) => 
      new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
    );
  } catch (error) {
    console.error('Failed to get saved bookings:', error);
    return [];
  }
}

/**
 * Loads a specific saved booking by ID
 */
export function loadSavedBooking(bookingId: string): BookingProgress | null {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY}_saved_${bookingId}`);
    if (!stored) return null;
    
    const progress: BookingProgress = JSON.parse(stored);
    
    // Check if the saved booking still exists in the saved list
    const savedBookings = getSavedBookings();
    const bookingExists = savedBookings.some(booking => booking.id === bookingId);
    
    if (!bookingExists) {
      // Clean up orphaned data
      localStorage.removeItem(`${STORAGE_KEY}_saved_${bookingId}`);
      return null;
    }
    
    return progress;
  } catch (error) {
    console.error('Failed to load saved booking:', error);
    return null;
  }
}

/**
 * Deletes a saved booking
 */
export function deleteSavedBooking(bookingId: string): void {
  try {
    const savedBookings = getSavedBookings();
    const updatedBookings = savedBookings.filter(booking => booking.id !== bookingId);
    
    localStorage.setItem(SAVED_BOOKINGS_KEY, JSON.stringify(updatedBookings));
    localStorage.removeItem(`${STORAGE_KEY}_saved_${bookingId}`);
  } catch (error) {
    console.error('Failed to delete saved booking:', error);
  }
}

/**
 * Updates the title of a saved booking
 */
export function updateBookingTitle(bookingId: string, newTitle: string): void {
  try {
    const savedBookings = getSavedBookings();
    const updatedBookings = savedBookings.map(booking => 
      booking.id === bookingId ? { ...booking, title: newTitle } : booking
    );
    
    localStorage.setItem(SAVED_BOOKINGS_KEY, JSON.stringify(updatedBookings));
  } catch (error) {
    console.error('Failed to update booking title:', error);
  }
}

/**
 * Checks if there's any existing progress or saved bookings
 */
export function hasAnyProgress(): boolean {
  const currentProgress = loadProgress();
  const savedBookings = getSavedBookings();
  
  return currentProgress !== null || savedBookings.length > 0;
}

/**
 * Gets storage usage information
 */
export function getStorageInfo(): {
  currentProgress: boolean;
  savedBookings: number;
  storageSize: number;
} {
  const currentProgress = loadProgress();
  const savedBookings = getSavedBookings();
  
  // Estimate storage size (rough calculation)
  let storageSize = 0;
  try {
    const allKeys = Object.keys(localStorage).filter(key => 
      key.startsWith(STORAGE_KEY) || key === SAVED_BOOKINGS_KEY
    );
    
    storageSize = allKeys.reduce((total, key) => {
      const value = localStorage.getItem(key) || '';
      return total + key.length + value.length;
    }, 0);
  } catch (error) {
    storageSize = 0;
  }
  
  return {
    currentProgress: currentProgress !== null,
    savedBookings: savedBookings.length,
    storageSize: Math.round(storageSize / 1024) // KB
  };
}

/**
 * Clears all booking data (progress and saved bookings)
 */
export function clearAllBookingData(): void {
  try {
    const allKeys = Object.keys(localStorage).filter(key => 
      key.startsWith(STORAGE_KEY) || key === SAVED_BOOKINGS_KEY
    );
    
    allKeys.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error('Failed to clear all booking data:', error);
  }
}