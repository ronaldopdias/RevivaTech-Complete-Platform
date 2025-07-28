# Nordic Design System Implementation Guide

## Overview

This document provides comprehensive implementation guidelines for the Nordic Design System, inspired by Apple's clean aesthetic and focused on simplicity, functionality, and sophisticated minimalism. The system will be applied across all customer-facing interfaces, with special attention to the chat widget, customer dashboard, and data recovery page.

## Design Philosophy

### Core Principles

#### 1. Simplicity First
- Remove unnecessary visual elements
- Focus on essential content and functionality
- Clean, uncluttered layouts with purposeful whitespace
- Minimal cognitive load for users

#### 2. Functional Aesthetics
- Every design element serves a clear purpose
- Beauty emerges from functionality, not decoration
- Consistent interaction patterns
- Intuitive navigation and user flows

#### 3. Sophisticated Minimalism
- Subtle beauty through refined details
- High-quality materials and finishes
- Precise alignment and spacing
- Understated elegance

#### 4. Human-Centered Design
- Accessibility as a foundation, not an afterthought
- Touch-friendly interfaces for mobile
- Clear visual hierarchy
- Emotional resonance through thoughtful design

## Color System Implementation

### Nordic Color Palette

#### Light Mode Colors
```css
:root {
  /* Primary Nordic Colors */
  --nordic-primary: #007AFF;        /* Apple Blue - Primary actions */
  --nordic-primary-hover: #0066CC;  /* Darker blue for hover states */
  --nordic-primary-light: #E5F3FF;  /* Light blue for backgrounds */
  --nordic-primary-dark: #0051D5;   /* Darker variant for pressed states */
  
  /* Nordic Neutrals */
  --nordic-white: #FFFFFF;          /* Pure white surfaces */
  --nordic-gray-50: #F2F2F7;        /* Ultra light background */
  --nordic-gray-100: #E5E5EA;       /* Light borders and dividers */
  --nordic-gray-200: #D1D1D6;       /* Subtle borders */
  --nordic-gray-300: #C7C7CC;       /* Medium borders */
  --nordic-gray-400: #AEAEB2;       /* Disabled text and icons */
  --nordic-gray-500: #8E8E93;       /* Secondary text */
  --nordic-gray-600: #636366;       /* Body text */
  --nordic-gray-700: #48484A;       /* Heading text */
  --nordic-gray-800: #2C2C2E;       /* Primary headings */
  --nordic-gray-900: #1D1D1F;       /* Primary text */
  
  /* Nordic Accent Colors */
  --nordic-green: #30D158;          /* Success states */
  --nordic-green-dark: #28CD41;     /* Success hover */
  --nordic-orange: #FF9500;         /* Warning states */
  --nordic-orange-dark: #E6850E;    /* Warning hover */
  --nordic-red: #FF3B30;            /* Error states */
  --nordic-red-dark: #E6352B;       /* Error hover */
  --nordic-purple: #AF52DE;         /* Special highlights */
  --nordic-purple-dark: #9A47C4;    /* Purple hover */
  --nordic-yellow: #FFCC00;         /* Attention states */
  --nordic-pink: #FF2D92;           /* Special accents */
  
  /* Semantic Colors */
  --nordic-background: var(--nordic-white);
  --nordic-surface: var(--nordic-white);
  --nordic-surface-secondary: var(--nordic-gray-50);
  --nordic-border: var(--nordic-gray-200);
  --nordic-border-light: var(--nordic-gray-100);
  --nordic-text-primary: var(--nordic-gray-900);
  --nordic-text-secondary: var(--nordic-gray-600);
  --nordic-text-muted: var(--nordic-gray-500);
  --nordic-text-disabled: var(--nordic-gray-400);
}
```

