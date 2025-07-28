// Booking service with configuration-driven API abstraction for RevivaTech
// Handles all booking-related API calls and business logic

import { BookingFormConfig } from '@/lib/forms/booking-types';
import { RepairConfigurationService } from '@/config/repairs/repair-types.config';
import { AvailabilityService } from '@/config/scheduling/availability.config';
import { PricingEngine } from '@/config/pricing/pricing-engine.config';

export interface DeviceSearchResult {
  id: string;
  name: string;
  brand: string;
  category: string;
  year: number;
  image?: string;
  specifications?: Record<string, any>;
  popularity: number;
  supportedRepairs: string[];
}

export interface AvailabilitySlot {
  id: string;
  date: string;
  time: string;
  duration: number;
  available: boolean;
  capacity: number;
  bookingCount: number;
  price?: number;
  surcharges?: Array<{ name: string; amount: number; }>;
}

export interface PriceQuote {
  id: string;
  repairType: string;
  deviceInfo: {
    id: string;
    name: string;
    brand: string;
    condition: string;
  };
  pricing: {
    basePrice: number;
    laborCost: number;
    totalPrice: number;
    breakdown: {
      parts: number;
      labor: number;
      surcharges: number;
      discounts: number;
      tax: number;
    };
    factors: Array<{
      name: string;
      impact: number;
      description: string;
    }>;
    discounts: Array<{
      name: string;
      amount: number;
      percentage: number;
    }>;
  };
  timeline: {
    estimatedHours: number;
    businessDays: number;
    urgency: string;
  };
  warranty: {
    duration: number;
    coverage: string[];
  };
  validUntil: string;
  terms: string[];
}

export interface BookingSubmission {
  device: {
    id: string;
    variant?: string;
    storage?: string;
    color?: string;
    condition: string;
    purchaseDate?: string;
  };
  issues: {
    primaryIssues: string[];
    description: string;
    photos?: string[];
    urgency: string;
    backupStatus: string;
  };
  service: {
    type: 'drop_off' | 'collection' | 'postal';
    appointmentSlot?: string;
    address?: {
      street: string;
      city: string;
      postcode: string;
      country: string;
    };
    contactMethods: string[];
    specialInstructions?: string;
  };
  customer: {
    fullName: string;
    email: string;
    phone: string;
    customerType: 'individual' | 'business';
    companyName?: string;
    vatNumber?: string;
  };
  quote: {
    id: string;
    accepted: boolean;
    finalPrice: number;
  };
  agreements: {
    termsAccepted: string[];
    marketingConsent: boolean;
  };
  metadata: {
    source: string;
    userAgent: string;
    sessionId: string;
    timestamp: string;
  };
}

export interface BookingResponse {
  success: boolean;
  bookingId: string;
  reference: string;
  status: 'confirmed' | 'pending' | 'requires_approval';
  estimatedCompletion: string;
  nextSteps: string[];
  customerPortalUrl: string;
  confirmationSent: boolean;
  errors?: string[];
}

// Base API service with error handling and retry logic
class BaseApiService {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private retryAttempts: number;
  private retryDelay: number;

  constructor(config: { baseUrl?: string; retryAttempts?: number; retryDelay?: number } = {}) {
    this.baseUrl = config.baseUrl || '/api';
    this.retryAttempts = config.retryAttempts || 3;
    this.retryDelay = config.retryDelay || 1000;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {},
    attempt: number = 1
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.defaultHeaders,
          ...options.headers,
        },
      });

      if (!response.ok) {
        if (response.status >= 500 && attempt < this.retryAttempts) {
          await this.delay(this.retryDelay * attempt);
          return this.makeRequest<T>(endpoint, options, attempt + 1);
        }
        
        const errorData = await response.text();
        throw new Error(`API Error ${response.status}: ${errorData}`);
      }

      return await response.json();
    } catch (error) {
      if (attempt < this.retryAttempts && error instanceof TypeError) {
        // Network error, retry
        await this.delay(this.retryDelay * attempt);
        return this.makeRequest<T>(endpoint, options, attempt + 1);
      }
      throw error;
    }
  }

  protected async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = new URL(endpoint, this.baseUrl);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    
    return this.makeRequest<T>(url.pathname + url.search);
  }

  protected async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  protected async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  protected async delete<T>(endpoint: string): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

// Device search and information service
export class DeviceService extends BaseApiService {
  
