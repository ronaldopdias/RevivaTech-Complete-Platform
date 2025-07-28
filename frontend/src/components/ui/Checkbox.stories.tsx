import type { Meta, StoryObj } from '@storybook/react';
import { Checkbox } from './Checkbox';
import React from 'react';

const meta = {
  title: 'Components/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A flexible checkbox component with multiple variants, sizes, and states. Supports indeterminate state, custom styling, and accessibility features.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'outline', 'filled', 'ghost'],
      description: 'Checkbox visual variant',
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      description: 'Checkbox size',
    },
    rounded: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg', 'full'],
      description: 'Border radius',
    },
    color: {
      control: 'select',
      options: ['primary', 'secondary', 'success', 'warning', 'danger', 'info'],
      description: 'Checkbox color theme',
    },
    state: {
      control: 'select',
      options: ['default', 'error', 'warning', 'success', 'info'],
      description: 'Validation state',
    },
    checked: {
      control: 'boolean',
      description: 'Checked state',
    },
    indeterminate: {
      control: 'boolean',
      description: 'Indeterminate state (partially checked)',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
    required: {
      control: 'boolean',
      description: 'Required field indicator',
    },
    label: {
      control: 'text',
      description: 'Checkbox label',
    },
    description: {
      control: 'text',
      description: 'Help text below label',
    },
    errorMessage: {
      control: 'text',
      description: 'Error message',
    },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic Examples
export const Default: Story = {
  args: {
    label: 'Default checkbox',
  },
};

export const Checked: Story = {
  args: {
    label: 'Checked checkbox',
    checked: true,
  },
};

export const WithDescription: Story = {
  args: {
    label: 'Accept terms and conditions',
    description: 'You must agree to our terms and conditions to continue',
  },
};

// Size Variants
export const Sizes: Story = {
  render: () => (
    <div className="space-y-4">
      <Checkbox size="xs" label="Extra Small" />
      <Checkbox size="sm" label="Small" />
      <Checkbox size="md" label="Medium" />
      <Checkbox size="lg" label="Large" />
      <Checkbox size="xl" label="Extra Large" />
    </div>
  ),
};

// Visual Variants
export const Variants: Story = {
  render: () => (
    <div className="space-y-4">
      <Checkbox variant="default" label="Default variant" checked />
      <Checkbox variant="outline" label="Outline variant" checked />
      <Checkbox variant="filled" label="Filled variant" checked />
      <Checkbox variant="ghost" label="Ghost variant" checked />
    </div>
  ),
};

// Color Variants
export const Colors: Story = {
  render: () => (
    <div className="space-y-4">
      <Checkbox color="primary" label="Primary color" checked />
      <Checkbox color="secondary" label="Secondary color" checked />
      <Checkbox color="success" label="Success color" checked />
      <Checkbox color="warning" label="Warning color" checked />
      <Checkbox color="danger" label="Danger color" checked />
      <Checkbox color="info" label="Info color" checked />
    </div>
  ),
};

// Validation States
export const ValidationStates: Story = {
  render: () => (
    <div className="space-y-4">
      <Checkbox
        label="Success state"
        state="success"
        checked
        description="This checkbox is valid"
      />
      <Checkbox
        label="Warning state"
        state="warning"
        checked
        description="This checkbox has a warning"
      />
      <Checkbox
        label="Error state"
        errorMessage="This checkbox is required"
        description="This checkbox has an error"
      />
      <Checkbox
        label="Info state"
        state="info"
        checked
        description="This checkbox has additional information"
      />
    </div>
  ),
};

// Indeterminate State
export const IndeterminateState: Story = {
  render: () => {
    const [parentChecked, setParentChecked] = React.useState(false);
    const [childChecked, setChildChecked] = React.useState([false, false, false]);
    
    // Calculate parent state
    const checkedCount = childChecked.filter(Boolean).length;
    const isIndeterminate = checkedCount > 0 && checkedCount < childChecked.length;
    const isAllChecked = checkedCount === childChecked.length;
    
    React.useEffect(() => {
      setParentChecked(isAllChecked);
    }, [isAllChecked]);
    
    const handleParentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const checked = e.target.checked;
      setParentChecked(checked);
      setChildChecked([checked, checked, checked]);
    };
    
    const handleChildChange = (index: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const newChildChecked = [...childChecked];
      newChildChecked[index] = e.target.checked;
      setChildChecked(newChildChecked);
    };
    
    return (
      <div className="space-y-4">
        <Checkbox
          label="Select all options"
          checked={parentChecked}
          indeterminate={isIndeterminate}
          onChange={handleParentChange}
          description="This checkbox controls all options below"
        />
        
        <div className="ml-6 space-y-2">
          <Checkbox
            label="Option 1"
            checked={childChecked[0]}
            onChange={handleChildChange(0)}
          />
          <Checkbox
            label="Option 2"
            checked={childChecked[1]}
            onChange={handleChildChange(1)}
          />
          <Checkbox
            label="Option 3"
            checked={childChecked[2]}
            onChange={handleChildChange(2)}
          />
        </div>
        
        <div className="text-sm text-gray-600">
          Selected: {checkedCount} of {childChecked.length}
        </div>
      </div>
    );
  },
};

