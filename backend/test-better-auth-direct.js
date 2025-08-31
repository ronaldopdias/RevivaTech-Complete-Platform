/**
 * Direct Better Auth Test
 * Tests Better Auth configuration directly without Express middleware
 */

const auth = require('./lib/better-auth-clean.js');

async function testBetterAuth() {
  console.log('🔍 Testing Better Auth configuration directly...\n');
  
  try {
    console.log('📋 Better Auth instance created:', typeof auth);
    console.log('📋 Auth handler available:', typeof auth.handler);
    
    if (auth.handler) {
      // Test basic auth endpoint
      const basicRequest = new Request('http://localhost:3011/api/auth/session', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('🧪 Testing /session endpoint...');
      const response = await auth.handler(basicRequest);
      console.log('✅ Response status:', response.status);
      console.log('✅ Response headers:', [...response.headers.entries()]);
      
      const body = await response.text();
      console.log('✅ Response body preview:', body.substring(0, 100));
      
      // Test Google OAuth endpoint
      const googleRequest = new Request('http://localhost:3011/api/auth/sign-in/google', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('\n🧪 Testing Google OAuth endpoint...');
      const googleResponse = await auth.handler(googleRequest);
      console.log('✅ Google OAuth status:', googleResponse.status);
      
    } else {
      console.log('❌ Auth handler not available');
    }
    
  } catch (error) {
    console.error('❌ Better Auth test failed:', error.message);
    console.error('Full error:', error);
  }
}

testBetterAuth();