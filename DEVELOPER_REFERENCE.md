# RevivaTech Developer Reference Guide

## 🚀 Quick Start Commands

### **Start Development Environment**
```bash
# Navigate to RevivaTech frontend directory
cd /opt/webapps/revivatech/frontend

# Start development server
npm run dev

# Check service status
curl http://localhost:3010/health

# View server logs
npm run dev -- --verbose
```

### **Health Checks**
```bash
# RevivaTech frontend health
curl http://localhost:3010/health

# Check development server status
curl http://localhost:3010

# Test configuration loading
curl http://localhost:3010/api/config
```

---

## 📦 RevivaTech Component Library

### **Installation & Usage**
```typescript
// Import RevivaTech components
import { 
  Button, 
  Card, 
  Input,
  HeroSection,
  ServicesGrid,
  FeatureHighlights 
} from '@/components/ui';

// Use in your pages
<HeroSection variant="primary" />
<ServicesGrid services={services} />
<FeatureHighlights features={features} />
```

### **UI Components**

#### **Button**
```typescript
import { Button } from '@shared';

<Button 
  variant="primary" | "secondary" | "ghost" | "destructive"
  size="sm" | "md" | "lg"
  disabled={boolean}
  onClick={handleClick}
>
  Click me
</Button>
```

#### **Card**
```typescript
import { Card, CardHeader, CardContent, CardFooter } from '@shared';

<Card>
  <CardHeader>Title</CardHeader>
  <CardContent>Content here</CardContent>
  <CardFooter>Footer actions</CardFooter>
</Card>
```

#### **Input**
```typescript
import { Input } from '@shared';

<Input
  type="text" | "email" | "password" | "number"
  placeholder="Enter text..."
  value={value}
  onChange={handleChange}
  error={errorMessage}
  disabled={boolean}
/>
```

#### **LoadingSpinner (6 Variants)**
```typescript
import { 
  LoadingSpinner,
  ButtonLoadingSpinner,
  PageLoadingSpinner,
  InlineLoadingSpinner,
  CardLoadingSpinner,
  ProcessingSpinner 
} from '@shared';

// Basic spinner
<LoadingSpinner size="sm" | "md" | "lg" />

// Context-specific spinners
<ButtonLoadingSpinner />
<PageLoadingSpinner message="Loading page..." />
<CardLoadingSpinner />
```

#### **ThemeProvider**
```typescript
import { ThemeProvider, useTheme } from '@shared';

// Wrap app
<ThemeProvider defaultTheme="light" | "dark">
  <App />
</ThemeProvider>

// Use theme
const { theme, setTheme } = useTheme();
```

---

### **Authentication Components (Auth0)**

#### **Auth0Provider**
```typescript
import { Auth0Provider } from '@shared';

<Auth0Provider
  domain="your-domain.auth0.com"
  clientId="your-client-id"
  redirectUri={window.location.origin}
>
  <App />
</Auth0Provider>
```

#### **Auth0 Buttons**
```typescript
import { 
  Auth0LoginButton, 
  Auth0LogoutButton,
  Auth0LoginButtonElement,
  Auth0LogoutButtonElement 
} from '@shared';

// React components
<Auth0LoginButton onSuccess={handleSuccess} />
<Auth0LogoutButton onLogout={handleLogout} />

// Web Components
<auth0-login-button></auth0-login-button>
<auth0-logout-button></auth0-logout-button>
```

#### **Auth0 Hooks**
```typescript
import { 
  useAuth0,
  useAuth0User,
  useAuth0Actions,
  useAuth0Status,
  useAuth0Roles 
} from '@shared';

// Basic auth
const { user, isAuthenticated, isLoading } = useAuth0();

// User info
const { user, metadata } = useAuth0User();

// Actions
const { login, logout, getAccessToken } = useAuth0Actions();

// Status
const { isAuthenticated, isLoading, error } = useAuth0Status();

// Roles
const { hasRole, roles } = useAuth0Roles();
```

#### **Protected Routes**
```typescript
import { Auth0ProtectedRoute, withAuth0Protection } from '@shared';

// Component wrapper
<Auth0ProtectedRoute requiredRoles={['admin']}>
  <AdminDashboard />
</Auth0ProtectedRoute>

// HOC
const ProtectedComponent = withAuth0Protection(MyComponent, {
  requiredRoles: ['user'],
  fallback: <LoginRequired />
});
```

---

### **Business Components**

#### **BookingFlow**
```typescript
import { BookingFlow } from '@shared';

<BookingFlow
  onStepChange={handleStepChange}
  onComplete={handleBookingComplete}
  deviceCategories={deviceCategories}
  repairTypes={repairTypes}
/>
```

