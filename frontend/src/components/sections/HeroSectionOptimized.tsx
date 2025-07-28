'use client';

/**
 * Performance-Optimized Hero Section
 * Phase 3: Performance Excellence - Component-level optimizations
 */

import React, { useState, useEffect, memo, useMemo, useCallback, useRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';
import { createLazyComponent } from '@/lib/performance/lazyLoader';
import { useOptimizedCallback, useOptimizedMemo, useRenderPerformance } from '@/lib/performance/reactOptimizations';
import { Star, Clock, Shield, Zap, ArrowRight, Play, Smartphone, Laptop, Monitor } from 'lucide-react';

// Lazy load heavy components
const AnimatedGradient = createLazyComponent(() => import('@/components/ui/AnimatedGradient'));
const FloatingDevices = createLazyComponent(() => import('@/components/ui/FloatingDevices'));
const ParticleSystem = createLazyComponent(() => import('@/components/ui/ParticleSystem'));

// Optimized hero variants with memoization
const heroVariants = cva(
  "relative overflow-hidden min-h-screen flex items-center",
  {
    variants: {
      variant: {
        animated: "hero-animated-gradient text-white",
        gradient: "bg-gradient-to-br from-primary-500 to-primary-700 text-white",
        glassmorphism: "bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl text-white",
        premium: "bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white",
      },
      size: {
        compact: "min-h-[80vh]",
        standard: "min-h-screen",
        full: "min-h-screen",
      },
      animation: {
        floating: "with-floating-devices",
        particles: "with-particles",
        pulse: "with-pulse-background",
        none: "",
      },
    },
    defaultVariants: {
      variant: "animated",
      size: "standard",
      animation: "floating",
    },
  }
);

// Optimized props interface
export interface HeroSectionOptimizedProps extends VariantProps<typeof heroVariants> {
  headline?: {
    main: string;
    highlight?: string;
    typewriter?: boolean;
    gradient?: boolean;
  };
  subheadline?: string;
  description?: string;
  cta?: {
    primary: { text: string; href: string; variant?: 'primary' | 'secondary' };
    secondary?: { text: string; href: string; variant?: 'primary' | 'secondary' };
  };
  features?: Array<{
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
  }>;
  stats?: Array<{
    value: string;
    label: string;
    highlight?: boolean;
  }>;
  className?: string;
  enableAnalytics?: boolean;
  preloadImages?: string[];
}

// Memoized typewriter effect
const TypewriterText = memo(({ text, delay = 100 }: { text: string; delay?: number }) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, delay);

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text, delay]);

  return <span>{displayText}</span>;
});

TypewriterText.displayName = 'TypewriterText';

// Memoized feature item
const FeatureItem = memo(({ 
  icon: Icon, 
  title, 
  description 
}: { 
  icon: React.ComponentType<{ className?: string }>; 
  title: string; 
  description: string; 
}) => (
  <div className="flex items-start gap-3 p-4 rounded-lg bg-white/5 backdrop-blur-sm">
    <Icon className="w-6 h-6 text-blue-400 mt-0.5 flex-shrink-0" />
    <div>
      <h3 className="font-semibold text-sm">{title}</h3>
      <p className="text-xs text-gray-300 mt-1">{description}</p>
    </div>
  </div>
));

FeatureItem.displayName = 'FeatureItem';

// Memoized stats item
const StatsItem = memo(({ 
  value, 
  label, 
  highlight 
}: { 
  value: string; 
  label: string; 
  highlight?: boolean; 
}) => (
  <div className="text-center">
    <div className={cn(
      "text-2xl font-bold",
      highlight ? "text-blue-400" : "text-white"
    )}>
      {value}
    </div>
    <div className="text-sm text-gray-300">{label}</div>
  </div>
));

StatsItem.displayName = 'StatsItem';

