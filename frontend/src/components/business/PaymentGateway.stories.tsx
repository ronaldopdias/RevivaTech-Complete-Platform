import type { Meta, StoryObj } from '@storybook/react';
import { PaymentGateway } from './PaymentGateway';
import type { PriceEstimate } from '../../../config/pricing/pricing.engine';

const meta = {
  title: 'Business/PaymentGateway',
  component: PaymentGateway,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Secure payment gateway component with Stripe integration, multiple payment methods, and comprehensive billing forms. Part of the RevivaTech business components suite for Phase 4.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    amount: {
      control: { type: 'number', min: 0, step: 0.01 },
      description: 'Payment amount in the specified currency',
    },
    currency: {
      control: 'select',
      options: ['GBP', 'USD', 'EUR'],
      description: 'Currency code for the payment',
    },
    onPaymentSuccess: { action: 'payment-success' },
    onPaymentError: { action: 'payment-error' },
    onPaymentStart: { action: 'payment-start' },
    variant: {
      control: 'select',
      options: ['default', 'minimal', 'checkout'],
      description: 'Visual variant of the component',
    },
    showBilling: {
      control: 'boolean',
      description: 'Whether to show billing information form',
    },
    allowedMethods: {
      control: 'check',
      options: ['card', 'paypal', 'bank_transfer', 'klarna'],
      description: 'Allowed payment methods',
    },
    isLoading: {
      control: 'boolean',
      description: 'Loading state for external processing',
    },
  },
} satisfies Meta<typeof PaymentGateway>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample price estimate for stories
const samplePriceEstimate: PriceEstimate = {
  basePrice: 150,
  laborCost: 60,
  partsCost: 90,
  serviceFee: 15,
  options: [
    { name: 'Express Service', cost: 75 },
    { name: 'Premium Parts', cost: 37.5 },
  ],
  total: 315,
  warranty: 90,
  estimatedTime: 'Same day',
  confidence: 'high' as const,
};

// Default configuration
export const Default: Story = {
  args: {
    amount: 315.00,
    currency: 'GBP',
    priceEstimate: samplePriceEstimate,
    showBilling: true,
    allowedMethods: ['card', 'paypal'],
  },
};

// Minimal variant for quick payments
export const Minimal: Story = {
  args: {
    amount: 150.00,
    currency: 'GBP',
    variant: 'minimal',
    showBilling: false,
    allowedMethods: ['card'],
  },
  parameters: {
    docs: {
      description: {
        story: 'Minimal payment interface for quick transactions.',
      },
    },
  },
};

// Checkout variant with full details
export const Checkout: Story = {
  args: {
    amount: 450.00,
    currency: 'GBP',
    variant: 'checkout',
    priceEstimate: {
      ...samplePriceEstimate,
      basePrice: 250,
      laborCost: 80,
      partsCost: 150,
      total: 450,
      options: [
        { name: 'Premium Parts', cost: 62.5 },
        { name: 'Extended Warranty', cost: 30 },
        { name: 'Pickup & Delivery', cost: 25 },
      ],
    },
    showBilling: true,
    allowedMethods: ['card', 'paypal', 'klarna'],
  },
  parameters: {
    docs: {
      description: {
        story: 'Full checkout experience with complete order summary and multiple payment options.',
      },
    },
  },
};

// Card payment only
export const CardOnly: Story = {
  args: {
    amount: 200.00,
    currency: 'GBP',
    showBilling: true,
    allowedMethods: ['card'],
  },
  parameters: {
    docs: {
      description: {
        story: 'Card-only payment configuration.',
      },
    },
  },
};

// Multiple payment methods
export const MultiplePaymentMethods: Story = {
  args: {
    amount: 350.00,
    currency: 'GBP',
    showBilling: true,
    allowedMethods: ['card', 'paypal', 'bank_transfer', 'klarna'],
  },
  parameters: {
    docs: {
      description: {
        story: 'All available payment methods enabled.',
      },
    },
  },
};

// Without billing information
export const NoBilling: Story = {
  args: {
    amount: 120.00,
    currency: 'GBP',
    showBilling: false,
    allowedMethods: ['card', 'paypal'],
  },
  parameters: {
    docs: {
      description: {
        story: 'Payment form without billing information collection.',
      },
    },
  },
};

// Loading state
export const LoadingState: Story = {
  args: {
    amount: 275.00,
    currency: 'GBP',
    isLoading: true,
    showBilling: true,
    allowedMethods: ['card'],
  },
  parameters: {
    docs: {
      description: {
        story: 'Component in loading state while external processing occurs.',
      },
    },
  },
};

// High amount transaction
export const HighAmount: Story = {
  args: {
    amount: 1250.00,
    currency: 'GBP',
    priceEstimate: {
      basePrice: 800,
      laborCost: 240,
      partsCost: 480,
      serviceFee: 15,
      options: [
        { name: 'Logic Board Repair', cost: 200 },
        { name: 'Premium Parts', cost: 200 },
        { name: 'Extended Warranty', cost: 60 },
      ],
      total: 1250,
      warranty: 180,
      estimatedTime: '2-3 days',
      confidence: 'medium' as const,
    },
    showBilling: true,
    allowedMethods: ['card', 'bank_transfer'],
  },
  parameters: {
    docs: {
      description: {
        story: 'High-value transaction with detailed breakdown.',
      },
    },
  },
};

