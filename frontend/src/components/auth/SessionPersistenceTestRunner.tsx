'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { runSessionTestsWithReport, type SessionTestSuite } from '@/lib/auth/session-persistence-tests'

interface SessionPersistenceTestRunnerProps {
  onTestComplete?: (results: SessionTestSuite) => void
}

export function SessionPersistenceTestRunner({ onTestComplete }: SessionPersistenceTestRunnerProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<SessionTestSuite | null>(null)
  const [report, setReport] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  const runTests = async () => {
    setIsRunning(true)
    setError(null)
    setResults(null)
    setReport('')

    try {
      const { results: testResults, report: testReport } = await runSessionTestsWithReport()
      setResults(testResults)
      setReport(testReport)
      onTestComplete?.(testResults)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setIsRunning(false)
    }
  }

  const downloadReport = () => {
    if (!report) return

    const blob = new Blob([report], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `session-persistence-test-report-${new Date().toISOString().split('T')[0]}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getStatusColor = (passed: boolean) => {
    return passed ? 'text-green-600' : 'text-red-600'
  }

  const getStatusIcon = (passed: boolean) => {
    return passed ? '✅' : '❌'
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Session Persistence Tests</h2>
          <div className="space-x-2">
            <Button 
              onClick={runTests} 
              disabled={isRunning}
              variant="default"
            >
              {isRunning ? 'Running Tests...' : 'Run Tests'}
            </Button>
            {report && (
              <Button 
                onClick={downloadReport}
                variant="outline"
              >
                Download Report
              </Button>
            )}
          </div>
        </div>

        <p className="text-gray-600 mb-4">
          This test suite verifies session persistence and management functionality according to requirements 7.1-7.4:
        </p>
        
        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 mb-6">
          <li>Session persistence across browser refreshes</li>
          <li>Session expiration and renewal</li>
          <li>Proper session cleanup on logout</li>
          <li>Concurrent session handling</li>
        </ul>

        {isRunning && (
          <div className="flex items-center space-x-2 text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span>Running session persistence tests...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <h3 className="text-red-800 font-medium">Test Error</h3>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        )}
      </Card>

      {results && (
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4">Test Results</h3>
          
          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{results.summary.total}</div>
              <div className="text-sm text-blue-800">Total Tests</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{results.summary.passed}</div>
              <div className="text-sm text-green-800">Passed</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{results.summary.failed}</div>
              <div className="text-sm text-red-800">Failed</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">{results.summary.duration}ms</div>
              <div className="text-sm text-gray-800">Duration</div>
            </div>
          </div>

          {/* Success Rate */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Success Rate</span>
              <span className="text-sm font-medium">
                {((results.summary.passed / results.summary.total) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${(results.summary.passed / results.summary.total) * 100}%` 
                }}
              ></div>
            </div>
          </div>

          {/* Individual Test Results */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Individual Test Results</h4>
            {results.results.map((result, index) => (
              <div 
                key={index}
                className={`border rounded-lg p-4 ${
                  result.passed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <span className="text-lg">{getStatusIcon(result.passed)}</span>
                    <div>
                      <h5 className={`font-medium ${getStatusColor(result.passed)}`}>
                        {result.name}
                      </h5>
                      {result.error && (
                        <p className="text-sm text-red-600 mt-1">
                          <strong>Error:</strong> {result.error}
                        </p>
                      )}
                      {result.details && (
                        <details className="mt-2">
                          <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                            View Details
                          </summary>
                          <pre className="text-xs text-gray-600 mt-2 p-2 bg-gray-100 rounded overflow-x-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {report && (
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4">Test Report</h3>
          <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
            <pre className="text-sm text-gray-800 whitespace-pre-wrap">{report}</pre>
          </div>
        </Card>
      )}
    </div>
  )
}

export default SessionPersistenceTestRunner