# RevivaTech Design System V2.0 - Modern Premium Framework
*Complete design system for the RevivaTech platform redesign*

**Linked to**: [PRD_04_Design_Overhaul.md](./PRD_04_Design_Overhaul.md)  
**Implementation**: [Component_Library_V2.md](./Component_Library_V2.md)

---

## 🎨 Philosophy & Brand Identity

### Design Principles

**"Trustworthy Technology"** - Our design creates confidence through clarity, warmth through humanity, and innovation through modern interactions.

```typescript
const DESIGN_PHILOSOPHY = {
  core: "Trustworthy Technology",
  personality: "Your friendly tech expert",
  emotions: ["warmth", "confidence", "innovation", "reliability"],
  differentiator: "Premium service that feels personal",
  
  principles: [
    "Clarity over cleverness",
    "Warmth over coldness", 
    "Progress over perfection",
    "Accessibility first",
    "Performance always"
  ]
};
```

### Brand Personality Matrix

```scss
// From Nordic Minimalism to Tech Premium
$brand-evolution: (
  // Previous: Nordic Minimalism
  from: (
    personality: "cold, corporate, sterile",
    colors: "monochrome, bland, safe",
    interactions: "static, basic, uninspiring"
  ),
  
  // New: Tech Premium
  to: (
    personality: "warm, personal, trustworthy",
    colors: "vibrant, confident, modern", 
    interactions: "delightful, smooth, engaging"
  )
);
```

---

## 🌈 Color System

### Primary Color Palette

```scss
// Hero Gradients - Primary Brand Expression
$hero-gradients: (
  primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%),
  secondary: linear-gradient(135deg, #f093fb 0%, #f5576c 100%),
  success: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%),
  warm: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)
);

// Core Brand Colors
$colors: (
  // Primary Brand Colors
  primary: (
    50: #eef2ff,
    100: #e0e7ff,
    200: #c7d2fe,
    300: #a5b4fc,
    400: #818cf8,
    500: #6366f1,  // Main Brand
    600: #4f46e5,
    700: #4338ca,
    800: #3730a3,
    900: #312e81,
    950: #1e1b4b
  ),
  
  // Secondary - Innovation
  secondary: (
    50: #faf5ff,
    100: #f3e8ff,
    200: #e9d5ff,
    300: #d8b4fe,
    400: #c084fc,
    500: #8b5cf6,  // Secondary Brand
    600: #7c3aed,
    700: #6d28d9,
    800: #5b21b6,
    900: #4c1d95,
    950: #2e1065
  ),
  
  // Accent - Energy & Friendliness
  accent: (
    50: #fdf2f8,
    100: #fce7f3,
    200: #fbcfe8,
    300: #f9a8d4,
    400: #f472b6,
    500: #ec4899,  // Accent Brand
    600: #db2777,
    700: #be185d,
    800: #9d174d,
    900: #831843,
    950: #500724
  ),
  
  // Success - Completed Repairs
  success: (
    50: #ecfdf5,
    100: #d1fae5,
    200: #a7f3d0,
    300: #6ee7b7,
    400: #34d399,
    500: #10b981,  // Success
    600: #059669,
    700: #047857,
    800: #065f46,
    900: #064e3b,
    950: #022c22
  ),
  
  // Warning - In Progress
  warning: (
    50: #fffbeb,
    100: #fef3c7,
    200: #fde68a,
    300: #fcd34d,
    400: #fbbf24,
    500: #f59e0b,  // Warning
    600: #d97706,
    700: #b45309,
    800: #92400e,
    900: #78350f,
    950: #451a03
  ),
  
  // Danger - Urgent Issues
  danger: (
    50: #fef2f2,
    100: #fee2e2,
    200: #fecaca,
    300: #fca5a5,
    400: #f87171,
    500: #ef4444,  // Danger
    600: #dc2626,
    700: #b91c1c,
    800: #991b1b,
    900: #7f1d1d,
    950: #450a0a
  ),
  
  // Info - General Information
  info: (
    50: #eff6ff,
    100: #dbeafe,
    200: #bfdbfe,
    300: #93c5fd,
    400: #60a5fa,
    500: #3b82f6,  // Info
    600: #2563eb,
    700: #1d4ed8,
    800: #1e40af,
    900: #1e3a8a,
    950: #172554
  )
);

// Neutral Palette - Warm Grays
$neutral: (
  white: #ffffff,
  50: #fafaf9,
  100: #f5f5f4,
  200: #e7e5e4,
  300: #d6d3d1,
  400: #a8a29e,
  500: #78716c,
  600: #57534e,
  700: #44403c,
  800: #292524,
  900: #1c1917,
  950: #0c0a09,
  black: #000000
);

// Dark Mode Specific Colors
$dark-mode: (
  surface: #1e1b29,      // Main dark surface
  elevated: #2d2a3a,     // Elevated components
  accent: #3b384c,       // Accent elements
  border: #44404f,       // Borders in dark mode
  text: #f8fafc,         // Primary text
  text-muted: #cbd5e1    // Secondary text
);
```

