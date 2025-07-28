/**
 * Design System V2 - Enhanced Input Component
 * Advanced input component with comprehensive design tokens and validation
 */

import React, { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, useId } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, Search, AlertCircle, CheckCircle, Info } from 'lucide-react';

// Input variants using design tokens
const inputVariants = cva(
  [
    // Base styles
    'flex w-full rounded-md border border-input bg-background px-3 py-2',
    'text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium',
    'placeholder:text-muted-foreground',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'transition-all duration-200 ease-out',
  ],
  {
    variants: {
      variant: {
        default: [
          'border-gray-300 bg-white',
          'focus:border-primary-500 focus:ring-primary-500/20',
          'hover:border-gray-400',
        ],
        filled: [
          'border-gray-200 bg-gray-50',
          'focus:border-primary-500 focus:ring-primary-500/20 focus:bg-white',
          'hover:bg-gray-100',
        ],
        outline: [
          'border-2 border-gray-300 bg-transparent',
          'focus:border-primary-500 focus:ring-primary-500/20',
          'hover:border-gray-400',
        ],
        ghost: [
          'border-transparent bg-transparent',
          'focus:border-primary-500 focus:ring-primary-500/20',
          'hover:bg-gray-50',
        ],
        success: [
          'border-green-300 bg-green-50',
          'focus:border-green-500 focus:ring-green-500/20',
        ],
        warning: [
          'border-yellow-300 bg-yellow-50',
          'focus:border-yellow-500 focus:ring-yellow-500/20',
        ],
        error: [
          'border-red-300 bg-red-50',
          'focus:border-red-500 focus:ring-red-500/20',
        ],
      },
      
      size: {
        xs: 'h-7 px-2 text-xs',
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-3 text-sm',
        lg: 'h-12 px-4 text-base',
        xl: 'h-14 px-6 text-lg',
      },
      
      radius: {
        none: 'rounded-none',
        sm: 'rounded-sm',
        md: 'rounded-md',
        lg: 'rounded-lg',
        xl: 'rounded-xl',
        '2xl': 'rounded-2xl',
        full: 'rounded-full',
      },
      
      fullWidth: {
        true: 'w-full',
        false: 'w-auto',
      },
    },
    
    defaultVariants: {
      variant: 'default',
      size: 'md',
      radius: 'md',
      fullWidth: true,
    },
  }
);

