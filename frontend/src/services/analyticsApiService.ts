/**
 * Analytics API Service
 * HTTP client for RevivaTech analytics backend
 * Handles authentication, error handling, and data transformation
 */

export interface AnalyticsMetric {
  id: string;
  title: string;
  value: string | number;
  change: number;
  changeType: 'positive' | 'negative' | 'neutral';
  description: string;
  category: 'revenue' | 'operations' | 'customer' | 'quality';
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  lastUpdated?: string;
}

export interface RealTimeMetrics {
  totalRevenue: number;
  totalBookings: number;
  activeRepairs: number;
  avgRepairTime: number;
  customerSatisfaction: number;
  conversionRate: number;
  timestamp: string;
}

export interface CustomerInsight {
  fingerprint: string;
  totalSessions: number;
  totalPageviews: number;
  avgSessionDuration: number;
  conversionRate: number;
  leadScore: number;
  engagementScore: number;
  churnScore: number;
  lastSeen: string;
}

export interface FunnelData {
  stage: string;
  users: number;
  conversionRate: number;
  dropoffRate: number;
}

export interface AnalyticsApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

class AnalyticsApiService {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor() {
    this.baseUrl = process.env.NODE_ENV === 'production'
      ? '/api/analytics'
      : 'http://localhost:3011/api/analytics';
  }

  /**
   * Set authentication token for admin endpoints
   */
  setAuthToken(token: string) {
    this.authToken = token;
  }

  /**
   * Get authentication headers
   */
  private getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  /**
   * Generic HTTP request handler with error handling
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<AnalyticsApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          ...this.getAuthHeaders(),
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`Analytics API Error (${endpoint}):`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Record analytics event
   */
  async recordEvent(eventData: {
    user_fingerprint: string;
    session_id: string;
    event_type: string;
    page_url?: string;
    metadata?: Record<string, any>;
  }): Promise<AnalyticsApiResponse<any>> {
    return this.request('/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  }

  /**
   * Get real-time metrics
   */
  async getRealTimeMetrics(): Promise<AnalyticsApiResponse<RealTimeMetrics>> {
    return this.request('/realtime');
  }

  /**
   * Get customer insights by fingerprint
   */
  async getCustomerInsights(fingerprint: string): Promise<AnalyticsApiResponse<CustomerInsight>> {
    return this.request(`/insights/${fingerprint}`);
  }

  /**
   * Get conversion funnel data
   */
  async getFunnelData(): Promise<AnalyticsApiResponse<FunnelData[]>> {
    return this.request('/funnel');
  }

  /**
   * Get all customer insights (paginated)
   */
  async getAllCustomerInsights(
    page: number = 1,
    limit: number = 50
  ): Promise<AnalyticsApiResponse<{
    insights: CustomerInsight[];
    totalCount: number;
    currentPage: number;
    totalPages: number;
  }>> {
    return this.request(`/insights?page=${page}&limit=${limit}`);
  }

  /**
   * Get user sessions for a specific fingerprint
   */
  async getUserSessions(
    fingerprint: string,
    page: number = 1,
    limit: number = 20
  ): Promise<AnalyticsApiResponse<any[]>> {
    return this.request(`/sessions/${fingerprint}?page=${page}&limit=${limit}`);
  }

  /**
   * Get user events for a specific fingerprint
   */
  async getUserEvents(
    fingerprint: string,
    sessionId?: string,
    page: number = 1,
    limit: number = 50
  ): Promise<AnalyticsApiResponse<any[]>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (sessionId) {
      params.append('session_id', sessionId);
    }

    return this.request(`/events/${fingerprint}?${params.toString()}`);
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(): Promise<AnalyticsApiResponse<any>> {
    return this.request('/performance');
  }

  /**
   * Get customer journey for a specific fingerprint
   */
  async getCustomerJourney(fingerprint: string): Promise<AnalyticsApiResponse<any>> {
    return this.request(`/journey/${fingerprint}`);
  }

  /**
   * Transform real-time metrics to AnalyticsMetric format
   */
  private transformRealTimeMetrics(metrics: RealTimeMetrics): AnalyticsMetric[] {
    return [
      {
        id: 'revenue_total',
        title: 'Total Revenue',
        value: `£${metrics.totalRevenue.toLocaleString()}`,
        change: 0, // Will be calculated by backend
        changeType: 'neutral',
        description: 'Total revenue from all sources',
        category: 'revenue',
        period: 'daily',
        lastUpdated: metrics.timestamp,
      },
      {
        id: 'bookings_total',
        title: 'Total Bookings',
        value: metrics.totalBookings,
        change: 0,
        changeType: 'neutral',
        description: 'Total number of repair bookings',
        category: 'operations',
        period: 'daily',
        lastUpdated: metrics.timestamp,
      },
      {
        id: 'repairs_active',
        title: 'Active Repairs',
        value: metrics.activeRepairs,
        change: 0,
        changeType: 'neutral',
        description: 'Currently active repair jobs',
        category: 'operations',
        period: 'daily',
        lastUpdated: metrics.timestamp,
      },
      {
        id: 'repair_time_avg',
        title: 'Avg Repair Time',
        value: `${metrics.avgRepairTime.toFixed(1)} hours`,
        change: 0,
        changeType: 'neutral',
        description: 'Average time to complete repairs',
        category: 'operations',
        period: 'weekly',
        lastUpdated: metrics.timestamp,
      },
      {
        id: 'satisfaction_score',
        title: 'Customer Satisfaction',
        value: `${(metrics.customerSatisfaction * 100).toFixed(1)}%`,
        change: 0,
        changeType: 'positive',
        description: 'Overall customer satisfaction score',
        category: 'quality',
        period: 'monthly',
        lastUpdated: metrics.timestamp,
      },
      {
        id: 'conversion_rate',
        title: 'Conversion Rate',
        value: `${(metrics.conversionRate * 100).toFixed(1)}%`,
        change: 0,
        changeType: 'neutral',
        description: 'Visitor to customer conversion rate',
        category: 'customer',
        period: 'monthly',
        lastUpdated: metrics.timestamp,
      },
    ];
  }

  /**
   * Get comprehensive analytics metrics
   */
  async getComprehensiveMetrics(): Promise<AnalyticsApiResponse<AnalyticsMetric[]>> {
    try {
      const realTimeResponse = await this.getRealTimeMetrics();
      
      if (!realTimeResponse.success || !realTimeResponse.data) {
        return {
          success: false,
          error: 'Failed to fetch real-time metrics',
          timestamp: new Date().toISOString(),
        };
      }

      const transformedMetrics = this.transformRealTimeMetrics(realTimeResponse.data);
      
      return {
        success: true,
        data: transformedMetrics,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error fetching comprehensive metrics:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Check API health and authentication
   */
  async checkHealth(): Promise<AnalyticsApiResponse<{ status: string }>> {
    try {
      const response = await fetch(`${this.baseUrl.replace('/api/analytics', '')}/health`);
      const data = await response.json();
      
      return {
        success: response.ok,
        data: { status: data.status },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Health check failed',
        timestamp: new Date().toISOString(),
      };
    }
  }
}

// Export singleton instance
export const analyticsApiService = new AnalyticsApiService();

// Development mode - set demo auth token
if (process.env.NODE_ENV === 'development') {
  analyticsApiService.setAuthToken('admin-api-key');
}

export default analyticsApiService;