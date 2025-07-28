# UI/UX Design Documentation

## Design System Overview

### Brand Identity
- **Primary Purpose**: Professional computer repair services with a focus on trust, expertise, and efficiency
- **Target Audience**: Tech-savvy individuals, businesses, students, and general consumers needing device repairs
- **Brand Values**: Reliability, transparency, expertise, speed, customer-first approach

### Visual Design Principles

#### 1. Clean & Professional
- Minimalist design approach
- Clear visual hierarchy
- Ample white space
- Focus on functionality over decoration

#### 2. Trust & Credibility
- Professional color palette
- Consistent branding
- Clear pricing information
- Visible certifications and guarantees

#### 3. User-Centric
- Intuitive navigation
- Clear call-to-actions
- Accessible design
- Mobile-first approach

## Color System

### Light Mode
```css
:root {
  /* Primary Colors */
  --primary: #2563eb;        /* Blue - Main brand color */
  --primary-hover: #1d4ed8;  /* Darker blue for hover states */
  --primary-light: #dbeafe;  /* Light blue for backgrounds */
  
  /* Secondary Colors */
  --secondary: #10b981;      /* Green - Success/positive */
  --secondary-hover: #059669;
  
  /* Accent Colors */
  --accent: #f59e0b;         /* Orange - Urgent/attention */
  --accent-hover: #d97706;
  
  /* Neutral Colors */
  --background: #ffffff;
  --surface: #f9fafb;
  --card: #ffffff;
  --border: #e5e7eb;
  --text-primary: #111827;
  --text-secondary: #6b7280;
  --text-muted: #9ca3af;
  
  /* Status Colors */
  --success: #10b981;
  --warning: #f59e0b;
  --error: #ef4444;
  --info: #3b82f6;
}
```

### Dark Mode
```css
:root[data-theme="dark"] {
  /* Primary Colors */
  --primary: #3b82f6;
  --primary-hover: #2563eb;
  --primary-light: #1e3a8a;
  
  /* Neutral Colors */
  --background: #0f172a;
  --surface: #1e293b;
  --card: #1e293b;
  --border: #334155;
  --text-primary: #f1f5f9;
  --text-secondary: #cbd5e1;
  --text-muted: #94a3b8;
}
```

## Nordic Design System (Apple-Inspired)

### Nordic Design Philosophy
The Nordic design system draws inspiration from Apple's clean aesthetic, emphasizing simplicity, functionality, and sophisticated minimalism.

#### Core Principles
- **Simplicity First**: Remove unnecessary elements, focus on essential content
- **Clean Hierarchy**: Clear visual structure with consistent spacing
- **Subtle Beauty**: Elegant details without overwhelming decoration
- **Functional Aesthetics**: Every design element serves a purpose

### Nordic Color Palette

#### Light Mode (Nordic)
```css
:root {
  /* Nordic Primary Colors */
  --nordic-primary: #007AFF;        /* Apple Blue - Primary actions */
  --nordic-primary-hover: #0066CC;  /* Darker blue for hover */
  --nordic-primary-light: #E5F3FF;  /* Light blue backgrounds */
  
  /* Nordic Neutrals */
  --nordic-white: #FFFFFF;          /* Pure white surfaces */
  --nordic-gray-50: #F2F2F7;        /* Light background */
  --nordic-gray-100: #E5E5EA;       /* Subtle borders */
  --nordic-gray-200: #D1D1D6;       /* Light borders */
  --nordic-gray-300: #C7C7CC;       /* Medium borders */
  --nordic-gray-400: #AEAEB2;       /* Disabled text */
  --nordic-gray-500: #8E8E93;       /* Secondary text */
  --nordic-gray-600: #636366;       /* Body text */
  --nordic-gray-900: #1D1D1F;       /* Primary text */
  
  /* Nordic Accent Colors */
  --nordic-green: #30D158;          /* Success/positive */
  --nordic-orange: #FF9500;         /* Warning/attention */
  --nordic-red: #FF3B30;            /* Error/destructive */
  --nordic-purple: #AF52DE;         /* Special highlights */
  
  /* Nordic Semantic Colors */
  --nordic-background: var(--nordic-white);
  --nordic-surface: var(--nordic-white);
  --nordic-card: var(--nordic-white);
  --nordic-border: var(--nordic-gray-200);
  --nordic-text-primary: var(--nordic-gray-900);
  --nordic-text-secondary: var(--nordic-gray-600);
  --nordic-text-muted: var(--nordic-gray-500);
}
```

