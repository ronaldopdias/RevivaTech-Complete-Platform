'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { trackEvent } from '@/lib/analytics/analytics-service';

interface ServicePageAnalyticsProps {
  children: React.ReactNode;
  pageId: string;
  pageName: string;
  serviceCategory?: string;
  deviceType?: string;
  repairType?: string;
  estimatedPrice?: number;
  competitorComparison?: {
    ourPrice: number;
    marketPrice: number;
    savings: number;
  };
}

export default function ServicePageAnalytics({
  children,
  pageId,
  pageName,
  serviceCategory = 'repair',
  deviceType = 'unknown',
  repairType = 'general',
  estimatedPrice,
  competitorComparison,
}: ServicePageAnalyticsProps) {
  const pathname = usePathname();
  const startTime = useRef<number>(Date.now());
  const hasTrackedView = useRef<boolean>(false);
  const interactionCount = useRef<number>(0);

  // Track page view on mount
  useEffect(() => {
    if (!hasTrackedView.current) {
      trackServicePageView();
      hasTrackedView.current = true;
    }

    return () => {
      // Track session duration on unmount
      const sessionDuration = Date.now() - startTime.current;
      trackEvent('service_page_session_end', {
        page_id: pageId,
        page_name: pageName,
        session_duration: sessionDuration,
        interaction_count: interactionCount.current,
        service_category: serviceCategory,
        device_type: deviceType,
        repair_type: repairType,
        bounce: interactionCount.current === 0
      });
    };
  }, []);

  const trackServicePageView = () => {
    const pageData = {
      page_id: pageId,
      page_name: pageName,
      page_path: pathname,
      service_category: serviceCategory,
      device_type: deviceType,
      repair_type: repairType,
      estimated_price: estimatedPrice,
      timestamp: new Date().toISOString(),
      user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
      referrer: typeof document !== 'undefined' ? document.referrer : 'direct',
      viewport: typeof window !== 'undefined' ? {
        width: window.innerWidth,
        height: window.innerHeight
      } : null,
    };

    // Add competitor comparison data if available
    if (competitorComparison) {
      Object.assign(pageData, {
        competitor_comparison: competitorComparison,
        savings_percentage: Math.round((competitorComparison.savings / competitorComparison.marketPrice) * 100)
      });
    }

    trackEvent('service_page_view', pageData);
  };

  const trackServiceInteraction = (interactionType: string, elementData?: any) => {
    interactionCount.current++;
    
    trackEvent('service_page_interaction', {
      page_id: pageId,
      page_name: pageName,
      interaction_type: interactionType,
      interaction_count: interactionCount.current,
      service_category: serviceCategory,
      device_type: deviceType,
      repair_type: repairType,
      element_data: elementData,
      timestamp: new Date().toISOString(),
      time_on_page: Date.now() - startTime.current
    });
  };

  const trackQuoteRequest = (quoteData?: any) => {
    trackEvent('quote_requested', {
      page_id: pageId,
      page_name: pageName,
      service_category: serviceCategory,
      device_type: deviceType,
      repair_type: repairType,
      estimated_value: estimatedPrice || 25, // Default lead value
      quote_data: quoteData,
      conversion_time: Date.now() - startTime.current,
      interactions_before_conversion: interactionCount.current
    });
  };

  const trackBookingStart = (bookingData?: any) => {
    trackEvent('booking_started', {
      page_id: pageId,
      page_name: pageName,
      service_category: serviceCategory,
      device_type: deviceType,
      repair_type: repairType,
      estimated_value: estimatedPrice || 50, // Default booking value
      booking_data: bookingData,
      conversion_time: Date.now() - startTime.current,
      conversion_path: 'service_page_direct'
    });
  };

  const trackPriceCheck = (priceElement?: string) => {
    trackServiceInteraction('price_check', {
      element: priceElement,
      estimated_price: estimatedPrice,
      price_sensitivity_indicator: true
    });
  };

  const trackFeatureInterest = (feature: string, details?: any) => {
    trackServiceInteraction('feature_interest', {
      feature_name: feature,
      feature_details: details,
      interest_level: 'high' // User actively clicked on feature
    });
  };

  // Enhanced children with analytics context
  const enhancedChildren = typeof children === 'function' 
    ? children({
        trackInteraction: trackServiceInteraction,
        trackQuoteRequest,
        trackBookingStart,
        trackPriceCheck,
        trackFeatureInterest
      })
    : children;

  // Add click tracking to all interactive elements
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Track button clicks
      if (target.tagName === 'BUTTON') {
        const buttonText = target.textContent || target.getAttribute('aria-label') || 'unknown';
        trackServiceInteraction('button_click', {
          button_text: buttonText,
          button_type: target.type || 'button',
          element_classes: target.className
        });
      }

      // Track link clicks
      if (target.tagName === 'A' || target.closest('a')) {
        const link = target.closest('a') as HTMLAnchorElement;
        const linkText = link.textContent || link.getAttribute('aria-label') || 'unknown';
        const href = link.href;
        
        trackServiceInteraction('link_click', {
          link_text: linkText,
          link_href: href,
          link_target: link.target,
          element_classes: link.className
        });
      }

      // Track specific service elements
      const serviceElements = target.closest('.service-card, .pricing-card, .feature-card, .trust-signal');
      if (serviceElements) {
        trackServiceInteraction('service_element_click', {
          element_type: serviceElements.className.split(' ')[0],
          element_content: target.textContent?.substring(0, 100) || 'unknown'
        });
      }
    };

    document.addEventListener('click', handleClick);
    
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, [pageId, pageName]);

  // Track scroll depth
  useEffect(() => {
    let maxScrollDepth = 0;
    
    const handleScroll = () => {
      const scrollDepth = Math.round(
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
      );
      
      if (scrollDepth > maxScrollDepth) {
        maxScrollDepth = scrollDepth;
        
        // Track scroll milestones
        if (scrollDepth >= 25 && maxScrollDepth < 25) {
          trackServiceInteraction('scroll_depth', { depth: 25 });
        } else if (scrollDepth >= 50 && maxScrollDepth < 50) {
          trackServiceInteraction('scroll_depth', { depth: 50 });
        } else if (scrollDepth >= 75 && maxScrollDepth < 75) {
          trackServiceInteraction('scroll_depth', { depth: 75 });
        } else if (scrollDepth >= 90 && maxScrollDepth < 90) {
          trackServiceInteraction('scroll_depth', { depth: 90 });
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [pageId]);

  return (
    <div className="service-page-analytics" data-page-id={pageId} data-service={serviceCategory}>
      {enhancedChildren}
    </div>
  );
}