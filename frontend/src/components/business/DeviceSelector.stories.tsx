import type { Meta, StoryObj } from '@storybook/react';
import { DeviceSelector } from './DeviceSelector';
import { allDevices } from '../../../config/devices';

const meta = {
  title: 'Business/DeviceSelector',
  component: DeviceSelector,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A comprehensive device selector component with search, categorization, and popular devices. Part of the RevivaTech business components suite for Phase 4.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onDeviceSelect: { action: 'device-selected' },
    variant: {
      control: 'select',
      options: ['default', 'compact', 'detailed'],
      description: 'Visual variant of the component',
    },
    showPopular: {
      control: 'boolean',
      description: 'Whether to show popular devices section',
    },
    showSearch: {
      control: 'boolean',
      description: 'Whether to show search functionality',
    },
    placeholder: {
      control: 'text',
      description: 'Search input placeholder text',
    },
  },
} satisfies Meta<typeof DeviceSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default variant with all features
export const Default: Story = {
  args: {
    showPopular: true,
    showSearch: true,
    placeholder: "Search for your device...",
  },
};

// Compact variant for smaller spaces
export const Compact: Story = {
  args: {
    variant: 'compact',
    showPopular: false,
    showSearch: true,
    placeholder: "Find your device...",
  },
  parameters: {
    docs: {
      description: {
        story: 'Compact variant suitable for sidebars or modal dialogs.',
      },
    },
  },
};

// Detailed variant with extended information
export const Detailed: Story = {
  args: {
    variant: 'detailed',
    showPopular: true,
    showSearch: true,
    placeholder: "Search devices (2016-2025)...",
  },
  parameters: {
    docs: {
      description: {
        story: 'Detailed variant showing common issues and additional device information.',
      },
    },
  },
};

// With pre-selected device
export const WithSelectedDevice: Story = {
  args: {
    selectedDevice: allDevices[0], // First device from the database
    showPopular: true,
    showSearch: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Component with a device already selected, showing the selection state.',
      },
    },
  },
};

// Search-only mode (no popular devices)
export const SearchOnly: Story = {
  args: {
    showPopular: false,
    showSearch: true,
    placeholder: "Type to search devices...",
  },
  parameters: {
    docs: {
      description: {
        story: 'Search-focused variant without popular devices section.',
      },
    },
  },
};

// Browse-only mode (no search)
export const BrowseOnly: Story = {
  args: {
    showPopular: true,
    showSearch: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Browse-focused variant without search functionality.',
      },
    },
  },
};

// Custom placeholder
export const CustomPlaceholder: Story = {
  args: {
    showPopular: true,
    showSearch: true,
    placeholder: "What device needs repair today?",
  },
  parameters: {
    docs: {
      description: {
        story: 'Example with custom search placeholder text.',
      },
    },
  },
};

// Minimal setup
export const Minimal: Story = {
  args: {
    variant: 'compact',
    showPopular: false,
    showSearch: true,
    placeholder: "Device search...",
  },
  parameters: {
    docs: {
      description: {
        story: 'Minimal configuration for space-constrained layouts.',
      },
    },
  },
};

// Loading state simulation
export const LoadingState: Story = {
  args: {
    showPopular: true,
    showSearch: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Example showing how the component behaves during search operations.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="space-y-4">
        <div className="text-sm text-neutral-600 mb-4">
          Try searching for "macbook" or "iphone" to see the search functionality
        </div>
        <Story />
      </div>
    ),
  ],
};

// Interactive demo
export const InteractiveDemo: Story = {
  args: {
    variant: 'detailed',
    showPopular: true,
    showSearch: true,
    placeholder: "Try searching: MacBook, iPhone, iPad, Gaming Console...",
  },
  parameters: {
    docs: {
      description: {
        story: 'Full interactive demo showcasing all features. Try searching for different device types.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Interactive Demo</h4>
          <p className="text-sm text-blue-700">
            • Search for devices by name, brand, or type<br/>
            • Browse by category (MacBook, iPhone, Gaming, etc.)<br/>
            • View popular devices from the last 3 years<br/>
            • See device details including repair costs and common issues
          </p>
        </div>
        <Story />
      </div>
    ),
  ],
};

// Different screen sizes
export const Mobile: Story = {
  args: {
    variant: 'compact',
    showPopular: true,
    showSearch: true,
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

export const Tablet: Story = {
  args: {
    showPopular: true,
    showSearch: true,
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

export const Desktop: Story = {
  args: {
    variant: 'detailed',
    showPopular: true,
    showSearch: true,
  },
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
    docs: {
      description: {
        story: 'Full desktop experience with detailed view.',
      },
    },
  },
};

// Accessibility focused
export const AccessibilityFocused: Story = {
  args: {
    showPopular: true,
    showSearch: true,
    placeholder: "Search devices (use keyboard navigation)",
  },
  parameters: {
    docs: {
      description: {
        story: 'Component demonstrating accessibility features. Try using keyboard navigation (Tab, Enter, Arrow keys).',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-900 mb-2">Accessibility Features</h4>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Full keyboard navigation support</li>
            <li>• Screen reader compatible</li>
            <li>• Focus management and visual indicators</li>
            <li>• ARIA labels and semantic HTML</li>
            <li>• High contrast color scheme</li>
          </ul>
        </div>
        <Story />
      </div>
    ),
  ],
};