#### Dark Mode (Nordic)
```css
:root[data-theme="dark"] {
  /* Nordic Primary Colors - Dark */
  --nordic-primary: #0A84FF;        /* Brighter blue for dark mode */
  --nordic-primary-hover: #409CFF;  /* Lighter blue for hover */
  --nordic-primary-light: #1A1A1E;  /* Dark blue backgrounds */
  
  /* Nordic Neutrals - Dark */
  --nordic-white: #000000;          /* True black for OLED */
  --nordic-gray-50: #1C1C1E;        /* Dark background */
  --nordic-gray-100: #2C2C2E;       /* Card backgrounds */
  --nordic-gray-200: #3A3A3C;       /* Subtle borders */
  --nordic-gray-300: #48484A;       /* Medium borders */
  --nordic-gray-400: #636366;       /* Disabled text */
  --nordic-gray-500: #8E8E93;       /* Secondary text */
  --nordic-gray-600: #AEAEB2;       /* Body text */
  --nordic-gray-900: #F2F2F7;       /* Primary text */
  
  /* Nordic Accent Colors - Dark */
  --nordic-green: #32D74B;          /* Success/positive */
  --nordic-orange: #FF9F0A;         /* Warning/attention */
  --nordic-red: #FF453A;            /* Error/destructive */
  --nordic-purple: #BF5AF2;         /* Special highlights */
  
  /* Nordic Semantic Colors - Dark */
  --nordic-background: var(--nordic-gray-50);
  --nordic-surface: var(--nordic-gray-100);
  --nordic-card: var(--nordic-gray-100);
  --nordic-border: var(--nordic-gray-200);
  --nordic-text-primary: var(--nordic-gray-900);
  --nordic-text-secondary: var(--nordic-gray-600);
  --nordic-text-muted: var(--nordic-gray-500);
}
```

### Nordic Typography

#### Font Stack (Apple-Inspired)
```css
/* Primary font stack with SF Pro Display fallback */
--nordic-font-display: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--nordic-font-text: 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--nordic-font-mono: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;

/* Alternative with Inter for cross-platform consistency */
--nordic-font-display-alt: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--nordic-font-text-alt: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

#### Nordic Type Scale
```css
/* Display Typography */
--nordic-text-display-large: 3.5rem;    /* 56px - Hero headings */
--nordic-text-display: 3rem;            /* 48px - Page headings */
--nordic-text-display-small: 2.25rem;   /* 36px - Section headings */

/* Heading Typography */
--nordic-text-h1: 2rem;                 /* 32px - Main headings */
--nordic-text-h2: 1.5rem;               /* 24px - Sub headings */
--nordic-text-h3: 1.25rem;              /* 20px - Small headings */
--nordic-text-h4: 1.125rem;             /* 18px - Card headings */

/* Body Typography */
--nordic-text-large: 1.125rem;          /* 18px - Large body text */
--nordic-text-base: 1rem;               /* 16px - Standard body */
--nordic-text-small: 0.875rem;          /* 14px - Small text */
--nordic-text-caption: 0.75rem;         /* 12px - Captions */

/* Line Heights */
--nordic-leading-tight: 1.25;           /* 1.25 - Headings */
--nordic-leading-normal: 1.5;           /* 1.5 - Body text */
--nordic-leading-relaxed: 1.75;         /* 1.75 - Large text */

