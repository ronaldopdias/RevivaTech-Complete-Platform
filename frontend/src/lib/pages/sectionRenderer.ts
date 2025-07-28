/**
 * Section-Based Page Rendering System
 * 
 * This system enables modular page assembly by rendering sections dynamically
 * from configuration, supporting component composition and variant handling.
 */

import React, { ReactNode, ComponentType, Suspense } from 'react';
import { SectionConfig, VisibilityConfig } from '@/types/config';
import { ComponentRegistry } from './componentRegistry';
import { ContentLoader } from './contentLoader';

// Section renderer interface
export interface SectionRenderer {
  render: (section: SectionConfig, context?: RenderContext) => Promise<ReactNode>;
  renderSync: (section: SectionConfig, context?: RenderContext) => ReactNode;
  canRender: (componentName: string) => boolean;
  getComponentProps: (section: SectionConfig, context?: RenderContext) => Promise<Record<string, any>>;
  preload: (sections: SectionConfig[]) => Promise<void>;
}

// Render context interface
export interface RenderContext {
  locale?: string;
  user?: any;
  features?: string[];
  device?: DeviceContext;
  theme?: string;
  preview?: boolean;
  params?: Record<string, string>;
}

// Device context interface
export interface DeviceContext {
  type: 'mobile' | 'tablet' | 'desktop';
  width: number;
  height: number;
  userAgent: string;
}

// Section component interface
export interface SectionComponent {
  component: ComponentType<any>;
  props: Record<string, any>;
  loading?: ReactNode;
  error?: ReactNode;
  fallback?: ReactNode;
}

// Component resolver interface
export interface ComponentResolver {
  resolve: (componentName: string) => Promise<ComponentType<any> | null>;
  resolveSync: (componentName: string) => ComponentType<any> | null;
  preload: (componentNames: string[]) => Promise<void>;
}

// Props processor interface
export interface PropsProcessor {
  process: (props: Record<string, any>, context?: RenderContext) => Promise<Record<string, any>>;
  processSync: (props: Record<string, any>, context?: RenderContext) => Record<string, any>;
}

// Visibility evaluator interface
export interface VisibilityEvaluator {
  evaluate: (visibility: VisibilityConfig, context?: RenderContext) => boolean;
  evaluateConditions: (conditions: any[], context?: RenderContext) => boolean;
  evaluateResponsive: (responsive: any, context?: RenderContext) => boolean;
}

// Section renderer implementation
export class RevivaTechSectionRenderer implements SectionRenderer {
  private componentRegistry: ComponentRegistry;
  private componentResolver: ComponentResolver;
  private propsProcessor: PropsProcessor;
  private visibilityEvaluator: VisibilityEvaluator;
  private contentLoader: ContentLoader;

  constructor(
    componentRegistry: ComponentRegistry,
    componentResolver: ComponentResolver,
    propsProcessor: PropsProcessor,
    visibilityEvaluator: VisibilityEvaluator,
    contentLoader: ContentLoader
  ) {
    this.componentRegistry = componentRegistry;
    this.componentResolver = componentResolver;
    this.propsProcessor = propsProcessor;
    this.visibilityEvaluator = visibilityEvaluator;
    this.contentLoader = contentLoader;
  }

  /**
   * Renders a section asynchronously
   */
  async render(section: SectionConfig, context?: RenderContext): Promise<ReactNode> {
    try {
      // Check visibility
      if (!this.isVisible(section, context)) {
        return null;
      }

      // Resolve component
      const Component = await this.componentResolver.resolve(section.component);
      if (!Component) {
        console.warn(`Component ${section.component} not found`);
        return this.renderFallback(section, context);
      }

      // Process props
      const props = await this.getComponentProps(section, context);

      // Create section component
      const sectionComponent = this.createSectionComponent(Component, props, section, context);

      return sectionComponent;
    } catch (error) {
      console.error(`Error rendering section ${section.id}:`, error);
      return this.renderError(section, error, context);
    }
  }

