/**
 * Analytics Shortcuts Component
 * Quick access to analytics features from any admin page
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
// import { motion } from 'framer-motion'; // Temporarily disabled
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  Clock,
  Star,
  PieChart,
  Target,
  Zap,
  Eye,
  Download,
  Share,
  Settings,
  ExternalLink,
  ChevronRight,
  Calendar,
  Filter,
  AlertCircle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

interface AnalyticsShortcutsProps {
  className?: string;
  variant?: 'grid' | 'list' | 'compact';
  showQuickStats?: boolean;
  showActions?: boolean;
  showAlerts?: boolean;
}

interface ShortcutItem {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  bgColor: string;
  href: string;
  isExternal?: boolean;
  badge?: string;
  badgeColor?: string;
  quickStat?: {
    value: string;
    change: string;
    changeType: 'positive' | 'negative' | 'neutral';
  };
}

interface QuickAction {
  id: string;
  title: string;
  icon: any;
  color: string;
  onClick: () => void;
}

interface AlertItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  icon: any;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const AnalyticsShortcuts: React.FC<AnalyticsShortcutsProps> = ({
  className = '',
  variant = 'grid',
  showQuickStats = true,
  showActions = true,
  showAlerts = true,
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'today' | 'week' | 'month'>('today');

  // Analytics shortcuts
  const shortcuts: ShortcutItem[] = [
    {
      id: 'revenue-analytics',
      title: 'Revenue Analytics',
      description: 'Track income, profits, and financial trends',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      href: '/admin/analytics?tab=revenue',
      badge: 'Live',
      badgeColor: 'bg-green-100 text-green-800',
      quickStat: {
        value: '£12,450',
        change: '+18%',
        changeType: 'positive'
      }
    },
    {
      id: 'customer-analytics',
      title: 'Customer Analytics',
      description: 'Customer behavior, satisfaction, and retention',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      href: '/admin/analytics?tab=customers',
      badge: 'Updated',
      badgeColor: 'bg-blue-100 text-blue-800',
      quickStat: {
        value: '1,234',
        change: '+7%',
        changeType: 'positive'
      }
    },
    {
      id: 'repair-analytics',
      title: 'Repair Analytics',
      description: 'Repair times, success rates, and queue analysis',
      icon: Activity,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      href: '/admin/analytics?tab=repairs',
      quickStat: {
        value: '94%',
        change: '+2%',
        changeType: 'positive'
      }
    },
    {
      id: 'performance-analytics',
      title: 'Performance Analytics',
      description: 'Team productivity and efficiency metrics',
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      href: '/admin/analytics?tab=performance',
      quickStat: {
        value: '2.3h',
        change: '-15min',
        changeType: 'positive'
      }
    },
    {
      id: 'business-intelligence',
      title: 'Business Intelligence',
      description: 'Advanced insights and predictive analytics',
      icon: PieChart,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      href: '/admin/analytics?tab=business-intelligence',
      badge: 'AI',
      badgeColor: 'bg-indigo-100 text-indigo-800',
      quickStat: {
        value: '87%',
        change: '+5%',
        changeType: 'positive'
      }
    },
    {
      id: 'real-time-dashboard',
      title: 'Real-time Dashboard',
      description: 'Live monitoring and instant updates',
      icon: Eye,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      href: '/admin/analytics?tab=realtime',
      badge: 'Live',
      badgeColor: 'bg-red-100 text-red-800',
      quickStat: {
        value: '24',
        change: '+3',
        changeType: 'positive'
      }
    },
  ];

  // Quick actions
  const quickActions: QuickAction[] = [
    {
      id: 'export-report',
      title: 'Export Report',
      icon: Download,
      color: 'text-blue-600',
      onClick: () => console.log('Export report')
    },
    {
      id: 'share-dashboard',
      title: 'Share Dashboard',
      icon: Share,
      color: 'text-green-600',
      onClick: () => console.log('Share dashboard')
    },
    {
      id: 'analytics-settings',
      title: 'Analytics Settings',
      icon: Settings,
      color: 'text-gray-600',
      onClick: () => console.log('Analytics settings')
    },
    {
      id: 'schedule-report',
      title: 'Schedule Report',
      icon: Calendar,
      color: 'text-purple-600',
      onClick: () => console.log('Schedule report')
    },
  ];

  // Alerts and notifications
  const alerts: AlertItem[] = [
    {
      id: 'revenue-spike',
      title: 'Revenue Spike Detected',
      message: 'Daily revenue increased by 25% compared to last week',
      type: 'success',
      icon: TrendingUp,
      action: {
        label: 'View Details',
        onClick: () => console.log('View revenue details')
      }
    },
    {
      id: 'queue-warning',
      title: 'Repair Queue Alert',
      message: 'Queue length is above normal threshold (15+ items)',
      type: 'warning',
      icon: AlertCircle,
      action: {
        label: 'View Queue',
        onClick: () => console.log('View repair queue')
      }
    },
    {
      id: 'satisfaction-high',
      title: 'High Customer Satisfaction',
      message: 'Customer satisfaction reached 96% this week',
      type: 'success',
      icon: Star,
      action: {
        label: 'View Reviews',
        onClick: () => console.log('View customer reviews')
      }
    },
  ];

  // Timeframe options
  const timeframeOptions = [
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
  ];

  // Render functions
  const renderShortcut = (shortcut: ShortcutItem, index: number) => (
    <div
      key={shortcut.id}
      className={cn(
        'group relative overflow-hidden',
        variant === 'compact' ? 'bg-white border rounded-lg p-3' : 'bg-white border rounded-lg p-4'
      )}
    >
      <Link href={shortcut.href} className="block h-full">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2 rounded-lg ${shortcut.bgColor}`}>
            <shortcut.icon className={`w-5 h-5 ${shortcut.color}`} />
          </div>
          <div className="flex items-center gap-2">
            {shortcut.badge && (
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${shortcut.badgeColor}`}>
                {shortcut.badge}
              </span>
            )}
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
            {shortcut.title}
          </h3>
          <p className="text-sm text-gray-500">{shortcut.description}</p>
          
          {showQuickStats && shortcut.quickStat && (
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="text-lg font-semibold">{shortcut.quickStat.value}</div>
              <div className={`text-sm font-medium flex items-center gap-1 ${
                shortcut.quickStat.changeType === 'positive' ? 'text-green-600' : 
                shortcut.quickStat.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {shortcut.quickStat.changeType === 'positive' ? 
                  <ArrowUpRight className="w-3 h-3" /> : 
                  <ArrowDownRight className="w-3 h-3" />
                }
                {shortcut.quickStat.change}
              </div>
            </div>
          )}
        </div>
      </Link>
    </div>
  );

  const renderAlert = (alert: AlertItem, index: number) => (
    <div
      key={alert.id}
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg border-l-4',
        alert.type === 'success' && 'bg-green-50 border-green-500',
        alert.type === 'warning' && 'bg-yellow-50 border-yellow-500',
        alert.type === 'error' && 'bg-red-50 border-red-500',
        alert.type === 'info' && 'bg-blue-50 border-blue-500'
      )}
    >
      <alert.icon className={cn(
        'w-5 h-5 mt-0.5',
        alert.type === 'success' && 'text-green-600',
        alert.type === 'warning' && 'text-yellow-600',
        alert.type === 'error' && 'text-red-600',
        alert.type === 'info' && 'text-blue-600'
      )} />
      <div className="flex-1">
        <div className="font-medium text-gray-900">{alert.title}</div>
        <div className="text-sm text-gray-600 mt-1">{alert.message}</div>
        {alert.action && (
          <Button
            variant="outline"
            size="sm"
            className="mt-2 h-7 px-3 text-xs"
            onClick={alert.action.onClick}
          >
            {alert.action.label}
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Analytics Hub</h2>
          <p className="text-sm text-gray-500">Quick access to insights and reports</p>
        </div>
        <div className="flex items-center gap-2">
          {timeframeOptions.map(option => (
            <Button
              key={option.id}
              variant={selectedTimeframe === option.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTimeframe(option.id as any)}
              className="h-8 px-3 text-xs"
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Shortcuts Grid */}
      <div className={cn(
        'grid gap-4',
        variant === 'grid' && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        variant === 'list' && 'grid-cols-1',
        variant === 'compact' && 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
      )}>
        {shortcuts.map((shortcut, index) => renderShortcut(shortcut, index))}
      </div>

      {/* Quick Actions */}
      {showActions && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action) => (
                <Button
                  key={action.id}
                  variant="outline"
                  size="sm"
                  onClick={action.onClick}
                  className="h-8 px-3 text-xs"
                >
                  <action.icon className={`w-3 h-3 mr-1 ${action.color}`} />
                  {action.title}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts */}
      {showAlerts && alerts.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Analytics Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert, index) => renderAlert(alert, index))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AnalyticsShortcuts;