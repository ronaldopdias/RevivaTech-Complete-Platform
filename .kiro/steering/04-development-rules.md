---
inclusion: always
---

# 🚨 CRITICAL DEVELOPMENT RULES

## Configuration-Driven Development

### The Golden Rule: Never Hardcode
```typescript
// ❌ NEVER DO THIS
const Button = () => (
  <button className="bg-blue-500 text-white">
    Click me
  </button>
);

// ✅ ALWAYS DO THIS
const Button = ({ variant, children, className }) => {
  const variants = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80"
  };
  
  return (
    <button className={cn(variants[variant], className)}>
      {children}
    </button>
  );
};
```

### Nordic Design System
```typescript
// Design tokens from config/theme/nordic.theme.ts
const theme = {
  colors: {
    primary: '#007AFF',        // Apple Blue
    neutral: '#1D1D1F',        // Deep charcoal
    background: '#FFFFFF',     // Pure white
    surface: '#F9FAFB',        // Light gray
  },
  typography: {
    heading: 'SF Pro Display, Inter, sans-serif',
    body: 'SF Pro Text, Inter, sans-serif',
  },
  spacing: {
    base: 8,
    scale: { xs: 8, sm: 16, md: 24, lg: 32, xl: 48 }
  }
};
```

## ❌ NEVER DO
- Skip reading Implementation.md before starting any task
- Hardcode values that should be in configuration
- Create components without proper TypeScript types
- Use inline styles instead of Tailwind classes
- **CRITICAL**: Modify `/opt/webapps/website/` or `/opt/webapps/CRM/` directories
- **CRITICAL**: Use ports 3000, 3001, 5000, 5001, 3308, 5433, 6380, 6381
- Work on external projects outside `/opt/webapps/revivatech/`
- Reference components from other projects or shared libraries
- Touch Docker containers: `website_*`, `crm_*`

## ✅ ALWAYS DO
- Read `/Docs/Implementation.md` for current stage and available tasks
- Follow configuration-driven development patterns
- Use TypeScript strict mode
- Reference design tokens from theme configuration
- Test components with different variants
- Follow the Nordic design system
- Work only within the RevivaTech project boundaries
- Use the container infrastructure properly

## Task Execution Protocol

### Before Starting Any Task
1. **Read** `/opt/webapps/CLAUDE_INFRASTRUCTURE_SETUP.md` - complete server setup
2. **Read** `/Docs/Implementation.md` - current stage and available tasks
3. **Check** infrastructure health: `curl http://localhost:3010/health`
4. **Verify** container status: `docker ps | grep revivatech`
5. **Review** related documentation in `/Docs/`
6. **Create** todo list for complex tasks

### Development Process
1. **Configuration First**: Create/update config files before coding
2. **Component Patterns**: Follow established component patterns
3. **Type Safety**: Use TypeScript for all new code
4. **Design System**: Use Nordic design tokens for all styling
5. **Testing**: Test components with different variants
6. **Container Awareness**: Remember changes go to running containers

### Completion Criteria
Mark tasks complete ONLY when:
- ✅ Code follows TypeScript strict mode
- ✅ Components use proper variant patterns
- ✅ No hardcoded values remain
- ✅ All styles use design tokens
- ✅ Changes reflected in running containers
- ✅ Hot reload working properly
- ✅ Documentation updated if needed