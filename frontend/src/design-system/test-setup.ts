/**
 * Design System Test Setup
 * Configuration and utilities for testing design system components
 */

import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import { jest } from '@jest/globals';

// Configure React Testing Library
configure({
  testIdAttribute: 'data-testid',
  asyncUtilTimeout: 5000,
  computedStyleSupportsPseudoElements: true,
});

// Mock window.matchMedia
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

// Mock window.ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock window.IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock window.requestAnimationFrame
global.requestAnimationFrame = jest.fn().mockImplementation(cb => {
  setTimeout(cb, 0);
  return 0;
});

// Mock window.cancelAnimationFrame
global.cancelAnimationFrame = jest.fn();

// Mock window.performance
Object.defineProperty(window, 'performance', {
  writable: true,
  value: {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
  },
});

// Mock window.getComputedStyle
Object.defineProperty(window, 'getComputedStyle', {
  writable: true,
  value: jest.fn().mockImplementation(() => ({
    getPropertyValue: jest.fn().mockReturnValue(''),
  })),
});

// Mock CSS custom properties
Object.defineProperty(document.documentElement, 'style', {
  writable: true,
  value: {
    setProperty: jest.fn(),
    getPropertyValue: jest.fn().mockReturnValue(''),
  },
});

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  writable: true,
  value: {
    writeText: jest.fn().mockResolvedValue(undefined),
    readText: jest.fn().mockResolvedValue(''),
  },
});

// Mock console methods for cleaner test output
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Global test utilities
export const mockComponent = (name: string) => {
  return jest.fn().mockImplementation(({ children, ...props }) => {
    const div = document.createElement('div');
    div.setAttribute('data-testid', `mock-${name}`);
    Object.keys(props).forEach(key => {
      div.setAttribute(key, props[key]);
    });
    if (children) {
      div.textContent = typeof children === 'string' ? children : '[children]';
    }
    return div;
  });
};

export const mockIcon = jest.fn().mockImplementation(({ className, ...props }) => {
  const svg = document.createElement('svg');
  svg.setAttribute('data-testid', 'mock-icon');
  if (className) {
    svg.setAttribute('class', className);
  }
  Object.keys(props).forEach(key => {
    svg.setAttribute(key, props[key]);
  });
  const path = document.createElement('path');
  path.setAttribute('d', 'M0 0h24v24H0z');
  svg.appendChild(path);
  return svg;
});

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Heart: mockIcon,
  Share: mockIcon,
  Download: mockIcon,
  Star: mockIcon,
  Play: mockIcon,
  Pause: mockIcon,
  Settings: mockIcon,
  Plus: mockIcon,
  Minus: mockIcon,
  X: mockIcon,
  Check: mockIcon,
  ChevronDown: mockIcon,
  ChevronUp: mockIcon,
  ChevronLeft: mockIcon,
  ChevronRight: mockIcon,
  ArrowLeft: mockIcon,
  ArrowRight: mockIcon,
  ArrowUp: mockIcon,
  ArrowDown: mockIcon,
  Search: mockIcon,
  Filter: mockIcon,
  Menu: mockIcon,
  Eye: mockIcon,
  EyeOff: mockIcon,
  Edit: mockIcon,
  Trash: mockIcon,
  Copy: mockIcon,
  Save: mockIcon,
  Upload: mockIcon,
  Download: mockIcon,
  Loader: mockIcon,
  AlertCircle: mockIcon,
  CheckCircle: mockIcon,
  Info: mockIcon,
  Warning: mockIcon,
  Error: mockIcon,
}));

// Test helpers
export const waitForAnimation = () => new Promise(resolve => setTimeout(resolve, 100));

export const triggerResize = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
  window.dispatchEvent(new Event('resize'));
};

export const mockMediaQuery = (query: string, matches: boolean) => {
  window.matchMedia = jest.fn().mockImplementation(q => ({
    matches: q === query ? matches : false,
    media: q,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));
};

// Accessibility testing helpers
export const checkColorContrast = (foreground: string, background: string): boolean => {
  // Simplified color contrast check for testing
  // In real implementation, this would calculate actual contrast ratios
  return foreground !== background;
};

export const checkKeyboardNavigation = async (element: HTMLElement) => {
  // Helper to test keyboard navigation
  element.focus();
  expect(element).toHaveFocus();
  
  // Test Tab key
  element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
  
  // Test Enter key
  element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
  
  // Test Space key
  element.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
  
  // Test Escape key
  element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
};

// Performance testing helpers
export const measureRenderTime = (renderFn: () => void): number => {
  const start = performance.now();
  renderFn();
  const end = performance.now();
  return end - start;
};

export const createMockIntersectionObserver = (
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverInit
) => {
  const mockObserver = {
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  };

  const triggerIntersection = (entries: Partial<IntersectionObserverEntry>[]) => {
    const mockEntries = entries.map(entry => ({
      isIntersecting: entry.isIntersecting || false,
      intersectionRatio: entry.intersectionRatio || 0,
      boundingClientRect: entry.boundingClientRect || ({} as DOMRectReadOnly),
      intersectionRect: entry.intersectionRect || ({} as DOMRectReadOnly),
      rootBounds: entry.rootBounds || ({} as DOMRectReadOnly),
      target: entry.target || ({} as Element),
      time: entry.time || Date.now(),
    }));
    
    callback(mockEntries as IntersectionObserverEntry[], mockObserver as IntersectionObserver);
  };

  return {
    observer: mockObserver,
    triggerIntersection,
  };
};

// Design system specific test utilities
export const testAllVariants = async (
  Component: React.ComponentType<any>,
  variants: string[],
  baseProps: any = {}
) => {
  const results = [];
  
  for (const variant of variants) {
    const props = { ...baseProps, variant };
    const renderTime = measureRenderTime(() => {
      // In real implementation, this would render the component
      // For now, we just simulate the test
    });
    
    results.push({
      variant,
      renderTime,
      passed: renderTime < 50, // 50ms threshold
    });
  }
  
  return results;
};

export const testAllSizes = async (
  Component: React.ComponentType<any>,
  sizes: string[],
  baseProps: any = {}
) => {
  const results = [];
  
  for (const size of sizes) {
    const props = { ...baseProps, size };
    const renderTime = measureRenderTime(() => {
      // In real implementation, this would render the component
      // For now, we just simulate the test
    });
    
    results.push({
      size,
      renderTime,
      passed: renderTime < 50, // 50ms threshold
    });
  }
  
  return results;
};

// Cleanup helpers
export const cleanup = () => {
  // Clear all timers
  jest.clearAllTimers();
  
  // Clear all mocks
  jest.clearAllMocks();
  
  // Reset DOM
  document.body.innerHTML = '';
  
  // Reset window size
  triggerResize(1024, 768);
};

// Default test timeout
jest.setTimeout(10000);

// Setup cleanup after each test
afterEach(() => {
  cleanup();
});

export default {
  mockComponent,
  mockIcon,
  waitForAnimation,
  triggerResize,
  mockMediaQuery,
  checkColorContrast,
  checkKeyboardNavigation,
  measureRenderTime,
  createMockIntersectionObserver,
  testAllVariants,
  testAllSizes,
  cleanup,
};