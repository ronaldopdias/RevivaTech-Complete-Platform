/**
 * Design System V2 - Documentation Component
 * Interactive documentation system for design system components
 */

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '../Button/Button';
import { Card } from '../Card/Card';
import { Input } from '../Input/Input';
import { Modal, useModal } from '../Modal/Modal';
import { Icon } from '../Icon/Icon';
import { 
  Copy, 
  ExternalLink, 
  Search, 
  Eye, 
  Code, 
  Palette, 
  Settings,
  Book,
  Play,
  Download,
  Share,
  Star,
  Heart,
  Zap,
  Shield,
  CheckCircle,
  Info,
  Home,
  User,
  Mail,
  Calendar,
  Clock,
  Globe,
  Edit,
  Trash2,
  RefreshCw,
  Filter,
  MoreHorizontal,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  Plus,
  Minus,
  X,
  Check,
  AlertCircle,
  AlertTriangle,
  HelpCircle,
  Menu,
  Grid,
  List,
  Layout,
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  Bell,
  BellOff,
  Lock,
  Unlock,
  Smartphone,
  Monitor,
  Laptop,
  Tablet,
  Camera,
  Video,
  Image,
  File,
  Folder,
  Archive,
  Link,
  Paperclip,
  Upload,
  Download as DownloadIcon,
  Save,
  Print,
  Send,
  MessageCircle,
  MessageSquare,
  Users,
  Crown,
  Award,
  Target,
  TrendingUp,
  BarChart,
  PieChart,
  DollarSign,
  CreditCard,
  ShoppingCart,
  Gift,
  Car,
  Plane,
  Bike,
  Truck,
  Train,
  Ship,
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
  Database,
  Server,
  Cpu,
  HardDrive,
  Wifi,
  Power,
  Wrench,
  Hammer,
  Scissors,
  Paintbrush,
  Headphones,
  Mic,
  MicOff,
  Play as PlayIcon,
  Pause,
  Stop,
  SkipBack,
  SkipForward,
  Github,
  Twitter,
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  Loader2,
} from 'lucide-react';

// Documentation section props
export interface DocSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  id?: string;
}

// Code block props
export interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
  showLineNumbers?: boolean;
  allowCopy?: boolean;
  className?: string;
}

// Component showcase props
export interface ComponentShowcaseProps {
  title: string;
  description?: string;
  component: React.ComponentType<any>;
  props: any[];
  examples: { title: string; props: any; code: string }[];
  className?: string;
}

// Token display props
export interface TokenDisplayProps {
  tokens: { [key: string]: any };
  category: string;
  className?: string;
}

// Icon showcase props
export interface IconShowcaseProps {
  icons: Array<{ name: string; icon: React.ComponentType<any> }>;
  searchable?: boolean;
  className?: string;
}

// Documentation navigation props
export interface DocNavProps {
  sections: Array<{ id: string; title: string; subsections?: Array<{ id: string; title: string }> }>;
  currentSection: string;
  onSectionChange: (sectionId: string) => void;
  className?: string;
}

// Documentation section component
export const DocSection: React.FC<DocSectionProps> = ({ 
  title, 
  description, 
  children, 
  className, 
  id 
}) => {
  return (
    <section id={id} className={cn('space-y-6', className)}>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        {description && (
          <p className="text-gray-600 text-lg">{description}</p>
        )}
      </div>
      <div className="space-y-8">
        {children}
      </div>
    </section>
  );
};