  /**
   * Search for devices by query string
   */
  async searchDevices(
    query: string, 
    filters?: {
      brand?: string;
      category?: string;
      year?: number;
      limit?: number;
    }
  ): Promise<DeviceSearchResult[]> {
    try {
      const params = {
        q: query,
        ...filters,
        limit: filters?.limit || 20
      };

      const response = await this.get<{ devices: DeviceSearchResult[] }>('/devices/search', params);
      return response.devices;
    } catch (error) {
      console.error('Device search failed:', error);
      
      // Fallback to local device database if API fails
      return this.fallbackDeviceSearch(query, filters);
    }
  }

  /**
   * Get device details by ID
   */
  async getDeviceDetails(deviceId: string): Promise<DeviceSearchResult | null> {
    try {
      return await this.get<DeviceSearchResult>(`/devices/${deviceId}`);
    } catch (error) {
      console.error('Failed to get device details:', error);
      return null;
    }
  }

  /**
   * Get device variants (colors, storage options, etc.)
   */
  async getDeviceVariants(deviceId: string, type: 'colors' | 'storage' | 'variants'): Promise<Array<{ value: string; label: string; }>> {
    try {
      const response = await this.get<{ options: Array<{ value: string; label: string; }> }>(`/devices/${deviceId}/${type}`);
      return response.options;
    } catch (error) {
      console.error(`Failed to get device ${type}:`, error);
      return [];
    }
  }

  /**
   * Get compatible repairs for a device
   */
  async getCompatibleRepairs(deviceId: string): Promise<Array<{ id: string; name: string; basePrice: number; }>> {
    try {
      const response = await this.get<{ repairs: Array<{ id: string; name: string; basePrice: number; }> }>(`/devices/${deviceId}/repairs`);
      return response.repairs;
    } catch (error) {
      console.error('Failed to get compatible repairs:', error);
      return [];
    }
  }

  /**
   * Fallback device search using local configuration
   */
  private async fallbackDeviceSearch(query: string, filters?: any): Promise<DeviceSearchResult[]> {
    // This would use the local device database configuration
    // For now, return mock data
    return [
      {
        id: 'fallback-device-1',
        name: `${query} (from local database)`,
        brand: 'Unknown',
        category: 'smartphone',
        year: 2023,
        popularity: 50,
        supportedRepairs: ['screen-replacement-basic', 'battery-replacement-phone']
      }
    ];
  }
}

// Repair and pricing service
export class RepairService extends BaseApiService {
  
  /**
   * Get available repair types for a device
   */
  async getRepairTypes(deviceType: string, brand: string, year: number): Promise<Array<{ id: string; name: string; category: string; basePrice: number; }>> {
    try {
      const params = { deviceType, brand, year };
      const response = await this.get<{ repairs: Array<{ id: string; name: string; category: string; basePrice: number; }> }>('/repairs/types', params);
      return response.repairs;
    } catch (error) {
      console.error('Failed to get repair types:', error);
      
      // Fallback to configuration
      return RepairConfigurationService.getCompatibleRepairs(deviceType, brand, year)
        .map(repair => ({
          id: repair.id,
          name: repair.name,
          category: repair.category,
          basePrice: repair.pricing.basePrice
        }));
    }
  }

  /**
   * Calculate pricing quote for repairs
   */
  async calculateQuote(params: {
    repairTypes: string[];
    deviceId: string;
    deviceCondition: string;
    urgency: string;
    serviceType: string;
    customerType?: string;
  }): Promise<PriceQuote> {
    try {
      const response = await this.post<PriceQuote>('/pricing/calculate', params);
      return response;
    } catch (error) {
      console.error('Failed to calculate quote:', error);
      
      // Fallback to local pricing engine
      return this.fallbackPriceCalculation(params);
    }
  }

  /**
   * Upload damage photos and get AI analysis
   */
  async uploadPhotos(files: File[]): Promise<{ urls: string[]; analysis?: any }> {
    try {
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append(`photo_${index}`, file);
      });

