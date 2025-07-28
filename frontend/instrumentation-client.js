/**
 * Next.js Client-Side Instrumentation
 * This file handles client-side analytics and monitoring setup
 */

// Only run on client-side
if (typeof window !== 'undefined') {
  console.log('🔧 Client instrumentation loaded');
  
  // PostHog client-side initialization (if needed)
  // Currently disabled but structure ready for future activation
  
  // Export empty module to prevent HMR errors
  module.exports = {};
} else {
  // Server-side - export empty module
  module.exports = {};
}