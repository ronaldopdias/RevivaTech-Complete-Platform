// Component registration setup for RevivaTech
import { ComponentRegistry } from './registry';

// Import components
import Button, { config as ButtonConfig } from '@/components/ui/Button';
import ButtonComposed, { config as ButtonComposedConfig } from '@/components/ui/ButtonComposed';
import Card, { config as CardConfig } from '@/components/ui/Card';
import Input, { config as InputConfig } from '@/components/ui/Input';
import Select, { config as SelectConfig } from '@/components/ui/Select';
import Textarea, { config as TextareaConfig } from '@/components/ui/Textarea';
import Checkbox, { config as CheckboxConfig } from '@/components/ui/Checkbox';
import ThemeToggle from '@/components/ui/ThemeToggle';
import Navigation, { config as NavigationConfig } from '@/components/navigation/Navigation';
import HeroSection from '@/components/sections/HeroSection';
import ServicesGrid from '@/components/sections/ServicesGrid';
import ProcessSteps from '@/components/sections/ProcessSteps';
import FeatureHighlights from '@/components/sections/FeatureHighlights';
import TestimonialsCarousel from '@/components/sections/TestimonialsCarousel';
import CallToAction from '@/components/sections/CallToAction';
import BookingForm from '@/components/forms/BookingForm';
import MainLayout from '@/components/layout/MainLayout';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

