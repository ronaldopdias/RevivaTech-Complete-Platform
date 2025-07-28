/**
 * Design System V2 - Enhanced Icon Component
 * Advanced icon system with comprehensive design tokens and variants
 */

import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { 
  // Basic icons
  Heart, Star, Home, Search, Settings, User, Mail, Phone, Calendar, 
  Clock, Map, Globe, Shield, Lock, Eye, EyeOff, Download, Upload,
  Edit, Trash2, Copy, Share, Save, Print, Refresh, Filter, Sort,
  
  // Navigation icons
  Menu, X, ChevronLeft, ChevronRight, ChevronUp, ChevronDown,
  ArrowLeft, ArrowRight, ArrowUp, ArrowDown, MoreHorizontal, MoreVertical,
  
  // Status icons
  Check, CheckCircle, X as XIcon, XCircle, AlertCircle, AlertTriangle,
  Info, InfoIcon, Help, HelpCircle, Plus, Minus, Zap, Loader2,
  
  // Communication icons
  MessageCircle, MessageSquare, Send, Bell, BellOff, Volume2, VolumeX,
  
  // Media icons
  Play, Pause, Stop, SkipBack, SkipForward, Volume, Image, Video,
  Camera, Mic, MicOff, Headphones,
  
  // File icons
  File, FileText, Folder, FolderOpen, Archive, Paperclip, Link,
  
  // Business icons
  ShoppingCart, CreditCard, DollarSign, TrendingUp, TrendingDown,
  BarChart, PieChart, Activity, Target, Award, Gift,
  
  // Social icons
  Users, UserPlus, UserMinus, UserCheck, UserX, Crown, Flag,
  
  // Weather icons
  Sun, Moon, Cloud, CloudRain, Zap as Lightning,
  
  // Device icons
  Smartphone, Tablet, Monitor, Laptop, Headphones as Headset,
  
  // Tools icons
  Wrench, Hammer, Scissors, Paintbrush, Cpu, HardDrive, Wifi,
  
  // Transportation icons
  Car, Truck, Bike, Plane, Train, Ship,
  
  // Nature icons
  Tree, Flower, Leaf, Mountain, Waves,
  
  // Emoji icons
  Smile, Frown, Meh, Heart as Love, ThumbsUp, ThumbsDown,
  
  // System icons
  Power, Restart, Update, Database, Server, Cloud as CloudIcon,
  
  // Layout icons
  Layout, Grid, List, Columns, Rows, Maximize, Minimize,
  
  // Brand icons (we'll use lucide equivalents)
  Github, Twitter, Facebook, Instagram, Linkedin, Youtube,
  
  // Custom service icons
  Smartphone as Phone2, Wrench as RepairIcon, Clock as TimeIcon,
  Shield as WarrantyIcon, Zap as FastIcon, Award as QualityIcon,
  
  type LucideIcon
} from 'lucide-react';

// Icon variants using design tokens
const iconVariants = cva(
  [
    'inline-flex items-center justify-center',
    'transition-all duration-200 ease-out',
    'flex-shrink-0',
  ],
  {
    variants: {
      size: {
        xs: 'h-3 w-3',
        sm: 'h-4 w-4',
        md: 'h-5 w-5',
        lg: 'h-6 w-6',
        xl: 'h-8 w-8',
        '2xl': 'h-10 w-10',
        '3xl': 'h-12 w-12',
        '4xl': 'h-16 w-16',
        '5xl': 'h-20 w-20',
      },
      
      color: {
        default: 'text-gray-600',
        primary: 'text-primary-600',
        secondary: 'text-secondary-600',
        accent: 'text-accent-600',
        success: 'text-green-600',
        warning: 'text-yellow-600',
        error: 'text-red-600',
        info: 'text-blue-600',
        muted: 'text-gray-400',
        inverse: 'text-white',
        current: 'text-current',
      },
      
      background: {
        none: '',
        subtle: 'bg-gray-100 rounded-full p-1',
        primary: 'bg-primary-100 text-primary-600 rounded-full p-1',
        secondary: 'bg-secondary-100 text-secondary-600 rounded-full p-1',
        accent: 'bg-accent-100 text-accent-600 rounded-full p-1',
        success: 'bg-green-100 text-green-600 rounded-full p-1',
        warning: 'bg-yellow-100 text-yellow-600 rounded-full p-1',
        error: 'bg-red-100 text-red-600 rounded-full p-1',
        info: 'bg-blue-100 text-blue-600 rounded-full p-1',
      },
      
      hover: {
        none: '',
        subtle: 'hover:bg-gray-100 hover:text-gray-700',
        primary: 'hover:bg-primary-50 hover:text-primary-700',
        secondary: 'hover:bg-secondary-50 hover:text-secondary-700',
        accent: 'hover:bg-accent-50 hover:text-accent-700',
        success: 'hover:bg-green-50 hover:text-green-700',
        warning: 'hover:bg-yellow-50 hover:text-yellow-700',
        error: 'hover:bg-red-50 hover:text-red-700',
        info: 'hover:bg-blue-50 hover:text-blue-700',
      },
      
      animation: {
        none: '',
        spin: 'animate-spin',
        bounce: 'animate-bounce',
        pulse: 'animate-pulse',
        ping: 'animate-ping',
        wiggle: 'animate-wiggle',
        float: 'animate-float',
        tada: 'animate-tada',
        shake: 'animate-shake',
        flip: 'animate-flip',
        swing: 'animate-swing',
      },
      
      interactive: {
        true: 'cursor-pointer hover:scale-110 active:scale-95',
        false: '',
      },
      
      disabled: {
        true: 'opacity-50 cursor-not-allowed',
        false: '',
      },
    },
    
    defaultVariants: {
      size: 'md',
      color: 'default',
      background: 'none',
      hover: 'none',
      animation: 'none',
      interactive: false,
      disabled: false,
    },
  }
);

