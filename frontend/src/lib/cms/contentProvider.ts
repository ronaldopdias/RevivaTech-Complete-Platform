/**
 * Content Provider System
 * Phase 4: Content Management System - Configuration-driven content architecture
 */

import { z } from 'zod';

// Content types and schemas
export const ContentTypeSchema = z.enum([
  'page',
  'component',
  'navigation',
  'hero',
  'service',
  'testimonial',
  'faq',
  'blog',
  'feature',
  'pricing',
  'footer',
  'seo'
]);

export const ContentStatusSchema = z.enum([
  'draft',
  'published',
  'archived',
  'scheduled'
]);

export const LocaleSchema = z.enum(['en', 'pt']);

// Base content schema
export const BaseContentSchema = z.object({
  id: z.string(),
  type: ContentTypeSchema,
  slug: z.string(),
  title: z.string(),
  description: z.string().optional(),
  status: ContentStatusSchema,
  locale: LocaleSchema,
  publishedAt: z.date().optional(),
  scheduledAt: z.date().optional(),
  version: z.number().default(1),
  metadata: z.record(z.any()).optional(),
  seo: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    ogImage: z.string().optional(),
    canonical: z.string().optional()
  }).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional()
});

// Content field types
export const ContentFieldSchema = z.object({
  id: z.string(),
  type: z.enum(['text', 'richtext', 'image', 'video', 'link', 'boolean', 'number', 'date', 'select', 'array', 'object']),
  label: z.string(),
  required: z.boolean().default(false),
  defaultValue: z.any().optional(),
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
    options: z.array(z.string()).optional()
  }).optional(),
  localized: z.boolean().default(false),
  group: z.string().optional()
});

// Page content schema
export const PageContentSchema = BaseContentSchema.extend({
  type: z.literal('page'),
  content: z.object({
    hero: z.object({
      headline: z.string(),
      subheadline: z.string().optional(),
      description: z.string().optional(),
      backgroundImage: z.string().optional(),
      ctaText: z.string().optional(),
      ctaLink: z.string().optional()
    }).optional(),
    sections: z.array(z.object({
      id: z.string(),
      type: z.string(),
      component: z.string(),
      props: z.record(z.any()),
      order: z.number()
    }))
  })
});

// Component content schema
export const ComponentContentSchema = BaseContentSchema.extend({
  type: z.literal('component'),
  component: z.string(),
  props: z.record(z.any()),
  variants: z.array(z.object({
    name: z.string(),
    props: z.record(z.any())
  })).optional()
});

// Service content schema
export const ServiceContentSchema = BaseContentSchema.extend({
  type: z.literal('service'),
  content: z.object({
    name: z.string(),
    shortDescription: z.string(),
    longDescription: z.string(),
    icon: z.string().optional(),
    image: z.string().optional(),
    price: z.object({
      from: z.number(),
      to: z.number().optional(),
      currency: z.string().default('GBP')
    }).optional(),
    duration: z.string().optional(),
    features: z.array(z.string()),
    category: z.string(),
    tags: z.array(z.string()).optional(),
    availability: z.boolean().default(true)
  })
});

// Hero content schema
export const HeroContentSchema = BaseContentSchema.extend({
  type: z.literal('hero'),
  content: z.object({
    headline: z.object({
      main: z.string(),
      highlight: z.string().optional(),
      typewriter: z.boolean().default(false),
      gradient: z.boolean().default(false)
    }),
    subheadline: z.string().optional(),
    description: z.string().optional(),
    backgroundImage: z.string().optional(),
    backgroundVideo: z.string().optional(),
    variant: z.enum(['animated', 'gradient', 'glassmorphism', 'premium']).default('animated'),
    cta: z.object({
      primary: z.object({
        text: z.string(),
        href: z.string(),
        variant: z.enum(['primary', 'secondary']).default('primary')
      }),
      secondary: z.object({
        text: z.string(),
        href: z.string(),
        variant: z.enum(['primary', 'secondary']).default('secondary')
      }).optional()
    }).optional(),
    features: z.array(z.object({
      icon: z.string(),
      title: z.string(),
      description: z.string()
    })).optional(),
    stats: z.array(z.object({
      value: z.string(),
      label: z.string(),
      highlight: z.boolean().default(false)
    })).optional()
  })
});

