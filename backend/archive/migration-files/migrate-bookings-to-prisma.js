#!/usr/bin/env node

/**
 * Migration Script: Booking Routes from Raw SQL to Prisma
 * 
 * This script safely migrates the booking routes from raw SQL to Prisma.
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

const ROUTES_DIR = path.join(__dirname, '..', 'routes');
const BOOKING_FILE = path.join(ROUTES_DIR, 'bookings.js');
const BOOKING_PRISMA_FILE = path.join(ROUTES_DIR, 'bookings-prisma.js');
const BOOKING_BACKUP_FILE = path.join(ROUTES_DIR, 'bookings.backup.js');

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
  log('\n📦 Creating backup of original bookings.js...', colors.cyan);
  
  try {
    await fs.promises.copyFile(BOOKING_FILE, BOOKING_BACKUP_FILE);
    log('✅ Backup created: bookings.backup.js', colors.green);
    return true;
  } catch (error) {
    log(`❌ Failed to create backup: ${error.message}`, colors.red);
    return false;
  }
}

async function testBookingEndpoints() {
  log('\n🧪 Testing booking endpoints...', colors.cyan);
  
  const tests = [
    { endpoint: '/api/bookings/health', method: 'GET', expectedStatus: 200 }
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
  log('\n🚀 Starting booking migration to Prisma...', colors.cyan);
  
  try {
    // Rename original file
    await fs.promises.rename(BOOKING_FILE, BOOKING_FILE + '.old');
    log('  📝 Renamed bookings.js to bookings.js.old', colors.yellow);
    
    // Copy Prisma version as new bookings.js
    await fs.promises.copyFile(BOOKING_PRISMA_FILE, BOOKING_FILE);
    log('  📝 Installed bookings-prisma.js as new bookings.js', colors.yellow);
    
    log('✅ Migration completed successfully', colors.green);
    return true;
  } catch (error) {
    log(`❌ Migration failed: ${error.message}`, colors.red);
    return false;
  }
}

async function rollback() {
  log('\n⏮️  Rolling back to original bookings.js...', colors.yellow);
  
  try {
    await fs.promises.copyFile(BOOKING_BACKUP_FILE, BOOKING_FILE);
    
    try {
      await fs.promises.unlink(BOOKING_FILE + '.old');
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
  log('BOOKING ROUTES MIGRATION TO PRISMA', colors.cyan);
  log('='.repeat(60), colors.cyan);
  
  // Step 1: Backup original file
  if (!await backupOriginalFile()) {
    log('\n❌ Migration aborted due to backup failure', colors.red);
    process.exit(1);
  }
  
  // Step 2: Perform migration
  if (!await performMigration()) {
    log('\n❌ Migration failed, attempting rollback...', colors.red);
    await rollback();
    process.exit(1);
  }
  
  // Step 3: Restart backend
  if (!await restartBackend()) {
    log('\n⚠️  Please manually restart the backend service', colors.yellow);
  }
  
  // Step 4: Test endpoints
  const testsPass = await testBookingEndpoints();
  
  if (!testsPass) {
    log('\n⚠️  Some tests failed. Rolling back...', colors.yellow);
    await rollback();
    await restartBackend();
    log('\n❌ Migration rolled back due to test failures', colors.red);
    process.exit(1);
  }
  
  log('\n' + '='.repeat(60), colors.green);
  log('✨ BOOKING MIGRATION COMPLETED SUCCESSFULLY ✨', colors.green);
  log('='.repeat(60), colors.green);
  
  log('\n📋 Summary:', colors.cyan);
  log('  • Original bookings.js backed up to bookings.backup.js', colors.reset);
  log('  • Booking routes now using Prisma instead of raw SQL', colors.reset);
  log('  • All health check tests passed', colors.reset);
  log('  • Backend service restarted and operational', colors.reset);
  
  log('\n🔧 Next steps:', colors.yellow);
  log('  1. Test booking operations (create, update, cancel)', colors.reset);
  log('  2. Monitor error logs for any issues', colors.reset);
  log('  3. If issues occur, run rollback: node scripts/migrate-bookings-to-prisma.js --rollback', colors.reset);
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