#### Dark Mode Colors
```css
:root[data-theme="dark"] {
  /* Primary Nordic Colors - Dark */
  --nordic-primary: #0A84FF;        /* Brighter blue for dark backgrounds */
  --nordic-primary-hover: #409CFF;  /* Lighter blue for hover */
  --nordic-primary-light: #1A1A1E;  /* Dark blue backgrounds */
  --nordic-primary-dark: #0066CC;   /* Primary pressed state */
  
  /* Nordic Neutrals - Dark */
  --nordic-white: #000000;          /* True black (OLED optimized) */
  --nordic-gray-50: #1C1C1E;        /* Dark surface */
  --nordic-gray-100: #2C2C2E;       /* Elevated surfaces */
  --nordic-gray-200: #3A3A3C;       /* Subtle borders */
  --nordic-gray-300: #48484A;       /* Medium borders */
  --nordic-gray-400: #636366;       /* Disabled elements */
  --nordic-gray-500: #8E8E93;       /* Secondary text */
  --nordic-gray-600: #AEAEB2;       /* Body text */
  --nordic-gray-700: #C7C7CC;       /* Heading text */
  --nordic-gray-800: #E5E5EA;       /* Primary headings */
  --nordic-gray-900: #F2F2F7;       /* Primary text */
  
  /* Nordic Accent Colors - Dark */
  --nordic-green: #32D74B;          /* Success (darker background) */
  --nordic-green-dark: #30D158;     /* Success hover */
  --nordic-orange: #FF9F0A;         /* Warning (darker background) */
  --nordic-orange-dark: #FF9500;    /* Warning hover */
  --nordic-red: #FF453A;            /* Error (darker background) */
  --nordic-red-dark: #FF3B30;       /* Error hover */
  --nordic-purple: #BF5AF2;         /* Purple (darker background) */
  --nordic-purple-dark: #AF52DE;    /* Purple hover */
  --nordic-yellow: #FFD60A;         /* Attention (darker background) */
  --nordic-pink: #FF375F;           /* Pink (darker background) */
  
  /* Semantic Colors - Dark */
  --nordic-background: var(--nordic-gray-50);
  --nordic-surface: var(--nordic-gray-100);
  --nordic-surface-secondary: var(--nordic-gray-200);
  --nordic-border: var(--nordic-gray-300);
  --nordic-border-light: var(--nordic-gray-200);
  --nordic-text-primary: var(--nordic-gray-900);
  --nordic-text-secondary: var(--nordic-gray-600);
  --nordic-text-muted: var(--nordic-gray-500);
  --nordic-text-disabled: var(--nordic-gray-400);
}
```

### Color Usage Guidelines

#### Primary Color Application
```css
/* Use Nordic Primary for: */
.nordic-button-primary,
.nordic-link-primary,
.nordic-checkbox:checked,
.nordic-radio:checked,
.nordic-tab-active,
.nordic-progress-bar {
  background-color: var(--nordic-primary);
  color: white;
}

.nordic-input:focus,
.nordic-textarea:focus {
  border-color: var(--nordic-primary);
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}
```

#### Neutral Color Application
```css
/* Surface hierarchy */
.nordic-page-background {
  background-color: var(--nordic-background);
}

.nordic-card,
.nordic-modal,
.nordic-popup {
  background-color: var(--nordic-surface);
  border: 1px solid var(--nordic-border);
}

.nordic-section-secondary {
  background-color: var(--nordic-surface-secondary);
}
```

## Typography System

### Font Stack Implementation

#### Primary Font Configuration
```css
/* Import SF Pro Display (Apple's system font) */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

:root {
  /* Primary font stack - SF Pro Display with fallbacks */
  --nordic-font-display: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  --nordic-font-text: 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  --nordic-font-mono: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', 'Consolas', monospace;
  
  /* Alternative with Inter for cross-platform consistency */
  --nordic-font-display-alt: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  --nordic-font-text-alt: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
}

/* Font family application */
body {
  font-family: var(--nordic-font-text);
  font-feature-settings: 'kern' 1, 'liga' 1, 'calt' 1;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--nordic-font-display);
  font-feature-settings: 'kern' 1, 'liga' 1, 'calt' 1;
}

code, pre {
  font-family: var(--nordic-font-mono);
}
```

### Typography Scale

