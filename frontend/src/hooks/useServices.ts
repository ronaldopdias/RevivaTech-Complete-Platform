import { useState, useEffect, useCallback } from 'react';
import { useServices as useServiceFactory } from '@/lib/services/serviceFactory';
import {
  BookingSubmission,
  BookingResponse,
  Booking,
  BookingStatus,
  Customer,
  CustomerData,
  DeviceCategory,
  DeviceModel,
  RepairType,
  RepairPricing,
  TimeSlot,
  ServiceHealthCheck,
  ApiError,
} from '@/lib/services/types';

// Base hook for API operations
interface UseApiStateOptions {
  immediate?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: ApiError) => void;
}

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  execute: (...args: any[]) => Promise<T | void>;
  reset: () => void;
}

function useApiState<T>(
  apiFunction: (...args: any[]) => Promise<{ data: T }>,
  options: UseApiStateOptions = {}
): UseApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const execute = useCallback(async (...args: any[]) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiFunction(...args);
      setData(response.data);
      
      if (options.onSuccess) {
        options.onSuccess(response.data);
      }
      
      return response.data;
    } catch (err) {
      const apiError = err instanceof Error ? 
        { message: err.message, originalError: err } as ApiError : 
        { message: 'Unknown error occurred' } as ApiError;
      
      setError(apiError);
      
      if (options.onError) {
        options.onError(apiError);
      }
      
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, [apiFunction, options]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, execute, reset };
}

// Booking service hooks
export function useSubmitBooking(options?: UseApiStateOptions) {
  const services = useServiceFactory();
  
  return useApiState<BookingResponse>(
    (bookingData: BookingSubmission) => services.booking.submitBooking(bookingData),
    options
  );
}

export function useGetBooking(bookingId?: string, options?: UseApiStateOptions) {
  const services = useServiceFactory();
  const apiState = useApiState<Booking>(
    (id: string) => services.booking.getBooking(id),
    options
  );

  useEffect(() => {
    if (bookingId && options?.immediate !== false) {
      apiState.execute(bookingId);
    }
  }, [bookingId, apiState.execute, options?.immediate]);

  return apiState;
}

export function useUpdateBookingStatus(options?: UseApiStateOptions) {
  const services = useServiceFactory();
  
  return useApiState<Booking>(
    (bookingId: string, status: BookingStatus) => 
      services.booking.updateBookingStatus(bookingId, status),
    options
  );
}

export function useGetBookingHistory(customerId?: string, options?: UseApiStateOptions) {
  const services = useServiceFactory();
  const apiState = useApiState<Booking[]>(
    (id: string) => services.booking.getBookingHistory(id),
    options
  );

  useEffect(() => {
    if (customerId && options?.immediate !== false) {
      apiState.execute(customerId);
    }
  }, [customerId, apiState.execute, options?.immediate]);

  return apiState;
}

export function useCancelBooking(options?: UseApiStateOptions) {
  const services = useServiceFactory();
  
  return useApiState<boolean>(
    (bookingId: string) => services.booking.cancelBooking(bookingId),
    options
  );
}

export function useGetAvailableSlots(options?: UseApiStateOptions) {
  const services = useServiceFactory();
  
  return useApiState<TimeSlot[]>(
    (date: string, serviceType: string) => 
      services.booking.getAvailableSlots(date, serviceType),
    options
  );
}

// Customer service hooks
export function useCreateCustomer(options?: UseApiStateOptions) {
  const services = useServiceFactory();
  
  return useApiState<Customer>(
    (customerData: CustomerData) => services.customer.createCustomer(customerData),
    options
  );
}

export function useGetCustomer(customerId?: string, options?: UseApiStateOptions) {
  const services = useServiceFactory();
  const apiState = useApiState<Customer>(
    (id: string) => services.customer.getCustomer(id),
    options
  );

  useEffect(() => {
    if (customerId && options?.immediate !== false) {
      apiState.execute(customerId);
    }
  }, [customerId, apiState.execute, options?.immediate]);

  return apiState;
}

export function useUpdateCustomer(options?: UseApiStateOptions) {
  const services = useServiceFactory();
  
  return useApiState<Customer>(
    (customerId: string, updates: Partial<CustomerData>) => 
      services.customer.updateCustomer(customerId, updates),
    options
  );
}

export function useSearchCustomers(options?: UseApiStateOptions) {
  const services = useServiceFactory();
  
  return useApiState<Customer[]>(
    (query: string) => services.customer.searchCustomers(query),
    options
  );
}

// Device service hooks
export function useGetDeviceCategories(options?: UseApiStateOptions) {
  const services = useServiceFactory();
  const apiState = useApiState<DeviceCategory[]>(
    () => services.device.getDeviceCategories(),
    options
  );

  useEffect(() => {
    if (options?.immediate !== false) {
      apiState.execute();
    }
  }, [apiState.execute, options?.immediate]);

  return apiState;
}

