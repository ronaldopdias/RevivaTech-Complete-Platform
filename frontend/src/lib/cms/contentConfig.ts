/**
 * Content Configuration Structure
 * Phase 4: Content Management System - TypeScript schemas and configurations
 */

import { z } from 'zod';
import { ContentFieldSchema, ContentTypeSchema, LocaleSchema } from './contentProvider';

// Content type definitions with field configurations
export const ContentTypeConfigSchema = z.object({
  name: z.string(),
  label: z.string(),
  description: z.string().optional(),
  icon: z.string().optional(),
  fields: z.array(ContentFieldSchema),
  localized: z.boolean().default(false),
  versioned: z.boolean().default(true),
  publishable: z.boolean().default(true),
  searchable: z.boolean().default(true),
  templates: z.array(z.object({
    name: z.string(),
    label: z.string(),
    component: z.string(),
    fields: z.array(z.string()).optional() // field IDs to include
  })).optional(),
  validation: z.object({
    required: z.array(z.string()).optional(),
    unique: z.array(z.string()).optional(),
    custom: z.array(z.object({
      field: z.string(),
      rule: z.string(),
      message: z.string()
    })).optional()
  }).optional(),
  workflow: z.object({
    states: z.array(z.object({
      name: z.string(),
      label: z.string(),
      color: z.string().optional()
    })),
    transitions: z.array(z.object({
      from: z.string(),
      to: z.string(),
      action: z.string(),
      permission: z.string().optional()
    }))
  }).optional()
});

