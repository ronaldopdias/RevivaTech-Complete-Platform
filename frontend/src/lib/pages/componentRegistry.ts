/**
 * Component Registry for Dynamic Page System
 * 
 * This system manages component registration and resolution for the
 * dynamic page factory, enabling flexible component composition.
 */

import { ComponentType } from 'react';

// Component registry interface
export interface ComponentRegistry {
  register: (name: string, component: ComponentType<any>) => void;
  registerBatch: (components: Record<string, ComponentType<any>>) => void;
  get: (name: string) => ComponentType<any> | null;
  has: (name: string) => boolean;
  list: () => string[];
  unregister: (name: string) => void;
  clear: () => void;
  getInfo: (name: string) => ComponentInfo | null;
}

// Component information interface
export interface ComponentInfo {
  name: string;
  component: ComponentType<any>;
  registered: Date;
  category?: string;
  description?: string;
  props?: Record<string, any>;
  examples?: ComponentExample[];
}

// Component example interface
export interface ComponentExample {
  name: string;
  props: Record<string, any>;
  description?: string;
}

// Component registry implementation
export class RevivaTechComponentRegistry implements ComponentRegistry {
  private components: Map<string, ComponentInfo>;
  private aliases: Map<string, string>;

  constructor() {
    this.components = new Map();
    this.aliases = new Map();
  }

  /**
   * Registers a single component
   */
  register(name: string, component: ComponentType<any>): void {
    if (!name || !component) {
      throw new Error('Component name and component are required');
    }

    if (this.components.has(name)) {
      console.warn(`Component ${name} is already registered, overwriting`);
    }

    const info: ComponentInfo = {
      name,
      component,
      registered: new Date(),
      category: this.inferCategory(name),
      description: this.inferDescription(name)
    };

    this.components.set(name, info);
  }

  /**
   * Registers multiple components at once
   */
  registerBatch(components: Record<string, ComponentType<any>>): void {
    Object.entries(components).forEach(([name, component]) => {
      this.register(name, component);
    });
  }

  /**
   * Gets a component by name
   */
  get(name: string): ComponentType<any> | null {
    // Check direct registration
    const info = this.components.get(name);
    if (info) {
      return info.component;
    }

    // Check aliases
    const aliasTarget = this.aliases.get(name);
    if (aliasTarget) {
      const aliasInfo = this.components.get(aliasTarget);
      return aliasInfo?.component || null;
    }

    return null;
  }

  /**
   * Checks if a component is registered
   */
  has(name: string): boolean {
    return this.components.has(name) || this.aliases.has(name);
  }

  /**
   * Lists all registered component names
   */
  list(): string[] {
    return Array.from(this.components.keys());
  }

  /**
   * Unregisters a component
   */
  unregister(name: string): void {
    this.components.delete(name);
    
    // Remove aliases pointing to this component
    const aliasesToRemove: string[] = [];
    this.aliases.forEach((target, alias) => {
      if (target === name) {
        aliasesToRemove.push(alias);
      }
    });
    
    aliasesToRemove.forEach(alias => {
      this.aliases.delete(alias);
    });
  }

  /**
   * Clears all registered components
   */
  clear(): void {
    this.components.clear();
    this.aliases.clear();
  }

  /**
   * Gets component information
   */
  getInfo(name: string): ComponentInfo | null {
    return this.components.get(name) || null;
  }

  /**
   * Registers an alias for a component
   */
  registerAlias(alias: string, target: string): void {
    if (!this.components.has(target)) {
      throw new Error(`Cannot create alias ${alias} for unregistered component ${target}`);
    }

    this.aliases.set(alias, target);
  }

  /**
   * Gets components by category
   */
  getByCategory(category: string): ComponentInfo[] {
    return Array.from(this.components.values()).filter(info => info.category === category);
  }

  /**
   * Infers component category from name
   */
  private inferCategory(name: string): string {
    if (name.includes('Section') || name.includes('Hero') || name.includes('Feature')) {
      return 'section';
    }
    if (name.includes('Layout')) {
      return 'layout';
    }
    if (name.includes('Form') || name.includes('Input') || name.includes('Button')) {
      return 'form';
    }
    if (name.includes('Card') || name.includes('Modal') || name.includes('Tooltip')) {
      return 'ui';
    }
    if (name.includes('Nav') || name.includes('Header') || name.includes('Footer')) {
      return 'navigation';
    }
    return 'component';
  }