// Content provider interface
export interface ContentProvider {
  name: string;
  type: 'file' | 'api' | 'database' | 'headless';
  
  // Content retrieval
  getContent<T>(type: string, id: string, locale?: string): Promise<T | null>;
  getContentBySlug<T>(type: string, slug: string, locale?: string): Promise<T | null>;
  getContentList<T>(type: string, filters?: ContentFilters): Promise<T[]>;
  
  // Content management
  createContent<T>(type: string, content: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;
  updateContent<T>(type: string, id: string, content: Partial<T>): Promise<T>;
  deleteContent(type: string, id: string): Promise<boolean>;
  
  // Content operations
  publishContent(type: string, id: string): Promise<boolean>;
  unpublishContent(type: string, id: string): Promise<boolean>;
  duplicateContent<T>(type: string, id: string): Promise<T>;
  
  // Version management
  getContentVersions(type: string, id: string): Promise<ContentVersion[]>;
  restoreContentVersion(type: string, id: string, version: number): Promise<boolean>;
  
  // Cache management
  invalidateCache(type?: string, id?: string): Promise<void>;
  warmCache(type?: string): Promise<void>;
}

// Content filters
export interface ContentFilters {
  status?: string[];
  locale?: string;
  search?: string;
  tags?: string[];
  category?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

// Content version
export interface ContentVersion {
  version: number;
  content: any;
  createdAt: Date;
  createdBy?: string;
  changelog?: string;
}

// Content registry for managing providers
export class ContentRegistry {
  private static instance: ContentRegistry;
  private providers: Map<string, ContentProvider> = new Map();
  private defaultProvider: string | null = null;

  static getInstance(): ContentRegistry {
    if (!ContentRegistry.instance) {
      ContentRegistry.instance = new ContentRegistry();
    }
    return ContentRegistry.instance;
  }

  /**
   * Register a content provider
   */
  registerProvider(name: string, provider: ContentProvider): void {
    this.providers.set(name, provider);
    
    if (!this.defaultProvider) {
      this.defaultProvider = name;
    }
  }

  /**
   * Get a content provider
   */
  getProvider(name?: string): ContentProvider | null {
    const providerName = name || this.defaultProvider;
    if (!providerName) return null;
    
    return this.providers.get(providerName) || null;
  }

  /**
   * Set default provider
   */
  setDefaultProvider(name: string): void {
    if (this.providers.has(name)) {
      this.defaultProvider = name;
    } else {
      throw new Error(`Provider '${name}' not found`);
    }
  }

