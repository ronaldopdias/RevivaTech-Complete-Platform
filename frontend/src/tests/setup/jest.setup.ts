/**
 * Jest Setup File for RevivaTech Testing
 * Global test configuration and mocks
 */

import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      replace: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
      isLocaleDomain: false,
      isReady: true,
      defaultLocale: 'en',
      domainLocales: [],
    };
  },
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      refresh: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      prefetch: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '/';
  },
}));

// Mock WebSocket
global.WebSocket = jest.fn(() => ({
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  send: jest.fn(),
  close: jest.fn(),
  readyState: 1,
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
})) as any;

// Mock socket.io-client
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    connected: true,
    id: 'mock-socket-id',
  })),
}));

// Mock Stripe
jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn(() => 
    Promise.resolve({
      elements: jest.fn(() => ({
        create: jest.fn(() => ({
          mount: jest.fn(),
          unmount: jest.fn(),
          on: jest.fn(),
          off: jest.fn(),
        })),
      })),
      confirmCardPayment: jest.fn(),
      createPaymentMethod: jest.fn(),
    })
  ),
}));

jest.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: { children: React.ReactNode }) => children,
  CardElement: () => ({ type: 'div', props: { 'data-testid': 'mock-card-element' } }),
  useStripe: () => ({
    confirmCardPayment: jest.fn(),
    createPaymentMethod: jest.fn(),
  }),
  useElements: () => ({
    getElement: jest.fn(),
  }),
}));

// Mock fetch
global.fetch = jest.fn();

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock performance
Object.defineProperty(window, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByName: jest.fn(() => []),
    getEntriesByType: jest.fn(() => []),
  },
});

// Mock crypto
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: jest.fn(() => 'mock-uuid'),
    getRandomValues: jest.fn((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
  },
});

// Custom matchers
expect.extend({
  toBeValidPrice(received) {
    const pass = typeof received === 'number' && received > 0 && received < 10000;
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid price`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid price (number between 0 and 10000)`,
        pass: false,
      };
    }
  },
  
  toBeValidEmail(received) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = typeof received === 'string' && emailRegex.test(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid email`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid email address`,
        pass: false,
      };
    }
  },
  
  toBeValidBookingReference(received) {
    const refRegex = /^REV-\d{10}$/;
    const pass = typeof received === 'string' && refRegex.test(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid booking reference`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid booking reference (REV-XXXXXXXXXX)`,
        pass: false,
      };
    }
  },
});

// Global test utilities
global.TestUtils = {
  createMockUser: (overrides = {}) => ({
    id: 'test-user-id',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'CUSTOMER',
    ...overrides,
  }),
  
  createMockBooking: (overrides = {}) => ({
    id: 'test-booking-id',
    reference: 'REV-1234567890',
    deviceType: 'MacBook Pro 16"',
    issueDescription: 'Screen cracked',
    repairType: 'Screen Repair',
    status: 'pending',
    priority: 'normal',
    estimatedCost: 299.99,
    ...overrides,
  }),
  
  createMockPayment: (overrides = {}) => ({
    id: 'test-payment-id',
    amount: 299.99,
    currency: 'GBP',
    status: 'completed',
    description: 'MacBook Screen Repair',
    ...overrides,
  }),
  
  mockFetchResponse: (data: any, ok = true, status = 200) => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok,
      status,
      json: async () => data,
      text: async () => JSON.stringify(data),
    });
  },
  
  mockFetchError: (error: string) => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error(error));
  },
};

// Console warnings suppression for known issues
const originalWarn = console.warn;
console.warn = (message, ...args) => {
  // Suppress specific React warnings that don't affect our tests
  if (
    typeof message === 'string' &&
    (message.includes('useLayoutEffect does nothing on the server') ||
     message.includes('React.createFactory is deprecated'))
  ) {
    return;
  }
  originalWarn(message, ...args);
};

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
  localStorageMock.clear();
  sessionStorageMock.clear();
});