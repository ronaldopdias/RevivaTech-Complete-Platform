/**
 * Testing Setup for RevivaTech Phase 7
 * Comprehensive testing configuration for components, PWA, and mobile features
 */

import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll } from '@jest/globals';
import { server } from './mocks/server';

// Setup MSW server for API mocking
beforeAll(() => {
  server.listen();
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

// Mock IntersectionObserver for components that use it
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock ResizeObserver for responsive components
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock window.matchMedia for responsive design tests
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

// Mock Service Worker API for PWA tests
global.navigator.serviceWorker = {
  register: jest.fn().mockResolvedValue({
    installing: null,
    waiting: null,
    active: {
      postMessage: jest.fn(),
    },
    unregister: jest.fn().mockResolvedValue(true),
    update: jest.fn().mockResolvedValue(undefined),
  }),
  ready: Promise.resolve({
    installing: null,
    waiting: null,
    active: {
      postMessage: jest.fn(),
    },
    unregister: jest.fn().mockResolvedValue(true),
    update: jest.fn().mockResolvedValue(undefined),
  }),
  controller: null,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

// Mock touch events for mobile testing
global.TouchEvent = class TouchEvent extends Event {
  touches: any[];
  targetTouches: any[];
  changedTouches: any[];

  constructor(type: string, eventInitDict?: any) {
    super(type, eventInitDict);
    this.touches = eventInitDict?.touches || [];
    this.targetTouches = eventInitDict?.targetTouches || [];
    this.changedTouches = eventInitDict?.changedTouches || [];
  }
};

// Mock localStorage for PWA offline testing
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

// Mock fetch for API tests
global.fetch = jest.fn();

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3011';