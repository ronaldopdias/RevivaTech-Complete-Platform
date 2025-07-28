'use client';

import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white' | 'gray';
  className?: string;
  label?: string;
  overlay?: boolean;
}

const LoadingSpinner = ({ 
  size = 'md', 
  color = 'primary', 
  className, 
  label,
  overlay = false 
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  const colorClasses = {
    primary: 'text-blue-600',
    secondary: 'text-gray-600',
    white: 'text-white',
    gray: 'text-gray-400',
  };

  const spinner = (
    <div className={cn('flex items-center justify-center', className)}>
      <div className="flex flex-col items-center space-y-2">
        <svg
          className={cn(
            'animate-spin',
            sizeClasses[size],
            colorClasses[color]
          )}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          role="img"
          aria-label={label || 'Loading'}
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        
        {label && (
          <p className={cn(
            'text-sm font-medium',
            colorClasses[color]
          )}>
            {label}
          </p>
        )}
      </div>
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 shadow-lg">
          {spinner}
        </div>
      </div>
    );
  }

  return spinner;
};

// Component for full-page loading states
export const FullPageLoader = ({ 
  label = 'Loading...', 
  className 
}: { 
  label?: string; 
  className?: string; 
}) => (
  <div className={cn(
    'min-h-screen flex items-center justify-center bg-gray-50',
    className
  )}>
    <LoadingSpinner size="xl" label={label} />
  </div>
);

// Component for inline loading states
export const InlineLoader = ({ 
  label, 
  className 
}: { 
  label?: string; 
  className?: string; 
}) => (
  <div className={cn('flex items-center space-x-2', className)}>
    <LoadingSpinner size="sm" />
    {label && <span className="text-sm text-gray-600">{label}</span>}
  </div>
);

// Component for button loading states
export const ButtonLoader = ({ 
  className 
}: { 
  className?: string; 
}) => (
  <LoadingSpinner size="sm" color="white" className={className} />
);

export default LoadingSpinner;