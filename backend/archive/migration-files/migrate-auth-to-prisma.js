#!/usr/bin/env node

/**
 * Migration Script: Auth Routes from Raw SQL to Prisma
 * 
 * This script safely migrates the authentication routes from raw SQL to Prisma.
 * It includes backup, testing, and rollback capabilities.
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

const ROUTES_DIR = path.join(__dirname, '..', 'routes');
const AUTH_FILE = path.join(ROUTES_DIR, 'auth.js');
const AUTH_PRISMA_FILE = path.join(ROUTES_DIR, 'auth-prisma.js');
const AUTH_BACKUP_FILE = path.join(ROUTES_DIR, 'auth.backup.js');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function backupOriginalFile() {
  log('\n📦 Creating backup of original auth.js...', colors.cyan);
  
  try {
    // Create backup
    await fs.promises.copyFile(AUTH_FILE, AUTH_BACKUP_FILE);
    log('✅ Backup created: auth.backup.js', colors.green);
    return true;
  } catch (error) {
    log(`❌ Failed to create backup: ${error.message}`, colors.red);
    return false;
  }
}

async function testPrismaConnection() {
  log('\n🔍 Testing Prisma database connection...', colors.cyan);
  
  try {
    const { testConnection } = require('../lib/prisma');
    const connected = await testConnection();
    
    if (connected) {
      log('✅ Prisma database connection successful', colors.green);
      return true;
    } else {
      log('❌ Prisma database connection failed', colors.red);
      return false;
    }
  } catch (error) {
    log(`❌ Failed to test Prisma connection: ${error.message}`, colors.red);
    return false;
  }
}

async function testAuthEndpoints() {
  log('\n🧪 Testing authentication endpoints...', colors.cyan);
  
  const tests = [
    { endpoint: '/api/auth/health', method: 'GET', expectedStatus: 200 },
    { endpoint: '/api/auth/validate-simple', method: 'GET', expectedStatus: 200 }
  ];
  
  let allPassed = true;
  
  for (const test of tests) {
    try {
      const response = await fetch(`http://localhost:3011${test.endpoint}`, {
        method: test.method
      });
      
      if (response.status === test.expectedStatus) {
        log(`  ✅ ${test.method} ${test.endpoint} - Status ${response.status}`, colors.green);
      } else {
        log(`  ❌ ${test.method} ${test.endpoint} - Expected ${test.expectedStatus}, got ${response.status}`, colors.red);
        allPassed = false;
      }
    } catch (error) {
      log(`  ❌ ${test.method} ${test.endpoint} - ${error.message}`, colors.red);
      allPassed = false;
    }
  }
  
  return allPassed;
}

async function performMigration() {
  log('\n🚀 Starting migration to Prisma...', colors.cyan);
  
  try {
    // Rename original file
    await fs.promises.rename(AUTH_FILE, AUTH_FILE + '.old');
    log('  📝 Renamed auth.js to auth.js.old', colors.yellow);
    
    // Copy Prisma version as new auth.js
    await fs.promises.copyFile(AUTH_PRISMA_FILE, AUTH_FILE);
    log('  📝 Installed auth-prisma.js as new auth.js', colors.yellow);
    
    log('✅ Migration completed successfully', colors.green);
    return true;
  } catch (error) {
    log(`❌ Migration failed: ${error.message}`, colors.red);
    return false;
  }
}

async function rollback() {
  log('\n⏮️  Rolling back to original auth.js...', colors.yellow);
  
  try {
    // Restore from backup
    await fs.promises.copyFile(AUTH_BACKUP_FILE, AUTH_FILE);
    
    // Remove .old file if it exists
    try {
      await fs.promises.unlink(AUTH_FILE + '.old');
    } catch (e) {
      // Ignore if doesn't exist
    }
    
    log('✅ Rollback completed successfully', colors.green);
    return true;
  } catch (error) {
    log(`❌ Rollback failed: ${error.message}`, colors.red);
    return false;
  }
}

async function restartBackend() {
  log('\n🔄 Restarting backend service...', colors.cyan);
  
  try {
    await execAsync('docker restart revivatech_backend');
    log('✅ Backend service restarted', colors.green);
    
    // Wait for service to be ready
    log('⏳ Waiting for service to be ready...', colors.yellow);
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    return true;
  } catch (error) {
    log(`❌ Failed to restart backend: ${error.message}`, colors.red);
    return false;
  }
}

async function main() {
  log('\n' + '='.repeat(60), colors.cyan);
  log('AUTH ROUTES MIGRATION TO PRISMA', colors.cyan);
  log('='.repeat(60), colors.cyan);
  
  // Step 1: Backup original file
  if (!await backupOriginalFile()) {
    log('\n❌ Migration aborted due to backup failure', colors.red);
    process.exit(1);
  }
  
  // Step 2: Test Prisma connection
  if (!await testPrismaConnection()) {
    log('\n❌ Migration aborted due to Prisma connection failure', colors.red);
    process.exit(1);
  }
  
  // Step 3: Perform migration
  if (!await performMigration()) {
    log('\n❌ Migration failed, attempting rollback...', colors.red);
    await rollback();
    process.exit(1);
  }
  
  // Step 4: Restart backend
  if (!await restartBackend()) {
    log('\n⚠️  Please manually restart the backend service', colors.yellow);
  }
  
  // Step 5: Test endpoints
  const testsPass = await testAuthEndpoints();
  
  if (!testsPass) {
    log('\n⚠️  Some tests failed. Rolling back...', colors.yellow);
    await rollback();
    await restartBackend();
    log('\n❌ Migration rolled back due to test failures', colors.red);
    process.exit(1);
  }
  
  log('\n' + '='.repeat(60), colors.green);
  log('✨ MIGRATION COMPLETED SUCCESSFULLY ✨', colors.green);
  log('='.repeat(60), colors.green);
  
  log('\n📋 Summary:', colors.cyan);
  log('  • Original auth.js backed up to auth.backup.js', colors.reset);
  log('  • Auth routes now using Prisma instead of raw SQL', colors.reset);
  log('  • All health check tests passed', colors.reset);
  log('  • Backend service restarted and operational', colors.reset);
  
  log('\n🔧 Next steps:', colors.yellow);
  log('  1. Test authentication flows (register, login, logout)', colors.reset);
  log('  2. Monitor error logs for any issues', colors.reset);
  log('  3. If issues occur, run rollback: node scripts/migrate-auth-to-prisma.js --rollback', colors.reset);
}

// Check for rollback flag
if (process.argv.includes('--rollback')) {
  log('\n⏮️  ROLLBACK MODE', colors.yellow);
  rollback().then(async (success) => {
    if (success) {
      await restartBackend();
      log('\n✅ Rollback completed', colors.green);
    } else {
      log('\n❌ Rollback failed', colors.red);
      process.exit(1);
    }
  });
} else {
  main().catch(error => {
    log(`\n❌ Unexpected error: ${error.message}`, colors.red);
    process.exit(1);
  });
}