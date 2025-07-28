/**
 * Page Configuration Loader
 * 
 * This system loads, parses, and validates page configurations for the
 * dynamic page system, supporting hot reloading and configuration validation.
 */

import { PageConfig, ValidationSchema } from '@/types/config';
import { z } from 'zod';
import { glob } from 'glob';
import { join } from 'path';
import { promises as fs } from 'fs';

// Configuration loader interface
export interface PageConfigLoader {
  load: (path: string) => Promise<PageConfig | null>;
  loadAll: () => Promise<Record<string, PageConfig>>;
  validate: (config: PageConfig) => ValidationResult;
  watch: (callback: (path: string, config: PageConfig | null) => void) => void;
  reload: (path: string) => Promise<PageConfig | null>;
}

// Validation result interface
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  config?: PageConfig;
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

// Configuration source interface
export interface ConfigSource {
  type: 'file' | 'api' | 'database';
  path: string;
  loader: ConfigSourceLoader;
}

export interface ConfigSourceLoader {
  load: (path: string) => Promise<any>;
  exists: (path: string) => Promise<boolean>;
  watch?: (path: string, callback: (content: any) => void) => void;
}

// Zod schema for page configuration validation
const PageMetaSchema = z.object({
  title: z.string().min(1, 'Title is required').max(60, 'Title should be under 60 characters'),
  description: z.string().min(1, 'Description is required').max(160, 'Description should be under 160 characters'),
  keywords: z.array(z.string()).optional(),
  ogImage: z.string().optional(),
  robots: z.string().optional().default('index,follow')
});

const VisibilityConfigSchema = z.object({
  conditions: z.array(z.object({
    type: z.enum(['feature', 'user', 'time', 'custom']),
    operator: z.enum(['equals', 'notEquals', 'contains', 'greaterThan', 'lessThan']),
    value: z.any()
  })).optional(),
  responsive: z.object({
    mobile: z.boolean().optional().default(true),
    tablet: z.boolean().optional().default(true),
    desktop: z.boolean().optional().default(true)
  }).optional()
});

const SectionConfigSchema = z.object({
  id: z.string().min(1, 'Section ID is required'),
  component: z.string().min(1, 'Component name is required'),
  props: z.record(z.any()).default({}),
  visibility: VisibilityConfigSchema.optional(),
  variants: z.array(z.string()).optional()
});

const AuthConfigSchema = z.object({
  required: z.boolean().default(false),
  roles: z.array(z.string()).optional(),
  redirectTo: z.string().optional()
});

const AnalyticsConfigSchema = z.object({
  pageType: z.string(),
  category: z.string(),
  customDimensions: z.record(z.any()).optional()
});

const PageConfigSchema = z.object({
  meta: PageMetaSchema,
  layout: z.string().min(1, 'Layout is required'),
  sections: z.array(SectionConfigSchema).min(1, 'At least one section is required'),
  features: z.array(z.string()).optional().default([]),
  auth: AuthConfigSchema.optional(),
  analytics: AnalyticsConfigSchema.optional()
});

// Page configuration loader implementation
export class RevivaTechPageConfigLoader implements PageConfigLoader {
  private configDirectory: string;
  private configCache: Map<string, { config: PageConfig; timestamp: number }>;
  private watchCallbacks: Map<string, Array<(path: string, config: PageConfig | null) => void>>;
  private sources: Map<string, ConfigSource>;

  constructor(configDirectory: string = 'config/pages') {
    this.configDirectory = configDirectory;
    this.configCache = new Map();
    this.watchCallbacks = new Map();
    this.sources = new Map();
    
    this.initializeDefaultSources();
  }

  /**
   * Loads a page configuration by path
   */
  async load(path: string): Promise<PageConfig | null> {
    try {
      // Check cache first
      const cached = this.configCache.get(path);
      if (cached && this.isCacheValid(cached.timestamp)) {
        return cached.config;
      }

      // Load from source
      const config = await this.loadFromSource(path);
      
      if (!config) {
        return null;
      }

      // Validate configuration
      const validation = this.validate(config);
      if (!validation.valid) {
        console.error(`Invalid configuration for ${path}:`, validation.errors);
        return null;
      }

      // Cache the validated configuration
      this.configCache.set(path, {
        config: validation.config!,
        timestamp: Date.now()
      });

      return validation.config!;
    } catch (error) {
      console.error(`Error loading configuration for ${path}:`, error);
      return null;
    }
  }

  /**
   * Loads all page configurations
   */
  async loadAll(): Promise<Record<string, PageConfig>> {
    const configs: Record<string, PageConfig> = {};
    
    try {
      // Find all configuration files
      const configFiles = await this.findConfigFiles();
      
      // Load each configuration
      for (const filePath of configFiles) {
        const path = this.filePathToPath(filePath);
        const config = await this.load(path);
        
        if (config) {
          configs[path] = config;
        }
      }
    } catch (error) {
      console.error('Error loading all configurations:', error);
    }

    return configs;
  }

