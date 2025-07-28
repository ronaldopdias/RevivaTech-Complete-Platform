import type { Meta, StoryObj } from '@storybook/nextjs';
import { fn } from 'storybook/test';
import { Mail, User, Phone, Search, CreditCard, MapPin } from 'lucide-react';
import { Input } from './Input';

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# Input Component

A comprehensive input component with advanced features and slot-based composition:

## Features
- **Multiple variants**: default, filled, outlined, underlined, ghost
- **Size options**: xs, sm, md, lg, xl
- **State management**: error, warning, success, info states
- **Built-in functionality**: password toggle, clear button, loading states
- **Slot composition**: prefix, suffix, start/end icons
- **Accessibility**: ARIA labels, descriptions, error handling
- **Form integration**: works seamlessly with form libraries

## States & Validation
- **Visual states**: error, warning, success, info
- **Interactive states**: loading, disabled, readonly
- **Validation**: built-in error messaging and ARIA support

## Design System
- Uses Nordic Design System tokens
- Consistent with RevivaTech form patterns
- Responsive and mobile-optimized
- Dark mode support

## Usage Examples
\`\`\`tsx
// Basic input
<Input 
  label="Email"
  placeholder="Enter your email"
/>

// With validation
<Input 
  label="Required Field"
  required
  errorMessage="This field is required"
  state="error"
/>

// Password input
<Input 
  type="password"
  label="Password"
  showPasswordToggle
/>

// With icons
<Input 
  label="Search"
  slots={{
    startIcon: <Search className="h-4 w-4" />
  }}
  composition="slots"
/>
\`\`\`
        `
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'filled', 'outlined', 'underlined', 'ghost'],
      description: 'Visual style variant'
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      description: 'Size of the input'
    },
    rounded: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg', 'full'],
      description: 'Border radius'
    },
    state: {
      control: 'select',
      options: ['default', 'error', 'warning', 'success', 'info'],
      description: 'Validation state'
    },
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'tel', 'url', 'search', 'number'],
      description: 'HTML input type'
    },
    loading: {
      control: 'boolean',
      description: 'Show loading spinner'
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the input'
    },
    readOnly: {
      control: 'boolean',
      description: 'Make input read-only'
    },
    required: {
      control: 'boolean',
      description: 'Required field indicator'
    },
    clearable: {
      control: 'boolean',
      description: 'Show clear button'
    },
    showPasswordToggle: {
      control: 'boolean',
      description: 'Show password visibility toggle'
    },
    label: {
      control: 'text',
      description: 'Input label'
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text'
    },
    description: {
      control: 'text',
      description: 'Help text'
    },
    errorMessage: {
      control: 'text',
      description: 'Error message'
    }
  },
  args: { 
    onChange: fn(),
    onClear: fn(),
    onPasswordToggle: fn()
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic variants
export const Default: Story = {
  args: {
    label: 'Default Input',
    placeholder: 'Enter text here...',
  },
};

export const Filled: Story = {
  args: {
    variant: 'filled',
    label: 'Filled Input',
    placeholder: 'Enter text here...',
  },
};

export const Outlined: Story = {
  args: {
    variant: 'outlined',
    label: 'Outlined Input',
    placeholder: 'Enter text here...',
  },
};

export const Underlined: Story = {
  args: {
    variant: 'underlined',
    label: 'Underlined Input',
    placeholder: 'Enter text here...',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    label: 'Ghost Input',
    placeholder: 'Enter text here...',
  },
};

// Size variants
export const ExtraSmall: Story = {
  args: {
    size: 'xs',
    label: 'Extra Small',
    placeholder: 'XS input',
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
    label: 'Small',
    placeholder: 'Small input',
  },
};

export const Medium: Story = {
  args: {
    size: 'md',
    label: 'Medium',
    placeholder: 'Medium input',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    label: 'Large',
    placeholder: 'Large input',
  },
};

export const ExtraLarge: Story = {
  args: {
    size: 'xl',
    label: 'Extra Large',
    placeholder: 'XL input',
  },
};

// Input types
export const EmailInput: Story = {
  args: {
    type: 'email',
    label: 'Email Address',
    placeholder: 'user@example.com',
    description: 'We\'ll never share your email with anyone else.',
  },
};

export const PasswordInput: Story = {
  args: {
    type: 'password',
    label: 'Password',
    placeholder: 'Enter your password',
    showPasswordToggle: true,
    description: 'Must be at least 8 characters long.',
  },
};

export const PhoneInput: Story = {
  args: {
    type: 'tel',
    label: 'Phone Number',
    placeholder: '+44 7700 900123',
    description: 'Include country code for international numbers.',
  },
};

export const SearchInput: Story = {
  args: {
    type: 'search',
    label: 'Search',
    placeholder: 'Search devices, services...',
    clearable: true,
  },
};

export const NumberInput: Story = {
  args: {
    type: 'number',
    label: 'Quantity',
    placeholder: '0',
    min: 1,
    max: 10,
  },
};

// States
export const ErrorState: Story = {
  args: {
    label: 'Email Address',
    placeholder: 'user@example.com',
    errorMessage: 'Please enter a valid email address.',
    state: 'error',
    value: 'invalid-email',
  },
};

export const WarningState: Story = {
  args: {
    label: 'Username',
    placeholder: 'Enter username',
    description: 'This username might be taken.',
    state: 'warning',
    value: 'admin',
  },
};

export const SuccessState: Story = {
  args: {
    label: 'Email Address',
    placeholder: 'user@example.com',
    description: 'This email is available.',
    state: 'success',
    value: 'user@example.com',
  },
};

export const InfoState: Story = {
  args: {
    label: 'API Key',
    placeholder: 'Enter API key',
    description: 'You can find this in your account settings.',
    state: 'info',
  },
};

// Interactive states
export const Loading: Story = {
  args: {
    label: 'Checking availability...',
    placeholder: 'Enter username',
    loading: true,
    value: 'username123',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled Input',
    placeholder: 'This input is disabled',
    disabled: true,
    value: 'Cannot edit this',
  },
};

export const ReadOnly: Story = {
  args: {
    label: 'Read Only Input',
    placeholder: 'This input is read only',
    readOnly: true,
    value: 'Read only value',
    description: 'This field cannot be edited.',
  },
};

// Special features
export const WithClearButton: Story = {
  args: {
    label: 'Clearable Input',
    placeholder: 'Type something and see clear button',
    clearable: true,
    value: 'Clear me!',
  },
};

export const RequiredField: Story = {
  args: {
    label: 'Required Field',
    placeholder: 'This field is required',
    required: true,
    description: 'Please fill in this required field.',
  },
};

// Form examples
export const ContactForm: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-md">
      <Input
        label="Full Name"
        placeholder="John Smith"
        required
      />
      <Input
        type="email"
        label="Email Address"
        placeholder="john@example.com"
        required
      />
      <Input
        type="tel"
        label="Phone Number"
        placeholder="+44 7700 900123"
      />
      <Input
        label="Company"
        placeholder="Your company name"
      />
    </div>
  ),
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        story: 'Contact form with multiple input types and validation.'
      }
    }
  }
};

