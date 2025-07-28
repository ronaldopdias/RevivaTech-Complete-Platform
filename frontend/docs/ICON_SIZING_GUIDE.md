# Icon Sizing Guide

This guide explains how to properly size icons in the RevivaTech application to ensure consistency and prevent oversized icons.

## Problem

SVG icons with `fill-rule="evenodd"` and similar attributes were appearing oversized because they lacked proper width/height constraints.

## Solutions Implemented

### 1. Global CSS Fixes

The `globals.css` file now includes comprehensive icon sizing rules:

```css
/* Ensure SVGs inherit container size by default */
svg {
  width: 1em;
  height: 1em;
  vertical-align: middle;
  flex-shrink: 0;
}

/* Default size for unconstrained SVGs */
svg:not([width]):not([height]):not(.custom-size) {
  width: 1.25rem; /* 20px */
  height: 1.25rem;
}

/* Context-specific sizing */
button svg, a svg, .icon svg {
  width: 1rem; /* 16px */
  height: 1rem;
}
```

### 2. Icon Component

Use the new `Icon` component for consistent sizing:

```tsx
import { Icon, CheckIcon, ChevronDownIcon } from '@/components/ui/Icon';

// Basic usage
<Icon name="✓" size="md" />

// Custom SVG path
<Icon 
  path="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
  size="lg"
  variant="primary"
/>

// Lucide icons
<Icon lucideIcon="Check" size="md" />

// Predefined icons
<CheckIcon size="sm" variant="success" />
```

### 3. Tailwind Utilities

New utility classes for consistent icon sizing:

```html
<!-- Basic icon sizing -->
<div class="icon-xs"><!-- 12px --></div>
<div class="icon-sm"><!-- 14px --></div>
<div class="icon-md"><!-- 16px --></div>
<div class="icon-lg"><!-- 20px --></div>
<div class="icon-xl"><!-- 24px --></div>
<div class="icon-2xl"><!-- 32px --></div>

<!-- Responsive icons (inherit text size) -->
<div class="icon-responsive">
  <svg>...</svg>
</div>

<!-- Preserve original size -->
<div class="icon-auto">
  <svg>...</svg>
</div>
```

## Size Guidelines

### Common Use Cases

| Context | Size | Class | Pixels |
|---------|------|-------|--------|
| Inline text | xs-sm | `icon-xs` or `icon-sm` | 12-14px |
| Buttons | sm-md | `icon-sm` or `icon-md` | 14-16px |
| Navigation | md | `icon-md` | 16px |
| Cards/sections | lg | `icon-lg` | 20px |
| Headers | xl | `icon-xl` | 24px |
| Hero sections | 2xl+ | `icon-2xl` | 32px+ |

### Examples

```tsx
// ✅ Good: Properly sized icons
<Button>
  <Icon lucideIcon="Plus" size="sm" />
  Add Item
</Button>

<Card>
  <CheckIcon size="lg" variant="success" />
  <h3>Completed</h3>
</Card>

// ✅ Good: Using utility classes
<div className="flex items-center icon-md">
  <svg>...</svg>
  <span>Menu item</span>
</div>

// ❌ Avoid: Unsized SVGs
<div>
  <svg fill-rule="evenodd">
    <path d="..." />
  </svg>
</div>

// ✅ Better: Wrapped in Icon component
<div>
  <Icon 
    path="..." 
    size="md" 
  />
</div>
```

## Migration Guide

### Step 1: Replace Raw SVGs

```tsx
// Before
<svg fill-rule="evenodd" clip-rule="evenodd">
  <path d="M10 18a8 8 0 100-16..." />
</svg>

// After
<CheckIcon size="md" />
// or
<Icon 
  path="M10 18a8 8 0 100-16..." 
  size="md" 
/>
```

### Step 2: Add Size Classes

```tsx
// Before
<div className="flex items-center">
  <SomeIcon />
  <span>Text</span>
</div>

// After
<div className="flex items-center icon-md">
  <SomeIcon />
  <span>Text</span>
</div>
```

### Step 3: Use Icon Props

```tsx
// Before
<Button>
  <Plus className="w-6 h-6" />
  Add
</Button>

// After
<Button
  icon={{
    component: Icon,
    position: 'left'
  }}
>
  Add
</Button>
```

## Override Cases

Sometimes you need to preserve original icon sizes:

```tsx
// Preserve original size
<svg className="preserve-size" width="48" height="48">
  <path d="..." />
</svg>

// Or use the preserve class on container
<div className="preserve-icon-size">
  <svg width="48" height="48">
    <path d="..." />
  </svg>
</div>

// Or use Icon component with custom size
<Icon 
  path="..." 
  className="w-12 h-12" // Custom size
/>
```

## Best Practices

1. **Always specify icon sizes** explicitly using the Icon component or utility classes
2. **Use consistent sizes** within the same context (e.g., all navigation icons should be the same size)
3. **Test with different screen sizes** to ensure icons remain legible
4. **Use semantic sizes** (e.g., `icon-md` for navigation, `icon-lg` for cards)
5. **Provide alt text** or aria-labels for accessibility when needed

## Troubleshooting

### Icons Still Too Large?

1. Check if the icon has explicit width/height attributes that override CSS
2. Add `!important` to size rules if needed
3. Use the `preserve-size` class to reset and start fresh

### Icons Not Showing?

1. Verify the SVG path is correct
2. Check that `fill="currentColor"` is set for proper theming
3. Ensure the container has proper color/text styles

### Accessibility

Always consider:
```tsx
<Icon 
  path="..." 
  size="md"
  aria-label="Success"
  role="img"
/>
```

This system ensures all icons are consistently sized and prevents the oversized icon issues you encountered.