// Border Radius Variants
export const BorderRadius: Story = {
  render: () => (
    <div className="space-y-4">
      <Checkbox rounded="none" label="No radius" checked />
      <Checkbox rounded="sm" label="Small radius" checked />
      <Checkbox rounded="md" label="Medium radius" checked />
      <Checkbox rounded="lg" label="Large radius" checked />
      <Checkbox rounded="full" label="Full radius" checked />
    </div>
  ),
};

// Interactive States
export const InteractiveStates: Story = {
  render: () => (
    <div className="space-y-4">
      <Checkbox
        label="Normal state"
        description="This checkbox is interactive"
      />
      <Checkbox
        label="Disabled unchecked"
        disabled
        description="This checkbox is disabled"
      />
      <Checkbox
        label="Disabled checked"
        disabled
        checked
        description="This checkbox is disabled and checked"
      />
      <Checkbox
        label="Required field"
        required
        description="This checkbox is required"
      />
    </div>
  ),
};

// Form Integration
export const FormIntegration: Story = {
  render: () => {
    const [formData, setFormData] = React.useState({
      newsletter: false,
      terms: false,
      privacy: false,
      marketing: false,
    });
    
    const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData(prev => ({
        ...prev,
        [field]: e.target.checked,
      }));
    };
    
    return (
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold">Account Settings</h2>
          <p className="text-gray-600">Configure your preferences</p>
        </div>
        
        <div className="space-y-4">
          <Checkbox
            label="Subscribe to newsletter"
            description="Receive updates about new features and improvements"
            checked={formData.newsletter}
            onChange={handleChange('newsletter')}
          />
          
          <Checkbox
            label="Accept terms and conditions"
            description="You must agree to our terms and conditions"
            checked={formData.terms}
            onChange={handleChange('terms')}
            required
            state={formData.terms ? 'success' : 'default'}
          />
          
          <Checkbox
            label="Privacy policy agreement"
            description="Consent to data processing as described in our privacy policy"
            checked={formData.privacy}
            onChange={handleChange('privacy')}
            required
            state={formData.privacy ? 'success' : 'default'}
          />
          
          <Checkbox
            label="Marketing communications"
            description="Receive promotional emails and special offers"
            checked={formData.marketing}
            onChange={handleChange('marketing')}
            color="info"
          />
        </div>
        
        <div className="pt-4">
          <button 
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            disabled={!formData.terms || !formData.privacy}
          >
            Save Settings
          </button>
        </div>
        
        <div className="text-sm text-gray-600 space-y-1">
          <div>Newsletter: {formData.newsletter ? 'Yes' : 'No'}</div>
          <div>Terms: {formData.terms ? 'Agreed' : 'Not agreed'}</div>
          <div>Privacy: {formData.privacy ? 'Agreed' : 'Not agreed'}</div>
          <div>Marketing: {formData.marketing ? 'Yes' : 'No'}</div>
        </div>
      </div>
    );
  },
};

