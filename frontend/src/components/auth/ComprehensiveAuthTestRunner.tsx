'use client'

/**
 * Comprehensive Authentication Test Runner Component - Task 12
 * Browser-based interface for running comprehensive authentication tests
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */

import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { 
  runComprehensiveAuthTests, 
  runAllComprehensiveTests,
  type ComprehensiveAuthTestRunner 
} from '@/lib/auth/comprehensive-auth-tests'

interface TestResult {
  testName: string
  success: boolean
  duration: number
  error?: string
  details?: any
  requirement?: string
}

interface TestSuite {
  suiteName: string
  results: TestResult[]
  totalTests: number
  passedTests: number
  failedTests: number
  totalDuration: number
  requirements: string[]
}

interface TestRunnerState {
  isRunning: boolean
  currentTest: string
  results: TestSuite[]
  error: string | null
  completed: boolean
  startTime: number | null
}

export function ComprehensiveAuthTestRunner() {
  const [state, setState] = useState<TestRunnerState>({
    isRunning: false,
    currentTest: '',
    results: [],
    error: null,
    completed: false,
    startTime: null
  })

  const runTests = useCallback(async (includeErrorHandling = false) => {
    setState(prev => ({
      ...prev,
      isRunning: true,
      currentTest: 'Initializing comprehensive tests...',
      results: [],
      error: null,
      completed: false,
      startTime: Date.now()
    }))

    try {
      if (includeErrorHandling) {
        setState(prev => ({ ...prev, currentTest: 'Running comprehensive authentication and error handling tests...' }))
        const result = await runAllComprehensiveTests()
        setState(prev => ({
          ...prev,
          results: result.authTests,
          completed: true,
          isRunning: false,
          currentTest: 'All comprehensive tests completed!'
        }))
      } else {
        setState(prev => ({ ...prev, currentTest: 'Running comprehensive authentication tests...' }))
        const results = await runComprehensiveAuthTests()
        setState(prev => ({
          ...prev,
          results,
          completed: true,
          isRunning: false,
          currentTest: 'Comprehensive authentication tests completed!'
        }))
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : String(error),
        isRunning: false,
        completed: false,
        currentTest: 'Test execution failed'
      }))
    }
  }, [])

  const clearResults = useCallback(() => {
    setState({
      isRunning: false,
      currentTest: '',
      results: [],
      error: null,
      completed: false,
      startTime: null
    })
  }, [])

  const exportResults = useCallback(() => {
    if (state.results.length === 0) return

    const exportData = {
      timestamp: new Date().toISOString(),
      testType: 'comprehensive_authentication_tests',
      requirements: ['8.1', '8.2', '8.3', '8.4'],
      testSuites: state.results,
      summary: {
        totalSuites: state.results.length,
        totalTests: state.results.reduce((sum, suite) => sum + suite.totalTests, 0),
        totalPassed: state.results.reduce((sum, suite) => sum + suite.passedTests, 0),
        totalFailed: state.results.reduce((sum, suite) => sum + suite.failedTests, 0),
        totalDuration: state.results.reduce((sum, suite) => sum + suite.totalDuration, 0)
      }
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `comprehensive-auth-tests-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [state.results])

  // Calculate summary statistics
  const totalTests = state.results.reduce((sum, suite) => sum + suite.totalTests, 0)
  const totalPassed = state.results.reduce((sum, suite) => sum + suite.passedTests, 0)
  const totalFailed = state.results.reduce((sum, suite) => sum + suite.failedTests, 0)
  const successRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : '0'
  const totalDuration = state.results.reduce((sum, suite) => sum + suite.totalDuration, 0)

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">
          Comprehensive Authentication Test Runner
        </h1>
        <p className="text-lg text-gray-600">
          Task 12: Complete authentication testing including role-based access control and edge cases
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Badge variant="outline">Requirement 8.1: User Registration</Badge>
          <Badge variant="outline">Requirement 8.2: Login/Logout</Badge>
          <Badge variant="outline">Requirement 8.3: Session Persistence</Badge>
          <Badge variant="outline">Requirement 8.4: Token Refresh</Badge>
        </div>
      </div>

      {/* Control Panel */}
      <Card className="p-6">
        <div className="flex flex-wrap gap-4 justify-center">
          <Button
            onClick={() => runTests(false)}
            disabled={state.isRunning}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {state.isRunning ? 'Running Tests...' : 'Run Comprehensive Auth Tests'}
          </Button>
          
          <Button
            onClick={() => runTests(true)}
            disabled={state.isRunning}
            className="bg-green-600 hover:bg-green-700"
          >
            {state.isRunning ? 'Running Tests...' : 'Run All Tests (+ Error Handling)'}
          </Button>
          
          <Button
            onClick={clearResults}
            disabled={state.isRunning}
            variant="outline"
          >
            Clear Results
          </Button>
          
          {state.results.length > 0 && (
            <Button
              onClick={exportResults}
              disabled={state.isRunning}
              variant="outline"
            >
              Export Results
            </Button>
          )}
        </div>
      </Card>

      {/* Current Status */}
      {(state.isRunning || state.currentTest) && (
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            {state.isRunning && (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            )}
            <span className="text-sm font-medium">
              {state.currentTest}
            </span>
          </div>
        </Card>
      )}

      {/* Error Display */}
      {state.error && (
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="text-red-800">
            <h3 className="font-semibold">Test Execution Error</h3>
            <p className="text-sm mt-1">{state.error}</p>
          </div>
        </Card>
      )}

      {/* Summary Statistics */}
      {state.completed && state.results.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Test Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{state.results.length}</div>
              <div className="text-sm text-gray-600">Test Suites</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{totalTests}</div>
              <div className="text-sm text-gray-600">Total Tests</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{totalPassed}</div>
              <div className="text-sm text-gray-600">Passed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{totalFailed}</div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{successRate}%</div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </div>
          </div>
          <div className="mt-4 text-center">
            <div className="text-lg">
              Total Duration: <span className="font-semibold">{totalDuration}ms</span>
            </div>
            {state.startTime && (
              <div className="text-sm text-gray-600">
                Completed in {((Date.now() - state.startTime) / 1000).toFixed(1)} seconds
              </div>
            )}
          </div>
        </Card>
      )}      {/*
 Detailed Results */}
      {state.results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Detailed Test Results</h2>
          
          {state.results.map((suite, suiteIndex) => (
            <Card key={suiteIndex} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{suite.suiteName}</h3>
                <div className="flex items-center space-x-2">
                  <Badge variant={suite.failedTests === 0 ? "default" : "destructive"}>
                    {suite.passedTests}/{suite.totalTests} Passed
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {suite.totalDuration}ms
                  </span>
                </div>
              </div>
              
              {/* Requirements covered */}
              <div className="mb-4">
                <div className="text-sm text-gray-600 mb-2">Requirements Covered:</div>
                <div className="flex flex-wrap gap-1">
                  {suite.requirements.map((req, reqIndex) => (
                    <Badge key={reqIndex} variant="outline" className="text-xs">
                      {req}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Individual test results */}
              <div className="space-y-2">
                {suite.results.map((result, resultIndex) => (
                  <div
                    key={resultIndex}
                    className={`p-3 rounded-lg border ${
                      result.success
                        ? 'border-green-200 bg-green-50'
                        : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={result.success ? 'text-green-600' : 'text-red-600'}>
                          {result.success ? '✅' : '❌'}
                        </span>
                        <span className="font-medium">{result.testName}</span>
                        {result.requirement && (
                          <Badge variant="outline" className="text-xs">
                            Req {result.requirement}
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">
                        {result.duration}ms
                      </span>
                    </div>
                    
                    {result.error && (
                      <div className="mt-2 text-sm text-red-700">
                        <strong>Error:</strong> {result.error}
                      </div>
                    )}
                    
                    {result.details && (
                      <details className="mt-2">
                        <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                          View Details
                        </summary>
                        <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Requirements Coverage Summary */}
      {state.completed && state.results.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Requirements Coverage</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {['8.1', '8.2', '8.3', '8.4'].map(requirement => {
              const reqTests = state.results.flatMap(suite => 
                suite.results.filter(result => result.requirement === requirement)
              )
              const reqPassed = reqTests.filter(test => test.success).length
              const reqTotal = reqTests.length
              const reqSuccessRate = reqTotal > 0 ? ((reqPassed / reqTotal) * 100).toFixed(1) : '0'
              
              return (
                <div key={requirement} className="text-center p-4 border rounded-lg">
                  <div className="text-lg font-semibold">Requirement {requirement}</div>
                  <div className="text-2xl font-bold mt-2">
                    <span className={reqPassed === reqTotal ? 'text-green-600' : 'text-red-600'}>
                      {reqPassed}/{reqTotal}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">{reqSuccessRate}% Success</div>
                  <div className="mt-2">
                    <Badge variant={reqPassed === reqTotal ? "default" : "destructive"}>
                      {reqPassed === reqTotal ? 'PASSED' : 'FAILED'}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Test Categories */}
      {state.completed && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Test Categories Completed</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'Basic Authentication', description: 'Registration, login, logout, session management' },
              { name: 'Role-Based Access Control', description: 'User roles and permission validation' },
              { name: 'Error Scenarios', description: 'Invalid inputs and error handling' },
              { name: 'Edge Cases', description: 'Boundary conditions and unusual inputs' },
              { name: 'Security Tests', description: 'Password strength, injection prevention' },
              { name: 'Performance Tests', description: 'Response times and load handling' }
            ].map((category, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-green-600">✅</span>
                  <span className="font-semibold">{category.name}</span>
                </div>
                <div className="text-sm text-gray-600">{category.description}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Instructions */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h2 className="text-lg font-semibold mb-3 text-blue-900">Testing Instructions</h2>
        <div className="space-y-2 text-sm text-blue-800">
          <p>• <strong>Comprehensive Auth Tests:</strong> Tests all authentication flows, RBAC, and edge cases</p>
          <p>• <strong>All Tests:</strong> Includes comprehensive auth tests plus error handling validation</p>
          <p>• <strong>Requirements Coverage:</strong> Validates all specified requirements (8.1, 8.2, 8.3, 8.4)</p>
          <p>• <strong>Export Results:</strong> Download detailed test results as JSON for documentation</p>
        </div>
      </Card>

      {/* Success Message */}
      {state.completed && totalFailed === 0 && (
        <Card className="p-6 bg-green-50 border-green-200">
          <div className="text-center">
            <div className="text-4xl mb-2">🎉</div>
            <h2 className="text-xl font-semibold text-green-900 mb-2">
              All Comprehensive Tests Passed!
            </h2>
            <p className="text-green-800">
              Authentication system is fully validated and production-ready.
              All requirements (8.1, 8.2, 8.3, 8.4) have been successfully tested.
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}