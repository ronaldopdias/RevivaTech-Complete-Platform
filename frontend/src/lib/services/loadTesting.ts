/**
 * Load Testing and Scalability Assessment Service
 * Provides client-side performance testing and scalability metrics
 */

export interface LoadTestConfig {
  duration: number; // Test duration in ms
  concurrency: number; // Number of concurrent users
  rampUpTime: number; // Time to reach full concurrency
  endpoints: Array<{
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    weight: number; // Relative frequency (1-100)
    payload?: any;
  }>;
  thresholds: {
    avgResponseTime: number; // ms
    p95ResponseTime: number; // ms
    errorRate: number; // percentage
    throughput: number; // requests per second
  };
}

export interface LoadTestResult {
  summary: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    avgResponseTime: number;
    p50ResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    throughput: number; // requests per second
    errorRate: number; // percentage
    duration: number; // actual test duration
  };
  timeline: Array<{
    timestamp: number;
    responseTime: number;
    success: boolean;
    endpoint: string;
  }>;
  errors: Array<{
    timestamp: number;
    endpoint: string;
    error: string;
    responseTime: number;
  }>;
  resourceUsage: {
    maxMemory: number;
    avgCpuUsage: number;
    networkTraffic: number;
  };
}

export interface ScalabilityMetrics {
  currentLoad: {
    activeUsers: number;
    requestsPerSecond: number;
    avgResponseTime: number;
    errorRate: number;
  };
  capacity: {
    maxConcurrentUsers: number;
    maxThroughput: number;
    bottlenecks: string[];
  };
  recommendations: string[];
}

class LoadTestingService {
  private isRunning: boolean = false;
  private results: LoadTestResult[] = [];
  private activeRequests: Set<Promise<any>> = new Set();

  /**
   * Execute load test with specified configuration
   */
  async runLoadTest(config: LoadTestConfig): Promise<LoadTestResult> {
    if (this.isRunning) {
      throw new Error('Load test already running');
    }

    this.isRunning = true;
    const startTime = Date.now();
    const timeline: LoadTestResult['timeline'] = [];
    const errors: LoadTestResult['errors'] = [];
    const responseTimes: number[] = [];

    try {
      console.log(`🚀 Starting load test: ${config.concurrency} users, ${config.duration}ms duration`);

      // Ramp up users gradually
      const usersPerStep = Math.ceil(config.concurrency / 10);
      const rampStepDelay = config.rampUpTime / 10;

      for (let step = 0; step < 10; step++) {
        const usersToStart = Math.min(usersPerStep, config.concurrency - (step * usersPerStep));
        
        for (let i = 0; i < usersToStart; i++) {
          this.startVirtualUser(config, timeline, errors, responseTimes);
        }

        if (step < 9) {
          await this.delay(rampStepDelay);
        }
      }

      // Wait for test duration
      await this.delay(config.duration);

      // Wait for remaining requests to complete (with timeout)
      await this.waitForActiveRequests(5000);

      const endTime = Date.now();
      const actualDuration = endTime - startTime;

      const result = this.calculateResults(timeline, errors, responseTimes, actualDuration);
      this.results.push(result);

      console.log('✅ Load test completed:', result.summary);
      return result;

    } finally {
      this.isRunning = false;
      this.activeRequests.clear();
    }
  }

  /**
   * Start a virtual user session
   */
  private async startVirtualUser(
    config: LoadTestConfig,
    timeline: LoadTestResult['timeline'],
    errors: LoadTestResult['errors'],
    responseTimes: number[]
  ): Promise<void> {
    const userStartTime = Date.now();
    const userDuration = config.duration;

    while (Date.now() - userStartTime < userDuration && this.isRunning) {
      const endpoint = this.selectEndpoint(config.endpoints);
      const requestPromise = this.executeRequest(endpoint, timeline, errors, responseTimes);
      
      this.activeRequests.add(requestPromise);
      
      requestPromise.finally(() => {
        this.activeRequests.delete(requestPromise);
      });

      // Think time between requests (100-500ms)
      await this.delay(100 + Math.random() * 400);
    }
  }

