/**
 * Dynamic Page System - Central Export
 * 
 * This file exports all components of the dynamic page system for
 * easy importing and usage throughout the RevivaTech application.
 */

// Page Factory System
export {
  type PageFactory,
  type PageInstance,
  type RenderedSection,
  type ValidationResult,
  type ValidationError,
  type ValidationWarning,
  type ComponentRegistry as PageComponentRegistry,
  type SectionRenderer as PageSectionRenderer,
  RevivaTechPageFactory,
  pageFactoryUtils,
  PageFactoryError,
  ComponentNotFoundError,
  InvalidConfigurationError
} from './pageFactory';

// Dynamic Route Handler
export {
  type DynamicRouteHandler,
  type RouteResolver,
  type RouteResolution,
  type PageGenerator,
  type PageConfigCache,
  NextJSDynamicRouteHandler,
  FileSystemRouteResolver,
  FileSystemConfigLoader,
  MemoryPageConfigCache,
  dynamicRouteUtils
} from './dynamicRouteHandler';

// Page Configuration Loader
export {
  type PageConfigLoader,
  type ValidationResult as ConfigValidationResult,
  type ValidationError as ConfigValidationError,
  type ValidationWarning as ConfigValidationWarning,
  type ConfigSource,
  type ConfigSourceLoader,
  RevivaTechPageConfigLoader,
  configLoaderUtils
} from './pageConfigLoader';

// Section Renderer
export {
  type SectionRenderer,
  type RenderContext,
  type DeviceContext,
  type SectionComponent,
  type ComponentResolver,
  type PropsProcessor,
  type VisibilityEvaluator,
  RevivaTechSectionRenderer,
  DynamicComponentResolver,
  RevivaTechPropsProcessor,
  RevivaTechVisibilityEvaluator,
  sectionRendererUtils
} from './sectionRenderer';

// Component Registry
export {
  type ComponentRegistry,
  type ComponentInfo,
  type ComponentExample,
  RevivaTechComponentRegistry,
  defaultComponentRegistry,
  componentRegistryUtils
} from './componentRegistry';

// Content Loader
export {
  type ContentLoader,
  type ContentSource,
  type ContentCache,
  RevivaTechContentLoader,
  FileContentSource,
  APIContentSource,
  MemoryContentCache,
  contentLoaderUtils
} from './contentLoader';

// Page Metadata System
export {
  type PageMetadataManager,
  type SEOTags,
  type OpenGraphTags,
  type OpenGraphImage,
  type TwitterTags,
  type AlternateTags,
  type AnalyticsPageConfig,
  type AnalyticsEvent,
  type AnalyticsGoal,
  type StructuredData,
  type MetadataValidationResult,
  type MetadataError,
  type MetadataWarning,
  type MetadataSuggestion,
  type SiteMetadataConfig,
  type AnalyticsIntegrationConfig,
  RevivaTechPageMetadataManager,
  metadataUtils
} from './pageMetadata';

// Page Preview System
export {
  type PagePreviewManager,
  type PreviewOptions,
  type ViewportConfig,
  type PagePreview,
  type PreviewMetadata,
  type PerformanceMetrics,
  type AccessibilityMetrics,
  type SEOMetrics,
  type PreviewValidationResult,
  type PreviewStorage,
  type PreviewValidators,
  RevivaTechPagePreviewManager,
  MemoryPreviewStorage,
  DefaultPreviewValidators,
  previewUtils
} from './pagePreview';

