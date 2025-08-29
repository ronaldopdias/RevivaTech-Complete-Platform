/**
 * Test Better Auth Native Handler
 */

const express = require('express');
const app = express();

app.use(express.json());

try {
  const auth = require('./lib/better-auth-clean');
  console.log('✅ Auth loaded');
  console.log('Auth keys:', Object.keys(auth));
  
  // Method 1: Try auth.handler directly
  if (auth.handler) {
    console.log('📝 Method 1: Using auth.handler directly');
    console.log('Handler type:', typeof auth.handler);
    console.log('Handler length:', auth.handler.length);
    
    app.use('/api/auth', auth.handler);
  }
  
  // Method 2: Create wrapper for toNodeHandler
  console.log('📝 Method 2: Wrapper approach');
  const { toNodeHandler } = require("better-auth/node");
  const nodeHandler = toNodeHandler(auth);
  
  app.use('/api/auth2', (req, res, next) => {
    console.log(`🔍 Wrapper hit: ${req.method} ${req.originalUrl}`);
    
    // Call the node handler and handle the response
    const result = nodeHandler(req, res);
    
    // If it returns a promise, handle it
    if (result && typeof result.then === 'function') {
      result.catch(next);
    }
  });
  
  // Method 3: Manual request handling
  console.log('📝 Method 3: Manual handling');
  app.all('/api/auth3/*', async (req, res) => {
    try {
      console.log(`🔍 Manual handler: ${req.method} ${req.path}`);
      
      // Create a mock request object that Better Auth expects
      const betterAuthRequest = new Request(
        new URL(req.originalUrl, `http://${req.headers.host}`),
        {
          method: req.method,
          headers: req.headers,
          body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
        }
      );
      
      const response = await auth.handler(betterAuthRequest);
      
      // Set status and headers
      res.status(response.status);
      response.headers.forEach((value, key) => {
        res.set(key, value);
      });
      
      // Send body
      const body = await response.text();
      res.send(body);
      
    } catch (error) {
      console.error('Manual handler error:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
} catch (error) {
  console.error('❌ Setup failed:', error);
}

// Start server
const server = app.listen(3014, () => {
  console.log('🚀 Test server running on port 3014');
  
  // Test endpoints
  setTimeout(async () => {
    const axios = require('axios');
    const tests = [
      'http://localhost:3014/api/auth/session',
      'http://localhost:3014/api/auth2/session', 
      'http://localhost:3014/api/auth3/session'
    ];
    
    console.log('\n🔍 Testing all methods...');
    for (const url of tests) {
      try {
        const response = await axios.get(url, { timeout: 2000, validateStatus: () => true });
        console.log(`✅ ${url}: ${response.status} ${response.statusText}`);
      } catch (error) {
        console.log(`❌ ${url}: ${error.message}`);
      }
    }
    
    server.close();
    console.log('🛑 Server closed');
  }, 1000);
});