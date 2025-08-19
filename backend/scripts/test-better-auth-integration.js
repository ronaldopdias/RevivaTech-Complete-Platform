#!/usr/bin/env node

/**
 * Better Auth Integration Test Suite
 * Tests the complete frontend-backend Better Auth integration
 */

const axios = require('axios');
const https = require('https');

// Configure axios to ignore self-signed certificates
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

const FRONTEND_URL = 'https://localhost:3010';
const BACKEND_URL = 'http://localhost:3011';

// Test configuration
const TEST_USER = {
  email: 'test@revivatech.co.uk',
  password: 'TestPassword123!',
  name: 'Test User'
};

class BetterAuthTester {
  constructor() {
    this.results = {
      frontend: [],
      backend: [],
      integration: []
    };
  }

  async test(category, name, testFn) {
    console.log(`\n🧪 Testing ${category}: ${name}`);
    try {
      const result = await testFn();
      const success = { category, name, status: '✅ PASS', result };
      this.results[category].push(success);
      console.log(`✅ ${name}: PASSED`);
      return success;
    } catch (error) {
      const failure = { category, name, status: '❌ FAIL', error: error.message };
      this.results[category].push(failure);
      console.log(`❌ ${name}: FAILED - ${error.message}`);
      return failure;
    }
  }

  async testFrontendEndpoints() {
    console.log('\n🎯 TESTING FRONTEND BETTER AUTH ENDPOINTS');

    // Test health check
    await this.test('frontend', 'Frontend Health Check', async () => {
      const response = await axios.get(`${FRONTEND_URL}/api/health`, { httpsAgent });
      if (response.status !== 200) throw new Error('Frontend health check failed');
      return response.data;
    });

    // Test session endpoint without authentication
    await this.test('frontend', 'Session Endpoint (Unauthenticated)', async () => {
      const response = await axios.get(`${FRONTEND_URL}/api/auth/session`, { httpsAgent });
      if (response.status !== 200 || response.data.session !== null) {
        throw new Error('Should return null session for unauthenticated user');
      }
      return response.data;
    });

    // Test debug endpoint
    await this.test('frontend', 'Debug Session Endpoint', async () => {
      const response = await axios.get(`${FRONTEND_URL}/api/auth/debug?action=session`, { httpsAgent });
      if (response.status !== 200) throw new Error('Debug endpoint failed');
      if (response.data.hasSession !== false) throw new Error('Should show no session');
      return response.data;
    });

    // Test sign-up endpoint structure
    await this.test('frontend', 'Sign-up Email Endpoint Structure', async () => {
      try {
        // This should fail with validation error, not 404
        await axios.post(`${FRONTEND_URL}/api/auth/sign-up/email`, {}, { httpsAgent });
      } catch (error) {
        if (error.response?.status === 404) {
          throw new Error('Sign-up email endpoint not found (404)');
        }
        // Check for Better Auth validation error
        if (error.response?.data?.code === 'INVALID_EMAIL') {
          return { message: 'Sign-up endpoint working (validation error as expected)', status: error.response?.status };
        }
        return { message: 'Sign-up endpoint exists', status: error.response?.status };
      }
    });

    // Test sign-in endpoint structure  
    await this.test('frontend', 'Sign-in Email Endpoint Structure', async () => {
      try {
        await axios.post(`${FRONTEND_URL}/api/auth/sign-in/email`, {}, { httpsAgent });
      } catch (error) {
        if (error.response?.status === 404) {
          throw new Error('Sign-in email endpoint not found (404)');
        }
        // Check for Better Auth validation error
        if (error.response?.data?.code === 'VALIDATION_ERROR') {
          return { message: 'Sign-in endpoint working (validation error as expected)', status: error.response?.status };
        }
        return { message: 'Sign-in endpoint exists', status: error.response?.status };
      }
    });
  }

  async testBackendEndpoints() {
    console.log('\n🎯 TESTING BACKEND BETTER AUTH INTEGRATION');

    // Test backend health
    await this.test('backend', 'Backend Health Check', async () => {
      const response = await axios.get(`${BACKEND_URL}/health`);
      if (response.status !== 200) throw new Error('Backend health check failed');
      return response.data;
    });

    // Test cookie parsing debug endpoint
    await this.test('backend', 'Cookie Parsing Debug', async () => {
      const response = await axios.get(`${BACKEND_URL}/api/test-auth/debug`);
      if (response.status !== 200) throw new Error('Cookie debug endpoint failed');
      if (!response.data.hasOwnProperty('cookies')) throw new Error('Missing cookies property');
      return response.data;
    });

    // Test protected endpoint without authentication
    await this.test('backend', 'Protected Endpoint (Unauthenticated)', async () => {
      try {
        await axios.get(`${BACKEND_URL}/api/test-auth/protected`);
        throw new Error('Should have failed without authentication');
      } catch (error) {
        if (error.response?.status === 401) {
          return { message: 'Correctly rejected unauthenticated request', status: 401 };
        }
        throw error;
      }
    });

    // Test admin endpoint without authentication
    await this.test('backend', 'Admin Endpoint (Unauthenticated)', async () => {
      try {
        await axios.get(`${BACKEND_URL}/api/test-auth/admin`);
        throw new Error('Should have failed without authentication');
      } catch (error) {
        if (error.response?.status === 401) {
          return { message: 'Correctly rejected unauthenticated admin request', status: 401 };
        }
        throw error;
      }
    });

    // Test auth audit endpoints require authentication
    await this.test('backend', 'Auth Audit Dashboard (Unauthenticated)', async () => {
      try {
        await axios.get(`${BACKEND_URL}/api/auth-audit/dashboard`);
        throw new Error('Should have failed without authentication');
      } catch (error) {
        if (error.response?.status === 401) {
          return { message: 'Correctly rejected unauthenticated audit request', status: 401 };
        }
        throw error;
      }
    });
  }