// Input group variants
const inputGroupVariants = cva(
  [
    'relative flex items-center',
  ],
  {
    variants: {
      size: {
        xs: 'gap-1',
        sm: 'gap-1.5',
        md: 'gap-2',
        lg: 'gap-2.5',
        xl: 'gap-3',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

// Input component props
export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  
  // Label props
  label?: string;
  labelClassName?: string;
  
  // Help text props
  helpText?: string;
  helpTextClassName?: string;
  
  // Error props
  error?: string | boolean;
  errorClassName?: string;
  
  // Success props
  success?: string | boolean;
  successClassName?: string;
  
  // Icon props
  leftIcon?: React.ComponentType<{ className?: string }>;
  rightIcon?: React.ComponentType<{ className?: string }>;
  
  // Addon props
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
  
  // Loading props
  loading?: boolean;
  
  // Validation props
  required?: boolean;
  optional?: boolean;
  
  // Container props
  containerClassName?: string;
  
  // Accessibility props
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
}

// Textarea component props
export interface TextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  
  // Label props
  label?: string;
  labelClassName?: string;
  
  // Help text props
  helpText?: string;
  helpTextClassName?: string;
  
  // Error props
  error?: string | boolean;
  errorClassName?: string;
  
  // Success props
  success?: string | boolean;
  successClassName?: string;
  
  // Resize props
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
  
  // Auto resize props
  autoResize?: boolean;
  minRows?: number;
  maxRows?: number;
  
  // Container props
  containerClassName?: string;
  
  // Accessibility props
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
}

// Input label component
const InputLabel = forwardRef<HTMLLabelElement, {
  children?: React.ReactNode;
  required?: boolean;
  optional?: boolean;
  className?: string;
  htmlFor?: string;
}>(({ children, required, optional, className, htmlFor, ...props }, ref) => (
  <label
    ref={ref}
    htmlFor={htmlFor}
    className={cn(
      'block text-sm font-medium text-gray-700 mb-1',
      className
    )}
    {...props}
  >
    {children}
    {required && (
      <span className="text-red-500 ml-1" aria-label="required">*</span>
    )}
    {optional && (
      <span className="text-gray-500 ml-1 font-normal">(optional)</span>
    )}
  </label>
));

InputLabel.displayName = 'InputLabel';

// Input help text component
const InputHelpText = forwardRef<HTMLParagraphElement, {
  children?: React.ReactNode;
  className?: string;
  id?: string;
}>(({ children, className, id, ...props }, ref) => (
  <p
    ref={ref}
    id={id}
    className={cn(
      'text-xs text-gray-500 mt-1',
      className
    )}
    {...props}
  >
    {children}
  </p>
));

InputHelpText.displayName = 'InputHelpText';

// Input error text component
const InputErrorText = forwardRef<HTMLParagraphElement, {
  children?: React.ReactNode;
  className?: string;
  id?: string;
}>(({ children, className, id, ...props }, ref) => (
  <p
    ref={ref}
    id={id}
    className={cn(
      'text-xs text-red-600 mt-1 flex items-center gap-1',
      className
    )}
    {...props}
  >
    <AlertCircle className="h-3 w-3 flex-shrink-0" />
    {children}
  </p>
));

InputErrorText.displayName = 'InputErrorText';

// Input success text component
const InputSuccessText = forwardRef<HTMLParagraphElement, {
  children?: React.ReactNode;
  className?: string;
  id?: string;
}>(({ children, className, id, ...props }, ref) => (
  <p
    ref={ref}
    id={id}
    className={cn(
      'text-xs text-green-600 mt-1 flex items-center gap-1',
      className
    )}
    {...props}
  >
    <CheckCircle className="h-3 w-3 flex-shrink-0" />
    {children}
  </p>
));

InputSuccessText.displayName = 'InputSuccessText';

// Input addon component
const InputAddon = forwardRef<HTMLDivElement, {
  children?: React.ReactNode;
  className?: string;
  side?: 'left' | 'right';
}>(({ children, className, side = 'left', ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex items-center px-3 bg-gray-50 border border-gray-300 text-gray-500 text-sm',
      side === 'left' ? 'rounded-l-md border-r-0' : 'rounded-r-md border-l-0',
      className
    )}
    {...props}
  >
    {children}
  </div>
));

InputAddon.displayName = 'InputAddon';

// Loading spinner component
const LoadingSpinner = ({ className }: { className?: string }) => (
  <div className={cn('animate-spin rounded-full border-2 border-gray-300 border-t-gray-600', className)} />
);

// Main Input component
const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      labelClassName,
      helpText,
      helpTextClassName,
      error,
      errorClassName,
      success,
      successClassName,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      leftAddon,
      rightAddon,
      loading = false,
      required = false,
      optional = false,
      containerClassName,
      variant,
      size,
      radius,
      fullWidth,
      className,
      type = 'text',
      id,
      'aria-label': ariaLabel,
      'aria-describedby': ariaDescribedBy,
      'aria-invalid': ariaInvalid,
      ...props
    },
    ref
  ) => {
    const inputId = useId();
    const finalId = id || inputId;
    const helpTextId = `${finalId}-help`;
    const errorId = `${finalId}-error`;
    const successId = `${finalId}-success`;
    
    // Determine variant based on validation state
    const finalVariant = error ? 'error' : success ? 'success' : variant;
    
    // Build aria-describedby
    const describedBy = [
      ariaDescribedBy,
      helpText && helpTextId,
      error && errorId,
      success && successId,
    ].filter(Boolean).join(' ');
    
    // Handle password visibility
    const [showPassword, setShowPassword] = React.useState(false);
    const finalType = type === 'password' && showPassword ? 'text' : type;
    
    return (
      <div className={cn('space-y-1', containerClassName)}>
        {/* Label */}
        {label && (
          <InputLabel
            htmlFor={finalId}
            required={required}
            optional={optional}
            className={labelClassName}
          >
            {label}
          </InputLabel>
        )}
        
        {/* Input group */}
        <div className={cn(inputGroupVariants({ size }))}>
          {/* Left addon */}
          {leftAddon && (
            <InputAddon side="left">
              {leftAddon}
            </InputAddon>
          )}
          
          {/* Input container */}
          <div className="relative flex-1">
            {/* Left icon */}
            {LeftIcon && (
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <LeftIcon className="h-4 w-4 text-gray-400" />
              </div>
            )}
            
            {/* Input */}
            <input
              ref={ref}
              type={finalType}
              id={finalId}
              className={cn(
                inputVariants({
                  variant: finalVariant,
                  size,
                  radius,
                  fullWidth,
                }),
                LeftIcon && 'pl-10',
                (RightIcon || loading || type === 'password') && 'pr-10',
                className
              )}
              aria-label={ariaLabel}
              aria-describedby={describedBy || undefined}
              aria-invalid={ariaInvalid || !!error}
              aria-required={required}
              {...props}
            />
            
            {/* Right content */}
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
              {/* Loading spinner */}
              {loading && (
                <LoadingSpinner className="h-4 w-4" />
              )}
              
              {/* Password toggle */}
              {type === 'password' && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              )}
              
              {/* Right icon */}
              {RightIcon && !loading && (
                <RightIcon className="h-4 w-4 text-gray-400" />
              )}
            </div>
          </div>
          
          {/* Right addon */}
          {rightAddon && (
            <InputAddon side="right">
              {rightAddon}
            </InputAddon>
          )}
        </div>
        
        {/* Help text */}
        {helpText && (
          <InputHelpText
            id={helpTextId}
            className={helpTextClassName}
          >
            {helpText}
          </InputHelpText>
        )}
        
        {/* Error message */}
        {error && typeof error === 'string' && (
          <InputErrorText
            id={errorId}
            className={errorClassName}
          >
            {error}
          </InputErrorText>
        )}
        
        {/* Success message */}
        {success && typeof success === 'string' && (
          <InputSuccessText
            id={successId}
            className={successClassName}
          >
            {success}
          </InputSuccessText>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// Textarea component
const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      labelClassName,
      helpText,
      helpTextClassName,
      error,
      errorClassName,
      success,
      successClassName,
      resize = 'vertical',
      autoResize = false,
      minRows = 3,
      maxRows = 10,
      containerClassName,
      variant,
      size,
      radius,
      fullWidth,
      className,
      id,
      'aria-label': ariaLabel,
      'aria-describedby': ariaDescribedBy,
      'aria-invalid': ariaInvalid,
      ...props
    },
    ref
  ) => {
    const textareaId = useId();
    const finalId = id || textareaId;
    const helpTextId = `${finalId}-help`;
    const errorId = `${finalId}-error`;
    const successId = `${finalId}-success`;
    
    // Determine variant based on validation state
    const finalVariant = error ? 'error' : success ? 'success' : variant;
    
    // Build aria-describedby
    const describedBy = [
      ariaDescribedBy,
      helpText && helpTextId,
      error && errorId,
      success && successId,
    ].filter(Boolean).join(' ');
    
    // Auto resize functionality
    const [textareaRef, setTextareaRef] = React.useState<HTMLTextAreaElement | null>(null);
    
    const handleTextareaRef = (node: HTMLTextAreaElement | null) => {
      setTextareaRef(node);
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };
    
    React.useEffect(() => {
      if (autoResize && textareaRef) {
        const adjustHeight = () => {
          textareaRef.style.height = 'auto';
          const scrollHeight = textareaRef.scrollHeight;
          const lineHeight = parseInt(getComputedStyle(textareaRef).lineHeight);
          const minHeight = lineHeight * minRows;
          const maxHeight = lineHeight * maxRows;
          
          textareaRef.style.height = `${Math.min(Math.max(scrollHeight, minHeight), maxHeight)}px`;
        };
        
        adjustHeight();
        textareaRef.addEventListener('input', adjustHeight);
        
        return () => textareaRef.removeEventListener('input', adjustHeight);
      }
    }, [autoResize, textareaRef, minRows, maxRows]);
    
    const resizeClasses = {
      none: 'resize-none',
      vertical: 'resize-y',
      horizontal: 'resize-x',
      both: 'resize',
    };
    
    return (
      <div className={cn('space-y-1', containerClassName)}>
        {/* Label */}
        {label && (
          <InputLabel
            htmlFor={finalId}
            className={labelClassName}
          >
            {label}
          </InputLabel>
        )}
        
        {/* Textarea */}
        <textarea
          ref={handleTextareaRef}
          id={finalId}
          className={cn(
            inputVariants({
              variant: finalVariant,
              size,
              radius,
              fullWidth,
            }),
            resizeClasses[resize],
            'min-h-[2.5rem] py-2',
            className
          )}
          aria-label={ariaLabel}
          aria-describedby={describedBy || undefined}
          aria-invalid={ariaInvalid || !!error}
          rows={autoResize ? undefined : minRows}
          {...props}
        />
        
        {/* Help text */}
        {helpText && (
          <InputHelpText
            id={helpTextId}
            className={helpTextClassName}
          >
            {helpText}
          </InputHelpText>
        )}
        
        {/* Error message */}
        {error && typeof error === 'string' && (
          <InputErrorText
            id={errorId}
            className={errorClassName}
          >
            {error}
          </InputErrorText>
        )}
        
        {/* Success message */}
        {success && typeof success === 'string' && (
          <InputSuccessText
            id={successId}
            className={successClassName}
          >
            {success}
          </InputSuccessText>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

// Search input component
export const SearchInput = forwardRef<HTMLInputElement, Omit<InputProps, 'type' | 'leftIcon'>>(
  (props, ref) => (
    <Input
      ref={ref}
      type="search"
      leftIcon={Search}
      placeholder="Search..."
      {...props}
    />
  )
);

SearchInput.displayName = 'SearchInput';

// Export all components
export { Input, Textarea, SearchInput, InputLabel, InputHelpText, InputErrorText, InputSuccessText, InputAddon, inputVariants };
export type { InputProps, TextareaProps };
export default Input;