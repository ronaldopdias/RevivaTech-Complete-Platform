/**
 * Admin Service
 * Handles all admin-related API calls for the dashboard
 * Connects to real backend APIs for production data
 */

// API URL configuration - Use frontend proxy endpoints for authenticated requests
const getApiBaseUrl = () => {
  // Always use the current frontend origin to use proxy endpoints
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // Server-side fallback
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010';
};

/**
 * Dashboard metrics response type
 */
export interface DashboardMetrics {
  overview: {
    procedures: {
      total_procedures: number;
      published_count: number;
      draft_count: number;
      recent_procedures: number;
      avg_success_rate: number;
      total_views: number;
    };
    media: {
      total_files: number;
      image_count: number;
      video_count: number;
      total_size_mb: number;
      recent_uploads: number;
    };
    performance: {
      phase4_connected: boolean;
      ml_accuracy: number;
      system_health: string;
    };
  };
  recent_activity: Array<{
    activity_type: string;
    description: string;
    timestamp: string;
    action: string;
  }>;
  ml_metrics: any;
  system_performance: any[];
  metadata: {
    period: string;
    generated_at: string;
  };
}

/**
 * Repair statistics response type
 */
export interface RepairStats {
  total_repairs: number;
  pending_repairs: number;
  in_progress_repairs: number;
  ready_for_pickup: number;
  completed_repairs: number;
  avg_completion_hours: number;
  average_price: number;
}

/**
 * Booking statistics response type
 */
export interface BookingStats {
  total_bookings: number;
  active_customers: number;
  new_customers_today: number;
  pending_bookings: number;
  in_progress_bookings: number;
  completed_bookings: number;
  cancelled_bookings: number;
  avg_completion_time: number;
  total_revenue: number;
  avg_order_value: number;
  completion_rate: number;
  low_stock_items: number;
}

/**
 * Revenue analytics response type
 */
export interface RevenueAnalytics {
  overview: {
    total_revenue: number;
    revenue_growth: number;
    total_bookings: number;
    avg_order_value: number;
    paying_customers: number;
  };
  trends: Array<{
    date: string;
    revenue: number;
    bookings: number;
  }>;
}

/**
 * System health response type
 */
export interface SystemHealth {
  overall_health: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    services_online: number;
    avg_success_rate: number;
    phase4_connected: boolean;
  };
  service_status: Array<{
    service_name: string;
    total_requests: number;
    avg_response_time: number;
    p95_response_time: number;
    error_count: number;
    success_rate: number;
  }>;
}

