import type { Meta, StoryObj } from '@storybook/nextjs';
import { fn } from 'storybook/test';
import { Settings, Heart, Share, ExternalLink, Star, MapPin, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './Card';
import { Button } from './Button';

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# Card Component

A flexible card component with slot-based composition and multiple variants:

## Features
- **Multiple variants**: default, elevated, outlined, filled, ghost
- **Size options**: xs, sm, md, lg, xl  
- **Interactive states**: clickable, linkable
- **Slot composition**: header, content, footer, media, actions, overlay
- **Accessibility**: ARIA labels, keyboard navigation, semantic HTML
- **Link functionality**: supports both internal and external links

## Sub-components
- **CardHeader**: Contains title and description
- **CardTitle**: Semantic heading element
- **CardDescription**: Subtitle or description text
- **CardContent**: Main content area
- **CardFooter**: Actions and secondary content

## Design System
- Uses Nordic Design System tokens
- Consistent shadows and borders
- Responsive design patterns
- Dark mode support

## Usage Examples
\`\`\`tsx
// Basic card
<Card>
  <CardHeader>
    <CardTitle>Service Title</CardTitle>
    <CardDescription>Service description</CardDescription>
  </CardHeader>
  <CardContent>
    Main content goes here
  </CardContent>
  <CardFooter>
    <Button>Learn More</Button>
  </CardFooter>
</Card>

// Interactive card
<Card 
  clickable 
  onClick={() => console.log('Card clicked')}
>
  Content
</Card>

// Link card
<Card href="/services">
  Content
</Card>
\`\`\`
        `
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'elevated', 'outlined', 'filled', 'ghost'],
      description: 'Visual style variant'
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      description: 'Text size within card'
    },
    rounded: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg', 'xl', 'full'],
      description: 'Border radius'
    },
    shadow: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg', 'xl'],
      description: 'Drop shadow'
    },
    border: {
      control: 'select',
      options: ['none', 'thin', 'medium', 'thick'],
      description: 'Border thickness'
    },
    padding: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg', 'xl'],
      description: 'Internal padding'
    },
    background: {
      control: 'select',
      options: ['default', 'primary', 'secondary', 'accent', 'muted', 'transparent'],
      description: 'Background color'
    },
    clickable: {
      control: 'boolean',
      description: 'Make card clickable'
    },
    href: {
      control: 'text',
      description: 'URL for link cards'
    }
  },
  args: { 
    onClick: fn()
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic variants
export const Default: Story = {
  args: {
    children: (
      <>
        <CardHeader>
          <CardTitle>Default Card</CardTitle>
          <CardDescription>This is a default card variant with border and background.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Card content goes here. This could be any React content including text, images, forms, or other components.</p>
        </CardContent>
        <CardFooter>
          <Button variant="primary" text="Action" />
          <Button variant="ghost" text="Cancel" />
        </CardFooter>
      </>
    ),
  },
};

export const Elevated: Story = {
  args: {
    variant: 'elevated',
    shadow: 'lg',
    children: (
      <>
        <CardHeader>
          <CardTitle>Elevated Card</CardTitle>
          <CardDescription>This card has elevated styling with larger shadow.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Perfect for highlighting important content or creating layered interfaces.</p>
        </CardContent>
      </>
    ),
  },
};

export const Outlined: Story = {
  args: {
    variant: 'outlined',
    children: (
      <>
        <CardHeader>
          <CardTitle>Outlined Card</CardTitle>
          <CardDescription>This card uses outlined styling with prominent border.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Great for creating clear boundaries between content sections.</p>
        </CardContent>
      </>
    ),
  },
};

export const Filled: Story = {
  args: {
    variant: 'filled',
    children: (
      <>
        <CardHeader>
          <CardTitle>Filled Card</CardTitle>
          <CardDescription>This card has a filled background with muted styling.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Useful for secondary content or subtle highlighting.</p>
        </CardContent>
      </>
    ),
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: (
      <>
        <CardHeader>
          <CardTitle>Ghost Card</CardTitle>
          <CardDescription>This card is transparent with minimal styling.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Perfect for seamless integration into existing layouts.</p>
        </CardContent>
      </>
    ),
  },
};

// Interactive examples
export const Clickable: Story = {
  args: {
    clickable: true,
    children: (
      <>
        <CardHeader>
          <CardTitle>Clickable Card</CardTitle>
          <CardDescription>Click anywhere on this card to trigger an action.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This card has hover effects and cursor pointer to indicate interactivity.</p>
        </CardContent>
      </>
    ),
  },
};

export const InternalLink: Story = {
  args: {
    href: '/services',
    children: (
      <>
        <CardHeader>
          <CardTitle>Service Card</CardTitle>
          <CardDescription>Click to view our services page.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This card will navigate to the services page using Next.js routing.</p>
        </CardContent>
      </>
    ),
  },
};

export const ExternalLink: Story = {
  args: {
    href: 'https://revivatech.co.uk',
    target: '_blank',
    children: (
      <>
        <CardHeader>
          <CardTitle>External Link Card</CardTitle>
          <CardDescription>Click to visit our website.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This card will open an external link in a new tab.</p>
        </CardContent>
      </>
    ),
  },
};

// Size examples
export const SmallCard: Story = {
  args: {
    size: 'sm',
    padding: 'sm',
    children: (
      <>
        <CardHeader>
          <CardTitle>Small Card</CardTitle>
          <CardDescription>Compact card for tight spaces.</CardDescription>
        </CardHeader>
      </>
    ),
  },
};

export const LargeCard: Story = {
  args: {
    size: 'lg',
    padding: 'lg',
    children: (
      <>
        <CardHeader>
          <CardTitle>Large Card</CardTitle>
          <CardDescription>Spacious card for detailed content.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>More room for detailed information and complex layouts.</p>
        </CardContent>
        <CardFooter>
          <Button variant="primary" text="Primary Action" />
          <Button variant="secondary" text="Secondary" />
        </CardFooter>
      </>
    ),
  },
};

// Background variants
export const PrimaryBackground: Story = {
  args: {
    background: 'primary',
    children: (
      <>
        <CardHeader>
          <CardTitle>Primary Card</CardTitle>
          <CardDescription>Card with primary background color.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Perfect for highlighting key information or calls to action.</p>
        </CardContent>
      </>
    ),
  },
};

export const SecondaryBackground: Story = {
  args: {
    background: 'secondary',
    children: (
      <>
        <CardHeader>
          <CardTitle>Secondary Card</CardTitle>
          <CardDescription>Card with secondary background color.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Great for supporting content and secondary information.</p>
        </CardContent>
      </>
    ),
  },
};

// Complex examples
export const ServiceCard: Story = {
  args: {
    variant: 'elevated',
    shadow: 'md',
    clickable: true,
    children: (
      <>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            iPhone Repair
          </CardTitle>
          <CardDescription>Professional iPhone repair services with warranty.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Same day service available</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Star className="h-4 w-4" />
              <span>4.9/5 rating (1,200+ reviews)</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>Multiple locations</span>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="primary" text="Book Repair" fullWidth />
        </CardFooter>
      </>
    ),
  },
};

export const TestimonialCard: Story = {
  args: {
    variant: 'outlined',
    children: (
      <>
        <CardContent>
          <blockquote className="text-lg italic mb-4">
            "Excellent service! They fixed my MacBook screen quickly and the price was very reasonable. Highly recommend!"
          </blockquote>
        </CardContent>
        <CardFooter>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
              <span className="text-sm font-medium">JS</span>
            </div>
            <div>
              <p className="font-medium">John Smith</p>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
            </div>
          </div>
        </CardFooter>
      </>
    ),
  },
};

export const PricingCard: Story = {
  args: {
    variant: 'elevated',
    shadow: 'lg',
    children: (
      <>
        <CardHeader>
          <CardTitle className="text-center">Express Service</CardTitle>
          <CardDescription className="text-center">Same day repair service</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-3xl font-bold">£89</div>
            <div className="text-sm text-muted-foreground">Starting from</div>
          </div>
          <ul className="mt-4 space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <div className="w-1 h-1 bg-primary rounded-full"></div>
              Free diagnosis
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1 h-1 bg-primary rounded-full"></div>
              6 month warranty
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1 h-1 bg-primary rounded-full"></div>
              No fix, no fee
            </li>
          </ul>
        </CardContent>
        <CardFooter>
          <Button variant="primary" text="Choose Plan" fullWidth />
        </CardFooter>
      </>
    ),
  },
};

// Layout examples
export const FullWidth: Story = {
  args: {
    className: 'w-full max-w-2xl',
    children: (
      <>
        <CardHeader>
          <CardTitle>Full Width Card</CardTitle>
          <CardDescription>This card expands to fill available width.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Perfect for forms, detailed content, or when you need maximum space utilization.</p>
        </CardContent>
      </>
    ),
  },
  parameters: {
    layout: 'padded',
  },
};

// Grid demonstration
export const CardGrid: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i} variant="default" clickable>
          <CardHeader>
            <CardTitle>Service {i}</CardTitle>
            <CardDescription>Professional repair service {i}</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Quick and reliable repair service with warranty included.</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" text="Learn More" />
          </CardFooter>
        </Card>
      ))}
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'Grid layout showing multiple cards in a responsive grid.'
      }
    }
  }
};

// Accessibility demo
export const AccessibilityDemo: Story = {
  args: {
    clickable: true,
    ariaLabel: 'iPhone repair service card',
    role: 'button',
    children: (
      <>
        <CardHeader>
          <CardTitle>Accessible Card</CardTitle>
          <CardDescription>This card follows accessibility best practices.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Proper ARIA labels, semantic HTML, and keyboard navigation support.</p>
        </CardContent>
      </>
    ),
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