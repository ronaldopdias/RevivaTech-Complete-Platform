/**
 * Fingerprint Analytics Integration
 * 
 * Connects browser fingerprinting with analytics system
 * Session 3 - RevivaTech Analytics Implementation
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useDeviceFingerprint } from '@/hooks/useDeviceFingerprint';

export interface FingerprintAnalyticsProps {
  enableTracking?: boolean;
  enableAnalytics?: boolean;
  onDeviceIdentified?: (deviceId: string, fingerprint: any) => void;
  onFingerprintError?: (error: string) => void;
  autoStart?: boolean;
  respectPrivacy?: boolean;
}

/**
 * Analytics integration for device fingerprinting
 */
export const FingerprintAnalytics = ({
  enableTracking = true,
  enableAnalytics = true,
  onDeviceIdentified,
  onFingerprintError,
  autoStart = true,
  respectPrivacy = true
}: FingerprintAnalyticsProps) => {
  const {
    fingerprint,
    deviceId,
    sessionId,
    fallbackId,
    hasConsent,
    isInitialized,
    accuracy,
    error,
    available,
    usingFallback
  } = useDeviceFingerprint({
    autoGenerate: autoStart,
    respectConsent: respectPrivacy,
    onFingerprintGenerated: (fp) => {
      if (enableTracking && fp.id) {
        onDeviceIdentified?.(fp.id, fp);
        trackDeviceIdentification(fp);
      }
    },
    onError: (err) => {
      onFingerprintError?.(err);
      trackFingerprintError(err);
    }
  });

  const lastTrackedId = useRef<string | null>(null);

  /**
   * Track device identification event
   */
  const trackDeviceIdentification = useCallback((fingerprint: any) => {
    if (!enableAnalytics) return;

    const event = {
      type: 'device_identified',
      timestamp: Date.now(),
      deviceId: fingerprint.id,
      sessionId,
      fallbackId,
      data: {
        confidence: fingerprint.confidence,
        accuracy: Math.round(fingerprint.confidence * 100),
        method: fingerprint.confidence > 0.7 ? 'fingerprint' : 'fallback',
        components: {
          screen: fingerprint.components.screen,
          timezone: fingerprint.components.timezone,
          language: fingerprint.components.language,
          platform: fingerprint.components.platform
        },
        fallbackMethods: fingerprint.fallbackMethods
      }
    };

    // Send to analytics service
    sendAnalyticsEvent(event);
  }, [enableAnalytics, sessionId, fallbackId]);

  /**
   * Track fingerprint error
   */
  const trackFingerprintError = useCallback((error: string) => {
    if (!enableAnalytics) return;

    const event = {
      type: 'fingerprint_error',
      timestamp: Date.now(),
      deviceId: fallbackId,
      sessionId,
      data: {
        error,
        hasConsent,
        method: 'fallback'
      }
    };

    sendAnalyticsEvent(event);
  }, [enableAnalytics, fallbackId, sessionId, hasConsent]);

  /**
   * Send analytics event
   */
  const sendAnalyticsEvent = useCallback((event: any) => {
    try {
      // Send to analytics WebSocket service
      if (typeof window !== 'undefined' && (window as any).analyticsWS) {
        (window as any).analyticsWS.send(JSON.stringify(event));
      }

      // Also store in localStorage for offline support
      const stored = localStorage.getItem('revivatech-analytics-events') || '[]';
      const events = JSON.parse(stored);
      events.push(event);
      
      // Keep only last 100 events
      if (events.length > 100) {
        events.splice(0, events.length - 100);
      }
      
      localStorage.setItem('revivatech-analytics-events', JSON.stringify(events));
    } catch (error) {
      console.warn('Failed to send analytics event:', error);
    }
  }, []);

  /**
   * Track session events
   */
  useEffect(() => {
    if (!isInitialized || !available) return;

    const currentDeviceId = deviceId || fallbackId;
    if (!currentDeviceId || currentDeviceId === lastTrackedId.current) return;

    // Track session start
    const sessionEvent = {
      type: 'session_start',
      timestamp: Date.now(),
      deviceId: currentDeviceId,
      sessionId,
      data: {
        accuracy,
        method: usingFallback ? 'fallback' : 'fingerprint',
        hasConsent,
        components: fingerprint?.components || {}
      }
    };

    sendAnalyticsEvent(sessionEvent);
    lastTrackedId.current = currentDeviceId;
  }, [
    isInitialized,
    available,
    deviceId,
    fallbackId,
    sessionId,
    accuracy,
    usingFallback,
    hasConsent,
    fingerprint,
    sendAnalyticsEvent
  ]);

  /**
   * Track page views with device context
   */
  useEffect(() => {
    if (!available || !enableTracking) return;

    const handlePageView = () => {
      const event = {
        type: 'page_view',
        timestamp: Date.now(),
        deviceId: deviceId || fallbackId,
        sessionId,
        data: {
          url: window.location.href,
          referrer: document.referrer,
          userAgent: navigator.userAgent,
          accuracy,
          method: usingFallback ? 'fallback' : 'fingerprint'
        }
      };

      sendAnalyticsEvent(event);
    };

    // Track initial page view
    handlePageView();

    // Track navigation changes
    const handleNavigation = () => {
      setTimeout(handlePageView, 100);
    };

    window.addEventListener('popstate', handleNavigation);
    
    // Override pushState and replaceState to track navigation
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function(...args) {
      originalPushState.apply(window.history, args);
      handleNavigation();
    };

    window.history.replaceState = function(...args) {
      originalReplaceState.apply(window.history, args);
      handleNavigation();
    };

    return () => {
      window.removeEventListener('popstate', handleNavigation);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, [available, enableTracking, deviceId, fallbackId, sessionId, accuracy, usingFallback, sendAnalyticsEvent]);

  /**
   * Track errors
   */
  useEffect(() => {
    if (!error || !enableAnalytics) return;

    const errorEvent = {
      type: 'fingerprint_error',
      timestamp: Date.now(),
      deviceId: fallbackId,
      sessionId,
      data: {
        error,
        hasConsent,
        accuracy,
        method: 'fallback'
      }
    };

    sendAnalyticsEvent(errorEvent);
  }, [error, enableAnalytics, fallbackId, sessionId, hasConsent, accuracy, sendAnalyticsEvent]);

  /**
   * Track consent changes
   */
  useEffect(() => {
    if (!enableAnalytics) return;

    const consentEvent = {
      type: 'consent_changed',
      timestamp: Date.now(),
      deviceId: deviceId || fallbackId,
      sessionId,
      data: {
        hasConsent,
        accuracy,
        method: usingFallback ? 'fallback' : 'fingerprint'
      }
    };

    sendAnalyticsEvent(consentEvent);
  }, [hasConsent, enableAnalytics, deviceId, fallbackId, sessionId, accuracy, usingFallback, sendAnalyticsEvent]);

  // This component doesn't render anything - it's just for side effects
  return null;
};

export default FingerprintAnalytics;