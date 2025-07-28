import type { Meta, StoryObj } from '@storybook/react';
import { Select, SelectOption } from './Select';
import { User, Globe, Settings, Shield, Heart, Star, Flag, Mail, Phone, MapPin } from 'lucide-react';

const meta = {
  title: 'Components/Select',
  component: Select,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A flexible select component with support for single/multiple selection, search, grouping, and custom styling. Features accessibility support and various interaction states.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'filled', 'outlined', 'underlined', 'ghost'],
      description: 'Select visual variant',
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      description: 'Select size',
    },
    rounded: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg', 'full'],
      description: 'Border radius',
    },
    state: {
      control: 'select',
      options: ['default', 'error', 'warning', 'success', 'info'],
      description: 'Validation state',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
    loading: {
      control: 'boolean',
      description: 'Loading state',
    },
    searchable: {
      control: 'boolean',
      description: 'Enable search functionality',
    },
    clearable: {
      control: 'boolean',
      description: 'Enable clear button',
    },
    multiple: {
      control: 'boolean',
      description: 'Allow multiple selections',
    },
    required: {
      control: 'boolean',
      description: 'Required field indicator',
    },
    label: {
      control: 'text',
      description: 'Select label',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
    description: {
      control: 'text',
      description: 'Help text below select',
    },
    errorMessage: {
      control: 'text',
      description: 'Error message',
    },
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample data
const basicOptions: SelectOption[] = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
  { value: 'option4', label: 'Option 4', disabled: true },
  { value: 'option5', label: 'Option 5' },
];

const countryOptions: SelectOption[] = [
  { value: 'us', label: 'United States', icon: Flag },
  { value: 'uk', label: 'United Kingdom', icon: Flag },
  { value: 'ca', label: 'Canada', icon: Flag },
  { value: 'au', label: 'Australia', icon: Flag },
  { value: 'de', label: 'Germany', icon: Flag },
  { value: 'fr', label: 'France', icon: Flag },
  { value: 'jp', label: 'Japan', icon: Flag },
];

const contactOptions: SelectOption[] = [
  { value: 'email', label: 'Email', description: 'Send notifications via email', icon: Mail },
  { value: 'phone', label: 'Phone', description: 'Receive SMS notifications', icon: Phone },
  { value: 'mail', label: 'Mail', description: 'Physical mail notifications', icon: MapPin },
];

const groupedOptions: SelectOption[] = [
  { value: 'gmail', label: 'Gmail', group: 'Email Providers', icon: Mail },
  { value: 'outlook', label: 'Outlook', group: 'Email Providers', icon: Mail },
  { value: 'yahoo', label: 'Yahoo', group: 'Email Providers', icon: Mail },
  { value: 'facebook', label: 'Facebook', group: 'Social Media', icon: Globe },
  { value: 'twitter', label: 'Twitter', group: 'Social Media', icon: Globe },
  { value: 'instagram', label: 'Instagram', group: 'Social Media', icon: Globe },
  { value: 'github', label: 'GitHub', group: 'Developer Tools', icon: Settings },
  { value: 'gitlab', label: 'GitLab', group: 'Developer Tools', icon: Settings },
  { value: 'bitbucket', label: 'Bitbucket', group: 'Developer Tools', icon: Settings },
];

const priorityOptions: SelectOption[] = [
  { value: 'low', label: 'Low Priority', description: 'Non-urgent items' },
  { value: 'medium', label: 'Medium Priority', description: 'Standard priority items' },
  { value: 'high', label: 'High Priority', description: 'Important items' },
  { value: 'urgent', label: 'Urgent', description: 'Critical items requiring immediate attention' },
];

// Basic Examples
export const Default: Story = {
  args: {
    options: basicOptions,
    placeholder: 'Select an option...',
  },
};

export const WithLabel: Story = {
  args: {
    options: basicOptions,
    label: 'Choose Option',
    placeholder: 'Select an option...',
  },
};

export const WithDescription: Story = {
  args: {
    options: basicOptions,
    label: 'Priority Level',
    description: 'Select the priority level for this task',
    placeholder: 'Select priority...',
  },
};

// Size Variants
export const Sizes: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <Select
        options={basicOptions}
        label="Extra Small"
        size="xs"
        placeholder="xs size"
      />
      <Select
        options={basicOptions}
        label="Small"
        size="sm"
        placeholder="sm size"
      />
      <Select
        options={basicOptions}
        label="Medium"
        size="md"
        placeholder="md size"
      />
      <Select
        options={basicOptions}
        label="Large"
        size="lg"
        placeholder="lg size"
      />
      <Select
        options={basicOptions}
        label="Extra Large"
        size="xl"
        placeholder="xl size"
      />
    </div>
  ),
};

