import { ComponentConfig } from '@/types/config';

export const InputConfig: ComponentConfig = {
  name: 'Input',
  version: '1.0.0',
  description: 'Configurable input component with validation and enhanced UX features',
  category: 'form',
  
  props: {
    type: {
      type: 'enum',
      enum: ['text', 'email', 'password', 'tel', 'url', 'search', 'number', 'date', 'time', 'datetime-local', 'file'],
      default: 'text',
      description: 'Input type',
    },
    
    variant: {
      type: 'enum',
      enum: ['default', 'filled', 'outlined', 'underlined', 'ghost'],
      default: 'default',
      description: 'Input visual variant',
    },
    
    size: {
      type: 'enum',
      enum: ['xs', 'sm', 'md', 'lg', 'xl'],
      default: 'md',
      description: 'Input size',
    },
    
    rounded: {
      type: 'enum',
      enum: ['none', 'sm', 'md', 'lg', 'full'],
      default: 'md',
      description: 'Border radius size',
    },
    
    state: {
      type: 'enum',
      enum: ['default', 'error', 'warning', 'success', 'info'],
      default: 'default',
      description: 'Input validation state',
    },
    
    placeholder: {
      type: 'string',
      required: false,
      description: 'Placeholder text',
    },
    
    label: {
      type: 'string',
      required: false,
      description: 'Input label',
    },
    
    description: {
      type: 'string',
      required: false,
      description: 'Help text description',
    },
    
    errorMessage: {
      type: 'string',
      required: false,
      description: 'Error message text',
    },
    
    required: {
      type: 'boolean',
      default: false,
      description: 'Whether input is required',
    },
    
    disabled: {
      type: 'boolean',
      default: false,
      description: 'Whether input is disabled',
    },
    
    readOnly: {
      type: 'boolean',
      default: false,
      description: 'Whether input is read-only',
    },
    
    loading: {
      type: 'boolean',
      default: false,
      description: 'Whether input is in loading state',
    },
    
    clearable: {
      type: 'boolean',
      default: false,
      description: 'Whether input can be cleared with a button',
    },
    
    showPasswordToggle: {
      type: 'boolean',
      default: false,
      description: 'Show password visibility toggle (for password type)',
    },
    
    autoComplete: {
      type: 'string',
      required: false,
      description: 'Autocomplete attribute value',
    },
    
    autoFocus: {
      type: 'boolean',
      default: false,
      description: 'Whether input should autofocus',
    },
    
    maxLength: {
      type: 'number',
      required: false,
      description: 'Maximum character length',
    },
    
    minLength: {
      type: 'number',
      required: false,
      description: 'Minimum character length',
    },
    
    pattern: {
      type: 'string',
      required: false,
      description: 'Validation pattern (regex)',
    },
    
    min: {
      type: 'number',
      required: false,
      description: 'Minimum value (for number/date inputs)',
    },
    
    max: {
      type: 'number',
      required: false,
      description: 'Maximum value (for number/date inputs)',
    },
    
    step: {
      type: 'number',
      required: false,
      description: 'Step value (for number inputs)',
    },
    
    name: {
      type: 'string',
      required: false,
      description: 'Input name attribute',
    },
    
    id: {
      type: 'string',
      required: false,
      description: 'Input ID attribute',
    },
    
    className: {
      type: 'string',
      required: false,
      description: 'Additional CSS classes',
    },
    
    ariaLabel: {
      type: 'string',
      required: false,
      description: 'Accessibility label',
    },
    
    ariaDescribedBy: {
      type: 'string',
      required: false,
      description: 'ARIA described by attribute',
    },
  },
  
  slots: {
    startIcon: {
      name: 'startIcon',
      required: false,
      allowedComponents: ['Icon', 'Spinner'],
    },
    
    endIcon: {
      name: 'endIcon',
      required: false,
      allowedComponents: ['Icon', 'Button', 'Spinner'],
    },
    
    label: {
      name: 'label',
      required: false,
      allowedComponents: ['Text', 'Badge', 'Tooltip'],
    },
    
    description: {
      name: 'description',
      required: false,
      allowedComponents: ['Text', 'Link'],
    },
    
    error: {
      name: 'error',
      required: false,
      allowedComponents: ['Text', 'Alert'],
    },
    
    prefix: {
      name: 'prefix',
      required: false,
      allowedComponents: ['Text', 'Badge'],
    },
    
    suffix: {
      name: 'suffix',
      required: false,
      allowedComponents: ['Text', 'Badge', 'Button'],
    },
  },
  
  variants: {
    // Search input
    search: {
      type: 'search',
      variant: 'outlined',
      size: 'md',
      clearable: true,
      placeholder: 'Search...',
    },
    
    // Email input
    email: {
      type: 'email',
      variant: 'default',
      size: 'md',
      autoComplete: 'email',
    },
    
    // Password input
    password: {
      type: 'password',
      variant: 'default',
      size: 'md',
      showPasswordToggle: true,
      autoComplete: 'current-password',
    },
    
    // Phone input
    phone: {
      type: 'tel',
      variant: 'default',
      size: 'md',
      autoComplete: 'tel',
    },
    
    // Currency input
    currency: {
      type: 'number',
      variant: 'default',
      size: 'md',
      min: 0,
      step: 0.01,
    },
    
    // Large text area style
    large: {
      variant: 'outlined',
      size: 'lg',
      rounded: 'lg',
    },
    
    // Compact input
    compact: {
      variant: 'filled',
      size: 'sm',
      rounded: 'sm',
    },
    
    // Floating label style
    floating: {
      variant: 'underlined',
      size: 'md',
      rounded: 'none',
    },
    
    // File upload
    file: {
      type: 'file',
      variant: 'outlined',
      size: 'md',
      rounded: 'md',
    },
    
    // Date picker
    date: {
      type: 'date',
      variant: 'default',
      size: 'md',
    },
  },
  
  events: {
    change: {
      description: 'Triggered when input value changes',
      payload: 'ChangeEvent<HTMLInputElement>',
    },
    
    blur: {
      description: 'Triggered when input loses focus',
      payload: 'FocusEvent<HTMLInputElement>',
    },
    
    focus: {
      description: 'Triggered when input receives focus',
      payload: 'FocusEvent<HTMLInputElement>',
    },
    
    keyDown: {
      description: 'Triggered when key is pressed down',
      payload: 'KeyboardEvent<HTMLInputElement>',
    },
    
    keyUp: {
      description: 'Triggered when key is released',
      payload: 'KeyboardEvent<HTMLInputElement>',
    },
    
    input: {
      description: 'Triggered on input event',
      payload: 'FormEvent<HTMLInputElement>',
    },
    
    clear: {
      description: 'Triggered when clear button is clicked',
      payload: 'MouseEvent',
    },
    
    passwordToggle: {
      description: 'Triggered when password visibility is toggled',
      payload: 'boolean',
    },
  },
  
  styling: {
    responsive: true,
    themeable: true,
    customizable: [
      'backgroundColor',
      'borderColor',
      'borderWidth',
      'borderRadius',
      'textColor',
      'placeholderColor',
      'fontSize',
      'padding',
      'height',
      'width',
      'focusRingColor',
      'focusRingWidth',
    ],
  },
};

export default InputConfig;