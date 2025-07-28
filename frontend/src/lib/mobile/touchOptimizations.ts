'use client';

// RevivaTech Mobile Touch Optimizations
// Phase 6: Enhanced mobile experience with gesture handling and touch feedback

export interface TouchConfig {
  enableHapticFeedback: boolean;
  enableSwipeGestures: boolean;
  enableTouchFeedback: boolean;
  touchDelayMs: number;
  swipeThreshold: number;
  doubleTapDelay: number;
}

export interface SwipeEvent {
  direction: 'left' | 'right' | 'up' | 'down';
  distance: number;
  velocity: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

class MobileTouchOptimizer {
  private config: TouchConfig = {
    enableHapticFeedback: true,
    enableSwipeGestures: true,
    enableTouchFeedback: true,
    touchDelayMs: 50,
    swipeThreshold: 50,
    doubleTapDelay: 300
  };

  private swipeListeners: Array<{
    element: Element;
    callback: (event: SwipeEvent) => void;
    options?: { direction?: string; threshold?: number };
  }> = [];

  private touchStart: TouchPoint | null = null;
  private lastTap: TouchPoint | null = null;
  private isInitialized = false;

  initialize(config?: Partial<TouchConfig>): void {
    if (this.isInitialized) return;

    this.config = { ...this.config, ...config };
    this.setupGlobalTouchHandlers();
    this.optimizeTouchTargets();
    this.enableFastClick();
    this.setupViewportOptimizations();

    console.log('📱 TouchOptimizer: Initialized with config:', this.config);
    this.isInitialized = true;
  }

  // Public API for components
  addSwipeListener(
    element: Element, 
    callback: (event: SwipeEvent) => void,
    options?: { direction?: string; threshold?: number }
  ): () => void {
    const listener = { element, callback, options };
    this.swipeListeners.push(listener);

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        this.touchStart = {
          x: touch.clientX,
          y: touch.clientY,
          timestamp: Date.now()
        };
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!this.touchStart || e.changedTouches.length !== 1) return;

      const touch = e.changedTouches[0];
      const endPoint: TouchPoint = {
        x: touch.clientX,
        y: touch.clientY,
        timestamp: Date.now()
      };

      const swipeEvent = this.calculateSwipe(this.touchStart, endPoint);
      if (swipeEvent) {
        // Check if swipe meets criteria
        const threshold = options?.threshold || this.config.swipeThreshold;
        const direction = options?.direction;

        if (swipeEvent.distance >= threshold) {
          if (!direction || swipeEvent.direction === direction) {
            callback(swipeEvent);
          }
        }
      }

