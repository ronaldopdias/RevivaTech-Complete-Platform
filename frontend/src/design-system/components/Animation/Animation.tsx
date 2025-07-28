/**
 * Design System V2 - Enhanced Animation System
 * Comprehensive animation and motion design components
 */

import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Animation variants using design tokens
const animationVariants = cva(
  [
    'transition-all ease-out',
  ],
  {
    variants: {
      animation: {
        // Basic animations
        none: '',
        fade: 'animate-fadeIn',
        'fade-out': 'animate-fadeOut',
        'slide-up': 'animate-slideUp',
        'slide-down': 'animate-slideDown',
        'slide-left': 'animate-slideLeft',
        'slide-right': 'animate-slideRight',
        'scale-in': 'animate-scaleIn',
        'scale-out': 'animate-scaleOut',
        
        // Continuous animations
        spin: 'animate-spin',
        bounce: 'animate-bounce',
        pulse: 'animate-pulse',
        ping: 'animate-ping',
        
        // Custom animations
        wiggle: 'animate-wiggle',
        float: 'animate-float',
        shimmer: 'animate-shimmer',
        tada: 'animate-tada',
        shake: 'animate-shake',
        flip: 'animate-flip',
        swing: 'animate-swing',
        rubber: 'animate-rubber',
        jello: 'animate-jello',
        heartbeat: 'animate-heartbeat',
        flash: 'animate-flash',
        
        // Attention seekers
        bounce2: 'animate-bounce2',
        flash2: 'animate-flash2',
        pulse2: 'animate-pulse2',
        'rubber-band': 'animate-rubberBand',
        'shake-x': 'animate-shakeX',
        'shake-y': 'animate-shakeY',
        'head-shake': 'animate-headShake',
        swing2: 'animate-swing2',
        wobble: 'animate-wobble',
        jello2: 'animate-jello2',
        
        // Entrance animations
        'bounce-in': 'animate-bounceIn',
        'fade-in': 'animate-fadeIn',
        'fade-in-down': 'animate-fadeInDown',
        'fade-in-left': 'animate-fadeInLeft',
        'fade-in-right': 'animate-fadeInRight',
        'fade-in-up': 'animate-fadeInUp',
        'slide-in-down': 'animate-slideInDown',
        'slide-in-left': 'animate-slideInLeft',
        'slide-in-right': 'animate-slideInRight',
        'slide-in-up': 'animate-slideInUp',
        'zoom-in': 'animate-zoomIn',
        
        // Exit animations
        'bounce-out': 'animate-bounceOut',
        'fade-out-down': 'animate-fadeOutDown',
        'fade-out-left': 'animate-fadeOutLeft',
        'fade-out-right': 'animate-fadeOutRight',
        'fade-out-up': 'animate-fadeOutUp',
        'slide-out-down': 'animate-slideOutDown',
        'slide-out-left': 'animate-slideOutLeft',
        'slide-out-right': 'animate-slideOutRight',
        'slide-out-up': 'animate-slideOutUp',
        'zoom-out': 'animate-zoomOut',
      },
      
      duration: {
        instant: 'duration-0',
        fast: 'duration-150',
        normal: 'duration-200',
        slow: 'duration-300',
        slower: 'duration-500',
        slowest: 'duration-1000',
      },
      
      delay: {
        none: 'delay-0',
        xs: 'delay-75',
        sm: 'delay-100',
        md: 'delay-150',
        lg: 'delay-200',
        xl: 'delay-300',
        '2xl': 'delay-500',
        '3xl': 'delay-700',
        '4xl': 'delay-1000',
      },
      
      easing: {
        linear: 'ease-linear',
        in: 'ease-in',
        out: 'ease-out',
        'in-out': 'ease-in-out',
      },
      
      repeat: {
        none: '',
        once: 'animate-once',
        infinite: 'animate-infinite',
      },
      
      direction: {
        normal: 'animate-normal',
        reverse: 'animate-reverse',
        alternate: 'animate-alternate',
        'alternate-reverse': 'animate-alternate-reverse',
      },
    },
    
    defaultVariants: {
      animation: 'none',
      duration: 'normal',
      delay: 'none',
      easing: 'out',
      repeat: 'none',
      direction: 'normal',
    },
  }
);

// Animation component props
export interface AnimationProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof animationVariants> {
  
  // Animation control
  trigger?: boolean;
  autoStart?: boolean;
  
  // Animation lifecycle
  onAnimationStart?: () => void;
  onAnimationEnd?: () => void;
  onAnimationIteration?: () => void;
  
  // Intersection observer
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  
  // Content
  children?: React.ReactNode;
  
  // Styling
  className?: string;
  style?: React.CSSProperties;
}

// Transition component props
export interface TransitionProps extends React.HTMLAttributes<HTMLDivElement> {
  show: boolean;
  appear?: boolean;
  enter?: string;
  enterFrom?: string;
  enterTo?: string;
  leave?: string;
  leaveFrom?: string;
  leaveTo?: string;
  
  // Lifecycle callbacks
  onEnter?: () => void;
  onEntering?: () => void;
  onEntered?: () => void;
  onExit?: () => void;
  onExiting?: () => void;
  onExited?: () => void;
  