// Global CMS configuration
export const CMSConfigSchema = z.object({
  // General settings
  siteName: z.string(),
  siteUrl: z.string(),
  defaultLocale: LocaleSchema,
  locales: z.array(LocaleSchema),
  timezone: z.string().default('Europe/London'),
  
  // Content settings
  contentTypes: z.array(ContentTypeConfigSchema),
  mediaSettings: z.object({
    uploadPath: z.string().default('/uploads'),
    maxFileSize: z.number().default(10 * 1024 * 1024), // 10MB
    allowedTypes: z.array(z.string()).default(['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
    imageOptimization: z.object({
      enabled: z.boolean().default(true),
      formats: z.array(z.enum(['webp', 'avif', 'jpeg', 'png'])).default(['webp', 'avif']),
      quality: z.number().min(1).max(100).default(85),
      sizes: z.array(z.number()).default([400, 800, 1200, 1600])
    })
  }),
  
  // API settings
  apiSettings: z.object({
    endpoint: z.string().default('/api/cms'),
    version: z.string().default('v1'),
    rateLimit: z.object({
      enabled: z.boolean().default(true),
      requests: z.number().default(100),
      window: z.number().default(60000) // 1 minute
    }),
    authentication: z.object({
      required: z.boolean().default(true),
      type: z.enum(['jwt', 'apikey', 'oauth']).default('jwt')
    })
  }),
  
  // Cache settings
  cacheSettings: z.object({
    enabled: z.boolean().default(true),
    ttl: z.number().default(5 * 60 * 1000), // 5 minutes
    strategy: z.enum(['memory', 'redis', 'file']).default('memory'),
    invalidation: z.object({
      automatic: z.boolean().default(true),
      webhook: z.string().optional()
    })
  }),
  
  // Preview settings
  previewSettings: z.object({
    enabled: z.boolean().default(true),
    secret: z.string().optional(),
    baseUrl: z.string().optional()
  }),
  
  // Search settings
  searchSettings: z.object({
    enabled: z.boolean().default(true),
    provider: z.enum(['local', 'elasticsearch', 'algolia']).default('local'),
    indexFields: z.array(z.string()).default(['title', 'description', 'content'])
  }),
  
  // Backup settings
  backupSettings: z.object({
    enabled: z.boolean().default(true),
    frequency: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
    retention: z.number().default(30), // days
    path: z.string().default('/backups')
  })
});

// RevivaTech-specific content type configurations
export const revivaTechContentTypes: z.infer<typeof ContentTypeConfigSchema>[] = [
  // Page content type
  {
    name: 'page',
    label: 'Pages',
    description: 'Website pages with flexible content sections',
    icon: 'FileText',
    localized: true,
    versioned: true,
    publishable: true,
    searchable: true,
    fields: [
      {
        id: 'title',
        type: 'text',
        label: 'Page Title',
        required: true,
        localized: true
      },
      {
        id: 'slug',
        type: 'text',
        label: 'URL Slug',
        required: true,
        validation: {
          pattern: '^[a-z0-9-]+$'
        }
      },
      {
        id: 'description',
        type: 'text',
        label: 'Meta Description',
        localized: true,
        validation: {
          max: 160
        }
      },
      {
        id: 'hero',
        type: 'object',
        label: 'Hero Section',
        localized: true
      },
      {
        id: 'sections',
        type: 'array',
        label: 'Content Sections',
        localized: true
      },
      {
        id: 'seoTitle',
        type: 'text',
        label: 'SEO Title',
        localized: true
      },
      {
        id: 'ogImage',
        type: 'image',
        label: 'Social Media Image'
      }
    ],
    templates: [
      {
        name: 'landing',
        label: 'Landing Page',
        component: 'LandingPageTemplate'
      },
      {
        name: 'service',
        label: 'Service Page',
        component: 'ServicePageTemplate'
      },
      {
        name: 'about',
        label: 'About Page',
        component: 'AboutPageTemplate'
      }
    ]
  },

  // Hero content type
  {
    name: 'hero',
    label: 'Hero Sections',
    description: 'Hero banners and featured sections',
    icon: 'Image',
    localized: true,
    versioned: true,
    publishable: true,
    searchable: true,
    fields: [
      {
        id: 'headline',
        type: 'object',
        label: 'Headline',
        required: true,
        localized: true
      },
      {
        id: 'subheadline',
        type: 'text',
        label: 'Subheadline',
        localized: true
      },
      {
        id: 'description',
        type: 'richtext',
        label: 'Description',
        localized: true
      },
      {
        id: 'backgroundImage',
        type: 'image',
        label: 'Background Image'
      },
      {
        id: 'backgroundVideo',
        type: 'video',
        label: 'Background Video'
      },
      {
        id: 'variant',
        type: 'select',
        label: 'Style Variant',
        defaultValue: 'animated',
        validation: {
          options: ['animated', 'gradient', 'glassmorphism', 'premium']
        }
      },
      {
        id: 'cta',
        type: 'object',
        label: 'Call to Action',
        localized: true
      },
      {
        id: 'features',
        type: 'array',
        label: 'Feature Highlights',
        localized: true
      },
      {
        id: 'stats',
        type: 'array',
        label: 'Statistics',
        localized: true
      }
    ]
  },

  // Service content type
  {
    name: 'service',
    label: 'Services',
    description: 'Repair services and offerings',
    icon: 'Wrench',
    localized: true,
    versioned: true,
    publishable: true,
    searchable: true,
    fields: [
      {
        id: 'name',
        type: 'text',
        label: 'Service Name',
        required: true,
        localized: true
      },
      {
        id: 'slug',
        type: 'text',
        label: 'URL Slug',
        required: true
      },
      {
        id: 'shortDescription',
        type: 'text',
        label: 'Short Description',
        required: true,
        localized: true,
        validation: {
          max: 150
        }
      },
      {
        id: 'longDescription',
        type: 'richtext',
        label: 'Detailed Description',
        localized: true
      },
      {
        id: 'icon',
        type: 'text',
        label: 'Icon Name'
      },
      {
        id: 'image',
        type: 'image',
        label: 'Service Image'
      },
      {
        id: 'price',
        type: 'object',
        label: 'Pricing Information'
      },
      {
        id: 'duration',
        type: 'text',
        label: 'Service Duration'
      },
      {
        id: 'features',
        type: 'array',
        label: 'Service Features',
        localized: true
      },
      {
        id: 'category',
        type: 'select',
        label: 'Service Category',
        required: true,
        validation: {
          options: ['apple', 'pc', 'gaming', 'mobile', 'data-recovery']
        }
      },
      {
        id: 'tags',
        type: 'array',
        label: 'Tags'
      },
      {
        id: 'availability',
        type: 'boolean',
        label: 'Available',
        defaultValue: true
      }
    ]
  },

  // Navigation content type
  {
    name: 'navigation',
    label: 'Navigation',
    description: 'Site navigation menus',
    icon: 'Menu',
    localized: true,
    versioned: true,
    publishable: true,
    searchable: false,
    fields: [
      {
        id: 'name',
        type: 'text',
        label: 'Menu Name',
        required: true
      },
      {
        id: 'items',
        type: 'array',
        label: 'Menu Items',
        required: true,
        localized: true
      },
      {
        id: 'position',
        type: 'select',
        label: 'Menu Position',
        validation: {
          options: ['header', 'footer', 'sidebar', 'mobile']
        }
      }
    ]
  },

  // Testimonial content type
  {
    name: 'testimonial',
    label: 'Testimonials',
    description: 'Customer reviews and testimonials',
    icon: 'MessageSquare',
    localized: true,
    versioned: false,
    publishable: true,
    searchable: true,
    fields: [
      {
        id: 'customerName',
        type: 'text',
        label: 'Customer Name',
        required: true
      },
      {
        id: 'customerTitle',
        type: 'text',
        label: 'Customer Title/Company'
      },
      {
        id: 'customerAvatar',
        type: 'image',
        label: 'Customer Photo'
      },
      {
        id: 'testimonial',
        type: 'richtext',
        label: 'Testimonial Text',
        required: true,
        localized: true
      },
      {
        id: 'rating',
        type: 'number',
        label: 'Rating (1-5)',
        validation: {
          min: 1,
          max: 5
        }
      },
      {
        id: 'service',
        type: 'text',
        label: 'Service Used'
      },
      {
        id: 'featured',
        type: 'boolean',
        label: 'Featured Testimonial',
        defaultValue: false
      },
      {
        id: 'deviceType',
        type: 'select',
        label: 'Device Type',
        validation: {
          options: ['iPhone', 'iPad', 'MacBook', 'iMac', 'PC', 'Gaming Console', 'Other']
        }
      }
    ]
  },

  // FAQ content type
  {
    name: 'faq',
    label: 'FAQ',
    description: 'Frequently asked questions',
    icon: 'HelpCircle',
    localized: true,
    versioned: true,
    publishable: true,
    searchable: true,
    fields: [
      {
        id: 'question',
        type: 'text',
        label: 'Question',
        required: true,
        localized: true
      },
      {
        id: 'answer',
        type: 'richtext',
        label: 'Answer',
        required: true,
        localized: true
      },
      {
        id: 'category',
        type: 'select',
        label: 'Category',
        validation: {
          options: ['general', 'pricing', 'repairs', 'warranty', 'shipping']
        }
      },
      {
        id: 'order',
        type: 'number',
        label: 'Display Order',
        defaultValue: 0
      },
      {
        id: 'featured',
        type: 'boolean',
        label: 'Featured FAQ',
        defaultValue: false
      }
    ]
  }
];

// Default CMS configuration for RevivaTech
export const defaultCMSConfig: z.infer<typeof CMSConfigSchema> = {
  siteName: 'RevivaTech',
  siteUrl: 'https://revivatech.co.uk',
  defaultLocale: 'en',
  locales: ['en', 'pt'],
  timezone: 'Europe/London',
  
  contentTypes: revivaTechContentTypes,
  
  mediaSettings: {
    uploadPath: '/uploads',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'video/mp4'],
    imageOptimization: {
      enabled: true,
      formats: ['webp', 'avif'],
      quality: 85,
      sizes: [400, 800, 1200, 1600]
    }
  },
  
  apiSettings: {
    endpoint: '/api/cms',
    version: 'v1',
    rateLimit: {
      enabled: true,
      requests: 100,
      window: 60000
    },
    authentication: {
      required: true,
      type: 'jwt'
    }
  },
  
  cacheSettings: {
    enabled: true,
    ttl: 5 * 60 * 1000, // 5 minutes
    strategy: 'memory',
    invalidation: {
      automatic: true
    }
  },
  
  previewSettings: {
    enabled: true,
    secret: process.env.CMS_PREVIEW_SECRET || 'preview-secret-key'
  },
  
  searchSettings: {
    enabled: true,
    provider: 'local',
    indexFields: ['title', 'description', 'content', 'shortDescription']
  },
  
  backupSettings: {
    enabled: true,
    frequency: 'daily',
    retention: 30,
    path: '/backups'
  }
};

// Content validation utilities
export class ContentValidator {
  private config: z.infer<typeof CMSConfigSchema>;

  constructor(config: z.infer<typeof CMSConfigSchema>) {
    this.config = config;
  }

  /**
   * Validate content against type schema
   */
  validateContent(type: string, content: any): { valid: boolean; errors: string[] } {
    const contentType = this.config.contentTypes.find(ct => ct.name === type);
    if (!contentType) {
      return { valid: false, errors: [`Content type '${type}' not found`] };
    }

    const errors: string[] = [];

    // Check required fields
    if (contentType.validation?.required) {
      for (const requiredField of contentType.validation.required) {
        if (!content[requiredField]) {
          errors.push(`Field '${requiredField}' is required`);
        }
      }
    }

    // Check field validation rules
    for (const field of contentType.fields) {
      const value = content[field.id];
      
      if (field.required && !value) {
        errors.push(`Field '${field.id}' is required`);
        continue;
      }

      if (value && field.validation) {
        // String length validation
        if (field.validation.min && typeof value === 'string' && value.length < field.validation.min) {
          errors.push(`Field '${field.id}' must be at least ${field.validation.min} characters`);
        }
        
        if (field.validation.max && typeof value === 'string' && value.length > field.validation.max) {
          errors.push(`Field '${field.id}' must be no more than ${field.validation.max} characters`);
        }

        // Pattern validation
        if (field.validation.pattern && typeof value === 'string') {
          const regex = new RegExp(field.validation.pattern);
          if (!regex.test(value)) {
            errors.push(`Field '${field.id}' does not match required pattern`);
          }
        }

        // Options validation
        if (field.validation.options && !field.validation.options.includes(value)) {
          errors.push(`Field '${field.id}' must be one of: ${field.validation.options.join(', ')}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get content type configuration
   */
  getContentType(type: string): z.infer<typeof ContentTypeConfigSchema> | null {
    return this.config.contentTypes.find(ct => ct.name === type) || null;
  }

  /**
   * Get all content types
   */
  getContentTypes(): z.infer<typeof ContentTypeConfigSchema>[] {
    return this.config.contentTypes;
  }
}

// Export types
export type CMSConfig = z.infer<typeof CMSConfigSchema>;
export type ContentTypeConfig = z.infer<typeof ContentTypeConfigSchema>;
export type ContentField = z.infer<typeof ContentFieldSchema>;

// Export validator instance
export const contentValidator = new ContentValidator(defaultCMSConfig);