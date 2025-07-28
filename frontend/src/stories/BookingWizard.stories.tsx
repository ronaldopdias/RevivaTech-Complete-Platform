import type { Meta, StoryObj } from '@storybook/nextjs';
import BookingWizard from '../components/booking/BookingWizard';
import {
  withThemeProvider,
  withPadding,
  withMaxWidth,
  withCenter,
  withMockData,
  withResponsiveContainer,
  withAuthContext,
  withLoadingStates,
  withErrorBoundary,
  withPerformanceMonitor
} from '../../.storybook/decorators';

// Mock data for device and quote responses
const mockDevice = {
  id: 'mac-2023-14',
  display_name: 'MacBook Pro 14" (2023)',
  brand_name: 'Apple',
  category_name: 'Laptop',
  year: 2023,
  slug: 'macbook-pro-14-2023',
  thumbnail_url: '/images/devices/macbook-pro-14.jpg',
  repairability_score: 85,
  avg_repair_cost: 250,
  popularity_score: 95
};

const mockIssues = [
  {
    id: 'screen-crack',
    name: 'Cracked Screen',
    slug: 'cracked-screen',
    description: 'Display has visible cracks or damage',
    category: 'display',
    symptoms: ['Visible cracks', 'Black spots', 'Lines on screen'],
    difficulty_level: 'medium',
    estimated_cost_min: 180,
    estimated_cost_max: 350,
    repair_time_minutes: 120,
    success_rate: 95,
    parts_required: ['LCD Panel', 'Digitizer']
  },
  {
    id: 'battery-drain',
    name: 'Battery Draining Fast',
    slug: 'battery-drain',
    description: 'Battery life significantly reduced',
    category: 'battery',
    symptoms: ['Quick discharge', 'Swollen battery', 'Not charging'],
    difficulty_level: 'easy',
    estimated_cost_min: 80,
    estimated_cost_max: 150,
    repair_time_minutes: 60,
    success_rate: 98,
    parts_required: ['Battery']
  }
];

const mockQuote = {
  quote_id: 'QT-2024-001234',
  device: {
    id: 'mac-2023-14',
    name: 'MacBook Pro 14" (2023)',
    brand: 'Apple',
    category: 'Laptop',
    year: 2023
  },
  issues: [
    {
      id: 'screen-crack',
      name: 'Cracked Screen',
      category: 'display',
      difficulty: 'medium',
      base_cost: 280,
      time_minutes: 120
    }
  ],
  service: {
    type: 'express',
    priority: 'high',
    customer_type: 'individual'
  },
  pricing: {
    base_cost: 280,
    final_cost: 420,
    currency: 'GBP',
    adjustments: [
      {
        name: 'Express Service',
        type: 'multiplier',
        adjustment: 140,
        method: '1.5x',
        description: 'Faster turnaround time'
      }
    ],
    savings: 0
  },
  timing: {
    estimated_hours: 2,
    estimated_completion: '2024-07-17T16:00:00Z',
    service_level: 'Express (24-48h)'
  },
  terms: {
    deposit_required: 100,
    warranty_months: 6,
    guarantee: 'No fix, no fee'
  },
  validity: {
    valid_until: '2024-07-23T23:59:59Z'
  }
};

// Enhanced mock API responses
const mockApiResponses = {
  devices: [mockDevice],
  issues: mockIssues,
  quote: mockQuote
};