#### Size and Weight System
```css
:root {
  /* Display Typography (Large headings) */
  --nordic-text-display-large: 3.5rem;    /* 56px - Hero headings */
  --nordic-text-display: 3rem;            /* 48px - Page headings */
  --nordic-text-display-small: 2.25rem;   /* 36px - Section headings */
  
  /* Heading Typography */
  --nordic-text-h1: 2rem;                 /* 32px - Main headings */
  --nordic-text-h2: 1.5rem;               /* 24px - Sub headings */
  --nordic-text-h3: 1.25rem;              /* 20px - Small headings */
  --nordic-text-h4: 1.125rem;             /* 18px - Card headings */
  --nordic-text-h5: 1rem;                 /* 16px - List headings */
  --nordic-text-h6: 0.875rem;             /* 14px - Minor headings */
  
  /* Body Typography */
  --nordic-text-large: 1.125rem;          /* 18px - Large body text */
  --nordic-text-base: 1rem;               /* 16px - Standard body */
  --nordic-text-small: 0.875rem;          /* 14px - Small text */
  --nordic-text-caption: 0.75rem;         /* 12px - Captions */
  --nordic-text-micro: 0.6875rem;         /* 11px - Legal text */
  
  /* Line Heights */
  --nordic-leading-none: 1;               /* 1.0 - Tight headings */
  --nordic-leading-tight: 1.25;           /* 1.25 - Display text */
  --nordic-leading-snug: 1.375;           /* 1.375 - Headings */
  --nordic-leading-normal: 1.5;           /* 1.5 - Body text */
  --nordic-leading-relaxed: 1.625;        /* 1.625 - Comfortable reading */
  --nordic-leading-loose: 2;              /* 2.0 - Spacious text */
  
  /* Font Weights */
  --nordic-weight-light: 300;             /* Light weight */
  --nordic-weight-regular: 400;           /* Regular text */
  --nordic-weight-medium: 500;            /* Medium emphasis */
  --nordic-weight-semibold: 600;          /* Semi-bold */
  --nordic-weight-bold: 700;              /* Bold headings */
  --nordic-weight-extrabold: 800;         /* Extra bold */
  
  /* Letter Spacing */
  --nordic-tracking-tighter: -0.05em;     /* Tight tracking */
  --nordic-tracking-tight: -0.025em;      /* Slightly tight */
  --nordic-tracking-normal: 0;            /* Normal tracking */
  --nordic-tracking-wide: 0.025em;        /* Wide tracking */
  --nordic-tracking-wider: 0.05em;        /* Wider tracking */
  --nordic-tracking-widest: 0.1em;        /* Widest tracking */
}
```

#### Typography Classes
```css
/* Display Typography */
.nordic-display-large {
  font-size: var(--nordic-text-display-large);
  font-weight: var(--nordic-weight-bold);
  line-height: var(--nordic-leading-tight);
  letter-spacing: var(--nordic-tracking-tighter);
  color: var(--nordic-text-primary);
}

.nordic-display {
  font-size: var(--nordic-text-display);
  font-weight: var(--nordic-weight-bold);
  line-height: var(--nordic-leading-tight);
  letter-spacing: var(--nordic-tracking-tight);
  color: var(--nordic-text-primary);
}

.nordic-display-small {
  font-size: var(--nordic-text-display-small);
  font-weight: var(--nordic-weight-semibold);
  line-height: var(--nordic-leading-snug);
  letter-spacing: var(--nordic-tracking-tight);
  color: var(--nordic-text-primary);
}

/* Heading Typography */
.nordic-h1 {
  font-size: var(--nordic-text-h1);
  font-weight: var(--nordic-weight-semibold);
  line-height: var(--nordic-leading-snug);
  letter-spacing: var(--nordic-tracking-tight);
  color: var(--nordic-text-primary);
}

.nordic-h2 {
  font-size: var(--nordic-text-h2);
  font-weight: var(--nordic-weight-semibold);
  line-height: var(--nordic-leading-snug);
  color: var(--nordic-text-primary);
}

.nordic-h3 {
  font-size: var(--nordic-text-h3);
  font-weight: var(--nordic-weight-medium);
  line-height: var(--nordic-leading-snug);
  color: var(--nordic-text-primary);
}

.nordic-h4 {
  font-size: var(--nordic-text-h4);
  font-weight: var(--nordic-weight-medium);
  line-height: var(--nordic-leading-normal);
  color: var(--nordic-text-primary);
}

/* Body Typography */
.nordic-body-large {
  font-size: var(--nordic-text-large);
  font-weight: var(--nordic-weight-regular);
  line-height: var(--nordic-leading-relaxed);
  color: var(--nordic-text-primary);
}

.nordic-body {
  font-size: var(--nordic-text-base);
  font-weight: var(--nordic-weight-regular);
  line-height: var(--nordic-leading-normal);
  color: var(--nordic-text-primary);
}

.nordic-body-small {
  font-size: var(--nordic-text-small);
  font-weight: var(--nordic-weight-regular);
  line-height: var(--nordic-leading-normal);
  color: var(--nordic-text-secondary);
}

.nordic-caption {
  font-size: var(--nordic-text-caption);
  font-weight: var(--nordic-weight-regular);
  line-height: var(--nordic-leading-normal);
  color: var(--nordic-text-muted);
  letter-spacing: var(--nordic-tracking-wide);
  text-transform: uppercase;
}
```

