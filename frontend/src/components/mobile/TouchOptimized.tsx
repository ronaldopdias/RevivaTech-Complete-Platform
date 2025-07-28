'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion, PanInfo, useAnimation } from 'framer-motion';

// Enhanced Button with Touch Feedback
interface TouchButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  haptic?: 'light' | 'medium' | 'heavy';
}

export function TouchButton({ 
  children, 
  onClick, 
  className = '', 
  variant = 'primary',
  size = 'md',
  disabled = false,
  haptic = 'light'
}: TouchButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  const handlePress = () => {
    if (disabled) return;
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      const vibrationMap = {
        light: 10,
        medium: 20,
        heavy: 30
      };
      navigator.vibrate(vibrationMap[haptic]);
    }
    
    setIsPressed(true);
    onClick?.();
    
    // Reset press state
    setTimeout(() => setIsPressed(false), 150);
  };

  const variants = {
    primary: 'bg-primary-500 text-white shadow-lg shadow-primary-500/25',
    secondary: 'bg-secondary-500 text-white shadow-lg shadow-secondary-500/25',
    ghost: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm min-h-[36px]',
    md: 'px-6 py-3 text-base min-h-[44px]',
    lg: 'px-8 py-4 text-lg min-h-[52px]'
  };

  return (
    <motion.button
      className={`
        ${variants[variant]}
        ${sizes[size]}
        rounded-xl font-semibold
        transition-all duration-200 ease-out
        touch-manipulation select-none
        flex items-center justify-center
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}
        ${className}
      `}
      onTouchStart={handlePress}
      onClick={handlePress}
      disabled={disabled}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      animate={{
        boxShadow: isPressed 
          ? '0 4px 20px rgba(0, 0, 0, 0.15)' 
          : '0 8px 30px rgba(0, 0, 0, 0.1)'
      }}
    >
      {children}
    </motion.button>
  );
}

// Swipeable Card Component
interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  className?: string;
  swipeThreshold?: number;
}

export function SwipeableCard({ 
  children, 
  onSwipeLeft, 
  onSwipeRight, 
  className = '',
  swipeThreshold = 100 
}: SwipeableCardProps) {
  const controls = useAnimation();
  const [isExiting, setIsExiting] = useState(false);

  const handleDragEnd = useCallback((event: any, info: PanInfo) => {
    const { offset, velocity } = info;
    
    if (Math.abs(offset.x) > swipeThreshold || Math.abs(velocity.x) > 500) {
      setIsExiting(true);
      
      if (offset.x > 0) {
        // Swiped right
        controls.start({ 
          x: window.innerWidth,
          rotate: 30,
          opacity: 0,
          transition: { duration: 0.3 }
        });
        setTimeout(() => onSwipeRight?.(), 300);
      } else {
        // Swiped left
        controls.start({ 
          x: -window.innerWidth,
          rotate: -30,
          opacity: 0,
          transition: { duration: 0.3 }
        });
        setTimeout(() => onSwipeLeft?.(), 300);
      }
      
      // Haptic feedback for swipe action
      if ('vibrate' in navigator) {
        navigator.vibrate([20, 50, 20]);
      }
    } else {
      // Snap back to original position
      controls.start({ 
        x: 0, 
        rotate: 0,
        transition: { type: 'spring', damping: 20 }
      });
    }
  }, [controls, onSwipeLeft, onSwipeRight, swipeThreshold]);

  return (
    <motion.div
      className={`
        touch-manipulation select-none cursor-grab active:cursor-grabbing
        ${className}
      `}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
      animate={controls}
      whileDrag={{ 
        scale: 1.05,
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
        zIndex: 10
      }}
    >
      {children}
    </motion.div>
  );
}

// Pull to Refresh Component
interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
}

export function PullToRefresh({ onRefresh, children, className = '' }: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePan = useCallback((event: any, info: PanInfo) => {
    const { offset } = info;
    
    // Only allow pull down when at top of page
    if (window.scrollY === 0 && offset.y > 0) {
      const distance = Math.min(offset.y, 100);
      setPullDistance(distance);
    }
  }, []);

  const handlePanEnd = useCallback(async (event: any, info: PanInfo) => {
    const { offset } = info;
    
    if (offset.y > 60 && window.scrollY === 0) {
      setIsRefreshing(true);
      
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate([10, 20, 10]);
      }
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [onRefresh]);

  const refreshThreshold = pullDistance > 60;

  return (
    <motion.div
      ref={containerRef}
      className={`relative ${className}`}
      onPan={handlePan}
      onPanEnd={handlePanEnd}
    >
      {/* Pull to Refresh Indicator */}
      <motion.div
        className="
          absolute top-0 left-1/2 transform -translate-x-1/2
          flex flex-col items-center justify-center
          w-12 h-12 -mt-6 z-10
        "
        initial={{ opacity: 0, y: -20 }}
        animate={{ 
          opacity: pullDistance > 20 ? 1 : 0,
          y: pullDistance > 20 ? 0 : -20,
          scale: refreshThreshold ? 1.2 : 1
        }}
      >
        <motion.div
          className={`
            w-8 h-8 rounded-full border-2 border-t-transparent
            ${refreshThreshold ? 'border-primary-500' : 'border-gray-300'}
            ${isRefreshing ? 'animate-spin' : ''}
          `}
          animate={{ 
            rotate: isRefreshing ? 360 : pullDistance * 3.6,
          }}
          transition={{ 
            rotate: isRefreshing 
              ? { duration: 1, repeat: Infinity, ease: 'linear' }
              : { duration: 0 }
          }}
        />
        
        <span className="text-xs text-gray-500 mt-1">
          {isRefreshing 
            ? 'Refreshing...' 
            : refreshThreshold 
              ? 'Release to refresh' 
              : 'Pull to refresh'
          }
        </span>
      </motion.div>

      {/* Content */}
      <motion.div
        animate={{ y: pullDistance * 0.5 }}
        transition={{ type: 'spring', damping: 30 }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

// Touch Gesture Wrapper
interface TouchGestureProps {
  children: React.ReactNode;
  onTap?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
  className?: string;
}

export function TouchGesture({ 
  children, 
  onTap, 
  onDoubleTap, 
  onLongPress, 
  className = '' 
}: TouchGestureProps) {
  const [tapCount, setTapCount] = useState(0);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);

  const handleTouchStart = useCallback(() => {
    if (onLongPress) {
      const timer = setTimeout(() => {
        onLongPress();
        // Haptic feedback for long press
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
      }, 500);
      setLongPressTimer(timer);
    }
  }, [onLongPress]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }

    setTapCount(prev => prev + 1);
    
    setTimeout(() => {
      setTapCount(current => {
        if (current === 1) {
          onTap?.();
        } else if (current === 2) {
          onDoubleTap?.();
        }
        return 0;
      });
    }, 300);
  }, [longPressTimer, onTap, onDoubleTap]);

  return (
    <div
      className={`touch-manipulation select-none ${className}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
    >
      {children}
    </div>
  );
}

export default {
  TouchButton,
  SwipeableCard,
  PullToRefresh,
  TouchGesture
};