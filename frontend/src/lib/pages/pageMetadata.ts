/**
 * Page Metadata System
 * 
 * This system handles SEO metadata, analytics integration, and page
 * performance tracking for dynamically generated pages.
 */

import { PageConfig, PageMeta, AnalyticsConfig } from '@/types/config';
import { Metadata } from 'next';

// Page metadata manager interface
export interface PageMetadataManager {
  generateMetadata: (config: PageConfig, params?: Record<string, string>) => Promise<Metadata>;
  generateSEOTags: (config: PageConfig) => SEOTags;
  generateAnalyticsConfig: (config: PageConfig) => AnalyticsPageConfig;
  generateStructuredData: (config: PageConfig) => StructuredData[];
  validateMetadata: (metadata: Metadata) => MetadataValidationResult;
}

// SEO tags interface
export interface SEOTags {
  title: string;
  description: string;
  keywords: string[];
  canonical?: string;
  robots: string;
  openGraph: OpenGraphTags;
  twitter: TwitterTags;
  alternates?: AlternateTags;
}

// Open Graph tags interface
export interface OpenGraphTags {
  title: string;
  description: string;
  type: 'website' | 'article' | 'product' | 'profile';
  url?: string;
  images: OpenGraphImage[];
  siteName?: string;
  locale?: string;
  alternateLocale?: string[];
}

// Open Graph image interface
export interface OpenGraphImage {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
  type?: string;
}

// Twitter tags interface
export interface TwitterTags {
  card: 'summary' | 'summary_large_image' | 'app' | 'player';
  title: string;
  description: string;
  image?: string;
  imageAlt?: string;
  creator?: string;
  site?: string;
}

// Alternate tags interface
export interface AlternateTags {
  canonical?: string;
  languages?: Record<string, string>;
  media?: Record<string, string>;
  types?: Record<string, string>;
}

// Analytics page configuration interface
export interface AnalyticsPageConfig {
  pageId: string;
  pageType: string;
  category: string;
  customDimensions: Record<string, any>;
  events: AnalyticsEvent[];
  goals: AnalyticsGoal[];
}

// Analytics event interface
export interface AnalyticsEvent {
  name: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  customDimensions?: Record<string, any>;
}

// Analytics goal interface
export interface AnalyticsGoal {
  id: string;
  name: string;
  type: 'pageview' | 'event' | 'duration' | 'conversion';
  target: string | number;
  value?: number;
}

// Structured data interface
export interface StructuredData {
  '@context': string;
  '@type': string;
  [key: string]: any;
}

// Metadata validation result interface
export interface MetadataValidationResult {
  valid: boolean;
  errors: MetadataError[];
  warnings: MetadataWarning[];
  suggestions: MetadataSuggestion[];
}

// Metadata error interface
export interface MetadataError {
  field: string;
  message: string;
  code: string;
}

// Metadata warning interface
export interface MetadataWarning {
  field: string;
  message: string;
  code: string;
}

// Metadata suggestion interface
export interface MetadataSuggestion {
  field: string;
  message: string;
  suggestion: string;
}

// Page metadata manager implementation
export class RevivaTechPageMetadataManager implements PageMetadataManager {
  private siteConfig: SiteMetadataConfig;
  private analyticsConfig: AnalyticsIntegrationConfig;

  constructor(
    siteConfig: SiteMetadataConfig,
    analyticsConfig: AnalyticsIntegrationConfig
  ) {
    this.siteConfig = siteConfig;
    this.analyticsConfig = analyticsConfig;
  }

  /**
   * Generates Next.js metadata from page configuration
   */
  async generateMetadata(config: PageConfig, params?: Record<string, string>): Promise<Metadata> {
    try {
      const processedMeta = await this.processMetaWithParams(config.meta, params);
      const seoTags = this.generateSEOTags(config);

      const metadata: Metadata = {
        title: processedMeta.title,
        description: processedMeta.description,
        keywords: processedMeta.keywords,
        robots: processedMeta.robots,
        
        openGraph: {
          title: seoTags.openGraph.title,
          description: seoTags.openGraph.description,
          type: seoTags.openGraph.type,
          url: seoTags.openGraph.url,
          images: seoTags.openGraph.images,
          siteName: seoTags.openGraph.siteName,
          locale: seoTags.openGraph.locale,
          alternateLocale: seoTags.openGraph.alternateLocale
        },

        twitter: {
          card: seoTags.twitter.card,
          title: seoTags.twitter.title,
          description: seoTags.twitter.description,
          images: seoTags.twitter.image ? [seoTags.twitter.image] : undefined,
          creator: seoTags.twitter.creator,
          site: seoTags.twitter.site
        },

        alternates: seoTags.alternates ? {
          canonical: seoTags.alternates.canonical,
          languages: seoTags.alternates.languages,
          media: seoTags.alternates.media,
          types: seoTags.alternates.types
        } : undefined,

        // Additional metadata
        viewport: 'width=device-width, initial-scale=1',
        themeColor: this.siteConfig.themeColor,
        colorScheme: 'light dark',
        
        // Icons
        icons: {
          icon: this.siteConfig.icons.icon,
          shortcut: this.siteConfig.icons.shortcut,
          apple: this.siteConfig.icons.apple,
          other: this.siteConfig.icons.other
        },

        // Manifest
        manifest: this.siteConfig.manifest,

        // Verification
        verification: this.siteConfig.verification,

        // Other metadata
        other: {
          'msapplication-TileColor': this.siteConfig.themeColor,
          'msapplication-config': '/browserconfig.xml'
        }
      };

      return metadata;
    } catch (error) {
      console.error('Error generating metadata:', error);
      return this.getDefaultMetadata();
    }
  }

