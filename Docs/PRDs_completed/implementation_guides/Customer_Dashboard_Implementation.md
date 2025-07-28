# Customer Dashboard Implementation Guide

## Overview

This document provides comprehensive implementation guidance for the customer dashboard system, based on analysis of existing components and the nordic design requirements. The dashboard serves as the central hub for customers to manage their repairs, view statistics, and communicate with technicians.

## Architecture Overview

### Component Hierarchy
```
Customer Dashboard
├── DashboardLayout.tsx (Main container)
├── StatsCards.tsx (Key metrics display)
├── QuoteCenter.tsx (Quote management)
├── RecentActivity.tsx (Activity feed)
├── RepairTracking.tsx (Real-time status)
├── ProfileLayout.tsx (Profile management)
└── NotificationCenter.tsx (Alert system)
```

### State Management Architecture
```typescript
interface CustomerDashboardState {
  user: User | null;
  stats: DashboardStats;
  repairs: Repair[];
  quotes: Quote[];
  activities: Activity[];
  notifications: Notification[];
  isLoading: boolean;
  error: string | null;
}
```

## Core Components Implementation

### 1. DashboardLayout.tsx

**Purpose**: Main dashboard container with Nordic design integration

**Key Features**:
- Responsive grid layout
- Integrated chat widget placement
- Real-time data updates
- Nordic color scheme application

**Implementation Structure**:
```typescript
interface DashboardLayoutProps {
  user: User;
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ user, children }) => {
  const { stats, isLoading } = useDashboardStats();
  const { notifications } = useNotifications();
  
  return (
    <div className="nordic-dashboard-container">
      <DashboardHeader user={user} notifications={notifications} />
      <div className="nordic-dashboard-grid">
        <StatsCards stats={stats} isLoading={isLoading} />
        <div className="nordic-dashboard-content">
          {children}
        </div>
        <ChatWidget user={user} />
      </div>
    </div>
  );
};
```

**Nordic Styling**:
```css
.nordic-dashboard-container {
  background: var(--nordic-background);
  min-height: 100vh;
  padding: 24px;
}

.nordic-dashboard-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

@media (min-width: 768px) {
  .nordic-dashboard-grid {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }
}
```

### 2. StatsCards.tsx

**Purpose**: Display repair statistics with Nordic design

**Key Metrics**:
- Total Repairs
- Active Repairs  
- Completed Repairs
- Success Rate
- Average Response Time (Chat)

**Implementation**:
```typescript
interface StatsCardsProps {
  stats: {
    totalRepairs: number;
    activeRepairs: number;
    completedRepairs: number;
    successRate: number;
    avgResponseTime?: string;
  };
  isLoading?: boolean;
}

const StatsCards: React.FC<StatsCardsProps> = ({ stats, isLoading }) => {
  const cards = [
    {
      title: 'Total Repairs',
      value: stats.totalRepairs,
      icon: Package,
      color: 'nordic-blue',
      trend: '+12%'
    },
    {
      title: 'Active Repairs', 
      value: stats.activeRepairs,
      icon: Clock,
      color: 'nordic-orange',
      trend: '↑2'
    },
    {
      title: 'Completed',
      value: stats.completedRepairs,
      icon: CheckCircle,
      color: 'nordic-green',
      trend: '+5'
    },
    {
      title: 'Success Rate',
      value: `${stats.successRate}%`,
      icon: TrendingUp,
      color: 'nordic-purple',
      trend: '98%'
    }
  ];

  if (isLoading) {
    return <StatsCardsSkeleton />;
  }

  return (
    <div className="nordic-stats-grid">
      {cards.map((card, index) => (
        <div key={index} className="nordic-stats-card">
          <div className="nordic-stats-header">
            <card.icon className={`nordic-icon nordic-icon--${card.color}`} />
            <span className="nordic-trend">{card.trend}</span>
          </div>
          <div className="nordic-stats-content">
            <h3 className="nordic-stats-value">{card.value}</h3>
            <p className="nordic-stats-label">{card.title}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
```

### 3. QuoteCenter.tsx

**Purpose**: Manage repair quotes and approvals

**Key Features**:
- Pending quote approvals
- Quote history
- Price breakdown
- One-click approval/rejection
- Integration with chat for questions

