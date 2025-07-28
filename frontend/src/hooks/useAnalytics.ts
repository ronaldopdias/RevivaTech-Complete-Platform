/**
 * useAnalytics Hook
 * Custom hook for managing analytics data with real-time updates
 * Handles data fetching, WebSocket connections, and state management
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { analyticsApiService, AnalyticsMetric, RealTimeMetrics, CustomerInsight, FunnelData } from '@/services/analyticsApiService';
import { analyticsWebSocketService } from '@/services/analyticsWebSocketService';

export interface AnalyticsState {
  metrics: AnalyticsMetric[];
  realTimeMetrics: RealTimeMetrics | null;
  customerInsights: CustomerInsight[];
  funnelData: FunnelData[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
  isWebSocketConnected: boolean;
}

export interface AnalyticsHookOptions {
  enableRealTime?: boolean;
  refreshInterval?: number;
  category?: string;
  period?: string;
}

export const useAnalytics = (options: AnalyticsHookOptions = {}) => {
  const {
    enableRealTime = true,
    refreshInterval = 30000, // 30 seconds
    category = 'all',
    period = 'monthly'
  } = options;

  const [state, setState] = useState<AnalyticsState>({
    metrics: [],
    realTimeMetrics: null,
    customerInsights: [],
    funnelData: [],
    isLoading: true,
    error: null,
    lastUpdated: null,
    isWebSocketConnected: false,
  });

  const refreshIntervalRef = useRef<NodeJS.Timeout>();
  const mountedRef = useRef(true);

  /**
   * Update state safely (only if component is mounted)
   */
  const updateState = useCallback((updates: Partial<AnalyticsState>) => {
    if (mountedRef.current) {
      setState(prev => ({ ...prev, ...updates }));
    }
  }, []);

  /**
   * Fetch comprehensive analytics data
   */
  const fetchAnalyticsData = useCallback(async () => {
    try {
      updateState({ isLoading: true, error: null });

      // Fetch comprehensive metrics
      const metricsResponse = await analyticsApiService.getComprehensiveMetrics();
      
      if (!metricsResponse.success) {
        throw new Error(metricsResponse.error || 'Failed to fetch metrics');
      }

      // Fetch real-time metrics
      const realTimeResponse = await analyticsApiService.getRealTimeMetrics();
      
      // Fetch funnel data
      const funnelResponse = await analyticsApiService.getFunnelData();

      // Fetch customer insights (first page)
      const insightsResponse = await analyticsApiService.getAllCustomerInsights(1, 10);

      updateState({
        metrics: metricsResponse.data || [],
        realTimeMetrics: realTimeResponse.success ? realTimeResponse.data : null,
        funnelData: funnelResponse.success ? funnelResponse.data || [] : [],
        customerInsights: insightsResponse.success ? insightsResponse.data?.insights || [] : [],
        isLoading: false,
        lastUpdated: new Date().toISOString(),
        error: null,
      });

    } catch (error) {
      console.error('Error fetching analytics data:', error);
      updateState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  }, [updateState]);

  /**
   * Handle WebSocket metric updates
   */
  const handleMetricUpdate = useCallback((data: any) => {
    if (!mountedRef.current) return;

    setState(prev => ({
      ...prev,
      metrics: prev.metrics.map(metric =>
        metric.id === data.metricId
          ? {
              ...metric,
              value: data.value,
              change: data.change,
              changeType: data.changeType,
              lastUpdated: new Date().toISOString(),
            }
          : metric
      ),
      lastUpdated: new Date().toISOString(),
    }));
  }, []);

  /**
   * Handle WebSocket connection status
   */
  const handleWebSocketConnection = useCallback(() => {
    updateState({ isWebSocketConnected: true });
  }, [updateState]);

  const handleWebSocketDisconnection = useCallback(() => {
    updateState({ isWebSocketConnected: false });
  }, [updateState]);

  /**
   * Refresh data manually
   */
  const refreshData = useCallback(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  /**
   * Record analytics event
   */
  const recordEvent = useCallback(async (eventData: {
    user_fingerprint: string;
    session_id: string;
    event_type: string;
    page_url?: string;
    metadata?: Record<string, any>;
  }) => {
    try {
      const response = await analyticsApiService.recordEvent(eventData);
      if (!response.success) {
        console.error('Failed to record event:', response.error);
      }
      return response;
    } catch (error) {
      console.error('Error recording event:', error);
      return { success: false, error: 'Failed to record event' };
    }
  }, []);

  /**
   * Get filtered metrics based on category and period
   */
  const getFilteredMetrics = useCallback(() => {
    let filtered = state.metrics;

    if (category !== 'all') {
      filtered = filtered.filter(metric => metric.category === category);
    }

    if (period !== 'all') {
      filtered = filtered.filter(metric => metric.period === period);
    }

    return filtered;
  }, [state.metrics, category, period]);

  /**
   * Get metrics summary
   */
  const getMetricsSummary = useCallback(() => {
    const filtered = getFilteredMetrics();
    const totalMetrics = filtered.length;
    const positiveChanges = filtered.filter(m => m.changeType === 'positive').length;
    const negativeChanges = filtered.filter(m => m.changeType === 'negative').length;
    const neutralChanges = filtered.filter(m => m.changeType === 'neutral').length;

    return {
      total: totalMetrics,
      positive: positiveChanges,
      negative: negativeChanges,
      neutral: neutralChanges,
      positivePercentage: totalMetrics > 0 ? (positiveChanges / totalMetrics) * 100 : 0,
      negativePercentage: totalMetrics > 0 ? (negativeChanges / totalMetrics) * 100 : 0,
    };
  }, [getFilteredMetrics]);

  /**
   * Initialize data fetching and WebSocket connections
   */
  useEffect(() => {
    mountedRef.current = true;

    // Initial data fetch
    fetchAnalyticsData();

    // Set up periodic refresh
    if (refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(fetchAnalyticsData, refreshInterval);
    }

    // Set up WebSocket listeners if real-time is enabled
    if (enableRealTime) {
      analyticsWebSocketService.onMetricUpdate(handleMetricUpdate);
      
      // Monitor WebSocket connection status
      const checkConnection = () => {
        const isConnected = analyticsWebSocketService.isConnectedToSocket();
        updateState({ isWebSocketConnected: isConnected });
      };

      const connectionCheckInterval = setInterval(checkConnection, 5000);
      checkConnection(); // Initial check

      return () => {
        clearInterval(connectionCheckInterval);
        analyticsWebSocketService.removeEventListener('metric_update', handleMetricUpdate);
      };
    }

    // Cleanup function
    return () => {
      mountedRef.current = false;
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [fetchAnalyticsData, enableRealTime, refreshInterval, handleMetricUpdate, updateState]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  return {
    // Data
    metrics: getFilteredMetrics(),
    allMetrics: state.metrics,
    realTimeMetrics: state.realTimeMetrics,
    customerInsights: state.customerInsights,
    funnelData: state.funnelData,
    
    // State
    isLoading: state.isLoading,
    error: state.error,
    lastUpdated: state.lastUpdated,
    isWebSocketConnected: state.isWebSocketConnected,
    
    // Methods
    refreshData,
    recordEvent,
    getMetricsSummary: getMetricsSummary(),
    
    // Utils
    isHealthy: !state.error && !state.isLoading && state.metrics.length > 0,
    hasData: state.metrics.length > 0,
  };
};

export default useAnalytics;