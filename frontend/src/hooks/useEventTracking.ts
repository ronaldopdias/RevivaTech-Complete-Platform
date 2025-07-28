/**
 * Event Tracking Hook
 * RevivaTech Analytics Event Management
 * 
 * Provides easy-to-use methods for tracking key user interactions
 * Automatically includes contextual information and follows naming conventions
 */

'use client';

import { useCallback } from 'react';
import { useThirdPartyAnalytics } from '@/components/analytics/ThirdPartyAnalyticsWrapper';
import { eventNames, customDimensions, conversionConfig } from '@/config/analytics.config';

export const useEventTracking = () => {
  const { trackEvent, trackConversion, isInitialized } = useThirdPartyAnalytics();

  // Track page views with enhanced metadata
  const trackPageView = useCallback((additionalData?: Record<string, any>) => {
    if (!isInitialized) return;

    trackEvent({
      name: eventNames.PAGE_VIEW,
      parameters: {
        page_location: window.location.href,
        page_title: document.title,
        page_referrer: document.referrer,
        timestamp: new Date().toISOString(),
        ...additionalData
      }
    });
  }, [trackEvent, isInitialized]);

  // Track service interactions
  const trackServiceInteraction = useCallback((action: string, serviceType: string, additionalData?: Record<string, any>) => {
    if (!isInitialized) return;

    trackEvent({
      name: eventNames.SERVICE_VIEWED,
      parameters: {
        action,
        service_type: serviceType,
        [customDimensions.REPAIR_CATEGORY]: serviceType,
        timestamp: new Date().toISOString(),
        ...additionalData
      }
    });
  }, [trackEvent, isInitialized]);

  // Track device selection in booking flow
  const trackDeviceSelection = useCallback((deviceBrand: string, deviceModel: string, repairType: string) => {
    if (!isInitialized) return;

    trackEvent({
      name: eventNames.DEVICE_SELECTED,
      parameters: {
        device_brand: deviceBrand,
        device_model: deviceModel,
        repair_type: repairType,
        [customDimensions.DEVICE_PREFERENCE]: deviceBrand.toLowerCase(),
        [customDimensions.REPAIR_CATEGORY]: repairType,
        [customDimensions.BOOKING_STAGE]: 'device_selection',
        timestamp: new Date().toISOString()
      }
    });
  }, [trackEvent, isInitialized]);

  // Track quote requests (important conversion event)
  const trackQuoteRequest = useCallback((deviceType: string, repairType: string, estimatedValue?: number) => {
    if (!isInitialized) return;

    // Track as regular event
    trackEvent({
      name: eventNames.QUOTE_REQUESTED,
      parameters: {
        device_type: deviceType,
        repair_type: repairType,
        estimated_value: estimatedValue,
        [customDimensions.REPAIR_CATEGORY]: repairType,
        [customDimensions.BOOKING_STAGE]: 'pricing',
        timestamp: new Date().toISOString()
      }
    });

    // Track as conversion event
    trackConversion({
      eventName: conversionConfig.events.QUOTE_REQUEST.name,
      value: conversionConfig.events.QUOTE_REQUEST.value,
      currency: conversionConfig.events.QUOTE_REQUEST.currency,
      items: [{
        itemId: `${deviceType}_${repairType}`.toLowerCase(),
        itemName: `${deviceType} ${repairType}`,
        category: 'Repair Services',
        price: estimatedValue || conversionConfig.events.QUOTE_REQUEST.value,
        quantity: 1
      }]
    });
  }, [trackEvent, trackConversion, isInitialized]);

  // Track booking initiation
  const trackBookingInitiated = useCallback((deviceType: string, repairType: string, serviceLevel: string) => {
    if (!isInitialized) return;

    trackEvent({
      name: eventNames.BOOKING_INITIATED,
      parameters: {
        device_type: deviceType,
        repair_type: repairType,
        service_level: serviceLevel,
        [customDimensions.REPAIR_CATEGORY]: repairType,
        [customDimensions.SERVICE_LEVEL]: serviceLevel,
        [customDimensions.BOOKING_STAGE]: 'confirmation',
        timestamp: new Date().toISOString()
      }
    });
  }, [trackEvent, isInitialized]);

  // Track completed booking (major conversion event)
  const trackBookingCompleted = useCallback((
    bookingId: string,
    deviceType: string,
    repairType: string,
    totalValue: number,
    serviceLevel: string
  ) => {
    if (!isInitialized) return;

    // Track as regular event
    trackEvent({
      name: eventNames.BOOKING_COMPLETED,
      parameters: {
        booking_id: bookingId,
        device_type: deviceType,
        repair_type: repairType,
        total_value: totalValue,
        service_level: serviceLevel,
        [customDimensions.REPAIR_CATEGORY]: repairType,
        [customDimensions.SERVICE_LEVEL]: serviceLevel,
        [customDimensions.BOOKING_STAGE]: 'completed',
        timestamp: new Date().toISOString()
      }
    });

    // Track as conversion event
    trackConversion({
      eventName: conversionConfig.events.BOOKING_COMPLETED.name,
      value: totalValue,
      currency: conversionConfig.events.BOOKING_COMPLETED.currency,
      transactionId: bookingId,
      items: [{
        itemId: `${deviceType}_${repairType}`.toLowerCase(),
        itemName: `${deviceType} ${repairType}`,
        category: 'Repair Services',
        price: totalValue,
        quantity: 1
      }]
    });
  }, [trackEvent, trackConversion, isInitialized]);

  // Track contact interactions
  const trackContactInteraction = useCallback((contactMethod: 'phone' | 'email' | 'form', source?: string) => {
    if (!isInitialized) return;

    const eventName = contactMethod === 'phone' ? eventNames.PHONE_CLICKED : 
                     contactMethod === 'email' ? eventNames.EMAIL_CLICKED : 
                     eventNames.CONTACT_SUBMITTED;

    trackEvent({
      name: eventName,
      parameters: {
        contact_method: contactMethod,
        source: source || window.location.pathname,
        [customDimensions.VISIT_INTENT]: 'contact',
        timestamp: new Date().toISOString()
      }
    });

    // Track as conversion if phone or email click
    if (contactMethod === 'phone') {
      trackConversion({
        eventName: conversionConfig.events.PHONE_CONTACT.name,
        value: conversionConfig.events.PHONE_CONTACT.value,
        currency: conversionConfig.events.PHONE_CONTACT.currency
      });
    } else if (contactMethod === 'email') {
      trackConversion({
        eventName: conversionConfig.events.EMAIL_CONTACT.name,
        value: conversionConfig.events.EMAIL_CONTACT.value,
        currency: conversionConfig.events.EMAIL_CONTACT.currency
      });
    }
  }, [trackEvent, trackConversion, isInitialized]);

  // Track form interactions
  const trackFormInteraction = useCallback((formName: string, action: 'start' | 'complete' | 'abandon', field?: string) => {
    if (!isInitialized) return;

    trackEvent({
      name: eventNames.FORM_INTERACTION,
      parameters: {
        form_name: formName,
        form_action: action,
        form_field: field,
        timestamp: new Date().toISOString()
      }
    });
  }, [trackEvent, isInitialized]);

  // Track search interactions
  const trackSearch = useCallback((searchTerm: string, searchType: 'device' | 'service' | 'general', resultsCount?: number) => {
    if (!isInitialized) return;

    trackEvent({
      name: 'search',
      parameters: {
        search_term: searchTerm,
        search_type: searchType,
        results_count: resultsCount,
        timestamp: new Date().toISOString()
      }
    });
  }, [trackEvent, isInitialized]);

  // Track feature usage
  const trackFeatureUsage = useCallback((featureName: string, action: string, context?: Record<string, any>) => {
    if (!isInitialized) return;

    trackEvent({
      name: eventNames.FEATURE_USED,
      parameters: {
        feature_name: featureName,
        feature_action: action,
        timestamp: new Date().toISOString(),
        ...context
      }
    });
  }, [trackEvent, isInitialized]);

  // Track errors for debugging
  const trackError = useCallback((errorType: string, errorMessage: string, errorStack?: string, additionalContext?: Record<string, any>) => {
    if (!isInitialized) return;

    trackEvent({
      name: eventNames.ERROR_OCCURRED,
      parameters: {
        error_type: errorType,
        error_message: errorMessage,
        error_stack: errorStack,
        page_url: window.location.href,
        timestamp: new Date().toISOString(),
        ...additionalContext
      }
    });
  }, [trackEvent, isInitialized]);

  // Track performance issues
  const trackPerformanceIssue = useCallback((issueType: string, metrics: Record<string, number>, context?: Record<string, any>) => {
    if (!isInitialized) return;

    trackEvent({
      name: eventNames.PERFORMANCE_ISSUE,
      parameters: {
        issue_type: issueType,
        ...metrics,
        page_url: window.location.href,
        timestamp: new Date().toISOString(),
        ...context
      }
    });
  }, [trackEvent, isInitialized]);

  // Track user engagement milestones
  const trackEngagementMilestone = useCallback((milestone: string, value: number, context?: Record<string, any>) => {
    if (!isInitialized) return;

    trackEvent({
      name: eventNames.USER_ENGAGEMENT,
      parameters: {
        engagement_milestone: milestone,
        engagement_value: value,
        timestamp: new Date().toISOString(),
        ...context
      }
    });
  }, [trackEvent, isInitialized]);

  // Track campaign interactions
  const trackCampaignInteraction = useCallback((campaignId: string, campaignName: string, action: string) => {
    if (!isInitialized) return;

    trackEvent({
      name: eventNames.CAMPAIGN_CLICK,
      parameters: {
        campaign_id: campaignId,
        campaign_name: campaignName,
        campaign_action: action,
        [customDimensions.CAMPAIGN_SOURCE]: new URLSearchParams(window.location.search).get('utm_source') || 'direct',
        timestamp: new Date().toISOString()
      }
    });
  }, [trackEvent, isInitialized]);

  return {
    // Core tracking methods
    trackPageView,
    trackServiceInteraction,
    trackDeviceSelection,
    trackQuoteRequest,
    trackBookingInitiated,
    trackBookingCompleted,
    trackContactInteraction,
    trackFormInteraction,
    trackSearch,
    trackFeatureUsage,
    
    // Debugging and monitoring
    trackError,
    trackPerformanceIssue,
    trackEngagementMilestone,
    
    // Marketing and campaigns
    trackCampaignInteraction,
    
    // Generic event tracking for custom events
    trackCustomEvent: trackEvent,
    
    // Status
    isTrackingEnabled: isInitialized
  };
};

export default useEventTracking;