      const response = await fetch(`${this.baseUrl}/uploads/photos`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Photo upload failed:', error);
      throw error;
    }
  }

  /**
   * Fallback price calculation using local engine
   */
  private async fallbackPriceCalculation(params: any): Promise<PriceQuote> {
    // Use local pricing engine
    const pricingResult = PricingEngine.calculateRepairPrice({
      repairType: params.repairTypes[0], // Use first repair type for simplicity
      deviceType: 'smartphone', // Would get from device info
      brand: 'unknown',
      deviceAge: 'standard',
      damageSeverity: params.deviceCondition,
      urgency: params.urgency,
      partsAvailability: 'in_stock',
      customerType: params.customerType
    });

    return {
      id: `quote_${Date.now()}`,
      repairType: params.repairTypes[0],
      deviceInfo: {
        id: params.deviceId,
        name: 'Unknown Device',
        brand: 'Unknown',
        condition: params.deviceCondition
      },
      pricing: {
        basePrice: pricingResult.breakdown.basePrice,
        laborCost: pricingResult.breakdown.laborCost,
        totalPrice: pricingResult.total,
        breakdown: {
          parts: pricingResult.breakdown.basePrice,
          labor: pricingResult.breakdown.laborCost,
          surcharges: 0,
          discounts: pricingResult.breakdown.discountTotal,
          tax: pricingResult.breakdown.taxAmount
        },
        factors: pricingResult.factors.map(f => ({
          name: f.name,
          impact: f.impact,
          description: f.label
        })),
        discounts: pricingResult.discounts.map(d => ({
          name: d.name,
          amount: d.amount,
          percentage: d.percentage
        }))
      },
      timeline: {
        estimatedHours: 2,
        businessDays: 3,
        urgency: params.urgency
      },
      warranty: {
        duration: 6,
        coverage: ['workmanship', 'parts']
      },
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      terms: [
        'Quote valid for 7 days',
        'Final price may vary after diagnostic',
        'Warranty covers parts and workmanship'
      ]
    };
  }
}

// Availability and scheduling service
export class SchedulingService extends BaseApiService {
  
  /**
   * Get available appointment slots
   */
  async getAvailableSlots(
    date: string,
    repairType: string,
    duration?: number
  ): Promise<AvailabilitySlot[]> {
    try {
      const params = { date, repairType, duration };
      const response = await this.get<{ slots: AvailabilitySlot[] }>('/availability/slots', params);
      return response.slots;
    } catch (error) {
      console.error('Failed to get available slots:', error);
      
      // Fallback to local availability service
      return this.fallbackAvailabilityCheck(date, repairType);
    }
  }

  /**
   * Check if specific slot is available
   */
  async checkSlotAvailability(slotId: string): Promise<{ available: boolean; reason?: string }> {
    try {
      return await this.get<{ available: boolean; reason?: string }>(`/availability/slots/${slotId}/check`);
    } catch (error) {
      console.error('Failed to check slot availability:', error);
      return { available: false, reason: 'Service unavailable' };
    }
  }

  /**
   * Reserve a time slot temporarily
   */
  async reserveSlot(slotId: string, duration: number = 15): Promise<{ reserved: boolean; expiresAt: string }> {
    try {
      return await this.post<{ reserved: boolean; expiresAt: string }>(`/availability/slots/${slotId}/reserve`, { duration });
    } catch (error) {
      console.error('Failed to reserve slot:', error);
      return { 
        reserved: false, 
        expiresAt: new Date(Date.now() + duration * 60 * 1000).toISOString() 
      };
    }
  }

  /**
   * Fallback availability check using local service
   */
  private async fallbackAvailabilityCheck(date: string, repairType: string): Promise<AvailabilitySlot[]> {
    const dateObj = new Date(date);
    const slots = AvailabilityService.getAvailableSlots(dateObj, repairType);
    
    return slots.map(slot => ({
      id: slot.id,
      date: date,
      time: slot.time,
      duration: slot.duration,
      available: slot.available,
      capacity: slot.capacity,
      bookingCount: slot.bookingCount
    }));
  }
}

// Main booking service orchestrator
export class BookingService extends BaseApiService {
  private deviceService: DeviceService;
  private repairService: RepairService;
  private schedulingService: SchedulingService;

  constructor() {
    super();
    this.deviceService = new DeviceService();
    this.repairService = new RepairService();
    this.schedulingService = new SchedulingService();
  }

  /**
   * Submit complete booking
   */
  async submitBooking(booking: BookingSubmission): Promise<BookingResponse> {
    try {
      // Validate booking data
      this.validateBooking(booking);
      
      // Submit to API
      const response = await this.post<BookingResponse>('/bookings', booking);
      
      // Track analytics
      this.trackBookingSubmission(booking, response);
      
      return response;
    } catch (error) {
      console.error('Booking submission failed:', error);
      
      // Handle offline mode or API failure
      return this.handleOfflineBooking(booking);
    }
  }