/* Font Weights */
--nordic-weight-regular: 400;           /* Regular text */
--nordic-weight-medium: 500;            /* Medium emphasis */
--nordic-weight-semibold: 600;          /* Semi-bold */
--nordic-weight-bold: 700;              /* Bold headings */
```

### Nordic Component Patterns

#### Chat Widget (Nordic Style)
```css
.nordic-chat-widget {
  background: var(--nordic-surface);
  border: 1px solid var(--nordic-border);
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  backdrop-filter: blur(20px);
}

.nordic-chat-header {
  background: var(--nordic-gray-50);
  border-bottom: 1px solid var(--nordic-border);
  padding: 16px 20px;
  border-radius: 16px 16px 0 0;
}

.nordic-chat-message {
  padding: 12px 16px;
  margin: 8px 0;
  border-radius: 18px;
  max-width: 280px;
}

.nordic-chat-message--user {
  background: var(--nordic-primary);
  color: white;
  margin-left: auto;
}

.nordic-chat-message--agent {
  background: var(--nordic-gray-100);
  color: var(--nordic-text-primary);
}
```

#### Customer Dashboard Cards (Nordic)
```css
.nordic-dashboard-card {
  background: var(--nordic-surface);
  border: 1px solid var(--nordic-border);
  border-radius: 12px;
  padding: 24px;
  transition: all 0.2s ease;
}

.nordic-dashboard-card:hover {
  border-color: var(--nordic-primary-light);
  box-shadow: 0 4px 20px rgba(0, 122, 255, 0.1);
  transform: translateY(-2px);
}

.nordic-stats-card {
  background: var(--nordic-surface);
  border: 1px solid var(--nordic-border);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
}

.nordic-stats-value {
  font-size: var(--nordic-text-display-small);
  font-weight: var(--nordic-weight-bold);
  color: var(--nordic-text-primary);
  margin-bottom: 4px;
}

