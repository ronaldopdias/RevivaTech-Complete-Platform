// Business Intelligence Dashboard Configuration
'use client';

// Dashboard widget types
export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'funnel' | 'heatmap' | 'text';
  title: string;
  description?: string;
  size: 'small' | 'medium' | 'large' | 'xlarge';
  refreshInterval?: number; // milliseconds
  filters?: DashboardFilter[];
  dataSource: string;
  config: WidgetConfig;
}

export interface WidgetConfig {
  // Metric widget config
  metric?: {
    value: string;
    comparison?: string;
    format?: 'number' | 'currency' | 'percentage' | 'duration';
    trend?: 'up' | 'down' | 'neutral';
    target?: number;
  };
  
  // Chart widget config
  chart?: {
    type: 'line' | 'bar' | 'pie' | 'area' | 'gauge';
    xAxis: string;
    yAxis: string[];
    timeRange: string;
    aggregation?: 'sum' | 'avg' | 'count' | 'max' | 'min';
  };
  
  // Table widget config
  table?: {
    columns: string[];
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    pageSize?: number;
  };
  
  // Funnel widget config
  funnel?: {
    steps: string[];
    conversionMetric: string;
    timeRange: string;
  };
}

export interface DashboardFilter {
  id: string;
  label: string;
  type: 'select' | 'dateRange' | 'multiSelect' | 'toggle';
  options?: { label: string; value: string }[];
  defaultValue?: any;
}