  // Content
  children?: React.ReactNode;
  
  // Styling
  className?: string;
}

// Staggered animation props
export interface StaggeredAnimationProps extends React.HTMLAttributes<HTMLDivElement> {
  staggerDelay?: number;
  animation?: AnimationProps['animation'];
  duration?: AnimationProps['duration'];
  easing?: AnimationProps['easing'];
  threshold?: number;
  triggerOnce?: boolean;
  
  // Content
  children?: React.ReactNode;
  
  // Styling
  className?: string;
}

// Intersection observer hook
const useIntersectionObserver = (
  threshold: number = 0.1,
  rootMargin: string = '0px',
  triggerOnce: boolean = true
) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const targetRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && (!triggerOnce || !hasTriggered)) {
          setIsIntersecting(true);
          if (triggerOnce) {
            setHasTriggered(true);
          }
        } else if (!triggerOnce && !entry.isIntersecting) {
          setIsIntersecting(false);
        }
      },
      { threshold, rootMargin }
    );
    
    observer.observe(target);
    
    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce, hasTriggered]);
  
  return { targetRef, isIntersecting };
};

// Animation state hook
const useAnimationState = (
  trigger: boolean = true,
  autoStart: boolean = false
) => {
  const [shouldAnimate, setShouldAnimate] = useState(autoStart);
  
  useEffect(() => {
    if (trigger) {
      setShouldAnimate(true);
    }
  }, [trigger]);
  
  return shouldAnimate;
};

