// Analytics Testing & Verification System
'use client';

interface TestResult {
  provider: string;
  test: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

interface AnalyticsTestReport {
  timestamp: string;
  environment: string;
  overallStatus: 'pass' | 'fail' | 'warning';
  results: TestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  };
}

// Test analytics providers initialization
export async function testAnalyticsInitialization(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  
  // Test Google Analytics 4
  results.push(await testGoogleAnalytics());
  
  // Test Facebook Pixel
  results.push(await testFacebookPixel());
  
  // Test PostHog
  results.push(await testPostHog());
  
  // Test Internal Backend
  results.push(await testInternalBackend());
  
  // Test Consent Management
  results.push(await testConsentManagement());
  
  return results;
}

async function testGoogleAnalytics(): Promise<TestResult> {
  try {
    const measurementId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
    
    if (!measurementId || measurementId === 'G-PLACEHOLDER123456') {
      return {
        provider: 'Google Analytics',
        test: 'Configuration',
        status: 'warning',
        message: 'GA4 Measurement ID not configured',
        details: { measurementId }
      };
    }
    
    // Check if gtag script is loaded
    if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
      // Test event tracking
      try {
        (window as any).gtag('event', 'test_event', {
          event_category: 'test',
          event_label: 'analytics_verification',
          value: 1,
          non_interaction: true
        });
        
        return {
          provider: 'Google Analytics',
          test: 'Event Tracking',
          status: 'pass',
          message: 'GA4 initialized and test event sent successfully',
          details: { measurementId }
        };
      } catch (error) {
        return {
          provider: 'Google Analytics',
          test: 'Event Tracking',
          status: 'fail',
          message: 'GA4 loaded but event tracking failed',
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        };
      }
    }
    
    return {
      provider: 'Google Analytics',
      test: 'Script Loading',
      status: 'fail',
      message: 'GA4 script not loaded or gtag function not available',
      details: { measurementId }
    };
    
  } catch (error) {
    return {
      provider: 'Google Analytics',
      test: 'Initialization',
      status: 'fail',
      message: 'GA4 initialization failed',
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    };
  }
}

async function testFacebookPixel(): Promise<TestResult> {
  try {
    const pixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;
    
    if (!pixelId || pixelId === '1234567890123456') {
      return {
        provider: 'Facebook Pixel',
        test: 'Configuration',
        status: 'warning',
        message: 'Facebook Pixel ID not configured',
        details: { pixelId }
      };
    }
    
    // Check if fbq script is loaded
    if (typeof window !== 'undefined' && typeof (window as any).fbq === 'function') {
      try {
        // Test event tracking
        (window as any).fbq('trackCustom', 'TestEvent', {
          test: 'analytics_verification',
          timestamp: new Date().toISOString()
        });
        
        return {
          provider: 'Facebook Pixel',
          test: 'Event Tracking',
          status: 'pass',
          message: 'Facebook Pixel initialized and test event sent successfully',
          details: { pixelId }
        };
      } catch (error) {
        return {
          provider: 'Facebook Pixel',
          test: 'Event Tracking',
          status: 'fail',
          message: 'Facebook Pixel loaded but event tracking failed',
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        };
      }
    }
    
    return {
      provider: 'Facebook Pixel',
      test: 'Script Loading',
      status: 'fail',
      message: 'Facebook Pixel script not loaded or fbq function not available',
      details: { pixelId }
    };
    
  } catch (error) {
    return {
      provider: 'Facebook Pixel',
      test: 'Initialization',
      status: 'fail',
      message: 'Facebook Pixel initialization failed',
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    };
  }
}

