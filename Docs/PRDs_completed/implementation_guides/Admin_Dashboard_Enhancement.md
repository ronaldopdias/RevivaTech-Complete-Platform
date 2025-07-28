# Admin Dashboard Enhancement Documentation

## Overview

This document outlines comprehensive enhancements to the admin dashboard for Revivatech, focusing on integrating Chatwoot chat management, advanced customer insights, real-time analytics, and improved workflow automation. The enhanced dashboard will serve as the central command center for managing repairs, customers, agents, and business operations.

## Enhancement Objectives

### 1. Integrated Chat Management
- Embedded Chatwoot admin interface
- Real-time conversation monitoring
- Agent performance tracking
- Customer context integration

### 2. Advanced Analytics & Insights
- Real-time repair metrics
- Customer behavior analysis
- Revenue forecasting
- Performance dashboards

### 3. Workflow Automation
- Automated repair status updates
- Smart agent routing
- Predictive maintenance alerts
- Customer satisfaction tracking

### 4. Enhanced User Experience
- Nordic design system integration
- Responsive mobile interface
- Intuitive navigation
- Real-time notifications

## Architecture Overview

### Enhanced System Structure
```
┌─────────────────────────────────────────────────────────────┐
│                Enhanced Admin Dashboard                     │
├─────────────────────────────────────────────────────────────┤
│ Chat Management    │ Analytics Engine  │ Workflow Engine   │
│ ├── Chatwoot       │ ├── Real-time     │ ├── Automation    │
│ ├── Agent Routing  │ ├── Forecasting   │ ├── Notifications │
│ ├── Performance    │ ├── Customer      │ ├── Escalation    │
│ └── Integration    │ └── Business      │ └── Scheduling    │
├─────────────────────────────────────────────────────────────┤
│ Data Layer         │ Communication     │ External APIs     │
│ ├── PostgreSQL     │ ├── WebSocket     │ ├── CRM          │
│ ├── Redis Cache    │ ├── Push Notify   │ ├── Payment      │
│ ├── Analytics DB   │ ├── Email/SMS     │ ├── Analytics    │
│ └── File Storage   │ └── Webhooks      │ └── Monitoring   │
└─────────────────────────────────────────────────────────────┘
```

## Chat Management Integration

### Chatwoot Admin Interface

#### Embedded Dashboard Component
```typescript
// components/admin/chat/ChatwootAdminDashboard.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageCircle, Users, Clock, TrendingUp, Settings } from 'lucide-react';

interface ChatwootAdminProps {
  accountId: string;
  accessToken: string;
  baseUrl: string;
}

export const ChatwootAdminDashboard: React.FC<ChatwootAdminProps> = ({
  accountId,
  accessToken,
  baseUrl
}) => {
  const [metrics, setMetrics] = useState<ChatMetrics | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    fetchChatMetrics();
    const interval = setInterval(fetchChatMetrics, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchChatMetrics = async () => {
    try {
      const response = await fetch('/api/admin/chat/metrics');
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error('Failed to fetch chat metrics:', error);
    }
  };

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-white">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Chat Management</h2>
          <Button 
            variant="outline" 
            onClick={() => setIsFullscreen(false)}
          >
            Exit Fullscreen
          </Button>
        </div>
        <iframe
          src={`${baseUrl}/app/accounts/${accountId}/dashboard?auth_token=${accessToken}`}
          className="w-full h-full border-0"
          title="Chatwoot Admin Interface"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Chat Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="nordic-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Conversations</CardTitle>
            <MessageCircle className="h-4 w-4 text-nordic-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-nordic-text-primary">
              {metrics?.activeConversations || 0}
            </div>
            <p className="text-xs text-nordic-text-muted">
              +{metrics?.newConversationsToday || 0} today
            </p>
          </CardContent>
        </Card>

        <Card className="nordic-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online Agents</CardTitle>
            <Users className="h-4 w-4 text-nordic-green" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-nordic-text-primary">
              {metrics?.onlineAgents || 0}
            </div>
            <p className="text-xs text-nordic-text-muted">
              of {metrics?.totalAgents || 0} total
            </p>
          </CardContent>
        </Card>

        <Card className="nordic-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-nordic-orange" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-nordic-text-primary">
              {Math.round((metrics?.avgResponseTime || 0) / 60)}m
            </div>
            <p className="text-xs text-nordic-text-muted">
              Target: &lt;2 minutes
            </p>
          </CardContent>
        </Card>

        <Card className="nordic-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-nordic-purple" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-nordic-text-primary">
              {Math.round((metrics?.resolutionRate || 0) * 100)}%
            </div>
            <p className="text-xs text-nordic-text-muted">
              +5% from last week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chat Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="conversations">Conversations</TabsTrigger>
            <TabsTrigger value="agents">Agents</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(true)}
            >
              Full Interface
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`${baseUrl}/app/accounts/${accountId}/settings`, '_blank')}
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        <TabsContent value="overview" className="space-y-4">
          <ChatOverviewSection metrics={metrics} />
        </TabsContent>

        <TabsContent value="conversations" className="space-y-4">
          <LiveConversationsSection />
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          <AgentManagementSection />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <ChatReportsSection />
        </TabsContent>
      </Tabs>
    </div>
  );
};
```

