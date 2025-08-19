/**
 * HTTP Authentication Client
 * Validates sessions by proxying to frontend Better Auth
 * Eliminates dual Better Auth instance conflicts
 */

const axios = require('axios');

// Frontend Better Auth URL
const FRONTEND_AUTH_URL = process.env.FRONTEND_URL || 'http://revivatech_frontend:3010';

/**
 * Validate session via frontend Better Auth
 * @param {Object} headers - Request headers containing session cookies
 * @returns {Promise<Object|null>} User session data or null
 */
async function validateSession(headers) {
  try {
    console.log('[Auth Client] Validating session via frontend:', FRONTEND_AUTH_URL);
    
    // Forward headers to frontend Better Auth
    const response = await axios.get(`${FRONTEND_AUTH_URL}/api/auth/session`, {
      headers: {
        cookie: headers.cookie || '',
        authorization: headers.authorization || '',
        'user-agent': headers['user-agent'] || '',
      },
      timeout: 5000,
      validateStatus: (status) => status < 500, // Accept 4xx as valid responses
    });

    if (response.status === 200 && response.data) {
      console.log('[Auth Client] Session validation successful');
      return {
        session: response.data.session,
        user: response.data.user,
      };
    }

    console.log('[Auth Client] No valid session found');
    return null;
    
  } catch (error) {
    console.error('[Auth Client] Session validation failed:', error.message);
    return null;
  }
}

/**
 * Express middleware for authentication
 * @param {Object} req - Express request
 * @param {Object} res - Express response  
 * @param {Function} next - Next middleware
 */
async function authenticateMiddleware(req, res, next) {
  try {
    const sessionData = await validateSession(req.headers);
    
    if (sessionData?.user) {
      req.user = sessionData.user;
      req.session = sessionData.session;
      next();
    } else {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('[Auth Middleware] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication service error',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Optional authentication middleware (doesn't block if no auth)
 */
async function optionalAuthMiddleware(req, res, next) {
  try {
    const sessionData = await validateSession(req.headers);
    
    if (sessionData?.user) {
      req.user = sessionData.user;
      req.session = sessionData.session;
    }
    
    next();
  } catch (error) {
    console.error('[Optional Auth Middleware] Error:', error);
    next(); // Continue even if auth fails
  }
}

/**
 * Role-based authorization middleware
 * @param {Array} allowedRoles - Array of allowed roles
 */
function requireRole(allowedRoles = []) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const userRole = req.user.role || 'CUSTOMER';
    
    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: userRole,
      });
    }

    next();
  };
}

module.exports = {
  validateSession,
  authenticateMiddleware,
  optionalAuthMiddleware,
  requireRole,
};