import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"

/**
 * NextAuth.js v5 configuration for RevivaTech
 * Simplified configuration for debugging
 */
export const nextAuthConfig: NextAuthConfig = {
  providers: [
    Credentials({
      async authorize(credentials) {
        console.log('=== AUTHORIZE FUNCTION CALLED ===')
        console.log('Credentials:', credentials)
        
        // Always return a test user for now to verify the function is called
        return {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "revivatech-nextauth-secret-2025",
  debug: true,
}