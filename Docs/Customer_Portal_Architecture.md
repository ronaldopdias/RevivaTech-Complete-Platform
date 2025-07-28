# Customer Portal Architecture Documentation

## Overview

This document outlines the comprehensive architecture for the Revivatech Customer Portal, a sophisticated web application that provides customers with full visibility and control over their device repair journey. The portal integrates seamlessly with the chat messaging system, CRM, and admin dashboard to deliver a unified experience.

## Architecture Principles

### 1. User-Centric Design
- Customer needs drive all architectural decisions
- Intuitive navigation and clear information hierarchy
- Responsive design for all device types
- Accessibility compliance (WCAG 2.1 AA)

### 2. Real-Time Communication
- Live updates for repair status changes
- Instant chat messaging with technicians
- Push notifications for important events
- WebSocket-based real-time data flow

### 3. Security & Privacy
- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- Encrypted data transmission
- GDPR/LGPD compliance

### 4. Scalable Performance
- Component-based architecture
- Optimized database queries
- CDN integration for assets
- Progressive Web App (PWA) capabilities

## System Architecture

### High-Level Overview
```
┌─────────────────────────────────────────────────────────────┐
│                    Customer Portal                         │
├─────────────────────────────────────────────────────────────┤
│ Frontend (Next.js)   │ Backend (Node.js)  │ External APIs   │
│ ├── Dashboard        │ ├── Authentication │ ├── Chatwoot    │
│ ├── Profile          │ ├── Customer API   │ ├── CRM         │
│ ├── Repair Tracking  │ ├── Repair API     │ ├── Payment     │
│ ├── Chat Widget      │ ├── File Upload    │ ├── SMS/Email   │
│ ├── Notifications    │ ├── WebSocket      │ └── Analytics   │
│ └── PWA Shell        │ └── Webhooks       │                 │
└─────────────────────────────────────────────────────────────┘
│                           │                    │             │
│     PostgreSQL            │      Redis         │   File      │
│   (Primary Data)          │   (Cache/Session)  │  Storage    │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

#### Frontend Layer
```typescript
// Core Technologies
- Next.js 15 (App Router)
- React 19 with Server Components
- TypeScript for type safety
- Tailwind CSS with Nordic Design System
- Framer Motion for animations
- React Query for data fetching
- Zustand for client state management

// UI Components
- shadcn/ui component library
- Lucide React icons
- React Hook Form with Zod validation
- Sonner for notifications
```

#### Backend Layer
```typescript
// Server Technologies
- Node.js 20 LTS
- Express.js with TypeScript
- Prisma ORM for database management
- Redis for caching and sessions
- Socket.IO for real-time communication
- Multer for file uploads

// Authentication & Security
- JWT with refresh token rotation
- bcrypt for password hashing
- Helmet for security headers
- Rate limiting with express-rate-limit
- CORS configuration
```

#### Database Layer
```sql
-- PostgreSQL Schema Overview
- Customer accounts and profiles
- Device and repair records
- Chat conversations and messages
- File attachments and documents
- Audit logs and system events
- Cache layer with Redis
```

## Frontend Architecture

### Component Structure

#### Core Layout Components
```
src/components/customer/
├── layout/
│   ├── CustomerLayout.tsx       # Main portal layout
│   ├── NavigationSidebar.tsx    # Side navigation
│   ├── TopHeader.tsx            # Header with user info
│   ├── MobileNavigation.tsx     # Mobile hamburger menu
│   └── NotificationBell.tsx     # Real-time notifications
├── dashboard/
│   ├── DashboardOverview.tsx    # Main dashboard page
│   ├── StatsGrid.tsx            # Repair statistics grid
│   ├── RecentActivity.tsx       # Activity timeline
│   ├── QuickActions.tsx         # Common action buttons
│   └── UpcomingAppointments.tsx # Scheduled appointments
├── repairs/
│   ├── RepairList.tsx           # List of all repairs
│   ├── RepairCard.tsx           # Individual repair card
│   ├── RepairDetails.tsx        # Detailed repair view
│   ├── RepairTimeline.tsx       # Status progression
│   ├── RepairPhotos.tsx         # Device photos gallery
│   └── RepairDocuments.tsx      # Invoices and documents
├── profile/
│   ├── ProfileOverview.tsx      # Profile summary
│   ├── PersonalInfo.tsx         # Contact information
│   ├── SecuritySettings.tsx     # Password and 2FA
│   ├── NotificationPrefs.tsx    # Communication preferences
│   ├── AddressBook.tsx          # Saved addresses
│   └── AccountDeletion.tsx      # Account management
├── chat/
│   ├── ChatInterface.tsx        # Embedded chat
│   ├── ChatHistory.tsx          # Previous conversations
│   ├── ChatQuickActions.tsx     # Pre-defined responses
│   └── FileSharing.tsx          # Document sharing
└── shared/
    ├── LoadingStates.tsx        # Skeleton components
    ├── ErrorBoundary.tsx        # Error handling
    ├── EmptyStates.tsx          # No data states
    └── ConfirmationModal.tsx    # Action confirmations