// Main optimized component
const HeroSectionOptimized: React.FC<HeroSectionOptimizedProps> = ({
  variant = "animated",
  size = "standard",
  animation = "floating",
  headline,
  subheadline,
  description,
  cta,
  features = [],
  stats = [],
  className,
  enableAnalytics = true,
  preloadImages = []
}) => {
  const { renderCount } = useRenderPerformance('HeroSectionOptimized');
  const sectionRef = useRef<HTMLElement>(null);

  // Optimized memoization of complex calculations
  const memoizedClassNames = useOptimizedMemo(
    () => cn(heroVariants({ variant, size, animation }), className),
    [variant, size, animation, className]
  );

  // Optimized callback for CTA clicks
  const handleCTAClick = useOptimizedCallback(
    (href: string, label: string) => {
      if (enableAnalytics) {
        // Analytics tracking
        console.log(`Hero CTA clicked: ${label} -> ${href}`);
      }
      
      // Navigation logic
      if (href.startsWith('#')) {
        const element = document.querySelector(href);
        element?.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.location.href = href;
      }
    },
    [enableAnalytics],
    { debounceMs: 300 }
  );

  // Memoized features rendering
  const renderedFeatures = useMemo(
    () => features.map((feature, index) => (
      <FeatureItem
        key={`feature-${index}`}
        icon={feature.icon}
        title={feature.title}
        description={feature.description}
      />
    )),
    [features]
  );

  // Memoized stats rendering
  const renderedStats = useMemo(
    () => stats.map((stat, index) => (
      <StatsItem
        key={`stat-${index}`}
        value={stat.value}
        label={stat.label}
        highlight={stat.highlight}
      />
    )),
    [stats]
  );

  // Preload images
  useEffect(() => {
    if (preloadImages.length > 0) {
      preloadImages.forEach(src => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = src;
        link.as = 'image';
        document.head.appendChild(link);
      });
    }
  }, [preloadImages]);

  return (
    <section
      ref={sectionRef}
      className={memoizedClassNames}
      aria-label="Hero section"
    >
      {/* Background Effects */}
      {variant === 'animated' && (
        <AnimatedGradient className="absolute inset-0 -z-10" />
      )}
      
      {animation === 'floating' && (
        <FloatingDevices className="absolute inset-0 -z-10" />
      )}
      
      {animation === 'particles' && (
        <ParticleSystem className="absolute inset-0 -z-10" />
      )}

      {/* Nordic-inspired gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-black/10" />

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-4 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left column - Content */}
            <div className="space-y-8">
              {/* Headline */}
              {headline && (
                <div className="space-y-4">
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                    {headline.typewriter ? (
                      <TypewriterText text={headline.main} delay={80} />
                    ) : (
                      <span className={cn(
                        headline.gradient && "bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent"
                      )}>
                        {headline.main}
                      </span>
                    )}
                    {headline.highlight && (
                      <span className="block text-blue-400 mt-2">
                        {headline.highlight}
                      </span>
                    )}
                  </h1>
                  
                  {subheadline && (
                    <p className="text-xl md:text-2xl text-gray-200 font-medium">
                      {subheadline}
                    </p>
                  )}
                </div>
              )}

              {/* Description */}
              {description && (
                <p className="text-lg text-gray-300 leading-relaxed max-w-2xl">
                  {description}
                </p>
              )}

              {/* CTA Buttons */}
              {cta && (
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    variant={cta.primary.variant || 'primary'}
                    size="lg"
                    onClick={() => handleCTAClick(cta.primary.href, cta.primary.text)}
                    className="group"
                  >
                    {cta.primary.text}
                    <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                  </Button>
                  
                  {cta.secondary && (
                    <Button
                      variant={cta.secondary.variant || 'secondary'}
                      size="lg"
                      onClick={() => handleCTAClick(cta.secondary.href, cta.secondary.text)}
                      className="group"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      {cta.secondary.text}
                    </Button>
                  )}
                </div>
              )}

              {/* Features */}
              {renderedFeatures.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderedFeatures}
                </div>
              )}
            </div>

            {/* Right column - Stats or Visual */}
            <div className="space-y-8">
              {/* Stats */}
              {renderedStats.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                  {renderedStats}
                </div>
              )}

              {/* Device showcase */}
              <div className="flex justify-center items-center space-x-6">
                <div className="flex items-center space-x-4 p-4 bg-white/10 backdrop-blur-sm rounded-lg">
                  <Smartphone className="w-8 h-8 text-blue-400" />
                  <Laptop className="w-8 h-8 text-green-400" />
                  <Monitor className="w-8 h-8 text-purple-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance debug info (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-4 left-4 text-xs text-white/50">
          Render #{renderCount}
        </div>
      )}
    </section>
  );
};

// Export memoized component
export default memo(HeroSectionOptimized, (prevProps, nextProps) => {
  // Custom comparison function for optimal re-rendering
  const propsToCompare: (keyof HeroSectionOptimizedProps)[] = [
    'variant', 'size', 'animation', 'headline', 'subheadline', 'description', 'cta', 'className'
  ];
  
  return propsToCompare.every(key => {
    const prevValue = prevProps[key];
    const nextValue = nextProps[key];
    
    if (typeof prevValue === 'object' && typeof nextValue === 'object') {
      return JSON.stringify(prevValue) === JSON.stringify(nextValue);
    }
    
    return prevValue === nextValue;
  });
});