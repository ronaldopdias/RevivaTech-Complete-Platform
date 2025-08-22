/**
 * Centralized API service for RevivaTech platform
 * Handles all HTTP requests with proper error handling and authentication
 */

import { featureService } from './featureService';

// Core data types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'technician' | 'customer';
  avatar?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  refreshToken?: string;
}

export interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  preferences?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Repair {
  id: string;
  customerId: string;
  deviceType: string;
  deviceModel: string;
  issue: string;
  status: 'pending' | 'diagnosed' | 'in_progress' | 'completed' | 'cancelled';
  estimatedCost?: number;
  actualCost?: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface Booking {
  id: string;
  customerId: string;
  deviceType: string;
  deviceModel: string;
  issueDescription: string;
  preferredDate: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  estimatedPrice?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Device {
  id: string;
  brand: string;
  model: string;
  category: string;
  repairTypes: string[];
  averageRepairTime: number;
}

export interface PricingRule {
  id: string;
  deviceType: string;
  repairType: string;
  basePrice: number;
  laborCost: number;
  parts?: string[];
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface AdminStats {
  totalCustomers: number;
  totalRepairs: number;
  pendingRepairs: number;
  monthlyRevenue: number;
  averageRepairTime: number;
}

export interface MediaFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  minQuantity: number;
  price: number;
  supplier?: string;
  updatedAt: string;
}

export interface ApiResponse<T = unknown> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class ApiService {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor() {
    this.baseURL = this.getApiBaseUrl();
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  private getApiBaseUrl(): string {
    // Server-side rendering: always use local backend
    if (typeof window === 'undefined') {
      return 'http://localhost:3011';
    }
    
    // Client-side: detect hostname and use appropriate backend URL
    const hostname = window.location.hostname;
    
    // Dynamic hostname detection - use localhost for private IPs
    if (hostname.match(/^100\.\d+\.\d+\.\d+$/)) {
      return 'http://localhost:3011';
    }
    
    // External domain access - use API subdomain through Cloudflare tunnel
    if (hostname === 'revivatech.co.uk' || hostname === 'www.revivatech.co.uk') {
      return 'https://api.revivatech.co.uk';
    }
    
    if (hostname === 'revivatech.com.br' || hostname === 'www.revivatech.com.br') {
      return 'https://api.revivatech.com.br';
    }
    
    // Tailscale serve hostname (development) - use localhost backend
    if (hostname.includes('.tail1168f5.ts.net')) {
      return 'http://localhost:3011';
    }
    
    // Default/localhost access - use local backend
    return 'http://localhost:3011';
  }

  private async request<T = unknown>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}/api${endpoint}`;
    
    // Get auth token from localStorage (matching AuthContext pattern)
    let token = null;
    if (typeof window !== 'undefined') {
      try {
        const tokens = localStorage.getItem('revivatech_auth_tokens');
        if (tokens) {
          const parsedTokens = JSON.parse(tokens);
          token = parsedTokens.accessToken;
        }
      } catch (error) {
        console.error('Error reading auth tokens:', error);
      }
    }
    
    const headers = {
      ...this.defaultHeaders,
      ...options.headers,
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      return {
        data: null as T,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Authentication
  async login(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(userData: Partial<User>): Promise<ApiResponse<AuthResponse>> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async logout(): Promise<ApiResponse<null>> {
    return this.request('/auth/logout', { method: 'POST' });
  }

  // Customer API
  async getCustomerProfile(): Promise<ApiResponse<CustomerProfile>> {
    return this.request('/customer/profile');
  }

  async updateCustomerProfile(profileData: Partial<CustomerProfile>): Promise<ApiResponse<CustomerProfile>> {
    return this.request('/customer/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async getCustomerRepairs(): Promise<ApiResponse<Repair[]>> {
    return this.request('/customer/repairs');
  }

  async getRepairHistory(): Promise<ApiResponse<Repair[]>> {
    return this.request('/customer/repair-history');
  }

  async getNotifications(): Promise<ApiResponse<Notification[]>> {
    return this.request('/customer/notifications');
  }

  async markNotificationRead(notificationId: string): Promise<ApiResponse<null>> {
    return this.request(`/notifications/${notificationId}/read`, {
      method: 'POST',
    });
  }

  // Booking API
  async createBooking(bookingData: Partial<Booking>): Promise<ApiResponse<Booking>> {
    return this.request('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  }

  async getBooking(bookingId: string): Promise<ApiResponse<Booking>> {
    return this.request(`/bookings/${bookingId}`);
  }

  async updateBookingStatus(bookingId: string, status: string): Promise<ApiResponse<Booking>> {
    return this.request(`/bookings/${bookingId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // Devices API
  async getDevices(): Promise<ApiResponse<Device[]>> {
    return this.request('/devices');
  }

  async getDeviceModels(deviceId: string): Promise<ApiResponse<Device[]>> {
    return this.request(`/devices/${deviceId}/models`);
  }

  // Pricing API
  async calculatePrice(pricingData: Record<string, unknown>): Promise<ApiResponse<{ basePrice: number; laborCost: number; totalPrice: number }>> {
    return this.request('/pricing/calculate', {
      method: 'POST',
      body: JSON.stringify(pricingData),
    });
  }

  async getPricingRules(): Promise<ApiResponse<PricingRule[]>> {
    return this.request('/pricing/rules');
  }

  // Admin API
  async getAdminStats(): Promise<ApiResponse<AdminStats>> {
    return this.request('/admin/stats');
  }

  async getRepairQueue(): Promise<ApiResponse<Repair[]>> {
    return this.request('/admin/repair-queue');
  }

  // Admin Procedures API
  async getAdminProcedures(page = 1, limit = 20): Promise<PaginatedResponse<Record<string, unknown>>> {
    return this.request(`/admin/procedures?page=${page}&limit=${limit}`);
  }

  async getAdminProcedure(procedureId: string): Promise<ApiResponse<Record<string, unknown>>> {
    return this.request(`/admin/procedures/${procedureId}`);
  }

  async createAdminProcedure(procedureData: Record<string, unknown>): Promise<ApiResponse<Record<string, unknown>>> {
    return this.request('/admin/procedures', {
      method: 'POST',
      body: JSON.stringify(procedureData),
    });
  }

  async updateAdminProcedure(procedureId: string, procedureData: Record<string, unknown>): Promise<ApiResponse<Record<string, unknown>>> {
    return this.request(`/admin/procedures/${procedureId}`, {
      method: 'PUT',
      body: JSON.stringify(procedureData),
    });
  }

  async deleteAdminProcedure(procedureId: string): Promise<ApiResponse<null>> {
    return this.request(`/admin/procedures/${procedureId}`, {
      method: 'DELETE',
    });
  }

  // Admin Media API
  async getAdminMedia(page = 1, limit = 20, type?: string): Promise<PaginatedResponse<MediaFile>> {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (type) params.append('type', type);
    return this.request(`/admin/media?${params.toString()}`);
  }

  async getAdminMediaFile(mediaId: string): Promise<ApiResponse<MediaFile>> {
    return this.request(`/admin/media/${mediaId}`);
  }

  async uploadAdminMedia(file: File, metadata?: Record<string, unknown>): Promise<ApiResponse<MediaFile>> {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }

    return this.request('/admin/media', {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    });
  }

  async updateAdminMedia(mediaId: string, metadata: Record<string, unknown>): Promise<ApiResponse<MediaFile>> {
    return this.request(`/admin/media/${mediaId}`, {
      method: 'PUT',
      body: JSON.stringify(metadata),
    });
  }

  async deleteAdminMedia(mediaId: string): Promise<ApiResponse<null>> {
    return this.request(`/admin/media/${mediaId}`, {
      method: 'DELETE',
    });
  }

  async getCustomers(page = 1, limit = 20): Promise<PaginatedResponse<CustomerProfile>> {
    return this.request(`/admin/customers?page=${page}&limit=${limit}`);
  }

  async getCustomer(customerId: string): Promise<ApiResponse<CustomerProfile>> {
    return this.request(`/admin/customers/${customerId}`);
  }

  async getInventory(): Promise<ApiResponse<InventoryItem[]>> {
    return this.request('/admin/inventory');
  }

  async addInventoryItem(itemData: Partial<InventoryItem>): Promise<ApiResponse<InventoryItem>> {
    return this.request('/admin/inventory', {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
  }

  async updateInventoryItem(itemId: string, itemData: Partial<InventoryItem>): Promise<ApiResponse<InventoryItem>> {
    return this.request(`/admin/inventory/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(itemData),
    });
  }

  async deleteInventoryItem(itemId: string): Promise<ApiResponse<null>> {
    return this.request(`/admin/inventory/${itemId}`, {
      method: 'DELETE',
    });
  }

  // Analytics API
  async getAnalytics(dateRange?: { start: string; end: string }): Promise<ApiResponse<Record<string, unknown>>> {
    const params = dateRange ? `?start=${dateRange.start}&end=${dateRange.end}` : '';
    return this.request(`/analytics${params}`);
  }

  async getRevenueAnalytics(): Promise<ApiResponse<Record<string, unknown>>> {
    return this.request('/analytics/revenue');
  }

  async getCustomerAnalytics(): Promise<ApiResponse<Record<string, unknown>>> {
    return this.request('/analytics/customers');
  }

  // AI Diagnostics API (if feature enabled)
  async runAIDiagnostics(diagnosticData: Record<string, unknown>): Promise<ApiResponse<Record<string, unknown>>> {
    if (!featureService.isEnabled('ai_diagnostics')) {
      return {
        data: null as Record<string, unknown>,
        success: false,
        error: 'AI Diagnostics feature is not enabled',
      };
    }
    
    return this.request('/ai/diagnostics', {
      method: 'POST',
      body: JSON.stringify(diagnosticData),
    });
  }

  async getAIDiagnosticsHistory(): Promise<ApiResponse<Record<string, unknown>[]>> {
    return this.request('/ai/diagnostics/history');
  }

  // Video Consultation API (if feature enabled)
  async getConsultationSlots(): Promise<ApiResponse<Record<string, unknown>[]>> {
    if (!featureService.isEnabled('video_consultations')) {
      return {
        data: null as Record<string, unknown>[],
        success: false,
        error: 'Video Consultations feature is not enabled',
      };
    }
    
    return this.request('/consultations/slots');
  }

  async bookConsultation(slotData: Record<string, unknown>): Promise<ApiResponse<Record<string, unknown>>> {
    return this.request('/consultations', {
      method: 'POST',
      body: JSON.stringify(slotData),
    });
  }

  // File Upload API
  async uploadFile(file: File, type: string): Promise<ApiResponse<{ url: string; id: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    return this.request('/uploads', {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    });
  }

  // Email API
  async sendTestEmail(emailData: Record<string, unknown>): Promise<ApiResponse<null>> {
    return this.request('/email/test', {
      method: 'POST',
      body: JSON.stringify(emailData),
    });
  }

  async getEmailStatus(): Promise<ApiResponse<Record<string, unknown>>> {
    return this.request('/email/status');
  }

  // Real-time API helpers
  async subscribeToNotifications(userId: string): Promise<ApiResponse<null>> {
    return this.request('/notifications/subscribe', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return this.request('/health');
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;