#### **CustomerDashboard**
```typescript
import { CustomerDashboard } from '@shared';

<CustomerDashboard
  customerId={user.id}
  onQuoteApproval={handleQuoteApproval}
  onRepairUpdate={handleRepairUpdate}
/>
```

#### **AdminLayout**
```typescript
import { AdminLayout } from '@shared';

<AdminLayout
  navigation={navigationItems}
  user={currentUser}
  onLogout={handleLogout}
>
  <AdminContent />
</AdminLayout>
```

#### **AnalyticsDashboard**
```typescript
import { AnalyticsDashboard } from '@shared';

<AnalyticsDashboard
  timeRange="7d" | "30d" | "90d"
  metrics={['revenue', 'repairs', 'customers']}
  onFilterChange={handleFilterChange}
/>
```

---

### **Real-time Components**

#### **WebSocketProvider**
```typescript
import { WebSocketProvider } from '@shared';

<WebSocketProvider url="ws://localhost:3011">
  <App />
</WebSocketProvider>
```

#### **NotificationSystem**
```typescript
import { NotificationSystem } from '@shared';

<NotificationSystem
  position="top-right" | "top-left" | "bottom-right" | "bottom-left"
  maxNotifications={5}
  autoClose={5000}
/>
```

#### **LiveMessaging**
```typescript
import { LiveMessaging } from '@shared';

<LiveMessaging
  chatId={chatId}
  userId={user.id}
  onMessageSent={handleMessageSent}
  onFileUpload={handleFileUpload}
/>
```

---

### **Chat Components (Chatwoot)**

#### **ChatwootWidget**
```typescript
import { ChatwootWidget } from '@shared';

<ChatwootWidget
  websiteToken="your-website-token"
  baseUrl="https://chat.revivatech.com"
  user={currentUser}
  locale="en" | "pt"
/>
```

#### **ChatAuthentication**
```typescript
import { ChatAuthentication } from '@shared';

<ChatAuthentication
  user={user}
  onAuthenticated={handleChatAuthenticated}
/>
```

---

## 🛠️ Development Commands

### **Service Management**
```bash
# Start services
cd /opt/webapps/website/shared
docker-compose -f docker-compose.dev.yml up -d

# Stop services
docker-compose -f docker-compose.dev.yml down

# Restart specific service
docker-compose -f docker-compose.dev.yml restart new-backend

# Rebuild and restart
docker-compose -f docker-compose.dev.yml up -d --build new-frontend

# View service logs
docker-compose -f docker-compose.dev.yml logs -f new-backend
```

### **Container Operations**
```bash
# Execute commands in containers
docker exec -it revivatech_new_frontend pnpm add critters
docker exec -it revivatech_new_backend npm run seed
docker exec -it revivatech_new_database psql -U revivatech_user -d revivatech_new
docker exec -it revivatech_new_redis redis-cli -a revivatech_redis_password

# View container logs
docker logs revivatech_new_frontend --tail 50 -f
docker logs revivatech_new_backend --tail 50 -f

# Container resource usage
docker stats revivatech_new_frontend revivatech_new_backend
```

### **Database Operations**
```bash
# Connect to database
docker exec -it revivatech_new_database psql -U revivatech_user -d revivatech_new

# Database backup
docker exec revivatech_new_database pg_dump -U revivatech_user revivatech_new > backup.sql

# Run migrations
docker exec -it revivatech_new_backend npm run migrate

# Seed database
docker exec -it revivatech_new_backend npm run seed
```

### **Frontend Development**
```bash
# Install dependencies
docker exec -it revivatech_new_frontend pnpm install

# Fix missing dependencies
docker exec -it revivatech_new_frontend pnpm add critters

# Build for production
docker exec -it revivatech_new_frontend pnpm build

# Run tests
docker exec -it revivatech_new_frontend pnpm test

# Type checking
docker exec -it revivatech_new_frontend pnpm type-check
```

---

## 🔧 Configuration Files

### **Docker Compose**
```bash
# Main configuration
/opt/webapps/website/shared/docker-compose.dev.yml

# Environment files
/opt/webapps/website/shared/backend/.env
/opt/webapps/website/shared/frontend-en/.env.local
```

### **nginx Configuration**
```bash
# nginx config
/etc/nginx/sites-enabled/revivatech-dual-domain-docker.conf

# Test configuration
nginx -t

# Reload configuration
nginx -s reload
```

### **Database Schema**
```bash
# Schema file
/opt/webapps/website/shared/backend/database/schema.sql

# View schema
docker exec -it revivatech_new_database psql -U revivatech_user -d revivatech_new -c "\dt"
```