  /**
   * Infers component description from name
   */
  private inferDescription(name: string): string {
    const descriptions: Record<string, string> = {
      'HeroSection': 'Main hero section with title, subtitle, and call-to-action',
      'ServicesGrid': 'Grid layout displaying services with icons and descriptions',
      'FeatureHighlights': 'Highlighted features with alternating layout',
      'TestimonialsCarousel': 'Rotating testimonials from customers',
      'ProcessSteps': 'Step-by-step process visualization',
      'CallToAction': 'Call-to-action section with buttons and features',
      'ServiceDetails': 'Detailed service information and pricing',
      'PricingSection': 'Pricing tiers and options',
      'Button': 'Interactive button with variants and sizes',
      'Card': 'Container component with styling variants',
      'Input': 'Form input with validation and styling',
      'MainLayout': 'Main page layout with header and footer',
      'ContentLayout': 'Content-focused layout for articles',
      'FormLayout': 'Form-specific layout with validation'
    };

    return descriptions[name] || `${name} component`;
  }
}

// Default component registry instance
export const defaultComponentRegistry = new RevivaTechComponentRegistry();

// Component registration utilities
export const componentRegistryUtils = {
  /**
   * Creates a component registry with default components
   */
  createRegistry: (): ComponentRegistry => {
    return new RevivaTechComponentRegistry();
  },

  /**
   * Registers all RevivaTech components
   */
  registerRevivaTechComponents: async (registry: ComponentRegistry): Promise<void> => {
    // Register section components
    const sectionComponents = {
      'HeroSection': () => import('@/components/sections/HeroSection'),
      'ServicesGrid': () => import('@/components/sections/ServicesGrid'),
      'FeatureHighlights': () => import('@/components/sections/FeatureHighlights'),
      'TestimonialsCarousel': () => import('@/components/sections/TestimonialsCarousel'),
      'ProcessSteps': () => import('@/components/sections/ProcessSteps'),
      'CallToAction': () => import('@/components/sections/CallToAction'),
      // 'ServiceDetails': () => import('@/components/sections/ServiceDetails'), // Component not found
      // 'PricingSection': () => import('@/components/sections/PricingSection'), // Component not found
      // 'ContentHeader': () => import('@/components/sections/ContentHeader'), // Component not found
      // 'RichContent': () => import('@/components/sections/RichContent'), // Component not found
      // 'FormHeader': () => import('@/components/sections/FormHeader'), // Component not found
      // 'DynamicForm': () => import('@/components/sections/DynamicForm') // Component not found
    };

    // Register UI components
    const uiComponents = {
      'Button': () => import('@/components/ui/Button'),
      'Card': () => import('@/components/ui/Card'),
      'Input': () => import('@/components/ui/Input'),
      'Select': () => import('@/components/ui/Select'),
      'Textarea': () => import('@/components/ui/Textarea'),
      'Checkbox': () => import('@/components/ui/Checkbox')
    };

    // Register layout components
    const layoutComponents = {
      'MainLayout': () => import('@/components/layout/MainLayout'),
      'ContentLayout': () => import('@/components/layout/ContentLayout'),
      'FormLayout': () => import('@/components/layout/FormLayout')
    };

    // Load and register all components
    const allComponents = { ...sectionComponents, ...uiComponents, ...layoutComponents };
    
    for (const [name, loader] of Object.entries(allComponents)) {
      try {
        const module = await loader();
        const component = module.default || module[name];
        
        if (component) {
          registry.register(name, component);
        }
      } catch (error) {
        console.warn(`Failed to load component ${name}:`, error);
      }
    }
  },

  /**
   * Registers components from a module
   */
  registerFromModule: async (
    registry: ComponentRegistry,
    modulePath: string,
    componentNames: string[]
  ): Promise<void> => {
    try {
      const module = await import(modulePath);
      
      componentNames.forEach(name => {
        const component = module[name] || module.default;
        if (component) {
          registry.register(name, component);
        }
      });
    } catch (error) {
      console.error(`Failed to load module ${modulePath}:`, error);
    }
  },

  /**
   * Validates component registration
   */
  validateComponents: (registry: ComponentRegistry, requiredComponents: string[]): string[] => {
    const missing: string[] = [];
    
    requiredComponents.forEach(componentName => {
      if (!registry.has(componentName)) {
        missing.push(componentName);
      }
    });

    return missing;
  },

  /**
   * Gets component usage statistics
   */
  getUsageStats: (registry: ComponentRegistry): Record<string, any> => {
    const components = registry.list();
    const stats = {
      total: components.length,
      categories: {} as Record<string, number>,
      components: components.map(name => ({
        name,
        info: registry.getInfo(name)
      }))
    };

    components.forEach(name => {
      const info = registry.getInfo(name);
      if (info?.category) {
        stats.categories[info.category] = (stats.categories[info.category] || 0) + 1;
      }
    });

    return stats;
  }
};

export default RevivaTechComponentRegistry;