### Color Usage Guidelines

```scss
// Usage Patterns
$color-usage: (
  // Backgrounds
  backgrounds: (
    primary: var(--neutral-white),
    secondary: var(--neutral-50),
    elevated: var(--neutral-100),
    overlay: rgba(var(--neutral-900), 0.8),
    glass: rgba(var(--neutral-white), 0.8)
  ),
  
  // Text Colors
  text: (
    primary: var(--neutral-900),
    secondary: var(--neutral-600),
    muted: var(--neutral-500),
    inverse: var(--neutral-white),
    link: var(--primary-600),
    link-hover: var(--primary-700)
  ),
  
  // Interactive Elements
  interactive: (
    primary: var(--primary-500),
    primary-hover: var(--primary-600),
    secondary: var(--secondary-500),
    secondary-hover: var(--secondary-600),
    accent: var(--accent-500),
    accent-hover: var(--accent-600)
  ),
  
  // Status Colors
  status: (
    success: var(--success-500),
    success-bg: var(--success-50),
    warning: var(--warning-500),
    warning-bg: var(--warning-50),
    danger: var(--danger-500),
    danger-bg: var(--danger-50),
    info: var(--info-500),
    info-bg: var(--info-50)
  )
);
```

---

## 📝 Typography System

### Font Stack

```scss
// Font Families
$fonts: (
  // Display Font - Headlines & Branding
  display: (
    family: "'Clash Display', 'SF Pro Display', system-ui, sans-serif",
    weights: (300, 400, 500, 600, 700),
    features: "'ss01', 'ss02'", // Stylistic alternates
    fallback: "system-ui, sans-serif"
  ),
  
  // Body Font - Content & UI
  body: (
    family: "'Inter', 'SF Pro Text', system-ui, sans-serif",
    weights: (400, 500, 600, 700),
    features: "'cv11'", // Single-story 'a'
    fallback: "system-ui, sans-serif"
  ),
  
  // Mono Font - Technical Content
  mono: (
    family: "'JetBrains Mono', 'SF Mono', 'Consolas', monospace",
    weights: (400, 500, 600),
    features: "'liga'", // Programming ligatures
    fallback: "monospace"
  )
);

// Typography Scale - Perfect Fourth (1.333)
$typography-scale: (
  xs: 0.75rem,    // 12px
  sm: 0.875rem,   // 14px  
  base: 1rem,     // 16px - Base size
  lg: 1.125rem,   // 18px
  xl: 1.25rem,    // 20px
  2xl: 1.5rem,    // 24px
  3xl: 1.875rem,  // 30px
  4xl: 2.25rem,   // 36px
  5xl: 3rem,      // 48px
  6xl: 3.75rem,   // 60px
  7xl: 4.5rem,    // 72px
  8xl: 6rem,      // 96px
  9xl: 8rem       // 128px
);

// Line Heights
$line-heights: (
  none: 1,
  tight: 1.25,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
  loose: 2
);

// Letter Spacing
$letter-spacing: (
  tighter: -0.05em,
  tight: -0.025em,
  normal: 0,
  wide: 0.025em,
  wider: 0.05em,
  widest: 0.1em
);
```

### Typography Tokens

