/**
 * Better Auth Compatible Middleware for Backend API Authentication
 * Integrates with Better Auth sessions from frontend
 */

const { Pool } = require('pg');

// Database connection for user validation
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
 * Extract Better Auth session from cookies
 */
function extractBetterAuthSession(req) {
  const cookies = req.headers.cookie;
  if (!cookies) return null;

  // Parse cookies manually
  const cookieMap = {};
  cookies.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.trim().split('=');
    cookieMap[name] = rest.join('=');
  });

  // Look for Better Auth session cookies (common patterns)
  const sessionCookies = [
    'better-auth.session_token',
    'better-auth.session', 
    'auth-session',
    'session',
    '__Host-authjs.session-token',
    'authjs.session-token'
  ];

  for (const cookieName of sessionCookies) {
    if (cookieMap[cookieName]) {
      return cookieMap[cookieName];
    }
  }

  return null;
}

/**
 * Validate session with Better Auth-compatible logic
 */
async function validateSession(sessionToken) {
  if (!sessionToken) return null;

  try {
    // Query database for session (Better Auth stores sessions in 'session' table)
    const sessionQuery = `
      SELECT 
        s.id as session_id,
        s."userId" as user_id,
        s.token,
        s."expiresAt",
        u.id,
        u.email,
        u."firstName",
        u."lastName", 
        u.role,
        u."isActive"
      FROM session s
      JOIN "user" u ON s."userId" = u.id
      WHERE s.token = $1 
        AND s."expiresAt" > NOW()
        AND u."isActive" = true
    `;

    const result = await pool.query(sessionQuery, [sessionToken]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      sessionId: row.session_id,
      user: {
        id: row.id,
        email: row.email,
        firstName: row.firstName,
        lastName: row.lastName,
        role: row.role,
        isActive: row.isActive
      }
    };
  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
}

/**
 * Better Auth compatible authentication middleware
 */
const authenticateSession = async (req, res, next) => {
  try {
    // Extract session from cookies
    const sessionToken = extractBetterAuthSession(req);
    
    if (!sessionToken) {
      return res.status(401).json({
        error: 'Authentication required - No session found',
        code: 'NO_SESSION'
      });
    }

    // Validate session
    const sessionData = await validateSession(sessionToken);
    
    if (!sessionData) {
      return res.status(401).json({
        error: 'Invalid or expired session',
        code: 'INVALID_SESSION'
      });
    }

    // Add user to request object
    req.user = sessionData.user;
    req.session = { id: sessionData.sessionId };
    
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({
      error: 'Authentication system error',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Role-based authorization middleware (compatible with Better Auth)
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'NO_USER'
      });
    }

    const userRole = req.user.role;
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: allowedRoles,
        current: userRole
      });
    }

    next();
  };
};

/**
 * Optional authentication middleware (doesn't fail if no session)
 */
const optionalAuth = async (req, res, next) => {
  try {
    const sessionToken = extractBetterAuthSession(req);
    
    if (sessionToken) {
      const sessionData = await validateSession(sessionToken);
      if (sessionData) {
        req.user = sessionData.user;
        req.session = { id: sessionData.sessionId };
      }
    }
    
    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    next(); // Continue without authentication
  }
};

module.exports = {
  authenticateSession,
  requireRole,
  optionalAuth,
  // Legacy aliases for backward compatibility
  authenticateToken: authenticateSession,
  requireRole: requireRole
};