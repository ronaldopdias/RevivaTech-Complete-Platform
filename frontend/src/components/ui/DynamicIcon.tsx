'use client';

import React, { lazy, Suspense } from 'react';
import { LucideProps } from 'lucide-react';

// Define commonly used icons that should be bundled
const commonIcons = {
  ArrowRight: lazy(() => import('lucide-react').then(mod => ({ default: mod.ArrowRight }))),
  Check: lazy(() => import('lucide-react').then(mod => ({ default: mod.Check }))),
  ChevronDown: lazy(() => import('lucide-react').then(mod => ({ default: mod.ChevronDown }))),
  ChevronUp: lazy(() => import('lucide-react').then(mod => ({ default: mod.ChevronUp }))),
  ChevronLeft: lazy(() => import('lucide-react').then(mod => ({ default: mod.ChevronLeft }))),
  ChevronRight: lazy(() => import('lucide-react').then(mod => ({ default: mod.ChevronRight }))),
  X: lazy(() => import('lucide-react').then(mod => ({ default: mod.X }))),
  Menu: lazy(() => import('lucide-react').then(mod => ({ default: mod.Menu }))),
  Search: lazy(() => import('lucide-react').then(mod => ({ default: mod.Search }))),
  User: lazy(() => import('lucide-react').then(mod => ({ default: mod.User }))),
  Home: lazy(() => import('lucide-react').then(mod => ({ default: mod.Home }))),
  Mail: lazy(() => import('lucide-react').then(mod => ({ default: mod.Mail }))),
  Phone: lazy(() => import('lucide-react').then(mod => ({ default: mod.Phone }))),
  MapPin: lazy(() => import('lucide-react').then(mod => ({ default: mod.MapPin }))),
  Calendar: lazy(() => import('lucide-react').then(mod => ({ default: mod.Calendar }))),
  Clock: lazy(() => import('lucide-react').then(mod => ({ default: mod.Clock }))),
  Star: lazy(() => import('lucide-react').then(mod => ({ default: mod.Star }))),
  Heart: lazy(() => import('lucide-react').then(mod => ({ default: mod.Heart }))),
  Share: lazy(() => import('lucide-react').then(mod => ({ default: mod.Share }))),
  Download: lazy(() => import('lucide-react').then(mod => ({ default: mod.Download }))),
  Upload: lazy(() => import('lucide-react').then(mod => ({ default: mod.Upload }))),
  Settings: lazy(() => import('lucide-react').then(mod => ({ default: mod.Settings }))),
  Loader2: lazy(() => import('lucide-react').then(mod => ({ default: mod.Loader2 }))),
  AlertCircle: lazy(() => import('lucide-react').then(mod => ({ default: mod.AlertCircle }))),
  CheckCircle: lazy(() => import('lucide-react').then(mod => ({ default: mod.CheckCircle }))),
  Info: lazy(() => import('lucide-react').then(mod => ({ default: mod.Info }))),
  AlertTriangle: lazy(() => import('lucide-react').then(mod => ({ default: mod.AlertTriangle }))),
  Eye: lazy(() => import('lucide-react').then(mod => ({ default: mod.Eye }))),
  EyeOff: lazy(() => import('lucide-react').then(mod => ({ default: mod.EyeOff }))),
  Edit: lazy(() => import('lucide-react').then(mod => ({ default: mod.Edit }))),
  Trash2: lazy(() => import('lucide-react').then(mod => ({ default: mod.Trash2 }))),
  Plus: lazy(() => import('lucide-react').then(mod => ({ default: mod.Plus }))),
  Minus: lazy(() => import('lucide-react').then(mod => ({ default: mod.Minus }))),
};

// Create a cache for dynamically loaded icons
const iconCache = new Map<string, React.ComponentType<LucideProps>>();

interface DynamicIconProps extends LucideProps {
  name: string;
  fallback?: React.ComponentType<LucideProps>;
}

// Fallback icon component
const DefaultIcon: React.FC<LucideProps> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M8 12h8" />
  </svg>
);

export function DynamicIcon({ name, fallback = DefaultIcon, ...props }: DynamicIconProps) {
  // Check if it's a common icon first
  const CommonIconComponent = commonIcons[name as keyof typeof commonIcons];
  
  if (CommonIconComponent) {
    return (
      <Suspense fallback={<fallback {...props} />}>
        <CommonIconComponent {...props} />
      </Suspense>
    );
  }

  // For uncommon icons, load dynamically
  const [IconComponent, setIconComponent] = React.useState<React.ComponentType<LucideProps> | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    // Check cache first
    if (iconCache.has(name)) {
      setIconComponent(iconCache.get(name)!);
      return;
    }

    setLoading(true);
    setError(false);

    // Dynamically import the icon
    import('lucide-react')
      .then((mod) => {
        const Icon = mod[name as keyof typeof mod] as React.ComponentType<LucideProps>;
        if (Icon) {
          iconCache.set(name, Icon);
          setIconComponent(() => Icon);
        } else {
          setError(true);
        }
      })
      .catch(() => {
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [name]);

  if (loading) {
    return <fallback {...props} />;
  }

  if (error || !IconComponent) {
    return <fallback {...props} />;
  }

  return <IconComponent {...props} />;
}

// Export common icons for direct use when needed
export const CommonIcons = {
  ArrowRight: commonIcons.ArrowRight,
  Check: commonIcons.Check,
  ChevronDown: commonIcons.ChevronDown,
  ChevronUp: commonIcons.ChevronUp,
  ChevronLeft: commonIcons.ChevronLeft,
  ChevronRight: commonIcons.ChevronRight,
  X: commonIcons.X,
  Menu: commonIcons.Menu,
  Search: commonIcons.Search,
  User: commonIcons.User,
  Home: commonIcons.Home,
  Mail: commonIcons.Mail,
  Phone: commonIcons.Phone,
  MapPin: commonIcons.MapPin,
  Calendar: commonIcons.Calendar,
  Clock: commonIcons.Clock,
  Star: commonIcons.Star,
  Heart: commonIcons.Heart,
  Share: commonIcons.Share,
  Download: commonIcons.Download,
  Upload: commonIcons.Upload,
  Settings: commonIcons.Settings,
  Loader2: commonIcons.Loader2,
  AlertCircle: commonIcons.AlertCircle,
  CheckCircle: commonIcons.CheckCircle,
  Info: commonIcons.Info,
  AlertTriangle: commonIcons.AlertTriangle,
  Eye: commonIcons.Eye,
  EyeOff: commonIcons.EyeOff,
  Edit: commonIcons.Edit,
  Trash2: commonIcons.Trash2,
  Plus: commonIcons.Plus,
  Minus: commonIcons.Minus,
};

// Preload critical icons
export function preloadIcons(iconNames: string[]) {
  iconNames.forEach(name => {
    if (!iconCache.has(name) && !commonIcons[name as keyof typeof commonIcons]) {
      import('lucide-react').then((mod) => {
        const Icon = mod[name as keyof typeof mod] as React.ComponentType<LucideProps>;
        if (Icon) {
          iconCache.set(name, Icon);
        }
      }).catch(() => {
        // Silently fail for non-existent icons
      });
    }
  });
}

export default DynamicIcon;