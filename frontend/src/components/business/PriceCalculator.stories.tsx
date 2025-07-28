import type { Meta, StoryObj } from '@storybook/react';
import { PriceCalculator } from './PriceCalculator';
import { allDevices } from '../../../config/devices';
import type { DeviceModel } from '@/types/config';
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
  title: 'Business/PriceCalculator',
  component: PriceCalculator,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# PriceCalculator Component

An advanced pricing calculator with transparent cost breakdown and dynamic pricing engine integration.

## Features
- **Dynamic Pricing Engine**: Real-time calculations based on device, issue, and service selections
- **Service Level Multipliers**: Standard (1x), Priority (1.5x), Emergency (2x) pricing
- **Customer Type Discounts**: Education, Business, and Individual pricing tiers
- **Transparent Cost Breakdown**: Detailed breakdown of parts, labor, and service fees
- **Device-Specific Repairs**: Context-aware repair options based on device category
- **Common Issues Integration**: Pre-populated issues based on device history
- **Warranty Options**: Standard, Extended, and Premium warranty tiers
- **Add-on Services**: Data recovery, pickup/delivery, premium parts
- **Nordic Design System**: Apple-inspired minimalism with transparency

## Business Logic
- Base pricing from comprehensive pricing engine configuration
- Device age and brand multipliers (Apple premium, age discounts)
- Repair complexity scaling (Simple 0.7x, Expert 1.8x)
- Service urgency surcharges (Priority +50%, Emergency +100%)
- Labor rates by complexity ($35-$80/hour)
- Fixed service fee structure
- Dynamic warranty periods (30-180 days)

## Technical Implementation
- TypeScript interfaces for type safety
- React hooks for state management
- Integration with pricing engine API
- Real-time price calculations
- Responsive design with Nordic system styling
- Accessibility-compliant interactions
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
    device: {
      control: 'object',
      description: 'Device model for price calculation',
    },
    selectedIssues: {
      control: 'object',
      description: 'Array of selected common issues'
    },
    selectedRepairs: {
      control: 'object', 
      description: 'Array of selected repair service IDs'
    },
    urgency: {
      control: { type: 'select' },
      options: ['standard', 'priority', 'emergency'],
      description: 'Service urgency level affecting pricing'
    },
    onPriceCalculated: { action: 'price-calculated' },
    onIssueToggle: { action: 'issue-toggled' },
    onRepairToggle: { action: 'repair-toggled' },
    onUrgencyChange: { action: 'urgency-changed' },
    onProceed: { action: 'proceed-clicked' },
    variant: {
      control: 'select',
      options: ['default', 'compact', 'detailed'],
      description: 'Visual variant of the component',
    },
    showBreakdown: {
      control: 'boolean',
      description: 'Whether to show detailed price breakdown',
    },
    allowOptions: {
      control: 'boolean',
      description: 'Whether to allow service options selection',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes'
    }
  },
} satisfies Meta<typeof PriceCalculator>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample devices for stories
const macbook: DeviceModel = allDevices.find(d => d.name.includes('MacBook')) || allDevices[0];
const iphone: DeviceModel = allDevices.find(d => d.name.includes('iPhone')) || allDevices[1];
const ipad: DeviceModel = allDevices.find(d => d.name.includes('iPad')) || allDevices[2];
const gamingConsole: DeviceModel = allDevices.find(d => d.categoryId === 'gaming') || allDevices[3];

// Default configuration
export const Default: Story = {
  args: {
    device: macbook,
    showBreakdown: true,
    allowOptions: true,
  },
};

// Compact variant for smaller spaces
export const Compact: Story = {
  args: {
    device: iphone,
    variant: 'compact',
    showBreakdown: false,
    allowOptions: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Compact variant suitable for sidebars or quick estimates.',
      },
    },
  },
};

// Detailed variant with full features
export const Detailed: Story = {
  args: {
    device: macbook,
    variant: 'detailed',
    showBreakdown: true,
    allowOptions: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Detailed variant with comprehensive pricing options and breakdown.',
      },
    },
  },
};

// iPhone pricing example
export const iPhoneRepair: Story = {
  args: {
    device: iphone,
    showBreakdown: true,
    allowOptions: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Pricing calculator for iPhone repairs, showing mobile device specific options.',
      },
    },
  },
};

// iPad pricing example
export const iPadRepair: Story = {
  args: {
    device: ipad,
    showBreakdown: true,
    allowOptions: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Pricing calculator for iPad repairs, demonstrating tablet repair options.',
      },
    },
  },
};

// Gaming console pricing
export const GamingConsoleRepair: Story = {
  args: {
    device: gamingConsole,
    showBreakdown: true,
    allowOptions: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Pricing calculator for gaming console repairs.',
      },
    },
  },
};