// Predefined dashboard templates
export const DASHBOARD_TEMPLATES = {
  overview: {
    name: 'Business Overview',
    description: 'Key metrics and performance indicators',
    widgets: [
      {
        id: 'total-bookings',
        type: 'metric' as const,
        title: 'Total Bookings',
        description: 'All confirmed bookings',
        size: 'small' as const,
        refreshInterval: 30000,
        dataSource: 'internal',
        config: {
          metric: {
            value: 'bookings_count',
            comparison: 'vs_last_month',
            format: 'number' as const,
            trend: 'up' as const,
            target: 100
          }
        }
      },
      {
        id: 'conversion-rate',
        type: 'metric' as const,
        title: 'Conversion Rate',
        description: 'Visitors to bookings conversion',
        size: 'small' as const,
        refreshInterval: 30000,
        dataSource: 'analytics',
        config: {
          metric: {
            value: 'conversion_rate',
            comparison: 'vs_last_month',
            format: 'percentage' as const,
            trend: 'up' as const,
            target: 15
          }
        }
      },
      {
        id: 'revenue',
        type: 'metric' as const,
        title: 'Revenue',
        description: 'Total revenue from bookings',
        size: 'small' as const,
        refreshInterval: 30000,
        dataSource: 'internal',
        config: {
          metric: {
            value: 'total_revenue',
            comparison: 'vs_last_month',
            format: 'currency' as const,
            trend: 'up' as const,
            target: 50000
          }
        }
      },
      {
        id: 'avg-order-value',
        type: 'metric' as const,
        title: 'Average Order Value',
        description: 'Average value per booking',
        size: 'small' as const,
        refreshInterval: 30000,
        dataSource: 'internal',
        config: {
          metric: {
            value: 'avg_order_value',
            comparison: 'vs_last_month',
            format: 'currency' as const,
            trend: 'up' as const,
            target: 150
          }
        }
      },
      {
        id: 'bookings-over-time',
        type: 'chart' as const,
        title: 'Bookings Over Time',
        description: 'Daily booking trends',
        size: 'large' as const,
        refreshInterval: 60000,
        dataSource: 'internal',
        config: {
          chart: {
            type: 'line' as const,
            xAxis: 'date',
            yAxis: ['bookings_count', 'revenue'],
            timeRange: '30d',
            aggregation: 'sum' as const
          }
        }
      },
      {
        id: 'conversion-funnel',
        type: 'funnel' as const,
        title: 'Booking Conversion Funnel',
        description: 'Step-by-step conversion analysis',
        size: 'large' as const,
        refreshInterval: 60000,
        dataSource: 'analytics',
        config: {
          funnel: {
            steps: ['page_view', 'device_selection', 'issue_description', 'pricing_review', 'contact_details', 'booking_completed'],
            conversionMetric: 'conversion_rate',
            timeRange: '7d'
          }
        }
      }
    ],
    filters: [
      {
        id: 'date-range',
        label: 'Date Range',
        type: 'dateRange' as const,
        defaultValue: '30d'
      },
      {
        id: 'device-type',
        label: 'Device Type',
        type: 'select' as const,
        options: [
          { label: 'All Devices', value: 'all' },
          { label: 'iPhone', value: 'iphone' },
          { label: 'iPad', value: 'ipad' },
          { label: 'MacBook', value: 'macbook' },
          { label: 'PC/Laptop', value: 'pc' }
        ],
        defaultValue: 'all'
      },
      {
        id: 'service-type',
        label: 'Service Type',
        type: 'multiSelect' as const,
        options: [
          { label: 'Screen Repair', value: 'screen' },
          { label: 'Battery Replacement', value: 'battery' },
          { label: 'Data Recovery', value: 'data' },
          { label: 'Virus Removal', value: 'virus' },
          { label: 'Hardware Upgrade', value: 'upgrade' }
        ],
        defaultValue: []
      }
    ]
  },
  
  marketing: {
    name: 'Marketing Performance',
    description: 'Marketing channels and campaign effectiveness',
    widgets: [
      {
        id: 'traffic-sources',
        type: 'chart' as const,
        title: 'Traffic Sources',
        description: 'Visitors by traffic source',
        size: 'medium' as const,
        refreshInterval: 60000,
        dataSource: 'analytics',
        config: {
          chart: {
            type: 'pie' as const,
            xAxis: 'traffic_source',
            yAxis: ['visitors_count'],
            timeRange: '30d',
            aggregation: 'sum' as const
          }
        }
      },
      {
        id: 'conversion-by-source',
        type: 'table' as const,
        title: 'Conversion by Source',
        description: 'Conversion rates by traffic source',
        size: 'large' as const,
        refreshInterval: 60000,
        dataSource: 'analytics',
        config: {
          table: {
            columns: ['traffic_source', 'visitors', 'conversions', 'conversion_rate', 'revenue'],
            sortBy: 'conversion_rate',
            sortOrder: 'desc' as const,
            pageSize: 10
          }
        }
      },
      {
        id: 'campaign-performance',
        type: 'chart' as const,
        title: 'Campaign Performance',
        description: 'ROI by marketing campaign',
        size: 'large' as const,
        refreshInterval: 60000,
        dataSource: 'analytics',
        config: {
          chart: {
            type: 'bar' as const,
            xAxis: 'campaign_name',
            yAxis: ['roi', 'conversions'],
            timeRange: '30d',
            aggregation: 'avg' as const
          }
        }
      }
    ],
    filters: [
      {
        id: 'date-range',
        label: 'Date Range',
        type: 'dateRange' as const,
        defaultValue: '30d'
      },
      {
        id: 'campaign-type',
        label: 'Campaign Type',
        type: 'select' as const,
        options: [
          { label: 'All Campaigns', value: 'all' },
          { label: 'Google Ads', value: 'google_ads' },
          { label: 'Facebook Ads', value: 'facebook_ads' },
          { label: 'Email Marketing', value: 'email' },
          { label: 'SEO', value: 'seo' }
        ],
        defaultValue: 'all'
      }
    ]
  },
  
  operations: {
    name: 'Operations Dashboard',
    description: 'Service delivery and operational metrics',
    widgets: [
      {
        id: 'service-performance',
        type: 'table' as const,
        title: 'Service Performance',
        description: 'Performance by service type',
        size: 'large' as const,
        refreshInterval: 60000,
        dataSource: 'internal',
        config: {
          table: {
            columns: ['service_type', 'total_bookings', 'avg_completion_time', 'customer_rating', 'revenue'],
            sortBy: 'total_bookings',
            sortOrder: 'desc' as const,
            pageSize: 10
          }
        }
      },
      {
        id: 'completion-times',
        type: 'chart' as const,
        title: 'Average Completion Times',
        description: 'Service completion time trends',
        size: 'medium' as const,
        refreshInterval: 60000,
        dataSource: 'internal',
        config: {
          chart: {
            type: 'bar' as const,
            xAxis: 'service_type',
            yAxis: ['avg_completion_time'],
            timeRange: '30d',
            aggregation: 'avg' as const
          }
        }
      },
      {
        id: 'customer-satisfaction',
        type: 'metric' as const,
        title: 'Customer Satisfaction',
        description: 'Average customer rating',
        size: 'small' as const,
        refreshInterval: 30000,
        dataSource: 'internal',
        config: {
          metric: {
            value: 'avg_customer_rating',
            comparison: 'vs_last_month',
            format: 'number' as const,
            trend: 'up' as const,
            target: 4.5
          }
        }
      },
      {
        id: 'booking-status-distribution',
        type: 'chart' as const,
        title: 'Booking Status Distribution',
        description: 'Current status of all bookings',
        size: 'medium' as const,
        refreshInterval: 30000,
        dataSource: 'internal',
        config: {
          chart: {
            type: 'pie' as const,
            xAxis: 'booking_status',
            yAxis: ['booking_count'],
            timeRange: '7d',
            aggregation: 'count' as const
          }
        }
      }
    ],
    filters: [
      {
        id: 'date-range',
        label: 'Date Range',
        type: 'dateRange' as const,
        defaultValue: '30d'
      },
      {
        id: 'technician',
        label: 'Technician',
        type: 'select' as const,
        options: [
          { label: 'All Technicians', value: 'all' },
          { label: 'John Smith', value: 'tech_001' },
          { label: 'Sarah Johnson', value: 'tech_002' },
          { label: 'Mike Wilson', value: 'tech_003' }
        ],
        defaultValue: 'all'
      }
    ]
  },
  
  financial: {
    name: 'Financial Analytics',
    description: 'Revenue, profitability, and financial metrics',
    widgets: [
      {
        id: 'revenue-trend',
        type: 'chart' as const,
        title: 'Revenue Trend',
        description: 'Monthly revenue progression',
        size: 'large' as const,
        refreshInterval: 60000,
        dataSource: 'internal',
        config: {
          chart: {
            type: 'line' as const,
            xAxis: 'month',
            yAxis: ['revenue', 'profit'],
            timeRange: '12m',
            aggregation: 'sum' as const
          }
        }
      },
      {
        id: 'profit-margins',
        type: 'chart' as const,
        title: 'Profit Margins by Service',
        description: 'Profitability analysis',
        size: 'medium' as const,
        refreshInterval: 60000,
        dataSource: 'internal',
        config: {
          chart: {
            type: 'bar' as const,
            xAxis: 'service_type',
            yAxis: ['profit_margin'],
            timeRange: '30d',
            aggregation: 'avg' as const
          }
        }
      },
      {
        id: 'monthly-targets',
        type: 'metric' as const,
        title: 'Monthly Target Progress',
        description: 'Progress towards monthly revenue target',
        size: 'medium' as const,
        refreshInterval: 30000,
        dataSource: 'internal',
        config: {
          metric: {
            value: 'monthly_progress',
            comparison: 'vs_target',
            format: 'percentage' as const,
            trend: 'up' as const,
            target: 100
          }
        }
      }
    ],
    filters: [
      {
        id: 'date-range',
        label: 'Date Range',
        type: 'dateRange' as const,
        defaultValue: '30d'
      },
      {
        id: 'revenue-type',
        label: 'Revenue Type',
        type: 'select' as const,
        options: [
          { label: 'All Revenue', value: 'all' },
          { label: 'Service Revenue', value: 'service' },
          { label: 'Parts Revenue', value: 'parts' },
          { label: 'Labor Revenue', value: 'labor' }
        ],
        defaultValue: 'all'
      }
    ]
  }
};

