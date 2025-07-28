import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './Badge';
import { Check, X, AlertTriangle, Info, Star, Clock, Users, Settings } from 'lucide-react';

const meta = {
  title: 'Components/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A flexible badge component for displaying status, labels, and indicators. Supports multiple variants and sizes following the Nordic design system.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'destructive', 'outline', 'success', 'warning', 'info', 'gray'],
      description: 'Badge visual variant',
    },
    size: {
      control: 'select',
      options: ['sm', 'default', 'lg'],
      description: 'Badge size',
    },
    children: {
      control: 'text',
      description: 'Badge content',
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic Examples
export const Default: Story = {
  args: {
    children: 'Badge',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary',
  },
};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Destructive',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline',
  },
};

// Size Variants
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Badge size="sm">Small</Badge>
      <Badge size="default">Default</Badge>
      <Badge size="lg">Large</Badge>
    </div>
  ),
};

// Color Variants
export const ColorVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="info">Info</Badge>
      <Badge variant="gray">Gray</Badge>
    </div>
  ),
};

// Status Badges
export const StatusBadges: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Order Status:</span>
        <Badge variant="success">
          <Check className="w-3 h-3 mr-1" />
          Completed
        </Badge>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Payment Status:</span>
        <Badge variant="warning">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Delivery Status:</span>
        <Badge variant="destructive">
          <X className="w-3 h-3 mr-1" />
          Failed
        </Badge>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Account Status:</span>
        <Badge variant="info">
          <Info className="w-3 h-3 mr-1" />
          Active
        </Badge>
      </div>
    </div>
  ),
};

// With Icons
export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="success">
        <Check className="w-3 h-3 mr-1" />
        Verified
      </Badge>
      
      <Badge variant="warning">
        <AlertTriangle className="w-3 h-3 mr-1" />
        Warning
      </Badge>
      
      <Badge variant="info">
        <Info className="w-3 h-3 mr-1" />
        Information
      </Badge>
      
      <Badge variant="destructive">
        <X className="w-3 h-3 mr-1" />
        Error
      </Badge>
      
      <Badge variant="default">
        <Star className="w-3 h-3 mr-1" />
        Premium
      </Badge>
      
      <Badge variant="secondary">
        <Users className="w-3 h-3 mr-1" />
        Team
      </Badge>
    </div>
  ),
};

// Notification Badges
export const NotificationBadges: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative">
          <button className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
            <Settings className="w-5 h-5" />
          </button>
          <Badge 
            variant="destructive" 
            size="sm"
            className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center p-0 text-xs"
          >
            3
          </Badge>
        </div>
        
        <div className="relative">
          <button className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
            <Users className="w-5 h-5" />
          </button>
          <Badge 
            variant="info" 
            size="sm"
            className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center p-0 text-xs"
          >
            12
          </Badge>
        </div>
        
        <div className="relative">
          <button className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
            <Star className="w-5 h-5" />
          </button>
          <Badge 
            variant="success" 
            size="sm"
            className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center p-0 text-xs"
          >
            99+
          </Badge>
        </div>
      </div>
      
      <div className="text-sm text-gray-600">
        Notification badges on icons and buttons
      </div>
    </div>
  ),
};

// Category Tags
export const CategoryTags: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Blog Post Categories</h3>
        <div className="flex flex-wrap gap-2">
          <Badge variant="info">Technology</Badge>
          <Badge variant="success">Tutorial</Badge>
          <Badge variant="warning">JavaScript</Badge>
          <Badge variant="gray">React</Badge>
          <Badge variant="outline">Frontend</Badge>
          <Badge variant="secondary">Web Development</Badge>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-2">Product Tags</h3>
        <div className="flex flex-wrap gap-2">
          <Badge variant="destructive">Sale</Badge>
          <Badge variant="success">New</Badge>
          <Badge variant="warning">Limited</Badge>
          <Badge variant="info">Popular</Badge>
          <Badge variant="gray">Best Seller</Badge>
        </div>
      </div>
    </div>
  ),
};

// Size Comparison
export const SizeComparison: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Small Badges</h3>
        <div className="flex flex-wrap gap-2">
          <Badge size="sm" variant="default">Default</Badge>
          <Badge size="sm" variant="secondary">Secondary</Badge>
          <Badge size="sm" variant="success">Success</Badge>
          <Badge size="sm" variant="warning">Warning</Badge>
          <Badge size="sm" variant="destructive">Destructive</Badge>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-3">Default Badges</h3>
        <div className="flex flex-wrap gap-2">
          <Badge variant="default">Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="destructive">Destructive</Badge>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-3">Large Badges</h3>
        <div className="flex flex-wrap gap-2">
          <Badge size="lg" variant="default">Default</Badge>
          <Badge size="lg" variant="secondary">Secondary</Badge>
          <Badge size="lg" variant="success">Success</Badge>
          <Badge size="lg" variant="warning">Warning</Badge>
          <Badge size="lg" variant="destructive">Destructive</Badge>
        </div>
      </div>
    </div>
  ),
};