  /**
   * Generates SEO tags from page configuration
   */
  generateSEOTags(config: PageConfig): SEOTags {
    const meta = config.meta;
    const siteName = this.siteConfig.siteName;
    const baseUrl = this.siteConfig.baseUrl;

    return {
      title: meta.title,
      description: meta.description,
      keywords: meta.keywords || [],
      robots: meta.robots || 'index,follow',
      canonical: this.generateCanonicalUrl(config),
      
      openGraph: {
        title: meta.title,
        description: meta.description,
        type: this.inferOGType(config),
        url: this.generateCanonicalUrl(config),
        images: this.generateOGImages(config),
        siteName: siteName,
        locale: this.siteConfig.defaultLocale,
        alternateLocale: this.siteConfig.alternateLocales
      },

      twitter: {
        card: this.inferTwitterCard(config),
        title: meta.title,
        description: meta.description,
        image: meta.ogImage,
        imageAlt: meta.title,
        creator: this.siteConfig.twitterCreator,
        site: this.siteConfig.twitterSite
      },

      alternates: {
        canonical: this.generateCanonicalUrl(config),
        languages: this.generateLanguageAlternates(config),
        media: this.generateMediaAlternates(config)
      }
    };
  }

  /**
   * Generates analytics configuration
   */
  generateAnalyticsConfig(config: PageConfig): AnalyticsPageConfig {
    const analytics = config.analytics;
    const pageId = this.generatePageId(config);

    return {
      pageId: pageId,
      pageType: analytics?.pageType || 'page',
      category: analytics?.category || 'general',
      customDimensions: {
        ...(analytics?.customDimensions || {}),
        pageId: pageId,
        layout: config.layout,
        features: config.features || [],
        sectionsCount: config.sections.length,
        hasAuth: config.auth?.required || false
      },
      events: this.generateAnalyticsEvents(config),
      goals: this.generateAnalyticsGoals(config)
    };
  }

  /**
   * Generates structured data (JSON-LD)
   */
  generateStructuredData(config: PageConfig): StructuredData[] {
    const structuredData: StructuredData[] = [];

    // Website structured data
    structuredData.push({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: this.siteConfig.siteName,
      url: this.siteConfig.baseUrl,
      description: this.siteConfig.description,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${this.siteConfig.baseUrl}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string'
      }
    });

