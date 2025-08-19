/**
 * Better Auth Instance for Backend
 * Creates the auth instance directly in the backend with proper configuration
 */

const { betterAuth } = require('better-auth');
const { drizzleAdapter } = require('better-auth/adapters/drizzle');
const { organization, twoFactor } = require('better-auth/plugins');
const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');

// Environment-aware database URL resolution
function getDatabaseURL() {
  // Priority order for database URL resolution
  if (process.env.BETTER_AUTH_DATABASE_URL) {
    console.log('[Better Auth Backend] Using BETTER_AUTH_DATABASE_URL');
    return process.env.BETTER_AUTH_DATABASE_URL;
  }

  if (process.env.DATABASE_URL) {
    console.log('[Better Auth Backend] Using DATABASE_URL');
    return process.env.DATABASE_URL;
  }

  // Default container connection - use container name for internal connection
  const defaultURL = 'postgresql://revivatech:revivatech_password@revivatech_database:5432/revivatech';
  console.log('[Better Auth Backend] Using default database connection (container)');
  return defaultURL;
}

// Initialize database connection
const databaseURL = getDatabaseURL();
console.log('[Better Auth Backend] Database URL configured:', databaseURL.replace(/\/\/([^:]+):([^@]+)@/, '//[USER]:[PASSWORD]@'));

const client = postgres(databaseURL, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 60,
  ssl: false, // Internal connection, no SSL needed
});

const db = drizzle(client, {
  schema: {
    // Define basic schema compatible with Better Auth
    user: {
      id: 'text',
      email: 'text',
      firstName: 'text',
      lastName: 'text',
      name: 'text',
      role: 'text',
      isActive: 'boolean',
      emailVerified: 'boolean',
      createdAt: 'timestamp',
      updatedAt: 'timestamp'
    },
    session: {
      id: 'text',
      userId: 'text',
      token: 'text',
      expiresAt: 'timestamp',
      ipAddress: 'text',
      userAgent: 'text'
    },
    account: {
      id: 'text',
      userId: 'text',
      providerId: 'text',
      accountId: 'text',
      accessToken: 'text',
      refreshToken: 'text'
    },
    verification: {
      id: 'text',
      identifier: 'text',
      value: 'text',
      expiresAt: 'timestamp'
    }
  }
});

// Better Auth configuration
const auth = betterAuth({
  basePath: "/api/auth", // This tells Better Auth what base path to expect
  
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: 'user',
      session: 'session',
      account: 'account',
      verification: 'verification'
    }
  }),
  
  secret: process.env.BETTER_AUTH_SECRET || 'dev-secret-key-change-in-production',
  
  // Development environment configuration
  ...(process.env.NODE_ENV === 'development' && {
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
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update every 24 hours
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
  
  trustedOrigins: [
    "http://localhost:3010",
    "http://localhost:3011",
    "https://localhost:3010", 
    "https://revivatech.co.uk",
  ],
  
  // Explicitly configure for HTTP development
  ...(process.env.NODE_ENV === 'development' && {
    trustHost: true, // Trust host in development
  }),
});

console.log('[Better Auth Backend] Auth instance created successfully');

module.exports = {
  auth,
  db,
  client
};