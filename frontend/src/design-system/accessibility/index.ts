/**
 * Design System V2 - Accessibility System
 * Comprehensive accessibility utilities and compliance checking
 */

import { colorUtils } from '../tokens/colors';

// WCAG 2.1 AA compliance levels
export type AccessibilityLevel = 'AA' | 'AAA' | 'fail';

// Accessibility interface
export interface AccessibilityResult {
  isAccessible: boolean;
  level: AccessibilityLevel;
  contrastRatio: number;
  recommendations?: string[];
}

// Color contrast utilities
export const contrastUtils = {
  // Calculate luminance for contrast calculation
  getLuminance: (color: string): number => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    
    const gamma = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    
    return 0.2126 * gamma(r) + 0.7152 * gamma(g) + 0.0722 * gamma(b);
  },
  
  // Calculate contrast ratio between two colors
  getContrastRatio: (color1: string, color2: string): number => {
    const lum1 = contrastUtils.getLuminance(color1);
    const lum2 = contrastUtils.getLuminance(color2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    
    return (brightest + 0.05) / (darkest + 0.05);
  },
  
  // Check if color combination meets WCAG standards
  checkContrast: (
    foreground: string,
    background: string,
    fontSize: 'normal' | 'large' = 'normal'
  ): AccessibilityResult => {
    const ratio = contrastUtils.getContrastRatio(foreground, background);
    
    // WCAG 2.1 contrast requirements
    const normalTextAA = 4.5;
    const normalTextAAA = 7;
    const largeTextAA = 3;
    const largeTextAAA = 4.5;
    
    const requiredAA = fontSize === 'large' ? largeTextAA : normalTextAA;
    const requiredAAA = fontSize === 'large' ? largeTextAAA : normalTextAAA;
    
    let level: AccessibilityLevel = 'fail';
    let isAccessible = false;
    const recommendations: string[] = [];
    
    if (ratio >= requiredAAA) {
      level = 'AAA';
      isAccessible = true;
    } else if (ratio >= requiredAA) {
      level = 'AA';
      isAccessible = true;
    } else {
      recommendations.push(`Contrast ratio ${ratio.toFixed(2)} is below required ${requiredAA} for ${fontSize} text`);
      recommendations.push('Consider using a darker foreground or lighter background');
    }
    
    return {
      isAccessible,
      level,
      contrastRatio: ratio,
      recommendations: recommendations.length > 0 ? recommendations : undefined,
    };
  },
  
  // Find accessible color alternatives
  findAccessibleColor: (
    baseColor: string,
    targetBackground: string,
    fontSize: 'normal' | 'large' = 'normal'
  ): string => {
    const requiredRatio = fontSize === 'large' ? 3 : 4.5;
    
    // Try darkening the color
    let testColor = baseColor;
    let ratio = contrastUtils.getContrastRatio(testColor, targetBackground);
    
    if (ratio < requiredRatio) {
      // Try different darkness levels
      for (let darkness = 10; darkness <= 90; darkness += 10) {
        testColor = colorUtils.alpha(baseColor, darkness / 100);
        ratio = contrastUtils.getContrastRatio(testColor, targetBackground);
        
        if (ratio >= requiredRatio) {
          return testColor;
        }
      }
    }
    
    return baseColor; // Return original if no accessible alternative found
  },
};

