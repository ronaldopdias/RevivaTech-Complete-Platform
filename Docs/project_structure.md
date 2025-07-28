# RevivaTech Project Structure

## Root Directory
```
/opt/webapps/revivatech/
├── CLAUDE.md                   # Claude AI configuration and guidance
├── PRD.md                      # Product Requirements Document
├── Docs/                       # Comprehensive documentation
│   ├── Implementation.md       # Current implementation stages
│   ├── Configuration_Standards.md # Configuration patterns
│   ├── Maintainability_Architecture_PRD.md # Architecture guide
│   ├── project_structure.md    # This file
│   ├── Nordic_Design_System_Implementation.md # Design system
│   ├── Bug_tracking.md         # Known issues and solutions
│   ├── Customer_Dashboard_Implementation.md # Customer features
│   ├── Chatwoot_Messaging_Implementation.md # Chat system
│   ├── Admin_Dashboard_Enhancement.md # Admin features
│   ├── API_Integration_Documentation.md # API standards
│   ├── Customer_Portal_Architecture.md # Portal architecture
│   ├── Mac_Repair_Implementation.md # Mac-specific features
│   ├── UI_UX_doc.md           # UI/UX specifications
│   └── CLOUDFLARE_API.md      # CDN and security
├── backend/                    # Backend API services
├── frontend/                   # Next.js frontend application
├── scripts/                    # Build and utility scripts
├── shared/                     # Shared components and utilities
└── docker-compose.yml         # Docker services configuration
```

## Frontend Structure

