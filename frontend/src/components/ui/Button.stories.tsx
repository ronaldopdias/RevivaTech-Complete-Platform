import type { Meta, StoryObj } from '@storybook/nextjs';
import { fn } from 'storybook/test';
import { Settings, Download, Heart, ExternalLink, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# Button Component

A highly flexible and configurable button component with the following features:

## Features
- **Multiple variants**: primary, secondary, ghost, danger, outline
- **Size options**: xs, sm, md, lg, xl
- **Icon support**: left/right positioned icons with custom components
- **Loading states**: built-in spinner with disabled state
- **Link functionality**: supports both internal (Next.js) and external links
- **Accessibility**: ARIA labels, keyboard navigation, focus management
- **Configuration-driven**: uses design tokens and variant patterns

## Design System Integration
- Uses Nordic Design System tokens
- Consistent with RevivaTech brand guidelines
- Responsive and mobile-optimized
- Dark mode support

## Usage Examples
\`\`\`tsx
// Basic button
<Button text="Click me" />

// With icon
<Button 
  text="Download"
  icon={{ component: Download, position: 'left' }}
  variant="primary"
/>

// As link
<Button 
  text="Visit GitHub"
  href="https://github.com"
  variant="outline"
/>

// Loading state
<Button 
  text="Processing..."
  loading={true}
  disabled={true}
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
      options: ['primary', 'secondary', 'ghost', 'danger', 'outline'],
      description: 'Visual style variant'
    },
    size: {
      control: 'select', 
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      description: 'Size of the button'
    },
    rounded: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg', 'full'],
      description: 'Border radius'
    },
    shadow: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg'],
      description: 'Drop shadow'
    },
    fullWidth: {
      control: 'boolean',
      description: 'Make button full width'
    },
    loading: {
      control: 'boolean',
      description: 'Show loading spinner'
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the button'
    },
    text: {
      control: 'text',
      description: 'Button text content'
    },
    href: {
      control: 'text',
      description: 'URL for link buttons'
    },
    type: {
      control: 'select',
      options: ['button', 'submit', 'reset'],
      description: 'HTML button type'
    }
  },
  args: { 
    onClick: fn(),
    text: 'Button'
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic variants
export const Primary: Story = {
  args: {
    variant: 'primary',
    text: 'Primary Button',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    text: 'Secondary Button',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    text: 'Ghost Button',
  },
};

export const Danger: Story = {
  args: {
    variant: 'danger',
    text: 'Danger Button',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    text: 'Outline Button',
  },
};

// Size variants
export const ExtraSmall: Story = {
  args: {
    size: 'xs',
    text: 'Extra Small',
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
    text: 'Small',
  },
};

export const Medium: Story = {
  args: {
    size: 'md',
    text: 'Medium',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    text: 'Large',
  },
};

export const ExtraLarge: Story = {
  args: {
    size: 'xl',
    text: 'Extra Large',
  },
};

// With icons
export const WithLeftIcon: Story = {
  args: {
    text: 'Download File',
    icon: {
      component: Download,
      position: 'left'
    },
    variant: 'primary',
  },
};

export const WithRightIcon: Story = {
  args: {
    text: 'Continue',
    icon: {
      component: ArrowRight,
      position: 'right'
    },
    variant: 'primary',
  },
};

export const IconOnly: Story = {
  args: {
    icon: {
      component: Heart,
      position: 'left'
    },
    ariaLabel: 'Like',
    size: 'md',
    variant: 'ghost',
  },
};

// States
export const Loading: Story = {
  args: {
    text: 'Processing...',
    loading: true,
    variant: 'primary',
  },
};

export const Disabled: Story = {
  args: {
    text: 'Disabled Button',
    disabled: true,
    variant: 'primary',
  },
};

// Special configurations
export const FullWidth: Story = {
  args: {
    text: 'Full Width Button',
    fullWidth: true,
    variant: 'primary',
  },
  parameters: {
    layout: 'padded',
  },
};

export const RoundedFull: Story = {
  args: {
    text: 'Pill Button',
    rounded: 'full',
    variant: 'primary',
  },
};

export const WithShadow: Story = {
  args: {
    text: 'Shadow Button',
    shadow: 'lg',
    variant: 'primary',
  },
};

// As links
export const InternalLink: Story = {
  args: {
    text: 'Go to Services',
    href: '/services',
    variant: 'outline',
    icon: {
      component: ArrowRight,
      position: 'right'
    },
  },
};

export const ExternalLink: Story = {
  args: {
    text: 'Visit Website',
    href: 'https://revivatech.co.uk',
    target: '_blank',
    variant: 'ghost',
    icon: {
      component: ExternalLink,
      position: 'right'
    },
  },
};

// Form buttons
export const SubmitButton: Story = {
  args: {
    text: 'Submit Form',
    type: 'submit',
    variant: 'primary',
  },
};

export const ResetButton: Story = {
  args: {
    text: 'Reset Form',
    type: 'reset',
    variant: 'secondary',
  },
};

// Complex examples
export const CallToAction: Story = {
  args: {
    text: 'Book Your Repair Now',
    variant: 'primary',
    size: 'lg',
    icon: {
      component: ArrowRight,
      position: 'right'
    },
    href: '/book-repair',
    shadow: 'md',
  },
};

export const SecondaryAction: Story = {
  args: {
    text: 'Learn More',
    variant: 'outline',
    size: 'md',
    href: '/about',
  },
};

export const UtilityButton: Story = {
  args: {
    text: 'Settings',
    variant: 'ghost',
    size: 'sm',
    icon: {
      component: Settings,
      position: 'left'
    },
  },
};

// Accessibility focused
export const AccessibilityDemo: Story = {
  args: {
    text: 'Accessible Button',
    variant: 'primary',
    ariaLabel: 'Submit repair booking form',
    tooltip: 'Click to submit your repair booking',
  },
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: true },
          { id: 'keyboard-navigation', enabled: true },
          { id: 'focus-management', enabled: true },
        ]
      }
    }
  }
};

// Interactive demo showing all variants
export const AllVariants: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 p-6">
      <Button variant="primary" text="Primary" />
      <Button variant="secondary" text="Secondary" />
      <Button variant="ghost" text="Ghost" />
      <Button variant="danger" text="Danger" />
      <Button variant="outline" text="Outline" />
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'Grid showing all button variants side by side for comparison.'
      }
    }
  }
};

// Size comparison
export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-col items-center gap-4 p-6">
      <Button size="xs" text="Extra Small" />
      <Button size="sm" text="Small" />
      <Button size="md" text="Medium" />
      <Button size="lg" text="Large" />
      <Button size="xl" text="Extra Large" />
    </div>
  ),
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        story: 'Vertical stack showing all button sizes for comparison.'
      }
    }
  }
};