  /**
   * Validates a page configuration
   */
  validate(config: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      // Validate with Zod schema
      const validatedConfig = PageConfigSchema.parse(config);
      
      // Additional custom validations
      this.performCustomValidations(validatedConfig, errors, warnings);

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        config: validatedConfig
      };
    } catch (zodError) {
      // Convert Zod errors to our format
      if (zodError instanceof z.ZodError) {
        zodError.errors.forEach(error => {
          errors.push({
            field: error.path.join('.'),
            message: error.message,
            code: error.code,
            severity: 'error'
          });
        });
      } else {
        errors.push({
          field: 'config',
          message: 'Unknown validation error',
          code: 'UNKNOWN_ERROR',
          severity: 'error'
        });
      }

      return {
        valid: false,
        errors,
        warnings
      };
    }
  }

  /**
   * Watches for configuration changes
   */
  watch(callback: (path: string, config: PageConfig | null) => void): void {
    const callbackKey = 'global';
    
    if (!this.watchCallbacks.has(callbackKey)) {
      this.watchCallbacks.set(callbackKey, []);
    }

    this.watchCallbacks.get(callbackKey)!.push(callback);

    // Set up file system watchers in development
    if (process.env.NODE_ENV === 'development') {
      this.setupFileWatchers();
    }
  }

  /**
   * Reloads a specific configuration
   */
  async reload(path: string): Promise<PageConfig | null> {
    // Clear cache
    this.configCache.delete(path);
    
    // Load fresh configuration
    const config = await this.load(path);
    
    // Notify watchers
    this.notifyWatchers(path, config);
    
    return config;
  }

  /**
   * Initializes default configuration sources
   */
  private initializeDefaultSources(): void {
    // File system source
    this.sources.set('file', {
      type: 'file',
      path: this.configDirectory,
      loader: {
        load: async (path: string) => {
          const module = await import(`@/${this.configDirectory}/${path}.config.ts`);
          return module.default || module[Object.keys(module)[0]];
        },
        exists: async (path: string) => {
          try {
            await fs.access(join(process.cwd(), 'src', this.configDirectory, `${path}.config.ts`));
            return true;
          } catch {
            return false;
          }
        },
        watch: (path: string, callback: (content: any) => void) => {
          // Implementation for file watching
          if (process.env.NODE_ENV === 'development') {
            // Set up file system watcher
          }
        }
      }
    });
  }

  /**
   * Loads configuration from source
   */
  private async loadFromSource(path: string): Promise<PageConfig | null> {
    for (const [sourceType, source] of this.sources) {
      try {
        const exists = await source.loader.exists(path);
        if (exists) {
          const config = await source.loader.load(path);
          if (config) {
            return config;
          }
        }
      } catch (error) {
        console.error(`Error loading from ${sourceType} source:`, error);
      }
    }

    return null;
  }

  /**
   * Finds all configuration files
   */
  private async findConfigFiles(): Promise<string[]> {
    try {
      const pattern = join(process.cwd(), 'src', this.configDirectory, '**/*.config.{ts,js}');
      const files = await glob(pattern);
      return files.map(file => file.replace(process.cwd(), ''));
    } catch (error) {
      console.error('Error finding config files:', error);
      return [];
    }
  }

  /**
   * Converts file path to configuration path
   */
  private filePathToPath(filePath: string): string {
    return filePath
      .replace(new RegExp(`^.*${this.configDirectory}/`), '')
      .replace(/\.config\.(ts|js)$/, '')
      .replace(/\/index$/, '');
  }

  /**
   * Performs custom validations beyond Zod schema
   */
  private performCustomValidations(
    config: PageConfig,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Check for duplicate section IDs
    const sectionIds = new Set<string>();
    config.sections.forEach((section, index) => {
      if (sectionIds.has(section.id)) {
        errors.push({
          field: `sections[${index}].id`,
          message: `Duplicate section ID "${section.id}"`,
          code: 'DUPLICATE_SECTION_ID',
          severity: 'error'
        });
      }
      sectionIds.add(section.id);
    });

    // Validate component names (should be registered components)
    const validComponents = this.getValidComponents();
    config.sections.forEach((section, index) => {
      if (!validComponents.includes(section.component)) {
        warnings.push({
          field: `sections[${index}].component`,
          message: `Component "${section.component}" may not be registered`,
          code: 'UNKNOWN_COMPONENT',
          suggestion: `Available components: ${validComponents.join(', ')}`
        });
      }
    });

    // Validate feature flags
    const validFeatures = ['seo', 'analytics', 'performance', 'accessibility', 'auth', 'i18n', 'realtime'];
    config.features?.forEach((feature, index) => {
      if (!validFeatures.includes(feature)) {
        warnings.push({
          field: `features[${index}]`,
          message: `Unknown feature "${feature}"`,
          code: 'UNKNOWN_FEATURE',
          suggestion: `Available features: ${validFeatures.join(', ')}`
        });
      }
    });

    // SEO validations
    if (config.meta.title.length > 60) {
      warnings.push({
        field: 'meta.title',
        message: 'Title is longer than recommended (60 characters)',
        code: 'LONG_TITLE',
        suggestion: 'Consider shortening for better SEO'
      });
    }

    if (config.meta.description.length > 160) {
      warnings.push({
        field: 'meta.description',
        message: 'Description is longer than recommended (160 characters)',
        code: 'LONG_DESCRIPTION',
        suggestion: 'Consider shortening for better SEO'
      });
    }

    // Accessibility validations
    if (config.features?.includes('accessibility')) {
      config.sections.forEach((section, index) => {
        if (section.component === 'Image' && !section.props.alt) {
          warnings.push({
            field: `sections[${index}].props.alt`,
            message: 'Images should have alt text for accessibility',
            code: 'MISSING_ALT_TEXT',
            suggestion: 'Add alt text to improve accessibility'
          });
        }
      });
    }
  }

  /**
   * Gets list of valid/registered components
   */
  private getValidComponents(): string[] {
    // This should be populated from your component registry
    return [
      'HeroSection',
      'ServicesGrid',
      'FeatureHighlights',
      'TestimonialsCarousel',
      'ProcessSteps',
      'CallToAction',
      'ContentHeader',
      'RichContent',
      'DynamicForm',
      'FormHeader',
      'ServiceDetails',
      'PricingSection'
    ];
  }

  /**
   * Checks if cache is valid
   */
  private isCacheValid(timestamp: number): boolean {
    const maxAge = process.env.NODE_ENV === 'development' ? 1000 : 60000; // 1s in dev, 1m in prod
    return Date.now() - timestamp < maxAge;
  }

  /**
   * Sets up file system watchers
   */
  private setupFileWatchers(): void {
    // Implementation for file system watching
    // This would use chokidar or native file system watchers
    if (typeof window === 'undefined') { // Node.js environment
      // Set up file watchers for config directory
    }
  }

  /**
   * Notifies all watchers of configuration changes
   */
  private notifyWatchers(path: string, config: PageConfig | null): void {
    this.watchCallbacks.forEach(callbacks => {
      callbacks.forEach(callback => {
        try {
          callback(path, config);
        } catch (error) {
          console.error('Error in watcher callback:', error);
        }
      });
    });
  }
}

