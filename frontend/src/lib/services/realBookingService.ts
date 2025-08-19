/**
 * Real API-Integrated Booking Service
 * Replaces mock repairBookingSystem with actual backend API calls
 */

import { ApiService } from './apiService';

export interface RealDevice {
  id: string;
  name: string;
  slug: string;
  year: number;
  screenSize?: string;
  specs?: any;
  imageUrl?: string;
  brandId: string;
  brandName: string;
  brandSlug: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
}

export interface DeviceCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  iconName: string;
  sortOrder: number;
}

export interface DeviceBrand {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
}

export interface BookingSubmission {
  deviceModelId: string;
  repairType: string;
  problemDescription: string;
  urgencyLevel?: 'STANDARD' | 'URGENT' | 'EMERGENCY';
  preferredDate?: string;
  customerInfo?: any;
  deviceCondition?: any;
  customerNotes?: string;
}

export interface BookingResponse {
  id: string;
  customerId: string;
  deviceModelId: string;
  repairType: string;
  problemDescription: string;
  urgencyLevel: string;
  status: string;
  basePrice: string;
  finalPrice: string;
  preferredDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookingStats {
  total_bookings: number;
  pending_bookings: number;
  in_progress_bookings: number;
  completed_bookings: number;
  average_price: number;
  total_revenue: number;
}

class RealBookingService extends ApiService {
  
  // Device Management
  async getDeviceCategories(): Promise<DeviceCategory[]> {
    const response = await this.get<{ success: boolean; categories: DeviceCategory[] }>('/api/devices/categories');
    return response.data.categories || [];
  }

  async getDeviceBrands(): Promise<DeviceBrand[]> {
    const response = await this.get<{ success: boolean; brandsByCategory: any[] }>('/api/devices/brands');
    const brands: DeviceBrand[] = [];
    
    if (response.data.brandsByCategory) {
      response.data.brandsByCategory.forEach(category => {
        category.brands.forEach((brand: any) => {
          brands.push({
            id: brand.id,
            name: brand.name,
            slug: brand.slug,
            logoUrl: brand.logoUrl,
            categoryId: category.categoryId,
            categoryName: category.categoryName,
            categorySlug: category.categorySlug
          });
        });
      });
    }
    
    return brands;
  }

  async getBrandModels(brandId: string): Promise<RealDevice[]> {
    const response = await this.get<{ success: boolean; models: RealDevice[] }>(`/api/devices/brands/${brandId}/models`);
    return response.data.models || [];
  }

  async searchDeviceModels(searchTerm: string, limit = 20): Promise<RealDevice[]> {
    const response = await this.get<{ 
      success: boolean; 
      models: RealDevice[]; 
      pagination: any 
    }>('/api/devices/models/search', {
      search: searchTerm,
      limit
    });
    return response.data.models || [];
  }

  async getDeviceModel(modelId: string): Promise<RealDevice | null> {
    try {
      const response = await this.get<{ success: boolean; model: RealDevice }>(`/api/devices/models/${modelId}`);
      return response.data.model || null;
    } catch (error) {
      console.error('Failed to get device model:', error);
      return null;
    }
  }

  // Booking Management
  async createBooking(bookingData: BookingSubmission): Promise<BookingResponse> {
    const response = await this.post<{ 
      success: boolean; 
      message: string; 
      booking: BookingResponse 
    }>('/api/bookings', bookingData);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to create booking');
    }
    
    return response.data.booking;
  }

  async getBooking(bookingId: string): Promise<BookingResponse | null> {
    try {
      const response = await this.get<{ success: boolean; booking: BookingResponse }>(`/api/bookings/${bookingId}`);
      return response.data.booking || null;
    } catch (error) {
      console.error('Failed to get booking:', error);
      return null;
    }
  }

  async getCustomerBookings(customerId?: string): Promise<BookingResponse[]> {
    try {
      const endpoint = customerId ? `/api/bookings/customer/${customerId}` : '/api/bookings/my-bookings';
      const response = await this.get<{ success: boolean; bookings: BookingResponse[] }>(endpoint);
      return response.data.bookings || [];
    } catch (error) {
      console.error('Failed to get customer bookings:', error);
      return [];
    }
  }

  async updateBookingStatus(bookingId: string, status: string): Promise<BookingResponse | null> {
    try {
      const response = await this.put<{ 
        success: boolean; 
        booking: BookingResponse 
      }>(`/api/bookings/${bookingId}`, { status });
      return response.data.booking || null;
    } catch (error) {
      console.error('Failed to update booking status:', error);
      return null;
    }
  }

