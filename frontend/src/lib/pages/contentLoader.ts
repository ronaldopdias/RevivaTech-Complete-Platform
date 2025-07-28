/**
 * Content Loader for Dynamic Page System
 * 
 * This system loads and manages content for the dynamic page factory,
 * supporting multi-language content and content management systems.
 */

import { ContentConfig, ContentItem, ContentGroup, RichText, MediaContent } from '@/types/config';

// Content loader interface
export interface ContentLoader {
  load: (key: string, locale?: string) => Promise<string | null>;
  loadNamespace: (namespace: string, locale?: string) => Promise<Record<string, any>>;
  loadAll: (locale?: string) => Promise<Record<string, any>>;
  reload: (key: string, locale?: string) => Promise<void>;
  preload: (keys: string[], locale?: string) => Promise<void>;
  setLocale: (locale: string) => void;
  getLocale: () => string;
}

// Content source interface
export interface ContentSource {
  type: 'file' | 'api' | 'cms';
  load: (key: string, locale?: string) => Promise<any>;
  loadNamespace: (namespace: string, locale?: string) => Promise<Record<string, any>>;
  exists: (key: string, locale?: string) => Promise<boolean>;
}

// Content cache interface
export interface ContentCache {
  get: (key: string, locale?: string) => Promise<any>;
  set: (key: string, content: any, locale?: string, ttl?: number) => Promise<void>;
  invalidate: (key: string, locale?: string) => Promise<void>;
  clear: (locale?: string) => Promise<void>;
}

// Content loader implementation
export class RevivaTechContentLoader implements ContentLoader {
  private currentLocale: string;
  private sources: ContentSource[];
  private cache: ContentCache;
  private fallbackLocale: string;

  constructor(
    sources: ContentSource[],
    cache: ContentCache,
    defaultLocale: string = 'en',
    fallbackLocale: string = 'en'
  ) {
    this.sources = sources;
    this.cache = cache;
    this.currentLocale = defaultLocale;
    this.fallbackLocale = fallbackLocale;
  }

