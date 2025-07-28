# Chatwoot Messaging System Implementation Guide

## Overview

This document provides a comprehensive 6-phase implementation plan for integrating Chatwoot as the live chat messaging system for the Revivatech computer repair shop website. The implementation includes customer-side chat widget, admin dashboard integration, and CRM synchronization.

## Architecture Overview

### System Components
```
┌─────────────────────────────────────────────────────────────┐
│                    Chatwoot Integration                     │
├─────────────────────────────────────────────────────────────┤
│ Customer Frontend    │ Admin Dashboard     │ CRM Integration │
│ ├── Chat Widget      │ ├── Embedded UI     │ ├── Webhooks    │
│ ├── Auto-Auth        │ ├── Agent Routing   │ ├── API Sync    │
│ ├── File Upload      │ ├── Conversations   │ ├── Ticket Gen  │
│ └── Real-time        │ └── Analytics       │ └── Context     │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack
- **Chatwoot**: v3.x (Latest stable version)
- **Database**: PostgreSQL 16 (Dedicated Chatwoot instance)
- **Cache**: Redis 7.x (Session and message caching)
- **Frontend**: React integration with existing Next.js app
- **Backend**: Node.js API layer for CRM integration
- **Docker**: Containerized deployment

## Phase 1: Data Recovery Page Nordic Redesign

**Duration**: 1-2 weeks
**Objective**: Prepare the foundation with Nordic design system

### Tasks
1. **Update Color Palette**
   ```css
   /* Convert from existing colors to Nordic */
   --primary: #007AFF;           /* Apple Blue */
   --surface: #FFFFFF;           /* Pure white cards */
   --background: #F2F2F7;        /* Light Nordic gray */
   --text-primary: #1D1D1F;      /* Deep charcoal */
   --border: #E5E7EB;            /* Subtle borders */
   ```

2. **Typography Implementation**
   ```css
   --font-display: 'SF Pro Display', 'Inter', sans-serif;
   --font-text: 'SF Pro Text', 'Inter', sans-serif;
   ```

3. **Component Updates**
   - Hero section with Nordic spacing
   - Service cards with minimal shadows
   - Glass morphism effects for premium feel
   - Consistent Lucide React icons

4. **Responsive Optimization**
   - Mobile-first Nordic layouts
   - Touch-friendly interactions
   - Optimized whitespace

### Deliverables
- [ ] Updated data recovery page with Nordic design
- [ ] Component library with Nordic theme
- [ ] Dark mode Nordic variant
- [ ] Performance optimization

## Phase 2: Chatwoot Server Setup

**Duration**: 1-2 weeks
**Objective**: Deploy and configure Chatwoot infrastructure

### Docker Configuration

#### docker-compose.chatwoot.yml
```yaml
version: '3.8'