// Main Animation component
const Animation = forwardRef<HTMLDivElement, AnimationProps>(
  (
    {
      animation,
      duration,
      delay,
      easing,
      repeat,
      direction,
      trigger = true,
      autoStart = false,
      threshold = 0.1,
      rootMargin = '0px',
      triggerOnce = true,
      onAnimationStart,
      onAnimationEnd,
      onAnimationIteration,
      className,
      style,
      children,
      ...props
    },
    ref
  ) => {
    const { targetRef, isIntersecting } = useIntersectionObserver(threshold, rootMargin, triggerOnce);
    const shouldAnimate = useAnimationState(trigger && isIntersecting, autoStart);
    
    // Merge refs
    const mergedRef = (node: HTMLDivElement | null) => {
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
      
      if (targetRef) {
        targetRef.current = node;
      }
    };
    
    // Handle animation events
    const handleAnimationStart = () => {
      onAnimationStart?.();
    };
    
    const handleAnimationEnd = () => {
      onAnimationEnd?.();
    };
    
    const handleAnimationIteration = () => {
      onAnimationIteration?.();
    };
    
    return (
      <div
        ref={mergedRef}
        className={cn(
          shouldAnimate && animationVariants({
            animation,
            duration,
            delay,
            easing,
            repeat,
            direction,
          }),
          className
        )}
        style={style}
        onAnimationStart={handleAnimationStart}
        onAnimationEnd={handleAnimationEnd}
        onAnimationIteration={handleAnimationIteration}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Animation.displayName = 'Animation';

// Transition component
const Transition = forwardRef<HTMLDivElement, TransitionProps>(
  (
    {
      show,
      appear = false,
      enter = 'transition-opacity duration-200 ease-out',
      enterFrom = 'opacity-0',
      enterTo = 'opacity-100',
      leave = 'transition-opacity duration-200 ease-out',
      leaveFrom = 'opacity-100',
      leaveTo = 'opacity-0',
      onEnter,
      onEntering,
      onEntered,
      onExit,
      onExiting,
      onExited,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const [mounted, setMounted] = useState(show);
    const [phase, setPhase] = useState<'enter' | 'entering' | 'entered' | 'exit' | 'exiting' | 'exited'>('exited');
    
    useEffect(() => {
      if (show) {
        setMounted(true);
        setPhase('enter');
        onEnter?.();
        
        // Start entering phase
        const enteringTimer = setTimeout(() => {
          setPhase('entering');
          onEntering?.();
        }, 10);
        
        // Complete entering phase
        const enteredTimer = setTimeout(() => {
          setPhase('entered');
          onEntered?.();
        }, 210);
        
        return () => {
          clearTimeout(enteringTimer);
          clearTimeout(enteredTimer);
        };
      } else {
        setPhase('exit');
        onExit?.();
        
        // Start exiting phase
        const exitingTimer = setTimeout(() => {
          setPhase('exiting');
          onExiting?.();
        }, 10);
        
        // Complete exiting phase
        const exitedTimer = setTimeout(() => {
          setPhase('exited');
          setMounted(false);
          onExited?.();
        }, 210);
        
        return () => {
          clearTimeout(exitingTimer);
          clearTimeout(exitedTimer);
        };
      }
    }, [show, onEnter, onEntering, onEntered, onExit, onExiting, onExited]);
    
    if (!mounted && !appear) return null;
    
    // Determine classes based on phase
    let transitionClass = '';
    
    if (phase === 'enter' || phase === 'entering') {
      transitionClass = cn(enter, phase === 'enter' ? enterFrom : enterTo);
    } else if (phase === 'entered') {
      transitionClass = enterTo;
    } else if (phase === 'exit' || phase === 'exiting') {
      transitionClass = cn(leave, phase === 'exit' ? leaveFrom : leaveTo);
    }
    
    return (
      <div
        ref={ref}
        className={cn(transitionClass, className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Transition.displayName = 'Transition';

// Staggered animation component
const StaggeredAnimation = forwardRef<HTMLDivElement, StaggeredAnimationProps>(
  (
    {
      staggerDelay = 100,
      animation = 'fade-in-up',
      duration = 'normal',
      easing = 'out',
      threshold = 0.1,
      triggerOnce = true,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const { targetRef, isIntersecting } = useIntersectionObserver(threshold, '0px', triggerOnce);
    const [childrenArray, setChildrenArray] = useState<React.ReactElement[]>([]);
    
    // Merge refs
    const mergedRef = (node: HTMLDivElement | null) => {
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
      
      if (targetRef) {
        targetRef.current = node;
      }
    };
    
    // Process children
    useEffect(() => {
      const processedChildren = React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            key: index,
            className: cn(
              child.props.className,
              isIntersecting && animationVariants({
                animation,
                duration,
                easing,
                delay: index === 0 ? 'none' : 'md',
              })
            ),
            style: {
              ...child.props.style,
              animationDelay: isIntersecting ? `${index * staggerDelay}ms` : '0ms',
            },
          });
        }
        return child;
      });
      
      setChildrenArray(processedChildren || []);
    }, [children, isIntersecting, animation, duration, easing, staggerDelay]);
    
    return (
      <div
        ref={mergedRef}
        className={className}
        {...props}
      >
        {childrenArray}
      </div>
    );
  }
);

StaggeredAnimation.displayName = 'StaggeredAnimation';

// Scroll reveal component
export const ScrollReveal = ({ 
  children, 
  animation = 'fade-in-up',
  threshold = 0.1,
  triggerOnce = true,
  ...props 
}: {
  children: React.ReactNode;
  animation?: AnimationProps['animation'];
  threshold?: number;
  triggerOnce?: boolean;
} & Omit<AnimationProps, 'trigger' | 'autoStart' | 'animation'>) => {
  return (
    <Animation
      animation={animation}
      threshold={threshold}
      triggerOnce={triggerOnce}
      {...props}
    >
      {children}
    </Animation>
  );
};

// Hover animation component
export const HoverAnimation = ({ 
  children, 
  animation = 'scale-in',
  className,
  ...props 
}: {
  children: React.ReactNode;
  animation?: AnimationProps['animation'];
  className?: string;
} & Omit<AnimationProps, 'trigger' | 'autoStart' | 'animation'>) => {
  return (
    <div
      className={cn(
        'group cursor-pointer',
        className
      )}
      {...props}
    >
      <div className={cn('group-hover:' + animationVariants({ animation }))}>
        {children}
      </div>
    </div>
  );
};

// Loading animation component
export const LoadingAnimation = ({ 
  type = 'spin',
  size = 'md',
  color = 'primary',
  className,
  ...props 
}: {
  type?: 'spin' | 'pulse' | 'bounce' | 'ping' | 'dots';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'accent' | 'current';
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) => {
  const sizes = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
    xl: 'h-8 w-8',
  };
  
  const colors = {
    primary: 'text-primary-500',
    secondary: 'text-secondary-500',
    accent: 'text-accent-500',
    current: 'text-current',
  };
  
  if (type === 'dots') {
    return (
      <div className={cn('flex space-x-1', className)} {...props}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              'rounded-full bg-current',
              sizes[size],
              colors[color],
              'animate-bounce'
            )}
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </div>
    );
  }
  
  return (
    <div
      className={cn(
        'rounded-full border-2 border-current border-t-transparent',
        sizes[size],
        colors[color],
        animationVariants({ animation: type }),
        className
      )}
      {...props}
    />
  );
};

// Typewriter animation component
export const TypewriterAnimation = ({ 
  text,
  speed = 100,
  delay = 0,
  cursor = true,
  className,
  ...props 
}: {
  text: string;
  speed?: number;
  delay?: number;
  cursor?: boolean;
  className?: string;
} & React.HTMLAttributes<HTMLSpanElement>) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCursor, setShowCursor] = useState(cursor);
  
  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, currentIndex === 0 ? delay : speed);
      
      return () => clearTimeout(timeout);
    } else {
      // Hide cursor after typing is complete
      const timeout = setTimeout(() => {
        setShowCursor(false);
      }, 1000);
      
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text, speed, delay]);
  
  return (
    <span className={className} {...props}>
      {displayText}
      {showCursor && (
        <span className="animate-pulse">|</span>
      )}
    </span>
  );
};

// Export all components
export { 
  Animation, 
  Transition, 
  StaggeredAnimation, 
  ScrollReveal, 
  HoverAnimation, 
  LoadingAnimation, 
  TypewriterAnimation,
  animationVariants 
};
export type { AnimationProps, TransitionProps, StaggeredAnimationProps };
export default Animation;