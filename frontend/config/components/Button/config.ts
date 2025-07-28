import { ComponentConfig } from '@/types/config';

export const ButtonConfig: ComponentConfig = {
  name: 'Button',
  version: '1.0.0',
  description: 'Configurable button component with multiple variants and themes',
  category: 'ui',
  
  props: {
    text: {
      type: 'string',
      required: true,
      description: 'Button label text',
    },
    
    variant: {
      type: 'enum',
      enum: ['primary', 'secondary', 'ghost', 'danger', 'outline'],
      default: 'primary',
      description: 'Button visual variant',
    },
    
    size: {
      type: 'enum',
      enum: ['xs', 'sm', 'md', 'lg', 'xl'],
      default: 'md',
      description: 'Button size',
    },
    
    icon: {
      type: 'object',
      required: false,
      description: 'Icon configuration',
    },
    
    disabled: {
      type: 'boolean',
      default: false,
      description: 'Whether the button is disabled',
    },
    
    loading: {
      type: 'boolean',
      default: false,
      description: 'Whether the button is in loading state',
    },
    
    fullWidth: {
      type: 'boolean',
      default: false,
      description: 'Whether the button should take full width',
    },
    
    rounded: {
      type: 'enum',
      enum: ['none', 'sm', 'md', 'lg', 'full'],
      default: 'md',
      description: 'Border radius size',
    },
    
    shadow: {
      type: 'enum',
      enum: ['none', 'sm', 'md', 'lg'],
      default: 'sm',
      description: 'Shadow size',
    },
    
    href: {
      type: 'string',
      required: false,
      description: 'Link URL (renders as link instead of button)',
    },
    
    target: {
      type: 'enum',
      enum: ['_self', '_blank', '_parent', '_top'],
      default: '_self',
      description: 'Link target (only when href is provided)',
    },
    
    type: {
      type: 'enum',
      enum: ['button', 'submit', 'reset'],
      default: 'button',
      description: 'Button type attribute',
    },
    
    className: {
      type: 'string',
      required: false,
      description: 'Additional CSS classes',
    },
    
    id: {
      type: 'string',
      required: false,
      description: 'Button ID attribute',
    },
    
    ariaLabel: {
      type: 'string',
      required: false,
      description: 'Accessibility label',
    },
    
    tooltip: {
      type: 'string',
      required: false,
      description: 'Tooltip text',
    },
  },
  
  slots: {
    startIcon: {
      name: 'startIcon',
      required: false,
      allowedComponents: ['Icon', 'Spinner', 'Image'],
    },
    
    endIcon: {
      name: 'endIcon', 
      required: false,
      allowedComponents: ['Icon', 'Spinner', 'Image'],
    },
    
    content: {
      name: 'content',
      required: false,
      allowedComponents: ['Text', 'Badge', 'Tooltip'],
    },
    
    prefix: {
      name: 'prefix',
      required: false,
      allowedComponents: ['Badge', 'Icon'],
    },
    
    suffix: {
      name: 'suffix', 
      required: false,
      allowedComponents: ['Badge', 'Icon', 'Tooltip'],
    },
  },
  
  variants: {
    // Call-to-action button
    cta: {
      variant: 'primary',
      size: 'lg',
      shadow: 'md',
    },
    
    // Navigation button
    nav: {
      variant: 'ghost',
      size: 'md',
      shadow: 'none',
    },
    
    // Danger/destructive button
    danger: {
      variant: 'danger',
      size: 'md',
      shadow: 'sm',
    },
    
    // Subtle button
    subtle: {
      variant: 'ghost',
      size: 'sm',
      shadow: 'none',
    },
    
    // Card action button
    cardAction: {
      variant: 'outline',
      size: 'sm',
      fullWidth: true,
    },
    
    // Social login button
    social: {
      variant: 'outline',
      size: 'md',
      fullWidth: true,
      rounded: 'lg',
    },
    
    // Icon only button
    iconOnly: {
      variant: 'ghost',
      size: 'md',
      rounded: 'full',
    },
    
    // Floating action button
    fab: {
      variant: 'primary',
      size: 'lg',
      rounded: 'full',
      shadow: 'lg',
    },
    
    // Pill button
    pill: {
      variant: 'primary',
      size: 'md',
      rounded: 'full',
    },
    
    // Link style button
    link: {
      variant: 'ghost',
      size: 'md',
      shadow: 'none',
    },
  },
  
  events: {
    click: {
      description: 'Triggered when button is clicked',
      payload: 'MouseEvent',
    },
    
    focus: {
      description: 'Triggered when button receives focus',
      payload: 'FocusEvent',
    },
    
    blur: {
      description: 'Triggered when button loses focus',
      payload: 'FocusEvent',
    },
    
    hover: {
      description: 'Triggered when button is hovered',
      payload: 'MouseEvent',
    },
  },
  
  styling: {
    responsive: true,
    themeable: true,
    customizable: [
      'backgroundColor',
      'textColor',
      'borderColor',
      'borderRadius',
      'padding',
      'fontSize',
      'fontWeight',
      'boxShadow',
    ],
  },
};

export default ButtonConfig;