```scss
// Semantic Typography Tokens
$typography-tokens: (
  // Display Text
  display-xl: (
    font-family: var(--font-display),
    font-size: var(--text-7xl),
    line-height: var(--leading-tight),
    letter-spacing: var(--tracking-tight),
    font-weight: 700
  ),
  
  display-lg: (
    font-family: var(--font-display),
    font-size: var(--text-6xl),
    line-height: var(--leading-tight),
    letter-spacing: var(--tracking-tight),
    font-weight: 600
  ),
  
  display-md: (
    font-family: var(--font-display),
    font-size: var(--text-5xl),
    line-height: var(--leading-tight),
    letter-spacing: var(--tracking-normal),
    font-weight: 600
  ),
  
  display-sm: (
    font-family: var(--font-display),
    font-size: var(--text-4xl),
    line-height: var(--leading-tight),
    letter-spacing: var(--tracking-normal),
    font-weight: 600
  ),
  
  // Headings
  heading-xl: (
    font-family: var(--font-display),
    font-size: var(--text-3xl),
    line-height: var(--leading-snug),
    letter-spacing: var(--tracking-normal),
    font-weight: 600
  ),
  
  heading-lg: (
    font-family: var(--font-display),
    font-size: var(--text-2xl),
    line-height: var(--leading-snug),
    letter-spacing: var(--tracking-normal),
    font-weight: 600
  ),
  
  heading-md: (
    font-family: var(--font-display),
    font-size: var(--text-xl),
    line-height: var(--leading-snug),
    letter-spacing: var(--tracking-normal),
    font-weight: 600
  ),
  
  heading-sm: (
    font-family: var(--font-display),
    font-size: var(--text-lg),
    line-height: var(--leading-snug),
    letter-spacing: var(--tracking-normal),
    font-weight: 600
  ),
  
  // Body Text
  body-xl: (
    font-family: var(--font-body),
    font-size: var(--text-xl),
    line-height: var(--leading-relaxed),
    letter-spacing: var(--tracking-normal),
    font-weight: 400
  ),
  
  body-lg: (
    font-family: var(--font-body),
    font-size: var(--text-lg),
    line-height: var(--leading-relaxed),
    letter-spacing: var(--tracking-normal),
    font-weight: 400
  ),
  
  body-base: (
    font-family: var(--font-body),
    font-size: var(--text-base),
    line-height: var(--leading-normal),
    letter-spacing: var(--tracking-normal),
    font-weight: 400
  ),
  
  body-sm: (
    font-family: var(--font-body),
    font-size: var(--text-sm),
    line-height: var(--leading-normal),
    letter-spacing: var(--tracking-normal),
    font-weight: 400
  ),
  
  body-xs: (
    font-family: var(--font-body),
    font-size: var(--text-xs),
    line-height: var(--leading-normal),
    letter-spacing: var(--tracking-wide),
    font-weight: 400
  ),
  
  // Labels & UI Text
  label-lg: (
    font-family: var(--font-body),
    font-size: var(--text-base),
    line-height: var(--leading-snug),
    letter-spacing: var(--tracking-normal),
    font-weight: 500
  ),
  
  label-md: (
    font-family: var(--font-body),
    font-size: var(--text-sm),
    line-height: var(--leading-snug),
    letter-spacing: var(--tracking-normal),
    font-weight: 500
  ),
  
  label-sm: (
    font-family: var(--font-body),
    font-size: var(--text-xs),
    line-height: var(--leading-snug),
    letter-spacing: var(--tracking-wide),
    font-weight: 500
  ),
  
  // Code & Technical
  code: (
    font-family: var(--font-mono),
    font-size: var(--text-sm),
    line-height: var(--leading-snug),
    letter-spacing: var(--tracking-normal),
    font-weight: 400
  )
);
```

---

## 📐 Spacing & Layout

### Spacing Scale