  /**
   * Select endpoint based on weights
   */
  private selectEndpoint(endpoints: LoadTestConfig['endpoints']): LoadTestConfig['endpoints'][0] {
    const totalWeight = endpoints.reduce((sum, endpoint) => sum + endpoint.weight, 0);
    let random = Math.random() * totalWeight;

    for (const endpoint of endpoints) {
      random -= endpoint.weight;
      if (random <= 0) {
        return endpoint;
      }
    }

    return endpoints[0]; // Fallback
  }

  /**
   * Execute a single request
   */
  private async executeRequest(
    endpoint: LoadTestConfig['endpoints'][0],
    timeline: LoadTestResult['timeline'],
    errors: LoadTestResult['errors'],
    responseTimes: number[]
  ): Promise<void> {
    const startTime = Date.now();

    try {
      const response = await fetch(endpoint.url, {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: endpoint.payload ? JSON.stringify(endpoint.payload) : undefined,
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;
      const success = response.ok;

      responseTimes.push(responseTime);
      timeline.push({
        timestamp: startTime,
        responseTime,
        success,
        endpoint: endpoint.url
      });

      if (!success) {
        errors.push({
          timestamp: startTime,
          endpoint: endpoint.url,
          error: `HTTP ${response.status}`,
          responseTime
        });
      }

    } catch (error) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      responseTimes.push(responseTime);
      timeline.push({
        timestamp: startTime,
        responseTime,
        success: false,
        endpoint: endpoint.url
      });

      errors.push({
        timestamp: startTime,
        endpoint: endpoint.url,
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime
      });
    }
  }

  /**
   * Calculate test results
   */
  private calculateResults(
    timeline: LoadTestResult['timeline'],
    errors: LoadTestResult['errors'],
    responseTimes: number[],
    duration: number
  ): LoadTestResult {
    const totalRequests = timeline.length;
    const successfulRequests = timeline.filter(entry => entry.success).length;
    const failedRequests = totalRequests - successfulRequests;

    // Sort response times for percentile calculations
    const sortedTimes = [...responseTimes].sort((a, b) => a - b);

    const summary = {
      totalRequests,
      successfulRequests,
      failedRequests,
      avgResponseTime: this.average(responseTimes),
      p50ResponseTime: this.percentile(sortedTimes, 50),
      p95ResponseTime: this.percentile(sortedTimes, 95),
      p99ResponseTime: this.percentile(sortedTimes, 99),
      minResponseTime: Math.min(...responseTimes),
      maxResponseTime: Math.max(...responseTimes),
      throughput: (totalRequests / duration) * 1000, // requests per second
      errorRate: (failedRequests / totalRequests) * 100,
      duration
    };

    const resourceUsage = this.getResourceUsage();

    return {
      summary,
      timeline,
      errors,
      resourceUsage
    };
  }

  /**
   * Get current resource usage
   */
  private getResourceUsage(): LoadTestResult['resourceUsage'] {
    const memory = (performance as any).memory;
    
    return {
      maxMemory: memory ? memory.usedJSHeapSize : 0,
      avgCpuUsage: 0, // Would need additional monitoring
      networkTraffic: 0 // Would need additional monitoring
    };
  }

  /**
   * Assess scalability based on load test results
   */
  assessScalability(): ScalabilityMetrics {
    if (this.results.length === 0) {
      throw new Error('No load test results available');
    }

    const latestResult = this.results[this.results.length - 1];
    const recommendations: string[] = [];
    const bottlenecks: string[] = [];

    // Analyze response times
    if (latestResult.summary.avgResponseTime > 1000) {
      recommendations.push('Optimize backend response times - consider caching, database indexing, or CDN');
      bottlenecks.push('High response times');
    }

    if (latestResult.summary.p95ResponseTime > 3000) {
      recommendations.push('Address performance outliers - investigate slow queries or resource contention');
      bottlenecks.push('Response time variance');
    }

    // Analyze error rates
    if (latestResult.summary.errorRate > 1) {
      recommendations.push('Investigate and fix error sources to improve reliability');
      bottlenecks.push('High error rate');
    }

    // Analyze throughput
    if (latestResult.summary.throughput < 100) {
      recommendations.push('Improve throughput with connection pooling, async processing, or horizontal scaling');
      bottlenecks.push('Low throughput');
    }

    // Memory analysis
    if (latestResult.resourceUsage.maxMemory > 100 * 1024 * 1024) { // 100MB
      recommendations.push('Optimize memory usage - check for memory leaks or excessive caching');
      bottlenecks.push('High memory usage');
    }

    // Estimate capacity
    const maxConcurrentUsers = this.estimateMaxUsers(latestResult);
    const maxThroughput = this.estimateMaxThroughput(latestResult);

    return {
      currentLoad: {
        activeUsers: 0, // Would track active sessions
        requestsPerSecond: latestResult.summary.throughput,
        avgResponseTime: latestResult.summary.avgResponseTime,
        errorRate: latestResult.summary.errorRate
      },
      capacity: {
        maxConcurrentUsers,
        maxThroughput,
        bottlenecks
      },
      recommendations
    };
  }

  private estimateMaxUsers(result: LoadTestResult): number {
    // Simple estimation based on current performance
    const currentUsers = 10; // Would track actual concurrent users
    const responseTimeThreshold = 2000; // 2 seconds
    
    if (result.summary.avgResponseTime < responseTimeThreshold) {
      return Math.floor(currentUsers * (responseTimeThreshold / result.summary.avgResponseTime));
    }
    
    return currentUsers;
  }

  private estimateMaxThroughput(result: LoadTestResult): number {
    // Estimate based on current throughput and response times
    const optimalResponseTime = 500; // 500ms
    
    if (result.summary.avgResponseTime > optimalResponseTime) {
      return result.summary.throughput * (optimalResponseTime / result.summary.avgResponseTime);
    }
    
    return result.summary.throughput * 2; // Could potentially double
  }

  /**
   * Utility methods
   */
  
  private average(numbers: number[]): number {
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  }

  private percentile(sortedNumbers: number[], percentile: number): number {
    const index = Math.ceil((percentile / 100) * sortedNumbers.length) - 1;
    return sortedNumbers[Math.max(0, index)] || 0;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async waitForActiveRequests(timeout: number): Promise<void> {
    const startTime = Date.now();
    
    while (this.activeRequests.size > 0 && Date.now() - startTime < timeout) {
      await this.delay(100);
    }
  }

  /**
   * Public API methods
   */
  
  getResults(): LoadTestResult[] {
    return [...this.results];
  }

  clearResults(): void {
    this.results = [];
  }

  isTestRunning(): boolean {
    return this.isRunning;
  }

  stopTest(): void {
    this.isRunning = false;
  }

  /**
   * Predefined test configurations
   */
  static readonly SMOKE_TEST: LoadTestConfig = {
    duration: 30000, // 30 seconds
    concurrency: 5,
    rampUpTime: 5000,
    endpoints: [
      { url: '/api/health', method: 'GET', weight: 100 }
    ],
    thresholds: {
      avgResponseTime: 500,
      p95ResponseTime: 1000,
      errorRate: 1,
      throughput: 10
    }
  };

  static readonly STRESS_TEST: LoadTestConfig = {
    duration: 300000, // 5 minutes
    concurrency: 50,
    rampUpTime: 30000,
    endpoints: [
      { url: '/api/devices', method: 'GET', weight: 40 },
      { url: '/api/bookings', method: 'GET', weight: 30 },
      { url: '/api/bookings', method: 'POST', weight: 20, payload: { deviceId: 1, type: 'repair' } },
      { url: '/api/users/profile', method: 'GET', weight: 10 }
    ],
    thresholds: {
      avgResponseTime: 1000,
      p95ResponseTime: 2000,
      errorRate: 2,
      throughput: 50
    }
  };
}

// Export singleton instance
export const loadTesting = new LoadTestingService();