#### Live Conversations Monitor
```typescript
// components/admin/chat/LiveConversationsSection.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MessageCircle, Clock, User, ArrowRight } from 'lucide-react';

interface Conversation {
  id: number;
  customer: {
    name: string;
    email: string;
    avatar?: string;
  };
  agent?: {
    name: string;
    avatar?: string;
  };
  status: 'open' | 'pending' | 'resolved';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  lastMessage: {
    content: string;
    createdAt: string;
  };
  waitingTime: number;
  messagesCount: number;
  repairContext?: {
    repairNumber: string;
    deviceType: string;
    status: string;
  };
}

export const LiveConversationsSection: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
    
    // Set up real-time updates
    const eventSource = new EventSource('/api/admin/chat/conversations/stream');
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setConversations(data.conversations);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/admin/chat/conversations');
      const data = await response.json();
      setConversations(data.conversations);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-nordic-red text-white';
      case 'high': return 'bg-nordic-orange text-white';
      case 'normal': return 'bg-nordic-gray-200 text-nordic-gray-700';
      case 'low': return 'bg-nordic-gray-100 text-nordic-gray-600';
      default: return 'bg-nordic-gray-200 text-nordic-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-nordic-green text-white';
      case 'pending': return 'bg-nordic-orange text-white';
      case 'resolved': return 'bg-nordic-gray-400 text-white';
      default: return 'bg-nordic-gray-400 text-white';
    }
  };

  const formatWaitingTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nordic-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageCircle className="h-5 w-5" />
          <span>Live Conversations</span>
          <Badge variant="outline">{conversations.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {conversations.length === 0 ? (
            <div className="text-center py-8 text-nordic-text-muted">
              No active conversations
            </div>
          ) : (
            conversations.map((conversation) => (
              <div
                key={conversation.id}
                className="flex items-center space-x-4 p-4 border border-nordic-border rounded-lg hover:border-nordic-primary-light transition-colors"
              >
                {/* Customer Avatar */}
                <Avatar className="h-10 w-10">
                  <AvatarImage src={conversation.customer.avatar} />
                  <AvatarFallback>
                    {conversation.customer.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>

                {/* Conversation Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="text-sm font-medium text-nordic-text-primary truncate">
                      {conversation.customer.name}
                    </p>
                    <Badge className={getPriorityColor(conversation.priority)}>
                      {conversation.priority}
                    </Badge>
                    <Badge className={getStatusColor(conversation.status)}>
                      {conversation.status}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-nordic-text-secondary truncate">
                    {conversation.lastMessage.content}
                  </p>
                  
                  {conversation.repairContext && (
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {conversation.repairContext.repairNumber}
                      </Badge>
                      <span className="text-xs text-nordic-text-muted">
                        {conversation.repairContext.deviceType} - {conversation.repairContext.status}
                      </span>
                    </div>
                  )}
                </div>

                {/* Agent Assignment */}
                <div className="flex items-center space-x-2">
                  {conversation.agent ? (
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={conversation.agent.avatar} />
                        <AvatarFallback className="text-xs">
                          {conversation.agent.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-nordic-text-secondary">
                        {conversation.agent.name}
                      </span>
                    </div>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      Unassigned
                    </Badge>
                  )}
                </div>

                {/* Timing Info */}
                <div className="flex items-center space-x-4 text-xs text-nordic-text-muted">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatWaitingTime(conversation.waitingTime)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageCircle className="h-3 w-3" />
                    <span>{conversation.messagesCount}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`/admin/chat/conversations/${conversation.id}`, '_blank')}
                  >
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
```

### Agent Performance Dashboard