## Spacing System

### Base Spacing Unit

#### 8-Point Grid System
```css
:root {
  /* Base spacing unit: 8px */
  --nordic-space-base: 8px;
  
  /* Spacing scale */
  --nordic-space-0: 0;
  --nordic-space-1: 0.125rem;   /* 2px */
  --nordic-space-2: 0.25rem;    /* 4px */
  --nordic-space-3: 0.375rem;   /* 6px */
  --nordic-space-4: 0.5rem;     /* 8px - Base unit */
  --nordic-space-5: 0.625rem;   /* 10px */
  --nordic-space-6: 0.75rem;    /* 12px */
  --nordic-space-8: 1rem;       /* 16px */
  --nordic-space-10: 1.25rem;   /* 20px */
  --nordic-space-12: 1.5rem;    /* 24px */
  --nordic-space-16: 2rem;      /* 32px */
  --nordic-space-20: 2.5rem;    /* 40px */
  --nordic-space-24: 3rem;      /* 48px */
  --nordic-space-32: 4rem;      /* 64px */
  --nordic-space-40: 5rem;      /* 80px */
  --nordic-space-48: 6rem;      /* 96px */
  --nordic-space-56: 7rem;      /* 112px */
  --nordic-space-64: 8rem;      /* 128px */
  
  /* Semantic spacing */
  --nordic-space-xs: var(--nordic-space-2);    /* 4px */
  --nordic-space-sm: var(--nordic-space-4);    /* 8px */
  --nordic-space-md: var(--nordic-space-8);    /* 16px */
  --nordic-space-lg: var(--nordic-space-12);   /* 24px */
  --nordic-space-xl: var(--nordic-space-16);   /* 32px */
  --nordic-space-2xl: var(--nordic-space-24);  /* 48px */
  --nordic-space-3xl: var(--nordic-space-32);  /* 64px */
}
```

#### Component Spacing Standards
```css
/* Container padding */
.nordic-container {
  padding-left: var(--nordic-space-md);
  padding-right: var(--nordic-space-md);
}

@media (min-width: 768px) {
  .nordic-container {
    padding-left: var(--nordic-space-lg);
    padding-right: var(--nordic-space-lg);
  }
}

@media (min-width: 1024px) {
  .nordic-container {
    padding-left: var(--nordic-space-xl);
    padding-right: var(--nordic-space-xl);
  }
}

/* Section spacing */
.nordic-section {
  padding-top: var(--nordic-space-2xl);
  padding-bottom: var(--nordic-space-2xl);
}

@media (min-width: 768px) {
  .nordic-section {
    padding-top: var(--nordic-space-3xl);
    padding-bottom: var(--nordic-space-3xl);
  }
}

/* Component spacing */
.nordic-card {
  padding: var(--nordic-space-lg);
  margin-bottom: var(--nordic-space-md);
}

.nordic-button {
  padding: var(--nordic-space-3) var(--nordic-space-6);
}

.nordic-input {
  padding: var(--nordic-space-3) var(--nordic-space-4);
}
```

