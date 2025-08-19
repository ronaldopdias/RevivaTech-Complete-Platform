'use client'

import React from 'react'
import { BetterAuthLoginForm } from '@/components/auth/BetterAuthLoginForm'
import { useBetterAuth } from '@/lib/auth'
import { AdminOnly, AuthenticatedOnly, GuestOnly } from '@/components/auth/BetterAuthGuard'

/**
 * Better Auth Test Page
 * This page tests the Better Auth implementation
 * Should be removed after migration is complete
 */
export default function TestBetterAuthPage() {
  const auth = useBetterAuth()

  const handleLogout = () => {
    auth.logout()
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Better Auth Test Page
          </h1>
          
          {/* Authentication Status */}
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h2 className="text-lg font-semibold text-blue-900 mb-4">Authentication Status</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Authenticated:</strong> {auth.isAuthenticated ? 'Yes' : 'No'}
              </div>
              <div>
                <strong>Loading:</strong> {auth.isLoading ? 'Yes' : 'No'}
              </div>
              <div>
                <strong>User ID:</strong> {auth.user?.id || 'N/A'}
              </div>
              <div>
                <strong>Email:</strong> {auth.user?.email || 'N/A'}
              </div>
              <div>
                <strong>Role:</strong> {auth.role || 'N/A'}
              </div>
              <div>
                <strong>Auth System:</strong> Better Auth
              </div>
            </div>
          </div>

          {/* User Data Display */}
          <AuthenticatedOnly fallback={<div className="text-gray-500">Not authenticated</div>}>
            <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-md">
              <h2 className="text-lg font-semibold text-green-900 mb-4">User Information</h2>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(auth.user, null, 2)}
              </pre>
              
              <div className="mt-4">
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </AuthenticatedOnly>

          {/* Role-Based Content */}
          <div className="mb-8 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Role-Based Access Control</h2>
            
            <AdminOnly fallback={<div className="p-4 bg-red-50 text-red-700 rounded">Admin Only: Access Denied</div>}>
              <div className="p-4 bg-green-50 text-green-700 rounded">
                ✅ Admin Content: You have admin access!
              </div>
            </AdminOnly>

            <AuthenticatedOnly fallback={<div className="p-4 bg-yellow-50 text-yellow-700 rounded">Please sign in to see authenticated content</div>}>
              <div className="p-4 bg-blue-50 text-blue-700 rounded">
                ✅ Authenticated Content: You are signed in!
              </div>
            </AuthenticatedOnly>

            <GuestOnly>
              <div className="p-4 bg-purple-50 text-purple-700 rounded">
                👋 Guest Content: Only visible when not signed in
              </div>
            </GuestOnly>
          </div>

          {/* Permission Testing */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Permission Testing</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Can manage users:</strong> {auth.checkPermission('users', 'create') ? 'Yes' : 'No'}
              </div>
              <div>
                <strong>Can read bookings:</strong> {auth.checkPermission('bookings', 'read') ? 'Yes' : 'No'}
              </div>
              <div>
                <strong>Is Admin:</strong> {auth.isAdmin ? 'Yes' : 'No'}
              </div>
              <div>
                <strong>Is Technician:</strong> {auth.isTechnician ? 'Yes' : 'No'}
              </div>
            </div>
          </div>

          {/* Login Form (only show if not authenticated) */}
          <GuestOnly>
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Better Auth Login</h2>
              <BetterAuthLoginForm
                onSuccess={() => {
                  console.log('Login successful!')
                }}
                onError={(error) => {
                  console.error('Login error:', error)
                }}
              />
            </div>
          </GuestOnly>

          {/* Debug Information */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <h2 className="text-lg font-semibold text-yellow-900 mb-4">Debug Information</h2>
              <div className="text-sm space-y-2">
                <div><strong>Better Auth Backend:</strong> http://localhost:3011/api/auth/</div>
                <div><strong>Session Endpoint:</strong> /api/auth/session</div>
                <div><strong>Login Endpoint:</strong> /api/auth/sign-in</div>
                <div><strong>Migration Status:</strong> {auth.migrationStatus}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}