import { configLoader } from '@/lib/config/loader';
import { ContentConfig } from '@/types/config';

export interface ContentOptions {
  locale?: string;
  fallbackLocale?: string;
  interpolations?: Record<string, string | number>;
}

export class ContentLoader {
  private static instance: ContentLoader;
  private contentCache: Map<string, ContentConfig> = new Map();
  private defaultLocale = 'en';
  private supportedLocales = ['en', 'pt'];

  private constructor() {}

  static getInstance(): ContentLoader {
    if (!ContentLoader.instance) {
      ContentLoader.instance = new ContentLoader();
    }
    return ContentLoader.instance;
  }

  // Get content by namespace with locale support
  async getContent(namespace: string, options: ContentOptions = {}): Promise<ContentConfig> {
    const {
      locale = this.defaultLocale,
      fallbackLocale = this.defaultLocale,
    } = options;

    const cacheKey = `${locale}:${namespace}`;
    
    // Check cache first
    if (this.contentCache.has(cacheKey)) {
      return this.contentCache.get(cacheKey)!;
    }

    try {
      // Try to load content for the requested locale
      const content = await configLoader.loadContentConfig(locale, namespace);
      this.contentCache.set(cacheKey, content);
      return content;
    } catch (error) {
      // If locale fails and it's not the fallback locale, try fallback
      if (locale !== fallbackLocale) {
        console.warn(`Content not found for ${locale}:${namespace}, falling back to ${fallbackLocale}`);
        try {
          const fallbackContent = await configLoader.loadContentConfig(fallbackLocale, namespace);
          // Cache using the original locale key to avoid repeated fallback attempts
          this.contentCache.set(cacheKey, fallbackContent);
          return fallbackContent;
        } catch (fallbackError) {
          console.error(`Fallback content not found for ${fallbackLocale}:${namespace}`, fallbackError);
        }
      }
      
      // Return empty content structure if everything fails
      return {
        locale,
        namespace,
        content: {}
      };
    }
  }

  // Get specific text content with interpolation support
  async getText(
    namespace: string,
    key: string,
    options: ContentOptions = {}
  ): Promise<string> {
    const content = await this.getContent(namespace, options);
    const text = this.getNestedValue(content.content, key);
    
    if (typeof text !== 'string') {
      console.warn(`Text not found for ${namespace}:${key}`);
      return key; // Return the key as fallback
    }

    // Apply interpolations if provided
    if (options.interpolations) {
      return this.interpolateText(text, options.interpolations);
    }

    return text;
  }

  // Get nested object content
  async getObject(
    namespace: string,
    key: string,
    options: ContentOptions = {}
  ): Promise<any> {
    const content = await this.getContent(namespace, options);
    return this.getNestedValue(content.content, key);
  }

  // Get array content
  async getArray(
    namespace: string,
    key: string,
    options: ContentOptions = {}
  ): Promise<any[]> {
    const content = await this.getContent(namespace, options);
    const value = this.getNestedValue(content.content, key);
    
    if (!Array.isArray(value)) {
      console.warn(`Array not found for ${namespace}:${key}`);
      return [];
    }

    return value;
  }

  // Get localized content for all namespaces
  async getLocalizedContent(locale: string = this.defaultLocale): Promise<Record<string, ContentConfig>> {
    const namespaces = ['common', 'home', 'services', 'booking'];
    const localizedContent: Record<string, ContentConfig> = {};

    await Promise.all(
      namespaces.map(async (namespace) => {
        try {
          localizedContent[namespace] = await this.getContent(namespace, { locale });
        } catch (error) {
          console.error(`Failed to load ${namespace} content for locale ${locale}:`, error);
        }
      })
    );

    return localizedContent;
  }

  // Helper method to get nested values from object using dot notation
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  // Interpolate variables in text
  private interpolateText(text: string, interpolations: Record<string, string | number>): string {
    return text.replace(/\{(\w+)\}/g, (match, key) => {
      return interpolations[key]?.toString() || match;
    });
  }

  // Check if locale is supported
  isLocaleSupported(locale: string): boolean {
    return this.supportedLocales.includes(locale);
  }

  // Get default locale
  getDefaultLocale(): string {
    return this.defaultLocale;
  }

  // Get supported locales
  getSupportedLocales(): string[] {
    return [...this.supportedLocales];
  }

  // Set default locale
  setDefaultLocale(locale: string): void {
    if (this.isLocaleSupported(locale)) {
      this.defaultLocale = locale;
    } else {
      console.warn(`Locale ${locale} is not supported`);
    }
  }

  // Clear content cache
  clearCache(): void {
    this.contentCache.clear();
  }

  // Preload content for a locale
  async preloadLocale(locale: string): Promise<void> {
    const namespaces = ['common', 'home', 'services', 'booking'];
    
    await Promise.all(
      namespaces.map(async (namespace) => {
        try {
          await this.getContent(namespace, { locale });
        } catch (error) {
          console.error(`Failed to preload ${namespace} for locale ${locale}:`, error);
        }
      })
    );
  }
}

// Export singleton instance
export const contentLoader = ContentLoader.getInstance();

// Export convenience functions
export const getContent = (namespace: string, options?: ContentOptions) => 
  contentLoader.getContent(namespace, options);

export const getText = (namespace: string, key: string, options?: ContentOptions) => 
  contentLoader.getText(namespace, key, options);

export const getObject = (namespace: string, key: string, options?: ContentOptions) => 
  contentLoader.getObject(namespace, key, options);

export const getArray = (namespace: string, key: string, options?: ContentOptions) => 
  contentLoader.getArray(namespace, key, options);