```

#### State Management Architecture
```typescript
// Zustand Store Structure
interface CustomerPortalState {
  // User state
  user: Customer | null;
  isAuthenticated: boolean;
  permissions: string[];
  
  // Repair state
  repairs: Repair[];
  activeRepair: Repair | null;
  repairFilters: RepairFilters;
  
  // Chat state
  conversations: Conversation[];
  activeConversation: Conversation | null;
  unreadCount: number;
  isTyping: boolean;
  
  // UI state
  sidebarOpen: boolean;
  notifications: Notification[];
  loading: {
    repairs: boolean;
    profile: boolean;
    chat: boolean;
  };
  
  // Actions
  setUser: (user: Customer) => void;
  updateRepair: (repairId: string, updates: Partial<Repair>) => void;
  addNotification: (notification: Notification) => void;
  toggleSidebar: () => void;
}
```

### Page Structure

#### Dashboard Page (`/customer/dashboard`)
```typescript
// pages/customer/dashboard/page.tsx
export default function CustomerDashboard() {
  return (
    <CustomerLayout>
      <div className="nordic-dashboard-container">
        <DashboardHeader />
        <StatsGrid />
        <div className="nordic-dashboard-grid">
          <div className="nordic-main-content">
            <RecentActivity />
            <UpcomingAppointments />
          </div>
          <div className="nordic-sidebar-content">
            <QuickActions />
            <ChatInterface />
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}
```

#### Repair Details Page (`/customer/repairs/[id]`)
```typescript
// pages/customer/repairs/[id]/page.tsx
interface RepairDetailsPageProps {
  params: { id: string };
}

export default function RepairDetailsPage({ params }: RepairDetailsPageProps) {
  const { data: repair, isLoading } = useRepairDetails(params.id);
  
  if (isLoading) return <RepairDetailsSkeleton />;
  if (!repair) return <RepairNotFound />;
  
  return (
    <CustomerLayout>
      <div className="nordic-repair-details">
        <RepairHeader repair={repair} />
        <div className="nordic-repair-content">
          <RepairTimeline repair={repair} />
          <RepairPhotos repair={repair} />
          <RepairDocuments repair={repair} />
        </div>
      </div>
    </CustomerLayout>
  );
}
```

### Authentication Flow

#### JWT Implementation
```typescript
// lib/auth/customer-auth.ts
export class CustomerAuth {
  private static readonly ACCESS_TOKEN_KEY = 'customer_access_token';
  private static readonly REFRESH_TOKEN_KEY = 'customer_refresh_token';
  
  static async authenticate(email: string, password: string): Promise<AuthResult> {
    try {
      const response = await fetch('/api/customer/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        this.setTokens(data.accessToken, data.refreshToken);
        return { success: true, user: data.user };
      }
      
      return { success: false, error: data.message };
    } catch (error) {
      return { success: false, error: 'Authentication failed' };
    }
  }
  
  static async refreshToken(): Promise<string | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return null;
    
    try {
      const response = await fetch('/api/customer/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });
      
      if (response.ok) {
        const { accessToken, refreshToken: newRefreshToken } = await response.json();
        this.setTokens(accessToken, newRefreshToken);
        return accessToken;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }
    
    this.clearTokens();
    return null;
  }
  
  static async getCurrentUser(): Promise<Customer | null> {
    const token = this.getAccessToken();
    if (!token || this.isTokenExpired(token)) {
      const newToken = await this.refreshToken();
      if (!newToken) return null;
    }
    
    try {
      const response = await fetch('/api/customer/profile', {
        headers: { Authorization: `Bearer ${this.getAccessToken()}` }
      });
      
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Failed to get current user:', error);
    }
    
    return null;
  }
}
```

#### Protected Route Component
```typescript
// components/auth/ProtectedRoute.tsx
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermissions = [],
  fallback = <LoginRedirect />
}) => {
  const { user, isLoading, isAuthenticated } = useAuth();
  
  if (isLoading) {
    return <CustomerPortalSkeleton />;
  }
  
  if (!isAuthenticated) {
    return fallback;
  }
  
  if (requiredPermissions.length > 0) {
    const hasPermissions = requiredPermissions.every(
      permission => user?.permissions?.includes(permission)
    );
    
    if (!hasPermissions) {
      return <UnauthorizedAccess />;
    }
  }
  
  return <>{children}</>;
};
```

## Backend Architecture

### API Structure

#### Customer API Endpoints
```typescript
// routes/customer/index.ts
const customerRoutes = {
  // Authentication
  'POST /auth/login': customerAuth.login,
  'POST /auth/logout': customerAuth.logout,
  'POST /auth/refresh': customerAuth.refresh,
  'POST /auth/forgot-password': customerAuth.forgotPassword,
  'POST /auth/reset-password': customerAuth.resetPassword,
  
  // Profile Management
  'GET /profile': customerProfile.get,
  'PUT /profile': customerProfile.update,
  'PUT /profile/password': customerProfile.changePassword,
  'POST /profile/2fa/enable': customerProfile.enable2FA,
  'POST /profile/2fa/verify': customerProfile.verify2FA,
  'DELETE /profile/2fa': customerProfile.disable2FA,
  
  // Repair Management
  'GET /repairs': customerRepairs.list,
  'GET /repairs/:id': customerRepairs.get,
  'GET /repairs/:id/timeline': customerRepairs.timeline,
  'GET /repairs/:id/photos': customerRepairs.photos,
  'POST /repairs/:id/photos': customerRepairs.uploadPhoto,
  'GET /repairs/:id/documents': customerRepairs.documents,
  
  // Quotes and Approvals
  'GET /quotes': customerQuotes.list,
  'GET /quotes/:id': customerQuotes.get,
  'POST /quotes/:id/approve': customerQuotes.approve,
  'POST /quotes/:id/reject': customerQuotes.reject,
  
  // Chat and Communication
  'GET /conversations': customerChat.conversations,
  'GET /conversations/:id/messages': customerChat.messages,
  'POST /conversations/:id/messages': customerChat.sendMessage,
  'POST /conversations/:id/files': customerChat.uploadFile,
  
  // Notifications
  'GET /notifications': customerNotifications.list,
  'PUT /notifications/:id/read': customerNotifications.markRead,
  'PUT /notifications/read-all': customerNotifications.markAllRead,
  'PUT /notifications/preferences': customerNotifications.updatePreferences,
  
  // Dashboard Data
  'GET /dashboard/stats': customerDashboard.stats,
  'GET /dashboard/activity': customerDashboard.recentActivity,
  'GET /dashboard/appointments': customerDashboard.upcomingAppointments
};
```

#### Service Layer Architecture
```typescript
// services/customer/CustomerService.ts
export class CustomerService {
  constructor(
    private customerRepo: CustomerRepository,
    private repairRepo: RepairRepository,
    private notificationService: NotificationService,
    private cacheService: CacheService
  ) {}
  