// Keyboard navigation utilities
export const keyboardUtils = {
  // Key codes for common navigation
  KEYS: {
    ENTER: 'Enter',
    SPACE: ' ',
    ESCAPE: 'Escape',
    TAB: 'Tab',
    ARROW_UP: 'ArrowUp',
    ARROW_DOWN: 'ArrowDown',
    ARROW_LEFT: 'ArrowLeft',
    ARROW_RIGHT: 'ArrowRight',
    HOME: 'Home',
    END: 'End',
    PAGE_UP: 'PageUp',
    PAGE_DOWN: 'PageDown',
  },
  
  // Check if element is focusable
  isFocusable: (element: HTMLElement): boolean => {
    const focusableElements = [
      'A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'IFRAME',
      'OBJECT', 'EMBED', 'AREA', 'AUDIO', 'VIDEO'
    ];
    
    if (focusableElements.includes(element.tagName)) {
      return true;
    }
    
    if (element.hasAttribute('tabindex') && element.getAttribute('tabindex') !== '-1') {
      return true;
    }
    
    return false;
  },
  
  // Get all focusable elements within a container
  getFocusableElements: (container: HTMLElement): HTMLElement[] => {
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'iframe',
      'object',
      'embed',
      'area[href]',
      'audio[controls]',
      'video[controls]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');
    
    return Array.from(container.querySelectorAll(selector)) as HTMLElement[];
  },
  
  // Create roving tabindex manager
  createRovingTabindex: (container: HTMLElement, options: {
    orientation?: 'horizontal' | 'vertical' | 'both';
    wrap?: boolean;
    activateOnFocus?: boolean;
  } = {}) => {
    const { orientation = 'both', wrap = true, activateOnFocus = false } = options;
    const elements = keyboardUtils.getFocusableElements(container);
    let currentIndex = 0;
    
    // Set initial tabindex
    elements.forEach((element, index) => {
      element.setAttribute('tabindex', index === 0 ? '0' : '-1');
    });
    
    const moveFocus = (direction: 'next' | 'previous') => {
      const increment = direction === 'next' ? 1 : -1;
      let newIndex = currentIndex + increment;
      
      if (wrap) {
        newIndex = (newIndex + elements.length) % elements.length;
      } else {
        newIndex = Math.max(0, Math.min(elements.length - 1, newIndex));
      }
      
      elements[currentIndex].setAttribute('tabindex', '-1');
      elements[newIndex].setAttribute('tabindex', '0');
      elements[newIndex].focus();
      
      if (activateOnFocus) {
        elements[newIndex].click();
      }
      
      currentIndex = newIndex;
    };
    
    const handleKeyDown = (event: KeyboardEvent) => {
      const { key } = event;
      
      if (orientation === 'horizontal' || orientation === 'both') {
        if (key === keyboardUtils.KEYS.ARROW_RIGHT) {
          event.preventDefault();
          moveFocus('next');
        } else if (key === keyboardUtils.KEYS.ARROW_LEFT) {
          event.preventDefault();
          moveFocus('previous');
        }
      }
      
      if (orientation === 'vertical' || orientation === 'both') {
        if (key === keyboardUtils.KEYS.ARROW_DOWN) {
          event.preventDefault();
          moveFocus('next');
        } else if (key === keyboardUtils.KEYS.ARROW_UP) {
          event.preventDefault();
          moveFocus('previous');
        }
      }
      
      if (key === keyboardUtils.KEYS.HOME) {
        event.preventDefault();
        currentIndex = 0;
        elements.forEach((element, index) => {
          element.setAttribute('tabindex', index === 0 ? '0' : '-1');
        });
        elements[0].focus();
      } else if (key === keyboardUtils.KEYS.END) {
        event.preventDefault();
        currentIndex = elements.length - 1;
        elements.forEach((element, index) => {
          element.setAttribute('tabindex', index === elements.length - 1 ? '0' : '-1');
        });
        elements[elements.length - 1].focus();
      }
    };
    
    container.addEventListener('keydown', handleKeyDown);
    
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  },
};

// Screen reader utilities
export const screenReaderUtils = {
  // Announce message to screen readers
  announce: (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.textContent = message;
    
    document.body.appendChild(announcer);
    
    // Clean up after announcement
    setTimeout(() => {
      document.body.removeChild(announcer);
    }, 1000);
  },
  
  // Create screen reader only text
  createSROnlyText: (text: string): HTMLElement => {
    const span = document.createElement('span');
    span.className = 'sr-only';
    span.textContent = text;
    return span;
  },
  
  // Check if element has accessible name
  hasAccessibleName: (element: HTMLElement): boolean => {
    const ariaLabel = element.getAttribute('aria-label');
    const ariaLabelledBy = element.getAttribute('aria-labelledby');
    const title = element.getAttribute('title');
    
    if (ariaLabel && ariaLabel.trim()) return true;
    if (ariaLabelledBy) {
      const labelElement = document.getElementById(ariaLabelledBy);
      return labelElement && labelElement.textContent?.trim() !== '';
    }
    if (title && title.trim()) return true;
    
    // Check for associated label
    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') {
      const id = element.getAttribute('id');
      if (id) {
        const label = document.querySelector(`label[for="${id}"]`);
        return label && label.textContent?.trim() !== '';
      }
    }
    
    return false;
  },
  
  // Get accessible name
  getAccessibleName: (element: HTMLElement): string => {
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel;
    
    const ariaLabelledBy = element.getAttribute('aria-labelledby');
    if (ariaLabelledBy) {
      const labelElement = document.getElementById(ariaLabelledBy);
      return labelElement?.textContent?.trim() || '';
    }
    
    const title = element.getAttribute('title');
    if (title) return title;
    
    // Check for associated label
    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') {
      const id = element.getAttribute('id');
      if (id) {
        const label = document.querySelector(`label[for="${id}"]`);
        return label?.textContent?.trim() || '';
      }
    }
    
    return element.textContent?.trim() || '';
  },
};

