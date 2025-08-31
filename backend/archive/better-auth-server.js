/**
 * Better Auth Server Configuration
 * 
 * Official Better Auth server setup for RevivaTech backend
 * Following Better Auth official documentation patterns
 */

const { betterAuth } = require("better-auth");
const { prismaAdapter } = require("better-auth/adapters/prisma");
const { organization, twoFactor, customSession } = require("better-auth/plugins");
const { PrismaClient } = require("@prisma/client");

// Initialize Prisma Client for Better Auth
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER || 'revivatech'}:${process.env.DB_PASSWORD || 'revivatech_password'}@${process.env.DB_HOST || 'revivatech_database'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'revivatech'}`
    }
  }
});

/**
 * Better Auth Server Instance - Official Configuration with Origin Fix
 */
const auth = betterAuth({
  // Prisma database adapter with proper provider configuration
  database: prismaAdapter(prisma, {
    provider: "postgresql"
  }),
  
  // Email and password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Disable for development
  },
  
  // User schema with role field
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: false,
        defaultValue: 'CUSTOMER',
        input: true // allows user to set role during signup
      }
    }
  },
  
  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  
  // Security settings - using official Better Auth environment variables
  secret: process.env.BETTER_AUTH_SECRET || process.env.JWT_SECRET || "your-secret-key-here",
  
  // Base URL configuration - Must include the auth path for Better Auth 1.3.7
  baseURL: "http://localhost:3011/api/auth",
  
  // FIXED: Add trusted origins to accept requests from frontend
  trustedOrigins: [
    "http://localhost:3010",  // Frontend development server
    "http://localhost:3011",  // Backend server  
    "https://localhost:3010", // HTTPS frontend (if used)
    "https://revivatech.co.uk", // Production frontend
    "https://www.revivatech.co.uk" // Production frontend with www
  ],
  
  // FIXED: Trust host in development to prevent origin validation issues
  ...(process.env.NODE_ENV !== 'production' && {
    trustHost: true
  }),
  
  // Plugins - Better Auth official plugins
  plugins: [
    organization({
      allowUserToCreateOrganization: true,
      organizationLimit: 5
    }),
    twoFactor({
      issuer: "RevivaTech"
    }),
    // Custom session plugin to include role data in session
    customSession(async ({ user, session }) => {
      // Include user role in session data
      return {
        user: {
          ...user,
          role: user.role || 'CUSTOMER' // Ensure role is always present
        },
        session
      };
    })
  ],
  
  // Advanced configuration
  advanced: {
    crossSubDomainCookies: {
      enabled: false
    },
    useSecureCookies: process.env.NODE_ENV === "production"
  }
});

module.exports = auth;