### `/frontend` Directory
```
frontend/
├── config/                     # Configuration-driven architecture
│   ├── app/                   # Application configuration
│   │   ├── app.config.ts      # Main app configuration
│   │   ├── features.config.ts # Feature flags
│   │   └── routes.config.ts   # Dynamic routing
│   ├── components/            # Component configurations
│   │   ├── Button/            # Button component config
│   │   ├── Card/              # Card component config
│   │   ├── Checkbox/          # Checkbox component config
│   │   ├── Input/             # Input component config
│   │   ├── Navigation/        # Navigation component config
│   │   ├── Select/            # Select component config
│   │   └── Textarea/          # Textarea component config
│   ├── content/               # Multilingual content
│   │   ├── en/                # English content
│   │   │   ├── booking.yaml   # Booking flow content
│   │   │   ├── common.yaml    # Common UI text
│   │   │   ├── home.yaml      # Homepage content
│   │   │   └── services.yaml  # Services content
│   │   └── pt/                # Portuguese content
│   │       ├── booking.yaml   # Booking flow content
│   │       ├── common.yaml    # Common UI text
│   │       ├── home.yaml      # Homepage content
│   │       └── services.yaml  # Services content
│   ├── devices/               # Device database configuration
│   │   ├── android.devices.ts # Android device catalog
│   │   ├── apple.devices.ts   # Apple device catalog
│   │   ├── gaming.devices.ts  # Gaming console catalog
│   │   ├── pc.devices.ts      # PC device catalog
│   │   └── index.ts           # Device catalog exports
│   ├── environments/          # Environment-specific configs
│   │   ├── development.ts     # Development environment
│   │   ├── production.ts      # Production environment
│   │   └── staging.ts         # Staging environment
│   ├── forms/                 # Form configurations
│   │   └── booking.form.ts    # Booking form schema
│   ├── pages/                 # Page configurations
│   │   ├── book-repair.config.ts # Booking page config
│   │   ├── home.config.ts     # Homepage config
│   │   └── services.config.ts # Services page config
│   ├── services/              # Service configurations
│   │   └── api.config.ts      # API service config
│   └── theme/                 # Theme configurations
│       └── nordic.theme.ts    # Nordic design system
├── src/                       # Source code
│   ├── app/                   # Next.js 15 App Router
│   │   ├── admin/             # Admin interface
│   │   │   ├── layout.tsx     # Admin layout
│   │   │   └── page.tsx       # Admin dashboard
│   │   ├── login/             # Authentication
│   │   │   └── page.tsx       # Login page
│   │   ├── register/          # Registration
│   │   │   └── page.tsx       # Registration page
│   │   ├── favicon.ico        # Site favicon
│   │   ├── globals.css        # Global styles (imports modular CSS)
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Homepage
│   ├── components/            # React components
│   │   ├── admin/             # Admin components
│   │   │   ├── AdminDashboard.tsx # Admin dashboard
│   │   │   ├── AdminLayout.tsx    # Admin layout
│   │   │   ├── DashboardStats.tsx # Statistics cards
│   │   │   ├── QuickActions.tsx   # Quick action buttons
│   │   │   ├── RecentActivity.tsx # Activity feed
│   │   │   ├── RepairQueue.tsx    # Repair queue management
│   │   │   └── index.ts           # Component exports
│   │   ├── auth/              # Authentication components
│   │   │   ├── AuthGuard.tsx      # Route protection
│   │   │   ├── LoginForm.tsx      # Login form
│   │   │   ├── ProtectedRoute.tsx # Protected route wrapper
│   │   │   ├── RegisterForm.tsx   # Registration form
│   │   │   └── index.ts           # Component exports
│   │   ├── booking/           # Booking flow components
│   │   │   ├── DeviceSelector.tsx # Device selection
│   │   │   ├── ModelSelection.tsx # Model selection
│   │   │   ├── PriceCalculator.tsx # Price calculation
│   │   │   └── index.ts           # Component exports
│   │   ├── chat/              # Chat messaging components
│   │   ├── customer/          # Customer portal components
│   │   ├── forms/             # Form components
│   │   │   └── BookingForm.tsx    # Booking form
│   │   ├── layout/            # Layout components
│   │   │   ├── Footer.tsx         # Site footer
│   │   │   ├── Header.tsx         # Site header
│   │   │   └── MainLayout.tsx     # Main layout
│   │   ├── navigation/        # Navigation components
│   │   │   └── Navigation.tsx     # Navigation menu
│   │   ├── providers/         # React context providers
│   │   ├── sections/          # Page sections
│   │   │   ├── HeroSection.tsx    # Hero section
│   │   │   ├── ProcessSteps.tsx   # Process steps
│   │   │   └── ServicesGrid.tsx   # Services grid
│   │   ├── shared/            # Shared components
│   │   └── ui/                # Base UI components
│   │       ├── Button.tsx         # Button component
│   │       ├── ButtonComposed.tsx # Composed button
│   │       ├── Card.tsx           # Card component
│   │       ├── Checkbox.tsx       # Checkbox component
│   │       ├── Input.tsx          # Input component
│   │       ├── Select.tsx         # Select component
│   │       ├── Textarea.tsx       # Textarea component
│   │       ├── ThemeToggle.tsx    # Theme toggle
│   │       └── index.ts           # Component exports
│   ├── hooks/                 # Custom React hooks
│   │   ├── useContent.ts      # Content management hook
│   │   ├── useServices.ts     # Services hook
│   │   └── useTheme.ts        # Theme hook
│   ├── lib/                   # Utility libraries
│   │   ├── api/               # API utilities
│   │   ├── auth/              # Authentication utilities
│   │   │   ├── AuthContext.tsx    # Auth context
│   │   │   ├── authService.ts     # Auth service
│   │   │   └── types.ts           # Auth types
│   │   ├── components/        # Component utilities
│   │   │   ├── loader.ts          # Component loader
│   │   │   ├── registry.ts        # Component registry
│   │   │   ├── setup.ts           # Component setup
│   │   │   └── slots.ts           # Component slots
│   │   ├── config/            # Configuration utilities
│   │   │   ├── loader.ts          # Config loader
│   │   │   └── validation.ts      # Config validation
│   │   ├── content/           # Content utilities
│   │   │   └── loader.ts          # Content loader
│   │   ├── forms/             # Form utilities
│   │   │   ├── renderer.tsx       # Form renderer
│   │   │   └── schema.ts          # Form schemas
│   │   ├── pages/             # Page utilities
│   │   │   └── renderer.tsx       # Page renderer
│   │   ├── services/          # Service utilities
│   │   │   ├── apiClient.ts       # API client
│   │   │   ├── bookingService.ts  # Booking service
│   │   │   ├── index.ts           # Service exports
│   │   │   ├── mockServices.ts    # Mock services
│   │   │   ├── serviceFactory.ts  # Service factory
│   │   │   └── types.ts           # Service types
│   │   ├── utils.ts           # General utilities
│   │   └── utils/             # Utility functions
│   ├── middleware/            # Next.js middleware
│   ├── providers/             # React providers
│   │   ├── ServiceProvider.tsx    # Service provider
│   │   └── ThemeProvider.tsx      # Theme provider
│   ├── services/              # Business logic services
│   ├── styles/                # Global styles
│   └── types/                 # TypeScript types
│       └── config.ts              # Configuration types
├── public/                    # Static assets
│   ├── file.svg               # File icon
│   ├── globe.svg              # Globe icon
│   ├── next.svg               # Next.js logo
│   ├── vercel.svg             # Vercel logo
│   └── window.svg             # Window icon
├── next-env.d.ts              # Next.js TypeScript declarations
├── next.config.ts             # Next.js configuration
├── package.json               # Project dependencies
├── pnpm-lock.yaml            # Package lock file
├── pnpm-workspace.yaml       # pnpm workspace config
├── postcss.config.mjs        # PostCSS configuration
├── tailwind.config.ts        # Tailwind CSS configuration
├── tsconfig.json             # TypeScript configuration
└── README.md                 # Frontend documentation
```
## Current Infrastructure

