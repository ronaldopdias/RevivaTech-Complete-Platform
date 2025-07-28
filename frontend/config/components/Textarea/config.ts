import { ComponentConfig } from '@/types/config';

export const TextareaConfig: ComponentConfig = {
  name: 'Textarea',
  version: '1.0.0',
  description: 'Configurable textarea component with auto-resize and character counting',
  category: 'form',
  
  props: {
    variant: {
      type: 'enum',
      enum: ['default', 'filled', 'outlined', 'underlined', 'ghost'],
      default: 'default',
      description: 'Textarea visual variant',
    },
    
    size: {
      type: 'enum',
      enum: ['xs', 'sm', 'md', 'lg', 'xl'],
      default: 'md',
      description: 'Textarea size',
    },
    
    rounded: {
      type: 'enum',
      enum: ['none', 'sm', 'md', 'lg'],
      default: 'md',
      description: 'Border radius size',
    },
    
    state: {
      type: 'enum',
      enum: ['default', 'error', 'warning', 'success', 'info'],
      default: 'default',
      description: 'Textarea validation state',
    },
    
    placeholder: {
      type: 'string',
      required: false,
      description: 'Placeholder text',
    },
    
    label: {
      type: 'string',
      required: false,
      description: 'Textarea label',
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
      description: 'Whether textarea is required',
    },
    
    disabled: {
      type: 'boolean',
      default: false,
      description: 'Whether textarea is disabled',
    },
    
    readOnly: {
      type: 'boolean',
      default: false,
      description: 'Whether textarea is read-only',
    },
    
    autoResize: {
      type: 'boolean',
      default: false,
      description: 'Whether textarea should auto-resize',
    },
    
    minRows: {
      type: 'number',
      default: 3,
      description: 'Minimum number of rows',
    },
    
    maxRows: {
      type: 'number',
      required: false,
      description: 'Maximum number of rows (for auto-resize)',
    },
    
    rows: {
      type: 'number',
      default: 4,
      description: 'Number of rows (when not auto-resizing)',
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
    
    showCharacterCount: {
      type: 'boolean',
      default: false,
      description: 'Whether to show character count',
    },
    
    showWordCount: {
      type: 'boolean',
      default: false,
      description: 'Whether to show word count',
    },
    
    name: {
      type: 'string',
      required: false,
      description: 'Textarea name attribute',
    },
    
    id: {
      type: 'string',
      required: false,
      description: 'Textarea ID attribute',
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
    
    footer: {
      name: 'footer',
      required: false,
      allowedComponents: ['Text', 'Badge', 'Button'],
    },
    
    toolbar: {
      name: 'toolbar',
      required: false,
      allowedComponents: ['ButtonGroup', 'Menu', 'Tooltip'],
    },
  },
  
  variants: {
    // Comment textarea
    comment: {
      variant: 'outlined',
      size: 'md',
      autoResize: true,
      minRows: 3,
      maxRows: 8,
      placeholder: 'Write a comment...',
    },
    
    // Message textarea
    message: {
      variant: 'filled',
      size: 'md',
      autoResize: true,
      minRows: 2,
      maxRows: 6,
      placeholder: 'Type your message...',
    },
    
    // Description field
    description: {
      variant: 'default',
      size: 'md',
      rows: 4,
      showCharacterCount: true,
      placeholder: 'Enter description...',
    },
    
    // Notes textarea
    notes: {
      variant: 'ghost',
      size: 'sm',
      autoResize: true,
      minRows: 2,
      placeholder: 'Add notes...',
    },
    
    // Feedback form
    feedback: {
      variant: 'outlined',
      size: 'lg',
      rows: 6,
      showCharacterCount: true,
      maxLength: 1000,
      placeholder: 'Share your feedback...',
    },
    
    // Code textarea
    code: {
      variant: 'outlined',
      size: 'sm',
      rows: 8,
      rounded: 'sm',
      placeholder: 'Enter code...',
    },
    
    // Large content
    content: {
      variant: 'outlined',
      size: 'lg',
      rows: 12,
      showCharacterCount: true,
      showWordCount: true,
      placeholder: 'Write your content...',
    },
    
    // Compact textarea
    compact: {
      variant: 'filled',
      size: 'xs',
      rows: 2,
      rounded: 'sm',
    },
    
    // Review textarea
    review: {
      variant: 'outlined',
      size: 'md',
      rows: 5,
      maxLength: 500,
      showCharacterCount: true,
      placeholder: 'Write your review...',
    },
    
    // Simple textarea
    simple: {
      variant: 'default',
      size: 'md',
      rows: 3,
    },
  },
  
  events: {
    change: {
      description: 'Triggered when textarea value changes',
      payload: 'ChangeEvent<HTMLTextAreaElement>',
    },
    
    blur: {
      description: 'Triggered when textarea loses focus',
      payload: 'FocusEvent<HTMLTextAreaElement>',
    },
    
    focus: {
      description: 'Triggered when textarea receives focus',
      payload: 'FocusEvent<HTMLTextAreaElement>',
    },
    
    keyDown: {
      description: 'Triggered when key is pressed down',
      payload: 'KeyboardEvent<HTMLTextAreaElement>',
    },
    
    keyUp: {
      description: 'Triggered when key is released',
      payload: 'KeyboardEvent<HTMLTextAreaElement>',
    },
    
    input: {
      description: 'Triggered on input event',
      payload: 'FormEvent<HTMLTextAreaElement>',
    },
    
    resize: {
      description: 'Triggered when auto-resize occurs',
      payload: 'number',
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
      'minHeight',
      'maxHeight',
      'width',
      'focusRingColor',
      'resize',
    ],
  },
};

export default TextareaConfig;