export function useGetDeviceModels(categoryId?: string, options?: UseApiStateOptions) {
  const services = useServiceFactory();
  const apiState = useApiState<DeviceModel[]>(
    (id: string) => services.device.getDeviceModels(id),
    options
  );

  useEffect(() => {
    if (categoryId && options?.immediate !== false) {
      apiState.execute(categoryId);
    }
  }, [categoryId, apiState.execute, options?.immediate]);

  return apiState;
}

export function useGetRepairTypes(modelId?: string, options?: UseApiStateOptions) {
  const services = useServiceFactory();
  const apiState = useApiState<RepairType[]>(
    (id: string) => services.device.getRepairTypes(id),
    options
  );

  useEffect(() => {
    if (modelId && options?.immediate !== false) {
      apiState.execute(modelId);
    }
  }, [modelId, apiState.execute, options?.immediate]);

  return apiState;
}

export function useGetRepairPricing(options?: UseApiStateOptions) {
  const services = useServiceFactory();
  
  return useApiState<RepairPricing>(
    (modelId: string, repairTypeId: string) => 
      services.device.getRepairPricing(modelId, repairTypeId),
    options
  );
}

export function useSearchDevices(options?: UseApiStateOptions) {
  const services = useServiceFactory();
  
  return useApiState<DeviceModel[]>(
    (query: string) => services.device.searchDevices(query),
    options
  );
}

// Health monitoring hook
export function useServiceHealth(interval: number = 60000) {
  const services = useServiceFactory();
  const [healthStatus, setHealthStatus] = useState<Record<string, ServiceHealthCheck>>({});
  const [isMonitoring, setIsMonitoring] = useState(false);

  const checkHealth = useCallback(async () => {
    try {
      const health = await services.checkHealth();
      setHealthStatus(health);
      return health;
    } catch (error) {
      console.error('Health check failed:', error);
      return {};
    }
  }, [services]);

  const startMonitoring = useCallback(() => {
    if (!isMonitoring) {
      setIsMonitoring(true);
      checkHealth(); // Initial check
      
      const intervalId = setInterval(checkHealth, interval);
      
      return () => {
        clearInterval(intervalId);
        setIsMonitoring(false);
      };
    }
  }, [isMonitoring, checkHealth, interval]);

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
  }, []);

  return {
    healthStatus,
    isMonitoring,
    checkHealth,
    startMonitoring,
    stopMonitoring,
  };
}

// Service status hook
export function useServiceStatus() {
  const services = useServiceFactory();
  
  const [status, setStatus] = useState(() => services.getStatus());
  const [isUsingMock, setIsUsingMock] = useState(() => services.isUsingMock());

  const refresh = useCallback(() => {
    setStatus(services.getStatus());
    setIsUsingMock(services.isUsingMock());
  }, [services]);

  const switchToMock = useCallback(() => {
    services.switchToMock();
    refresh();
  }, [services, refresh]);

  const switchToReal = useCallback(() => {
    services.switchToReal();
    refresh();
  }, [services, refresh]);

  const updateAuth = useCallback((token: string) => {
    services.updateAuth(token);
  }, [services]);

  return {
    status,
    isUsingMock,
    refresh,
    switchToMock,
    switchToReal,
    updateAuth,
  };
}

// Combined hook for common booking flow
export function useBookingFlow() {
  const submitBooking = useSubmitBooking();
  const getAvailableSlots = useGetAvailableSlots();
  const getRepairPricing = useGetRepairPricing();

  const [currentStep, setCurrentStep] = useState(0);
  const [bookingData, setBookingData] = useState<Partial<BookingSubmission>>({});

  const updateBookingData = useCallback((updates: Partial<BookingSubmission>) => {
    setBookingData(prev => ({ ...prev, ...updates }));
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep(prev => prev + 1);
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  }, []);

  const resetFlow = useCallback(() => {
    setCurrentStep(0);
    setBookingData({});
    submitBooking.reset();
  }, [submitBooking]);

  const submitCurrentBooking = useCallback(async () => {
    if (bookingData as BookingSubmission) {
      return await submitBooking.execute(bookingData as BookingSubmission);
    }
    throw new Error('Incomplete booking data');
  }, [bookingData, submitBooking]);

  return {
    currentStep,
    bookingData,
    submitBooking: submitBooking.data,
    loading: submitBooking.loading,
    error: submitBooking.error,
    
    // Actions
    updateBookingData,
    nextStep,
    prevStep,
    resetFlow,
    submitCurrentBooking,
    
    // Utilities
    getAvailableSlots,
    getRepairPricing,
  };
}

// Export main services hook
export { useServices as useServiceFactory } from '@/lib/services/serviceFactory';

export default {
  useSubmitBooking,
  useGetBooking,
  useUpdateBookingStatus,
  useGetBookingHistory,
  useCancelBooking,
  useGetAvailableSlots,
  useCreateCustomer,
  useGetCustomer,
  useUpdateCustomer,
  useSearchCustomers,
  useGetDeviceCategories,
  useGetDeviceModels,
  useGetRepairTypes,
  useGetRepairPricing,
  useSearchDevices,
  useServiceHealth,
  useServiceStatus,
  useBookingFlow,
  useServiceFactory,
};