// User Profile Badges
export const UserProfileBadges: Story = {
  render: () => (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center">
        <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
          <span className="text-2xl font-bold text-gray-600">JD</span>
        </div>
        <h2 className="text-2xl font-bold">John Doe</h2>
        <p className="text-gray-600">Software Engineer</p>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Account Type</span>
          <Badge variant="default">
            <Star className="w-3 h-3 mr-1" />
            Premium
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Verification</span>
          <Badge variant="success">
            <Check className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status</span>
          <Badge variant="info">
            <div className="w-2 h-2 bg-current rounded-full mr-1"></div>
            Online
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Role</span>
          <Badge variant="secondary">
            <Users className="w-3 h-3 mr-1" />
            Admin
          </Badge>
        </div>
      </div>
      
      <div>
        <h3 className="text-sm font-medium mb-2">Skills</h3>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" size="sm">JavaScript</Badge>
          <Badge variant="outline" size="sm">React</Badge>
          <Badge variant="outline" size="sm">TypeScript</Badge>
          <Badge variant="outline" size="sm">Node.js</Badge>
          <Badge variant="outline" size="sm">Python</Badge>
        </div>
      </div>
    </div>
  ),
};

// Interactive Demo
export const InteractiveDemo: Story = {
  render: () => {
    const [selectedVariant, setSelectedVariant] = React.useState<string>('default');
    const [selectedSize, setSelectedSize] = React.useState<string>('default');
    const [badgeText, setBadgeText] = React.useState<string>('Sample Badge');
    
    const variants = [
      'default', 'secondary', 'destructive', 'outline', 
      'success', 'warning', 'info', 'gray'
    ];
    
    const sizes = ['sm', 'default', 'lg'];
    
    return (
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Badge Customizer</h2>
          <div className="flex justify-center mb-6">
            <Badge 
              variant={selectedVariant as any}
              size={selectedSize as any}
            >
              {badgeText}
            </Badge>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Badge Text</label>
            <input
              type="text"
              value={badgeText}
              onChange={(e) => setBadgeText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter badge text"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Variant</label>
            <div className="grid grid-cols-2 gap-2">
              {variants.map(variant => (
                <button
                  key={variant}
                  onClick={() => setSelectedVariant(variant)}
                  className={`px-3 py-2 text-sm rounded-md transition-colors ${
                    selectedVariant === variant
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {variant}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Size</label>
            <div className="flex gap-2">
              {sizes.map(size => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`px-3 py-2 text-sm rounded-md transition-colors ${
                    selectedSize === size
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="text-center">
          <code className="text-sm bg-gray-100 px-2 py-1 rounded">
            {`<Badge variant="${selectedVariant}" size="${selectedSize}">${badgeText}</Badge>`}
          </code>
        </div>
      </div>
    );
  },
};

// Real-world Usage Examples
export const RealWorldExamples: Story = {
  render: () => (
    <div className="space-y-8">
      {/* Dashboard Stats */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Dashboard Overview</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">1,234</div>
            <div className="text-sm text-gray-600">Total Orders</div>
            <Badge variant="success" size="sm" className="mt-1">
              +12%
            </Badge>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">56</div>
            <div className="text-sm text-gray-600">Pending</div>
            <Badge variant="warning" size="sm" className="mt-1">
              Review
            </Badge>
          </div>
        </div>
      </div>
      
      {/* Product List */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Product Inventory</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span>MacBook Pro 14"</span>
            <div className="flex gap-2">
              <Badge variant="success">In Stock</Badge>
              <Badge variant="info" size="sm">Electronics</Badge>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span>iPhone 15 Pro</span>
            <div className="flex gap-2">
              <Badge variant="warning">Low Stock</Badge>
              <Badge variant="info" size="sm">Electronics</Badge>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span>AirPods Pro</span>
            <div className="flex gap-2">
              <Badge variant="destructive">Out of Stock</Badge>
              <Badge variant="info" size="sm">Electronics</Badge>
            </div>
          </div>
        </div>
      </div>
      
      {/* Task Management */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Task Management</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span>Fix login bug</span>
            <div className="flex gap-2">
              <Badge variant="destructive">High Priority</Badge>
              <Badge variant="gray" size="sm">Bug</Badge>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span>Update documentation</span>
            <div className="flex gap-2">
              <Badge variant="info">In Progress</Badge>
              <Badge variant="gray" size="sm">Docs</Badge>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span>Code review</span>
            <div className="flex gap-2">
              <Badge variant="warning">Pending</Badge>
              <Badge variant="gray" size="sm">Review</Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
};