// Utility Functions
export const dynamicPageUtils = {
  /**
   * Creates a complete dynamic page system
   */
  createDynamicPageSystem: (options: DynamicPageSystemOptions = {}): DynamicPageSystem => {
    // Import all required components
    const { pageFactoryUtils } = require('./pageFactory');
    const { componentRegistryUtils } = require('./componentRegistry');
    const { contentLoaderUtils } = require('./contentLoader');
    const { configLoaderUtils } = require('./pageConfigLoader');
    const { sectionRendererUtils } = require('./sectionRenderer');
    const { dynamicRouteUtils } = require('./dynamicRouteHandler');
    const { metadataUtils } = require('./pageMetadata');
    const { previewUtils } = require('./pagePreview');

    // Create component registry
    const componentRegistry = componentRegistryUtils.createRegistry();
    
    // Create content loader
    const contentLoader = contentLoaderUtils.createLoader(
      options.contentSources,
      options.contentCache,
      options.defaultLocale
    );

    // Create configuration loader
    const configLoader = configLoaderUtils.createLoader(options.configDirectory);

    // Create section renderer
    const sectionRenderer = sectionRendererUtils.createRenderer(
      componentRegistry,
      contentLoader
    );

    // Create page factory
    const pageFactory = pageFactoryUtils.createDefaultFactory(
      componentRegistry,
      sectionRenderer,
      contentLoader
    );

    // Create dynamic route handler
    const routeHandler = dynamicRouteUtils.createHandler(
      pageFactory,
      options.configPaths || []
    );

    // Create metadata manager
    const metadataManager = options.siteConfig && options.analyticsConfig
      ? metadataUtils.createManager(options.siteConfig, options.analyticsConfig)
      : null;

    // Create preview manager
    const previewManager = previewUtils.createManager(pageFactory);

    return {
      pageFactory,
      componentRegistry,
      contentLoader,
      configLoader,
      sectionRenderer,
      routeHandler,
      metadataManager,
      previewManager
    };
  },

  /**
   * Validates system configuration
   */
  validateSystemConfiguration: (system: DynamicPageSystem): SystemValidationResult => {
    const issues: string[] = [];
    const warnings: string[] = [];

    // Check component registry
    const registeredComponents = system.componentRegistry.list();
    if (registeredComponents.length === 0) {
      issues.push('No components registered in component registry');
    }

    // Check required components
    const requiredComponents = [
      'HeroSection',
      'ServicesGrid',
      'CallToAction',
      'Button',
      'Card',
      'MainLayout'
    ];

    const missing = componentRegistryUtils.validateComponents(
      system.componentRegistry,
      requiredComponents
    );

    if (missing.length > 0) {
      warnings.push(`Missing recommended components: ${missing.join(', ')}`);
    }

    return {
      valid: issues.length === 0,
      issues,
      warnings
    };
  },

  /**
   * Registers all RevivaTech components
   */
  registerRevivaTechComponents: async (registry: ComponentRegistry): Promise<void> => {
    const { componentRegistryUtils } = require('./componentRegistry');
    await componentRegistryUtils.registerRevivaTechComponents(registry);
  },

  /**
   * Creates a test page configuration
   */
  createTestPageConfig: (): PageConfig => {
    return {
      meta: {
        title: 'Test Page',
        description: 'A test page for the dynamic page system',
        keywords: ['test', 'page', 'dynamic'],
        robots: 'noindex,nofollow'
      },
      layout: 'MainLayout',
      sections: [
        {
          id: 'hero',
          component: 'HeroSection',
          props: {
            title: 'Test Hero',
            subtitle: 'This is a test hero section',
            variant: 'primary'
          }
        },
        {
          id: 'content',
          component: 'Card',
          props: {
            title: 'Test Content',
            description: 'This is test content',
            variant: 'default'
          }
        }
      ],
      features: ['seo', 'analytics'],
      auth: {
        required: false
      }
    };
  }
};

// Dynamic page system interface
export interface DynamicPageSystem {
  pageFactory: PageFactory;
  componentRegistry: ComponentRegistry;
  contentLoader: ContentLoader;
  configLoader: PageConfigLoader;
  sectionRenderer: SectionRenderer;
  routeHandler: DynamicRouteHandler;
  metadataManager: PageMetadataManager | null;
  previewManager: PagePreviewManager;
}

// Dynamic page system options interface
export interface DynamicPageSystemOptions {
  contentSources?: ContentSource[];
  contentCache?: ContentCache;
  defaultLocale?: string;
  configDirectory?: string;
  configPaths?: string[];
  siteConfig?: SiteMetadataConfig;
  analyticsConfig?: AnalyticsIntegrationConfig;
}

// System validation result interface
export interface SystemValidationResult {
  valid: boolean;
  issues: string[];
  warnings: string[];
}

// Re-export types from config
export type {
  PageConfig,
  PageMeta,
  SectionConfig,
  VisibilityConfig,
  AuthConfig,
  AnalyticsConfig,
  ComponentConfig,
  PropDefinition,
  SlotDefinition,
  EventDefinition,
  ThemeConfig,
  ContentConfig,
  ContentItem,
  ContentGroup,
  RichText,
  MediaContent,
  FeatureFlag,
  RolloutConfig,
  EnvironmentConfig,
  RouteConfig,
  ConfigReference,
  ValidationSchema
} from '@/types/config';

// Export version information
export const DYNAMIC_PAGE_SYSTEM_VERSION = '1.0.0';
export const SUPPORTED_NEXT_VERSIONS = ['13.x', '14.x', '15.x'];
export const SUPPORTED_REACT_VERSIONS = ['18.x', '19.x'];

// Export feature flags
export const DYNAMIC_PAGE_FEATURES = {
  LIVE_PREVIEW: true,
  HOT_RELOAD: true,
  PERFORMANCE_MONITORING: true,
  ACCESSIBILITY_VALIDATION: true,
  SEO_OPTIMIZATION: true,
  ANALYTICS_INTEGRATION: true,
  CONTENT_VERSIONING: false, // Coming soon
  A_B_TESTING: false, // Coming soon
  VISUAL_EDITOR: false // Coming soon
};

// Export default configuration
export const DEFAULT_DYNAMIC_PAGE_CONFIG: DynamicPageSystemOptions = {
  defaultLocale: 'en',
  configDirectory: 'config/pages',
  configPaths: [
    'config/pages/home.config.ts',
    'config/pages/services.config.ts',
    'config/pages/about.config.ts',
    'config/pages/contact.config.ts'
  ]
};

export default dynamicPageUtils;