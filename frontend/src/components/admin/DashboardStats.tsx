import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import Card from '@/components/ui/Card';
import { useServices } from '@/lib/services/serviceFactory';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string;
    type: 'increase' | 'decrease' | 'neutral';
  };
  icon: string;
  description?: string;
  loading?: boolean;
}

interface DashboardStatsProps {
  stats?: {
    totalRepairs: number;
    activeRepairs: number;
    completedToday: number;
    revenue: number;
    avgRepairTime: string;
    customerSatisfaction: number;
    pendingQuotes: number;
    lowStock: number;
  };
  loading?: boolean;
  className?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  icon,
  description,
  loading = false,
}) => {
  if (loading) {
    return (
      <Card className="p-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-24"></div>
            <div className="h-8 bg-muted rounded w-16"></div>
            <div className="h-3 bg-muted rounded w-20"></div>
          </div>
          <div className="w-12 h-12 bg-muted rounded-full"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 transition-all hover:shadow-md">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="space-y-1">
            <p className="text-2xl font-bold">{value}</p>
            {change && (
              <div className="flex items-center space-x-1 text-xs">
                <span className={cn(
                  'inline-flex items-center gap-1',
                  change.type === 'increase' && 'text-green-600',
                  change.type === 'decrease' && 'text-red-600',
                  change.type === 'neutral' && 'text-muted-foreground'
                )}>
                  {change.type === 'increase' && '↗'}
                  {change.type === 'decrease' && '↘'}
                  {change.type === 'neutral' && '→'}
                  {change.value}
                </span>
                <span className="text-muted-foreground">from last week</span>
              </div>
            )}
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-2xl">
          {icon}
        </div>
      </div>
    </Card>
  );
};

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  stats,
  loading: propLoading = false,
  className,
}) => {
  const [realStats, setRealStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { booking } = useServices();

  // Fetch real statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await booking.getBookingStatistics();
        
        // Transform API response to match component interface
        const apiStats = response.data.stats;
        const transformedStats = {
          totalRepairs: apiStats.total_bookings || 0,
          activeRepairs: apiStats.in_progress_bookings || 0,
          completedToday: apiStats.completed_today || 0,
          revenue: apiStats.total_revenue || 0,
          avgRepairTime: apiStats.avg_repair_time || 'N/A',
          customerSatisfaction: apiStats.customer_satisfaction || 0,
          pendingQuotes: apiStats.pending_bookings || 0,
          lowStock: apiStats.low_stock_items || 0,
        };
        
        setRealStats(transformedStats);
      } catch (err: any) {
        console.error('Failed to fetch real stats:', err);
        setError(err.message);
        // Use defaults on error
        setRealStats({
          totalRepairs: 0,
          activeRepairs: 0,
          completedToday: 0,
          revenue: 0,
          avgRepairTime: 'N/A',
          customerSatisfaction: 0,
          pendingQuotes: 0,
          lowStock: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const defaultStats = {
    totalRepairs: 1247,
    activeRepairs: 23,
    completedToday: 8,
    revenue: 12450,
    avgRepairTime: '2.3 days',
    customerSatisfaction: 96,
    pendingQuotes: 5,
    lowStock: 3,
  };

  // Priority: passed stats > real fetched stats > default stats
  const currentStats = stats || realStats || defaultStats;
  const isLoading = propLoading || loading;

  const statsConfig = [
    {
      title: 'Total Repairs',
      value: currentStats.totalRepairs.toLocaleString(),
      change: { value: '+12%', type: 'increase' as const },
      icon: '🔧',
      description: 'All time repairs',
    },
    {
      title: 'Active Repairs',
      value: currentStats.activeRepairs,
      change: { value: '+3', type: 'increase' as const },
      icon: '⚡',
      description: 'Currently in progress',
    },
    {
      title: 'Completed Today',
      value: currentStats.completedToday,
      change: { value: '+2', type: 'increase' as const },
      icon: '✅',
      description: 'Finished repairs',
    },
    {
      title: 'Revenue',
      value: `£${currentStats.revenue.toLocaleString()}`,
      change: { value: '+8%', type: 'increase' as const },
      icon: '💰',
      description: 'This month',
    },
    {
      title: 'Avg Repair Time',
      value: currentStats.avgRepairTime,
      change: { value: '-0.5 days', type: 'increase' as const },
      icon: '⏱️',
      description: 'Getting faster',
    },
    {
      title: 'Satisfaction',
      value: `${currentStats.customerSatisfaction}%`,
      change: { value: '+2%', type: 'increase' as const },
      icon: '⭐',
      description: 'Customer rating',
    },
    {
      title: 'Pending Quotes',
      value: currentStats.pendingQuotes,
      change: { value: '-2', type: 'increase' as const },
      icon: '📋',
      description: 'Awaiting approval',
    },
    {
      title: 'Low Stock Items',
      value: currentStats.lowStock,
      change: { value: '+1', type: 'decrease' as const },
      icon: '📦',
      description: 'Need restocking',
    },
  ];

  return (
    <div className={cn('space-y-6', className)}>
      <div>
        <h3 className="text-lg font-semibold mb-2">Overview</h3>
        <p className="text-sm text-muted-foreground">
          Key performance metrics for your repair business
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsConfig.map((stat, index) => (
          <StatsCard
            key={index}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            icon={stat.icon}
            description={stat.description}
            loading={isLoading}
          />
        ))}
      </div>
      
      {/* Error indicator */}
      {error && !isLoading && (
        <div className="text-sm text-muted-foreground text-center">
          ⚠️ Using fallback data (API: {error})
        </div>
      )}
      
      {/* Real data indicator */}
      {realStats && !error && (
        <div className="text-sm text-green-600 text-center">
          ✅ Live data from RevivaTech API
        </div>
      )}
    </div>
  );
};

export default DashboardStats;