**Implementation**:
```typescript
interface Quote {
  id: string;
  repairId: string;
  deviceType: string;
  deviceModel: string;
  issues: string[];
  laborCost: number;
  partsCost: PartCost[];
  totalCost: number;
  estimatedTime: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  expiresAt: string;
}

const QuoteCenter: React.FC = () => {
  const { quotes, approveQuote, rejectQuote } = useQuotes();
  const { openChat } = useChat();

  const handleApproval = async (quoteId: string, approved: boolean) => {
    try {
      if (approved) {
        await approveQuote(quoteId);
        toast.success('Quote approved successfully!');
      } else {
        await rejectQuote(quoteId);
        toast.info('Quote rejected. Our team will contact you.');
      }
    } catch (error) {
      toast.error('Failed to process quote. Please try again.');
    }
  };

  return (
    <div className="nordic-quote-center">
      <div className="nordic-section-header">
        <h2 className="nordic-section-title">Quote Center</h2>
        <span className="nordic-badge">
          {quotes.filter(q => q.status === 'pending').length} pending
        </span>
      </div>

      <div className="nordic-quotes-list">
        {quotes.map(quote => (
          <div key={quote.id} className="nordic-quote-card">
            <QuoteHeader quote={quote} />
            <QuoteBreakdown quote={quote} />
            <QuoteActions 
              quote={quote}
              onApprove={() => handleApproval(quote.id, true)}
              onReject={() => handleApproval(quote.id, false)}
              onChat={() => openChat({ context: 'quote', quoteId: quote.id })}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 4. RepairTracking.tsx

**Purpose**: Real-time repair status tracking

**Key Features**:
- Live status updates via WebSocket
- Progress visualization
- Estimated completion times
- Photo uploads from customers
- Direct communication with technicians

**Implementation**:
```typescript
interface RepairTrackingProps {
  repairId?: string;
}

const RepairTracking: React.FC<RepairTrackingProps> = ({ repairId }) => {
  const { repairs, updateRepair } = useRepairs();
  const { isConnected } = useWebSocket();

  // WebSocket listener for real-time updates
  useEffect(() => {
    const handleRepairUpdate = (data: RepairUpdate) => {
      updateRepair(data.repairId, data.updates);
      
      // Show notification for status changes
      if (data.updates.status) {
        toast.info(`Repair status updated: ${data.updates.status}`);
      }
    };

    socket.on('repair:update', handleRepairUpdate);
    return () => socket.off('repair:update', handleRepairUpdate);
  }, [updateRepair]);

  const getStatusSteps = (repair: Repair) => [
    { key: 'received', label: 'Received', completed: true },
    { key: 'diagnosing', label: 'Diagnosing', completed: true },
    { key: 'quoted', label: 'Quote Sent', completed: repair.quote?.status === 'approved' },
    { key: 'repairing', label: 'Repairing', completed: repair.status === 'completed' },
    { key: 'testing', label: 'Testing', completed: repair.status === 'completed' },
    { key: 'completed', label: 'Ready', completed: repair.status === 'completed' }
  ];

  return (
    <div className="nordic-repair-tracking">
      <div className="nordic-connection-status">
        <StatusIndicator connected={isConnected} />
      </div>

      {repairs.map(repair => (
        <div key={repair.id} className="nordic-repair-card">
          <RepairHeader repair={repair} />
          <RepairProgress steps={getStatusSteps(repair)} />
          <RepairDetails repair={repair} />
          <RepairActions repair={repair} />
        </div>
      ))}
    </div>
  );
};
```

### 5. ProfileLayout.tsx

**Purpose**: Comprehensive profile management

**Key Features**:
- Personal information editing
- Security settings (2FA, password)
- Notification preferences
- Address book management
- Account deletion options

**Security Implementation**:
```typescript
const SecuritySettings: React.FC = () => {
  const { user, updateSecurity } = useAuth();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(user?.twoFactorEnabled || false);

  const handleTwoFactorToggle = async () => {
    try {
      if (!twoFactorEnabled) {
        // Generate QR code for 2FA setup
        const qrCode = await apiClient.generateTwoFactorQR();
        setQrCode(qrCode);
        setShowQRModal(true);
      } else {
        // Disable 2FA with password confirmation
        setShowDisableModal(true);
      }
    } catch (error) {
      toast.error('Failed to update security settings');
    }
  };

  return (
    <div className="nordic-security-settings">
      <div className="nordic-setting-item">
        <div className="nordic-setting-info">
          <h3>Two-Factor Authentication</h3>
          <p>Add an extra layer of security to your account</p>
        </div>
        <Switch 
          checked={twoFactorEnabled}
          onChange={handleTwoFactorToggle}
          className="nordic-switch"
        />
      </div>
      
      <div className="nordic-setting-item">
        <PasswordChangeForm />
      </div>
      
      <div className="nordic-setting-item">
        <SessionManagement />
      </div>
    </div>
  );
};
```

## Authentication & Security

### JWT Implementation with Refresh Tokens

```typescript
// lib/auth/jwt.ts
export class JWTManager {
  private static readonly ACCESS_TOKEN_KEY = 'access_token';
  private static readonly REFRESH_TOKEN_KEY = 'refresh_token';
  
