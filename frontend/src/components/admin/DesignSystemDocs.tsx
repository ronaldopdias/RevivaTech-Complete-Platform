'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { 
  Palette, 
  Type, 
  Layout, 
  Layers, 
  Grid,
  Ruler,
  Zap,
  Eye,
  Copy,
  Check,
  Download,
  ExternalLink,
  Info,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface DesignSystemDocsProps {
  className?: string;
}

export const DesignSystemDocs: React.FC<DesignSystemDocsProps> = ({
  className
}) => {
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [copiedValue, setCopiedValue] = useState<string | null>(null);

  const copyToClipboard = (value: string, label: string) => {
    navigator.clipboard.writeText(value);
    setCopiedValue(label);
    setTimeout(() => setCopiedValue(null), 2000);
  };

  const sections = [
    { id: 'overview', label: 'Overview', icon: Eye },
    { id: 'colors', label: 'Colors', icon: Palette },
    { id: 'typography', label: 'Typography', icon: Type },
    { id: 'spacing', label: 'Spacing', icon: Ruler },
    { id: 'components', label: 'Components', icon: Layers },
    { id: 'patterns', label: 'Patterns', icon: Grid },
    { id: 'guidelines', label: 'Guidelines', icon: Info }
  ];

  const colorPalette = {
    primary: {
      name: 'Primary',
      description: 'Main brand color - Apple Blue',
      shades: [
        { name: 'primary-50', hex: '#eff6ff', value: 'hsl(214, 100%, 97%)' },
        { name: 'primary-100', hex: '#dbeafe', value: 'hsl(214, 95%, 93%)' },
        { name: 'primary-200', hex: '#bfdbfe', value: 'hsl(213, 89%, 87%)' },
        { name: 'primary-300', hex: '#93c5fd', value: 'hsl(212, 96%, 78%)' },
        { name: 'primary-400', hex: '#60a5fa', value: 'hsl(213, 94%, 68%)' },
        { name: 'primary-500', hex: '#3b82f6', value: 'hsl(217, 91%, 60%)' },
        { name: 'primary-600', hex: '#2563eb', value: 'hsl(221, 83%, 53%)' },
        { name: 'primary-700', hex: '#1d4ed8', value: 'hsl(224, 76%, 48%)' },
        { name: 'primary-800', hex: '#1e40af', value: 'hsl(226, 71%, 40%)' },
        { name: 'primary-900', hex: '#1e3a8a', value: 'hsl(224, 64%, 33%)' }
      ]
    },
    neutral: {
      name: 'Neutral',
      description: 'Gray scale for text and backgrounds',
      shades: [
        { name: 'neutral-50', hex: '#fafafa', value: 'hsl(0, 0%, 98%)' },
        { name: 'neutral-100', hex: '#f5f5f5', value: 'hsl(0, 0%, 96%)' },
        { name: 'neutral-200', hex: '#e5e5e5', value: 'hsl(0, 0%, 90%)' },
        { name: 'neutral-300', hex: '#d4d4d4', value: 'hsl(0, 0%, 83%)' },
        { name: 'neutral-400', hex: '#a3a3a3', value: 'hsl(0, 0%, 64%)' },
        { name: 'neutral-500', hex: '#737373', value: 'hsl(0, 0%, 45%)' },
        { name: 'neutral-600', hex: '#525252', value: 'hsl(0, 0%, 32%)' },
        { name: 'neutral-700', hex: '#404040', value: 'hsl(0, 0%, 25%)' },
        { name: 'neutral-800', hex: '#262626', value: 'hsl(0, 0%, 15%)' },
        { name: 'neutral-900', hex: '#171717', value: 'hsl(0, 0%, 9%)' }
      ]
    },
    semantic: {
      name: 'Semantic',
      description: 'Status and feedback colors',
      shades: [
        { name: 'success', hex: '#10b981', value: 'hsl(158, 64%, 52%)', usage: 'Success states' },
        { name: 'warning', hex: '#f59e0b', value: 'hsl(43, 96%, 56%)', usage: 'Warning states' },
        { name: 'error', hex: '#ef4444', value: 'hsl(0, 84%, 60%)', usage: 'Error states' },
        { name: 'info', hex: '#3b82f6', value: 'hsl(217, 91%, 60%)', usage: 'Information states' }
      ]
    }
  };

  const typography = {
    families: [
      {
        name: 'SF Pro Display',
        usage: 'Headings',
        fallback: 'Inter, system-ui, sans-serif',
        weights: ['300', '400', '500', '600', '700'],
        description: 'Apple\'s system font for headlines and display text'
      },
      {
        name: 'SF Pro Text',
        usage: 'Body text',
        fallback: 'Inter, system-ui, sans-serif', 
        weights: ['400', '500', '600'],
        description: 'Apple\'s system font optimized for body text'
      },
      {
        name: 'SF Mono',
        usage: 'Code',
        fallback: 'Monaco, Consolas, monospace',
        weights: ['400', '500', '600'],
        description: 'Apple\'s monospace font for code blocks'
      }
    ],
    scale: [
      { name: 'text-xs', size: '0.75rem', lineHeight: '1rem' },
      { name: 'text-sm', size: '0.875rem', lineHeight: '1.25rem' },
      { name: 'text-base', size: '1rem', lineHeight: '1.5rem' },
      { name: 'text-lg', size: '1.125rem', lineHeight: '1.75rem' },
      { name: 'text-xl', size: '1.25rem', lineHeight: '1.75rem' },
      { name: 'text-2xl', size: '1.5rem', lineHeight: '2rem' },
      { name: 'text-3xl', size: '1.875rem', lineHeight: '2.25rem' },
      { name: 'text-4xl', size: '2.25rem', lineHeight: '2.5rem' },
      { name: 'text-5xl', size: '3rem', lineHeight: '1' },
      { name: 'text-6xl', size: '3.75rem', lineHeight: '1' }
    ]
  };

  const spacing = {
    scale: [
      { name: '0', value: '0px', rem: '0rem' },
      { name: '1', value: '4px', rem: '0.25rem' },
      { name: '2', value: '8px', rem: '0.5rem' },
      { name: '3', value: '12px', rem: '0.75rem' },
      { name: '4', value: '16px', rem: '1rem' },
      { name: '5', value: '20px', rem: '1.25rem' },
      { name: '6', value: '24px', rem: '1.5rem' },
      { name: '8', value: '32px', rem: '2rem' },
      { name: '10', value: '40px', rem: '2.5rem' },
      { name: '12', value: '48px', rem: '3rem' },
      { name: '16', value: '64px', rem: '4rem' },
      { name: '20', value: '80px', rem: '5rem' },
      { name: '24', value: '96px', rem: '6rem' },
      { name: '32', value: '128px', rem: '8rem' }
    ],
    usage: [
      { type: 'Component spacing', values: ['2', '3', '4', '6'], description: 'Internal component padding and margins' },
      { type: 'Layout sections', values: ['8', '12', '16'], description: 'Spacing between major layout sections' },
      { type: 'Page margins', values: ['16', '20', '24'], description: 'Outer page margins and containers' },
      { type: 'Component gaps', values: ['4', '6', '8'], description: 'Gaps between related components' }
    ]
  };

  const designPrinciples = [
    {
      title: 'Simplicity',
      description: 'Clean, minimal interfaces that focus on essential functionality',
      icon: '✨',
      examples: ['Minimal button designs', 'Clean typography', 'Generous whitespace']
    },
    {
      title: 'Consistency',
      description: 'Uniform patterns and behaviors across all components',
      icon: '🎯',
      examples: ['Consistent button styles', 'Uniform spacing', 'Predictable interactions']
    },
    {
      title: 'Accessibility',
      description: 'Inclusive design that works for all users',
      icon: '♿',
      examples: ['High contrast ratios', 'Keyboard navigation', 'Screen reader support']
    },
    {
      title: 'Performance',
      description: 'Lightweight, fast-loading components',
      icon: '⚡',
      examples: ['Optimized CSS', 'Lazy loading', 'Minimal bundle size']
    }
  ];

  const componentPatterns = [
    {
      name: 'Form Fields',
      description: 'Consistent form input patterns with validation states',
      components: ['Input', 'Select', 'Textarea', 'Checkbox'],
      pattern: 'Label + Input + Helper Text + Error State'
    },
    {
      name: 'Navigation',
      description: 'Hierarchical navigation with clear visual hierarchy',
      components: ['Header', 'Sidebar', 'Breadcrumbs', 'Pagination'],
      pattern: 'Container + List + Active State + Hover Effects'
    },
    {
      name: 'Content Display',
      description: 'Structured content presentation with consistent spacing',
      components: ['Card', 'List', 'Table', 'Grid'],
      pattern: 'Header + Content + Actions + Footer'
    },
    {
      name: 'Feedback',
      description: 'User feedback and status communication',
      components: ['Alert', 'Toast', 'Badge', 'Progress'],
      pattern: 'Icon + Message + Actions + Dismissal'
    }
  ];

  const renderOverview = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold mb-4">Nordic Design System</h2>
        <p className="text-lg text-muted-foreground mb-6">
          A minimalist, Apple-inspired design system focused on clarity, consistency, and exceptional user experience.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {designPrinciples.map((principle, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{principle.icon}</div>
                <CardTitle className="text-lg">{principle.title}</CardTitle>
              </div>
              <CardDescription>{principle.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-1">
                {principle.examples.map((example, i) => (
                  <li key={i} className="flex items-center space-x-2">
                    <div className="w-1 h-1 bg-primary rounded-full"></div>
                    <span>{example}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Overview</CardTitle>
          <CardDescription>Key metrics and statistics about the design system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">45+</div>
              <div className="text-sm text-muted-foreground">Components</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">120+</div>
              <div className="text-sm text-muted-foreground">Design Tokens</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">8</div>
              <div className="text-sm text-muted-foreground">Color Palettes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">3</div>
              <div className="text-sm text-muted-foreground">Typography Scales</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderColors = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Color System</h2>
        <p className="text-muted-foreground">
          Our color palette is based on Apple's design principles with carefully crafted shades for accessibility and consistency.
        </p>
      </div>

      {Object.entries(colorPalette).map(([key, palette]) => (
        <Card key={key}>
          <CardHeader>
            <CardTitle>{palette.name}</CardTitle>
            <CardDescription>{palette.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-4">
              {palette.shades.map((shade) => (
                <div key={shade.name} className="space-y-2">
                  <div
                    className="w-full h-16 rounded-lg border cursor-pointer transition-transform hover:scale-105"
                    style={{ backgroundColor: shade.hex }}
                    onClick={() => copyToClipboard(shade.hex, shade.name)}
                  />
                  <div className="text-xs">
                    <div className="font-medium">{shade.name}</div>
                    <div className="text-muted-foreground">{shade.hex}</div>
                    {shade.usage && (
                      <div className="text-muted-foreground italic">{shade.usage}</div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="xs"
                    icon={{ 
                      component: copiedValue === shade.name ? Check : Copy, 
                      position: 'left' 
                    }}
                    text={copiedValue === shade.name ? 'Copied!' : 'Copy'}
                    onClick={() => copyToClipboard(shade.hex, shade.name)}
                    className="w-full"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle>Usage Guidelines</CardTitle>
          <CardDescription>Best practices for using colors in the design system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <div className="font-medium">Use primary colors for main actions and brand elements</div>
                <div className="text-sm text-muted-foreground">Primary buttons, links, and key interface elements</div>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <div className="font-medium">Maintain sufficient contrast ratios</div>
                <div className="text-sm text-muted-foreground">Minimum 4.5:1 for normal text, 3:1 for large text</div>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <div className="font-medium">Avoid using too many colors in a single interface</div>
                <div className="text-sm text-muted-foreground">Stick to 2-3 main colors plus neutrals for clarity</div>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div>
                <div className="font-medium">Test colors in both light and dark modes</div>
                <div className="text-sm text-muted-foreground">Ensure accessibility across different viewing conditions</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderTypography = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Typography System</h2>
        <p className="text-muted-foreground">
          Our typography is based on Apple's San Francisco font family, optimized for both digital interfaces and readability.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Font Families</CardTitle>
          <CardDescription>Typography families used throughout the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {typography.families.map((family, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{family.name}</h3>
                    <p className="text-sm text-muted-foreground">{family.description}</p>
                  </div>
                  <Badge variant="secondary">{family.usage}</Badge>
                </div>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">Fallback:</span> {family.fallback}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Weights:</span> {family.weights.join(', ')}
                  </div>
                </div>
                <div className="mt-4 p-3 bg-muted rounded">
                  <div style={{ fontFamily: family.name }} className="text-lg">
                    The quick brown fox jumps over the lazy dog
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Type Scale</CardTitle>
          <CardDescription>Consistent sizing and line heights for all text elements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {typography.scale.map((scale, index) => (
              <div key={index} className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center space-x-4">
                  <code className="text-sm bg-muted px-2 py-1 rounded">{scale.name}</code>
                  <div className="text-sm text-muted-foreground">
                    {scale.size} / {scale.lineHeight}
                  </div>
                </div>
                <div className={`${scale.name} font-medium`}>
                  Example Text
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSpacing = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Spacing System</h2>
        <p className="text-muted-foreground">
          Consistent spacing creates rhythm and hierarchy in our interfaces.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Spacing Scale</CardTitle>
          <CardDescription>Base spacing units for consistent layouts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {spacing.scale.map((space, index) => (
              <div key={index} className="flex items-center space-x-4 p-2 hover:bg-muted rounded">
                <div className="w-20">
                  <code className="text-sm">{space.name}</code>
                </div>
                <div className="w-24 text-sm text-muted-foreground">
                  {space.value}
                </div>
                <div className="w-24 text-sm text-muted-foreground">
                  {space.rem}
                </div>
                <div className="flex-1">
                  <div 
                    className="bg-primary rounded h-4"
                    style={{ width: space.value }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usage Guidelines</CardTitle>
          <CardDescription>How to apply spacing in different contexts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {spacing.usage.map((usage, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{usage.type}</h3>
                  <div className="flex space-x-1">
                    {usage.values.map(val => (
                      <Badge key={val} variant="outline">{val}</Badge>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{usage.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPatterns = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Component Patterns</h2>
        <p className="text-muted-foreground">
          Reusable patterns that ensure consistency across different components.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {componentPatterns.map((pattern, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle>{pattern.name}</CardTitle>
              <CardDescription>{pattern.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium mb-2">Components:</div>
                  <div className="flex flex-wrap gap-1">
                    {pattern.components.map(comp => (
                      <Badge key={comp} variant="secondary">{comp}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-2">Pattern:</div>
                  <code className="text-xs bg-muted p-2 rounded block">
                    {pattern.pattern}
                  </code>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'overview': return renderOverview();
      case 'colors': return renderColors();
      case 'typography': return renderTypography();
      case 'spacing': return renderSpacing();
      case 'patterns': return renderPatterns();
      default: return renderOverview();
    }
  };

  return (
    <div className={cn('flex h-full', className)}>
      {/* Sidebar */}
      <div className="w-64 border-r bg-muted/30 p-4">
        <div className="space-y-2">
          <h3 className="font-semibold mb-4">Design System</h3>
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  'w-full flex items-center space-x-2 px-3 py-2 text-sm rounded-md transition-colors text-left',
                  activeSection === section.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{section.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        {renderContent()}
      </div>
    </div>
  );
};

export default DesignSystemDocs;