  async getDashboardStats(customerId: string): Promise<DashboardStats> {
    const cacheKey = `customer:${customerId}:dashboard_stats`;
    const cached = await this.cacheService.get(cacheKey);
    
    if (cached) return cached;
    
    const stats = await Promise.all([
      this.repairRepo.countByCustomer(customerId),
      this.repairRepo.countActiveByCustomer(customerId),
      this.repairRepo.countCompletedByCustomer(customerId),
      this.repairRepo.getSuccessRateByCustomer(customerId),
      this.repairRepo.getAverageCompletionTime(customerId)
    ]);
    
    const result = {
      totalRepairs: stats[0],
      activeRepairs: stats[1],
      completedRepairs: stats[2],
      successRate: stats[3],
      avgCompletionTime: stats[4]
    };
    
    await this.cacheService.set(cacheKey, result, 300); // Cache for 5 minutes
    return result;
  }
  
  async updateRepairStatus(
    repairId: string,
    status: RepairStatus,
    customerId: string
  ): Promise<void> {
    const repair = await this.repairRepo.findById(repairId);
    
    if (!repair || repair.customerId !== customerId) {
      throw new Error('Repair not found or access denied');
    }
    
    await this.repairRepo.updateStatus(repairId, status);
    
    // Invalidate cache
    await this.cacheService.delete(`customer:${customerId}:dashboard_stats`);
    
    // Send real-time notification
    await this.notificationService.sendToCustomer(customerId, {
      type: 'repair_status_updated',
      title: 'Repair Status Updated',
      message: `Your ${repair.deviceModel} repair status changed to ${status}`,
      repairId
    });
  }
}
```

### Database Schema

#### Customer Portal Tables
```sql
-- Customer accounts
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  avatar_url TEXT,
  language VARCHAR(5) DEFAULT 'en',
  timezone VARCHAR(50) DEFAULT 'UTC',
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret VARCHAR(32),
  email_verified BOOLEAN DEFAULT FALSE,
  email_verified_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customer addresses
CREATE TABLE customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL, -- 'home', 'work', 'other'
  label VARCHAR(100),
  street_address TEXT NOT NULL,
  apartment VARCHAR(50),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  country VARCHAR(100) NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customer sessions and tokens