// Visual Variants
export const Variants: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <Select
        options={basicOptions}
        variant="default"
        label="Default"
        placeholder="Default variant"
      />
      <Select
        options={basicOptions}
        variant="filled"
        label="Filled"
        placeholder="Filled variant"
      />
      <Select
        options={basicOptions}
        variant="outlined"
        label="Outlined"
        placeholder="Outlined variant"
      />
      <Select
        options={basicOptions}
        variant="underlined"
        label="Underlined"
        placeholder="Underlined variant"
      />
      <Select
        options={basicOptions}
        variant="ghost"
        label="Ghost"
        placeholder="Ghost variant"
      />
    </div>
  ),
};

// Validation States
export const ValidationStates: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <Select
        options={basicOptions}
        label="Success State"
        state="success"
        placeholder="Valid selection"
        description="Selection is valid"
      />
      <Select
        options={basicOptions}
        label="Warning State"
        state="warning"
        placeholder="Warning selection"
        description="This selection needs attention"
      />
      <Select
        options={basicOptions}
        label="Error State"
        errorMessage="Please select an option"
        placeholder="Invalid selection"
      />
      <Select
        options={basicOptions}
        label="Info State"
        state="info"
        placeholder="Info selection"
        description="Additional information about this field"
      />
    </div>
  ),
};

// With Icons
export const WithIcons: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <Select
        options={countryOptions}
        label="Country"
        placeholder="Select country..."
        searchable
      />
      <Select
        options={contactOptions}
        label="Contact Method"
        placeholder="Choose contact method..."
        description="How would you like to receive notifications?"
      />
    </div>
  ),
};

// Searchable
export const Searchable: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <Select
        options={countryOptions}
        label="Country"
        placeholder="Select country..."
        searchable
        searchPlaceholder="Search countries..."
        description="Start typing to search"
      />
      <Select
        options={groupedOptions}
        label="Service"
        placeholder="Select service..."
        searchable
        searchPlaceholder="Search services..."
        description="Search across all service categories"
      />
    </div>
  ),
};

// Clearable
export const Clearable: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <Select
        options={basicOptions}
        label="Optional Selection"
        placeholder="Select option..."
        clearable
        description="You can clear this selection"
      />
      <Select
        options={priorityOptions}
        label="Priority (Optional)"
        placeholder="Select priority..."
        clearable
        searchable
        description="This field is optional and can be cleared"
      />
    </div>
  ),
};

// Multiple Selection
export const MultipleSelection: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <Select
        options={basicOptions}
        label="Multiple Options"
        placeholder="Select multiple options..."
        multiple
        description="You can select multiple options"
      />
      <Select
        options={groupedOptions}
        label="Services"
        placeholder="Select services..."
        multiple
        maxSelections={3}
        searchable
        clearable
        description="Select up to 3 services"
      />
    </div>
  ),
};

// Grouped Options
export const GroupedOptions: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <Select
        options={groupedOptions}
        label="Account Type"
        placeholder="Select account type..."
        searchable
        description="Choose from available account types"
      />
      <Select
        options={groupedOptions}
        label="Integration Services"
        placeholder="Select services..."
        multiple
        searchable
        clearable
        description="Select the services you want to integrate"
      />
    </div>
  ),
};

// Loading State
export const LoadingState: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <Select
        options={[]}
        label="Loading Options"
        placeholder="Loading..."
        loading
        description="Options are being loaded"
      />
      <Select
        options={basicOptions}
        label="Processing Selection"
        placeholder="Processing..."
        loading
        disabled
        description="Your selection is being processed"
      />
    </div>
  ),
};

// Disabled State
export const DisabledState: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <Select
        options={basicOptions}
        label="Disabled Select"
        placeholder="Cannot select"
        disabled
        description="This select is disabled"
      />
      <Select
        options={basicOptions}
        label="Disabled with Value"
        placeholder="Select option..."
        disabled
        value="option2"
        description="This select is disabled but has a value"
      />
    </div>
  ),
};

// Border Radius Variants
export const BorderRadius: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <Select
        options={basicOptions}
        rounded="none"
        label="No Radius"
        placeholder="No border radius"
      />
      <Select
        options={basicOptions}
        rounded="sm"
        label="Small Radius"
        placeholder="Small border radius"
      />
      <Select
        options={basicOptions}
        rounded="md"
        label="Medium Radius"
        placeholder="Medium border radius"
      />
      <Select
        options={basicOptions}
        rounded="lg"
        label="Large Radius"
        placeholder="Large border radius"
      />
      <Select
        options={basicOptions}
        rounded="full"
        label="Full Radius"
        placeholder="Full border radius"
      />
    </div>
  ),
};

