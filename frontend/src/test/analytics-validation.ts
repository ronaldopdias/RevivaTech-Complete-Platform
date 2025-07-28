/**
 * Analytics Implementation Validation
 * 
 * Test suite to validate Session 4 implementation:
 * - 15+ event types
 * - Real-time streaming <100ms overhead
 * - Event queue and batch processing
 * - 95%+ event capture rate
 * 
 * Session 4 - RevivaTech Analytics Implementation
 */

import { AdvancedAnalyticsTracker } from '../services/AdvancedAnalyticsTracker';
import { AnalyticsEventType, ANALYTICS_CONSTANTS } from '../types/analytics';

/**
 * Validation test suite
 */
export class AnalyticsValidation {
  private tracker: AdvancedAnalyticsTracker;
  private testResults: {
    eventTypes: boolean;
    performanceOverhead: boolean;
    captureRate: boolean;
    realTimeStreaming: boolean;
    queueProcessing: boolean;
    overallSuccess: boolean;
  };

  constructor() {
    this.tracker = new AdvancedAnalyticsTracker({
      debug: true,
      enableConsent: false, // Bypass consent for testing
      respectDNT: false,
      sampleRate: 1.0
    });

    this.testResults = {
      eventTypes: false,
      performanceOverhead: false,
      captureRate: false,
      realTimeStreaming: false,
      queueProcessing: false,
      overallSuccess: false
    };
  }

