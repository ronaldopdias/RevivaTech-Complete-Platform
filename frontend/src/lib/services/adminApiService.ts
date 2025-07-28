import { getApiBaseUrl } from '@/lib/utils/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class AdminApiService {
  private getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Get token from localStorage
    if (typeof window !== 'undefined') {
      try {
        const tokens = localStorage.getItem('revivatech_auth_tokens');
        if (tokens) {
          const parsedTokens = JSON.parse(tokens);
          if (parsedTokens.accessToken) {
            headers['Authorization'] = `Bearer ${parsedTokens.accessToken}`;
          }
        }
      } catch (error) {
        console.error('Error loading auth tokens:', error);
      }
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getAuthHeaders(),
          ...options.headers,
        },
        credentials: 'include', // Include cookies for session persistence
      });

      if (!response.ok) {
        // Handle common HTTP errors
        if (response.status === 401) {
          throw new Error('Authentication required - please login');
        } else if (response.status === 403) {
          throw new Error('Access denied - insufficient permissions');
        } else if (response.status === 404) {
          throw new Error('Resource not found');
        } else {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // Email Accounts API
  async getEmailAccounts() {
    return this.request('/api/admin/email-accounts');
  }

  async createEmailAccount(accountData: any) {
    return this.request('/api/admin/email-accounts', {
      method: 'POST',
      body: JSON.stringify(accountData),
    });
  }

  async updateEmailAccount(id: string, updates: any) {
    return this.request('/api/admin/email-accounts', {
      method: 'PUT',
      body: JSON.stringify({ id, ...updates }),
    });
  }

  async deleteEmailAccount(id: string) {
    return this.request(`/api/admin/email-accounts?id=${id}`, {
      method: 'DELETE',
    });
  }

  // Repair Statistics API
  async getRepairStats() {
    return this.request('/api/repairs/stats/overview');
  }

  // Booking Statistics API
  async getBookingStats() {
    return this.request('/api/bookings/stats/overview');
  }

  // Database Admin API
  async getDatabaseSchema() {
    return this.request('/api/admin/database/schema');
  }

  async getDatabaseStats() {
    return this.request('/api/admin/database/stats');
  }

  // Email Templates API
  async getEmailTemplates() {
    return this.request('/api/email-templates');
  }

  async getEmailTemplate(id: string) {
    return this.request(`/api/email-templates/${id}`);
  }

  async createEmailTemplate(templateData: any) {
    return this.request('/api/email-templates', {
      method: 'POST',
      body: JSON.stringify(templateData),
    });
  }

  async updateEmailTemplate(id: string, updates: any) {
    return this.request(`/api/email-templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteEmailTemplate(id: string) {
    return this.request(`/api/email-templates/${id}`, {
      method: 'DELETE',
    });
  }

  // Generic method for custom endpoints
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint);
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

export const adminApiService = new AdminApiService();