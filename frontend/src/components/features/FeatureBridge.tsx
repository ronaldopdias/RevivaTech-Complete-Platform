'use client';

/**
 * Feature Bridge Components - Phase 3 Enhancement
 * 
 * Seamless feature access across all pages:
 * - Cross-page feature navigation
 * - Contextual feature suggestions
 * - Feature state management
 * - Feature access logging
 * - Feature performance tracking
 * - Quick action overlays
 * - Feature shortcuts
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { 
  Search,
  Filter,
  Star,
  Heart,
  Bookmark,
  TrendingUp,
  Zap,
  Target,
  Award,
  HelpCircle,
  ChevronRight,
  Plus,
  Eye,
  Share2,
  Lightbulb,
  Sparkles,
  ArrowRight,
  RefreshCw,
  User,
  Settings,
  Bell,
  Home,
  Calendar,
  MessageSquare,
  FileText,
  Wrench,
  Gift,
  BarChart3,
  PlayCircle,
  BookOpen,
  ThumbsUp,
  Layers,
  PieChart,
  Activity,
  Gauge,
  X,
  ChevronDown,
  ChevronUp,
  Map,
  Compass,
  Route,
  Navigation,
  Telescope,
  Radar,
  Crosshair,
  Focus,
  Scope,
  Binoculars,
  Command,
  Keyboard,
  Mouse,
  Pointer,
  Move,
  Shuffle,
  RotateCcw,
  Repeat,
  FastForward,
  SkipForward,
  Link,
  ExternalLink,
  Globe,
  Wifi,
  Radio,
  Satellite,
  Bluetooth,
  Headphones,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  MonitorPlay,
  Tv,
  Smartphone,
  Tablet,
  Laptop,
  Desktop,
  Watch,
  Gamepad2,
  Joystick
} from 'lucide-react';

// Feature Bridge Types
export interface FeatureBridgeAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  description: string;
  category: 'primary' | 'secondary' | 'tertiary';
  shortcut?: string;
  isExternal?: boolean;
  requiresAuth?: boolean;
  preloadData?: boolean;
  analyticsEvent?: string;
}

export interface FeatureBridgeContext {
  currentPage: string;
  userRole: 'customer' | 'admin' | 'staff';
  availableFeatures: string[];
  recentFeatures: string[];
  favoriteFeatures: string[];
  quickActions: FeatureBridgeAction[];
}

export interface FeatureBridgeProps {
  context: FeatureBridgeContext;
  position: 'top' | 'bottom' | 'left' | 'right' | 'floating' | 'modal';
  showShortcuts?: boolean;
  showSearch?: boolean;
  showRecent?: boolean;
  showFavorites?: boolean;
  maxActions?: number;
  onActionClick?: (action: FeatureBridgeAction) => void;
  onFeatureNavigate?: (feature: string, fromPage: string, toPage: string) => void;
  className?: string;
}

// Quick Action Bar Component
export function QuickActionBar({
  context,
  position = 'bottom',
  showShortcuts = true,
  showSearch = true,
  showRecent = true,
  showFavorites = true,
  maxActions = 6,
  onActionClick,
  onFeatureNavigate,
  className = ''
}: FeatureBridgeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Dynamic actions based on context
  const getContextualActions = (): FeatureBridgeAction[] => {
    const baseActions: FeatureBridgeAction[] = [
      {
        id: 'book-repair',
        label: 'Book Repair',
        icon: <Calendar className="w-4 h-4" />,
        href: '/book-repair',
        description: 'Schedule a new repair service',
        category: 'primary',
        shortcut: 'Ctrl+B',
        analyticsEvent: 'quick_action_book_repair'
      },
      {
        id: 'track-repair',
        label: 'Track Repair',
        icon: <Eye className="w-4 h-4" />,
        href: '/customer-portal?tab=repairs',
        description: 'Monitor repair progress',
        category: 'primary',
        shortcut: 'Ctrl+T',
        analyticsEvent: 'quick_action_track_repair'
      },
      {
        id: 'chat-support',
        label: 'Chat Support',
        icon: <MessageSquare className="w-4 h-4" />,
        href: '/customer-portal?tab=messages',
        description: 'Get instant help',
        category: 'primary',
        shortcut: 'Ctrl+H',
        analyticsEvent: 'quick_action_chat_support'
      },
      {
        id: 'customer-portal',
        label: 'Dashboard',
        icon: <Home className="w-4 h-4" />,
        href: '/customer-portal',
        description: 'Go to customer dashboard',
        category: 'secondary',
        shortcut: 'Ctrl+D',
        analyticsEvent: 'quick_action_dashboard'
      },
      {
        id: 'pricing',
        label: 'Pricing',
        icon: <BarChart3 className="w-4 h-4" />,
        href: '/pricing',
        description: 'View pricing information',
        category: 'secondary',
        shortcut: 'Ctrl+P',
        analyticsEvent: 'quick_action_pricing'
      },
      {
        id: 'help',
        label: 'Help',
        icon: <HelpCircle className="w-4 h-4" />,
        href: '/help',
        description: 'Get help and support',
        category: 'tertiary',
        shortcut: 'Ctrl+?',
        analyticsEvent: 'quick_action_help'
      }
    ];

    // Filter based on user role and context
    return baseActions.filter(action => {
      if (action.requiresAuth && !context.availableFeatures.includes(action.id)) {
        return false;
      }
      return true;
    }).slice(0, maxActions);
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        const actions = getContextualActions();
        const action = actions.find(a => a.shortcut === `${e.ctrlKey ? 'Ctrl' : 'Cmd'}+${e.key.toUpperCase()}`);
        if (action) {
          e.preventDefault();
          handleActionClick(action);
        }
      }
      
      // Global search shortcut
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearchModal(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle action click
  const handleActionClick = (action: FeatureBridgeAction) => {
    if (onActionClick) {
      onActionClick(action);
    }
    
    if (onFeatureNavigate) {
      onFeatureNavigate(action.id, context.currentPage, action.href);
    }
    
    // Navigate to the action
    if (action.isExternal) {
      window.open(action.href, '_blank');
    } else {
      window.location.href = action.href;
    }
  };

  // Position classes
  const positionClasses = {
    top: 'fixed top-0 left-0 right-0 z-50 bg-white border-b shadow-sm',
    bottom: 'fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg',
    left: 'fixed left-0 top-1/2 transform -translate-y-1/2 z-50',
    right: 'fixed right-0 top-1/2 transform -translate-y-1/2 z-50',
    floating: 'fixed bottom-4 right-4 z-50',
    modal: 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'
  };

  const actions = getContextualActions();

  // Floating version
  if (position === 'floating') {
    return (
      <div className={`${positionClasses.floating} ${className}`}>
        <Card className="w-80 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Quick Actions
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </Button>
            </div>
          </CardHeader>
          {isExpanded && (
            <CardContent className="pt-0">
              <div className="space-y-2">
                {actions.map(action => (
                  <Button
                    key={action.id}
                    variant="ghost"
                    className="w-full justify-start h-auto p-3"
                    onClick={() => handleActionClick(action)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                        {action.icon}
                      </div>
                      <div className="text-left">
                        <div className="font-medium">{action.label}</div>
                        <div className="text-xs text-gray-500">{action.description}</div>
                        {showShortcuts && action.shortcut && (
                          <div className="text-xs text-gray-400 mt-1">
                            <Keyboard className="w-3 h-3 inline mr-1" />
                            {action.shortcut}
                          </div>
                        )}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    );
  }

  // Modal version
  if (position === 'modal') {
    return showSearchModal ? (
      <div className={`${positionClasses.modal} ${className}`}>
        <Card className="w-full max-w-2xl mx-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Feature Search
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSearchModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  ref={searchRef}
                  placeholder="Search features and actions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  autoFocus
                />
              </div>
            </div>
            
            <div className="space-y-4">
              {/* Quick Actions */}
              <div>
                <h3 className="font-medium mb-2">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {actions.map(action => (
                    <Button
                      key={action.id}
                      variant="outline"
                      className="h-auto p-3 justify-start"
                      onClick={() => {
                        handleActionClick(action);
                        setShowSearchModal(false);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                          {action.icon}
                        </div>
                        <div className="text-left">
                          <div className="font-medium">{action.label}</div>
                          <div className="text-xs text-gray-500">{action.description}</div>
                          {showShortcuts && action.shortcut && (
                            <div className="text-xs text-gray-400 mt-1">
                              <Keyboard className="w-3 h-3 inline mr-1" />
                              {action.shortcut}
                            </div>
                          )}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Recent Features */}
              {showRecent && context.recentFeatures.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Recent Features</h3>
                  <div className="flex flex-wrap gap-2">
                    {context.recentFeatures.slice(0, 5).map(feature => (
                      <Badge key={feature} variant="outline" className="cursor-pointer hover:bg-gray-100">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Favorite Features */}
              {showFavorites && context.favoriteFeatures.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Favorites</h3>
                  <div className="flex flex-wrap gap-2">
                    {context.favoriteFeatures.slice(0, 5).map(feature => (
                      <Badge key={feature} variant="secondary" className="cursor-pointer hover:bg-gray-200">
                        <Heart className="w-3 h-3 mr-1 fill-current" />
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    ) : null;
  }

  // Bar version (top/bottom)
  return (
    <div className={`${positionClasses[position]} ${className}`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-600" />
              <span className="font-medium">Quick Actions</span>
            </div>
            <div className="flex items-center gap-2">
              {actions.slice(0, 4).map(action => (
                <Button
                  key={action.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleActionClick(action)}
                  className="flex items-center gap-2"
                >
                  {action.icon}
                  {action.label}
                  {showShortcuts && action.shortcut && (
                    <Badge variant="outline" className="ml-1 text-xs">
                      {action.shortcut}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {showSearch && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSearchModal(true)}
                className="flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                Search
                <Badge variant="outline" className="ml-1 text-xs">
                  Ctrl+K
                </Badge>
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>
        
        {/* Expanded actions */}
        {isExpanded && (
          <div className="border-t py-3">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {actions.map(action => (
                <Button
                  key={action.id}
                  variant="outline"
                  className="h-auto p-3 flex flex-col items-center gap-2"
                  onClick={() => handleActionClick(action)}
                >
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                    {action.icon}
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-sm">{action.label}</div>
                    <div className="text-xs text-gray-500">{action.description}</div>
                    {showShortcuts && action.shortcut && (
                      <div className="text-xs text-gray-400 mt-1">
                        <Keyboard className="w-3 h-3 inline mr-1" />
                        {action.shortcut}
                      </div>
                    )}
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <Card className="w-full max-w-2xl mx-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Feature Search
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSearchModal(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search features and actions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    autoFocus
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Quick Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {actions.map(action => (
                      <Button
                        key={action.id}
                        variant="outline"
                        className="h-auto p-3 justify-start"
                        onClick={() => {
                          handleActionClick(action);
                          setShowSearchModal(false);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                            {action.icon}
                          </div>
                          <div className="text-left">
                            <div className="font-medium">{action.label}</div>
                            <div className="text-xs text-gray-500">{action.description}</div>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Context Menu Component
export function FeatureContextMenu({
  context,
  onActionClick,
  onFeatureNavigate,
  className = ''
}: Omit<FeatureBridgeProps, 'position'>) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleRightClick = (e: MouseEvent) => {
      e.preventDefault();
      setPosition({ x: e.clientX, y: e.clientY });
      setIsOpen(true);
    };

    const handleClick = () => {
      setIsOpen(false);
    };

    document.addEventListener('contextmenu', handleRightClick);
    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('contextmenu', handleRightClick);
      document.removeEventListener('click', handleClick);
    };
  }, []);

  if (!isOpen) return null;

  const actions = [
    {
      id: 'book-repair',
      label: 'Book Repair',
      icon: <Calendar className="w-4 h-4" />,
      href: '/book-repair',
      description: 'Schedule a new repair service',
      category: 'primary' as const,
      shortcut: 'Ctrl+B'
    },
    {
      id: 'track-repair',
      label: 'Track Repair',
      icon: <Eye className="w-4 h-4" />,
      href: '/customer-portal?tab=repairs',
      description: 'Monitor repair progress',
      category: 'primary' as const,
      shortcut: 'Ctrl+T'
    },
    {
      id: 'chat-support',
      label: 'Chat Support',
      icon: <MessageSquare className="w-4 h-4" />,
      href: '/customer-portal?tab=messages',
      description: 'Get instant help',
      category: 'primary' as const,
      shortcut: 'Ctrl+H'
    }
  ];

  return (
    <div
      className={`fixed z-50 ${className}`}
      style={{ left: position.x, top: position.y }}
    >
      <Card className="w-64 shadow-lg">
        <CardContent className="p-2">
          <div className="space-y-1">
            {actions.map(action => (
              <Button
                key={action.id}
                variant="ghost"
                className="w-full justify-start h-auto p-2"
                onClick={() => {
                  if (onActionClick) onActionClick(action);
                  if (onFeatureNavigate) {
                    onFeatureNavigate(action.id, context.currentPage, action.href);
                  }
                  window.location.href = action.href;
                  setIsOpen(false);
                }}
              >
                <div className="flex items-center gap-2">
                  {action.icon}
                  <span>{action.label}</span>
                  {action.shortcut && (
                    <Badge variant="outline" className="ml-auto text-xs">
                      {action.shortcut}
                    </Badge>
                  )}
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Export main component
export { QuickActionBar as default };