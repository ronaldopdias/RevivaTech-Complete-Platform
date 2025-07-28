# Configuration Standards - RevivaTech

This document defines the configuration standards and patterns for the RevivaTech website to ensure consistency, maintainability, and minimal hardcoding.

## Table of Contents
1. [Configuration File Structure](#configuration-file-structure)
2. [Component Configuration](#component-configuration)
3. [Page Configuration](#page-configuration)
4. [Service Configuration](#service-configuration)
5. [Theme Configuration](#theme-configuration)
6. [Content Configuration](#content-configuration)
7. [Feature Flag Configuration](#feature-flag-configuration)
8. [Environment Configuration](#environment-configuration)
9. [Validation Standards](#validation-standards)
10. [Best Practices](#best-practices)

## Configuration File Structure

### Directory Organization
```
config/
├── app/                    # Application-wide configuration
│   ├── app.config.ts      # Main app configuration
│   ├── features.config.ts # Feature flags
│   └── routes.config.ts   # Route definitions
├── components/            # Component configurations
│   └── [component-name]/
│       ├── config.ts      # Component definition
│       └── schema.json    # JSON schema for validation
├── pages/                 # Page configurations
│   ├── [page-name].yaml   # Page structure and content
│   └── templates/         # Page templates
├── services/              # Service configurations
│   ├── api.config.ts      # API endpoints
│   ├── crm.config.ts      # CRM integration
│   └── chat.config.ts     # Chat system config
├── theme/                 # Theme and design tokens
│   ├── tokens.ts          # Design tokens
│   ├── nordic.theme.ts    # Nordic theme
│   └── components.ts      # Component themes
├── content/               # Content configurations
│   ├── en/               # English content
│   └── pt/               # Portuguese content
└── environments/          # Environment-specific configs
    ├── development.ts
    ├── staging.ts
    └── production.ts
```

## Component Configuration

### Component Definition Schema
```typescript
interface ComponentConfig {
  // Metadata
  name: string;                    // Unique component identifier
  version: string;                 // Semantic versioning
  description: string;             // Component purpose
  category: 'ui' | 'layout' | 'form' | 'display' | 'navigation';
  
  // Properties
  props: {
    [key: string]: PropDefinition;
  };
  
  // Variants
  variants?: {
    [variantName: string]: Partial<ComponentProps>;
  };
  
  // Slots for composition
  slots?: {
    [slotName: string]: SlotDefinition;
  };
  
  // Events
  events?: {
    [eventName: string]: EventDefinition;
  };
  
  // Styling
  styling?: {
    responsive?: boolean;
    themeable?: boolean;
    customizable?: string[]; // List of customizable properties
  };
}
```

### Example: Button Component Configuration
```yaml
name: Button
version: 1.0.0
description: Configurable button component with multiple variants
category: ui

props:
  text:
    type: string
    required: true
    description: Button label text
  
  variant:
    type: enum
    values: [primary, secondary, ghost, danger]
    default: primary
    
  size:
    type: enum
    values: [small, medium, large]
    default: medium
    
  icon:
    type: object
    properties:
      name: string
      position: enum[left, right]
    
  disabled:
    type: boolean
    default: false
    
  loading:
    type: boolean
    default: false

variants:
  cta:
    variant: primary
    size: large
    
  nav:
    variant: ghost
    size: medium
    
  danger:
    variant: danger
    icon:
      name: alert-triangle

events:
  onClick:
    description: Triggered when button is clicked
    payload: MouseEvent
    
  onHover:
    description: Triggered on hover
    payload: MouseEvent

styling:
  responsive: true
  themeable: true
  customizable:
    - backgroundColor
    - textColor
    - borderRadius
    - padding
```

## Page Configuration

### Page Structure Schema
```typescript
interface PageConfig {
  // Metadata
  meta: {
    title: string;
    description: string;
    keywords?: string[];
    ogImage?: string;
    robots?: string;
  };
  
  // Layout
  layout: string; // Layout component name
  
  // Sections
  sections: SectionConfig[];
  
  // Features
  features?: string[]; // Required feature flags
  
  // Auth
  auth?: {
    required: boolean;
    roles?: string[];
    redirectTo?: string;
  };
  
  // Analytics
  analytics?: {
    pageType: string;
    category: string;
    customDimensions?: Record<string, any>;
  };
}

interface SectionConfig {
  id: string;
  component: string;
  props: Record<string, any>;
  visibility?: {
    conditions?: Condition[];
    responsive?: {
      mobile?: boolean;
      tablet?: boolean;
      desktop?: boolean;
    };
  };
}
```

### Example: Home Page Configuration
```yaml
meta:
  title: "RevivaTech - Professional Computer Repair Services"
  description: "Expert repair services for all your devices - MacBook, iPhone, PC, and more"
  keywords:
    - computer repair
    - mac repair
    - iphone repair
    - laptop repair
  ogImage: "/images/og-home.jpg"

layout: DefaultLayout

sections:
  - id: hero
    component: HeroSection
    props:
      title: "@content.home.hero.title"
      subtitle: "@content.home.hero.subtitle"
      background:
        type: image
        src: "@assets.images.hero-bg"
        overlay: true
      cta:
        primary:
          text: "@content.home.hero.cta.primary"
          action: "navigate:/booking"
        secondary:
          text: "@content.home.hero.cta.secondary"
          action: "scroll:#services"
          
  - id: services
    component: ServiceGrid
    props:
      title: "@content.home.services.title"
      items: "@data.services.featured"
      columns:
        mobile: 1
        tablet: 2
        desktop: 3
      variant: "card"
      
  - id: features
    component: FeatureSection
    props:
      items:
        - icon: "clock"
          title: "@content.home.features.fast.title"
          description: "@content.home.features.fast.description"
        - icon: "shield"
          title: "@content.home.features.warranty.title"
          description: "@content.home.features.warranty.description"
        - icon: "star"
          title: "@content.home.features.quality.title"
          description: "@content.home.features.quality.description"
          
  - id: testimonials
    component: TestimonialCarousel
    props:
      title: "@content.home.testimonials.title"
      items: "@data.testimonials.recent"
      autoplay: true
      interval: 5000
    visibility:
      conditions:
        - feature: testimonials
          enabled: true
          
  - id: cta
    component: CTASection
    props:
      title: "@content.home.cta.title"
      description: "@content.home.cta.description"
      button:
        text: "@content.home.cta.button"
        action: "navigate:/booking"
        variant: "cta"

analytics:
  pageType: landing
  category: home
```

## Service Configuration

### Service Definition Schema
```typescript
interface ServiceConfig {
  // Service metadata
  name: string;
  version: string;
  description: string;
  
  // Connection settings
  connection: {
    baseURL: string;
    timeout?: number;
    headers?: Record<string, string>;
    auth?: AuthConfig;
  };
  
  // Endpoints
  endpoints: {
    [key: string]: EndpointConfig;
  };
  
  // Error handling
  errorHandling?: {
    retry?: RetryConfig;
    fallback?: FallbackConfig;
    logging?: LoggingConfig;
  };
  
  // Caching
  cache?: {
    enabled: boolean;
    ttl?: number;
    strategy?: 'memory' | 'redis' | 'localStorage';
  };
}
```

### Example: Booking Service Configuration
```yaml
name: BookingService
version: 1.0.0
description: Handles all booking-related operations

connection:
  baseURL: "${API_BASE_URL}/api/v1"
  timeout: 30000
  headers:
    X-API-Version: "1.0"
  auth:
    type: jwt
    tokenKey: "authToken"

endpoints:
  createBooking:
    method: POST
    path: "/bookings"
    validation:
      body: "@schemas.booking.create"
    cache:
      enabled: false
      
  getBooking:
    method: GET
    path: "/bookings/{id}"
    cache:
      enabled: true
      ttl: 300
      
  listBookings:
    method: GET
    path: "/bookings"
    params:
      - name: status
        type: string
        required: false
      - name: page
        type: number
        default: 1
      - name: limit
        type: number
        default: 20
    cache:
      enabled: true
      ttl: 60
      
  updateBooking:
    method: PATCH
    path: "/bookings/{id}"
    validation:
      body: "@schemas.booking.update"
      
  cancelBooking:
    method: POST
    path: "/bookings/{id}/cancel"
    validation:
      body: "@schemas.booking.cancel"

errorHandling:
  retry:
    attempts: 3
    delay: 1000
    backoff: exponential
    retryOn: [408, 429, 500, 502, 503, 504]
  fallback:
    strategy: cache
    message: "@messages.errors.service.unavailable"
  logging:
    level: error
    includeStack: true

cache:
  enabled: true
  strategy: redis
  ttl: 3600
```

## Theme Configuration

### Design Token Structure
```typescript
interface ThemeConfig {
  name: string;
  description: string;
  
  // Color system
  colors: {
    primary: ColorScale;
    secondary: ColorScale;
    neutral: ColorScale;
    semantic: {
      success: ColorScale;
      warning: ColorScale;
      error: ColorScale;
      info: ColorScale;
    };
    custom?: Record<string, string>;
  };
  
  // Typography
  typography: {
    fonts: {
      heading: string;
      body: string;
      mono: string;
    };
    sizes: Record<string, string>;
    weights: Record<string, number>;
    lineHeights: Record<string, number>;
  };
  
  // Spacing
  spacing: {
    base: number;
    scale: Record<string, string>;
  };
  
  // Layout
  layout: {
    breakpoints: Record<string, string>;
    container: {
      maxWidth: string;
      padding: Record<string, string>;
    };
  };
  
  // Effects
  effects: {
    shadows: Record<string, string>;
    radii: Record<string, string>;
    transitions: Record<string, string>;
  };
}
```

### Example: Nordic Theme Configuration
```yaml
name: Nordic
description: Apple-inspired minimalist design theme

colors:
  primary:
    50: "#EFF6FF"
    100: "#DBEAFE"
    500: "#007AFF"  # Apple Blue
    600: "#0051D5"
    700: "#003FA3"
    900: "#002651"
    
  neutral:
    0: "#FFFFFF"
    50: "#F9FAFB"
    100: "#F3F4F6"
    200: "#E5E7EB"
    800: "#1F2937"
    900: "#1D1D1F"  # Deep charcoal
    
  semantic:
    success:
      light: "#D1FAE5"
      main: "#10B981"
      dark: "#059669"
    warning:
      light: "#FEF3C7"
      main: "#F59E0B"
      dark: "#D97706"
    error:
      light: "#FEE2E2"
      main: "#EF4444"
      dark: "#DC2626"

typography:
  fonts:
    heading: "SF Pro Display, -apple-system, Inter, sans-serif"
    body: "SF Pro Text, -apple-system, Inter, sans-serif"
    mono: "SF Mono, Monaco, monospace"
    
  sizes:
    xs: "0.75rem"
    sm: "0.875rem"
    base: "1rem"
    lg: "1.125rem"
    xl: "1.25rem"
    2xl: "1.5rem"
    3xl: "1.875rem"
    4xl: "2.25rem"
    5xl: "3rem"
    
  weights:
    light: 300
    normal: 400
    medium: 500
    semibold: 600
    bold: 700

spacing:
  base: 8
  scale:
    xs: "0.5rem"   # 8px
    sm: "1rem"     # 16px
    md: "1.5rem"   # 24px
    lg: "2rem"     # 32px
    xl: "3rem"     # 48px
    2xl: "4rem"    # 64px

effects:
  shadows:
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
    glass: "0 8px 32px rgba(0, 0, 0, 0.08)"
    
  radii:
    none: "0"
    sm: "0.25rem"
    md: "0.5rem"
    lg: "0.75rem"
    xl: "1rem"
    full: "9999px"
    
  transitions:
    fast: "150ms ease-in-out"
    normal: "250ms ease-in-out"
    slow: "350ms ease-in-out"
```

## Content Configuration

### Content Structure Schema
```typescript
interface ContentConfig {
  locale: string;
  namespace: string;
  
  content: {
    [key: string]: ContentItem | ContentGroup;
  };
}

type ContentItem = string | RichText | MediaContent;

interface ContentGroup {
  [key: string]: ContentItem | ContentGroup;
}
```

### Example: English Content Configuration
```yaml
locale: en
namespace: home

content:
  hero:
    title: "Expert Computer Repair Services"
    subtitle: "Fast, reliable repairs for all your devices"
    cta:
      primary: "Book a Repair"
      secondary: "View Services"
      
  services:
    title: "Our Services"
    items:
      mac:
        title: "Mac Repair"
        description: "Professional repairs for all Mac devices"
        features:
          - "Screen replacement"
          - "Battery service"
          - "Logic board repair"
      pc:
        title: "PC Repair"
        description: "Complete PC and laptop repair services"
        features:
          - "Hardware upgrades"
          - "Virus removal"
          - "Data recovery"
      mobile:
        title: "Mobile Repair"
        description: "iPhone and Android device repairs"
        features:
          - "Screen repair"
          - "Battery replacement"
          - "Water damage"
          
  features:
    fast:
      title: "Fast Turnaround"
      description: "Most repairs completed within 24-48 hours"
    warranty:
      title: "90-Day Warranty"
      description: "All repairs backed by our comprehensive warranty"
    quality:
      title: "Quality Parts"
      description: "We use only genuine or high-quality replacement parts"
```

## Feature Flag Configuration

### Feature Flag Schema
```typescript
interface FeatureFlag {
  name: string;
  description: string;
  enabled: boolean;
  
  // Rollout configuration
  rollout?: {
    strategy: 'all' | 'percentage' | 'users' | 'custom';
    percentage?: number;
    users?: string[];
    conditions?: Condition[];
  };
  
  // Feature-specific configuration
  config?: Record<string, any>;
  
  // Dependencies
  dependencies?: string[];
  
  // Expiration
  expires?: string; // ISO date
}
```

### Example: Feature Flags Configuration
```yaml
features:
  chat_support:
    name: "Live Chat Support"
    description: "Enable Chatwoot live chat integration"
    enabled: true
    config:
      position: bottom-right
      autoOpen: false
      welcomeMessage: "Hi! How can we help you today?"
      
  advanced_booking:
    name: "Advanced Booking Flow"
    description: "New multi-step booking with device detection"
    enabled: true
    rollout:
      strategy: percentage
      percentage: 100
      
  ai_diagnostics:
    name: "AI Diagnostics"
    description: "AI-powered repair diagnostics"
    enabled: false
    rollout:
      strategy: users
      users: ["beta-tester-1", "beta-tester-2"]
    config:
      model: "diagnostics-v2"
      confidence_threshold: 0.85
      
  dark_mode:
    name: "Dark Mode"
    description: "Enable dark mode theme support"
    enabled: true
    config:
      default: system
      persistence: localStorage
```

## Environment Configuration

### Environment Config Schema
```typescript
interface EnvironmentConfig {
  name: string;
  
  // API Configuration
  api: {
    baseURL: string;
    version: string;
    timeout: number;
  };
  
  // Feature overrides
  features?: Partial<Record<string, boolean>>;
  
  // Service configurations
  services: {
    [service: string]: ServiceEnvironmentConfig;
  };
  
  // Security
  security: {
    cors: CORSConfig;
    rateLimit: RateLimitConfig;
    encryption: EncryptionConfig;
  };
  
  // Monitoring
  monitoring: {
    enabled: boolean;
    services: string[];
  };
}
```

### Example: Production Environment Configuration
```yaml
name: production

api:
  baseURL: https://api.revivatech.com
  version: v1
  timeout: 30000

features:
  debug_mode: false
  test_payments: false
  
services:
  database:
    url: "${DATABASE_URL}"
    ssl: true
    poolSize: 20
    
  redis:
    url: "${REDIS_URL}"
    tls: true
    
  email:
    provider: sendgrid
    apiKey: "${SENDGRID_API_KEY}"
    from: "support@revivatech.com"
    
  sms:
    provider: twilio
    accountSid: "${TWILIO_ACCOUNT_SID}"
    authToken: "${TWILIO_AUTH_TOKEN}"
    from: "${TWILIO_PHONE_NUMBER}"
    
  storage:
    provider: s3
    bucket: "revivatech-prod"
    region: "us-east-1"
    cdn: "https://cdn.revivatech.com"

security:
  cors:
    origins:
      - https://revivatech.com
      - https://www.revivatech.com
    credentials: true
    
  rateLimit:
    windowMs: 900000  # 15 minutes
    max: 100
    
  encryption:
    algorithm: AES-256-GCM
    keyRotation: 30d

monitoring:
  enabled: true
  services:
    - sentry
    - prometheus
    - newrelic
```

## Validation Standards

### Schema Validation Rules
1. All configurations must have accompanying JSON schemas
2. Use Zod for runtime validation
3. Validate on configuration load
4. Provide meaningful error messages

### Example: Component Schema Validation
```typescript
import { z } from 'zod';

const ComponentConfigSchema = z.object({
  name: z.string().min(1),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  description: z.string(),
  category: z.enum(['ui', 'layout', 'form', 'display', 'navigation']),
  props: z.record(PropDefinitionSchema),
  variants: z.record(z.any()).optional(),
  slots: z.record(SlotDefinitionSchema).optional(),
  events: z.record(EventDefinitionSchema).optional(),
});

// Validate configuration
function validateComponentConfig(config: unknown): ComponentConfig {
  return ComponentConfigSchema.parse(config);
}
```

## Best Practices

### 1. Configuration Naming
- Use descriptive, consistent names
- Follow naming conventions: `kebab-case` for files, `camelCase` for properties
- Group related configurations

### 2. Reference System
- Use `@` prefix for references: `@content.home.title`
- Support dot notation for nested values
- Implement fallback values

### 3. Environment Variables
- Use `${VAR_NAME}` syntax for environment variables
- Never commit sensitive values
- Provide `.env.example` files

### 4. Version Control
- Version all configuration schemas
- Document breaking changes
- Use semantic versioning

### 5. Documentation
- Document all configuration options
- Provide examples for complex configurations
- Keep documentation in sync with schemas

### 6. Testing
- Test all configuration variations
- Validate against schemas in CI/CD
- Test environment-specific configurations

### 7. Performance
- Lazy load configurations when possible
- Cache parsed configurations
- Minimize configuration size

### 8. Security
- Validate all external inputs
- Sanitize user-provided configurations
- Encrypt sensitive configuration data

## Configuration Tools

### 1. Configuration Editor
Build a UI for editing configurations with:
- Schema-based form generation
- Real-time validation
- Preview functionality
- Version control integration

### 2. Configuration CLI
Create CLI tools for:
- Validating configurations
- Generating configuration templates
- Migrating configurations
- Testing configurations

### 3. Configuration API
Provide APIs for:
- Dynamic configuration updates
- Configuration versioning
- A/B testing configurations
- Configuration analytics

## Migration Guide

### From Hardcoded to Configuration
1. Identify hardcoded values
2. Create configuration schema
3. Move values to configuration files
4. Update code to use configuration
5. Test all scenarios
6. Remove hardcoded values

### Example Migration
```typescript
// Before: Hardcoded
const BookingForm = () => {
  return (
    <form>
      <h1>Book Your Repair</h1>
      <button className="bg-blue-500 text-white px-4 py-2">
        Submit Booking
      </button>
    </form>
  );
};

// After: Configuration-driven
const BookingForm = ({ config }) => {
  const { title, submitButton } = config;
  
  return (
    <form>
      <h1>{title}</h1>
      <Button config={submitButton} />
    </form>
  );
};
```

## Conclusion
Following these configuration standards ensures that the RevivaTech website remains flexible, maintainable, and easy to update without code changes. All team members should familiarize themselves with these standards and apply them consistently throughout the project.