CREATE TABLE customer_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  refresh_token VARCHAR(255) UNIQUE NOT NULL,
  device_info JSONB,
  ip_address INET,
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customer preferences
CREATE TABLE customer_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  marketing_emails BOOLEAN DEFAULT FALSE,
  repair_updates BOOLEAN DEFAULT TRUE,
  quote_notifications BOOLEAN DEFAULT TRUE,
  chat_notifications BOOLEAN DEFAULT TRUE,
  theme VARCHAR(10) DEFAULT 'system', -- 'light', 'dark', 'system'
  dashboard_layout JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Devices associated with customers
CREATE TABLE customer_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  device_type VARCHAR(50) NOT NULL,
  brand VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  serial_number VARCHAR(100),
  purchase_date DATE,
  warranty_expires DATE,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Repair records
CREATE TABLE repairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  device_id UUID REFERENCES customer_devices(id),
  repair_number VARCHAR(50) UNIQUE NOT NULL,
  device_type VARCHAR(50) NOT NULL,
  device_brand VARCHAR(100) NOT NULL,
  device_model VARCHAR(100) NOT NULL,
  issue_description TEXT NOT NULL,
  repair_type VARCHAR(100) NOT NULL,
  priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  status VARCHAR(50) DEFAULT 'received', -- 'received', 'diagnosing', 'quoted', 'approved', 'repairing', 'testing', 'completed', 'cancelled'
  technician_id UUID REFERENCES users(id),
  estimated_completion TIMESTAMPTZ,
  actual_completion TIMESTAMPTZ,
  repair_cost DECIMAL(10,2),
  parts_cost DECIMAL(10,2),
  labor_cost DECIMAL(10,2),
  total_cost DECIMAL(10,2),
  warranty_months INTEGER DEFAULT 6,
  notes TEXT,
  internal_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Repair status history
CREATE TABLE repair_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repair_id UUID REFERENCES repairs(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL,
  previous_status VARCHAR(50),
  changed_by UUID REFERENCES users(id),
  notes TEXT,
  customer_notified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quotes for repairs
CREATE TABLE repair_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repair_id UUID REFERENCES repairs(id) ON DELETE CASCADE,
  quote_number VARCHAR(50) UNIQUE NOT NULL,
  parts_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  labor_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_cost DECIMAL(10,2) NOT NULL,
  estimated_time_hours INTEGER,
  warranty_months INTEGER DEFAULT 6,
  parts_breakdown JSONB DEFAULT '[]',
  labor_breakdown JSONB DEFAULT '[]',
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'expired'
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES customers(id),
  expires_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- File attachments for repairs
CREATE TABLE repair_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repair_id UUID REFERENCES repairs(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES users(id),
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  file_type VARCHAR(100),
  attachment_type VARCHAR(50), -- 'photo', 'document', 'invoice', 'warranty'
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE, -- Visible to customer
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customer notifications
CREATE TABLE customer_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  priority VARCHAR(10) DEFAULT 'normal', -- 'low', 'normal', 'high'
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customer activity log
CREATE TABLE customer_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  activity_type VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customer_sessions_token ON customer_sessions(refresh_token);
CREATE INDEX idx_customer_sessions_customer ON customer_sessions(customer_id);
CREATE INDEX idx_repairs_customer ON repairs(customer_id);
CREATE INDEX idx_repairs_status ON repairs(status);
CREATE INDEX idx_repairs_created ON repairs(created_at);
CREATE INDEX idx_repair_quotes_repair ON repair_quotes(repair_id);
CREATE INDEX idx_repair_quotes_status ON repair_quotes(status);
CREATE INDEX idx_notifications_customer ON customer_notifications(customer_id);
CREATE INDEX idx_notifications_unread ON customer_notifications(customer_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_activity_log_customer ON customer_activity_log(customer_id);
CREATE INDEX idx_activity_log_created ON customer_activity_log(created_at);
```

## Real-Time Features

### WebSocket Integration

#### Socket.IO Server Setup
```typescript
// lib/websocket/customer-socket.ts
import { Server as SocketIOServer } from 'socket.io';
import { CustomerAuth } from '../auth/customer-auth';

export class CustomerSocketServer {
  private io: SocketIOServer;
  
  constructor(server: any) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL,
        credentials: true
      },
      path: '/customer/socket.io'
    });
    
    this.setupAuthentication();
    this.setupEventHandlers();
  }
  
  private setupAuthentication() {
    this.io.use(async (socket, next) => {
      const token = socket.handshake.auth.token;
      
      try {
        const customer = await CustomerAuth.verifyToken(token);
        socket.customerId = customer.id;
        socket.customerEmail = customer.email;
        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });
  }
  
  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`Customer ${socket.customerEmail} connected`);
      
      // Join customer-specific room
      socket.join(`customer:${socket.customerId}`);
      
      // Handle repair status requests
      socket.on('subscribe:repair', (repairId) => {
        socket.join(`repair:${repairId}`);
      });
      
      socket.on('unsubscribe:repair', (repairId) => {
        socket.leave(`repair:${repairId}`);
      });
      
      // Handle chat events
      socket.on('chat:typing', (data) => {
        socket.to(`repair:${data.repairId}`).emit('chat:user_typing', {
          customerName: socket.customerEmail,
          isTyping: data.isTyping
        });
      });
      
      socket.on('disconnect', () => {
        console.log(`Customer ${socket.customerEmail} disconnected`);
      });
    });
  }
  
  // Methods for sending updates to customers
  sendRepairUpdate(customerId: string, repairId: string, update: RepairUpdate) {
    this.io.to(`customer:${customerId}`).emit('repair:status_update', {
      repairId,
      ...update
    });
  }
  
  sendNotification(customerId: string, notification: Notification) {
    this.io.to(`customer:${customerId}`).emit('notification:new', notification);
  }
  
  sendChatMessage(repairId: string, message: ChatMessage) {
    this.io.to(`repair:${repairId}`).emit('chat:message', message);
  }
}
```

#### Client-Side WebSocket Hook
```typescript
// hooks/useCustomerSocket.ts
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './useAuth';
import { useToast } from './useToast';

