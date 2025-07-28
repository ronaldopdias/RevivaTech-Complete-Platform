/**
 * Headless CMS Provider
 * Phase 4: Content Management System - Headless CMS integration (Strapi, Contentful, etc.)
 */

import { ContentProvider, ContentFilters, ContentVersion, BaseContent } from '../contentProvider';

export interface HeadlessCMSConfig {
  apiUrl: string;
  apiKey?: string;
  token?: string;
  space?: string; // For Contentful
  environment?: string;
  timeout?: number;
  retries?: number;
}

export class HeadlessContentProvider implements ContentProvider {
  name = 'headless';
  type = 'api' as const;
  private config: HeadlessCMSConfig;
  private baseHeaders: Record<string, string>;

  constructor(config: HeadlessCMSConfig) {
    this.config = {
      timeout: 10000,
      retries: 3,
      environment: 'master',
      ...config
    };

    this.baseHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    // Set authentication headers
    if (this.config.token) {
      this.baseHeaders['Authorization'] = `Bearer ${this.config.token}`;
    } else if (this.config.apiKey) {
      this.baseHeaders['X-API-Key'] = this.config.apiKey;
    }
  }

  /**
   * Get content by ID
   */
  async getContent<T>(type: string, id: string, locale = 'en'): Promise<T | null> {
    try {
      const url = this.buildUrl(`/${type}/${id}`, { locale });
      const response = await this.makeRequest('GET', url);
      
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return this.transformResponse(data);
    } catch (error) {
      console.error(`Error getting content ${type}:${id}:`, error);
      return null;
    }
  }

