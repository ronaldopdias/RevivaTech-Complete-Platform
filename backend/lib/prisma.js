/**
 * Centralized Prisma Client Instance for Backend
 * 
 * This file provides a singleton Prisma client instance that can be imported
 * throughout the backend services and routes.
 */

const { PrismaClient } = require('@prisma/client');

// Global variable to store the singleton instance
let prisma;

/**
 * Get or create the Prisma client instance
 * Uses singleton pattern to ensure we don't create multiple connections
 */
function getPrismaClient() {
  if (!prisma) {
    // Re-load config each time to ensure we get the latest database URL
    const config = require('../config/environment');
    
    console.log('[Prisma] Initializing new client instance');
    console.log('[Prisma] Database URL:', config.DATABASE.URL);
    
    prisma = new PrismaClient({
      // Logging configuration based on environment
      log: config.FLAGS.DEVELOPMENT 
        ? ['query', 'error', 'warn'] 
        : ['error'],
      
      // Database configuration
      datasources: {
        db: {
          url: config.DATABASE.URL
        }
      }
    });

    // Handle cleanup on process termination
    const cleanup = async () => {
      console.log('[Prisma] Disconnecting client...');
      await prisma.$disconnect();
    };

    process.on('beforeExit', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('SIGINT', cleanup);
  }

  return prisma;
}

/**
 * Execute a transaction with proper error handling
 */
async function executeTransaction(transactionCallback) {
  const client = getPrismaClient();
  
  try {
    return await client.$transaction(transactionCallback);
  } catch (error) {
    console.error('[Prisma Transaction] Error:', error);
    throw error;
  }
}

/**
 * Test database connectivity
 */
async function testConnection() {
  try {
    const client = getPrismaClient();
    await client.$queryRaw`SELECT 1 as status`;
    console.log('[Prisma] Database connection test successful');
    return true;
  } catch (error) {
    console.error('[Prisma] Database connection test failed:', error);
    return false;
  }
}

// Export the singleton instance and utility functions
module.exports = {
  prisma: getPrismaClient(),
  getPrismaClient,
  executeTransaction,
  testConnection
};