export const useCustomerSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user, getAccessToken } = useAuth();
  const { toast } = useToast();
  const reconnectAttempts = useRef(0);
  
  useEffect(() => {
    if (!user) return;
    
    const token = getAccessToken();
    if (!token) return;
    
    const newSocket = io(process.env.NEXT_PUBLIC_WS_URL!, {
      path: '/customer/socket.io',
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
    
    newSocket.on('connect', () => {
      setIsConnected(true);
      reconnectAttempts.current = 0;
      console.log('Customer socket connected');
    });
    
    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Customer socket disconnected');
    });
    
    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      reconnectAttempts.current++;
      
      if (reconnectAttempts.current >= 3) {
        toast({
          title: 'Connection Error',
          description: 'Unable to connect to real-time updates',
          variant: 'destructive'
        });
      }
    });
    
    // Handle real-time events
    newSocket.on('repair:status_update', (data) => {
      toast({
        title: 'Repair Update',
        description: `Your repair status has been updated to: ${data.status}`,
        variant: 'default'
      });
    });
    
    newSocket.on('notification:new', (notification) => {
      toast({
        title: notification.title,
        description: notification.message,
        variant: notification.priority === 'high' ? 'destructive' : 'default'
      });
    });
    
    newSocket.on('chat:message', (message) => {
      if (message.senderId !== user.id) {
        toast({
          title: 'New Message',
          description: `${message.senderName}: ${message.content}`,
          variant: 'default'
        });
      }
    });
    
    setSocket(newSocket);
    
    return () => {
      newSocket.disconnect();
    };
  }, [user, getAccessToken, toast]);
  
  const subscribeToRepair = (repairId: string) => {
    socket?.emit('subscribe:repair', repairId);
  };
  
  const unsubscribeFromRepair = (repairId: string) => {
    socket?.emit('unsubscribe:repair', repairId);
  };
  
  const sendTypingIndicator = (repairId: string, isTyping: boolean) => {
    socket?.emit('chat:typing', { repairId, isTyping });
  };
  
  return {
    socket,
    isConnected,
    subscribeToRepair,
    unsubscribeFromRepair,
    sendTypingIndicator
  };
};
```

## Integration Points

### Chatwoot Integration

#### Chat Widget Integration
```typescript
// components/customer/chat/CustomerChatWidget.tsx
'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCustomerSocket } from '@/hooks/useCustomerSocket';

export const CustomerChatWidget: React.FC = () => {
  const { user } = useAuth();
  const { isConnected } = useCustomerSocket();
  
  useEffect(() => {
    if (!user || !isConnected) return;
    
    // Initialize Chatwoot with customer authentication
    if (window.$chatwoot) {
      window.$chatwoot.setUser(user.id, {
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        phone_number: user.phone,
        avatar_url: user.avatarUrl,
        identifier_hash: user.identifierHash, // HMAC for security
        custom_attributes: {
          customer_type: 'portal_user',
          registration_date: user.createdAt,
          total_repairs: user.repairCount || 0,
          preferred_language: user.language || 'en',
          timezone: user.timezone || 'UTC'
        }
      });
    }
  }, [user, isConnected]);
  
  return null; // Widget is injected by Chatwoot script
};
```

#### Chat Context Provider
```typescript
// components/customer/chat/ChatContextProvider.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { useCustomerSocket } from '@/hooks/useCustomerSocket';