  static setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }
  
  static async refreshAccessToken(): Promise<string | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return null;
    
    try {
      const response = await fetch('/api/auth/refresh', {
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
}
```

### Persistent Login Implementation

```typescript
// hooks/useAuth.ts
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check authentication on app load
  useEffect(() => {
    const initAuth = async () => {
      const token = JWTManager.getAccessToken();
      if (token && !JWTManager.isTokenExpired(token)) {
        try {
          const userData = await apiClient.getProfile();
          setUser(userData);
        } catch (error) {
          // Try to refresh token
          const newToken = await JWTManager.refreshAccessToken();
          if (newToken) {
            const userData = await apiClient.getProfile();
            setUser(userData);
          }
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Auto-refresh tokens before expiry
  useEffect(() => {
    if (!user) return;

    const refreshInterval = setInterval(async () => {
      const token = JWTManager.getAccessToken();
      if (token && JWTManager.willExpireSoon(token)) {
        await JWTManager.refreshAccessToken();
      }
    }, 60000); // Check every minute

    return () => clearInterval(refreshInterval);
  }, [user]);
};
```

## Real-time Features

### WebSocket Integration

```typescript
// hooks/useRealtime.ts
export const useRealtime = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const newSocket = io(process.env.NEXT_PUBLIC_WS_URL!, {
      auth: { token: JWTManager.getAccessToken() }
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('WebSocket connected');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('WebSocket disconnected');
    });

    // Join user-specific room
    newSocket.emit('join:user', user.id);

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [user]);

  return { socket, isConnected };
};
```

### Real-time Notifications

```typescript
// components/NotificationCenter.tsx
const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { socket } = useRealtime();

  useEffect(() => {
    if (!socket) return;

    const handleNotification = (notification: Notification) => {
      setNotifications(prev => [notification, ...prev.slice(0, 9)]);
      
      // Show toast for important notifications
      if (notification.priority === 'high') {
        toast.info(notification.message);
      }
    };

    socket.on('notification:new', handleNotification);
    return () => socket.off('notification:new', handleNotification);
  }, [socket]);

  return (
    <div className="nordic-notification-center">
      <div className="nordic-notification-header">
        <h3>Notifications</h3>
        <span className="nordic-badge">{notifications.length}</span>
      </div>
      
      <div className="nordic-notification-list">
        {notifications.map(notification => (
          <NotificationItem 
            key={notification.id} 
            notification={notification} 
          />
        ))}
      </div>
    </div>
  );
};
```

## Mobile Optimization

### Responsive Design Implementation

```css
/* Mobile-first approach */
.nordic-dashboard-container {
  padding: 16px;
}

.nordic-stats-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

/* Tablet */
@media (min-width: 768px) {
  .nordic-dashboard-container {
    padding: 24px;
  }
  
  .nordic-stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .nordic-stats-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 24px;
  }
  
  .nordic-dashboard-grid {
    grid-template-columns: 300px 1fr;
  }
}
```

### Touch Optimizations

```typescript
// Touch-friendly interactions
const TouchOptimizedCard: React.FC = ({ children, onClick }) => {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <div 
      className={`nordic-card ${isPressed ? 'nordic-card--pressed' : ''}`}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onTouchCancel={() => setIsPressed(false)}
      onClick={onClick}
      style={{ 
        minHeight: '44px', // iOS touch target minimum
        cursor: 'pointer'
      }}
    >
      {children}
    </div>
  );
};
```

## Performance Optimization

### Data Fetching Strategy

```typescript
// Optimized data fetching with caching
export const useDashboardData = () => {
  const { user } = useAuth();
  
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError
  } = useQuery({
    queryKey: ['dashboard', 'stats', user?.id],
    queryFn: () => apiClient.getDashboardStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!user
  });

  const {
    data: repairs,
    isLoading: repairsLoading
  } = useQuery({
    queryKey: ['repairs', user?.id],
    queryFn: () => apiClient.getRepairs(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: !!user
  });

  return {
    stats,
    repairs,
    isLoading: statsLoading || repairsLoading,
    error: statsError
  };
};
```

### Image Optimization

```typescript
// Optimized image component for device photos
const OptimizedDeviceImage: React.FC<{
  src: string;
  alt: string;
  deviceType: string;
}> = ({ src, alt, deviceType }) => {
  return (
    <div className="nordic-device-image-container">
      <Image
        src={src}
        alt={alt}
        width={300}
        height={200}
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..." 
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        className="nordic-device-image"
        priority={deviceType === 'primary'}
      />
    </div>
  );
};
```

## Testing Strategy

### Component Testing

```typescript
// __tests__/StatsCards.test.tsx
describe('StatsCards', () => {
  const mockStats = {
    totalRepairs: 25,
    activeRepairs: 3,
    completedRepairs: 22,
    successRate: 88
  };

  it('renders all stat cards correctly', () => {
    render(<StatsCards stats={mockStats} />);
    
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('Total Repairs')).toBeInTheDocument();
    expect(screen.getByText('88%')).toBeInTheDocument();
  });

  it('shows loading skeleton when loading', () => {
    render(<StatsCards stats={mockStats} isLoading={true} />);
    
    expect(screen.getAllByTestId('stats-skeleton')).toHaveLength(4);
  });

  it('applies Nordic design classes', () => {
    render(<StatsCards stats={mockStats} />);
    
    const container = screen.getByTestId('stats-grid');
    expect(container).toHaveClass('nordic-stats-grid');
  });
});
```

### Integration Testing

```typescript
// __tests__/CustomerDashboard.integration.test.tsx
describe('Customer Dashboard Integration', () => {
  beforeEach(() => {
    // Mock WebSocket connection
    mockSocket.connect();
    
    // Mock authenticated user
    mockAuthContext({
      user: mockCustomerUser,
      isAuthenticated: true
    });
  });

  it('loads dashboard data on mount', async () => {
    render(<CustomerDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Total Repairs')).toBeInTheDocument();
    });
    
    expect(apiClient.getDashboardStats).toHaveBeenCalled();
  });

  it('receives real-time updates', async () => {
    render(<CustomerDashboard />);
    
    // Simulate WebSocket update
    act(() => {
      mockSocket.emit('repair:update', {
        repairId: 'repair-123',
        updates: { status: 'completed' }
      });
    });
    
    await waitFor(() => {
      expect(screen.getByText('completed')).toBeInTheDocument();
    });
  });
});
```

## Deployment Checklist

### Pre-deployment Validation

- [ ] All authentication flows tested
- [ ] WebSocket connections stable
- [ ] Real-time updates working
- [ ] Mobile responsiveness verified
- [ ] Nordic design system applied consistently
- [ ] Performance metrics within targets
- [ ] Security headers configured
- [ ] JWT token refresh working
- [ ] Chat integration functional
- [ ] Error handling comprehensive

### Environment Configuration

```bash
# Customer Dashboard specific environment variables
NEXT_PUBLIC_CUSTOMER_DASHBOARD_URL=https://app.revivatech.com/dashboard
NEXT_PUBLIC_WS_URL=wss://ws.revivatech.com
CUSTOMER_JWT_SECRET=your-customer-jwt-secret
CUSTOMER_JWT_EXPIRES_IN=15m
CUSTOMER_REFRESH_TOKEN_EXPIRES_IN=7d

# Nordic theme settings
NEXT_PUBLIC_THEME_PRIMARY=#007AFF
NEXT_PUBLIC_THEME_NORDIC_ENABLED=true
```

This comprehensive implementation guide provides all the necessary components, patterns, and considerations for building a robust Nordic-designed customer dashboard with real-time capabilities and seamless chat integration.