// Icon component props
export interface IconProps
  extends React.SVGProps<SVGSVGElement>,
    VariantProps<typeof iconVariants> {
  
  // Icon source
  icon?: LucideIcon;
  name?: string;
  
  // Content props
  children?: React.ReactNode;
  
  // Loading props
  loading?: boolean;
  
  // Accessibility props
  'aria-label'?: string;
  'aria-hidden'?: boolean;
  'aria-describedby'?: string;
  
  // Event handlers
  onClick?: (event: React.MouseEvent<SVGSVGElement>) => void;
  onMouseEnter?: (event: React.MouseEvent<SVGSVGElement>) => void;
  onMouseLeave?: (event: React.MouseEvent<SVGSVGElement>) => void;
  
  // Styling
  className?: string;
  strokeWidth?: number;
  fill?: string;
  stroke?: string;
}

// Icon registry
const iconRegistry = new Map<string, LucideIcon>();

// Register default icons
const defaultIcons = {
  // Basic icons
  heart: Heart,
  star: Star,
  home: Home,
  search: Search,
  settings: Settings,
  user: User,
  mail: Mail,
  phone: Phone,
  calendar: Calendar,
  clock: Clock,
  map: Map,
  globe: Globe,
  shield: Shield,
  lock: Lock,
  eye: Eye,
  'eye-off': EyeOff,
  download: Download,
  upload: Upload,
  edit: Edit,
  trash: Trash2,
  copy: Copy,
  share: Share,
  save: Save,
  print: Print,
  refresh: Refresh,
  filter: Filter,
  sort: Sort,
  
  // Navigation icons
  menu: Menu,
  close: X,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  'chevron-up': ChevronUp,
  'chevron-down': ChevronDown,
  'arrow-left': ArrowLeft,
  'arrow-right': ArrowRight,
  'arrow-up': ArrowUp,
  'arrow-down': ArrowDown,
  'more-horizontal': MoreHorizontal,
  'more-vertical': MoreVertical,
  
  // Status icons
  check: Check,
  'check-circle': CheckCircle,
  x: XIcon,
  'x-circle': XCircle,
  'alert-circle': AlertCircle,
  'alert-triangle': AlertTriangle,
  info: Info,
  'info-circle': InfoIcon,
  help: Help,
  'help-circle': HelpCircle,
  plus: Plus,
  minus: Minus,
  zap: Zap,
  loader: Loader2,
  
  // Communication icons
  'message-circle': MessageCircle,
  'message-square': MessageSquare,
  send: Send,
  bell: Bell,
  'bell-off': BellOff,
  volume: Volume2,
  'volume-off': VolumeX,
  
  // Media icons
  play: Play,
  pause: Pause,
  stop: Stop,
  'skip-back': SkipBack,
  'skip-forward': SkipForward,
  'volume-2': Volume,
  image: Image,
  video: Video,
  camera: Camera,
  mic: Mic,
  'mic-off': MicOff,
  headphones: Headphones,
  
  // File icons
  file: File,
  'file-text': FileText,
  folder: Folder,
  'folder-open': FolderOpen,
  archive: Archive,
  paperclip: Paperclip,
  link: Link,
  
  // Business icons
  'shopping-cart': ShoppingCart,
  'credit-card': CreditCard,
  'dollar-sign': DollarSign,
  'trending-up': TrendingUp,
  'trending-down': TrendingDown,
  'bar-chart': BarChart,
  'pie-chart': PieChart,
  activity: Activity,
  target: Target,
  award: Award,
  gift: Gift,
  
  // Social icons
  users: Users,
  'user-plus': UserPlus,
  'user-minus': UserMinus,
  'user-check': UserCheck,
  'user-x': UserX,
  crown: Crown,
  flag: Flag,
  
  // Weather icons
  sun: Sun,
  moon: Moon,
  cloud: Cloud,
  'cloud-rain': CloudRain,
  lightning: Lightning,
  
  // Device icons
  smartphone: Smartphone,
  tablet: Tablet,
  monitor: Monitor,
  laptop: Laptop,
  headset: Headset,
  
  // Tools icons
  wrench: Wrench,
  hammer: Hammer,
  scissors: Scissors,
  paintbrush: Paintbrush,
  cpu: Cpu,
  'hard-drive': HardDrive,
  wifi: Wifi,
  
  // Transportation icons
  car: Car,
  truck: Truck,
  bike: Bike,
  plane: Plane,
  train: Train,
  ship: Ship,
  
  // Nature icons
  tree: Tree,
  flower: Flower,
  leaf: Leaf,
  mountain: Mountain,
  waves: Waves,
  
  // Emoji icons
  smile: Smile,
  frown: Frown,
  meh: Meh,
  love: Love,
  'thumbs-up': ThumbsUp,
  'thumbs-down': ThumbsDown,
  
  // System icons
  power: Power,
  restart: Restart,
  update: Update,
  database: Database,
  server: Server,
  'cloud-icon': CloudIcon,
  
  // Layout icons
  layout: Layout,
  grid: Grid,
  list: List,
  columns: Columns,
  rows: Rows,
  maximize: Maximize,
  minimize: Minimize,
  
  // Brand icons
  github: Github,
  twitter: Twitter,
  facebook: Facebook,
  instagram: Instagram,
  linkedin: Linkedin,
  youtube: Youtube,
  
  // Custom service icons
  'phone-2': Phone2,
  'repair-icon': RepairIcon,
  'time-icon': TimeIcon,
  'warranty-icon': WarrantyIcon,
  'fast-icon': FastIcon,
  'quality-icon': QualityIcon,
};

