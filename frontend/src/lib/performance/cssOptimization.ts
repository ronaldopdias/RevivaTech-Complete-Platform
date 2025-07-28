/**
 * CSS Optimization and Delivery
 * Phase 3: Performance Excellence - CSS optimization and critical path rendering
 */

export interface CSSOptimizationOptions {
  inlineThreshold: number; // Inline CSS under this size (bytes)
  criticalPath: string[];  // Critical CSS selectors
  purgeCss: boolean;       // Remove unused CSS
  minify: boolean;         // Minify CSS
  prefetch: boolean;       // Prefetch non-critical CSS
}

export interface CSSAnalysis {
  totalSize: number;
  criticalSize: number;
  unusedSize: number;
  loadTime: number;
  renderBlocking: boolean;
}

// CSS optimization service
export class CSSOptimizationService {
  private static instance: CSSOptimizationService;
  private criticalCSS: string = '';
  private nonCriticalCSS: string[] = [];
  private loadedStylesheets: Set<string> = new Set();

  static getInstance(): CSSOptimizationService {
    if (!CSSOptimizationService.instance) {
      CSSOptimizationService.instance = new CSSOptimizationService();
    }
    return CSSOptimizationService.instance;
  }

  /**
   * Extract critical CSS for above-the-fold content
   */
  extractCriticalCSS(html: string, viewport: { width: number; height: number }): string {
    if (typeof window === 'undefined') return '';

    const criticalSelectors = this.identifyCriticalSelectors(html, viewport);
    const criticalCSS = this.generateCriticalCSS(criticalSelectors);
    
    this.criticalCSS = criticalCSS;
    return criticalCSS;
  }

  /**
   * Identify critical CSS selectors
   */
  private identifyCriticalSelectors(html: string, viewport: { width: number; height: number }): string[] {
    const criticalSelectors: string[] = [];
    
    // Parse HTML to find elements above the fold
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Create a temporary container to measure elements
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.top = '-9999px';
    container.style.width = `${viewport.width}px`;
    container.innerHTML = html;
    document.body.appendChild(container);

    try {
      const elements = container.querySelectorAll('*');
      elements.forEach(element => {
        const rect = element.getBoundingClientRect();
        
        // Check if element is above the fold
        if (rect.top < viewport.height && rect.bottom > 0) {
          const selector = this.generateSelector(element);
          if (selector) {
            criticalSelectors.push(selector);
          }
        }
      });
    } finally {
      document.body.removeChild(container);
    }

    return criticalSelectors;
  }

  /**
   * Generate CSS selector for element
   */
  private generateSelector(element: Element): string | null {
    if (element.id) {
      return `#${element.id}`;
    }
    
    if (element.classList.length > 0) {
      return `.${Array.from(element.classList).join('.')}`;
    }
    
    return element.tagName.toLowerCase();
  }

  /**
   * Generate critical CSS from selectors
   */
  private generateCriticalCSS(selectors: string[]): string {
    let criticalCSS = '';
    
    // Get all stylesheets
    const stylesheets = Array.from(document.styleSheets);
    
    stylesheets.forEach(stylesheet => {
      try {
        const rules = Array.from(stylesheet.cssRules || []);
        
        rules.forEach(rule => {
          if (rule.type === CSSRule.STYLE_RULE) {
            const styleRule = rule as CSSStyleRule;
            
            // Check if this rule applies to critical selectors
            const isCritical = selectors.some(selector => 
              this.selectorMatches(styleRule.selectorText, selector)
            );
            
            if (isCritical) {
              criticalCSS += styleRule.cssText + '\n';
            }
          }
        });
      } catch (e) {
        // Handle cross-origin stylesheets
        console.warn('Cannot access stylesheet:', e);
      }
    });

    return criticalCSS;
  }

  /**
   * Check if selector matches critical selector
   */
  private selectorMatches(ruleSelector: string, criticalSelector: string): boolean {
    // Simple matching - can be enhanced with more sophisticated logic
    return ruleSelector.includes(criticalSelector);
  }

  /**
   * Inline critical CSS
   */
  inlineCriticalCSS(): void {
    if (typeof window === 'undefined') return;

    const existingStyle = document.getElementById('critical-css');
    if (existingStyle) {
      existingStyle.remove();
    }

    if (this.criticalCSS) {
      const style = document.createElement('style');
      style.id = 'critical-css';
      style.textContent = this.criticalCSS;
      document.head.insertBefore(style, document.head.firstChild);
    }
  }

  /**
   * Load non-critical CSS asynchronously
   */
  loadNonCriticalCSS(stylesheets: string[]): Promise<void[]> {
    const promises = stylesheets.map(href => this.loadStylesheet(href));
    return Promise.all(promises);
  }

  /**
   * Load stylesheet asynchronously
   */
  private loadStylesheet(href: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.loadedStylesheets.has(href)) {
        resolve();
        return;
      }

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.media = 'print'; // Load as print initially to prevent render blocking
      
      link.onload = () => {
        link.media = 'all'; // Switch to all media once loaded
        this.loadedStylesheets.add(href);
        resolve();
      };
      
