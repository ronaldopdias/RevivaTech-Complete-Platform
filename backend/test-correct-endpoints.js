/**
 * Test Correct Better Auth Endpoints
 */
const axios = require('axios');

async function testCorrectEndpoints() {
  const baseURL = 'http://localhost:3011';
  
  // Better Auth 1.3.7 standard endpoints
  const endpoints = [
    { path: '/api/auth', method: 'GET' },
    { path: '/api/auth/session', method: 'GET' },
    { path: '/api/auth/signin', method: 'GET' },
    { path: '/api/auth/signin', method: 'POST' },
    { path: '/api/auth/signup', method: 'GET' },
    { path: '/api/auth/signup', method: 'POST' },
    { path: '/api/auth/signout', method: 'POST' },
    { path: '/api/auth/email/signin', method: 'POST' },
    { path: '/api/auth/email/signup', method: 'POST' },
  ];

  console.log('🔍 Testing Better Auth 1.3.7 standard endpoints...\n');

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint.method} ${endpoint.path}...`);
      const response = await axios({
        method: endpoint.method,
        url: `${baseURL}${endpoint.path}`,
        timeout: 2000,
        validateStatus: () => true,
        ...(endpoint.method === 'POST' ? {
          headers: { 'Content-Type': 'application/json' },
          data: {}
        } : {})
      });
      
      console.log(`✅ ${endpoint.method} ${endpoint.path}: ${response.status} ${response.statusText}`);
      if (response.data && response.status !== 404) {
        const preview = typeof response.data === 'string' 
          ? response.data.substring(0, 100)
          : JSON.stringify(response.data).substring(0, 100);
        console.log(`   Response: ${preview}...`);
      }
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        console.log(`⏱️  ${endpoint.method} ${endpoint.path}: Timeout (>2s)`);
      } else {
        console.log(`❌ ${endpoint.method} ${endpoint.path}: ${error.message}`);
      }
    }
    console.log('');
  }
}

testCorrectEndpoints().catch(console.error);