  async cancelBooking(bookingId: string): Promise<boolean> {
    try {
      const response = await this.delete<{ success: boolean }>(`/api/bookings/${bookingId}`);
      return response.data.success;
    } catch (error) {
      console.error('Failed to cancel booking:', error);
      return false;
    }
  }

  // Statistics
  async getBookingStats(): Promise<BookingStats | null> {
    try {
      const response = await this.get<{ 
        success: boolean; 
        stats: BookingStats 
      }>('/api/bookings/stats/overview');
      return response.data.stats || null;
    } catch (error) {
      console.error('Failed to get booking stats:', error);
      return null;
    }
  }

  // Pricing Estimation
  async estimateRepairPrice(deviceModelId: string, repairType: string, urgencyLevel = 'STANDARD'): Promise<{
    basePrice: number;
    finalPrice: number;
    estimatedTime: string;
  }> {
    // Static pricing based on repair type (matching backend pricing map)
    const basePriceMap: Record<string, number> = {
      'SCREEN_REPAIR': 150.00,
      'BATTERY_REPLACEMENT': 80.00,
      'WATER_DAMAGE': 200.00,
      'DATA_RECOVERY': 180.00,
      'SOFTWARE_ISSUE': 60.00,
      'HARDWARE_DIAGNOSTIC': 40.00,
      'MOTHERBOARD_REPAIR': 250.00,
      'CAMERA_REPAIR': 120.00,
      'SPEAKER_REPAIR': 90.00,
      'CHARGING_PORT': 100.00,
      'BUTTON_REPAIR': 70.00,
      'CUSTOM_REPAIR': 150.00
    };

    const urgencyMultipliers = {
      'STANDARD': 1.0,
      'URGENT': 1.25,
      'EMERGENCY': 1.5
    };

    const timeEstimates = {
      'STANDARD': '3-5 business days',
      'URGENT': '1-2 business days', 
      'EMERGENCY': 'Same day (subject to availability)'
    };

    const basePrice = basePriceMap[repairType] || 100.00;
    const multiplier = urgencyMultipliers[urgencyLevel as keyof typeof urgencyMultipliers] || 1.0;
    const finalPrice = Math.round(basePrice * multiplier * 100) / 100;

    return {
      basePrice,
      finalPrice,
      estimatedTime: timeEstimates[urgencyLevel as keyof typeof timeEstimates] || '3-5 business days'
    };
  }

  // Repair Types
  getRepairTypes(): Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    category: string;
  }> {
    return [
      {
        id: 'SCREEN_REPAIR',
        name: 'Screen Repair',
        description: 'Fix cracked or damaged screens',
        icon: 'smartphone',
        category: 'display'
      },
      {
        id: 'BATTERY_REPLACEMENT',
        name: 'Battery Replacement',
        description: 'Replace old or damaged batteries',
        icon: 'battery',
        category: 'power'
      },
      {
        id: 'WATER_DAMAGE',
        name: 'Water Damage',
        description: 'Repair water damaged devices',
        icon: 'droplets',
        category: 'damage'
      },
      {
        id: 'DATA_RECOVERY',
        name: 'Data Recovery',
        description: 'Recover lost or corrupted data',
        icon: 'hard-drive',
        category: 'data'
      },
      {
        id: 'SOFTWARE_ISSUE',
        name: 'Software Issues',
        description: 'Fix software problems and errors',
        icon: 'settings',
        category: 'software'
      },
      {
        id: 'HARDWARE_DIAGNOSTIC',
        name: 'Hardware Diagnostic',
        description: 'Diagnose hardware problems',
        icon: 'search',
        category: 'diagnostic'
      },
      {
        id: 'MOTHERBOARD_REPAIR',
        name: 'Motherboard Repair',
        description: 'Repair motherboard issues',
        icon: 'cpu',
        category: 'hardware'
      },
      {
        id: 'CAMERA_REPAIR',
        name: 'Camera Repair',
        description: 'Fix camera and photo issues',
        icon: 'camera',
        category: 'hardware'
      },
      {
        id: 'SPEAKER_REPAIR',
        name: 'Speaker Repair',
        description: 'Fix audio and speaker problems',
        icon: 'volume-2',
        category: 'hardware'
      },
      {
        id: 'CHARGING_PORT',
        name: 'Charging Port',
        description: 'Repair charging port issues',
        icon: 'plug',
        category: 'hardware'
      },
      {
        id: 'BUTTON_REPAIR',
        name: 'Button Repair',
        description: 'Fix broken or stuck buttons',
        icon: 'square',
        category: 'hardware'
      },
      {
        id: 'CUSTOM_REPAIR',
        name: 'Custom Repair',
        description: 'Other repair needs',
        icon: 'wrench',
        category: 'other'
      }
    ];
  }
}

// Export singleton instance
export const realBookingService = new RealBookingService();
export default realBookingService;