  /**
   * Loads content by key
   */
  async load(key: string, locale?: string): Promise<string | null> {
    const targetLocale = locale || this.currentLocale;
    
    try {
      // Check cache first
      const cached = await this.cache.get(key, targetLocale);
      if (cached !== null) {
        return this.processContent(cached);
      }

      // Load from sources
      const content = await this.loadFromSources(key, targetLocale);
      
      if (content !== null) {
        // Cache the content
        await this.cache.set(key, content, targetLocale);
        return this.processContent(content);
      }

      // Try fallback locale if different
      if (targetLocale !== this.fallbackLocale) {
        const fallbackContent = await this.load(key, this.fallbackLocale);
        if (fallbackContent !== null) {
          return fallbackContent;
        }
      }

      return null;
    } catch (error) {
      console.error(`Error loading content for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Loads entire namespace
   */
  async loadNamespace(namespace: string, locale?: string): Promise<Record<string, any>> {
    const targetLocale = locale || this.currentLocale;
    
    try {
      // Check cache first
      const cached = await this.cache.get(`namespace:${namespace}`, targetLocale);
      if (cached) {
        return cached;
      }

      // Load from sources
      const content = await this.loadNamespaceFromSources(namespace, targetLocale);
      
      if (content) {
        // Cache the content
        await this.cache.set(`namespace:${namespace}`, content, targetLocale);
        return content;
      }

      // Try fallback locale if different
      if (targetLocale !== this.fallbackLocale) {
        const fallbackContent = await this.loadNamespace(namespace, this.fallbackLocale);
        if (fallbackContent) {
          return fallbackContent;
        }
      }

      return {};
    } catch (error) {
      console.error(`Error loading namespace ${namespace}:`, error);
      return {};
    }
  }

  /**
   * Loads all content for a locale
   */
  async loadAll(locale?: string): Promise<Record<string, any>> {
    const targetLocale = locale || this.currentLocale;
    
    try {
      const allContent: Record<string, any> = {};
      
      // Load from all sources
      for (const source of this.sources) {
        try {
          const sourceContent = await source.loadNamespace('', targetLocale);
          Object.assign(allContent, sourceContent);
        } catch (error) {
          console.warn(`Error loading from source ${source.type}:`, error);
        }
      }

      return allContent;
    } catch (error) {
      console.error(`Error loading all content:`, error);
      return {};
    }
  }

  /**
   * Reloads specific content
   */
  async reload(key: string, locale?: string): Promise<void> {
    const targetLocale = locale || this.currentLocale;
    
    try {
      // Invalidate cache
      await this.cache.invalidate(key, targetLocale);
      
      // Load fresh content
      await this.load(key, targetLocale);
    } catch (error) {
      console.error(`Error reloading content for key ${key}:`, error);
    }
  }

  /**
   * Preloads multiple content keys
   */
  async preload(keys: string[], locale?: string): Promise<void> {
    const targetLocale = locale || this.currentLocale;
    
    try {
      const promises = keys.map(key => this.load(key, targetLocale));
      await Promise.all(promises);
    } catch (error) {
      console.error('Error preloading content:', error);
    }
  }

  /**
   * Sets current locale
   */
  setLocale(locale: string): void {
    this.currentLocale = locale;
  }

  /**
   * Gets current locale
   */
  getLocale(): string {
    return this.currentLocale;
  }

  /**
   * Loads content from sources
   */
  private async loadFromSources(key: string, locale: string): Promise<any> {
    for (const source of this.sources) {
      try {
        const exists = await source.exists(key, locale);
        if (exists) {
          const content = await source.load(key, locale);
          if (content !== null) {
            return content;
          }
        }
      } catch (error) {
        console.warn(`Error loading from source ${source.type}:`, error);
      }
    }
    
    return null;
  }

  /**
   * Loads namespace from sources
   */
  private async loadNamespaceFromSources(namespace: string, locale: string): Promise<Record<string, any> | null> {
    for (const source of this.sources) {
      try {
        const content = await source.loadNamespace(namespace, locale);
        if (content && Object.keys(content).length > 0) {
          return content;
        }
      } catch (error) {
        console.warn(`Error loading namespace from source ${source.type}:`, error);
      }
    }
    
    return null;
  }

  /**
   * Processes content based on type
   */
  private processContent(content: any): string {
    if (typeof content === 'string') {
      return content;
    }
    
    if (content && typeof content === 'object') {
      if (content.type === 'richtext') {
        return this.processRichText(content as RichText);
      }
      
      if (content.type === 'image' || content.type === 'video') {
        return this.processMediaContent(content as MediaContent);
      }
    }
    
    return String(content);
  }

  /**
   * Processes rich text content
   */
  private processRichText(richText: RichText): string {
    if (richText.format === 'markdown') {
      // Process markdown (would integrate with markdown processor)
      return richText.content;
    }
    
    if (richText.format === 'html') {
      // Process HTML (would sanitize and process)
      return richText.content;
    }
    
    return richText.content;
  }

  /**
   * Processes media content
   */
  private processMediaContent(media: MediaContent): string {
    // Return appropriate representation for media
    if (media.type === 'image') {
      return media.alt || media.caption || media.src;
    }
    
    if (media.type === 'video') {
      return media.caption || media.src;
    }
    
    return media.src;
  }
}

// File content source implementation
export class FileContentSource implements ContentSource {
  type: 'file' = 'file';
  private basePath: string;

  constructor(basePath: string = 'config/content') {
    this.basePath = basePath;
  }

  /**
   * Loads content from file
   */
  async load(key: string, locale: string = 'en'): Promise<any> {
    try {
      const module = await import(`@/${this.basePath}/${locale}/${this.getFilePath(key)}`);
      return this.getValueFromModule(module, key);
    } catch (error) {
      console.warn(`Error loading file content for ${key}:`, error);
      return null;
    }
  }

  /**
   * Loads namespace from file
   */
  async loadNamespace(namespace: string, locale: string = 'en'): Promise<Record<string, any>> {
    try {
      const fileName = namespace || 'common';
      const module = await import(`@/${this.basePath}/${locale}/${fileName}.yaml`);
      return module.default || module;
    } catch (error) {
      console.warn(`Error loading namespace ${namespace}:`, error);
      return {};
    }
  }

  /**
   * Checks if content exists
   */
  async exists(key: string, locale: string = 'en'): Promise<boolean> {
    try {
      await import(`@/${this.basePath}/${locale}/${this.getFilePath(key)}`);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Gets file path for content key
   */
  private getFilePath(key: string): string {
    const parts = key.split('.');
    const fileName = parts[0];
    return `${fileName}.yaml`;
  }

  /**
   * Gets value from loaded module
   */
  private getValueFromModule(module: any, key: string): any {
    const content = module.default || module;
    const parts = key.split('.');
    
    let current = content;
    for (let i = 1; i < parts.length; i++) {
      current = current?.[parts[i]];
      if (current === undefined) {
        return null;
      }
    }
    
    return current;
  }
}

// API content source implementation
export class APIContentSource implements ContentSource {
  type: 'api' = 'api';
  private baseUrl: string;
  private apiKey?: string;

  constructor(baseUrl: string, apiKey?: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  /**
   * Loads content from API
   */
  async load(key: string, locale: string = 'en'): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/content/${key}?locale=${locale}`, {
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      return data.content;
    } catch (error) {
      console.warn(`Error loading API content for ${key}:`, error);
      return null;
    }
  }

  /**
   * Loads namespace from API
   */
  async loadNamespace(namespace: string, locale: string = 'en'): Promise<Record<string, any>> {
    try {
      const response = await fetch(`${this.baseUrl}/content/namespace/${namespace}?locale=${locale}`, {
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        return {};
      }
      
      const data = await response.json();
      return data.content;
    } catch (error) {
      console.warn(`Error loading API namespace ${namespace}:`, error);
      return {};
    }
  }

  /**
   * Checks if content exists
   */
  async exists(key: string, locale: string = 'en'): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/content/${key}/exists?locale=${locale}`, {
        method: 'HEAD',
        headers: this.getHeaders()
      });
      
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Gets request headers
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    
    return headers;
  }
}

// Memory content cache implementation
export class MemoryContentCache implements ContentCache {
  private cache: Map<string, { content: any; expires: number }>;

  constructor() {
    this.cache = new Map();
  }

  /**
   * Gets content from cache
   */
  async get(key: string, locale: string = 'en'): Promise<any> {
    const cacheKey = `${key}:${locale}`;
    const entry = this.cache.get(cacheKey);
    
    if (!entry) {
      return null;
    }
    
    if (Date.now() > entry.expires) {
      this.cache.delete(cacheKey);
      return null;
    }
    
    return entry.content;
  }

  /**
   * Sets content in cache
   */
  async set(key: string, content: any, locale: string = 'en', ttl: number = 3600): Promise<void> {
    const cacheKey = `${key}:${locale}`;
    const expires = Date.now() + (ttl * 1000);
    
    this.cache.set(cacheKey, { content, expires });
  }

  /**
   * Invalidates content from cache
   */
  async invalidate(key: string, locale?: string): Promise<void> {
    if (locale) {
      const cacheKey = `${key}:${locale}`;
      this.cache.delete(cacheKey);
    } else {
      // Invalidate all locales for this key
      const keysToDelete: string[] = [];
      for (const cacheKey of this.cache.keys()) {
        if (cacheKey.startsWith(`${key}:`)) {
          keysToDelete.push(cacheKey);
        }
      }
      
      keysToDelete.forEach(cacheKey => {
        this.cache.delete(cacheKey);
      });
    }
  }

  /**
   * Clears cache
   */
  async clear(locale?: string): Promise<void> {
    if (locale) {
      const keysToDelete: string[] = [];
      for (const cacheKey of this.cache.keys()) {
        if (cacheKey.endsWith(`:${locale}`)) {
          keysToDelete.push(cacheKey);
        }
      }
      
      keysToDelete.forEach(cacheKey => {
        this.cache.delete(cacheKey);
      });
    } else {
      this.cache.clear();
    }
  }
}

// Content loader utilities
export const contentLoaderUtils = {
  /**
   * Creates a content loader with default configuration
   */
  createLoader: (
    sources?: ContentSource[],
    cache?: ContentCache,
    defaultLocale?: string
  ): ContentLoader => {
    const defaultSources = sources || [
      new FileContentSource('config/content')
    ];
    
    const defaultCache = cache || new MemoryContentCache();
    
    return new RevivaTechContentLoader(
      defaultSources,
      defaultCache,
      defaultLocale || 'en',
      'en'
    );
  },

  /**
   * Creates file content source
   */
  createFileSource: (basePath?: string): ContentSource => {
    return new FileContentSource(basePath);
  },

  /**
   * Creates API content source
   */
  createAPISource: (baseUrl: string, apiKey?: string): ContentSource => {
    return new APIContentSource(baseUrl, apiKey);
  },

  /**
   * Creates memory cache
   */
  createMemoryCache: (): ContentCache => {
    return new MemoryContentCache();
  }
};

export default RevivaTechContentLoader;