```scss
// Base Unit: 4px
$spacing-base: 4px;

// Spacing Scale (8-point grid system)
$spacing: (
  0: 0,
  px: 1px,
  0.5: calc(var(--spacing-base) * 0.5),  // 2px
  1: calc(var(--spacing-base) * 1),      // 4px
  1.5: calc(var(--spacing-base) * 1.5),  // 6px
  2: calc(var(--spacing-base) * 2),      // 8px
  2.5: calc(var(--spacing-base) * 2.5),  // 10px
  3: calc(var(--spacing-base) * 3),      // 12px
  3.5: calc(var(--spacing-base) * 3.5),  // 14px
  4: calc(var(--spacing-base) * 4),      // 16px
  5: calc(var(--spacing-base) * 5),      // 20px
  6: calc(var(--spacing-base) * 6),      // 24px
  7: calc(var(--spacing-base) * 7),      // 28px
  8: calc(var(--spacing-base) * 8),      // 32px
  9: calc(var(--spacing-base) * 9),      // 36px
  10: calc(var(--spacing-base) * 10),    // 40px
  11: calc(var(--spacing-base) * 11),    // 44px
  12: calc(var(--spacing-base) * 12),    // 48px
  14: calc(var(--spacing-base) * 14),    // 56px
  16: calc(var(--spacing-base) * 16),    // 64px
  20: calc(var(--spacing-base) * 20),    // 80px
  24: calc(var(--spacing-base) * 24),    // 96px
  28: calc(var(--spacing-base) * 28),    // 112px
  32: calc(var(--spacing-base) * 32),    // 128px
  36: calc(var(--spacing-base) * 36),    // 144px
  40: calc(var(--spacing-base) * 40),    // 160px
  44: calc(var(--spacing-base) * 44),    // 176px
  48: calc(var(--spacing-base) * 48),    // 192px
  52: calc(var(--spacing-base) * 52),    // 208px
  56: calc(var(--spacing-base) * 56),    // 224px
  60: calc(var(--spacing-base) * 60),    // 240px
  64: calc(var(--spacing-base) * 64),    // 256px
  72: calc(var(--spacing-base) * 72),    // 288px
  80: calc(var(--spacing-base) * 80),    // 320px
  96: calc(var(--spacing-base) * 96)     // 384px
);

// Semantic Spacing Tokens
$semantic-spacing: (
  // Component Internal Spacing
  component-sm: var(--spacing-2),    // 8px
  component-md: var(--spacing-4),    // 16px
  component-lg: var(--spacing-6),    // 24px
  component-xl: var(--spacing-8),    // 32px
  
  // Section Spacing
  section-sm: var(--spacing-12),     // 48px
  section-md: var(--spacing-16),     // 64px
  section-lg: var(--spacing-24),     // 96px
  section-xl: var(--spacing-32),     // 128px
  
  // Layout Spacing
  layout-sm: var(--spacing-4),       // 16px
  layout-md: var(--spacing-6),       // 24px
  layout-lg: var(--spacing-8),       // 32px
  layout-xl: var(--spacing-12)       // 48px
);
```

### Container System

```scss
// Container Widths
$containers: (
  xs: 20rem,      // 320px
  sm: 24rem,      // 384px  
  md: 28rem,      // 448px
  lg: 32rem,      // 512px
  xl: 36rem,      // 576px
  2xl: 42rem,     // 672px
  3xl: 48rem,     // 768px
  4xl: 56rem,     // 896px
  5xl: 64rem,     // 1024px
  6xl: 72rem,     // 1152px
  7xl: 80rem,     // 1280px
  screen-sm: 640px,
  screen-md: 768px,
  screen-lg: 1024px,
  screen-xl: 1280px,
  screen-2xl: 1536px,
  full: 100%
);

// Grid System
$grid: (
  columns: 12,
  gap: var(--spacing-6),
  gap-sm: var(--spacing-4),
  gap-lg: var(--spacing-8)
);
```

### Breakpoints

```scss
$breakpoints: (
  xs: 0,
  sm: 640px,
  md: 768px,
  lg: 1024px,
  xl: 1280px,
  2xl: 1536px
);

// Usage in media queries
@mixin respond-to($breakpoint) {
  @media (min-width: map-get($breakpoints, $breakpoint)) {
    @content;
  }
}
```

---

## 🎭 Shadows & Elevation

### Shadow System

```scss
// Base Shadows
$shadows: (
  none: 'none',
  
  // Subtle Shadows
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  
  // Standard Shadows  
  base: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  
  // Prominent Shadows
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  2xl: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  
  // Colored Shadows for Brand Elements
  primary: '0 20px 25px -5px rgb(99 102 241 / 0.25), 0 8px 10px -6px rgb(99 102 241 / 0.1)',
  secondary: '0 20px 25px -5px rgb(139 92 246 / 0.25), 0 8px 10px -6px rgb(139 92 246 / 0.1)',
  accent: '0 20px 25px -5px rgb(236 72 153 / 0.25), 0 8px 10px -6px rgb(236 72 153 / 0.1)',
  
  // Success/Error Shadows
  success: '0 20px 25px -5px rgb(16 185 129 / 0.25), 0 8px 10px -6px rgb(16 185 129 / 0.1)',
  danger: '0 20px 25px -5px rgb(239 68 68 / 0.25), 0 8px 10px -6px rgb(239 68 68 / 0.1)',
  
  // Inner Shadows
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  inner-lg: 'inset 0 4px 8px 0 rgb(0 0 0 / 0.1)'
);

// Elevation System (Material Design inspired)
$elevation: (
  0: var(--shadow-none),
  1: var(--shadow-sm),      // Cards at rest
  2: var(--shadow-base),    // Raised cards  
  3: var(--shadow-lg),      // Modals, dropdowns
  4: var(--shadow-xl),      // Navigation, app bars
  5: var(--shadow-2xl)      // Floating action buttons
);
```

