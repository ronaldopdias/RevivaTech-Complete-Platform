'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/useIsMobile';
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  Eye, 
  Code, 
  Palette, 
  Layers,
  Book,
  Settings,
  Star,
  Download,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

interface ComponentItem {
  id: string;
  name: string;
  description: string;
  category: 'ui' | 'business' | 'layout' | 'forms' | 'navigation' | 'feedback';
  status: 'stable' | 'beta' | 'new' | 'deprecated';
  complexity: 'simple' | 'medium' | 'complex';
  dependencies: string[];
  examples: number;
  usage: number;
  lastUpdated: string;
  storybookPath?: string;
}

const COMPONENT_LIBRARY: ComponentItem[] = [
  {
    id: 'button',
    name: 'Button',
    description: 'Highly configurable button component with multiple variants, sizes, and states',
    category: 'ui',
    status: 'stable',
    complexity: 'simple',
    dependencies: ['class-variance-authority', 'lucide-react'],
    examples: 25,
    usage: 847,
    lastUpdated: '2025-07-18',
    storybookPath: '/?path=/docs/ui-button--docs'
  },
  {
    id: 'card',
    name: 'Card',
    description: 'Flexible card component with slot-based composition and interactive states',
    category: 'ui',
    status: 'stable',
    complexity: 'medium',
    dependencies: ['class-variance-authority', 'slot-provider'],
    examples: 18,
    usage: 623,
    lastUpdated: '2025-07-18',
    storybookPath: '/?path=/docs/ui-card--docs'
  },
  {
    id: 'input',
    name: 'Input',
    description: 'Advanced input component with validation states, icons, and accessibility features',
    category: 'forms',
    status: 'stable',
    complexity: 'medium',
    dependencies: ['class-variance-authority', 'lucide-react'],
    examples: 22,
    usage: 534,
    lastUpdated: '2025-07-18',
    storybookPath: '/?path=/docs/ui-input--docs'
  },
  {
    id: 'badge',
    name: 'Badge',
    description: 'Status and category indicators with multiple variants and animations',
    category: 'ui',
    status: 'stable',
    complexity: 'simple',
    dependencies: ['class-variance-authority'],
    examples: 12,
    usage: 289,
    lastUpdated: '2025-07-17',
    storybookPath: '/?path=/docs/ui-badge--docs'
  },
  {
    id: 'select',
    name: 'Select',
    description: 'Custom select dropdown with search, multi-select, and accessibility',
    category: 'forms',
    status: 'stable',
    complexity: 'complex',
    dependencies: ['class-variance-authority', 'react-select'],
    examples: 15,
    usage: 412,
    lastUpdated: '2025-07-17',
    storybookPath: '/?path=/docs/ui-select--docs'
  },
  {
    id: 'checkbox',
    name: 'Checkbox',
    description: 'Styled checkbox with indeterminate state and label support',
    category: 'forms',
    status: 'stable',
    complexity: 'simple',
    dependencies: ['class-variance-authority'],
    examples: 8,
    usage: 267,
    lastUpdated: '2025-07-17',
    storybookPath: '/?path=/docs/ui-checkbox--docs'
  },
  {
    id: 'booking-wizard',
    name: 'BookingWizard',
    description: 'Multi-step booking wizard with device selection and pricing',
    category: 'business',
    status: 'stable',
    complexity: 'complex',
    dependencies: ['framer-motion', 'react-hook-form'],
    examples: 14,
    usage: 125,
    lastUpdated: '2025-07-18',
    storybookPath: '/?path=/docs/business-bookingwizard--docs'
  },
  {
    id: 'device-selector',
    name: 'DeviceSelector',
    description: 'Interactive device selection with search and filtering',
    category: 'business',
    status: 'stable',
    complexity: 'complex',
    dependencies: ['fuse.js', 'react-virtual'],
    examples: 10,
    usage: 89,
    lastUpdated: '2025-07-17',
    storybookPath: '/?path=/docs/business-deviceselector--docs'
  },
  {
    id: 'payment-gateway',
    name: 'PaymentGateway',
    description: 'Stripe and PayPal payment processing component',
    category: 'business',
    status: 'beta',
    complexity: 'complex',
    dependencies: ['@stripe/stripe-js', 'paypal-checkout'],
    examples: 6,
    usage: 34,
    lastUpdated: '2025-07-16',
    storybookPath: '/?path=/docs/business-paymentgateway--docs'
  },
  {
    id: 'price-calculator',
    name: 'PriceCalculator',
    description: 'Dynamic pricing engine with real-time calculations',
    category: 'business',
    status: 'stable',
    complexity: 'complex',
    dependencies: ['decimal.js', 'lodash'],
    examples: 12,
    usage: 156,
    lastUpdated: '2025-07-17',
    storybookPath: '/?path=/docs/business-pricecalculator--docs'
  }
];

