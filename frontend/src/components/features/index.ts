/**
 * Features Components Index
 * 
 * Centralized exports for all feature-related components including
 * feature discovery, feature bridges, and universal feature access.
 */

// Feature Discovery System
export { default as FeatureDiscoverySystem } from './FeatureDiscoverySystem';

// Feature Bridge Components
export { QuickActionBar as default, FeatureContextMenu } from './FeatureBridge';

// Type Exports
export type { 
  DiscoverableFeature, 
  TutorialStep, 
  FeatureUsage, 
  FeatureDiscoveryContextProps 
} from './FeatureDiscoverySystem';

export type { 
  FeatureBridgeAction, 
  FeatureBridgeContext, 
  FeatureBridgeProps 
} from './FeatureBridge';

// Component Props Types
export type FeatureDiscoveryProps = {
  currentPage: string;
  userRole: 'customer' | 'admin' | 'staff';
  userPreferences: string[];
  showCompact?: boolean;
  showFloating?: boolean;
  showSidebar?: boolean;
  enableTutorials?: boolean;
  enableAnalytics?: boolean;
  onFeatureClick?: (feature: any) => void;
  onFeatureComplete?: (featureId: string) => void;
  className?: string;
};

export type QuickActionBarProps = {
  context: any;
  position: 'top' | 'bottom' | 'left' | 'right' | 'floating' | 'modal';
  showShortcuts?: boolean;
  showSearch?: boolean;
  showRecent?: boolean;
  showFavorites?: boolean;
  maxActions?: number;
  onActionClick?: (action: any) => void;
  onFeatureNavigate?: (feature: string, fromPage: string, toPage: string) => void;
  className?: string;
};