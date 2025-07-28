// Analytics Service - Centralized tracking for all analytics providers
'use client';

import { v4 as uuidv4 } from 'uuid';

// Analytics configuration
const ANALYTICS_CONFIG = {
  enabled: process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === 'true',
  debug: process.env.NODE_ENV === 'development',
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3011',
  
  // Provider settings
  providers: {
    google: {
      enabled: !!process.env.NEXT_PUBLIC_GA_ID,
      measurementId: process.env.NEXT_PUBLIC_GA_ID || 'G-DEMO12345'
    },
    facebook: {
      enabled: !!process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID,
      pixelId: process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || '1234567890123456'
    },
    posthog: {
      enabled: !!process.env.NEXT_PUBLIC_POSTHOG_KEY,
      apiKey: process.env.NEXT_PUBLIC_POSTHOG_KEY || 'phc_demo1234567890',
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com'
    },
    internal: {
      enabled: true, // Always enabled for our backend
      endpoint: '/api/analytics/events'
    }
  }
};

// Session management
let sessionId: string | null = null;
let userId: string | null = null;

// Initialize session
function initializeSession() {
  if (typeof window === 'undefined') return;
  
  // Get or create session ID
  sessionId = sessionStorage.getItem('revivatech_session_id');
  if (!sessionId) {
    sessionId = uuidv4();
    sessionStorage.setItem('revivatech_session_id', sessionId);
  }
  
  // Get user ID if logged in
  userId = localStorage.getItem('revivatech_user_id') || null;
}

// Initialize on first load
if (typeof window !== 'undefined') {
  initializeSession();
}

