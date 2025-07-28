import React, { forwardRef, InputHTMLAttributes, useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, X, Loader2 } from 'lucide-react';
import { Slot, SlotProvider, WithSlotsProps } from '@/lib/components/slots';
import InputConfig from '../../../config/components/Input/config';

// Define input variants using cva
const inputVariants = cva(
  "w-full transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border border-input bg-background px-3 py-2 ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        filled: "border-0 bg-muted px-3 py-2 focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-ring",
        outlined: "border-2 border-input bg-background px-3 py-2 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/20",
        underlined: "border-0 border-b-2 border-input bg-transparent px-0 py-2 focus-visible:border-primary",
        ghost: "border-0 bg-transparent px-3 py-2 hover:bg-accent focus-visible:bg-accent",
      },
      size: {
        xs: "h-7 text-xs",
        sm: "h-8 text-sm",
        md: "h-10 text-sm",
        lg: "h-12 text-base",
        xl: "h-14 text-lg",
      },
      rounded: {
        none: "rounded-none",
        sm: "rounded-sm",
        md: "rounded-md",
        lg: "rounded-lg",
        full: "rounded-full",
      },
      state: {
        default: "",
        error: "border-destructive focus-visible:ring-destructive",
        warning: "border-yellow-500 focus-visible:ring-yellow-500",
        success: "border-green-500 focus-visible:ring-green-500",
        info: "border-blue-500 focus-visible:ring-blue-500",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      rounded: "md",
      state: "default",
    },
  }
);

// Label variants
const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
  {
    variants: {
      state: {
        default: "text-foreground",
        error: "text-destructive",
        warning: "text-yellow-600",
        success: "text-green-600",
        info: "text-blue-600",
      },
    },
    defaultVariants: {
      state: "default",
    },
  }
);

// Description variants
const descriptionVariants = cva(
  "text-sm",
  {
    variants: {
      state: {
        default: "text-muted-foreground",
        error: "text-destructive",
        warning: "text-yellow-600",
        success: "text-green-600",
        info: "text-blue-600",
      },
    },
    defaultVariants: {
      state: "default",
    },
  }
);

// Props interface with slot support
export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants>,
    WithSlotsProps {
  label?: string;
  description?: string;
  errorMessage?: string;
  loading?: boolean;
  clearable?: boolean;
  showPasswordToggle?: boolean;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  composition?: 'slots' | 'props';
  onClear?: () => void;
  onPasswordToggle?: (visible: boolean) => void;
}

