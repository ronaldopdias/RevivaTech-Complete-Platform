/**
 * Bundle Analysis and Performance Monitoring
 * Phase 3: Performance Excellence - Bundle size optimization
 */

export interface BundleAnalysisResult {
  totalSize: number;
  chunks: ChunkInfo[];
  recommendations: string[];
  performanceScore: number;
}

export interface ChunkInfo {
  name: string;
  size: number;
  type: 'initial' | 'async' | 'runtime';
  modules: string[];
  loadTime?: number;
}

export class BundleAnalyzer {
  private static instance: BundleAnalyzer;
  private performanceObserver: PerformanceObserver | null = null;
  private metrics: Map<string, number> = new Map();

  static getInstance(): BundleAnalyzer {
    if (!BundleAnalyzer.instance) {
      BundleAnalyzer.instance = new BundleAnalyzer();
    }
    return BundleAnalyzer.instance;
  }

  constructor() {
    this.initializePerformanceObserver();
  }

  private initializePerformanceObserver(): void {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            this.recordMetric('navigationStart', entry.startTime);
            this.recordMetric('loadComplete', entry.loadEventEnd);
          }
          if (entry.entryType === 'resource') {
            this.recordMetric(`resource_${entry.name}`, entry.duration);
          }
        });
      });

      this.performanceObserver.observe({ 
        entryTypes: ['navigation', 'resource', 'paint'] 
      });
    }
  }

  private recordMetric(name: string, value: number): void {
    this.metrics.set(name, value);
  }

  /**
   * Analyze current bundle performance
   */
  async analyzeBundle(): Promise<BundleAnalysisResult> {
    const chunks = await this.getChunkInfo();
    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
    const recommendations = this.generateRecommendations(chunks);
    const performanceScore = this.calculatePerformanceScore(chunks);

    return {
      totalSize,
      chunks,
      recommendations,
      performanceScore
    };
  }

  /**
   * Get information about loaded chunks
   */
  private async getChunkInfo(): Promise<ChunkInfo[]> {
    if (typeof window === 'undefined') return [];

    const chunks: ChunkInfo[] = [];
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

    // Analyze JavaScript chunks
    const jsResources = resources.filter(r => r.name.includes('.js'));
    
    for (const resource of jsResources) {
      const chunkName = this.extractChunkName(resource.name);
      const estimatedSize = this.estimateResourceSize(resource);
      
      chunks.push({
        name: chunkName,
        size: estimatedSize,
        type: this.determineChunkType(resource.name),
        modules: [], // Would require webpack manifest in production
        loadTime: resource.duration
      });
    }

    return chunks;
  }

  private extractChunkName(url: string): string {
    const match = url.match(/\/([^\/]+)\.js$/);
    return match ? match[1] : url;
  }

  private estimateResourceSize(resource: PerformanceResourceTiming): number {
    // Use transferSize if available, otherwise estimate from timing
    return resource.transferSize || Math.max(resource.duration * 1000, 10000);
  }

  private determineChunkType(url: string): 'initial' | 'async' | 'runtime' {
    if (url.includes('runtime')) return 'runtime';
    if (url.includes('async') || url.includes('lazy')) return 'async';
    return 'initial';
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(chunks: ChunkInfo[]): string[] {
    const recommendations: string[] = [];
    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);

    // Large bundle warning
    if (totalSize > 1000000) { // 1MB
      recommendations.push('🚨 Bundle size is over 1MB. Consider code splitting.');
    }

    // Large chunks detection
    const largeChunks = chunks.filter(chunk => chunk.size > 250000); // 250KB
    if (largeChunks.length > 0) {
      recommendations.push(`📦 ${largeChunks.length} chunks are over 250KB. Consider dynamic imports.`);
    }

    // Too many chunks warning
    if (chunks.length > 10) {
      recommendations.push('⚠️ Too many chunks may affect HTTP/2 performance.');
    }

    // Async loading suggestions
    const initialChunks = chunks.filter(chunk => chunk.type === 'initial');
    if (initialChunks.length > 3) {
      recommendations.push('🔄 Consider making some initial chunks load asynchronously.');
    }

    return recommendations;
  }

  /**
   * Calculate performance score (0-100)
   */
  private calculatePerformanceScore(chunks: ChunkInfo[]): number {
    let score = 100;
    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);

    // Size penalty
    if (totalSize > 500000) score -= 20; // 500KB threshold
    if (totalSize > 1000000) score -= 30; // 1MB threshold

    // Chunk count penalty
    if (chunks.length > 8) score -= 10;
    if (chunks.length > 15) score -= 20;

    // Load time penalty
    const slowChunks = chunks.filter(chunk => chunk.loadTime && chunk.loadTime > 1000);
    score -= slowChunks.length * 5;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get Core Web Vitals metrics
   */
  getCoreWebVitals(): Record<string, number> {
    const vitals: Record<string, number> = {};

    // Largest Contentful Paint (LCP)
    const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
    if (lcpEntries.length > 0) {
      vitals.LCP = lcpEntries[lcpEntries.length - 1].startTime;
    }

    // First Input Delay (FID) - approximation
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigationEntry) {
      vitals.FID = navigationEntry.loadEventEnd - navigationEntry.loadEventStart;
    }

    // Cumulative Layout Shift (CLS) - would need layout-shift entries
    const layoutShiftEntries = performance.getEntriesByType('layout-shift');
    if (layoutShiftEntries.length > 0) {
      vitals.CLS = layoutShiftEntries.reduce((sum, entry) => sum + (entry as any).value, 0);
    }

    return vitals;
  }

  /**
   * Monitor performance in real-time
   */
  startPerformanceMonitoring(): void {
    if (typeof window === 'undefined') return;

    // Monitor bundle loading performance
    setInterval(() => {
      const analysis = this.analyzeBundle();
      analysis.then(result => {
        
        // Send metrics to analytics if needed
        if (result.performanceScore < 70) {
          console.warn('⚠️ Performance score below 70:', result.performanceScore);
        }
      });
    }, 30000); // Every 30 seconds
  }

  /**
   * Get current metrics
   */
  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }
}

// Export singleton instance
export const bundleAnalyzer = BundleAnalyzer.getInstance();

// React hook for easy integration
import { useEffect, useState } from 'react';

export function useBundleAnalysis() {
  const [stats, setStats] = useState<BundleAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const analyze = async () => {
      try {
        const bundleStats = await bundleAnalyzer.analyzeBundle();
        if (mounted) {
          setStats(bundleStats);
        }
      } catch (error) {
        console.error('Bundle analysis failed:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    analyze();
    return () => { mounted = false; };
  }, []);

  return { stats, isLoading, analyzer: bundleAnalyzer };
}