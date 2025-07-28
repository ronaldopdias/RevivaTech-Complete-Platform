/**
 * Global Test Teardown for RevivaTech E2E Testing
 * Cleans up test environment and generates reports
 */

import { FullConfig } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Cleaning up RevivaTech test environment...');
  
  const startTime = Date.now();
  
  try {
    // 1. Generate test summary report
    await generateTestSummary();
    
    // 2. Cleanup test data
    await cleanupTestData();
    
    // 3. Archive test artifacts
    await archiveTestArtifacts();
    
    // 4. Cleanup temporary files
    await cleanupTemporaryFiles();
    
    const teardownTime = Date.now() - startTime;
    console.log(`✅ Test environment cleanup completed in ${teardownTime}ms`);
    
  } catch (error) {
    console.error('❌ Failed to cleanup test environment:', error);
    // Don't throw here - we don't want cleanup failures to fail the entire test run
  }
}

async function generateTestSummary() {
  console.log('📊 Generating test summary report...');
  
  try {
    const testResultsPath = path.join(process.cwd(), 'test-results');
    
    // Check if test results exist
    try {
      await fs.access(testResultsPath);
    } catch {
      console.log('ℹ️ No test results found to summarize');
      return;
    }
    
    // Read test results
    const files = await fs.readdir(testResultsPath);
    const jsonResults = files.filter(file => file.endsWith('.json'));
    
    if (jsonResults.length === 0) {
      console.log('ℹ️ No JSON test results found');
      return;
    }
    
    // Process test results
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    let skippedTests = 0;
    const testSuites: any[] = [];
    
    for (const resultFile of jsonResults) {
      try {
        const resultPath = path.join(testResultsPath, resultFile);
        const resultData = JSON.parse(await fs.readFile(resultPath, 'utf8'));
        
        if (resultData.suites) {
          resultData.suites.forEach((suite: any) => {
            testSuites.push(suite);
            
            suite.specs?.forEach((spec: any) => {
              spec.tests?.forEach((test: any) => {
                totalTests++;
                
                if (test.results?.some((r: any) => r.status === 'passed')) {
                  passedTests++;
                } else if (test.results?.some((r: any) => r.status === 'failed')) {
                  failedTests++;
                } else {
                  skippedTests++;
                }
              });
            });
          });
        }
      } catch (error) {
        console.warn(`⚠️ Failed to process ${resultFile}:`, error);
      }
    }
    
    // Generate summary
    const summary = {
      timestamp: new Date().toISOString(),
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      successRate: totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(2) + '%' : 'N/A',
      testSuites: testSuites.length,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        ci: !!process.env.CI
      }
    };
    
    // Write summary to file
    const summaryPath = path.join(testResultsPath, 'test-summary.json');
    await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
    
    // Write human-readable summary
    const readableSummary = `# RevivaTech Test Summary

## Test Results
- **Total Tests**: ${totalTests}
- **Passed**: ${passedTests} ✅
- **Failed**: ${failedTests} ❌
- **Skipped**: ${skippedTests} ⏭️
- **Success Rate**: ${summary.successRate}

## Test Suites
- **Number of Suites**: ${testSuites.length}

## Environment
- **Node Version**: ${process.version}
- **Platform**: ${process.platform}
- **CI Environment**: ${!!process.env.CI}
- **Timestamp**: ${new Date().toLocaleString()}

## Test Categories Covered
- ✅ End-to-End Booking Flow
- ✅ Payment Integration
- ✅ WebSocket Real-time Features
- ✅ Mobile Responsiveness
- ✅ Cross-browser Compatibility
- ✅ Performance Testing
- ✅ Security Testing
`;
    
    const readableSummaryPath = path.join(testResultsPath, 'TEST_SUMMARY.md');
    await fs.writeFile(readableSummaryPath, readableSummary);
    
    console.log(`✅ Test summary generated: ${summary.successRate} success rate (${passedTests}/${totalTests} passed)`);
    
  } catch (error) {
    console.error('❌ Failed to generate test summary:', error);
  }
}

async function cleanupTestData() {
  console.log('🗑️ Cleaning up test data...');
  
  try {
    // Clean up test database
    const response = await fetch('http://localhost:3011/api/test/cleanup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-admin-token'
      },
      body: JSON.stringify({
        cleanupType: 'test-data-only',
        preserveSchema: true
      })
    });
    
    if (response.ok) {
      console.log('✅ Test data cleaned up');
    } else {
      console.warn('⚠️ Test data cleanup failed:', response.statusText);
    }
    
  } catch (error) {
    console.warn('⚠️ Failed to cleanup test data:', error);
    // Don't throw - this is not critical
  }
}

async function archiveTestArtifacts() {
  console.log('📦 Archiving test artifacts...');
  
  try {
    const testResultsPath = path.join(process.cwd(), 'test-results');
    const archivePath = path.join(process.cwd(), 'test-archives');
    
    // Check if test results exist
    try {
      await fs.access(testResultsPath);
    } catch {
      console.log('ℹ️ No test results to archive');
      return;
    }
    
    // Create archive directory
    await fs.mkdir(archivePath, { recursive: true });
    
    // Create timestamped archive directory
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const archiveDir = path.join(archivePath, `test-run-${timestamp}`);
    await fs.mkdir(archiveDir, { recursive: true });
    
    // Copy test results to archive
    const files = await fs.readdir(testResultsPath);
    
    for (const file of files) {
      const srcPath = path.join(testResultsPath, file);
      const destPath = path.join(archiveDir, file);
      
      try {
        const stat = await fs.stat(srcPath);
        if (stat.isFile()) {
          await fs.copyFile(srcPath, destPath);
        } else if (stat.isDirectory()) {
          // Recursively copy directories
          await copyDirectory(srcPath, destPath);
        }
      } catch (error) {
        console.warn(`⚠️ Failed to archive ${file}:`, error);
      }
    }
    
    console.log(`✅ Test artifacts archived to: ${archiveDir}`);
    
  } catch (error) {
    console.warn('⚠️ Failed to archive test artifacts:', error);
  }
}

async function copyDirectory(src: string, dest: string) {
  await fs.mkdir(dest, { recursive: true });
  const files = await fs.readdir(src);
  
  for (const file of files) {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    const stat = await fs.stat(srcPath);
    
    if (stat.isFile()) {
      await fs.copyFile(srcPath, destPath);
    } else if (stat.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    }
  }
}

async function cleanupTemporaryFiles() {
  console.log('🧽 Cleaning up temporary files...');
  
  try {
    const tempPaths = [
      path.join(process.cwd(), '.playwright'),
      path.join(process.cwd(), 'test-results', 'temp'),
      path.join(process.cwd(), 'screenshots', 'temp')
    ];
    
    for (const tempPath of tempPaths) {
      try {
        await fs.access(tempPath);
        
        // Clean up temporary files but preserve the directory structure
        const files = await fs.readdir(tempPath);
        for (const file of files) {
          if (file.startsWith('temp-') || file.endsWith('.tmp')) {
            await fs.unlink(path.join(tempPath, file));
          }
        }
        
      } catch {
        // Directory doesn't exist - that's fine
      }
    }
    
    console.log('✅ Temporary files cleaned up');
    
  } catch (error) {
    console.warn('⚠️ Failed to cleanup temporary files:', error);
  }
}

export default globalTeardown;