export const LoginForm: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-md">
      <Input
        type="email"
        label="Email"
        placeholder="user@example.com"
        required
      />
      <Input
        type="password"
        label="Password"
        placeholder="Enter your password"
        showPasswordToggle
        required
      />
      <Input
        type="search"
        label="Search"
        placeholder="Search for something..."
        clearable
      />
    </div>
  ),
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        story: 'Login form with email, password, and search inputs.'
      }
    }
  }
};

// Validation examples
export const ValidationDemo: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-md">
      <Input
        label="Valid Email"
        type="email"
        value="user@example.com"
        state="success"
        description="Email format is correct."
      />
      <Input
        label="Invalid Email"
        type="email"
        value="invalid-email"
        state="error"
        errorMessage="Please enter a valid email address."
      />
      <Input
        label="Warning Example"
        value="admin"
        state="warning"
        description="This username might be taken."
      />
      <Input
        label="Info Example"
        state="info"
        description="Additional information about this field."
      />
    </div>
  ),
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        story: 'Examples of different validation states and messages.'
      }
    }
  }
};

// Accessibility demo
export const AccessibilityDemo: Story = {
  args: {
    label: 'Accessible Input',
    placeholder: 'Enter your name',
    description: 'This input follows accessibility best practices.',
    ariaLabel: 'Customer name input field',
    required: true,
  },
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: 'label', enabled: true },
          { id: 'aria-required-attr', enabled: true },
          { id: 'aria-describedby', enabled: true },
        ]
      }
    },
    docs: {
      description: {
        story: 'Input with proper ARIA labels, descriptions, and accessibility features.'
      }
    }
  }
};

// Responsive layout
export const ResponsiveLayout: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
      <Input label="Small" size="sm" placeholder="Small input" />
      <Input label="Medium" size="md" placeholder="Medium input" />
      <Input label="Large" size="lg" placeholder="Large input" />
      <Input label="Filled" variant="filled" placeholder="Filled variant" />
      <Input label="Outlined" variant="outlined" placeholder="Outlined variant" />
      <Input label="Underlined" variant="underlined" placeholder="Underlined variant" />
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'Responsive grid layout showing different input variants and sizes.'
      }
    }
  }
};