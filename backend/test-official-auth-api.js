/**
 * Test Official Better Auth API - No Bypasses
 * Following Rule 1 - Use only official Better Auth methods
 */

const auth = require('./lib/better-auth-fixed');

async function testOfficialAuthAPI() {
  console.log('🔧 Testing official Better Auth API...');
  
  try {
    // Use ONLY official Better Auth API
    const result = await auth.api.signUpEmail({
      body: {
        email: "admin@revivatech.co.uk",
        password: "AdminPass123!",
        firstName: "Admin", 
        lastName: "User"
      }
    });
    
    console.log('✅ User created successfully via official API');
    console.log('User ID:', result.user?.id);
    console.log('Email:', result.user?.email);
    
    // Test sign-in with official API
    const signInResult = await auth.api.signInEmail({
      body: {
        email: "admin@revivatech.co.uk",
        password: "AdminPass123!"
      }
    });
    
    console.log('✅ Sign-in successful via official API');
    console.log('User authenticated:', signInResult.user?.email);
    
    return true;
    
  } catch (error) {
    console.error('❌ Official API test failed:', error.message);
    return false;
  }
}

testOfficialAuthAPI().then(success => {
  if (success) {
    console.log('🎉 Better Auth official API working correctly');
  } else {
    console.log('❌ Better Auth needs configuration fixes');
  }
}).catch(console.error);