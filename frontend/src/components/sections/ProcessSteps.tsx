import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Process steps variants
const processStepsVariants = cva(
  "w-full",
  {
    variants: {
      variant: {
        numbered: "space-y-8",
        timeline: "space-y-6",
        cards: "space-y-8",
        minimal: "space-y-4",
      },
      layout: {
        vertical: "space-y-8",
        horizontal: "",
        grid: "",
      },
    },
    defaultVariants: {
      variant: "numbered",
      layout: "vertical",
    },
  }
);

// Step interface
export interface ProcessStep {
  id: string;
  number: number;
  title: string;
  description: string;
  icon?: string;
  details?: string[];
  image?: {
    src: string;
    alt: string;
  };
  status?: 'completed' | 'current' | 'upcoming';
}

// Props interface
export interface ProcessStepsProps extends VariantProps<typeof processStepsVariants> {
  title?: {
    text: string;
    level?: 1 | 2 | 3 | 4 | 5 | 6;
    alignment?: 'left' | 'center' | 'right';
  };
  subtitle?: {
    text: string;
    alignment?: 'left' | 'center' | 'right';
  };
  steps: ProcessStep[];
  showDetails?: boolean;
  showIcons?: boolean;
  className?: string;
}

// Icon mapping
const iconMap: Record<string, string> = {
  calendar: '📅',
  search: '🔍',
  'file-text': '📋',
  wrench: '🔧',
  'check-circle': '✅',
  form: '📝',
  'calendar-check': '📅✅',
  tool: '🛠️',
  phone: '📞',
  email: '📧',
  package: '📦',
  star: '⭐',
  shield: '🛡️',
  clock: '⏰',
};

// Individual Step Component
interface StepComponentProps {
  step: ProcessStep;
  variant: 'numbered' | 'timeline' | 'cards' | 'minimal';
  layout: 'vertical' | 'horizontal' | 'grid';
  showDetails?: boolean;
  showIcons?: boolean;
  isLast?: boolean;
}

const StepComponent: React.FC<StepComponentProps> = ({
  step,
  variant,
  layout,
  showDetails = true,
  showIcons = true,
  isLast = false,
}) => {
  const icon = step.icon ? iconMap[step.icon] : null;

  // Status styling
  const getStatusStyling = () => {
    switch (step.status) {
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'current':
        return 'text-primary bg-primary/10 border-primary/20';
      case 'upcoming':
        return 'text-muted-foreground bg-muted border-border';
      default:
        return 'text-primary bg-primary/10 border-primary/20';
    }
  };

  if (variant === 'cards') {
    return (
      <div className="bg-card border rounded-lg p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start space-x-4">
          <div className={cn(
            "flex-shrink-0 w-12 h-12 rounded-full border-2 flex items-center justify-center font-bold",
            getStatusStyling()
          )}>
            {showIcons && icon ? (
              <span className="text-lg">{icon}</span>
            ) : (
              step.number
            )}
          </div>
          
          <div className="flex-1 space-y-2">
            <h3 className="text-lg font-semibold">{step.title}</h3>
            <p className="text-muted-foreground">{step.description}</p>
            
            {showDetails && step.details && step.details.length > 0 && (
              <ul className="space-y-1 text-sm text-muted-foreground">
                {step.details.map((detail, index) => (
                  <li key={index} className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2 mt-1.5 flex-shrink-0" />
                    {detail}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'timeline') {
    return (
      <div className="relative flex items-start space-x-4">
        {/* Timeline line */}
        {!isLast && (
          <div className="absolute left-6 top-12 w-0.5 h-full bg-border" />
        )}
        
        {/* Step indicator */}
        <div className={cn(
          "relative z-10 flex-shrink-0 w-12 h-12 rounded-full border-2 flex items-center justify-center font-bold",
          getStatusStyling()
        )}>
          {showIcons && icon ? (
            <span className="text-lg">{icon}</span>
          ) : (
            step.number
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 pb-8">
          <h3 className="text-lg font-semibold">{step.title}</h3>
          <p className="text-muted-foreground mt-1">{step.description}</p>
          
          {showDetails && step.details && step.details.length > 0 && (
            <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
              {step.details.map((detail, index) => (
                <li key={index} className="flex items-start">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2 mt-1.5 flex-shrink-0" />
                  {detail}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <div className="flex items-center space-x-3">
        <div className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full border flex items-center justify-center text-sm font-medium",
          getStatusStyling()
        )}>
          {step.number}
        </div>
        <div>
          <h4 className="font-medium">{step.title}</h4>
          <p className="text-sm text-muted-foreground">{step.description}</p>
        </div>
      </div>
    );
  }

  // Default numbered variant
  return (
    <div className="flex items-start space-x-6">
      <div className={cn(
        "flex-shrink-0 w-16 h-16 rounded-full border-2 flex items-center justify-center font-bold text-xl",
        getStatusStyling()
      )}>
        {showIcons && icon ? (
          <span className="text-2xl">{icon}</span>
        ) : (
          step.number
        )}
      </div>
      
      <div className="flex-1 space-y-2">
        <h3 className="text-xl font-semibold">{step.title}</h3>
        <p className="text-muted-foreground text-lg">{step.description}</p>
        
        {showDetails && step.details && step.details.length > 0 && (
          <ul className="space-y-2 text-muted-foreground">
            {step.details.map((detail, index) => (
              <li key={index} className="flex items-start">
                <span className="w-2 h-2 bg-primary rounded-full mr-3 mt-2 flex-shrink-0" />
                {detail}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

// Main ProcessSteps component
export const ProcessSteps: React.FC<ProcessStepsProps> = ({
  variant,
  layout,
  title,
  subtitle,
  steps,
  showDetails = true,
  showIcons = true,
  className,
}) => {
  const TitleTag = title?.level ? (`h${title.level}` as any) : 'h2';

  return (
    <section className={cn(processStepsVariants({ variant, layout }), className)}>
      {/* Section Header */}
      {(title || subtitle) && (
        <div className={cn(
          "space-y-4",
          title?.alignment === 'center' && "text-center",
          title?.alignment === 'right' && "text-right"
        )}>
          {title && (
            <TitleTag className="text-3xl font-bold tracking-tight">
              {title.text}
            </TitleTag>
          )}
          {subtitle && (
            <p className={cn(
              "text-lg text-muted-foreground max-w-3xl",
              title?.alignment === 'center' && "mx-auto",
              title?.alignment === 'right' && "ml-auto"
            )}>
              {subtitle.text}
            </p>
          )}
        </div>
      )}

      {/* Steps */}
      <div className={cn(
        layout === 'horizontal' && variant !== 'timeline' && "grid gap-8 md:grid-cols-2 lg:grid-cols-3",
        layout === 'grid' && "grid gap-6 md:grid-cols-2 lg:grid-cols-3",
        layout === 'vertical' && "space-y-8"
      )}>
        {steps.map((step, index) => (
          <StepComponent
            key={step.id}
            step={step}
            variant={variant || 'numbered'}
            layout={layout || 'vertical'}
            showDetails={showDetails}
            showIcons={showIcons}
            isLast={index === steps.length - 1}
          />
        ))}
      </div>
    </section>
  );
};

export default ProcessSteps;