services:
  chatwoot-web:
    image: chatwoot/chatwoot:v3.9.0
    container_name: chatwoot-web
    environment:
      - NODE_ENV=production
      - RAILS_ENV=production
      - INSTALLATION_ENV=docker
      
      # Database Configuration
      - POSTGRES_HOST=chatwoot-postgres
      - POSTGRES_PORT=5432
      - POSTGRES_DATABASE=chatwoot
      - POSTGRES_USERNAME=postgres
      - POSTGRES_PASSWORD=${CHATWOOT_POSTGRES_PASSWORD}
      
      # Redis Configuration
      - REDIS_URL=redis://chatwoot-redis:6379/0
      - REDIS_PASSWORD=${CHATWOOT_REDIS_PASSWORD}
      
      # Application Configuration
      - SECRET_KEY_BASE=${CHATWOOT_SECRET_KEY_BASE}
      - FRONTEND_URL=${CHATWOOT_FRONTEND_URL}
      - FORCE_SSL=false
      
      # Email Configuration (Optional)
      - MAILER_SENDER_EMAIL=${CHATWOOT_MAILER_EMAIL}
      - SMTP_ADDRESS=${SMTP_HOST}
      - SMTP_PORT=${SMTP_PORT}
      - SMTP_USERNAME=${SMTP_USER}
      - SMTP_PASSWORD=${SMTP_PASS}
      
      # File Storage
      - ACTIVE_STORAGE_SERVICE=local
      
      # Features
      - ENABLE_ACCOUNT_SIGNUP=false
      - CHATWOOT_INBOX_HMAC_KEY=${CHATWOOT_HMAC_KEY}
      
    ports:
      - "3000:3000"
    depends_on:
      - chatwoot-postgres
      - chatwoot-redis
    volumes:
      - chatwoot_storage:/app/storage
    restart: unless-stopped
    networks:
      - chatwoot-network

  chatwoot-postgres:
    image: postgres:16-alpine
    container_name: chatwoot-postgres
    environment:
      - POSTGRES_DB=chatwoot
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${CHATWOOT_POSTGRES_PASSWORD}
      - POSTGRES_INITDB_ARGS="--encoding=UTF-8"
    volumes:
      - chatwoot_postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    networks:
      - chatwoot-network

  chatwoot-redis:
    image: redis:7-alpine
    container_name: chatwoot-redis
    command: redis-server --requirepass ${CHATWOOT_REDIS_PASSWORD}
    volumes:
      - chatwoot_redis_data:/data
    restart: unless-stopped
    networks:
      - chatwoot-network

  chatwoot-sidekiq:
    image: chatwoot/chatwoot:v3.9.0
    container_name: chatwoot-sidekiq
    command: bundle exec sidekiq -C config/sidekiq.yml
    environment:
      - NODE_ENV=production
      - RAILS_ENV=production
      - POSTGRES_HOST=chatwoot-postgres
      - POSTGRES_PORT=5432
      - POSTGRES_DATABASE=chatwoot
      - POSTGRES_USERNAME=postgres
      - POSTGRES_PASSWORD=${CHATWOOT_POSTGRES_PASSWORD}
      - REDIS_URL=redis://chatwoot-redis:6379/0
      - REDIS_PASSWORD=${CHATWOOT_REDIS_PASSWORD}
      - SECRET_KEY_BASE=${CHATWOOT_SECRET_KEY_BASE}
    depends_on:
      - chatwoot-postgres
      - chatwoot-redis
    volumes:
      - chatwoot_storage:/app/storage
    restart: unless-stopped
    networks:
      - chatwoot-network

volumes:
  chatwoot_postgres_data:
  chatwoot_redis_data:
  chatwoot_storage:

networks:
  chatwoot-network:
    driver: bridge
```

### Environment Configuration

#### .env.chatwoot
```bash
# Chatwoot Configuration
CHATWOOT_POSTGRES_PASSWORD=secure_postgres_password_here
CHATWOOT_REDIS_PASSWORD=secure_redis_password_here
CHATWOOT_SECRET_KEY_BASE=your_very_long_secret_key_base_here
CHATWOOT_FRONTEND_URL=https://chat.revivatech.com
CHATWOOT_MAILER_EMAIL=noreply@revivatech.com
CHATWOOT_HMAC_KEY=your_hmac_key_for_widget_verification

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@revivatech.com
SMTP_PASS=your-app-password
```

### Initial Setup Tasks
1. **Server Deployment**
   ```bash
   # Deploy Chatwoot
   docker-compose -f docker-compose.chatwoot.yml up -d
   
   # Create super admin
   docker exec -it chatwoot-web bundle exec rails db:chatwoot_prepare
   ```

2. **Account Configuration**
   - Create Revivatech account
   - Set up administrator users
   - Configure company branding
   - Set timezone and locale

3. **Inbox Creation**
   - Create website inbox for revivatech.com
   - Configure widget appearance
   - Set up auto-assignment rules
   - Configure working hours

### Deliverables
- [ ] Chatwoot server running in production
- [ ] Database and Redis configured
- [ ] Super admin account created
- [ ] Basic inbox configured
- [ ] SSL certificates configured

## Phase 3: Customer Chat Widget Implementation

**Duration**: 2-3 weeks
**Objective**: Replace existing chat widget with Chatwoot integration

### Frontend Integration

#### Customer Chat Component
```typescript
// components/chat/ChatwootWidget.tsx
'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';

interface ChatwootSettings {
  hideMessageBubble?: boolean;
  position?: 'left' | 'right';
  locale?: string;
  type?: 'standard' | 'expanded_bubble';
  darkMode?: 'light' | 'auto';
}

