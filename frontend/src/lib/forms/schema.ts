// Dynamic form schema and validation system for RevivaTech
import { z } from 'zod';

// Base field types
export type FieldType = 
  | 'text' 
  | 'email' 
  | 'tel' 
  | 'password' 
  | 'number' 
  | 'textarea' 
  | 'select' 
  | 'checkbox' 
  | 'radio' 
  | 'date' 
  | 'time' 
  | 'file' 
  | 'hidden'
  | 'multi-select'
  | 'range'
  | 'url';

// Validation rules
export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'email' | 'url' | 'custom';
  value?: any;
  message?: string;
  validator?: (value: any) => boolean | string;
}

// Field option for select/radio
export interface FieldOption {
  value: string | number;
  label: string;
  description?: string;
  disabled?: boolean;
  group?: string;
}

// Conditional logic
export interface ConditionalLogic {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than';
  value: any;
  action: 'show' | 'hide' | 'require' | 'disable';
}

// Field configuration
export interface FormFieldConfig {
  id: string;
  name: string;
  type: FieldType;
  label?: string;
  placeholder?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  defaultValue?: any;
  
  // Validation
  validation?: ValidationRule[];
  
  // Options for select/radio
  options?: FieldOption[];
  searchable?: boolean;
  
  // Field-specific props
  props?: Record<string, any>;
  
  // Conditional logic
  conditionalLogic?: ConditionalLogic[];
  
  // Layout
  colSpan?: number;
  order?: number;
  
  // Styling
  variant?: string;
  size?: string;
  className?: string;
}

// Form step for multi-step forms
export interface FormStep {
  id: string;
  title: string;
  description?: string;
  fields: FormFieldConfig[];
  validation?: 'onChange' | 'onBlur' | 'onSubmit';
  conditional?: ConditionalLogic[];
}

// Form configuration
export interface FormConfig {
  id: string;
  title: string;
  description?: string;
  
  // Form structure
  steps?: FormStep[];
  fields?: FormFieldConfig[];
  
  // Form behavior
  multiStep?: boolean;
  validation?: 'onChange' | 'onBlur' | 'onSubmit';
  persistProgress?: boolean;
  showProgress?: boolean;
  
  // Submission
  submitUrl?: string;
  submitMethod?: 'POST' | 'PUT' | 'PATCH';
  onSubmit?: string; // Function name or action
  
  // Layout
  layout?: 'vertical' | 'horizontal' | 'grid';
  columns?: number;
  spacing?: 'compact' | 'normal' | 'relaxed';
  
  // Styling
  variant?: string;
  className?: string;
  
  // Features
  showRequiredIndicator?: boolean;
  showOptionalIndicator?: boolean;
  autoSave?: boolean;
  captcha?: boolean;
}

// Form data structure
export interface FormData {
  [fieldName: string]: any;
}

// Form state
export interface FormState {
  data: FormData;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
  currentStep: number;
  totalSteps: number;
}

// Form context
export interface FormContextValue {
  config: FormConfig;
  state: FormState;
  updateField: (name: string, value: any) => void;
  updateErrors: (errors: Record<string, string>) => void;
  setFieldTouched: (name: string, touched: boolean) => void;
  validateField: (name: string, value: any) => string | null;
  validateForm: () => boolean;
  submitForm: () => Promise<void>;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  resetForm: () => void;
  checkConditionalLogic: (logic: ConditionalLogic[]) => boolean;
}