// Grouped Checkboxes
export const GroupedCheckboxes: Story = {
  render: () => {
    const [permissions, setPermissions] = React.useState({
      read: false,
      write: false,
      execute: false,
      admin: false,
    });
    
    const handlePermissionChange = (permission: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setPermissions(prev => ({
        ...prev,
        [permission]: e.target.checked,
      }));
    };
    
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold">User Permissions</h3>
          <p className="text-gray-600">Select the permissions for this user</p>
        </div>
        
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-3">Basic Permissions</h4>
            <div className="space-y-2">
              <Checkbox
                label="Read access"
                description="View files and folders"
                checked={permissions.read}
                onChange={handlePermissionChange('read')}
                color="info"
              />
              <Checkbox
                label="Write access"
                description="Create and modify files"
                checked={permissions.write}
                onChange={handlePermissionChange('write')}
                color="warning"
              />
              <Checkbox
                label="Execute access"
                description="Run programs and scripts"
                checked={permissions.execute}
                onChange={handlePermissionChange('execute')}
                color="success"
              />
            </div>
          </div>
          
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-3">Advanced Permissions</h4>
            <Checkbox
              label="Administrator access"
              description="Full system access with all permissions"
              checked={permissions.admin}
              onChange={handlePermissionChange('admin')}
              color="danger"
              state={permissions.admin ? 'warning' : 'default'}
            />
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium mb-2">Summary</h4>
          <div className="text-sm space-y-1">
            {Object.entries(permissions).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="capitalize">{key}:</span>
                <span className={value ? 'text-green-600' : 'text-gray-500'}>
                  {value ? 'Granted' : 'Denied'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  },
};

// Checkbox List
export const CheckboxList: Story = {
  render: () => {
    const [selectedItems, setSelectedItems] = React.useState<string[]>([]);
    
    const items = [
      { id: 'item1', label: 'Apple', description: 'Fresh red apples' },
      { id: 'item2', label: 'Banana', description: 'Ripe yellow bananas' },
      { id: 'item3', label: 'Orange', description: 'Juicy oranges' },
      { id: 'item4', label: 'Grapes', description: 'Sweet purple grapes' },
      { id: 'item5', label: 'Pineapple', description: 'Tropical pineapple' },
    ];
    
    const handleItemChange = (itemId: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.checked) {
        setSelectedItems(prev => [...prev, itemId]);
      } else {
        setSelectedItems(prev => prev.filter(id => id !== itemId));
      }
    };
    
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Shopping List</h3>
          <p className="text-gray-600">Select items to add to your cart</p>
        </div>
        
        <div className="space-y-2">
          {items.map(item => (
            <Checkbox
              key={item.id}
              label={item.label}
              description={item.description}
              checked={selectedItems.includes(item.id)}
              onChange={handleItemChange(item.id)}
              variant="outline"
            />
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="text-sm">
            <strong>Selected items:</strong> {selectedItems.length} of {items.length}
          </div>
          {selectedItems.length > 0 && (
            <div className="text-sm text-blue-600 mt-1">
              {items
                .filter(item => selectedItems.includes(item.id))
                .map(item => item.label)
                .join(', ')}
            </div>
          )}
        </div>
      </div>
    );
  },
};

// Advanced Features
export const AdvancedFeatures: Story = {
  render: () => {
    const [settings, setSettings] = React.useState({
      notifications: true,
      darkMode: false,
      autoSave: true,
      analytics: false,
    });
    
    const handleSettingChange = (setting: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setSettings(prev => ({
        ...prev,
        [setting]: e.target.checked,
      }));
    };
    
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Advanced Settings</h2>
          <p className="text-gray-600">Configure advanced application settings</p>
        </div>
        
        <div className="space-y-4">
          <Checkbox
            label="Enable notifications"
            description="Show desktop notifications for important events"
            checked={settings.notifications}
            onChange={handleSettingChange('notifications')}
            size="lg"
            color="primary"
          />
          
          <Checkbox
            label="Dark mode"
            description="Use dark theme for better night-time viewing"
            checked={settings.darkMode}
            onChange={handleSettingChange('darkMode')}
            size="lg"
            color="secondary"
            variant="filled"
          />
          
          <Checkbox
            label="Auto-save documents"
            description="Automatically save changes every 30 seconds"
            checked={settings.autoSave}
            onChange={handleSettingChange('autoSave')}
            size="lg"
            color="success"
            state={settings.autoSave ? 'success' : 'default'}
          />
          
          <Checkbox
            label="Analytics and tracking"
            description="Help improve the application by sharing usage data"
            checked={settings.analytics}
            onChange={handleSettingChange('analytics')}
            size="lg"
            color="info"
            state={settings.analytics ? 'info' : 'default'}
          />
        </div>
        
        <div className="border-t pt-4">
          <button className="w-full bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-800 transition-colors">
            Save Settings
          </button>
        </div>
      </div>
    );
  },
};

// Accessibility Example
export const AccessibilityExample: Story = {
  render: () => (
    <div className="space-y-4">
      <Checkbox
        label="Accessible checkbox"
        description="This checkbox follows ARIA guidelines"
        ariaLabel="Main accessibility checkbox"
      />
      <Checkbox
        label="Required checkbox"
        description="This checkbox is required for form submission"
        required
        errorMessage="This field is required"
      />
      <Checkbox
        label="Checkbox with error"
        errorMessage="Please accept the terms and conditions"
        description="This checkbox shows error state"
      />
      <Checkbox
        label="Disabled checkbox"
        disabled
        description="This checkbox is disabled and not focusable"
      />
    </div>
  ),
};