// Small amount transaction
export const SmallAmount: Story = {
  args: {
    amount: 45.00,
    currency: 'GBP',
    priceEstimate: {
      basePrice: 30,
      laborCost: 15,
      partsCost: 18,
      serviceFee: 15,
      options: [],
      total: 45,
      warranty: 30,
      estimatedTime: '2-4 hours',
      confidence: 'high' as const,
    },
    variant: 'minimal',
    showBilling: false,
    allowedMethods: ['card'],
  },
  parameters: {
    docs: {
      description: {
        story: 'Small transaction with simplified interface.',
      },
    },
  },
};

// EUR currency example
export const EURCurrency: Story = {
  args: {
    amount: 280.00,
    currency: 'EUR',
    showBilling: true,
    allowedMethods: ['card', 'paypal'],
  },
  parameters: {
    docs: {
      description: {
        story: 'Payment form configured for EUR currency.',
      },
    },
  },
};

// USD currency example
export const USDCurrency: Story = {
  args: {
    amount: 380.00,
    currency: 'USD',
    showBilling: true,
    allowedMethods: ['card', 'paypal', 'klarna'],
  },
  parameters: {
    docs: {
      description: {
        story: 'Payment form configured for USD currency.',
      },
    },
  },
};

// Mobile layout
export const Mobile: Story = {
  args: {
    amount: 225.00,
    currency: 'GBP',
    showBilling: true,
    allowedMethods: ['card', 'paypal'],
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Component optimized for mobile viewports.',
      },
    },
  },
};

// Tablet layout
export const Tablet: Story = {
  args: {
    amount: 315.00,
    currency: 'GBP',
    priceEstimate: samplePriceEstimate,
    showBilling: true,
    allowedMethods: ['card', 'paypal'],
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    docs: {
      description: {
        story: 'Component layout on tablet-sized screens.',
      },
    },
  },
};

// Interactive demo
export const InteractiveDemo: Story = {
  args: {
    amount: 315.00,
    currency: 'GBP',
    priceEstimate: samplePriceEstimate,
    showBilling: true,
    allowedMethods: ['card', 'paypal', 'klarna'],
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo showcasing the complete payment flow.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Interactive Demo</h4>
          <p className="text-sm text-blue-700">
            • Try different payment methods<br/>
            • Fill out the secure payment form<br/>
            • Test card number validation (try: 4242 4242 4242 4242)<br/>
            • See real-time form validation and security features
          </p>
        </div>
        <Story />
      </div>
    ),
  ],
};

// Security focused
export const SecurityFocused: Story = {
  args: {
    amount: 500.00,
    currency: 'GBP',
    showBilling: true,
    allowedMethods: ['card'],
    stripePublishableKey: 'pk_test_example_key',
  },
  parameters: {
    docs: {
      description: {
        story: 'Payment form highlighting security features and encryption.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-900 mb-2">Security Features</h4>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• End-to-end encryption for all payment data</li>
            <li>• PCI DSS compliant payment processing</li>
            <li>• Real-time fraud detection</li>
            <li>• Secure card number masking</li>
            <li>• CVV/CVC validation and protection</li>
            <li>• SSL/TLS encryption for data transmission</li>
          </ul>
        </div>
        <Story />
      </div>
    ),
  ],
};

// Accessibility focused
export const AccessibilityFocused: Story = {
  args: {
    amount: 315.00,
    currency: 'GBP',
    showBilling: true,
    allowedMethods: ['card', 'paypal'],
  },
  parameters: {
    docs: {
      description: {
        story: 'Component demonstrating accessibility features for payment forms.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="space-y-4">
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h4 className="font-medium text-purple-900 mb-2">Accessibility Features</h4>
          <ul className="text-sm text-purple-700 space-y-1">
            <li>• Keyboard navigation for all form fields</li>
            <li>• Screen reader compatible labels</li>
            <li>• Clear error messaging and validation</li>
            <li>• High contrast color schemes</li>
            <li>• Focus indicators for all interactive elements</li>
            <li>• Auto-advancing between card input fields</li>
          </ul>
        </div>
        <Story />
      </div>
    ),
  ],
};

// Error state demonstration
export const ErrorStates: Story = {
  args: {
    amount: 315.00,
    currency: 'GBP',
    showBilling: true,
    allowedMethods: ['card'],
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstration of form validation and error states.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-medium text-red-900 mb-2">Error State Testing</h4>
          <p className="text-sm text-red-700">
            Try submitting the form with invalid data to see validation errors:<br/>
            • Leave fields empty<br/>
            • Enter invalid card numbers<br/>
            • Use expired dates<br/>
            • Enter invalid email addresses
          </p>
        </div>
        <Story />
      </div>
    ),
  ],
};