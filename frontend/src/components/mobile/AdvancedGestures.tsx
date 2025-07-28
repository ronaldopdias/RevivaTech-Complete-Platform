'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion, PanInfo, useAnimation } from 'framer-motion';

// Advanced Pinch-to-Zoom Component
interface PinchZoomProps {
  children: React.ReactNode;
  className?: string;
  minZoom?: number;
  maxZoom?: number;
  initialZoom?: number;
  onZoomChange?: (zoom: number) => void;
}

export function PinchZoom({ 
  children, 
  className = '',
  minZoom = 0.5,
  maxZoom = 3,
  initialZoom = 1,
  onZoomChange
}: PinchZoomProps) {
  const [zoom, setZoom] = useState(initialZoom);
  const [lastDistance, setLastDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();

  const getDistance = (touches: TouchList) => {
    if (touches.length < 2) return 0;
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const distance = getDistance(e.touches);
      setLastDistance(distance);
      
      // Haptic feedback for pinch start
      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastDistance > 0) {
      e.preventDefault();
      const distance = getDistance(e.touches);
      const scale = distance / lastDistance;
      const newZoom = Math.min(maxZoom, Math.max(minZoom, zoom * scale));
      
      setZoom(newZoom);
      setLastDistance(distance);
      onZoomChange?.(newZoom);
      
      controls.set({ scale: newZoom });
    }
  }, [lastDistance, zoom, minZoom, maxZoom, onZoomChange, controls]);

  const handleTouchEnd = useCallback(() => {
    setLastDistance(0);
  }, []);

  const handleDoubleClick = useCallback(() => {
    const newZoom = zoom > 1 ? 1 : 2;
    setZoom(newZoom);
    onZoomChange?.(newZoom);
    
    controls.start({ 
      scale: newZoom,
      transition: { duration: 0.3, ease: 'easeOut' }
    });
    
    // Haptic feedback for double tap zoom
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 20, 10]);
    }
  }, [zoom, controls, onZoomChange]);

  return (
    <motion.div
      ref={containerRef}
      className={`touch-manipulation select-none overflow-hidden ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onDoubleClick={handleDoubleClick}
      animate={controls}
      style={{ cursor: zoom > 1 ? 'grab' : 'default' }}
    >
      {children}
    </motion.div>
  );
}

// Multi-Directional Swipe Component
interface MultiSwipeProps {
  children: React.ReactNode;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  className?: string;
  threshold?: number;
}

export function MultiSwipe({
  children,
  onSwipeUp,
  onSwipeDown,
  onSwipeLeft,
  onSwipeRight,
  className = '',
  threshold = 50
}: MultiSwipeProps) {
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [isTracking, setIsTracking] = useState(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setStartPoint({ x: touch.clientX, y: touch.clientY });
    setIsTracking(true);
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isTracking) return;
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - startPoint.x;
    const deltaY = touch.clientY - startPoint.y;
    
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    
    if (absDeltaX > threshold || absDeltaY > threshold) {
      // Determine primary direction
      if (absDeltaX > absDeltaY) {
        // Horizontal swipe
        if (deltaX > 0) {
          onSwipeRight?.();
        } else {
          onSwipeLeft?.();
        }
      } else {
        // Vertical swipe
        if (deltaY > 0) {
          onSwipeDown?.();
        } else {
          onSwipeUp?.();
        }
      }
      
      // Haptic feedback for swipe
      if ('vibrate' in navigator) {
        navigator.vibrate(15);
      }
    }
    
    setIsTracking(false);
  }, [startPoint, threshold, onSwipeUp, onSwipeDown, onSwipeLeft, onSwipeRight, isTracking]);

  return (
    <div
      className={`touch-manipulation ${className}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  );
}

// Rotation Gesture Component
interface RotationGestureProps {
  children: React.ReactNode;
  onRotate?: (angle: number) => void;
  className?: string;
  snapAngles?: number[];
}

