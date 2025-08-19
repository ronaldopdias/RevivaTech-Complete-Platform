#!/usr/bin/env node

/**
 * Authentication E2E Test Script
 * Standalone script for running authentication tests
 */

const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')

// Test configuration
const TEST_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3011', // Use backend directly for testing
  timeout: 30000, // 30 seconds
  retries: 3
}

/**
 * Simple test runner implementation
 */
class SimpleTestRunner {
  constructor() {
    this.results = []
    this.startTime = Date.now()
  }

  async runTest(name, testFn) {
    const startTime = Date.now()
    console.log(`⏳ Running: ${name}`)
    
    try {
      const result = await testFn()
      const duration = Date.now() - startTime
      
      this.results.push({
        name,
        success: true,
        duration,
        result
      })
      
      console.log(`✅ Passed: ${name} (${duration}ms)`)
      return true
    } catch (error) {
      const duration = Date.now() - startTime
      
      this.results.push({
        name,
        success: false,
        duration,
        error: error.message
      })
      
      console.log(`❌ Failed: ${name} (${duration}ms)`)
      console.log(`   Error: ${error.message}`)
      return false
    }
  }

  getSummary() {
    const totalTests = this.results.length
    const passedTests = this.results.filter(r => r.success).length
    const failedTests = totalTests - passedTests
    const totalDuration = Date.now() - this.startTime
    const successRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0

    return {
      totalTests,
      passedTests,
      failedTests,
      totalDuration,
      successRate: parseFloat(successRate)
    }
  }

  printSummary() {
    const summary = this.getSummary()
    
    console.log('\n📊 Test Summary Report')
    console.log('=' .repeat(50))
    console.log(`Total Tests: ${summary.totalTests}`)
    console.log(`Passed: ${summary.passedTests}`)
    console.log(`Failed: ${summary.failedTests}`)
    console.log(`Success Rate: ${summary.successRate}%`)
    console.log(`Total Duration: ${summary.totalDuration}ms`)
    
    if (summary.failedTests > 0) {
      console.log('\nFailed Tests:')
      this.results
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`  - ${r.name}: ${r.error}`)
        })
    }
    
    if (summary.failedTests === 0) {
      console.log('\n🎉 All tests passed!')
    } else {
      console.log(`\n⚠️ ${summary.failedTests} test(s) failed`)
    }
  }
}

/**
 * HTTP request helper
 */
async function makeRequest(url, options = {}) {
  const https = require('https')
  const http = require('http')
  const urlParsed = new URL(url)
  const client = urlParsed.protocol === 'https:' ? https : http

  return new Promise((resolve, reject) => {
    const req = client.request(url, {
      method: 'GET',
      timeout: TEST_CONFIG.timeout,
      ...options
    }, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {}
          resolve({ status: res.statusCode, data: parsed, headers: res.headers })
        } catch (error) {
          resolve({ status: res.statusCode, data, headers: res.headers })
        }
      })
    })

    req.on('error', reject)
    req.on('timeout', () => {
      req.destroy()
      reject(new Error('Request timeout'))
    })

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body))
    }

    req.end()
  })
}

/**
 * Test authentication endpoints
 */