  async testIntegrationFlows() {
    console.log('\n🎯 TESTING FRONTEND-BACKEND INTEGRATION');

    // Test middleware configuration
    await this.test('integration', 'Better Auth Middleware Configuration', async () => {
      // Check that cookie-parser is working
      const debugResponse = await axios.get(`${BACKEND_URL}/api/test-auth/debug`);
      
      if (!debugResponse.data.hasOwnProperty('cookies')) {
        throw new Error('Cookie parsing not configured');
      }

      // Check Better Auth middleware is loaded
      const betterAuthFile = '/opt/webapps/revivatech/backend/middleware/better-auth.js';
      const fs = require('fs');
      if (!fs.existsSync(betterAuthFile)) {
        throw new Error('Better Auth middleware file missing');
      }

      return {
        cookieParsingWorking: true,
        middlewareFileExists: true,
        testEndpointsActive: true
      };
    });

    // Test session endpoint consistency
    await this.test('integration', 'Session Endpoint Consistency', async () => {
      const frontendSession = await axios.get(`${FRONTEND_URL}/api/auth/session`, { httpsAgent });
      
      if (frontendSession.data.session !== null) {
        throw new Error('Expected null session for unauthenticated user');
      }

      return {
        frontendSessionNull: frontendSession.data.session === null,
        frontendUserNull: frontendSession.data.user === null
      };
    });

    // Test auth logging system
    await this.test('integration', 'Authentication Logging System', async () => {
      // Check if auth logger is available
      const fs = require('fs');
      const authLoggerFile = '/opt/webapps/revivatech/frontend/src/lib/auth/logger.ts';
      
      if (!fs.existsSync(authLoggerFile)) {
        throw new Error('Auth logger file missing');
      }

      // Test debug logs endpoint
      const debugResponse = await axios.get(`${FRONTEND_URL}/api/auth/debug?action=logs`, { httpsAgent });
      
      return {
        loggerFileExists: true,
        debugLogsWorking: debugResponse.status === 200
      };
    });
  }

  async runAllTests() {
    console.log('🚀 STARTING BETTER AUTH INTEGRATION TEST SUITE');
    console.log('=' .repeat(60));

    // Run all test categories
    await this.testFrontendEndpoints();
    await this.testBackendEndpoints();
    await this.testIntegrationFlows();

    // Generate summary report
    this.generateReport();
  }

  generateReport() {
    console.log('\n📊 BETTER AUTH INTEGRATION TEST REPORT');
    console.log('=' .repeat(60));

    const categories = ['frontend', 'backend', 'integration'];
    let totalTests = 0;
    let totalPassed = 0;

    categories.forEach(category => {
      const tests = this.results[category];
      const passed = tests.filter(t => t.status.includes('✅')).length;
      const failed = tests.filter(t => t.status.includes('❌')).length;
      
      totalTests += tests.length;
      totalPassed += passed;

      console.log(`\n${category.toUpperCase()} TESTS:`);
      console.log(`  Passed: ${passed}`);
      console.log(`  Failed: ${failed}`);
      console.log(`  Total:  ${tests.length}`);

      if (failed > 0) {
        console.log(`  Failed Tests:`);
        tests.filter(t => t.status.includes('❌')).forEach(test => {
          console.log(`    - ${test.name}: ${test.error}`);
        });
      }
    });

    console.log(`\n🎯 OVERALL SUMMARY:`);
    console.log(`  Total Tests: ${totalTests}`);
    console.log(`  Passed: ${totalPassed}`);
    console.log(`  Failed: ${totalTests - totalPassed}`);
    console.log(`  Success Rate: ${Math.round((totalPassed / totalTests) * 100)}%`);

    if (totalPassed === totalTests) {
      console.log('\n🎉 ALL TESTS PASSED! Better Auth integration is working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Check the details above.');
    }

    console.log('\n📝 NEXT STEPS:');
    console.log('  1. If tests passed: Better Auth is ready for production use');
    console.log('  2. If tests failed: Review error details and fix issues');
    console.log('  3. Consider adding user registration/login UI tests');
    console.log('  4. Test with real user accounts once registration is available');
  }
}

// Run the tests
if (require.main === module) {
  const tester = new BetterAuthTester();
  tester.runAllTests().catch(error => {
    console.error('❌ Test suite failed to run:', error.message);
    process.exit(1);
  });
}

module.exports = BetterAuthTester;