## Component System

### Button Components

#### Primary Button
```css
.nordic-button-primary {
  /* Base styles */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  
  /* Typography */
  font-family: var(--nordic-font-text);
  font-size: var(--nordic-text-base);
  font-weight: var(--nordic-weight-medium);
  text-decoration: none;
  white-space: nowrap;
  
  /* Spacing */
  padding: var(--nordic-space-3) var(--nordic-space-6);
  min-height: 44px; /* Touch target minimum */
  
  /* Appearance */
  background-color: var(--nordic-primary);
  color: white;
  border: none;
  border-radius: 8px;
  
  /* Transitions */
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  
  /* Cursor */
  cursor: pointer;
  user-select: none;
}

.nordic-button-primary:hover {
  background-color: var(--nordic-primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
}

.nordic-button-primary:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.2);
}

.nordic-button-primary:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.3);
}

.nordic-button-primary:disabled {
  background-color: var(--nordic-gray-400);
  color: var(--nordic-gray-300);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
```

#### Secondary Button
```css
.nordic-button-secondary {
  /* Inherit base button styles */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--nordic-font-text);
  font-size: var(--nordic-text-base);
  font-weight: var(--nordic-weight-medium);
  text-decoration: none;
  white-space: nowrap;
  padding: var(--nordic-space-3) var(--nordic-space-6);
  min-height: 44px;
  border-radius: 8px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  user-select: none;
  
  /* Secondary specific */
  background-color: var(--nordic-surface);
  color: var(--nordic-primary);
  border: 1px solid var(--nordic-border);
}

.nordic-button-secondary:hover {
  background-color: var(--nordic-primary-light);
  border-color: var(--nordic-primary);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.nordic-button-secondary:focus {
  outline: none;
  border-color: var(--nordic-primary);
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.15);
}
```

#### Ghost Button
```css
.nordic-button-ghost {
  /* Inherit base button styles */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--nordic-font-text);
  font-size: var(--nordic-text-base);
  font-weight: var(--nordic-weight-medium);
  text-decoration: none;
  white-space: nowrap;
  padding: var(--nordic-space-3) var(--nordic-space-6);
  min-height: 44px;
  border-radius: 8px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  user-select: none;
  
  /* Ghost specific */
  background-color: transparent;
  color: var(--nordic-text-secondary);
  border: none;
}

.nordic-button-ghost:hover {
  background-color: var(--nordic-gray-100);
  color: var(--nordic-text-primary);
}

.nordic-button-ghost:focus {
  outline: none;
  background-color: var(--nordic-gray-100);
  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
}
```

### Form Components

#### Input Fields
```css
.nordic-input {
  /* Base styles */
  display: block;
  width: 100%;
  
  /* Typography */
  font-family: var(--nordic-font-text);
  font-size: var(--nordic-text-base);
  color: var(--nordic-text-primary);
  line-height: var(--nordic-leading-normal);
  
  /* Spacing */
  padding: var(--nordic-space-3) var(--nordic-space-4);
  min-height: 44px;
  
  /* Appearance */
  background-color: var(--nordic-surface);
  border: 1px solid var(--nordic-border);
  border-radius: 8px;
  
  /* Transitions */
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.nordic-input::placeholder {
  color: var(--nordic-text-muted);
}

.nordic-input:focus {
  outline: none;
  border-color: var(--nordic-primary);
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

.nordic-input:disabled {
  background-color: var(--nordic-gray-50);
  color: var(--nordic-text-disabled);
  cursor: not-allowed;
}

.nordic-input[aria-invalid="true"] {
  border-color: var(--nordic-red);
}

.nordic-input[aria-invalid="true"]:focus {
  border-color: var(--nordic-red);
  box-shadow: 0 0 0 3px rgba(255, 59, 48, 0.1);
}
```