interface ChatwootWidgetProps {
  websiteToken: string;
  baseUrl: string;
  settings?: ChatwootSettings;
}

declare global {
  interface Window {
    chatwootSettings: any;
    chatwootSDK: any;
    $chatwoot: any;
  }
}

export const ChatwootWidget: React.FC<ChatwootWidgetProps> = ({
  websiteToken,
  baseUrl,
  settings = {}
}) => {
  const { user } = useAuth();
  const { theme } = useTheme();

  useEffect(() => {
    // Configure Chatwoot settings
    window.chatwootSettings = {
      hideMessageBubble: settings.hideMessageBubble || false,
      position: settings.position || 'right',
      locale: settings.locale || 'en',
      type: settings.type || 'standard',
      darkMode: theme === 'dark' ? 'auto' : 'light',
      ...settings
    };

    // Load Chatwoot script
    const script = document.createElement('script');
    script.src = `${baseUrl}/packs/js/sdk.js`;
    script.defer = true;
    script.async = true;
    
    script.onload = () => {
      window.chatwootSDK.run({
        websiteToken,
        baseUrl
      });

      // Auto-authenticate logged-in users
      if (user) {
        window.$chatwoot.setUser(user.id, {
          email: user.email,
          name: user.name,
          avatar_url: user.avatar,
          phone_number: user.phone,
          identifier_hash: user.identifierHash // HMAC for security
        });

        // Set custom attributes
        window.$chatwoot.setCustomAttributes({
          userId: user.id,
          customerType: user.type || 'customer',
          registrationDate: user.createdAt,
          totalRepairs: user.repairCount || 0,
          preferredLanguage: user.language || 'en'
        });
      }
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [websiteToken, baseUrl, user, theme, settings]);

  // Widget event handlers
  useEffect(() => {
    const handleChatwootReady = () => {
      // Widget loaded and ready
      console.log('Chatwoot widget ready');
    };

    const handleUnreadCountChanged = (count: number) => {
      // Update UI with unread message count
      if (count > 0) {
        document.title = `(${count}) Revivatech - Computer Repair`;
      } else {
        document.title = 'Revivatech - Computer Repair';
      }
    };

    window.addEventListener('chatwoot:ready', handleChatwootReady);
    window.addEventListener('chatwoot:unread-count-changed', handleUnreadCountChanged);

    return () => {
      window.removeEventListener('chatwoot:ready', handleChatwootReady);
      window.removeEventListener('chatwoot:unread-count-changed', handleUnreadCountChanged);
    };
  }, []);

  return null; // Widget is injected by script
};
```

#### Chat Button Component
```typescript
// components/chat/ChatButton.tsx
'use client';

import { MessageCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

export const ChatButton: React.FC = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleUnreadCount = (event: any) => {
      setUnreadCount(event.detail?.count || 0);
    };

    const handleWidgetToggle = (event: any) => {
      setIsVisible(event.detail?.isOpen || false);
    };

    window.addEventListener('chatwoot:unread-count-changed', handleUnreadCount);
    window.addEventListener('chatwoot:widget-toggle', handleWidgetToggle);

    return () => {
      window.removeEventListener('chatwoot:unread-count-changed', handleUnreadCount);
      window.removeEventListener('chatwoot:widget-toggle', handleWidgetToggle);
    };
  }, []);

  const handleChatToggle = () => {
    if (window.$chatwoot) {
      window.$chatwoot.toggle();
    }
  };

  return (
    <button
      onClick={handleChatToggle}
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-nordic-primary text-white shadow-lg transition-all hover:scale-110 hover:shadow-xl"
      aria-label={`Open chat${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
    >
      <MessageCircle className="h-6 w-6" />
      {unreadCount > 0 && (
        <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-nordic-red text-xs font-bold text-white">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
};
```

### Widget Configuration

#### Custom Styling
```css
/* Custom Chatwoot Widget Styles */
.woot-widget-holder {
  --color-woot: var(--nordic-primary) !important;
  --color-body: var(--nordic-text-primary) !important;
  --color-background: var(--nordic-surface) !important;
  --font-family: var(--nordic-font-text) !important;
}

.woot-widget-bubble {
  background: var(--nordic-primary) !important;
  border-radius: 16px !important;
  box-shadow: 0 8px 32px rgba(0, 122, 255, 0.2) !important;
}

.woot-widget-holder iframe {
  border-radius: 16px !important;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1) !important;
}

/* Dark mode adjustments */
[data-theme="dark"] .woot-widget-holder {
  --color-background: var(--nordic-gray-100) !important;
  --color-body: var(--nordic-gray-900) !important;
}
```

### Multi-language Support
```typescript
// lib/chat/i18n.ts
export const chatwootLocales = {
  en: {
    welcomeMessage: "Hi! How can we help with your device repair today?",
    offlineMessage: "We're currently offline. Leave a message and we'll get back to you!",
    inputPlaceholder: "Type your message...",
    emojiPlaceholder: "Search for an emoji",
    fileUploadPlaceholder: "Attach a file"
  },
  pt: {
    welcomeMessage: "Olá! Como podemos ajudar com o reparo do seu dispositivo hoje?",
    offlineMessage: "Estamos offline no momento. Deixe uma mensagem e retornaremos!",
    inputPlaceholder: "Digite sua mensagem...",
    emojiPlaceholder: "Buscar um emoji",
    fileUploadPlaceholder: "Anexar um arquivo"
  }
};
```

### Deliverables
- [ ] ChatwootWidget component integrated
- [ ] Customer auto-authentication working
- [ ] Multi-language support configured
- [ ] Nordic theme applied to widget
- [ ] File upload functionality enabled
- [ ] Mobile-optimized chat interface

## Phase 4: Admin Dashboard Integration

**Duration**: 2-3 weeks
**Objective**: Embed Chatwoot admin interface and build agent management

### Admin Dashboard Components

#### Embedded Chatwoot Interface
```typescript
// components/admin/chat/ChatwootDashboard.tsx
'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';

interface ChatwootDashboardProps {
  chatwootUrl: string;
  accessToken: string;
}

export const ChatwootDashboard: React.FC<ChatwootDashboardProps> = ({
  chatwootUrl,
  accessToken
}) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'agent') {
      setIsLoading(false);
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nordic-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full">
      <iframe
        src={`${chatwootUrl}/app/accounts/1/dashboard?auth_token=${accessToken}`}
        className="h-full w-full border-0"
        title="Chatwoot Admin Dashboard"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
      />
    </div>
  );
};
```

#### Agent Management Component
```typescript
// components/admin/chat/AgentManagement.tsx
'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clock, MessageCircle, Star, Users } from 'lucide-react';

interface Agent {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  availability_status: 'online' | 'busy' | 'offline';
  confirmed: boolean;
  account_id: number;
  role: 'agent' | 'administrator';
  auto_offline: boolean;
  custom_attributes: Record<string, any>;
}

interface AgentStats {
  conversations_count: number;
  avg_first_response_time: number;
  avg_resolution_time: number;
  resolutions_count: number;
}

export const AgentManagement: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentStats, setAgentStats] = useState<Record<number, AgentStats>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgents();
    fetchAgentStats();
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/admin/chat/agents');
      const data = await response.json();
      setAgents(data.agents || []);
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    }
  };

  const fetchAgentStats = async () => {
    try {
      const response = await fetch('/api/admin/chat/agent-stats');
      const data = await response.json();
      setAgentStats(data.stats || {});
    } catch (error) {
      console.error('Failed to fetch agent stats:', error);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nordic-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-nordic-text-primary">Agent Management</h2>
        <Button onClick={() => window.open('/admin/chat/agents/new', '_blank')}>
          Add Agent
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => {
          const stats = agentStats[agent.id] || {};
          
          return (
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
                      className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${getStatusColor(agent.availability_status)}`}
                    />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{agent.name}</CardTitle>
                    <p className="text-sm text-nordic-text-secondary">{agent.email}</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant={agent.role === 'administrator' ? 'default' : 'secondary'}>
                    {agent.role}
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className={`${getStatusColor(agent.availability_status)} text-white border-0`}
                  >
                    {agent.availability_status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="h-4 w-4 text-nordic-primary" />
                    <div>
                      <p className="font-medium">{stats.conversations_count || 0}</p>
                      <p className="text-nordic-text-muted">Conversations</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-nordic-primary" />
                    <div>
                      <p className="font-medium">
                        {formatTime(stats.avg_first_response_time || 0)}
                      </p>
                      <p className="text-nordic-text-muted">Avg Response</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Star className="h-4 w-4 text-nordic-primary" />
                    <div>
                      <p className="font-medium">{stats.resolutions_count || 0}</p>
                      <p className="text-nordic-text-muted">Resolved</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-nordic-primary" />
                    <div>
                      <p className="font-medium">
                        {formatTime(stats.avg_resolution_time || 0)}
                      </p>
                      <p className="text-nordic-text-muted">Resolution</p>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => window.open(`/admin/chat/agents/${agent.id}`, '_blank')}
                  >
                    View Details
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => window.open(`/admin/chat/conversations?agent_id=${agent.id}`, '_blank')}
                  >
                    Conversations
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
```

### API Endpoints

#### Agent Management API
```typescript
// pages/api/admin/chat/agents.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { chatwootClient } from '@/lib/chat/chatwoot-client';
import { verifyAdminAuth } from '@/lib/auth/admin';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Verify admin authentication
    const admin = await verifyAdminAuth(req);
    if (!admin) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'GET') {
      const agents = await chatwootClient.agents.list();
      return res.status(200).json({ agents });
    }

    if (req.method === 'POST') {
      const { name, email, role } = req.body;
      
      const agent = await chatwootClient.agents.create({
        name,
        email,
        role,
        availability_status: 'offline'
      });
      
      return res.status(201).json({ agent });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Agent management error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

### Deliverables
- [ ] Embedded Chatwoot admin interface
- [ ] Agent management dashboard
- [ ] Real-time agent status monitoring
- [ ] Performance analytics display
- [ ] Agent routing configuration
- [ ] Canned responses management

## Phase 5: CRM Integration & APIs

**Duration**: 2-3 weeks
**Objective**: Connect Chatwoot conversations to existing CRM system

### Webhook Integration

#### Chatwoot Webhook Handler
```typescript
// pages/api/webhooks/chatwoot.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyWebhookSignature } from '@/lib/chat/webhook-verify';
import { crmClient } from '@/lib/crm/client';
import { prisma } from '@/lib/db/prisma';

interface ChatwootWebhookPayload {
  event: string;
  data: {
    conversation: {
      id: number;
      inbox_id: number;
      contact: {
        id: number;
        email: string;
        name: string;
        phone_number?: string;
        identifier_hash?: string;
        custom_attributes: Record<string, any>;
      };
      messages: Array<{
        id: number;
        content: string;
        content_type: 'text' | 'file' | 'location';
        content_attributes: Record<string, any>;
        message_type: 'incoming' | 'outgoing';
        created_at: string;
        sender: {
          id: number;
          name: string;
          type: 'contact' | 'user';
        };
      }>;
      status: 'open' | 'resolved' | 'pending';
      assignee: {
        id: number;
        name: string;
        email: string;
      } | null;
      created_at: string;
      updated_at: string;
      custom_attributes: Record<string, any>;
    };
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify webhook signature
    const isValid = verifyWebhookSignature(
      req.body,
      req.headers['x-chatwoot-signature'] as string
    );

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const payload: ChatwootWebhookPayload = req.body;
    const { event, data } = payload;

    switch (event) {
      case 'conversation_created':
        await handleConversationCreated(data);
        break;
        
      case 'conversation_status_changed':
        await handleConversationStatusChanged(data);
        break;
        
      case 'message_created':
        await handleMessageCreated(data);
        break;
        
      case 'conversation_resolved':
        await handleConversationResolved(data);
        break;
        
      default:
        console.log(`Unhandled webhook event: ${event}`);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleConversationCreated(data: ChatwootWebhookPayload['data']) {
  const { conversation } = data;
  
  try {
    // Create or update customer in CRM
    const customer = await crmClient.customers.upsert({
      email: conversation.contact.email,
      name: conversation.contact.name,
      phone: conversation.contact.phone_number,
      source: 'chat_widget',
      custom_attributes: {
        chatwoot_contact_id: conversation.contact.id,
        last_chat_conversation: conversation.id,
        ...conversation.contact.custom_attributes
      }
    });

    // Create support ticket in CRM
    const ticket = await crmClient.tickets.create({
      customer_id: customer.id,
      title: `Chat Conversation #${conversation.id}`,
      description: 'Customer initiated chat conversation',
      priority: 'medium',
      status: 'open',
      source: 'chatwoot',
      metadata: {
        chatwoot_conversation_id: conversation.id,
        chatwoot_inbox_id: conversation.inbox_id,
        conversation_url: `${process.env.CHATWOOT_BASE_URL}/app/accounts/1/conversations/${conversation.id}`
      }
    });

    // Log conversation in database
    await prisma.chatConversation.create({
      data: {
        chatwootId: conversation.id,
        customerId: customer.id,
        crmTicketId: ticket.id,
        status: conversation.status,
        assigneeId: conversation.assignee?.id,
        createdAt: new Date(conversation.created_at),
        updatedAt: new Date(conversation.updated_at)
      }
    });

    console.log(`Created CRM ticket ${ticket.id} for conversation ${conversation.id}`);
  } catch (error) {
    console.error('Failed to handle conversation creation:', error);
  }
}

