#!/usr/bin/env node

/**
 * Better Auth API Method Verification Script
 * Tests the auth.api.getSession() method to verify correct usage
 */

const auth = require('./lib/better-auth-fixed');

console.log('🔍 Better Auth API Method Verification');
console.log('=====================================');

// Check if auth instance exists
console.log('1. Auth instance:', typeof auth);
console.log('2. Auth object keys:', Object.keys(auth));

// Check if auth.api exists
if (auth.api) {
  console.log('✅ auth.api exists');
  console.log('3. API object keys:', Object.keys(auth.api));
  
  // Check if getSession method exists
  if (auth.api.getSession) {
    console.log('✅ auth.api.getSession exists');
    console.log('4. getSession type:', typeof auth.api.getSession);
    console.log('5. getSession length (parameters):', auth.api.getSession.length);
    
    // Test method signature with mock data
    console.log('\n🧪 Testing method signature...');
    
    try {
      // Test with our current usage pattern
      const testHeaders = {
        cookie: 'test-cookie=value'
      };
      
      console.log('Testing current usage pattern:');
      console.log('auth.api.getSession({ headers: { cookie: "..." } })');
      
      // This will likely fail due to invalid session, but we want to see the error type
      const result = auth.api.getSession({
        headers: testHeaders
      });
      
      console.log('6. Result type:', typeof result);
      console.log('7. Is Promise?', result instanceof Promise);
      
      if (result instanceof Promise) {
        result.then(res => {
          console.log('✅ Promise resolved:', res);
        }).catch(err => {
          console.log('⚠️ Expected error (invalid session):', err.message);
          console.log('Error type:', err.constructor.name);
        });
      } else {
        console.log('📝 Synchronous result:', result);
      }
      
    } catch (error) {
      console.log('❌ Method signature error:', error.message);
      console.log('Error type:', error.constructor.name);
    }
    
  } else {
    console.log('❌ auth.api.getSession does not exist');
    console.log('Available API methods:', Object.keys(auth.api));
  }
  
} else {
  console.log('❌ auth.api does not exist');
  
  // Check alternative patterns
  console.log('\n🔍 Checking alternative patterns...');
  
  if (auth.getSession) {
    console.log('✅ Direct auth.getSession exists');
  }
  
  if (auth.handler) {
    console.log('✅ auth.handler exists');
  }
  
  if (auth.api) {
    console.log('Available on auth object:', Object.keys(auth));
  }
}

console.log('\n🔍 Better Auth Internal Methods');
console.log('===============================');

// Check internal structure for session methods
const authKeys = Object.keys(auth);
authKeys.forEach(key => {
  if (key.toLowerCase().includes('session')) {
    console.log(`📋 Session-related key: ${key} (${typeof auth[key]})`);
  }
});

// Check if there are internal session handlers
if (auth.handler) {
  console.log('Handler type:', typeof auth.handler);
}

console.log('\n✅ API verification complete');