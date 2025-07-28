'use client';

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedStarsBackgroundProps {
  className?: string;
  starCount?: number;
  primaryColor?: string;
  secondaryColor?: string;
  tertiaryColor?: string;
  animationSpeed?: 'slow' | 'medium' | 'fast';
  enableColorShift?: boolean;
  respectReducedMotion?: boolean;
}

export const AnimatedStarsBackground: React.FC<AnimatedStarsBackgroundProps> = ({
  className,
  starCount = 80,
  primaryColor = '#0EA5E9', // RevivaTech blue
  secondaryColor = '#14B8A6', // RevivaTech teal
  tertiaryColor = '#38BDF8', // Light blue
  animationSpeed = 'slow',
  enableColorShift = true,
  respectReducedMotion = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();

  const speedMultiplier = {
    slow: 1,
    medium: 0.7,
    fast: 0.4
  };

  // Performance optimization: Add will-change dynamically
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Add will-change for optimization
    container.style.willChange = 'background-position';
    
    // Clean up will-change when component unmounts
    return () => {
      if (container) {
        container.style.willChange = 'auto';
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const backgroundGradient = enableColorShift 
    ? `radial-gradient(ellipse at bottom, 
        ${primaryColor}12 0%, 
        ${secondaryColor}08 25%, 
        ${tertiaryColor}04 50%, 
        ${primaryColor}06 75%, 
        transparent 100%
      )`
    : `radial-gradient(ellipse at bottom, 
        ${primaryColor}08 0%, 
        ${secondaryColor}06 50%, 
        transparent 100%
      )`;

  // Generate star positions for each layer
  const generateStarShadows = (count: number, color: string) => {
    return Array.from({ length: count }, () => {
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const size = Math.random() * 2 + 0.5;
      return `${x}vw ${y}vh 0 ${size}px ${color}`;
    }).join(', ');
  };

  return (
    <>
      {/* Performance-optimized CSS */}
      <style jsx>{`
        .stars-background {
          background: ${backgroundGradient};
          background-size: 400% 400%;
          will-change: background-position;
          transform: translate3d(0, 0, 0); /* Force GPU acceleration */
        }
        
        .stars-layer {
          will-change: transform, opacity;
          transform: translate3d(0, 0, 0); /* Force GPU acceleration */
        }
        
        .stars-layer-1 {
          animation: stars-float-1 ${30 * speedMultiplier[animationSpeed]}s ease-in-out infinite;
        }
        
        .stars-layer-2 {
          animation: stars-float-2 ${45 * speedMultiplier[animationSpeed]}s ease-in-out infinite;
        }
        
        .stars-layer-3 {
          animation: stars-float-3 ${60 * speedMultiplier[animationSpeed]}s ease-in-out infinite;
        }
        
        @keyframes stars-float-1 {
          0%, 100% {
            opacity: 0.7;
            transform: translate3d(0, 0, 0) scale(1) rotate(0deg);
          }
          25% {
            opacity: 1;
            transform: translate3d(5px, -10px, 0) scale(1.1) rotate(90deg);
          }
          50% {
            opacity: 0.9;
            transform: translate3d(-5px, -5px, 0) scale(1.2) rotate(180deg);
          }
          75% {
            opacity: 1;
            transform: translate3d(-10px, 10px, 0) scale(1.1) rotate(270deg);
          }
        }
        
        @keyframes stars-float-2 {
          0%, 100% {
            opacity: 0.5;
            transform: translate3d(0, 0, 0) scale(1);
          }
          33% {
            opacity: 0.8;
            transform: translate3d(10px, -15px, 0) scale(1.3);
          }
          66% {
            opacity: 0.9;
            transform: translate3d(-15px, 5px, 0) scale(1.1);
          }
        }
        
        @keyframes stars-float-3 {
          0%, 100% {
            opacity: 0.3;
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            opacity: 0.7;
            transform: translate3d(-8px, -20px, 0) scale(1.4);
          }
        }
        
        ${enableColorShift ? `
        .stars-background {
          animation: color-shift-optimized ${40 * speedMultiplier[animationSpeed]}s ease-in-out infinite;
        }
        
        @keyframes color-shift-optimized {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        ` : ''}
        
        /* Accessibility: Respect prefers-reduced-motion */
        ${respectReducedMotion ? `
        @media (prefers-reduced-motion: reduce) {
          .stars-background {
            animation: none !important;
          }
          .stars-layer {
            animation: none !important;
            opacity: 0.5;
          }
        }
        ` : ''}
      `}</style>
      
      <div 
        ref={containerRef}
        className={cn(
          "fixed inset-0 overflow-hidden pointer-events-none stars-background",
          className
        )}
        role="presentation"
        aria-hidden="true"
      >
        {/* Multi-layer star field for depth using box-shadow approach */}
        <div 
          className="stars-layer stars-layer-1 absolute inset-0 opacity-80"
          style={{
            background: 'transparent',
            boxShadow: generateStarShadows(Math.floor(starCount / 3), primaryColor),
            borderRadius: '50%',
            width: '1px',
            height: '1px'
          }}
        />
        
        <div 
          className="stars-layer stars-layer-2 absolute inset-0 opacity-60"
          style={{
            background: 'transparent',
            boxShadow: generateStarShadows(Math.floor(starCount / 3), secondaryColor),
            borderRadius: '50%',
            width: '1px',
            height: '1px'
          }}
        />
        
        <div 
          className="stars-layer stars-layer-3 absolute inset-0 opacity-40"
          style={{
            background: 'transparent',
            boxShadow: generateStarShadows(Math.floor(starCount / 3), tertiaryColor),
            borderRadius: '50%',
            width: '1px',
            height: '1px'
          }}
        />
        
        {/* Subtle overlay for depth */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            background: `
              radial-gradient(circle at 20% 80%, ${primaryColor}15 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, ${secondaryColor}15 0%, transparent 50%),
              radial-gradient(circle at 40% 40%, ${tertiaryColor}10 0%, transparent 50%)
            `
          }}
        />
      </div>
    </>
  );
};