import React from 'react';
import { cn } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  href?: string;
  onClick?: () => void;
  count?: number;
  badge?: {
    text: string;
    type: 'info' | 'warning' | 'success' | 'error';
  };
  disabled?: boolean;
}

interface QuickActionsProps {
  actions?: QuickAction[];
  onActionClick?: (actionId: string) => void;
  className?: string;
}

const defaultActions: QuickAction[] = [
  {
    id: 'new-repair',
    title: 'New Repair Ticket',
    description: 'Create a new repair request',
    icon: '🔧',
    href: '/admin/repairs/new',
  },
  {
    id: 'customer-lookup',
    title: 'Customer Lookup',
    description: 'Search customer database',
    icon: '🔍',
    href: '/admin/customers/search',
  },
  {
    id: 'inventory-check',
    title: 'Check Inventory',
    description: 'View parts availability',
    icon: '📦',
    href: '/admin/inventory',
    badge: {
      text: '3 low',
      type: 'warning',
    },
  },
  {
    id: 'daily-report',
    title: 'Daily Report',
    description: 'Generate today\'s summary',
    icon: '📊',
    onClick: () => console.log('Generate report'),
  },
  {
    id: 'pending-quotes',
    title: 'Pending Quotes',
    description: 'Review awaiting approval',
    icon: '📋',
    href: '/admin/quotes',
    count: 5,
    badge: {
      text: 'Action needed',
      type: 'info',
    },
  },
  {
    id: 'schedule-technician',
    title: 'Schedule Technician',
    description: 'Assign repairs to staff',
    icon: '👥',
    href: '/admin/schedule',
  },
  {
    id: 'backup-data',
    title: 'Backup Data',
    description: 'Export customer data',
    icon: '💾',
    onClick: () => console.log('Start backup'),
  },
  {
    id: 'send-notifications',
    title: 'Send Notifications',
    description: 'Bulk customer updates',
    icon: '📧',
    href: '/admin/notifications',
  },
];

const badgeColors = {
  info: 'bg-blue-100 text-blue-800',
  warning: 'bg-yellow-100 text-yellow-800',
  success: 'bg-green-100 text-green-800',
  error: 'bg-red-100 text-red-800',
};

export const QuickActions: React.FC<QuickActionsProps> = ({
  actions = defaultActions,
  onActionClick,
  className,
}) => {
  const handleActionClick = (action: QuickAction) => {
    if (action.disabled) return;
    
    if (action.onClick) {
      action.onClick();
    } else if (action.href) {
      window.location.href = action.href;
    }
    
    if (onActionClick) {
      onActionClick(action.id);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div>
        <h3 className="text-lg font-semibold mb-2">Quick Actions</h3>
        <p className="text-sm text-muted-foreground">
          Common tasks and shortcuts for your workflow
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action) => (
          <Card
            key={action.id}
            className={cn(
              'p-4 cursor-pointer transition-all hover:shadow-md border-2',
              action.disabled 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:border-primary/50'
            )}
            onClick={() => handleActionClick(action)}
          >
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-xl">
                  {action.icon}
                </div>
                
                <div className="flex flex-col items-end gap-1">
                  {action.count !== undefined && (
                    <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold bg-primary text-primary-foreground rounded-full">
                      {action.count > 99 ? '99+' : action.count}
                    </span>
                  )}
                  
                  {action.badge && (
                    <span className={cn(
                      'px-2 py-1 text-xs font-medium rounded-full',
                      badgeColors[action.badge.type]
                    )}>
                      {action.badge.text}
                    </span>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="space-y-1">
                <h4 className="font-medium text-sm leading-tight">
                  {action.title}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {action.description}
                </p>
              </div>

              {/* Action Indicator */}
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  {action.href ? '→ Navigate' : '⚡ Execute'}
                </div>
                {!action.disabled && (
                  <div className="w-4 h-4 text-primary">
                    →
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Additional Actions */}
      <Card className="p-4 bg-muted/50">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-sm mb-1">Need something else?</h4>
            <p className="text-xs text-muted-foreground">
              Access all admin functions from the sidebar menu
            </p>
          </div>
          <Button variant="outline" size="sm">
            View All Features
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default QuickActions;