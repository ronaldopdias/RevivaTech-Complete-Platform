'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// Configuration interface for ProgressIndicator component
export interface ProgressIndicatorConfig {
  variant: 'linear' | 'circular' | 'stepped' | 'dots';
  size: 'sm' | 'md' | 'lg' | 'xl';
  theme: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'custom';
  showLabels: boolean;
  showPercentage: boolean;
  showStepNumbers: boolean;
  animated: boolean;
  orientation: 'horizontal' | 'vertical';
  interactive: boolean;
  colors: {
    active: string;
    inactive: string;
    completed: string;
    background: string;
  };
  animations: {
    duration: number;
    delay: number;
    easing: string;
  };
}

// Step interface for stepped variant
export interface ProgressStep {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  status: 'pending' | 'active' | 'completed' | 'error';
  optional?: boolean;
}

// Default configuration
const defaultConfig: ProgressIndicatorConfig = {
  variant: 'linear',
  size: 'md',
  theme: 'primary',
  showLabels: false,
  showPercentage: true,
  showStepNumbers: true,
  animated: true,
  orientation: 'horizontal',
  interactive: false,
  colors: {
    active: '#007AFF',
    inactive: '#E5E7EB',
    completed: '#10B981',
    background: '#F3F4F6'
  },
  animations: {
    duration: 0.5,
    delay: 0.1,
    easing: 'ease-out'
  }
};