// Dashboard data sources configuration
export const DATA_SOURCES = {
  internal: {
    name: 'Internal API',
    type: 'rest',
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3011',
    endpoints: {
      bookings_count: '/api/analytics/metrics/bookings/count',
      total_revenue: '/api/analytics/metrics/revenue/total',
      avg_order_value: '/api/analytics/metrics/revenue/aov',
      conversion_rate: '/api/analytics/metrics/conversion/rate',
      bookings_over_time: '/api/analytics/charts/bookings/timeline',
      service_performance: '/api/analytics/tables/services/performance',
      avg_customer_rating: '/api/analytics/metrics/customer/satisfaction'
    },
    authentication: {
      type: 'bearer',
      tokenKey: 'auth_token'
    }
  },
  
  analytics: {
    name: 'Analytics Service',
    type: 'analytics',
    providers: {
      google: {
        enabled: !!process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID,
        measurementId: process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID,
        metrics: ['page_views', 'conversions', 'traffic_sources', 'user_engagement']
      },
      posthog: {
        enabled: !!process.env.NEXT_PUBLIC_POSTHOG_KEY,
        apiKey: process.env.NEXT_PUBLIC_POSTHOG_KEY,
        host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
        metrics: ['events', 'funnels', 'user_paths', 'cohorts']
      },
      facebook: {
        enabled: !!process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID,
        pixelId: process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID,
        metrics: ['conversions', 'campaigns', 'audiences']
      }
    }
  }
};

