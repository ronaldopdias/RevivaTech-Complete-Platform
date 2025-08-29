/**
 * Better Auth Instance for Backend
 * Creates the auth instance directly in the backend with Prisma adapter
 */

const { betterAuth } = require('better-auth');
const { prismaAdapter } = require('better-auth/adapters/prisma');
const { organization, twoFactor } = require('better-auth/plugins');
const { PrismaClient } = require('@prisma/client');
const config = require('../config/environment');

// Initialize Prisma Client for Better Auth
console.log('[Better Auth Backend] Initializing Prisma client...');

const prisma = new PrismaClient({
  log: config.FLAGS.DEVELOPMENT ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: config.DATABASE.URL
    }
  }
});

// Better Auth configuration
const auth = betterAuth({
  basePath: "/api/auth", // This tells Better Auth what base path to expect
  
  database: prismaAdapter(prisma, {
    provider: "postgresql"
  }),
  
  secret: config.AUTH.SECRET,
  
  // Development environment configuration
  ...(config.FLAGS.DEVELOPMENT && {
    rateLimit: {
      enabled: false // Disable rate limiting in development
    },
    logger: {
      level: "debug" // Enable debug logging in development
    }
  }),
  
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Simplified for development
  },
  
  session: {
    expiresIn: config.AUTH.SESSION_EXPIRES_IN,
    updateAge: config.AUTH.TOKEN_EXPIRES_IN,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes - Better Auth recommended
    },
  },
  
  user: {
    additionalFields: {
      firstName: {
        type: "string",
        required: true,
      },
      lastName: {
        type: "string", 
        required: true,
      },
      phone: {
        type: "string",
        required: false,
      },
      role: {
        type: "string",
        required: false,
        defaultValue: "CUSTOMER",
      },
      isActive: {
        type: "boolean",
        required: false,
        defaultValue: true,
      },
    }
  },
  
  plugins: [
    organization({
      allowUserToCreateOrganization: true,
    }),
    twoFactor()
  ],
  
  trustedOrigins: config.CORS.ORIGINS,
  
  // Explicitly configure for HTTP development
  ...(config.FLAGS.DEVELOPMENT && {
    trustHost: config.AUTH.TRUST_HOST, // Trust host in development
  }),
});

console.log('[Better Auth Backend] Auth instance created successfully');

module.exports = {
  auth,
  prisma
};