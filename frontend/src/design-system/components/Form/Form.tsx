/**
 * Design System V2 - Enhanced Form Component
 * Advanced form component with validation, accessibility, and design tokens
 */

import React, { forwardRef, FormHTMLAttributes, createContext, useContext, useId } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

// Form validation types
export type ValidationRule = {
  required?: boolean | string;
  minLength?: number | { value: number; message: string };
  maxLength?: number | { value: number; message: string };
  pattern?: RegExp | { value: RegExp; message: string };
  min?: number | { value: number; message: string };
  max?: number | { value: number; message: string };
  validate?: (value: any) => boolean | string;
  custom?: (value: any, formData: any) => boolean | string;
};

export type FieldError = {
  type: string;
  message: string;
};

export type FormState = {
  [key: string]: any;
};

export type FormErrors = {
  [key: string]: FieldError;
};

// Form context
interface FormContextValue {
  formState: FormState;
  errors: FormErrors;
  touched: { [key: string]: boolean };
  isSubmitting: boolean;
  isValid: boolean;
  setFieldValue: (name: string, value: any) => void;
  setFieldTouched: (name: string, touched: boolean) => void;
  validateField: (name: string, value: any) => FieldError | null;
  registerField: (name: string, rules: ValidationRule) => void;
  unregisterField: (name: string) => void;
}

const FormContext = createContext<FormContextValue | null>(null);

// Form variants
const formVariants = cva(
  [
    'space-y-6',
  ],
  {
    variants: {
      variant: {
        default: '',
        card: 'p-6 bg-white rounded-lg border border-gray-200 shadow-sm',
        outlined: 'p-6 border-2 border-gray-300 rounded-lg',
        filled: 'p-6 bg-gray-50 rounded-lg',
      },
      
      size: {
        sm: 'space-y-4',
        md: 'space-y-6',
        lg: 'space-y-8',
      },
      
      layout: {
        vertical: 'flex flex-col',
        horizontal: 'flex flex-row items-start gap-6',
        grid: 'grid grid-cols-1 md:grid-cols-2 gap-6',
      },
    },
    
    defaultVariants: {
      variant: 'default',
      size: 'md',
      layout: 'vertical',
    },
  }
);

// Form group variants
const formGroupVariants = cva(
  [
    'space-y-1',
  ],
  {
    variants: {
      layout: {
        vertical: 'flex flex-col',
        horizontal: 'flex flex-row items-start gap-4',
        inline: 'flex flex-row items-center gap-2',
      },
    },
    
    defaultVariants: {
      layout: 'vertical',
    },
  }
);

// Form props
export interface FormProps
  extends FormHTMLAttributes<HTMLFormElement>,
    VariantProps<typeof formVariants> {
  
  // Form state
  initialValues?: FormState;
  validationRules?: { [key: string]: ValidationRule };
  
  // Validation options
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  validateOnSubmit?: boolean;
  
  // Submission
  onSubmit?: (values: FormState, actions: FormActions) => void | Promise<void>;
  onValidationError?: (errors: FormErrors) => void;
  
  // Loading
  loading?: boolean;
  
  // Accessibility
  'aria-label'?: string;
  'aria-describedby'?: string;
  
  // Styling
  className?: string;
  children?: React.ReactNode;
}

// Form actions
export interface FormActions {
  setSubmitting: (isSubmitting: boolean) => void;
  setErrors: (errors: FormErrors) => void;
  setFieldError: (field: string, error: FieldError) => void;
  resetForm: () => void;
  validateForm: () => boolean;
}

// Form field group props
export interface FormGroupProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof formGroupVariants> {
  
  children?: React.ReactNode;
  className?: string;
}

// Form section props
export interface FormSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
}

// Form field props
export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  label?: string;
  helpText?: string;
  required?: boolean;
  optional?: boolean;
  children?: React.ReactNode;
  className?: string;
  labelClassName?: string;
  helpTextClassName?: string;
  errorClassName?: string;
}

