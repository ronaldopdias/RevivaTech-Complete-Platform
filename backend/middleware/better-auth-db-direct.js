/**
 * Better Auth Database Direct Middleware
 * Validates Better Auth sessions directly from the database
 * Avoids issues with missing Better Auth dependencies in backend
 */

const { Pool } = require('pg');

// Database connection for session validation
const pool = new Pool({
  user: process.env.DB_USER || 'revivatech',
  host: process.env.DB_HOST || 'localhost', 
  database: process.env.DB_NAME || 'revivatech',
  password: process.env.DB_PASSWORD || 'revivatech_password',
  port: process.env.DB_PORT || 5435,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

/**
 * Extract Better Auth session token from cookies
 * Based on Better Auth's cookie naming conventions
 */
function extractBetterAuthSessionToken(req) {
  const cookies = req.headers.cookie;
  if (!cookies) return null;

  // Parse cookies manually
  const cookieMap = {};
  cookies.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.trim().split('=');
    if (name && rest.length > 0) {
      cookieMap[name] = rest.join('=');
    }
  });

  // Better Auth typically uses these cookie names
  const sessionCookieNames = [
    'better-auth.session_token',
    'better-auth.session', 
    'auth-session',
    'session',
    '__Host-authjs.session-token',
    'authjs.session-token',
    // Check for any cookie that looks like a session token (long string)
  ];

  // First try known cookie names
  for (const cookieName of sessionCookieNames) {
    if (cookieMap[cookieName]) {
      const cookieValue = cookieMap[cookieName];
      // Better Auth tokens are in format: token.signature
      // We need just the token part before the dot
      const tokenPart = cookieValue.split('.')[0];
      return tokenPart;
    }
  }

  // Fallback: look for any cookie value that looks like a session token
  // Better Auth session tokens are usually long strings
  for (const [name, value] of Object.entries(cookieMap)) {
    if (value && value.length > 32 && !value.includes(' ')) {
      console.log(`Found potential session token in cookie: ${name}`);
      return value;
    }
  }

  return null;
}

/**
 * Validate Better Auth session directly from database
 * Uses the official Better Auth database schema
 */
async function validateBetterAuthSession(sessionToken) {
  try {
    // Query the Better Auth session and user tables
    // Better Auth stores sessions with userId linking to the user table
    const sessionQuery = `
      SELECT 
        s.id as session_id,
        s."userId",
        s.token,
        s."expiresAt",
        s."ipAddress",
        s."userAgent",
        u.id as user_id,
        u.email,
        u."firstName",
        u."lastName",
        u.name,
        u.role,
        u."isActive",
        u."emailVerified",
        u."createdAt",
        u."updatedAt"
      FROM "session" s
      JOIN "user" u ON s."userId" = u.id  
      WHERE s.token = $1 
      AND s."expiresAt" > NOW()
      AND u."isActive" = true
    `;

    const result = await pool.query(sessionQuery, [sessionToken]);
    
    if (result.rows.length > 0) {
      const row = result.rows[0];
      return {
        session: {
          id: row.session_id,
          userId: row.userId,
          token: row.token,
          expiresAt: row.expiresAt,
          ipAddress: row.ipAddress,
          userAgent: row.userAgent
        },
        user: {
          id: row.user_id,
          email: row.email,
          firstName: row.firstName,
          lastName: row.lastName,
          name: row.name,
          role: row.role,
          isActive: row.isActive,
          emailVerified: row.emailVerified,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt
        }
      };
    }
    
    return null;
  } catch (error) {
    console.error('Better Auth database session validation error:', error);
    return null;
  }
}

/**
 * Better Auth Authentication Middleware
 * Validates sessions directly from the database
 */
const authenticateBetterAuth = async (req, res, next) => {
  try {
    const sessionToken = extractBetterAuthSessionToken(req);
    
    if (!sessionToken) {
      return res.status(401).json({ 
        error: 'Authentication required - No session token found',
        code: 'AUTHENTICATION_REQUIRED'
      });
    }

    const sessionData = await validateBetterAuthSession(sessionToken);
    
    if (!sessionData || !sessionData.user) {
      return res.status(401).json({ 
        error: 'Invalid or expired session',
        code: 'INVALID_SESSION'
      });
    }

    // Add user to request in a format compatible with existing code
    req.user = {
      id: sessionData.user.id,
      email: sessionData.user.email,
      firstName: sessionData.user.firstName || sessionData.user.name?.split(' ')[0] || '',
      lastName: sessionData.user.lastName || sessionData.user.name?.split(' ')[1] || '',
      role: sessionData.user.role || 'CUSTOMER',
      isActive: sessionData.user.isActive !== false,
      isVerified: sessionData.user.emailVerified || true,
      // Include the full session data for any additional needs
      betterAuthSession: sessionData.session,
      betterAuthUser: sessionData.user
    };
    
    req.authMethod = 'BetterAuth';
    req.sessionToken = sessionToken;

    // Log successful authentication
    console.log(`🔐 Better Auth Success: ${req.user.email} (${req.user.role}) via database validation`);

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
    const sessionToken = extractBetterAuthSessionToken(req);
    
    if (!sessionToken) {
      req.user = null;
      req.authMethod = null;
      return next();
    }

    const sessionData = await validateBetterAuthSession(sessionToken);
    
    if (!sessionData || !sessionData.user) {
      req.user = null;
      req.authMethod = null;
      return next();
    }

    // Add user to request
    req.user = {
      id: sessionData.user.id,
      email: sessionData.user.email,
      firstName: sessionData.user.firstName || sessionData.user.name?.split(' ')[0] || '',
      lastName: sessionData.user.lastName || sessionData.user.name?.split(' ')[1] || '',
      role: sessionData.user.role || 'CUSTOMER',
      isActive: sessionData.user.isActive !== false,
      isVerified: sessionData.user.emailVerified || true,
      betterAuthSession: sessionData.session,
      betterAuthUser: sessionData.user
    };
    
    req.authMethod = 'BetterAuth';
    req.sessionToken = sessionToken;
    
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

/**
 * Password hashing functions for compatibility
 */
const bcrypt = require('bcrypt');

async function hashPassword(password) {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

/**
 * Token generation stub - Better Auth handles tokens internally
 */
function generateTokens(user) {
  // Better Auth handles session tokens internally
  // This is a compatibility stub for legacy code
  console.warn('generateTokens called - Better Auth handles tokens internally');
  return {
    accessToken: 'better_auth_handles_sessions',
    refreshToken: 'better_auth_handles_sessions'
  };
}

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
  // Password functions for compatibility
  hashPassword,
  verifyPassword,
  generateTokens,
  // Aliases for compatibility during migration
  authenticateToken: authenticateBetterAuth,
  authenticateHybrid: authenticateBetterAuth
};