  /**
   * Get content by slug
   */
  async getContentBySlug<T>(type: string, slug: string, locale = 'en'): Promise<T | null> {
    try {
      const url = this.buildUrl(`/${type}`, { 
        locale,
        'filters[slug][$eq]': slug,
        'pagination[limit]': '1'
      });
      
      const response = await this.makeRequest('GET', url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const items = this.extractItems(data);
      
      return items.length > 0 ? this.transformResponse(items[0]) : null;
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
      const queryParams = this.buildQueryParams(filters);
      const url = this.buildUrl(`/${type}`, queryParams);
      
      const response = await this.makeRequest('GET', url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const items = this.extractItems(data);
      
      return items.map(item => this.transformResponse(item));
    } catch (error) {
      console.error(`Error getting content list ${type}:`, error);
      return [];
    }
  }

  /**
   * Create new content
   */
  async createContent<T>(type: string, content: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    try {
      const url = this.buildUrl(`/${type}`);
      const payload = {
        data: this.transformRequest(content)
      };

      const response = await this.makeRequest('POST', url, payload);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return this.transformResponse(this.extractItem(data));
    } catch (error) {
      console.error(`Error creating content ${type}:`, error);
      throw error;
    }
  }

  /**
   * Update existing content
   */
  async updateContent<T>(type: string, id: string, content: Partial<T>): Promise<T> {
    try {
      const url = this.buildUrl(`/${type}/${id}`);
      const payload = {
        data: this.transformRequest(content)
      };

      const response = await this.makeRequest('PUT', url, payload);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return this.transformResponse(this.extractItem(data));
    } catch (error) {
      console.error(`Error updating content ${type}:${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete content
   */
  async deleteContent(type: string, id: string): Promise<boolean> {
    try {
      const url = this.buildUrl(`/${type}/${id}`);
      const response = await this.makeRequest('DELETE', url);
      
      return response.ok;
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
      const url = this.buildUrl(`/${type}/${id}/actions/publish`);
      const response = await this.makeRequest('POST', url);
      
      return response.ok;
    } catch (error) {
      // Fallback: update status field
      try {
        await this.updateContent(type, id, {
          status: 'published',
          publishedAt: new Date()
        } as Partial<any>);
        return true;
      } catch {
        console.error(`Error publishing content ${type}:${id}:`, error);
        return false;
      }
    }
  }

  /**
   * Unpublish content
   */
  async unpublishContent(type: string, id: string): Promise<boolean> {
    try {
      const url = this.buildUrl(`/${type}/${id}/actions/unpublish`);
      const response = await this.makeRequest('POST', url);
      
      return response.ok;
    } catch (error) {
      // Fallback: update status field
      try {
        await this.updateContent(type, id, {
          status: 'draft'
        } as Partial<any>);
        return true;
      } catch {
        console.error(`Error unpublishing content ${type}:${id}:`, error);
        return false;
      }
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
   * Get content versions
   */
  async getContentVersions(type: string, id: string): Promise<ContentVersion[]> {
    try {
      const url = this.buildUrl(`/${type}/${id}/versions`);
      const response = await this.makeRequest('GET', url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const versions = this.extractItems(data);
      
      return versions.map(version => ({
        version: version.versionNumber || version.version,
        content: this.transformResponse(version),
        createdAt: new Date(version.createdAt),
        createdBy: version.createdBy?.email || version.createdBy,
        changelog: version.changelog
      }));
    } catch (error) {
      console.warn(`Versions not supported for ${type}:${id}:`, error);
      return [];
    }
  }

  /**
   * Restore content version
   */
  async restoreContentVersion(type: string, id: string, version: number): Promise<boolean> {
    try {
      const url = this.buildUrl(`/${type}/${id}/versions/${version}/restore`);
      const response = await this.makeRequest('POST', url);
      
      return response.ok;
    } catch (error) {
      console.error(`Error restoring version ${version} for ${type}:${id}:`, error);
      return false;
    }
  }

  /**
   * Invalidate cache
   */
  async invalidateCache(type?: string, id?: string): Promise<void> {
    try {
      let url = '/cache/invalidate';
      if (type && id) {
        url += `?type=${type}&id=${id}`;
      } else if (type) {
        url += `?type=${type}`;
      }
      
      const response = await this.makeRequest('POST', this.buildUrl(url));
      
      if (!response.ok) {
        console.warn('Cache invalidation failed:', response.statusText);
      }
    } catch (error) {
      console.warn('Cache invalidation not supported:', error);
    }
  }

  /**
   * Warm cache
   */
  async warmCache(type?: string): Promise<void> {
    try {
      let url = '/cache/warm';
      if (type) {
        url += `?type=${type}`;
      }
      
      const response = await this.makeRequest('POST', this.buildUrl(url));
      
      if (!response.ok) {
        console.warn('Cache warming failed:', response.statusText);
      }
    } catch (error) {
      console.warn('Cache warming not supported:', error);
    }
  }

  // Private helper methods

  private buildUrl(path: string, params?: Record<string, any>): string {
    let url = `${this.config.apiUrl}/api${path}`;
    
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
      
      if (searchParams.toString()) {
        url += `?${searchParams.toString()}`;
      }
    }
    
    return url;
  }

  private buildQueryParams(filters: ContentFilters): Record<string, any> {
    const params: Record<string, any> = {};

    if (filters.locale) {
      params.locale = filters.locale;
    }

    if (filters.status) {
      params['filters[status][$in]'] = filters.status.join(',');
    }

    if (filters.search) {
      params['filters[$or][0][title][$containsi]'] = filters.search;
      params['filters[$or][1][description][$containsi]'] = filters.search;
    }

    if (filters.category) {
      params['filters[category][$eq]'] = filters.category;
    }

    if (filters.tags && filters.tags.length > 0) {
      params['filters[tags][$in]'] = filters.tags.join(',');
    }

    if (filters.dateFrom) {
      params['filters[createdAt][$gte]'] = filters.dateFrom.toISOString();
    }

    if (filters.dateTo) {
      params['filters[createdAt][$lte]'] = filters.dateTo.toISOString();
    }

    if (filters.limit) {
      params['pagination[limit]'] = filters.limit;
    }

    if (filters.offset) {
      params['pagination[start]'] = filters.offset;
    }

    if (filters.orderBy) {
      const direction = filters.orderDirection === 'desc' ? 'desc' : 'asc';
      params.sort = `${filters.orderBy}:${direction}`;
    }

    // Populate relations
    params.populate = '*';

    return params;
  }

  private async makeRequest(
    method: string, 
    url: string, 
    body?: any,
    retryCount = 0
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: this.baseHeaders,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (retryCount < (this.config.retries || 0)) {
        await this.delay(Math.pow(2, retryCount) * 1000); // Exponential backoff
        return this.makeRequest(method, url, body, retryCount + 1);
      }
      
      throw error;
    }
  }

  private transformResponse(data: any): any {
    if (!data) return data;

    // Handle Strapi v4 format
    if (data.attributes) {
      return {
        id: data.id,
        ...data.attributes,
        createdAt: new Date(data.attributes.createdAt),
        updatedAt: new Date(data.attributes.updatedAt)
      };
    }

    // Handle Contentful format
    if (data.fields) {
      return {
        id: data.sys.id,
        ...data.fields,
        createdAt: new Date(data.sys.createdAt),
        updatedAt: new Date(data.sys.updatedAt)
      };
    }

    // Handle generic format
    if (typeof data.createdAt === 'string') {
      data.createdAt = new Date(data.createdAt);
    }
    if (typeof data.updatedAt === 'string') {
      data.updatedAt = new Date(data.updatedAt);
    }

    return data;
  }

  private transformRequest(data: any): any {
    const { createdAt, updatedAt, ...cleanData } = data;
    return cleanData;
  }

  private extractItems(response: any): any[] {
    // Strapi v4 format
    if (response.data && Array.isArray(response.data)) {
      return response.data;
    }

    // Contentful format
    if (response.items && Array.isArray(response.items)) {
      return response.items;
    }

    // Direct array
    if (Array.isArray(response)) {
      return response;
    }

    return [];
  }

  private extractItem(response: any): any {
    // Strapi v4 format
    if (response.data && !Array.isArray(response.data)) {
      return response.data;
    }

    return response;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}