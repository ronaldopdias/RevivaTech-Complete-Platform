/**
 * Translation Management System
 * Phase 4: Content Management System - Multi-language content management
 */

import { z } from 'zod';
import { contentService } from './contentProvider';
import { Locale } from './contentProvider';

// Translation status
export const TranslationStatusSchema = z.enum([
  'pending',
  'in_progress',
  'review',
  'approved',
  'published'
]);

// Translation entry
export const TranslationEntrySchema = z.object({
  id: z.string(),
  contentType: z.string(),
  contentId: z.string(),
  sourceLocale: z.string(),
  targetLocale: z.string(),
  fieldId: z.string(),
  sourceValue: z.any(),
  translatedValue: z.any().optional(),
  status: TranslationStatusSchema,
  translatorId: z.string().optional(),
  reviewerId: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  completedAt: z.date().optional()
});

// Translation job
export const TranslationJobSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  contentType: z.string(),
  contentId: z.string(),
  sourceLocale: z.string(),
  targetLocales: z.array(z.string()),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  deadline: z.date().optional(),
  assignedTo: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'review', 'completed', 'cancelled']),
  progress: z.number().min(0).max(100).default(0),
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  completedAt: z.date().optional(),
  entries: z.array(TranslationEntrySchema)
});

// Translation configuration
export const TranslationConfigSchema = z.object({
  defaultLocale: z.string(),
  supportedLocales: z.array(z.string()),
  fallbackLocale: z.string(),
  autoTranslate: z.boolean().default(false),
  requireReview: z.boolean().default(true),
  translationProviders: z.array(z.object({
    name: z.string(),
    apiKey: z.string().optional(),
    endpoint: z.string().optional(),
    enabled: z.boolean().default(false)
  }))
});

export type TranslationStatus = z.infer<typeof TranslationStatusSchema>;
export type TranslationEntry = z.infer<typeof TranslationEntrySchema>;
export type TranslationJob = z.infer<typeof TranslationJobSchema>;
export type TranslationConfig = z.infer<typeof TranslationConfigSchema>;

// Translation manager class
export class TranslationManager {
  private static instance: TranslationManager;
  private config: TranslationConfig;
  private jobs: Map<string, TranslationJob> = new Map();
  private entries: Map<string, TranslationEntry> = new Map();

  static getInstance(config?: TranslationConfig): TranslationManager {
    if (!TranslationManager.instance) {
      TranslationManager.instance = new TranslationManager(config || defaultTranslationConfig);
    }
    return TranslationManager.instance;
  }

  constructor(config: TranslationConfig) {
    this.config = config;
  }

  /**
   * Create a translation job for content
   */
  async createTranslationJob(
    contentType: string,
    contentId: string,
    targetLocales: string[],
    options: {
      title?: string;
      description?: string;
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      deadline?: Date;
      assignedTo?: string;
      createdBy: string;
    }
  ): Promise<TranslationJob> {
    // Get source content
    const sourceContent = await contentService.getContent(
      contentType, 
      contentId, 
      this.config.defaultLocale
    );

    if (!sourceContent) {
      throw new Error(`Content not found: ${contentType}:${contentId}`);
    }

    // Create job
    const jobId = this.generateId();
    const now = new Date();

    const job: TranslationJob = {
      id: jobId,
      title: options.title || `Translate ${(sourceContent as any).title || contentType}`,
      description: options.description,
      contentType,
      contentId,
      sourceLocale: this.config.defaultLocale,
      targetLocales,
      priority: options.priority || 'medium',
      deadline: options.deadline,
      assignedTo: options.assignedTo,
      status: 'pending',
      progress: 0,
      createdBy: options.createdBy,
      createdAt: now,
      updatedAt: now,
      entries: []
    };

    // Create translation entries for translatable fields
    const translatableFields = await this.getTranslatableFields(contentType, sourceContent);
    
    for (const field of translatableFields) {
      for (const targetLocale of targetLocales) {
        const entryId = this.generateId();
        const entry: TranslationEntry = {
          id: entryId,
          contentType,
          contentId,
          sourceLocale: this.config.defaultLocale,
          targetLocale,
          fieldId: field.path,
          sourceValue: field.value,
          status: 'pending',
          createdAt: now,
          updatedAt: now
        };

        this.entries.set(entryId, entry);
        job.entries.push(entry);
      }
    }

    this.jobs.set(jobId, job);

    // Auto-translate if enabled
    if (this.config.autoTranslate) {
      await this.autoTranslateJob(jobId);
    }

    return job;
  }

