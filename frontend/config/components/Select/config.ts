import { ComponentConfig } from '@/types/config';

export const SelectConfig: ComponentConfig = {
  name: 'Select',
  version: '1.0.0',
  description: 'Configurable select dropdown component with search and multi-select support',
  category: 'form',
  
  props: {
    variant: {
      type: 'enum',
      enum: ['default', 'filled', 'outlined', 'underlined', 'ghost'],
      default: 'default',
      description: 'Select visual variant',
    },
    
    size: {
      type: 'enum',
      enum: ['xs', 'sm', 'md', 'lg', 'xl'],
      default: 'md',
      description: 'Select size',
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
      description: 'Select validation state',
    },
    
    options: {
      type: 'array',
      required: true,
      description: 'Select options array',
    },
    
    placeholder: {
      type: 'string',
      default: 'Select an option...',
      description: 'Placeholder text',
    },
    
    label: {
      type: 'string',
      required: false,
      description: 'Select label',
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
      description: 'Whether select is required',
    },
    
    disabled: {
      type: 'boolean',
      default: false,
      description: 'Whether select is disabled',
    },
    
    loading: {
      type: 'boolean',
      default: false,
      description: 'Whether select is in loading state',
    },
    
    searchable: {
      type: 'boolean',
      default: false,
      description: 'Whether select is searchable',
    },
    
    clearable: {
      type: 'boolean',
      default: false,
      description: 'Whether select can be cleared',
    },
    
    multiple: {
      type: 'boolean',
      default: false,
      description: 'Whether multiple selection is allowed',
    },
    
    maxSelections: {
      type: 'number',
      required: false,
      description: 'Maximum number of selections (for multiple)',
    },
    
    searchPlaceholder: {
      type: 'string',
      default: 'Search options...',
      description: 'Search input placeholder',
    },
    
    noOptionsMessage: {
      type: 'string',
      default: 'No options found',
      description: 'Message when no options match search',
    },
    
    name: {
      type: 'string',
      required: false,
      description: 'Select name attribute',
    },
    
    id: {
      type: 'string',
      required: false,
      description: 'Select ID attribute',
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
  },
  
  slots: {
    trigger: {
      name: 'trigger',
      required: false,
      allowedComponents: ['Button', 'Input'],
    },
    
    option: {
      name: 'option',
      required: false,
      allowedComponents: ['Text', 'Icon', 'Badge', 'Avatar'],
    },
    
    selectedValue: {
      name: 'selectedValue',
      required: false,
      allowedComponents: ['Text', 'Badge', 'Chip'],
    },
    
    dropdown: {
      name: 'dropdown',
      required: false,
      allowedComponents: ['List', 'Menu', 'VirtualList'],
    },
    
    search: {
      name: 'search',
      required: false,
      allowedComponents: ['Input', 'SearchBox'],
    },
    
    loading: {
      name: 'loading',
      required: false,
      allowedComponents: ['Spinner', 'Skeleton'],
    },
    
    empty: {
      name: 'empty',
      required: false,
      allowedComponents: ['Text', 'EmptyState'],
    },
  },
  
  variants: {
    // Country selector
    country: {
      variant: 'outlined',
      size: 'md',
      searchable: true,
      placeholder: 'Select country...',
    },
    
    // Category selector
    category: {
      variant: 'filled',
      size: 'md',
      clearable: true,
      placeholder: 'Choose category...',
    },
    
    // Multi-select tags
    tags: {
      variant: 'outlined',
      multiple: true,
      searchable: true,
      clearable: true,
      placeholder: 'Add tags...',
    },
    
    // Status dropdown
    status: {
      variant: 'default',
      size: 'sm',
      placeholder: 'Select status...',
    },
    
    // Priority selector
    priority: {
      variant: 'filled',
      size: 'sm',
      placeholder: 'Set priority...',
    },
    
    // User selector
    user: {
      variant: 'outlined',
      searchable: true,
      placeholder: 'Assign to...',
    },
    
    // Language selector
    language: {
      variant: 'ghost',
      size: 'sm',
      placeholder: 'Language',
    },
    
    // Compact selector
    compact: {
      variant: 'ghost',
      size: 'xs',
      rounded: 'sm',
    },
    
    // Large selector
    large: {
      variant: 'outlined',
      size: 'lg',
      rounded: 'lg',
    },
    
    // Simple dropdown
    simple: {
      variant: 'default',
      size: 'md',
    },
  },
  
  events: {
    change: {
      description: 'Triggered when selection changes',
      payload: 'SelectChangeEvent',
    },
    
    search: {
      description: 'Triggered when search query changes',
      payload: 'string',
    },
    
    open: {
      description: 'Triggered when dropdown opens',
      payload: 'void',
    },
    
    close: {
      description: 'Triggered when dropdown closes',
      payload: 'void',
    },
    
    clear: {
      description: 'Triggered when selection is cleared',
      payload: 'void',
    },
    
    focus: {
      description: 'Triggered when select receives focus',
      payload: 'FocusEvent',
    },
    
    blur: {
      description: 'Triggered when select loses focus',
      payload: 'FocusEvent',
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
      'fontSize',
      'padding',
      'height',
      'width',
      'focusRingColor',
      'dropdownBackground',
      'dropdownShadow',
    ],
  },
};

export default SelectConfig;