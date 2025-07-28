'use client';

// Dynamic page rendering system for RevivaTech
import React from 'react';
import { PageConfig, SectionConfig } from '@/types/config';
import { ComponentRegistry } from '@/lib/components/registry';
import { ContentLoader } from '@/lib/content/loader';

// Types for page rendering
export interface PageRendererProps {
  config: PageConfig;
  locale?: string;
  data?: Record<string, any>;
  debug?: boolean;
}

export interface SectionRendererProps {
  section: SectionConfig;
  locale?: string;
  data?: Record<string, any>;
  debug?: boolean;
}

// Page renderer component
export const PageRenderer: React.FC<PageRendererProps> = ({
  config,
  locale = 'en',
  data = {},
  debug = false,
}) => {
  const contentLoader = ContentLoader.getInstance();
  
  // Load content for the page
  const content = React.useMemo(() => {
    return contentLoader.getContent('pages', { locale });
  }, [locale]);

  // Check visibility conditions
  const isVisible = (section: SectionConfig): boolean => {
    if (!section.visibility) return true;
    
    // Check responsive visibility
    if (section.visibility.responsive) {
      // For SSR, we assume desktop by default
      // Client-side hydration will handle responsive visibility
      return section.visibility.responsive.desktop !== false;
    }
    
    // Check feature flags and other conditions
    if (section.visibility.conditions) {
      return section.visibility.conditions.every(condition => {
        switch (condition.type) {
          case 'feature':
            // Check if feature is enabled (would need feature flag system)
            return true; // Default to true for now
          case 'user':
            // Check user conditions (would need auth context)
            return true; // Default to true for now
          case 'time':
            // Check time-based conditions
            return true; // Default to true for now
          default:
            return true;
        }
      });
    }
    
    return true;
  };

  // Filter visible sections
  const visibleSections = config.sections.filter(isVisible);

  if (debug) {
    console.log('PageRenderer Debug:', {
      config,
      locale,
      content,
      visibleSections: visibleSections.length,
    });
  }

  return (
    <div className="page-renderer" data-page={config.meta.title}>
      {visibleSections.map((section, index) => (
        <SectionRenderer
          key={section.id}
          section={section}
          locale={locale}
          data={{ ...data, content }}
          debug={debug}
        />
      ))}
    </div>
  );
};

// Section renderer component
export const SectionRenderer: React.FC<SectionRendererProps> = ({
  section,
  locale = 'en',
  data = {},
  debug = false,
}) => {
  const registry = ComponentRegistry.getInstance();
  
  // Get component from registry
  const Component = registry.getComponent(section.component);
  
  if (!Component) {
    if (debug || process.env.NODE_ENV === 'development') {
      console.warn(`Component "${section.component}" not found in registry`);
      return (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Component Error:</strong> Component "{section.component}" not found
        </div>
      );
    }
    return null;
  }

  // Resolve props with content references
  const resolvedProps = resolveProps(section.props, data, locale);

  if (debug) {
    console.log('SectionRenderer Debug:', {
      sectionId: section.id,
      component: section.component,
      originalProps: section.props,
      resolvedProps,
    });
  }

  return (
    <section
      id={section.id}
      className="page-section"
      data-component={section.component}
    >
      <Component {...resolvedProps} />
    </section>
  );
};

// Utility to resolve props with content references
const resolveProps = (
  props: Record<string, any>,
  data: Record<string, any>,
  locale: string
): Record<string, any> => {
  const resolved: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(props)) {
    resolved[key] = resolveValue(value, data, locale);
  }
  
  return resolved;
};

// Recursively resolve values
const resolveValue = (
  value: any,
  data: Record<string, any>,
  locale: string
): any => {
  if (typeof value === 'string') {
    // Check if it's a content reference (starts with content key pattern)
    if (value.includes('.') && data.content) {
      const contentValue = getNestedValue(data.content, value);
      return contentValue !== undefined ? contentValue : value;
    }
    return value;
  }
  
  if (Array.isArray(value)) {
    return value.map(item => resolveValue(item, data, locale));
  }
  
  if (typeof value === 'object' && value !== null) {
    const resolved: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      resolved[k] = resolveValue(v, data, locale);
    }
    return resolved;
  }
  
  return value;
};

// Get nested value from object using dot notation
const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
};

// Hook for page metadata
export const usePageMeta = (config: PageConfig) => {
  React.useEffect(() => {
    // Set document title
    if (config.meta.title) {
      document.title = config.meta.title;
    }
    
    // Set meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription && config.meta.description) {
      metaDescription.setAttribute('content', config.meta.description);
    }
    
    // Set other meta tags
    if (config.meta.keywords) {
      const metaKeywords = document.querySelector('meta[name="keywords"]');
      if (metaKeywords) {
        metaKeywords.setAttribute('content', config.meta.keywords.join(', '));
      }
    }
    
    // Set robots meta
    if (config.meta.robots) {
      const metaRobots = document.querySelector('meta[name="robots"]');
      if (metaRobots) {
        metaRobots.setAttribute('content', config.meta.robots);
      }
    }
  }, [config.meta]);
};

// Higher-order component for page configuration
export interface WithPageConfigProps {
  pageConfig: PageConfig;
  locale?: string;
  debug?: boolean;
}

export const withPageConfig = <P extends Record<string, any>>(
  Component: React.ComponentType<P>
) => {
  const WrappedComponent: React.FC<P & WithPageConfigProps> = ({
    pageConfig,
    locale = 'en',
    debug = false,
    ...props
  }) => {
    // Apply page metadata
    usePageMeta(pageConfig);
    
    return (
      <div className="page-wrapper" data-page={pageConfig.meta.title}>
        <PageRenderer
          config={pageConfig}
          locale={locale}
          debug={debug}
        />
        <Component {...(props as unknown as P)} />
      </div>
    );
  };
  
  WrappedComponent.displayName = `withPageConfig(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// Page factory for creating pages from configuration
export const createPage = (config: PageConfig) => {
  const PageComponent: React.FC<{
    locale?: string;
    data?: Record<string, any>;
    debug?: boolean;
  }> = ({ locale = 'en', data = {}, debug = false }) => {
    usePageMeta(config);
    
    return (
      <PageRenderer
        config={config}
        locale={locale}
        data={data}
        debug={debug}
      />
    );
  };
  
  PageComponent.displayName = `Page(${config.meta.title})`;
  
  return PageComponent;
};

// Export utilities
export { resolveProps, resolveValue, getNestedValue };