async function testPostHog(): Promise<TestResult> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
    
    if (!apiKey || apiKey === 'phc_placeholder_posthog_key_here_32_chars') {
      return {
        provider: 'PostHog',
        test: 'Configuration',
        status: 'warning',
        message: 'PostHog API key not configured',
        details: { apiKey: apiKey ? 'Set' : 'Not set', host }
      };
    }
    
    // Check if PostHog script is loaded
    if (typeof window !== 'undefined' && typeof (window as any).posthog === 'object') {
      try {
        // Test event tracking
        (window as any).posthog.capture('test_event', {
          test: 'analytics_verification',
          timestamp: new Date().toISOString()
        });
        
        return {
          provider: 'PostHog',
          test: 'Event Tracking',
          status: 'pass',
          message: 'PostHog initialized and test event sent successfully',
          details: { apiKey: 'Set', host }
        };
      } catch (error) {
        return {
          provider: 'PostHog',
          test: 'Event Tracking',
          status: 'fail',
          message: 'PostHog loaded but event tracking failed',
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        };
      }
    }
    
    return {
      provider: 'PostHog',
      test: 'Script Loading',
      status: 'fail',
      message: 'PostHog script not loaded or posthog object not available',
      details: { apiKey: apiKey ? 'Set' : 'Not set', host }
    };
    
  } catch (error) {
    return {
      provider: 'PostHog',
      test: 'Initialization',
      status: 'fail',
      message: 'PostHog initialization failed',
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    };
  }
}

async function testInternalBackend(): Promise<TestResult> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3011';
    const endpoint = `${apiUrl}/api/analytics/events`;
    
    const testPayload = {
      event: 'test_event',
      data: { test: 'analytics_verification' },
      timestamp: new Date().toISOString()
    };
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload)
    });
    
    if (response.ok) {
      return {
        provider: 'Internal Backend',
        test: 'Event Tracking',
        status: 'pass',
        message: 'Backend analytics endpoint responding correctly',
        details: { endpoint, status: response.status }
      };
    } else {
      return {
        provider: 'Internal Backend',
        test: 'Event Tracking',
        status: 'fail',
        message: `Backend analytics endpoint returned error: ${response.status}`,
        details: { endpoint, status: response.status, statusText: response.statusText }
      };
    }
    
  } catch (error) {
    return {
      provider: 'Internal Backend',
      test: 'Connectivity',
      status: 'fail',
      message: 'Cannot connect to backend analytics endpoint',
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    };
  }
}

async function testConsentManagement(): Promise<TestResult> {
  try {
    // Check if consent management is properly implemented
    const consentRequired = process.env.NEXT_PUBLIC_ANALYTICS_CONSENT_REQUIRED === 'true';
    
    if (!consentRequired) {
      return {
        provider: 'Consent Management',
        test: 'GDPR Compliance',
        status: 'warning',
        message: 'Consent management not required - check GDPR compliance',
        details: { consentRequired }
      };
    }
    
    // Check for consent management in localStorage or cookies
    if (typeof window !== 'undefined') {
      const consent = localStorage.getItem('analytics-consent');
      const hasConsentManager = document.querySelector('[data-consent-manager]');
      
      if (hasConsentManager || consent) {
        return {
          provider: 'Consent Management',
          test: 'Implementation',
          status: 'pass',
          message: 'Consent management system detected',
          details: { 
            hasConsentManager: !!hasConsentManager,
            storedConsent: !!consent,
            consentValue: consent
          }
        };
      } else {
        return {
          provider: 'Consent Management',
          test: 'Implementation',
          status: 'warning',
          message: 'Consent management required but not detected',
          details: { consentRequired }
        };
      }
    }
    
    return {
      provider: 'Consent Management',
      test: 'Environment',
      status: 'warning',
      message: 'Cannot test consent management in server environment',
      details: { consentRequired }
    };
    
  } catch (error) {
    return {
      provider: 'Consent Management',
      test: 'System Check',
      status: 'fail',
      message: 'Consent management check failed',
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    };
  }
}

