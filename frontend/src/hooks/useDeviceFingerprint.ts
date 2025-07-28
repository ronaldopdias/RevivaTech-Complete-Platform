/**
 * useDeviceFingerprint Hook
 * 
 * React hook for privacy-compliant device fingerprinting
 * Integrates with consent management system
 * 
 * Session 3 - RevivaTech Analytics Implementation
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { browserFingerprintingService, DeviceFingerprint } from '../services/BrowserFingerprinting';

export interface FingerprintState {
  fingerprint: DeviceFingerprint | null;
  isLoading: boolean;
  error: string | null;
  accuracy: number;
  lastUpdated: number | null;
  isInitialized: boolean;
}

export interface FingerprintOptions {
  autoGenerate?: boolean;
  enableCaching?: boolean;
  onFingerprintGenerated?: (fingerprint: DeviceFingerprint) => void;
  onError?: (error: string) => void;
  respectConsent?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
}

/**
 * Custom hook for device fingerprinting with privacy compliance
 */
export const useDeviceFingerprint = (options: FingerprintOptions = {}) => {
  const {
    autoGenerate = true,
    enableCaching = true,
    onFingerprintGenerated,
    onError,
    respectConsent = true,
    retryAttempts = 3,
    retryDelay = 1000
  } = options;

  const [state, setState] = useState<FingerprintState>({
    fingerprint: null,
    isLoading: false,
    error: null,
    accuracy: 0,
    lastUpdated: null,
    isInitialized: false
  });

  const retryCountRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Check if consent is available for fingerprinting
   */
  const checkConsent = useCallback((): boolean => {
    if (!respectConsent) return true;

    try {
      const consent = localStorage.getItem('revivatech-privacy-consent');
      if (!consent) return false;

      const consentData = JSON.parse(consent);
      return consentData.analytics && consentData.fingerprinting;
    } catch (e) {
      console.warn('Failed to check consent:', e);
      return false;
    }
  }, [respectConsent]);

  /**
   * Generate device fingerprint with error handling and retries
   */
  const generateFingerprint = useCallback(async (): Promise<DeviceFingerprint | null> => {
    if (!checkConsent()) {
      const errorMsg = 'User consent required for fingerprinting';
      setState(prev => ({ ...prev, error: errorMsg, isLoading: false }));
      onError?.(errorMsg);
      return null;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const fingerprint = await browserFingerprintingService.getDeviceFingerprint();
      
      // Validate fingerprint
      if (!browserFingerprintingService.validateFingerprint(fingerprint)) {
        throw new Error('Invalid fingerprint generated');
      }

      // Update state
      setState(prev => ({
        ...prev,
        fingerprint,
        accuracy: fingerprint.confidence,
        lastUpdated: Date.now(),
        isLoading: false,
        error: null,
        isInitialized: true
      }));

      // Reset retry count on success
      retryCountRef.current = 0;

      // Call callback
      onFingerprintGenerated?.(fingerprint);

      return fingerprint;

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to generate fingerprint';
      
      // Check if we should retry
      if (retryCountRef.current < retryAttempts) {
        retryCountRef.current++;
        
        // Schedule retry with abort check
        timeoutRef.current = setTimeout(async () => {
          if (retryCountRef.current < retryAttempts) {
            await generateFingerprint();
          }
        }, retryDelay * retryCountRef.current);

        setState(prev => ({
          ...prev,
          error: `${errorMsg} (Retry ${retryCountRef.current}/${retryAttempts})`,
          isLoading: true
        }));

        return null;
      }

      // Max retries exceeded
      setState(prev => ({
        ...prev,
        error: errorMsg,
        isLoading: false,
        isInitialized: true
      }));

      onError?.(errorMsg);
      return null;
    }
  }, [checkConsent, onFingerprintGenerated, onError, retryAttempts, retryDelay]);

  /**
   * Refresh fingerprint
   */
  const refreshFingerprint = useCallback(async (): Promise<DeviceFingerprint | null> => {
    // Clear cache and generate new fingerprint
    browserFingerprintingService.clearFingerprint();
    return generateFingerprint();
  }, [generateFingerprint]);

  /**
   * Update consent status
   */
  const updateConsent = useCallback((hasConsent: boolean) => {
    const consentData = {
      analytics: hasConsent,
      fingerprinting: hasConsent,
      timestamp: Date.now()
    };

    browserFingerprintingService.updateConsent(consentData);

    if (hasConsent) {
      // Generate fingerprint if consent granted
      setState(prev => {
        if (!prev.fingerprint) {
          // Only trigger generation if no fingerprint exists
          setTimeout(() => generateFingerprint(), 0);
        }
        return prev;
      });
    } else {
      // Clear fingerprint if consent revoked
      browserFingerprintingService.clearFingerprint();
      setState(prev => ({
        ...prev,
        fingerprint: null,
        accuracy: 0,
        lastUpdated: null,
        error: 'Consent revoked'
      }));
    }
  }, []); // Remove dependencies to prevent circular updates

  /**
   * Get fingerprint statistics
   */
  const getStatistics = useCallback(() => {
    return browserFingerprintingService.getStatistics();
  }, []);

  /**
   * Check if fingerprint is valid and not expired
   */
  const isValid = useCallback((fingerprint: DeviceFingerprint | null): boolean => {
    if (!fingerprint) return false;

    // Check if fingerprint is expired (24 hours)
    const age = Date.now() - fingerprint.timestamp;
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    return age < maxAge && fingerprint.confidence > 0.5;
  }, []);

  /**
   * Get cached fingerprint if available
   */
  const getCachedFingerprint = useCallback((): DeviceFingerprint | null => {
    if (!enableCaching) return null;
    return browserFingerprintingService.getCachedFingerprint();
  }, [enableCaching]);

  /**
   * Initialize fingerprinting
   */
  useEffect(() => {
    if (!autoGenerate || state.isInitialized) return;

    // Check cache first
    const cached = getCachedFingerprint();
    if (cached && isValid(cached)) {
      setState(prev => ({
        ...prev,
        fingerprint: cached,
        accuracy: cached.confidence,
        lastUpdated: cached.timestamp,
        isInitialized: true
      }));
      return;
    }

    // Generate new fingerprint
    generateFingerprint();

    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [autoGenerate]); // Remove function dependencies to prevent infinite loops

  /**
   * Listen for consent changes
   */
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'revivatech-privacy-consent') {
        const hasConsent = checkConsent();
        updateConsent(hasConsent);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []); // Remove function dependencies to prevent infinite loops

  /**
   * Check if device identification is available
   */
  const isAvailable = useCallback((): boolean => {
    return !!(state.fingerprint && state.fingerprint.id);
  }, [state.fingerprint]);

  /**
   * Get device ID
   */
  const getDeviceId = useCallback((): string | null => {
    return state.fingerprint?.id || null;
  }, [state.fingerprint]);

  /**
   * Get fallback ID if available
   */
  const getFallbackId = useCallback((): string | null => {
    return state.fingerprint?.fallbackMethods?.localStorage || null;
  }, [state.fingerprint]);

  /**
   * Get session ID
   */
  const getSessionId = useCallback((): string | null => {
    return state.fingerprint?.fallbackMethods?.sessionId || null;
  }, [state.fingerprint]);

  /**
   * Check if using fallback methods
   */
  const isUsingFallback = useCallback((): boolean => {
    return (state.fingerprint?.confidence || 0) < 0.7;
  }, [state.fingerprint]);

  /**
   * Get accuracy percentage
   */
  const getAccuracy = useCallback((): number => {
    return Math.round((state.accuracy || 0) * 100);
  }, [state.accuracy]);

  return {
    // State
    fingerprint: state.fingerprint,
    isLoading: state.isLoading,
    error: state.error,
    accuracy: getAccuracy(),
    lastUpdated: state.lastUpdated,
    isInitialized: state.isInitialized,

    // Actions
    generateFingerprint,
    refreshFingerprint,
    updateConsent,
    
    // Utilities
    isAvailable,
    isValid: () => isValid(state.fingerprint),
    isUsingFallback,
    getDeviceId,
    getFallbackId,
    getSessionId,
    getStatistics,
    getCachedFingerprint,

    // Computed values
    hasConsent: checkConsent(),
    deviceId: getDeviceId(),
    sessionId: getSessionId(),
    fallbackId: getFallbackId(),
    usingFallback: isUsingFallback(),
    available: isAvailable()
  };
};

export default useDeviceFingerprint;