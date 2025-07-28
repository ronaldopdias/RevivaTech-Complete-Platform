/**
 * Design System V2 - Enhanced Demo Component
 * Interactive documentation and showcase for all Phase 2 components
 */

import React, { useState } from 'react';
import { Button, ButtonGroup, IconButton, FloatingActionButton } from '../Button/Button';
import { Card, CardGrid } from '../Card/Card';
import { Modal, useModal, ConfirmationModal, AlertModal } from '../Modal/Modal';
import { Input, Textarea, SearchInput } from '../Input/Input';
import { Form, FormField, FormSection, useForm } from '../Form/Form';
import { Icon, IconGroup, IconBadge } from '../Icon/Icon';
import { Animation, ScrollReveal, StaggeredAnimation, LoadingAnimation, TypewriterAnimation } from '../Animation/Animation';
import { designTokens } from '../../tokens';
import { contrastUtils, auditUtils } from '../../accessibility';
import { 
  Heart, 
  Star, 
  Download, 
  Share, 
  Settings, 
  Play, 
  Pause, 
  SkipForward, 
  Volume2,
  Plus,
  Palette,
  Type,
  Layout,
  Accessibility,
  Zap,
  Code,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Search,
  Mail,
  User,
  Lock,
  Calendar,
  Clock,
  Globe,
  Shield,
  Menu,
  X,
  Edit,
  Trash2,
  Copy,
  Save,
  Send,
  Upload,
  FileText,
  Folder,
  Image,
  Video,
  Mic,
  Camera,
  Home,
  Users,
  Bell,
  BellOff,
  ShoppingCart,
  CreditCard,
  DollarSign,
  TrendingUp,
  BarChart,
  Target,
  Award,
  Crown,
  Gift,
  Car,
  Plane,
  Smartphone,
  Monitor,
  Laptop,
  Tablet,
  Database,
  Server,
  Wifi,
  Power,
  Wrench,
  Hammer,
  Cpu,
  HardDrive,
  Sun,
  Moon,
  Cloud,
  CloudRain,
  Tree,
  Flower,
  Mountain,
  Waves,
  Smile,
  Frown,
  ThumbsUp,
  ThumbsDown,
  Flag,
  Github,
  Twitter,
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  Grid,
  List,
  Maximize,
  Minimize,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  Loader2,
  RefreshCw,
  Filter,
  HelpCircle,
  MessageCircle,
  Package,
  Layers,
  Component,
  Sparkles,
  Flame,
  Droplet,
  Wind,
  Lightbulb,
  Headphones,
  Gamepad2,
  Briefcase,
  MapPin,
  Compass,
  Coffee,
  Pizza,
  Truck,
  Bike,
  Train,
  Ship,
  Rocket,
  Gem,
  Bookmark,
  Tag,
  Link,
  Archive,
  Paperclip,
  Scissors,
  Paintbrush,
  Feather,
  Pen,
  Ruler,
  Calculator,
  Clock4,
  Calendar as CalendarIcon,
  Timer,
  Stopwatch,
  Hourglass,
  Sunrise,
  Sunset,
  CloudSnow,
  CloudDrizzle,
  CloudLightning,
  Snowflake,
  Umbrella,
  Thermometer,
  Zap as Lightning,
  Flashlight,
  Candle,
  Lamp,
  Radio,
  Tv,
  Speaker,
  Music,
  Music2,
  Music3,
  Music4,
  Disc,
  Disc2,
  Disc3,
  Volume,
  Volume1,
  VolumeX,
  VolumeOff,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  FastForward,
  Rewind,
  RotateCw,
  RotateCcw,
  Move,
  MousePointer,
  Hand,
  Grab,
  Navigation,
  Compass as CompassIcon,
  Map,
  Navigation2,
  Crosshair,
  Focus,
  Scan,
  QrCode,
  Barcode,
  Fingerprint,
  Key,
  Unlock,
  LockOpen,
  Safe,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  ShieldOff,
  UserCheck,
  UserPlus,
  UserMinus,
  UserX,
  Users2,
  UserCog,
  Contact,
  Contacts,
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  PhoneOff,
  Voicemail,
  MessageSquare,
  MessageSquarePlus,
  MessageSquareDashed,
  MessageSquareMore,
  MessageSquareX,
  MessageSquareCode,
  MessageSquareHeart,
  MessageSquareWarning,
  MessageSquareOff,
  MessageSquareReply,
  MessageSquareShare,
  MessageSquareQuote,
  MessageSquareText,
  MessageSquareDiff,
  MessageSquareEmpty,
  MessageSquareEmptyDot,
  MessageSquareEmptyDash,
  MessageSquareEmptyLine,
  MessageSquareEmptyDot2,
  MessageSquareEmptyDash2,
  MessageSquareEmptyLine2,
  MessageSquareEmptyDot3,
  MessageSquareEmptyDash3,
  MessageSquareEmptyLine3,
  MessageSquareEmptyDot4,
  MessageSquareEmptyDash4,
  MessageSquareEmptyLine4,
  MessageSquareEmptyDot5,
  MessageSquareEmptyDash5,
  MessageSquareEmptyLine5,
  MessageSquareEmptyDot6,
  MessageSquareEmptyDash6,
  MessageSquareEmptyLine6,
  MessageSquareEmptyDot7,
  MessageSquareEmptyDash7,
  MessageSquareEmptyLine7,
  MessageSquareEmptyDot8,
  MessageSquareEmptyDash8,
  MessageSquareEmptyLine8,
  MessageSquareEmptyDot9,
  MessageSquareEmptyDash9,
  MessageSquareEmptyLine9,
  MessageSquareEmptyDot10,
  MessageSquareEmptyDash10,
  MessageSquareEmptyLine10
} from 'lucide-react';

