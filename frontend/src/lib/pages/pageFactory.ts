/**
 * Page Factory System for Dynamic Page Creation
 * 
 * This system enables the creation of pages dynamically from configuration files,
 * supporting the configuration-driven architecture of RevivaTech.
 */

import { PageConfig, SectionConfig, PageMeta } from '@/types/config';
import { ReactNode } from 'react';

// Page factory interface
export interface PageFactory {
  createPage: (config: PageConfig) => Promise<PageInstance>;
  validateConfig: (config: PageConfig) => ValidationResult;
  getPageMeta: (config: PageConfig) => PageMeta;
  renderSection: (section: SectionConfig) => Promise<ReactNode>;
}

// Page instance interface
export interface PageInstance {
  meta: PageMeta;
  layout: string;
  sections: RenderedSection[];
  features: string[];
  auth: {
    required: boolean;
    roles?: string[];
    redirectTo?: string;
  };
  analytics?: {
    pageType: string;
    category: string;
    customDimensions?: Record<string, any>;
  };
}

// Rendered section interface
export interface RenderedSection {
  id: string;
  component: string;
  element: ReactNode;
  props: Record<string, any>;
  visibility: {
    conditions: boolean;
    responsive: {
      mobile: boolean;
      tablet: boolean;
      desktop: boolean;
    };
  };
}

// Validation result interface
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
  suggestion?: string;
}

// Component registry interface
export interface ComponentRegistry {
  register: (name: string, component: React.ComponentType<any>) => void;
  get: (name: string) => React.ComponentType<any> | null;
  has: (name: string) => boolean;
  list: () => string[];
}

// Section renderer interface
export interface SectionRenderer {
  render: (section: SectionConfig) => Promise<ReactNode>;
  canRender: (componentName: string) => boolean;
  getComponentProps: (section: SectionConfig) => Record<string, any>;
}

// Page factory implementation
export class RevivaTechPageFactory implements PageFactory {
  private componentRegistry: ComponentRegistry;
  private sectionRenderer: SectionRenderer;
  private contentLoader: ContentLoader;

  constructor(
    componentRegistry: ComponentRegistry,
    sectionRenderer: SectionRenderer,
    contentLoader: ContentLoader
  ) {
    this.componentRegistry = componentRegistry;
    this.sectionRenderer = sectionRenderer;
    this.contentLoader = contentLoader;
  }