interface ComponentShowcaseProps {
  className?: string;
}

export const ComponentShowcase: React.FC<ComponentShowcaseProps> = ({
  className
}) => {
  const { isMobile, isTablet } = useIsMobile();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(isMobile ? 'list' : 'grid');
  const [sortBy, setSortBy] = useState<'name' | 'usage' | 'updated'>('usage');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(!isMobile);

  // Filter and sort components
  const filteredComponents = COMPONENT_LIBRARY
    .filter(component => {
      const matchesSearch = component.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          component.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || component.category === selectedCategory;
      const matchesStatus = selectedStatus === 'all' || component.status === selectedStatus;
      
      return matchesSearch && matchesCategory && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'usage':
          return b.usage - a.usage;
        case 'updated':
          return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
        default:
          return 0;
      }
    });

  const categories = [
    { value: 'all', label: 'All Categories', count: COMPONENT_LIBRARY.length },
    { value: 'ui', label: 'UI Components', count: COMPONENT_LIBRARY.filter(c => c.category === 'ui').length },
    { value: 'business', label: 'Business Logic', count: COMPONENT_LIBRARY.filter(c => c.category === 'business').length },
    { value: 'forms', label: 'Form Components', count: COMPONENT_LIBRARY.filter(c => c.category === 'forms').length },
    { value: 'layout', label: 'Layout', count: COMPONENT_LIBRARY.filter(c => c.category === 'layout').length },
    { value: 'navigation', label: 'Navigation', count: COMPONENT_LIBRARY.filter(c => c.category === 'navigation').length },
    { value: 'feedback', label: 'Feedback', count: COMPONENT_LIBRARY.filter(c => c.category === 'feedback').length }
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status', color: 'default' },
    { value: 'stable', label: 'Stable', color: 'green' },
    { value: 'beta', label: 'Beta', color: 'yellow' },
    { value: 'new', label: 'New', color: 'blue' },
    { value: 'deprecated', label: 'Deprecated', color: 'red' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'stable': return 'bg-green-100 text-green-800 border-green-200';
      case 'beta': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'new': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'deprecated': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'complex': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const copyImportCode = (componentName: string) => {
    const importCode = `import { ${componentName} } from '@/components/ui/${componentName}';`;
    navigator.clipboard.writeText(importCode);
    setCopiedCode(componentName);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const openStorybook = (path?: string) => {
    if (path) {
      // In production, this would open Storybook in a new tab
      // For now, we'll simulate opening Storybook
      window.open(`http://localhost:6006${path}`, '_blank');
    }
  };

  return (
    <div className={cn(
      'space-y-6',
      isMobile && 'component-showcase p-mobile-4',
      className
    )}>
      {/* Mobile-optimized Header */}
      <div className={cn(
        'flex items-center justify-between',
        isMobile && 'flex-col space-y-4 items-start'
      )}>
        <div className={cn(isMobile && 'w-full')}>
          <h2 className={cn(
            'text-2xl font-bold',
            isMobile && 'text-mobile-xl'
          )}>
            Component Showcase
          </h2>
          <p className={cn(
            'text-muted-foreground',
            isMobile && 'text-mobile-sm'
          )}>
            {isMobile 
              ? 'Browse UI components' 
              : 'Browse and discover all available UI components with live examples'
            }
          </p>
        </div>
        
        {/* Mobile action buttons */}
        <div className={cn(
          'flex items-center space-x-2',
          isMobile && 'w-full justify-between'
        )}>
          {isMobile ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="touch-target flex-1"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openStorybook()}
                className="touch-target flex-1"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Storybook
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                icon={{ component: Book, position: 'left' }}
                text="Documentation"
              />
              <Button
                variant="outline"
                size="sm"
                icon={{ component: ExternalLink, position: 'left' }}
                text="Storybook"
                onClick={() => openStorybook()}
              />
            </>
          )}
        </div>
      </div>

      {/* Mobile-optimized Search */}
      <div className={cn(isMobile && 'space-y-4')}>
        <div className={cn(isMobile && 'w-full')}>
          <Input
            label=""
            placeholder={isMobile ? "Search..." : "Search components..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            clearable
            onClear={() => setSearchQuery('')}
            className={cn(isMobile && 'component-search touch-target')}
          />
        </div>

        {/* Mobile Filters - Collapsible */}
        {(!isMobile || showFilters) && (
          <div className={cn(
            isMobile 
              ? 'space-y-3 p-4 bg-card border rounded-lg' 
              : 'grid grid-cols-1 lg:grid-cols-12 gap-4'
          )}>
            {/* Category Filter Tags for Mobile */}
            {isMobile ? (
              <div>
                <h4 className="text-sm font-medium mb-2">Categories</h4>
                <div className="component-filter-tags">
                  {categories.map(category => (
                    <button
                      key={category.value}
                      onClick={() => setSelectedCategory(category.value)}
                      className={cn(
                        'component-filter-tag',
                        selectedCategory === category.value && 'active'
                      )}
                    >
                      {category.label} {category.count > 0 && `(${category.count})`}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="lg:col-span-3">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full h-10 px-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label} ({category.count})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Status Filter */}
            {isMobile ? (
              <div>
                <h4 className="text-sm font-medium mb-2">Status</h4>
                <div className="component-filter-tags">
                  {statusOptions.map(status => (
                    <button
                      key={status.value}
                      onClick={() => setSelectedStatus(status.value)}
                      className={cn(
                        'component-filter-tag',
                        selectedStatus === status.value && 'active'
                      )}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="lg:col-span-2">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full h-10 px-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {statusOptions.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Sort and View Mode */}
            {isMobile ? (
              <div className="flex space-x-3">
                <div className="flex-1">
                  <h4 className="text-sm font-medium mb-2">Sort by</h4>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full h-12 px-3 py-2 text-base border border-input bg-background rounded-md touch-target"
                  >
                    <option value="usage">Most Used</option>
                    <option value="name">Alphabetical</option>
                    <option value="updated">Recently Updated</option>
                  </select>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium mb-2">View</h4>
                  <div className="flex border rounded-md h-12">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={cn(
                        'flex-1 px-3 py-2 rounded-l-md transition-colors touch-target',
                        viewMode === 'grid' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'hover:bg-muted'
                      )}
                    >
                      <Grid className="h-4 w-4 mx-auto" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={cn(
                        'flex-1 px-3 py-2 rounded-r-md transition-colors border-l touch-target',
                        viewMode === 'list' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'hover:bg-muted'
                      )}
                    >
                      <List className="h-4 w-4 mx-auto" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="lg:col-span-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full h-10 px-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="usage">Most Used</option>
                    <option value="name">Alphabetical</option>
                    <option value="updated">Recently Updated</option>
                  </select>
                </div>

                <div className="lg:col-span-1">
                  <div className="flex border rounded-md">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={cn(
                        'flex-1 px-3 py-2 text-sm rounded-l-md transition-colors',
                        viewMode === 'grid' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'hover:bg-muted'
                      )}
                    >
                      <Grid className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={cn(
                        'flex-1 px-3 py-2 text-sm rounded-r-md transition-colors border-l',
                        viewMode === 'list' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'hover:bg-muted'
                      )}
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Layers className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Components</p>
              <p className="text-xl font-bold">{COMPONENT_LIBRARY.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Check className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Stable</p>
              <p className="text-xl font-bold">
                {COMPONENT_LIBRARY.filter(c => c.status === 'stable').length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Star className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Usage</p>
              <p className="text-xl font-bold">
                {COMPONENT_LIBRARY.reduce((acc, c) => acc + c.usage, 0)}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Code className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Examples</p>
              <p className="text-xl font-bold">
                {COMPONENT_LIBRARY.reduce((acc, c) => acc + c.examples, 0)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Results */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredComponents.length} component{filteredComponents.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Mobile-optimized Component Grid/List */}
      {viewMode === 'grid' ? (
        <div className={cn(
          isMobile 
            ? 'component-showcase space-y-4' 
            : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
        )}>
          {filteredComponents.map(component => (
            <Card 
              key={component.id} 
              className={cn(
                'hover:shadow-lg transition-shadow',
                isMobile && 'component-card touch-feedback'
              )}
            >
              <CardHeader className={cn(isMobile && 'p-mobile-4')}>
                <div className="flex items-center justify-between">
                  <CardTitle className={cn(
                    'text-lg',
                    isMobile && 'component-card-title'
                  )}>
                    {component.name}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant="outline" 
                      className={getStatusColor(component.status)}
                    >
                      {component.status}
                    </Badge>
                  </div>
                </div>
                <CardDescription className={cn(
                  'text-sm',
                  isMobile && 'component-card-description'
                )}>
                  {component.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Category</span>
                    <Badge variant="secondary">{component.category}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Complexity</span>
                    <Badge 
                      variant="outline" 
                      className={getComplexityColor(component.complexity)}
                    >
                      {component.complexity}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Usage</span>
                    <span className="font-medium">{component.usage}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Examples</span>
                    <span className="font-medium">{component.examples}</span>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className={cn(isMobile && 'p-mobile-4')}>
                <div className={cn(
                  'flex items-center space-x-2 w-full',
                  isMobile && 'space-x-3'
                )}>
                  <Button
                    variant="outline"
                    size={isMobile ? 'default' : 'sm'}
                    icon={{ 
                      component: copiedCode === component.name ? Check : Copy, 
                      position: 'left' 
                    }}
                    text={copiedCode === component.name ? 'Copied!' : 'Import'}
                    onClick={() => copyImportCode(component.name)}
                    className={cn(
                      'flex-1',
                      isMobile && 'touch-target min-h-12'
                    )}
                  />
                  
                  {component.storybookPath && (
                    <Button
                      variant="outline"
                      size={isMobile ? 'default' : 'sm'}
                      icon={{ component: Eye, position: 'left' }}
                      text="View"
                      onClick={() => openStorybook(component.storybookPath)}
                      className={cn(
                        'flex-1',
                        isMobile && 'touch-target min-h-12'
                      )}
                    />
                  )}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredComponents.map(component => (
            <Card key={component.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div>
                    <h3 className="font-semibold">{component.name}</h3>
                    <p className="text-sm text-muted-foreground">{component.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <Badge variant="outline" className={getStatusColor(component.status)}>
                    {component.status}
                  </Badge>
                  
                  <Badge variant="secondary">{component.category}</Badge>
                  
                  <div className="text-sm text-muted-foreground">
                    {component.usage} uses
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={{ 
                        component: copiedCode === component.name ? Check : Copy, 
                        position: 'left' 
                      }}
                      text={copiedCode === component.name ? 'Copied!' : 'Import'}
                      onClick={() => copyImportCode(component.name)}
                    />
                    
                    {component.storybookPath && (
                      <Button
                        variant="outline"
                        size="sm"
                        icon={{ component: Eye, position: 'left' }}
                        text="View"
                        onClick={() => openStorybook(component.storybookPath)}
                      />
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredComponents.length === 0 && (
        <Card className="p-12 text-center">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <Search className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No components found</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your search criteria or filters to find components.
          </p>
          <Button
            variant="outline"
            text="Clear Filters"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setSelectedStatus('all');
            }}
          />
        </Card>
      )}
    </div>
  );
};

export default ComponentShowcase;