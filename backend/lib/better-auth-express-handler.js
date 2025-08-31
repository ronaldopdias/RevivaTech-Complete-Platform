/**
 * Official Better Auth Express Handler
 * Creates the missing handler that server.js requires
 * Uses Better Auth's official handler method
 */

const auth = require('./better-auth-clean.js');

/**
 * Better Auth Express Handler
 * Converts Express requests to Web API format for Better Auth
 * This is the official way to integrate Better Auth with Express
 */
const betterAuthHandler = async (req, res) => {
  try {
    // Construct the full URL for Better Auth
    const protocol = req.secure ? 'https' : 'http';
    const host = req.get('Host');
    const url = `${protocol}://${host}${req.originalUrl}`;
    
    // Convert Express headers to Web API Headers
    const headers = new Headers();
    Object.entries(req.headers).forEach(([key, value]) => {
      if (typeof value === 'string') {
        headers.set(key, value);
      } else if (Array.isArray(value)) {
        headers.set(key, value.join(', '));
      }
    });
    
    // Create Web API Request for Better Auth
    const request = new Request(url, {
      method: req.method,
      headers: headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' && req.body
        ? (typeof req.body === 'string' ? req.body : JSON.stringify(req.body))
        : undefined
    });
    
    // Process with Better Auth's official handler
    const response = await auth.handler(request);
    
    // Set response status
    res.status(response.status);
    
    // Copy all headers from Better Auth response
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    
    // Send the response body
    const body = await response.text();
    res.send(body);
    
  } catch (error) {
    console.error('❌ Better Auth handler error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Something went wrong'
    });
  }
};

module.exports = { betterAuthHandler };