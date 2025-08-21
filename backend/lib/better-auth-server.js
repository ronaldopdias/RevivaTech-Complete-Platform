/**
 * Better Auth Server Configuration
 * 
 * Official Better Auth server setup for RevivaTech backend
 * Following Better Auth official documentation patterns
 */

const { betterAuth } = require("better-auth");
const { Pool } = require("pg");
const { organization, twoFactor, customSession } = require("better-auth/plugins");

// PostgreSQL connection using official Better Auth pattern
const pool = new Pool({
  user: process.env.DB_USER || 'revivatech',
  host: process.env.DB_HOST || 'revivatech_database',
  database: process.env.DB_NAME || 'revivatech',
  password: process.env.DB_PASSWORD || 'revivatech_password',
  port: process.env.DB_PORT || 5432,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

/**
 * Better Auth Server Instance - Official Configuration with Origin Fix
 */
const auth = betterAuth({
  // Official PostgreSQL database adapter
  database: pool,
  
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
  
  // Base URL configuration - FIXED: Frontend expects backend to accept requests from localhost:3010
  // The baseURL should match where the backend is running, but we need trusted origins for frontend
  baseURL: "http://localhost:3011",
  
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