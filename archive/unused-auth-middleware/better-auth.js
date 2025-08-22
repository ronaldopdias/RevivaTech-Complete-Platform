/**
 * Better Auth Middleware (COMPATIBILITY LAYER)
 * This file redirects to the final Better Auth middleware
 * Uses the official Better Auth methods for session validation
 * 
 * @deprecated Use better-auth-final.js directly instead
 */

// Re-export all functions from Better Auth DB Direct middleware for backward compatibility
// This avoids the dependency issues with Better Auth API methods
module.exports = require('./better-auth-db-direct');