#### Select Component
```css
.nordic-select {
  /* Inherit input styles */
  display: block;
  width: 100%;
  font-family: var(--nordic-font-text);
  font-size: var(--nordic-text-base);
  color: var(--nordic-text-primary);
  line-height: var(--nordic-leading-normal);
  padding: var(--nordic-space-3) var(--nordic-space-4);
  min-height: 44px;
  background-color: var(--nordic-surface);
  border: 1px solid var(--nordic-border);
  border-radius: 8px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  
  /* Select specific */
  appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
  background-position: right var(--nordic-space-3) center;
  background-repeat: no-repeat;
  background-size: 16px 12px;
  padding-right: var(--nordic-space-10);
}

.nordic-select:focus {
  outline: none;
  border-color: var(--nordic-primary);
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}
```

### Card Components

#### Basic Card
```css
.nordic-card {
  /* Structure */
  display: flex;
  flex-direction: column;
  
  /* Spacing */
  padding: var(--nordic-space-lg);
  
  /* Appearance */
  background-color: var(--nordic-surface);
  border: 1px solid var(--nordic-border);
  border-radius: 12px;
  
  /* Elevation */
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  
  /* Transitions */
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.nordic-card:hover {
  border-color: var(--nordic-primary-light);
  box-shadow: 0 4px 20px rgba(0, 122, 255, 0.08);
  transform: translateY(-2px);
}

.nordic-card-header {
  margin-bottom: var(--nordic-space-md);
}

.nordic-card-title {
  font-size: var(--nordic-text-h3);
  font-weight: var(--nordic-weight-semibold);
  color: var(--nordic-text-primary);
  margin-bottom: var(--nordic-space-2);
}

.nordic-card-description {
  font-size: var(--nordic-text-base);
  color: var(--nordic-text-secondary);
  line-height: var(--nordic-leading-normal);
}

.nordic-card-content {
  flex: 1;
}

.nordic-card-footer {
  margin-top: var(--nordic-space-md);
  padding-top: var(--nordic-space-md);
  border-top: 1px solid var(--nordic-border-light);
}
```

#### Stats Card
```css
.nordic-stats-card {
  /* Inherit card styles */
  display: flex;
  flex-direction: column;
  padding: var(--nordic-space-lg);
  background-color: var(--nordic-surface);
  border: 1px solid var(--nordic-border);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  
  /* Stats specific */
  text-align: center;
  min-height: 140px;
}

.nordic-stats-card:hover {
  border-color: var(--nordic-primary-light);
  box-shadow: 0 4px 16px rgba(0, 122, 255, 0.1);
  transform: translateY(-1px);
}

.nordic-stats-value {
  font-size: var(--nordic-text-display-small);
  font-weight: var(--nordic-weight-bold);
  color: var(--nordic-text-primary);
  line-height: var(--nordic-leading-tight);
  margin-bottom: var(--nordic-space-1);
}

.nordic-stats-label {
  font-size: var(--nordic-text-small);
  color: var(--nordic-text-secondary);
  text-transform: uppercase;
  letter-spacing: var(--nordic-tracking-wide);
  font-weight: var(--nordic-weight-medium);
}

.nordic-stats-trend {
  font-size: var(--nordic-text-caption);
  color: var(--nordic-green);
  font-weight: var(--nordic-weight-medium);
  margin-top: var(--nordic-space-2);
}

.nordic-stats-trend--negative {
  color: var(--nordic-red);
}

.nordic-stats-trend--neutral {
  color: var(--nordic-text-muted);
}
```

### Navigation Components

#### Tab Navigation
```css
.nordic-tabs {
  display: flex;
  border-bottom: 1px solid var(--nordic-border);
  margin-bottom: var(--nordic-space-lg);
}

.nordic-tab {
  display: flex;
  align-items: center;
  padding: var(--nordic-space-3) var(--nordic-space-4);
  font-family: var(--nordic-font-text);
  font-size: var(--nordic-text-base);
  font-weight: var(--nordic-weight-medium);
  color: var(--nordic-text-secondary);
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
}

.nordic-tab:hover {
  color: var(--nordic-text-primary);
  background-color: var(--nordic-gray-50);
}

.nordic-tab[aria-selected="true"] {
  color: var(--nordic-primary);
  border-bottom-color: var(--nordic-primary);
}

.nordic-tab:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.15);
}
```