// Register default icons
Object.entries(defaultIcons).forEach(([name, icon]) => {
  iconRegistry.set(name, icon);
});

// Icon registration utilities
export const iconUtils = {
  // Register a new icon
  register: (name: string, icon: LucideIcon) => {
    iconRegistry.set(name, icon);
  },
  
  // Register multiple icons
  registerMany: (icons: { [key: string]: LucideIcon }) => {
    Object.entries(icons).forEach(([name, icon]) => {
      iconRegistry.set(name, icon);
    });
  },
  
  // Get an icon by name
  get: (name: string): LucideIcon | undefined => {
    return iconRegistry.get(name);
  },
  
  // Check if an icon exists
  has: (name: string): boolean => {
    return iconRegistry.has(name);
  },
  
  // Get all registered icon names
  getNames: (): string[] => {
    return Array.from(iconRegistry.keys());
  },
  
  // Remove an icon
  remove: (name: string): boolean => {
    return iconRegistry.delete(name);
  },
  
  // Clear all icons
  clear: () => {
    iconRegistry.clear();
  },
  
  // Get icon count
  count: (): number => {
    return iconRegistry.size;
  },
};

// Main Icon component
const Icon = forwardRef<SVGSVGElement, IconProps>(
  (
    {
      icon,
      name,
      size,
      color,
      background,
      hover,
      animation,
      interactive,
      disabled,
      loading = false,
      className,
      strokeWidth = 2,
      fill = 'none',
      stroke = 'currentColor',
      onClick,
      onMouseEnter,
      onMouseLeave,
      'aria-label': ariaLabel,
      'aria-hidden': ariaHidden,
      'aria-describedby': ariaDescribedBy,
      children,
      ...props
    },
    ref
  ) => {
    // Determine which icon to use
    let IconComponent: LucideIcon | undefined;
    
    if (icon) {
      IconComponent = icon;
    } else if (name) {
      IconComponent = iconRegistry.get(name);
    }
    
    // Handle loading state
    if (loading) {
      IconComponent = Loader2;
      animation = 'spin';
    }
    
    // If no icon found, return null or a fallback
    if (!IconComponent) {
      if (children) {
        return (
          <span
            className={cn(
              iconVariants({
                size,
                color,
                background,
                hover,
                animation,
                interactive,
                disabled,
              }),
              className
            )}
            aria-label={ariaLabel}
            aria-hidden={ariaHidden}
            aria-describedby={ariaDescribedBy}
            onClick={onClick as any}
            onMouseEnter={onMouseEnter as any}
            onMouseLeave={onMouseLeave as any}
          >
            {children}
          </span>
        );
      }
      
      console.warn(`Icon "${name}" not found in registry`);
      return null;
    }
    
    // Determine if interactive
    const isInteractive = interactive || !!onClick;
    
    return (
      <IconComponent
        ref={ref}
        className={cn(
          iconVariants({
            size,
            color,
            background,
            hover,
            animation,
            interactive: isInteractive,
            disabled,
          }),
          className
        )}
        strokeWidth={strokeWidth}
        fill={fill}
        stroke={stroke}
        aria-label={ariaLabel}
        aria-hidden={ariaHidden}
        aria-describedby={ariaDescribedBy}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        {...props}
      />
    );
  }
);

