/**
 * Test HTTP Endpoint Validation
 * Test the actual HTTP endpoint to see what validation errors we get
 */

const axios = require('axios');

async function testHTTPValidation() {
  const baseURL = 'http://localhost:3011';
  
  console.log('🔧 Testing HTTP endpoint validation...');
  
  // Test different payload structures
  const testCases = [
    {
      name: 'Minimal required fields',
      payload: {
        email: "admin@revivatech.co.uk",
        password: "AdminPass123"
      }
    },
    {
      name: 'With firstName/lastName',
      payload: {
        email: "admin@revivatech.co.uk", 
        password: "AdminPass123",
        firstName: "Admin",
        lastName: "User"
      }
    },
    {
      name: 'With name instead of firstName/lastName',
      payload: {
        email: "admin@revivatech.co.uk",
        password: "AdminPass123", 
        name: "Admin User"
      }
    },
    {
      name: 'Empty payload',
      payload: {}
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n📝 Testing: ${testCase.name}`);
    
    try {
      const response = await axios({
        method: 'POST',
        url: `${baseURL}/api/auth/sign-up/email`,
        headers: { 'Content-Type': 'application/json' },
        data: testCase.payload,
        validateStatus: () => true // Don't throw on HTTP errors
      });
      
      console.log(`Status: ${response.status}`);
      
      if (response.data) {
        console.log('Response:', JSON.stringify(response.data, null, 2));
      }
      
    } catch (error) {
      console.error('Request failed:', error.message);
    }
  }
}

testHTTPValidation().catch(console.error);