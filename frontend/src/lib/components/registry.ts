import React, { createElement, ComponentType, ReactElement } from 'react';
import { ComponentConfig, PropDefinition, SlotDefinition } from '@/types/config';
import { validateConfig, ComponentConfigSchema } from '@/lib/config/validation';

export interface ComponentRegistryEntry {
  config: ComponentConfig;
  component: ComponentType<any>;
  defaultProps: Record<string, any>;
  validator?: (props: any) => boolean;
}

export interface ComponentInstance {
  id: string;
  componentName: string;
  props: Record<string, any>;
  children?: ComponentInstance[];
  slots?: Record<string, ComponentInstance[]>;
}

export interface RenderContext {
  theme: any;
  locale: string;
  featureFlags: Record<string, boolean>;
  user?: any;
}

export class ComponentRegistry {
  private components = new Map<string, ComponentRegistryEntry>();
  private middlewares: ComponentMiddleware[] = [];
  private eventHandlers = new Map<string, (event: any) => void>();

  /**
   * Register a component with its configuration
   */
  register(config: ComponentConfig, component: ComponentType<any>): void {
    // Validate configuration
    const validatedConfig = validateConfig(config, ComponentConfigSchema) as ComponentConfig;
    
    const entry: ComponentRegistryEntry = {
      config: validatedConfig,
      component,
      defaultProps: this.extractDefaultProps(validatedConfig),
      validator: this.createValidator(validatedConfig),
    };

    this.components.set(config.name, entry);
    console.log(`Registered component: ${config.name}`);
  }

  /**
   * Get component entry by name
   */
  get(name: string): ComponentRegistryEntry | undefined {
    return this.components.get(name);
  }

  /**
   * Get component by name
   */
  getComponent(name: string): ComponentType<any> | undefined {
    const entry = this.components.get(name);
    return entry?.component;
  }

  /**
   * Check if component exists
   */
  has(name: string): boolean {
    return this.components.has(name);
  }

  /**
   * Get all registered component names
   */
  getComponentNames(): string[] {
    return Array.from(this.components.keys());
  }

  /**
   * Get components by category
   */
  getComponentsByCategory(category: string): ComponentRegistryEntry[] {
    return Array.from(this.components.values()).filter(
      entry => entry.config.category === category
    );
  }

  /**
   * Render a component instance
   */
  renderComponent(
    instance: ComponentInstance,
    context: RenderContext
  ): ReactElement {
    const entry = this.get(instance.componentName);
    if (!entry) {
      console.error(`Component not found: ${instance.componentName}`);
      return React.createElement('div', { 
        className: 'error' 
      }, `Component "${instance.componentName}" not found`);
    }

    try {
      // Apply middlewares
      const processedProps = this.applyMiddlewares(instance.props, entry, context);
      
      // Merge with default props
      const finalProps: any = {
        ...entry.defaultProps,
        ...processedProps,
        key: instance.id,
      };

      // Validate props if validator exists
      if (entry.validator && !entry.validator(finalProps)) {
        console.error(`Invalid props for component: ${instance.componentName}`, finalProps);
        return React.createElement('div', { 
          className: 'error' 
        }, `Invalid props for component "${instance.componentName}"`);
      }

      // Process children and slots
      const children = this.renderChildren(instance, context);
      const slots = this.renderSlots(instance, context);

      // Add slots to props if defined
      if (Object.keys(slots).length > 0) {
        finalProps.slots = slots;
      }

      // Add event handlers
      this.attachEventHandlers(finalProps, entry, instance);

      return createElement(entry.component, finalProps, children);
    } catch (error) {
      console.error(`Error rendering component ${instance.componentName}:`, error);
      return React.createElement('div', { 
        className: 'error' 
      }, `Error rendering component "${instance.componentName}"`);
    }
  }

  /**
   * Render component from configuration
   */
  renderFromConfig(
    componentName: string,
    props: Record<string, any>,
    context: RenderContext,
    children?: ReactElement[]
  ): ReactElement {
    const instance: ComponentInstance = {
      id: `${componentName}-${Date.now()}`,
      componentName,
      props,
      children: [],
    };

    const element = this.renderComponent(instance, context);

    // Add children if provided
    if (children && children.length > 0) {
      return React.cloneElement(element, {}, ...children);
    }

    return element;
  }

  /**
   * Create component variant
   */
  createVariant(
    componentName: string,
    variantName: string,
    props: Record<string, any>,
    context: RenderContext
  ): ReactElement {
    const entry = this.get(componentName);
    if (!entry) {
      throw new Error(`Component not found: ${componentName}`);
    }

    const variant = entry.config.variants?.[variantName];
    if (!variant) {
      throw new Error(`Variant not found: ${variantName} for component ${componentName}`);
    }

    // Merge variant props with provided props
    const mergedProps = { ...variant, ...props };

    return this.renderFromConfig(componentName, mergedProps, context);
  }

  /**
   * Add middleware
   */
  use(middleware: ComponentMiddleware): void {
    this.middlewares.push(middleware);
  }

  /**
   * Register event handler
   */
  registerEventHandler(eventName: string, handler: (event: any) => void): void {
    this.eventHandlers.set(eventName, handler);
  }

  /**
   * Extract default props from configuration
   */
  private extractDefaultProps(config: ComponentConfig): Record<string, any> {
    const defaults: Record<string, any> = {};
    
    for (const [propName, propDef] of Object.entries(config.props)) {
      if (propDef.default !== undefined) {
        defaults[propName] = propDef.default;
      }
    }

    return defaults;
  }

