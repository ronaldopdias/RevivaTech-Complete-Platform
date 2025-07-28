import React from 'react';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';

interface Feature {
  id: string;
  icon: string;
  title: string;
  description: string;
  media?: {
    type: 'image';
    src: string;
    alt: string;
  };
  reverse?: boolean;
}

interface FeatureHighlightsProps {
  variant?: 'alternating' | 'grid' | 'cards';
  background?: 'default' | 'muted' | 'gradient';
  title?: {
    text: string;
    level?: 1 | 2 | 3 | 4 | 5 | 6;
    alignment?: 'left' | 'center' | 'right';
  };
  subtitle?: {
    text: string;
    alignment?: 'left' | 'center' | 'right';
  };
  features: Feature[];
  className?: string;
}

export function FeatureHighlights({
  variant = 'alternating',
  background = 'default',
  title,
  subtitle,
  features,
  className = '',
}: FeatureHighlightsProps) {
  const backgroundClasses = {
    default: 'bg-white',
    muted: 'bg-gray-50',
    gradient: 'bg-gradient-to-br from-blue-50 to-indigo-100',
  };

  const titleClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  return (
    <section className={`py-16 ${backgroundClasses[background]} ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {title && (
          <div className={`mb-12 ${titleClasses[title.alignment || 'center']}`}>
            {React.createElement(
              (`h${title.level || 2}`) as any,
              {
                className: 'text-3xl md:text-4xl font-bold text-gray-900 mb-4',
              },
              title.text
            )}
            {subtitle && (
              <p className={`text-xl text-gray-600 max-w-3xl ${title.alignment === 'center' ? 'mx-auto' : ''}`}>
                {subtitle.text}
              </p>
            )}
          </div>
        )}

        <div className="space-y-16">
          {features.map((feature, index) => (
            <div
              key={feature.id}
              className={`flex flex-col lg:flex-row items-center gap-12 ${
                variant === 'alternating' && (feature.reverse || index % 2 === 1)
                  ? 'lg:flex-row-reverse'
                  : ''
              }`}
            >
              {/* Content */}
              <div className="flex-1 lg:max-w-lg">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Icon name={feature.icon} className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">{feature.title}</h3>
                </div>
                <p className="text-lg text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>

              {/* Media */}
              {feature.media && (
                <div className="flex-1 lg:max-w-lg">
                  <Card className="overflow-hidden border-0 shadow-lg">
                    <img
                      src={feature.media.src}
                      alt={feature.media.alt}
                      className="w-full h-64 object-cover"
                      loading="lazy"
                    />
                  </Card>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FeatureHighlights;