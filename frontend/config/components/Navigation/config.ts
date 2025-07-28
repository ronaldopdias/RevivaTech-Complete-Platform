import { ComponentConfig } from '@/types/config';

export const NavigationConfig: ComponentConfig = {
  name: 'Navigation',
  version: '1.0.0',
  description: 'Configurable navigation component with responsive design and mobile menu',
  category: 'navigation',
  
  props: {
    variant: {
      type: 'enum',
      enum: ['default', 'transparent', 'solid', 'bordered', 'floating'],
      default: 'default',
      description: 'Navigation visual variant',
    },
    
    position: {
      type: 'enum',
      enum: ['static', 'sticky', 'fixed', 'absolute'],
      default: 'sticky',
      description: 'Navigation positioning',
    },
    
    size: {
      type: 'enum',
      enum: ['sm', 'md', 'lg'],
      default: 'md',
      description: 'Navigation height and spacing',
    },
    
    layout: {
      type: 'enum',
      enum: ['horizontal', 'vertical', 'mixed'],
      default: 'horizontal',
      description: 'Navigation layout orientation',
    },
    
    alignment: {
      type: 'enum',
      enum: ['left', 'center', 'right', 'between', 'around'],
      default: 'between',
      description: 'Content alignment within navigation',
    },
    
    brand: {
      type: 'object',
      required: false,
      description: 'Brand/logo configuration',
    },
    
    items: {
      type: 'array',
      required: true,
      description: 'Navigation menu items',
    },
    
    actions: {
      type: 'array',
      required: false,
      description: 'Action buttons (login, signup, etc.)',
    },
    
    mobileBreakpoint: {
      type: 'enum',
      enum: ['sm', 'md', 'lg', 'xl'],
      default: 'lg',
      description: 'Breakpoint for mobile menu activation',
    },
    
    showMobileMenu: {
      type: 'boolean',
      default: true,
      description: 'Whether to show mobile hamburger menu',
    },
    
    stickyOnScroll: {
      type: 'boolean',
      default: false,
      description: 'Whether to become sticky when scrolling',
    },
    
    blurBackground: {
      type: 'boolean',
      default: true,
      description: 'Whether to blur background when sticky/transparent',
    },
    
    showSearch: {
      type: 'boolean',
      default: false,
      description: 'Whether to show search functionality',
    },
    
    searchPlaceholder: {
      type: 'string',
      default: 'Search...',
      description: 'Search input placeholder text',
    },
    
    className: {
      type: 'string',
      required: false,
      description: 'Additional CSS classes',
    },
    
    id: {
      type: 'string',
      required: false,
      description: 'Navigation ID attribute',
    },
    
    ariaLabel: {
      type: 'string',
      default: 'Main navigation',
      description: 'Accessibility label for navigation',
    },
  },
  
  slots: {
    brand: {
      name: 'brand',
      required: false,
      allowedComponents: ['Image', 'Text', 'Link'],
    },
    
    menu: {
      name: 'menu',
      required: false,
      allowedComponents: ['NavigationItem', 'NavigationDropdown', 'NavigationGroup'],
    },
    
    actions: {
      name: 'actions',
      required: false,
      allowedComponents: ['Button', 'ButtonGroup', 'Avatar', 'Badge'],
    },
    
    search: {
      name: 'search',
      required: false,
      allowedComponents: ['Input', 'SearchBox'],
    },
    
    mobileMenu: {
      name: 'mobileMenu',
      required: false,
      allowedComponents: ['NavigationItem', 'NavigationGroup', 'Button'],
    },
    
    overlay: {
      name: 'overlay',
      required: false,
      allowedComponents: ['Backdrop', 'Drawer'],
    },
  },
  
  variants: {
    // Main website navigation
    primary: {
      variant: 'transparent',
      position: 'sticky',
      size: 'lg',
      blurBackground: true,
      stickyOnScroll: true,
    },
    
    // Dashboard navigation
    dashboard: {
      variant: 'solid',
      position: 'sticky',
      size: 'md',
      layout: 'horizontal',
      showSearch: true,
    },
    
    // Sidebar navigation
    sidebar: {
      variant: 'bordered',
      position: 'static',
      layout: 'vertical',
      size: 'md',
    },
    
    // Mobile app style
    mobile: {
      variant: 'solid',
      position: 'fixed',
      size: 'sm',
      showMobileMenu: true,
    },
    
    // Minimal navigation
    minimal: {
      variant: 'transparent',
      position: 'static',
      size: 'sm',
      alignment: 'center',
    },
    
    // Landing page hero
    hero: {
      variant: 'transparent',
      position: 'absolute',
      size: 'lg',
      blurBackground: false,
    },
    
    // Footer navigation
    footer: {
      variant: 'default',
      position: 'static',
      layout: 'vertical',
      size: 'sm',
    },
    
    // Breadcrumb style
    breadcrumb: {
      variant: 'transparent',
      position: 'static',
      size: 'sm',
      layout: 'horizontal',
    },
    
    // Floating navigation
    floating: {
      variant: 'floating',
      position: 'fixed',
      size: 'md',
      blurBackground: true,
    },
    
    // Admin navigation
    admin: {
      variant: 'solid',
      position: 'sticky',
      size: 'lg',
      showSearch: true,
      layout: 'horizontal',
    },
  },
  
  events: {
    itemClick: {
      description: 'Triggered when navigation item is clicked',
      payload: 'NavigationItemClickEvent',
    },
    
    brandClick: {
      description: 'Triggered when brand/logo is clicked',
      payload: 'MouseEvent',
    },
    
    mobileToggle: {
      description: 'Triggered when mobile menu is toggled',
      payload: 'boolean',
    },
    
    search: {
      description: 'Triggered when search is performed',
      payload: 'string',
    },
    
    scroll: {
      description: 'Triggered on scroll events (for sticky behavior)',
      payload: 'ScrollEvent',
    },
  },
  
  styling: {
    responsive: true,
    themeable: true,
    customizable: [
      'backgroundColor',
      'borderColor',
      'textColor',
      'height',
      'padding',
      'backdropFilter',
      'boxShadow',
      'zIndex',
    ],
  },
};

export default NavigationConfig;