// Code block component
export const CodeBlock: React.FC<CodeBlockProps> = ({ 
  code, 
  language = 'typescript', 
  title, 
  showLineNumbers = true, 
  allowCopy = true,
  className 
}) => {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLPreElement>(null);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      {title && (
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b">
          <h4 className="font-medium text-gray-900">{title}</h4>
          {allowCopy && (
            <Button
              variant="ghost"
              size="sm"
              onClick={copyToClipboard}
              className="h-8 w-8 p-0"
            >
              {copied ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      )}
      <div className="relative">
        <pre 
          ref={codeRef}
          className={cn(
            'p-4 bg-gray-900 text-gray-100 text-sm overflow-x-auto',
            'scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800'
          )}
        >
          <code className={`language-${language}`}>{code}</code>
        </pre>
        {allowCopy && !title && (
          <Button
            variant="ghost"
            size="sm"
            onClick={copyToClipboard}
            className="absolute top-2 right-2 h-8 w-8 p-0 bg-gray-800 hover:bg-gray-700"
          >
            {copied ? (
              <CheckCircle className="h-4 w-4 text-green-400" />
            ) : (
              <Copy className="h-4 w-4 text-gray-400" />
            )}
          </Button>
        )}
      </div>
    </Card>
  );
};

// Component showcase
export const ComponentShowcase: React.FC<ComponentShowcaseProps> = ({
  title,
  description,
  component: Component,
  props,
  examples,
  className,
}) => {
  const [selectedExample, setSelectedExample] = useState(0);
  const [showCode, setShowCode] = useState(false);

  return (
    <Card className={cn('space-y-6', className)}>
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
        {description && (
          <p className="text-gray-600">{description}</p>
        )}
      </div>
      
      {/* Example selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Example:</span>
        <div className="flex flex-wrap gap-1">
          {examples.map((example, index) => (
            <Button
              key={index}
              variant={selectedExample === index ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedExample(index)}
            >
              {example.title}
            </Button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="border rounded-lg p-6 bg-gray-50">
        <div className="flex items-center justify-center min-h-[100px]">
          <Component {...examples[selectedExample].props} />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCode(!showCode)}
            leftIcon={Code}
          >
            {showCode ? 'Hide' : 'Show'} Code
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigator.clipboard.writeText(examples[selectedExample].code)}
            leftIcon={Copy}
          >
            Copy
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={ExternalLink}
          >
            Open in Storybook
          </Button>
        </div>
      </div>

      {/* Code */}
      {showCode && (
        <CodeBlock
          code={examples[selectedExample].code}
          title={`${examples[selectedExample].title} Example`}
        />
      )}
    </Card>
  );
};

// Token display component
export const TokenDisplay: React.FC<TokenDisplayProps> = ({ 
  tokens, 
  category, 
  className 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const filteredTokens = Object.entries(tokens).filter(([key]) =>
    key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const copyToken = async (tokenName: string, tokenValue: string) => {
    try {
      await navigator.clipboard.writeText(`var(--${tokenName})`);
      setCopiedToken(tokenName);
      setTimeout(() => setCopiedToken(null), 2000);
    } catch (err) {
      console.error('Failed to copy token:', err);
    }
  };

  return (
    <Card className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 capitalize">{category} Tokens</h3>
        <Input
          placeholder="Search tokens..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          leftIcon={Search}
          className="w-64"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTokens.map(([key, value]) => (
          <div
            key={key}
            className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer group"
            onClick={() => copyToken(key, value)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{key}</p>
                <p className="text-xs text-gray-500 truncate">{value}</p>
              </div>
              <div className="flex items-center gap-2">
                {category === 'colors' && (
                  <div
                    className="w-4 h-4 rounded border border-gray-300"
                    style={{ backgroundColor: value }}
                  />
                )}
                {copiedToken === key ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

// Icon showcase component
export const IconShowcase: React.FC<IconShowcaseProps> = ({ 
  icons, 
  searchable = true, 
  className 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedIcon, setCopiedIcon] = useState<string | null>(null);

  const filteredIcons = icons.filter(({ name }) =>
    name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const copyIcon = async (iconName: string) => {
    try {
      await navigator.clipboard.writeText(`<Icon name="${iconName}" />`);
      setCopiedIcon(iconName);
      setTimeout(() => setCopiedIcon(null), 2000);
    } catch (err) {
      console.error('Failed to copy icon:', err);
    }
  };

  return (
    <Card className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Icons ({filteredIcons.length})</h3>
        {searchable && (
          <Input
            placeholder="Search icons..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={Search}
            className="w-64"
          />
        )}
      </div>
      
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-4">
        {filteredIcons.map(({ name, icon: IconComponent }) => (
          <div
            key={name}
            className="flex flex-col items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer group"
            onClick={() => copyIcon(name)}
            title={name}
          >
            <div className="relative">
              <IconComponent className="h-6 w-6 text-gray-600" />
              {copiedIcon === name && (
                <CheckCircle className="absolute -top-1 -right-1 h-4 w-4 text-green-500 bg-white rounded-full" />
              )}
            </div>
            <span className="text-xs text-gray-500 mt-1 truncate w-full text-center">
              {name}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
};

// Documentation navigation component
export const DocNav: React.FC<DocNavProps> = ({ 
  sections, 
  currentSection, 
  onSectionChange,
  className 
}) => {
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  return (
    <nav className={cn('space-y-2', className)}>
      {sections.map((section) => (
        <div key={section.id}>
          <div
            className={cn(
              'flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-gray-100',
              currentSection === section.id && 'bg-primary-50 text-primary-600'
            )}
            onClick={() => {
              onSectionChange(section.id);
              if (section.subsections) {
                toggleSection(section.id);
              }
            }}
          >
            <span className="font-medium">{section.title}</span>
            {section.subsections && (
              <ChevronDown 
                className={cn(
                  'h-4 w-4 transition-transform',
                  expandedSections.includes(section.id) && 'rotate-180'
                )}
              />
            )}
          </div>
          
          {section.subsections && expandedSections.includes(section.id) && (
            <div className="ml-4 space-y-1">
              {section.subsections.map((subsection) => (
                <div
                  key={subsection.id}
                  className={cn(
                    'p-2 rounded-lg cursor-pointer hover:bg-gray-100 text-sm',
                    currentSection === subsection.id && 'bg-primary-50 text-primary-600'
                  )}
                  onClick={() => onSectionChange(subsection.id)}
                >
                  {subsection.title}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  );
};

// Main documentation component
export const Documentation: React.FC<{
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ 
  title = 'Design System Documentation',
  description = 'Comprehensive documentation for the RevivaTech Design System V2',
  children,
  className 
}) => {
  return (
    <div className={cn('max-w-7xl mx-auto px-4 py-8', className)}>
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">{title}</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">{description}</p>
        </div>

        {/* Content */}
        <div className="space-y-12">
          {children}
        </div>
      </div>
    </div>
  );
};

// Predefined icon sets for showcase
export const iconSets = {
  basic: [
    { name: 'heart', icon: Heart },
    { name: 'star', icon: Star },
    { name: 'home', icon: Home },
    { name: 'search', icon: Search },
    { name: 'settings', icon: Settings },
    { name: 'user', icon: User },
    { name: 'mail', icon: Mail },
    { name: 'calendar', icon: Calendar },
    { name: 'clock', icon: Clock },
    { name: 'globe', icon: Globe },
    { name: 'shield', icon: Shield },
    { name: 'lock', icon: Lock },
    { name: 'eye', icon: Eye },
    { name: 'edit', icon: Edit },
    { name: 'trash', icon: Trash2 },
    { name: 'refresh', icon: RefreshCw },
    { name: 'filter', icon: Filter },
    { name: 'more', icon: MoreHorizontal },
  ],
  
  navigation: [
    { name: 'menu', icon: Menu },
    { name: 'close', icon: X },
    { name: 'chevron-right', icon: ChevronRight },
    { name: 'chevron-down', icon: ChevronDown },
    { name: 'arrow-right', icon: ArrowRight },
    { name: 'plus', icon: Plus },
    { name: 'minus', icon: Minus },
  ],
  
  status: [
    { name: 'check', icon: Check },
    { name: 'check-circle', icon: CheckCircle },
    { name: 'x', icon: X },
    { name: 'alert-circle', icon: AlertCircle },
    { name: 'alert-triangle', icon: AlertTriangle },
    { name: 'info', icon: Info },
    { name: 'help-circle', icon: HelpCircle },
    { name: 'loader', icon: Loader2 },
  ],
  
  media: [
    { name: 'play', icon: PlayIcon },
    { name: 'pause', icon: Pause },
    { name: 'stop', icon: Stop },
    { name: 'skip-back', icon: SkipBack },
    { name: 'skip-forward', icon: SkipForward },
    { name: 'volume', icon: Volume2 },
    { name: 'volume-off', icon: VolumeX },
    { name: 'camera', icon: Camera },
    { name: 'video', icon: Video },
    { name: 'image', icon: Image },
    { name: 'mic', icon: Mic },
    { name: 'mic-off', icon: MicOff },
    { name: 'headphones', icon: Headphones },
  ],
  
  files: [
    { name: 'file', icon: File },
    { name: 'folder', icon: Folder },
    { name: 'archive', icon: Archive },
    { name: 'link', icon: Link },
    { name: 'paperclip', icon: Paperclip },
    { name: 'upload', icon: Upload },
    { name: 'download', icon: DownloadIcon },
    { name: 'save', icon: Save },
    { name: 'print', icon: Print },
  ],
  
  communication: [
    { name: 'send', icon: Send },
    { name: 'message-circle', icon: MessageCircle },
    { name: 'message-square', icon: MessageSquare },
    { name: 'bell', icon: Bell },
    { name: 'bell-off', icon: BellOff },
    { name: 'users', icon: Users },
  ],
  
  business: [
    { name: 'shopping-cart', icon: ShoppingCart },
    { name: 'credit-card', icon: CreditCard },
    { name: 'dollar-sign', icon: DollarSign },
    { name: 'trending-up', icon: TrendingUp },
    { name: 'bar-chart', icon: BarChart },
    { name: 'pie-chart', icon: PieChart },
    { name: 'target', icon: Target },
    { name: 'award', icon: Award },
    { name: 'gift', icon: Gift },
    { name: 'crown', icon: Crown },
  ],
  
  devices: [
    { name: 'smartphone', icon: Smartphone },
    { name: 'tablet', icon: Tablet },
    { name: 'monitor', icon: Monitor },
    { name: 'laptop', icon: Laptop },
  ],
  
  tools: [
    { name: 'wrench', icon: Wrench },
    { name: 'hammer', icon: Hammer },
    { name: 'scissors', icon: Scissors },
    { name: 'paintbrush', icon: Paintbrush },
    { name: 'cpu', icon: Cpu },
    { name: 'hard-drive', icon: HardDrive },
    { name: 'wifi', icon: Wifi },
    { name: 'database', icon: Database },
    { name: 'server', icon: Server },
    { name: 'power', icon: Power },
  ],
  
  transportation: [
    { name: 'car', icon: Car },
    { name: 'truck', icon: Truck },
    { name: 'bike', icon: Bike },
    { name: 'plane', icon: Plane },
    { name: 'train', icon: Train },
    { name: 'ship', icon: Ship },
  ],
  
  weather: [
    { name: 'sun', icon: Sun },
    { name: 'moon', icon: Moon },
    { name: 'cloud', icon: Cloud },
    { name: 'cloud-rain', icon: CloudRain },
  ],
  
  nature: [
    { name: 'tree', icon: Tree },
    { name: 'flower', icon: Flower },
    { name: 'mountain', icon: Mountain },
    { name: 'waves', icon: Waves },
  ],
  
  social: [
    { name: 'smile', icon: Smile },
    { name: 'frown', icon: Frown },
    { name: 'thumbs-up', icon: ThumbsUp },
    { name: 'thumbs-down', icon: ThumbsDown },
    { name: 'flag', icon: Flag },
  ],
  
  brands: [
    { name: 'github', icon: Github },
    { name: 'twitter', icon: Twitter },
    { name: 'facebook', icon: Facebook },
    { name: 'instagram', icon: Instagram },
    { name: 'linkedin', icon: Linkedin },
    { name: 'youtube', icon: Youtube },
  ],
  
  layout: [
    { name: 'grid', icon: Grid },
    { name: 'list', icon: List },
    { name: 'layout', icon: Layout },
    { name: 'maximize', icon: Maximize },
    { name: 'minimize', icon: Minimize },
  ],
};

// Export all components
export {
  Documentation,
  DocSection,
  CodeBlock,
  ComponentShowcase,
  TokenDisplay,
  IconShowcase,
  DocNav,
  iconSets,
};

export default Documentation;