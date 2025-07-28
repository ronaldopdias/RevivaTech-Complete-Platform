/**
 * Global Test Setup for RevivaTech E2E Testing
 * Initializes test environment, database, and authentication
 */

import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Setting up RevivaTech test environment...');
  
  const startTime = Date.now();
  
  try {
    // 1. Setup test database
    await setupTestDatabase();
    
    // 2. Verify services are running
    await verifyServices();
    
    // 3. Setup test users and authentication
    await setupTestAuthentication();
    
    // 4. Setup test data
    await setupTestData();
    
    // 5. Verify WebSocket connections
    await verifyWebSocketConnections();
    
    const setupTime = Date.now() - startTime;
    console.log(`✅ Test environment setup completed in ${setupTime}ms`);
    
  } catch (error) {
    console.error('❌ Failed to setup test environment:', error);
    throw error;
  }
}

async function setupTestDatabase() {
  console.log('📊 Setting up test database...');
  
  try {
    // Reset test database to known state
    const response = await fetch('http://localhost:3011/api/test/reset-database', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-admin-token'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Database reset failed: ${response.statusText}`);
    }
    
    console.log('✅ Test database ready');
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  }
}

async function verifyServices() {
  console.log('🔍 Verifying services...');
  
  const services = [
    { name: 'Frontend', url: 'http://localhost:3010/api/health' },
    { name: 'Backend', url: 'http://localhost:3011/api/health' },
    { name: 'Database', url: 'http://localhost:3011/api/test-db' }
  ];
  
  for (const service of services) {
    try {
      const response = await fetch(service.url, {
        method: 'GET',
        timeout: 10000
      });
      
      if (!response.ok) {
        throw new Error(`${service.name} health check failed: ${response.statusText}`);
      }
      
      console.log(`✅ ${service.name} service is healthy`);
    } catch (error) {
      console.error(`❌ ${service.name} service check failed:`, error);
      throw error;
    }
  }
}

async function setupTestAuthentication() {
  console.log('🔐 Setting up test authentication...');
  
  const testUsers = [
    {
      email: 'admin@test.com',
      password: 'TestAdmin123!',
      role: 'ADMIN',
      firstName: 'Test',
      lastName: 'Admin'
    },
    {
      email: 'customer@example.com',
      password: 'TestPassword123!',
      role: 'CUSTOMER',
      firstName: 'Test',
      lastName: 'Customer'
    },
    {
      email: 'technician@test.com',
      password: 'TestTech123!',
      role: 'TECHNICIAN',
      firstName: 'Test',
      lastName: 'Technician'
    }
  ];
  
  for (const user of testUsers) {
    try {
      // Create test user
      const registerResponse = await fetch('http://localhost:3011/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(user)
      });
      
      if (registerResponse.ok) {
        console.log(`✅ Test user created: ${user.email}`);
      } else if (registerResponse.status === 409) {
        // User already exists - that's fine
        console.log(`ℹ️ Test user already exists: ${user.email}`);
      } else {
        throw new Error(`Failed to create user ${user.email}: ${registerResponse.statusText}`);
      }
      
      // Verify login works
      const loginResponse = await fetch('http://localhost:3011/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: user.email,
          password: user.password
        })
      });
      
      if (!loginResponse.ok) {
        throw new Error(`Login verification failed for ${user.email}: ${loginResponse.statusText}`);
      }
      
      const loginData = await loginResponse.json();
      if (!loginData.accessToken) {
        throw new Error(`No access token received for ${user.email}`);
      }
      
      console.log(`✅ Authentication verified for: ${user.email}`);
      
    } catch (error) {
      console.error(`❌ Failed to setup user ${user.email}:`, error);
      throw error;
    }
  }
}

async function setupTestData() {
  console.log('📋 Setting up test data...');
  
  try {
    // Create test booking data
    const testBookings = [
      {
        customerEmail: 'customer@example.com',
        deviceType: 'MacBook Pro 16"',
        issueDescription: 'Screen cracked',
        repairType: 'Screen Repair',
        status: 'pending',
        priority: 'normal'
      },
      {
        customerEmail: 'customer@example.com',
        deviceType: 'iPhone 15 Pro',
        issueDescription: 'Battery draining fast',
        repairType: 'Battery Replacement',
        status: 'in_progress',
        priority: 'high'
      }
    ];
    
    for (const booking of testBookings) {
      const response = await fetch('http://localhost:3011/api/test/create-booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-admin-token'
        },
        body: JSON.stringify(booking)
      });
      
      if (response.ok) {
        console.log(`✅ Test booking created: ${booking.deviceType}`);
      }
    }
    
    // Create test payment data
    const testPayments = [
      {
        amount: 299.99,
        currency: 'GBP',
        description: 'MacBook Screen Repair',
        status: 'completed',
        customerEmail: 'customer@example.com'
      }
    ];
    
    for (const payment of testPayments) {
      const response = await fetch('http://localhost:3011/api/test/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-admin-token'
        },
        body: JSON.stringify(payment)
      });
      
      if (response.ok) {
        console.log(`✅ Test payment created: ${payment.description}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Test data setup failed:', error);
    // Don't throw here - tests can still run without pre-existing data
  }
}

async function verifyWebSocketConnections() {
  console.log('🔌 Verifying WebSocket connections...');
  
  try {
    // Launch browser to test WebSocket connectivity
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    // Navigate to admin dashboard
    await page.goto('http://localhost:3010/admin');
    
    // Wait for WebSocket connection
    await page.waitForSelector('[data-testid="connection-indicator"]', { timeout: 10000 });
    
    // Check if connected
    const isConnected = await page.locator('[data-testid="connection-indicator"].bg-green-500').isVisible();
    
    if (isConnected) {
      console.log('✅ WebSocket connection verified');
    } else {
      console.warn('⚠️ WebSocket connection not established - tests may be affected');
    }
    
    await browser.close();
    
  } catch (error) {
    console.warn('⚠️ WebSocket verification failed:', error);
    // Don't throw here - some tests might still work
  }
}

export default globalSetup;