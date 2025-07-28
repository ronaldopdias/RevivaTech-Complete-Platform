import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Slot, SlotProvider, WithSlotsProps } from '@/lib/components/slots';
import TextareaConfig from '../../../config/components/Textarea/config';

// Textarea variants
const textareaVariants = cva(
  "w-full resize-none transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
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
        xs: "text-xs",
        sm: "text-sm",
        md: "text-sm",
        lg: "text-base",
        xl: "text-lg",
      },
      rounded: {
        none: "rounded-none",
        sm: "rounded-sm",
        md: "rounded-md",
        lg: "rounded-lg",
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

// Props interface
export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'>,
    VariantProps<typeof textareaVariants>,
    WithSlotsProps {
  label?: string;
  description?: string;
  errorMessage?: string;
  autoResize?: boolean;
  minRows?: number;
  maxRows?: number;
  showCharacterCount?: boolean;
  showWordCount?: boolean;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  composition?: 'slots' | 'props';
  onResize?: (height: number) => void;
}

// Textarea component
const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      variant,
      size,
      rounded,
      state,
      label,
      description,
      errorMessage,
      autoResize = false,
      minRows = 3,
      maxRows,
      rows = 4,
      showCharacterCount = false,
      showWordCount = false,
      disabled = false,
      readOnly = false,
      maxLength,
      minLength,
      className,
      ariaLabel,
      ariaDescribedBy,
      value,
      onChange,
      onResize,
      slots = {},
      slotProps = {},
      composition = 'props',
      ...props
    },
    ref
  ) => {
    const [textValue, setTextValue] = useState(value || '');
    const [textareaHeight, setTextareaHeight] = useState<number | undefined>();
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const hiddenTextareaRef = useRef<HTMLTextAreaElement>(null);

    // Merge refs
    const mergedRef = (node: HTMLTextAreaElement) => {
      textareaRef.current = node;
      if (ref) {
        if (typeof ref === 'function') {
          ref(node);
        } else {
          ref.current = node;
        }
      }
    };

    // Calculate auto-resize height
    const calculateHeight = (textareaElement: HTMLTextAreaElement) => {
      if (!autoResize) return;

      // Use hidden textarea to calculate content height
      if (hiddenTextareaRef.current) {
        const hiddenTextarea = hiddenTextareaRef.current;
        hiddenTextarea.value = textareaElement.value;
        
        const lineHeight = parseInt(window.getComputedStyle(textareaElement).lineHeight);
        const paddingTop = parseInt(window.getComputedStyle(textareaElement).paddingTop);
        const paddingBottom = parseInt(window.getComputedStyle(textareaElement).paddingBottom);
        
        const minHeight = lineHeight * minRows + paddingTop + paddingBottom;
        const maxHeight = maxRows ? lineHeight * maxRows + paddingTop + paddingBottom : Infinity;
        
        const scrollHeight = Math.max(hiddenTextarea.scrollHeight, minHeight);
        const newHeight = Math.min(scrollHeight, maxHeight);
        
        setTextareaHeight(newHeight);
        onResize?.(newHeight);
      }
    };

    // Handle value change
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setTextValue(newValue);
      onChange?.(e);
      
      if (autoResize) {
        calculateHeight(e.target);
      }
    };

    // Initial height calculation
    useEffect(() => {
      if (autoResize && textareaRef.current) {
        calculateHeight(textareaRef.current);
      }
    }, [autoResize, minRows, maxRows]);

    // Update internal value when prop changes
    useEffect(() => {
      setTextValue(value || '');
      if (autoResize && textareaRef.current) {
        calculateHeight(textareaRef.current);
      }
    }, [value, autoResize]);

    // Determine actual state
    const actualState = errorMessage ? 'error' : state;

    // Calculate character and word counts
    const characterCount = textValue.toString().length;
    const wordCount = textValue.toString().trim().split(/\s+/).filter(word => word.length > 0).length;

    // Generate IDs
    const textareaId = props.id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
    const labelId = label ? `${textareaId}-label` : undefined;
    const descriptionId = description ? `${textareaId}-description` : undefined;
    const errorId = errorMessage ? `${textareaId}-error` : undefined;
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
                    id={labelId}
                    htmlFor={textareaId}
                    className={cn(labelVariants({ state: actualState }))}
                  >
                    {label}
                    {props.required && <span className="text-destructive ml-1">*</span>}
                  </label>
                ) : null
              }
            />

            {/* Toolbar slot */}
            <Slot name="toolbar" />

            {/* Textarea wrapper */}
            <div className="relative">
              <textarea
                ref={mergedRef}
                id={textareaId}
                value={textValue}
                onChange={handleChange}
                disabled={disabled}
                readOnly={readOnly}
                rows={autoResize ? undefined : rows}
                maxLength={maxLength}
                minLength={minLength}
                aria-label={ariaLabel}
                aria-describedby={ariaDescribedByValue || undefined}
                style={autoResize ? { height: textareaHeight } : undefined}
                className={cn(
                  textareaVariants({ variant, size, rounded, state: actualState }),
                  autoResize && "resize-none overflow-hidden",
                  className
                )}
                {...props}
              />

              {/* Hidden textarea for auto-resize calculation */}
              {autoResize && (
                <textarea
                  ref={hiddenTextareaRef}
                  tabIndex={-1}
                  aria-hidden="true"
                  className={cn(
                    textareaVariants({ variant, size, rounded, state: actualState }),
                    "absolute top-0 left-0 visibility-hidden pointer-events-none resize-none overflow-hidden"
                  )}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    visibility: 'hidden',
                    pointerEvents: 'none',
                    height: 'auto',
                    width: '100%',
                  }}
                />
              )}
            </div>

            {/* Footer slot */}
            <Slot name="footer" />

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

            {/* Character/Word count and Error */}
            <div className="flex justify-between items-start">
              <div>
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

              {/* Counts */}
              {(showCharacterCount || showWordCount) && (
                <div className="text-xs text-muted-foreground space-x-2">
                  {showCharacterCount && (
                    <span className={cn(
                      maxLength && characterCount > maxLength && "text-destructive"
                    )}>
                      {characterCount}{maxLength && `/${maxLength}`}
                    </span>
                  )}
                  {showWordCount && (
                    <span>
                      {wordCount} words
                    </span>
                  )}
                </div>
              )}
            </div>
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
            id={labelId}
            htmlFor={textareaId}
            className={cn(labelVariants({ state: actualState }))}
          >
            {label}
            {props.required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}

        {/* Textarea wrapper */}
        <div className="relative">
          <textarea
            ref={mergedRef}
            id={textareaId}
            value={textValue}
            onChange={handleChange}
            disabled={disabled}
            readOnly={readOnly}
            rows={autoResize ? undefined : rows}
            maxLength={maxLength}
            minLength={minLength}
            aria-label={ariaLabel}
            aria-describedby={ariaDescribedByValue || undefined}
            style={autoResize ? { height: textareaHeight } : undefined}
            className={cn(
              textareaVariants({ variant, size, rounded, state: actualState }),
              autoResize && "resize-none overflow-hidden",
              className
            )}
            {...props}
          />

          {/* Hidden textarea for auto-resize calculation */}
          {autoResize && (
            <textarea
              ref={hiddenTextareaRef}
              tabIndex={-1}
              aria-hidden="true"
              className={cn(
                textareaVariants({ variant, size, rounded, state: actualState }),
                "absolute top-0 left-0 pointer-events-none resize-none overflow-hidden"
              )}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                visibility: 'hidden',
                pointerEvents: 'none',
                height: 'auto',
                width: '100%',
              }}
            />
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

        {/* Character/Word count and Error */}
        <div className="flex justify-between items-start">
          <div>
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

          {/* Counts */}
          {(showCharacterCount || showWordCount) && (
            <div className="text-xs text-muted-foreground space-x-2">
              {showCharacterCount && (
                <span className={cn(
                  maxLength && characterCount > maxLength && "text-destructive"
                )}>
                  {characterCount}{maxLength && `/${maxLength}`}
                </span>
              )}
              {showWordCount && (
                <span>
                  {wordCount} words
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea, textareaVariants, labelVariants, descriptionVariants };
export const config = TextareaConfig;
export default Textarea;