// Validation schema builders
export class FormSchemaBuilder {
  static buildFieldSchema(field: FormFieldConfig): z.ZodSchema<any> {
    let schema: z.ZodSchema<any>;

    // Base schema by field type
    switch (field.type) {
      case 'email':
        schema = z.string().email('Invalid email address');
        break;
      case 'url':
        schema = z.string().url('Invalid URL');
        break;
      case 'number':
        schema = z.number();
        break;
      case 'date':
        schema = z.string().datetime('Invalid date');
        break;
      case 'file':
        schema = z.any(); // File validation handled separately
        break;
      case 'checkbox':
        schema = z.boolean();
        break;
      case 'multi-select':
        schema = z.array(z.string());
        break;
      default:
        schema = z.string();
    }

    // Apply validation rules
    if (field.validation) {
      field.validation.forEach(rule => {
        switch (rule.type) {
          case 'required':
            if (field.type === 'checkbox') {
              schema = z.boolean().refine(val => val === true, {
                message: rule.message || 'This field is required'
              });
            } else if (field.type === 'multi-select') {
              schema = (schema as z.ZodArray<any>).min(1, rule.message || 'Please select at least one option');
            } else {
              schema = (schema as z.ZodString).min(1, rule.message || 'This field is required');
            }
            break;
          case 'min':
            if (field.type === 'number') {
              schema = (schema as z.ZodNumber).min(rule.value, rule.message);
            } else {
              schema = (schema as z.ZodString).min(rule.value, rule.message);
            }
            break;
          case 'max':
            if (field.type === 'number') {
              schema = (schema as z.ZodNumber).max(rule.value, rule.message);
            } else {
              schema = (schema as z.ZodString).max(rule.value, rule.message);
            }
            break;
          case 'pattern':
            schema = (schema as z.ZodString).regex(new RegExp(rule.value), rule.message);
            break;
          case 'custom':
            if (rule.validator) {
              schema = schema.refine(rule.validator, {
                message: rule.message || 'Validation failed'
              });
            }
            break;
        }
      });
    }

    // Make optional if not required
    if (!field.required) {
      schema = schema.optional();
    }

    return schema;
  }

  static buildFormSchema(config: FormConfig): z.ZodSchema<any> {
    const schemaObject: Record<string, z.ZodSchema<any>> = {};

    const allFields = config.multiStep && config.steps
      ? config.steps.flatMap(step => step.fields)
      : config.fields || [];

    allFields.forEach(field => {
      schemaObject[field.name] = this.buildFieldSchema(field);
    });

    return z.object(schemaObject);
  }
}

// Predefined validation rules
export const ValidationRules = {
  required: (message?: string): ValidationRule => ({
    type: 'required',
    message: message || 'This field is required'
  }),

  email: (message?: string): ValidationRule => ({
    type: 'email',
    message: message || 'Please enter a valid email address'
  }),

  minLength: (length: number, message?: string): ValidationRule => ({
    type: 'min',
    value: length,
    message: message || `Must be at least ${length} characters`
  }),

  maxLength: (length: number, message?: string): ValidationRule => ({
    type: 'max',
    value: length,
    message: message || `Must be no more than ${length} characters`
  }),

  phone: (message?: string): ValidationRule => ({
    type: 'pattern',
    value: '^[+]?[1-9]?[0-9]{7,15}$',
    message: message || 'Please enter a valid phone number'
  }),

  url: (message?: string): ValidationRule => ({
    type: 'url',
    message: message || 'Please enter a valid URL'
  }),

  custom: (validator: (value: any) => boolean | string, message?: string): ValidationRule => ({
    type: 'custom',
    validator,
    message: message || 'Validation failed'
  })
};

// Form field builders
export const FormFields = {
  text: (id: string, label: string, options: Partial<FormFieldConfig> = {}): FormFieldConfig => ({
    id,
    name: id,
    type: 'text',
    label,
    ...options
  }),

  email: (id: string, label: string, options: Partial<FormFieldConfig> = {}): FormFieldConfig => ({
    id,
    name: id,
    type: 'email',
    label,
    validation: [ValidationRules.required(), ValidationRules.email()],
    ...options
  }),

  phone: (id: string, label: string, options: Partial<FormFieldConfig> = {}): FormFieldConfig => ({
    id,
    name: id,
    type: 'tel',
    label,
    validation: [ValidationRules.required(), ValidationRules.phone()],
    ...options
  }),

  textarea: (id: string, label: string, options: Partial<FormFieldConfig> = {}): FormFieldConfig => ({
    id,
    name: id,
    type: 'textarea',
    label,
    ...options
  }),

  select: (id: string, label: string, options: FieldOption[], fieldOptions: Partial<FormFieldConfig> = {}): FormFieldConfig => ({
    id,
    name: id,
    type: 'select',
    label,
    options,
    ...fieldOptions
  }),

  checkbox: (id: string, label: string, options: Partial<FormFieldConfig> = {}): FormFieldConfig => ({
    id,
    name: id,
    type: 'checkbox',
    label,
    ...options
  }),

  hidden: (id: string, value: any): FormFieldConfig => ({
    id,
    name: id,
    type: 'hidden',
    defaultValue: value
  })
};

export default FormSchemaBuilder;