### **Active Services**
```
RevivaTech.co.uk Platform (NEW - Port 3010-3011):
├── Frontend: Next.js 15 + React 19 + TypeScript
├── Backend: Node.js + Express + PostgreSQL + Redis
├── Database: PostgreSQL 16 with advanced schema
└── Cache: Redis 7.x with persistence

RevivaTech.com.br Platform (PRESERVED - Port 3000):
├── Frontend: Next.js with Portuguese localization
├── Backend: Node.js API server
├── Database: MySQL database
└── Cache: Redis instance

CRM System (PRESERVED - Port 3001):
├── Frontend: React application
├── Backend: Node.js API
├── Database: PostgreSQL
└── Cache: Redis instance
```

### **Docker Services**
```
Container Name             Status    Ports
─────────────────────────────────────────────────────────
revivatech_new_frontend    Running   3010:3000
revivatech_new_backend     Healthy   3011:3011
revivatech_new_database    Healthy   5435:5432
revivatech_new_redis       Healthy   6383:6379
website_frontend_pt_dev    Healthy   3000:3000
website_backend_dev        Healthy   5000:5000
website_mysql_dev          Healthy   3308:3306
website_redis_dev          Running   6380:6379
crm_frontend_dev          Healthy   3001:3001
crm_backend_dev           Healthy   5001:5001
crm_postgres_dev          Healthy   5433:5432
crm_redis_dev             Running   6381:6379
```

## Technology Stack

### **Frontend Stack**
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript 5.x with strict mode
- **UI Library**: React 19 with functional components
- **Styling**: Tailwind CSS 4.x with shadcn/ui components
- **State Management**: React Context with configuration-driven state
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React icons
- **Animations**: Framer Motion for interactions
- **Package Manager**: pnpm with workspace configuration

### **Backend Stack**
- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL 16 with advanced features
- **Cache**: Redis 7.x with persistence
- **Authentication**: JWT with refresh token rotation
- **API**: RESTful design with OpenAPI documentation
- **Real-time**: WebSocket support for live updates
- **Monitoring**: Health checks and metrics collection

### **Development Tools**
- **Build Tool**: Next.js with Turbopack
- **Testing**: Jest + React Testing Library
- **Linting**: ESLint with TypeScript rules
- **Formatting**: Prettier with consistent config
- **Git Hooks**: Husky for pre-commit validation
- **Container**: Docker with multi-stage builds
- **Proxy**: nginx for reverse proxy and load balancing

## Configuration Architecture

### **Configuration Files**
```
config/
├── app/                    # Application-wide settings
│   ├── app.config.ts      # Main configuration
│   ├── features.config.ts # Feature flags
│   └── routes.config.ts   # Dynamic routing
├── components/            # Component schemas
│   ├── Button/config.ts   # Button component config
│   ├── Card/config.ts     # Card component config
│   └── [component]/       # Other component configs
├── content/              # Multilingual content
│   ├── en/               # English content files
│   └── pt/               # Portuguese content files
├── devices/              # Device database
│   ├── apple.devices.ts  # Apple device catalog
│   ├── android.devices.ts # Android device catalog
│   └── [type].devices.ts # Other device types
├── environments/         # Environment configs
│   ├── development.ts    # Development settings
│   ├── staging.ts        # Staging settings
│   └── production.ts     # Production settings
├── forms/               # Form schemas
│   └── booking.form.ts  # Booking form configuration
├── pages/               # Page configurations
│   ├── home.config.ts   # Homepage configuration
│   └── [page].config.ts # Other page configurations
├── services/            # Service configurations
│   └── api.config.ts    # API service configuration
└── theme/               # Theme configurations
    └── nordic.theme.ts  # Nordic design system
```