async function handleMessageCreated(data: ChatwootWebhookPayload['data']) {
  const { conversation } = data;
  const latestMessage = conversation.messages[conversation.messages.length - 1];

  try {
    // Find existing conversation record
    const chatConversation = await prisma.chatConversation.findUnique({
      where: { chatwootId: conversation.id }
    });

    if (!chatConversation) {
      console.warn(`No conversation record found for Chatwoot ID ${conversation.id}`);
      return;
    }

    // Add message to CRM ticket
    await crmClient.tickets.addComment({
      ticket_id: chatConversation.crmTicketId,
      content: latestMessage.content,
      author: latestMessage.sender.name,
      is_internal: latestMessage.message_type === 'outgoing',
      metadata: {
        chatwoot_message_id: latestMessage.id,
        message_type: latestMessage.message_type,
        created_at: latestMessage.created_at
      }
    });

    console.log(`Added message ${latestMessage.id} to CRM ticket ${chatConversation.crmTicketId}`);
  } catch (error) {
    console.error('Failed to handle message creation:', error);
  }
}

async function handleConversationResolved(data: ChatwootWebhookPayload['data']) {
  const { conversation } = data;

  try {
    // Find existing conversation record
    const chatConversation = await prisma.chatConversation.findUnique({
      where: { chatwootId: conversation.id }
    });

    if (!chatConversation) {
      console.warn(`No conversation record found for Chatwoot ID ${conversation.id}`);
      return;
    }

    // Mark CRM ticket as resolved
    await crmClient.tickets.update({
      ticket_id: chatConversation.crmTicketId,
      status: 'resolved',
      resolution_notes: 'Conversation resolved in Chatwoot',
      resolved_at: new Date()
    });

    // Update local record
    await prisma.chatConversation.update({
      where: { id: chatConversation.id },
      data: {
        status: 'resolved',
        resolvedAt: new Date()
      }
    });

    console.log(`Resolved CRM ticket ${chatConversation.crmTicketId} for conversation ${conversation.id}`);
  } catch (error) {
    console.error('Failed to handle conversation resolution:', error);
  }
}
```

### Customer Context Integration

#### Customer Profile Sync
```typescript
// lib/chat/customer-sync.ts
import { chatwootClient } from './chatwoot-client';
import { crmClient } from '@/lib/crm/client';
import { prisma } from '@/lib/db/prisma';

