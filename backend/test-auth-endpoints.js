/**
 * Test Better Auth Endpoints
 */
const axios = require('axios');

async function testAuthEndpoints() {
  const baseURL = 'http://localhost:3011';
  const endpoints = [
    '/api/auth',
    '/api/auth/session',
    '/api/auth/sign-in',  
    '/api/auth/sign-up',
    '/api/auth/sign-out'
  ];

  console.log('🔍 Testing Better Auth endpoints...\n');

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint}...`);
      const response = await axios.get(`${baseURL}${endpoint}`, {
        timeout: 3000,
        validateStatus: () => true // Accept all status codes
      });
      console.log(`✅ ${endpoint}: ${response.status} ${response.statusText}`);
      if (response.data && typeof response.data === 'object') {
        console.log(`   Response: ${JSON.stringify(response.data).substring(0, 100)}...`);
      }
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        console.log(`⏱️  ${endpoint}: Timeout (>3s)`);
      } else {
        console.log(`❌ ${endpoint}: ${error.message}`);
      }
    }
    console.log('');
  }
}

testAuthEndpoints().catch(console.error);