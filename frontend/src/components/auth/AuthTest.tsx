'use client'

import React from 'react'
import { useAuth } from '@/lib/auth'

/**
 * Authentication Test Component
 * Simple component to test authentication context functionality
 */
export function AuthTest() {
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    error,
    signIn,
    signOut,
    validateSession
  } = useAuth()

  const handleTestLogin = async () => {
    try {
      const result = await signIn({
        email: 'test@revivatech.co.uk',
        password: 'testpassword123'
      })
      
      console.log('Login result:', result)
    } catch (error) {
      console.error('Login error:', error)
    }
  }

  const handleTestLogout = async () => {
    try {
      const result = await signOut()
      console.log('Logout result:', result)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleValidateSession = async () => {
    try {
      const result = await validateSession()
      
      if (result.success) {
        console.log('Session valid:', result.data)
      } else {
        console.error('Session invalid:', result.error)
      }
    } catch (error) {
      console.error('Session validation error:', error)
    }
  }

  const handleRunTests = async () => {
    console.log('🧪 Running comprehensive authentication tests...')
    try {
      // Import and run integration tests
      const { runAuthIntegrationTests } = await import('@/lib/auth/integration-test')
      const results = await runAuthIntegrationTests()
      
      console.log('Integration test results:', results)
      
      // Also run basic context tests
      const sessionResult = await validateSession()
      console.log('Session validation:', sessionResult)
      
    } catch (error) {
      console.error('Test execution error:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="p-4 border rounded-lg bg-blue-50">
        <h3 className="font-semibold text-blue-900">Authentication Status</h3>
        <p className="text-blue-700">Loading authentication state...</p>
      </div>
    )
  }

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="font-semibold text-gray-900 mb-4">Authentication Test</h3>
      
      <div className="space-y-3">
        <div>
          <strong>Status:</strong> {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
        </div>
        
        {user && (
          <div>
            <strong>User:</strong> {user.firstName} {user.lastName} ({user.email})
          </div>
        )}
        
        {error && (
          <div className="text-red-600">
            <strong>Error:</strong> {error}
          </div>
        )}
        
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleTestLogin}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            disabled={isAuthenticated}
          >
            Test Login
          </button>
          
          <button
            onClick={handleTestLogout}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            disabled={!isAuthenticated}
          >
            Test Logout
          </button>
          
          <button
            onClick={handleValidateSession}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Validate Session
          </button>
          
          <button
            onClick={handleRunTests}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Run All Tests
          </button>
        </div>
      </div>
    </div>
  )
}

export default AuthTest