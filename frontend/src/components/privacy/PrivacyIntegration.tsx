'use client';

import React, { useEffect } from 'react';
import { ConsentProvider, useConsent } from './ConsentManager';

// Google Analytics integration with consent
const GoogleAnalyticsIntegration: React.FC = () => {
  const { canUseAnalytics, consent } = useConsent();

  useEffect(() => {
    if (typeof window !== 'undefined' && canUseAnalytics) {
      // Initialize Google Analytics
      const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
      
      if (GA_MEASUREMENT_ID) {
        // Load Google Analytics script
        const script = document.createElement('script');
        script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
        script.async = true;
        document.head.appendChild(script);

        // Initialize gtag
        window.dataLayer = window.dataLayer || [];
        function gtag(...args: any[]) {
          window.dataLayer.push(args);
        }
        
        gtag('js', new Date());
        gtag('config', GA_MEASUREMENT_ID, {
          anonymize_ip: true,
          allow_google_signals: consent?.preferences.marketing || false,
          allow_ad_personalization_signals: consent?.preferences.marketing || false
        });

        // Set consent state
        gtag('consent', 'update', {
          'analytics_storage': 'granted',
          'ad_storage': consent?.preferences.marketing ? 'granted' : 'denied',
          'ad_user_data': consent?.preferences.marketing ? 'granted' : 'denied',
          'ad_personalization': consent?.preferences.marketing ? 'granted' : 'denied'
        });
      }
    }
  }, [canUseAnalytics, consent]);

  return null;
};