Icon.displayName = 'Icon';

// Icon group component
export const IconGroup = ({
  children,
  className,
  spacing = 'md',
  alignment = 'center',
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  spacing?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  alignment?: 'start' | 'center' | 'end';
} & React.HTMLAttributes<HTMLDivElement>) => {
  const spacings = {
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-3',
    lg: 'gap-4',
    xl: 'gap-6',
  };
  
  const alignments = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
  };
  
  return (
    <div
      className={cn(
        'flex',
        spacings[spacing],
        alignments[alignment],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// Icon button component (uses Button component internally)
export const IconButton = forwardRef<HTMLButtonElement, {
  icon?: LucideIcon;
  name?: string;
  size?: IconProps['size'];
  color?: IconProps['color'];
  variant?: 'default' | 'ghost' | 'outline' | 'filled';
  disabled?: boolean;
  loading?: boolean;
  'aria-label': string;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}>(
  ({ 
    icon, 
    name, 
    size = 'md', 
    color = 'default',
    variant = 'ghost',
    disabled = false,
    loading = false,
    className,
    onClick,
    'aria-label': ariaLabel,
    ...props 
  }, ref) => {
    const variants = {
      default: 'bg-white border border-gray-300 hover:bg-gray-50',
      ghost: 'bg-transparent hover:bg-gray-100',
      outline: 'bg-transparent border border-gray-300 hover:bg-gray-50',
      filled: 'bg-gray-100 hover:bg-gray-200',
    };
    
    const sizes = {
      xs: 'h-6 w-6 p-1',
      sm: 'h-8 w-8 p-1.5',
      md: 'h-10 w-10 p-2',
      lg: 'h-12 w-12 p-2.5',
      xl: 'h-14 w-14 p-3',
      '2xl': 'h-16 w-16 p-3.5',
      '3xl': 'h-20 w-20 p-4',
      '4xl': 'h-24 w-24 p-5',
      '5xl': 'h-28 w-28 p-6',
    };
    
    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled || loading}
        onClick={onClick}
        aria-label={ariaLabel}
        className={cn(
          'inline-flex items-center justify-center rounded-md',
          'transition-all duration-200 ease-out',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        <Icon
          icon={icon}
          name={name}
          size={size}
          color={color}
          loading={loading}
          aria-hidden="true"
        />
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';

// Icon badge component
export const IconBadge = ({
  icon,
  name,
  badge,
  badgeColor = 'error',
  size = 'md',
  className,
  ...props
}: {
  icon?: LucideIcon;
  name?: string;
  badge?: string | number;
  badgeColor?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  size?: IconProps['size'];
  className?: string;
} & Omit<IconProps, 'icon' | 'name' | 'size'>) => {
  const badgeColors = {
    primary: 'bg-primary-500 text-white',
    secondary: 'bg-secondary-500 text-white',
    success: 'bg-green-500 text-white',
    warning: 'bg-yellow-500 text-white',
    error: 'bg-red-500 text-white',
    info: 'bg-blue-500 text-white',
  };
  
  return (
    <div className={cn('relative inline-flex', className)}>
      <Icon
        icon={icon}
        name={name}
        size={size}
        {...props}
      />
      {badge && (
        <span
          className={cn(
            'absolute -top-1 -right-1 h-4 w-4 rounded-full',
            'flex items-center justify-center text-xs font-medium',
            'ring-2 ring-white',
            badgeColors[badgeColor]
          )}
        >
          {badge}
        </span>
      )}
    </div>
  );
};

// Export all components
export { Icon, IconGroup, IconButton, IconBadge, iconUtils, iconVariants };
export type { IconProps };
export default Icon;