    // Organization structured data
    structuredData.push({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: this.siteConfig.organizationName,
      url: this.siteConfig.baseUrl,
      logo: `${this.siteConfig.baseUrl}/images/logo.png`,
      description: this.siteConfig.description,
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: this.siteConfig.phone,
        contactType: 'customer service',
        availableLanguage: this.siteConfig.languages
      },
      sameAs: this.siteConfig.socialMedia
    });

    // Page-specific structured data
    if (config.analytics?.pageType === 'service') {
      structuredData.push(this.generateServiceStructuredData(config));
    }

    if (config.analytics?.pageType === 'article') {
      structuredData.push(this.generateArticleStructuredData(config));
    }

    if (config.analytics?.pageType === 'product') {
      structuredData.push(this.generateProductStructuredData(config));
    }

    return structuredData;
  }

  /**
   * Validates metadata
   */
  validateMetadata(metadata: Metadata): MetadataValidationResult {
    const errors: MetadataError[] = [];
    const warnings: MetadataWarning[] = [];
    const suggestions: MetadataSuggestion[] = [];

    // Validate title
    if (!metadata.title) {
      errors.push({
        field: 'title',
        message: 'Title is required',
        code: 'MISSING_TITLE'
      });
    } else if (typeof metadata.title === 'string') {
      if (metadata.title.length > 60) {
        warnings.push({
          field: 'title',
          message: 'Title is longer than recommended (60 characters)',
          code: 'LONG_TITLE'
        });
      }
      if (metadata.title.length < 30) {
        suggestions.push({
          field: 'title',
          message: 'Title could be more descriptive',
          suggestion: 'Consider adding more descriptive keywords'
        });
      }
    }

    // Validate description
    if (!metadata.description) {
      errors.push({
        field: 'description',
        message: 'Description is required',
        code: 'MISSING_DESCRIPTION'
      });
    } else if (metadata.description.length > 160) {
      warnings.push({
        field: 'description',
        message: 'Description is longer than recommended (160 characters)',
        code: 'LONG_DESCRIPTION'
      });
    }

    // Validate Open Graph
    if (!metadata.openGraph?.images) {
      warnings.push({
        field: 'openGraph.images',
        message: 'Open Graph image is recommended',
        code: 'MISSING_OG_IMAGE'
      });
    }

    // Validate keywords
    if (!metadata.keywords || (Array.isArray(metadata.keywords) && metadata.keywords.length === 0)) {
      suggestions.push({
        field: 'keywords',
        message: 'Keywords can help with SEO',
        suggestion: 'Add relevant keywords for better search visibility'
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  /**
   * Processes metadata with dynamic parameters
   */
  private async processMetaWithParams(meta: PageMeta, params?: Record<string, string>): Promise<PageMeta> {
    if (!params) return meta;

    const processedMeta: PageMeta = { ...meta };

    // Replace parameter placeholders in title and description
    Object.entries(params).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      processedMeta.title = processedMeta.title.replace(placeholder, value);
      processedMeta.description = processedMeta.description.replace(placeholder, value);
    });

    return processedMeta;
  }

  /**
   * Generates canonical URL
   */
  private generateCanonicalUrl(config: PageConfig): string {
    // This would be implemented based on your routing system
    return `${this.siteConfig.baseUrl}/page-path`;
  }

  /**
   * Infers Open Graph type
   */
  private inferOGType(config: PageConfig): 'website' | 'article' | 'product' | 'profile' {
    const pageType = config.analytics?.pageType;
    
    switch (pageType) {
      case 'article':
      case 'blog':
        return 'article';
      case 'product':
      case 'service':
        return 'product';
      case 'profile':
        return 'profile';
      default:
        return 'website';
    }
  }

  /**
   * Generates Open Graph images
   */
  private generateOGImages(config: PageConfig): OpenGraphImage[] {
    const images: OpenGraphImage[] = [];
    
    if (config.meta.ogImage) {
      images.push({
        url: config.meta.ogImage,
        width: 1200,
        height: 630,
        alt: config.meta.title,
        type: 'image/png'
      });
    }

    // Add default image if none provided
    if (images.length === 0) {
      images.push({
        url: `${this.siteConfig.baseUrl}/images/default-og.png`,
        width: 1200,
        height: 630,
        alt: config.meta.title,
        type: 'image/png'
      });
    }

    return images;
  }

  /**
   * Infers Twitter card type
   */
  private inferTwitterCard(config: PageConfig): 'summary' | 'summary_large_image' | 'app' | 'player' {
    if (config.meta.ogImage) {
      return 'summary_large_image';
    }
    return 'summary';
  }

  /**
   * Generates language alternates
   */
  private generateLanguageAlternates(config: PageConfig): Record<string, string> {
    const alternates: Record<string, string> = {};
    
    this.siteConfig.languages.forEach(lang => {
      alternates[lang] = `${this.siteConfig.baseUrl}/${lang}/page-path`;
    });

    return alternates;
  }

  /**
   * Generates media alternates
   */
  private generateMediaAlternates(config: PageConfig): Record<string, string> {
    return {
      'only screen and (max-width: 600px)': `${this.siteConfig.baseUrl}/mobile/page-path`
    };
  }

  /**
   * Generates page ID
   */
  private generatePageId(config: PageConfig): string {
    return `page-${config.meta.title.toLowerCase().replace(/\s+/g, '-')}`;
  }

  /**
   * Generates analytics events
   */
  private generateAnalyticsEvents(config: PageConfig): AnalyticsEvent[] {
    const events: AnalyticsEvent[] = [];

    // Page view event
    events.push({
      name: 'page_view',
      category: 'engagement',
      action: 'view',
      label: config.meta.title
    });

    // Section view events
    config.sections.forEach(section => {
      events.push({
        name: 'section_view',
        category: 'engagement',
        action: 'view',
        label: section.id,
        customDimensions: {
          component: section.component,
          sectionId: section.id
        }
      });
    });

    return events;
  }

  /**
   * Generates analytics goals
   */
  private generateAnalyticsGoals(config: PageConfig): AnalyticsGoal[] {
    const goals: AnalyticsGoal[] = [];

    // Page engagement goal
    goals.push({
      id: 'page_engagement',
      name: 'Page Engagement',
      type: 'duration',
      target: 30, // 30 seconds
      value: 1
    });

    // Conversion goals based on page type
    if (config.analytics?.pageType === 'landing') {
      goals.push({
        id: 'landing_conversion',
        name: 'Landing Page Conversion',
        type: 'event',
        target: 'cta_click',
        value: 10
      });
    }

    return goals;
  }

  /**
   * Generates service structured data
   */
  private generateServiceStructuredData(config: PageConfig): StructuredData {
    return {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: config.meta.title,
      description: config.meta.description,
      provider: {
        '@type': 'Organization',
        name: this.siteConfig.organizationName
      },
      serviceType: 'Computer Repair',
      areaServed: 'London, UK'
    };
  }

  /**
   * Generates article structured data
   */
  private generateArticleStructuredData(config: PageConfig): StructuredData {
    return {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: config.meta.title,
      description: config.meta.description,
      author: {
        '@type': 'Organization',
        name: this.siteConfig.organizationName
      },
      publisher: {
        '@type': 'Organization',
        name: this.siteConfig.organizationName,
        logo: {
          '@type': 'ImageObject',
          url: `${this.siteConfig.baseUrl}/images/logo.png`
        }
      },
      datePublished: new Date().toISOString(),
      dateModified: new Date().toISOString()
    };
  }

  /**
   * Generates product structured data
   */
  private generateProductStructuredData(config: PageConfig): StructuredData {
    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: config.meta.title,
      description: config.meta.description,
      brand: {
        '@type': 'Brand',
        name: this.siteConfig.organizationName
      },
      offers: {
        '@type': 'Offer',
        availability: 'https://schema.org/InStock',
        priceCurrency: 'GBP'
      }
    };
  }

  /**
   * Gets default metadata
   */
  private getDefaultMetadata(): Metadata {
    return {
      title: this.siteConfig.siteName,
      description: this.siteConfig.description,
      robots: 'index,follow'
    };
  }
}

