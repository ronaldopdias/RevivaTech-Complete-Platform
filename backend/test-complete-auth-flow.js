/**
 * Complete Authentication Flow Validation
 * Test all aspects of Better Auth integration without any bypasses
 */

const axios = require('axios');

async function testCompleteAuthFlow() {
  console.log('🎯 Complete Authentication Flow Validation');
  console.log('=' .repeat(50));
  
  const baseURL = 'http://localhost:3011';
  let sessionToken = null;
  
  // Test 1: Sign-up new user via HTTP
  console.log('\n🔧 Test 1: HTTP Sign-up');
  try {
    const signUpResponse = await axios({
      method: 'POST',
      url: `${baseURL}/api/auth/sign-up/email`,
      headers: { 'Content-Type': 'application/json' },
      data: {
        email: "testflow@revivatech.co.uk",
        password: "TestFlow123!",
        firstName: "Test",
        lastName: "Flow"
      },
      validateStatus: () => true
    });
    
    console.log(`Status: ${signUpResponse.status}`);
    if (signUpResponse.status === 200 || signUpResponse.status === 201) {
      console.log('✅ Sign-up successful');
      console.log('User ID:', signUpResponse.data.user?.id);
    } else if (signUpResponse.status === 422 && signUpResponse.data.code === 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL') {
      console.log('ℹ️  User already exists - continuing with sign-in test');
    } else {
      console.log('❌ Sign-up failed:', signUpResponse.data);
    }
  } catch (error) {
    console.error('❌ Sign-up error:', error.message);
  }
  
  // Test 2: Sign-in via HTTP
  console.log('\n🔧 Test 2: HTTP Sign-in');
  try {
    const signInResponse = await axios({
      method: 'POST',
      url: `${baseURL}/api/auth/sign-in/email`,
      headers: { 'Content-Type': 'application/json' },
      data: {
        email: "testflow@revivatech.co.uk",
        password: "TestFlow123!"
      },
      validateStatus: () => true
    });
    
    console.log(`Status: ${signInResponse.status}`);
    if (signInResponse.status === 200) {
      console.log('✅ Sign-in successful');
      console.log('Session created:', !!signInResponse.data.session);
      sessionToken = signInResponse.data.session?.token;
      console.log('Session token:', sessionToken ? 'Present' : 'Missing');
    } else {
      console.log('❌ Sign-in failed:', signInResponse.data);
    }
  } catch (error) {
    console.error('❌ Sign-in error:', error.message);
  }
  
  // Test 3: Get session via HTTP  
  console.log('\n🔧 Test 3: HTTP Get Session');
  try {
    const sessionHeaders = {};
    if (sessionToken) {
      sessionHeaders['Cookie'] = `session=${sessionToken}`;
      // Also try Authorization header
      sessionHeaders['Authorization'] = `Bearer ${sessionToken}`;
    }
    
    const sessionResponse = await axios({
      method: 'GET',
      url: `${baseURL}/api/auth/get-session`,
      headers: sessionHeaders,
      validateStatus: () => true
    });
    
    console.log(`Status: ${sessionResponse.status}`);
    if (sessionResponse.status === 200) {
      console.log('✅ Get session successful');
      console.log('User email:', sessionResponse.data.user?.email);
    } else {
      console.log('❌ Get session failed:', sessionResponse.data);
    }
  } catch (error) {
    console.error('❌ Get session error:', error.message);
  }
  
  // Test 4: Admin user sign-in
  console.log('\n🔧 Test 4: Admin User Authentication');
  try {
    const adminSignInResponse = await axios({
      method: 'POST',
      url: `${baseURL}/api/auth/sign-in/email`,
      headers: { 'Content-Type': 'application/json' },
      data: {
        email: "admin@revivatech.co.uk",
        password: "AdminPass123!"
      },
      validateStatus: () => true
    });
    
    console.log(`Status: ${adminSignInResponse.status}`);
    if (adminSignInResponse.status === 200) {
      console.log('✅ Admin sign-in successful');
      console.log('Admin user ID:', adminSignInResponse.data.user?.id);
      console.log('Admin role:', adminSignInResponse.data.user?.role);
    } else {
      console.log('❌ Admin sign-in failed:', adminSignInResponse.data);
    }
  } catch (error) {
    console.error('❌ Admin sign-in error:', error.message);
  }
  
  // Test 5: Test different user roles
  console.log('\n🔧 Test 5: Multi-Role Authentication Test');
  const roleTests = [
    { email: "tech@revivatech.co.uk", password: "TechPass123!", expectedRole: "TECHNICIAN" },
    { email: "support@revivatech.co.uk", password: "SupportPass123!", expectedRole: "ADMIN" },
    { email: "customer@example.com", password: "CustomerPass123!", expectedRole: "CUSTOMER" }
  ];
  
  for (const roleTest of roleTests) {
    try {
      const roleResponse = await axios({
        method: 'POST',
        url: `${baseURL}/api/auth/sign-in/email`,
        headers: { 'Content-Type': 'application/json' },
        data: {
          email: roleTest.email,
          password: roleTest.password
        },
        validateStatus: () => true
      });
      
      if (roleResponse.status === 200) {
        const actualRole = roleResponse.data.user?.role;
        if (actualRole === roleTest.expectedRole) {
          console.log(`✅ ${roleTest.expectedRole} authentication successful`);
        } else {
          console.log(`⚠️  ${roleTest.expectedRole} auth successful but role mismatch: got ${actualRole}`);
        }
      } else {
        console.log(`❌ ${roleTest.expectedRole} authentication failed:`, roleResponse.data);
      }
    } catch (error) {
      console.log(`❌ ${roleTest.expectedRole} authentication error:`, error.message);
    }
  }
  
  // Test 6: Sign-out
  console.log('\n🔧 Test 6: HTTP Sign-out');
  if (sessionToken) {
    try {
      const signOutResponse = await axios({
        method: 'POST',
        url: `${baseURL}/api/auth/sign-out`,
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': `session=${sessionToken}`
        },
        validateStatus: () => true
      });
      
      console.log(`Status: ${signOutResponse.status}`);
      if (signOutResponse.status === 200) {
        console.log('✅ Sign-out successful');
      } else {
        console.log('❌ Sign-out failed:', signOutResponse.data);
      }
    } catch (error) {
      console.error('❌ Sign-out error:', error.message);
    }
  } else {
    console.log('⚠️  No session token available for sign-out test');
  }
  
  console.log('\n🎯 Authentication Flow Validation Complete!');
  console.log('=' .repeat(50));
}

testCompleteAuthFlow().catch(console.error);