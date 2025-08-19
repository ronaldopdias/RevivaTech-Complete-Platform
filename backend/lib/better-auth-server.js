/**
 * Better Auth Server Configuration
 * 
 * Official Better Auth server setup for RevivaTech backend
 */

const { betterAuth } = require("better-auth");
const { memoryAdapter } = require("better-auth/adapters/memory");
const { organization, twoFactor } = require("better-auth/plugins");

/**
 * Better Auth Server Instance
 */
const auth = betterAuth({
  database: memoryAdapter(),
  
  // Email and password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Disable for development
  },
  
  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  
  // Security settings
  secret: process.env.SESSION_SECRET || "your-secret-key-here",
  
  // Base URL configuration
  baseURL: process.env.AUTH_BASE_URL || "http://localhost:3011",
  
  // Plugins
  plugins: [
    organization({
      allowUserToCreateOrganization: true,
      organizationLimit: 5
    }),
    twoFactor({
      issuer: "RevivaTech"
    })
  ],
  
  // User schema
  user: {
    fields: {
      email: "email",
      emailVerified: "emailVerified", 
      name: "name",
      image: "image",
      role: "role"
    }
  },
  
  // Advanced configuration
  advanced: {
    crossSubDomainCookies: {
      enabled: false
    },
    useSecureCookies: process.env.NODE_ENV === "production"
  }
});

module.exports = auth;