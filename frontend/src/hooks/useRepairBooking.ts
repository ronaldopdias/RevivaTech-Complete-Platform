'use client';

import { useState, useEffect, useCallback } from 'react';
import { repairBookingSystem, BookingSession, Device, RepairService } from '@/lib/booking/repairBookingSystem';

export interface UseRepairBookingReturn {
  // Session management
  session: BookingSession | null;
  loading: boolean;
  error: string | null;
  
  // Data
  devices: Device[];
  services: RepairService[];
  availableSlots: any[];
  
  // Actions
  startSession: () => void;
  selectDevice: (deviceId: string) => Promise<boolean>;
  selectServices: (serviceIds: string[]) => Promise<boolean>;
  bookAppointment: (date: string, time: string) => Promise<boolean>;
  addCustomerInfo: (customerInfo: any) => Promise<boolean>;
  completeBooking: () => Promise<{ success: boolean; bookingId?: string }>;
  resetBooking: () => void;
  
  // Getters
  getCompatibleServices: (deviceId: string) => RepairService[];
  getDevicesByCategory: (category: string) => Device[];
  applyPromoCode: (code: string) => Promise<{ success: boolean; discount?: number }>;
}

export const useRepairBooking = (): UseRepairBookingReturn => {
  const [session, setSession] = useState<BookingSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [services, setServices] = useState<RepairService[]>([]);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);

  // Initialize data
  useEffect(() => {
    setDevices(repairBookingSystem.getAllDevices());
    setServices(repairBookingSystem.getAllServices());
  }, []);

  // Start new booking session
  const startSession = useCallback(() => {
    try {
      const newSession = repairBookingSystem.startBookingSession();
      setSession(newSession);
      setError(null);
    } catch (err) {
      setError('Failed to start booking session');
      console.error('Start session error:', err);
    }
  }, []);

  // Select device
  const selectDevice = useCallback(async (deviceId: string): Promise<boolean> => {
    if (!session) return false;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = repairBookingSystem.selectDevice(session.id, deviceId);
      if (result.success && result.session) {
        setSession(result.session);
        // Update available slots when device changes
        setAvailableSlots(repairBookingSystem.getAvailableSlots());
        return true;
      } else {
        setError(result.error || 'Failed to select device');
        return false;
      }
    } catch (err) {
      setError('Failed to select device');
      console.error('Select device error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [session]);

  // Select services
  const selectServices = useCallback(async (serviceIds: string[]): Promise<boolean> => {
    if (!session) return false;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = repairBookingSystem.selectServices(session.id, serviceIds);
      if (result.success && result.session) {
        setSession(result.session);
        return true;
      } else {
        setError(result.error || 'Failed to select services');
        return false;
      }
    } catch (err) {
      setError('Failed to select services');
      console.error('Select services error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [session]);

  // Book appointment
  const bookAppointment = useCallback(async (date: string, time: string): Promise<boolean> => {
    if (!session) return false;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = repairBookingSystem.bookAppointment(session.id, date, time);
      if (result.success && result.session) {
        setSession(result.session);
        return true;
      } else {
        setError(result.error || 'Failed to book appointment');
        return false;
      }
    } catch (err) {
      setError('Failed to book appointment');
      console.error('Book appointment error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [session]);

  // Add customer info
  const addCustomerInfo = useCallback(async (customerInfo: any): Promise<boolean> => {
    if (!session) return false;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = repairBookingSystem.addCustomerInfo(session.id, customerInfo);
      if (result.success && result.session) {
        setSession(result.session);
        return true;
      } else {
        setError(result.error || 'Failed to add customer info');
        return false;
      }
    } catch (err) {
      setError('Failed to add customer info');
      console.error('Add customer info error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [session]);

  // Complete booking
  const completeBooking = useCallback(async (): Promise<{ success: boolean; bookingId?: string }> => {
    if (!session) return { success: false };
    
    setLoading(true);
    setError(null);
    
    try {
      const result = repairBookingSystem.completeBooking(session.id);
      if (result.success && result.session) {
        setSession(result.session);
        return { success: true, bookingId: result.bookingId };
      } else {
        setError(result.error || 'Failed to complete booking');
        return { success: false };
      }
    } catch (err) {
      setError('Failed to complete booking');
      console.error('Complete booking error:', err);
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, [session]);

  // Reset booking
  const resetBooking = useCallback(() => {
    setSession(null);
    setError(null);
    setAvailableSlots([]);
  }, []);

  // Get compatible services for device
  const getCompatibleServices = useCallback((deviceId: string): RepairService[] => {
    return repairBookingSystem.getCompatibleServices(deviceId);
  }, []);

  // Get devices by category
  const getDevicesByCategory = useCallback((category: string): Device[] => {
    return repairBookingSystem.getDevicesByCategory(category as any);
  }, []);

  // Apply promo code
  const applyPromoCode = useCallback(async (code: string): Promise<{ success: boolean; discount?: number }> => {
    if (!session) return { success: false };
    
    setLoading(true);
    setError(null);
    
    try {
      const result = repairBookingSystem.applyPromoCode(session.id, code);
      if (result.success) {
        // Refresh session to get updated pricing
        const updatedSession = repairBookingSystem.getBookingSession(session.id);
        if (updatedSession) {
          setSession(updatedSession);
        }
        return { success: true, discount: result.discount };
      } else {
        setError(result.error || 'Failed to apply promo code');
        return { success: false };
      }
    } catch (err) {
      setError('Failed to apply promo code');
      console.error('Apply promo code error:', err);
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, [session]);

  return {
    session,
    loading,
    error,
    devices,
    services,
    availableSlots,
    startSession,
    selectDevice,
    selectServices,
    bookAppointment,
    addCustomerInfo,
    completeBooking,
    resetBooking,
    getCompatibleServices,
    getDevicesByCategory,
    applyPromoCode,
  };
};