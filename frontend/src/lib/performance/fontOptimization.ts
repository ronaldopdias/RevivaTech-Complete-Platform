/**
 * Font Loading Optimization
 * Phase 3: Performance Excellence - Font optimization and CLS reduction
 */

import { useState, useEffect } from 'react';

export interface FontConfig {
  family: string;
  weights: number[];
  styles: ('normal' | 'italic')[];
  display: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
  preload: boolean;
  fallback: string[];
}

export interface FontMetrics {
  ascent: number;
  descent: number;
  lineGap: number;
  unitsPerEm: number;
  xHeight: number;
  capHeight: number;
}

// Font configurations for optimal performance
export const fontConfigs: Record<string, FontConfig> = {
  'SF Pro Display': {
    family: 'SF Pro Display',
    weights: [400, 500, 600, 700],
    styles: ['normal'],
    display: 'swap',
    preload: true,
    fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif']
  },
  'SF Pro Text': {
    family: 'SF Pro Text',
    weights: [400, 500, 600],
    styles: ['normal', 'italic'],
    display: 'swap',
    preload: true,
    fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif']
  },
  'Inter': {
    family: 'Inter',
    weights: [300, 400, 500, 600, 700],
    styles: ['normal'],
    display: 'swap',
    preload: true,
    fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif']
  }
};

// Font metrics for size-adjust calculations
export const fontMetrics: Record<string, FontMetrics> = {
  'SF Pro Display': {
    ascent: 1950,
    descent: -494,
    lineGap: 0,
    unitsPerEm: 2048,
    xHeight: 1062,
    capHeight: 1443
  },
  'SF Pro Text': {
    ascent: 1950,
    descent: -494,
    lineGap: 0,
    unitsPerEm: 2048,
    xHeight: 1062,
    capHeight: 1443
  },
  'Inter': {
    ascent: 2728,
    descent: -680,
    lineGap: 0,
    unitsPerEm: 2816,
    xHeight: 1536,
    capHeight: 2048
  }
};

// Calculate size-adjust values to minimize CLS
export function calculateSizeAdjust(
  primaryFont: string,
  fallbackFont: string = 'Arial'
): number {
  const primary = fontMetrics[primaryFont];
  const fallback = fontMetrics[fallbackFont] || fontMetrics['Inter'];

  if (!primary) return 1;

  // Calculate the size adjustment ratio
  const primaryRatio = primary.ascent / primary.unitsPerEm;
  const fallbackRatio = fallback.ascent / fallback.unitsPerEm;

  return primaryRatio / fallbackRatio;
}

// Generate font-face CSS with optimizations
export function generateFontFaceCSS(config: FontConfig): string {
  const { family, weights, styles, display, fallback } = config;
  let css = '';

  // Generate @font-face declarations
  // Local font loading disabled - using Google Fonts instead
  // weights.forEach(weight => {
  //   styles.forEach(style => {
  //     css += `
  // @font-face {
  //   font-family: '${family}';
  //   font-style: ${style};
  //   font-weight: ${weight};
  //   font-display: ${display};
  //   src: url('/fonts/${family.replace(/\s+/g, '-').toLowerCase()}-${weight}${style === 'italic' ? '-italic' : ''}.woff2') format('woff2'),
  //        url('/fonts/${family.replace(/\s+/g, '-').toLowerCase()}-${weight}${style === 'italic' ? '-italic' : ''}.woff') format('woff');
  // }`;
  //   });
  // });

  // Generate fallback font stack with size adjustment
  const sizeAdjust = calculateSizeAdjust(family);
  const fallbackStack = fallback.join(', ');
  
  css += `
@font-face {
  font-family: '${family} Fallback';
  font-style: normal;
  font-weight: 400;
  src: local('${fallback[0]}');
  ascent-override: ${(fontMetrics[family]?.ascent || 1950) / (fontMetrics[family]?.unitsPerEm || 2048) * 100}%;
  descent-override: ${Math.abs(fontMetrics[family]?.descent || -494) / (fontMetrics[family]?.unitsPerEm || 2048) * 100}%;
  line-gap-override: ${(fontMetrics[family]?.lineGap || 0) / (fontMetrics[family]?.unitsPerEm || 2048) * 100}%;
  size-adjust: ${sizeAdjust * 100}%;
}`;

  return css;
}

// Font loading service
export class FontLoadingService {
  private static instance: FontLoadingService;
  private loadedFonts: Set<string> = new Set();
  private loadingPromises: Map<string, Promise<void>> = new Map();

  static getInstance(): FontLoadingService {
    if (!FontLoadingService.instance) {
      FontLoadingService.instance = new FontLoadingService();
    }
    return FontLoadingService.instance;
  }