### **Component System**
```
components/
├── ui/                    # Base UI components
│   ├── Button.tsx         # Configurable button
│   ├── Card.tsx           # Configurable card
│   ├── Input.tsx          # Configurable input
│   └── [component].tsx    # Other base components
├── admin/                 # Admin interface components
│   ├── AdminDashboard.tsx # Admin dashboard
│   ├── RepairQueue.tsx    # Repair queue management
│   └── [component].tsx    # Other admin components
├── auth/                  # Authentication components
│   ├── LoginForm.tsx      # Login form
│   ├── RegisterForm.tsx   # Registration form
│   └── [component].tsx    # Other auth components
├── booking/               # Booking flow components
│   ├── DeviceSelector.tsx # Device selection
│   ├── ModelSelection.tsx # Model selection
│   └── [component].tsx    # Other booking components
├── layout/                # Layout components
│   ├── Header.tsx         # Site header
│   ├── Footer.tsx         # Site footer
│   └── MainLayout.tsx     # Main layout
└── sections/              # Page sections
    ├── HeroSection.tsx    # Hero section
    ├── ServicesGrid.tsx   # Services display
    └── [component].tsx    # Other sections
```

### **CSS Architecture - Modular Design System**

RevivaTech uses a modular CSS architecture to maintain scalability, prevent token overflow, and organize design system components effectively.

```
src/styles/
├── mobile-optimizations.css   # Mobile-specific touch and gesture optimizations
├── modules/                   # 🆕 Modular CSS Architecture
│   ├── design-tokens.css      # Core design system tokens
│   │   ├── Color palette (Primary, Secondary, Accent, Neutral)
│   │   ├── Typography (SF Pro Display/Text, font sizes, weights)
│   │   ├── Spacing scale (4px grid system)
│   │   ├── Border radius tokens
│   │   ├── Box shadow definitions
│   │   ├── Animation timing and easing
│   │   └── Glass effects and gradients
│   ├── animations.css         # Motion and micro-interactions
│   │   ├── Keyframe definitions (gradient-shift, floating, twinkle)
│   │   ├── Animation classes (hover, focus, loading states)
│   │   ├── Glow effects and transitions
│   │   ├── Hero section animations
│   │   └── Motion accessibility (prefers-reduced-motion)
│   ├── utilities.css          # Helper classes and patterns
│   │   ├── Text utilities (alignment, weight, transform)
│   │   ├── Accessibility helpers (sr-only, live-region)
│   │   ├── Touch optimization (tap targets, feedback)
│   │   ├── Mobile interaction patterns
│   │   ├── Icon sizing system
│   │   └── Contrast utilities
│   └── responsive.css         # Mobile-first responsive design
│       ├── Breakpoint definitions
│       ├── Container queries
│       ├── Touch target sizing
│       ├── Safe area support
│       ├── Dark mode support
│       └── Print styles
└── themes/                    # Theme configuration files
    └── nordic.theme.ts        # Nordic design system configuration
```

#### **CSS Import Structure**

The main `globals.css` file imports all modules to maintain clean organization:

```css
@import "tailwindcss";
@import "../styles/mobile-optimizations.css";

/* Modular CSS Architecture */
@import "../styles/modules/design-tokens.css";
@import "../styles/modules/animations.css";
@import "../styles/modules/utilities.css";
@import "../styles/modules/responsive.css";

/* Base component styles follow... */
```

#### **Benefits of Modular CSS**

1. **Token Limit Prevention**: Each module is small enough to read/edit without hitting Claude's 25,000 token limit
2. **Maintainability**: Clear separation of concerns (tokens, animations, utilities, responsive)
3. **Performance**: CSS imports are bundled efficiently by Next.js
4. **Scalability**: Easy to add new modules without affecting existing styles
5. **Developer Experience**: Quick access to specific style categories

#### **Usage Patterns**

