import React from 'react';

/**
 * Website LoadingSpinner Component
 *
 * Standalone loading spinner component for the website.
 * Provides multiple variants and configurations for different use cases.
 */

export interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  text?: string;
  showText?: boolean;
  textPosition?: 'top' | 'bottom' | 'right';
  centered?: boolean;
  fullHeight?: boolean;
  variant?: 'spinner' | 'pulse' | 'dots';
  className?: string;
}

// Main LoadingSpinner component implementation
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color = 'hsl(var(--info))',
  text,
  showText = false,
  textPosition = 'bottom',
  centered = false,
  fullHeight = false,
  variant = 'spinner',
  className = '',
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6',
    large: 'w-8 h-8',
  };

  const textSizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
  };

  const containerClasses = `
    ${centered ? 'flex items-center justify-center' : 'flex items-center'}
    ${fullHeight ? 'min-h-screen' : ''}
    ${textPosition === 'right' ? 'flex-row space-x-2' : 'flex-col space-y-2'}
    ${className}
  `.trim();

  const spinnerElement = (
    <div
      className={`${sizeClasses[size]} animate-spin border-2 border-border border-t-2 rounded-full`}
      style={{ borderTopColor: color }}
    />
  );

  const textElement = showText && text && (
    <span className={`${textSizeClasses[size]} text-muted-foreground`}>{text}</span>
  );

  return (
    <div className={containerClasses}>
      {textPosition === 'top' && textElement}
      {spinnerElement}
      {textPosition === 'bottom' && textElement}
      {textPosition === 'right' && textElement}
    </div>
  );
};

// Predefined configurations for common use cases
export const ButtonLoadingSpinner: React.FC<{ color?: string }> = ({
  color = 'white',
}) => <LoadingSpinner size="small" color={color} />;

export const PageLoadingSpinner: React.FC<{ text?: string }> = ({
  text = 'Loading...',
}) => (
  <LoadingSpinner
    size="large"
    text={text}
    showText={true}
    textPosition="bottom"
    centered={true}
    fullHeight={true}
    color="hsl(var(--info))"
  />
);

export const InlineLoadingSpinner: React.FC<{ size?: 'small' | 'medium' }> = ({
  size = 'small',
}) => <LoadingSpinner size={size} color="hsl(var(--info))" />;

export const CardLoadingSpinner: React.FC<{ text?: string }> = ({
  text = 'Loading...',
}) => (
  <LoadingSpinner
    size="medium"
    text={text}
    showText={true}
    textPosition="bottom"
    centered={true}
    color="hsl(var(--info))"
    className="py-12"
  />
);

export const ProcessingSpinner: React.FC<{ text?: string }> = ({
  text = 'Processing...',
}) => (
  <LoadingSpinner
    size="medium"
    text={text}
    showText={true}
    textPosition="bottom"
    centered={true}
    color="hsl(var(--info))"
    className="py-8"
  />
);

// Export the main component and predefined variants
export default LoadingSpinner;
export { LoadingSpinner };