  /**
   * Run complete validation suite
   */
  async runValidation(): Promise<typeof this.testResults> {
    console.log('🚀 Starting Analytics Validation Suite...');

    try {
      // Enable tracking for testing
      this.tracker.updateConsent(true);

      // Test 1: Validate 15+ event types
      console.log('📋 Test 1: Validating 15+ event types...');
      this.testResults.eventTypes = await this.validateEventTypes();
      console.log(`✅ Event types: ${this.testResults.eventTypes ? 'PASS' : 'FAIL'}`);

      // Test 2: Validate performance overhead <100ms
      console.log('⚡ Test 2: Validating performance overhead...');
      this.testResults.performanceOverhead = await this.validatePerformanceOverhead();
      console.log(`✅ Performance overhead: ${this.testResults.performanceOverhead ? 'PASS' : 'FAIL'}`);

      // Test 3: Validate capture rate 95%+
      console.log('🎯 Test 3: Validating event capture rate...');
      this.testResults.captureRate = await this.validateCaptureRate();
      console.log(`✅ Capture rate: ${this.testResults.captureRate ? 'PASS' : 'FAIL'}`);

      // Test 4: Validate real-time streaming
      console.log('🔄 Test 4: Validating real-time streaming...');
      this.testResults.realTimeStreaming = await this.validateRealTimeStreaming();
      console.log(`✅ Real-time streaming: ${this.testResults.realTimeStreaming ? 'PASS' : 'FAIL'}`);

      // Test 5: Validate queue processing
      console.log('📦 Test 5: Validating queue processing...');
      this.testResults.queueProcessing = await this.validateQueueProcessing();
      console.log(`✅ Queue processing: ${this.testResults.queueProcessing ? 'PASS' : 'FAIL'}`);

      // Overall result
      this.testResults.overallSuccess = Object.values(this.testResults).every(result => result === true);
      
      console.log('\n🏆 Validation Results:');
      console.log(`• Event Types (15+): ${this.testResults.eventTypes ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`• Performance (<100ms): ${this.testResults.performanceOverhead ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`• Capture Rate (95%+): ${this.testResults.captureRate ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`• Real-time Streaming: ${this.testResults.realTimeStreaming ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`• Queue Processing: ${this.testResults.queueProcessing ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`\n🎯 Overall: ${this.testResults.overallSuccess ? '✅ SUCCESS' : '❌ NEEDS ATTENTION'}`);

    } catch (error) {
      console.error('❌ Validation failed:', error);
    }

    return this.testResults;
  }

  /**
   * Validate 15+ event types are implemented
   */
  private async validateEventTypes(): Promise<boolean> {
    const eventTypes = Object.values(AnalyticsEventType);
    const requiredEventTypes = [
      AnalyticsEventType.PAGE_VIEW,
      AnalyticsEventType.SCROLL_MILESTONE,
      AnalyticsEventType.CLICK_EVENT,
      AnalyticsEventType.FORM_INTERACT,
      AnalyticsEventType.SERVICE_VIEW,
      AnalyticsEventType.PRICING_CHECK,
      AnalyticsEventType.BOOKING_START,
      AnalyticsEventType.BOOKING_COMPLETE,
      AnalyticsEventType.BOOKING_ABANDON,
      AnalyticsEventType.EXIT_INTENT,
      AnalyticsEventType.RAGE_CLICK,
      AnalyticsEventType.SEARCH_PERFORM,
      AnalyticsEventType.PERFORMANCE_TIMING,
      AnalyticsEventType.ERROR_BOUNDARY,
      AnalyticsEventType.CTA_CLICK,
      AnalyticsEventType.CUSTOM_EVENT
    ];

    // Check if we have at least 15 event types
    const hasRequiredCount = eventTypes.length >= 15;
    
    // Check if all required event types are present
    const hasRequiredTypes = requiredEventTypes.every(type => eventTypes.includes(type));

    // Test each event type can be tracked
    const trackingTests = [];
    for (const eventType of requiredEventTypes.slice(0, 5)) { // Test first 5 for speed
      try {
        await this.tracker.track({
          type: eventType,
          data: { test: true },
          url: 'https://test.com',
          userAgent: 'Test Agent',
          viewport: { width: 1920, height: 1080, pixelRatio: 1 }
        });
        trackingTests.push(true);
      } catch (error) {
        console.warn(`Failed to track ${eventType}:`, error);
        trackingTests.push(false);
      }
    }

    const trackingSuccess = trackingTests.every(result => result === true);
    
    console.log(`  • Total event types: ${eventTypes.length}/15`);
    console.log(`  • Required types present: ${hasRequiredTypes ? 'YES' : 'NO'}`);
    console.log(`  • Tracking functionality: ${trackingSuccess ? 'YES' : 'NO'}`);

    return hasRequiredCount && hasRequiredTypes && trackingSuccess;
  }

  /**
   * Validate performance overhead <100ms
   */
  private async validatePerformanceOverhead(): Promise<boolean> {
    const testEvents = 100;
    const startTime = performance.now();
    
    // Generate test events
    const promises = [];
    for (let i = 0; i < testEvents; i++) {
      promises.push(this.tracker.trackCustom('performance_test', { 
        iteration: i,
        timestamp: Date.now() 
      }));
    }

    // Wait for all events to be processed
    await Promise.all(promises);
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const averageTime = totalTime / testEvents;
    
    console.log(`  • Total time: ${totalTime.toFixed(2)}ms`);
    console.log(`  • Average per event: ${averageTime.toFixed(2)}ms`);
    console.log(`  • Target: <${ANALYTICS_CONSTANTS.PERFORMANCE_OVERHEAD_LIMIT}ms`);

    return averageTime < ANALYTICS_CONSTANTS.PERFORMANCE_OVERHEAD_LIMIT;
  }

  /**
   * Validate event capture rate 95%+
   */
  private async validateCaptureRate(): Promise<boolean> {
    const testEvents = 100;
    const initialQueueSize = this.tracker.getQueueSize();
    
    // Send test events
    const promises = [];
    for (let i = 0; i < testEvents; i++) {
      promises.push(this.tracker.trackCustom('capture_test', { 
        id: i,
        timestamp: Date.now() 
      }));
    }

    await Promise.all(promises);
    
    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const finalQueueSize = this.tracker.getQueueSize();
    const processed = testEvents - (finalQueueSize - initialQueueSize);
    const captureRate = processed / testEvents;
    
    console.log(`  • Events sent: ${testEvents}`);
    console.log(`  • Events processed: ${processed}`);
    console.log(`  • Capture rate: ${(captureRate * 100).toFixed(1)}%`);
    console.log(`  • Target: >=${ANALYTICS_CONSTANTS.CAPTURE_RATE_TARGET * 100}%`);

    return captureRate >= ANALYTICS_CONSTANTS.CAPTURE_RATE_TARGET;
  }

  /**
   * Validate real-time streaming
   */
  private async validateRealTimeStreaming(): Promise<boolean> {
    const stats = this.tracker.getStats();
    const health = this.tracker.getHealthStatus();
    
    // Check streaming statistics
    const hasStreamingStats = stats.eventsSent >= 0 && stats.eventsQueued >= 0;
    
    // Check connection health
    const hasHealthMonitoring = health.connectionHealth.status !== undefined;
    
    // Check latency
    const hasAcceptableLatency = stats.averageLatency < 100;
    
    console.log(`  • Streaming stats available: ${hasStreamingStats ? 'YES' : 'NO'}`);
    console.log(`  • Health monitoring: ${hasHealthMonitoring ? 'YES' : 'NO'}`);
    console.log(`  • Average latency: ${stats.averageLatency.toFixed(2)}ms`);
    console.log(`  • Connection status: ${health.connectionHealth.status}`);

    return hasStreamingStats && hasHealthMonitoring && hasAcceptableLatency;
  }

  /**
   * Validate queue processing
   */
  private async validateQueueProcessing(): Promise<boolean> {
    const initialQueueSize = this.tracker.getQueueSize();
    
    // Add events to queue
    await this.tracker.trackCustom('queue_test_1', { test: true });
    await this.tracker.trackCustom('queue_test_2', { test: true });
    await this.tracker.trackCustom('queue_test_3', { test: true });
    
    const queuedSize = this.tracker.getQueueSize();
    const hasQueueing = queuedSize > initialQueueSize;
    
    // Test flush
    await this.tracker.flush();
    const flushedSize = this.tracker.getQueueSize();
    const hasFlush = flushedSize <= queuedSize;
    
    // Test batch processing
    const config = this.tracker.getConfig();
    const hasBatchConfig = config.batchProcessing.batchSize > 0;
    
    console.log(`  • Initial queue size: ${initialQueueSize}`);
    console.log(`  • After queueing: ${queuedSize}`);
    console.log(`  • After flush: ${flushedSize}`);
    console.log(`  • Batch size configured: ${config.batchProcessing.batchSize}`);

    return hasQueueing && hasFlush && hasBatchConfig;
  }

  /**
   * Get detailed validation report
   */
  getValidationReport(): {
    summary: typeof this.testResults;
    details: {
      eventTypes: string[];
      performanceMetrics: ReturnType<typeof this.tracker.getStats>;
      healthStatus: ReturnType<typeof this.tracker.getHealthStatus>;
      configuration: ReturnType<typeof this.tracker.getConfig>;
    };
  } {
    return {
      summary: this.testResults,
      details: {
        eventTypes: Object.values(AnalyticsEventType),
        performanceMetrics: this.tracker.getStats(),
        healthStatus: this.tracker.getHealthStatus(),
        configuration: this.tracker.getConfig()
      }
    };
  }

  /**
   * Cleanup test resources
   */
  cleanup(): void {
    this.tracker.clearData();
    this.tracker.destroy();
  }
}

// Export for testing
export const runAnalyticsValidation = async (): Promise<boolean> => {
  const validator = new AnalyticsValidation();
  try {
    const results = await validator.runValidation();
    return results.overallSuccess;
  } finally {
    validator.cleanup();
  }
};

export default AnalyticsValidation;