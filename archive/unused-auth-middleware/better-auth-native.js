/**
 * Better Auth Native Middleware
 * Uses Better Auth instance directly for session validation
 * No external dependencies required
 */

/**
 * Better Auth Instance
 * Import the auth instance from frontend (shared configuration)
 * Note: This is a Node.js require, so we need to handle TypeScript import
 */
let auth;
try {
  // Try to import the Better Auth instance from frontend
  const authModule = require('../../frontend/src/lib/auth/better-auth-server.ts');
  auth = authModule.auth;
} catch (error) {
  console.error('Failed to import Better Auth instance:', error.message);
  console.log('Creating fallback auth configuration...');
  
  // Fallback: Create auth instance directly in backend
  const { betterAuth } = require('better-auth');
  const { drizzleAdapter } = require('better-auth/adapters/drizzle');
  const { drizzle } = require('drizzle-orm/postgres-js');
  const postgres = require('postgres');
  
  // Database connection
  const databaseURL = process.env.DATABASE_URL || process.env.BETTER_AUTH_DATABASE_URL || 
    'postgresql://revivatech:revivatech_password@revivatech_database:5432/revivatech';
  
  const client = postgres(databaseURL, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 60,
    ssl: false,
  });
  
  const db = drizzle(client);
  
  auth = betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg"
    }),
    secret: process.env.BETTER_AUTH_SECRET || 'dev-secret-key-change-in-production',
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // Update every 24 hours
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
  });
}

/**
 * Get Better Auth session using the auth instance's API
 */
async function getBetterAuthSession(req) {
  try {
    if (!auth || !auth.api || !auth.api.getSession) {
      console.error('Better Auth instance not available or getSession method missing');
      return null;
    }

    // Get headers from the request
    const headers = {};
    
    // Copy important headers
    if (req.headers.cookie) {
      headers.cookie = req.headers.cookie;
    }
    if (req.headers.authorization) {
      headers.authorization = req.headers.authorization;
    }
    if (req.headers['user-agent']) {
      headers['user-agent'] = req.headers['user-agent'];
    }
    if (req.headers['x-forwarded-for']) {
      headers['x-forwarded-for'] = req.headers['x-forwarded-for'];
    }

    // Call Better Auth's getSession API
    const session = await auth.api.getSession({
      headers
    });

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
      firstName: session.user.firstName || session.user.name?.split(' ')[0] || '',
      lastName: session.user.lastName || session.user.name?.split(' ')[1] || '',
      role: session.user.role || 'CUSTOMER',
      isActive: session.user.isActive !== false,
      isVerified: session.user.emailVerified || true,
      // Include the full session for any additional data needed
      betterAuthSession: session
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
      firstName: session.user.firstName || session.user.name?.split(' ')[0] || '',
      lastName: session.user.lastName || session.user.name?.split(' ')[1] || '',
      role: session.user.role || 'CUSTOMER',
      isActive: session.user.isActive !== false,
      isVerified: session.user.emailVerified || true,
      betterAuthSession: session
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
  // Aliases for compatibility during migration
  authenticateToken: authenticateBetterAuth,
  authenticateHybrid: authenticateBetterAuth
};