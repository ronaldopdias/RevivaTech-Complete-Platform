/**
 * Better Auth Express Handler
 * 
 * Custom Express adapter for Better Auth using official APIs only.
 * This handler creates proper Web API Request objects that Better Auth expects,
 * eliminating compatibility issues with toNodeHandler.
 */

const auth = require('./better-auth-fixed');

/**
 * Custom Express handler for Better Auth
 * Uses Better Auth's official handler method with proper Web API Request objects
 */
async function betterAuthHandler(req, res) {
  try {
    console.log('📨 Better Auth Express handler:', req.method, req.originalUrl);
    
    // Create a proper URL from the Express request
    const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const host = req.headers.host || 'localhost:3011';
    const url = new URL(req.originalUrl || req.url, `${protocol}://${host}`);
    
    console.log('🔗 Constructed URL:', url.toString());
    
    // Create a Web API Headers object
    const headers = new Headers();
    Object.entries(req.headers).forEach(([key, value]) => {
      if (value) {
        headers.set(key, Array.isArray(value) ? value.join(', ') : value);
      }
    });
    
    // Handle body for POST/PUT/PATCH requests
    let body = undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      if (req.body) {
        body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
        console.log('📝 Request body prepared for', req.method, '- Body:', body);
      } else if (req.rawBody) {
        // Handle raw body if available
        body = req.rawBody;
        console.log('📝 Raw body used for', req.method);
      }
    }
    
    // Create a standard Web API Request object
    const request = new Request(url, {
      method: req.method,
      headers: headers,
      body: body,
    });
    
    console.log('🔄 Calling Better Auth handler...');
    
    // Call Better Auth's official handler method
    const response = await auth.handler(request);
    
    console.log('✅ Better Auth response:', response.status);
    
    // Set status code
    res.status(response.status);
    
    // Set response headers
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    
    // Handle response body
    if (response.body) {
      // For streaming response bodies
      const reader = response.body.getReader();
      
      const pump = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(value);
          }
          res.end();
        } catch (streamError) {
          console.error('❌ Response stream error:', streamError);
          res.end();
        }
      };
      
      await pump();
    } else {
      // No body to stream
      res.end();
    }
    
  } catch (error) {
    console.error('❌ Better Auth Express handler error:', error.message);
    console.error('Error stack:', error.stack);
    
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Authentication service error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}

/**
 * Express middleware wrapper for Better Auth
 * Handles the Express-specific routing and error handling
 */
function createBetterAuthMiddleware() {
  return (req, res, next) => {
    // Only handle requests that start with the auth path
    if (!req.path.startsWith('/api/auth')) {
      return next();
    }
    
    // Handle the auth request
    betterAuthHandler(req, res).catch(error => {
      console.error('❌ Better Auth middleware error:', error);
      next(error);
    });
  };
}

module.exports = {
  betterAuthHandler,
  createBetterAuthMiddleware
};