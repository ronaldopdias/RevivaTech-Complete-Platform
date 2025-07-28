/**
 * FormLayout Component
 * 
 * A specialized layout for forms with proper spacing,
 * validation display, and responsive design.
 */

import React from 'react';

interface FormLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
  currentStep?: number;
  totalSteps?: number;
}

export default function FormLayout({
  children,
  title,
  description,
  className = '',
  maxWidth = 'md',
  showProgress = false,
  currentStep = 1,
  totalSteps = 1
}: FormLayoutProps) {
  const maxWidthClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl'
  };

  return (
    <div className={`
      w-full 
      ${maxWidthClasses[maxWidth]} 
      mx-auto 
      p-6 
      ${className}
    `}>
      {/* Form Header */}
      {(title || description || showProgress) && (
        <div className="mb-8">
          {showProgress && (
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Step {currentStep} of {totalSteps}</span>
                <span>{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                />
              </div>
            </div>
          )}
          
          {title && (
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {title}
            </h1>
          )}
          
          {description && (
            <p className="text-gray-600">
              {description}
            </p>
          )}
        </div>
      )}

      {/* Form Content */}
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
}

export { FormLayout };