```bash
# Edit color palette and design tokens
Read /opt/webapps/revivatech/frontend/src/styles/modules/design-tokens.css

# Add new animations or micro-interactions
Read /opt/webapps/revivatech/frontend/src/styles/modules/animations.css

# Modify utility classes or accessibility helpers
Read /opt/webapps/revivatech/frontend/src/styles/modules/utilities.css

# Update responsive design or mobile optimization
Read /opt/webapps/revivatech/frontend/src/styles/modules/responsive.css
```

## Data Flow Architecture

### **Configuration Loading**
```
1. Application Start
   ├── Load environment config
   ├── Load feature flags
   ├── Load theme configuration
   └── Initialize services

2. Component Rendering
   ├── Load component configuration
   ├── Load content based on locale
   ├── Apply theme tokens
   └── Render with configuration

3. Page Generation
   ├── Load page configuration
   ├── Load section configurations
   ├── Compose page from sections
   └── Apply SEO metadata
```

### **Service Architecture**
```
Service Layer
├── API Client (configurable endpoints)
├── Authentication Service (JWT management)
├── Booking Service (repair bookings)
├── Customer Service (customer management)
├── Device Service (device database)
├── Content Service (multilingual content)
├── Theme Service (design system)
└── Configuration Service (config management)
```

## Development Workflow

### **Adding New Components**
1. Create component configuration in `/config/components/[Name]/config.ts`
2. Define component schema with Zod validation
3. Create React component in `/src/components/[category]/[Name].tsx`
4. Register component in component registry
5. Add component to exports in `/src/components/[category]/index.ts`
6. Test component with different configurations

### **Adding New Pages**
1. Create page configuration in `/config/pages/[name].config.ts`
2. Define page sections and their configurations
3. Add route configuration in `/config/app/routes.config.ts`
4. Create page component in `/src/app/[route]/page.tsx`
5. Test page with different configurations

### **Adding New Services**
1. Create service configuration in `/config/services/[name].config.ts`
2. Define service interface and implementation
3. Add service to service factory
4. Register service in application configuration
5. Test service with mock and real implementations

### **Adding New Content**
1. Add content to `/config/content/en/[section].yaml`
2. Add Portuguese translation to `/config/content/pt/[section].yaml`
3. Reference content in components using `@content.[section].[key]`
4. Test content loading and fallbacks

## Quality Assurance

### **Testing Strategy**
- **Unit Tests**: Component and utility testing
- **Integration Tests**: API and service testing
- **Configuration Tests**: Schema validation testing
- **E2E Tests**: Full user journey testing

### **Performance Monitoring**
- **Build Analysis**: Bundle size optimization
- **Runtime Metrics**: Component render performance
- **Configuration Loading**: Config load time monitoring
- **Service Response**: API response time tracking

### **Security Measures**
- **Input Validation**: Zod schema validation
- **Authentication**: JWT with refresh tokens
- **Authorization**: Role-based access control
- **Data Protection**: Environment variable encryption

---

## Quick Reference

### **Key Commands**
```bash
# Development
pnpm dev                    # Start development server
pnpm build                  # Build for production
pnpm test                   # Run tests
pnpm lint                   # Run linting

# Docker
docker ps -a                # List containers
docker logs [container]     # View logs
docker exec -it [container] bash # Access container

# Configuration
pnpm config:validate        # Validate configurations
pnpm config:generate        # Generate config types
pnpm config:test           # Test config variations
```

### **Important Paths**
- **Main Config**: `/frontend/config/app/app.config.ts`
- **Components**: `/frontend/src/components/`
- **Configuration**: `/frontend/config/`
- **Content**: `/frontend/config/content/`
- **Theme**: `/frontend/config/theme/nordic.theme.ts`
- **Services**: `/frontend/src/lib/services/`

---

