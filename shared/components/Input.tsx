import React, { forwardRef } from 'react';
import { clsx } from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'error' | 'success';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      success,
      helperText,
      leftIcon,
      rightIcon,
      variant = 'default',
      className = '',
      ...props
    },
    ref
  ) => {
    const inputClasses = clsx(
      'input-nordic',
      {
        'input-nordic-error': variant === 'error' || error,
        'border-green-500 focus:ring-green-500': variant === 'success' || success,
        'pl-10': leftIcon,
        'pr-10': rightIcon,
      },
      className
    );

    return (
      <div className="form-group-nordic">
        {label && (
          <label className="form-label-nordic">
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <div className="text-nordic-muted">
                {leftIcon}
              </div>
            </div>
          )}
          
          <input
            ref={ref}
            className={inputClasses}
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <div className="text-nordic-muted">
                {rightIcon}
              </div>
            </div>
          )}
        </div>
        
        {error && (
          <p className="form-error-nordic">{error}</p>
        )}
        
        {success && (
          <p className="form-success-nordic">{success}</p>
        )}
        
        {helperText && !error && !success && (
          <p className="text-nordic-muted text-sm">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';