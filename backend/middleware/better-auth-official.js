/**
 * Better Auth Official Middleware
 * Uses the official Better Auth methods for session validation
 * Based on Better Auth documentation
 */

const { betterFetch } = require('@better-fetch/fetch');

/**
 * Get Better Auth session using the official API
 * This calls the Better Auth /api/auth/get-session endpoint
 */
async function getBetterAuthSession(req) {
  try {
    // Determine the base URL based on environment
    const protocol = req.secure ? 'https' : 'http';
    const host = req.get('host') || 'localhost:3010';
    const baseURL = `${protocol}://${host}`;
    
    // Forward cookies from the request
    const cookieHeader = req.get('cookie') || '';
    
    // Call Better Auth's get-session endpoint
    const { data: session, error } = await betterFetch('/api/auth/get-session', {
      baseURL,
      headers: {
        cookie: cookieHeader,
      },
    });

    if (error) {
      console.error('Better Auth session fetch error:', error);
      return null;
    }

    return session;
  } catch (error) {
    console.error('Better Auth session validation error:', error);
    return null;
  }
}

/**
 * Better Auth Authentication Middleware
 * Uses official Better Auth API for session validation
 */
const authenticateBetterAuth = async (req, res, next) => {
  try {
    const session = await getBetterAuthSession(req);
    
    if (!session || !session.user) {
      return res.status(401).json({ 
        error: 'Authentication required - No valid session found',
        code: 'AUTHENTICATION_REQUIRED'
      });
    }

    // Add user to request in a format compatible with existing code
    req.user = {
      id: session.user.id,
      email: session.user.email,
      firstName: session.user.firstName || session.user.name?.split(' ')[0],
      lastName: session.user.lastName || session.user.name?.split(' ')[1],
      role: session.user.role || 'CUSTOMER',
      isActive: session.user.isActive !== false,
      isVerified: session.user.emailVerified || true,
      // Include the full session for any additional data needed
      session: session
    };
    
    req.authMethod = 'BetterAuth';

    // Log successful authentication
    console.log(`🔐 Better Auth Success: ${req.user.email} (${req.user.role})`);

    next();
  } catch (error) {
    console.error('Better Auth middleware error:', error);
    res.status(500).json({ 
      error: 'Authentication service error',
      code: 'AUTH_SERVICE_ERROR'
    });
  }
};

/**
 * Optional authentication (doesn't fail if no session)
 */
const optionalAuth = async (req, res, next) => {
  try {
    const session = await getBetterAuthSession(req);
    
    if (!session || !session.user) {
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
    // Don't fail for optional auth
    req.user = null;
    req.authMethod = null;
    next();
  }
};

/**
 * Role-based authorization
 */
const requireRole = (allowedRoles) => {
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
};

// Convenience middleware for common roles
const requireAdmin = requireRole(['admin', 'ADMIN', 'SUPER_ADMIN']);
const requireStaff = requireRole(['admin', 'ADMIN', 'technician', 'TECHNICIAN']);
const requireCustomer = requireRole(['customer', 'CUSTOMER']);

module.exports = {
  authenticateBetterAuth,
  optionalAuth,
  requireRole,
  requireAdmin,
  requireStaff,
  requireCustomer,
  // Alias for compatibility during migration
  authenticateToken: authenticateBetterAuth,
  authenticateHybrid: authenticateBetterAuth
};