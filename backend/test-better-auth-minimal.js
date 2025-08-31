/**
 * Minimal Better Auth Test
 * Tests if Better Auth basic functionality works at all
 */

const { betterAuth } = require("better-auth");

console.log('🔍 Testing minimal Better Auth configuration...\n');

// Create minimal Better Auth instance
const auth = betterAuth({
  secret: "test-secret-key",
  baseURL: "http://localhost:3011",
  basePath: "/api/auth",
  
  // Minimal config without database for testing
  session: {
    expiresIn: 60 * 60 * 24, // 1 day
  },
  
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || 'test-client-id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'test-client-secret',
    }
  },
  
  trustHost: true,
});

async function testMinimalAuth() {
  try {
    console.log('✅ Better Auth instance created successfully');
    console.log('✅ Handler available:', typeof auth.handler);
    
    // Test basic endpoint
    const sessionRequest = new Request('http://localhost:3011/api/auth/session', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('🧪 Testing /session endpoint...');
    const response = await auth.handler(sessionRequest);
    console.log('Response status:', response.status);
    console.log('Response body:', await response.text());
    
    // Test Google OAuth endpoint
    const googleRequest = new Request('http://localhost:3011/api/auth/sign-in/google', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('\n🧪 Testing Google OAuth endpoint...');
    const googleResponse = await auth.handler(googleRequest);
    console.log('Google OAuth status:', googleResponse.status);
    const googleBody = await googleResponse.text();
    console.log('Google OAuth response:', googleBody.substring(0, 200));
    
  } catch (error) {
    console.error('❌ Better Auth test failed:', error);
  }
}

testMinimalAuth();