  /**
   * Preload critical fonts
   */
  async preloadCriticalFonts(): Promise<void> {
    const criticalFonts = Object.entries(fontConfigs)
      .filter(([_, config]) => config.preload)
      .map(([name, config]) => ({ name, config }));

    const promises = criticalFonts.map(({ name, config }) => {
      // Preload the primary weight first
      return this.loadFont(name, 400);
    });

    await Promise.all(promises);
  }

  /**
   * Load a specific font
   */
  async loadFont(fontFamily: string, weight: number = 400): Promise<void> {
    const fontKey = `${fontFamily}-${weight}`;
    
    if (this.loadedFonts.has(fontKey)) {
      return;
    }

    if (this.loadingPromises.has(fontKey)) {
      return this.loadingPromises.get(fontKey);
    }

    const promise = new Promise<void>((resolve, reject) => {
      if (typeof window === 'undefined') {
        resolve();
        return;
      }

      const config = fontConfigs[fontFamily];
      if (!config) {
        reject(new Error(`Font configuration not found: ${fontFamily}`));
        return;
      }

      // Local font preloading disabled - relying on Google Fonts
      // Immediately resolve as fonts are loaded via Google Fonts
      this.loadedFonts.add(fontKey);
      resolve();
      
      // Original local font loading code (disabled):
      // const fontUrl = `/fonts/${fontFamily.replace(/\s+/g, '-').toLowerCase()}-${weight}.woff2`;
      // 
      // // Use Font Loading API if available
      // if ('FontFace' in window) {
      //   const fontFace = new FontFace(fontFamily, `url(${fontUrl})`);
      //   fontFace.load().then(() => {
      //     (document as any).fonts.add(fontFace);
      //     this.loadedFonts.add(fontKey);
      //     resolve();
      //   }).catch(reject);
      // } else {
      //   // Fallback to CSS-based loading
      //   const link = document.createElement('link');
      //   link.rel = 'preload';
      //   link.href = fontUrl;
      //   link.as = 'font';
      //   link.type = 'font/woff2';
      //   link.crossOrigin = 'anonymous';
      //   
      //   link.onload = () => {
      //     this.loadedFonts.add(fontKey);
      //     resolve();
      //   };
      //   
      //   link.onerror = () => reject(new Error(`Failed to load font: ${fontUrl}`));
      //   
      //   document.head.appendChild(link);
      // }
    });

    this.loadingPromises.set(fontKey, promise);
    return promise;
  }

  /**
   * Check if font is loaded
   */
  isFontLoaded(fontFamily: string, weight: number = 400): boolean {
    return this.loadedFonts.has(`${fontFamily}-${weight}`);
  }

  /**
   * Get loaded fonts
   */
  getLoadedFonts(): string[] {
    return Array.from(this.loadedFonts);
  }

  /**
   * Optimize font loading for specific component
   */
  optimizeForComponent(
    componentName: string,
    requiredFonts: Array<{ family: string; weight: number }>
  ): void {
    // Load fonts with priorities
    const criticalFonts = requiredFonts.filter(font => 
      fontConfigs[font.family]?.preload
    );
    
    const nonCriticalFonts = requiredFonts.filter(font => 
      !fontConfigs[font.family]?.preload
    );

    // Load critical fonts immediately
    criticalFonts.forEach(({ family, weight }) => {
      this.loadFont(family, weight);
    });

    // Load non-critical fonts with delay
    setTimeout(() => {
      nonCriticalFonts.forEach(({ family, weight }) => {
        this.loadFont(family, weight);
      });
    }, 1000);
  }
}

// Font optimization hook
export function useFontOptimization(
  fonts: Array<{ family: string; weight: number }>,
  immediate: boolean = false
) {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const fontService = FontLoadingService.getInstance();

  useEffect(() => {
    const loadFonts = async () => {
      try {
        await Promise.all(
          fonts.map(({ family, weight }) => fontService.loadFont(family, weight))
        );
        setFontsLoaded(true);
      } catch (error) {
        console.error('Font loading failed:', error);
      }
    };

    if (immediate) {
      loadFonts();
    } else {
      // Use requestIdleCallback for non-critical fonts
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        window.requestIdleCallback(loadFonts, { timeout: 3000 });
      } else {
        setTimeout(loadFonts, 100);
      }
    }
  }, [fonts, immediate]);

  return {
    fontsLoaded,
    loadFont: fontService.loadFont.bind(fontService),
    isFontLoaded: fontService.isFontLoaded.bind(fontService)
  };
}

// Generate CSS variables for font stacks
export function generateFontVariables(): string {
  let css = ':root {\n';
  
  Object.entries(fontConfigs).forEach(([name, config]) => {
    const fallbackStack = config.fallback.join(', ');
    const varName = `--font-${name.replace(/\s+/g, '-').toLowerCase()}`;
    css += `  ${varName}: '${name}', '${name} Fallback', ${fallbackStack};\n`;
  });
  
  css += '}\n';
  return css;
}

// Export singleton instance
export const fontLoadingService = FontLoadingService.getInstance();