// Form validation utilities
const validateValue = (value: any, rules: ValidationRule): FieldError | null => {
  // Required validation
  if (rules.required) {
    const isEmpty = value === undefined || value === null || value === '' || 
                   (Array.isArray(value) && value.length === 0);
    
    if (isEmpty) {
      const message = typeof rules.required === 'string' ? rules.required : 'This field is required';
      return { type: 'required', message };
    }
  }
  
  // Skip other validations if value is empty and not required
  if (value === undefined || value === null || value === '') {
    return null;
  }
  
  // String validations
  if (typeof value === 'string') {
    // Min length validation
    if (rules.minLength) {
      const minLength = typeof rules.minLength === 'number' ? rules.minLength : rules.minLength.value;
      const message = typeof rules.minLength === 'number' 
        ? `Must be at least ${minLength} characters`
        : rules.minLength.message;
      
      if (value.length < minLength) {
        return { type: 'minLength', message };
      }
    }
    
    // Max length validation
    if (rules.maxLength) {
      const maxLength = typeof rules.maxLength === 'number' ? rules.maxLength : rules.maxLength.value;
      const message = typeof rules.maxLength === 'number' 
        ? `Must be no more than ${maxLength} characters`
        : rules.maxLength.message;
      
      if (value.length > maxLength) {
        return { type: 'maxLength', message };
      }
    }
    
    // Pattern validation
    if (rules.pattern) {
      const pattern = rules.pattern instanceof RegExp ? rules.pattern : rules.pattern.value;
      const message = rules.pattern instanceof RegExp 
        ? 'Invalid format'
        : rules.pattern.message;
      
      if (!pattern.test(value)) {
        return { type: 'pattern', message };
      }
    }
  }
  
  // Number validations
  if (typeof value === 'number') {
    // Min value validation
    if (rules.min) {
      const min = typeof rules.min === 'number' ? rules.min : rules.min.value;
      const message = typeof rules.min === 'number' 
        ? `Must be at least ${min}`
        : rules.min.message;
      
      if (value < min) {
        return { type: 'min', message };
      }
    }
    
    // Max value validation
    if (rules.max) {
      const max = typeof rules.max === 'number' ? rules.max : rules.max.value;
      const message = typeof rules.max === 'number' 
        ? `Must be no more than ${max}`
        : rules.max.message;
      
      if (value > max) {
        return { type: 'max', message };
      }
    }
  }
  
  // Custom validation
  if (rules.validate) {
    const result = rules.validate(value);
    if (result !== true) {
      return { 
        type: 'validate', 
        message: typeof result === 'string' ? result : 'Invalid value'
      };
    }
  }
  
  return null;
};

