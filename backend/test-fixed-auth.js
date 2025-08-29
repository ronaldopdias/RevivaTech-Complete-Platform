/**
 * Test Fixed Better Auth Configuration
 */

const express = require('express');
const { toNodeHandler } = require("better-auth/node");

const app = express();
app.use(express.json());

try {
  console.log('🔍 Testing fixed Better Auth configuration...');
  
  // Load the fixed configuration
  const auth = require('./lib/better-auth-fixed');
  console.log('✅ Fixed auth configuration loaded');
  
  // Create handler
  const handler = toNodeHandler(auth);
  console.log('✅ Handler created');
  
  // Mount with debug middleware
  app.use('/api/auth', (req, res, next) => {
    console.log(`🔍 Request: ${req.method} ${req.originalUrl}`);
    console.log('Host:', req.headers.host);
    next();
  });
  
  app.use('/api/auth', handler);
  console.log('✅ Handler mounted');
  
  // Start server
  const server = app.listen(3015, () => {
    console.log('🚀 Fixed auth server on port 3015');
    
    // Test after delay
    setTimeout(async () => {
      const axios = require('axios');
      
      console.log('\n🔍 Testing fixed configuration...');
      try {
        const response = await axios.get('http://localhost:3015/api/auth/session', {
          timeout: 3000,
          validateStatus: () => true
        });
        console.log(`✅ Session test: ${response.status} ${response.statusText}`);
        if (response.data) {
          console.log('Response:', response.data);
        }
      } catch (error) {
        console.log(`❌ Session test failed: ${error.message}`);
      }
      
      server.close();
      console.log('🛑 Server closed');
    }, 1000);
  });

} catch (error) {
  console.error('❌ Setup failed:', error);
}