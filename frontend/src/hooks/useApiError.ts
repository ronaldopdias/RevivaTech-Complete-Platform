'use client';

import { useCallback } from 'react';
import { useToastHelpers } from '@/components/ui/Toast';
import { ApiError, ApiErrorHandler } from '@/lib/error-handling/apiErrorHandler';
import { errorReporting } from '@/lib/error-handling/errorReporting';

interface UseApiErrorOptions {
  showToast?: boolean;
  logError?: boolean;
  onError?: (error: ApiError) => void;
}

export const useApiError = (options: UseApiErrorOptions = {}) => {
  const {
    showToast = true,
    logError = true,
    onError,
  } = options;

  const { error: showErrorToast } = useToastHelpers();

  const handleError = useCallback(async (error: unknown) => {
    let apiError: ApiError;

    if (error instanceof Error) {
      apiError = error as ApiError;
    } else {
      apiError = new Error('An unknown error occurred') as ApiError;
    }

    // Log error if enabled
    if (logError) {
      await errorReporting.reportError(apiError, {
        severity: apiError.status ? ApiErrorHandler.getErrorSeverity(apiError.status) : 'medium',
        context: {
          userTriggered: true,
          handledBy: 'useApiError',
        },
      });
    }

    // Show toast notification if enabled
    if (showToast) {
      const title = ApiErrorHandler.getErrorTitle(apiError);
      const message = ApiErrorHandler.getErrorMessage(apiError);
      
      showErrorToast(title, message, {
        persistent: apiError.status && apiError.status >= 500,
        action: apiError.status === 401 ? {
          label: 'Login',
          onClick: () => window.location.href = '/login',
        } : undefined,
      });
    }

    // Call custom error handler if provided
    onError?.(apiError);

    return apiError;
  }, [showToast, logError, onError, showErrorToast]);

  const withErrorHandling = useCallback(<T extends any[], R>(
    fn: (...args: T) => Promise<R>
  ) => {
    return async (...args: T): Promise<R | undefined> => {
      try {
        return await fn(...args);
      } catch (error) {
        await handleError(error);
        return undefined;
      }
    };
  }, [handleError]);

  return {
    handleError,
    withErrorHandling,
  };
};

// Hook for handling specific API operations with error handling
export const useApiOperation = <T = any>(options: UseApiErrorOptions = {}) => {
  const { handleError, withErrorHandling } = useApiError(options);

  const execute = useCallback(async (
    operation: () => Promise<T>,
    onSuccess?: (result: T) => void,
    onError?: (error: ApiError) => void
  ): Promise<T | undefined> => {
    try {
      const result = await operation();
      onSuccess?.(result);
      return result;
    } catch (error) {
      const apiError = await handleError(error);
      onError?.(apiError);
      return undefined;
    }
  }, [handleError]);

  return {
    execute,
    withErrorHandling,
    handleError,
  };
};

// Hook for form submission with error handling
export const useFormSubmission = <T = any>(options: UseApiErrorOptions = {}) => {
  const { execute } = useApiOperation<T>(options);

  const submitForm = useCallback(async (
    formData: any,
    submitFunction: (data: any) => Promise<T>,
    onSuccess?: (result: T) => void,
    onError?: (error: ApiError) => void
  ) => {
    errorReporting.addBreadcrumb({
      message: 'Form submission started',
      category: 'user_interaction',
      level: 'info',
      data: { formType: typeof formData },
    });

    const result = await execute(
      () => submitFunction(formData),
      (result) => {
        errorReporting.addBreadcrumb({
          message: 'Form submission successful',
          category: 'user_interaction',
          level: 'info',
        });
        onSuccess?.(result);
      },
      (error) => {
        errorReporting.addBreadcrumb({
          message: `Form submission failed: ${error.message}`,
          category: 'user_interaction',
          level: 'error',
          data: { status: error.status, code: error.code },
        });
        onError?.(error);
      }
    );

    return result;
  }, [execute]);

  return { submitForm };
};

export default useApiError;