// Form hook
export const useForm = (props: {
  initialValues?: FormState;
  validationRules?: { [key: string]: ValidationRule };
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  onSubmit?: (values: FormState, actions: FormActions) => void | Promise<void>;
  onValidationError?: (errors: FormErrors) => void;
}) => {
  const {
    initialValues = {},
    validationRules = {},
    validateOnChange = true,
    validateOnBlur = true,
    onSubmit,
    onValidationError,
  } = props;
  
  const [formState, setFormState] = React.useState<FormState>(initialValues);
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [touched, setTouched] = React.useState<{ [key: string]: boolean }>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [fieldRules, setFieldRules] = React.useState<{ [key: string]: ValidationRule }>(validationRules);
  
  // Validate single field
  const validateField = React.useCallback((name: string, value: any): FieldError | null => {
    const rules = fieldRules[name];
    if (!rules) return null;
    
    return validateValue(value, rules);
  }, [fieldRules]);
  
  // Validate entire form
  const validateForm = React.useCallback((): boolean => {
    const newErrors: FormErrors = {};
    
    Object.keys(fieldRules).forEach(name => {
      const value = formState[name];
      const error = validateField(name, value);
      if (error) {
        newErrors[name] = error;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formState, fieldRules, validateField]);
  
  // Set field value
  const setFieldValue = React.useCallback((name: string, value: any) => {
    setFormState(prev => ({ ...prev, [name]: value }));
    
    if (validateOnChange) {
      const error = validateField(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: error || undefined,
      }));
    }
  }, [validateField, validateOnChange]);
  
  // Set field touched
  const setFieldTouched = React.useCallback((name: string, touched: boolean) => {
    setTouched(prev => ({ ...prev, [name]: touched }));
    
    if (validateOnBlur && touched) {
      const value = formState[name];
      const error = validateField(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: error || undefined,
      }));
    }
  }, [formState, validateField, validateOnBlur]);
  
  // Register field
  const registerField = React.useCallback((name: string, rules: ValidationRule) => {
    setFieldRules(prev => ({ ...prev, [name]: rules }));
  }, []);
  
  // Unregister field
  const unregisterField = React.useCallback((name: string) => {
    setFieldRules(prev => {
      const newRules = { ...prev };
      delete newRules[name];
      return newRules;
    });
    
    setFormState(prev => {
      const newState = { ...prev };
      delete newState[name];
      return newState;
    });
    
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
    
    setTouched(prev => {
      const newTouched = { ...prev };
      delete newTouched[name];
      return newTouched;
    });
  }, []);
  
  // Reset form
  const resetForm = React.useCallback(() => {
    setFormState(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);
  
  // Handle form submission
  const handleSubmit = React.useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    // Validate form
    const isValid = validateForm();
    
    if (!isValid) {
      setIsSubmitting(false);
      onValidationError?.(errors);
      return;
    }
    
    // Call onSubmit
    if (onSubmit) {
      const actions: FormActions = {
        setSubmitting: setIsSubmitting,
        setErrors,
        setFieldError: (field: string, error: FieldError) => {
          setErrors(prev => ({ ...prev, [field]: error }));
        },
        resetForm,
        validateForm,
      };
      
      try {
        await onSubmit(formState, actions);
      } catch (error) {
        console.error('Form submission error:', error);
      }
    }
    
    setIsSubmitting(false);
  }, [formState, errors, isSubmitting, onSubmit, onValidationError, validateForm, resetForm]);
  
  // Compute form validity
  const isValid = React.useMemo(() => {
    return Object.keys(errors).length === 0;
  }, [errors]);
  
  // Context value
  const contextValue: FormContextValue = {
    formState,
    errors,
    touched,
    isSubmitting,
    isValid,
    setFieldValue,
    setFieldTouched,
    validateField,
    registerField,
    unregisterField,
  };
  
  return {
    contextValue,
    handleSubmit,
    formState,
    errors,
    touched,
    isSubmitting,
    isValid,
    setFieldValue,
    setFieldTouched,
    validateForm,
    resetForm,
  };
};

// Form context hook
export const useFormContext = () => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useFormContext must be used within a Form component');
  }
  return context;
};

// Form group component
const FormGroup = forwardRef<HTMLDivElement, FormGroupProps>(
  ({ layout, className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(formGroupVariants({ layout }), className)}
      {...props}
    >
      {children}
    </div>
  )
);

FormGroup.displayName = 'FormGroup';

