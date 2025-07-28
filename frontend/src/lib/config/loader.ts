import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { 
  AppConfig, 
  ComponentConfig, 
  PageConfig, 
  ServiceConfig, 
  ThemeConfig, 
  ContentConfig,
  EnvironmentConfig,
  FeatureFlag,
  RouteConfig
} from '@/types/config';

export class ConfigLoader {
  private static instance: ConfigLoader;
  private configCache: Map<string, any> = new Map();
  private watchers: Map<string, fs.FSWatcher> = new Map();
  private configPath: string;
  private environment: string;

  private constructor() {
    this.configPath = path.join(process.cwd(), 'config');
    this.environment = process.env.NODE_ENV || 'development';
  }

  static getInstance(): ConfigLoader {
    if (!ConfigLoader.instance) {
      ConfigLoader.instance = new ConfigLoader();
    }
    return ConfigLoader.instance;
  }

  // Load configuration file with caching
  private async loadFile<T>(filePath: string, schema?: z.ZodSchema<T>): Promise<T> {
    const cacheKey = filePath;
    
    // Check cache first
    if (this.configCache.has(cacheKey)) {
      return this.configCache.get(cacheKey);
    }

    try {
      const fullPath = path.join(this.configPath, filePath);
      
      let config: any;
      if (filePath.endsWith('.ts') || filePath.endsWith('.js')) {
        // For TypeScript/JavaScript configs, use dynamic import directly
        config = await import(fullPath);
        config = config.default || config;
      } else {
        // For JSON/YAML files, read and parse
        const fileContent = await fs.promises.readFile(fullPath, 'utf-8');
        if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
          config = yaml.load(fileContent);
        } else if (filePath.endsWith('.json')) {
          config = JSON.parse(fileContent);
        }
      }

      // Validate with schema if provided
      if (schema) {
        config = schema.parse(config);
      }

      // Cache the result
      this.configCache.set(cacheKey, config);

      // Set up file watcher for hot reloading in development
      if (this.environment === 'development') {
        this.setupWatcher(fullPath, cacheKey);
      }

      return config;
    } catch (error) {
      console.error(`Failed to load config from ${filePath}:`, error);
      throw error;
    }
  }

  // Set up file watcher for hot reloading
  private setupWatcher(filePath: string, cacheKey: string): void {
    if (this.watchers.has(filePath)) {
      return;
    }

    const watcher = fs.watch(filePath, async (eventType) => {
      if (eventType === 'change') {
        // Clear cache
        this.configCache.delete(cacheKey);
        
        // Emit event for hot reload
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('config-changed', { 
            detail: { path: filePath } 
          }));
        }
      }
    });

    this.watchers.set(filePath, watcher);
  }

  // Load app configuration
  async loadAppConfig(): Promise<AppConfig> {
    const config = await this.loadFile<AppConfig>('app/app.config.ts');
    return this.resolveReferences(config);
  }

  // Load component configuration
  async loadComponentConfig(componentName: string): Promise<ComponentConfig> {
    const config = await this.loadFile<ComponentConfig>(
      `components/${componentName}/config.ts`
    );
    return this.resolveReferences(config);
  }

  // Load page configuration
  async loadPageConfig(pageName: string): Promise<PageConfig> {
    const config = await this.loadFile<PageConfig>(
      `pages/${pageName}.yaml`
    );
    return this.resolveReferences(config);
  }

  // Load service configuration
  async loadServiceConfig(serviceName: string): Promise<ServiceConfig> {
    const config = await this.loadFile<ServiceConfig>(
      `services/${serviceName}.config.ts`
    );
    return this.resolveReferences(config);
  }

  // Load theme configuration
  async loadThemeConfig(themeName: string = 'nordic'): Promise<ThemeConfig> {
    const config = await this.loadFile<ThemeConfig>(
      `theme/${themeName}.theme.ts`
    );
    return this.resolveReferences(config);
  }

  // Load content configuration
  async loadContentConfig(locale: string, namespace: string): Promise<ContentConfig> {
    const config = await this.loadFile<ContentConfig>(
      `content/${locale}/${namespace}.yaml`
    );
    return this.resolveReferences(config);
  }

  // Load environment configuration
  async loadEnvironmentConfig(): Promise<EnvironmentConfig> {
    const config = await this.loadFile<EnvironmentConfig>(
      `environments/${this.environment}.ts`
    );
    return this.resolveReferences(config);
  }

  // Load feature flags
  async loadFeatureFlags(): Promise<Record<string, FeatureFlag>> {
    const config = await this.loadFile<{ features: Record<string, FeatureFlag> }>(
      'app/features.config.ts'
    );
    return this.resolveReferences(config.features);
  }

  // Load routes configuration
  async loadRoutesConfig(): Promise<RouteConfig[]> {
    const config = await this.loadFile<{ routes: RouteConfig[] }>(
      'app/routes.config.ts'
    );
    return this.resolveReferences(config.routes);
  }

  // Resolve references in configuration
  private resolveReferences<T>(config: T): T {
    if (typeof config !== 'object' || config === null) {
      return config;
    }

    if (Array.isArray(config)) {
      return config.map(item => this.resolveReferences(item)) as any;
    }

    const resolved: any = {};
    for (const [key, value] of Object.entries(config)) {
      if (typeof value === 'string' && value.startsWith('@')) {
        // This is a reference
        resolved[key] = this.resolveReference(value);
      } else if (typeof value === 'string' && value.includes('${') && value.includes('}')) {
        // This contains environment variables
        resolved[key] = this.resolveEnvironmentVariables(value);
      } else if (typeof value === 'object') {
        resolved[key] = this.resolveReferences(value);
      } else {
        resolved[key] = value;
      }
    }

    return resolved;
  }

  // Resolve a single reference
  private resolveReference(reference: string): any {
    const refPath = reference.substring(1); // Remove @ prefix
    const parts = refPath.split('.');
    
    // Handle different reference types
    if (parts[0] === 'content') {
      return this.loadContentValue(parts.slice(1));
    } else if (parts[0] === 'data') {
      return this.loadDataValue(parts.slice(1));
    } else if (parts[0] === 'assets') {
      return this.loadAssetPath(parts.slice(1));
    }
    
    // Default: try to resolve from config cache
    return this.getValueFromPath(parts);
  }

  // Resolve environment variables
  private resolveEnvironmentVariables(value: string): string {
    return value.replace(/\${([^}]+)}/g, (match, varName) => {
      return process.env[varName] || match;
    });
  }

  // Load content value
  private async loadContentValue(path: string[]): Promise<any> {
    // Implementation for loading content values
    // This would connect to your content system
    return `Content: ${path.join('.')}`;
  }

  // Load data value
  private async loadDataValue(path: string[]): Promise<any> {
    // Implementation for loading data values
    // This would connect to your data system
    return `Data: ${path.join('.')}`;
  }

  // Load asset path
  private loadAssetPath(path: string[]): string {
    return `/assets/${path.join('/')}`;
  }

  // Get value from nested path
  private getValueFromPath(path: string[]): any {
    // Implementation to get value from nested configuration
    // This would traverse the configuration tree
    return null;
  }

  // Clear cache
  clearCache(): void {
    this.configCache.clear();
  }

  // Clean up watchers
  cleanup(): void {
    for (const watcher of this.watchers.values()) {
      watcher.close();
    }
    this.watchers.clear();
  }
}

// Export singleton instance
export const configLoader = ConfigLoader.getInstance();