  /**
   * Creates a page instance from configuration
   */
  async createPage(config: PageConfig): Promise<PageInstance> {
    // Validate configuration
    const validation = this.validateConfig(config);
    if (!validation.valid) {
      throw new Error(`Invalid page configuration: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    // Process sections
    const sections = await this.processSections(config.sections);

    // Create page instance
    const pageInstance: PageInstance = {
      meta: config.meta,
      layout: config.layout,
      sections,
      features: config.features || [],
      auth: config.auth || { required: false },
      analytics: config.analytics
    };

    return pageInstance;
  }

  /**
   * Validates page configuration
   */
  validateConfig(config: PageConfig): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate required fields
    if (!config.meta) {
      errors.push({
        field: 'meta',
        message: 'Page meta information is required',
        code: 'MISSING_META',
        severity: 'error'
      });
    }

    if (!config.layout) {
      errors.push({
        field: 'layout',
        message: 'Page layout is required',
        code: 'MISSING_LAYOUT',
        severity: 'error'
      });
    }

    if (!config.sections || config.sections.length === 0) {
      errors.push({
        field: 'sections',
        message: 'At least one section is required',
        code: 'MISSING_SECTIONS',
        severity: 'error'
      });
    }

    // Validate meta information
    if (config.meta) {
      if (!config.meta.title) {
        errors.push({
          field: 'meta.title',
          message: 'Page title is required',
          code: 'MISSING_TITLE',
          severity: 'error'
        });
      }

      if (!config.meta.description) {
        errors.push({
          field: 'meta.description',
          message: 'Page description is required',
          code: 'MISSING_DESCRIPTION',
          severity: 'error'
        });
      }

      if (config.meta.title && config.meta.title.length > 60) {
        warnings.push({
          field: 'meta.title',
          message: 'Page title is longer than recommended (60 characters)',
          code: 'LONG_TITLE',
          suggestion: 'Consider shortening the title for better SEO'
        });
      }

      if (config.meta.description && config.meta.description.length > 160) {
        warnings.push({
          field: 'meta.description',
          message: 'Page description is longer than recommended (160 characters)',
          code: 'LONG_DESCRIPTION',
          suggestion: 'Consider shortening the description for better SEO'
        });
      }
    }

    // Validate sections
    if (config.sections) {
      config.sections.forEach((section, index) => {
        if (!section.id) {
          errors.push({
            field: `sections[${index}].id`,
            message: 'Section ID is required',
            code: 'MISSING_SECTION_ID',
            severity: 'error'
          });
        }

        if (!section.component) {
          errors.push({
            field: `sections[${index}].component`,
            message: 'Section component is required',
            code: 'MISSING_SECTION_COMPONENT',
            severity: 'error'
          });
        }

        if (section.component && !this.componentRegistry.has(section.component)) {
          errors.push({
            field: `sections[${index}].component`,
            message: `Component "${section.component}" is not registered`,
            code: 'UNREGISTERED_COMPONENT',
            severity: 'error'
          });
        }

        // Check for duplicate section IDs
        const duplicateIds = config.sections.filter(s => s.id === section.id);
        if (duplicateIds.length > 1) {
          errors.push({
            field: `sections[${index}].id`,
            message: `Duplicate section ID "${section.id}"`,
            code: 'DUPLICATE_SECTION_ID',
            severity: 'error'
          });
        }
      });
    }

    // Validate features
    if (config.features) {
      const validFeatures = ['seo', 'analytics', 'performance', 'accessibility', 'auth', 'i18n'];
      config.features.forEach(feature => {
        if (!validFeatures.includes(feature)) {
          warnings.push({
            field: 'features',
            message: `Unknown feature "${feature}"`,
            code: 'UNKNOWN_FEATURE',
            suggestion: `Available features: ${validFeatures.join(', ')}`
          });
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Extracts page metadata from configuration
   */
  getPageMeta(config: PageConfig): PageMeta {
    return {
      title: config.meta.title,
      description: config.meta.description,
      keywords: config.meta.keywords || [],
      ogImage: config.meta.ogImage,
      robots: config.meta.robots || 'index,follow'
    };
  }

  /**
   * Renders a single section
   */
  async renderSection(section: SectionConfig): Promise<ReactNode> {
    return this.sectionRenderer.render(section);
  }

  /**
   * Processes all sections in the configuration
   */
  private async processSections(sections: SectionConfig[]): Promise<RenderedSection[]> {
    const processedSections: RenderedSection[] = [];

    for (const section of sections) {
      try {
        const element = await this.renderSection(section);
        const visibility = this.evaluateVisibility(section);

        processedSections.push({
          id: section.id,
          component: section.component,
          element,
          props: section.props,
          visibility
        });
      } catch (error) {
        console.error(`Error rendering section ${section.id}:`, error);
        throw new Error(`Failed to render section ${section.id}: ${error.message}`);
      }
    }

    return processedSections;
  }

  /**
   * Evaluates section visibility based on conditions
   */
  private evaluateVisibility(section: SectionConfig): RenderedSection['visibility'] {
    const defaultVisibility = {
      conditions: true,
      responsive: {
        mobile: true,
        tablet: true,
        desktop: true
      }
    };

    if (!section.visibility) {
      return defaultVisibility;
    }

    // Evaluate conditions
    let conditionsResult = true;
    if (section.visibility.conditions) {
      // TODO: Implement condition evaluation based on feature flags, user roles, etc.
      conditionsResult = true;
    }

    // Get responsive visibility
    const responsive = {
      mobile: section.visibility.responsive?.mobile ?? true,
      tablet: section.visibility.responsive?.tablet ?? true,
      desktop: section.visibility.responsive?.desktop ?? true
    };

    return {
      conditions: conditionsResult,
      responsive
    };
  }
}

// Content loader interface
export interface ContentLoader {
  load: (key: string) => Promise<string | null>;
  loadNamespace: (namespace: string) => Promise<Record<string, any>>;
}

// Error types
export class PageFactoryError extends Error {
  constructor(message: string, public code: string, public field?: string) {
    super(message);
    this.name = 'PageFactoryError';
  }
}

export class ComponentNotFoundError extends PageFactoryError {
  constructor(componentName: string) {
    super(`Component "${componentName}" not found in registry`, 'COMPONENT_NOT_FOUND');
  }
}

export class InvalidConfigurationError extends PageFactoryError {
  constructor(message: string, field?: string) {
    super(message, 'INVALID_CONFIGURATION', field);
  }
}

// Factory utilities
export const pageFactoryUtils = {
  /**
   * Creates a page factory instance with default configuration
   */
  createDefaultFactory: (
    componentRegistry: ComponentRegistry,
    sectionRenderer: SectionRenderer,
    contentLoader: ContentLoader
  ): PageFactory => {
    return new RevivaTechPageFactory(componentRegistry, sectionRenderer, contentLoader);
  },

  /**
   * Validates multiple page configurations
   */
  validateConfigs: (configs: PageConfig[], factory: PageFactory): ValidationResult => {
    const allErrors: ValidationError[] = [];
    const allWarnings: ValidationWarning[] = [];

    configs.forEach((config, index) => {
      const result = factory.validateConfig(config);
      
      // Add context to errors and warnings
      result.errors.forEach(error => {
        allErrors.push({
          ...error,
          field: `config[${index}].${error.field}`
        });
      });

      result.warnings.forEach(warning => {
        allWarnings.push({
          ...warning,
          field: `config[${index}].${warning.field}`
        });
      });
    });

    return {
      valid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings
    };
  },

  /**
   * Extracts all unique components used in configurations
   */
  extractComponents: (configs: PageConfig[]): string[] => {
    const components = new Set<string>();
    
    configs.forEach(config => {
      config.sections.forEach(section => {
        components.add(section.component);
      });
    });

    return Array.from(components);
  },

  /**
   * Generates a page configuration template
   */
  createTemplate: (pageType: 'landing' | 'service' | 'content' | 'form'): Partial<PageConfig> => {
    const templates: Record<string, Partial<PageConfig>> = {
      landing: {
        layout: 'MainLayout',
        sections: [
          {
            id: 'hero',
            component: 'HeroSection',
            props: { variant: 'primary' }
          },
          {
            id: 'features',
            component: 'FeatureHighlights',
            props: { variant: 'grid' }
          },
          {
            id: 'cta',
            component: 'CallToAction',
            props: { variant: 'primary' }
          }
        ],
        features: ['seo', 'analytics', 'performance']
      },
      service: {
        layout: 'MainLayout',
        sections: [
          {
            id: 'hero',
            component: 'HeroSection',
            props: { variant: 'service' }
          },
          {
            id: 'details',
            component: 'ServiceDetails',
            props: { variant: 'detailed' }
          },
          {
            id: 'pricing',
            component: 'PricingSection',
            props: { variant: 'simple' }
          }
        ],
        features: ['seo', 'analytics', 'performance']
      },
      content: {
        layout: 'ContentLayout',
        sections: [
          {
            id: 'header',
            component: 'ContentHeader',
            props: { variant: 'default' }
          },
          {
            id: 'content',
            component: 'RichContent',
            props: { variant: 'article' }
          }
        ],
        features: ['seo', 'analytics']
      },
      form: {
        layout: 'FormLayout',
        sections: [
          {
            id: 'header',
            component: 'FormHeader',
            props: { variant: 'default' }
          },
          {
            id: 'form',
            component: 'DynamicForm',
            props: { variant: 'default' }
          }
        ],
        features: ['analytics', 'accessibility']
      }
    };

    return templates[pageType] || templates.landing;
  }
};

export default RevivaTechPageFactory;