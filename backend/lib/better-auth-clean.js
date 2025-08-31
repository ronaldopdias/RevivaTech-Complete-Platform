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
      url: process.env.DATABASE_URL || 'postgresql://revivatech:@revivatech_database:5432/revivatech'
    }
  }
});

// Test Prisma connection on initialization
prisma.$connect()
  .then(() => console.log('✅ Better Auth Prisma connection established'))
  .catch(err => console.error('❌ Better Auth Prisma connection failed:', err.message));

/**
 * Enhanced Better Auth Configuration with Google OAuth
 * Following Better Auth 1.3.7 official documentation
 */
const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql"
  }),
  
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      redirectURI: "/api/auth/callback/google",
      scope: ["openid", "email", "profile"]
    }
  },
  
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  
  secret: process.env.BETTER_AUTH_SECRET || process.env.JWT_SECRET || "demo-secret-key",
  
  // Base URL configuration for Better Auth (handle env variable with /api/auth suffix)
  baseURL: process.env.BETTER_AUTH_BASE_URL 
    ? process.env.BETTER_AUTH_BASE_URL.replace('/api/auth', '')
    : "http://localhost:3011",
  basePath: "/api/auth",
  
  // Trust host and allow origins for OAuth
  trustHost: true,
  trustedOrigins: [
    'http://localhost:3010',
    'http://localhost:3010/auth/callback',  // Explicit callback path
    'http://localhost:3011',
    'https://revivatech.co.uk',
    'https://www.revivatech.co.uk'
  ],
  
  // User fields defined in Prisma schema - no additionalFields needed
  
  // Minimal hooks - only handle Google OAuth profile mapping
  hooks: {
    user: {
      create: {
        before: async (user, context) => {
          // Only handle Google OAuth - let email signup work with minimal fields
          if (context?.provider === 'google') {
            const profile = context.profile;
            return {
              ...user,
              name: profile.name || `${profile.given_name} ${profile.family_name}`,
              firstName: profile.given_name,
              lastName: profile.family_name,
              emailVerified: profile.email_verified
            };
          }
          // For email signup, return user as-is without additional field requirements
          return user;
        }
      }
    }
  }
});

module.exports = auth;