*RevivaTech Project Structure v2.0 | Configuration-Driven Architecture*
*Last Updated: July 2025*
│   │   ├── button.tsx         # Button component
│   │   ├── card.tsx           # Card component
│   │   ├── dialog.tsx         # Dialog component
│   │   ├── form.tsx           # Form components
│   │   ├── input.tsx          # Input component
│   │   ├── select.tsx         # Select component
│   │   └── [40+ more components]
│   ├── booking/               # Booking flow components
│   │   ├── DeviceSelection.tsx
│   │   ├── ModelSelection.tsx
│   │   ├── RepairSelection.tsx
│   │   ├── BookingForm.tsx
│   │   ├── PriceCalculator.tsx
│   │   ├── AppointmentCalendar.tsx
│   │   └── BookingConfirmation.tsx
│   ├── layout/                # Layout components
│   │   ├── Header.tsx         # Site header
│   │   ├── Footer.tsx         # Site footer
│   │   ├── FloatingNav.tsx    # Floating navigation
│   │   ├── MobileMenu.tsx     # Mobile menu
│   │   └── ThemeToggle.tsx    # Dark/light toggle
│   ├── admin/                 # Admin components
│   │   ├── RepairQueue.tsx    # Repair queue management
│   │   ├── CustomerList.tsx   # Customer listing
│   │   ├── Analytics.tsx      # Analytics dashboard
│   │   ├── InventoryManager.tsx
│   │   ├── ChatDashboard.tsx  # Chatwoot admin interface
│   │   ├── AgentManagement.tsx # Agent routing and status
│   │   └── ConversationList.tsx # Chat conversation management
│   ├── customer/              # Customer dashboard components
│   │   ├── dashboard/         # Dashboard specific components
│   │   │   ├── DashboardLayout.tsx    # Main dashboard layout
│   │   │   ├── StatsCards.tsx         # Repair statistics cards
│   │   │   ├── QuoteCenter.tsx        # Quote management
│   │   │   ├── RecentActivity.tsx     # Activity feed
│   │   │   └── RepairTracking.tsx     # Real-time repair status
│   │   ├── profile/           # Profile management components
│   │   │   ├── ProfileLayout.tsx      # Profile page layout
│   │   │   ├── PersonalInfo.tsx       # Personal information
│   │   │   ├── SecuritySettings.tsx   # Security and 2FA
│   │   │   ├── Preferences.tsx        # User preferences
│   │   │   └── AddressBook.tsx        # Saved addresses
│   │   └── shared/            # Shared customer components
│   │       ├── CustomerCard.tsx       # Customer info card
│   │       ├── RepairStatusBadge.tsx  # Status indicators
│   │       └── NotificationCenter.tsx # Customer notifications
│   ├── chat/                  # Chat messaging components
│   │   ├── ChatWidget.tsx     # Chatwoot widget integration
│   │   ├── ChatButton.tsx     # Floating chat button
│   │   ├── ChatHeader.tsx     # Chat widget header
│   │   ├── MessageList.tsx    # Chat message list
│   │   ├── MessageInput.tsx   # Message input field
│   │   ├── FileUpload.tsx     # File sharing component
│   │   ├── TypingIndicator.tsx # Typing status
│   │   ├── AgentStatus.tsx    # Agent availability
│   │   └── ChatNotification.tsx # Chat notifications
│   ├── shared/                # Shared components
│   │   ├── ProgressIndicator.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── ErrorBoundary.tsx
│   │   └── SEO.tsx
│   └── providers/             # Context providers
│       ├── ThemeProvider.tsx
│       ├── AuthProvider.tsx
│       ├── BookingProvider.tsx
│       ├── ChatProvider.tsx   # Chat state management
│       ├── CustomerProvider.tsx # Customer dashboard state
│       └── NotificationProvider.tsx # Real-time notifications
├── lib/                       # Utility libraries
│   ├── api/                   # API utilities
│   │   ├── client.ts          # API client
│   │   ├── endpoints.ts       # API endpoints
│   │   ├── errors.ts          # Error handling
│   │   ├── chatwoot.ts        # Chatwoot API client
│   │   └── websocket.ts       # WebSocket connections
│   ├── auth/                  # Authentication utilities
│   │   ├── jwt.ts             # JWT handling
│   │   ├── session.ts         # Session management
│   │   └── permissions.ts     # Role permissions
│   ├── db/                    # Database utilities
│   │   ├── prisma.ts          # Prisma client
│   │   └── redis.ts           # Redis client
│   ├── email/                 # Email utilities
│   │   ├── templates/         # Email templates
│   │   └── sender.ts          # Email sending
│   ├── sms/                   # SMS utilities
│   ├── chat/                  # Chat utilities
│   │   ├── chatwoot-config.ts # Chatwoot configuration
│   │   ├── message-parser.ts  # Message parsing
│   │   └── notification.ts    # Chat notifications
│   ├── utils.ts               # General utilities
│   └── constants.ts           # App constants
├── hooks/                     # Custom React hooks
│   ├── useAuth.ts             # Authentication hook
│   ├── useBooking.ts          # Booking state hook
│   ├── useDevice.ts           # Device data hook
│   ├── useMobile.ts           # Mobile detection
│   ├── useTheme.ts            # Theme hook
│   ├── useChat.ts             # Chat messaging hook
│   ├── useDashboard.ts        # Customer dashboard hook
│   ├── useRealtime.ts         # Real-time updates hook
│   └── useNotifications.ts    # Notification management hook
├── data/                      # Static data
│   ├── devices.ts             # Device catalog
│   ├── devices-pt.ts          # Portuguese devices
│   ├── repairs.ts             # Repair types
│   └── pricing.ts             # Pricing rules
├── types/                     # TypeScript types
│   ├── api.ts                 # API types
│   ├── booking.ts             # Booking types
│   ├── device.ts              # Device types
│   ├── repair.ts              # Repair types
│   ├── user.ts                # User types
│   ├── chat.ts                # Chat messaging types
│   ├── customer.ts            # Customer dashboard types
│   ├── notification.ts        # Notification types
│   └── index.ts               # Type exports
├── styles/                    # Global styles and design system
│   ├── mobile-optimizations.css   # Mobile-specific optimizations
│   ├── modules/               # Modular CSS architecture (NEW)
│   │   ├── design-tokens.css  # Color palette, typography, spacing, shadows
│   │   ├── animations.css     # Keyframes, micro-interactions, motion effects
│   │   ├── utilities.css      # Utility classes, accessibility, touch optimization
│   │   └── responsive.css     # Mobile-first responsive design, media queries
│   └── themes/                # Theme definitions
├── services/                  # Business logic services
│   ├── booking/               # Booking services
│   ├── repair/                # Repair services
│   ├── customer/              # Customer services
│   ├── notification/          # Notification services
│   ├── crm/                   # CRM integration
│   ├── chat/                  # Chat messaging services
│   │   ├── chatwoot.ts        # Chatwoot service integration
│   │   ├── websocket.ts       # Real-time messaging
│   │   └── file-upload.ts     # Chat file handling
│   └── dashboard/             # Dashboard services
│       ├── stats.ts           # Customer statistics
│       ├── activity.ts        # Activity tracking
│       └── realtime.ts        # Real-time updates
└── middleware.ts              # Next.js middleware
```

## Backend Structure (if separate)
```
backend/
├── src/
│   ├── controllers/           # Route controllers
│   ├── services/              # Business logic
│   ├── models/                # Data models
│   ├── middlewares/           # Express middlewares
│   ├── routes/                # API routes
│   ├── utils/                 # Utilities
│   └── config/                # Configuration
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migrations
└── tests/                     # Backend tests
```

## Database Structure
```
database/
├── schemas/                   # Database schemas
│   ├── booking.sql           # Booking tables
│   ├── customer.sql          # Customer tables
│   ├── device.sql            # Device tables
│   ├── repair.sql            # Repair tables
│   └── admin.sql             # Admin tables
└── seeds/                    # Seed data
    ├── devices.sql           # Device catalog
    └── repairs.sql           # Repair types