// Form Integration
export const FormIntegration: Story = {
  render: () => (
    <div className="max-w-md mx-auto space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">User Profile</h2>
        <p className="text-gray-600">Update your profile information</p>
      </div>
      
      <Select
        options={countryOptions}
        label="Country"
        name="country"
        placeholder="Select your country..."
        required
        searchable
        description="Your country of residence"
      />
      
      <Select
        options={contactOptions}
        label="Preferred Contact Method"
        name="contact_method"
        placeholder="Choose contact method..."
        required
        description="How would you like to receive notifications?"
      />
      
      <Select
        options={priorityOptions}
        label="Account Type"
        name="account_type"
        placeholder="Select account type..."
        description="Choose your account type"
      />
      
      <Select
        options={groupedOptions}
        label="Connected Services"
        name="connected_services"
        placeholder="Select services..."
        multiple
        searchable
        clearable
        description="Connect your external accounts"
      />
      
      <div className="pt-4">
        <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
          Update Profile
        </button>
      </div>
    </div>
  ),
};

// No Options
export const NoOptions: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <Select
        options={[]}
        label="Empty Select"
        placeholder="No options available"
        noOptionsMessage="No options found"
      />
      <Select
        options={[]}
        label="Searchable Empty"
        placeholder="Search for options..."
        searchable
        noOptionsMessage="No results found"
        description="Try searching for something"
      />
    </div>
  ),
};

// Advanced Usage
export const AdvancedUsage: Story = {
  render: () => (
    <div className="space-y-6 w-80">
      <Select
        options={groupedOptions}
        label="Advanced Multi-Select"
        placeholder="Choose multiple services..."
        multiple
        searchable
        clearable
        maxSelections={5}
        variant="outlined"
        size="lg"
        description="Select up to 5 services with advanced features"
      />
      
      <Select
        options={priorityOptions}
        label="Priority with Success State"
        placeholder="Select priority..."
        state="success"
        clearable
        searchable
        description="Priority level has been validated"
      />
      
      <Select
        options={contactOptions}
        label="Contact Method (Error)"
        placeholder="Select contact method..."
        errorMessage="Please select a valid contact method"
        variant="filled"
        description="This field is required"
      />
    </div>
  ),
};

// Interactive Demo
export const InteractiveDemo: Story = {
  render: () => {
    const [selectedCountry, setSelectedCountry] = React.useState<string | number | (string | number)[] | null>(null);
    const [selectedServices, setSelectedServices] = React.useState<string | number | (string | number)[] | null>([]);
    const [selectedPriority, setSelectedPriority] = React.useState<string | number | (string | number)[] | null>(null);
    
    return (
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold">Interactive Demo</h2>
          <p className="text-gray-600">Try different select interactions</p>
        </div>
        
        <Select
          options={countryOptions}
          label="Country"
          placeholder="Select your country..."
          value={selectedCountry}
          onChange={setSelectedCountry}
          searchable
          clearable
          description="Single selection with search"
        />
        
        <Select
          options={groupedOptions}
          label="Services"
          placeholder="Select services..."
          value={selectedServices}
          onChange={setSelectedServices}
          multiple
          searchable
          clearable
          maxSelections={3}
          description="Multiple selection with groups"
        />
        
        <Select
          options={priorityOptions}
          label="Priority"
          placeholder="Select priority..."
          value={selectedPriority}
          onChange={setSelectedPriority}
          variant="outlined"
          size="lg"
          description="Single selection with descriptions"
        />
        
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Current Values:</h3>
          <div className="space-y-1 text-sm">
            <div>Country: {selectedCountry ? String(selectedCountry) : 'None'}</div>
            <div>Services: {Array.isArray(selectedServices) ? selectedServices.join(', ') : 'None'}</div>
            <div>Priority: {selectedPriority ? String(selectedPriority) : 'None'}</div>
          </div>
        </div>
      </div>
    );
  },
};

// Accessibility Example
export const AccessibilityExample: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <Select
        options={basicOptions}
        label="Accessible Select"
        placeholder="Select an option..."
        required
        description="This select follows ARIA guidelines"
        ariaLabel="Main option selector"
      />
      <Select
        options={basicOptions}
        label="Error Select"
        placeholder="Select an option..."
        errorMessage="Please select a valid option"
        description="This select has an error state"
      />
      <Select
        options={basicOptions}
        label="Disabled Select"
        placeholder="Cannot select"
        disabled
        description="This select is disabled and not focusable"
      />
    </div>
  ),
};