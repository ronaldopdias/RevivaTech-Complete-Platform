# Design Document

## Overview

The AdminLayout component currently depends on Material-UI (`@mui/material` and `@mui/icons-material`) which is not installed in the project, causing the website to crash. This design outlines the replacement of Material-UI components with existing project components and Lucide React icons, while maintaining the same functionality and visual design that follows the RevivaTech brand theme.

## Architecture

### Component Replacement Strategy

The design follows a direct replacement approach where each Material-UI component is mapped to an equivalent implementation using:

1. **Native HTML/CSS with Tailwind** - For layout components (Box, AppBar, Toolbar)
2. **Existing UI Components** - Button, Card components from the project's UI library
3. **Lucide React Icons** - Already installed, replacing Material-UI icons
4. **Custom Components** - For specialized components like Drawer, List items

### Component Mapping

| Material-UI Component | Replacement Strategy |
|----------------------|---------------------|
| `AppBar` | `<header>` with Tailwind classes |
| `Box` | `<div>` with Tailwind classes |
| `Drawer` | Custom drawer component with Tailwind |
| `List`, `ListItem` | `<nav>`, `<ul>`, `<li>` with Tailwind |
| `Typography` | `<h1>`, `<p>`, etc. with Tailwind typography |
| `IconButton` | Existing `Button` component with icon variant |
| `Breadcrumbs` | Custom breadcrumb component |
| `Chip` | Custom chip component with Tailwind |
| Material-UI Icons | Lucide React icons |

## Components and Interfaces

### AdminLayout Component Structure

```typescript
interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

interface MenuItem {
  text: string;
  icon: React.ComponentType;
  href: string;
}
```

### New Supporting Components

#### 1. Drawer Component
- Responsive sidebar navigation
- Mobile overlay with backdrop
- Desktop persistent sidebar
- Smooth animations using Tailwind transitions

#### 2. Breadcrumb Component
- Navigation path display
- Clickable links with hover states
- Home icon integration
- Accessible navigation

#### 3. Chip Component
- Status indicators
- Icon support
- Color variants matching brand theme
- Small, medium, large sizes

### Icon Mapping

| Material-UI Icon | Lucide React Icon |
|-----------------|-------------------|
| `Menu` | `Menu` |
| `Dashboard` | `LayoutDashboard` |
| `Build` | `Wrench` |
| `Analytics` | `BarChart3` |
| `Settings` | `Settings` |
| `People` | `Users` |
| `VideoLibrary` | `Video` |
| `Assessment` | `FileText` |
| `Storage` | `Database` |
| `Home` | `Home` |

## Data Models

### Theme Configuration

```typescript
const adminTheme = {
  colors: {
    primary: '#ADD8E6',      // Trust Blue 500
    primaryDark: '#4A9FCC',  // Trust Blue 700
    primaryDarker: '#1A5266', // Trust Blue 900
    secondary: '#008080',     // Professional Teal 500
    neutral: '#36454F',       // Neutral Grey 700
    background: '#F9FAFB',    // Light background
    surface: '#FFFFFF',       // Card/surface background
  },
  spacing: {
    drawerWidth: 260,
    headerHeight: 64,
    contentPadding: 24,
  },
  breakpoints: {
    mobile: '768px',
  }
};
```

### Navigation Configuration

```typescript
const navigationItems: MenuItem[] = [
  { text: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
  { text: 'Procedures', icon: Wrench, href: '/admin/procedures' },
  { text: 'Analytics', icon: BarChart3, href: '/admin/analytics' },
  { text: 'Media Library', icon: Video, href: '/admin/media' },
  { text: 'Users', icon: Users, href: '/admin/users' },
  { text: 'Reports', icon: FileText, href: '/admin/reports' },
  { text: 'Database', icon: Database, href: '/admin/database' },
  { text: 'Settings', icon: Settings, href: '/admin/settings' },
];
```

## Error Handling

### Module Resolution
- Remove all `@mui/*` imports
- Ensure all Lucide React icons are properly imported
- Add proper TypeScript types for all components

### Responsive Behavior
- Mobile-first approach using Tailwind breakpoints
- Drawer collapses to overlay on mobile
- Header adjusts layout for mobile screens
- Touch-friendly interactive elements

### Accessibility
- Proper ARIA labels for navigation
- Keyboard navigation support
- Screen reader compatibility
- Focus management for drawer interactions

## Testing Strategy

### Component Testing
- Unit tests for each replaced component
- Visual regression tests to ensure design consistency
- Responsive behavior testing across breakpoints
- Icon rendering and accessibility tests

### Integration Testing
- Full admin layout rendering without errors
- Navigation functionality
- Mobile drawer interactions
- Breadcrumb navigation

### Browser Compatibility
- Modern browser support (Chrome, Firefox, Safari, Edge)
- Mobile browser testing
- Touch interaction testing

## Implementation Notes

### Brand Theme Compliance
- All colors follow RevivaTech brand palette
- Trust Blue (#ADD8E6) for primary elements
- Professional Teal (#008080) for secondary actions
- Neutral Grey (#36454F) for text and borders

### Performance Considerations
- Lazy loading for drawer content
- Optimized re-renders using React.memo where appropriate
- Minimal bundle size impact by removing Material-UI dependency

### Migration Path
1. Create new components without Material-UI
2. Replace imports gradually
3. Test each component replacement
4. Ensure visual consistency
5. Remove Material-UI references completely