// Component props
export interface ProgressIndicatorProps {
  progress: number; // 0-100 for linear/circular, step index for stepped
  steps?: ProgressStep[];
  config?: Partial<ProgressIndicatorConfig>;
  className?: string;
  onStepClick?: (stepIndex: number, step: ProgressStep) => void;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  progress,
  steps = [],
  config: userConfig = {},
  className,
  onStepClick
}) => {
  const config = { ...defaultConfig, ...userConfig };

  // Get theme colors
  const getThemeColors = () => {
    const themes = {
      primary: {
        active: 'bg-primary text-primary-foreground',
        inactive: 'bg-gray-200 text-gray-400',
        completed: 'bg-green-500 text-white',
        background: 'bg-gray-100'
      },
      secondary: {
        active: 'bg-secondary text-secondary-foreground',
        inactive: 'bg-gray-200 text-gray-400',
        completed: 'bg-green-500 text-white',
        background: 'bg-gray-100'
      },
      success: {
        active: 'bg-green-500 text-white',
        inactive: 'bg-gray-200 text-gray-400',
        completed: 'bg-green-600 text-white',
        background: 'bg-green-100'
      },
      warning: {
        active: 'bg-yellow-500 text-white',
        inactive: 'bg-gray-200 text-gray-400',
        completed: 'bg-yellow-600 text-white',
        background: 'bg-yellow-100'
      },
      error: {
        active: 'bg-red-500 text-white',
        inactive: 'bg-gray-200 text-gray-400',
        completed: 'bg-red-600 text-white',
        background: 'bg-red-100'
      },
      custom: {
        active: '',
        inactive: '',
        completed: '',
        background: ''
      }
    };

    return themes[config.theme];
  };

  // Get size classes
  const getSizeClasses = () => {
    const sizes = {
      sm: {
        height: 'h-1',
        step: 'w-6 h-6 text-xs',
        text: 'text-xs',
        spacing: 'gap-2'
      },
      md: {
        height: 'h-2',
        step: 'w-8 h-8 text-sm',
        text: 'text-sm',
        spacing: 'gap-3'
      },
      lg: {
        height: 'h-3',
        step: 'w-10 h-10 text-base',
        text: 'text-base',
        spacing: 'gap-4'
      },
      xl: {
        height: 'h-4',
        step: 'w-12 h-12 text-lg',
        text: 'text-lg',
        spacing: 'gap-6'
      }
    };

    return sizes[config.size];
  };

  const themeColors = getThemeColors();
  const sizeClasses = getSizeClasses();

  // Linear Progress Bar
  const LinearProgress = () => {
    return (
      <div className={cn('w-full', className)}>
        {config.showPercentage && (
          <div className="flex justify-between items-center mb-2">
            <span className={cn('font-medium', sizeClasses.text)}>Progress</span>
            <span className={cn('font-medium', sizeClasses.text)}>{Math.round(progress)}%</span>
          </div>
        )}
        
        <div className={cn(
          'w-full rounded-full overflow-hidden',
          sizeClasses.height,
          themeColors.background
        )}>
          <motion.div
            className={cn('h-full rounded-full', themeColors.active)}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{
              duration: config.animated ? config.animations.duration : 0,
              ease: config.animations.easing
            }}
          />
        </div>
      </div>
    );
  };

  // Circular Progress
  const CircularProgress = () => {
    const size = config.size === 'sm' ? 40 : config.size === 'md' ? 60 : config.size === 'lg' ? 80 : 100;
    const strokeWidth = config.size === 'sm' ? 3 : config.size === 'md' ? 4 : config.size === 'lg' ? 5 : 6;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
      <div className={cn('relative inline-flex items-center justify-center', className)}>
        <svg
          className="transform -rotate-90"
          width={size}
          height={size}
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-gray-200"
          />
          
          {/* Progress circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className="text-primary"
            style={{
              strokeDasharray,
              strokeDashoffset: config.animated ? strokeDashoffset : circumference - (progress / 100) * circumference
            }}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{
              duration: config.animated ? config.animations.duration : 0,
              ease: config.animations.easing
            }}
          />
        </svg>
        
        {config.showPercentage && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn('font-bold', sizeClasses.text)}>
              {Math.round(progress)}%
            </span>
          </div>
        )}
      </div>
    );
  };

  // Stepped Progress
  const SteppedProgress = () => {
    const currentStep = Math.floor(progress);
    
    return (
      <div className={cn(
        'flex items-center',
        config.orientation === 'vertical' ? 'flex-col' : 'flex-row',
        sizeClasses.spacing,
        className
      )}>
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;
          const isCurrent = index <= currentStep;
          
          return (
            <React.Fragment key={step.id}>
              <div className="flex items-center">
                {/* Step Circle */}
                <motion.button
                  className={cn(
                    'rounded-full flex items-center justify-center font-semibold transition-all duration-200',
                    sizeClasses.step,
                    isCompleted ? themeColors.completed : isActive ? themeColors.active : themeColors.inactive,
                    config.interactive && 'hover:scale-105 active:scale-95',
                    step.status === 'error' && 'bg-red-500 text-white',
                    !config.interactive && 'cursor-default'
                  )}
                  onClick={() => config.interactive && onStepClick?.(index, step)}
                  disabled={!config.interactive}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ 
                    delay: config.animated ? index * config.animations.delay : 0,
                    duration: config.animations.duration 
                  }}
                >
                  {step.icon ? (
                    step.icon
                  ) : isCompleted ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : config.showStepNumbers ? (
                    index + 1
                  ) : null}
                </motion.button>

                {/* Step Labels */}
                {config.showLabels && (
                  <div className={cn(
                    'ml-3',
                    config.orientation === 'vertical' && 'ml-0 mt-2 text-center'
                  )}>
                    <div className={cn(
                      'font-medium',
                      sizeClasses.text,
                      isCurrent ? 'text-gray-900' : 'text-gray-500'
                    )}>
                      {step.label}
                      {step.optional && (
                        <span className="text-xs text-gray-400 ml-1">(optional)</span>
                      )}
                    </div>
                    {step.description && (
                      <div className={cn(
                        'text-gray-500 mt-1',
                        config.size === 'sm' ? 'text-xs' : 'text-sm'
                      )}>
                        {step.description}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <motion.div
                  className={cn(
                    config.orientation === 'vertical' ? 'w-0.5 h-8' : 'h-0.5 flex-1',
                    'mx-2',
                    isCompleted ? themeColors.completed : themeColors.inactive
                  )}
                  initial={{ scaleX: config.orientation === 'horizontal' ? 0 : 1, scaleY: config.orientation === 'vertical' ? 0 : 1 }}
                  animate={{ scaleX: 1, scaleY: 1 }}
                  transition={{ 
                    delay: config.animated ? (index + 0.5) * config.animations.delay : 0,
                    duration: config.animations.duration 
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  // Dots Progress
  const DotsProgress = () => {
    const totalDots = 10;
    const activeDots = Math.round((progress / 100) * totalDots);

    return (
      <div className={cn('flex items-center', sizeClasses.spacing, className)}>
        {Array.from({ length: totalDots }).map((_, index) => (
          <motion.div
            key={index}
            className={cn(
              'rounded-full',
              config.size === 'sm' ? 'w-2 h-2' : config.size === 'md' ? 'w-3 h-3' : config.size === 'lg' ? 'w-4 h-4' : 'w-5 h-5',
              index < activeDots ? themeColors.active : themeColors.inactive
            )}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              delay: config.animated ? index * 0.1 : 0,
              duration: config.animations.duration
            }}
          />
        ))}
        
        {config.showPercentage && (
          <span className={cn('ml-4 font-medium', sizeClasses.text)}>
            {Math.round(progress)}%
          </span>
        )}
      </div>
    );
  };

  // Render based on variant
  switch (config.variant) {
    case 'circular':
      return <CircularProgress />;
    case 'stepped':
      return <SteppedProgress />;
    case 'dots':
      return <DotsProgress />;
    case 'linear':
    default:
      return <LinearProgress />;
  }
};

// Preset configurations
export const ProgressIndicatorPresets = {
  // Simple linear progress
  simple: {
    variant: 'linear' as const,
    size: 'md' as const,
    theme: 'primary' as const,
    showPercentage: true,
    animated: true
  },

  // Stepped form progress
  formSteps: {
    variant: 'stepped' as const,
    size: 'md' as const,
    theme: 'primary' as const,
    showLabels: true,
    showStepNumbers: true,
    interactive: true,
    orientation: 'horizontal' as const
  },

  // Circular loading
  loading: {
    variant: 'circular' as const,
    size: 'lg' as const,
    theme: 'primary' as const,
    showPercentage: true,
    animated: true
  },

  // Minimal dots
  minimal: {
    variant: 'dots' as const,
    size: 'sm' as const,
    theme: 'primary' as const,
    showPercentage: false,
    animated: true
  },

  // Vertical steps
  verticalSteps: {
    variant: 'stepped' as const,
    size: 'md' as const,
    theme: 'primary' as const,
    showLabels: true,
    showStepNumbers: true,
    orientation: 'vertical' as const,
    interactive: false
  }
};

export default ProgressIndicator;