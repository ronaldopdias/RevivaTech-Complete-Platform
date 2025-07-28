/**
 * ContentLayout Component
 * 
 * A flexible content layout wrapper that provides consistent
 * spacing and structure for content pages.
 */

import React from 'react';

interface ContentLayoutProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export default function ContentLayout({
  children,
  className = '',
  maxWidth = 'lg',
  padding = 'md'
}: ContentLayoutProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    '2xl': 'max-w-7xl',
    full: 'max-w-full'
  };

  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6 md:p-8',
    lg: 'p-8 md:p-12'
  };

  return (
    <div className={`
      w-full 
      ${maxWidthClasses[maxWidth]} 
      ${paddingClasses[padding]} 
      mx-auto 
      ${className}
    `}>
      {children}
    </div>
  );
}

export { ContentLayout };