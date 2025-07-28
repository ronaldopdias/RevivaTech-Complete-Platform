import { ComponentConfig } from '@/types/config';

export const CardConfig: ComponentConfig = {
  name: 'Card',
  version: '1.0.0',
  description: 'Configurable card component with flexible layout and slot composition',
  category: 'ui',
  
  props: {
    variant: {
      type: 'enum',
      enum: ['default', 'elevated', 'outlined', 'filled', 'ghost'],
      default: 'default',
      description: 'Card visual variant',
    },
    
    size: {
      type: 'enum',
      enum: ['xs', 'sm', 'md', 'lg', 'xl'],
      default: 'md',
      description: 'Card size affecting padding and spacing',
    },
    
    rounded: {
      type: 'enum',
      enum: ['none', 'sm', 'md', 'lg', 'xl', 'full'],
      default: 'md',
      description: 'Border radius size',
    },
    
    shadow: {
      type: 'enum',
      enum: ['none', 'sm', 'md', 'lg', 'xl'],
      default: 'sm',
      description: 'Shadow intensity',
    },
    
    border: {
      type: 'enum',
      enum: ['none', 'thin', 'medium', 'thick'],
      default: 'thin',
      description: 'Border thickness',
    },
    
    padding: {
      type: 'enum',
      enum: ['none', 'sm', 'md', 'lg', 'xl'],
      default: 'md',
      description: 'Internal padding',
    },
    
    background: {
      type: 'enum',
      enum: ['default', 'primary', 'secondary', 'accent', 'muted', 'transparent'],
      default: 'default',
      description: 'Background color variant',
    },
    
    interactive: {
      type: 'boolean',
      default: false,
      description: 'Whether card is interactive (hover effects)',
    },
    
    clickable: {
      type: 'boolean',
      default: false,
      description: 'Whether card is clickable',
    },
    
    href: {
      type: 'string',
      required: false,
      description: 'Link URL (makes card clickable)',
    },
    
    target: {
      type: 'enum',
      enum: ['_self', '_blank', '_parent', '_top'],
      default: '_self',
      description: 'Link target (only when href is provided)',
    },
    
    className: {
      type: 'string',
      required: false,
      description: 'Additional CSS classes',
    },
    
    id: {
      type: 'string',
      required: false,
      description: 'Card ID attribute',
    },
    
    ariaLabel: {
      type: 'string',
      required: false,
      description: 'Accessibility label',
    },
    
    role: {
      type: 'string',
      required: false,
      description: 'ARIA role attribute',
    },
  },
  
  slots: {
    header: {
      name: 'header',
      required: false,
      allowedComponents: ['Text', 'Button', 'Badge', 'Avatar', 'Icon'],
    },
    
    media: {
      name: 'media',
      required: false,
      allowedComponents: ['Image', 'Video', 'Chart', 'Map'],
    },
    
    content: {
      name: 'content',
      required: false,
      allowedComponents: ['Text', 'List', 'Form', 'Table', 'Chart'],
    },
    
    actions: {
      name: 'actions',
      required: false,
      allowedComponents: ['Button', 'ButtonGroup', 'Menu', 'Dropdown'],
    },
    
    footer: {
      name: 'footer',
      required: false,
      allowedComponents: ['Text', 'Button', 'Badge', 'Link'],
    },
    
    aside: {
      name: 'aside',
      required: false,
      allowedComponents: ['Badge', 'Icon', 'Avatar', 'Button'],
    },
    
    overlay: {
      name: 'overlay',
      required: false,
      allowedComponents: ['Badge', 'Button', 'Tooltip', 'Menu'],
    },
  },
  
  variants: {
    // Product card
    product: {
      variant: 'elevated',
      size: 'md',
      shadow: 'md',
      interactive: true,
      clickable: true,
    },
    
    // Service card
    service: {
      variant: 'outlined',
      size: 'lg',
      shadow: 'sm',
      interactive: true,
    },
    
    // Testimonial card
    testimonial: {
      variant: 'filled',
      size: 'md',
      rounded: 'lg',
      shadow: 'sm',
    },
    
    // Feature card
    feature: {
      variant: 'ghost',
      size: 'lg',
      padding: 'xl',
      interactive: true,
    },
    
    // Stats card
    stats: {
      variant: 'elevated',
      size: 'sm',
      shadow: 'md',
      background: 'primary',
    },
    
    // Profile card
    profile: {
      variant: 'elevated',
      size: 'md',
      rounded: 'lg',
      shadow: 'lg',
    },
    
    // Notification card
    notification: {
      variant: 'outlined',
      size: 'sm',
      shadow: 'none',
      interactive: true,
    },
    
    // Dashboard widget
    widget: {
      variant: 'elevated',
      size: 'md',
      shadow: 'sm',
      background: 'default',
    },
    
    // Article preview
    article: {
      variant: 'elevated',
      size: 'lg',
      shadow: 'md',
      interactive: true,
      clickable: true,
    },
    
    // Simple content card
    simple: {
      variant: 'ghost',
      size: 'md',
      shadow: 'none',
      border: 'none',
    },
  },
  
  events: {
    click: {
      description: 'Triggered when card is clicked',
      payload: 'MouseEvent',
    },
    
    hover: {
      description: 'Triggered when card is hovered',
      payload: 'MouseEvent',
    },
    
    focus: {
      description: 'Triggered when card receives focus',
      payload: 'FocusEvent',
    },
    
    blur: {
      description: 'Triggered when card loses focus',
      payload: 'FocusEvent',
    },
  },
  
  styling: {
    responsive: true,
    themeable: true,
    customizable: [
      'backgroundColor',
      'borderColor',
      'borderRadius',
      'borderWidth',
      'padding',
      'margin',
      'boxShadow',
      'width',
      'height',
      'minHeight',
      'maxHeight',
    ],
  },
};

export default CardConfig;