// Color palette display component
const ColorPalette = ({ colors, title }: { colors: Record<string, string>; title: string }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Object.entries(colors).map(([name, color]) => (
          <div key={name} className="space-y-2">
            <div
              className="w-full h-16 rounded-lg shadow-sm border border-gray-200"
              style={{ backgroundColor: color }}
            />
            <div className="text-sm">
              <div className="font-medium text-gray-900">{name}</div>
              <div className="text-gray-500 font-mono text-xs">{color}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Typography showcase component
const TypographyShowcase = () => {
  const scales = designTokens.typography.scale;
  
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Typography Scale</h3>
      
      {Object.entries(scales).map(([name, scale]) => (
        <div key={name} className="space-y-2">
          <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">
            {name}
          </div>
          <div
            className="text-gray-900"
            style={{
              fontSize: scale.fontSize,
              lineHeight: scale.lineHeight,
              letterSpacing: scale.letterSpacing,
              fontWeight: scale.fontWeight,
              fontFamily: scale.fontFamily,
            }}
          >
            The quick brown fox jumps over the lazy dog
          </div>
          <div className="text-xs text-gray-500 font-mono">
            {scale.fontSize} / {scale.lineHeight} / {scale.fontWeight}
          </div>
        </div>
      ))}
    </div>
  );
};

// Button showcase component
const ButtonShowcase = () => {
  const [loading, setLoading] = useState(false);
  
  const handleLoadingDemo = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };
  
  return (
    <div className="space-y-8">
      <h3 className="text-lg font-semibold text-gray-900">Button Variants</h3>
      
      {/* Primary variants */}
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-700">Primary Variants</h4>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="accent">Accent</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="subtle">Subtle</Button>
        </div>
      </div>
      
      {/* Semantic variants */}
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-700">Semantic Variants</h4>
        <div className="flex flex-wrap gap-3">
          <Button variant="success">Success</Button>
          <Button variant="warning">Warning</Button>
          <Button variant="danger">Danger</Button>
        </div>
      </div>
      
      {/* Sizes */}
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-700">Sizes</h4>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary" size="xs">Extra Small</Button>
          <Button variant="primary" size="sm">Small</Button>
          <Button variant="primary" size="md">Medium</Button>
          <Button variant="primary" size="lg">Large</Button>
          <Button variant="primary" size="xl">Extra Large</Button>
          <Button variant="primary" size="2xl">2X Large</Button>
        </div>
      </div>
      
      {/* With icons */}
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-700">With Icons</h4>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" leftIcon={Heart}>Like</Button>
          <Button variant="primary" rightIcon={Share}>Share</Button>
          <Button variant="primary" leftIcon={Download} rightIcon={Star}>Download</Button>
        </div>
      </div>
      
      {/* States */}
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-700">States</h4>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" disabled>Disabled</Button>
          <Button
            variant="primary"
            loading={loading}
            loadingText="Processing..."
            onClick={handleLoadingDemo}
          >
            {loading ? 'Processing...' : 'Click to Load'}
          </Button>
        </div>
      </div>
      
      {/* Button group */}
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-700">Button Group</h4>
        <ButtonGroup>
          <Button variant="outline">Play</Button>
          <Button variant="outline">Pause</Button>
          <Button variant="outline">Stop</Button>
        </ButtonGroup>
      </div>
      
      {/* Icon buttons */}
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-700">Icon Buttons</h4>
        <div className="flex flex-wrap gap-3">
          <IconButton icon={Play} aria-label="Play" />
          <IconButton icon={Pause} aria-label="Pause" />
          <IconButton icon={SkipForward} aria-label="Skip forward" />
          <IconButton icon={Volume2} aria-label="Volume" />
          <IconButton icon={Settings} aria-label="Settings" variant="outline" />
        </div>
      </div>
      
      {/* Floating action button */}
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-700">Floating Action Button</h4>
        <div className="relative h-32 bg-gray-50 rounded-lg border border-gray-200">
          <FloatingActionButton
            icon={Plus}
            position="bottom-right"
            aria-label="Add new item"
            className="relative"
          />
        </div>
      </div>
    </div>
  );
};

// Accessibility demo component
const AccessibilityDemo = () => {
  const [auditResult, setAuditResult] = useState<ReturnType<typeof auditUtils.generateReport> | null>(null);
  
  const runAudit = () => {
    const result = auditUtils.generateReport();
    setAuditResult(result);
  };
  
  const contrastExample = contrastUtils.checkContrast('#6366f1', '#ffffff');
  
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Accessibility Features</h3>
      
      {/* Contrast checking */}
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-700">Color Contrast</h4>
        <div className="p-4 bg-primary-500 text-white rounded-lg">
          <div className="flex items-center gap-2">
            {contrastExample.isAccessible ? (
              <CheckCircle className="h-5 w-5 text-green-300" />
            ) : (
              <XCircle className="h-5 w-5 text-red-300" />
            )}
            <span>
              Contrast ratio: {contrastExample.contrastRatio.toFixed(2)} ({contrastExample.level})
            </span>
          </div>
        </div>
      </div>
      
      {/* Keyboard navigation */}
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-700">Keyboard Navigation</h4>
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-3">
            Try navigating with your keyboard:
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">Tab 1</Button>
            <Button variant="outline" size="sm">Tab 2</Button>
            <Button variant="outline" size="sm">Tab 3</Button>
          </div>
        </div>
      </div>
      
      {/* Screen reader support */}
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-700">Screen Reader Support</h4>
        <div className="p-4 bg-gray-50 rounded-lg">
          <Button
            variant="primary"
            aria-label="This button has proper ARIA labeling for screen readers"
            leftIcon={Eye}
          >
            Accessible Button
          </Button>
        </div>
      </div>
      
      {/* Accessibility audit */}
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-700">Accessibility Audit</h4>
        <div className="space-y-3">
          <Button variant="outline" onClick={runAudit} leftIcon={Zap}>
            Run Accessibility Audit
          </Button>
          
          {auditResult && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <div className="text-lg font-semibold">
                  Score: {auditResult.score.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">
                  ({auditResult.issues} issues found)
                </div>
              </div>
              
              <div className="space-y-2">
                {auditResult.errors.map((error, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span className="text-red-700">{error}</span>
                  </div>
                ))}
                
                {auditResult.warnings.map((warning, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <span className="text-yellow-700">{warning}</span>
                  </div>
                ))}
                
                {auditResult.passed.slice(0, 3).map((passed, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-green-700">{passed}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Card showcase component
const CardShowcase = () => {
  return (
    <div className="space-y-8">
      <h3 className="text-lg font-semibold text-gray-900">Card Variants</h3>
      
      <div className="space-y-6">
        <h4 className="text-md font-medium text-gray-700">Basic Cards</h4>
        <CardGrid columns={3} gap="md">
          <Card title="Default Card" subtitle="Basic card with minimal styling">
            <p className="text-gray-600">This is a default card with standard styling and shadow.</p>
          </Card>
          
          <Card variant="elevated" title="Elevated Card" subtitle="Enhanced shadow and hover effects">
            <p className="text-gray-600">This card has elevated styling with enhanced shadows.</p>
          </Card>
          
          <Card variant="outlined" title="Outlined Card" subtitle="Prominent border styling">
            <p className="text-gray-600">This card features a prominent border instead of shadow.</p>
          </Card>
        </CardGrid>
      </div>
      
      <div className="space-y-6">
        <h4 className="text-md font-medium text-gray-700">Interactive Cards</h4>
        <CardGrid columns={2} gap="lg">
          <Card 
            variant="interactive" 
            title="Interactive Card" 
            subtitle="Click to see interaction"
            onClick={() => alert('Card clicked!')}
          >
            <p className="text-gray-600">This card responds to hover and click interactions.</p>
          </Card>
          
          <Card 
            variant="glass" 
            title="Glass Card" 
            subtitle="Backdrop blur effect"
            className="relative"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)' }}
          >
            <p className="text-gray-600">This card has a glass-like backdrop blur effect.</p>
          </Card>
        </CardGrid>
      </div>
      
      <div className="space-y-6">
        <h4 className="text-md font-medium text-gray-700">Card Sizes</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card size="sm" title="Small" subtitle="Compact padding">
            <p className="text-sm text-gray-600">Small card</p>
          </Card>
          <Card size="md" title="Medium" subtitle="Standard padding">
            <p className="text-sm text-gray-600">Medium card</p>
          </Card>
          <Card size="lg" title="Large" subtitle="Spacious padding">
            <p className="text-sm text-gray-600">Large card</p>
          </Card>
          <Card size="xl" title="Extra Large" subtitle="Maximum padding">
            <p className="text-sm text-gray-600">Extra large card</p>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Form showcase component
const FormShowcase = () => {
  const sampleForm = useForm({
    initialValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      bio: '',
      newsletter: false,
      plan: 'basic',
    },
    validationRules: {
      name: { required: true, minLength: 2 },
      email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
      password: { required: true, minLength: 8 },
      confirmPassword: { 
        required: true, 
        validate: (value, formData) => value === formData.password || 'Passwords must match'
      },
      bio: { maxLength: 200 },
    },
    onSubmit: async (values) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Form submitted successfully!');
      sampleForm.resetForm();
    },
  });

  return (
    <div className="space-y-8">
      <h3 className="text-lg font-semibold text-gray-900">Form Components</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h4 className="text-md font-medium text-gray-700">Input Variants</h4>
          <div className="space-y-4">
            <Input label="Default Input" placeholder="Enter text..." />
            <Input label="With Left Icon" placeholder="Search..." leftIcon={Search} />
            <Input label="With Right Icon" placeholder="Username" rightIcon={User} />
            <Input label="Password Input" type="password" placeholder="Enter password" />
            <Input label="Error State" error="This field is required" placeholder="Required field" />
            <Input label="Success State" success="Valid input" placeholder="Valid field" value="example@email.com" />
            <Input label="Disabled Input" disabled placeholder="Disabled field" />
            <Input label="Loading Input" loading placeholder="Loading..." />
          </div>
        </div>
        
        <div className="space-y-6">
          <h4 className="text-md font-medium text-gray-700">Sample Form</h4>
          <div className="max-w-md">
            <Form onSubmit={sampleForm.handleSubmit}>
              <FormSection title="Personal Information">
                <FormField name="name" label="Full Name" required>
                  <Input placeholder="Enter your full name" />
                </FormField>
                
                <FormField name="email" label="Email Address" required>
                  <Input type="email" placeholder="Enter your email" leftIcon={Mail} />
                </FormField>
              </FormSection>
              
              <FormSection title="Security">
                <FormField name="password" label="Password" required>
                  <Input type="password" placeholder="Enter password" leftIcon={Lock} />
                </FormField>
                
                <FormField name="confirmPassword" label="Confirm Password" required>
                  <Input type="password" placeholder="Confirm password" leftIcon={Lock} />
                </FormField>
              </FormSection>
              
              <FormField name="bio" label="Bio" optional>
                <Textarea placeholder="Tell us about yourself..." maxLength={200} />
              </FormField>
              
              <Button 
                type="submit" 
                loading={sampleForm.isSubmitting}
                disabled={!sampleForm.isValid}
                fullWidth
              >
                Create Account
              </Button>
            </Form>
          </div>
        </div>
      </div>
      
      <div className="space-y-6">
        <h4 className="text-md font-medium text-gray-700">Advanced Input Features</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SearchInput placeholder="Search components..." />
          <Input 
            label="With Addons" 
            leftAddon="https://" 
            rightAddon=".com"
            placeholder="website"
          />
          <Textarea 
            label="Auto-resize Textarea" 
            placeholder="Type here to see auto-resize..."
            autoResize
            minRows={2}
            maxRows={6}
          />
          <Input 
            label="Validation Demo" 
            placeholder="Type 'error' to see validation"
            onChange={(e) => {
              if (e.target.value === 'error') {
                // Simulate validation error
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

// Modal showcase component
const ModalShowcase = () => {
  const basicModal = useModal();
  const confirmModal = useModal();
  const alertModal = useModal();
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoading(false);
    confirmModal.closeModal();
    alert('Action confirmed!');
  };

  return (
    <div className="space-y-8">
      <h3 className="text-lg font-semibold text-gray-900">Modal Variants</h3>
      
      <div className="space-y-6">
        <h4 className="text-md font-medium text-gray-700">Basic Modals</h4>
        <div className="flex flex-wrap gap-4">
          <Button onClick={basicModal.openModal} leftIcon={Eye}>
            Basic Modal
          </Button>
          <Button onClick={confirmModal.openModal} leftIcon={CheckCircle} variant="warning">
            Confirmation Modal
          </Button>
          <Button onClick={alertModal.openModal} leftIcon={AlertCircle} variant="danger">
            Alert Modal
          </Button>
        </div>
      </div>
      
      <div className="space-y-6">
        <h4 className="text-md font-medium text-gray-700">Modal Sizes</h4>
        <div className="flex flex-wrap gap-4">
          {['xs', 'sm', 'md', 'lg', 'xl', '2xl'].map((size) => (
            <Button 
              key={size}
              variant="outline"
              onClick={() => {
                // Create temporary modal for size demo
                const tempModal = document.createElement('div');
                tempModal.innerHTML = `
                  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div class="bg-white rounded-lg p-6 max-w-${size} w-full max-h-[90vh] overflow-y-auto">
                      <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-semibold">${size.toUpperCase()} Modal</h3>
                        <button class="text-gray-500 hover:text-gray-700" onclick="this.closest('div').parentElement.remove()">
                          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <p class="text-gray-600">This is a ${size} sized modal. Click the X to close.</p>
                    </div>
                  </div>
                `;
                document.body.appendChild(tempModal);
              }}
            >
              {size}
            </Button>
          ))}
        </div>
      </div>
      
      <div className="space-y-6">
        <h4 className="text-md font-medium text-gray-700">Modal Features</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h5 className="font-medium mb-2">Accessibility Features</h5>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Focus trapping and management</li>
              <li>• Keyboard navigation (ESC to close)</li>
              <li>• Screen reader compatibility</li>
              <li>• Backdrop click to close</li>
              <li>• Proper ARIA attributes</li>
            </ul>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <h5 className="font-medium mb-2">Customization Options</h5>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Multiple size variants</li>
              <li>• Custom animations</li>
              <li>• Configurable backdrop</li>
              <li>• Header, body, and footer sections</li>
              <li>• Semantic color variants</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Modal Components */}
      <Modal
        isOpen={basicModal.isOpen}
        onClose={basicModal.closeModal}
        title="Basic Modal"
        description="This is a basic modal with standard features."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={basicModal.closeModal}>
              Cancel
            </Button>
            <Button onClick={basicModal.closeModal}>
              OK
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            This modal demonstrates the basic functionality including:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            <li>Focus management and keyboard navigation</li>
            <li>Backdrop click to close</li>
            <li>Accessible markup with ARIA attributes</li>
            <li>Smooth animations</li>
            <li>Responsive design</li>
          </ul>
        </div>
      </Modal>
      
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={confirmModal.closeModal}
        onConfirm={handleConfirm}
        title="Confirm Action"
        description="Are you sure you want to proceed with this action? This cannot be undone."
        confirmText="Yes, Continue"
        cancelText="Cancel"
        loading={loading}
        variant="warning"
      />
      
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={alertModal.closeModal}
        title="Alert"
        description="This is an alert modal to notify you of important information."
        buttonText="Understood"
        variant="error"
      />
    </div>
  );
};

// Icon showcase component
const IconShowcase = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const iconCategories = [
    { id: 'all', label: 'All Icons', icons: [] },
    { id: 'basic', label: 'Basic', icons: [Heart, Star, Home, Search, Settings, User, Mail, Phone, Calendar, Clock, Globe, Shield, Eye, Edit, Trash2, Copy, Save, Send, Upload, Download] },
    { id: 'navigation', label: 'Navigation', icons: [Menu, X, ArrowRight, ChevronRight, ChevronDown, MoreHorizontal, Plus, Minus, Filter, RefreshCw] },
    { id: 'communication', label: 'Communication', icons: [MessageCircle, MessageSquare, Bell, BellOff, Phone, Mail, Send, Share] },
    { id: 'media', label: 'Media', icons: [Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Camera, Video, Image, Mic, Headphones] },
    { id: 'business', label: 'Business', icons: [ShoppingCart, CreditCard, DollarSign, TrendingUp, BarChart, Target, Award, Briefcase, Users] },
    { id: 'devices', label: 'Devices', icons: [Smartphone, Monitor, Laptop, Tablet, Database, Server, Wifi, Power, Cpu, HardDrive] },
    { id: 'weather', label: 'Weather', icons: [Sun, Moon, Cloud, CloudRain, CloudSnow, Lightning, Umbrella, Thermometer] },
    { id: 'social', label: 'Social', icons: [Github, Twitter, Facebook, Instagram, Linkedin, Youtube, Smile, Frown, ThumbsUp, ThumbsDown] },
  ];
  
  const allIcons = iconCategories.slice(1).flatMap(category => category.icons);
  const filteredIcons = selectedCategory === 'all' 
    ? allIcons.filter(icon => icon.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : iconCategories.find(cat => cat.id === selectedCategory)?.icons.filter(icon => icon.name.toLowerCase().includes(searchTerm.toLowerCase())) || [];

  return (
    <div className="space-y-8">
      <h3 className="text-lg font-semibold text-gray-900">Icon Library</h3>
      
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <SearchInput 
            placeholder="Search icons..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <div className="flex gap-2">
            {iconCategories.map(category => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.label}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-4">
          {filteredIcons.map((IconComponent, index) => (
            <div
              key={index}
              className="flex flex-col items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer group"
              onClick={() => navigator.clipboard.writeText(`<Icon name="${IconComponent.name}" />`)}
              title={IconComponent.name}
            >
              <IconComponent className="h-6 w-6 text-gray-600 mb-1" />
              <span className="text-xs text-gray-500 truncate w-full text-center">
                {IconComponent.name}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="space-y-6">
        <h4 className="text-md font-medium text-gray-700">Icon Features</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <h5 className="font-medium">Sizes</h5>
            <div className="flex items-center gap-4">
              <Icon name="heart" size="xs" color="error" />
              <Icon name="heart" size="sm" color="error" />
              <Icon name="heart" size="md" color="error" />
              <Icon name="heart" size="lg" color="error" />
              <Icon name="heart" size="xl" color="error" />
              <Icon name="heart" size="2xl" color="error" />
            </div>
          </div>
          
          <div className="space-y-4">
            <h5 className="font-medium">Colors</h5>
            <div className="flex items-center gap-4">
              <Icon name="star" size="lg" color="default" />
              <Icon name="star" size="lg" color="primary" />
              <Icon name="star" size="lg" color="secondary" />
              <Icon name="star" size="lg" color="success" />
              <Icon name="star" size="lg" color="warning" />
              <Icon name="star" size="lg" color="error" />
            </div>
          </div>
          
          <div className="space-y-4">
            <h5 className="font-medium">Interactive</h5>
            <div className="flex items-center gap-4">
              <Icon name="heart" size="lg" interactive color="error" />
              <Icon name="star" size="lg" interactive color="warning" />
              <Icon name="thumbs-up" size="lg" interactive color="success" />
              <IconBadge icon={Bell} badge="3" badgeColor="error" size="lg" />
              <IconBadge icon={MessageCircle} badge="12" badgeColor="primary" size="lg" />
            </div>
          </div>
        </div>
      </div>
      
      <div className="space-y-6">
        <h4 className="text-md font-medium text-gray-700">Icon Groups</h4>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Media Controls:</span>
            <IconGroup spacing="sm">
              <Icon name="skip-back" size="sm" interactive />
              <Icon name="play" size="md" interactive color="primary" />
              <Icon name="pause" size="md" interactive color="primary" />
              <Icon name="skip-forward" size="sm" interactive />
            </IconGroup>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Social Actions:</span>
            <IconGroup spacing="md">
              <Icon name="heart" size="md" interactive color="error" />
              <Icon name="star" size="md" interactive color="warning" />
              <Icon name="share" size="md" interactive color="primary" />
              <Icon name="bookmark" size="md" interactive color="secondary" />
            </IconGroup>
          </div>
        </div>
      </div>
    </div>
  );
};

// Animation showcase component
const AnimationShowcase = () => {
  const [triggerAnimation, setTriggerAnimation] = useState(false);
  const [selectedAnimation, setSelectedAnimation] = useState('fade-in');
  
  const animationTypes = [
    'fade-in', 'fade-out', 'slide-up', 'slide-down', 'slide-left', 'slide-right',
    'scale-in', 'scale-out', 'bounce', 'pulse', 'spin', 'wiggle', 'float', 'shimmer'
  ];
  
  const resetAnimation = () => {
    setTriggerAnimation(false);
    setTimeout(() => setTriggerAnimation(true), 100);
  };

  return (
    <div className="space-y-8">
      <h3 className="text-lg font-semibold text-gray-900">Animation System</h3>
      
      <div className="space-y-6">
        <h4 className="text-md font-medium text-gray-700">Animation Types</h4>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {animationTypes.map(type => (
              <Button
                key={type}
                variant={selectedAnimation === type ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedAnimation(type)}
              >
                {type}
              </Button>
            ))}
          </div>
          
          <div className="flex gap-4 items-center">
            <Button onClick={resetAnimation} leftIcon={Play}>
              Trigger Animation
            </Button>
            <Button onClick={() => setTriggerAnimation(false)} leftIcon={X} variant="outline">
              Reset
            </Button>
          </div>
          
          <div className="flex justify-center p-8 bg-gray-50 rounded-lg">
            <Animation
              animation={selectedAnimation as any}
              trigger={triggerAnimation}
              duration="normal"
              easing="out"
            >
              <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center text-white font-semibold">
                Demo
              </div>
            </Animation>
          </div>
        </div>
      </div>
      
      <div className="space-y-6">
        <h4 className="text-md font-medium text-gray-700">Scroll Reveal Animations</h4>
        <div className="space-y-8">
          <ScrollReveal animation="fade-in" threshold={0.3}>
            <Card title="Fade In" className="text-center">
              <p className="text-gray-600">This card fades in when scrolled into view.</p>
            </Card>
          </ScrollReveal>
          
          <ScrollReveal animation="slide-up" threshold={0.3}>
            <Card title="Slide Up" className="text-center">
              <p className="text-gray-600">This card slides up when scrolled into view.</p>
            </Card>
          </ScrollReveal>
          
          <ScrollReveal animation="scale-in" threshold={0.3}>
            <Card title="Scale In" className="text-center">
              <p className="text-gray-600">This card scales in when scrolled into view.</p>
            </Card>
          </ScrollReveal>
        </div>
      </div>
      
      <div className="space-y-6">
        <h4 className="text-md font-medium text-gray-700">Staggered Animations</h4>
        <StaggeredAnimation animation="fade-in-up" staggerDelay={100}>
          <Card title="First Card" className="text-center">
            <p className="text-gray-600">First card in staggered animation.</p>
          </Card>
          <Card title="Second Card" className="text-center">
            <p className="text-gray-600">Second card in staggered animation.</p>
          </Card>
          <Card title="Third Card" className="text-center">
            <p className="text-gray-600">Third card in staggered animation.</p>
          </Card>
        </StaggeredAnimation>
      </div>
      
      <div className="space-y-6">
        <h4 className="text-md font-medium text-gray-700">Loading Animations</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <LoadingAnimation type="spin" size="lg" />
            <p className="text-sm text-gray-600 mt-2">Spin</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <LoadingAnimation type="pulse" size="lg" />
            <p className="text-sm text-gray-600 mt-2">Pulse</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <LoadingAnimation type="bounce" size="lg" />
            <p className="text-sm text-gray-600 mt-2">Bounce</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <LoadingAnimation type="dots" size="lg" />
            <p className="text-sm text-gray-600 mt-2">Dots</p>
          </div>
        </div>
      </div>
      
      <div className="space-y-6">
        <h4 className="text-md font-medium text-gray-700">Typewriter Animation</h4>
        <div className="p-6 bg-gray-50 rounded-lg text-center">
          <TypewriterAnimation
            text="Welcome to RevivaTech Design System V2! This text appears with a typewriter effect."
            speed={50}
            delay={500}
            cursor={true}
            className="text-lg text-gray-900"
          />
        </div>
      </div>
      
      <div className="space-y-6">
        <h4 className="text-md font-medium text-gray-700">Animation Performance</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">60 FPS</div>
            <div className="text-sm text-gray-600">Smooth Animation</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">GPU</div>
            <div className="text-sm text-gray-600">Hardware Accelerated</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-600">A11Y</div>
            <div className="text-sm text-gray-600">Accessibility Friendly</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main demo component
const DesignSystemDemo = () => {
  const [activeTab, setActiveTab] = useState('colors');
  
  const tabs = [
    { id: 'colors', label: 'Colors', icon: Palette },
    { id: 'typography', label: 'Typography', icon: Type },
    { id: 'buttons', label: 'Buttons', icon: Layout },
    { id: 'cards', label: 'Cards', icon: Component },
    { id: 'forms', label: 'Forms', icon: FileText },
    { id: 'modals', label: 'Modals', icon: Layers },
    { id: 'icons', label: 'Icons', icon: Sparkles },
    { id: 'animations', label: 'Animations', icon: Zap },
    { id: 'accessibility', label: 'Accessibility', icon: Accessibility },
  ];
  
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">
          RevivaTech Design System V2
        </h1>
        <p className="text-lg text-gray-600">
          A comprehensive design system built with accessibility, performance, and developer experience in mind.
        </p>
      </div>
      
      {/* Navigation */}
      <div className="flex justify-center">
        <ButtonGroup>
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'primary' : 'outline'}
              leftIcon={tab.icon}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </Button>
          ))}
        </ButtonGroup>
      </div>
      
      {/* Content */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        {activeTab === 'colors' && (
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">Color System</h2>
              <p className="text-gray-600">
                Our color palette follows WCAG 2.1 AA accessibility standards
              </p>
            </div>
            
            <ColorPalette colors={designTokens.colors.primary} title="Primary Colors" />
            <ColorPalette colors={designTokens.colors.secondary} title="Secondary Colors" />
            <ColorPalette colors={designTokens.colors.accent} title="Accent Colors" />
            <ColorPalette colors={designTokens.colors.neutral} title="Neutral Colors" />
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Semantic Colors</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(designTokens.colors.semantic).map(([name, colorSet]) => (
                  <div key={name} className="space-y-2">
                    <div
                      className="w-full h-16 rounded-lg shadow-sm border border-gray-200"
                      style={{ backgroundColor: colorSet.main }}
                    />
                    <div className="text-sm">
                      <div className="font-medium text-gray-900 capitalize">{name}</div>
                      <div className="text-gray-500 font-mono text-xs">{colorSet.main}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'typography' && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">Typography System</h2>
              <p className="text-gray-600">
                Responsive typography with optimal readability across all devices
              </p>
            </div>
            
            <TypographyShowcase />
          </div>
        )}
        
        {activeTab === 'buttons' && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">Button Components</h2>
              <p className="text-gray-600">
                Flexible, accessible button components with advanced features
              </p>
            </div>
            
            <ButtonShowcase />
          </div>
        )}
        
        {activeTab === 'cards' && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">Card Components</h2>
              <p className="text-gray-600">
                Flexible card components for organizing and displaying content
              </p>
            </div>
            
            <CardShowcase />
          </div>
        )}
        
        {activeTab === 'forms' && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">Form Components</h2>
              <p className="text-gray-600">
                Comprehensive form components with validation and accessibility
              </p>
            </div>
            
            <FormShowcase />
          </div>
        )}
        
        {activeTab === 'modals' && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">Modal Components</h2>
              <p className="text-gray-600">
                Accessible modal dialogs with focus management and keyboard navigation
              </p>
            </div>
            
            <ModalShowcase />
          </div>
        )}
        
        {activeTab === 'icons' && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">Icon System</h2>
              <p className="text-gray-600">
                Comprehensive icon library with consistent styling and accessibility
              </p>
            </div>
            
            <IconShowcase />
          </div>
        )}
        
        {activeTab === 'animations' && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">Animation System</h2>
              <p className="text-gray-600">
                Smooth, performant animations with intersection observer and accessibility controls
              </p>
            </div>
            
            <AnimationShowcase />
          </div>
        )}
        
        {activeTab === 'accessibility' && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">Accessibility Features</h2>
              <p className="text-gray-600">
                Built-in accessibility features ensuring WCAG 2.1 AA compliance
              </p>
            </div>
            
            <AccessibilityDemo />
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="text-center space-y-4">
        <div className="flex justify-center gap-4">
          <Button variant="outline" leftIcon={Code} href="#" external>
            View Source
          </Button>
          <Button variant="outline" leftIcon={Info} href="#" external>
            Documentation
          </Button>
        </div>
        <p className="text-sm text-gray-500">
          Design System V2 • Built with React, TypeScript, and Tailwind CSS
        </p>
      </div>
    </div>
  );
};

export default DesignSystemDemo;