export class CustomerChatSync {
  static async syncCustomerProfile(customerId: string) {
    try {
      // Get customer data from CRM
      const customer = await crmClient.customers.get(customerId);
      
      // Get repair history
      const repairs = await prisma.repair.findMany({
        where: { customerId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          device: true,
          technician: true
        }
      });

      // Create or update Chatwoot contact
      const chatwootContact = await chatwootClient.contacts.createOrUpdate({
        email: customer.email,
        name: customer.name,
        phone_number: customer.phone,
        custom_attributes: {
          customer_id: customer.id,
          customer_type: customer.type,
          registration_date: customer.createdAt,
          total_repairs: repairs.length,
          last_repair_date: repairs[0]?.createdAt,
          preferred_language: customer.language || 'en',
          loyalty_tier: customer.loyaltyTier,
          repair_history: repairs.map(repair => ({
            id: repair.id,
            device: `${repair.device.brand} ${repair.device.model}`,
            type: repair.type,
            status: repair.status,
            created_at: repair.createdAt,
            technician: repair.technician?.name
          }))
        }
      });

      return chatwootContact;
    } catch (error) {
      console.error('Failed to sync customer profile:', error);
      throw error;
    }
  }

  static async updateCustomerContext(conversationId: number, customerId: string) {
    try {
      // Get recent repair activity
      const recentRepairs = await prisma.repair.findMany({
        where: { 
          customerId,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        },
        include: {
          device: true,
          quotes: true
        }
      });

      // Get pending quotes
      const pendingQuotes = await prisma.quote.findMany({
        where: {
          repair: { customerId },
          status: 'pending'
        },
        include: {
          repair: {
            include: { device: true }
          }
        }
      });

      // Update conversation context
      await chatwootClient.conversations.update(conversationId, {
        custom_attributes: {
          recent_repairs: recentRepairs.length,
          pending_quotes: pendingQuotes.length,
          last_interaction: new Date().toISOString(),
          context: {
            active_repairs: recentRepairs.filter(r => r.status !== 'completed'),
            pending_quotes: pendingQuotes.map(q => ({
              id: q.id,
              device: `${q.repair.device.brand} ${q.repair.device.model}`,
              amount: q.totalCost,
              created_at: q.createdAt
            }))
          }
        }
      });
    } catch (error) {
      console.error('Failed to update customer context:', error);
    }
  }
}
```

### Deliverables
- [ ] Webhook handler for Chatwoot events
- [ ] CRM ticket creation from conversations
- [ ] Customer profile synchronization
- [ ] Conversation context enrichment
- [ ] Automated workflow triggers
- [ ] Message logging to CRM

## Phase 6: Advanced Features & Testing

**Duration**: 2-3 weeks
**Objective**: Polish features, implement AI capabilities, and comprehensive testing

### AI Integration

#### Chatwoot AI Configuration
```typescript
// lib/chat/ai-config.ts
export const chatwootAIConfig = {
  captain: {
    enabled: true,
    provider: 'openai',
    model: 'gpt-4o-mini',
    instructions: `
      You are a helpful assistant for Revivatech Computer Repair Shop.
      
      Key Information:
      - We repair Apple devices (MacBook, iMac, iPad, iPhone)
      - We repair PC laptops and desktops
      - We handle Android devices and gaming consoles
      - We offer data recovery services
      - Business hours: Monday-Friday 9AM-6PM, Saturday 10AM-4PM
      - We provide free diagnostics
      - Standard repair time is 3-5 business days
      - Express service available for urgent repairs
      
      Common Repair Types:
      - Screen replacements (LCD, OLED, Retina)
      - Battery replacements
      - Logic board repairs
      - Storage upgrades
      - RAM upgrades
      - Keyboard/trackpad repairs
      - Port repairs
      - Liquid damage repair
      - Virus removal
      - Data recovery
      
      Guidelines:
      - Always be helpful and professional
      - Ask for device model if not specified
      - Explain repair process clearly
      - Mention warranty on repairs
      - Offer to schedule appointments
      - If complex issue, suggest technician consultation
      - For urgent matters, prioritize human handoff
      
      If asked about pricing, provide estimates but mention final quote after diagnosis.
      For data recovery, emphasize our success rate and secure process.
    `,
    temperature: 0.3,
    max_tokens: 500
  },
  
  copilot: {
    enabled: true,
    provider: 'openai',
    model: 'gpt-4o-mini',
    instructions: `
      You are an AI assistant helping customer service agents at Revivatech Computer Repair Shop.
      
      Your role:
      - Suggest responses to customer messages
      - Provide technical information about repairs
      - Help with pricing estimates
      - Recommend solutions for common issues
      - Assist with appointment scheduling
      
      Always consider:
      - Customer's device type and model
      - Repair history if available
      - Current repair status
      - Customer's tone and urgency
      
      Provide concise, helpful suggestions that agents can use or adapt.
    `,
    temperature: 0.2,
    max_tokens: 300
  }
};
```

### Performance Monitoring

#### Chat Analytics Dashboard
```typescript
// components/admin/chat/ChatAnalytics.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { MessageCircle, Clock, CheckCircle, Users } from 'lucide-react';