```

## Configuration Files

### `next.config.js`
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'cdn.example.com'],
  },
  i18n: {
    locales: ['en', 'pt'],
    defaultLocale: 'en',
  },
}
```

### `tailwind.config.ts`
```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        // ... more theme colors
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
```

### Environment Variables (`.env.example`)
```bash
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME="Repair Shop"

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/repairshop"
REDIS_URL="redis://localhost:6379"

# Authentication
JWT_SECRET=your-jwt-secret
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000

# Email
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-password

# SMS
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Payment
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# CRM Integration
CRM_API_URL=https://api.crm.com
CRM_API_KEY=your-api-key

# Storage
AWS_S3_BUCKET=repair-shop-uploads
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Analytics
GOOGLE_ANALYTICS_ID=GA-XXXXXXXXX
SENTRY_DSN=https://...@sentry.io/...

# Chatwoot Integration
CHATWOOT_BASE_URL=https://chat.revivatech.com
CHATWOOT_WEBSITE_TOKEN=your-website-token
CHATWOOT_API_ACCESS_TOKEN=your-api-token
CHATWOOT_ACCOUNT_ID=1
CHATWOOT_INBOX_ID=1

# WebSocket & Real-time
NEXT_PUBLIC_WS_URL=ws://localhost:3001
NEXT_PUBLIC_CHATWOOT_WS_URL=wss://chat.revivatech.com/cable

# Feature Flags
ENABLE_PWA=true
ENABLE_FINGERPRINTING=true
ENABLE_CHAT_SUPPORT=true
ENABLE_REALTIME_UPDATES=true
```

