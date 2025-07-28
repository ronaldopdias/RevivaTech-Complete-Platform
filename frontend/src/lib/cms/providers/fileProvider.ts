/**
 * File-based Content Provider
 * Phase 4: Content Management System - File system provider implementation
 */

import { readFile, writeFile, readdir, mkdir, stat } from 'fs/promises';
import { join, extname } from 'path';
import { ContentProvider, ContentFilters, ContentVersion, BaseContent } from '../contentProvider';

export class FileContentProvider implements ContentProvider {
  name = 'file';
  type = 'file' as const;
  private basePath: string;
  private encoding: BufferEncoding = 'utf-8';

  constructor(basePath: string = 'content') {
    this.basePath = basePath;
  }

  /**
   * Get content by ID
   */
  async getContent<T>(type: string, id: string, locale = 'en'): Promise<T | null> {
    try {
      const filePath = this.getContentPath(type, id, locale);
      const content = await readFile(filePath, this.encoding);
      return JSON.parse(content);
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        return null; // File doesn't exist
      }
      throw error;
    }
  }

  /**
   * Get content by slug
   */
  async getContentBySlug<T>(type: string, slug: string, locale = 'en'): Promise<T | null> {
    try {
      const typeDir = join(this.basePath, type);
      const files = await readdir(typeDir);
      
      for (const file of files) {
        if (extname(file) === '.json') {
          const filePath = join(typeDir, file);
          const content = await readFile(filePath, this.encoding);
          const parsedContent = JSON.parse(content) as BaseContent;
          
          if (parsedContent.slug === slug && parsedContent.locale === locale) {
            return parsedContent as T;
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error(`Error getting content by slug ${type}:${slug}:`, error);
      return null;
    }
  }

  /**
   * Get content list with filtering
   */
  async getContentList<T>(type: string, filters: ContentFilters = {}): Promise<T[]> {
    try {
      const typeDir = join(this.basePath, type);
      
      // Ensure directory exists
      try {
        await stat(typeDir);
      } catch {
        return []; // Directory doesn't exist
      }

      const files = await readdir(typeDir);
      const contents: T[] = [];

      for (const file of files) {
        if (extname(file) === '.json') {
          try {
            const filePath = join(typeDir, file);
            const content = await readFile(filePath, this.encoding);
            const parsedContent = JSON.parse(content) as BaseContent;
            
            // Apply filters
            if (this.matchesFilters(parsedContent, filters)) {
              contents.push(parsedContent as T);
            }
          } catch (error) {
            console.warn(`Error reading file ${file}:`, error);
          }
        }
      }

      // Sort results
      if (filters.orderBy) {
        contents.sort((a, b) => {
          const aValue = (a as any)[filters.orderBy!];
          const bValue = (b as any)[filters.orderBy!];
          
          if (filters.orderDirection === 'desc') {
            return bValue > aValue ? 1 : -1;
          }
          return aValue > bValue ? 1 : -1;
        });
      }

      // Apply pagination
      let result = contents;
      if (filters.offset) {
        result = result.slice(filters.offset);
      }
      if (filters.limit) {
        result = result.slice(0, filters.limit);
      }

      return result;
    } catch (error) {
      console.error(`Error getting content list ${type}:`, error);
      return [];
    }
  }

  /**
   * Create new content
   */
  async createContent<T>(type: string, content: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const id = this.generateId();
    const now = new Date();
    
    const newContent = {
      ...content,
      id,
      createdAt: now,
      updatedAt: now
    } as T;

    await this.ensureDirectory(type);
    const filePath = this.getContentPath(type, id, (content as any).locale || 'en');
    await writeFile(filePath, JSON.stringify(newContent, null, 2), this.encoding);

    return newContent;
  }

  /**
   * Update existing content
   */
  async updateContent<T>(type: string, id: string, content: Partial<T>): Promise<T> {
    const existing = await this.getContent<T>(type, id);
    if (!existing) {
      throw new Error(`Content ${type}:${id} not found`);
    }

    const updatedContent = {
      ...existing,
      ...content,
      updatedAt: new Date()
    };

    const filePath = this.getContentPath(type, id, (existing as any).locale || 'en');
    await writeFile(filePath, JSON.stringify(updatedContent, null, 2), this.encoding);

    return updatedContent;
  }

  /**
   * Delete content
   */
  async deleteContent(type: string, id: string): Promise<boolean> {
    try {
      // For file provider, we need to check all possible locales
      const typeDir = join(this.basePath, type);
      const files = await readdir(typeDir);
      
      for (const file of files) {
        const filePath = join(typeDir, file);
        if (file.startsWith(`${id}.`) || file.startsWith(`${id}_`)) {
          const { unlink } = await import('fs/promises');
          await unlink(filePath);
        }
      }
      
      return true;
    } catch (error) {
      console.error(`Error deleting content ${type}:${id}:`, error);
      return false;
    }
  }

  /**
   * Publish content
   */
  async publishContent(type: string, id: string): Promise<boolean> {
    try {
      const content = await this.getContent(type, id);
      if (!content) return false;

      await this.updateContent(type, id, {
        status: 'published',
        publishedAt: new Date()
      });

      return true;
    } catch (error) {
      console.error(`Error publishing content ${type}:${id}:`, error);
      return false;
    }
  }

  /**
   * Unpublish content
   */
  async unpublishContent(type: string, id: string): Promise<boolean> {
    try {
      const content = await this.getContent(type, id);
      if (!content) return false;

      await this.updateContent(type, id, {
        status: 'draft',
        publishedAt: undefined
      });

      return true;
    } catch (error) {
      console.error(`Error unpublishing content ${type}:${id}:`, error);
      return false;
    }
  }

  /**
   * Duplicate content
   */
  async duplicateContent<T>(type: string, id: string): Promise<T> {
    const original = await this.getContent<T>(type, id);
    if (!original) {
      throw new Error(`Content ${type}:${id} not found`);
    }

    const { id: _, createdAt, updatedAt, ...contentData } = original as any;
    
    return this.createContent<T>(type, {
      ...contentData,
      title: `${contentData.title} (Copy)`,
      slug: `${contentData.slug}-copy`,
      status: 'draft'
    });
  }

  /**
   * Get content versions (simplified for file provider)
   */
  async getContentVersions(type: string, id: string): Promise<ContentVersion[]> {
    // For file provider, we'll keep a simple versions directory
    try {
      const versionsDir = join(this.basePath, type, 'versions', id);
      const files = await readdir(versionsDir);
      const versions: ContentVersion[] = [];

      for (const file of files) {
        if (extname(file) === '.json') {
          const filePath = join(versionsDir, file);
          const content = await readFile(filePath, this.encoding);
          const parsedContent = JSON.parse(content);
          
          versions.push({
            version: parseInt(file.split('.')[0]),
            content: parsedContent,
            createdAt: new Date(parsedContent.createdAt),
            createdBy: parsedContent.createdBy
          });
        }
      }

      return versions.sort((a, b) => b.version - a.version);
    } catch {
      return [];
    }
  }

  /**
   * Restore content version
   */
  async restoreContentVersion(type: string, id: string, version: number): Promise<boolean> {
    try {
      const versionsDir = join(this.basePath, type, 'versions', id);
      const versionFile = join(versionsDir, `${version}.json`);
      
      const versionContent = await readFile(versionFile, this.encoding);
      const parsedContent = JSON.parse(versionContent);
      
      // Save current version first
      await this.saveVersion(type, id);
      
      // Restore the version
      await this.updateContent(type, id, parsedContent);
      
      return true;
    } catch (error) {
      console.error(`Error restoring version ${version} for ${type}:${id}:`, error);
      return false;
    }
  }

  /**
   * Cache management (no-op for file provider)
   */
  async invalidateCache(): Promise<void> {
    // File provider doesn't use external cache
  }

  async warmCache(): Promise<void> {
    // File provider doesn't use external cache
  }

  // Private helper methods

  private getContentPath(type: string, id: string, locale: string): string {
    return join(this.basePath, type, `${id}_${locale}.json`);
  }

  private async ensureDirectory(type: string): Promise<void> {
    const typeDir = join(this.basePath, type);
    try {
      await stat(typeDir);
    } catch {
      await mkdir(typeDir, { recursive: true });
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private matchesFilters(content: BaseContent, filters: ContentFilters): boolean {
    // Status filter
    if (filters.status && !filters.status.includes(content.status)) {
      return false;
    }

    // Locale filter
    if (filters.locale && content.locale !== filters.locale) {
      return false;
    }

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const searchableText = [
        content.title,
        content.description,
        JSON.stringify(content.metadata)
      ].join(' ').toLowerCase();
      
      if (!searchableText.includes(searchTerm)) {
        return false;
      }
    }

    // Date filters
    if (filters.dateFrom && content.createdAt < filters.dateFrom) {
      return false;
    }

    if (filters.dateTo && content.createdAt > filters.dateTo) {
      return false;
    }

    return true;
  }

  private async saveVersion(type: string, id: string): Promise<void> {
    try {
      const content = await this.getContent(type, id);
      if (!content) return;

      const versionsDir = join(this.basePath, type, 'versions', id);
      await mkdir(versionsDir, { recursive: true });

      const versions = await this.getContentVersions(type, id);
      const nextVersion = (versions[0]?.version || 0) + 1;

      const versionFile = join(versionsDir, `${nextVersion}.json`);
      await writeFile(versionFile, JSON.stringify(content, null, 2), this.encoding);
    } catch (error) {
      console.error(`Error saving version for ${type}:${id}:`, error);
    }
  }
}