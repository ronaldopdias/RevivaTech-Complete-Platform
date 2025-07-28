'use client';

import React, { useEffect, useState } from 'react';
import { TrendingUp, Search, Users, Target, Clock, MousePointer } from 'lucide-react';
import { Card } from '@/components/ui/Card';

interface SearchMetrics {
  totalSearches: number;
  uniqueUsers: number;
  avgSessionDuration: number;
  conversionRate: number;
  popularQueries: Array<{
    query: string;
    count: number;
    conversionRate: number;
  }>;
  searchTrends: Array<{
    date: string;
    searches: number;
    conversions: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    percentage: number;
    count: number;
  }>;
}

interface SearchEvent {
  id: string;
  userId: string;
  sessionId: string;
  query: string;
  category?: string;
  timestamp: Date;
  resultCount: number;
  clickedResult?: {
    id: string;
    type: string;
    position: number;
  };
  converted: boolean;
  conversionValue?: number;
  timeToConversion?: number; // milliseconds
}

class SearchAnalyticsTracker {
  private events: SearchEvent[] = [];
  private sessionId: string;
  private userId: string;
  private currentSearchStartTime?: number;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.userId = this.getUserId();
    this.loadStoredEvents();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getUserId(): string {
    let userId = localStorage.getItem('revivatech-user-id');
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('revivatech-user-id', userId);
    }
    return userId;
  }

  private loadStoredEvents(): void {
    const stored = localStorage.getItem('revivatech-search-events');
    if (stored) {
      try {
        this.events = JSON.parse(stored).map((event: any) => ({
          ...event,
          timestamp: new Date(event.timestamp)
        }));
      } catch (e) {
        // Ignore invalid JSON
      }
    }
  }

  private saveEvents(): void {
    // Keep only last 1000 events to prevent storage bloat
    const eventsToStore = this.events.slice(-1000);
    localStorage.setItem('revivatech-search-events', JSON.stringify(eventsToStore));
  }

  trackSearch(query: string, resultCount: number, category?: string): string {
    const eventId = `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.currentSearchStartTime = Date.now();
    
    const event: SearchEvent = {
      id: eventId,
      userId: this.userId,
      sessionId: this.sessionId,
      query: query.toLowerCase().trim(),
      category,
      timestamp: new Date(),
      resultCount,
      converted: false
    };

    this.events.push(event);
    this.saveEvents();
    
    // Send to analytics service (in real implementation)
    this.sendToAnalyticsService(event);
    
    return eventId;
  }

  trackResultClick(searchEventId: string, resultId: string, resultType: string, position: number): void {
    const event = this.events.find(e => e.id === searchEventId);
    if (event) {
      event.clickedResult = {
        id: resultId,
        type: resultType,
        position
      };
      this.saveEvents();
      this.sendToAnalyticsService(event);
    }
  }

  trackConversion(searchEventId: string, conversionValue?: number): void {
    const event = this.events.find(e => e.id === searchEventId);
    if (event && this.currentSearchStartTime) {
      event.converted = true;
      event.conversionValue = conversionValue;
      event.timeToConversion = Date.now() - this.currentSearchStartTime;
      this.saveEvents();
      this.sendToAnalyticsService(event);
    }
  }

  private sendToAnalyticsService(event: SearchEvent): void {
    // In real implementation, send to your analytics backend
    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics Event:', event);
    }
    
    // Example: Send to your backend API
    // fetch('/api/analytics/search', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(event)
    // });
  }

  getMetrics(): SearchMetrics {
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentEvents = this.events.filter(e => e.timestamp >= last30Days);

    // Calculate popular queries
    const queryCount = new Map<string, { count: number; conversions: number }>();
    recentEvents.forEach(event => {
      const current = queryCount.get(event.query) || { count: 0, conversions: 0 };
      current.count++;
      if (event.converted) current.conversions++;
      queryCount.set(event.query, current);
    });

    const popularQueries = Array.from(queryCount.entries())
      .map(([query, data]) => ({
        query,
        count: data.count,
        conversionRate: data.count > 0 ? (data.conversions / data.count) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate category breakdown
    const categoryCount = new Map<string, number>();
    recentEvents.forEach(event => {
      if (event.category) {
        const current = categoryCount.get(event.category) || 0;
        categoryCount.set(event.category, current + 1);
      }
    });

    const totalCategorized = Array.from(categoryCount.values()).reduce((sum, count) => sum + count, 0);
    const categoryBreakdown = Array.from(categoryCount.entries())
      .map(([category, count]) => ({
        category,
        count,
        percentage: totalCategorized > 0 ? (count / totalCategorized) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);

    // Calculate trends (last 7 days)
    const trends: Array<{ date: string; searches: number; conversions: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      
      const dayEvents = recentEvents.filter(e => e.timestamp >= dayStart && e.timestamp < dayEnd);
      
      trends.push({
        date: date.toISOString().split('T')[0],
        searches: dayEvents.length,
        conversions: dayEvents.filter(e => e.converted).length
      });
    }

    // Calculate metrics
    const uniqueUsers = new Set(recentEvents.map(e => e.userId)).size;
    const totalConversions = recentEvents.filter(e => e.converted).length;
    const conversionRate = recentEvents.length > 0 ? (totalConversions / recentEvents.length) * 100 : 0;
    
    const sessionsWithTime = recentEvents
      .filter(e => e.timeToConversion)
      .map(e => e.timeToConversion!);
    const avgSessionDuration = sessionsWithTime.length > 0 
      ? sessionsWithTime.reduce((sum, time) => sum + time, 0) / sessionsWithTime.length
      : 0;

    return {
      totalSearches: recentEvents.length,
      uniqueUsers,
      avgSessionDuration: Math.round(avgSessionDuration / 1000), // Convert to seconds
      conversionRate: Math.round(conversionRate * 100) / 100,
      popularQueries,
      searchTrends: trends,
      categoryBreakdown
    };
  }

  clearData(): void {
    this.events = [];
    localStorage.removeItem('revivatech-search-events');
  }
}

// Global instance
export const searchAnalytics = new SearchAnalyticsTracker();

interface SearchAnalyticsDashboardProps {
  className?: string;
}

export function SearchAnalyticsDashboard({ className = "" }: SearchAnalyticsDashboardProps) {
  const [metrics, setMetrics] = useState<SearchMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const updateMetrics = () => {
      setMetrics(searchAnalytics.getMetrics());
      setIsLoading(false);
    };

    updateMetrics();
    
    // Update metrics every 30 seconds
    const interval = setInterval(updateMetrics, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (isLoading || !metrics) {
    return (
      <div className={`${className} animate-pulse`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-4">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className={className}>
      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Searches</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalSearches.toLocaleString()}</p>
            </div>
            <Search className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Unique Users</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.uniqueUsers.toLocaleString()}</p>
            </div>
            <Users className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.conversionRate}%</p>
            </div>
            <Target className="w-8 h-8 text-purple-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Session</p>
              <p className="text-2xl font-bold text-gray-900">{formatDuration(metrics.avgSessionDuration)}</p>
            </div>
            <Clock className="w-8 h-8 text-orange-500" />
          </div>
        </Card>
      </div>

      {/* Popular Queries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Popular Queries</h3>
            <TrendingUp className="w-5 h-5 text-blue-500" />
          </div>
          <div className="space-y-3">
            {metrics.popularQueries.slice(0, 8).map((query, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{query.query}</p>
                  <p className="text-xs text-gray-500">{query.count} searches</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-green-600">{query.conversionRate.toFixed(1)}%</p>
                  <p className="text-xs text-gray-500">conversion</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Category Breakdown */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Search Categories</h3>
            <MousePointer className="w-5 h-5 text-purple-500" />
          </div>
          <div className="space-y-3">
            {metrics.categoryBreakdown.map((category, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 capitalize">
                    {category.category.replace('_', ' ')}
                  </p>
                  <p className="text-sm text-gray-600">{category.percentage.toFixed(1)}%</p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(category.percentage, 2)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Search Trends */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Search Trends (Last 7 Days)</h3>
          <TrendingUp className="w-5 h-5 text-green-500" />
        </div>
        <div className="flex items-end space-x-2 h-48">
          {metrics.searchTrends.map((day, index) => {
            const maxSearches = Math.max(...metrics.searchTrends.map(d => d.searches));
            const height = maxSearches > 0 ? (day.searches / maxSearches) * 100 : 0;
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="flex flex-col items-center space-y-1 mb-2">
                  <div 
                    className="bg-blue-500 rounded-t transition-all duration-300 min-h-[4px]"
                    style={{ height: `${Math.max(height, 4)}%`, width: '20px' }}
                  ></div>
                  <div className="text-xs text-gray-600 text-center">
                    <div>{day.searches}</div>
                    <div className="text-green-600">{day.conversions}</div>
                  </div>
                </div>
                <div className="text-xs text-gray-500 text-center">
                  {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-center space-x-4 mt-4 text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>Searches</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Conversions</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Hook for using search analytics in components
export function useSearchAnalytics() {
  const trackSearch = (query: string, resultCount: number, category?: string) => {
    return searchAnalytics.trackSearch(query, resultCount, category);
  };

  const trackResultClick = (searchEventId: string, resultId: string, resultType: string, position: number) => {
    searchAnalytics.trackResultClick(searchEventId, resultId, resultType, position);
  };

  const trackConversion = (searchEventId: string, conversionValue?: number) => {
    searchAnalytics.trackConversion(searchEventId, conversionValue);
  };

  const getMetrics = () => {
    return searchAnalytics.getMetrics();
  };

  return {
    trackSearch,
    trackResultClick,
    trackConversion,
    getMetrics
  };
}