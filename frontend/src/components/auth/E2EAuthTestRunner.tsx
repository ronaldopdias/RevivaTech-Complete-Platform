'use client'

import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { runE2EAuthTests, authFlowTests, type TestResult } from '@/lib/auth/e2e-auth-tests'
import type { TestSuite } from '@/lib/auth/e2e-auth-tests'

interface TestRunnerState {
  isRunning: boolean
  currentTest: string
  results: TestSuite[]
  error: string | null
  startTime: number | null
  endTime: number | null
}

/**
 * E2E Authentication Test Runner Component
 * Provides a UI for running and viewing authentication test results
 */
export function E2EAuthTestRunner() {
  const [state, setState] = useState<TestRunnerState>({
    isRunning: false,
    currentTest: '',
    results: [],
    error: null,
    startTime: null,
    endTime: null
  })

  const [individualTestResults, setIndividualTestResults] = useState<{
    registration: TestResult | null
    loginLogout: TestResult | null
    sessionPersistence: TestResult | null
    tokenRefresh: TestResult | null
  }>({
    registration: null,
    loginLogout: null,
    sessionPersistence: null,
    tokenRefresh: null
  })

  /**
   * Run all authentication tests
   */
  const runAllTests = useCallback(async () => {
    setState(prev => ({
      ...prev,
      isRunning: true,
      currentTest: 'Initializing tests...',
      results: [],
      error: null,
      startTime: Date.now(),
      endTime: null
    }))

    try {
      const results = await runE2EAuthTests()
      
      setState(prev => ({
        ...prev,
        isRunning: false,
        currentTest: '',
        results,
        endTime: Date.now()
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        isRunning: false,
        currentTest: '',
        error: error instanceof Error ? error.message : String(error),
        endTime: Date.now()
      }))
    }
  }, [])

  /**
   * Run individual test flows
   */
  const runIndividualTest = useCallback(async (testType: string) => {
    setState(prev => ({ ...prev, isRunning: true, currentTest: `Running ${testType} test...` }))

    try {
      let result: TestResult

      switch (testType) {
        case 'registration':
          result = await authFlowTests.testRegistrationFlow()
          setIndividualTestResults(prev => ({ ...prev, registration: result }))
          break
        
        case 'loginLogout':
          // Use test credentials - in real app, these would be from a test user
          result = await authFlowTests.testLoginLogoutFlow(
            'test@revivatech-test.com', 
            'TestPassword123!'
          )
          setIndividualTestResults(prev => ({ ...prev, loginLogout: result }))
          break
        
        case 'sessionPersistence':
          result = await authFlowTests.testSessionPersistence(
            'test@revivatech-test.com', 
            'TestPassword123!'
          )
          setIndividualTestResults(prev => ({ ...prev, sessionPersistence: result }))
          break
        
        case 'tokenRefresh':
          result = await authFlowTests.testTokenRefresh()
          setIndividualTestResults(prev => ({ ...prev, tokenRefresh: result }))
          break
        
        default:
          throw new Error(`Unknown test type: ${testType}`)
      }

      setState(prev => ({ ...prev, isRunning: false, currentTest: '' }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        isRunning: false,
        currentTest: '',
        error: error instanceof Error ? error.message : String(error)
      }))
    }
  }, [])

  /**
   * Clear test results
   */
  const clearResults = useCallback(() => {
    setState({
      isRunning: false,
      currentTest: '',
      results: [],
      error: null,
      startTime: null,
      endTime: null
    })
    setIndividualTestResults({
      registration: null,
      loginLogout: null,
      sessionPersistence: null,
      tokenRefresh: null
    })
  }, [])

  /**
   * Calculate summary statistics
   */
  const getSummary = () => {
    if (state.results.length === 0) return null

    const totalTests = state.results.reduce((sum, suite) => sum + suite.totalTests, 0)
    const totalPassed = state.results.reduce((sum, suite) => sum + suite.passedTests, 0)
    const totalFailed = state.results.reduce((sum, suite) => sum + suite.failedTests, 0)
    const totalDuration = state.results.reduce((sum, suite) => sum + suite.totalDuration, 0)
    const successRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : '0'

    return {
      totalTests,
      totalPassed,
      totalFailed,
      totalDuration,
      successRate: parseFloat(successRate)
    }
  }

  const summary = getSummary()

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🧪 Authentication E2E Test Runner
          </CardTitle>
          <CardDescription>
            Comprehensive testing of Better Auth authentication flows including registration, 
            login/logout, session persistence, and token refresh.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={runAllTests} 
              disabled={state.isRunning}
              variant="default"
            >
              {state.isRunning ? 'Running Tests...' : 'Run All Tests'}
            </Button>
            <Button 
              onClick={clearResults} 
              disabled={state.isRunning}
              variant="outline"
            >
              Clear Results
            </Button>
          </div>
          
          {state.isRunning && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                <span className="text-sm text-blue-700">{state.currentTest}</span>
              </div>
            </div>
          )}

          {state.error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">Error: {state.error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Individual Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Individual Test Flows</CardTitle>
          <CardDescription>
            Run specific authentication flows individually for targeted testing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Button 
                onClick={() => runIndividualTest('registration')}
                disabled={state.isRunning}
                variant="outline"
                className="w-full"
              >
                Test Registration Flow
              </Button>
              {individualTestResults.registration && (
                <div className="text-xs">
                  <Badge variant={individualTestResults.registration.success ? "default" : "destructive"}>
                    {individualTestResults.registration.success ? 'Passed' : 'Failed'}
                  </Badge>
                  <span className="ml-2 text-gray-500">
                    {individualTestResults.registration.duration}ms
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Button 
                onClick={() => runIndividualTest('loginLogout')}
                disabled={state.isRunning}
                variant="outline"
                className="w-full"
              >
                Test Login/Logout Flow
              </Button>
              {individualTestResults.loginLogout && (
                <div className="text-xs">
                  <Badge variant={individualTestResults.loginLogout.success ? "default" : "destructive"}>
                    {individualTestResults.loginLogout.success ? 'Passed' : 'Failed'}
                  </Badge>
                  <span className="ml-2 text-gray-500">
                    {individualTestResults.loginLogout.duration}ms
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Button 
                onClick={() => runIndividualTest('sessionPersistence')}
                disabled={state.isRunning}
                variant="outline"
                className="w-full"
              >
                Test Session Persistence
              </Button>
              {individualTestResults.sessionPersistence && (
                <div className="text-xs">
                  <Badge variant={individualTestResults.sessionPersistence.success ? "default" : "destructive"}>
                    {individualTestResults.sessionPersistence.success ? 'Passed' : 'Failed'}
                  </Badge>
                  <span className="ml-2 text-gray-500">
                    {individualTestResults.sessionPersistence.duration}ms
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Button 
                onClick={() => runIndividualTest('tokenRefresh')}
                disabled={state.isRunning}
                variant="outline"
                className="w-full"
              >
                Test Token Refresh
              </Button>
              {individualTestResults.tokenRefresh && (
                <div className="text-xs">
                  <Badge variant={individualTestResults.tokenRefresh.success ? "default" : "destructive"}>
                    {individualTestResults.tokenRefresh.success ? 'Passed' : 'Failed'}
                  </Badge>
                  <span className="ml-2 text-gray-500">
                    {individualTestResults.tokenRefresh.duration}ms
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Results */}
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle>Test Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{summary.totalTests}</div>
                <div className="text-sm text-gray-500">Total Tests</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{summary.totalPassed}</div>
                <div className="text-sm text-gray-500">Passed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{summary.totalFailed}</div>
                <div className="text-sm text-gray-500">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{summary.successRate}%</div>
                <div className="text-sm text-gray-500">Success Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{summary.totalDuration}ms</div>
                <div className="text-sm text-gray-500">Duration</div>
              </div>
            </div>
            
            {state.startTime && state.endTime && (
              <div className="mt-4 text-sm text-gray-500 text-center">
                Test run completed in {state.endTime - state.startTime}ms
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Detailed Results */}
      {state.results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Detailed Results</h3>
          {state.results.map((suite, suiteIndex) => (
            <Card key={suiteIndex}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{suite.suiteName}</span>
                  <div className="flex gap-2">
                    <Badge variant="outline">
                      {suite.passedTests}/{suite.totalTests} passed
                    </Badge>
                    <Badge variant="secondary">
                      {suite.totalDuration}ms
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {suite.results.map((result, resultIndex) => (
                    <div 
                      key={resultIndex}
                      className={`p-3 rounded-md border ${
                        result.success 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={result.success ? 'text-green-700' : 'text-red-700'}>
                            {result.success ? '✅' : '❌'}
                          </span>
                          <span className="font-medium">{result.testName}</span>
                        </div>
                        <span className="text-sm text-gray-500">{result.duration}ms</span>
                      </div>
                      
                      {result.error && (
                        <div className="mt-2 text-sm text-red-600">
                          Error: {result.error}
                        </div>
                      )}
                      
                      {result.details && (
                        <details className="mt-2">
                          <summary className="text-sm text-gray-600 cursor-pointer">
                            View Details
                          </summary>
                          <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Individual Test Results */}
      {Object.values(individualTestResults).some(result => result !== null) && (
        <Card>
          <CardHeader>
            <CardTitle>Individual Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(individualTestResults).map(([testType, result]) => {
                if (!result) return null
                
                return (
                  <div 
                    key={testType}
                    className={`p-3 rounded-md border ${
                      result.success 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={result.success ? 'text-green-700' : 'text-red-700'}>
                          {result.success ? '✅' : '❌'}
                        </span>
                        <span className="font-medium capitalize">
                          {testType.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">{result.duration}ms</span>
                    </div>
                    
                    {result.error && (
                      <div className="mt-2 text-sm text-red-600">
                        Error: {result.error}
                      </div>
                    )}
                    
                    {result.details && (
                      <details className="mt-2">
                        <summary className="text-sm text-gray-600 cursor-pointer">
                          View Details
                        </summary>
                        <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Test Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <strong>Full Test Suite:</strong> Runs all authentication flows including registration, 
              login/logout, session persistence, token refresh, error handling, and security tests.
            </div>
            <div>
              <strong>Individual Tests:</strong> Run specific flows for targeted testing. Note that 
              some tests may require existing test users or specific conditions.
            </div>
            <div>
              <strong>Requirements Tested:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>8.1: User registration flow with Better Auth</li>
                <li>8.2: Login/logout functionality</li>
                <li>8.3: Session persistence across page refreshes</li>
                <li>8.4: Automatic session refresh when tokens expire</li>
              </ul>
            </div>
            <div className="text-amber-600">
              <strong>Note:</strong> These tests run against the actual authentication system. 
              Test users created during testing will be real users in the database.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default E2EAuthTestRunner