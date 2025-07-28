import { check, sleep } from 'k6';
import http from 'k6/http';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom metrics
const httpReqFailed = new Rate('http_req_failed');
const iterationDuration = new Trend('iteration_duration');
const bookingFlow = new Counter('booking_flow_completions');
const apiErrors = new Counter('api_errors');

// Test configuration
export const options = {
  stages: [
    // Ramp up
    { duration: '2m', target: 10 },   // Ramp up to 10 users over 2 minutes
    { duration: '5m', target: 50 },   // Stay at 50 users for 5 minutes
    { duration: '2m', target: 100 },  // Ramp up to 100 users over 2 minutes
    { duration: '5m', target: 100 },  // Stay at 100 users for 5 minutes
    { duration: '2m', target: 200 },  // Ramp up to 200 users over 2 minutes
    { duration: '5m', target: 200 },  // Stay at 200 users for 5 minutes
    { duration: '5m', target: 0 },    // Ramp down to 0 users over 5 minutes
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests must complete below 2s
    http_req_failed: ['rate<0.05'],    // Error rate must be below 5%
    http_reqs: ['rate>10'],            // Must handle at least 10 req/s
    booking_flow_completions: ['count>50'], // At least 50 successful bookings
  },
  ext: {
    loadimpact: {
      distribution: {
        'amazon:us:ashburn': { loadZone: 'amazon:us:ashburn', percent: 50 },
        'amazon:gb:london': { loadZone: 'amazon:gb:london', percent: 50 },
      },
    },
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_URL = __ENV.API_URL || 'http://localhost:3001/api';

// Test data
const testDevices = [
  { category: 'apple', brand: 'Apple', model: 'iPhone 15 Pro Max' },
  { category: 'apple', brand: 'Apple', model: 'iPhone 14 Pro' },
  { category: 'android', brand: 'Samsung', model: 'Galaxy S24 Ultra' },
  { category: 'laptop-pc', brand: 'Dell', model: 'XPS 13' },
];

const testUsers = [
  { email: 'user1@example.com', password: 'password123' },
  { email: 'user2@example.com', password: 'password123' },
  { email: 'user3@example.com', password: 'password123' },
];

// Helper functions
function selectRandomDevice() {
  return testDevices[Math.floor(Math.random() * testDevices.length)];
}

function selectRandomUser() {
  return testUsers[Math.floor(Math.random() * testUsers.length)];
}

function generateRandomEmail() {
  const domains = ['example.com', 'test.com', 'demo.com'];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  return `user${Math.random().toString(36).substr(2, 9)}@${domain}`;
}

// Authentication helper
function authenticateUser(email, password) {
  const loginPayload = JSON.stringify({
    email: email,
    password: password,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const response = http.post(`${API_URL}/auth/login`, loginPayload, params);
  
  check(response, {
    'login successful': (r) => r.status === 200,
    'login response has token': (r) => JSON.parse(r.body).token !== undefined,
  });

  if (response.status === 200) {
    const body = JSON.parse(response.body);
    return body.token;
  }
  
  apiErrors.add(1);
  return null;
}

// Test scenarios
export default function () {
  const scenario = Math.random();
  
  if (scenario < 0.4) {
    // 40% - Guest booking flow
    guestBookingFlow();
  } else if (scenario < 0.7) {
    // 30% - Authenticated user flow
    authenticatedUserFlow();
  } else if (scenario < 0.85) {
    // 15% - Repair tracking
    repairTrackingFlow();
  } else if (scenario < 0.95) {
    // 10% - Quote approval
    quoteApprovalFlow();
  } else {
    // 5% - Admin dashboard (stress test)
    adminDashboardFlow();
  }
  
  sleep(Math.random() * 3 + 1); // Random sleep between 1-4 seconds
}

function guestBookingFlow() {
  const startTime = Date.now();
  
  // Homepage visit
  let response = http.get(`${BASE_URL}/`);
  check(response, {
    'homepage loads': (r) => r.status === 200,
    'homepage load time < 2s': (r) => r.timings.duration < 2000,
  });

  // Navigate to booking page
  response = http.get(`${BASE_URL}/book-repair`);
  check(response, {
    'booking page loads': (r) => r.status === 200,
    'booking page has device selector': (r) => r.body.includes('device-selector'),
  });

  // Get device categories
  response = http.get(`${API_URL}/devices/categories`);
  check(response, {
    'device categories API works': (r) => r.status === 200,
    'has device categories': (r) => JSON.parse(r.body).categories.length > 0,
  });

  // Select device and get models
  const device = selectRandomDevice();
  response = http.get(`${API_URL}/devices/models?category=${device.category}`);
  check(response, {
    'device models API works': (r) => r.status === 200,
  });

  // Get availability
  response = http.get(`${API_URL}/availability?date=${new Date().toISOString().split('T')[0]}`);
  check(response, {
    'availability API works': (r) => r.status === 200,
  });

  // Submit booking
  const bookingPayload = JSON.stringify({
    device: device,
    issue: {
      type: 'Screen Repair',
      description: 'Screen is cracked and not responding to touch',
    },
    serviceType: 'In-Store',
    appointment: {
      date: new Date().toISOString(),
      time: '10:00',
    },
    customer: {
      firstName: 'Test',
      lastName: 'User',
      email: generateRandomEmail(),
      phone: '+44 7123 456789',
    },
    agreeToTerms: true,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  response = http.post(`${API_URL}/bookings`, bookingPayload, params);
  const bookingSuccess = check(response, {
    'booking submission successful': (r) => r.status === 201,
    'booking response has reference': (r) => {
      try {
        return JSON.parse(r.body).referenceNumber !== undefined;
      } catch (e) {
        return false;
      }
    },
  });

  if (bookingSuccess) {
    bookingFlow.add(1);
  } else {
    apiErrors.add(1);
  }

  const endTime = Date.now();
  iterationDuration.add(endTime - startTime);
}

function authenticatedUserFlow() {
  const startTime = Date.now();
  const user = selectRandomUser();
  
  // Login
  const token = authenticateUser(user.email, user.password);
  if (!token) {
    return;
  }

  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Dashboard visit
  let response = http.get(`${BASE_URL}/dashboard`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  check(response, {
    'dashboard loads': (r) => r.status === 200,
  });

  // Get user repairs
  response = http.get(`${API_URL}/user/repairs`, { headers: authHeaders });
  check(response, {
    'user repairs API works': (r) => r.status === 200,
  });

  // Get user quotes
  response = http.get(`${API_URL}/user/quotes`, { headers: authHeaders });
  check(response, {
    'user quotes API works': (r) => r.status === 200,
  });

  // Update profile
  const profilePayload = JSON.stringify({
    name: 'Updated Test User',
    phone: '+44 7987 654321',
  });

  response = http.put(`${API_URL}/user/profile`, profilePayload, { headers: authHeaders });
  check(response, {
    'profile update successful': (r) => r.status === 200,
  });

  const endTime = Date.now();
  iterationDuration.add(endTime - startTime);
}

function repairTrackingFlow() {
  const startTime = Date.now();
  
  // Visit tracking page
  let response = http.get(`${BASE_URL}/track`);
  check(response, {
    'tracking page loads': (r) => r.status === 200,
  });

  // Search for repair
  const searchPayload = JSON.stringify({
    repairReference: 'REP-2024-001',
    email: 'customer@example.com',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  response = http.post(`${API_URL}/repairs/search`, searchPayload, params);
  check(response, {
    'repair search works': (r) => r.status === 200 || r.status === 404,
  });

  // Get repair details if found
  if (response.status === 200) {
    const repair = JSON.parse(response.body);
    response = http.get(`${API_URL}/repairs/${repair.id}`);
    check(response, {
      'repair details loads': (r) => r.status === 200,
    });

    // Get repair timeline
    response = http.get(`${API_URL}/repairs/${repair.id}/timeline`);
    check(response, {
      'repair timeline loads': (r) => r.status === 200,
    });
  }

  const endTime = Date.now();
  iterationDuration.add(endTime - startTime);
}

function quoteApprovalFlow() {
  const startTime = Date.now();
  
  // Visit quote approval page (simulated email link)
  const quoteId = 'QT-2024-001';
  const token = 'test-token-123';
  let response = http.get(`${BASE_URL}/quotes/approve/${quoteId}?token=${token}&email=customer@example.com`);
  
  check(response, {
    'quote approval page loads': (r) => r.status === 200 || r.status === 404,
  });

  if (response.status === 200) {
    // Get quote details
    response = http.get(`${API_URL}/quotes/${quoteId}?token=${token}`);
    check(response, {
      'quote details API works': (r) => r.status === 200 || r.status === 404,
    });

    // Approve quote (if exists)
    if (response.status === 200) {
      const approvalPayload = JSON.stringify({
        approved: true,
        paymentMethod: 'card',
      });

      const params = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      };

      response = http.post(`${API_URL}/quotes/${quoteId}/approve`, approvalPayload, params);
      check(response, {
        'quote approval works': (r) => r.status === 200 || r.status === 400,
      });
    }
  }

  const endTime = Date.now();
  iterationDuration.add(endTime - startTime);
}

function adminDashboardFlow() {
  const startTime = Date.now();
  
  // Admin login
  const token = authenticateUser('admin@example.com', 'admin123');
  if (!token) {
    return;
  }

  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Admin dashboard
  let response = http.get(`${BASE_URL}/admin`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  check(response, {
    'admin dashboard loads': (r) => r.status === 200,
  });

  // Get analytics data
  response = http.get(`${API_URL}/admin/analytics`, { headers: authHeaders });
  check(response, {
    'analytics API works': (r) => r.status === 200,
  });

  // Get all repairs
  response = http.get(`${API_URL}/admin/repairs?limit=50`, { headers: authHeaders });
  check(response, {
    'admin repairs API works': (r) => r.status === 200,
  });

  // Get all users
  response = http.get(`${API_URL}/admin/users?limit=50`, { headers: authHeaders });
  check(response, {
    'admin users API works': (r) => r.status === 200,
  });

  const endTime = Date.now();
  iterationDuration.add(endTime - startTime);
}

// Setup and teardown
export function setup() {
  console.log('Starting load test...');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`API URL: ${API_URL}`);
  
  // Verify the application is running
  const response = http.get(`${BASE_URL}/`);
  if (response.status !== 200) {
    throw new Error(`Application not available at ${BASE_URL}`);
  }
  
  return { timestamp: Date.now() };
}

export function teardown(data) {
  console.log(`Load test completed. Started at: ${new Date(data.timestamp).toISOString()}`);
  console.log(`Duration: ${(Date.now() - data.timestamp) / 1000}s`);
}