// Input component with slot composition
const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      type = 'text',
      variant,
      size,
      rounded,
      state,
      label,
      description,
      errorMessage,
      loading = false,
      disabled = false,
      readOnly = false,
      clearable = false,
      showPasswordToggle = false,
      className,
      ariaLabel,
      ariaDescribedBy,
      value,
      onChange,
      onClear,
      onPasswordToggle,
      slots = {},
      slotProps = {},
      composition = 'props',
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const [inputValue, setInputValue] = useState(value || '');

    // Handle password toggle
    const handlePasswordToggle = () => {
      setShowPassword(!showPassword);
      onPasswordToggle?.(!showPassword);
    };

    // Handle clear
    const handleClear = () => {
      setInputValue('');
      onClear?.();
      // Trigger change event
      if (onChange) {
        const event = {
          target: { value: '' }
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(event);
      }
    };

    // Handle value change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value);
      onChange?.(e);
    };

    // Determine actual input type
    const actualType = type === 'password' && showPassword ? 'text' : type;

    // Determine if we should show clear button
    const showClear = clearable && inputValue && !disabled && !readOnly;

    // Determine if we should show password toggle
    const showToggle = showPasswordToggle && type === 'password' && !disabled && !readOnly;

    // Calculate state based on error
    const actualState = errorMessage ? 'error' : state;

    // Generate IDs
    const inputId = props.id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const descriptionId = description ? `${inputId}-description` : undefined;
    const errorId = errorMessage ? `${inputId}-error` : undefined;
    const ariaDescribedByValue = [ariaDescribedBy, descriptionId, errorId].filter(Boolean).join(' ');

    if (composition === 'slots') {
      return (
        <SlotProvider initialSlots={slots}>
          <div className="space-y-2">
            {/* Label slot */}
            <Slot 
              name="label" 
              fallback={
                label ? (
                  <label 
                    htmlFor={inputId}
                    className={cn(labelVariants({ state: actualState }))}
                  >
                    {label}
                    {props.required && <span className="text-destructive ml-1">*</span>}
                  </label>
                ) : null
              }
            />

            {/* Input wrapper */}
            <div className="relative">
              {/* Prefix slot */}
              <Slot name="prefix" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              
              {/* Start icon slot */}
              <Slot name="startIcon" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />

              {/* Main input */}
              <input
                ref={ref}
                type={actualType}
                id={inputId}
                value={inputValue}
                onChange={handleChange}
                disabled={disabled || loading}
                readOnly={readOnly}
                aria-label={ariaLabel}
                aria-describedby={ariaDescribedByValue || undefined}
                className={cn(
                  inputVariants({ variant, size, rounded, state: actualState }),
                  // Adjust padding for icons/buttons
                  slots.startIcon || slots.prefix ? "pl-10" : "",
                  (slots.endIcon || slots.suffix || showClear || showToggle || loading) ? "pr-10" : "",
                  className
                )}
                {...props}
              />

              {/* Loading spinner */}
              {loading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}

              {/* Clear button */}
              {showClear && !loading && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}

              {/* Password toggle */}
              {showToggle && !loading && (
                <button
                  type="button"
                  onClick={handlePasswordToggle}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              )}

              {/* End icon slot */}
              {!loading && !showClear && !showToggle && (
                <Slot name="endIcon" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              )}
              
              {/* Suffix slot */}
              <Slot name="suffix" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </div>

            {/* Description slot */}
            <Slot 
              name="description"
              fallback={
                description ? (
                  <p 
                    id={descriptionId}
                    className={cn(descriptionVariants({ state: actualState }))}
                  >
                    {description}
                  </p>
                ) : null
              }
            />

            {/* Error slot */}
            <Slot 
              name="error"
              fallback={
                errorMessage ? (
                  <p 
                    id={errorId}
                    className={cn(descriptionVariants({ state: 'error' }))}
                  >
                    {errorMessage}
                  </p>
                ) : null
              }
            />
          </div>
        </SlotProvider>
      );
    }

    // Traditional props-based composition
    return (
      <div className="space-y-2">
        {/* Label */}
        {label && (
          <label 
            htmlFor={inputId}
            className={cn(labelVariants({ state: actualState }))}
          >
            {label}
            {props.required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}

        {/* Input wrapper */}
        <div className="relative">
          {/* Main input */}
          <input
            ref={ref}
            type={actualType}
            id={inputId}
            value={inputValue}
            onChange={handleChange}
            disabled={disabled || loading}
            readOnly={readOnly}
            aria-label={ariaLabel}
            aria-describedby={ariaDescribedByValue || undefined}
            className={cn(
              inputVariants({ variant, size, rounded, state: actualState }),
              // Adjust padding for buttons
              (showClear || showToggle || loading) ? "pr-10" : "",
              className
            )}
            {...props}
          />

          {/* Loading spinner */}
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Clear button */}
          {showClear && !loading && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Password toggle */}
          {showToggle && !loading && (
            <button
              type="button"
              onClick={handlePasswordToggle}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
        </div>

        {/* Description */}
        {description && (
          <p 
            id={descriptionId}
            className={cn(descriptionVariants({ state: actualState }))}
          >
            {description}
          </p>
        )}

        {/* Error message */}
        {errorMessage && (
          <p 
            id={errorId}
            className={cn(descriptionVariants({ state: 'error' }))}
          >
            {errorMessage}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// Export component and config
export { Input, inputVariants, labelVariants, descriptionVariants };
export const config = InputConfig;
export default Input;