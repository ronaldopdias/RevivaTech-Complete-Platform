// Example usage of AnimatedStarsBackground component
// This file demonstrates how to implement the animated stars background

import React from 'react';
import { AnimatedStarsBackground } from '@/components/ui';
import { getThemeProps } from '@/config/background-colors';

export function AnimatedBackgroundExample() {
  return (
    <div className="relative min-h-screen">
      {/* Method 1: Use default colors */}
      <AnimatedStarsBackground />

      {/* Method 2: Use pre-configured theme */}
      <AnimatedStarsBackground 
        {...getThemeProps('revivatech')}
        starCount={75}
        animationSpeed="slow"
      />

      {/* Method 3: Custom colors */}
      <AnimatedStarsBackground 
        primaryColor="#0EA5E9"
        secondaryColor="#14B8A6"
        starCount={100}
        animationSpeed="medium"
        className="z-0"
      />

      {/* Your content goes here */}
      <div className="relative z-10">
        <h1 className="text-4xl font-bold text-center pt-20">
          Your Website Content
        </h1>
        <p className="text-center mt-4 text-gray-600">
          The animated stars background is behind this content
        </p>
      </div>
    </div>
  );
}

// Quick implementation for any page:
export function PageWithStarsBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <AnimatedStarsBackground 
        className="fixed inset-0 z-0"
        starCount={60}
        animationSpeed="slow"
      />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}