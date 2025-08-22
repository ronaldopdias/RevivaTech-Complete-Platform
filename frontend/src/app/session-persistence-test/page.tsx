'use client'

import React from 'react'
import SessionPersistenceTestRunner from '@/components/auth/SessionPersistenceTestRunner'
import { Card } from '@/components/ui/Card'
import Link from 'next/link'

export default function SessionPersistenceTestPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link 
              href="/auth-test" 
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              ← Back to Auth Tests
            </Link>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Session Persistence & Management Tests
          </h1>
          <p className="text-gray-600">
            Comprehensive testing of session persistence and management functionality
          </p>
        </div>

        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Coverage</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Core Requirements (7.1-7.4)</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>✅ Session persistence across browser refreshes</li>
                <li>✅ Session expiration and renewal</li>
                <li>✅ Proper session cleanup on logout</li>
                <li>✅ Concurrent session handling</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Additional Coverage</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>✅ Cross-tab session synchronization</li>
                <li>✅ Session storage security</li>
                <li>✅ Data migration handling</li>
                <li>✅ Activity tracking</li>
                <li>✅ Invalid session handling</li>
                <li>✅ Timeout scenarios</li>
              </ul>
            </div>
          </div>
        </Card>

        <SessionPersistenceTestRunner 
          onTestComplete={(results) => {
          }}
        />

        <Card className="p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Manual Testing Instructions</h2>
          <div className="space-y-4 text-sm text-gray-600">
            <div>
              <h3 className="font-medium text-gray-900">Browser Refresh Test</h3>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>Login to the application</li>
                <li>Navigate to a protected page</li>
                <li>Refresh the browser (F5 or Ctrl+R)</li>
                <li>Verify you remain logged in</li>
              </ol>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900">Cross-Tab Test</h3>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>Login in one tab</li>
                <li>Open the application in a new tab</li>
                <li>Verify you're logged in in the new tab</li>
                <li>Logout in one tab</li>
                <li>Verify you're logged out in both tabs</li>
              </ol>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900">Session Expiration Test</h3>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>Login to the application</li>
                <li>Wait for session to expire (or manually expire in dev tools)</li>
                <li>Try to access a protected resource</li>
                <li>Verify you're redirected to login</li>
              </ol>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}