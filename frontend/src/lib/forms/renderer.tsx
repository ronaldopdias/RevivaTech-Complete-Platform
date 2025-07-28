// Dynamic form renderer for RevivaTech
import React, { createContext, useContext, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { 
  FormConfig, 
  FormState, 
  FormContextValue, 
  FormFieldConfig, 
  FormData,
  FormSchemaBuilder,
  ConditionalLogic
} from './schema';

// Components
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import Checkbox from '@/components/ui/Checkbox';

// Form Context
const FormContext = createContext<FormContextValue | null>(null);

export const useFormContext = (): FormContextValue => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useFormContext must be used within a FormProvider');
  }
  return context;
};

// Form Provider
interface FormProviderProps {
  config: FormConfig;
  initialData?: FormData;
  onSubmit?: (data: FormData) => Promise<void>;
  onChange?: (data: FormData) => void;
  children: React.ReactNode;
}

export const FormProvider: React.FC<FormProviderProps> = ({
  config,
  initialData = {},
  onSubmit,
  onChange,
  children
}) => {
  const [state, setState] = useState<FormState>({
    data: initialData,
    errors: {},
    touched: {},
    isSubmitting: false,
    isValid: false,
    currentStep: 0,
    totalSteps: config.multiStep && config.steps ? config.steps.length : 1
  });

  const schema = FormSchemaBuilder.buildFormSchema(config);

  // Validate single field
  const validateField = (name: string, value: any): string | null => {
    try {
      const fieldConfig = getAllFields().find(f => f.name === name);
      if (!fieldConfig) return null;

      const fieldSchema = FormSchemaBuilder.buildFieldSchema(fieldConfig);
      fieldSchema.parse(value);
      return null;
    } catch (error: any) {
      return error.errors?.[0]?.message || 'Validation error';
    }
  };

  // Validate entire form
  const validateForm = (): boolean => {
    try {
      schema.parse(state.data);
      setState(prev => ({ ...prev, errors: {}, isValid: true }));
      return true;
    } catch (error: any) {
      const errors: Record<string, string> = {};
      error.errors?.forEach((err: any) => {
        if (err.path.length > 0) {
          errors[err.path[0]] = err.message;
        }
      });
      setState(prev => ({ ...prev, errors, isValid: false }));
      return false;
    }
  };

  // Get all fields (from steps or direct fields)
  const getAllFields = (): FormFieldConfig[] => {
    return config.multiStep && config.steps
      ? config.steps.flatMap(step => step.fields)
      : config.fields || [];
  };

  // Check conditional logic
  const checkConditionalLogic = (logic: ConditionalLogic[]): boolean => {
    return logic.every(condition => {
      const fieldValue = state.data[condition.field];
      
      switch (condition.operator) {
        case 'equals':
          return fieldValue === condition.value;
        case 'not_equals':
          return fieldValue !== condition.value;
        case 'contains':
          return Array.isArray(fieldValue) 
            ? fieldValue.includes(condition.value)
            : String(fieldValue).includes(String(condition.value));
        case 'not_contains':
          return Array.isArray(fieldValue)
            ? !fieldValue.includes(condition.value)
            : !String(fieldValue).includes(String(condition.value));
        case 'greater_than':
          return Number(fieldValue) > Number(condition.value);
        case 'less_than':
          return Number(fieldValue) < Number(condition.value);
        default:
          return true;
      }
    });
  };

  // Update field value
  const updateField = (name: string, value: any) => {
    setState(prev => {
      const newData = { ...prev.data, [name]: value };
      
      // Clear error for this field
      const newErrors = { ...prev.errors };
      delete newErrors[name];
      
      // Validate if needed
      if (config.validation === 'onChange') {
        const error = validateField(name, value);
        if (error) {
          newErrors[name] = error;
        }
      }

      const newState = {
        ...prev,
        data: newData,
        errors: newErrors
      };

      // Call onChange if provided
      onChange?.(newData);

      return newState;
    });
  };

  // Update errors
  const updateErrors = (errors: Record<string, string>) => {
    setState(prev => ({ ...prev, errors: { ...prev.errors, ...errors } }));
  };

  // Set field touched
  const setFieldTouched = (name: string, touched: boolean) => {
    setState(prev => ({ 
      ...prev, 
      touched: { ...prev.touched, [name]: touched } 
    }));

    // Validate on blur if configured
    if (touched && config.validation === 'onBlur') {
      const value = state.data[name];
      const error = validateField(name, value);
      if (error) {
        updateErrors({ [name]: error });
      }
    }
  };

  // Submit form
  const submitForm = async () => {
    setState(prev => ({ ...prev, isSubmitting: true }));

    try {
      // Validate form
      if (!validateForm()) {
        throw new Error('Form validation failed');
      }

      // Call onSubmit if provided
      if (onSubmit) {
        await onSubmit(state.data);
      }

      // Handle form submission based on config
      if (config.submitUrl) {
        const response = await fetch(config.submitUrl, {
          method: config.submitMethod || 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(state.data)
        });

        if (!response.ok) {
          throw new Error('Form submission failed');
        }
      }

    } catch (error) {
      console.error('Form submission error:', error);
      // Handle error - could set form-level error state
    } finally {
      setState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  // Multi-step navigation
  const nextStep = () => {
    if (state.currentStep < state.totalSteps - 1) {
      setState(prev => ({ ...prev, currentStep: prev.currentStep + 1 }));
    }
  };

  const prevStep = () => {
    if (state.currentStep > 0) {
      setState(prev => ({ ...prev, currentStep: prev.currentStep - 1 }));
    }
  };

  const goToStep = (step: number) => {
    if (step >= 0 && step < state.totalSteps) {
      setState(prev => ({ ...prev, currentStep: step }));
    }
  };

  // Reset form
  const resetForm = () => {
    setState({
      data: initialData,
      errors: {},
      touched: {},
      isSubmitting: false,
      isValid: false,
      currentStep: 0,
      totalSteps: config.multiStep && config.steps ? config.steps.length : 1
    });
  };

  const contextValue: FormContextValue = {
    config,
    state,
    updateField,
    updateErrors,
    setFieldTouched,
    validateField,
    validateForm,
    submitForm,
    nextStep,
    prevStep,
    goToStep,
    resetForm,
    checkConditionalLogic
  };

  return (
    <FormContext.Provider value={contextValue}>
      {children}
    </FormContext.Provider>
  );
};

// Field Renderer Component
interface FieldRendererProps {
  field: FormFieldConfig;
  className?: string;
}

export const FieldRenderer: React.FC<FieldRendererProps> = ({ field, className }) => {
  const { state, updateField, setFieldTouched, checkConditionalLogic } = useFormContext();
  
  const value = state.data[field.name] ?? field.defaultValue;
  const error = state.errors[field.name];
  const touched = state.touched[field.name];

  // Check if field should be visible
  const isVisible = !field.conditionalLogic || 
    field.conditionalLogic.every(logic => 
      logic.action !== 'hide' || checkConditionalLogic([logic])
    );

  // Check if field should be disabled
  const isDisabled = field.disabled || 
    (field.conditionalLogic?.some(logic => 
      logic.action === 'disable' && checkConditionalLogic([logic])
    ));

  // Check if field should be required
  const isRequired = field.required || 
    (field.conditionalLogic?.some(logic => 
      logic.action === 'require' && checkConditionalLogic([logic])
    ));

  if (!isVisible) {
    return null;
  }

  const handleChange = (newValue: any) => {
    updateField(field.name, newValue);
  };

  const handleBlur = () => {
    setFieldTouched(field.name, true);
  };

  const commonProps = {
    id: field.id,
    name: field.name,
    label: field.label,
    placeholder: field.placeholder,
    description: field.description,
    required: isRequired,
    disabled: isDisabled,
    readOnly: field.readOnly,
    errorMessage: touched ? error : undefined,
    className: cn(field.className, className),
    onBlur: handleBlur,
    ...field.props
  };

  switch (field.type) {
    case 'text':
    case 'email':
    case 'tel':
    case 'password':
    case 'url':
    case 'number':
    case 'date':
    case 'time':
      return (
        <Input
          {...commonProps}
          type={field.type}
          value={value || ''}
          onChange={(e) => handleChange(e.target.value)}
        />
      );

    case 'textarea':
      return (
        <Textarea
          {...commonProps}
          value={value || ''}
          onChange={(e) => handleChange(e.target.value)}
        />
      );

    case 'select':
      return (
        <Select
          {...commonProps}
          options={field.options || []}
          value={value}
          onChange={handleChange}
        />
      );

    case 'multi-select':
      return (
        <Select
          {...commonProps}
          options={field.options || []}
          value={value || []}
          multiple
          onChange={handleChange}
        />
      );

    case 'checkbox':
      return (
        <Checkbox
          {...commonProps}
          checked={Boolean(value)}
          onChange={(e) => handleChange(e.target.checked)}
        />
      );

    case 'hidden':
      return (
        <input
          type="hidden"
          name={field.name}
          value={value || ''}
        />
      );

    default:
      console.warn(`Unsupported field type: ${field.type}`);
      return null;
  }
};

// Form Step Component
interface FormStepProps {
  stepIndex?: number;
  className?: string;
}

export const FormStep: React.FC<FormStepProps> = ({ stepIndex, className }) => {
  const { config, state } = useFormContext();
  
  if (!config.multiStep || !config.steps) {
    return null;
  }

  const actualStepIndex = stepIndex ?? state.currentStep;
  const step = config.steps[actualStepIndex];
  
  if (!step) {
    return null;
  }

  return (
    <div className={cn("space-y-6", className)}>
      {step.title && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{step.title}</h3>
          {step.description && (
            <p className="text-muted-foreground">{step.description}</p>
          )}
        </div>
      )}
      
      <div className={cn(
        "space-y-4",
        config.layout === 'grid' && `grid gap-4 grid-cols-${config.columns || 2}`
      )}>
        {step.fields.map(field => (
          <div 
            key={field.id}
            className={field.colSpan ? `col-span-${field.colSpan}` : ''}
          >
            <FieldRenderer field={field} />
          </div>
        ))}
      </div>
    </div>
  );
};

// Progress Bar Component
export const FormProgress: React.FC = () => {
  const { config, state } = useFormContext();
  
  if (!config.multiStep || !config.showProgress) {
    return null;
  }

  const progress = ((state.currentStep + 1) / state.totalSteps) * 100;

  return (
    <div className="mb-8">
      <div className="flex justify-between text-sm text-muted-foreground mb-2">
        <span>Step {state.currentStep + 1} of {state.totalSteps}</span>
        <span>{Math.round(progress)}% Complete</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

// Form Navigation Component
export const FormNavigation: React.FC = () => {
  const { config, state, nextStep, prevStep, submitForm } = useFormContext();
  
  if (!config.multiStep) {
    return (
      <div className="flex justify-end">
        <Button
          type="button"
          onClick={submitForm}
          loading={state.isSubmitting}
          disabled={state.isSubmitting}
        >
          Submit
        </Button>
      </div>
    );
  }

  const isFirstStep = state.currentStep === 0;
  const isLastStep = state.currentStep === state.totalSteps - 1;

  return (
    <div className="flex justify-between">
      <Button
        type="button"
        variant="outline"
        onClick={prevStep}
        disabled={isFirstStep}
      >
        Previous
      </Button>
      
      {isLastStep ? (
        <Button
          type="button"
          onClick={submitForm}
          loading={state.isSubmitting}
          disabled={state.isSubmitting}
        >
          Submit
        </Button>
      ) : (
        <Button
          type="button"
          onClick={nextStep}
        >
          Next
        </Button>
      )}
    </div>
  );
};

// Main Dynamic Form Component
interface DynamicFormProps {
  config: FormConfig;
  initialData?: FormData;
  onSubmit?: (data: FormData) => Promise<void>;
  onChange?: (data: FormData) => void;
  className?: string;
}

export const DynamicForm: React.FC<DynamicFormProps> = ({
  config,
  initialData,
  onSubmit,
  onChange,
  className
}) => {
  return (
    <FormProvider
      config={config}
      initialData={initialData}
      onSubmit={onSubmit}
      onChange={onChange}
    >
      <div className={cn("space-y-6", className)}>
        {config.title && (
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">{config.title}</h2>
            {config.description && (
              <p className="text-muted-foreground">{config.description}</p>
            )}
          </div>
        )}

        <FormProgress />

        {config.multiStep ? (
          <FormStep />
        ) : (
          <div className={cn(
            "space-y-4",
            config.layout === 'grid' && `grid gap-4 grid-cols-${config.columns || 2}`
          )}>
            {config.fields?.map(field => (
              <div 
                key={field.id}
                className={field.colSpan ? `col-span-${field.colSpan}` : ''}
              >
                <FieldRenderer field={field} />
              </div>
            ))}
          </div>
        )}

        <FormNavigation />
      </div>
    </FormProvider>
  );
};

export default DynamicForm;