  /**
   * Renders a section synchronously
   */
  renderSync(section: SectionConfig, context?: RenderContext): ReactNode {
    try {
      // Check visibility
      if (!this.isVisible(section, context)) {
        return null;
      }

      // Resolve component synchronously
      const Component = this.componentResolver.resolveSync(section.component);
      if (!Component) {
        console.warn(`Component ${section.component} not found`);
        return this.renderFallback(section, context);
      }

      // Process props synchronously
      const props = this.propsProcessor.processSync(section.props, context);

      // Create section component
      const sectionComponent = this.createSectionComponent(Component, props, section, context);

      return sectionComponent;
    } catch (error) {
      console.error(`Error rendering section ${section.id}:`, error);
      return this.renderError(section, error, context);
    }
  }

  /**
   * Checks if a component can be rendered
   */
  canRender(componentName: string): boolean {
    return this.componentRegistry.has(componentName);
  }

  /**
   * Gets processed component props
   */
  async getComponentProps(section: SectionConfig, context?: RenderContext): Promise<Record<string, any>> {
    try {
      // Process props with context
      const processedProps = await this.propsProcessor.process(section.props, context);

      // Add section metadata
      const sectionProps = {
        ...processedProps,
        sectionId: section.id,
        sectionComponent: section.component,
        variants: section.variants || [],
        context: context || {}
      };

      return sectionProps;
    } catch (error) {
      console.error(`Error processing props for section ${section.id}:`, error);
      return section.props;
    }
  }

  /**
   * Preloads components for sections
   */
  async preload(sections: SectionConfig[]): Promise<void> {
    const componentNames = sections.map(section => section.component);
    await this.componentResolver.preload(componentNames);
  }

  /**
   * Checks if section is visible
   */
  private isVisible(section: SectionConfig, context?: RenderContext): boolean {
    if (!section.visibility) {
      return true;
    }

    return this.visibilityEvaluator.evaluate(section.visibility, context);
  }

  /**
   * Creates a section component with proper wrapping
   */
  private createSectionComponent(
    Component: ComponentType<any>,
    props: Record<string, any>,
    section: SectionConfig,
    context?: RenderContext
  ): ReactNode {
    const sectionKey = `section-${section.id}`;
    
    // Wrap with error boundary and suspense
    return React.createElement(
      SectionWrapper,
      {
        key: sectionKey,
        sectionId: section.id,
        componentName: section.component,
        context
      },
      React.createElement(Component, props)
    );
  }

  /**
   * Renders fallback content
   */
  private renderFallback(section: SectionConfig, context?: RenderContext): ReactNode {
    return React.createElement(
      'div',
      {
        key: `fallback-${section.id}`,
        className: 'section-fallback p-4 bg-gray-100 rounded',
        'data-section-id': section.id
      },
      React.createElement(
        'p',
        { className: 'text-gray-600' },
        `Component "${section.component}" not found`
      )
    );
  }

  /**
   * Renders error content
   */
  private renderError(section: SectionConfig, error: any, context?: RenderContext): ReactNode {
    return React.createElement(
      'div',
      {
        key: `error-${section.id}`,
        className: 'section-error p-4 bg-red-100 border border-red-300 rounded',
        'data-section-id': section.id
      },
      React.createElement(
        'p',
        { className: 'text-red-600' },
        `Error rendering section "${section.id}": ${error.message}`
      )
    );
  }
}

// Section wrapper component for error handling and suspense
interface SectionWrapperProps {
  sectionId: string;
  componentName: string;
  context?: RenderContext;
  children: ReactNode;
}

const SectionWrapper: React.FC<SectionWrapperProps> = ({
  sectionId,
  componentName,
  context,
  children
}) => {
  return (
    <div
      className="section-wrapper"
      data-section-id={sectionId}
      data-component={componentName}
      data-preview={context?.preview}
    >
      <Suspense fallback={<SectionLoadingFallback sectionId={sectionId} />}>
        <SectionErrorBoundary sectionId={sectionId} componentName={componentName}>
          {children}
        </SectionErrorBoundary>
      </Suspense>
    </div>
  );
};

