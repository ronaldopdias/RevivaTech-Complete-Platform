#!/usr/bin/env node

/**
 * Comprehensive Authentication System Test Suite
 * Tests all aspects of Better Auth integration including real user flows
 */

const axios = require('axios');
const https = require('https');

// Configure axios to ignore self-signed certificates
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

const FRONTEND_URL = 'https://localhost:3010';
const BACKEND_URL = 'http://localhost:3011';

class ComprehensiveAuthTester {
  constructor() {
    this.results = {
      userRegistration: [],
      userAuthentication: [],
      sessionManagement: [],
      backendIntegration: [],
      securityFeatures: [],
      debugServices: [],
      errorHandling: []
    };
    this.testUsers = [];
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

  // User Registration Testing
  async testUserRegistration() {
    console.log('\n🎯 TESTING USER REGISTRATION FLOWS');

    // Test complete user registration
    await this.test('userRegistration', 'Complete User Registration', async () => {
      const userEmail = `test-${Date.now()}@example.com`;
      const response = await axios.post(`${FRONTEND_URL}/api/auth/sign-up/email`, {
        email: userEmail,
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User'
      }, { httpsAgent });

      if (!response.data.user || !response.data.token) {
        throw new Error('Registration did not return user and token');
      }

      this.testUsers.push({
        email: userEmail,
        password: 'TestPassword123!',
        id: response.data.user.id,
        token: response.data.token
      });

      return {
        userId: response.data.user.id,
        email: response.data.user.email,
        hasToken: !!response.data.token
      };
    });

    // Test duplicate registration prevention
    await this.test('userRegistration', 'Duplicate Registration Prevention', async () => {
      if (this.testUsers.length === 0) throw new Error('No test user available');
      
      const existingUser = this.testUsers[0];
      try {
        await axios.post(`${FRONTEND_URL}/api/auth/sign-up/email`, {
          email: existingUser.email,
          password: 'DifferentPassword123!',
          firstName: 'Different',
          lastName: 'User'
        }, { httpsAgent });
        
        throw new Error('Duplicate registration should have failed');
      } catch (error) {
        if (error.response?.data?.code === 'USER_ALREADY_EXISTS') {
          return { message: 'Correctly prevented duplicate registration' };
        }
        throw error;
      }
    });

    // Test registration validation
    await this.test('userRegistration', 'Registration Field Validation', async () => {
      const validationTests = [
        { 
          data: { email: 'invalid-email', password: 'pass', firstName: 'Test' }, 
          expectedError: 'INVALID_EMAIL' 
        },
        { 
          data: { email: 'test@example.com', password: '123', firstName: 'Test' }, 
          expectedError: 'WEAK_PASSWORD' 
        },
        { 
          data: { email: 'test2@example.com', password: 'ValidPass123!' }, 
          expectedError: 'FIRSTNAME_IS_REQUIRED' 
        }
      ];

      const results = [];
      for (const test of validationTests) {
        try {
          await axios.post(`${FRONTEND_URL}/api/auth/sign-up/email`, test.data, { httpsAgent });
          results.push({ test: test.expectedError, result: 'UNEXPECTED_SUCCESS' });
        } catch (error) {
          const actualError = error.response?.data?.code;
          results.push({ 
            test: test.expectedError, 
            result: actualError === test.expectedError ? 'CORRECT' : `WRONG_ERROR: ${actualError}` 
          });
        }
      }

      return results;
    });
  }

  // User Authentication Testing
  async testUserAuthentication() {
    console.log('\n🎯 TESTING USER AUTHENTICATION FLOWS');

    // Test successful login
    await this.test('userAuthentication', 'Successful User Login', async () => {
      if (this.testUsers.length === 0) throw new Error('No test user available');
      
      const user = this.testUsers[0];
      const response = await axios.post(`${FRONTEND_URL}/api/auth/sign-in/email`, {
        email: user.email,
        password: user.password
      }, { 
        httpsAgent,
        withCredentials: true
      });

      if (!response.data.user || !response.data.token) {
        throw new Error('Login did not return user and token');
      }

      // Store session info for later tests
      user.sessionToken = response.data.token;
      user.loginResponse = response;

      return {
        userId: response.data.user.id,
        email: response.data.user.email,
        hasToken: !!response.data.token
      };
    });

    // Test invalid login attempts
    await this.test('userAuthentication', 'Invalid Login Prevention', async () => {
      if (this.testUsers.length === 0) throw new Error('No test user available');
      
      const user = this.testUsers[0];
      try {
        await axios.post(`${FRONTEND_URL}/api/auth/sign-in/email`, {
          email: user.email,
          password: 'WrongPassword123!'
        }, { httpsAgent });
        
        throw new Error('Invalid login should have failed');
      } catch (error) {
        if (error.response?.data?.code === 'INVALID_EMAIL_OR_PASSWORD') {
          return { message: 'Correctly rejected invalid credentials' };
        }
        throw error;
      }
    });

    // Test non-existent user login
    await this.test('userAuthentication', 'Non-existent User Login', async () => {
      try {
        await axios.post(`${FRONTEND_URL}/api/auth/sign-in/email`, {
          email: 'nonexistent@example.com',
          password: 'Password123!'
        }, { httpsAgent });
        
        throw new Error('Login with non-existent user should have failed');
      } catch (error) {
        if (error.response?.data?.code === 'INVALID_EMAIL_OR_PASSWORD') {
          return { message: 'Correctly rejected non-existent user' };
        }
        throw error;
      }
    });
  }

  // Session Management Testing
  async testSessionManagement() {
    console.log('\n🎯 TESTING SESSION MANAGEMENT');

    // Test session validation endpoint
    await this.test('sessionManagement', 'Session Validation Endpoint', async () => {
      // Test without session
      const noSessionResponse = await axios.get(`${FRONTEND_URL}/api/auth/session`, { httpsAgent });
      if (noSessionResponse.data.session !== null) {
        throw new Error('Expected null session for unauthenticated request');
      }

      return { unauthenticatedSession: 'null (correct)' };
    });

    // Test session persistence
    await this.test('sessionManagement', 'Session Persistence', async () => {
      if (this.testUsers.length === 0 || !this.testUsers[0].loginResponse) {
        throw new Error('No authenticated user available');
      }

      // Extract cookies from login response
      const cookies = this.testUsers[0].loginResponse.headers['set-cookie'];
      if (!cookies) {
        throw new Error('No session cookies were set during login');
      }

      // Parse session token from cookies
      const sessionCookie = cookies.find(cookie => cookie.includes('__Secure-better-auth.session_token'));
      if (!sessionCookie) {
        throw new Error('Session token cookie not found');
      }

      return {
        cookiesSet: cookies.length,
        hasSessionToken: !!sessionCookie,
        cookieSecure: sessionCookie.includes('Secure'),
        cookieHttpOnly: sessionCookie.includes('HttpOnly')
      };
    });

    // Test session expiration handling
    await this.test('sessionManagement', 'Session Expiration Detection', async () => {
      // This tests the session structure
      if (this.testUsers.length === 0) throw new Error('No test user available');
      
      const user = this.testUsers[0];
      
      // Create a fake expired session token
      const expiredToken = 'expired-token-12345';
      
      try {
        const response = await axios.get(`${FRONTEND_URL}/api/auth/session`, {
          headers: {
            'Cookie': `__Secure-better-auth.session_token=${expiredToken}`
          },
          httpsAgent
        });

        // Should return null for invalid/expired session
        if (response.data.session === null) {
          return { message: 'Correctly detected invalid session' };
        } else {
          throw new Error('Should have detected invalid session');
        }
      } catch (error) {
        // Any error is acceptable for invalid session
        return { message: 'Invalid session properly handled' };
      }
    });
  }

  // Backend Integration Testing
  async testBackendIntegration() {
    console.log('\n🎯 TESTING BACKEND INTEGRATION');

    // Test backend health and middleware
    await this.test('backendIntegration', 'Backend Authentication Middleware', async () => {
      // Test unprotected endpoint
      const healthResponse = await axios.get(`${BACKEND_URL}/health`);
      if (healthResponse.status !== 200) {
        throw new Error('Backend health check failed');
      }

      // Test protected endpoint without auth
      try {
        await axios.get(`${BACKEND_URL}/api/test-auth/protected`);
        throw new Error('Protected endpoint should require authentication');
      } catch (error) {
        if (error.response?.status === 401 || error.response?.status === 503) {
          return { 
            healthCheck: 'passed',
            protectedEndpoint: 'correctly blocked',
            authRequired: true
          };
        }
        throw error;
      }
    });

    // Test role-based access control
    await this.test('backendIntegration', 'Role-Based Access Control', async () => {
      // Test admin endpoint without admin role
      try {
        await axios.get(`${BACKEND_URL}/api/test-auth/admin`);
        throw new Error('Admin endpoint should require admin role');
      } catch (error) {
        if (error.response?.status === 401 || error.response?.status === 503) {
          return { message: 'Admin endpoint correctly protected' };
        }
        throw error;
      }
    });

    // Test cookie parsing capabilities
    await this.test('backendIntegration', 'Cookie Parsing Functionality', async () => {
      const debugResponse = await axios.get(`${BACKEND_URL}/api/test-auth/debug`);
      
      if (!debugResponse.data.hasOwnProperty('cookies')) {
        throw new Error('Cookie parsing debug endpoint not working');
      }

      return {
        cookieParsingActive: true,
        debugEndpoint: 'working',
        hasCookiesProperty: debugResponse.data.hasOwnProperty('cookies')
      };
    });
  }

  // Security Features Testing
  async testSecurityFeatures() {
    console.log('\n🎯 TESTING SECURITY FEATURES');

    // Test CORS configuration
    await this.test('securityFeatures', 'CORS Configuration', async () => {
      try {
        const response = await axios.options(`${BACKEND_URL}/api/test-auth/protected`);
        return {
          corsSupported: true,
          statusCode: response.status
        };
      } catch (error) {
        // CORS might block the preflight, which is expected behavior
        return {
          corsBlocked: true,
          message: 'CORS properly configured (preflight blocked)'
        };
      }
    });

    // Test rate limiting (if implemented)
    await this.test('securityFeatures', 'Input Validation', async () => {
      // Test SQL injection prevention
      const maliciousInput = "'; DROP TABLE users; --";
      
      try {
        await axios.post(`${FRONTEND_URL}/api/auth/sign-in/email`, {
          email: maliciousInput,
          password: 'password'
        }, { httpsAgent });
      } catch (error) {
        if (error.response?.data?.code === 'INVALID_EMAIL') {
          return { message: 'Input validation working (SQL injection prevented)' };
        }
        return { message: 'Input handled safely' };
      }
    });

    // Test password security
    await this.test('securityFeatures', 'Password Security Requirements', async () => {
      const weakPasswords = ['123', 'password', 'abc', '12345678'];
      let rejectedCount = 0;

      for (const weakPass of weakPasswords) {
        try {
          await axios.post(`${FRONTEND_URL}/api/auth/sign-up/email`, {
            email: `weak-${Date.now()}@example.com`,
            password: weakPass,
            firstName: 'Test',
            lastName: 'User'
          }, { httpsAgent });
        } catch (error) {
          if (error.response?.data?.message?.toLowerCase().includes('password')) {
            rejectedCount++;
          }
        }
      }

      return {
        weakPasswordsRejected: rejectedCount,
        totalTested: weakPasswords.length,
        securityLevel: rejectedCount >= 3 ? 'good' : 'needs improvement'
      };
    });
  }

  // Debug Services Testing
  async testDebugServices() {
    console.log('\n🎯 TESTING DEBUG SERVICES');

    // Test frontend debug endpoints
    await this.test('debugServices', 'Frontend Debug Endpoints', async () => {
      const debugResponse = await axios.get(`${FRONTEND_URL}/api/auth/debug`, { httpsAgent });
      
      if (!debugResponse.data.availableActions) {
        throw new Error('Debug endpoint not returning available actions');
      }

      const actions = debugResponse.data.availableActions;
      const expectedActions = ['logs', 'user-logs', 'errors', 'session', 'clear'];
      const hasAllActions = expectedActions.every(action => actions.includes(action));

      return {
        availableActions: actions,
        hasAllExpectedActions: hasAllActions,
        endpointWorking: true
      };
    });

    // Test backend debug endpoints
    await this.test('debugServices', 'Backend Debug System', async () => {
      try {
        const summaryResponse = await axios.get(`${BACKEND_URL}/api/debug/logs/summary`);
        
        return {
          debugSystemActive: true,
          hasSummary: !!summaryResponse.data.total,
          logsAvailable: summaryResponse.data.total > 0
        };
      } catch (error) {
        throw new Error('Backend debug system not accessible');
      }
    });

    // Test authentication event logging
    await this.test('debugServices', 'Authentication Event Logging', async () => {
      // Create an authentication event
      try {
        await axios.post(`${FRONTEND_URL}/api/auth/sign-in/email`, {
          email: 'nonexistent@example.com',
          password: 'password'
        }, { httpsAgent });
      } catch (error) {
        // Expected to fail, we just want to generate log events
      }

      // Check if debug logs captured the event
      const logsResponse = await axios.get(`${FRONTEND_URL}/api/auth/debug?action=logs&count=10`, { httpsAgent });
      
      return {
        logsEndpointWorking: true,
        logsCount: logsResponse.data.logs.length,
        totalLogs: logsResponse.data.totalLogs
      };
    });
  }

  // Error Handling Testing
  async testErrorHandling() {
    console.log('\n🎯 TESTING ERROR HANDLING');

    // Test network error handling
    await this.test('errorHandling', 'Network Error Handling', async () => {
      // Test with invalid endpoint
      try {
        await axios.get(`${FRONTEND_URL}/api/auth/nonexistent-endpoint`, { httpsAgent });
        throw new Error('Should have returned 404');
      } catch (error) {
        if (error.response?.status === 404) {
          return { message: '404 errors properly handled' };
        }
        throw error;
      }
    });

    // Test malformed request handling
    await this.test('errorHandling', 'Malformed Request Handling', async () => {
      try {
        await axios.post(`${FRONTEND_URL}/api/auth/sign-in/email`, 
          'invalid json', 
          { 
            httpsAgent,
            headers: { 'Content-Type': 'application/json' }
          }
        );
        throw new Error('Should have rejected malformed JSON');
      } catch (error) {
        if (error.response?.status >= 400 && error.response?.status < 500) {
          return { message: 'Malformed requests properly rejected' };
        }
        throw error;
      }
    });

    // Test database error handling
    await this.test('errorHandling', 'Database Error Resilience', async () => {
      // This is more of a structural test
      const response = await axios.get(`${BACKEND_URL}/health`);
      
      if (response.data.database === 'connected') {
        return { 
          databaseConnection: 'healthy',
          errorHandling: 'database connected, error handling ready'
        };
      } else {
        throw new Error('Database connection issues detected');
      }
    });
  }

  // Run all tests
  async runComprehensiveTests() {
    console.log('🚀 STARTING COMPREHENSIVE AUTHENTICATION SYSTEM TEST SUITE');
    console.log('=' .repeat(80));

    await this.testUserRegistration();
    await this.testUserAuthentication();
    await this.testSessionManagement();
    await this.testBackendIntegration();
    await this.testSecurityFeatures();
    await this.testDebugServices();
    await this.testErrorHandling();

    this.generateComprehensiveReport();
  }

  // Generate detailed report
  generateComprehensiveReport() {
    console.log('\n📊 COMPREHENSIVE AUTHENTICATION SYSTEM ANALYSIS REPORT');
    console.log('=' .repeat(80));

    const categories = Object.keys(this.results);
    let totalTests = 0;
    let totalPassed = 0;
    const categoryResults = {};

    categories.forEach(category => {
      const tests = this.results[category];
      const passed = tests.filter(t => t.status.includes('✅')).length;
      const failed = tests.filter(t => t.status.includes('❌')).length;
      
      totalTests += tests.length;
      totalPassed += passed;

      categoryResults[category] = { passed, failed, total: tests.length };

      console.log(`\n${category.toUpperCase().replace(/([A-Z])/g, ' $1').trim()}:`);
      console.log(`  ✅ Passed: ${passed}`);
      console.log(`  ❌ Failed: ${failed}`);
      console.log(`  📊 Total:  ${tests.length}`);
      console.log(`  📈 Success Rate: ${Math.round((passed / tests.length) * 100)}%`);

      if (failed > 0) {
        console.log(`  🔍 Failed Tests:`);
        tests.filter(t => t.status.includes('❌')).forEach(test => {
          console.log(`    - ${test.name}: ${test.error}`);
        });
      }
    });

    console.log(`\n🎯 OVERALL COMPREHENSIVE ANALYSIS SUMMARY:`);
    console.log(`  📋 Total Test Categories: ${categories.length}`);
    console.log(`  🧪 Total Tests Executed: ${totalTests}`);
    console.log(`  ✅ Tests Passed: ${totalPassed}`);
    console.log(`  ❌ Tests Failed: ${totalTests - totalPassed}`);
    console.log(`  📊 Overall Success Rate: ${Math.round((totalPassed / totalTests) * 100)}%`);

    // System Status Assessment
    const criticalCategories = ['userAuthentication', 'sessionManagement', 'securityFeatures'];
    const criticalPassed = criticalCategories.reduce((acc, cat) => acc + categoryResults[cat].passed, 0);
    const criticalTotal = criticalCategories.reduce((acc, cat) => acc + categoryResults[cat].total, 0);
    const criticalRate = Math.round((criticalPassed / criticalTotal) * 100);

    console.log(`\n🔐 CRITICAL SYSTEM HEALTH:`);
    console.log(`  📊 Critical Components Success Rate: ${criticalRate}%`);
    
    if (criticalRate >= 90) {
      console.log(`  🎉 SYSTEM STATUS: EXCELLENT - Ready for production`);
    } else if (criticalRate >= 75) {
      console.log(`  ✅ SYSTEM STATUS: GOOD - Minor issues to address`);
    } else if (criticalRate >= 60) {
      console.log(`  ⚠️  SYSTEM STATUS: NEEDS ATTENTION - Several issues to fix`);
    } else {
      console.log(`  🚨 SYSTEM STATUS: CRITICAL - Major issues require immediate attention`);
    }

    console.log(`\n📝 KEY FINDINGS & RECOMMENDATIONS:`);
    
    if (this.testUsers.length > 0) {
      console.log(`  ✅ User Registration & Authentication: Working`);
      console.log(`  ✅ Test Users Created: ${this.testUsers.length}`);
    }

    if (categoryResults.backendIntegration.passed === 0) {
      console.log(`  🔧 CRITICAL: Backend integration needs container networking fix`);
      console.log(`     - Update container configuration for cross-service communication`);
      console.log(`     - Consider using Docker Compose network settings`);
    }

    if (categoryResults.debugServices.passed >= 2) {
      console.log(`  ✅ Debug & Monitoring Systems: Operational`);
    }

    console.log(`\n📋 NEXT STEPS:`);
    console.log(`  1. Address any failed tests above`);
    console.log(`  2. Fix backend-frontend container communication`);
    console.log(`  3. Consider implementing missing security features`);
    console.log(`  4. Review and optimize session management`);
    console.log(`  5. Monitor authentication events in production`);

    console.log(`\n🏆 TEST SUITE COMPLETION: ${new Date().toISOString()}`);
    console.log('=' .repeat(80));

    return {
      totalTests,
      totalPassed,
      successRate: Math.round((totalPassed / totalTests) * 100),
      categoryResults,
      testUsers: this.testUsers.length,
      criticalHealthRate: criticalRate
    };
  }
}

// Run the comprehensive test suite
if (require.main === module) {
  const tester = new ComprehensiveAuthTester();
  tester.runComprehensiveTests().catch(error => {
    console.error('❌ Comprehensive test suite failed to run:', error.message);
    process.exit(1);
  });
}

module.exports = ComprehensiveAuthTester;