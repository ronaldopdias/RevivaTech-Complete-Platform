/**
 * Test Different Better Auth Handler Approaches
 */

const express = require('express');
const { toNodeHandler } = require("better-auth/node");

async function testHandlers() {
  console.log('🔍 Testing Better Auth handler approaches...');

  try {
    const auth = require('./lib/better-auth-clean');
    console.log('✅ Auth instance loaded');

    // Create test Express app
    const app = express();
    app.use(express.json());

    // Method 1: Using toNodeHandler (current approach)
    console.log('\n📝 Method 1: toNodeHandler');
    const nodeHandler = toNodeHandler(auth);
    app.use('/api/auth/method1', nodeHandler);

    // Method 2: Using auth.handler directly
    console.log('📝 Method 2: auth.handler');
    if (auth.handler) {
      app.use('/api/auth/method2', auth.handler);
    } else {
      console.log('❌ auth.handler not available');
    }

    // Method 3: Manual request forwarding
    console.log('📝 Method 3: Manual forwarding');
    app.all('/api/auth/method3/*', async (req, res) => {
      try {
        const path = req.path.replace('/api/auth/method3', '');
        console.log(`Handling request: ${req.method} ${path}`);
        
        const result = await auth.api[path]?.[req.method.toLowerCase()]?.({
          body: req.body,
          headers: req.headers,
          query: req.query
        });

        if (result) {
          res.json(result);
        } else {
          res.status(404).json({ error: 'Not found' });
        }
      } catch (error) {
        console.error('Handler error:', error.message);
        res.status(500).json({ error: error.message });
      }
    });

    // Start test server
    const server = app.listen(3012, () => {
      console.log('✅ Test server started on port 3012');
    });

    // Test endpoints
    const axios = require('axios');
    const testEndpoints = [
      'http://localhost:3012/api/auth/method1/session',
      'http://localhost:3012/api/auth/method2/session',
      'http://localhost:3012/api/auth/method3/session'
    ];

    console.log('\n🔍 Testing endpoints...');
    for (const endpoint of testEndpoints) {
      try {
        const response = await axios.get(endpoint, { timeout: 2000 });
        console.log(`✅ ${endpoint}: ${response.status}`);
      } catch (error) {
        if (error.code === 'ECONNABORTED') {
          console.log(`⏱️  ${endpoint}: Timeout`);
        } else {
          console.log(`❌ ${endpoint}: ${error.response?.status || error.message}`);
        }
      }
    }

    server.close();

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

testHandlers();