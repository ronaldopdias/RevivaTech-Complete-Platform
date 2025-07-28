import React from 'react';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  variant?: 'button' | 'switch' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'button',
  size = 'md',
  showLabel = false,
  className,
}) => {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const handleToggle = () => {
    if (theme === 'system') {
      setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
    } else {
      setTheme(theme === 'dark' ? 'light' : 'dark');
    }
  };

  const handleSystemToggle = () => {
    setTheme('system');
  };

  const sizeClasses = {
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-12 w-12 text-lg',
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handleToggle}
        className={cn(
          'inline-flex items-center justify-center rounded-md transition-colors',
          'hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          sizeClasses[size],
          className
        )}
        aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} theme`}
      >
        {resolvedTheme === 'dark' ? (
          <SunIcon className="h-5 w-5" />
        ) : (
          <MoonIcon className="h-5 w-5" />
        )}
      </button>
    );
  }

  if (variant === 'switch') {
    return (
      <div className={cn('flex items-center space-x-2', className)}>
        {showLabel && (
          <span className="text-sm font-medium">
            {resolvedTheme === 'dark' ? 'Dark' : 'Light'} mode
          </span>
        )}
        <button
          role="switch"
          aria-checked={resolvedTheme === 'dark'}
          onClick={handleToggle}
          className={cn(
            'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent',
            'transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
            resolvedTheme === 'dark' ? 'bg-primary' : 'bg-muted'
          )}
        >
          <span
            className={cn(
              'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-lg ring-0',
              'transition duration-200 ease-in-out',
              resolvedTheme === 'dark' ? 'translate-x-5' : 'translate-x-0'
            )}
          >
            <span
              className={cn(
                'absolute inset-0 flex h-full w-full items-center justify-center transition-opacity',
                resolvedTheme === 'dark' ? 'opacity-0' : 'opacity-100'
              )}
            >
              <SunIcon className="h-3 w-3 text-foreground" />
            </span>
            <span
              className={cn(
                'absolute inset-0 flex h-full w-full items-center justify-center transition-opacity',
                resolvedTheme === 'dark' ? 'opacity-100' : 'opacity-0'
              )}
            >
              <MoonIcon className="h-3 w-3 text-background" />
            </span>
          </span>
        </button>
      </div>
    );
  }

  // Default button variant
  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <button
        onClick={handleToggle}
        className={cn(
          'inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium',
          'transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          className
        )}
      >
        {resolvedTheme === 'dark' ? (
          <>
            <SunIcon className="mr-2 h-4 w-4" />
            {showLabel && 'Light mode'}
          </>
        ) : (
          <>
            <MoonIcon className="mr-2 h-4 w-4" />
            {showLabel && 'Dark mode'}
          </>
        )}
      </button>
      
      {/* System theme option */}
      <button
        onClick={handleSystemToggle}
        className={cn(
          'inline-flex items-center justify-center rounded-md px-2 py-2 text-sm',
          'transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          theme === 'system' ? 'bg-muted' : ''
        )}
        title="Use system theme"
      >
        <ComputerIcon className="h-4 w-4" />
      </button>
    </div>
  );
};

// Simple SVG icons
const SunIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
    />
  </svg>
);

const MoonIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
    />
  </svg>
);

const ComputerIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25"
    />
  </svg>
);

export default ThemeToggle;