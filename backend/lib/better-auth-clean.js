/**
 * Clean Better Auth Configuration
 * Following Better Auth 1.3.7 official documentation exactly
 */

const { betterAuth } = require("better-auth");
const { prismaAdapter } = require("better-auth/adapters/prisma");
const { PrismaClient } = require("@prisma/client");

// Initialize Prisma Client for Better Auth with corrected configuration
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER || 'revivatech'}:${process.env.DB_PASSWORD || 'revivatech_password'}@${process.env.DB_HOST || 'revivatech_database'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'revivatech'}`
    }
  }
});

// Test Prisma connection on initialization
prisma.$connect()
  .then(() => console.log('✅ Better Auth Prisma connection established'))
  .catch(err => console.error('❌ Better Auth Prisma connection failed:', err.message));

/**
 * Minimal Better Auth Configuration
 * Following official documentation patterns
 */
const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql"
  }),
  
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  
  secret: process.env.BETTER_AUTH_SECRET || process.env.JWT_SECRET || "demo-secret-key",
  
  // Base URL should be the server base - Better Auth will add /api/auth internally
  baseURL: process.env.BETTER_AUTH_BASE_URL || "http://localhost:3011",
  
  // Trust host in development
  trustHost: true,
  
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: false,
        defaultValue: 'CUSTOMER',
      }
    }
  }
});

module.exports = auth;