### Glow Effects

```scss
// Glow Effects for Interactive Elements
$glows: (
  primary: '0 0 20px rgb(99 102 241 / 0.3)',
  secondary: '0 0 20px rgb(139 92 246 / 0.3)',
  accent: '0 0 20px rgb(236 72 153 / 0.3)',
  success: '0 0 20px rgb(16 185 129 / 0.3)',
  warning: '0 0 20px rgb(245 158 11 / 0.3)',
  danger: '0 0 20px rgb(239 68 68 / 0.3)'
);
```

---

## 🔄 Border Radius & Effects

### Border Radius Scale

```scss
$radius: (
  none: 0,
  xs: 0.125rem,    // 2px
  sm: 0.25rem,     // 4px
  base: 0.375rem,  // 6px - Default
  md: 0.5rem,      // 8px
  lg: 0.75rem,     // 12px
  xl: 1rem,        // 16px
  2xl: 1.25rem,    // 20px
  3xl: 1.5rem,     // 24px
  4xl: 2rem,       // 32px
  full: 9999px     // Fully rounded
);

// Semantic Radius Tokens
$semantic-radius: (
  button: var(--radius-lg),
  card: var(--radius-xl),
  input: var(--radius-lg),
  badge: var(--radius-full),
  avatar: var(--radius-full),
  modal: var(--radius-2xl),
  tooltip: var(--radius-md)
);
```

### Glassmorphism & Blur Effects

```scss
// Blur Values
$blur: (
  none: 0,
  sm: 4px,
  base: 8px,
  md: 12px,
  lg: 16px,
  xl: 24px,
  2xl: 40px,
  3xl: 64px
);

// Glassmorphism Components
$glass: (
  // Light Glass
  light: (
    background: rgba(255, 255, 255, 0.1),
    backdrop-filter: blur(var(--blur-lg)),
    border: 1px solid rgba(255, 255, 255, 0.2),
    box-shadow: var(--shadow-lg)
  ),
  
  // Dark Glass
  dark: (
    background: rgba(0, 0, 0, 0.1),
    backdrop-filter: blur(var(--blur-lg)),
    border: 1px solid rgba(255, 255, 255, 0.1),
    box-shadow: var(--shadow-lg)
  ),
  
  // Brand Glass
  primary: (
    background: rgba(99, 102, 241, 0.1),
    backdrop-filter: blur(var(--blur-lg)),
    border: 1px solid rgba(99, 102, 241, 0.2),
    box-shadow: var(--shadow-primary)
  )
);
```

---

## ⚡ Animation & Motion

### Timing Functions

```scss
// Easing Curves
$easing: (
  // Standard Curves
  linear: cubic-bezier(0.0, 0.0, 1.0, 1.0),
  ease: cubic-bezier(0.25, 0.1, 0.25, 1.0),
  ease-in: cubic-bezier(0.42, 0.0, 1.0, 1.0),
  ease-out: cubic-bezier(0.0, 0.0, 0.58, 1.0),
  ease-in-out: cubic-bezier(0.42, 0.0, 0.58, 1.0),
  
  // Custom Curves
  bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55),
  elastic: cubic-bezier(0.175, 0.885, 0.32, 1.275),
  back: cubic-bezier(0.175, 0.885, 0.32, 1.275),
  
  // Interface Curves (iOS inspired)
  interface: cubic-bezier(0.4, 0.0, 0.2, 1.0),
  interface-out: cubic-bezier(0.0, 0.0, 0.2, 1.0),
  interface-in: cubic-bezier(0.4, 0.0, 1.0, 1.0)
);

// Duration Scale
$durations: (
  instant: 0ms,
  fast: 150ms,
  base: 200ms,    // Default
  slow: 300ms,
  slower: 500ms,
  slowest: 800ms
);

// Semantic Animation Tokens
$animations: (
  // Micro-interactions
  hover: (
    duration: var(--duration-fast),
    easing: var(--easing-interface-out)
  ),
  
  focus: (
    duration: var(--duration-fast),
    easing: var(--easing-interface-out)
  ),
  
  // Component Transitions
  fade: (
    duration: var(--duration-base),
    easing: var(--easing-interface)
  ),
  
  slide: (
    duration: var(--duration-slow),
    easing: var(--easing-interface)
  ),
  
  scale: (
    duration: var(--duration-base),
    easing: var(--easing-bounce)
  ),
  
  // Page Transitions
  page: (
    duration: var(--duration-slower),
    easing: var(--easing-interface)
  ),
  
  // Loading States
  spin: (
    duration: 1000ms,
    easing: var(--easing-linear),
    iteration: infinite
  ),
  
  pulse: (
    duration: 2000ms,
    easing: var(--easing-ease-in-out),
    iteration: infinite
  )
);
```