interface ChatContextValue {
  activeConversation: Conversation | null;
  conversations: Conversation[];
  unreadCount: number;
  isTyping: boolean;
  sendMessage: (content: string, files?: File[]) => Promise<void>;
  markAsRead: (conversationId: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export const ChatContextProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const { socket } = useCustomerSocket();
  
  useEffect(() => {
    if (!socket) return;
    
    socket.on('chat:message', (message: ChatMessage) => {
      setConversations(prev => prev.map(conv => 
        conv.id === message.conversationId
          ? { ...conv, messages: [...conv.messages, message] }
          : conv
      ));
      
      if (message.senderId !== user.id) {
        setUnreadCount(prev => prev + 1);
      }
    });
    
    socket.on('chat:agent_typing', (data) => {
      setIsTyping(data.isTyping);
    });
    
    return () => {
      socket.off('chat:message');
      socket.off('chat:agent_typing');
    };
  }, [socket]);
  
  const sendMessage = async (content: string, files?: File[]) => {
    if (!activeConversation) return;
    
    const formData = new FormData();
    formData.append('content', content);
    formData.append('conversationId', activeConversation.id);
    
    if (files) {
      files.forEach(file => formData.append('files', file));
    }
    
    await fetch('/api/customer/chat/send', {
      method: 'POST',
      body: formData,
      headers: {
        Authorization: `Bearer ${getAccessToken()}`
      }
    });
  };
  
  const markAsRead = async (conversationId: string) => {
    await fetch(`/api/customer/chat/conversations/${conversationId}/read`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${getAccessToken()}`
      }
    });
    
    setUnreadCount(prev => Math.max(0, prev - 1));
  };
  
  return (
    <ChatContext.Provider value={{
      activeConversation,
      conversations,
      unreadCount,
      isTyping,
      sendMessage,
      markAsRead
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within ChatContextProvider');
  }
  return context;
};
```

### CRM Integration

#### Customer Profile Sync
```typescript
// services/customer/CustomerSyncService.ts
export class CustomerSyncService {
  constructor(
    private crmClient: CRMClient,
    private customerRepo: CustomerRepository
  ) {}
  
  async syncCustomerToCRM(customerId: string): Promise<void> {
    const customer = await this.customerRepo.findById(customerId);
    if (!customer) throw new Error('Customer not found');
    
    const crmData = {
      external_id: customer.id,
      email: customer.email,
      first_name: customer.firstName,
      last_name: customer.lastName,
      phone: customer.phone,
      language: customer.language,
      timezone: customer.timezone,
      source: 'customer_portal',
      custom_fields: {
        portal_user: true,
        registration_date: customer.createdAt,
        last_login: customer.lastLoginAt,
        email_verified: customer.emailVerified,
        two_factor_enabled: customer.twoFactorEnabled
      }
    };
    
    await this.crmClient.contacts.createOrUpdate(crmData);
  }
  
  async syncRepairToCRM(repairId: string): Promise<void> {
    const repair = await this.repairRepo.findByIdWithCustomer(repairId);
    if (!repair) throw new Error('Repair not found');
    
    // Create or update contact first
    await this.syncCustomerToCRM(repair.customerId);
    
    // Create deal/opportunity in CRM
    const dealData = {
      name: `${repair.deviceBrand} ${repair.deviceModel} Repair`,
      contact_email: repair.customer.email,
      amount: repair.totalCost || 0,
      stage: this.mapRepairStatusToCRMStage(repair.status),
      source: 'customer_portal',
      custom_fields: {
        repair_number: repair.repairNumber,
        device_type: repair.deviceType,
        device_brand: repair.deviceBrand,
        device_model: repair.deviceModel,
        repair_type: repair.repairType,
        priority: repair.priority,
        estimated_completion: repair.estimatedCompletion,
        technician_id: repair.technicianId
      }
    };
    
    await this.crmClient.deals.createOrUpdate(dealData);
  }
  
  private mapRepairStatusToCRMStage(status: RepairStatus): string {
    const statusMap = {
      'received': 'qualified',
      'diagnosing': 'needs_analysis',
      'quoted': 'proposal',
      'approved': 'negotiation',
      'repairing': 'closed_won',
      'testing': 'closed_won',
      'completed': 'closed_won',
      'cancelled': 'closed_lost'
    };
    
    return statusMap[status] || 'qualified';
  }
}
```

## Security Implementation

### Authentication & Authorization

#### JWT Security
```typescript
// lib/auth/jwt-security.ts
export class JWTSecurity {
  private static readonly ACCESS_TOKEN_EXPIRY = '15m';
  private static readonly REFRESH_TOKEN_EXPIRY = '7d';
  
  static generateTokenPair(customer: Customer): TokenPair {
    const payload = {
      sub: customer.id,
      email: customer.email,
      role: 'customer',
      permissions: customer.permissions || [],
      iat: Math.floor(Date.now() / 1000)
    };
    
    const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY,
      issuer: 'revivatech-portal',
      audience: 'customer'
    });
    
    const refreshToken = jwt.sign(
      { sub: customer.id, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET!,
      {
        expiresIn: this.REFRESH_TOKEN_EXPIRY,
        issuer: 'revivatech-portal',
        audience: 'customer'
      }
    );
    
    return { accessToken, refreshToken };
  }
  
  static async verifyAccessToken(token: string): Promise<CustomerPayload> {
    try {
      const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET!, {
        issuer: 'revivatech-portal',
        audience: 'customer'
      }) as CustomerPayload;
      
      return payload;
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }
  
  static async rotateRefreshToken(
    refreshToken: string
  ): Promise<TokenPair | null> {
    try {
      const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!, {
        issuer: 'revivatech-portal',
        audience: 'customer'
      }) as { sub: string; type: string };
      
      if (payload.type !== 'refresh') {
        throw new Error('Invalid token type');
      }
      
      // Check if refresh token exists in database
      const session = await prisma.customerSession.findUnique({
        where: { refreshToken },
        include: { customer: true }
      });
      
      if (!session || session.expiresAt < new Date()) {
        throw new Error('Session expired or invalid');
      }
      
      // Generate new token pair
      const newTokens = this.generateTokenPair(session.customer);
      
      // Update session with new refresh token
      await prisma.customerSession.update({
        where: { id: session.id },
        data: {
          refreshToken: newTokens.refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        }
      });
      
      return newTokens;
    } catch (error) {
      return null;
    }
  }
}
```

#### Rate Limiting
```typescript
// middleware/rate-limiting.ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!);

export const customerAuthLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args)
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: {
    error: 'Too many login attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

export const customerAPILimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args)
  }),
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Limit each customer to 100 requests per minute
  keyGenerator: (req) => {
    return req.user?.id || req.ip; // Use customer ID if authenticated
  },
  message: {
    error: 'Too many requests, please try again later'
  }
});
```

## Performance Optimization

### Caching Strategy

#### Redis Caching Implementation
```typescript
// lib/cache/CustomerCache.ts
export class CustomerCache {
  private redis: Redis;
  
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL!);
  }
  
  // Customer dashboard stats caching
  async getDashboardStats(customerId: string): Promise<DashboardStats | null> {
    const key = `customer:${customerId}:dashboard_stats`;
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }
  
  async setDashboardStats(customerId: string, stats: DashboardStats): Promise<void> {
    const key = `customer:${customerId}:dashboard_stats`;
    await this.redis.setex(key, 300, JSON.stringify(stats)); // 5 minutes
  }
  
  // Customer profile caching
  async getCustomerProfile(customerId: string): Promise<Customer | null> {
    const key = `customer:${customerId}:profile`;
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }
  
  async setCustomerProfile(customer: Customer): Promise<void> {
    const key = `customer:${customer.id}:profile`;
    await this.redis.setex(key, 1800, JSON.stringify(customer)); // 30 minutes
  }
  
  async invalidateCustomer(customerId: string): Promise<void> {
    const keys = await this.redis.keys(`customer:${customerId}:*`);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
  
  // Repair data caching
  async getCustomerRepairs(customerId: string): Promise<Repair[] | null> {
    const key = `customer:${customerId}:repairs`;
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }
  
  async setCustomerRepairs(customerId: string, repairs: Repair[]): Promise<void> {
    const key = `customer:${customerId}:repairs`;
    await this.redis.setex(key, 600, JSON.stringify(repairs)); // 10 minutes
  }
}
```

### Database Optimization

#### Query Optimization
```typescript
// repositories/CustomerRepository.ts
export class CustomerRepository {
  constructor(private prisma: PrismaClient) {}
  
  async findByIdWithRepairs(customerId: string): Promise<CustomerWithRepairs | null> {
    return this.prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        repairs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            technician: {
              select: { id: true, firstName: true, lastName: true }
            },
            quotes: {
              where: { status: 'pending' },
              orderBy: { createdAt: 'desc' },
              take: 1
            },
            attachments: {
              where: { isPublic: true },
              orderBy: { createdAt: 'desc' }
            }
          }
        },
        addresses: {
          where: { isDefault: true },
          take: 1
        },
        preferences: true
      }
    });
  }
  
  async getRepairStatistics(customerId: string): Promise<RepairStatistics> {
    const stats = await this.prisma.repair.aggregate({
      where: { customerId },
      _count: {
        id: true
      },
      _avg: {
        totalCost: true
      }
    });
    
    const statusCounts = await this.prisma.repair.groupBy({
      by: ['status'],
      where: { customerId },
      _count: {
        status: true
      }
    });
    
    return {
      totalRepairs: stats._count.id,
      averageCost: stats._avg.totalCost || 0,
      statusBreakdown: statusCounts.reduce((acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
      }, {} as Record<string, number>)
    };
  }
}
```

## Testing Strategy

### Unit Testing
```typescript
// __tests__/customer/CustomerService.test.ts
import { CustomerService } from '@/services/customer/CustomerService';
import { mockCustomerRepository, mockCacheService } from '@/test-utils/mocks';

describe('CustomerService', () => {
  let customerService: CustomerService;
  
  beforeEach(() => {
    customerService = new CustomerService(
      mockCustomerRepository,
      mockCacheService
    );
  });
  
  describe('getDashboardStats', () => {
    it('should return cached stats if available', async () => {
      const mockStats = {
        totalRepairs: 5,
        activeRepairs: 2,
        completedRepairs: 3,
        successRate: 0.95
      };
      
      mockCacheService.get.mockResolvedValue(mockStats);
      
      const result = await customerService.getDashboardStats('customer-123');
      
      expect(result).toEqual(mockStats);
      expect(mockCacheService.get).toHaveBeenCalledWith(
        'customer:customer-123:dashboard_stats'
      );
    });
    
    it('should fetch and cache stats if not cached', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockCustomerRepository.getRepairStatistics.mockResolvedValue({
        totalRepairs: 3,
        activeRepairs: 1,
        completedRepairs: 2,
        successRate: 0.9
      });
      
      const result = await customerService.getDashboardStats('customer-123');
      
      expect(mockCacheService.set).toHaveBeenCalledWith(
        'customer:customer-123:dashboard_stats',
        expect.any(Object),
        300
      );
    });
  });
});
```

### Integration Testing
```typescript
// __tests__/api/customer/dashboard.test.ts
import request from 'supertest';
import { app } from '@/app';
import { generateTestToken } from '@/test-utils/auth';
import { prisma } from '@/lib/db/prisma';

describe('/api/customer/dashboard', () => {
  let customerToken: string;
  let customerId: string;
  
  beforeEach(async () => {
    const customer = await prisma.customer.create({
      data: {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'Customer',
        passwordHash: 'hashed_password'
      }
    });
    
    customerId = customer.id;
    customerToken = generateTestToken(customer);
  });
  
  afterEach(async () => {
    await prisma.repair.deleteMany({ where: { customerId } });
    await prisma.customer.delete({ where: { id: customerId } });
  });
  
  describe('GET /stats', () => {
    it('should return dashboard statistics', async () => {
      await prisma.repair.create({
        data: {
          customerId,
          repairNumber: 'R001',
          deviceType: 'laptop',
          deviceBrand: 'Apple',
          deviceModel: 'MacBook Pro',
          issueDescription: 'Screen broken',
          repairType: 'screen_replacement',
          status: 'completed',
          totalCost: 299.99
        }
      });
      
      const response = await request(app)
        .get('/api/customer/dashboard/stats')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);
      
      expect(response.body).toEqual({
        totalRepairs: 1,
        activeRepairs: 0,
        completedRepairs: 1,
        successRate: 1,
        averageCost: 299.99
      });
    });
    
    it('should require authentication', async () => {
      await request(app)
        .get('/api/customer/dashboard/stats')
        .expect(401);
    });
  });
});
```

## Deployment & Monitoring

### Docker Configuration
```dockerfile
# Dockerfile.customer-portal
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Build the app
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build customer portal
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

### Monitoring Setup
```typescript
// lib/monitoring/customer-metrics.ts
import { createPrometheusMetrics } from 'prom-client';

export const customerMetrics = {
  activeCustomers: new Gauge({
    name: 'customer_portal_active_users',
    help: 'Number of currently active customers'
  }),
  
  loginAttempts: new Counter({
    name: 'customer_portal_login_attempts_total',
    help: 'Total number of customer login attempts',
    labelNames: ['status'] // 'success' or 'failed'
  }),
  
  apiRequests: new Counter({
    name: 'customer_portal_api_requests_total',
    help: 'Total number of API requests',
    labelNames: ['method', 'endpoint', 'status']
  }),
  
  repairViews: new Counter({
    name: 'customer_portal_repair_views_total',
    help: 'Total number of repair detail views'
  }),
  
  chatMessages: new Counter({
    name: 'customer_portal_chat_messages_total',
    help: 'Total number of chat messages sent by customers'
  })
};
```

This comprehensive Customer Portal Architecture documentation provides the foundation for building a robust, scalable, and user-friendly customer experience that integrates seamlessly with the repair management system, chat platform, and CRM.