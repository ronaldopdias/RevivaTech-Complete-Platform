import type { NextAuthConfig } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import Credentials from "next-auth/providers/credentials"
import { UserRole } from "./types"
import { 
  authLogger, 
  logAuthAttempt, 
  logNetworkError, 
  logBackendError, 
  logDebugInfo 
} from "./logger"

// Ensure environment variables are available
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || "revivatech-nextauth-secret-key-for-development-environment-only-change-in-production"
const NEXTAUTH_URL = process.env.NEXTAUTH_URL || "http://localhost:3010"
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3011"

// Debug logging for configuration (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log('NextAuth Config Debug:', {
    hasSecret: !!NEXTAUTH_SECRET,
    secretLength: NEXTAUTH_SECRET.length,
    nextAuthUrl: NEXTAUTH_URL,
    apiUrl: API_URL
  })
}

/**
 * Professional NextAuth.js configuration for RevivaTech
 * Enterprise-grade authentication with role-based access control
 */
export const authConfig: NextAuthConfig = {
  secret: NEXTAUTH_SECRET,
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const email = credentials?.email as string
        
        authLogger.info('AUTHORIZE_STARTED', { email }, email)
        logDebugInfo('AUTHORIZE_CREDENTIALS', { 
          hasEmail: !!credentials?.email, 
          hasPassword: !!credentials?.password 
        }, email)
        
        if (!credentials?.email || !credentials?.password) {
          authLogger.error('AUTHORIZE_VALIDATION_ERROR', { 
            reason: 'Missing email or password' 
          }, email)
          throw new Error('VALIDATION_ERROR')
        }

        try {
          const endpoint = `${API_URL}/api/auth/login`
          authLogger.info('BACKEND_API_CALL', { endpoint }, email)
          
          // Professional API call to backend authentication
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          })

          logDebugInfo('BACKEND_RESPONSE', { 
            status: response.status,
            headers: Object.fromEntries(response.headers.entries())
          }, email)

          // Handle different HTTP status codes with specific errors
          if (!response.ok) {
            let errorData: any = {}
            
            try {
              errorData = await response.json()
              logBackendError(endpoint, response.status, errorData, email)
            } catch (e) {
              logBackendError(endpoint, response.status, 'Failed to parse JSON response', email)
              throw new Error('SERVER_ERROR')
            }

            // Map backend error codes to frontend error types
            switch (response.status) {
              case 400:
                logAuthAttempt(email, false, errorData.code || 'VALIDATION_ERROR')
                throw new Error(errorData.code || 'VALIDATION_ERROR')
              case 401:
                logAuthAttempt(email, false, errorData.code || 'INVALID_CREDENTIALS')
                throw new Error(errorData.code || 'INVALID_CREDENTIALS')
              case 423:
                logAuthAttempt(email, false, 'ACCOUNT_LOCKED')
                throw new Error('ACCOUNT_LOCKED')
              case 429:
                logAuthAttempt(email, false, 'TOO_MANY_ATTEMPTS')
                throw new Error('TOO_MANY_ATTEMPTS')
              case 500:
                logAuthAttempt(email, false, 'SERVER_ERROR')
                throw new Error('SERVER_ERROR')
              case 503:
                logAuthAttempt(email, false, 'SERVICE_UNAVAILABLE')
                throw new Error('SERVICE_UNAVAILABLE')
              default:
                logAuthAttempt(email, false, 'UNKNOWN_ERROR')
                throw new Error('UNKNOWN_ERROR')
            }
          }

          const data = await response.json()
          logDebugInfo('BACKEND_SUCCESS_RESPONSE', {
            success: data.success,
            hasUser: !!data.user,
            userEmail: data.user?.email,
            userRole: data.user?.role
          }, email)
          
          const { user } = data

          if (data.success && user) {
            const userObject = {
              id: user.id,
              email: user.email,
              name: `${user.firstName} ${user.lastName}`.trim(),
              firstName: user.firstName,
              lastName: user.lastName,
              role: user.role as UserRole,
              emailVerified: user.emailVerified ? new Date() : null,
            }
            
            logAuthAttempt(email, true)
            authLogger.info('AUTHORIZE_SUCCESS', { userObject }, email)
            return userObject
          }
          
          authLogger.error('AUTHORIZE_INVALID_RESPONSE', { 
            reason: 'Missing success flag or user data',
            data 
          }, email)
          throw new Error('INVALID_RESPONSE')
        } catch (error) {
          // Network or connection errors
          if (error instanceof TypeError && error.message.includes('fetch')) {
            logNetworkError(`${API_URL}/api/auth/login`, error, email)
            throw new Error('NETWORK_ERROR')
          }
          
          // Re-throw our custom errors
          if (error instanceof Error && error.message.includes('_')) {
            authLogger.error('AUTHORIZE_CUSTOM_ERROR', { error: error.message }, email)
            throw error
          }
          
          authLogger.error('AUTHORIZE_UNKNOWN_ERROR', { error }, email)
          throw new Error('UNKNOWN_ERROR')
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        // Cross-subdomain support for RevivaTech
        domain: process.env.NODE_ENV === 'production' ? '.revivatech.co.uk' : undefined,
      }
    }
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      const userEmail = user?.email || token.email as string
      
      logDebugInfo('JWT_CALLBACK', {
        trigger,
        hasUser: !!user,
        tokenSub: token.sub
      }, userEmail)
      
      // Initial sign in
      if (user) {
        authLogger.info('JWT_USER_DATA_ADDED', {
          userEmail: user.email,
          role: user.role
        }, user.email)
        
        token.role = user.role
        token.firstName = user.firstName
        token.lastName = user.lastName
      }

      // Handle session updates
      if (trigger === 'update' && session) {
        authLogger.info('JWT_SESSION_UPDATE', {
          userEmail,
          sessionData: session
        }, userEmail)
        token = { ...token, ...session }
      }

      return token
    },
    async session({ session, token }) {
      const userEmail = session.user?.email
      
      logDebugInfo('SESSION_CALLBACK', {
        tokenSub: token.sub,
        tokenRole: token.role,
        userEmail
      }, userEmail)
      
      if (token && session.user) {
        session.user.id = token.sub!
        session.user.role = token.role as UserRole
        session.user.firstName = token.firstName as string
        session.user.lastName = token.lastName as string
        
        authLogger.info('SESSION_UPDATED', {
          userId: session.user.id,
          userEmail: session.user.email,
          userRole: session.user.role
        }, userEmail)
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Professional redirect handling
      if (url.startsWith("/")) return `${baseUrl}${url}`
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    }
  },
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  events: {
    async signIn({ user, isNewUser }) {
      authLogger.info('SIGNIN_EVENT', { 
        userEmail: user.email, 
        isNewUser,
        userObject: user 
      }, user.email)
    },
    async signOut({ token }) {
      authLogger.info('SIGNOUT_EVENT', { 
        userEmail: token?.email 
      }, token?.email as string)
    },
    async createUser({ user }) {
      authLogger.info('CREATE_USER_EVENT', { 
        userEmail: user.email,
        userObject: user 
      }, user.email)
    },
    async session({ session, token }) {
      logDebugInfo('SESSION_EVENT', { 
        userEmail: session.user?.email, 
        tokenSub: token?.sub 
      }, session.user?.email)
    }
  },
  experimental: {
    enableWebAuthn: false, // Enable when WebAuthn is needed
  },
  debug: process.env.NODE_ENV === 'development',
}

/**
 * Professional role normalization for enterprise use
 * Ensures consistent role handling across the application
 */
export function normalizeUserRole(role: string | UserRole): UserRole {
  if (Object.values(UserRole).includes(role as UserRole)) {
    return role as UserRole
  }
  
  const upperRole = role.toUpperCase()
  switch (upperRole) {
    case 'ADMIN':
      return UserRole.ADMIN
    case 'SUPER_ADMIN':
      return UserRole.SUPER_ADMIN
    case 'TECHNICIAN':
      return UserRole.TECHNICIAN
    case 'CUSTOMER':
    default:
      return UserRole.CUSTOMER
  }
}