// Marketing pixels integration with consent
const MarketingPixelsIntegration: React.FC = () => {
  const { canUseMarketing, consent } = useConsent();

  useEffect(() => {
    if (typeof window !== 'undefined' && canUseMarketing) {
      // Initialize Facebook Pixel
      const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID;
      
      if (FB_PIXEL_ID) {
        !(function(f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
          if (f.fbq) return;
          n = f.fbq = function() {
            n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
          };
          if (!f._fbq) f._fbq = n;
          n.push = n;
          n.loaded = !0;
          n.version = '2.0';
          n.queue = [];
          t = b.createElement(e);
          t.async = !0;
          t.src = v;
          s = b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t, s);
        })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

        window.fbq('init', FB_PIXEL_ID);
        window.fbq('track', 'PageView');
      }

      // Initialize other marketing pixels (Google Ads, LinkedIn, etc.)
      const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
      if (GOOGLE_ADS_ID) {
        const script = document.createElement('script');
        script.src = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`;
        script.async = true;
        document.head.appendChild(script);

        window.dataLayer = window.dataLayer || [];
        function gtag(...args: any[]) {
          window.dataLayer.push(args);
        }
        
        gtag('js', new Date());
        gtag('config', GOOGLE_ADS_ID);
      }
    }
  }, [canUseMarketing, consent]);

  return null;
};

// Functional cookies integration
const FunctionalIntegration: React.FC = () => {
  const { canUseFunctional } = useConsent();

  useEffect(() => {
    if (typeof window !== 'undefined' && canUseFunctional) {
      // Initialize live chat
      const initializeLiveChat = () => {
        // Example: Intercom or other live chat integration
      };

      // Initialize social media widgets
      const initializeSocialWidgets = () => {
        // Example: Twitter widgets, Facebook widgets
      };

      initializeLiveChat();
      initializeSocialWidgets();
    }
  }, [canUseFunctional]);

  return null;
};

// Personalization integration
const PersonalizationIntegration: React.FC = () => {
  const { canUsePersonalization, consent } = useConsent();

  useEffect(() => {
    if (typeof window !== 'undefined' && canUsePersonalization) {
      // Store user preferences
      const preferences = {
        theme: localStorage.getItem('revivatech-theme') || 'light',
        language: localStorage.getItem('revivatech-language') || 'en',
        lastVisit: new Date().toISOString()
      };

      // Initialize personalization engine
      
      // Track user behavior for personalization
      const trackBehavior = (action: string, data?: any) => {
        if (canUsePersonalization) {
          fetch('/api/personalization/track', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action,
              data,
              timestamp: new Date().toISOString()
            })
          }).catch(console.error);
        }
      };

      // Example: Track page views for personalization
      trackBehavior('page_view', { path: window.location.pathname });

      // Make tracking function available globally
      window.trackPersonalization = trackBehavior;
    }
  }, [canUsePersonalization, consent]);

  return null;
};

// Main privacy integration component
const PrivacyIntegration: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ConsentProvider
      autoShow={true}
      showDelayMs={2000}
      version="1.0"
      onConsentChange={(consent) => {
        // Notify analytics service
        if (consent) {
          fetch('/api/privacy/integrations/google-analytics/consent', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              consent: consent.preferences,
              timestamp: consent.timestamp
            })
          }).catch(console.error);

          // Notify marketing service
          if (consent.preferences.marketing) {
            fetch('/api/privacy/integrations/marketing/consent', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                consent: consent.preferences,
                timestamp: consent.timestamp
              })
            }).catch(console.error);
          }
        }
      }}
      onConsentRequired={() => {
        // Log when consent is required
        console.log('Consent required - showing banner');
      }}
    >
      {children}
      
      {/* Conditional integrations based on consent */}
      <GoogleAnalyticsIntegration />
      <MarketingPixelsIntegration />
      <FunctionalIntegration />
      <PersonalizationIntegration />
    </ConsentProvider>
  );
};

// Hook for components to track events with consent
export const usePrivacyTracking = () => {
  const { canUseAnalytics, canUseMarketing, canUsePersonalization } = useConsent();

  const trackEvent = (eventName: string, properties?: any) => {
    if (canUseAnalytics && typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, properties);
    }
  };

  const trackConversion = (conversionData: any) => {
    if (canUseMarketing && typeof window !== 'undefined') {
      // Track Facebook conversion
      if (window.fbq) {
        window.fbq('track', 'Purchase', conversionData);
      }
      
      // Track Google Ads conversion
      if (window.gtag) {
        window.gtag('event', 'conversion', conversionData);
      }
    }
  };

  const trackPersonalization = (action: string, data?: any) => {
    if (canUsePersonalization && typeof window !== 'undefined' && window.trackPersonalization) {
      window.trackPersonalization(action, data);
    }
  };

  return {
    trackEvent,
    trackConversion,
    trackPersonalization,
    canTrackAnalytics: canUseAnalytics,
    canTrackMarketing: canUseMarketing,
    canTrackPersonalization: canUsePersonalization
  };
};

// Component for GDPR-compliant form tracking
export const ConsentAwareForm: React.FC<{
  children: React.ReactNode;
  onSubmit: (data: any) => void;
  trackingData?: any;
}> = ({ children, onSubmit, trackingData }) => {
  const { trackEvent, trackPersonalization } = usePrivacyTracking();

  const handleSubmit = (data: any) => {
    // Track form submission with consent
    trackEvent('form_submit', {
      form_type: trackingData?.formType || 'unknown',
      ...trackingData
    });

    // Track for personalization
    trackPersonalization('form_submit', {
      formType: trackingData?.formType,
      fields: Object.keys(data)
    });

    onSubmit(data);
  };

  return (
    <div>
      {React.Children.map(children, child => {
        if (React.isValidElement(child) && child.type === 'form') {
          return React.cloneElement(child, {
            onSubmit: (e: any) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const data = Object.fromEntries(formData.entries());
              handleSubmit(data);
            }
          });
        }
        return child;
      })}
    </div>
  );
};

// Type declarations for global objects
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
    fbq: (...args: any[]) => void;
    trackPersonalization: (action: string, data?: any) => void;
  }
}

export default PrivacyIntegration;