interface ChatMetrics {
  total_conversations: number;
  avg_response_time: number;
  resolution_rate: number;
  customer_satisfaction: number;
  daily_stats: Array<{
    date: string;
    conversations: number;
    resolved: number;
    avg_response_time: number;
  }>;
  agent_performance: Array<{
    agent_name: string;
    conversations: number;
    avg_response_time: number;
    resolution_rate: number;
  }>;
}

export const ChatAnalytics: React.FC = () => {
  const [metrics, setMetrics] = useState<ChatMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/admin/chat/analytics');
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error('Failed to fetch chat metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !metrics) {
    return <div>Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Chat Analytics</h2>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total_conversations}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(metrics.avg_response_time / 60)}min
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(metrics.resolution_rate * 100)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customer Satisfaction</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(metrics.customer_satisfaction * 100)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Conversations Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Conversations</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metrics.daily_stats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="conversations" 
                stroke="var(--nordic-primary)" 
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="resolved" 
                stroke="var(--nordic-green)" 
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Agent Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metrics.agent_performance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="agent_name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="conversations" fill="var(--nordic-primary)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
```

### Testing Strategy

#### Test Cases
```typescript
// __tests__/chat/chatwoot-integration.test.ts
import { render, screen, waitFor } from '@testing-library/react';
import { ChatwootWidget } from '@/components/chat/ChatwootWidget';
import { mockChatwootSDK } from '@/test-utils/mocks';

