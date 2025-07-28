import React from 'react';
import { cn } from '@/lib/utils';
import Card from '@/components/ui/Card';

interface ActivityItem {
  id: string;
  type: 'repair' | 'customer' | 'inventory' | 'system' | 'payment';
  title: string;
  description: string;
  timestamp: Date;
  user?: string;
  metadata?: {
    repairId?: string;
    customerId?: string;
    amount?: number;
    priority?: 'low' | 'medium' | 'high';
  };
}

interface RecentActivityProps {
  activities?: ActivityItem[];
  loading?: boolean;
  maxItems?: number;
  className?: string;
}

const activityConfig = {
  repair: {
    icon: '🔧',
    color: 'bg-blue-100 text-blue-800',
    label: 'Repair',
  },
  customer: {
    icon: '👤',
    color: 'bg-green-100 text-green-800',
    label: 'Customer',
  },
  inventory: {
    icon: '📦',
    color: 'bg-orange-100 text-orange-800',
    label: 'Inventory',
  },
  system: {
    icon: '⚙️',
    color: 'bg-gray-100 text-gray-800',
    label: 'System',
  },
  payment: {
    icon: '💰',
    color: 'bg-emerald-100 text-emerald-800',
    label: 'Payment',
  },
};

const mockActivities: ActivityItem[] = [
  {
    id: 'ACT-001',
    type: 'repair',
    title: 'Repair Status Updated',
    description: 'MacBook Pro 16" M3 2023 repair moved to "In Progress"',
    timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
    user: 'Sarah Chen',
    metadata: {
      repairId: 'REP-001',
      priority: 'high',
    },
  },
  {
    id: 'ACT-002',
    type: 'customer',
    title: 'New Customer Registration',
    description: 'Emma Thompson registered for repair services',
    timestamp: new Date(Date.now() - 32 * 60 * 1000), // 32 minutes ago
    user: 'System',
    metadata: {
      customerId: 'CUST-456',
    },
  },
  {
    id: 'ACT-003',
    type: 'payment',
    title: 'Payment Received',
    description: 'iPhone 15 Pro screen replacement payment confirmed',
    timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
    user: 'Mike Johnson',
    metadata: {
      amount: 180,
      repairId: 'REP-002',
    },
  },
  {
    id: 'ACT-004',
    type: 'inventory',
    title: 'Low Stock Alert',
    description: 'MacBook Pro 16" LCD screens running low (2 remaining)',
    timestamp: new Date(Date.now() - 68 * 60 * 1000), // 1 hour ago
    user: 'System',
    metadata: {
      priority: 'medium',
    },
  },
  {
    id: 'ACT-005',
    type: 'repair',
    title: 'Repair Completed',
    description: 'iPad Air 5th Gen battery replacement finished',
    timestamp: new Date(Date.now() - 95 * 60 * 1000), // 1.5 hours ago
    user: 'Alex Rodriguez',
    metadata: {
      repairId: 'REP-004',
    },
  },
  {
    id: 'ACT-006',
    type: 'customer',
    title: 'Customer Inquiry',
    description: 'Robert Brown contacted about Samsung Galaxy S24 repair',
    timestamp: new Date(Date.now() - 120 * 60 * 1000), // 2 hours ago
    user: 'Live Chat',
  },
  {
    id: 'ACT-007',
    type: 'system',
    title: 'Backup Completed',
    description: 'Daily database backup completed successfully',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    user: 'System',
  },
  {
    id: 'ACT-008',
    type: 'inventory',
    title: 'Parts Restocked',
    description: 'iPhone 15 Pro screens and batteries added to inventory',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    user: 'Sarah Chen',
  },
];

const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }
};

export const RecentActivity: React.FC<RecentActivityProps> = ({
  activities = mockActivities,
  loading = false,
  maxItems = 8,
  className,
}) => {
  const displayedActivities = activities.slice(0, maxItems);

  if (loading) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="space-y-4">
          <div className="h-6 bg-muted rounded w-32 animate-pulse"></div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 animate-pulse">
                <div className="w-8 h-8 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
                <div className="h-3 bg-muted rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('p-6', className)}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Recent Activity</h3>
            <p className="text-sm text-muted-foreground">
              Latest updates across your repair shop
            </p>
          </div>
          <button className="text-sm text-primary hover:underline">
            View All
          </button>
        </div>

        <div className="space-y-4">
          {displayedActivities.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📝</div>
              <h4 className="font-medium mb-2">No recent activity</h4>
              <p className="text-sm text-muted-foreground">
                Activities will appear here as they happen
              </p>
            </div>
          ) : (
            displayedActivities.map((activity, index) => {
              const config = activityConfig[activity.type];
              
              return (
                <div key={activity.id} className="relative">
                  {/* Timeline line */}
                  {index < displayedActivities.length - 1 && (
                    <div className="absolute left-4 top-8 w-px h-8 bg-border"></div>
                  )}
                  
                  <div className="flex items-start gap-3">
                    {/* Activity Icon */}
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0',
                      config.color
                    )}>
                      {config.icon}
                    </div>

                    {/* Activity Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-medium truncate">
                          {activity.title}
                        </h4>
                        <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                          {formatTimeAgo(activity.timestamp)}
                        </span>
                      </div>
                      
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {activity.description}
                      </p>

                      {/* Metadata */}
                      <div className="flex items-center gap-3 text-xs">
                        {activity.user && activity.user !== 'System' && (
                          <span className="text-muted-foreground">
                            👤 {activity.user}
                          </span>
                        )}
                        
                        {activity.metadata?.amount && (
                          <span className="text-green-600 font-medium">
                            💰 £{activity.metadata.amount}
                          </span>
                        )}
                        
                        {activity.metadata?.priority && (
                          <span className={cn(
                            'px-2 py-1 rounded-full text-xs font-medium',
                            activity.metadata.priority === 'high' && 'bg-red-100 text-red-800',
                            activity.metadata.priority === 'medium' && 'bg-yellow-100 text-yellow-800',
                            activity.metadata.priority === 'low' && 'bg-green-100 text-green-800'
                          )}>
                            {activity.metadata.priority}
                          </span>
                        )}

                        {activity.metadata?.repairId && (
                          <span className="text-muted-foreground font-mono">
                            {activity.metadata.repairId}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {activities.length > maxItems && (
          <div className="border-t pt-4">
            <button className="w-full text-sm text-primary hover:underline">
              Show {activities.length - maxItems} more activities
            </button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default RecentActivity;