// Form section component
const FormSection = forwardRef<HTMLDivElement, FormSectionProps>(
  ({ title, description, className, titleClassName, descriptionClassName, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('space-y-4', className)}
      {...props}
    >
      {title && (
        <div className="space-y-1">
          <h3 className={cn('text-lg font-semibold text-gray-900', titleClassName)}>
            {title}
          </h3>
          {description && (
            <p className={cn('text-sm text-gray-600', descriptionClassName)}>
              {description}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  )
);

FormSection.displayName = 'FormSection';

// Form field component
const FormField = forwardRef<HTMLDivElement, FormFieldProps>(
  ({ 
    name, 
    label, 
    helpText, 
    required = false, 
    optional = false, 
    className, 
    labelClassName, 
    helpTextClassName, 
    errorClassName,
    children, 
    ...props 
  }, ref) => {
    const { errors, touched } = useFormContext();
    const fieldId = useId();
    const error = errors[name];
    const isTouched = touched[name];
    const showError = error && isTouched;
    
    return (
      <div
        ref={ref}
        className={cn('space-y-1', className)}
        {...props}
      >
        {label && (
          <label
            htmlFor={fieldId}
            className={cn(
              'block text-sm font-medium text-gray-700',
              labelClassName
            )}
          >
            {label}
            {required && (
              <span className="text-red-500 ml-1" aria-label="required">*</span>
            )}
            {optional && (
              <span className="text-gray-500 ml-1 font-normal">(optional)</span>
            )}
          </label>
        )}
        
        <div className="relative">
          {React.Children.map(children, child => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child, {
                id: fieldId,
                name,
                'aria-invalid': !!showError,
                'aria-describedby': error ? `${fieldId}-error` : undefined,
              });
            }
            return child;
          })}
        </div>
        
        {helpText && !showError && (
          <p className={cn('text-xs text-gray-500', helpTextClassName)}>
            {helpText}
          </p>
        )}
        
        {showError && (
          <p
            id={`${fieldId}-error`}
            className={cn(
              'text-xs text-red-600 flex items-center gap-1',
              errorClassName
            )}
          >
            <AlertCircle className="h-3 w-3 flex-shrink-0" />
            {error.message}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';

// Form summary component
const FormSummary = forwardRef<HTMLDivElement, {
  type?: 'error' | 'success' | 'info';
  title?: string;
  message?: string;
  errors?: FormErrors;
  className?: string;
}>(({ type = 'error', title, message, errors, className, ...props }, ref) => {
  const icons = {
    error: AlertCircle,
    success: CheckCircle,
    info: Info,
  };
  
  const colors = {
    error: 'bg-red-50 border-red-200 text-red-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };
  
  const iconColors = {
    error: 'text-red-500',
    success: 'text-green-500',
    info: 'text-blue-500',
  };
  
  const Icon = icons[type];
  
  if (!message && !errors) return null;
  
  return (
    <div
      ref={ref}
      className={cn(
        'p-4 border rounded-lg',
        colors[type],
        className
      )}
      {...props}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', iconColors[type])} />
        
        <div className="flex-1">
          {title && (
            <h4 className="font-medium mb-1">{title}</h4>
          )}
          
          {message && (
            <p className="text-sm">{message}</p>
          )}
          
          {errors && Object.keys(errors).length > 0 && (
            <ul className="text-sm mt-2 space-y-1">
              {Object.entries(errors).map(([field, error]) => (
                <li key={field}>
                  <strong>{field}:</strong> {error.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
});

FormSummary.displayName = 'FormSummary';

// Main Form component
const Form = forwardRef<HTMLFormElement, FormProps>(
  (
    {
      initialValues,
      validationRules,
      validateOnChange = true,
      validateOnBlur = true,
      validateOnSubmit = true,
      onSubmit,
      onValidationError,
      loading = false,
      variant,
      size,
      layout,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const {
      contextValue,
      handleSubmit,
      isSubmitting,
    } = useForm({
      initialValues,
      validationRules,
      validateOnChange,
      validateOnBlur,
      onSubmit,
      onValidationError,
    });
    
    return (
      <FormContext.Provider value={contextValue}>
        <form
          ref={ref}
          onSubmit={handleSubmit}
          className={cn(
            formVariants({ variant, size, layout }),
            (loading || isSubmitting) && 'pointer-events-none opacity-50',
            className
          )}
          {...props}
        >
          {children}
        </form>
      </FormContext.Provider>
    );
  }
);

Form.displayName = 'Form';

// Export all components
export { Form, FormGroup, FormSection, FormField, FormSummary, useForm, useFormContext, formVariants };
export type { FormProps, FormGroupProps, FormSectionProps, FormFieldProps, FormState, FormErrors, FormActions, ValidationRule, FieldError };
export default Form;