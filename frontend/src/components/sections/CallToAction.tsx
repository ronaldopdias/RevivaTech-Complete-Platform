import React from 'react';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

interface ActionButton {
  component: 'Button';
  props: {
    text: string;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    href?: string;
    onClick?: () => void;
  };
}

interface CallToActionProps {
  variant?: 'primary' | 'secondary' | 'accent';
  background?: 'solid' | 'gradient' | 'pattern';
  alignment?: 'left' | 'center' | 'right';
  title?: {
    text: string;
    level?: 1 | 2 | 3 | 4 | 5 | 6;
    variant?: 'display' | 'heading' | 'subheading';
  };
  description?: {
    text: string;
    variant?: 'large' | 'medium' | 'small';
  };
  actions?: ActionButton[];
  features?: string[];
  className?: string;
}

export function CallToAction({
  variant = 'primary',
  background = 'gradient',
  alignment = 'center',
  title,
  description,
  actions = [],
  features = [],
  className = '',
}: CallToActionProps) {
  const variantClasses = {
    primary: 'text-white',
    secondary: 'text-gray-900',
    accent: 'text-white',
  };

  const backgroundClasses = {
    solid: {
      primary: 'bg-blue-600',
      secondary: 'bg-gray-100',
      accent: 'bg-indigo-600',
    },
    gradient: {
      primary: 'bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800',
      secondary: 'bg-gradient-to-br from-gray-50 to-gray-100',
      accent: 'bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700',
    },
    pattern: {
      primary: 'bg-blue-600 bg-opacity-90',
      secondary: 'bg-gray-100',
      accent: 'bg-indigo-600 bg-opacity-90',
    },
  };

  const alignmentClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  const titleVariantClasses = {
    display: 'text-4xl md:text-5xl lg:text-6xl font-bold',
    heading: 'text-3xl md:text-4xl font-bold',
    subheading: 'text-2xl md:text-3xl font-semibold',
  };

  const descriptionVariantClasses = {
    large: 'text-xl md:text-2xl',
    medium: 'text-lg md:text-xl',
    small: 'text-base md:text-lg',
  };

  return (
    <section 
      className={`
        py-20 lg:py-24 relative overflow-hidden
        ${backgroundClasses[background][variant]}
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {/* Background Pattern */}
      {background === 'pattern' && (
        <div className="absolute inset-0 opacity-10">
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 80%, currentColor 1px, transparent 1px),
                               radial-gradient(circle at 80% 20%, currentColor 1px, transparent 1px)`,
              backgroundSize: '50px 50px',
            }}
          />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className={`max-w-4xl ${alignment === 'center' ? 'mx-auto' : ''} ${alignmentClasses[alignment]}`}>
          {/* Title */}
          {title && (
            <div className="mb-6">
              {React.createElement(
                (`h${title.level || 2}`) as any,
                {
                  className: `${titleVariantClasses[title.variant || 'heading']} leading-tight`,
                },
                title.text
              )}
            </div>
          )}

          {/* Description */}
          {description && (
            <p className={`${descriptionVariantClasses[description.variant || 'medium']} mb-8 opacity-90 leading-relaxed`}>
              {description.text}
            </p>
          )}

          {/* Features List */}
          {features.length > 0 && (
            <div className={`mb-8 ${alignment === 'center' ? 'flex justify-center' : ''}`}>
              <ul className="flex flex-col sm:flex-row gap-4 sm:gap-6 text-sm md:text-base">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Icon lucideIcon="Check" className="w-5 h-5 flex-shrink-0 opacity-80" />
                    <span className="opacity-90">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          {actions.length > 0 && (
            <div className={`flex flex-col sm:flex-row gap-4 ${alignment === 'center' ? 'justify-center' : alignment === 'right' ? 'justify-end' : 'justify-start'}`}>
              {actions.map((action, index) => {
                const buttonProps = {
                  ...action.props,
                  className: `shadow-lg ${
                    action.props.variant === 'secondary' 
                      ? 'bg-white text-gray-900 hover:bg-gray-50' 
                      : action.props.variant === 'ghost'
                      ? 'text-current border-current hover:bg-white/10'
                      : ''
                  }`,
                };

                if (action.props.href) {
                  return (
                    <a
                      key={index}
                      href={action.props.href}
                      className="inline-block"
                    >
                      <Button {...buttonProps}>
                        {action.props.text}
                      </Button>
                    </a>
                  );
                }

                return (
                  <Button
                    key={index}
                    {...buttonProps}
                    onClick={action.props.onClick}
                  >
                    {action.props.text}
                  </Button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-40 h-40 bg-white/5 rounded-full -translate-x-20 -translate-y-20" />
      <div className="absolute bottom-0 right-0 w-60 h-60 bg-white/5 rounded-full translate-x-30 translate-y-30" />
    </section>
  );
}

export default CallToAction;