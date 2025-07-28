/**
 * Analytics Components Export Index
 * Centralizes all analytics-related components for easy importing
 */

// Phase 4 - Universal Analytics Components
export { default as UniversalAnalyticsProvider } from './UniversalAnalyticsProvider';
export { default as PageAnalyticsWrapper } from './PageAnalyticsWrapper';
export { default as RealTimeAnalyticsDashboard } from './RealTimeAnalyticsDashboard';

// Main Dashboard Components
export { default as BusinessMetricsDashboard } from './BusinessMetricsDashboard';
export { default as EnhancedAnalyticsDashboard } from './EnhancedAnalyticsDashboard';

// Journey Analytics Components (Session 5)
export { default as CustomerJourneyMap } from './CustomerJourneyMap';
export { default as ConversionFunnelAnalysis } from './ConversionFunnelAnalysis';

// Specialized Analytics Components
export { default as FingerprintAnalytics } from './FingerprintAnalytics';

// Analytics Hooks
export { useUniversalAnalytics } from '../../lib/analytics/useUniversalAnalytics';
export { useAnalytics } from './UniversalAnalyticsProvider';
export { usePageAnalytics } from './PageAnalyticsWrapper';

// Analytics Core
export { analytics } from '../../lib/analytics/UniversalAnalyticsManager';
export type { 
  PageAnalyticsConfig, 
  UserInteraction, 
  FeatureUsage, 
  PerformanceMetric 
} from '../../lib/analytics/UniversalAnalyticsManager';

// Re-export types from journey analytics service
export type {
  CustomerJourneyMap as CustomerJourneyMapType,
  JourneyEvent,
  JourneyStage,
  FunnelAnalysis,
  FunnelStage
} from '../../services/journeyAnalytics';

export {
  JOURNEY_STAGES,
  CONVERSION_FUNNEL,
  journeyAnalytics
} from '../../services/journeyAnalytics';