async function testAuthEndpoints() {
  const runner = new SimpleTestRunner()
  
  console.log('🚀 Starting Authentication E2E Tests...')
  console.log(`Base URL: ${TEST_CONFIG.baseUrl}`)
  console.log(`Timeout: ${TEST_CONFIG.timeout}ms`)
  console.log('')

  // Test 1: Health check
  await runner.runTest('Backend Health Check', async () => {
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/better-auth/health`)
    
    if (response.status !== 200) {
      throw new Error(`Health check failed with status ${response.status}`)
    }
    
    if (!response.data.status || response.data.status !== 'healthy') {
      throw new Error('Health check returned unhealthy status')
    }
    
    return { status: response.data.status, service: response.data.service }
  })

  // Test 2: Session endpoint (should return no session initially)
  await runner.runTest('Session Endpoint (No Session)', async () => {
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/better-auth/session`)
    
    if (response.status !== 200) {
      throw new Error(`Session endpoint failed with status ${response.status}`)
    }
    
    if (response.data.user !== null) {
      throw new Error('Session endpoint should return null user when not authenticated')
    }
    
    return { hasSession: false, user: response.data.user }
  })

  // Test 3: Registration endpoint (with invalid data)
  await runner.runTest('Registration Validation', async () => {
    const invalidData = {
      email: 'invalid-email',
      password: '123',
      firstName: '',
      lastName: 'Test'
    }
    
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/better-auth/sign-up`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(invalidData)
    })
    
    if (response.status === 200 || response.status === 201) {
      throw new Error('Registration should have failed with invalid data')
    }
    
    return { validationWorking: true, status: response.status }
  })

  // Test 4: Login endpoint (with invalid credentials)
  await runner.runTest('Login Validation', async () => {
    const invalidCredentials = {
      email: 'nonexistent@example.com',
      password: 'wrongpassword'
    }
    
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/better-auth/sign-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(invalidCredentials)
    })
    
    if (response.status === 200) {
      throw new Error('Login should have failed with invalid credentials')
    }
    
    return { validationWorking: true, status: response.status }
  })

  // Test 5: User profile endpoint (requires authentication)
  await runner.runTest('User Profile Endpoint (Unauthenticated)', async () => {
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/better-auth/user`)
    
    // Should return 401 or 403 when not authenticated
    if (response.status === 200) {
      throw new Error('User profile endpoint should require authentication')
    }
    
    return { authenticationRequired: true, status: response.status }
  })

  // Test 6: Organization endpoints
  await runner.runTest('Organization Endpoints', async () => {
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/better-auth/use-active-organization`)
    
    if (response.status !== 200) {
      throw new Error(`Organization endpoint failed with status ${response.status}`)
    }
    
    // Should return null data when not authenticated
    if (response.data.data !== null) {
      throw new Error('Organization endpoint should return null when not authenticated')
    }
    
    return { organizationEndpointWorking: true, status: response.status }
  })

  runner.printSummary()
  
  // Return exit code
  const summary = runner.getSummary()
  return summary.failedTests === 0 ? 0 : 1
}

/**
 * Check if Next.js dev server is running
 */
async function checkDevServer() {
  try {
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/better-auth/health`)
    return response.status === 200
  } catch (error) {
    return false
  }
}

/**
 * Start Next.js dev server if not running
 */
async function startDevServer() {
  console.log('Starting Next.js development server...')
  
  const child = spawn('npm', ['run', 'dev'], {
    cwd: __dirname,
    stdio: 'pipe',
    detached: false
  })
  
  // Wait for server to start
  let attempts = 0
  const maxAttempts = 30 // 30 seconds
  
  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    if (await checkDevServer()) {
      console.log('✅ Development server is ready')
      return child
    }
    
    attempts++
    console.log(`⏳ Waiting for server to start... (${attempts}/${maxAttempts})`)
  }
  
  child.kill()
  throw new Error('Failed to start development server')
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2)
  const shouldStartServer = args.includes('--start-server')
  
  console.log('🧪 Authentication E2E Test Runner')
  console.log('=' .repeat(50))
  
  let serverProcess = null
  
  try {
    // Check if server is running
    const serverRunning = await checkDevServer()
    
    if (!serverRunning) {
      if (shouldStartServer) {
        serverProcess = await startDevServer()
      } else {
        console.log('❌ Development server is not running')
        console.log('Please start the server with: npm run dev')
        console.log('Or run this script with: --start-server flag')
        process.exit(1)
      }
    } else {
      console.log('✅ Development server is running')
    }
    
    console.log('')
    
    // Run tests
    const exitCode = await testAuthEndpoints()
    
    // Cleanup
    if (serverProcess) {
      console.log('\n🧹 Stopping development server...')
      serverProcess.kill()
    }
    
    process.exit(exitCode)
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message)
    
    if (serverProcess) {
      serverProcess.kill()
    }
    
    process.exit(1)
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n⚠️ Test execution interrupted')
  process.exit(1)
})

process.on('SIGTERM', () => {
  console.log('\n⚠️ Test execution terminated')
  process.exit(1)
})

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}