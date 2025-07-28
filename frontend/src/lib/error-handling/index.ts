// Error handling exports
export { default as ErrorBoundary, withErrorBoundary } from './errorBoundary';
export { default as errorReporting, reportError, addBreadcrumb, trackInteraction, trackApiCall, trackNavigation, trackPerformance } from './errorReporting';
export { default as ApiErrorHandler, ApiClient, apiClient, type ApiError } from './apiErrorHandler';

// Toast exports
export { default as ToastProvider, useToast, useToastHelpers } from '../components/ui/Toast';

// Hooks exports
export { useApiError, useApiOperation, useFormSubmission } from '../hooks/useApiError';

// Error boundary wrapper for Next.js pages
export const withPageErrorBoundary = (Component: React.ComponentType) => {
  return withErrorBoundary(Component, {
    showDetails: process.env.NODE_ENV === 'development',
    onError: (error, errorInfo) => {
      console.error('Page Error:', error, errorInfo);
    },
  });
};

// Global error handler setup
export const setupGlobalErrorHandling = () => {
  // The error reporting service automatically sets up global handlers
  // This function can be used to initialize any additional error handling
  
  // Set up performance observer for tracking performance issues
  if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'largest-contentful-paint') {
            trackPerformance('LCP', entry.startTime);
          }
          if (entry.entryType === 'first-input') {
            trackPerformance('FID', entry.processingStart - entry.startTime);
          }
          if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
            trackPerformance('CLS', entry.value);
          }
        }
      });
      
      observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
    } catch (error) {
      console.warn('Failed to set up performance observer:', error);
    }
  }
};

// Utility function to check if an error is retryable
export const isRetryableError = (error: any): boolean => {
  if (error && typeof error.status === 'number') {
    return ApiErrorHandler.shouldRetry(error);
  }
  return false;
};

// Utility function to get retry delay
export const getRetryDelay = (attempt: number): number => {
  return ApiErrorHandler.getRetryDelay(attempt);
};

// Export types
export type { Toast, ToastType } from '../components/ui/Toast';
export type { ApiError } from './apiErrorHandler';