// Track event to internal backend
async function trackToBackend(eventName: string, eventData: any) {
  if (!ANALYTICS_CONFIG.providers.internal.enabled) return;
  
  try {
    const response = await fetch(
      `${ANALYTICS_CONFIG.apiUrl}${ANALYTICS_CONFIG.providers.internal.endpoint}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: eventName,
          data: eventData,
          userId: userId,
          sessionId: sessionId,
          page: window.location.pathname,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          referrer: document.referrer || 'direct'
        })
      }
    );
    
    if (ANALYTICS_CONFIG.debug) {
      console.log('🎯 Backend Analytics:', eventName, response.status);
    }
  } catch (error) {
    if (ANALYTICS_CONFIG.debug) {
      console.error('❌ Backend Analytics Error:', error);
    }
  }
}

// Track event to Google Analytics
function trackToGoogle(eventName: string, eventData: any) {
  if (!ANALYTICS_CONFIG.providers.google.enabled || typeof window === 'undefined') return;
  
  // Check if gtag is available
  if (typeof (window as any).gtag !== 'function') {
    if (ANALYTICS_CONFIG.debug) {
      console.warn('⚠️ Google Analytics not loaded');
    }
    return;
  }
  
  try {
    (window as any).gtag('event', eventName, {
      event_category: eventData.service_category || 'general',
      event_label: eventData.device_type || 'unknown',
      value: eventData.estimated_value || 0,
      custom_parameters: {
        page_id: eventData.page_id,
        repair_type: eventData.repair_type,
        session_id: sessionId,
        user_id: userId,
        timestamp: eventData.timestamp
      }
    });
    
    if (ANALYTICS_CONFIG.debug) {
      console.log('📊 Google Analytics:', eventName, eventData);
    }
  } catch (error) {
    if (ANALYTICS_CONFIG.debug) {
      console.error('❌ Google Analytics Error:', error);
    }
  }
}

// Track event to Facebook Pixel
function trackToFacebook(eventName: string, eventData: any) {
  if (!ANALYTICS_CONFIG.providers.facebook.enabled || typeof window === 'undefined') return;
  
  // Check if fbq is available
  if (typeof (window as any).fbq !== 'function') {
    if (ANALYTICS_CONFIG.debug) {
      console.warn('⚠️ Facebook Pixel not loaded');
    }
    return;
  }
  
  try {
    // Map our events to Facebook events
    const fbEventMap: { [key: string]: string } = {
      'service_page_view': 'ViewContent',
      'quote_requested': 'Lead',
      'booking_started': 'InitiateCheckout',
      'booking_completed': 'Purchase',
      'contact_form_submit': 'Lead',
      'phone_click': 'Contact'
    };
    
    const fbEventName = fbEventMap[eventName] || 'CustomEvent';
    const fbEventData = {
      content_category: eventData.service_category || 'repair',
      content_name: eventData.device_type || 'unknown',
      value: eventData.estimated_value || 0,
      currency: 'GBP',
      custom_data: {
        page_id: eventData.page_id,
        repair_type: eventData.repair_type,
        session_id: sessionId
      }
    };
    
    (window as any).fbq('track', fbEventName, fbEventData);
    
    if (ANALYTICS_CONFIG.debug) {
      console.log('📘 Facebook Pixel:', fbEventName, fbEventData);
    }
  } catch (error) {
    if (ANALYTICS_CONFIG.debug) {
      console.error('❌ Facebook Pixel Error:', error);
    }
  }
}

// Track event to PostHog
function trackToPostHog(eventName: string, eventData: any) {
  if (!ANALYTICS_CONFIG.providers.posthog.enabled || typeof window === 'undefined') return;
  
  // Check if posthog is available
  if (typeof (window as any).posthog !== 'object') {
    if (ANALYTICS_CONFIG.debug) {
      console.warn('⚠️ PostHog not loaded');
    }
    return;
  }
  
  try {
    (window as any).posthog.capture(eventName, {
      ...eventData,
      session_id: sessionId,
      user_id: userId,
      timestamp: eventData.timestamp || new Date().toISOString(),
      page_path: window.location.pathname,
      page_title: document.title
    });
    
    if (ANALYTICS_CONFIG.debug) {
      console.log('🦔 PostHog:', eventName, eventData);
    }
  } catch (error) {
    if (ANALYTICS_CONFIG.debug) {
      console.error('❌ PostHog Error:', error);
    }
  }
}

// Main tracking function
export function trackEvent(eventName: string, eventData: any = {}) {
  if (!ANALYTICS_CONFIG.enabled) {
    if (ANALYTICS_CONFIG.debug) {
      console.log('🚫 Analytics disabled');
    }
    return;
  }
  
  // Ensure session is initialized
  if (!sessionId) {
    initializeSession();
  }
  
  // Add common data to all events
  const enrichedEventData = {
    ...eventData,
    timestamp: eventData.timestamp || new Date().toISOString(),
    session_id: sessionId,
    user_id: userId,
    page_path: typeof window !== 'undefined' ? window.location.pathname : null,
    page_title: typeof document !== 'undefined' ? document.title : null,
    viewport: typeof window !== 'undefined' ? {
      width: window.innerWidth,
      height: window.innerHeight
    } : null
  };
  
  if (ANALYTICS_CONFIG.debug) {
    console.log('🎯 Tracking Event:', eventName, enrichedEventData);
  }
  
  // Send to all enabled providers
  Promise.all([
    trackToBackend(eventName, enrichedEventData),
    trackToGoogle(eventName, enrichedEventData),
    trackToFacebook(eventName, enrichedEventData),
    trackToPostHog(eventName, enrichedEventData)
  ]).catch(error => {
    if (ANALYTICS_CONFIG.debug) {
      console.error('❌ Analytics Error:', error);
    }
  });
}

// Convenience functions for common events
export function trackPageView(pageName: string, pageData: any = {}) {
  trackEvent('page_view', {
    page_name: pageName,
    ...pageData
  });
}

export function trackConversion(conversionType: string, conversionData: any = {}) {
  trackEvent('conversion', {
    conversion_type: conversionType,
    ...conversionData
  });
}

export function trackUserInteraction(interactionType: string, interactionData: any = {}) {
  trackEvent('user_interaction', {
    interaction_type: interactionType,
    ...interactionData
  });
}

export function trackBusinessEvent(eventType: string, businessData: any = {}) {
  trackEvent('business_event', {
    event_type: eventType,
    ...businessData
  });
}

// User identification
export function identifyUser(userInfo: { id: string; email?: string; name?: string; [key: string]: any }) {
  userId = userInfo.id;
  localStorage.setItem('revivatech_user_id', userId);
  
  trackEvent('user_identified', {
    user_info: userInfo
  });
  
  // Update external providers
  if (typeof window !== 'undefined') {
    try {
      if ((window as any).posthog) {
        (window as any).posthog.identify(userId, userInfo);
      }
      
      if ((window as any).gtag) {
        (window as any).gtag('config', ANALYTICS_CONFIG.providers.google.measurementId, {
          user_id: userId,
          custom_map: userInfo
        });
      }
      
      if ((window as any).fbq) {
        (window as any).fbq('init', ANALYTICS_CONFIG.providers.facebook.pixelId, {
          external_id: userId,
          ...userInfo
        });
      }
    } catch (error) {
      console.error('Error updating analytics providers:', error);
    }
  }
}

// Analytics utilities
export const analytics = {
  track: trackEvent,
  trackPageView,
  trackConversion,
  trackUserInteraction,
  trackBusinessEvent,
  identify: identifyUser,
  config: ANALYTICS_CONFIG,
  getSessionId: () => sessionId,
  getUserId: () => userId
};