// Section loading fallback component
const SectionLoadingFallback: React.FC<{ sectionId: string }> = ({ sectionId }) => {
  return (
    <div className="section-loading animate-pulse p-4">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>
  );
};

// Section error boundary component
class SectionErrorBoundary extends React.Component<
  { sectionId: string; componentName: string; children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`Section ${this.props.sectionId} error:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="section-error p-4 bg-red-100 border border-red-300 rounded">
          <p className="text-red-600">
            Error in section "{this.props.sectionId}" ({this.props.componentName})
          </p>
          {process.env.NODE_ENV === 'development' && (
            <pre className="mt-2 text-sm text-red-500">
              {this.state.error?.message}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// Dynamic component resolver implementation
export class DynamicComponentResolver implements ComponentResolver {
  private componentRegistry: ComponentRegistry;
  private loadedComponents: Map<string, ComponentType<any>>;
  private componentPaths: Map<string, string>;

  constructor(componentRegistry: ComponentRegistry) {
    this.componentRegistry = componentRegistry;
    this.loadedComponents = new Map();
    this.componentPaths = new Map();
    
    this.initializeComponentPaths();
  }

  /**
   * Resolves a component asynchronously
   */
  async resolve(componentName: string): Promise<ComponentType<any> | null> {
    try {
      // Check if already loaded
      if (this.loadedComponents.has(componentName)) {
        return this.loadedComponents.get(componentName)!;
      }

      // Check registry first
      if (this.componentRegistry.has(componentName)) {
        const component = this.componentRegistry.get(componentName);
        if (component) {
          this.loadedComponents.set(componentName, component);
          return component;
        }
      }

      // Try dynamic import
      const componentPath = this.componentPaths.get(componentName);
      if (componentPath) {
        const module = await import(componentPath);
        const component = module.default || module[componentName];
        
        if (component) {
          this.loadedComponents.set(componentName, component);
          this.componentRegistry.register(componentName, component);
          return component;
        }
      }

      return null;
    } catch (error) {
      console.error(`Error resolving component ${componentName}:`, error);
      return null;
    }
  }

  /**
   * Resolves a component synchronously
   */
  resolveSync(componentName: string): ComponentType<any> | null {
    // Check loaded components first
    if (this.loadedComponents.has(componentName)) {
      return this.loadedComponents.get(componentName)!;
    }

    // Check registry
    if (this.componentRegistry.has(componentName)) {
      const component = this.componentRegistry.get(componentName);
      if (component) {
        this.loadedComponents.set(componentName, component);
        return component;
      }
    }

    return null;
  }

  /**
   * Preloads components
   */
  async preload(componentNames: string[]): Promise<void> {
    const promises = componentNames.map(name => this.resolve(name));
    await Promise.allSettled(promises);
  }

  /**
   * Initializes component paths for dynamic imports
   */
  private initializeComponentPaths(): void {
    const componentPaths: Record<string, string> = {
      // Section components
      'HeroSection': '@/components/sections/HeroSection',
      'ServicesGrid': '@/components/sections/ServicesGrid',
      'FeatureHighlights': '@/components/sections/FeatureHighlights',
      'TestimonialsCarousel': '@/components/sections/TestimonialsCarousel',
      'ProcessSteps': '@/components/sections/ProcessSteps',
      'CallToAction': '@/components/sections/CallToAction',
      'ServiceDetails': '@/components/sections/ServiceDetails',
      'PricingSection': '@/components/sections/PricingSection',
      'ContentHeader': '@/components/sections/ContentHeader',
      'RichContent': '@/components/sections/RichContent',
      'FormHeader': '@/components/sections/FormHeader',
      'DynamicForm': '@/components/sections/DynamicForm',
      
      // UI components
      'Button': '@/components/ui/Button',
      'Card': '@/components/ui/Card',
      'Input': '@/components/ui/Input',
      'Select': '@/components/ui/Select',
      'Textarea': '@/components/ui/Textarea',
      'Checkbox': '@/components/ui/Checkbox',
      
      // Layout components
      'MainLayout': '@/components/layout/MainLayout',
      'ContentLayout': '@/components/layout/ContentLayout',
      'FormLayout': '@/components/layout/FormLayout'
    };

    Object.entries(componentPaths).forEach(([name, path]) => {
      this.componentPaths.set(name, path);
    });
  }
}

// Props processor implementation
export class RevivaTechPropsProcessor implements PropsProcessor {
  private contentLoader: ContentLoader;

  constructor(contentLoader: ContentLoader) {
    this.contentLoader = contentLoader;
  }

  /**
   * Processes props asynchronously
   */
  async process(props: Record<string, any>, context?: RenderContext): Promise<Record<string, any>> {
    const processedProps = { ...props };

    // Process content references
    await this.processContentReferences(processedProps, context);

    // Process conditional props
    this.processConditionalProps(processedProps, context);

    // Process responsive props
    this.processResponsiveProps(processedProps, context);

    // Process theme props
    this.processThemeProps(processedProps, context);

    return processedProps;
  }

  /**
   * Processes props synchronously
   */
  processSync(props: Record<string, any>, context?: RenderContext): Record<string, any> {
    const processedProps = { ...props };

    // Process conditional props
    this.processConditionalProps(processedProps, context);

    // Process responsive props
    this.processResponsiveProps(processedProps, context);

    // Process theme props
    this.processThemeProps(processedProps, context);

    return processedProps;
  }

  /**
   * Processes content references in props
   */
  private async processContentReferences(props: Record<string, any>, context?: RenderContext): Promise<void> {
    const processValue = async (value: any): Promise<any> => {
      if (typeof value === 'string' && value.startsWith('content:')) {
        const contentKey = value.replace('content:', '');
        const content = await this.contentLoader.load(contentKey, context?.locale);
        return content || value;
      }
      
      if (Array.isArray(value)) {
        return Promise.all(value.map(processValue));
      }
      
      if (value && typeof value === 'object') {
        const processedObj: Record<string, any> = {};
        for (const [key, val] of Object.entries(value)) {
          processedObj[key] = await processValue(val);
        }
        return processedObj;
      }
      
      return value;
    };

    for (const [key, value] of Object.entries(props)) {
      props[key] = await processValue(value);
    }
  }

  /**
   * Processes conditional props
   */
  private processConditionalProps(props: Record<string, any>, context?: RenderContext): void {
    Object.keys(props).forEach(key => {
      if (key.startsWith('if:')) {
        const condition = key.replace('if:', '');
        const conditionMet = this.evaluateCondition(condition, context);
        
        if (conditionMet) {
          const actualKey = Object.keys(props).find(k => k === `then:${condition}`);
          if (actualKey) {
            const newKey = actualKey.replace(`then:${condition}`, condition);
            props[newKey] = props[actualKey];
            delete props[actualKey];
          }
        }
        
        delete props[key];
      }
    });
  }

  /**
   * Processes responsive props
   */
  private processResponsiveProps(props: Record<string, any>, context?: RenderContext): void {
    const deviceType = context?.device?.type || 'desktop';
    
    Object.keys(props).forEach(key => {
      if (key.includes(':')) {
        const [propName, device] = key.split(':');
        if (device === deviceType) {
          props[propName] = props[key];
        }
        delete props[key];
      }
    });
  }

  /**
   * Processes theme props
   */
  private processThemeProps(props: Record<string, any>, context?: RenderContext): void {
    const theme = context?.theme || 'light';
    
    Object.keys(props).forEach(key => {
      if (key.endsWith(`_${theme}`)) {
        const baseName = key.replace(`_${theme}`, '');
        props[baseName] = props[key];
        delete props[key];
      }
    });
  }

  /**
   * Evaluates a condition
   */
  private evaluateCondition(condition: string, context?: RenderContext): boolean {
    // Simple condition evaluation
    if (context?.features?.includes(condition)) {
      return true;
    }
    
    if (condition === 'authenticated' && context?.user) {
      return true;
    }
    
    if (condition === 'preview' && context?.preview) {
      return true;
    }
    
    return false;
  }
}

// Visibility evaluator implementation
export class RevivaTechVisibilityEvaluator implements VisibilityEvaluator {
  /**
   * Evaluates visibility configuration
   */
  evaluate(visibility: VisibilityConfig, context?: RenderContext): boolean {
    // Evaluate conditions
    if (visibility.conditions && !this.evaluateConditions(visibility.conditions, context)) {
      return false;
    }

    // Evaluate responsive visibility
    if (visibility.responsive && !this.evaluateResponsive(visibility.responsive, context)) {
      return false;
    }

    return true;
  }

  /**
   * Evaluates condition array
   */
  evaluateConditions(conditions: any[], context?: RenderContext): boolean {
    return conditions.every(condition => {
      switch (condition.type) {
        case 'feature':
          return this.evaluateFeatureCondition(condition, context);
        case 'user':
          return this.evaluateUserCondition(condition, context);
        case 'time':
          return this.evaluateTimeCondition(condition, context);
        default:
          return true;
      }
    });
  }

  /**
   * Evaluates responsive visibility
   */
  evaluateResponsive(responsive: any, context?: RenderContext): boolean {
    const deviceType = context?.device?.type || 'desktop';
    
    return responsive[deviceType] !== false;
  }

  /**
   * Evaluates feature condition
   */
  private evaluateFeatureCondition(condition: any, context?: RenderContext): boolean {
    const features = context?.features || [];
    
    switch (condition.operator) {
      case 'equals':
        return features.includes(condition.value);
      case 'notEquals':
        return !features.includes(condition.value);
      case 'contains':
        return features.some(feature => feature.includes(condition.value));
      default:
        return true;
    }
  }

  /**
   * Evaluates user condition
   */
  private evaluateUserCondition(condition: any, context?: RenderContext): boolean {
    const user = context?.user;
    
    if (!user) {
      return condition.operator === 'notEquals';
    }
    
    switch (condition.operator) {
      case 'equals':
        return user.role === condition.value;
      case 'notEquals':
        return user.role !== condition.value;
      default:
        return true;
    }
  }

  /**
   * Evaluates time condition
   */
  private evaluateTimeCondition(condition: any, context?: RenderContext): boolean {
    const now = new Date();
    const value = new Date(condition.value);
    
    switch (condition.operator) {
      case 'greaterThan':
        return now > value;
      case 'lessThan':
        return now < value;
      default:
        return true;
    }
  }
}

// Utility functions
export const sectionRendererUtils = {
  /**
   * Creates a section renderer with default configuration
   */
  createRenderer: (
    componentRegistry: ComponentRegistry,
    contentLoader: ContentLoader
  ): SectionRenderer => {
    const componentResolver = new DynamicComponentResolver(componentRegistry);
    const propsProcessor = new RevivaTechPropsProcessor(contentLoader);
    const visibilityEvaluator = new RevivaTechVisibilityEvaluator();

    return new RevivaTechSectionRenderer(
      componentRegistry,
      componentResolver,
      propsProcessor,
      visibilityEvaluator,
      contentLoader
    );
  },

  /**
   * Renders multiple sections
   */
  renderSections: async (
    sections: SectionConfig[],
    renderer: SectionRenderer,
    context?: RenderContext
  ): Promise<ReactNode[]> => {
    const promises = sections.map(section => renderer.render(section, context));
    return Promise.all(promises);
  },

  /**
   * Preloads section components
   */
  preloadSections: async (
    sections: SectionConfig[],
    renderer: SectionRenderer
  ): Promise<void> => {
    await renderer.preload(sections);
  }
};

export default RevivaTechSectionRenderer;