### Keyframe Animations

```scss
// Common Keyframe Animations
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes slide-up {
  from { 
    opacity: 0;
    transform: translateY(20px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slide-down {
  from { 
    opacity: 0;
    transform: translateY(-20px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scale-in {
  from { 
    opacity: 0;
    transform: scale(0.9);
  }
  to { 
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes bounce-in {
  0% { 
    opacity: 0;
    transform: scale(0.3);
  }
  50% { 
    opacity: 1;
    transform: scale(1.05);
  }
  70% { 
    transform: scale(0.9);
  }
  100% { 
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes glow {
  0%, 100% { box-shadow: 0 0 5px currentColor; }
  50% { box-shadow: 0 0 20px currentColor; }
}

// Utility Classes
.animate-fade-in { animation: fade-in var(--duration-base) var(--easing-interface); }
.animate-slide-up { animation: slide-up var(--duration-slow) var(--easing-interface); }
.animate-scale-in { animation: scale-in var(--duration-base) var(--easing-bounce); }
.animate-bounce-in { animation: bounce-in var(--duration-slower) var(--easing-bounce); }
.animate-spin { animation: spin var(--duration-slow) var(--easing-linear) infinite; }
.animate-pulse { animation: pulse var(--duration-slower) var(--easing-ease-in-out) infinite; }
.animate-glow { animation: glow var(--duration-slower) var(--easing-ease-in-out) infinite; }
```

---

## 📱 Responsive Design

### Breakpoint Strategy

```scss
// Mobile-First Approach
$responsive-strategy: (
  approach: "mobile-first",
  base: "375px", // iPhone SE/8 width
  optimization: "progressive-enhancement"
);

// Responsive Typography
@mixin responsive-text($mobile, $tablet: null, $desktop: null) {
  font-size: $mobile;
  
  @if $tablet {
    @include respond-to(md) {
      font-size: $tablet;
    }
  }
  
  @if $desktop {
    @include respond-to(lg) {
      font-size: $desktop;
    }
  }
}

// Responsive Spacing
@mixin responsive-spacing($property, $mobile, $tablet: null, $desktop: null) {
  #{$property}: $mobile;
  
  @if $tablet {
    @include respond-to(md) {
      #{$property}: $tablet;
    }
  }
  
  @if $desktop {
    @include respond-to(lg) {
      #{$property}: $desktop;
    }
  }
}
```

### Touch Target Guidelines

```scss
// Minimum Touch Target Sizes
$touch-targets: (
  minimum: 44px,     // iOS Human Interface Guidelines
  comfortable: 48px, // Material Design
  large: 56px       // For accessibility
);

// Touch-Optimized Components
.touch-optimized {
  min-height: var(--touch-comfortable);
  min-width: var(--touch-comfortable);
  
  // Touch Feedback
  &:active {
    transform: scale(0.95);
    transition: transform var(--duration-fast) var(--easing-interface-out);
  }
}
```

---

## 🌗 Dark Mode

### Dark Mode Colors

```scss
// Dark Mode Color Overrides
$dark-mode-colors: (
  // Backgrounds
  background: var(--dark-surface),
  surface: var(--dark-elevated),
  elevated: var(--dark-accent),
  
  // Text
  text-primary: var(--dark-text),
  text-secondary: var(--dark-text-muted),
  
  // Borders
  border: var(--dark-border),
  border-subtle: rgba(255, 255, 255, 0.1),
  
  // Overlays
  overlay: rgba(0, 0, 0, 0.8),
  glass: rgba(0, 0, 0, 0.3)
);

// Dark Mode Implementation
@media (prefers-color-scheme: dark) {
  :root {
    @each $token, $value in $dark-mode-colors {
      --color-#{$token}: #{$value};
    }
  }
}

// Manual Dark Mode Toggle
[data-theme="dark"] {
  @each $token, $value in $dark-mode-colors {
    --color-#{$token}: #{$value};
  }
}
```