      link.onerror = () => reject(new Error(`Failed to load stylesheet: ${href}`));
      
      document.head.appendChild(link);
    });
  }

  /**
   * Prefetch stylesheets
   */
  prefetchStylesheets(stylesheets: string[]): void {
    stylesheets.forEach(href => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = href;
      link.as = 'style';
      document.head.appendChild(link);
    });
  }

  /**
   * Analyze CSS performance
   */
  analyzeCSS(): CSSAnalysis {
    let totalSize = 0;
    let criticalSize = 0;
    let loadTime = 0;
    
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const cssResources = resources.filter(r => r.name.endsWith('.css'));
    
    cssResources.forEach(resource => {
      totalSize += resource.transferSize || 0;
      loadTime += resource.duration;
    });

    criticalSize = new Blob([this.criticalCSS]).size;
    
    return {
      totalSize,
      criticalSize,
      unusedSize: this.estimateUnusedCSS(),
      loadTime,
      renderBlocking: this.isRenderBlocking()
    };
  }

  /**
   * Estimate unused CSS
   */
  private estimateUnusedCSS(): number {
    // This is a simplified estimation
    // In a real implementation, you'd use tools like PurgeCSS
    const totalRules = this.countTotalCSSRules();
    const usedRules = this.countUsedCSSRules();
    
    return Math.max(0, totalRules - usedRules);
  }

  /**
   * Count total CSS rules
   */
  private countTotalCSSRules(): number {
    let count = 0;
    
    try {
      const stylesheets = Array.from(document.styleSheets);
      
      stylesheets.forEach(stylesheet => {
        try {
          const rules = Array.from(stylesheet.cssRules || []);
          count += rules.length;
        } catch (e) {
          // Handle cross-origin stylesheets
        }
      });
    } catch (e) {
      console.warn('Cannot count CSS rules:', e);
    }
    
    return count;
  }

  /**
   * Count used CSS rules
   */
  private countUsedCSSRules(): number {
    // This is a simplified implementation
    // In reality, you'd need to check if selectors match DOM elements
    return Math.floor(this.countTotalCSSRules() * 0.7); // Estimate 70% usage
  }

  /**
   * Check if CSS is render blocking
   */
  private isRenderBlocking(): boolean {
    const links = document.querySelectorAll('link[rel="stylesheet"]');
    return Array.from(links).some(link => 
      !(link as HTMLLinkElement).media || 
      (link as HTMLLinkElement).media === 'all'
    );
  }

  /**
   * Optimize CSS delivery
   */
  optimizeDelivery(options: CSSOptimizationOptions): void {
    // Extract and inline critical CSS
    if (options.criticalPath.length > 0) {
      const viewport = { width: window.innerWidth, height: window.innerHeight };
      this.extractCriticalCSS(document.documentElement.outerHTML, viewport);
      this.inlineCriticalCSS();
    }

    // Load non-critical CSS asynchronously
    const nonCriticalLinks = document.querySelectorAll(
      'link[rel="stylesheet"]:not([data-critical])'
    );
    
    nonCriticalLinks.forEach(link => {
      const href = (link as HTMLLinkElement).href;
      link.remove();
      this.loadStylesheet(href);
    });

    // Prefetch future stylesheets
    if (options.prefetch) {
      this.prefetchStylesheets(this.nonCriticalCSS);
    }
  }

  /**
   * Remove unused CSS
   */
  removeUnusedCSS(): void {
    // This would require a more sophisticated implementation
    // For now, we'll just log the analysis
    const analysis = this.analyzeCSS();
    console.log('CSS Analysis:', analysis);
  }
}

// CSS optimization hook
export function useCSSOptimization(options: Partial<CSSOptimizationOptions> = {}) {
  const service = CSSOptimizationService.getInstance();
  
  const defaultOptions: CSSOptimizationOptions = {
    inlineThreshold: 1024,
    criticalPath: [],
    purgeCss: true,
    minify: true,
    prefetch: true,
    ...options
  };

  useEffect(() => {
    // Optimize on mount
    service.optimizeDelivery(defaultOptions);
  }, []);

  return {
    optimizeDelivery: (opts: CSSOptimizationOptions) => service.optimizeDelivery(opts),
    analyzeCSS: () => service.analyzeCSS(),
    inlineCriticalCSS: () => service.inlineCriticalCSS(),
    loadNonCriticalCSS: (stylesheets: string[]) => service.loadNonCriticalCSS(stylesheets)
  };
}

// Generate critical CSS configuration
export function generateCriticalCSSConfig(routes: string[]): string {
  return `
module.exports = {
  // Critical CSS configuration
  criticalCSS: {
    base: {
      css: 'src/app/globals.css',
      dimensions: [
        { width: 1920, height: 1080 },
        { width: 1366, height: 768 },
        { width: 375, height: 667 }
      ]
    },
    routes: ${JSON.stringify(routes.map(route => ({
      url: route,
      template: `src/app${route}/page.tsx`
    })), null, 2)}
  }
}`;
}

// Export singleton instance
export const cssOptimizationService = CSSOptimizationService.getInstance();