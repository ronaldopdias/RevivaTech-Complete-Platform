import type { Meta, StoryObj } from '@storybook/react';
import BookingWizard from './BookingWizard';
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
} from '../../../.storybook/decorators';

const meta = {
  title: 'Business/BookingWizard',
  component: BookingWizard,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# BookingWizard Component

A comprehensive multi-step booking wizard for repair services providing a seamless customer experience from device selection to booking confirmation.

## Features
- **6-Step Progressive Process**: Device → Issues → Service Options → Quote → Customer Details → Confirmation
- **Real-time Quote Generation**: Dynamic pricing with transparent breakdown
- **Integrated Components**: Seamless integration with DeviceSelector and PriceCalculator
- **Service Level Options**: Standard (1x), Express (1.5x), Same-Day (2x) pricing tiers  
- **Collection Methods**: Post, Pickup, Drop-off with appropriate forms
- **Customer Types**: Individual, Business, Education with targeted pricing
- **Form Validation**: Comprehensive validation with error handling
- **Progress Indicators**: Clear visual feedback on completion status
- **Mobile Optimized**: Touch-friendly interface with responsive design
- **Accessibility**: WCAG 2.1 AA compliant with keyboard navigation

## Business Logic
- Device database integration (2016-2025 models)
- Dynamic pricing engine with service multipliers
- Issue selection with cost estimation
- Customer type discounts and business rules
- Collection method workflow variations
- Quote validity and deposit requirements
- Booking confirmation with reference numbers

## Technical Implementation
- TypeScript interfaces for type safety
- React hooks for state management  
- API integration with backend services
- Error boundary and loading states
- Progressive form validation
- Local state persistence during session
- Nordic design system compliance
        `,
      },
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
  },
} satisfies Meta<typeof BookingWizard>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default wizard starting state
export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Default booking wizard starting at the device selection step with all features enabled.',
      },
    },
  },
};

// Mobile-optimized experience
export const Mobile: Story = {
  args: {},
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story: 'Mobile-optimized booking wizard with touch-friendly interface and responsive design.',
      },
    },
  },
  decorators: [
    withResponsiveContainer,
    withThemeProvider
  ]
};

// Tablet layout optimization
export const Tablet: Story = {
  args: {},
  parameters: {
    viewport: { defaultViewport: 'tablet' },
    docs: {
      description: {
        story: 'Tablet-optimized layout with improved spacing and touch targets.',
      },
    },
  },
  decorators: [
    withResponsiveContainer,
    withThemeProvider
  ]
};

// Desktop with maximum width constraint
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
        story: 'Desktop experience with maximum width constraint for optimal readability.',
      },
    },
  }
};

// Dark theme variant
export const DarkTheme: Story = {
  args: {},
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: 'Booking wizard in dark theme mode with properly contrasted elements.',
      },
    },
  },
  globals: {
    theme: 'dark'
  },
  decorators: [
    withThemeProvider,
    withPadding
  ]
};

// Business customer workflow
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
        story: 'Business customer workflow with volume discounts and enterprise-focused options.',
      },
    },
  }
};

// Education customer with discounts
export const EducationCustomer: Story = {
  args: {},
  decorators: [
    withMockData,
    withThemeProvider,
    withPadding
  ],
  parameters: {
    docs: {
      description: {
        story: 'Education customer flow with student/teacher discounts and academic pricing.',
      },
    },
  }
};

// Express service premium experience
export const ExpressService: Story = {
  args: {},
  decorators: [
    withThemeProvider,
    withPadding
  ],
  parameters: {
    docs: {
      description: {
        story: 'Express service demonstration with 24-48 hour turnaround and premium pricing.',
      },
    },
  }
};

// Same-day emergency service
export const EmergencyService: Story = {
  args: {},
  decorators: [
    (Story) => (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-medium text-red-900 mb-2">🚨 Emergency Same-Day Service</h4>
          <p className="text-sm text-red-700">
            Urgent repair service with same-day completion and premium pricing
          </p>
        </div>
        <Story />
      </div>
    ),
    withThemeProvider,
    withPadding
  ],
  parameters: {
    docs: {
      description: {
        story: 'Emergency same-day service with premium pricing for urgent repairs.',
      },
    },
  }
};

// Loading states demonstration
export const LoadingStates: Story = {
  args: {},
  decorators: [
    withLoadingStates,
    withThemeProvider,
    withPadding
  ],
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates loading states during quote generation and API interactions.',
      },
    },
  }
};

// Error handling showcase
export const ErrorHandling: Story = {
  args: {},
  decorators: [
    withErrorBoundary,
    withThemeProvider,
    withPadding
  ],
  parameters: {
    docs: {
      description: {
        story: 'Error handling demonstration for API failures and validation errors.',
      },
    },
  }
};

// Accessibility-focused experience
export const AccessibilityFocused: Story = {
  args: {},
  decorators: [
    (Story) => (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-900 mb-2">Accessibility Features</h4>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Complete keyboard navigation support</li>
            <li>• Screen reader compatible with ARIA labels</li>
            <li>• Focus management between steps</li>
            <li>• High contrast visual indicators</li>
            <li>• Form validation announcements</li>
            <li>• Progress step announcements</li>
          </ul>
        </div>
        <Story />
      </div>
    ),
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
          { id: 'aria-labels', enabled: true },
          { id: 'heading-order', enabled: true }
        ]
      }
    },
    docs: {
      description: {
        story: 'Accessibility-enhanced booking wizard with WCAG 2.1 AA compliance.',
      },
    },
  }
};

// Performance monitoring demo
export const PerformanceOptimized: Story = {
  args: {},
  decorators: [
    withPerformanceMonitor,
    withThemeProvider,
    withPadding
  ],
  parameters: {
    docs: {
      description: {
        story: 'Performance-monitored version tracking step transitions and rendering optimization.',
      },
    },
  }
};

// Multiple device types workflow
export const MultipleDeviceTypes: Story = {
  args: {},
  decorators: [
    (Story) => (
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Multiple Device Support</h4>
          <p className="text-sm text-blue-700">
            Test workflow with different device types: MacBook, iPhone, iPad, Gaming Consoles
          </p>
        </div>
        <Story />
      </div>
    ),
    withMockData,
    withThemeProvider,
    withPadding
  ],
  parameters: {
    docs: {
      description: {
        story: 'Workflow demonstration with various device types and their specific repair options.',
      },
    },
  }
};

// Complete user journey simulation
export const CompleteJourney: Story = {
  args: {},
  decorators: [
    (Story) => (
      <div className="space-y-4">
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h4 className="font-medium text-purple-900 mb-2">Complete Booking Journey</h4>
          <p className="text-sm text-purple-700">
            Full end-to-end booking experience from device selection to confirmation
          </p>
        </div>
        <Story />
      </div>
    ),
    withMockData,
    withAuthContext,
    withThemeProvider,
    withPadding
  ],
  parameters: {
    docs: {
      description: {
        story: 'Complete user journey demonstration with all steps and realistic data flow.',
      },
    },
  }
};

// Interactive demo with guidance
export const InteractiveDemo: Story = {
  args: {},
  decorators: [
    (Story) => (
      <div className="space-y-4">
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <h4 className="font-medium text-indigo-900 mb-2">🎯 Interactive Demo</h4>
          <div className="text-sm text-indigo-700 space-y-1">
            <p><strong>Step 1:</strong> Choose a device from the searchable database</p>
            <p><strong>Step 2:</strong> Select common issues or describe problems</p>
            <p><strong>Step 3:</strong> Pick service speed and collection method</p>
            <p><strong>Step 4:</strong> Review auto-generated quote with breakdown</p>
            <p><strong>Step 5:</strong> Enter contact details and address (if needed)</p>
            <p><strong>Step 6:</strong> Booking confirmation with reference number</p>
          </div>
        </div>
        <Story />
      </div>
    ),
    withMockData,
    withPerformanceMonitor,
    withThemeProvider,
    withPadding
  ],
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo with guided instructions for testing all booking wizard features.',
      },
    },
  }
};

// Centered presentation layout
export const CenteredPresentation: Story = {
  args: {},
  decorators: [
    withCenter,
    withThemeProvider
  ],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        story: 'Centered layout optimized for design presentations and component showcase.',
      },
    },
  }
};

// High-value device booking
export const HighValueDevice: Story = {
  args: {},
  decorators: [
    (Story) => (
      <div className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h4 className="font-medium text-amber-900 mb-2">💎 Premium Device Repair</h4>
          <p className="text-sm text-amber-700">
            High-value device workflow with premium service options and extended warranties
          </p>
        </div>
        <Story />
      </div>
    ),
    withMockData,
    withThemeProvider,
    withPadding
  ],
  parameters: {
    docs: {
      description: {
        story: 'Booking workflow for high-value devices with premium service options.',
      },
    },
  }
};

// Form validation showcase
export const FormValidationDemo: Story = {
  args: {},
  decorators: [
    (Story) => (
      <div className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-900 mb-2">📝 Form Validation Testing</h4>
          <p className="text-sm text-yellow-700">
            Test form validation by trying to proceed without required fields or with invalid data
          </p>
        </div>
        <Story />
      </div>
    ),
    withThemeProvider,
    withPadding
  ],
  parameters: {
    docs: {
      description: {
        story: 'Form validation demonstration showing error handling and user feedback.',
      },
    },
  }
};

// Multi-issue complex repair
export const ComplexMultiIssueRepair: Story = {
  args: {},
  decorators: [
    (Story) => (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-medium text-red-900 mb-2">🔧 Complex Multi-Issue Repair</h4>
          <p className="text-sm text-red-700">
            Device with multiple simultaneous issues requiring comprehensive repair package
          </p>
        </div>
        <Story />
      </div>
    ),
    withMockData,
    withThemeProvider,
    withPadding
  ],
  parameters: {
    docs: {
      description: {
        story: 'Complex repair scenario with multiple issues and detailed cost breakdown.',
      },
    },
  }
};