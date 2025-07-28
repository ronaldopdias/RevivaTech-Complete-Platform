#!/usr/bin/env node

/**
 * RevivaTech Performance Testing Suite
 * Comprehensive load testing and performance optimization
 */

const http = require('http');
const https = require('https');
const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');

class PerformanceTester {
  constructor() {
    this.baseUrl = process.env.API_BASE_URL || 'http://localhost:3011';
    this.results = {
      tests: [],
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        averageResponseTime: 0,
        totalRequests: 0,
        requestsPerSecond: 0
      }
    };
    this.concurrentUsers = parseInt(process.env.CONCURRENT_USERS) || 10;
    this.testDuration = parseInt(process.env.TEST_DURATION) || 30000; // 30 seconds
  }

  async makeRequest(method, endpoint, data = null, headers = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint, this.baseUrl);
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'RevivaTech-Performance-Test/1.0',
          ...headers
        },
        timeout: 10000
      };

      const startTime = performance.now();
      
      const req = (url.protocol === 'https:' ? https : http).request(url, options, (res) => {
        let body = '';
        
        res.on('data', chunk => {
          body += chunk;
        });
        
        res.on('end', () => {
          const endTime = performance.now();
          const responseTime = endTime - startTime;
          
          let parsedBody;
          try {
            parsedBody = JSON.parse(body);
          } catch (e) {
            parsedBody = body;
          }
          
          resolve({
            statusCode: res.statusCode,
            responseTime,
            body: parsedBody,
            headers: res.headers,
            size: Buffer.byteLength(body)
          });
        });
      });

      req.on('error', (error) => {
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        reject({
          error: error.message,
          responseTime,
          statusCode: 0
        });
      });

      req.on('timeout', () => {
        req.destroy();
        reject({
          error: 'Request timeout',
          responseTime: 10000,
          statusCode: 0
        });
      });

      if (data) {
        req.write(JSON.stringify(data));
      }
      
      req.end();
    });
  }

  async runSingleTest(testName, testFn) {
    console.log(`\\n🧪 Running test: ${testName}`);
    const startTime = performance.now();
    
    try {
      const result = await testFn();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      const testResult = {
        name: testName,
        success: true,
        duration,
        result,
        timestamp: new Date().toISOString()
      };
      
      this.results.tests.push(testResult);
      this.results.summary.passed++;
      
      console.log(`✅ ${testName} - ${duration.toFixed(2)}ms`);
      return testResult;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      const testResult = {
        name: testName,
        success: false,
        duration,
        error: error.message || error,
        timestamp: new Date().toISOString()
      };
      
      this.results.tests.push(testResult);
      this.results.summary.failed++;
      
      console.log(`❌ ${testName} - ${duration.toFixed(2)}ms - ${error.message || error}`);
      return testResult;
    }
  }

  async testHealthCheck() {
    const response = await this.makeRequest('GET', '/health');
    
    if (response.statusCode !== 200) {
      throw new Error(`Health check failed: ${response.statusCode}`);
    }
    
    if (!response.body.status || response.body.status !== 'healthy') {
      throw new Error(`Health check returned unhealthy status: ${response.body.status}`);
    }
    
    return {
      responseTime: response.responseTime,
      status: response.body.status,
      database: response.body.database,
      redis: response.body.redis
    };
  }

  async testEmailServiceStatus() {
    const response = await this.makeRequest('GET', '/api/email/status');
    
    if (response.statusCode !== 200) {
      throw new Error(`Email service status failed: ${response.statusCode}`);
    }
    
    return {
      responseTime: response.responseTime,
      smtpConfigured: response.body.smtpConfigured,
      smtpReady: response.body.smtpReady
    };
  }

  async testAdminAnalytics() {
    const response = await this.makeRequest('GET', '/api/admin/analytics/stats');
    
    if (response.statusCode !== 200) {
      throw new Error(`Admin analytics failed: ${response.statusCode}`);
    }
    
    return {
      responseTime: response.responseTime,
      dataSize: response.size,
      totalBookings: response.body.data?.overview?.totalBookings || 0
    };
  }

  async testDevicesCatalog() {
    const response = await this.makeRequest('GET', '/api/devices/categories');
    
    if (response.statusCode !== 200) {
      throw new Error(`Devices catalog failed: ${response.statusCode}`);
    }
    
    return {
      responseTime: response.responseTime,
      dataSize: response.size,
      deviceCount: response.body?.length || 0
    };
  }

  async testPricingCalculation() {
    const testData = {
      device_id: 'cmd1rthd4001xlfdcj9kfvor7',
      issues: [
        {
          id: 'screen_crack',
          description: 'Cracked screen requiring replacement'
        }
      ],
      service_type: 'standard',
      priority: 'medium'
    };
    
    const response = await this.makeRequest('POST', '/api/pricing/calculate', testData);
    
    if (response.statusCode !== 200) {
      throw new Error(`Pricing calculation failed: ${response.statusCode}`);
    }
    
    return {
      responseTime: response.responseTime,
      calculatedPrice: response.body.pricing?.final_cost || 0,
      quoteId: response.body.quote_id || 'none'
    };
  }

  async loadTest(endpoint, method = 'GET', data = null) {
    console.log(`\\n🔥 Load testing ${method} ${endpoint} with ${this.concurrentUsers} concurrent users for ${this.testDuration/1000}s`);
    
    const startTime = performance.now();
    const endTime = startTime + this.testDuration;
    const results = [];
    let totalRequests = 0;
    let successfulRequests = 0;
    let failedRequests = 0;
    
    const workers = [];
    
    for (let i = 0; i < this.concurrentUsers; i++) {
      const worker = this.runLoadTestWorker(endpoint, method, data, endTime);
      workers.push(worker);
    }
    
    const workerResults = await Promise.all(workers);
    
    // Aggregate results
    for (const workerResult of workerResults) {
      totalRequests += workerResult.totalRequests;
      successfulRequests += workerResult.successfulRequests;
      failedRequests += workerResult.failedRequests;
      results.push(...workerResult.results);
    }
    
    const actualDuration = performance.now() - startTime;
    const requestsPerSecond = totalRequests / (actualDuration / 1000);
    
    const responseTimes = results.map(r => r.responseTime);
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const minResponseTime = Math.min(...responseTimes);
    const maxResponseTime = Math.max(...responseTimes);
    const p95ResponseTime = responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.95)];
    
    const loadTestResult = {
      endpoint,
      method,
      concurrentUsers: this.concurrentUsers,
      duration: actualDuration,
      totalRequests,
      successfulRequests,
      failedRequests,
      requestsPerSecond,
      avgResponseTime,
      minResponseTime,
      maxResponseTime,
      p95ResponseTime,
      successRate: (successfulRequests / totalRequests) * 100
    };
    
    console.log(`📊 Load Test Results:`);
    console.log(`   Total Requests: ${totalRequests}`);
    console.log(`   Successful: ${successfulRequests} (${loadTestResult.successRate.toFixed(2)}%)`);
    console.log(`   Failed: ${failedRequests}`);
    console.log(`   Requests/sec: ${requestsPerSecond.toFixed(2)}`);
    console.log(`   Avg Response Time: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`   95th Percentile: ${p95ResponseTime.toFixed(2)}ms`);
    console.log(`   Min/Max: ${minResponseTime.toFixed(2)}ms / ${maxResponseTime.toFixed(2)}ms`);
    
    return loadTestResult;
  }

  async runLoadTestWorker(endpoint, method, data, endTime) {
    const results = [];
    let totalRequests = 0;
    let successfulRequests = 0;
    let failedRequests = 0;
    
    while (performance.now() < endTime) {
      try {
        const result = await this.makeRequest(method, endpoint, data);
        results.push(result);
        totalRequests++;
        
        if (result.statusCode >= 200 && result.statusCode < 300) {
          successfulRequests++;
        } else {
          failedRequests++;
        }
      } catch (error) {
        results.push({
          responseTime: error.responseTime || 0,
          statusCode: error.statusCode || 0,
          error: error.message || error
        });
        totalRequests++;
        failedRequests++;
      }
      
      // Small delay to prevent overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      results
    };
  }

  async runAllTests() {
    console.log('🚀 Starting RevivaTech Performance Tests\\n');
    console.log(`Target: ${this.baseUrl}`);
    console.log(`Concurrent Users: ${this.concurrentUsers}`);
    console.log(`Test Duration: ${this.testDuration/1000}s`);
    
    const startTime = performance.now();
    
    // Basic functionality tests
    await this.runSingleTest('Health Check', () => this.testHealthCheck());
    await this.runSingleTest('Email Service Status', () => this.testEmailServiceStatus());
    await this.runSingleTest('Admin Analytics', () => this.testAdminAnalytics());
    await this.runSingleTest('Devices Catalog', () => this.testDevicesCatalog());
    await this.runSingleTest('Pricing Calculation', () => this.testPricingCalculation());
    
    // Load tests
    const loadTestResults = [];
    loadTestResults.push(await this.loadTest('/health'));
    loadTestResults.push(await this.loadTest('/api/email/status'));
    loadTestResults.push(await this.loadTest('/api/admin/analytics/stats'));
    loadTestResults.push(await this.loadTest('/api/devices/categories'));
    loadTestResults.push(await this.loadTest('/api/pricing/calculate', 'POST', {
      device_id: 'cmd1rthd4001xlfdcj9kfvor7',
      issues: [{ id: 'screen_crack', description: 'Cracked screen' }],
      service_type: 'standard'
    }));
    
    const endTime = performance.now();
    const totalDuration = endTime - startTime;
    
    // Calculate summary statistics
    this.results.summary.totalTests = this.results.tests.length;
    this.results.summary.averageResponseTime = this.results.tests
      .filter(t => t.success && t.result && t.result.responseTime)
      .reduce((sum, t) => sum + t.result.responseTime, 0) / this.results.summary.passed;
    
    this.results.summary.totalRequests = loadTestResults.reduce((sum, r) => sum + r.totalRequests, 0);
    this.results.summary.requestsPerSecond = loadTestResults.reduce((sum, r) => sum + r.requestsPerSecond, 0) / loadTestResults.length;
    
    this.results.loadTests = loadTestResults;
    this.results.totalDuration = totalDuration;
    
    // Generate report
    this.generateReport();
    
    console.log(`\\n✅ Performance testing completed in ${(totalDuration/1000).toFixed(2)}s`);
    console.log(`📊 Summary: ${this.results.summary.passed}/${this.results.summary.totalTests} tests passed`);
    console.log(`🔥 Average RPS: ${this.results.summary.requestsPerSecond.toFixed(2)}`);
    console.log(`⏱️ Average Response Time: ${this.results.summary.averageResponseTime.toFixed(2)}ms`);
    
    return this.results;
  }

  generateReport() {
    const reportPath = path.join(__dirname, '../Docs/PERFORMANCE_TEST_REPORT.md');
    
    let report = `# RevivaTech Performance Test Report\\n\\n`;
    report += `**Generated**: ${new Date().toISOString()}\\n`;
    report += `**Base URL**: ${this.baseUrl}\\n`;
    report += `**Test Duration**: ${this.testDuration/1000}s\\n`;
    report += `**Concurrent Users**: ${this.concurrentUsers}\\n\\n`;
    
    // Summary
    report += `## 📊 Summary\\n\\n`;
    report += `| Metric | Value |\\n`;
    report += `|--------|-------|\\n`;
    report += `| Total Tests | ${this.results.summary.totalTests} |\\n`;
    report += `| Passed Tests | ${this.results.summary.passed} |\\n`;
    report += `| Failed Tests | ${this.results.summary.failed} |\\n`;
    report += `| Success Rate | ${((this.results.summary.passed/this.results.summary.totalTests)*100).toFixed(2)}% |\\n`;
    report += `| Total Requests | ${this.results.summary.totalRequests} |\\n`;
    report += `| Average RPS | ${this.results.summary.requestsPerSecond.toFixed(2)} |\\n`;
    report += `| Average Response Time | ${this.results.summary.averageResponseTime.toFixed(2)}ms |\\n\\n`;
    
    // Functional Tests
    report += `## 🧪 Functional Tests\\n\\n`;
    report += `| Test | Status | Duration | Notes |\\n`;
    report += `|------|--------|----------|-------|\\n`;
    
    for (const test of this.results.tests) {
      const status = test.success ? '✅ Pass' : '❌ Fail';
      const duration = test.duration.toFixed(2);
      const notes = test.error || (test.result ? 'OK' : '');
      report += `| ${test.name} | ${status} | ${duration}ms | ${notes} |\\n`;
    }
    
    // Load Tests
    report += `\\n## 🔥 Load Tests\\n\\n`;
    report += `| Endpoint | Method | RPS | Avg Response | 95th Percentile | Success Rate |\\n`;
    report += `|----------|--------|-----|--------------|-----------------|--------------|\\n`;
    
    for (const loadTest of this.results.loadTests) {
      report += `| ${loadTest.endpoint} | ${loadTest.method} | ${loadTest.requestsPerSecond.toFixed(2)} | ${loadTest.avgResponseTime.toFixed(2)}ms | ${loadTest.p95ResponseTime.toFixed(2)}ms | ${loadTest.successRate.toFixed(2)}% |\\n`;
    }
    
    // Recommendations
    report += `\\n## 💡 Performance Recommendations\\n\\n`;
    
    const avgResponseTime = this.results.summary.averageResponseTime;
    const avgRPS = this.results.summary.requestsPerSecond;
    
    if (avgResponseTime > 1000) {
      report += `⚠️ **High Response Times**: Average response time is ${avgResponseTime.toFixed(2)}ms. Consider:\\n`;
      report += `- Database query optimization\\n`;
      report += `- Redis caching implementation\\n`;
      report += `- API response compression\\n\\n`;
    } else if (avgResponseTime > 500) {
      report += `⚠️ **Moderate Response Times**: Average response time is ${avgResponseTime.toFixed(2)}ms. Consider:\\n`;
      report += `- Database indexing optimization\\n`;
      report += `- Response caching for frequently accessed data\\n\\n`;
    } else {
      report += `✅ **Good Response Times**: Average response time is ${avgResponseTime.toFixed(2)}ms\\n\\n`;
    }
    
    if (avgRPS < 10) {
      report += `⚠️ **Low Throughput**: Average RPS is ${avgRPS.toFixed(2)}. Consider:\\n`;
      report += `- Connection pooling optimization\\n`;
      report += `- Load balancing implementation\\n`;
      report += `- Horizontal scaling\\n\\n`;
    } else if (avgRPS < 50) {
      report += `⚠️ **Moderate Throughput**: Average RPS is ${avgRPS.toFixed(2)}. Consider:\\n`;
      report += `- Database connection optimization\\n`;
      report += `- Caching layer implementation\\n\\n`;
    } else {
      report += `✅ **Good Throughput**: Average RPS is ${avgRPS.toFixed(2)}\\n\\n`;
    }
    
    // System Health
    report += `## 🏥 System Health\\n\\n`;
    const healthTest = this.results.tests.find(t => t.name === 'Health Check');
    if (healthTest && healthTest.success) {
      report += `- Database: ${healthTest.result.database}\\n`;
      report += `- Redis: ${healthTest.result.redis}\\n`;
      report += `- Overall Status: ${healthTest.result.status}\\n\\n`;
    }
    
    // Next Steps
    report += `## 🚀 Next Steps\\n\\n`;
    report += `1. **Monitoring**: Set up continuous performance monitoring\\n`;
    report += `2. **Optimization**: Implement recommended performance improvements\\n`;
    report += `3. **Scaling**: Plan for horizontal scaling based on load test results\\n`;
    report += `4. **Alerting**: Configure alerts for performance degradation\\n`;
    report += `5. **Regular Testing**: Schedule regular performance tests\\n\\n`;
    
    report += `---\\n`;
    report += `*Generated by RevivaTech Performance Testing Suite*\\n`;
    
    fs.writeFileSync(reportPath, report);
    console.log(`\\n📄 Performance report generated: ${reportPath}`);
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new PerformanceTester();
  tester.runAllTests()
    .then(results => {
      console.log('\\n🎉 All performance tests completed!');
      process.exit(results.summary.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('❌ Performance testing failed:', error);
      process.exit(1);
    });
}

module.exports = PerformanceTester;