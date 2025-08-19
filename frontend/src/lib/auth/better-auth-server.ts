/**
 * Fresh Better Auth Server Configuration
 * Pure Better Auth implementation - no legacy code
 * Server-side only configuration
 */

import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { organization, twoFactor } from "better-auth/plugins"
import { nextCookies } from "better-auth/next-js"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

// Environment-aware database URL resolution
function getDatabaseURL(): string {
  // Priority order for database URL resolution
  if (process.env.BETTER_AUTH_DATABASE_URL) {
    console.log('[Better Auth] Using BETTER_AUTH_DATABASE_URL')
    return process.env.BETTER_AUTH_DATABASE_URL
  }

  if (process.env.DATABASE_URL) {
    console.log('[Better Auth] Using DATABASE_URL')
    return process.env.DATABASE_URL
  }

  // Default container connection - use container name for internal connection
  const defaultURL = 'postgresql://revivatech:revivatech_password@revivatech_database:5432/revivatech'
  console.log('[Better Auth] Using default database connection (container)')
  return defaultURL
}

// Initialize database connection
const databaseURL = getDatabaseURL()
console.log('[Better Auth] Database URL configured:', databaseURL.replace(/\/\/([^:]+):([^@]+)@/, '//[USER]:[PASSWORD]@'))

const client = postgres(databaseURL, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 60,
  ssl: false, // Internal connection, no SSL needed
})

const db = drizzle(client, { schema })

// Better Auth configuration
export const auth = betterAuth({
  basePath: "/api/auth", // This tells Better Auth what base path to expect
  
  // Custom error handling configuration
  onAPIError: {
    errorURL: "/auth/error",
  },
  
  // Cookie security configuration
  ...(process.env.BETTER_AUTH_SECURE_COOKIES === 'false' && {
    advanced: {
      useSecureCookies: false
    }
  }),
  
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
      twoFactor: schema.twoFactor,
      organization: schema.organization,
      member: schema.member,
      invitation: schema.invitation,
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
  
  
  callbacks: {
    signIn: {
      after: async (ctx) => {
        const { user } = ctx
        console.log('[Better Auth] User signed in:', { userId: user.id, role: user.role })
        
        // Just log the event - let client handle redirect
        // Removing redirect to prevent conflicts with client-side login handling
        return {
          headers: {
            'X-Auth-Role': user.role as string,
          }
        }
      }
    },
    session: {
      jwt: async ({ token, user }) => {
        if (user) {
          token.role = user.role;
          token.firstName = user.firstName;
          token.lastName = user.lastName;
          token.isActive = user.isActive;
        }
        return token;
      },
      session: async ({ session, token }) => {
        if (token) {
          session.user.role = token.role;
          session.user.firstName = token.firstName;
          session.user.lastName = token.lastName;
          session.user.isActive = token.isActive;
        }
        return session;
      }
    }
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
    },
    transform: {
      before: (user) => {
        // Generate name from firstName and lastName
        if (user.firstName && user.lastName) {
          user.name = `${user.firstName} ${user.lastName}`;
        } else if (user.firstName) {
          user.name = user.firstName;
        } else if (user.lastName) {
          user.name = user.lastName;
        } else if (user.email) {
          user.name = user.email.split('@')[0];
        } else {
          user.name = 'User';
        }
        return user;
      }
    }
  },
  
  plugins: [
    organization({
      allowUserToCreateOrganization: true,
    }),
    twoFactor(),
    nextCookies(), // MUST be the last plugin for Next.js
  ],
  
  trustedOrigins: [
    "http://localhost:3010",
    "https://localhost:3010", 
    "https://revivatech.co.uk",
    "http://localhost:3010", // Dynamic private IP support
  ],
  
  // Explicitly configure for HTTP development
  ...(process.env.NODE_ENV === 'development' && {
    trustHost: true, // Trust host in development
  }),
})

// Export types for client use
export type Auth = typeof auth

// User roles enum
export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  TECHNICIAN = "TECHNICIAN", 
  CUSTOMER = "CUSTOMER"
}

// Simple role checking utility
export function hasRole(userRole: string, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole as UserRole)
}

// Permission checking utility
export function checkPermission(userRole: string, resource: string, action: string): boolean {
  const role = userRole as UserRole
  
  // Super admin has all permissions
  if (role === UserRole.SUPER_ADMIN) return true
  
  // Admin has most permissions
  if (role === UserRole.ADMIN) {
    const adminResources = ['users', 'settings', 'reports', 'bookings', 'customers', 
                           'repairs', 'inventory', 'pricing', 'analytics', 'media',
                           'email', 'templates', 'messages', 'database', 'procedures']
    return adminResources.includes(resource)
  }
  
  // Technician has limited permissions
  if (role === UserRole.TECHNICIAN) {
    if (resource === 'repairs') return true
    if (resource === 'bookings' && ['read', 'update'].includes(action)) return true
    if (resource === 'customers' && action === 'read') return true
    return false
  }
  
  // Customer has minimal permissions
  if (role === UserRole.CUSTOMER) {
    if (resource === 'profile') return true
    if (resource === 'bookings' && ['read', 'create'].includes(action)) return true
    return false
  }
  
  return false
}

/**
 * Get redirect URL based on user role
 * Used by Better Auth callbacks for role-based redirection
 */
function getRedirectUrlForRole(role: string): string {
  switch (role) {
    case 'ADMIN':
    case 'SUPER_ADMIN':
      return '/admin'
    case 'TECHNICIAN':
      return '/technician'
    case 'CUSTOMER':
    default:
      return '/dashboard'
  }
}