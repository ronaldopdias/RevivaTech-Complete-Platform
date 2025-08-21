'use client';

/**
 * Universal Feature Discovery System - Phase 3 Enhancement
 * 
 * Intelligent feature discovery that works across all pages:
 * - Contextual feature suggestions based on current page
 * - Cross-page feature navigation
 * - Feature usage tracking and analytics
 * - Personalized recommendations
 * - Guided tours and tutorials
 * - Feature favorites and shortcuts
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/input';
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
  Binoculars
} from 'lucide-react';

// Feature Discovery Types
export interface DiscoverableFeature {
  id: string;
  title: string;
  description: string;
  category: 'repair' | 'communication' | 'loyalty' | 'analytics' | 'support' | 'navigation' | 'productivity';
  icon: React.ReactNode;
  href: string;
  priority: 'high' | 'medium' | 'low';
  isNew?: boolean;
  isPopular?: boolean;
  completionRate?: number;
  estimatedTime?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  prerequisites?: string[];
  tags: string[];
  contextualPages?: string[];
  tutorialSteps?: TutorialStep[];
}

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  target?: string;
  action?: string;
  screenshot?: string;
}

export interface FeatureUsage {
  featureId: string;
  lastUsed: Date;
  useCount: number;
  completionTime?: number;
  userRating?: number;
  isFavorite: boolean;
}

export interface FeatureDiscoveryContextProps {
  currentPage: string;
  userRole: 'customer' | 'admin' | 'staff';
  userPreferences: string[];
  showCompact?: boolean;
  showFloating?: boolean;
  showSidebar?: boolean;
  enableTutorials?: boolean;
  enableAnalytics?: boolean;
  onFeatureClick?: (feature: DiscoverableFeature) => void;
  onFeatureComplete?: (featureId: string) => void;
  className?: string;
}

export default function FeatureDiscoverySystem({
  currentPage,
  userRole = 'customer',
  userPreferences = [],
  showCompact = false,
  showFloating = false,
  showSidebar = true,
  enableTutorials = true,
  enableAnalytics = true,
  onFeatureClick,
  onFeatureComplete,
  className = ''
}: FeatureDiscoveryContextProps) {
  const [isExpanded, setIsExpanded] = useState(!showCompact);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [favoriteFeatures, setFavoriteFeatures] = useState<string[]>([]);
  const [featureUsage, setFeatureUsage] = useState<FeatureUsage[]>([]);
  const [showTutorial, setShowTutorial] = useState(false);
  const [activeTutorial, setActiveTutorial] = useState<string | null>(null);

  // Comprehensive feature catalog
  const discoverableFeatures: DiscoverableFeature[] = [
    // Repair Features
    {
      id: 'book-repair',
      title: 'Book Repair Service',
      description: 'Schedule a repair with our advanced booking system',
      category: 'repair',
      icon: <Calendar className="w-5 h-5" />,
      href: '/book-repair',
      priority: 'high',
      isPopular: true,
      completionRate: 85,
      estimatedTime: '5 min',
      difficulty: 'beginner',
      tags: ['booking', 'repair', 'schedule'],
      contextualPages: ['/', '/services', '/customer-portal'],
      tutorialSteps: [
        { id: '1', title: 'Select Device', description: 'Choose your device type and model' },
        { id: '2', title: 'Describe Issue', description: 'Tell us what\'s wrong with your device' },
        { id: '3', title: 'Choose Time', description: 'Pick a convenient time slot' },
        { id: '4', title: 'Confirm Booking', description: 'Review and confirm your booking' }
      ]
    },
    {
      id: 'track-repair',
      title: 'Track Repair Progress',
      description: 'Monitor your repair with real-time updates and photos',
      category: 'repair',
      icon: <Eye className="w-5 h-5" />,
      href: '/customer-portal?tab=repairs',
      priority: 'high',
      isPopular: true,
      completionRate: 92,
      estimatedTime: '2 min',
      difficulty: 'beginner',
      tags: ['tracking', 'progress', 'status'],
      contextualPages: ['/customer-portal', '/dashboard'],
      tutorialSteps: [
        { id: '1', title: 'Find Your Repair', description: 'Locate your repair in the dashboard' },
        { id: '2', title: 'View Progress', description: 'See real-time status updates' },
        { id: '3', title: 'Check Photos', description: 'View photos of the repair process' }
      ]
    },
    {
      id: 'repair-analytics',
      title: 'Repair Analytics',
      description: 'View detailed insights about your repair history',
      category: 'analytics',
      icon: <BarChart3 className="w-5 h-5" />,
      href: '/customer-portal?tab=analytics',
      priority: 'medium',
      isNew: true,
      completionRate: 45,
      estimatedTime: '3 min',
      difficulty: 'intermediate',
      tags: ['analytics', 'insights', 'history'],
      contextualPages: ['/customer-portal', '/dashboard'],
      tutorialSteps: [
        { id: '1', title: 'Navigate to Analytics', description: 'Go to the analytics tab' },
        { id: '2', title: 'Explore Metrics', description: 'View your repair statistics' },
        { id: '3', title: 'Understand Trends', description: 'Learn about your repair patterns' }
      ]
    },

    // Communication Features
    {
      id: 'chat-support',
      title: 'Live Chat Support',
      description: 'Get instant help from our technical experts',
      category: 'communication',
      icon: <MessageSquare className="w-5 h-5" />,
      href: '/customer-portal?tab=messages',
      priority: 'high',
      isPopular: true,
      completionRate: 88,
      estimatedTime: '1 min',
      difficulty: 'beginner',
      tags: ['chat', 'support', 'help'],
      contextualPages: ['*'], // Available on all pages
      tutorialSteps: [
        { id: '1', title: 'Open Chat', description: 'Click the chat icon to start' },
        { id: '2', title: 'Describe Issue', description: 'Tell us how we can help' },
        { id: '3', title: 'Get Response', description: 'Our team will respond quickly' }
      ]
    },
    {
      id: 'video-consultation',
      title: 'Video Consultation',
      description: 'Get expert advice through video calls',
      category: 'communication',
      icon: <PlayCircle className="w-5 h-5" />,
      href: '/video-consultation',
      priority: 'medium',
      isNew: true,
      completionRate: 72,
      estimatedTime: '15 min',
      difficulty: 'intermediate',
      tags: ['video', 'consultation', 'expert'],
      contextualPages: ['/customer-portal', '/services'],
      tutorialSteps: [
        { id: '1', title: 'Schedule Call', description: 'Book a time for your consultation' },
        { id: '2', title: 'Join Video Call', description: 'Connect with our expert' },
        { id: '3', title: 'Get Solutions', description: 'Receive personalized advice' }
      ]
    },

    // Loyalty Features
    {
      id: 'loyalty-program',
      title: 'Loyalty Rewards',
      description: 'Earn points and unlock exclusive benefits',
      category: 'loyalty',
      icon: <Gift className="w-5 h-5" />,
      href: '/customer-portal?tab=loyalty',
      priority: 'medium',
      isNew: true,
      completionRate: 35,
      estimatedTime: '4 min',
      difficulty: 'beginner',
      tags: ['loyalty', 'rewards', 'points'],
      contextualPages: ['/customer-portal', '/dashboard'],
      tutorialSteps: [
        { id: '1', title: 'Check Points', description: 'View your current loyalty points' },
        { id: '2', title: 'Explore Rewards', description: 'See available rewards' },
        { id: '3', title: 'Redeem Benefits', description: 'Use points for discounts' }
      ]
    },

    // Support Features
    {
      id: 'help-center',
      title: 'Help Center',
      description: 'Browse FAQs and troubleshooting guides',
      category: 'support',
      icon: <HelpCircle className="w-5 h-5" />,
      href: '/help',
      priority: 'medium',
      completionRate: 65,
      estimatedTime: '10 min',
      difficulty: 'beginner',
      tags: ['help', 'faq', 'support'],
      contextualPages: ['*'],
      tutorialSteps: [
        { id: '1', title: 'Search Help', description: 'Search for your question' },
        { id: '2', title: 'Browse Categories', description: 'Explore help topics' },
        { id: '3', title: 'Find Solutions', description: 'Get answers to your questions' }
      ]
    },

    // Navigation Features
    {
      id: 'quick-navigation',
      title: 'Quick Navigation',
      description: 'Use keyboard shortcuts and quick access features',
      category: 'navigation',
      icon: <Navigation className="w-5 h-5" />,
      href: '#',
      priority: 'low',
      completionRate: 25,
      estimatedTime: '2 min',
      difficulty: 'intermediate',
      tags: ['navigation', 'shortcuts', 'quick'],
      contextualPages: ['*'],
      tutorialSteps: [
        { id: '1', title: 'Keyboard Shortcuts', description: 'Learn useful keyboard shortcuts' },
        { id: '2', title: 'Quick Access', description: 'Use the floating navigation' },
        { id: '3', title: 'Search Features', description: 'Find features quickly' }
      ]
    },

    // Productivity Features
    {
      id: 'bulk-actions',
      title: 'Bulk Actions',
      description: 'Perform actions on multiple items at once',
      category: 'productivity',
      icon: <Layers className="w-5 h-5" />,
      href: '/admin',
      priority: 'low',
      completionRate: 15,
      estimatedTime: '5 min',
      difficulty: 'advanced',
      prerequisites: ['admin-access'],
      tags: ['bulk', 'actions', 'productivity'],
      contextualPages: ['/admin', '/admin/customers', '/admin/repair-queue'],
      tutorialSteps: [
        { id: '1', title: 'Select Items', description: 'Choose multiple items' },
        { id: '2', title: 'Choose Action', description: 'Select bulk action' },
        { id: '3', title: 'Execute', description: 'Perform the action' }
      ]
    }
  ];

  // Filter features based on context, search, and category
  const filteredFeatures = discoverableFeatures.filter(feature => {
    const matchesSearch = feature.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         feature.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         feature.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || feature.category === selectedCategory;
    
    const matchesContext = feature.contextualPages?.includes('*') || 
                          feature.contextualPages?.includes(currentPage) ||
                          !feature.contextualPages;
    
    const matchesRole = userRole === 'admin' || !feature.prerequisites?.includes('admin-access');
    
    return matchesSearch && matchesCategory && matchesContext && matchesRole;
  });

  // Get contextual recommendations
  const getContextualRecommendations = () => {
    return filteredFeatures
      .filter(feature => feature.priority === 'high' || feature.isPopular)
      .slice(0, 3);
  };

  // Categories for filtering
  const categories = [
    { id: 'all', label: 'All Features', icon: <Layers className="w-4 h-4" /> },
    { id: 'repair', label: 'Repair Services', icon: <Wrench className="w-4 h-4" /> },
    { id: 'communication', label: 'Communication', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'loyalty', label: 'Loyalty & Rewards', icon: <Gift className="w-4 h-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'support', label: 'Support', icon: <HelpCircle className="w-4 h-4" /> },
    { id: 'navigation', label: 'Navigation', icon: <Navigation className="w-4 h-4" /> },
    { id: 'productivity', label: 'Productivity', icon: <Zap className="w-4 h-4" /> }
  ];

  // Toggle favorite feature
  const toggleFavorite = (featureId: string) => {
    setFavoriteFeatures(prev => 
      prev.includes(featureId) 
        ? prev.filter(id => id !== featureId)
        : [...prev, featureId]
    );
  };

  // Handle feature click
  const handleFeatureClick = (feature: DiscoverableFeature) => {
    if (onFeatureClick) {
      onFeatureClick(feature);
    }
    
    // Track usage
    if (enableAnalytics) {
      const usage = featureUsage.find(u => u.featureId === feature.id);
      if (usage) {
        usage.useCount++;
        usage.lastUsed = new Date();
      } else {
        setFeatureUsage(prev => [...prev, {
          featureId: feature.id,
          lastUsed: new Date(),
          useCount: 1,
          isFavorite: favoriteFeatures.includes(feature.id)
        }]);
      }
    }
  };

  // Start tutorial
  const startTutorial = (featureId: string) => {
    setActiveTutorial(featureId);
    setShowTutorial(true);
  };

  // Floating widget version
  if (showFloating) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Card className="w-80 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Telescope className="w-4 h-4" />
                Feature Discovery
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
              <div className="space-y-3">
                {getContextualRecommendations().map(feature => (
                  <div key={feature.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1 bg-blue-100 rounded text-blue-600">
                        {feature.icon}
                      </div>
                      <h4 className="font-medium text-sm">{feature.title}</h4>
                      {feature.isNew && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                          New
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{feature.description}</p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => handleFeatureClick(feature)}
                      >
                        Try Now
                      </Button>
                      {feature.tutorialSteps && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => startTutorial(feature.id)}
                        >
                          Tutorial
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    );
  }

  // Compact version
  if (showCompact) {
    return (
      <div className={`feature-discovery-compact ${className}`}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Compass className="w-5 h-5" />
              Discover Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getContextualRecommendations().map(feature => (
                <div key={feature.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                      {feature.icon}
                    </div>
                    <div>
                      <h4 className="font-medium">{feature.title}</h4>
                      {feature.isNew && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                          New
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{feature.description}</p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleFeatureClick(feature)}
                    >
                      Try Now
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleFavorite(feature.id)}
                    >
                      <Heart className={`w-4 h-4 ${
                        favoriteFeatures.includes(feature.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'
                      }`} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Full sidebar version
  return (
    <div className={`feature-discovery-system ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Binoculars className="w-5 h-5" />
            Feature Discovery
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search and Filter */}
          <div className="mb-6">
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search features..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map(category => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className="flex items-center gap-2 whitespace-nowrap"
                >
                  {category.icon}
                  {category.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Contextual Recommendations */}
          <div className="mb-6">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Recommended for You
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {getContextualRecommendations().map(feature => (
                <div key={feature.id} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                      {feature.icon}
                    </div>
                    <div>
                      <h4 className="font-medium">{feature.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        {feature.isNew && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                            New
                          </Badge>
                        )}
                        {feature.isPopular && (
                          <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs">
                            Popular
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{feature.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFeatureClick(feature)}
                      >
                        Try Now
                      </Button>
                      {feature.tutorialSteps && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startTutorial(feature.id)}
                        >
                          Tutorial
                        </Button>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleFavorite(feature.id)}
                    >
                      <Heart className={`w-4 h-4 ${
                        favoriteFeatures.includes(feature.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'
                      }`} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* All Features */}
          <div>
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              All Features ({filteredFeatures.length})
            </h3>
            <div className="space-y-3">
              {filteredFeatures.map(feature => (
                <div key={feature.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${
                      feature.category === 'repair' ? 'bg-blue-100 text-blue-600' :
                      feature.category === 'communication' ? 'bg-green-100 text-green-600' :
                      feature.category === 'loyalty' ? 'bg-yellow-100 text-yellow-600' :
                      feature.category === 'analytics' ? 'bg-purple-100 text-purple-600' :
                      feature.category === 'support' ? 'bg-orange-100 text-orange-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {feature.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{feature.title}</h4>
                        {feature.isNew && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                            New
                          </Badge>
                        )}
                        {feature.isPopular && (
                          <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs">
                            Popular
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {feature.difficulty}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{feature.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{feature.estimatedTime}</span>
                        <span>{feature.completionRate}% completion rate</span>
                        <div className="flex items-center gap-1">
                          {feature.tags.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFeatureClick(feature)}
                      >
                        Try Now
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                      {feature.tutorialSteps && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startTutorial(feature.id)}
                        >
                          <BookOpen className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleFavorite(feature.id)}
                      >
                        <Heart className={`w-4 h-4 ${
                          favoriteFeatures.includes(feature.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'
                        }`} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}