describe('ChatwootWidget', () => {
  beforeEach(() => {
    mockChatwootSDK();
  });

  it('loads Chatwoot SDK script', async () => {
    render(
      <ChatwootWidget 
        websiteToken="test-token" 
        baseUrl="https://chat.example.com" 
      />
    );

    await waitFor(() => {
      const script = document.querySelector('script[src*="sdk.js"]');
      expect(script).toBeInTheDocument();
    });
  });

  it('authenticates user when provided', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      name: 'Test User',
      identifierHash: 'hash123'
    };

    render(
      <ChatwootWidget 
        websiteToken="test-token" 
        baseUrl="https://chat.example.com"
        user={mockUser}
      />
    );

    await waitFor(() => {
      expect(window.$chatwoot.setUser).toHaveBeenCalledWith('123', {
        email: 'test@example.com',
        name: 'Test User',
        identifier_hash: 'hash123'
      });
    });
  });
});
```

### Deployment Checklist

#### Production Readiness
- [ ] Chatwoot server configured with SSL
- [ ] Environment variables secured
- [ ] Database backups configured
- [ ] Monitoring and alerting set up
- [ ] Performance optimization completed
- [ ] Security audit passed
- [ ] Load testing completed
- [ ] Agent training completed
- [ ] Documentation finalized
- [ ] Rollback plan prepared

#### Go-Live Tasks
- [ ] DNS configuration for chat subdomain
- [ ] SSL certificate installation
- [ ] Production deployment
- [ ] Widget integration on live site
- [ ] Agent accounts created
- [ ] Initial canned responses configured
- [ ] Monitoring dashboards active
- [ ] Support team briefed

### Deliverables
- [ ] AI-powered customer support
- [ ] Advanced analytics dashboard
- [ ] Performance monitoring
- [ ] Comprehensive testing suite
- [ ] Production deployment
- [ ] Agent training materials
- [ ] Operations documentation

## Success Metrics

### Key Performance Indicators
- **Response Time**: Target < 2 minutes average
- **Resolution Rate**: Target > 85%
- **Customer Satisfaction**: Target > 90%
- **Agent Utilization**: Target 70-80%
- **Conversation Volume**: Monitor growth trends
- **Integration Reliability**: Target 99.9% uptime

### Monitoring Tools
- Chatwoot built-in analytics
- Custom dashboard for CRM integration metrics
- Alert system for critical issues
- Weekly performance reports
- Customer feedback collection

This comprehensive implementation guide provides the foundation for a robust, scalable chat messaging system that enhances customer experience while maintaining operational efficiency.