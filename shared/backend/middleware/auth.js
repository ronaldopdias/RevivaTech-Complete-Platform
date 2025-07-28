const { verifyAccessToken, extractTokenFromHeader } = require('../utils/tokenUtils');
const { Pool } = require('pg');

/**
 * Middleware to authenticate JWT tokens
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'No access token provided'
      });
    }

    // Verify the token
    const decoded = verifyAccessToken(token);
    
    // Check if token is expired (additional check)
    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < currentTime) {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Access token has expired'
      });
    }

    // Attach user info to request
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      iat: decoded.iat,
      exp: decoded.exp
    };

    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Invalid token',
      message: error.message
    });
  }
};

/**
 * Middleware to authenticate JWT tokens but allow unauthenticated requests
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (token) {
      const decoded = verifyAccessToken(token);
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        iat: decoded.iat,
        exp: decoded.exp
      };
    }

    next();
  } catch (error) {
    // In optional auth, we don't return an error for invalid tokens
    // Just continue without user info
    next();
  }
};

/**
 * Middleware to check if user has required role
 * @param {string|string[]} allowedRoles - Single role or array of allowed roles
 * @returns {Function} Express middleware function
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'User not authenticated'
      });
    }

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: `Access denied. Required roles: ${roles.join(', ')}`
      });
    }

    next();
  };
};

/**
 * Middleware to require admin role
 */
const requireAdmin = requireRole(['admin', 'super_admin']);

/**
 * Middleware to require technician or admin role
 */
const requireTechnician = requireRole(['technician', 'admin', 'super_admin']);

/**
 * Middleware to require customer role (or higher)
 */
const requireCustomer = requireRole(['customer', 'technician', 'admin', 'super_admin']);

/**
 * Middleware to check if user owns the resource or is admin
 * @param {string} userIdParam - Parameter name containing the user ID to check
 * @returns {Function} Express middleware function
 */
const requireOwnershipOrAdmin = (userIdParam = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'User not authenticated'
      });
    }

    const resourceUserId = req.params[userIdParam] || req.body[userIdParam];
    const isOwner = req.user.id === resourceUserId;
    const isAdmin = ['admin', 'super_admin'].includes(req.user.role);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only access your own resources'
      });
    }

    next();
  };
};

/**
 * Middleware to validate user exists in database
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const validateUserExists = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'User not authenticated'
    });
  }

  try {
    const pool = req.pool || req.app.locals.pool;
    
    if (!pool) {
      throw new Error('Database pool not available');
    }

    const result = await pool.query(
      'SELECT id, email, first_name, last_name, role, is_active, is_verified FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'User not found',
        message: 'User account no longer exists'
      });
    }

    const dbUser = result.rows[0];

    // Check if user is active
    if (!dbUser.is_active) {
      return res.status(401).json({
        error: 'Account disabled',
        message: 'User account has been disabled'
      });
    }

    // Update req.user with fresh data from database
    req.user = {
      ...req.user,
      firstName: dbUser.first_name,
      lastName: dbUser.last_name,
      isActive: dbUser.is_active,
      isVerified: dbUser.is_verified
    };

    next();
  } catch (error) {
    return res.status(500).json({
      error: 'Database error',
      message: 'Failed to validate user'
    });
  }
};

/**
 * Rate limiting middleware for authentication endpoints
 * @param {number} maxAttempts - Maximum attempts allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Function} Express middleware function
 */
const createAuthRateLimit = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  const attempts = new Map();

  return (req, res, next) => {
    const identifier = req.ip + (req.body.email || '');
    const now = Date.now();
    
    // Clean old entries
    for (const [key, data] of attempts.entries()) {
      if (now - data.firstAttempt > windowMs) {
        attempts.delete(key);
      }
    }

    const userAttempts = attempts.get(identifier);
    
    if (!userAttempts) {
      attempts.set(identifier, {
        count: 1,
        firstAttempt: now
      });
      return next();
    }

    if (userAttempts.count >= maxAttempts) {
      return res.status(429).json({
        error: 'Too many attempts',
        message: `Too many authentication attempts. Try again in ${Math.ceil(windowMs / 60000)} minutes.`,
        retryAfter: Math.ceil((userAttempts.firstAttempt + windowMs - now) / 1000)
      });
    }

    userAttempts.count++;
    next();
  };
};

/**
 * Middleware to log authentication events
 * @param {string} eventType - Type of authentication event
 * @returns {Function} Express middleware function
 */
const logAuthEvent = (eventType) => {
  return (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log successful events
      if (res.statusCode < 400) {
        const logger = req.logger || console;
        logger.info(`Auth Event: ${eventType}`, {
          userId: req.user?.id,
          email: req.user?.email || req.body?.email,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          timestamp: new Date().toISOString()
        });
      }
      
      return originalSend.call(this, data);
    };
    
    next();
  };
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireRole,
  requireAdmin,
  requireTechnician,
  requireCustomer,
  requireOwnershipOrAdmin,
  validateUserExists,
  createAuthRateLimit,
  logAuthEvent
};