// Without options (basic pricing only)
export const BasicPricing: Story = {
  args: {
    device: macbook,
    showBreakdown: true,
    allowOptions: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Basic pricing mode without service options, showing only repair type selection.',
      },
    },
  },
};

// Without breakdown (price only)
export const PriceOnly: Story = {
  args: {
    device: iphone,
    showBreakdown: false,
    allowOptions: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Price-focused view without detailed cost breakdown.',
      },
    },
  },
};

// High-end device pricing
export const HighEndDevice: Story = {
  args: {
    device: {
      ...macbook,
      year: 2024,
      averageRepairCost: 450,
      name: 'MacBook Pro 16" M3 Max',
    },
    showBreakdown: true,
    allowOptions: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Pricing for high-end devices with premium repair costs.',
      },
    },
  },
};

// Older device pricing
export const OlderDevice: Story = {
  args: {
    device: {
      ...macbook,
      year: 2018,
      averageRepairCost: 180,
      name: 'MacBook Air 2018',
    },
    showBreakdown: true,
    allowOptions: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Pricing for older devices with reduced repair costs.',
      },
    },
  },
};

// Mobile layout optimization
export const Mobile: Story = {
  args: {
    device: iphone,
    variant: 'compact',
    showBreakdown: true,
    allowOptions: true,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Component optimized for mobile viewports with responsive design and touch-friendly interface.',
      },
    },
  },
  decorators: [
    withResponsiveContainer,
    withThemeProvider
  ]
};

// Tablet layout
export const Tablet: Story = {
  args: {
    device: macbook,
    showBreakdown: true,
    allowOptions: true,
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    docs: {
      description: {
        story: 'Component layout on tablet-sized screens with optimized spacing and improved touch targets.',
      },
    },
  },
  decorators: [
    withResponsiveContainer,
    withThemeProvider
  ]
};

// Desktop with full features
export const Desktop: Story = {
  args: {
    device: macbook,
    variant: 'detailed',
    showBreakdown: true,
    allowOptions: true,
  },
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
    docs: {
      description: {
        story: 'Full desktop experience with all features enabled and maximum width constraint for optimal readability.',
      },
    },
  },
  decorators: [
    withMaxWidth,
    withThemeProvider,
    withPadding
  ]
};

// Interactive demo
export const InteractiveDemo: Story = {
  args: {
    device: macbook,
    showBreakdown: true,
    allowOptions: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo showcasing the complete pricing calculation flow.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Interactive Demo</h4>
          <p className="text-sm text-blue-700">
            • Select a repair type to see instant pricing<br/>
            • Toggle service options to see price changes<br/>
            • View detailed cost breakdown and warranty info<br/>
            • See recommended repairs for the selected device
          </p>
        </div>
        <Story />
      </div>
    ),
  ],
};

// Loading state simulation
export const LoadingState: Story = {
  args: {
    device: macbook,
    showBreakdown: true,
    allowOptions: true,
    loading: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Component showing loading states during price calculation with animated spinner.',
      },
    },
  },
  decorators: [
    withLoadingStates,
    withThemeProvider,
    withPadding
  ],
};

// Accessibility focused
export const AccessibilityFocused: Story = {
  args: {
    device: macbook,
    showBreakdown: true,
    allowOptions: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Component demonstrating accessibility features including keyboard navigation and screen reader support.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-900 mb-2">Accessibility Features</h4>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Keyboard navigation for all controls</li>
            <li>• Screen reader compatible labels</li>
            <li>• Clear focus indicators</li>
            <li>• Semantic form structure</li>
            <li>• Price announcements for assistive technology</li>
          </ul>
        </div>
        <Story />
      </div>
    ),
  ],
};

// Complex repair scenario
export const ComplexRepairScenario: Story = {
  args: {
    device: {
      ...macbook,
      year: 2019,
      name: 'MacBook Pro 15" (Butterfly Keyboard)',
      commonIssues: ['Keyboard issues', 'Screen flickering', 'Battery drain', 'Overheating'],
    },
    showBreakdown: true,
    allowOptions: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Complex repair scenario showing devices with known issues and premium pricing adjustments.',
      },
    },
  },
};

// Express service demonstration
export const ExpressServiceDemo: Story = {
  args: {
    device: iphone,
    showBreakdown: true,
    allowOptions: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstration of express service pricing with same-day repair options.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h4 className="font-medium text-amber-900 mb-2">Express Service Demo</h4>
          <p className="text-sm text-amber-700">
            Select a repair type, then enable "Express Service" to see same-day pricing
          </p>
        </div>
        <Story />
      </div>
    ),
  ],
};