// Site metadata configuration interface
export interface SiteMetadataConfig {
  siteName: string;
  organizationName: string;
  description: string;
  baseUrl: string;
  defaultLocale: string;
  alternateLocales: string[];
  languages: string[];
  themeColor: string;
  phone: string;
  twitterCreator?: string;
  twitterSite?: string;
  socialMedia: string[];
  icons: {
    icon: string;
    shortcut: string;
    apple: string;
    other: any[];
  };
  manifest: string;
  verification: {
    google?: string;
    yandex?: string;
    yahoo?: string;
    other?: Record<string, string>;
  };
}

// Analytics integration configuration interface
export interface AnalyticsIntegrationConfig {
  googleAnalytics?: {
    measurementId: string;
    enabled: boolean;
  };
  googleTagManager?: {
    containerId: string;
    enabled: boolean;
  };
  facebookPixel?: {
    pixelId: string;
    enabled: boolean;
  };
  customAnalytics?: {
    enabled: boolean;
    endpoint: string;
  };
}

// Metadata utilities
export const metadataUtils = {
  /**
   * Creates metadata manager with default configuration
   */
  createManager: (
    siteConfig: SiteMetadataConfig,
    analyticsConfig: AnalyticsIntegrationConfig
  ): PageMetadataManager => {
    return new RevivaTechPageMetadataManager(siteConfig, analyticsConfig);
  },

  /**
   * Validates multiple metadata configurations
   */
  validateConfigurations: (
    configurations: Metadata[],
    manager: PageMetadataManager
  ): Record<string, MetadataValidationResult> => {
    const results: Record<string, MetadataValidationResult> = {};
    
    configurations.forEach((metadata, index) => {
      results[`config_${index}`] = manager.validateMetadata(metadata);
    });

    return results;
  },

  /**
   * Generates metadata report
   */
  generateReport: (
    configs: PageConfig[],
    manager: PageMetadataManager
  ): Promise<MetadataReport> => {
    // Implementation for generating comprehensive metadata report
    return Promise.resolve({
      total: configs.length,
      valid: 0,
      warnings: 0,
      errors: 0,
      suggestions: 0
    });
  }
};

// Metadata report interface
export interface MetadataReport {
  total: number;
  valid: number;
  warnings: number;
  errors: number;
  suggestions: number;
}

export default RevivaTechPageMetadataManager;