#### Agent Analytics Component
```typescript
// components/admin/chat/AgentAnalytics.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { Clock, MessageCircle, Star, Target, TrendingUp, Users } from 'lucide-react';

interface AgentPerformance {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: 'online' | 'busy' | 'offline';
  stats: {
    conversationsToday: number;
    avgResponseTime: number;
    resolutionRate: number;
    customerSatisfaction: number;
    activeConversations: number;
    totalConversations: number;
    hoursOnline: number;
  };
  weeklyPerformance: Array<{
    day: string;
    conversations: number;
    responseTime: number;
    satisfaction: number;
  }>;
}

export const AgentAnalytics: React.FC = () => {
  const [agents, setAgents] = useState<AgentPerformance[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<'conversations' | 'responseTime' | 'satisfaction'>('conversations');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgentPerformance();
    const interval = setInterval(fetchAgentPerformance, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const fetchAgentPerformance = async () => {
    try {
      const response = await fetch('/api/admin/chat/agents/performance');
      const data = await response.json();
      setAgents(data.agents);
    } catch (error) {
      console.error('Failed to fetch agent performance:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-nordic-green';
      case 'busy': return 'bg-nordic-orange';
      case 'offline': return 'bg-nordic-gray-400';
      default: return 'bg-nordic-gray-400';
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  const getPerformanceColor = (value: number, type: 'responseTime' | 'satisfaction' | 'resolution') => {
    switch (type) {
      case 'responseTime':
        if (value <= 120) return 'text-nordic-green'; // ≤2 minutes
        if (value <= 300) return 'text-nordic-orange'; // ≤5 minutes
        return 'text-nordic-red';
      case 'satisfaction':
        if (value >= 4.5) return 'text-nordic-green';
        if (value >= 4.0) return 'text-nordic-orange';
        return 'text-nordic-red';
      case 'resolution':
        if (value >= 0.9) return 'text-nordic-green';
        if (value >= 0.8) return 'text-nordic-orange';
        return 'text-nordic-red';
      default:
        return 'text-nordic-text-primary';
    }
  };

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-32 bg-nordic-gray-100 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Agent Performance Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => (
          <Card key={agent.id} className="nordic-card">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={agent.avatar} alt={agent.name} />
                    <AvatarFallback>
                      {agent.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div 
                    className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${getStatusColor(agent.status)}`}
                  />
                </div>
                <div>
                  <CardTitle className="text-lg">{agent.name}</CardTitle>
                  <p className="text-sm text-nordic-text-secondary">{agent.email}</p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-nordic-text-primary">
                    {agent.stats.conversationsToday}
                  </div>
                  <div className="text-xs text-nordic-text-muted">Conversations Today</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-nordic-text-primary">
                    {agent.stats.activeConversations}
                  </div>
                  <div className="text-xs text-nordic-text-muted">Active Now</div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-nordic-primary" />
                    <span className="text-sm">Response Time</span>
                  </div>
                  <span className={`text-sm font-medium ${getPerformanceColor(agent.stats.avgResponseTime, 'responseTime')}`}>
                    {formatTime(agent.stats.avgResponseTime)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4 text-nordic-primary" />
                    <span className="text-sm">Resolution Rate</span>
                  </div>
                  <span className={`text-sm font-medium ${getPerformanceColor(agent.stats.resolutionRate, 'resolution')}`}>
                    {Math.round(agent.stats.resolutionRate * 100)}%
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Star className="h-4 w-4 text-nordic-primary" />
                    <span className="text-sm">Satisfaction</span>
                  </div>
                  <span className={`text-sm font-medium ${getPerformanceColor(agent.stats.customerSatisfaction, 'satisfaction')}`}>
                    {agent.stats.customerSatisfaction.toFixed(1)}
                  </span>
                </div>
              </div>

              {/* Workload Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Daily Target</span>
                  <span>{agent.stats.conversationsToday}/20</span>
                </div>
                <Progress 
                  value={(agent.stats.conversationsToday / 20) * 100} 
                  className="h-2"
                />
              </div>

              {/* Online Time */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-nordic-primary" />
                  <span>Online Today</span>
                </div>
                <span className="font-medium">
                  {agent.stats.hoursOnline.toFixed(1)}h
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Weekly Performance Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Weekly Performance Trends</CardTitle>
            <div className="flex space-x-2">
              <Badge 
                variant={selectedMetric === 'conversations' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSelectedMetric('conversations')}
              >
                Conversations
              </Badge>
              <Badge 
                variant={selectedMetric === 'responseTime' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSelectedMetric('responseTime')}
              >
                Response Time
              </Badge>
              <Badge 
                variant={selectedMetric === 'satisfaction' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSelectedMetric('satisfaction')}
              >
                Satisfaction
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={agents[0]?.weeklyPerformance || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey={selectedMetric} 
                stroke="var(--nordic-primary)" 
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
```

## Advanced Analytics Integration

### Real-Time Business Intelligence

#### Analytics Dashboard Component
```typescript
// components/admin/analytics/AdvancedAnalytics.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Wrench, 
  MessageCircle,
  Clock,
  Star,
  Target,
  Calendar
} from 'lucide-react';

interface AnalyticsData {
  revenue: {
    current: number;
    previous: number;
    trend: number;
    daily: Array<{ date: string; revenue: number; repairs: number }>;
    forecast: Array<{ date: string; predicted: number; confidence: number }>;
  };
  repairs: {
    total: number;
    completed: number;
    inProgress: number;
    averageTime: number;
    byCategory: Array<{ category: string; count: number; revenue: number }>;
  };
  customers: {
    total: number;
    new: number;
    returning: number;
    satisfaction: number;
    segments: Array<{ segment: string; count: number; value: number }>;
  };
  chat: {
    conversations: number;
    responseTime: number;
    resolutionRate: number;
    satisfaction: number;
    trends: Array<{ date: string; conversations: number; responseTime: number }>;
  };
}

export const AdvancedAnalytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [dateRange, setDateRange] = useState({ from: new Date(), to: new Date() });
  const [compareMode, setCompareMode] = useState<'previous' | 'year' | 'none'>('previous');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange, compareMode]);

  const fetchAnalyticsData = async () => {
    try {
      const params = new URLSearchParams({
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString(),
        compare: compareMode
      });

      const response = await fetch(`/api/admin/analytics/advanced?${params}`);
      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getTrendIcon = (trend: number) => {
    return trend >= 0 ? (
      <TrendingUp className="h-4 w-4 text-nordic-green" />
    ) : (
      <TrendingDown className="h-4 w-4 text-nordic-red" />
    );
  };

  const getTrendColor = (trend: number) => {
    return trend >= 0 ? 'text-nordic-green' : 'text-nordic-red';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-24 bg-nordic-gray-100 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-nordic-text-primary">Analytics Dashboard</h2>
        <div className="flex items-center space-x-4">
          <DateRangePicker
            date={dateRange}
            onDateChange={setDateRange}
          />
          <Select value={compareMode} onValueChange={setCompareMode}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="previous">Previous Period</SelectItem>
              <SelectItem value="year">Same Period Last Year</SelectItem>
              <SelectItem value="none">No Comparison</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="nordic-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-nordic-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.revenue.current)}</div>
            <div className="flex items-center space-x-1 text-xs">
              {getTrendIcon(data.revenue.trend)}
              <span className={getTrendColor(data.revenue.trend)}>
                {formatPercentage(Math.abs(data.revenue.trend))}
              </span>
              <span className="text-nordic-text-muted">from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card className="nordic-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-nordic-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.customers.total.toLocaleString()}</div>
            <div className="text-xs text-nordic-text-muted">
              +{data.customers.new} new this period
            </div>
          </CardContent>
        </Card>

        <Card className="nordic-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Repairs</CardTitle>
            <Wrench className="h-4 w-4 text-nordic-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.repairs.inProgress}</div>
            <div className="text-xs text-nordic-text-muted">
              Avg. {data.repairs.averageTime} days completion
            </div>
          </CardContent>
        </Card>

        <Card className="nordic-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chat Satisfaction</CardTitle>
            <MessageCircle className="h-4 w-4 text-nordic-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(data.chat.satisfaction * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-nordic-text-muted">
              {data.chat.conversations} conversations
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Revenue Analytics</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="chat">Chat Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Revenue Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data.revenue.daily}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="var(--nordic-primary)" 
                      fill="var(--nordic-primary-light)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Revenue Forecast */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Forecast</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.revenue.forecast}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Line 
                      type="monotone" 
                      dataKey="predicted" 
                      stroke="var(--nordic-primary)" 
                      strokeDasharray="5 5"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="confidence" 
                      stroke="var(--nordic-gray-400)" 
                      strokeDasharray="3 3"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Repair Categories Revenue */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Repair Category</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.repairs.byCategory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Bar dataKey="revenue" fill="var(--nordic-primary)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operations" className="space-y-4">
          <RepairOperationsAnalytics data={data.repairs} />
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <CustomerAnalytics data={data.customers} />
        </TabsContent>

        <TabsContent value="chat" className="space-y-4">
          <ChatAnalytics data={data.chat} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
```

## Workflow Automation Engine

### Automated Repair Management

#### Workflow Automation Service
```typescript
// services/admin/WorkflowAutomationService.ts
export class WorkflowAutomationService {
  constructor(
    private repairRepo: RepairRepository,
    private customerRepo: CustomerRepository,
    private notificationService: NotificationService,
    private chatService: ChatService,
    private crmService: CRMService
  ) {}

  async processRepairStatusChange(repairId: string, newStatus: RepairStatus): Promise<void> {
    const repair = await this.repairRepo.findByIdWithCustomer(repairId);
    if (!repair) throw new Error('Repair not found');

    // Execute status-specific workflows
    switch (newStatus) {
      case 'quoted':
        await this.handleQuoteGenerated(repair);
        break;
      case 'approved':
        await this.handleQuoteApproved(repair);
        break;
      case 'repairing':
        await this.handleRepairStarted(repair);
        break;
      case 'testing':
        await this.handleRepairTesting(repair);
        break;
      case 'completed':
        await this.handleRepairCompleted(repair);
        break;
    }

    // Update CRM
    await this.crmService.updateRepairStatus(repairId, newStatus);
  }

  private async handleQuoteGenerated(repair: RepairWithCustomer): Promise<void> {
    // Send customer notification
    await this.notificationService.sendToCustomer(repair.customerId, {
      type: 'quote_ready',
      title: 'Repair Quote Ready',
      message: `Your quote for ${repair.deviceModel} repair is ready for review`,
      data: { repairId: repair.id, quoteId: repair.quotes[0]?.id }
    });

    // Send SMS notification
    if (repair.customer.phone) {
      await this.notificationService.sendSMS(repair.customer.phone, 
        `Hi ${repair.customer.firstName}, your repair quote is ready! View it at: ${process.env.NEXT_PUBLIC_APP_URL}/customer/repairs/${repair.id}`
      );
    }

    // Create chat message if conversation exists
    const conversation = await this.chatService.findConversationByRepair(repair.id);
    if (conversation) {
      await this.chatService.sendSystemMessage(conversation.id, 
        `📋 Repair quote has been generated. Please review and approve to proceed with the repair.`
      );
    }

    // Schedule quote expiration reminder
    await this.scheduleQuoteExpirationReminder(repair.id, repair.quotes[0]?.expiresAt);
  }

  private async handleQuoteApproved(repair: RepairWithCustomer): Promise<void> {
    // Auto-assign to best available technician
    const technician = await this.findOptimalTechnician(repair);
    if (technician) {
      await this.repairRepo.assignTechnician(repair.id, technician.id);
      
      // Notify technician
      await this.notificationService.sendToUser(technician.id, {
        type: 'repair_assigned',
        title: 'New Repair Assigned',
        message: `${repair.deviceBrand} ${repair.deviceModel} repair has been assigned to you`,
        data: { repairId: repair.id }
      });
    }

    // Order parts if needed
    const partsNeeded = await this.analyzePartsRequirements(repair);
    if (partsNeeded.length > 0) {
      await this.automatePartsOrdering(repair.id, partsNeeded);
    }

    // Update customer
    await this.notificationService.sendToCustomer(repair.customerId, {
      type: 'quote_approved',
      title: 'Repair Approved',
      message: `Your ${repair.deviceModel} repair has been approved and will begin shortly`,
      data: { repairId: repair.id }
    });

    // Create initial progress update
    await this.createProgressUpdate(repair.id, 'Quote approved - repair will begin shortly');
  }

  private async handleRepairCompleted(repair: RepairWithCustomer): Promise<void> {
    // Generate invoice
    const invoice = await this.generateInvoice(repair);
    
    // Send completion notification
    await this.notificationService.sendToCustomer(repair.customerId, {
      type: 'repair_completed',
      title: 'Repair Completed',
      message: `Your ${repair.deviceModel} repair has been completed and is ready for pickup`,
      data: { 
        repairId: repair.id, 
        invoiceId: invoice.id,
        pickupLocation: repair.pickupLocation 
      }
    });

    // Send email with invoice
    await this.notificationService.sendEmail(repair.customer.email, 'repair_completed', {
      customerName: repair.customer.firstName,
      deviceModel: repair.deviceModel,
      repairType: repair.repairType,
      invoiceUrl: `${process.env.NEXT_PUBLIC_APP_URL}/customer/invoices/${invoice.id}`,
      pickupInstructions: await this.getPickupInstructions(repair.id)
    });

    // Schedule satisfaction survey
    await this.scheduleSatisfactionSurvey(repair.customerId, repair.id, '24h');

    // Update warranty information
    await this.createWarrantyRecord(repair);

    // Archive repair conversation in chat
    const conversation = await this.chatService.findConversationByRepair(repair.id);
    if (conversation) {
      await this.chatService.sendSystemMessage(conversation.id,
        `✅ Repair completed! Your device is ready for pickup. Invoice: ${invoice.number}`
      );
      await this.chatService.resolveConversation(conversation.id);
    }
  }

  private async findOptimalTechnician(repair: RepairWithCustomer): Promise<User | null> {
    const technicians = await this.repairRepo.getAvailableTechnicians();
    
    // Score technicians based on:
    // - Specialization with device type
    // - Current workload
    // - Performance metrics
    // - Availability
    
    const scoredTechnicians = technicians.map(tech => ({
      technician: tech,
      score: this.calculateTechnicianScore(tech, repair)
    }));

    scoredTechnicians.sort((a, b) => b.score - a.score);
    return scoredTechnicians[0]?.technician || null;
  }

  private calculateTechnicianScore(technician: User, repair: RepairWithCustomer): number {
    let score = 0;

    // Device specialization (40% weight)
    if (technician.specializations?.includes(repair.deviceType)) {
      score += 40;
    }

    // Workload (30% weight) - fewer active repairs = higher score
    const workloadScore = Math.max(0, 30 - (technician.activeRepairs * 5));
    score += workloadScore;

    // Performance metrics (20% weight)
    score += (technician.performanceRating || 0) * 4;

    // Availability (10% weight)
    if (technician.availabilityStatus === 'available') {
      score += 10;
    }

    return score;
  }

  private async automatePartsOrdering(repairId: string, parts: PartRequirement[]): Promise<void> {
    for (const part of parts) {
      // Check inventory
      const stockLevel = await this.checkPartInventory(part.partNumber);
      
      if (stockLevel < part.quantity) {
        // Auto-order if below threshold
        await this.createPurchaseOrder({
          repairId,
          partNumber: part.partNumber,
          quantity: Math.max(part.quantity, part.minimumOrderQuantity),
          supplierId: part.preferredSupplierId,
          urgency: part.urgency
        });

        // Notify procurement team
        await this.notificationService.sendToRole('procurement', {
          type: 'parts_ordered',
          title: 'Parts Auto-Ordered',
          message: `Auto-ordered ${part.quantity}x ${part.partName} for repair ${repairId}`,
          data: { repairId, partNumber: part.partNumber }
        });
      }
    }
  }

  async processCustomerEngagement(customerId: string): Promise<void> {
    const customer = await this.customerRepo.findByIdWithRepairs(customerId);
    if (!customer) return;

    const engagement = this.calculateCustomerEngagement(customer);
    
    // Trigger appropriate workflows based on engagement
    if (engagement.riskLevel === 'high') {
      await this.triggerRetentionWorkflow(customer);
    } else if (engagement.value === 'high') {
      await this.triggerVIPWorkflow(customer);
    }

    // Update customer segmentation in CRM
    await this.crmService.updateCustomerSegment(customerId, engagement.segment);
  }

  private async triggerRetentionWorkflow(customer: CustomerWithRepairs): Promise<void> {
    // Create personalized retention campaign
    const campaign = await this.createRetentionCampaign(customer);
    
    // Send personalized offer
    await this.notificationService.sendEmail(customer.email, 'retention_offer', {
      customerName: customer.firstName,
      offerDetails: campaign.offer,
      discountCode: campaign.discountCode,
      expiryDate: campaign.expiryDate
    });

    // Schedule follow-up
    await this.scheduleFollowUp(customer.id, 'retention', '7d');
  }
}
```

### Smart Notifications System

#### Intelligent Notification Engine
```typescript
// services/admin/IntelligentNotificationService.ts
export class IntelligentNotificationService {
  constructor(
    private customerRepo: CustomerRepository,
    private notificationRepo: NotificationRepository,
    private analyticsService: AnalyticsService
  ) {}

  async sendSmartNotification(
    customerId: string, 
    template: NotificationTemplate,
    context: NotificationContext
  ): Promise<void> {
    const customer = await this.customerRepo.findByIdWithPreferences(customerId);
    if (!customer) throw new Error('Customer not found');

    // Analyze optimal send time based on customer behavior
    const optimalTime = await this.calculateOptimalSendTime(customer);
    
    // Personalize content based on customer history
    const personalizedContent = await this.personalizeContent(template, customer, context);
    
    // Choose optimal channel based on preferences and urgency
    const channels = await this.selectOptimalChannels(customer, template.urgency);
    
    // Schedule or send immediately
    if (this.shouldSchedule(optimalTime)) {
      await this.scheduleNotification(customerId, personalizedContent, channels, optimalTime);
    } else {
      await this.sendImmediately(customerId, personalizedContent, channels);
    }

    // Track delivery and engagement
    await this.trackNotificationMetrics(customerId, template.type, channels);
  }

  private async calculateOptimalSendTime(customer: CustomerWithPreferences): Promise<Date> {
    // Analyze customer's interaction history to find optimal send times
    const interactions = await this.analyticsService.getCustomerInteractionHistory(customer.id);
    
    const hourlyActivity = interactions.reduce((acc, interaction) => {
      const hour = new Date(interaction.timestamp).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    // Find peak activity hour
    const peakHour = Object.entries(hourlyActivity)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '10'; // Default to 10 AM

    // Calculate next optimal time in customer's timezone
    const now = new Date();
    const customerTime = new Date(now.toLocaleString('en-US', { 
      timeZone: customer.timezone || 'UTC' 
    }));
    
    const optimalTime = new Date(customerTime);
    optimalTime.setHours(parseInt(peakHour), 0, 0, 0);
    
    // If optimal time has passed today, schedule for tomorrow
    if (optimalTime <= customerTime) {
      optimalTime.setDate(optimalTime.getDate() + 1);
    }

    return optimalTime;
  }

  private async personalizeContent(
    template: NotificationTemplate,
    customer: CustomerWithPreferences,
    context: NotificationContext
  ): Promise<PersonalizedContent> {
    const personalizedData = {
      customerName: customer.firstName,
      deviceHistory: await this.getCustomerDeviceHistory(customer.id),
      repairHistory: await this.getCustomerRepairHistory(customer.id),
      preferences: customer.preferences,
      ...context
    };

    // Use AI to personalize content
    const personalizedTitle = await this.personalizeText(template.title, personalizedData);
    const personalizedMessage = await this.personalizeText(template.message, personalizedData);
    
    return {
      title: personalizedTitle,
      message: personalizedMessage,
      data: personalizedData
    };
  }

  private async selectOptimalChannels(
    customer: CustomerWithPreferences,
    urgency: 'low' | 'normal' | 'high' | 'urgent'
  ): Promise<NotificationChannel[]> {
    const channels: NotificationChannel[] = [];
    
    // Always include in-app notification
    if (customer.preferences.pushNotifications) {
      channels.push('push');
    }

    // Email for normal and above urgency
    if (urgency !== 'low' && customer.preferences.emailNotifications) {
      channels.push('email');
    }

    // SMS for high urgency or customer preference
    if (
      (urgency === 'high' || urgency === 'urgent') && 
      customer.preferences.smsNotifications && 
      customer.phone
    ) {
      channels.push('sms');
    }

    // Phone call for urgent matters
    if (urgency === 'urgent' && customer.phone) {
      channels.push('phone');
    }

    return channels;
  }

  async sendBulkSmartNotifications(
    customerIds: string[],
    template: NotificationTemplate,
    segmentationRules?: SegmentationRules
  ): Promise<BulkNotificationResult> {
    const results: BulkNotificationResult = {
      sent: 0,
      failed: 0,
      scheduled: 0,
      errors: []
    };

    for (const customerId of customerIds) {
      try {
        const customer = await this.customerRepo.findByIdWithPreferences(customerId);
        if (!customer) continue;

        // Apply segmentation rules if provided
        if (segmentationRules && !this.matchesSegmentation(customer, segmentationRules)) {
          continue;
        }

        // Create context for this customer
        const context = await this.buildCustomerContext(customer);
        
        await this.sendSmartNotification(customerId, template, context);
        results.sent++;
        
        // Rate limiting to avoid overwhelming customers
        await this.sleep(100);
        
      } catch (error) {
        results.failed++;
        results.errors.push({
          customerId,
          error: error.message
        });
      }
    }

    return results;
  }

  private matchesSegmentation(
    customer: CustomerWithPreferences,
    rules: SegmentationRules
  ): boolean {
    // Implement segmentation logic
    if (rules.repairCount && customer.repairCount < rules.repairCount.min) {
      return false;
    }

    if (rules.totalSpent && customer.totalSpent < rules.totalSpent.min) {
      return false;
    }

    if (rules.lastRepairDays) {
      const daysSinceLastRepair = this.getDaysSinceLastRepair(customer);
      if (daysSinceLastRepair < rules.lastRepairDays.min || 
          daysSinceLastRepair > rules.lastRepairDays.max) {
        return false;
      }
    }

    return true;
  }
}
```

## Enhanced User Interface

### Nordic Design Integration

#### Enhanced Dashboard Layout
```typescript
// components/admin/layout/EnhancedAdminLayout.tsx
'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopNavigation } from './TopNavigation';
import { NotificationCenter } from './NotificationCenter';
import { QuickActions } from './QuickActions';
import { ChatStatus } from './ChatStatus';

interface EnhancedAdminLayoutProps {
  children: React.ReactNode;
}

export const EnhancedAdminLayout: React.FC<EnhancedAdminLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  return (
    <div className="flex h-screen bg-nordic-background">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <TopNavigation 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        />
        
        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-6 space-y-6">
            {children}
          </div>
        </main>
      </div>
      
      {/* Floating Elements */}
      <NotificationCenter />
      <ChatStatus />
      <QuickActions />
    </div>
  );
};
```

## Performance Monitoring

### Real-Time Metrics Dashboard

#### Performance Monitoring Component
```typescript
// components/admin/monitoring/PerformanceMonitor.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Database, Server, Zap, AlertTriangle, CheckCircle } from 'lucide-react';

interface SystemMetrics {
  performance: {
    responseTime: number;
    throughput: number;
    errorRate: number;
    uptime: number;
  };
  database: {
    connectionPool: number;
    queryTime: number;
    activeQueries: number;
  };
  chat: {
    activeConnections: number;
    messageLatency: number;
    systemLoad: number;
  };
  alerts: Array<{
    id: string;
    level: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    timestamp: string;
  }>;
}

export const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [historicalData, setHistoricalData] = useState<any[]>([]);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/admin/monitoring/metrics');
      const data = await response.json();
      setMetrics(data.current);
      setHistoricalData(prev => [...prev.slice(-50), data.current]);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    }
  };

  const getStatusColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return 'text-nordic-red';
    if (value >= thresholds.warning) return 'text-nordic-orange';
    return 'text-nordic-green';
  };

  const getAlertIcon = (level: string) => {
    switch (level) {
      case 'critical':
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-nordic-red" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-nordic-orange" />;
      default:
        return <CheckCircle className="h-4 w-4 text-nordic-green" />;
    }
  };

  if (!metrics) return <div>Loading metrics...</div>;

  return (
    <div className="space-y-6">
      {/* System Health Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="nordic-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Zap className="h-4 w-4 text-nordic-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getStatusColor(metrics.performance.responseTime, { warning: 200, critical: 500 })}`}>
              {metrics.performance.responseTime}ms
            </div>
            <p className="text-xs text-nordic-text-muted">
              Target: &lt;200ms
            </p>
          </CardContent>
        </Card>

        <Card className="nordic-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Throughput</CardTitle>
            <Activity className="h-4 w-4 text-nordic-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-nordic-text-primary">
              {metrics.performance.throughput}
            </div>
            <p className="text-xs text-nordic-text-muted">
              requests/second
            </p>
          </CardContent>
        </Card>

        <Card className="nordic-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-nordic-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getStatusColor(metrics.performance.errorRate, { warning: 1, critical: 5 })}`}>
              {metrics.performance.errorRate.toFixed(2)}%
            </div>
            <p className="text-xs text-nordic-text-muted">
              Target: &lt;1%
            </p>
          </CardContent>
        </Card>

        <Card className="nordic-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
            <Server className="h-4 w-4 text-nordic-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-nordic-green">
              {metrics.performance.uptime.toFixed(2)}%
            </div>
            <p className="text-xs text-nordic-text-muted">
              Last 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="performance.responseTime" 
                stroke="var(--nordic-primary)" 
                name="Response Time (ms)"
              />
              <Line 
                type="monotone" 
                dataKey="performance.throughput" 
                stroke="var(--nordic-green)" 
                name="Throughput (req/s)"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* System Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>System Alerts</span>
            <Badge variant="outline">{metrics.alerts.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {metrics.alerts.length === 0 ? (
              <div className="text-center py-4 text-nordic-text-muted">
                No active alerts
              </div>
            ) : (
              metrics.alerts.map(alert => (
                <div key={alert.id} className="flex items-center space-x-3 p-3 border border-nordic-border rounded-lg">
                  {getAlertIcon(alert.level)}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{alert.message}</p>
                    <p className="text-xs text-nordic-text-muted">
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {alert.level}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
```

## Deployment & Testing

### Enhanced Testing Strategy

#### Integration Testing for Admin Features
```typescript
// __tests__/admin/enhanced-dashboard.test.ts
import { render, screen, waitFor } from '@testing-library/react';
import { EnhancedAdminDashboard } from '@/components/admin/EnhancedAdminDashboard';
import { mockAdminUser, mockChatMetrics } from '@/test-utils/mocks';

describe('Enhanced Admin Dashboard', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it('displays chat metrics correctly', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ metrics: mockChatMetrics }));
    
    render(<EnhancedAdminDashboard user={mockAdminUser} />);
    
    await waitFor(() => {
      expect(screen.getByText('Active Conversations')).toBeInTheDocument();
      expect(screen.getByText('24')).toBeInTheDocument(); // Mock active conversations
    });
  });

  it('handles real-time updates', async () => {
    const mockEventSource = {
      addEventListener: jest.fn(),
      close: jest.fn()
    };
    
    global.EventSource = jest.fn().mockImplementation(() => mockEventSource);
    
    render(<EnhancedAdminDashboard user={mockAdminUser} />);
    
    expect(mockEventSource.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
  });
});
```

This comprehensive Admin Dashboard Enhancement documentation provides the foundation for creating a sophisticated, AI-powered administrative interface that streamlines operations while maintaining the Nordic design aesthetic and ensuring optimal performance.