// Initialize registry
export const setupComponents = (): ComponentRegistry => {
  const registry = ComponentRegistry.getInstance();

  try {
    // Register UI components
    registry.register(ButtonConfig, Button);
    registry.register(ButtonComposedConfig, ButtonComposed);
    registry.register(CardConfig, Card);
    registry.register(InputConfig, Input);
    registry.register(SelectConfig, Select);
    registry.register(TextareaConfig, Textarea);
    registry.register(CheckboxConfig, Checkbox);

    // Register ThemeToggle component
    registry.register(
      {
        name: 'ThemeToggle',
        version: '1.0.0',
        description: 'Theme toggle component for switching between light and dark themes',
        category: 'ui',
        props: {
          variant: {
            type: 'enum',
            enum: ['button', 'switch', 'icon'],
            default: 'button',
            description: 'Visual variant of the theme toggle',
          },
          size: {
            type: 'enum',
            enum: ['sm', 'md', 'lg'],
            default: 'md',
            description: 'Size of the theme toggle',
          },
          showLabel: {
            type: 'boolean',
            default: false,
            description: 'Whether to show text labels',
          },
          className: {
            type: 'string',
            required: false,
            description: 'Additional CSS classes',
          },
        },
        styling: {
          responsive: true,
          themeable: true,
          customizable: ['size', 'variant', 'colors'],
        },
      },
      ThemeToggle
    );

    // Register navigation components
    registry.register(NavigationConfig, Navigation);

    // Register layout components
    registry.register(
      {
        name: 'MainLayout',
        version: '1.0.0',
        description: 'Main layout component for pages',
        category: 'layout',
        props: {
          children: {
            type: 'object',
            required: true,
            description: 'Layout content',
          },
          className: {
            type: 'string',
            required: false,
            description: 'Additional CSS classes',
          },
        },
        styling: {
          responsive: true,
          themeable: true,
          customizable: ['padding', 'margin', 'backgroundColor'],
        },
      },
      MainLayout
    );

    // Register Header component
    registry.register(
      {
        name: 'Header',
        version: '1.0.0',
        description: 'Header component with navigation',
        category: 'layout',
        props: {
          navigation: {
            type: 'object',
            required: false,
            description: 'Navigation configuration',
          },
          className: {
            type: 'string',
            required: false,
            description: 'Additional CSS classes',
          },
        },
        styling: {
          responsive: true,
          themeable: true,
          customizable: ['backgroundColor', 'padding', 'height'],
        },
      },
      Header
    );

    // Register Footer component
    registry.register(
      {
        name: 'Footer',
        version: '1.0.0',
        description: 'Footer component with links and content',
        category: 'layout',
        props: {
          variant: {
            type: 'enum',
            enum: ['default', 'minimal', 'rich'],
            default: 'default',
            description: 'Footer variant',
          },
          showNewsletter: {
            type: 'boolean',
            default: true,
            description: 'Show newsletter signup',
          },
          showSocial: {
            type: 'boolean',
            default: true,
            description: 'Show social links',
          },
          showContact: {
            type: 'boolean',
            default: true,
            description: 'Show contact information',
          },
          className: {
            type: 'string',
            required: false,
            description: 'Additional CSS classes',
          },
        },
        styling: {
          responsive: true,
          themeable: true,
          customizable: ['backgroundColor', 'padding', 'borderColor'],
        },
      },
      Footer
    );

    // Register section components
    registry.register(
      {
        name: 'HeroSection',
        version: '1.0.0',
        description: 'Hero section component for landing pages',
        category: 'display',
        props: {
          variant: {
            type: 'enum',
            enum: ['primary', 'secondary', 'neutral', 'dark'],
            default: 'primary',
            description: 'Hero visual variant',
          },
          size: {
            type: 'enum',
            enum: ['small', 'medium', 'large', 'full'],
            default: 'large',
            description: 'Hero section size',
          },
          alignment: {
            type: 'enum',
            enum: ['left', 'center', 'right'],
            default: 'center',
            description: 'Content alignment',
          },
          title: {
            type: 'object',
            required: false,
            description: 'Hero title configuration',
          },
          subtitle: {
            type: 'object',
            required: false,
            description: 'Hero subtitle configuration',
          },
          description: {
            type: 'object',
            required: false,
            description: 'Hero description configuration',
          },
          actions: {
            type: 'array',
            required: false,
            description: 'Action buttons array',
          },
          media: {
            type: 'object',
            required: false,
            description: 'Hero media configuration',
          },
          background: {
            type: 'enum',
            enum: ['solid', 'gradient', 'image'],
            default: 'gradient',
            description: 'Background type',
          },
          className: {
            type: 'string',
            required: false,
            description: 'Additional CSS classes',
          },
        },
        variants: {
          marketing: {
            variant: 'primary',
            size: 'large',
            alignment: 'center',
            background: 'gradient',
          },
          simple: {
            variant: 'neutral',
            size: 'medium',
            alignment: 'left',
            background: 'solid',
          },
          fullscreen: {
            variant: 'dark',
            size: 'full',
            alignment: 'center',
            background: 'image',
          },
        },
        styling: {
          responsive: true,
          themeable: true,
          customizable: [
            'backgroundColor',
            'textColor',
            'padding',
            'height',
            'backgroundImage',
          ],
        },
      },
      HeroSection
    );

    // Register ServicesGrid component
    registry.register(
      {
        name: 'ServicesGrid',
        version: '1.0.0',
        description: 'Grid component for displaying services',
        category: 'display',
        props: {
          services: {
            type: 'array',
            required: true,
            description: 'Array of services to display',
          },
          variant: {
            type: 'enum',
            enum: ['cards', 'detailed', 'compact', 'list'],
            default: 'cards',
            description: 'Grid display variant',
          },
          columns: {
            type: 'object',
            required: false,
            description: 'Grid column configuration',
          },
          title: {
            type: 'object',
            required: false,
            description: 'Section title configuration',
          },
          showPricing: {
            type: 'boolean',
            default: true,
            description: 'Whether to show pricing',
          },
          showFeatures: {
            type: 'boolean',
            default: true,
            description: 'Whether to show service features',
          },
        },
        styling: {
          responsive: true,
          themeable: true,
          customizable: ['backgroundColor', 'padding', 'gridGap'],
        },
      },
      ServicesGrid
    );

    // Register ProcessSteps component
    registry.register(
      {
        name: 'ProcessSteps',
        version: '1.0.0',
        description: 'Component for displaying process steps',
        category: 'display',
        props: {
          steps: {
            type: 'array',
            required: true,
            description: 'Array of process steps',
          },
          variant: {
            type: 'enum',
            enum: ['numbered', 'timeline', 'cards', 'minimal'],
            default: 'numbered',
            description: 'Steps display variant',
          },
          layout: {
            type: 'enum',
            enum: ['vertical', 'horizontal', 'grid'],
            default: 'vertical',
            description: 'Steps layout orientation',
          },
          title: {
            type: 'object',
            required: false,
            description: 'Section title configuration',
          },
          showDetails: {
            type: 'boolean',
            default: true,
            description: 'Whether to show step details',
          },
        },
        styling: {
          responsive: true,
          themeable: true,
          customizable: ['backgroundColor', 'padding', 'stepSpacing'],
        },
      },
      ProcessSteps
    );

    // Register BookingForm component
    registry.register(
      {
        name: 'BookingForm',
        version: '1.0.0',
        description: 'Dynamic booking form component',
        category: 'form',
        props: {
          variant: {
            type: 'enum',
            enum: ['simple', 'comprehensive', 'wizard'],
            default: 'comprehensive',
            description: 'Form complexity variant',
          },
          title: {
            type: 'object',
            required: false,
            description: 'Form title configuration',
          },
          formConfig: {
            type: 'string',
            required: false,
            description: 'Reference to form configuration',
          },
          showEstimate: {
            type: 'boolean',
            default: false,
            description: 'Whether to show pricing estimate',
          },
          estimateConfig: {
            type: 'object',
            required: false,
            description: 'Pricing estimate configuration',
          },
        },
        styling: {
          responsive: true,
          themeable: true,
          customizable: ['backgroundColor', 'padding', 'borderRadius'],
        },
      },
      BookingForm
    );

    // Register FeatureHighlights component
    registry.register(
      {
        name: 'FeatureHighlights',
        version: '1.0.0',
        description: 'Component for displaying features with alternating layout',
        category: 'display',
        props: {
          variant: {
            type: 'enum',
            enum: ['alternating', 'grid', 'cards'],
            default: 'alternating',
            description: 'Feature display variant',
          },
          background: {
            type: 'enum',
            enum: ['default', 'muted', 'gradient'],
            default: 'default',
            description: 'Background style',
          },
          title: {
            type: 'object',
            required: false,
            description: 'Section title configuration',
          },
          subtitle: {
            type: 'object',
            required: false,
            description: 'Section subtitle configuration',
          },
          features: {
            type: 'array',
            required: true,
            description: 'Array of features to display',
          },
        },
        styling: {
          responsive: true,
          themeable: true,
          customizable: ['backgroundColor', 'padding', 'spacing'],
        },
      },
      FeatureHighlights
    );

    // Register TestimonialsCarousel component
    registry.register(
      {
        name: 'TestimonialsCarousel',
        version: '1.0.0',
        description: 'Carousel component for displaying customer testimonials',
        category: 'display',
        props: {
          variant: {
            type: 'enum',
            enum: ['cards', 'minimal', 'centered'],
            default: 'cards',
            description: 'Testimonials display variant',
          },
          autoplay: {
            type: 'boolean',
            default: false,
            description: 'Enable auto-play functionality',
          },
          autoplayInterval: {
            type: 'number',
            default: 5000,
            description: 'Auto-play interval in milliseconds',
          },
          title: {
            type: 'object',
            required: false,
            description: 'Section title configuration',
          },
          testimonials: {
            type: 'array',
            required: true,
            description: 'Array of testimonials to display',
          },
        },
        styling: {
          responsive: true,
          themeable: true,
          customizable: ['backgroundColor', 'padding', 'cardSpacing'],
        },
      },
      TestimonialsCarousel
    );

    // Register CallToAction component
    registry.register(
      {
        name: 'CallToAction',
        version: '1.0.0',
        description: 'Call-to-action component with buttons and features',
        category: 'display',
        props: {
          variant: {
            type: 'enum',
            enum: ['primary', 'secondary', 'accent'],
            default: 'primary',
            description: 'CTA visual variant',
          },
          background: {
            type: 'enum',
            enum: ['solid', 'gradient', 'pattern'],
            default: 'gradient',
            description: 'Background style',
          },
          alignment: {
            type: 'enum',
            enum: ['left', 'center', 'right'],
            default: 'center',
            description: 'Content alignment',
          },
          title: {
            type: 'object',
            required: false,
            description: 'CTA title configuration',
          },
          description: {
            type: 'object',
            required: false,
            description: 'CTA description configuration',
          },
          actions: {
            type: 'array',
            required: false,
            description: 'Action buttons array',
          },
          features: {
            type: 'array',
            required: false,
            description: 'Feature list to display',
          },
        },
        styling: {
          responsive: true,
          themeable: true,
          customizable: ['backgroundColor', 'textColor', 'padding', 'borderRadius'],
        },
      },
      CallToAction
    );

    console.log('✅ Components registered successfully');
    console.log('📦 Registered components:', registry.getComponentNames());

    return registry;
  } catch (error) {
    console.error('❌ Failed to register components:', error);
    throw error;
  }
};

// Auto-setup on import (for convenience)
export const registry = setupComponents();

export default registry;