---

## ♿ Accessibility

### Accessibility Standards

```scss
// WCAG 2.1 AA Compliance
$accessibility: (
  // Contrast Ratios
  contrast: (
    normal-text: 4.5,    // AA Standard
    large-text: 3,       // AA Standard for 18pt+
    enhanced: 7          // AAA Standard
  ),
  
  // Focus Indicators
  focus: (
    outline-width: 2px,
    outline-style: solid,
    outline-color: var(--primary-500),
    outline-offset: 2px
  ),
  
  // Motion Preferences
  motion: (
    respect-reduced-motion: true,
    default-duration: var(--duration-base),
    reduced-duration: var(--duration-instant)
  )
);

// Reduced Motion Support
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: var(--duration-instant) !important;
    animation-iteration-count: 1 !important;
    transition-duration: var(--duration-instant) !important;
  }
}

// Focus Visible Styles
.focus-visible {
  outline: var(--focus-outline-width) var(--focus-outline-style) var(--focus-outline-color);
  outline-offset: var(--focus-outline-offset);
}
```

### Screen Reader Support

```scss
// Screen Reader Only Content
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.sr-only-focusable:focus {
  position: static;
  width: auto;
  height: auto;
  padding: inherit;
  margin: inherit;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
```

---

## 🎯 Implementation Guide

### CSS Custom Properties Setup

```css
:root {
  /* Colors */
  --primary-50: #eef2ff;
  --primary-500: #6366f1;
  --primary-900: #312e81;
  
  /* Typography */
  --font-display: 'Clash Display', 'SF Pro Display', system-ui, sans-serif;
  --font-body: 'Inter', 'SF Pro Text', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', monospace;
  
  /* Spacing */
  --spacing-base: 4px;
  --spacing-2: calc(var(--spacing-base) * 2);
  --spacing-4: calc(var(--spacing-base) * 4);
  
  /* Animation */
  --duration-fast: 150ms;
  --duration-base: 200ms;
  --easing-interface: cubic-bezier(0.4, 0.0, 0.2, 1.0);
}
```

### Component Architecture

```typescript
// Design Token Types
interface DesignTokens {
  colors: ColorTokens;
  typography: TypographyTokens;
  spacing: SpacingTokens;
  shadows: ShadowTokens;
  animation: AnimationTokens;
}

// Component Variants System
interface ComponentVariants {
  variant: 'primary' | 'secondary' | 'ghost' | 'outline';
  size: 'sm' | 'md' | 'lg' | 'xl';
  state: 'default' | 'hover' | 'active' | 'disabled' | 'loading';
}
```

---

## 📊 Quality Assurance

### Design System Checklist

- [ ] All color combinations meet WCAG AA contrast requirements
- [ ] Touch targets are minimum 44px on mobile
- [ ] Typography scale is consistent across all components
- [ ] Animation respects `prefers-reduced-motion`
- [ ] Dark mode variants are defined for all components
- [ ] Focus states are visible and consistent
- [ ] Component states (hover, active, disabled) are defined
- [ ] Responsive behavior is documented for all components

### Testing Guidelines

1. **Visual Regression Testing**: Automated screenshot comparison
2. **Accessibility Testing**: Screen reader compatibility, keyboard navigation
3. **Performance Testing**: Animation performance, CSS bundle size
4. **Cross-browser Testing**: Chrome, Firefox, Safari, Edge
5. **Device Testing**: iOS, Android, various screen sizes

---

## 🚀 Migration Strategy

### Phase 1: Foundation (Week 1)
- Implement color system and CSS custom properties
- Update typography scale and font loading
- Establish spacing and layout tokens

### Phase 2: Components (Week 2-3)
- Update existing components with new design tokens
- Implement new component variants
- Add animation and interaction states

### Phase 3: Optimization (Week 4)
- Performance optimization
- Accessibility audit and fixes
- Cross-browser compatibility testing

---

**RevivaTech Design System V2.0**: The foundation for a premium, modern, and accessible user experience 🎨

*This design system transforms RevivaTech from a basic repair website into a best-in-class platform that delights users and builds trust.*