## Deployment Structure
```
deployment/
├── docker/                    # Docker configurations
│   ├── Dockerfile.prod       # Production Dockerfile
│   ├── Dockerfile.dev        # Development Dockerfile
│   ├── docker-compose.yml    # Main services
│   └── docker-compose.chatwoot.yml # Chatwoot services
├── kubernetes/               # K8s configurations
│   ├── deployment.yaml       # App deployment
│   ├── service.yaml          # Service definition
│   └── ingress.yaml          # Ingress rules
├── nginx/                    # Nginx configurations
│   └── default.conf          # Nginx config
└── scripts/                  # Deployment scripts
    ├── deploy.sh            # Deployment script
    └── rollback.sh          # Rollback script
```

## Build Output Structure
```
.next/                        # Next.js build output
├── cache/                    # Build cache
├── server/                   # Server-side code
├── static/                   # Static assets
└── build-manifest.json       # Build manifest
```

## Module Organization Patterns

### Feature-Based Organization
Each major feature has its own directory containing all related code:
- Components
- Hooks
- Services
- Types
- Tests

### Shared Code Organization
Common code is organized in centralized directories:
- `/lib` for utilities
- `/components/ui` for base components
- `/hooks` for shared hooks
- `/types` for shared types

### Naming Conventions
- Components: PascalCase (e.g., `DeviceSelection.tsx`)
- Utilities: camelCase (e.g., `formatDate.ts`)
- Types: PascalCase (e.g., `BookingType.ts`)
- Constants: UPPER_SNAKE_CASE (e.g., `API_ENDPOINTS`)
- Files: kebab-case for routes, camelCase for others

## Chatwoot Integration Architecture

### Docker Compose Structure
```yaml
# docker-compose.chatwoot.yml
version: '3.8'
services:
  chatwoot-web:
    image: chatwoot/chatwoot:latest
    container_name: chatwoot-web
    environment:
      - DATABASE_URL=postgresql://postgres:password@chatwoot-postgres:5432/chatwoot
      - REDIS_URL=redis://chatwoot-redis:6379
      - RAILS_ENV=production
      - SECRET_KEY_BASE=your-secret-key
    ports:
      - "3000:3000"
    depends_on:
      - chatwoot-postgres
      - chatwoot-redis

  chatwoot-postgres:
    image: postgres:13
    container_name: chatwoot-postgres
    environment:
      - POSTGRES_DB=chatwoot
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - chatwoot_postgres_data:/var/lib/postgresql/data

  chatwoot-redis:
    image: redis:alpine
    container_name: chatwoot-redis
    volumes:
      - chatwoot_redis_data:/data

volumes:
  chatwoot_postgres_data:
  chatwoot_redis_data:
```

### Customer Dashboard Integration Points
```
Customer Dashboard ↔ Chat System Integration:

1. Authentication Flow:
   Customer Login → JWT Token → Chatwoot Auto-Auth

2. Dashboard Components:
   ├── DashboardLayout.tsx → Embeds ChatWidget.tsx
   ├── StatsCards.tsx → Shows chat response metrics
   ├── RecentActivity.tsx → Includes chat conversations
   └── NotificationCenter.tsx → Chat notifications

3. Real-time Updates:
   WebSocket → Customer Dashboard → Live Chat Status
   Chatwoot Webhooks → API → Dashboard State Updates

4. Profile Integration:
   Customer Profile → Chatwoot Contact Sync
   Repair History → Chat Context
   Preferences → Chat Widget Settings
```

### Admin Chat Management Structure
```
Admin Dashboard ↔ Chatwoot Integration:

1. Embedded Interface:
   /admin/chat → Chatwoot Admin Iframe
   
2. Agent Management:
   ├── AgentManagement.tsx → Agent status/routing
   ├── ConversationList.tsx → Live conversation queue
   └── ChatDashboard.tsx → Performance metrics

3. CRM Integration:
   Chatwoot Conversations → CRM Ticket Creation
   Customer Context → Repair History Display
   Automated Workflows → Follow-up Actions
```