  /**
   * Create validator function from configuration
   */
  private createValidator(config: ComponentConfig): (props: any) => boolean {
    return (props: any) => {
      for (const [propName, propDef] of Object.entries(config.props)) {
        const value = props[propName];

        // Check required props
        if (propDef.required && (value === undefined || value === null)) {
          console.error(`Required prop missing: ${propName}`);
          return false;
        }

        // Check enum values
        if (propDef.enum && value !== undefined && !propDef.enum.includes(value)) {
          console.error(`Invalid enum value for prop ${propName}: ${value}`);
          return false;
        }

        // Type validation could be added here
        // For now, we rely on TypeScript for type checking
      }

      return true;
    };
  }

  /**
   * Apply middleware chain
   */
  private applyMiddlewares(
    props: Record<string, any>,
    entry: ComponentRegistryEntry,
    context: RenderContext
  ): Record<string, any> {
    let processedProps = { ...props };

    for (const middleware of this.middlewares) {
      processedProps = middleware(processedProps, entry, context);
    }

    return processedProps;
  }

  /**
   * Render children components
   */
  private renderChildren(
    instance: ComponentInstance,
    context: RenderContext
  ): ReactElement[] {
    if (!instance.children || instance.children.length === 0) {
      return [];
    }

    return instance.children.map(child => 
      this.renderComponent(child, context)
    );
  }

  /**
   * Render slot components
   */
  private renderSlots(
    instance: ComponentInstance,
    context: RenderContext
  ): Record<string, ReactElement[]> {
    const slots: Record<string, ReactElement[]> = {};

    if (!instance.slots) {
      return slots;
    }

    for (const [slotName, slotComponents] of Object.entries(instance.slots)) {
      slots[slotName] = slotComponents.map(component =>
        this.renderComponent(component, context)
      );
    }

    return slots;
  }

  /**
   * Attach event handlers to props
   */
  private attachEventHandlers(
    props: Record<string, any>,
    entry: ComponentRegistryEntry,
    instance: ComponentInstance
  ): void {
    if (!entry.config.events) {
      return;
    }

    for (const eventName of Object.keys(entry.config.events)) {
      const handlerName = `on${eventName.charAt(0).toUpperCase()}${eventName.slice(1)}`;
      
      if (props[handlerName] && typeof props[handlerName] === 'string') {
        // If handler is a string, look up the registered handler
        const handler = this.eventHandlers.get(props[handlerName]);
        if (handler) {
          props[handlerName] = handler;
        }
      }
    }
  }

  /**
   * Get component documentation
   */
  getDocumentation(componentName: string): ComponentDocumentation | null {
    const entry = this.get(componentName);
    if (!entry) {
      return null;
    }

    return {
      name: entry.config.name,
      description: entry.config.description,
      category: entry.config.category,
      props: this.generatePropsDocumentation(entry.config.props),
      variants: Object.keys(entry.config.variants || {}),
      slots: Object.keys(entry.config.slots || {}),
      events: Object.keys(entry.config.events || {}),
      examples: this.generateExamples(entry.config),
    };
  }

  /**
   * Generate props documentation
   */
  private generatePropsDocumentation(props: Record<string, PropDefinition>): PropDocumentation[] {
    return Object.entries(props).map(([name, def]) => ({
      name,
      type: def.type,
      required: def.required || false,
      default: def.default,
      description: def.description || '',
      enum: def.enum,
    }));
  }

  /**
   * Generate usage examples
   */
  private generateExamples(config: ComponentConfig): ComponentExample[] {
    const examples: ComponentExample[] = [];

    // Basic example
    examples.push({
      title: 'Basic Usage',
      code: this.generateBasicExample(config),
    });

    // Variant examples
    if (config.variants) {
      for (const [variantName, variantProps] of Object.entries(config.variants)) {
        examples.push({
          title: `${variantName} Variant`,
          code: this.generateVariantExample(config, variantName, variantProps),
        });
      }
    }

    return examples;
  }

  /**
   * Generate basic usage example
   */
  private generateBasicExample(config: ComponentConfig): string {
    const requiredProps = Object.entries(config.props)
      .filter(([_, def]) => def.required)
      .map(([name, def]) => `${name}={${JSON.stringify(def.default || 'value')}}`)
      .join(' ');

    return `<${config.name} ${requiredProps} />`;
  }

  /**
   * Generate variant example
   */
  private generateVariantExample(
    config: ComponentConfig,
    variantName: string,
    variantProps: any
  ): string {
    const props = Object.entries(variantProps)
      .map(([name, value]) => `${name}={${JSON.stringify(value)}}`)
      .join(' ');

    return `<${config.name} ${props} />`;
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ComponentRegistry {
    if (!registryInstance) {
      registryInstance = new ComponentRegistry();
    }
    return registryInstance;
  }
}

// Middleware type
export type ComponentMiddleware = (
  props: Record<string, any>,
  entry: ComponentRegistryEntry,
  context: RenderContext
) => Record<string, any>;

// Documentation types
export interface ComponentDocumentation {
  name: string;
  description: string;
  category: string;
  props: PropDocumentation[];
  variants: string[];
  slots: string[];
  events: string[];
  examples: ComponentExample[];
}

export interface PropDocumentation {
  name: string;
  type: string;
  required: boolean;
  default?: any;
  description: string;
  enum?: string[];
}

export interface ComponentExample {
  title: string;
  code: string;
}

// Singleton instance
let registryInstance: ComponentRegistry | null = null;

// Create singleton instance
export const componentRegistry = new ComponentRegistry();

// Add getInstance method to ComponentRegistry class (moved to inside class)