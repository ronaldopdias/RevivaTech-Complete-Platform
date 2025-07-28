/**
 * Advanced Trust-Building Components v2
 * 
 * Sophisticated trust-building components with progressive disclosure,
 * psychological design principles, and enhanced user confidence building.
 * 
 * Features:
 * - Progressive trust disclosure
 * - Micro-interactions for confidence building
 * - Social proof psychology
 * - Transparency and authenticity
 * - Security and privacy indicators
 * - Professional authority demonstration
 * - Customer anxiety reduction
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { 
  trustSignalVariantsV2, 
  testimonialCardVariantsV2,
  brandBadgeVariantsV2,
  brandCardVariantsV2 
} from '@/config/components/brand-variants-v2';
import { usePerformanceTheme } from '@/lib/performance-theme-provider';

// Enhanced Trust Signal Component
interface TrustSignalV2Props {
  metric: string;
  value: string | number;
  description: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'prominent' | 'subtle' | 'professional' | 'success' | 'glass' | 'pulse';
  size?: 'xs' | 'sm' | 'default' | 'lg' | 'xl';
  iconPosition?: 'left' | 'right' | 'top' | 'bottom';
  animated?: boolean;
  verified?: boolean;
  className?: string;
  onClick?: () => void;
}

export function TrustSignalV2({
  metric,
  value,
  description,
  icon,
  variant = 'default',
  size = 'default',
  iconPosition = 'left',
  animated = false,
  verified = false,
  className,
  onClick,
}: TrustSignalV2Props) {
  const [isVisible, setIsVisible] = useState(false);
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  // Intersection observer for animation triggers
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          
          // Animated counter for numeric values
          if (animated && typeof value === 'number') {
            let start = 0;
            const end = value;
            const duration = 1500;
            const startTime = performance.now();
            
            const animate = (currentTime: number) => {
              const elapsed = currentTime - startTime;
              const progress = Math.min(elapsed / duration, 1);
              
              // Easing function for smooth animation
              const easeOutQuart = 1 - Math.pow(1 - progress, 4);
              setCount(Math.floor(easeOutQuart * end));
              
              if (progress < 1) {
                requestAnimationFrame(animate);
              }
            };
            
            requestAnimationFrame(animate);
          }
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [animated, value]);

  const displayValue = animated && typeof value === 'number' && isVisible ? count : value;

  return (
    <div
      ref={ref}
      className={cn(
        trustSignalVariantsV2({ variant, size, iconPosition }),
        animated && 'transition-all duration-500 ease-out',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
        onClick && 'cursor-pointer hover:scale-105 active:scale-95',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      {icon && iconPosition === 'top' && (
        <div className="flex justify-center mb-2 text-current opacity-80">
          {icon}
        </div>
      )}
      
      <div className={cn(
        'flex items-center gap-2',
        iconPosition === 'right' && 'flex-row-reverse',
        iconPosition === 'top' || iconPosition === 'bottom' ? 'flex-col' : 'flex-row'
      )}>
        {icon && (iconPosition === 'left' || iconPosition === 'right') && (
          <div className="text-current opacity-80 flex-shrink-0">
            {icon}
          </div>
        )}
        
        <div className={cn(
          'flex flex-col',
          iconPosition === 'top' || iconPosition === 'bottom' ? 'text-center' : 'text-left'
        )}>
          <span className="font-bold text-lg leading-tight">
            {displayValue}
            {typeof value === 'string' && value.includes('+') && (
              <span className="text-xs ml-1 opacity-75">+</span>
            )}
          </span>
          <span className="text-xs opacity-75 leading-tight">{metric}</span>
        </div>
        
        {verified && (
          <div className="ml-2 flex-shrink-0">
            <div className="w-4 h-4 bg-success-main rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">✓</span>
            </div>
          </div>
        )}
      </div>
      
      {icon && iconPosition === 'bottom' && (
        <div className="flex justify-center mt-2 text-current opacity-80">
          {icon}
        </div>
      )}
      
      {description && (
        <div className="mt-2 text-xs opacity-75 text-center">
          {description}
        </div>
      )}
    </div>
  );
}

// Enhanced Professional Testimonial Component
interface ProfessionalTestimonialV2Props {
  name: string;
  role?: string;
  company?: string;
  photo: string;
  content: string;
  rating: number;
  verified?: boolean;
  date: string;
  device?: string;
  repairType?: string;
  variant?: 'default' | 'featured' | 'compact' | 'professional' | 'glass' | 'video' | 'verified';
  size?: 'compact' | 'default' | 'featured' | 'hero';
  photoStyle?: 'circle' | 'square' | 'none';
  ratingStyle?: 'stars' | 'numeric' | 'hidden';
  className?: string;
  onExpand?: () => void;
}

export function ProfessionalTestimonialV2({
  name,
  role,
  company,
  photo,
  content,
  rating,
  verified = false,
  date,
  device,
  repairType,
  variant = 'default',
  size = 'default',
  photoStyle = 'circle',
  ratingStyle = 'stars',
  className,
  onExpand,
}: ProfessionalTestimonialV2Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const shouldTruncate = content.length > 150 && size === 'compact';
  const displayContent = shouldTruncate && !isExpanded 
    ? `${content.substring(0, 150)}...` 
    : content;

  const handleExpand = useCallback(() => {
    setIsExpanded(!isExpanded);
    onExpand?.();
  }, [isExpanded, onExpand]);

  const renderRating = () => {
    if (ratingStyle === 'hidden') return null;
    
    if (ratingStyle === 'numeric') {
      return (
        <div className="rating flex items-center gap-1">
          <span className="text-lg font-bold text-warning-main">{rating}</span>
          <span className="text-sm opacity-75">/5</span>
        </div>
      );
    }
    
    // Stars
    return (
      <div className="rating flex gap-1">
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            className={cn(
              'text-sm',
              i < rating ? 'text-warning-main' : 'text-neutral-300'
            )}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <div
      className={cn(
        testimonialCardVariantsV2({ variant, size, photoStyle, ratingStyle }),
        'relative group',
        className
      )}
    >
      {/* Header with customer info */}
      <div className="flex items-start gap-4 mb-4">
        {photoStyle !== 'none' && (
          <div className="flex-shrink-0">
            <div className={cn(
              'relative overflow-hidden bg-neutral-200',
              photoStyle === 'circle' ? 'rounded-full' : 'rounded-lg',
              size === 'compact' ? 'w-10 h-10' : size === 'featured' ? 'w-16 h-16' : 'w-12 h-12'
            )}>
              {!imageError ? (
                <img
                  src={photo}
                  alt={`${name} photo`}
                  className={cn(
                    'w-full h-full object-cover transition-opacity duration-300',
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  )}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-full bg-neutral-300 flex items-center justify-center">
                  <span className="text-neutral-600 font-semibold text-sm">
                    {name.charAt(0)}
                  </span>
                </div>
              )}
              
              {verified && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-success-main rounded-full flex items-center justify-center border-2 border-white">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-semibold text-accent-900 text-sm">
                {name}
                {verified && (
                  <span className="ml-2 inline-flex items-center">
                    <div className="w-4 h-4 bg-success-main rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">✓</span>
                    </div>
                  </span>
                )}
              </h4>
              {(role || company) && (
                <p className="text-xs text-accent-600 mt-1">
                  {role}
                  {role && company && ' at '}
                  {company}
                </p>
              )}
              {(device || repairType) && (
                <p className="text-xs text-accent-500 mt-1">
                  {device}
                  {device && repairType && ' • '}
                  {repairType}
                </p>
              )}
            </div>
            
            <div className="text-right flex-shrink-0">
              {renderRating()}
              <p className="text-xs text-accent-500 mt-1">{date}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Testimonial content */}
      <div className="mb-4">
        <blockquote className="text-accent-700 leading-relaxed text-sm">
          "{displayContent}"
        </blockquote>
        
        {shouldTruncate && (
          <button
            onClick={handleExpand}
            className="mt-2 text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors"
          >
            {isExpanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>
      
      {/* Trust indicators */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          {verified && (
            <span className="flex items-center gap-1 text-success-600">
              <div className="w-3 h-3 bg-success-main rounded-full flex items-center justify-center">
                <span className="text-white text-[8px] font-bold">✓</span>
              </div>
              Verified Customer
            </span>
          )}
          
          <span className="text-accent-500">
            Authentic Review
          </span>
        </div>
        
        <div className="text-accent-400">
          ID: {name.toLowerCase().replace(/\s+/g, '')}-{date.slice(-2)}
        </div>
      </div>
    </div>
  );
}

// Security & Privacy Indicator Component
interface SecurityIndicatorV2Props {
  features: {
    icon: React.ReactNode;
    title: string;
    description: string;
    verified: boolean;
  }[];
  variant?: 'default' | 'prominent' | 'compact';
  className?: string;
}

export function SecurityIndicatorV2({
  features,
  variant = 'default',
  className,
}: SecurityIndicatorV2Props) {
  const [activeFeature, setActiveFeature] = useState<number | null>(null);

  return (
    <div className={cn(
      brandCardVariantsV2({ variant: 'brand-trust', padding: 'lg' }),
      'space-y-4',
      className
    )}>
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-trust-dark mb-2">
          Your Security & Privacy
        </h3>
        <p className="text-sm text-accent-600">
          We prioritize the protection of your devices and personal information
        </p>
      </div>
      
      <div className="grid gap-3">
        {features.map((feature, index) => (
          <div
            key={index}
            className={cn(
              'flex items-start gap-3 p-3 rounded-lg transition-all duration-200',
              'hover:bg-trust-light/50 cursor-pointer',
              activeFeature === index && 'bg-trust-light ring-1 ring-trust-main'
            )}
            onClick={() => setActiveFeature(activeFeature === index ? null : index)}
          >
            <div className="flex-shrink-0 mt-0.5">
              <div className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center',
                feature.verified 
                  ? 'bg-success-main text-success-contrast' 
                  : 'bg-neutral-200 text-neutral-600'
              )}>
                {feature.icon}
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-sm text-accent-800">
                  {feature.title}
                </h4>
                {feature.verified && (
                  <div className="w-4 h-4 bg-success-main rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">✓</span>
                  </div>
                )}
              </div>
              
              <p className={cn(
                'text-xs text-accent-600 transition-all duration-200',
                activeFeature === index ? 'opacity-100' : 'opacity-75'
              )}>
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Progressive Trust Builder Component
interface ProgressiveTrustBuilderProps {
  steps: {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    trustSignals: string[];
    completed?: boolean;
  }[];
  currentStep?: string;
  variant?: 'horizontal' | 'vertical';
  className?: string;
}

export function ProgressiveTrustBuilder({
  steps,
  currentStep,
  variant = 'horizontal',
  className,
}: ProgressiveTrustBuilderProps) {
  const [visibleSteps, setVisibleSteps] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const stepId = entry.target.getAttribute('data-step-id');
            if (stepId) {
              setVisibleSteps(prev => new Set([...prev, stepId]));
            }
          }
        });
      },
      { threshold: 0.3 }
    );

    const stepElements = document.querySelectorAll('[data-step-id]');
    stepElements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className={cn(
      'relative',
      variant === 'horizontal' ? 'flex gap-8 overflow-x-auto pb-4' : 'space-y-8',
      className
    )}>
      {steps.map((step, index) => {
        const isVisible = visibleSteps.has(step.id);
        const isCurrent = currentStep === step.id;
        const isCompleted = step.completed || false;
        
        return (
          <div
            key={step.id}
            data-step-id={step.id}
            className={cn(
              'relative flex-shrink-0 transition-all duration-500 ease-out',
              variant === 'horizontal' ? 'w-80' : 'w-full',
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            )}
            style={{ transitionDelay: `${index * 100}ms` }}
          >
            {/* Step indicator */}
            <div className="flex items-start gap-4 mb-4">
              <div className={cn(
                'relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300',
                isCurrent 
                  ? 'bg-primary-500 text-white ring-4 ring-primary-200' 
                  : isCompleted
                  ? 'bg-success-main text-success-contrast'
                  : 'bg-neutral-200 text-neutral-600',
                isVisible && 'scale-110'
              )}>
                {step.icon}
                
                {isCompleted && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-success-main rounded-full flex items-center justify-center border-2 border-white">
                    <span className="text-white text-xs font-bold">✓</span>
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <h3 className={cn(
                  'font-semibold mb-2 transition-colors duration-300',
                  isCurrent ? 'text-primary-700' : 'text-accent-800'
                )}>
                  {step.title}
                </h3>
                <p className="text-sm text-accent-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
            
            {/* Trust signals */}
            <div className="space-y-2 ml-16">
              {step.trustSignals.map((signal, signalIndex) => (
                <div
                  key={signalIndex}
                  className={cn(
                    'flex items-center gap-2 text-xs transition-all duration-300',
                    isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
                  )}
                  style={{ transitionDelay: `${(index * 100) + (signalIndex * 50)}ms` }}
                >
                  <div className="w-2 h-2 bg-trust-main rounded-full flex-shrink-0" />
                  <span className="text-accent-600">{signal}</span>
                </div>
              ))}
            </div>
            
            {/* Connection line for horizontal variant */}
            {variant === 'horizontal' && index < steps.length - 1 && (
              <div className="absolute top-6 left-full w-8 flex items-center justify-center">
                <div className={cn(
                  'w-8 h-0.5 transition-colors duration-500',
                  isCompleted ? 'bg-success-main' : 'bg-neutral-300'
                )} />
              </div>
            )}
            
            {/* Connection line for vertical variant */}
            {variant === 'vertical' && index < steps.length - 1 && (
              <div className="absolute top-12 left-6 w-0.5 h-8 flex items-center justify-center">
                <div className={cn(
                  'w-0.5 h-8 transition-colors duration-500',
                  isCompleted ? 'bg-success-main' : 'bg-neutral-300'
                )} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Expertise Demonstration Component
interface ExpertiseDemonstrationProps {
  certifications: {
    name: string;
    issuer: string;
    year: string;
    logo?: string;
    verified: boolean;
  }[];
  experience: {
    years: number;
    devicesRepaired: number;
    successRate: number;
    specializations: string[];
  };
  className?: string;
}

export function ExpertiseDemonstration({
  certifications,
  experience,
  className,
}: ExpertiseDemonstrationProps) {
  const [activeTab, setActiveTab] = useState<'certifications' | 'experience'>('certifications');

  return (
    <div className={cn(
      brandCardVariantsV2({ variant: 'brand-professional', padding: 'lg' }),
      className
    )}>
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-professional-dark mb-2">
          Professional Expertise
        </h3>
        <p className="text-sm text-accent-600">
          Certified professionals with proven track record
        </p>
      </div>
      
      {/* Tab navigation */}
      <div className="flex mb-6 bg-neutral-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('certifications')}
          className={cn(
            'flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200',
            activeTab === 'certifications'
              ? 'bg-white text-professional-dark shadow-sm'
              : 'text-accent-600 hover:text-accent-800'
          )}
        >
          Certifications
        </button>
        <button
          onClick={() => setActiveTab('experience')}
          className={cn(
            'flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200',
            activeTab === 'experience'
              ? 'bg-white text-professional-dark shadow-sm'
              : 'text-accent-600 hover:text-accent-800'
          )}
        >
          Experience
        </button>
      </div>
      
      {/* Tab content */}
      <div className="min-h-[200px]">
        {activeTab === 'certifications' && (
          <div className="grid gap-3">
            {certifications.map((cert, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-lg bg-professional-light/50 border border-professional-main/20"
              >
                {cert.logo && (
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-1">
                    <img src={cert.logo} alt={cert.issuer} className="w-full h-full object-contain" />
                  </div>
                )}
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm text-professional-dark">
                      {cert.name}
                    </h4>
                    {cert.verified && (
                      <div className="w-4 h-4 bg-success-main rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">✓</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-accent-600">
                    {cert.issuer} • {cert.year}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {activeTab === 'experience' && (
          <div className="space-y-6">
            {/* Experience metrics */}
            <div className="grid grid-cols-2 gap-4">
              <TrustSignalV2
                metric="Years Experience"
                value={experience.years}
                description="Professional service"
                variant="professional"
                size="sm"
                animated
              />
              <TrustSignalV2
                metric="Devices Repaired"
                value={`${experience.devicesRepaired}+`}
                description="Successful repairs"
                variant="professional"
                size="sm"
                animated
              />
            </div>
            
            <div className="text-center">
              <TrustSignalV2
                metric="Success Rate"
                value={`${experience.successRate}%`}
                description="Customer satisfaction"
                variant="success"
                size="lg"
                animated
              />
            </div>
            
            {/* Specializations */}
            <div>
              <h4 className="text-sm font-medium text-professional-dark mb-3">
                Specializations
              </h4>
              <div className="flex flex-wrap gap-2">
                {experience.specializations.map((spec, index) => (
                  <span
                    key={index}
                    className={cn(
                      brandBadgeVariantsV2({ variant: 'brand-professional', size: 'sm' })
                    )}
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Export all components
export {
  TrustSignalV2,
  ProfessionalTestimonialV2,
  SecurityIndicatorV2,
  ProgressiveTrustBuilder,
  ExpertiseDemonstration,
};