// Configuration loader utilities
export const configLoaderUtils = {
  /**
   * Creates a page configuration loader with default settings
   */
  createLoader: (configDirectory?: string): PageConfigLoader => {
    return new RevivaTechPageConfigLoader(configDirectory);
  },

  /**
   * Validates multiple configurations
   */
  validateConfigurations: (
    configs: Record<string, any>,
    loader: PageConfigLoader
  ): Record<string, ValidationResult> => {
    const results: Record<string, ValidationResult> = {};
    
    Object.entries(configs).forEach(([path, config]) => {
      results[path] = loader.validate(config);
    });

    return results;
  },

  /**
   * Generates configuration schema documentation
   */
  generateSchema: (): any => {
    // This would generate JSON schema from Zod schema
    return {
      type: 'object',
      properties: {
        meta: {
          type: 'object',
          properties: {
            title: { type: 'string', maxLength: 60 },
            description: { type: 'string', maxLength: 160 },
            keywords: { type: 'array', items: { type: 'string' } },
            ogImage: { type: 'string' },
            robots: { type: 'string', default: 'index,follow' }
          },
          required: ['title', 'description']
        },
        layout: { type: 'string' },
        sections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              component: { type: 'string' },
              props: { type: 'object' },
              visibility: { type: 'object' },
              variants: { type: 'array', items: { type: 'string' } }
            },
            required: ['id', 'component']
          }
        },
        features: { type: 'array', items: { type: 'string' } },
        auth: { type: 'object' },
        analytics: { type: 'object' }
      },
      required: ['meta', 'layout', 'sections']
    };
  },

  /**
   * Creates a configuration template
   */
  createTemplate: (pageType: string): Partial<PageConfig> => {
    const templates: Record<string, Partial<PageConfig>> = {
      landing: {
        meta: {
          title: 'Page Title',
          description: 'Page description for SEO',
          keywords: ['keyword1', 'keyword2'],
          robots: 'index,follow'
        },
        layout: 'MainLayout',
        sections: [
          {
            id: 'hero',
            component: 'HeroSection',
            props: {
              variant: 'primary',
              title: 'Hero Title',
              subtitle: 'Hero Subtitle'
            }
          }
        ],
        features: ['seo', 'analytics', 'performance'],
        auth: { required: false }
      },
      service: {
        meta: {
          title: 'Service Page Title',
          description: 'Service page description',
          keywords: ['service', 'repair'],
          robots: 'index,follow'
        },
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
          }
        ],
        features: ['seo', 'analytics', 'performance']
      }
    };

    return templates[pageType] || templates.landing;
  }
};

export default RevivaTechPageConfigLoader;