const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

// Generate tokens
const generateTokens = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    firstName: user.firstName || user.first_name,
    lastName: user.lastName || user.last_name
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'revivatech-api',
    audience: 'revivatech-app'
  });

  const refreshToken = crypto.randomBytes(40).toString('hex');

  return { accessToken, refreshToken };
};

// Verify access token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'revivatech-api',
      audience: 'revivatech-app'
    });
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : null;

    if (!token) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'MISSING_TOKEN'
      });
    }

    // Verify token
    const decoded = verifyToken(token);
    
    // Get user from database
    const userQuery = `
      SELECT id, email, "firstName", "lastName", role, "isActive", "isVerified"
      FROM users 
      WHERE id = $1 AND "isActive" = true
    `;
    
    const userResult = await req.pool.query(userQuery, [decoded.userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ 
        error: 'User not found or inactive',
        code: 'USER_NOT_FOUND'
      });
    }

    const user = {
      id: userResult.rows[0].id,
      email: userResult.rows[0].email,
      firstName: userResult.rows[0].firstName,
      lastName: userResult.rows[0].lastName,
      role: userResult.rows[0].role,
      isActive: userResult.rows[0].isActive,
      isVerified: userResult.rows[0].isVerified
    };

    // Check if email is verified for certain operations
    if (!user.isVerified && req.path !== '/verify-email') {
      return res.status(403).json({ 
        error: 'Email verification required',
        code: 'EMAIL_NOT_VERIFIED'
      });
    }

    // Add user to request
    req.user = user;
    req.token = decoded;

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }

    req.logger.error('Authentication error:', error);
    res.status(500).json({ 
      error: 'Authentication service error',
      code: 'AUTH_SERVICE_ERROR'
    });
  }
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : null;

    if (!token) {
      req.user = null;
      req.token = null;
      return next();
    }

    // Verify token
    const decoded = verifyToken(token);
    
    // Get user from database
    const userQuery = `
      SELECT id, email, "firstName", "lastName", role, "isActive", "isVerified"
      FROM users 
      WHERE id = $1 AND "isActive" = true
    `;
    
    const userResult = await req.pool.query(userQuery, [decoded.userId]);
    
    if (userResult.rows.length > 0) {
      req.user = {
        id: userResult.rows[0].id,
        email: userResult.rows[0].email,
        firstName: userResult.rows[0].firstName,
        lastName: userResult.rows[0].lastName,
        role: userResult.rows[0].role,
        isActive: userResult.rows[0].isActive,
        isVerified: userResult.rows[0].isVerified
      };
      req.token = decoded;
    } else {
      req.user = null;
      req.token = null;
    }

    next();
  } catch (error) {
    // Don't fail for optional auth
    req.user = null;
    req.token = null;
    next();
  }
};

// Role-based authorization
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

// Admin only middleware
const requireAdmin = requireRole(['admin', 'ADMIN']);

// Staff (admin + technician) middleware
const requireStaff = requireRole(['admin', 'technician']);

// Password utilities
const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// Store refresh token in database
const storeRefreshToken = async (pool, userId, refreshToken, deviceInfo = {}) => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
  
  // Generate UUID for session id
  const sessionId = crypto.randomBytes(16).toString('hex');

  const query = `
    INSERT INTO user_sessions (id, "userId", token, "expiresAt")
    VALUES ($1, $2, $3, $4)
    RETURNING id
  `;

  const result = await pool.query(query, [
    sessionId,
    userId,
    refreshToken,
    expiresAt
  ]);

  return result.rows[0].id;
};

// Validate refresh token
const validateRefreshToken = async (pool, refreshToken) => {
  const query = `
    SELECT us.*, u.id as user_id, u.email, u."firstName", u."lastName", u.role, u."isActive"
    FROM user_sessions us
    JOIN users u ON us."userId" = u.id
    WHERE us.token = $1 
    AND us."expiresAt" > NOW()
    AND u."isActive" = true
  `;

  const result = await pool.query(query, [refreshToken]);
  return result.rows[0] || null;
};

// Revoke refresh token
const revokeRefreshToken = async (pool, refreshToken) => {
  const query = 'DELETE FROM user_sessions WHERE token = $1';
  await pool.query(query, [refreshToken]);
};

// Revoke all user sessions
const revokeAllUserSessions = async (pool, userId) => {
  const query = 'DELETE FROM user_sessions WHERE "userId" = $1';
  await pool.query(query, [userId]);
};

// Clean expired sessions
const cleanExpiredSessions = async (pool) => {
  const query = 'DELETE FROM user_sessions WHERE "expiresAt" < NOW()';
  const result = await pool.query(query);
  return result.rowCount;
};

// Generate email verification token
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Generate password reset token
const generatePasswordResetToken = () => {
  return {
    token: crypto.randomBytes(32).toString('hex'),
    expires: new Date(Date.now() + 3600000) // 1 hour
  };
};

module.exports = {
  generateTokens,
  verifyToken,
  authenticateToken,
  optionalAuth,
  requireRole,
  requireAdmin,
  requireStaff,
  hashPassword,
  verifyPassword,
  storeRefreshToken,
  validateRefreshToken,
  revokeRefreshToken,
  revokeAllUserSessions,
  cleanExpiredSessions,
  generateVerificationToken,
  generatePasswordResetToken,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN
};