---

## 🐛 Troubleshooting Guide

### **Frontend Issues**

#### **Container Exits Immediately**
```bash
# Issue: MODULE_NOT_FOUND: critters
# Solution 1: Install dependency
docker exec -it revivatech_new_frontend pnpm add critters

# Solution 2: Rebuild container
docker-compose -f docker-compose.dev.yml up -d --build new-frontend

# Solution 3: Check logs
docker logs revivatech_new_frontend --tail 50
```

#### **Hot Reload Not Working**
```bash
# Check environment variables
docker exec -it revivatech_new_frontend env | grep -E "(WATCHPACK|CHOKIDAR)"

# Restart container
docker-compose -f docker-compose.dev.yml restart new-frontend
```

### **Backend Issues**

#### **Service Not Responding**
```bash
# Check health endpoint
curl http://localhost:3011/health

# Check logs
docker logs revivatech_new_backend --tail 50

# Check database connection
docker exec -it revivatech_new_backend node -e "console.log('DB connection test')"
```

#### **Database Connection Failed**
```bash
# Check database container
docker logs revivatech_new_database

# Test connection
docker exec -it revivatech_new_database psql -U revivatech_user -d revivatech_new -c "SELECT 1;"

# Check environment variables
docker exec -it revivatech_new_backend env | grep DB_
```

### **General Issues**

#### **Port Conflicts**
```bash
# Check port usage
ss -tlnp | grep -E "(3010|3011|5435|6383)"

# Kill processes using ports
sudo lsof -ti:3010 | xargs kill -9
```

#### **Permission Issues**
```bash
# Fix container permissions
docker-compose -f docker-compose.dev.yml exec new-frontend chown -R node:node /app
docker-compose -f docker-compose.dev.yml exec new-backend chown -R node:node /app
```

#### **Clean Reset**
```bash
# Stop all services
docker-compose -f docker-compose.dev.yml down

# Remove volumes (careful - deletes data)
docker-compose -f docker-compose.dev.yml down -v

# Rebuild everything
docker-compose -f docker-compose.dev.yml up -d --build
```

---

## 📊 Monitoring & Health

### **Health Endpoints**
```bash
# Backend health
curl http://localhost:3011/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-07-11T...",
  "database": "connected",
  "redis": "connected",
  "version": "2.0.0"
}

# Backend API info
curl http://localhost:3011/api/info

# Frontend health (after fix)
curl http://localhost:3010/api/health
```

### **Service Status**
```bash
# Docker service status
docker-compose -f docker-compose.dev.yml ps

# Detailed container info
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}\t{{.Image}}"

# Resource usage
docker stats --no-stream
```

### **Log Monitoring**
```bash
# Follow all logs
docker-compose -f docker-compose.dev.yml logs -f

# Follow specific service
docker logs revivatech_new_backend -f

# View recent logs
docker logs revivatech_new_frontend --tail 100
```

---

## 🚀 Production Deployment

### **Build for Production**
```bash
# Build frontend
docker exec -it revivatech_new_frontend pnpm build

# Build backend (if needed)
docker exec -it revivatech_new_backend npm run build

# Create production images
docker-compose -f docker-compose.prod.yml build
```

### **Environment Setup**
```bash
# Copy production environment files
cp .env.example .env.production

# Update production variables
# - Database credentials
# - JWT secrets
# - API URLs
# - Auth0 configuration
```

### **Security Checklist**
```bash
# Change default passwords
# Update JWT secrets
# Configure SSL certificates
# Set up rate limiting
# Enable audit logging
# Configure backup procedures
```

---

## 📚 Additional Resources

### **Documentation Files**
- `/opt/webapps/revivatech/CLAUDE.md` - Complete project configuration
- `/opt/webapps/revivatech/README.md` - Project overview
- `/opt/webapps/revivatech/Docs/` - Feature-specific documentation
- `/opt/webapps/revivatech/INFRASTRUCTURE_SETUP.md` - Infrastructure documentation

### **Key Directories**
- `/opt/webapps/revivatech/frontend/` - Main RevivaTech frontend
- `/opt/webapps/revivatech/frontend/src/components/` - RevivaTech components library
- `/opt/webapps/revivatech/frontend/config/` - Configuration system
- `/opt/webapps/revivatech/backend/` - RevivaTech backend API

### **Support**
- **Issues**: GitHub Issues for bug reports
- **Documentation**: Comprehensive guides in `/Docs/`
- **Health Checks**: Built-in monitoring endpoints
- **Logs**: Detailed logging for troubleshooting

---

*Last Updated: July 11, 2025*  
*Platform Version: 2.0.0*  
*Environment: Development*