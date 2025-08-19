#!/usr/bin/env node

/**
 * Comprehensive Authentication Test CLI Runner - Task 12
 * Command-line interface for running comprehensive authentication tests
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3010',
  timeout: 60000, // 60 seconds
  outputFile: 'comprehensive-auth-test-results.json'
};

/**
 * Check if development server is running
 */
async function checkServerHealth() {
  try {
    const response = await fetch(`${CONFIG.baseUrl}/api/health`);
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Start development server if not running
 */
function startDevServer() {
  return new Promise((resolve, reject) => {
    console.log('🚀 Starting development server...');
    
    const server = spawn('npm', ['run', 'dev'], {
      stdio: 'pipe',
      cwd: process.cwd()
    });

    let serverReady = false;
    
    server.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(output);
      
      if (output.includes('Ready') || output.includes('started server')) {
        if (!serverReady) {
          serverReady = true;
          console.log('✅ Development server is ready');
          resolve(server);
        }
      }
    });

    server.stderr.on('data', (data) => {
      console.error('Server error:', data.toString());
    });

    server.on('error', (error) => {
      reject(error);
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      if (!serverReady) {
        reject(new Error('Server startup timeout'));
      }
    }, 30000);
  });
}

/**
 * Run comprehensive authentication tests
 */
async function runComprehensiveTests() {
  console.log('🧪 Comprehensive Authentication Test Runner');
  console.log('=' .repeat(50));
  console.log('Testing Requirements: 8.1, 8.2, 8.3, 8.4');
  console.log(`Base URL: ${CONFIG.baseUrl}`);
  console.log(`Timeout: ${CONFIG.timeout}ms`);
  console.log('');

  try {
    // Check if server is running
    const serverRunning = await checkServerHealth();
    let server = null;

    if (!serverRunning) {
      if (process.argv.includes('--start-server')) {
        server = await startDevServer();
        // Wait a bit more for server to be fully ready
        await new Promise(resolve => setTimeout(resolve, 3000));
      } else {
        console.error('❌ Development server is not running');
        console.log('💡 Start the server with: npm run dev');
        console.log('💡 Or run with --start-server flag to auto-start');
        process.exit(1);
      }
    } else {
      console.log('✅ Development server is running');
    }

    // Import and run tests (dynamic import for ES modules)
    console.log('\n🚀 Starting Comprehensive Authentication Tests...');
    
    // Since we can't directly import ES modules in this CommonJS script,
    // we'll use a different approach - run the tests via a separate Node.js process
    const testScript = `
      import { runComprehensiveAuthTests } from './src/lib/auth/comprehensive-auth-tests.js';
      
      try {
        const results = await runComprehensiveAuthTests();
        
        // Calculate summary
        const summary = {
          totalSuites: results.length,
          totalTests: results.reduce((sum, suite) => sum + suite.totalTests, 0),
          totalPassed: results.reduce((sum, suite) => sum + suite.passedTests, 0),
          totalFailed: results.reduce((sum, suite) => sum + suite.failedTests, 0),
          totalDuration: results.reduce((sum, suite) => sum + suite.totalDuration, 0)
        };
        
        console.log('\\n📊 Test Summary Report');
        console.log('=' .repeat(50));
        console.log(\`Total Suites: \${summary.totalSuites}\`);
        console.log(\`Total Tests: \${summary.totalTests}\`);
        console.log(\`Passed: \${summary.totalPassed}\`);
        console.log(\`Failed: \${summary.totalFailed}\`);
        console.log(\`Success Rate: \${summary.totalTests > 0 ? ((summary.totalPassed / summary.totalTests) * 100).toFixed(1) : 0}%\`);
        console.log(\`Total Duration: \${summary.totalDuration}ms\`);
        
        if (summary.totalFailed === 0) {
          console.log('\\n🎉 All comprehensive tests passed!');
          console.log('✅ Authentication system is fully validated and production-ready');
        } else {
          console.log(\`\\n⚠️ \${summary.totalFailed} test(s) failed\`);
        }
        
        // Export results
        const exportData = {
          timestamp: new Date().toISOString(),
          testType: 'comprehensive_authentication_tests',
          requirements: ['8.1', '8.2', '8.3', '8.4'],
          testSuites: results,
          summary
        };
        
        const fs = await import('fs');
        fs.writeFileSync('${CONFIG.outputFile}', JSON.stringify(exportData, null, 2));
        console.log(\`\\n📄 Results exported to: ${CONFIG.outputFile}\`);
        
        process.exit(summary.totalFailed > 0 ? 1 : 0);
      } catch (error) {
        console.error('❌ Test execution failed:', error);
        process.exit(1);
      }
    `;

    // Write temporary test script
    const tempScriptPath = path.join(process.cwd(), 'temp-comprehensive-test.mjs');
    fs.writeFileSync(tempScriptPath, testScript);

    // Run the test script
    const testProcess = spawn('node', [tempScriptPath], {
      stdio: 'inherit',
      cwd: process.cwd()
    });

    testProcess.on('close', (code) => {
      // Clean up temporary script
      try {
        fs.unlinkSync(tempScriptPath);
      } catch (error) {
        // Ignore cleanup errors
      }

      // Clean up server if we started it
      if (server) {
        console.log('🛑 Stopping development server...');
        server.kill();
      }

      process.exit(code);
    });

    testProcess.on('error', (error) => {
      console.error('❌ Test process error:', error);
      
      // Clean up
      try {
        fs.unlinkSync(tempScriptPath);
      } catch (e) {}
      
      if (server) {
        server.kill();
      }
      
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ Comprehensive test execution failed:', error);
    process.exit(1);
  }
}

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Comprehensive Authentication Test Runner

Usage: node test-comprehensive-auth.js [options]

Options:
  --start-server    Automatically start development server if not running
  --help           Show this help message

Examples:
  node test-comprehensive-auth.js                    # Run tests (server must be running)
  node test-comprehensive-auth.js --start-server     # Auto-start server and run tests

Requirements Tested:
  8.1 - User registration flow with Better Auth
  8.2 - Login/logout functionality  
  8.3 - Session persistence across page refreshes
  8.4 - Automatic session refresh when tokens expire

Test Categories:
  • Basic Authentication Tests
  • Role-Based Access Control Tests  
  • Error Scenario Tests
  • Edge Case Tests
  • Security Tests
  • Performance Tests
`);
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }
  
  runComprehensiveTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}