export function RotationGesture({
  children,
  onRotate,
  className = '',
  snapAngles = [0, 90, 180, 270]
}: RotationGestureProps) {
  const [rotation, setRotation] = useState(0);
  const [lastAngle, setLastAngle] = useState(0);
  const [isRotating, setIsRotating] = useState(false);
  const controls = useAnimation();

  const getAngle = (touches: TouchList) => {
    if (touches.length < 2) return 0;
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.atan2(
      touch2.clientY - touch1.clientY,
      touch2.clientX - touch1.clientX
    ) * (180 / Math.PI);
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const angle = getAngle(e.touches);
      setLastAngle(angle);
      setIsRotating(true);
      
      // Haptic feedback for rotation start
      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && isRotating) {
      e.preventDefault();
      const angle = getAngle(e.touches);
      const deltaAngle = angle - lastAngle;
      const newRotation = rotation + deltaAngle;
      
      setRotation(newRotation);
      setLastAngle(angle);
      onRotate?.(newRotation);
      
      controls.set({ rotate: newRotation });
    }
  }, [lastAngle, rotation, isRotating, onRotate, controls]);

  const handleTouchEnd = useCallback(() => {
    if (isRotating) {
      setIsRotating(false);
      
      // Snap to nearest angle if snapAngles provided
      if (snapAngles.length > 0) {
        const closest = snapAngles.reduce((prev, curr) => 
          Math.abs(curr - rotation) < Math.abs(prev - rotation) ? curr : prev
        );
        
        if (Math.abs(closest - rotation) < 30) {
          setRotation(closest);
          onRotate?.(closest);
          controls.start({ 
            rotate: closest,
            transition: { duration: 0.2, ease: 'easeOut' }
          });
          
          // Haptic feedback for snap
          if ('vibrate' in navigator) {
            navigator.vibrate([5, 10, 5]);
          }
        }
      }
    }
  }, [isRotating, rotation, snapAngles, controls, onRotate]);

  return (
    <motion.div
      className={`touch-manipulation select-none ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      animate={controls}
    >
      {children}
    </motion.div>
  );
}

// Long Press with Pressure Sensitivity
interface PressureProps {
  children: React.ReactNode;
  onPress?: (pressure: number) => void;
  onLongPress?: () => void;
  className?: string;
  longPressDuration?: number;
}

export function PressureSensitive({
  children,
  onPress,
  onLongPress,
  className = '',
  longPressDuration = 500
}: PressureProps) {
  const [pressure, setPressure] = useState(0);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);
  const controls = useAnimation();

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const force = (touch as any).force || 0.5; // Fallback for devices without force touch
    
    setPressure(force);
    onPress?.(force);
    
    // Long press timer
    const longPressTimer = setTimeout(() => {
      onLongPress?.();
      // Strong haptic feedback for long press
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    }, longPressDuration);
    
    setTimer(longPressTimer);
    
    // Visual feedback based on pressure
    controls.start({ 
      scale: 0.95 + (force * 0.1),
      boxShadow: `0 ${4 + force * 20}px ${20 + force * 40}px rgba(0, 0, 0, ${0.1 + force * 0.2})`
    });
    
  }, [onPress, onLongPress, longPressDuration, controls]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const force = (touch as any).force || 0.5;
    
    setPressure(force);
    onPress?.(force);
    
    // Update visual feedback
    controls.set({ 
      scale: 0.95 + (force * 0.1),
      boxShadow: `0 ${4 + force * 20}px ${20 + force * 40}px rgba(0, 0, 0, ${0.1 + force * 0.2})`
    });
  }, [onPress, controls]);

  const handleTouchEnd = useCallback(() => {
    if (timer) {
      clearTimeout(timer);
      setTimer(null);
    }
    
    setPressure(0);
    
    // Reset visual state
    controls.start({ 
      scale: 1,
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
      transition: { duration: 0.2 }
    });
  }, [timer, controls]);

  return (
    <motion.div
      className={`touch-manipulation select-none ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      animate={controls}
    >
      {children}
      
      {/* Pressure Indicator */}
      {pressure > 0.7 && (
        <motion.div
          className="absolute inset-0 pointer-events-none rounded-inherit border-2 border-primary-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}
    </motion.div>
  );
}

// Combined Advanced Gesture Handler
interface AdvancedGestureProps {
  children: React.ReactNode;
  className?: string;
  enablePinch?: boolean;
  enableRotation?: boolean;
  enableMultiSwipe?: boolean;
  enablePressure?: boolean;
  onPinch?: (zoom: number) => void;
  onRotate?: (angle: number) => void;
  onSwipe?: (direction: 'up' | 'down' | 'left' | 'right') => void;
  onPressure?: (pressure: number) => void;
}

export function AdvancedGestureHandler({
  children,
  className = '',
  enablePinch = true,
  enableRotation = true,
  enableMultiSwipe = true,
  enablePressure = true,
  onPinch,
  onRotate,
  onSwipe,
  onPressure
}: AdvancedGestureProps) {
  let component = children;
  
  if (enablePressure) {
    component = (
      <PressureSensitive onPress={onPressure} className={className}>
        {component}
      </PressureSensitive>
    );
  }
  
  if (enableRotation) {
    component = (
      <RotationGesture onRotate={onRotate}>
        {component}
      </RotationGesture>
    );
  }
  
  if (enablePinch) {
    component = (
      <PinchZoom onZoomChange={onPinch}>
        {component}
      </PinchZoom>
    );
  }
  
  if (enableMultiSwipe) {
    component = (
      <MultiSwipe
        onSwipeUp={() => onSwipe?.('up')}
        onSwipeDown={() => onSwipe?.('down')}
        onSwipeLeft={() => onSwipe?.('left')}
        onSwipeRight={() => onSwipe?.('right')}
      >
        {component}
      </MultiSwipe>
    );
  }
  
  return <>{component}</>;
}

// Enhanced Gesture Recognition System
interface GestureEvent {
  type: 'tap' | 'doubletap' | 'longtap' | 'swipe' | 'pinch' | 'rotate' | 'pan';
  target: HTMLElement;
  data: any;
  timestamp: number;
}

interface GestureConfig {
  enableTap?: boolean;
  enableDoubleTap?: boolean;
  enableLongTap?: boolean;
  enableSwipe?: boolean;
  enablePinch?: boolean;
  enableRotate?: boolean;
  enablePan?: boolean;
  
  // Thresholds
  doubleTapDelay?: number;
  longTapDelay?: number;
  swipeThreshold?: number;
  pinchThreshold?: number;
  rotateThreshold?: number;
  panThreshold?: number;
  
  // Haptic feedback
  enableHaptics?: boolean;
  hapticIntensity?: 'light' | 'medium' | 'heavy';
}

interface AdvancedGestureRecognizerProps {
  children: React.ReactNode;
  config?: GestureConfig;
  onGesture?: (event: GestureEvent) => void;
  className?: string;
}

const defaultGestureConfig: GestureConfig = {
  enableTap: true,
  enableDoubleTap: true,
  enableLongTap: true,
  enableSwipe: true,
  enablePinch: false,
  enableRotate: false,
  enablePan: true,
  
  doubleTapDelay: 300,
  longTapDelay: 500,
  swipeThreshold: 50,
  pinchThreshold: 0.1,
  rotateThreshold: 10,
  panThreshold: 10,
  
  enableHaptics: true,
  hapticIntensity: 'light'
};

export function AdvancedGestureRecognizer({
  children,
  config = defaultGestureConfig,
  onGesture,
  className = ''
}: AdvancedGestureRecognizerProps) {
  const [lastTap, setLastTap] = useState<number>(0);
  const [tapCount, setTapCount] = useState<number>(0);
  const [longTapTimer, setLongTapTimer] = useState<NodeJS.Timeout | null>(null);
  const [isLongTapping, setIsLongTapping] = useState(false);
  
  const gestureRef = useRef<HTMLDivElement>(null);
  const startPoint = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastPinchDistance = useRef<number>(0);
  const lastRotationAngle = useRef<number>(0);

  const triggerHaptic = useCallback((intensity: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!config.enableHaptics || !('vibrate' in navigator)) return;
    
    const patterns = {
      light: 10,
      medium: 20,
      heavy: 30
    };
    
    navigator.vibrate(patterns[intensity]);
  }, [config.enableHaptics]);

  const fireGestureEvent = useCallback((type: GestureEvent['type'], data: any = {}) => {
    const event: GestureEvent = {
      type,
      target: gestureRef.current!,
      data,
      timestamp: Date.now()
    };
    
    onGesture?.(event);
    console.log('👆 Gesture detected:', event);
  }, [onGesture]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!gestureRef.current) return;
    
    const touch = e.touches[0];
    startPoint.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
    
    // Clear any existing long tap timer
    if (longTapTimer) {
      clearTimeout(longTapTimer);
    }
    
    // Start long tap detection
    if (config.enableLongTap) {
      const timer = setTimeout(() => {
        setIsLongTapping(true);
        fireGestureEvent('longtap', {
          x: touch.clientX,
          y: touch.clientY
        });
        triggerHaptic('heavy');
      }, config.longTapDelay);
      
      setLongTapTimer(timer);
    }
    
    // Handle multi-touch gestures
    if (e.touches.length === 2 && (config.enablePinch || config.enableRotate)) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      
      // Calculate initial distance for pinch
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      lastPinchDistance.current = distance;
      
      // Calculate initial rotation
      const angle = Math.atan2(
        touch2.clientY - touch1.clientY,
        touch2.clientX - touch1.clientX
      ) * 180 / Math.PI;
      lastRotationAngle.current = angle;
    }
  }, [config, fireGestureEvent, triggerHaptic, longTapTimer]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!startPoint.current) return;
    
    // Cancel long tap if finger moves too much
    if (longTapTimer && !isLongTapping) {
      const touch = e.touches[0];
      const distance = Math.sqrt(
        Math.pow(touch.clientX - startPoint.current.x, 2) +
        Math.pow(touch.clientY - startPoint.current.y, 2)
      );
      
      if (distance > 10) {
        clearTimeout(longTapTimer);
        setLongTapTimer(null);
      }
    }
    
    // Handle multi-touch gestures
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      
      // Pinch gesture
      if (config.enablePinch) {
        const distance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2)
        );
        
        const scale = distance / lastPinchDistance.current;
        
        if (Math.abs(scale - 1) > config.pinchThreshold!) {
          fireGestureEvent('pinch', {
            scale,
            distance,
            center: {
              x: (touch1.clientX + touch2.clientX) / 2,
              y: (touch1.clientY + touch2.clientY) / 2
            }
          });
          lastPinchDistance.current = distance;
        }
      }
      
      // Rotate gesture
      if (config.enableRotate) {
        const angle = Math.atan2(
          touch2.clientY - touch1.clientY,
          touch2.clientX - touch1.clientX
        ) * 180 / Math.PI;
        
        const rotation = angle - lastRotationAngle.current;
        
        if (Math.abs(rotation) > config.rotateThreshold!) {
          fireGestureEvent('rotate', {
            rotation,
            angle,
            center: {
              x: (touch1.clientX + touch2.clientX) / 2,
              y: (touch1.clientY + touch2.clientY) / 2
            }
          });
          lastRotationAngle.current = angle;
        }
      }
    }
  }, [config, fireGestureEvent, isLongTapping, longTapTimer]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!startPoint.current) return;
    
    // Clear long tap timer
    if (longTapTimer) {
      clearTimeout(longTapTimer);
      setLongTapTimer(null);
    }
    
    // Don't process tap if it was a long tap
    if (isLongTapping) {
      setIsLongTapping(false);
      return;
    }
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - startPoint.current.x;
    const deltaY = touch.clientY - startPoint.current.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const duration = Date.now() - startPoint.current.time;
    
    // Swipe gesture
    if (config.enableSwipe && distance > config.swipeThreshold! && duration < 300) {
      const velocity = distance / duration;
      const direction = Math.abs(deltaX) > Math.abs(deltaY) 
        ? (deltaX > 0 ? 'right' : 'left')
        : (deltaY > 0 ? 'down' : 'up');
      
      fireGestureEvent('swipe', {
        direction,
        distance,
        velocity,
        deltaX,
        deltaY,
        duration
      });
      
      triggerHaptic('medium');
      return;
    }
    
    // Tap gesture
    if (config.enableTap && distance < 10) {
      const now = Date.now();
      
      // Double tap detection
      if (config.enableDoubleTap && now - lastTap < config.doubleTapDelay!) {
        setTapCount(prev => prev + 1);
        
        if (tapCount === 0) {
          fireGestureEvent('doubletap', {
            x: touch.clientX,
            y: touch.clientY
          });
          triggerHaptic('medium');
          setTapCount(0);
        }
      } else {
        setTapCount(0);
        
        // Single tap with delay to allow double tap
        setTimeout(() => {
          if (tapCount === 0) {
            fireGestureEvent('tap', {
              x: touch.clientX,
              y: touch.clientY
            });
            triggerHaptic('light');
          }
        }, config.doubleTapDelay! / 2);
      }
      
      setLastTap(now);
    }
    
    startPoint.current = null;
  }, [config, fireGestureEvent, triggerHaptic, isLongTapping, longTapTimer, lastTap, tapCount]);

  return (
    <div
      ref={gestureRef}
      className={`touch-manipulation select-none ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  );
}

// Enhanced Button with Rich Haptic Feedback
interface EnhancedTouchButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  rippleColor?: string;
  hapticFeedback?: boolean;
  className?: string;
}

export function EnhancedTouchButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  rippleColor,
  hapticFeedback = true,
  className = ''
}: EnhancedTouchButtonProps) {
  const [ripples, setRipples] = useState<Array<{ id: string; x: number; y: number }>>([]);
  const [isPressed, setIsPressed] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  const variants = {
    primary: 'bg-primary-500 text-white shadow-lg shadow-primary-500/25 hover:bg-primary-600',
    secondary: 'bg-secondary-500 text-white shadow-lg shadow-secondary-500/25 hover:bg-secondary-600',
    success: 'bg-success-500 text-white shadow-lg shadow-success-500/25 hover:bg-success-600',
    warning: 'bg-warning-500 text-white shadow-lg shadow-warning-500/25 hover:bg-warning-600',
    danger: 'bg-danger-500 text-white shadow-lg shadow-danger-500/25 hover:bg-danger-600'
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm min-h-[36px]',
    md: 'px-6 py-3 text-base min-h-[44px]',
    lg: 'px-8 py-4 text-lg min-h-[52px]'
  };

  const handleGesture = useCallback((event: GestureEvent) => {
    if (disabled || loading) return;
    
    if (event.type === 'tap') {
      // Haptic feedback
      if (hapticFeedback && 'vibrate' in navigator) {
        navigator.vibrate(10);
      }
      
      // Create ripple effect
      const rect = buttonRef.current?.getBoundingClientRect();
      if (rect) {
        const rippleId = Date.now().toString();
        setRipples(prev => [...prev, {
          id: rippleId,
          x: event.data.x - rect.left,
          y: event.data.y - rect.top
        }]);
        
        // Remove ripple after animation
        setTimeout(() => {
          setRipples(prev => prev.filter(r => r.id !== rippleId));
        }, 600);
      }
      
      onClick?.();
    } else if (event.type === 'longtap') {
      // Different haptic pattern for long press
      if (hapticFeedback && 'vibrate' in navigator) {
        navigator.vibrate([20, 50, 20]);
      }
      
      setIsPressed(true);
      setTimeout(() => setIsPressed(false), 200);
    }
  }, [disabled, loading, onClick, hapticFeedback]);

  return (
    <AdvancedGestureRecognizer
      onGesture={handleGesture}
      config={{
        enableTap: true,
        enableLongTap: true,
        enableHaptics: hapticFeedback,
        hapticIntensity: 'light'
      }}
    >
      <motion.button
        ref={buttonRef}
        className={`
          ${variants[variant]}
          ${sizes[size]}
          relative overflow-hidden
          rounded-xl font-semibold
          transition-all duration-200 ease-out
          touch-manipulation select-none
          flex items-center justify-center
          ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}
          ${isPressed ? 'ring-2 ring-offset-2 ring-primary-300' : ''}
          ${className}
        `}
        disabled={disabled || loading}
        whileHover={{ scale: disabled ? 1 : 1.02 }}
        whileTap={{ scale: disabled ? 1 : 0.98 }}
        animate={{
          boxShadow: isPressed 
            ? '0 8px 25px rgba(0, 0, 0, 0.15), 0 4px 15px rgba(0, 0, 0, 0.1)' 
            : '0 4px 15px rgba(0, 0, 0, 0.1)'
        }}
      >
        {/* Ripple Effects */}
        {ripples.map((ripple) => (
          <motion.div
            key={ripple.id}
            className={`
              absolute rounded-full pointer-events-none
              ${rippleColor || 'bg-white/30'}
            `}
            style={{
              left: ripple.x,
              top: ripple.y,
              width: 0,
              height: 0,
              transform: 'translate(-50%, -50%)'
            }}
            initial={{ width: 0, height: 0, opacity: 0.8 }}
            animate={{ width: 100, height: 100, opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        ))}
        
        {/* Loading Spinner */}
        {loading && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          </motion.div>
        )}
        
        {/* Content */}
        <motion.div
          className="flex items-center gap-2"
          animate={{ opacity: loading ? 0.3 : 1 }}
        >
          {children}
        </motion.div>
      </motion.button>
    </AdvancedGestureRecognizer>
  );
}

export default {
  PinchZoom,
  MultiSwipe,
  RotationGesture,
  PressureSensitive,
  AdvancedGestureHandler,
  AdvancedGestureRecognizer,
  EnhancedTouchButton
};