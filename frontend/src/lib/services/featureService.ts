import { features } from '../../config/app/features.config';
import { FeatureFlag } from '@/types/config';

export class FeatureService {
  private static instance: FeatureService;
  
  private constructor() {}
  
  public static getInstance(): FeatureService {
    if (!FeatureService.instance) {
      FeatureService.instance = new FeatureService();
    }
    return FeatureService.instance;
  }
  
  /**
   * Check if a feature is enabled
   */
  public isEnabled(featureKey: string, userId?: string): boolean {
    const feature = features[featureKey];
    if (!feature || !feature.enabled) {
      return false;
    }
    
    // Handle rollout strategies
    if (feature.rollout) {
      switch (feature.rollout.strategy) {
        case 'percentage':
          if (feature.rollout.percentage && feature.rollout.percentage < 100) {
            // Use deterministic hash for consistent user experience
            const hash = this.hashUserId(userId || 'anonymous');
            return hash < feature.rollout.percentage;
          }
          break;
          
        case 'users':
          if (feature.rollout.users && userId) {
            return feature.rollout.users.includes(userId);
          }
          return false;
      }
    }
    
    return true;
  }
  
  /**
   * Get feature configuration
   */
  public getConfig(featureKey: string): any {
    const feature = features[featureKey];
    return feature?.config || {};
  }
  
  /**
   * Get all enabled features
   */
  public getEnabledFeatures(userId?: string): Record<string, FeatureFlag> {
    const enabledFeatures: Record<string, FeatureFlag> = {};
    
    Object.entries(features).forEach(([key, feature]) => {
      if (this.isEnabled(key, userId)) {
        enabledFeatures[key] = feature;
      }
    });
    
    return enabledFeatures;
  }
  
  /**
   * Hash user ID for percentage-based rollouts
   */
  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) % 100;
  }
}

// React hook for using features
import { useCallback, useEffect, useState } from 'react';

export const useFeature = (featureKey: string, userId?: string) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [config, setConfig] = useState({});
  
  const featureService = FeatureService.getInstance();
  
  useEffect(() => {
    setIsEnabled(featureService.isEnabled(featureKey, userId));
    setConfig(featureService.getConfig(featureKey));
  }, [featureKey, userId]);
  
  return { isEnabled, config };
};

export const useFeatures = (userId?: string) => {
  const [enabledFeatures, setEnabledFeatures] = useState<Record<string, FeatureFlag>>({});
  
  const featureService = FeatureService.getInstance();
  
  useEffect(() => {
    setEnabledFeatures(featureService.getEnabledFeatures(userId));
  }, [userId]);
  
  return enabledFeatures;
};

// Export singleton instance
export const featureService = FeatureService.getInstance();