.nordic-stats-label {
  font-size: var(--nordic-text-small);
  color: var(--nordic-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
```

#### Glass Morphism Effects
```css
.nordic-glass {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.nordic-glass--dark {
  background: rgba(28, 28, 30, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

/* Kanban card glass effect */
.nordic-kanban-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(229, 229, 234, 0.6);
  border-radius: 12px;
  padding: 16px;
  transition: all 0.3s ease;
}

.nordic-kanban-card:hover {
  background: rgba(255, 255, 255, 0.95);
  border-color: var(--nordic-primary-light);
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 122, 255, 0.15);
}
```

#### Nordic Buttons
```css
/* Primary Nordic Button */
.nordic-button-primary {
  background: var(--nordic-primary);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: var(--nordic-text-base);
  font-weight: var(--nordic-weight-medium);
  font-family: var(--nordic-font-text);
  transition: all 0.2s ease;
  cursor: pointer;
}

.nordic-button-primary:hover {
  background: var(--nordic-primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
}

.nordic-button-primary:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.2);
}

/* Secondary Nordic Button */
.nordic-button-secondary {
  background: var(--nordic-surface);
  color: var(--nordic-primary);
  border: 1px solid var(--nordic-border);
  border-radius: 8px;
  padding: 12px 24px;
  font-size: var(--nordic-text-base);
  font-weight: var(--nordic-weight-medium);
  transition: all 0.2s ease;
  cursor: pointer;
}

.nordic-button-secondary:hover {
  background: var(--nordic-primary-light);
  border-color: var(--nordic-primary);
  transform: translateY(-1px);
}

/* Ghost Nordic Button */
.nordic-button-ghost {
  background: transparent;
  color: var(--nordic-text-secondary);
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: var(--nordic-text-base);
  font-weight: var(--nordic-weight-medium);
  transition: all 0.2s ease;
  cursor: pointer;
}

.nordic-button-ghost:hover {
  background: var(--nordic-gray-100);
  color: var(--nordic-text-primary);
}
```

#### Nordic Form Components
```css
/* Nordic Input Fields */
.nordic-input {
  background: var(--nordic-surface);
  border: 1px solid var(--nordic-border);
  border-radius: 8px;
  padding: 12px 16px;
  font-size: var(--nordic-text-base);
  font-family: var(--nordic-font-text);
  color: var(--nordic-text-primary);
  transition: all 0.2s ease;
  width: 100%;
}

.nordic-input:focus {
  outline: none;
  border-color: var(--nordic-primary);
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

.nordic-input::placeholder {
  color: var(--nordic-text-muted);
}

/* Nordic Select */
.nordic-select {
  background: var(--nordic-surface);
  border: 1px solid var(--nordic-border);
  border-radius: 8px;
  padding: 12px 16px;
  font-size: var(--nordic-text-base);
  color: var(--nordic-text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.nordic-select:focus {
  outline: none;
  border-color: var(--nordic-primary);
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

/* Nordic Checkbox */
.nordic-checkbox {
  appearance: none;
  width: 20px;
  height: 20px;
  border: 2px solid var(--nordic-border);
  border-radius: 4px;
  background: var(--nordic-surface);
  cursor: pointer;
  transition: all 0.2s ease;
}

.nordic-checkbox:checked {
  background: var(--nordic-primary);
  border-color: var(--nordic-primary);
}

.nordic-checkbox:checked::after {
  content: '✓';
  color: white;
  font-size: 14px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}
```

#### Nordic Data Recovery Page Styles
```css
/* Hero Section Nordic */
.nordic-hero {
  background: var(--nordic-background);
  padding: 80px 0;
  text-align: center;
}

.nordic-hero-title {
  font-size: var(--nordic-text-display);
  font-weight: var(--nordic-weight-bold);
  color: var(--nordic-text-primary);
  font-family: var(--nordic-font-display);
  line-height: var(--nordic-leading-tight);
  margin-bottom: 24px;
  letter-spacing: -0.02em;
}

.nordic-hero-subtitle {
  font-size: var(--nordic-text-large);
  color: var(--nordic-text-secondary);
  line-height: var(--nordic-leading-normal);
  margin-bottom: 48px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.nordic-hero-icon {
  width: 96px;
  height: 96px;
  background: var(--nordic-gray-50);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 32px;
  border: 1px solid var(--nordic-border);
}

/* Service Cards Nordic */
.nordic-service-card {
  background: var(--nordic-surface);
  border: 1px solid var(--nordic-border);
  border-radius: 16px;
  padding: 32px;
  transition: all 0.3s ease;
  height: 100%;
}

.nordic-service-card:hover {
  border-color: var(--nordic-primary-light);
  box-shadow: 0 8px 32px rgba(0, 122, 255, 0.08);
  transform: translateY(-4px);
}

.nordic-service-icon {
  width: 64px;
  height: 64px;
  background: var(--nordic-primary-light);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  color: var(--nordic-primary);
}

.nordic-service-title {
  font-size: var(--nordic-text-h3);
  font-weight: var(--nordic-weight-semibold);
  color: var(--nordic-text-primary);
  margin-bottom: 12px;
}

.nordic-service-description {
  font-size: var(--nordic-text-base);
  color: var(--nordic-text-secondary);
  line-height: var(--nordic-leading-normal);
  margin-bottom: 20px;
}

/* Success Rate Badge */
.nordic-success-badge {
  background: var(--nordic-green);
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: var(--nordic-text-small);
  font-weight: var(--nordic-weight-medium);
  display: inline-block;
}
```

## Typography System

### Font Stack
```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-mono: 'Fira Code', 'Consolas', monospace;
```

### Type Scale
```css
/* Headings */
--text-xs: 0.75rem;      /* 12px */
--text-sm: 0.875rem;     /* 14px */
--text-base: 1rem;       /* 16px */
--text-lg: 1.125rem;     /* 18px */
--text-xl: 1.25rem;      /* 20px */
--text-2xl: 1.5rem;      /* 24px */
--text-3xl: 1.875rem;    /* 30px */
--text-4xl: 2.25rem;     /* 36px */
--text-5xl: 3rem;        /* 48px */

/* Line Heights */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

## Spacing System

### Base Unit: 4px
```css
--space-0: 0;
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
```

## Component Design Specifications

### 1. Navigation Components

#### Floating Navigation Menu
```css
.floating-nav {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  padding: 8px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

/* Mobile: Full width bottom bar */
@media (max-width: 768px) {
  .floating-nav {
    bottom: 0;
    left: 0;
    right: 0;
    transform: none;
    border-radius: 0;
  }
}
```

**Features**:
- Appears after scroll
- Smooth fade-in animation
- Active state indicators
- Touch-friendly targets (44px minimum)

#### Header
- **Height**: 64px desktop, 56px mobile
- **Background**: Blur effect with transparency
- **Elements**: Logo, main nav, dark mode toggle, login button
- **Mobile**: Hamburger menu with slide-out drawer

### 2. Booking Flow Components

#### Device Selection Grid
```
Desktop: 4 columns
Tablet: 3 columns
Mobile: 2 columns

Card dimensions:
- Min height: 160px
- Padding: 24px
- Border radius: 12px
- Hover scale: 1.02
- Shadow on hover
```

#### Model Selection
- **Layout**: List view with search/filter sidebar
- **Card Height**: 120px with device image
- **Information**: Model name, year, key specs
- **Interaction**: Click to select, checkbox indicator

#### Progress Indicator
```
Desktop: Horizontal stepper
Mobile: Minimal dots

Step states:
- Completed: Primary color with checkmark
- Current: Primary color with number
- Upcoming: Gray with number
```

### 3. Form Components

#### Input Fields
```css
.input {
  height: 48px;
  padding: 0 16px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 16px; /* Prevents zoom on iOS */
  transition: all 0.2s;
}

.input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}
```

#### Buttons
```css
/* Primary Button */
.btn-primary {
  height: 48px;
  padding: 0 24px;
  background: var(--primary);
  color: white;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.2s;
}

/* Size Variants */
.btn-sm { height: 36px; padding: 0 16px; }
.btn-lg { height: 56px; padding: 0 32px; }
```

### 4. Card Components

#### Repair Service Card
```
Structure:
┌─────────────────────────┐
│ [Icon]                  │
│ Service Name            │
│ Brief Description       │
│ Price Range            │
│ • Feature 1            │
│ • Feature 2            │
│ [Book Now →]           │
└─────────────────────────┘

Dimensions:
- Width: 100%
- Max-width: 320px
- Padding: 24px
- Border: 1px solid var(--border)
- Hover: Lift shadow + border color
```

### 5. Admin Dashboard Components

#### Repair Queue Kanban
```
Columns:
- Pending (Yellow header)
- In Progress (Blue header)
- Ready (Green header)
- Completed (Gray header)

Card Features:
- Device image thumbnail
- Customer name
- Repair type
- Priority indicator
- Time tracking
- Assignee avatar
```

## Responsive Design

### Breakpoints
```css
--mobile: 320px;
--mobile-lg: 425px;
--tablet: 768px;
--desktop: 1024px;
--desktop-lg: 1440px;
```

### Mobile-First Approach
1. Design for mobile (320px) first
2. Enhance for larger screens
3. Touch targets minimum 44x44px
4. Thumb-friendly navigation zones
5. Swipe gestures for carousels

### Layout Patterns

#### Mobile (320-767px)
- Single column layouts
- Full-width components
- Stacked navigation
- Bottom sheet modals
- Simplified tables → cards

#### Tablet (768-1023px)
- 2-column layouts where appropriate
- Side-by-side comparisons
- Floating action buttons
- Modal dialogs

#### Desktop (1024px+)
- Multi-column layouts
- Sidebar navigation
- Hover interactions
- Keyboard shortcuts
- Advanced filtering

## Accessibility Standards

### WCAG 2.1 AA Compliance

#### Color Contrast
- Normal text: 4.5:1 minimum
- Large text: 3:1 minimum
- Interactive elements: 3:1 minimum
- Focus indicators: 3:1 minimum

#### Keyboard Navigation
- All interactive elements accessible via keyboard
- Visible focus indicators
- Logical tab order
- Skip links for navigation
- Escape key closes modals

#### Screen Reader Support
- Semantic HTML structure
- ARIA labels where needed
- Alt text for all images
- Form labels and descriptions
- Error messages linked to inputs

#### Motion & Animations
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## User Flows

### 1. Repair Booking Flow
```
Homepage → Select Device → Choose Model → Select Repair Type → 
Enter Details → Review & Confirm → Receive Confirmation
```

**Key UX Considerations**:
- Progress always visible
- Back navigation available
- Form data persisted
- Clear pricing at each step
- Multiple entry points

### 2. Customer Portal Flow
```
Login → Dashboard → View Repairs → Track Status → 
Download Invoice → Leave Review
```

**Features**:
- Quick status overview
- Real-time updates
- Easy communication
- Document access
- Review prompts

### 3. Admin Workflow
```
Login → Dashboard → View Queue → Assign Repair → 
Update Status → Add Notes → Complete Repair → 
Generate Invoice
```

**Optimizations**:
- Bulk actions
- Keyboard shortcuts
- Quick filters
- Drag-and-drop
- Auto-save

## Interaction Patterns

### Micro-interactions
1. **Button States**: Hover, active, disabled
2. **Form Validation**: Real-time with debouncing
3. **Loading States**: Skeleton screens, spinners
4. **Success Feedback**: Toast notifications, confetti
5. **Error Handling**: Inline messages, recovery options

### Animations
```css
/* Standard timing functions */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-out: cubic-bezier(0.0, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);

/* Standard durations */
--duration-fast: 150ms;
--duration-base: 300ms;
--duration-slow: 500ms;
```

### Touch Gestures
- **Swipe**: Navigate between booking steps
- **Pull to refresh**: Update repair status
- **Long press**: Show context menu
- **Pinch to zoom**: Device images

## Performance Guidelines

### Loading Performance
- First Contentful Paint: < 1.8s
- Largest Contentful Paint: < 2.5s
- Total Blocking Time: < 300ms
- Cumulative Layout Shift: < 0.1

### Image Optimization
- Lazy load below the fold
- Responsive images with srcset
- WebP format with fallbacks
- Blur-up placeholder technique

### Code Splitting
- Route-based splitting
- Component lazy loading
- Dynamic imports for modals
- Prefetch critical routes

## Design Tokens

### Shadows
```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1);
```

### Border Radius
```css
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
--radius-full: 9999px;
```

### Z-Index Scale
```css
--z-dropdown: 1000;
--z-sticky: 1020;
--z-fixed: 1030;
--z-modal-backdrop: 1040;
--z-modal: 1050;
--z-popover: 1060;
--z-tooltip: 1070;
```

## Component Library Integration

### shadcn/ui Customization
- Custom color palette
- Consistent sizing
- Accessibility enhancements
- Dark mode support
- Animation preferences

### Custom Components
1. **DeviceCard**: Product selection
2. **RepairStatus**: Visual status indicator
3. **PriceDisplay**: Dynamic pricing
4. **BookingCalendar**: Appointment selection
5. **CustomerReview**: Rating display

## Testing & Validation

### Design Review Checklist
- [ ] Color contrast passes WCAG AA
- [ ] Touch targets ≥ 44px
- [ ] Text readable at 200% zoom
- [ ] Works without JavaScript
- [ ] Keyboard navigation complete
- [ ] Screen reader tested
- [ ] Cross-browser verified
- [ ] Performance budgets met

### User Testing Priorities
1. Booking flow completion rate
2. Time to book appointment
3. Error recovery success
4. Mobile usability
5. Accessibility compliance