const meta: Meta<typeof BookingWizard> = {
  title: 'Business/BookingWizard',
  component: BookingWizard,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# BookingWizard Component

A comprehensive multi-step booking wizard for repair services with the following features:

## Features
- **6-Step Process**: Device selection → Issues → Service options → Quote → Customer details → Confirmation
- **Real-time Pricing**: Dynamic quote generation based on selections
- **Progressive Disclosure**: Information gathered step by step
- **Validation**: Each step validates before allowing progression
- **Responsive Design**: Optimized for mobile and desktop
- **Accessibility**: Full keyboard navigation and screen reader support

## Business Logic
- Device database integration (2016-2025 models)
- Dynamic pricing engine with adjustments
- Service level multipliers (Standard 1x, Express 1.5x, Same Day 2x)
- Customer type discounts (Education, Business)
- Collection method options (Post, Pickup, Drop-off)

## Technical Implementation
- TypeScript interfaces for type safety
- React hooks for state management
- Error handling and loading states
- API integration with backend pricing engine
- Form validation and user feedback
        `
      }
    },
    viewport: {
      defaultViewport: 'responsive'
    }
  },
  tags: ['autodocs'],
  decorators: [
    withErrorBoundary,
    withPerformanceMonitor,
    withThemeProvider,
    withPadding
  ],
  argTypes: {
    className: {
      control: 'text',
      description: 'Additional CSS classes to apply to the component'
    }
  }
} satisfies Meta<typeof BookingWizard>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default story - Starting state
export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Default booking wizard starting at the device selection step.'
      }
    }
  }
};

// Mobile optimized story
export const Mobile: Story = {
  args: {},
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story: 'Booking wizard optimized for mobile devices with touch-friendly interface.'
      }
    }
  },
  decorators: [
    withResponsiveContainer,
    withThemeProvider
  ]
};

// Tablet view
export const Tablet: Story = {
  args: {},
  parameters: {
    viewport: { defaultViewport: 'tablet' },
    docs: {
      description: {
        story: 'Booking wizard on tablet devices with optimized layout.'
      }
    }
  },
  decorators: [
    withResponsiveContainer,
    withThemeProvider
  ]
};

// Desktop with max width
export const Desktop: Story = {
  args: {},
  decorators: [
    withMaxWidth,
    withThemeProvider,
    withPadding
  ],
  parameters: {
    viewport: { defaultViewport: 'desktop' },
    docs: {
      description: {
        story: 'Desktop version with maximum width constraint for optimal readability.'
      }
    }
  }
};

// Dark theme version
export const DarkTheme: Story = {
  args: {},
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: 'Booking wizard in dark theme mode for better user experience in low-light conditions.'
      }
    }
  },
  globals: {
    theme: 'dark'
  },
  decorators: [
    withThemeProvider,
    withPadding
  ]
};

// With mock data context
export const WithMockData: Story = {
  args: {},
  decorators: [
    withMockData,
    withThemeProvider,
    withPadding
  ],
  parameters: {
    docs: {
      description: {
        story: 'Booking wizard with pre-populated mock data for testing user flows.'
      }
    }
  }
};

// Loading states demonstration
export const LoadingStates: Story = {
  args: {
    loading: true
  },
  decorators: [
    withLoadingStates,
    withThemeProvider,
    withPadding
  ],
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates loading states during quote generation and API calls.'
      }
    }
  }
};

// Error state simulation
export const ErrorState: Story = {
  args: {},
  decorators: [
    withErrorBoundary,
    withThemeProvider,
    withPadding
  ],
  parameters: {
    docs: {
      description: {
        story: 'Shows error handling when API calls fail or unexpected errors occur.'
      }
    }
  }
};

// Accessibility focused
export const AccessibilityFocused: Story = {
  args: {},
  decorators: [
    withThemeProvider,
    withPadding
  ],
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: true },
          { id: 'keyboard-navigation', enabled: true },
          { id: 'focus-management', enabled: true },
          { id: 'aria-labels', enabled: true }
        ]
      }
    },
    docs: {
      description: {
        story: 'Booking wizard with enhanced accessibility features and WCAG compliance testing.'
      }
    }
  }
};

// Performance monitoring
export const PerformanceTest: Story = {
  args: {},
  decorators: [
    withPerformanceMonitor,
    withThemeProvider,
    withPadding
  ],
  parameters: {
    docs: {
      description: {
        story: 'Performance-monitored version to track rendering times and optimization opportunities.'
      }
    }
  }
};

// Centered layout for presentation
export const Centered: Story = {
  args: {},
  decorators: [
    withCenter,
    withThemeProvider
  ],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        story: 'Centered layout for presentations and design reviews.'
      }
    }
  }
};

// Business customer flow
export const BusinessCustomer: Story = {
  args: {},
  decorators: [
    withAuthContext,
    withMockData,
    withThemeProvider,
    withPadding
  ],
  parameters: {
    docs: {
      description: {
        story: 'Booking wizard configured for business customers with bulk discount options.'
      }
    }
  }
};

// Express service demonstration
export const ExpressService: Story = {
  args: {},
  decorators: [
    withThemeProvider,
    withPadding
  ],
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates express service options with premium pricing and faster turnaround.'
      }
    }
  }
};

// Complete user journey
export const CompleteJourney: Story = {
  args: {},
  decorators: [
    withMockData,
    withAuthContext,
    withThemeProvider,
    withPadding
  ],
  parameters: {
    docs: {
      description: {
        story: 'Complete user journey from device selection to booking confirmation with all steps populated.'
      }
    }
  }
};

// Interactive demo
export const InteractiveDemo: Story = {
  args: {},
  decorators: [
    withMockData,
    withPerformanceMonitor,
    withThemeProvider,
    withPadding
  ],
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo with performance monitoring for testing all wizard functionality.'
      }
    }
  }
};