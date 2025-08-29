/**
 * Better Auth Official Session Validation Utilities
 * Uses ONLY official Better Auth methods - NO custom middleware
 */

const auth = require('./better-auth-fixed');

/**
 * Official Better Auth Session Validation
 * Uses auth.api.getSession() - the OFFICIAL method
 */
async function validateSession(req) {
  try {
    // Require headers for Better Auth API method
    if (!req.headers) {
      console.warn('validateSession: No headers found in request');
      return null;
    }
    
    // OFFICIAL Better Auth method for session validation
    // Method signature: auth.api.getSession({ headers })
    // Returns: session object directly or null
    const session = await auth.api.getSession({
      headers: req.headers
    });
    
    // Better Auth returns null for invalid/missing sessions
    if (!session || !session.user) {
      return null;
    }
    
    return session;
  } catch (error) {
    // Enhanced error handling for Better Auth API issues
    if (error.message === 'Headers is required') {
      console.warn('validateSession: Headers required by Better Auth API');
      return null;
    }
    
    console.error('Session validation error:', {
      message: error.message,
      type: error.constructor.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    return null;
  }
}

/**
 * Official Better Auth Authentication Middleware
 * Replaces the problematic HTTP-based middleware
 */
async function requireAuth(req, res, next) {
  try {
    const session = await validateSession(req);
    
    if (!session?.user) {
      return res.status(401).json({ 
        error: 'Authentication required - No valid session found',
        code: 'AUTHENTICATION_REQUIRED'
      });
    }

    // Add user to request in compatible format
    req.user = {
      id: session.user.id,
      email: session.user.email,
      firstName: session.user.firstName || session.user.name?.split(' ')[0],
      lastName: session.user.lastName || session.user.name?.split(' ')[1],
      role: session.user.role || 'CUSTOMER',
      isActive: session.user.isActive !== false,
      isVerified: session.user.emailVerified || true,
      session: session
    };
    
    req.authMethod = 'BetterAuth';
    next();
  } catch (error) {
    console.error('Authentication middleware error:', {
      message: error.message,
      type: error.constructor.name,
      url: req.url,
      method: req.method
    });
    
    res.status(500).json({ 
      error: 'Authentication service error',
      code: 'AUTH_SERVICE_ERROR',
      ...(process.env.NODE_ENV === 'development' && {
        details: error.message
      })
    });
  }
}

/**
 * Optional authentication (doesn't fail if no session)
 */
async function optionalAuth(req, res, next) {
  try {
    const session = await validateSession(req);
    
    if (!session?.user) {
      req.user = null;
      req.authMethod = null;
      return next();
    }

    // Add user to request
    req.user = {
      id: session.user.id,
      email: session.user.email,
      firstName: session.user.firstName || session.user.name?.split(' ')[0],
      lastName: session.user.lastName || session.user.name?.split(' ')[1],
      role: session.user.role || 'CUSTOMER',
      isActive: session.user.isActive !== false,
      isVerified: session.user.emailVerified || true,
      session: session
    };
    
    req.authMethod = 'BetterAuth';
    next();
  } catch (error) {
    // Enhanced error logging for optional auth (don't fail the request)
    console.warn('Optional authentication error (non-blocking):', {
      message: error.message,
      type: error.constructor.name,
      url: req.url
    });
    
    // Don't fail for optional auth - set null and continue
    req.user = null;
    req.authMethod = null;
    next();
  }
}

/**
 * Role-based authorization
 */
function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'MISSING_AUTH'
      });
    }

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    const userRole = req.user.role ? req.user.role.toLowerCase() : '';
    const normalizedRoles = roles.map(role => role.toLowerCase());
    
    if (!normalizedRoles.includes(userRole)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredRoles: roles,
        userRole: req.user.role
      });
    }

    next();
  };
}

// Convenience middleware for common roles
const requireAdmin = requireRole(['admin', 'ADMIN', 'SUPER_ADMIN']);
const requireStaff = requireRole(['admin', 'ADMIN', 'technician', 'TECHNICIAN']);
const requireCustomer = requireRole(['customer', 'CUSTOMER']);

module.exports = {
  validateSession,
  requireAuth,
  optionalAuth,
  requireRole,
  requireAdmin,
  requireStaff,
  requireCustomer,
  // Aliases for compatibility during migration
  authenticateToken: requireAuth,
  authenticateBetterAuth: requireAuth,
  authenticateHybrid: requireAuth
};