import type { Meta, StoryObj } from '@storybook/react';
import { Input, SearchInput, Textarea, type InputProps } from './Input';
import { Search, User, Lock, Mail, Phone, AlertCircle } from 'lucide-react';

const meta = {
  title: 'Design System/Input',
  component: Input,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A comprehensive input component with multiple variants, sizes, and states. Supports icons, addons, validation states, and accessibility features.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'filled', 'outline', 'ghost', 'success', 'warning', 'error'],
      description: 'Input visual variant',
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      description: 'Input size',
    },
    radius: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg', 'xl', '2xl', 'full'],
      description: 'Border radius',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Full width input',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
    loading: {
      control: 'boolean',
      description: 'Loading state with spinner',
    },
    required: {
      control: 'boolean',
      description: 'Required field indicator',
    },
    optional: {
      control: 'boolean',
      description: 'Optional field indicator',
    },
    label: {
      control: 'text',
      description: 'Input label',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
    helpText: {
      control: 'text',
      description: 'Help text below input',
    },
    error: {
      control: 'text',
      description: 'Error message',
    },
    success: {
      control: 'text',
      description: 'Success message',
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic Examples
export const Default: Story = {
  args: {
    placeholder: 'Enter your text...',
  },
};

export const WithLabel: Story = {
  args: {
    label: 'Email Address',
    placeholder: 'Enter your email...',
  },
};

export const WithHelpText: Story = {
  args: {
    label: 'Password',
    placeholder: 'Enter your password...',
    helpText: 'Password must be at least 8 characters long',
  },
};

// Size Variants
export const Sizes: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <Input label="Extra Small" size="xs" placeholder="xs size" />
      <Input label="Small" size="sm" placeholder="sm size" />
      <Input label="Medium" size="md" placeholder="md size" />
      <Input label="Large" size="lg" placeholder="lg size" />
      <Input label="Extra Large" size="xl" placeholder="xl size" />
    </div>
  ),
};

// Visual Variants
export const Variants: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <Input variant="default" label="Default" placeholder="Default variant" />
      <Input variant="filled" label="Filled" placeholder="Filled variant" />
      <Input variant="outline" label="Outline" placeholder="Outline variant" />
      <Input variant="ghost" label="Ghost" placeholder="Ghost variant" />
    </div>
  ),
};

// Validation States
export const ValidationStates: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <Input
        label="Success State"
        placeholder="Valid input"
        success="Email address is valid"
      />
      <Input
        label="Warning State"
        placeholder="Warning input"
        variant="warning"
        helpText="This field needs attention"
      />
      <Input
        label="Error State"
        placeholder="Invalid input"
        error="This field is required"
      />
    </div>
  ),
};

// With Icons
export const WithIcons: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <Input
        label="Email"
        placeholder="Enter your email"
        leftIcon={Mail}
      />
      <Input
        label="Search"
        placeholder="Search users..."
        leftIcon={Search}
      />
      <Input
        label="Phone"
        placeholder="Enter phone number"
        leftIcon={Phone}
        rightIcon={AlertCircle}
      />
      <Input
        label="Profile"
        placeholder="Username"
        leftIcon={User}
        success="Username is available"
      />
    </div>
  ),
};

// With Addons
export const WithAddons: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <Input
        label="Website URL"
        placeholder="example"
        leftAddon="https://"
        rightAddon=".com"
      />
      <Input
        label="Price"
        placeholder="0.00"
        leftAddon="$"
        rightAddon="USD"
      />
      <Input
        label="Discount Code"
        placeholder="Enter code"
        rightAddon={<button className="text-blue-600 hover:text-blue-800 font-medium">Apply</button>}
      />
    </div>
  ),
};

// Form Field States
export const FormFieldStates: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <Input
        label="Required Field"
        placeholder="This field is required"
        required
        helpText="This field cannot be empty"
      />
      <Input
        label="Optional Field"
        placeholder="This field is optional"
        optional
        helpText="You can skip this field"
      />
      <Input
        label="Disabled Field"
        placeholder="This field is disabled"
        disabled
        helpText="This field is currently disabled"
      />
      <Input
        label="Loading Field"
        placeholder="Loading..."
        loading
        helpText="Please wait while we process"
      />
    </div>
  ),
};

// Password Input
export const PasswordInput: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <Input
        type="password"
        label="Password"
        placeholder="Enter your password"
        helpText="Password will be hidden by default"
      />
      <Input
        type="password"
        label="Confirm Password"
        placeholder="Confirm your password"
        leftIcon={Lock}
        required
      />
    </div>
  ),
};