## Glass Morphism Effects

### Implementation Guidelines

#### Basic Glass Effect
```css
.nordic-glass {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

/* Dark mode variant */
[data-theme="dark"] .nordic-glass {
  background: rgba(28, 28, 30, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}
```

#### Chat Widget Glass Effect
```css
.nordic-chat-widget {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(229, 229, 234, 0.6);
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.nordic-chat-widget:hover {
  background: rgba(255, 255, 255, 0.95);
  border-color: rgba(0, 122, 255, 0.3);
  box-shadow: 0 24px 48px rgba(0, 122, 255, 0.15);
}

/* Dark mode */
[data-theme="dark"] .nordic-chat-widget {
  background: rgba(28, 28, 30, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

[data-theme="dark"] .nordic-chat-widget:hover {
  background: rgba(28, 28, 30, 0.95);
  border-color: rgba(10, 132, 255, 0.3);
  box-shadow: 0 24px 48px rgba(10, 132, 255, 0.2);
}
```

#### Kanban Card Glass Effect
```css
.nordic-kanban-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(229, 229, 234, 0.6);
  border-radius: 12px;
  padding: var(--nordic-space-md);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: grab;
}

.nordic-kanban-card:hover {
  background: rgba(255, 255, 255, 0.95);
  border-color: var(--nordic-primary-light);
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 122, 255, 0.15);
}

.nordic-kanban-card:active {
  cursor: grabbing;
  transform: translateY(-2px) rotate(2deg);
}

/* Dark mode */
[data-theme="dark"] .nordic-kanban-card {
  background: rgba(44, 44, 46, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

[data-theme="dark"] .nordic-kanban-card:hover {
  background: rgba(44, 44, 46, 0.95);
  border-color: rgba(10, 132, 255, 0.3);
  box-shadow: 0 12px 40px rgba(10, 132, 255, 0.2);
}
```

## Theme Implementation

### Theme Toggle Component
```typescript
// components/ThemeToggle.tsx
'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';

type Theme = 'light' | 'dark' | 'system';

export const ThemeToggle = () => {
  const [theme, setTheme] = useState<Theme>('system');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('nordic-theme') as Theme;
    if (stored) {
      setTheme(stored);
      applyTheme(stored);
    } else {
      applyTheme('system');
    }
  }, []);

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    
    if (newTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.setAttribute('data-theme', systemTheme);
    } else {
      root.setAttribute('data-theme', newTheme);
    }
    
    localStorage.setItem('nordic-theme', newTheme);
  };

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="nordic-theme-toggle">
      <button
        onClick={() => handleThemeChange('light')}
        className={`nordic-theme-option ${theme === 'light' ? 'active' : ''}`}
        aria-label="Light theme"
      >
        <Sun className="h-4 w-4" />
      </button>
      
      <button
        onClick={() => handleThemeChange('dark')}
        className={`nordic-theme-option ${theme === 'dark' ? 'active' : ''}`}
        aria-label="Dark theme"
      >
        <Moon className="h-4 w-4" />
      </button>
      
      <button
        onClick={() => handleThemeChange('system')}
        className={`nordic-theme-option ${theme === 'system' ? 'active' : ''}`}
        aria-label="System theme"
      >
        <Monitor className="h-4 w-4" />
      </button>
    </div>
  );
};
```

### Theme Toggle Styles
```css
.nordic-theme-toggle {
  display: flex;
  background: var(--nordic-surface);
  border: 1px solid var(--nordic-border);
  border-radius: 8px;
  padding: 2px;
}

.nordic-theme-option {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--nordic-text-secondary);
  border-radius: 6px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.nordic-theme-option:hover {
  background: var(--nordic-gray-100);
  color: var(--nordic-text-primary);
}

.nordic-theme-option.active {
  background: var(--nordic-primary);
  color: white;
}

.nordic-theme-option:focus {
  outline: none;
  box-shadow: 0 0 0 2px var(--nordic-primary-light);
}
```