  /**
   * Get all registered providers
   */
  getProviders(): string[] {
    return Array.from(this.providers.keys());
  }
}

// Content service for unified access
export class ContentService {
  private static instance: ContentService;
  private registry: ContentRegistry;
  private cache: Map<string, { data: any; expires: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  static getInstance(): ContentService {
    if (!ContentService.instance) {
      ContentService.instance = new ContentService();
    }
    return ContentService.instance;
  }

  constructor() {
    this.registry = ContentRegistry.getInstance();
  }

  /**
   * Get content with caching
   */
  async getContent<T>(
    type: string, 
    id: string, 
    locale = 'en', 
    provider?: string
  ): Promise<T | null> {
    const cacheKey = `${type}:${id}:${locale}:${provider || 'default'}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    const contentProvider = this.registry.getProvider(provider);
    if (!contentProvider) {
      throw new Error(`No content provider available`);
    }

    try {
      const content = await contentProvider.getContent<T>(type, id, locale);
      
      // Cache the result
      if (content) {
        this.cache.set(cacheKey, {
          data: content,
          expires: Date.now() + this.CACHE_TTL
        });
      }

      return content;
    } catch (error) {
      console.error(`Failed to get content ${type}:${id}:`, error);
      return null;
    }
  }

  /**
   * Get content by slug with caching
   */
  async getContentBySlug<T>(
    type: string, 
    slug: string, 
    locale = 'en', 
    provider?: string
  ): Promise<T | null> {
    const cacheKey = `${type}:slug:${slug}:${locale}:${provider || 'default'}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    const contentProvider = this.registry.getProvider(provider);
    if (!contentProvider) {
      throw new Error(`No content provider available`);
    }

    try {
      const content = await contentProvider.getContentBySlug<T>(type, slug, locale);
      
      // Cache the result
      if (content) {
        this.cache.set(cacheKey, {
          data: content,
          expires: Date.now() + this.CACHE_TTL
        });
      }

      return content;
    } catch (error) {
      console.error(`Failed to get content ${type}:${slug}:`, error);
      return null;
    }
  }

  /**
   * Get content list with filtering
   */
  async getContentList<T>(
    type: string, 
    filters: ContentFilters = {}, 
    provider?: string
  ): Promise<T[]> {
    const contentProvider = this.registry.getProvider(provider);
    if (!contentProvider) {
      throw new Error(`No content provider available`);
    }

    try {
      return await contentProvider.getContentList<T>(type, filters);
    } catch (error) {
      console.error(`Failed to get content list ${type}:`, error);
      return [];
    }
  }

  /**
   * Create content
   */
  async createContent<T>(
    type: string, 
    content: Omit<T, 'id' | 'createdAt' | 'updatedAt'>, 
    provider?: string
  ): Promise<T | null> {
    const contentProvider = this.registry.getProvider(provider);
    if (!contentProvider) {
      throw new Error(`No content provider available`);
    }

    try {
      const newContent = await contentProvider.createContent<T>(type, content);
      
      // Invalidate cache
      this.invalidateTypeCache(type);
      
      return newContent;
    } catch (error) {
      console.error(`Failed to create content ${type}:`, error);
      return null;
    }
  }

  /**
   * Update content
   */
  async updateContent<T>(
    type: string, 
    id: string, 
    content: Partial<T>, 
    provider?: string
  ): Promise<T | null> {
    const contentProvider = this.registry.getProvider(provider);
    if (!contentProvider) {
      throw new Error(`No content provider available`);
    }

    try {
      const updatedContent = await contentProvider.updateContent<T>(type, id, content);
      
      // Invalidate cache
      this.invalidateItemCache(type, id);
      
      return updatedContent;
    } catch (error) {
      console.error(`Failed to update content ${type}:${id}:`, error);
      return null;
    }
  }

  /**
   * Delete content
   */
  async deleteContent(type: string, id: string, provider?: string): Promise<boolean> {
    const contentProvider = this.registry.getProvider(provider);
    if (!contentProvider) {
      throw new Error(`No content provider available`);
    }

    try {
      const success = await contentProvider.deleteContent(type, id);
      
      if (success) {
        // Invalidate cache
        this.invalidateItemCache(type, id);
      }
      
      return success;
    } catch (error) {
      console.error(`Failed to delete content ${type}:${id}:`, error);
      return false;
    }
  }

  /**
   * Invalidate cache for specific item
   */
  private invalidateItemCache(type: string, id: string): void {
    const keysToDelete = Array.from(this.cache.keys()).filter(key => 
      key.startsWith(`${type}:${id}:`) || key.startsWith(`${type}:slug:`)
    );
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Invalidate cache for content type
   */
  private invalidateTypeCache(type: string): void {
    const keysToDelete = Array.from(this.cache.keys()).filter(key => 
      key.startsWith(`${type}:`)
    );
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Export types
export type {
  ContentProvider,
  ContentFilters,
  ContentVersion
};

export type BaseContent = z.infer<typeof BaseContentSchema>;
export type PageContent = z.infer<typeof PageContentSchema>;
export type ComponentContent = z.infer<typeof ComponentContentSchema>;
export type ServiceContent = z.infer<typeof ServiceContentSchema>;
export type HeroContent = z.infer<typeof HeroContentSchema>;
export type ContentType = z.infer<typeof ContentTypeSchema>;
export type ContentStatus = z.infer<typeof ContentStatusSchema>;
export type Locale = z.infer<typeof LocaleSchema>;

// Export singleton instances
export const contentRegistry = ContentRegistry.getInstance();
export const contentService = ContentService.getInstance();