// Border Radius Variants
export const BorderRadius: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <Input radius="none" label="No Radius" placeholder="No border radius" />
      <Input radius="sm" label="Small Radius" placeholder="Small border radius" />
      <Input radius="md" label="Medium Radius" placeholder="Medium border radius" />
      <Input radius="lg" label="Large Radius" placeholder="Large border radius" />
      <Input radius="xl" label="Extra Large Radius" placeholder="Extra large border radius" />
      <Input radius="full" label="Full Radius" placeholder="Full border radius" />
    </div>
  ),
};

// Interactive States
export const InteractiveStates: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <Input
        label="Normal State"
        placeholder="Default state"
        helpText="This is the normal state"
      />
      <Input
        label="Focused State"
        placeholder="Click to focus"
        helpText="This input will show focus ring when clicked"
        autoFocus
      />
      <Input
        label="Hover State"
        placeholder="Hover over me"
        helpText="This input changes on hover"
      />
      <Input
        label="Disabled State"
        placeholder="Cannot interact"
        disabled
        helpText="This input is disabled"
      />
    </div>
  ),
};

// Search Input Variant
export const SearchInputVariant: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <SearchInput
        placeholder="Search..."
        label="Search"
      />
      <SearchInput
        placeholder="Search products..."
        label="Product Search"
        helpText="Search by name, category, or SKU"
      />
      <SearchInput
        placeholder="Search customers..."
        label="Customer Search"
        loading
        helpText="Loading search results..."
      />
    </div>
  ),
};

// Full Width vs Auto Width
export const WidthVariants: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Full Width (Default)</h3>
        <div className="w-80">
          <Input
            label="Full Width Input"
            placeholder="This input takes full width"
            fullWidth
          />
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-3">Auto Width</h3>
        <Input
          label="Auto Width Input"
          placeholder="This input is auto width"
          fullWidth={false}
        />
      </div>
    </div>
  ),
};

// Complex Form Example
export const ComplexForm: Story = {
  render: () => (
    <div className="max-w-md mx-auto space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">User Registration</h2>
        <p className="text-gray-600">Create your account</p>
      </div>
      
      <Input
        label="Full Name"
        placeholder="John Doe"
        leftIcon={User}
        required
      />
      
      <Input
        label="Email Address"
        type="email"
        placeholder="john@example.com"
        leftIcon={Mail}
        required
        helpText="We'll never share your email with anyone"
      />
      
      <Input
        label="Phone Number"
        type="tel"
        placeholder="+1 (555) 123-4567"
        leftIcon={Phone}
        optional
      />
      
      <Input
        label="Password"
        type="password"
        placeholder="Create a strong password"
        leftIcon={Lock}
        required
        helpText="Must be at least 8 characters with numbers and symbols"
      />
      
      <Input
        label="Confirm Password"
        type="password"
        placeholder="Confirm your password"
        leftIcon={Lock}
        required
      />
      
      <div className="pt-4">
        <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
          Create Account
        </button>
      </div>
    </div>
  ),
};

// Textarea Stories
export const TextareaDefault: Story = {
  render: () => (
    <div className="w-80">
      <Textarea
        label="Message"
        placeholder="Enter your message..."
        helpText="Maximum 500 characters"
      />
    </div>
  ),
};

export const TextareaVariants: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <Textarea
        label="Default Textarea"
        placeholder="Default variant"
        variant="default"
      />
      <Textarea
        label="Filled Textarea"
        placeholder="Filled variant"
        variant="filled"
      />
      <Textarea
        label="Outline Textarea"
        placeholder="Outline variant"
        variant="outline"
      />
      <Textarea
        label="Error Textarea"
        placeholder="Error variant"
        error="This field has an error"
      />
    </div>
  ),
};

export const TextareaAutoResize: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <Textarea
        label="Auto Resize Textarea"
        placeholder="Type to see auto resize..."
        autoResize
        minRows={2}
        maxRows={6}
        helpText="This textarea will automatically resize as you type"
      />
      <Textarea
        label="Fixed Size Textarea"
        placeholder="Fixed size textarea"
        resize="none"
        helpText="This textarea has a fixed size"
      />
    </div>
  ),
};

// Accessibility Example
export const AccessibilityExample: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <Input
        label="Accessible Input"
        placeholder="This input is fully accessible"
        required
        helpText="This input follows ARIA guidelines"
        aria-label="User email input field"
      />
      <Input
        label="Error Input"
        placeholder="Invalid input"
        error="Please enter a valid email address"
        aria-invalid={true}
        aria-describedby="error-message"
      />
      <Textarea
        label="Accessible Textarea"
        placeholder="This textarea is fully accessible"
        helpText="Screen readers will announce this help text"
        aria-label="Message input field"
      />
    </div>
  ),
};