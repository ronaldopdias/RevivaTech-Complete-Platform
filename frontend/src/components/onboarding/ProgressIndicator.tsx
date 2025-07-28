'use client';

import { CheckCircle, Circle, Clock } from 'lucide-react';

interface ProgressStep {
  id: string;
  title: string;
  description?: string;
  status: 'completed' | 'current' | 'pending';
  optional?: boolean;
}

interface ProgressIndicatorProps {
  steps: ProgressStep[];
  orientation?: 'horizontal' | 'vertical';
  showDescriptions?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const ProgressIndicator = ({
  steps,
  orientation = 'horizontal',
  showDescriptions = true,
  className = '',
  size = 'md',
}: ProgressIndicatorProps) => {
  const sizeClasses = {
    sm: {
      circle: 'w-6 h-6',
      text: 'text-xs',
      description: 'text-xs',
      spacing: orientation === 'horizontal' ? 'space-x-2' : 'space-y-2',
    },
    md: {
      circle: 'w-8 h-8',
      text: 'text-sm',
      description: 'text-sm',
      spacing: orientation === 'horizontal' ? 'space-x-4' : 'space-y-4',
    },
    lg: {
      circle: 'w-10 h-10',
      text: 'text-base',
      description: 'text-sm',
      spacing: orientation === 'horizontal' ? 'space-x-6' : 'space-y-6',
    },
  };

  const getStepIcon = (step: ProgressStep) => {
    const iconSize = size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5';
    
    switch (step.status) {
      case 'completed':
        return <CheckCircle className={`${iconSize} text-white`} />;
      case 'current':
        return <Clock className={`${iconSize} text-white`} />;
      default:
        return <Circle className={`${iconSize} text-gray-400`} />;
    }
  };

  const getStepColors = (step: ProgressStep) => {
    switch (step.status) {
      case 'completed':
        return 'bg-green-600 border-green-600';
      case 'current':
        return 'bg-blue-600 border-blue-600';
      default:
        return 'bg-gray-200 border-gray-300';
    }
  };

  const getTextColors = (step: ProgressStep) => {
    switch (step.status) {
      case 'completed':
        return 'text-green-600';
      case 'current':
        return 'text-blue-600';
      default:
        return 'text-gray-500';
    }
  };

  const getConnectorColor = (index: number) => {
    const currentStep = steps[index];
    const nextStep = steps[index + 1];
    
    if (currentStep.status === 'completed') {
      return 'bg-green-600';
    }
    if (currentStep.status === 'current' && nextStep?.status === 'pending') {
      return 'bg-gradient-to-r from-blue-600 to-gray-300';
    }
    return 'bg-gray-300';
  };

  if (orientation === 'vertical') {
    return (
      <div className={`${className}`}>
        <div className={`flex flex-col ${sizeClasses[size].spacing}`}>
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-start space-x-3">
              {/* Step indicator */}
              <div className="flex flex-col items-center flex-shrink-0">
                <div
                  className={`
                    ${sizeClasses[size].circle} 
                    rounded-full border-2 flex items-center justify-center
                    ${getStepColors(step)}
                  `}
                >
                  {getStepIcon(step)}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-0.5 h-8 mt-2 ${getConnectorColor(index)}`} />
                )}
              </div>

              {/* Step content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h3 className={`font-medium ${getTextColors(step)} ${sizeClasses[size].text}`}>
                    {step.title}
                  </h3>
                  {step.optional && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      Optional
                    </span>
                  )}
                </div>
                {showDescriptions && step.description && (
                  <p className={`text-gray-600 mt-1 ${sizeClasses[size].description}`}>
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className={`flex items-center ${sizeClasses[size].spacing}`}>
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            {/* Step indicator */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div
                className={`
                  ${sizeClasses[size].circle} 
                  rounded-full border-2 flex items-center justify-center
                  ${getStepColors(step)}
                `}
              >
                {getStepIcon(step)}
              </div>
              
              <div className="mt-2 text-center">
                <div className="flex items-center space-x-1">
                  <h3 className={`font-medium ${getTextColors(step)} ${sizeClasses[size].text}`}>
                    {step.title}
                  </h3>
                  {step.optional && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-1 py-0.5 rounded">
                      Optional
                    </span>
                  )}
                </div>
                {showDescriptions && step.description && (
                  <p className={`text-gray-600 mt-1 ${sizeClasses[size].description} max-w-24`}>
                    {step.description}
                  </p>
                )}
              </div>
            </div>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-4 ${getConnectorColor(index)}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Simple progress bar for basic use cases
export const SimpleProgressBar = ({
  current,
  total,
  showPercentage = true,
  className = '',
}: {
  current: number;
  total: number;
  showPercentage?: boolean;
  className?: string;
}) => {
  const percentage = Math.round((current / total) * 100);

  return (
    <div className={`space-y-2 ${className}`}>
      {showPercentage && (
        <div className="flex justify-between text-sm text-gray-600">
          <span>Progress</span>
          <span>{percentage}% complete</span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>Step {current} of {total}</span>
      </div>
    </div>
  );
};

// Circular progress indicator
export const CircularProgress = ({
  current,
  total,
  size = 60,
  strokeWidth = 4,
  className = '',
}: {
  current: number;
  total: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) => {
  const percentage = (current / total) * 100;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
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
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-200"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-blue-600 transition-all duration-300 ease-out"
        />
      </svg>
      {/* Percentage text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-semibold text-gray-900">
          {Math.round(percentage)}%
        </span>
      </div>
    </div>
  );
};

export default ProgressIndicator;