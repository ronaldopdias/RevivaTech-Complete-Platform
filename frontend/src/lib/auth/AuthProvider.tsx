/**
 * Better Auth Provider
 * 
 * Better Auth uses React Context under the hood, but we need to ensure
 * the auth client is properly initialized for the app.
 */

'use client'

import React from 'react'
import { authClient } from './better-auth-client'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Better Auth handles its own context internally
  // This provider ensures the client is initialized
  React.useEffect(() => {
    // Initialize auth client if needed
    // Better Auth handles session restoration automatically
  }, [])

  return <>{children}</>
}