// Dashboard theme configuration
export const DASHBOARD_THEME = {
  colors: {
    primary: '#ADD8E6',     // Trust Blue
    secondary: '#008080',    // Professional Teal
    accent: '#36454F',       // Neutral Grey
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    background: '#F9FAFB',
    surface: '#FFFFFF',
    border: '#E5E7EB'
  },
  
  fonts: {
    heading: 'SF Pro Display, Inter, sans-serif',
    body: 'SF Pro Text, Inter, sans-serif',
    mono: 'SF Mono, Consolas, monospace'
  },
  
  spacing: {
    xs: '0.5rem',
    sm: '1rem',
    md: '1.5rem',
    lg: '2rem',
    xl: '3rem'
  },
  
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  }
};

// Dashboard permissions and access control
export const DASHBOARD_PERMISSIONS = {
  roles: {
    admin: {
      label: 'Administrator',
      dashboards: ['overview', 'marketing', 'operations', 'financial'],
      widgets: ['all'],
      actions: ['view', 'edit', 'create', 'delete', 'export']
    },
    manager: {
      label: 'Manager',
      dashboards: ['overview', 'operations', 'financial'],
      widgets: ['all'],
      actions: ['view', 'edit', 'export']
    },
    technician: {
      label: 'Technician',
      dashboards: ['operations'],
      widgets: ['service-performance', 'booking-status-distribution', 'customer-satisfaction'],
      actions: ['view']
    },
    marketing: {
      label: 'Marketing',
      dashboards: ['overview', 'marketing'],
      widgets: ['all'],
      actions: ['view', 'edit', 'export']
    }
  }
};

// Export default configuration
export const DEFAULT_DASHBOARD_CONFIG = {
  templates: DASHBOARD_TEMPLATES,
  dataSources: DATA_SOURCES,
  theme: DASHBOARD_THEME,
  permissions: DASHBOARD_PERMISSIONS,
  refreshIntervals: {
    realtime: 5000,
    fast: 30000,
    normal: 60000,
    slow: 300000
  },
  cache: {
    enabled: true,
    defaultTtl: 300000, // 5 minutes
    maxSize: 100 // Max cached responses
  }
};