// Dark theme variant with Nordic design
export const DarkTheme: Story = {
  args: {
    device: macbook,
    showBreakdown: true,
    allowOptions: true,
  },
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: 'PriceCalculator in dark theme mode with properly contrasted pricing elements and Nordic design system styling.',
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

// Emergency same-day service with premium pricing
export const EmergencyService: Story = {
  args: {
    device: {
      ...iphone,
      commonIssues: ['Water damage', 'Screen completely black'],
    },
    showBreakdown: true,
    allowOptions: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Emergency same-day service with 100% surcharge, showing premium pricing for urgent repairs.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-medium text-red-900 mb-2">🚨 Emergency Service</h4>
          <p className="text-sm text-red-700">
            Same-day repair service with premium pricing for urgent cases
          </p>
        </div>
        <Story />
      </div>
    ),
  ],
};

// Business customer with volume discounts
export const BusinessCustomer: Story = {
  args: {
    device: {
      ...macbook,
      name: 'MacBook Pro 14" (Business Fleet)',
    },
    showBreakdown: true,
    allowOptions: true,
  },
  decorators: [
    withAuthContext,
    withMockData,
    withThemeProvider,
    withPadding
  ],
  parameters: {
    docs: {
      description: {
        story: 'Business customer view with volume discounts and enterprise-focused repair services.',
      },
    },
  },
};

// Performance optimized with monitoring
export const PerformanceOptimized: Story = {
  args: {
    device: macbook,
    showBreakdown: true,
    allowOptions: true,
  },
  decorators: [
    withPerformanceMonitor,
    withThemeProvider,
    withPadding
  ],
  parameters: {
    docs: {
      description: {
        story: 'Performance-monitored version tracking pricing calculation times and rendering optimization metrics.',
      },
    },
  },
};

// Comprehensive repair scenario with multiple issues
export const ComprehensiveRepairPackage: Story = {
  args: {
    device: {
      ...macbook,
      year: 2019,
      name: 'MacBook Pro 15" (Multiple Issues)',
      commonIssues: ['Keyboard sticky keys', 'Screen flickering', 'Battery swelling', 'Overheating', 'Speaker crackling'],
      averageRepairCost: 380,
    },
    showBreakdown: true,
    allowOptions: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Comprehensive repair package with multiple services and detailed cost breakdown for complex scenarios.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="space-y-4">
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h4 className="font-medium text-purple-900 mb-2">🔧 Multi-Repair Package</h4>
          <p className="text-sm text-purple-700">
            Device with multiple known issues requiring comprehensive repair package
          </p>
        </div>
        <Story />
      </div>
    ),
  ],
};

// Free diagnostic showcase
export const FreeDiagnosticService: Story = {
  args: {
    device: {
      ...macbook,
      commonIssues: ['Unknown startup issues'],
    },
    showBreakdown: true,
    allowOptions: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Free diagnostic service option showing zero-cost evaluation with potential for upselling.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-900 mb-2">🔍 Free Diagnostic</h4>
          <p className="text-sm text-green-700">
            Complimentary diagnostic service to identify repair needs
          </p>
        </div>
        <Story />
      </div>
    ),
  ],
};

// Enhanced accessibility features
export const EnhancedAccessibility: Story = {
  args: {
    device: ipad,
    showBreakdown: true,
    allowOptions: true,
  },
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
          { id: 'aria-labels', enabled: true },
          { id: 'heading-order', enabled: true }
        ]
      }
    },
    docs: {
      description: {
        story: 'Accessibility-enhanced price calculator with proper ARIA labels, keyboard navigation, and WCAG compliance.',
      },
    },
  },
};

// Price comparison demonstration  
export const PriceComparisonMode: Story = {
  args: {
    device: iphone,
    showBreakdown: true,
    allowOptions: true,
  },
  decorators: [
    withThemeProvider,
    withPadding
  ],
  parameters: {
    docs: {
      description: {
        story: 'Price comparison view showing the impact of different urgency levels and service options on total cost.',
      },
    },
  },
};

// Centered presentation layout
export const CenteredPresentation: Story = {
  args: {
    device: macbook,
    variant: 'detailed',
    showBreakdown: true,
    allowOptions: true,
  },
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
  },
};

// Enhanced gaming device pricing
export const GamingDeviceSpecialized: Story = {
  args: {
    device: {
      ...gamingConsole,
      name: 'PlayStation 5 (2022)',
      commonIssues: ['Controller drift', 'HDMI port failure', 'Fan noise', 'Disc reader error'],
      averageRepairCost: 220,
    },
    showBreakdown: true,
    allowOptions: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Specialized gaming console repair pricing with gaming-specific repair options and warranties.',
      },
    },
  },
};