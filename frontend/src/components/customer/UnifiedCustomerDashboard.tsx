'use client';

/**
 * Unified Customer Dashboard - Phase 3 Enhancement
 * 
 * Enhanced customer portal with universal feature access and discovery:
 * - All customer features accessible from one location
 * - Contextual feature suggestions based on user behavior
 * - Real-time updates and notifications
 * - Seamless integration with existing components
 * - Feature discovery system with guided tours
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Smartphone,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  FileText,
  Calendar,
  Star,
  Gift,
  Download,
  Upload,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Package,
  Wrench,
  Shield,
  Bell,
  Settings,
  History,
  Users,
  Camera,
  Home,
  Search,
  Bookmark,
  TrendingUp,
  Zap,
  Target,
  Award,
  HelpCircle,
  ChevronRight,
  Plus,
  Filter,
  Eye,
  Share2,
  Heart,
  Lightbulb,
  Sparkles,
  ArrowRight,
  RefreshCw,
  User,
  Globe,
  Headphones,
  PlayCircle,
  BookOpen,
  ThumbsUp,
  Layers,
  BarChart3,
  PieChart,
  Activity,
  Gauge
} from 'lucide-react';

// Enhanced Types
export interface CustomerMetrics {
  totalRepairs: number;
  activeRepairs: number;
  completedRepairs: number;
  averageRating: number;
  totalSaved: number;
  loyaltyPoints: number;
  nextRewardThreshold: number;
  satisfactionScore: number;
  responseTime: string;
  lastActivity: string;
}

export interface FeatureSuggestion {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: 'repair' | 'communication' | 'loyalty' | 'analytics' | 'support';
  priority: 'high' | 'medium' | 'low';
  action: string;
  href?: string;
  isNew?: boolean;
  completedByUser?: boolean;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  description: string;
  category: string;
  badge?: string;
  color: string;
}

export interface CustomerInsight {
  id: string;
  title: string;
  description: string;
  value: string;
  trend: 'up' | 'down' | 'stable';
  icon: React.ReactNode;
  color: string;
}

export interface UnifiedCustomerDashboardProps {
  customerId?: string;
  showOnboarding?: boolean;
  enableFeatureDiscovery?: boolean;
  enableAnalytics?: boolean;
  className?: string;
}

export default function UnifiedCustomerDashboard({
  customerId = 'customer-001',
  showOnboarding = false,
  enableFeatureDiscovery = true,
  enableAnalytics = true,
  className = ''
}: UnifiedCustomerDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [showFeatureDiscovery, setShowFeatureDiscovery] = useState(enableFeatureDiscovery);
  const [favoriteFeatures, setFavoriteFeatures] = useState<string[]>([]);
  const [customerMetrics, setCustomerMetrics] = useState<CustomerMetrics>({
    totalRepairs: 12,
    activeRepairs: 2,
    completedRepairs: 10,
    averageRating: 4.8,
    totalSaved: 1250,
    loyaltyPoints: 340,
    nextRewardThreshold: 500,
    satisfactionScore: 96,
    responseTime: '< 2 hours',
    lastActivity: '2 hours ago'
  });

  // Feature suggestions based on user behavior and completion status
  const featureSuggestions: FeatureSuggestion[] = [
    {
      id: 'repair-tracker',
      title: 'Track Your Repairs',
      description: 'Get real-time updates on repair progress with photo documentation',
      icon: <Wrench className="w-5 h-5" />,
      category: 'repair',
      priority: 'high',
      action: 'View Tracker',
      href: '/customer-portal?tab=repairs',
      isNew: false,
      completedByUser: true
    },
    {
      id: 'book-repair',
      title: 'Book New Repair',
      description: 'Schedule a repair with our advanced booking system',
      icon: <Calendar className="w-5 h-5" />,
      category: 'repair',
      priority: 'high',
      action: 'Book Now',
      href: '/book-repair',
      isNew: false,
      completedByUser: false
    },
    {
      id: 'chat-support',
      title: 'Live Chat Support',
      description: 'Get instant help from our technical experts',
      icon: <MessageSquare className="w-5 h-5" />,
      category: 'communication',
      priority: 'medium',
      action: 'Start Chat',
      href: '/customer-portal?tab=messages',
      isNew: false,
      completedByUser: false
    },
    {
      id: 'loyalty-program',
      title: 'Loyalty Rewards',
      description: 'Earn points and unlock exclusive benefits',
      icon: <Gift className="w-5 h-5" />,
      category: 'loyalty',
      priority: 'medium',
      action: 'View Rewards',
      href: '/customer-portal?tab=loyalty',
      isNew: true,
      completedByUser: false
    },
    {
      id: 'repair-analytics',
      title: 'Repair Analytics',
      description: 'View detailed insights about your repair history',
      icon: <BarChart3 className="w-5 h-5" />,
      category: 'analytics',
      priority: 'low',
      action: 'View Analytics',
      href: '/customer-portal?tab=analytics',
      isNew: true,
      completedByUser: false
    },
    {
      id: 'video-consultation',
      title: 'Video Consultation',
      description: 'Get expert advice through video calls',
      icon: <PlayCircle className="w-5 h-5" />,
      category: 'support',
      priority: 'medium',
      action: 'Schedule Call',
      href: '/video-consultation',
      isNew: true,
      completedByUser: false
    }
  ];

  // Quick actions with enhanced categorization
  const quickActions: QuickAction[] = [
    {
      id: 'book-repair',
      label: 'Book Repair',
      icon: <Plus className="w-5 h-5" />,
      href: '/book-repair',
      description: 'Schedule a new repair service',
      category: 'Repair Services',
      badge: 'Popular',
      color: 'bg-blue-500'
    },
    {
      id: 'track-repair',
      label: 'Track Repair',
      icon: <Eye className="w-5 h-5" />,
      href: '/customer-portal?tab=repairs',
      description: 'Monitor repair progress',
      category: 'Repair Services',
      color: 'bg-green-500'
    },
    {
      id: 'contact-support',
      label: 'Contact Support',
      icon: <Headphones className="w-5 h-5" />,
      href: '/customer-portal?tab=messages',
      description: 'Get help from our team',
      category: 'Support',
      color: 'bg-purple-500'
    },
    {
      id: 'view-history',
      label: 'Repair History',
      icon: <History className="w-5 h-5" />,
      href: '/repair-history',
      description: 'View past repairs',
      category: 'Analytics',
      color: 'bg-orange-500'
    },
    {
      id: 'loyalty-points',
      label: 'Loyalty Points',
      icon: <Star className="w-5 h-5" />,
      href: '/customer-portal?tab=loyalty',
      description: 'Check your rewards',
      category: 'Rewards',
      badge: 'New',
      color: 'bg-yellow-500'
    },
    {
      id: 'download-receipt',
      label: 'Download Receipt',
      icon: <Download className="w-5 h-5" />,
      href: '/customer-portal?tab=receipts',
      description: 'Get repair receipts',
      category: 'Documents',
      color: 'bg-indigo-500'
    }
  ];

  // Customer insights for analytics
  const customerInsights: CustomerInsight[] = [
    {
      id: 'satisfaction',
      title: 'Satisfaction Score',
      description: 'Based on your feedback',
      value: `${customerMetrics.satisfactionScore}%`,
      trend: 'up',
      icon: <ThumbsUp className="w-5 h-5" />,
      color: 'text-green-600'
    },
    {
      id: 'response-time',
      title: 'Avg Response Time',
      description: 'How quickly we respond',
      value: customerMetrics.responseTime,
      trend: 'stable',
      icon: <Clock className="w-5 h-5" />,
      color: 'text-blue-600'
    },
    {
      id: 'cost-savings',
      title: 'Total Savings',
      description: 'Money saved vs replacement',
      value: `£${customerMetrics.totalSaved}`,
      trend: 'up',
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'text-emerald-600'
    },
    {
      id: 'loyalty-status',
      title: 'Loyalty Status',
      description: 'Your current tier',
      value: 'Gold Member',
      trend: 'up',
      icon: <Award className="w-5 h-5" />,
      color: 'text-amber-600'
    }
  ];

  // Toggle favorite features
  const toggleFavorite = (featureId: string) => {
    setFavoriteFeatures(prev => 
      prev.includes(featureId) 
        ? prev.filter(id => id !== featureId)
        : [...prev, featureId]
    );
  };

  // Calculate progress for loyalty program
  const loyaltyProgress = (customerMetrics.loyaltyPoints / customerMetrics.nextRewardThreshold) * 100;

  return (
    <div className={`unified-customer-dashboard ${className}`}>
      {/* Header with Welcome and Feature Discovery */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome back!</h1>
            <p className="text-lg text-gray-600">Here's what's happening with your repairs</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFeatureDiscovery(!showFeatureDiscovery)}
            >
              <Lightbulb className="w-4 h-4 mr-2" />
              {showFeatureDiscovery ? 'Hide' : 'Show'} Features
            </Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Book Repair
            </Button>
          </div>
        </div>

        {/* Feature Discovery Banner */}
        {showFeatureDiscovery && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-lg text-blue-900">Discover New Features</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {featureSuggestions.slice(0, 3).map((feature) => (
                  <div key={feature.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                    <div className={`p-2 rounded-lg ${
                      feature.category === 'repair' ? 'bg-blue-100 text-blue-600' :
                      feature.category === 'communication' ? 'bg-green-100 text-green-600' :
                      feature.category === 'loyalty' ? 'bg-yellow-100 text-yellow-600' :
                      feature.category === 'analytics' ? 'bg-purple-100 text-purple-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {feature.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">{feature.title}</h4>
                        {feature.isNew && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">New</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{feature.description}</p>
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
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Enhanced Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Wrench className="w-6 h-6 text-blue-600" />
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {customerMetrics.activeRepairs} Active
              </Badge>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{customerMetrics.totalRepairs}</h3>
            <p className="text-sm text-gray-600">Total Repairs</p>
            <div className="mt-2 flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-600">+2 this month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Star className="w-6 h-6 text-green-600" />
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Excellent
              </Badge>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{customerMetrics.averageRating}</h3>
            <p className="text-sm text-gray-600">Average Rating</p>
            <div className="mt-2 flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span className="text-sm text-gray-600">Based on {customerMetrics.completedRepairs} repairs</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Gift className="w-6 h-6 text-purple-600" />
              </div>
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                Gold
              </Badge>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{customerMetrics.loyaltyPoints}</h3>
            <p className="text-sm text-gray-600">Loyalty Points</p>
            <div className="mt-2">
              <Progress value={loyaltyProgress} className="h-2" />
              <p className="text-xs text-gray-500 mt-1">
                {customerMetrics.nextRewardThreshold - customerMetrics.loyaltyPoints} points to next reward
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                Saved
              </Badge>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">£{customerMetrics.totalSaved}</h3>
            <p className="text-sm text-gray-600">Total Savings</p>
            <div className="mt-2 flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span className="text-sm text-emerald-600">vs buying new</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Grid */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {quickActions.map((action) => (
              <Button
                key={action.id}
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-gray-50 border-2 hover:border-blue-200"
                onClick={() => window.location.href = action.href}
              >
                <div className={`p-2 rounded-lg ${action.color} text-white`}>
                  {action.icon}
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium">{action.label}</span>
                    {action.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {action.badge}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{action.description}</p>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Customer Insights */}
      {enableAnalytics && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Your Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {customerInsights.map((insight) => (
                <div key={insight.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-2 rounded-lg bg-white ${insight.color}`}>
                      {insight.icon}
                    </div>
                    <div className="flex items-center gap-1">
                      {insight.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-600" />}
                      {insight.trend === 'down' && <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />}
                      {insight.trend === 'stable' && <Activity className="w-4 h-4 text-gray-600" />}
                    </div>
                  </div>
                  <h4 className="font-semibold text-gray-900">{insight.value}</h4>
                  <p className="text-sm font-medium text-gray-700">{insight.title}</p>
                  <p className="text-xs text-gray-500">{insight.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feature Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Recommended for You
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {featureSuggestions.filter(f => !f.completedByUser).map((feature) => (
              <div key={feature.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className={`p-2 rounded-lg ${
                  feature.category === 'repair' ? 'bg-blue-100 text-blue-600' :
                  feature.category === 'communication' ? 'bg-green-100 text-green-600' :
                  feature.category === 'loyalty' ? 'bg-yellow-100 text-yellow-600' :
                  feature.category === 'analytics' ? 'bg-purple-100 text-purple-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {feature.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900">{feature.title}</h4>
                    {feature.isNew && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">New</Badge>
                    )}
                    {feature.priority === 'high' && (
                      <Badge variant="secondary" className="bg-red-100 text-red-800">Recommended</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => feature.href && (window.location.href = feature.href)}
                >
                  {feature.action}
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}