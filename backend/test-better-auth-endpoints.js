/**
 * Test Actual Better Auth Endpoints
 * Based on the client configuration, test the endpoints it expects
 */

const axios = require('axios');

async function testBetterAuthEndpoints() {
  const baseURL = 'http://localhost:3011';
  
  // Endpoints used by the frontend client
  const clientEndpoints = [
    '/api/auth/get-session',  // Used by refreshSession()
    '/api/auth/sign-in/email', // Used by signIn.email()
    '/api/auth/sign-up',
    '/api/auth/sign-out'
  ];

  // Standard Better Auth endpoints to also test
  const standardEndpoints = [
    '/api/auth/session',
    '/api/auth/signin/email',
    '/api/auth/signup',
    '/api/auth/signout'
  ];

  console.log('🔍 Testing client-expected Better Auth endpoints...\n');

  const allEndpoints = [...new Set([...clientEndpoints, ...standardEndpoints])];

  for (const endpoint of allEndpoints) {
    for (const method of ['GET', 'POST']) {
      try {
        console.log(`Testing ${method} ${endpoint}...`);
        
        const config = {
          method: method,
          url: `${baseURL}${endpoint}`,
          timeout: 2000,
          validateStatus: () => true,
        };

        // Add body for POST requests
        if (method === 'POST') {
          config.headers = { 'Content-Type': 'application/json' };
          config.data = {};
        }

        const response = await axios(config);
        
        if (response.status === 404) {
          console.log(`❌ ${method} ${endpoint}: 404 Not Found`);
        } else {
          console.log(`✅ ${method} ${endpoint}: ${response.status} ${response.statusText}`);
          if (response.data) {
            const preview = typeof response.data === 'string' 
              ? response.data.substring(0, 60)
              : JSON.stringify(response.data).substring(0, 60);
            console.log(`   Response: ${preview}...`);
          }
        }
      } catch (error) {
        if (error.code === 'ECONNABORTED') {
          console.log(`⏱️  ${method} ${endpoint}: Timeout`);
        } else {
          console.log(`❌ ${method} ${endpoint}: ${error.message}`);
        }
      }
    }
    console.log('');
  }

  // Test the Better Auth API object directly
  console.log('\n🔍 Testing Better Auth API object...');
  try {
    const auth = require('./lib/better-auth-fixed');
    console.log('Auth API keys:', Object.keys(auth.api || {}));
    
    // List available API endpoints
    if (auth.api) {
      console.log('Available API methods:');
      Object.keys(auth.api).forEach(key => {
        const endpoint = auth.api[key];
        console.log(`  ${key}:`, typeof endpoint, Object.keys(endpoint || {}));
      });
    }
  } catch (error) {
    console.error('Failed to inspect auth API:', error.message);
  }
}

testBetterAuthEndpoints().catch(console.error);