      this.touchStart = null;
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    // Return cleanup function
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
      const index = this.swipeListeners.indexOf(listener);
      if (index > -1) {
        this.swipeListeners.splice(index, 1);
      }
    };
  }

  // Haptic feedback for supported devices
  vibrate(pattern: number | number[] = 50): void {
    if (!this.config.enableHapticFeedback) return;

    try {
      if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    } catch (error) {
      // Vibration not supported or failed
      console.debug('Vibration not available:', error);
    }
  }

  // Visual touch feedback
  addTouchFeedback(element: Element, options?: {
    className?: string;
    duration?: number;
    haptic?: boolean;
  }): () => void {
    if (!this.config.enableTouchFeedback) return () => {};

    const {
      className = 'touch-feedback',
      duration = 150,
      haptic = true
    } = options || {};

    const handleTouchStart = (e: TouchEvent) => {
      if (haptic) {
        this.vibrate(25);
      }

      element.classList.add(className);
      
      // Add ripple effect
      this.createRippleEffect(element, e.touches[0]);
    };

    const handleTouchEnd = () => {
      setTimeout(() => {
        element.classList.remove(className);
      }, duration);
    };

    const handleTouchCancel = () => {
      element.classList.remove(className);
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    element.addEventListener('touchcancel', handleTouchCancel, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchCancel);
    };
  }

  // Double tap detection
  addDoubleTapListener(
    element: Element,
    callback: (e: TouchEvent) => void
  ): () => void {
    const handleTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length !== 1) return;

      const touch = e.changedTouches[0];
      const currentTap: TouchPoint = {
        x: touch.clientX,
        y: touch.clientY,
        timestamp: Date.now()
      };

      if (this.lastTap) {
        const timeDiff = currentTap.timestamp - this.lastTap.timestamp;
        const distance = Math.sqrt(
          Math.pow(currentTap.x - this.lastTap.x, 2) +
          Math.pow(currentTap.y - this.lastTap.y, 2)
        );

        if (timeDiff < this.config.doubleTapDelay && distance < 50) {
          this.vibrate([25, 25, 25]);
          callback(e);
          this.lastTap = null;
          return;
        }
      }

      this.lastTap = currentTap;
      setTimeout(() => {
        this.lastTap = null;
      }, this.config.doubleTapDelay);
    };

    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }

  // Long press detection
  addLongPressListener(
    element: Element,
    callback: (e: TouchEvent) => void,
    duration = 500
  ): () => void {
    let longPressTimer: NodeJS.Timeout | null = null;
    let startPoint: TouchPoint | null = null;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        startPoint = {
          x: touch.clientX,
          y: touch.clientY,
          timestamp: Date.now()
        };

        longPressTimer = setTimeout(() => {
          this.vibrate([50, 25, 50]);
          callback(e);
        }, duration);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (longPressTimer && startPoint && e.touches.length === 1) {
        const touch = e.touches[0];
        const distance = Math.sqrt(
          Math.pow(touch.clientX - startPoint.x, 2) +
          Math.pow(touch.clientY - startPoint.y, 2)
        );

        // Cancel long press if finger moves too much
        if (distance > 10) {
          clearTimeout(longPressTimer);
          longPressTimer = null;
        }
      }
    };

    const handleTouchEnd = () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
      startPoint = null;
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    element.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      if (longPressTimer) clearTimeout(longPressTimer);
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchEnd);
    };
  }

  // Pull to refresh functionality
  addPullToRefresh(
    element: Element,
    callback: () => Promise<void>,
    options?: { threshold?: number; iconElement?: Element }
  ): () => void {
    const threshold = options?.threshold || 100;
    let startY = 0;
    let currentY = 0;
    let isPulling = false;
    let isRefreshing = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (element.scrollTop === 0 && !isRefreshing) {
        startY = e.touches[0].clientY;
        isPulling = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling) return;

      currentY = e.touches[0].clientY;
      const pullDistance = currentY - startY;

      if (pullDistance > 0) {
        e.preventDefault();
        
        // Visual feedback
        if (options?.iconElement) {
          const rotation = Math.min(pullDistance * 2, 180);
          (options.iconElement as HTMLElement).style.transform = `rotate(${rotation}deg)`;
        }

        // Haptic feedback at threshold
        if (pullDistance >= threshold) {
          this.vibrate(25);
        }
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling) return;

      const pullDistance = currentY - startY;
      isPulling = false;

      if (pullDistance >= threshold && !isRefreshing) {
        isRefreshing = true;
        this.vibrate([50, 25, 50]);
        
        try {
          await callback();
        } finally {
          isRefreshing = false;
          if (options?.iconElement) {
            (options.iconElement as HTMLElement).style.transform = '';
          }
        }
      } else if (options?.iconElement) {
        (options.iconElement as HTMLElement).style.transform = '';
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }

  // Private helper methods

  private setupGlobalTouchHandlers(): void {
    // Prevent 300ms click delay
    document.addEventListener('touchstart', () => {}, { passive: true });

    // Add global touch styles
    this.injectTouchStyles();
  }

  private optimizeTouchTargets(): void {
    // Ensure touch targets are at least 44px
    const style = document.createElement('style');
    style.textContent = `
      .touch-target {
        min-height: 44px !important;
        min-width: 44px !important;
      }
      
      button, [role="button"], a, input, select, textarea {
        min-height: 44px;
        min-width: 44px;
      }
      
      @media (max-width: 768px) {
        button, [role="button"] {
          padding: 12px 16px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  private enableFastClick(): void {
    // Remove 300ms delay on touch devices
    if ('ontouchstart' in window) {
      document.body.style.touchAction = 'manipulation';
    }
  }

  private setupViewportOptimizations(): void {
    // Prevent zoom on input focus
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', 
        'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'
      );
    }

    // Prevent selection on touch
    document.body.style.webkitUserSelect = 'none';
    document.body.style.userSelect = 'none';
  }

  private calculateSwipe(start: TouchPoint, end: TouchPoint): SwipeEvent | null {
    const deltaX = end.x - start.x;
    const deltaY = end.y - start.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const duration = end.timestamp - start.timestamp;
    const velocity = distance / duration;

    if (distance < this.config.swipeThreshold) return null;

    let direction: 'left' | 'right' | 'up' | 'down';
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      direction = deltaX > 0 ? 'right' : 'left';
    } else {
      direction = deltaY > 0 ? 'down' : 'up';
    }

    return {
      direction,
      distance,
      velocity,
      startX: start.x,
      startY: start.y,
      endX: end.x,
      endY: end.y
    };
  }

  private createRippleEffect(element: Element, touch: Touch): void {
    const rect = element.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    const ripple = document.createElement('div');
    ripple.className = 'touch-ripple';
    ripple.style.cssText = `
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.3);
      transform: scale(0);
      animation: ripple-animation 0.6s ease-out;
      left: ${x - 25}px;
      top: ${y - 25}px;
      width: 50px;
      height: 50px;
      pointer-events: none;
      z-index: 1000;
    `;

    element.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 600);
  }

  private injectTouchStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes ripple-animation {
        to {
          transform: scale(4);
          opacity: 0;
        }
      }
      
      .touch-feedback {
        background-color: rgba(0, 0, 0, 0.05) !important;
        transform: scale(0.98);
      }
      
      .touch-target {
        position: relative;
        overflow: hidden;
      }
      
      /* Improve scrolling on iOS */
      .scroll-smooth {
        -webkit-overflow-scrolling: touch;
        overflow-scrolling: touch;
      }
      
      /* Remove tap highlights */
      * {
        -webkit-tap-highlight-color: transparent;
        -webkit-touch-callout: none;
      }
      
      /* Better button states */
      button:active, [role="button"]:active {
        transform: scale(0.98);
      }
    `;
    document.head.appendChild(style);
  }

  // Utility methods
  isTouchDevice(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  getConfig(): TouchConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<TouchConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Export singleton instance
export const touchOptimizer = new MobileTouchOptimizer();

// React hook for easy integration
import { useEffect, useRef } from 'react';

export function useTouchOptimizations(config?: Partial<TouchConfig>) {
  useEffect(() => {
    touchOptimizer.initialize(config);
  }, []);

  return touchOptimizer;
}

export function useSwipeGesture(
  callback: (event: SwipeEvent) => void,
  options?: { direction?: string; threshold?: number }
) {
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    return touchOptimizer.addSwipeListener(element, callback, options);
  }, [callback, options]);

  return elementRef;
}

export function useTouchFeedback(options?: {
  className?: string;
  duration?: number;
  haptic?: boolean;
}) {
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    return touchOptimizer.addTouchFeedback(element, options);
  }, [options]);

  return elementRef;
}

export function useDoubleTap(callback: (e: TouchEvent) => void) {
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    return touchOptimizer.addDoubleTapListener(element, callback);
  }, [callback]);

  return elementRef;
}