class AdminService {
  /**
   * Get authentication headers for Better Auth (cookie-based)
   */
  private getAuthHeaders(): HeadersInit {
    // Better Auth uses cookies for session management, not JWT tokens
    // No Authorization header needed - cookies will be sent automatically
    return {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Make authenticated request with proper error handling
   */
  private async makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const headers = this.getAuthHeaders();
    
    return fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
      credentials: 'include', // Important for cookie-based auth
    });
  }

  /**
   * Get dashboard metrics
   */
  async getDashboardMetrics(period: string = '7d'): Promise<DashboardMetrics> {
    try {
      // Force development mode detection and use localhost backend
      const isDevelopment = process.env.NODE_ENV === 'development' || 
                           window.location.hostname === 'localhost' ||
                           window.location.hostname === '127.0.0.1';
      
      // Always use direct localhost connection in development
      const baseUrl = isDevelopment ? 'http://localhost:3011' : getApiBaseUrl();
      const endpoint = isDevelopment 
        ? `${baseUrl}/api/dev/admin/analytics/dashboard?period=${period}`
        : `${baseUrl}/api/admin/analytics/dashboard?period=${period}`;
        
      console.log(`🔍 Admin Service: Using endpoint ${endpoint} (dev=${isDevelopment})`);
      const response = await fetch(endpoint, { method: 'GET' });

      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard metrics: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      throw error;
    }
  }

  /**
   * Get repair statistics
   */
  async getRepairStats(): Promise<RepairStats> {
    try {
      const apiUrl = getApiBaseUrl();
      const response = await this.makeAuthenticatedRequest(
        `${apiUrl}/api/admin/repairs/stats/overview`,
        { method: 'GET' }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch repair stats: ${response.status}`);
      }

      const data = await response.json();
      return data.stats;
    } catch (error) {
      console.error('Error fetching repair stats:', error);
      throw error;
    }
  }

  /**
   * Get booking statistics
   */
  async getBookingStats(): Promise<BookingStats> {
    try {
      const apiUrl = getApiBaseUrl();
      const response = await this.makeAuthenticatedRequest(
        `${apiUrl}/api/admin/bookings/stats/overview`,
        { method: 'GET' }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch booking stats: ${response.status}`);
      }

      const data = await response.json();
      return data.stats;
    } catch (error) {
      console.error('Error fetching booking stats:', error);
      throw error;
    }
  }

  /**
   * Get revenue analytics
   */
  async getRevenueAnalytics(timeframe: string = '30d'): Promise<RevenueAnalytics> {
    try {
      const apiUrl = getApiBaseUrl();
      const response = await this.makeAuthenticatedRequest(
        `${apiUrl}/api/revenue/analytics?timeframe=${timeframe}`,
        { method: 'GET' }
      );

      if (!response.ok) {
        // If revenue service is not available, return mock data
        console.warn('Revenue service not available, using fallback data');
        return {
          overview: {
            total_revenue: 0,
            revenue_growth: 0,
            total_bookings: 0,
            avg_order_value: 0,
            paying_customers: 0,
          },
          trends: [],
        };
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching revenue analytics:', error);
      // Return fallback data
      return {
        overview: {
          total_revenue: 0,
          revenue_growth: 0,
          total_bookings: 0,
          avg_order_value: 0,
          paying_customers: 0,
        },
        trends: [],
      };
    }
  }

  /**
   * Get system health status
   */
  async getSystemHealth(period: string = '24h'): Promise<SystemHealth> {
    try {
      const apiUrl = getApiBaseUrl();
      const response = await this.makeAuthenticatedRequest(
        `${apiUrl}/api/admin/analytics/system-health?period=${period}`,
        { method: 'GET' }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch system health: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching system health:', error);
      throw error;
    }
  }

  /**
   * Get list of active repairs
   */
  async getActiveRepairs(limit: number = 10): Promise<any[]> {
    try {
      const apiUrl = getApiBaseUrl();
      const response = await this.makeAuthenticatedRequest(
        `${apiUrl}/api/repairs?status=active&limit=${limit}`,
        { method: 'GET' }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch active repairs: ${response.status}`);
      }

      const data = await response.json();
      return data.repairs || [];
    } catch (error) {
      console.error('Error fetching active repairs:', error);
      return [];
    }
  }

  /**
   * Calculate today's revenue from booking stats
   */
  async getTodayRevenue(): Promise<{ revenue: number; growth: number }> {
    try {
      // For now, use booking stats total revenue divided by 30 for daily estimate
      const bookingStats = await this.getBookingStats();
      const dailyRevenue = bookingStats.total_revenue / 30;
      
      // Calculate growth (mock for now, would need historical data)
      const growth = 12.3; // Will be calculated from actual historical data
      
      return {
        revenue: dailyRevenue,
        growth: growth,
      };
    } catch (error) {
      console.error('Error calculating today revenue:', error);
      return { revenue: 0, growth: 0 };
    }
  }

  /**
   * Calculate customer satisfaction from various metrics
   */
  async getCustomerSatisfaction(): Promise<{ rating: number; total: number }> {
    try {
      // For now, use a calculation based on completion rate and success rate
      const bookingStats = await this.getBookingStats();
      const repairStats = await this.getRepairStats();
      
      // Simple calculation: average of completion rate and a base satisfaction
      const completionRate = bookingStats.completion_rate / 100;
      const baseSatisfaction = 4.5; // Base satisfaction score
      
      // Weighted calculation
      const rating = baseSatisfaction * 0.7 + completionRate * 0.3 * 5;
      
      return {
        rating: Math.min(5, Math.round(rating * 10) / 10),
        total: 5.0,
      };
    } catch (error) {
      console.error('Error calculating customer satisfaction:', error);
      return { rating: 4.5, total: 5.0 };
    }
  }

  /**
   * Format recent activity for display
   */
  formatRecentActivity(activities: any[]): Array<{
    type: string;
    message: string;
    time: string;
    icon: string;
  }> {
    return activities.map(activity => {
      const timeDiff = new Date().getTime() - new Date(activity.timestamp).getTime();
      const minutesAgo = Math.floor(timeDiff / 60000);
      
      let timeString = '';
      if (minutesAgo < 1) {
        timeString = 'just now';
      } else if (minutesAgo < 60) {
        timeString = `${minutesAgo} min ago`;
      } else if (minutesAgo < 1440) {
        timeString = `${Math.floor(minutesAgo / 60)} hours ago`;
      } else {
        timeString = `${Math.floor(minutesAgo / 1440)} days ago`;
      }

      let icon = '📱';
      let type = 'activity';
      let message = activity.description;

      if (activity.activity_type === 'procedure') {
        icon = '🔧';
        type = 'procedure';
        message = `New procedure: ${activity.description}`;
      } else if (activity.activity_type === 'media') {
        icon = '📸';
        type = 'media';
        message = `Media uploaded: ${activity.description}`;
      } else if (activity.action === 'uploaded') {
        icon = '📤';
        type = 'upload';
      }

      return {
        type,
        message,
        time: timeString,
        icon,
      };
    });
  }
}

export const adminService = new AdminService();