import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

// Services grid variants
const servicesGridVariants = cva(
  "w-full",
  {
    variants: {
      variant: {
        cards: "space-y-8",
        detailed: "space-y-12",
        compact: "space-y-6",
        list: "space-y-4",
      },
      layout: {
        grid: "",
        masonry: "",
        list: "flex flex-col",
      },
    },
    defaultVariants: {
      variant: "cards",
      layout: "grid",
    },
  }
);

// Grid container variants
const gridContainerVariants = cva(
  "grid gap-6",
  {
    variants: {
      columns: {
        1: "grid-cols-1",
        2: "grid-cols-1 md:grid-cols-2",
        3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
      },
    },
    defaultVariants: {
      columns: 3,
    },
  }
);

// Service interface
export interface Service {
  id: string;
  title: string;
  description: string;
  icon?: string;
  href?: string;
  category?: string;
  featured?: boolean;
  badge?: string;
  pricing?: {
    from: number;
    currency: string;
  };
  features?: string[];
  image?: {
    src: string;
    alt: string;
  };
}

// Props interface
export interface ServicesGridProps extends VariantProps<typeof servicesGridVariants> {
  title?: {
    text: string;
    level?: 1 | 2 | 3 | 4 | 5 | 6;
    alignment?: 'left' | 'center' | 'right';
  };
  subtitle?: {
    text: string;
    alignment?: 'left' | 'center' | 'right';
  };
  services: Service[];
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  showPricing?: boolean;
  showFeatures?: boolean;
  showCategories?: boolean;
  className?: string;
}

// Icon mapping (simplified - in production would use proper icon library)
const iconMap: Record<string, React.ComponentType<any>> = {
  laptop: ({ className }: { className?: string }) => (
    <div className={cn("w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center", className)}>
      💻
    </div>
  ),
  desktop: ({ className }: { className?: string }) => (
    <div className={cn("w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center", className)}>
      🖥️
    </div>
  ),
  smartphone: ({ className }: { className?: string }) => (
    <div className={cn("w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center", className)}>
      📱
    </div>
  ),
  harddrive: ({ className }: { className?: string }) => (
    <div className={cn("w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center", className)}>
      💾
    </div>
  ),
  shield: ({ className }: { className?: string }) => (
    <div className={cn("w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center", className)}>
      🛡️
    </div>
  ),
  cpu: ({ className }: { className?: string }) => (
    <div className={cn("w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center", className)}>
      🔧
    </div>
  ),
};

// Service Card Component
interface ServiceCardProps {
  service: Service;
  variant: 'cards' | 'detailed' | 'compact' | 'list';
  showPricing?: boolean;
  showFeatures?: boolean;
}

const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  variant,
  showPricing = true,
  showFeatures = true,
}) => {
  const IconComponent = service.icon ? iconMap[service.icon] : null;

  if (variant === 'list') {
    return (
      <div className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-accent transition-colors">
        {IconComponent && <IconComponent className="flex-shrink-0" />}
        <div className="flex-1">
          <h3 className="font-semibold">{service.title}</h3>
          <p className="text-sm text-muted-foreground">{service.description}</p>
        </div>
        {showPricing && service.pricing && (
          <div className="text-right">
            <div className="font-semibold">
              From {service.pricing.currency === 'GBP' ? '£' : '$'}{service.pricing.from}
            </div>
          </div>
        )}
        <Button variant="outline" size="sm" href={service.href}>
          Learn More
        </Button>
      </div>
    );
  }

  return (
    <Card
      variant={service.featured ? 'elevated' : 'outlined'}
      className="h-full hover:shadow-lg transition-shadow"
      clickable={false}
    >
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {IconComponent && <IconComponent />}
            <div>
              <h3 className="font-semibold text-lg">{service.title}</h3>
              {service.category && (
                <span className="text-sm text-muted-foreground">{service.category}</span>
              )}
            </div>
          </div>
          {service.badge && (
            <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
              {service.badge}
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-muted-foreground">{service.description}</p>

        {/* Features */}
        {showFeatures && service.features && service.features.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">What's included:</h4>
            <ul className="space-y-1">
              {service.features.slice(0, variant === 'compact' ? 3 : 4).map((feature, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-center">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Pricing and CTA */}
        <div className="flex items-center justify-between pt-4 border-t">
          {showPricing && service.pricing ? (
            <div>
              <div className="font-semibold text-lg">
                From {service.pricing.currency === 'GBP' ? '£' : '$'}{service.pricing.from}
              </div>
              <div className="text-xs text-muted-foreground">+ diagnostic fee</div>
            </div>
          ) : (
            <div className="font-semibold text-lg">Quote on request</div>
          )}
          
          <Button 
            variant={service.featured ? 'primary' : 'outline'}
            size="sm"
            href={service.href}
          >
            {variant === 'detailed' ? 'Get Quote' : 'Learn More'}
          </Button>
        </div>
      </div>
    </Card>
  );
};

// Main ServicesGrid component
export const ServicesGrid: React.FC<ServicesGridProps> = ({
  variant,
  layout,
  title,
  subtitle,
  services,
  columns,
  showPricing = true,
  showFeatures = true,
  showCategories = false,
  className,
}) => {
  const TitleTag = title?.level ? (`h${title.level}` as any) : 'h2';

  // Group services by category if showing categories
  const groupedServices = showCategories
    ? services.reduce((groups, service) => {
        const category = service.category || 'Other';
        if (!groups[category]) groups[category] = [];
        groups[category].push(service);
        return groups;
      }, {} as Record<string, Service[]>)
    : { 'All Services': services };

  // Determine grid columns
  const gridColumns = columns?.desktop || 3;

  return (
    <section className={cn(servicesGridVariants({ variant, layout }), className)}>
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

      {/* Services */}
      <div className="space-y-12">
        {Object.entries(groupedServices).map(([categoryName, categoryServices]) => (
          <div key={categoryName} className="space-y-6">
            {/* Category Header */}
            {showCategories && Object.keys(groupedServices).length > 1 && (
              <div>
                <h3 className="text-xl font-semibold">{categoryName}</h3>
              </div>
            )}

            {/* Services Grid/List */}
            <div className={cn(
              layout === 'grid' && gridContainerVariants({ 
                columns: gridColumns as 1 | 2 | 3 | 4 
              }),
              layout === 'list' && "space-y-4"
            )}>
              {categoryServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  variant={variant || 'cards'}
                  showPricing={showPricing}
                  showFeatures={showFeatures}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ServicesGrid;