// Focus management utilities
export const focusUtils = {
  // Focus trap for modals and dropdowns
  createFocusTrap: (container: HTMLElement) => {
    const focusableElements = keyboardUtils.getFocusableElements(container);
    
    if (focusableElements.length === 0) {
      return () => {};
    }
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === keyboardUtils.KEYS.TAB) {
        if (event.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };
    
    container.addEventListener('keydown', handleKeyDown);
    
    // Focus first element
    firstElement.focus();
    
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  },
  
  // Save and restore focus
  saveFocus: () => {
    const activeElement = document.activeElement as HTMLElement;
    
    return () => {
      if (activeElement && activeElement.focus) {
        activeElement.focus();
      }
    };
  },
  
  // Check if element is visible and focusable
  isVisible: (element: HTMLElement): boolean => {
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0' &&
           element.offsetWidth > 0 &&
           element.offsetHeight > 0;
  },
};

// Motion preferences
export const motionUtils = {
  // Check if user prefers reduced motion
  prefersReducedMotion: (): boolean => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },
  
  // Apply motion-safe class conditionally
  applyMotionSafe: (element: HTMLElement, animation: string) => {
    if (!motionUtils.prefersReducedMotion()) {
      element.classList.add(animation);
    }
  },
  
  // Create motion-aware animation
  createMotionAwareAnimation: (
    element: HTMLElement,
    keyframes: Keyframe[],
    options: KeyframeAnimationOptions
  ): Animation | null => {
    if (motionUtils.prefersReducedMotion()) {
      return null;
    }
    
    return element.animate(keyframes, options);
  },
};

// Accessibility audit utilities
export const auditUtils = {
  // Audit page for accessibility issues
  auditPage: (): {
    errors: string[];
    warnings: string[];
    passed: string[];
  } => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const passed: string[] = [];
    
    // Check for missing alt text on images
    const images = document.querySelectorAll('img');
    images.forEach((img, index) => {
      if (!img.getAttribute('alt')) {
        errors.push(`Image ${index + 1} missing alt text`);
      } else {
        passed.push(`Image ${index + 1} has alt text`);
      }
    });
    
    // Check for missing labels on form elements
    const formElements = document.querySelectorAll('input, select, textarea');
    formElements.forEach((element, index) => {
      if (!screenReaderUtils.hasAccessibleName(element as HTMLElement)) {
        errors.push(`Form element ${index + 1} missing accessible name`);
      } else {
        passed.push(`Form element ${index + 1} has accessible name`);
      }
    });
    
    // Check for heading structure
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let previousLevel = 0;
    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1));
      if (level > previousLevel + 1) {
        warnings.push(`Heading level skip: ${heading.tagName} after h${previousLevel}`);
      }
      previousLevel = level;
    });
    
    // Check for color contrast (simplified)
    const buttons = document.querySelectorAll('button');
    buttons.forEach((button, index) => {
      const style = window.getComputedStyle(button);
      const bgColor = style.backgroundColor;
      const textColor = style.color;
      
      if (bgColor && textColor) {
        const result = contrastUtils.checkContrast(textColor, bgColor);
        if (!result.isAccessible) {
          errors.push(`Button ${index + 1} has insufficient color contrast`);
        } else {
          passed.push(`Button ${index + 1} has adequate color contrast`);
        }
      }
    });
    
    return { errors, warnings, passed };
  },
  
  // Generate accessibility report
  generateReport: () => {
    const audit = auditUtils.auditPage();
    
    return {
      score: (audit.passed.length / (audit.errors.length + audit.warnings.length + audit.passed.length)) * 100,
      issues: audit.errors.length + audit.warnings.length,
      ...audit,
    };
  },
};

// CSS utility classes for accessibility
export const accessibilityClasses = {
  // Screen reader only
  srOnly: 'sr-only',
  
  // Skip links
  skipLink: 'absolute left-[-10000px] top-auto w-1 h-1 overflow-hidden focus:left-6 focus:top-6 focus:w-auto focus:h-auto focus:overflow-visible focus:z-50',
  
  // Focus visible
  focusVisible: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
  
  // High contrast support
  highContrast: 'supports-[color-scheme:dark]:dark:border-white supports-[color-scheme:light]:light:border-black',
  
  // Reduced motion support
  reducedMotion: 'motion-reduce:animate-none motion-reduce:transition-none',
  
  // Touch targets
  touchTarget: 'min-h-[44px] min-w-[44px]',
  
  // ARIA live regions
  liveRegion: 'sr-only aria-live-polite',
  assertiveLiveRegion: 'sr-only aria-live-assertive',
};

// Export all accessibility utilities
export {
  contrastUtils,
  keyboardUtils,
  screenReaderUtils,
  focusUtils,
  motionUtils,
  auditUtils,
  accessibilityClasses,
};

// Default export
export default {
  contrast: contrastUtils,
  keyboard: keyboardUtils,
  screenReader: screenReaderUtils,
  focus: focusUtils,
  motion: motionUtils,
  audit: auditUtils,
  classes: accessibilityClasses,
};