# Brand Theme Reference

Always reference `/Docs/PRD_RevivaTech_Brand_Theme.md` before creating pages/components

## **Primary Brand Colors:**
```scss
// Trust Blue (Primary)
--trust-500: #ADD8E6   // Main CTAs
--trust-700: #4A9FCC   // Text/accents
--trust-900: #1A5266   // Headers

// Professional Teal (Secondary)  
--professional-500: #008080  // Secondary CTAs
--professional-700: #0F766E  // Professional accents

// Neutral Grey (Foundation)
--neutral-700: #36454F  // Body text
--neutral-600: #4B5563  // Secondary text
--neutral-300: #D1D5DB  // Borders
```

## **Trust-Building Requirements:**
- Include trust elements above the fold
- Transparent pricing without hidden fees
- Authentic customer photos (no generic stock)
- Clear repair process explanation

## **Component Variants Pattern:**
```typescript
// Define variants with cva
const buttonVariants = cva(
  "inline-flex items-center justify-center font-medium transition-colors",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80"
      },
      size: { sm: "h-8 px-3", md: "h-9 px-4", lg: "h-10 px-6" }
    },
    defaultVariants: { variant: "primary", size: "md" }
  }
);

// Use in components
export const Button = ({ variant, size, className, ...props }) => (
  <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
);
```