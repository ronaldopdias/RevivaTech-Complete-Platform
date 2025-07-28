import React, { forwardRef, useEffect, useRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Check, Minus } from 'lucide-react';
import { Slot, SlotProvider, WithSlotsProps } from '@/lib/components/slots';
import CheckboxConfig from '../../../config/components/Checkbox/config';

// Checkbox variants
const checkboxVariants = cva(
  "peer shrink-0 border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:text-primary-foreground",
  {
    variants: {
      variant: {
        default: "border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary",
        outline: "border-input bg-background data-[state=checked]:bg-primary data-[state=checked]:border-primary",
        filled: "border-0 bg-muted data-[state=checked]:bg-primary",
        ghost: "border-0 bg-transparent data-[state=checked]:bg-primary/20 data-[state=checked]:text-primary",
      },
      size: {
        xs: "h-3 w-3",
        sm: "h-4 w-4",
        md: "h-5 w-5",
        lg: "h-6 w-6",
        xl: "h-7 w-7",
      },
      rounded: {
        none: "rounded-none",
        sm: "rounded-sm",
        md: "rounded-md",
        lg: "rounded-lg",
        full: "rounded-full",
      },
      color: {
        primary: "data-[state=checked]:bg-primary data-[state=checked]:border-primary",
        secondary: "data-[state=checked]:bg-secondary data-[state=checked]:border-secondary data-[state=checked]:text-secondary-foreground",
        success: "data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500",
        warning: "data-[state=checked]:bg-yellow-500 data-[state=checked]:border-yellow-500",
        danger: "data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500",
        info: "data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500",
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
      rounded: "sm",
      color: "primary",
      state: "default",
    },
  }
);

// Label variants
const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer",
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

// Props interface
export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'color'>,
    VariantProps<typeof checkboxVariants>,
    WithSlotsProps {
  label?: string;
  description?: string;
  errorMessage?: string;
  indeterminate?: boolean;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  composition?: 'slots' | 'props';
}

// Checkbox component
const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      variant,
      size,
      rounded,
      color,
      state,
      label,
      description,
      errorMessage,
      checked,
      indeterminate = false,
      disabled = false,
      required = false,
      className,
      ariaLabel,
      ariaDescribedBy,
      onChange,
      slots = {},
      slotProps = {},
      composition = 'props',
      ...props
    },
    ref
  ) => {
    const checkboxRef = useRef<HTMLInputElement>(null);

    // Merge refs
    const mergedRef = (node: HTMLInputElement) => {
      checkboxRef.current = node;
      if (ref) {
        if (typeof ref === 'function') {
          ref(node);
        } else {
          ref.current = node;
        }
      }
    };

    // Handle indeterminate state
    useEffect(() => {
      if (checkboxRef.current) {
        checkboxRef.current.indeterminate = indeterminate;
      }
    }, [indeterminate]);

    // Determine actual state
    const actualState = errorMessage ? 'error' : state;

    // Determine checkbox state for styling
    const checkboxState = checked ? 'checked' : indeterminate ? 'indeterminate' : 'unchecked';

    // Generate IDs
    const checkboxId = props.id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;
    const labelId = label ? `${checkboxId}-label` : undefined;
    const descriptionId = description ? `${checkboxId}-description` : undefined;
    const errorId = errorMessage ? `${checkboxId}-error` : undefined;
    const ariaDescribedByValue = [ariaDescribedBy, descriptionId, errorId].filter(Boolean).join(' ');

    // Get icon size based on checkbox size
    const iconSize = {
      xs: 8,
      sm: 12,
      md: 16,
      lg: 20,
      xl: 24,
    }[size || 'md'];

    if (composition === 'slots') {
      return (
        <SlotProvider initialSlots={slots}>
          <div className="space-y-2">
            <div className="flex items-start space-x-2">
              {/* Checkbox */}
              <div className="relative flex items-center">
                <input
                  ref={mergedRef}
                  type="checkbox"
                  id={checkboxId}
                  checked={checked}
                  disabled={disabled}
                  required={required}
                  aria-label={ariaLabel}
                  aria-describedby={ariaDescribedByValue || undefined}
                  onChange={onChange}
                  data-state={checkboxState}
                  className={cn(
                    checkboxVariants({ variant, size, rounded, color, state: actualState }),
                    "absolute opacity-0",
                    className
                  )}
                  {...props}
                />
                
                {/* Visual checkbox */}
                <div 
                  className={cn(
                    checkboxVariants({ variant, size, rounded, color, state: actualState }),
                    "relative flex items-center justify-center",
                    checkboxRef.current?.checked && "bg-primary border-primary text-primary-foreground",
                    indeterminate && "bg-primary border-primary text-primary-foreground"
                  )}
                >
                  {/* Icon slot */}
                  <Slot 
                    name="icon"
                    fallback={
                      checked ? (
                        <Check size={iconSize} className="text-current" />
                      ) : indeterminate ? (
                        <Minus size={iconSize} className="text-current" />
                      ) : null
                    }
                  />
                </div>
              </div>

              {/* Label and description */}
              <div className="flex-1 space-y-1">
                {/* Label slot */}
                <Slot 
                  name="label"
                  fallback={
                    label ? (
                      <label 
                        id={labelId}
                        htmlFor={checkboxId}
                        className={cn(labelVariants({ state: actualState }))}
                      >
                        {label}
                        {required && <span className="text-destructive ml-1">*</span>}
                      </label>
                    ) : null
                  }
                />

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
              </div>
            </div>

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
        <div className="flex items-start space-x-2">
          {/* Checkbox */}
          <div className="relative flex items-center">
            <input
              ref={mergedRef}
              type="checkbox"
              id={checkboxId}
              checked={checked}
              disabled={disabled}
              required={required}
              aria-label={ariaLabel}
              aria-describedby={ariaDescribedByValue || undefined}
              onChange={onChange}
              data-state={checkboxState}
              className="sr-only"
              {...props}
            />
            
            {/* Visual checkbox */}
            <label
              htmlFor={checkboxId}
              className={cn(
                checkboxVariants({ variant, size, rounded, color, state: actualState }),
                "relative flex items-center justify-center cursor-pointer",
                checked && "bg-primary border-primary text-primary-foreground",
                indeterminate && "bg-primary border-primary text-primary-foreground",
                disabled && "cursor-not-allowed",
                className
              )}
            >
              {checked && <Check size={iconSize} className="text-current" />}
              {indeterminate && <Minus size={iconSize} className="text-current" />}
            </label>
          </div>

          {/* Label and description */}
          {(label || description) && (
            <div className="flex-1 space-y-1">
              {/* Label */}
              {label && (
                <label 
                  id={labelId}
                  htmlFor={checkboxId}
                  className={cn(labelVariants({ state: actualState }))}
                >
                  {label}
                  {required && <span className="text-destructive ml-1">*</span>}
                </label>
              )}

              {/* Description */}
              {description && (
                <p 
                  id={descriptionId}
                  className={cn(descriptionVariants({ state: actualState }))}
                >
                  {description}
                </p>
              )}
            </div>
          )}
        </div>

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

Checkbox.displayName = 'Checkbox';

export { Checkbox, checkboxVariants, labelVariants, descriptionVariants };
export const config = CheckboxConfig;
export default Checkbox;