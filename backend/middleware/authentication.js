/**
 * Authentication Middleware (COMPATIBILITY LAYER)
 * This file redirects to the Better Auth middleware
 * JWT authentication has been deprecated and removed
 * 
 * @deprecated Use better-auth.js directly instead
 */

// Re-export all functions from Better Auth DB Direct middleware for backward compatibility
// This uses database validation instead of Better Auth API methods
module.exports = require('./better-auth-db-direct');