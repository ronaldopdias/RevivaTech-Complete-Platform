/**
 * Hybrid Authentication Middleware (DEPRECATED)
 * This file now redirects to the Better Auth-only middleware
 * JWT authentication has been removed as the 'users' table no longer exists
 * 
 * @deprecated Use better-auth.js directly instead
 */

// Re-export all functions from Better Auth DB Direct middleware for backward compatibility
// This uses database validation instead of Better Auth API methods
module.exports = require('./better-auth-db-direct');