## Responsive Implementation

### Breakpoint System
```css
:root {
  /* Breakpoints */
  --nordic-breakpoint-xs: 320px;    /* Small mobile */
  --nordic-breakpoint-sm: 640px;    /* Mobile */
  --nordic-breakpoint-md: 768px;    /* Tablet */
  --nordic-breakpoint-lg: 1024px;   /* Desktop */
  --nordic-breakpoint-xl: 1280px;   /* Large desktop */
  --nordic-breakpoint-2xl: 1536px;  /* Extra large */
}

/* Media query mixins */
@media (max-width: 639px) {
  .nordic-mobile-only {
    display: block;
  }
  
  .nordic-desktop-only {
    display: none;
  }
}

@media (min-width: 640px) {
  .nordic-mobile-only {
    display: none;
  }
  
  .nordic-desktop-only {
    display: block;
  }
}
```

### Responsive Typography
```css
/* Fluid typography */
.nordic-display-large {
  font-size: clamp(2.5rem, 5vw, 3.5rem);
}

.nordic-display {
  font-size: clamp(2rem, 4vw, 3rem);
}

.nordic-display-small {
  font-size: clamp(1.75rem, 3vw, 2.25rem);
}

.nordic-h1 {
  font-size: clamp(1.5rem, 2.5vw, 2rem);
}

/* Responsive spacing */
.nordic-section {
  padding-top: clamp(var(--nordic-space-xl), 5vw, var(--nordic-space-3xl));
  padding-bottom: clamp(var(--nordic-space-xl), 5vw, var(--nordic-space-3xl));
}

.nordic-container {
  padding-left: clamp(var(--nordic-space-md), 3vw, var(--nordic-space-xl));
  padding-right: clamp(var(--nordic-space-md), 3vw, var(--nordic-space-xl));
}
```

## Performance Optimization

### CSS Optimization
```css
/* Reduce repaints with will-change */
.nordic-card:hover,
.nordic-button:hover,
.nordic-kanban-card {
  will-change: transform, box-shadow;
}

/* GPU acceleration for animations */
.nordic-transition {
  transform: translateZ(0);
  backface-visibility: hidden;
  perspective: 1000px;
}

/* Optimize font loading */
@font-face {
  font-family: 'SF Pro Display';
  src: url('/fonts/sf-pro-display.woff2') format('woff2');
  font-display: swap;
  font-weight: 400 700;
}
```

### Loading States
```css
.nordic-skeleton {
  background: linear-gradient(
    90deg,
    var(--nordic-gray-100) 25%,
    var(--nordic-gray-50) 50%,
    var(--nordic-gray-100) 75%
  );
  background-size: 200% 100%;
  animation: nordic-skeleton-loading 1.5s infinite;
}

@keyframes nordic-skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.nordic-skeleton-text {
  height: 1em;
  border-radius: 4px;
  margin-bottom: var(--nordic-space-2);
}

.nordic-skeleton-heading {
  height: 1.5em;
  border-radius: 6px;
  margin-bottom: var(--nordic-space-3);
  width: 60%;
}
```

## Implementation Checklist

### Phase 1: Foundation
- [ ] Install and configure color variables
- [ ] Set up typography system
- [ ] Implement spacing scale
- [ ] Create base component classes
- [ ] Configure theme toggle functionality

### Phase 2: Components
- [ ] Build button component library
- [ ] Create form input components
- [ ] Implement card components
- [ ] Add navigation components
- [ ] Create loading and skeleton states

### Phase 3: Advanced Features
- [ ] Implement glass morphism effects
- [ ] Add responsive breakpoints
- [ ] Create animation utilities
- [ ] Optimize for performance
- [ ] Test across devices and browsers

### Phase 4: Integration
- [ ] Apply to customer dashboard
- [ ] Update chat widget styling
- [ ] Redesign data recovery page
- [ ] Ensure accessibility compliance
- [ ] Document usage guidelines

This comprehensive Nordic Design System implementation guide provides the foundation for creating a cohesive, Apple-inspired aesthetic across all customer touchpoints while maintaining accessibility and performance standards.