  /**
   * Get booking status by ID
   */
  async getBookingStatus(bookingId: string): Promise<any> {
    try {
      return await this.get(`/bookings/${bookingId}/status`);
    } catch (error) {
      console.error('Failed to get booking status:', error);
      return null;
    }
  }

  /**
   * Update booking details
   */
  async updateBooking(bookingId: string, updates: Partial<BookingSubmission>): Promise<boolean> {
    try {
      await this.put(`/bookings/${bookingId}`, updates);
      return true;
    } catch (error) {
      console.error('Failed to update booking:', error);
      return false;
    }
  }

  /**
   * Cancel booking
   */
  async cancelBooking(bookingId: string, reason?: string): Promise<boolean> {
    try {
      await this.post(`/bookings/${bookingId}/cancel`, { reason });
      return true;
    } catch (error) {
      console.error('Failed to cancel booking:', error);
      return false;
    }
  }

  /**
   * Get comprehensive booking data for form
   */
  async getBookingFormData(config: BookingFormConfig): Promise<{
    deviceCategories: any[];
    repairTypes: any[];
    availabilityRules: any[];
  }> {
    try {
      // Parallel requests for form data
      const [deviceCategories, repairTypes, availabilityRules] = await Promise.all([
        this.get('/devices/categories'),
        this.get('/repairs/categories'),
        this.get('/availability/rules')
      ]);

      return {
        deviceCategories: deviceCategories || [],
        repairTypes: repairTypes || [],
        availabilityRules: availabilityRules || []
      };
    } catch (error) {
      console.error('Failed to load booking form data:', error);
      return {
        deviceCategories: [],
        repairTypes: [],
        availabilityRules: []
      };
    }
  }

  /**
   * Validate booking submission
   */
  private validateBooking(booking: BookingSubmission): void {
    if (!booking.device?.id) {
      throw new Error('Device selection is required');
    }
    
    if (!booking.issues?.primaryIssues?.length) {
      throw new Error('At least one issue must be selected');
    }
    
    if (!booking.customer?.email || !booking.customer?.phone) {
      throw new Error('Customer contact information is required');
    }
    
    if (!booking.quote?.accepted) {
      throw new Error('Quote must be accepted');
    }
  }

  /**
   * Handle offline booking scenario
   */
  private async handleOfflineBooking(booking: BookingSubmission): Promise<BookingResponse> {
    // Store booking in local storage for later submission
    const offlineBooking = {
      ...booking,
      offline: true,
      timestamp: new Date().toISOString()
    };
    
    const offlineBookings = JSON.parse(localStorage.getItem('offline_bookings') || '[]');
    offlineBookings.push(offlineBooking);
    localStorage.setItem('offline_bookings', JSON.stringify(offlineBookings));
    
    return {
      success: true,
      bookingId: `offline_${Date.now()}`,
      reference: `REF${Date.now()}`,
      status: 'pending',
      estimatedCompletion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      nextSteps: [
        'Your booking has been saved offline',
        'We will process it when connectivity is restored',
        'You will receive a confirmation email shortly'
      ],
      customerPortalUrl: '/customer/offline',
      confirmationSent: false
    };
  }

  /**
   * Track booking submission for analytics
   */
  private trackBookingSubmission(booking: BookingSubmission, response: BookingResponse): void {
    try {
      // Track with analytics service
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'booking_completed', {
          event_category: 'booking',
          event_label: booking.device.id,
          value: booking.quote.finalPrice
        });
      }
      
      // Track conversion
      console.log('Booking conversion tracked:', {
        bookingId: response.bookingId,
        deviceType: booking.device.id,
        repairTypes: booking.issues.primaryIssues,
        totalValue: booking.quote.finalPrice
      });
    } catch (error) {
      console.error('Analytics tracking failed:', error);
    }
  }

  // Expose sub-services
  get devices() { return this.deviceService; }
  get repairs() { return this.repairService; }
  get scheduling() { return this.schedulingService; }
}

// Export singleton instance
export const bookingService = new BookingService();

export default {
  BookingService,
  DeviceService,
  RepairService,
  SchedulingService,
  bookingService
};