// Performance impact testing
export async function testAnalyticsPerformance(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  
  if (typeof window === 'undefined') {
    return [{
      provider: 'Performance',
      test: 'Environment',
      status: 'warning',
      message: 'Performance tests can only run in browser environment',
      details: {}
    }];
  }
  
  // Test script loading impact
  const performanceEntries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  const analyticsScripts = performanceEntries.filter(entry => 
    entry.name.includes('googletagmanager.com') ||
    entry.name.includes('connect.facebook.net') ||
    entry.name.includes('app.posthog.com')
  );
  
  const totalLoadTime = analyticsScripts.reduce((sum, script) => sum + script.duration, 0);
  const averageLoadTime = analyticsScripts.length > 0 ? totalLoadTime / analyticsScripts.length : 0;
  
  if (averageLoadTime < 100) {
    results.push({
      provider: 'Performance',
      test: 'Script Loading',
      status: 'pass',
      message: `Analytics scripts loading efficiently (${averageLoadTime.toFixed(2)}ms average)`,
      details: { totalLoadTime, averageLoadTime, scriptCount: analyticsScripts.length }
    });
  } else if (averageLoadTime < 300) {
    results.push({
      provider: 'Performance',
      test: 'Script Loading',
      status: 'warning',
      message: `Analytics scripts loading slowly (${averageLoadTime.toFixed(2)}ms average)`,
      details: { totalLoadTime, averageLoadTime, scriptCount: analyticsScripts.length }
    });
  } else {
    results.push({
      provider: 'Performance',
      test: 'Script Loading',
      status: 'fail',
      message: `Analytics scripts loading too slowly (${averageLoadTime.toFixed(2)}ms average)`,
      details: { totalLoadTime, averageLoadTime, scriptCount: analyticsScripts.length }
    });
  }
  
  // Test Core Web Vitals impact
  if ('web-vital' in window) {
    results.push({
      provider: 'Performance',
      test: 'Core Web Vitals',
      status: 'pass',
      message: 'Core Web Vitals monitoring active',
      details: { webVitalsEnabled: true }
    });
  } else {
    results.push({
      provider: 'Performance',
      test: 'Core Web Vitals',
      status: 'warning',
      message: 'Core Web Vitals monitoring not detected',
      details: { webVitalsEnabled: false }
    });
  }
  
  return results;
}

// Generate comprehensive test report
export async function generateAnalyticsReport(): Promise<AnalyticsTestReport> {
  const initResults = await testAnalyticsInitialization();
  const perfResults = await testAnalyticsPerformance();
  const allResults = [...initResults, ...perfResults];
  
  const summary = {
    total: allResults.length,
    passed: allResults.filter(r => r.status === 'pass').length,
    failed: allResults.filter(r => r.status === 'fail').length,
    warnings: allResults.filter(r => r.status === 'warning').length
  };
  
  const overallStatus: 'pass' | 'fail' | 'warning' = 
    summary.failed > 0 ? 'fail' :
    summary.warnings > 0 ? 'warning' : 'pass';
  
  return {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    overallStatus,
    results: allResults,
    summary
  };
}

// Console-friendly test runner
export async function runAnalyticsTests(verbose: boolean = false): Promise<void> {
  console.log('🧪 Running Analytics Tests...');
  
  const report = await generateAnalyticsReport();
  
  console.log(`\n📊 Analytics Test Report - ${report.timestamp}`);
  console.log(`Environment: ${report.environment}`);
  console.log(`Overall Status: ${report.overallStatus === 'pass' ? '✅ PASS' : 
    report.overallStatus === 'warning' ? '⚠️ WARNING' : '❌ FAIL'}`);
  
  console.log(`\n📈 Summary:`);
  console.log(`  Total Tests: ${report.summary.total}`);
  console.log(`  ✅ Passed: ${report.summary.passed}`);
  console.log(`  ⚠️ Warnings: ${report.summary.warnings}`);
  console.log(`  ❌ Failed: ${report.summary.failed}`);
  
  if (verbose) {
    console.log(`\n📋 Detailed Results:`);
    report.results.forEach((result, index) => {
      const icon = result.status === 'pass' ? '✅' : 
        result.status === 'warning' ? '⚠️' : '❌';
      console.log(`  ${icon} ${result.provider} - ${result.test}: ${result.message}`);
      if (result.details && Object.keys(result.details).length > 0) {
        console.log(`     Details:`, result.details);
      }
    });
  }
  
  return;
}

// Export for use in development tools
export const analyticsTestingUtils = {
  testInitialization: testAnalyticsInitialization,
  testPerformance: testAnalyticsPerformance,
  generateReport: generateAnalyticsReport,
  runTests: runAnalyticsTests
};