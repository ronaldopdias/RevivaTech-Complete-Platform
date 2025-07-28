import { ComponentConfig } from '@/types/config';

export const CheckboxConfig: ComponentConfig = {
  name: 'Checkbox',
  version: '1.0.0',
  description: 'Configurable checkbox component with indeterminate state and custom styling',
  category: 'form',
  
  props: {
    variant: {
      type: 'enum',
      enum: ['default', 'outline', 'filled', 'ghost'],
      default: 'default',
      description: 'Checkbox visual variant',
    },
    
    size: {
      type: 'enum',
      enum: ['xs', 'sm', 'md', 'lg', 'xl'],
      default: 'md',
      description: 'Checkbox size',
    },
    
    rounded: {
      type: 'enum',
      enum: ['none', 'sm', 'md', 'lg', 'full'],
      default: 'sm',
      description: 'Border radius size',
    },
    
    color: {
      type: 'enum',
      enum: ['primary', 'secondary', 'success', 'warning', 'danger', 'info'],
      default: 'primary',
      description: 'Checkbox color theme',
    },
    
    state: {
      type: 'enum',
      enum: ['default', 'error', 'warning', 'success', 'info'],
      default: 'default',
      description: 'Checkbox validation state',
    },
    
    label: {
      type: 'string',
      required: false,
      description: 'Checkbox label text',
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
    
    checked: {
      type: 'boolean',
      default: false,
      description: 'Whether checkbox is checked',
    },
    
    indeterminate: {
      type: 'boolean',
      default: false,
      description: 'Whether checkbox is in indeterminate state',
    },
    
    required: {
      type: 'boolean',
      default: false,
      description: 'Whether checkbox is required',
    },
    
    disabled: {
      type: 'boolean',
      default: false,
      description: 'Whether checkbox is disabled',
    },
    
    name: {
      type: 'string',
      required: false,
      description: 'Checkbox name attribute',
    },
    
    value: {
      type: 'string',
      required: false,
      description: 'Checkbox value attribute',
    },
    
    id: {
      type: 'string',
      required: false,
      description: 'Checkbox ID attribute',
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
    
    icon: {
      name: 'icon',
      required: false,
      allowedComponents: ['Icon', 'CustomIcon'],
    },
  },
  
  variants: {
    // Terms and conditions
    terms: {
      variant: 'default',
      size: 'sm',
      color: 'primary',
      label: 'I agree to the terms and conditions',
    },
    
    // Newsletter subscription
    newsletter: {
      variant: 'filled',
      size: 'md',
      color: 'primary',
      label: 'Subscribe to newsletter',
    },
    
    // Privacy consent
    privacy: {
      variant: 'outline',
      size: 'sm',
      color: 'success',
      label: 'I consent to data processing',
    },
    
    // Remember me
    remember: {
      variant: 'ghost',
      size: 'sm',
      color: 'secondary',
      label: 'Remember me',
    },
    
    // Feature toggle
    toggle: {
      variant: 'filled',
      size: 'md',
      color: 'primary',
      rounded: 'md',
    },
    
    // Table row selection
    tableRow: {
      variant: 'default',
      size: 'sm',
      color: 'primary',
      rounded: 'sm',
    },
    
    // Bulk selection
    selectAll: {
      variant: 'outline',
      size: 'md',
      color: 'primary',
      label: 'Select all',
    },
    
    // Task completion
    task: {
      variant: 'filled',
      size: 'lg',
      color: 'success',
      rounded: 'md',
    },
    
    // Settings option
    setting: {
      variant: 'ghost',
      size: 'md',
      color: 'secondary',
      rounded: 'sm',
    },
    
    // Minimal checkbox
    minimal: {
      variant: 'ghost',
      size: 'xs',
      color: 'primary',
      rounded: 'none',
    },
  },
  
  events: {
    change: {
      description: 'Triggered when checkbox state changes',
      payload: 'ChangeEvent<HTMLInputElement>',
    },
    
    focus: {
      description: 'Triggered when checkbox receives focus',
      payload: 'FocusEvent<HTMLInputElement>',
    },
    
    blur: {
      description: 'Triggered when checkbox loses focus',
      payload: 'FocusEvent<HTMLInputElement>',
    },
    
    click: {
      description: 'Triggered when checkbox is clicked',
      payload: 'MouseEvent<HTMLInputElement>',
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
      'checkColor',
      'size',
      'focusRingColor',
      'focusRingWidth',
      'disabledOpacity',
    ],
  },
};

export default CheckboxConfig;