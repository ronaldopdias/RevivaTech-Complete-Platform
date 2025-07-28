import React from 'react';
import type { Decorator } from '@storybook/react';

// Theme Provider Decorator
export const withThemeProvider: Decorator = (Story, context) => {
  const theme = context.globals.theme || 'light';
  
  React.useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <div className="min-h-screen bg-background text-foreground">
        <Story />
      </div>
    </div>
  );
};

// Padding Decorator
export const withPadding: Decorator = (Story) => (
  <div className="p-6">
    <Story />
  </div>
);

// Max Width Decorator
export const withMaxWidth: Decorator = (Story) => (
  <div className="max-w-4xl mx-auto">
    <Story />
  </div>
);

// Center Decorator
export const withCenter: Decorator = (Story) => (
  <div className="flex items-center justify-center min-h-screen">
    <Story />
  </div>
);

// Form Container Decorator
export const withFormContainer: Decorator = (Story) => (
  <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
    <Story />
  </div>
);

// Grid Layout Decorator
export const withGridLayout: Decorator = (Story) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
    <Story />
  </div>
);

// Mock Data Provider Decorator
export const withMockData: Decorator = (Story, context) => {
  const mockData = {
    user: {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      avatar: 'https://via.placeholder.com/40',
    },
    notifications: [
      { id: '1', message: 'New message received', read: false },
      { id: '2', message: 'Task completed', read: true },
    ],
    devices: [
      { id: '1', name: 'MacBook Pro 14"', type: 'laptop', year: '2023' },
      { id: '2', name: 'iPhone 15 Pro', type: 'phone', year: '2023' },
    ],
  };

  return (
    <div data-mock-context={JSON.stringify(mockData)}>
      <Story />
    </div>
  );
};

// Responsive Container Decorator
export const withResponsiveContainer: Decorator = (Story, context) => {
  const viewport = context.parameters.viewport?.defaultViewport;
  
  let containerClass = 'w-full';
  
  switch (viewport) {
    case 'mobile':
      containerClass = 'w-full max-w-sm mx-auto';
      break;
    case 'tablet':
      containerClass = 'w-full max-w-2xl mx-auto';
      break;
    case 'desktop':
      containerClass = 'w-full max-w-6xl mx-auto';
      break;
    default:
      containerClass = 'w-full';
  }

  return (
    <div className={`${containerClass} p-4`}>
      <Story />
    </div>
  );
};

// Authentication Context Decorator
export const withAuthContext: Decorator = (Story, context) => {
  const [isAuthenticated, setIsAuthenticated] = React.useState(true);
  const [user, setUser] = React.useState({
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'admin',
  });

  const authContext = {
    isAuthenticated,
    user,
    login: () => setIsAuthenticated(true),
    logout: () => setIsAuthenticated(false),
    updateUser: setUser,
  };

  return (
    <div data-auth-context={JSON.stringify(authContext)}>
      <Story />
    </div>
  );
};

// Loading State Decorator
export const withLoadingStates: Decorator = (Story, context) => {
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (context.args?.loading) {
      setIsLoading(true);
      const timer = setTimeout(() => setIsLoading(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [context.args?.loading]);

  return (
    <div data-loading={isLoading}>
      <Story />
    </div>
  );
};

// Error Boundary Decorator
export const withErrorBoundary: Decorator = (Story) => {
  class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean; error?: Error }
  > {
    constructor(props: { children: React.ReactNode }) {
      super(props);
      this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error) {
      return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      console.error('Storybook Error Boundary:', error, errorInfo);
    }

    render() {
      if (this.state.hasError) {
        return (
          <div className="p-6 border border-red-300 rounded-lg bg-red-50">
            <h2 className="text-lg font-semibold text-red-800 mb-2">
              Something went wrong
            </h2>
            <p className="text-red-600">
              {this.state.error?.message || 'An error occurred while rendering this component.'}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: undefined })}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Try again
            </button>
          </div>
        );
      }

      return this.props.children;
    }
  }

  return (
    <ErrorBoundary>
      <Story />
    </ErrorBoundary>
  );
};

// Performance Monitor Decorator
export const withPerformanceMonitor: Decorator = (Story, context) => {
  const [renderTime, setRenderTime] = React.useState<number | null>(null);

  React.useEffect(() => {
    const start = performance.now();
    const timer = setTimeout(() => {
      const end = performance.now();
      setRenderTime(end - start);
    }, 0);

    return () => clearTimeout(timer);
  }, [context.args]);

  return (
    <div>
      <Story />
      {process.env.NODE_ENV === 'development' && renderTime && (
        <div className="mt-4 p-2 bg-gray-100 text-xs text-gray-600 rounded">
          Render time: {renderTime.toFixed(2)}ms
        </div>
      )}
    </div>
  );
};