  /**
   * Update translation entry
   */
  async updateTranslationEntry(
    entryId: string,
    updates: {
      translatedValue?: any;
      status?: TranslationStatus;
      translatorId?: string;
      reviewerId?: string;
      notes?: string;
    }
  ): Promise<TranslationEntry> {
    const entry = this.entries.get(entryId);
    if (!entry) {
      throw new Error(`Translation entry not found: ${entryId}`);
    }

    const updatedEntry: TranslationEntry = {
      ...entry,
      ...updates,
      updatedAt: new Date(),
      completedAt: updates.status === 'approved' ? new Date() : entry.completedAt
    };

    this.entries.set(entryId, updatedEntry);

    // Update job progress
    const job = this.findJobByEntry(entryId);
    if (job) {
      await this.updateJobProgress(job.id);
    }

    return updatedEntry;
  }

  /**
   * Apply translations to content
   */
  async applyTranslations(jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Translation job not found: ${jobId}`);
    }

    const approvedEntries = job.entries.filter(entry => entry.status === 'approved');
    
    // Group entries by target locale
    const entriesByLocale = new Map<string, TranslationEntry[]>();
    
    for (const entry of approvedEntries) {
      const entries = entriesByLocale.get(entry.targetLocale) || [];
      entries.push(entry);
      entriesByLocale.set(entry.targetLocale, entries);
    }

    // Apply translations for each locale
    for (const [locale, entries] of entriesByLocale) {
      try {
        // Get existing content for target locale (if any)
        let targetContent = await contentService.getContent(
          job.contentType,
          job.contentId,
          locale
        );

        // If no target content exists, get source content as base
        if (!targetContent) {
          const sourceContent = await contentService.getContent(
            job.contentType,
            job.contentId,
            job.sourceLocale
          );
          
          if (sourceContent) {
            // Create new content for target locale
            const { id, createdAt, updatedAt, ...contentData } = sourceContent as any;
            targetContent = {
              ...contentData,
              locale,
              status: 'draft'
            };
          }
        }

        if (!targetContent) {
          console.error(`Failed to get base content for ${job.contentType}:${job.contentId}`);
          continue;
        }

        // Apply translations
        const updatedContent = { ...targetContent };
        
        for (const entry of entries) {
          if (entry.translatedValue !== undefined) {
            this.setNestedValue(updatedContent, entry.fieldId, entry.translatedValue);
          }
        }

        // Save updated content
        const existingTargetContent = await contentService.getContent(
          job.contentType,
          job.contentId,
          locale
        );

        if (existingTargetContent) {
          await contentService.updateContent(job.contentType, job.contentId, updatedContent);
        } else {
          await contentService.createContent(job.contentType, updatedContent);
        }

      } catch (error) {
        console.error(`Failed to apply translations for locale ${locale}:`, error);
        return false;
      }
    }

    // Update job status
    await this.updateJobStatus(jobId, 'completed');
    
    return true;
  }

  /**
   * Get translation job status
   */
  getTranslationJob(jobId: string): TranslationJob | null {
    return this.jobs.get(jobId) || null;
  }

  /**
   * Get all translation jobs
   */
  getTranslationJobs(filters?: {
    status?: string;
    contentType?: string;
    assignedTo?: string;
    targetLocale?: string;
  }): TranslationJob[] {
    let jobs = Array.from(this.jobs.values());

    if (filters) {
      if (filters.status) {
        jobs = jobs.filter(job => job.status === filters.status);
      }
      if (filters.contentType) {
        jobs = jobs.filter(job => job.contentType === filters.contentType);
      }
      if (filters.assignedTo) {
        jobs = jobs.filter(job => job.assignedTo === filters.assignedTo);
      }
      if (filters.targetLocale) {
        jobs = jobs.filter(job => job.targetLocales.includes(filters.targetLocale!));
      }
    }

    return jobs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get content with fallback locale
   */
  async getLocalizedContent<T>(
    contentType: string,
    id: string,
    locale: string
  ): Promise<T | null> {
    // Try to get content in requested locale
    let content = await contentService.getContent<T>(contentType, id, locale);
    
    if (content) {
      return content;
    }

    // Fallback to default locale
    if (locale !== this.config.defaultLocale) {
      content = await contentService.getContent<T>(contentType, id, this.config.defaultLocale);
      
      if (content) {
        return content;
      }
    }

    // Fallback to fallback locale if different from default
    if (
      locale !== this.config.fallbackLocale && 
      this.config.defaultLocale !== this.config.fallbackLocale
    ) {
      content = await contentService.getContent<T>(contentType, id, this.config.fallbackLocale);
    }

    return content;
  }

  /**
   * Check translation completeness
   */
  async getTranslationCompleteness(
    contentType: string,
    contentId: string
  ): Promise<Record<string, { completed: number; total: number; percentage: number }>> {
    const completeness: Record<string, { completed: number; total: number; percentage: number }> = {};

    for (const locale of this.config.supportedLocales) {
      if (locale === this.config.defaultLocale) {
        completeness[locale] = { completed: 1, total: 1, percentage: 100 };
        continue;
      }

      const content = await contentService.getContent(contentType, contentId, locale);
      const sourceContent = await contentService.getContent(
        contentType, 
        contentId, 
        this.config.defaultLocale
      );

      if (!sourceContent) {
        completeness[locale] = { completed: 0, total: 0, percentage: 0 };
        continue;
      }

      const translatableFields = await this.getTranslatableFields(contentType, sourceContent);
      const total = translatableFields.length;
      let completed = 0;

      if (content) {
        for (const field of translatableFields) {
          const translatedValue = this.getNestedValue(content, field.path);
          if (translatedValue && translatedValue !== field.value) {
            completed++;
          }
        }
      }

      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
      completeness[locale] = { completed, total, percentage };
    }

    return completeness;
  }

  // Private helper methods

  private async getTranslatableFields(
    contentType: string,
    content: any,
    path = ''
  ): Promise<Array<{ path: string; value: any }>> {
    const fields: Array<{ path: string; value: any }> = [];

    for (const [key, value] of Object.entries(content)) {
      const fieldPath = path ? `${path}.${key}` : key;
      
      if (typeof value === 'string' && value.trim()) {
        // Skip system fields
        if (!['id', 'createdAt', 'updatedAt', 'slug', 'status'].includes(key)) {
          fields.push({ path: fieldPath, value });
        }
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Recursively process nested objects
        const nestedFields = await this.getTranslatableFields(contentType, value, fieldPath);
        fields.push(...nestedFields);
      } else if (Array.isArray(value)) {
        // Process arrays
        value.forEach((item, index) => {
          if (typeof item === 'string' && item.trim()) {
            fields.push({ path: `${fieldPath}.${index}`, value: item });
          } else if (typeof item === 'object' && item !== null) {
            const nestedFields = this.getTranslatableFields(contentType, item, `${fieldPath}.${index}`);
            fields.push(...nestedFields);
          }
        });
      }
    }

    return fields;
  }

  private async autoTranslateJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) return;

    const enabledProvider = this.config.translationProviders.find(p => p.enabled);
    if (!enabledProvider) return;

    for (const entry of job.entries) {
      try {
        if (typeof entry.sourceValue === 'string') {
          const translatedValue = await this.translateText(
            entry.sourceValue,
            entry.sourceLocale,
            entry.targetLocale,
            enabledProvider
          );

          if (translatedValue) {
            await this.updateTranslationEntry(entry.id, {
              translatedValue,
              status: this.config.requireReview ? 'review' : 'approved'
            });
          }
        }
      } catch (error) {
        console.warn(`Auto-translation failed for entry ${entry.id}:`, error);
      }
    }
  }

  private async translateText(
    text: string,
    sourceLocale: string,
    targetLocale: string,
    provider: any
  ): Promise<string | null> {
    // Mock translation - replace with actual provider integration
    if (provider.name === 'mock') {
      return `[${targetLocale.toUpperCase()}] ${text}`;
    }

    // Implement actual translation provider integration here
    return null;
  }

  private async updateJobProgress(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) return;

    const total = job.entries.length;
    const completed = job.entries.filter(entry => 
      entry.status === 'approved' || entry.status === 'published'
    ).length;

    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    job.progress = progress;
    job.updatedAt = new Date();

    // Update job status based on progress
    if (progress === 100 && job.status !== 'completed') {
      job.status = 'review';
    } else if (progress > 0 && job.status === 'pending') {
      job.status = 'in_progress';
    }

    this.jobs.set(jobId, job);
  }

  private async updateJobStatus(
    jobId: string, 
    status: 'pending' | 'in_progress' | 'review' | 'completed' | 'cancelled'
  ): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = status;
    job.updatedAt = new Date();
    
    if (status === 'completed') {
      job.completedAt = new Date();
    }

    this.jobs.set(jobId, job);
  }

  private findJobByEntry(entryId: string): TranslationJob | null {
    for (const job of this.jobs.values()) {
      if (job.entries.some(entry => entry.id === entryId)) {
        return job;
      }
    }
    return null;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!(key in current)) {
        current[key] = {};
      }
      return current[key];
    }, obj);
    
    target[lastKey] = value;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Default translation configuration
export const defaultTranslationConfig: TranslationConfig = {
  defaultLocale: 'en',
  supportedLocales: ['en', 'pt'],
  fallbackLocale: 'en',
  autoTranslate: false,
  requireReview: true,
  translationProviders: [
    {
      name: 'mock',
      enabled: true
    }
  ]
};

// Export singleton instance
export const translationManager = TranslationManager.getInstance(defaultTranslationConfig);