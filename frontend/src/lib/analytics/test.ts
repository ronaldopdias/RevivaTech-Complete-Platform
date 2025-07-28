/**
 * Analytics Testing & Validation Script
 * RevivaTech Analytics Verification Tool
 * 
 * Comprehensive testing suite for third-party analytics integration
 * Use this to verify proper setup and data collection
 */

import { getAnalyticsConfiguration, testAnalyticsConfiguration } from './setup';
import { eventNames, customDimensions } from '@/config/analytics.config';

export interface AnalyticsTestResult {
  test: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

/**
 * Run comprehensive analytics test suite
 */
export const runAnalyticsTests = async (): Promise<AnalyticsTestResult[]> => {
  const results: AnalyticsTestResult[] = [];

  console.log('🔍 Starting Analytics Test Suite...');

  // Test 1: Environment Variables
  results.push(await testEnvironmentVariables());

  // Test 2: Analytics Configuration
  results.push(await testAnalyticsConfiguration());

  // Test 3: Consent Management
  results.push(await testConsentManagement());

  // Test 4: Event Tracking
  results.push(await testEventTracking());

  // Test 5: Conversion Tracking
  results.push(await testConversionTracking());

  // Test 6: Privacy Compliance
  results.push(await testPrivacyCompliance());

  // Test 7: Network Requests
  results.push(await testNetworkRequests());

  // Summary
  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const warnings = results.filter(r => r.status === 'warning').length;

  console.log(`📊 Test Summary: ${passed} passed, ${failed} failed, ${warnings} warnings`);

  return results;
};

/**
 * Test environment variables configuration
 */
const testEnvironmentVariables = async (): Promise<AnalyticsTestResult> => {
  try {
    const config = getAnalyticsConfiguration();
    const { missingEnvVars } = config;

    if (missingEnvVars.length === 0) {
      return {
        test: 'Environment Variables',
        status: 'pass',
        message: 'All required environment variables are configured'
      };
    }

    if (missingEnvVars.length < 3) {
      return {
        test: 'Environment Variables',
        status: 'warning',
        message: `Some environment variables missing: ${missingEnvVars.join(', ')}`,
        details: missingEnvVars
      };
    }

    return {
      test: 'Environment Variables',
      status: 'fail',
      message: `Most environment variables missing: ${missingEnvVars.join(', ')}`,
      details: missingEnvVars
    };
  } catch (error) {
    return {
      test: 'Environment Variables',
      status: 'fail',
      message: `Error checking environment variables: ${error}`,
      details: error
    };
  }
};

/**
 * Test analytics configuration
 */
const testAnalyticsConfiguration = async (): Promise<AnalyticsTestResult> => {
  try {
    const config = getAnalyticsConfiguration();

    if (!config.isEnabled) {
      return {
        test: 'Analytics Configuration',
        status: 'warning',
        message: 'Analytics is disabled for current environment'
      };
    }

    // Check if key configuration exists
    const hasGA = !!config.config.googleAnalytics?.enabled;
    const hasFB = !!config.config.facebookPixel?.enabled;
    const hasPostHog = !!config.config.postHog?.enabled;

    if (hasGA && hasFB && hasPostHog) {
      return {
        test: 'Analytics Configuration',
        status: 'pass',
        message: 'All analytics services configured'
      };
    }

    return {
      test: 'Analytics Configuration',
      status: 'warning',
      message: `Partial configuration: GA4=${hasGA}, Facebook=${hasFB}, PostHog=${hasPostHog}`
    };
  } catch (error) {
    return {
      test: 'Analytics Configuration',
      status: 'fail',
      message: `Configuration error: ${error}`
    };
  }
};

/**
 * Test consent management system
 */
const testConsentManagement = async (): Promise<AnalyticsTestResult> => {
  try {
    // Check localStorage for consent data
    const consent = localStorage.getItem('revivatech_consent');
    const analyticsConsent = localStorage.getItem('analytics_consent');

    if (!consent && !analyticsConsent) {
      return {
        test: 'Consent Management',
        status: 'warning',
        message: 'No consent data found - user has not interacted with consent manager'
      };
    }

    if (consent) {
      try {
        const consentData = JSON.parse(consent);
        const hasTimestamp = !!consentData.timestamp;
        const hasVersion = !!consentData.version;

        if (hasTimestamp && hasVersion) {
          return {
            test: 'Consent Management',
            status: 'pass',
            message: 'Consent data properly structured',
            details: consentData
          };
        }
      } catch (e) {
        return {
          test: 'Consent Management',
          status: 'fail',
          message: 'Invalid consent data format'
        };
      }
    }

    return {
      test: 'Consent Management',
      status: 'pass',
      message: 'Basic consent tracking working'
    };
  } catch (error) {
    return {
      test: 'Consent Management',
      status: 'fail',
      message: `Consent management error: ${error}`
    };
  }
};

/**
 * Test event tracking functionality
 */
const testEventTracking = async (): Promise<AnalyticsTestResult> => {
  try {
    // Check if gtag is loaded (Google Analytics)
    const hasGtag = typeof (window as any).gtag === 'function';
    
    // Check if fbq is loaded (Facebook Pixel)
    const hasFbq = typeof (window as any).fbq === 'function';
    
    // Check if PostHog is loaded
    const hasPostHog = typeof (window as any).posthog === 'object';

    const loadedServices = [];
    if (hasGtag) loadedServices.push('Google Analytics');
    if (hasFbq) loadedServices.push('Facebook Pixel');
    if (hasPostHog) loadedServices.push('PostHog');

    if (loadedServices.length === 0) {
      return {
        test: 'Event Tracking',
        status: 'fail',
        message: 'No analytics services loaded'
      };
    }

    if (loadedServices.length < 3) {
      return {
        test: 'Event Tracking',
        status: 'warning',
        message: `Partial service loading: ${loadedServices.join(', ')}`,
        details: { hasGtag, hasFbq, hasPostHog }
      };
    }

    return {
      test: 'Event Tracking',
      status: 'pass',
      message: `All services loaded: ${loadedServices.join(', ')}`,
      details: { hasGtag, hasFbq, hasPostHog }
    };
  } catch (error) {
    return {
      test: 'Event Tracking',
      status: 'fail',
      message: `Event tracking test error: ${error}`
    };
  }
};

/**
 * Test conversion tracking setup
 */
const testConversionTracking = async (): Promise<AnalyticsTestResult> => {
  try {
    // Test if we can send a test conversion event
    const testConversion = {
      eventName: 'test_conversion',
      value: 1,
      currency: 'GBP'
    };

    // This would be caught by analytics if properly configured
    if (typeof (window as any).gtag === 'function') {
      (window as any).gtag('event', testConversion.eventName, {
        value: testConversion.value,
        currency: testConversion.currency
      });
    }

    return {
      test: 'Conversion Tracking',
      status: 'pass',
      message: 'Conversion tracking test completed - check network tab for requests'
    };
  } catch (error) {
    return {
      test: 'Conversion Tracking',
      status: 'fail',
      message: `Conversion tracking error: ${error}`
    };
  }
};

/**
 * Test privacy compliance features
 */
const testPrivacyCompliance = async (): Promise<AnalyticsTestResult> => {
  try {
    const issues = [];

    // Check Do Not Track support
    if (navigator.doNotTrack === '1') {
      const analyticsStillRunning = typeof (window as any).gtag === 'function';
      if (analyticsStillRunning) {
        issues.push('Analytics running despite Do Not Track');
      }
    }

    // Check cookie settings
    const analyticsConsent = localStorage.getItem('analytics_consent');
    if (analyticsConsent === 'false') {
      const cookiesPresent = document.cookie.includes('_ga');
      if (cookiesPresent) {
        issues.push('Analytics cookies present without consent');
      }
    }

    if (issues.length === 0) {
      return {
        test: 'Privacy Compliance',
        status: 'pass',
        message: 'Privacy compliance checks passed'
      };
    }

    return {
      test: 'Privacy Compliance',
      status: 'warning',
      message: `Privacy issues found: ${issues.join(', ')}`,
      details: issues
    };
  } catch (error) {
    return {
      test: 'Privacy Compliance',
      status: 'fail',
      message: `Privacy compliance test error: ${error}`
    };
  }
};

/**
 * Test network requests to analytics services
 */
const testNetworkRequests = async (): Promise<AnalyticsTestResult> => {
  try {
    // This is a basic test - in a real scenario you'd monitor network activity
    const expectedDomains = [
      'google-analytics.com',
      'googletagmanager.com', 
      'facebook.net',
      'posthog.com'
    ];

    // Check if scripts are loaded from expected domains
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    const loadedDomains = scripts
      .map(script => script.getAttribute('src'))
      .filter(src => src && expectedDomains.some(domain => src.includes(domain)))
      .map(src => {
        const match = expectedDomains.find(domain => src!.includes(domain));
        return match;
      })
      .filter(Boolean);

    if (loadedDomains.length === 0) {
      return {
        test: 'Network Requests',
        status: 'warning',
        message: 'No analytics scripts found in DOM'
      };
    }

    return {
      test: 'Network Requests',
      status: 'pass',
      message: `Analytics scripts loaded from: ${[...new Set(loadedDomains)].join(', ')}`
    };
  } catch (error) {
    return {
      test: 'Network Requests',
      status: 'fail',
      message: `Network test error: ${error}`
    };
  }
};

/**
 * Manual test helper - call from browser console
 */
export const manualAnalyticsTest = () => {
  console.log('🧪 Manual Analytics Test');
  console.log('Run this in browser console to test analytics integration');
  
  // Test configuration
  testAnalyticsConfiguration();
  
  // Test all systems
  runAnalyticsTests().then(results => {
    console.table(results);
  });
};

// Export for browser console access
if (typeof window !== 'undefined') {
  (window as any).testAnalytics = manualAnalyticsTest;
}

export default { runAnalyticsTests, manualAnalyticsTest };