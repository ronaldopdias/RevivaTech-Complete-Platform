---
inclusion: always
---

# 📚 DOCUMENTATION HIERARCHY

## PRIORITY 1: MUST READ FIRST
1. **`/opt/webapps/CLAUDE_INFRASTRUCTURE_SETUP.md`** - Complete server infrastructure documentation
2. **`/Docs/PRD_RevivaTech_Brand_Theme.md`** - **CRITICAL: Brand theme, colors, and trust-building design**
3. **`/Docs/Implementation.md`** - Current implementation stages and available tasks
4. **`/INFRASTRUCTURE_SETUP.md`** - Project-specific container setup and routing
5. **`/Docs/Configuration_Standards.md`** - Configuration patterns

## PRIORITY 2: CORE DOCUMENTATION
6. **`/Docs/project_structure.md`** - Directory structure and organization
7. **`/Docs/Nordic_Design_System_Implementation.md`** - Design system usage (secondary to Brand Theme)
8. **`/Docs/Bug_tracking.md`** - Known issues and solutions

## PRIORITY 3: INFRASTRUCTURE & OPERATIONS
9. **`/opt/webapps/FINAL_SUCCESS_REPORT.md`** - Latest infrastructure changes and status
10. **`/opt/webapps/EXTERNAL_DOMAIN_TESTING_REPORT.md`** - External access testing methodology
11. **`/opt/webapps/revivatech/scripts/cloudflare-audit.sh`** - Infrastructure auditing tool

## PRIORITY 4: FEATURE-SPECIFIC
12. **`/Docs/Customer_Dashboard_Implementation.md`** - Customer portal features
13. **`/Docs/Admin_Dashboard_Enhancement.md`** - Admin interface
14. **`/CLOUDFLARE_CONFIG.md`** - Tunnel configuration

## 📂 Project Structure

```
/opt/webapps/revivatech/
├── frontend/                    # Next.js frontend application
│   ├── src/
│   │   ├── app/
│   │   │   ├── globals.css     # 🎯 MAIN CSS (imports modular architecture)
│   │   │   ├── layout.tsx      # Root layout
│   │   │   └── page.tsx        # Home page
│   │   ├── components/         # React components
│   │   │   ├── ui/            # UI components (Button, Card, etc.)
│   │   │   ├── sections/      # Page sections (Hero, Services)
│   │   │   └── layout/        # Layout components
│   │   ├── lib/               # Utilities and configurations
│   │   └── styles/            # 🆕 Modular CSS Architecture
│   │       ├── mobile-optimizations.css  # Mobile touch optimization
│   │       └── modules/       # Organized CSS modules
│   │           ├── design-tokens.css     # Colors, typography, spacing
│   │           ├── animations.css        # Keyframes, transitions
│   │           ├── utilities.css         # Utility classes, a11y
│   │           └── responsive.css        # Mobile-first responsive
│   ├── config/                # Configuration files
│   │   ├── app/              # App-wide settings
│   │   ├── components/       # Component configurations
│   │   ├── content/          # Multilingual content (EN/PT)
│   │   └── theme/           # Nordic design tokens
│   ├── package.json
│   └── next.config.ts
├── backend/                    # Node.js API (under development)
├── scripts/                   # Infrastructure scripts
│   └── cloudflare-audit.sh   # Cloudflare management
├── Docs/                     # 📚 Essential documentation
│   ├── Implementation.md     # Current stage & available tasks
│   ├── Configuration_Standards.md # Config patterns
│   └── project_structure.md  # Full structure details
├── INFRASTRUCTURE_SETUP.md   # Container & routing setup
├── CLOUDFLARE_CONFIG.md      # Tunnel configuration
└── CLAUDE.md                 # Original Claude configuration
```

## 🎭 Component Library

### Available Components
```
src/components/
├── ui/                        # Base UI components
│   ├── Button.tsx            # Button with variants
│   ├── Card.tsx              # Card layouts
│   ├── Input.tsx             # Form inputs
│   ├── Select.tsx            # Select dropdowns
│   └── index.ts              # Component exports
├── sections/                 # Page sections
│   ├── HeroSection.tsx       # Hero banners
│   ├── ServicesGrid.tsx      # Service listings
│   └── ProcessSteps.tsx      # Process flows
├── layout/                   # Layout components
│   ├── Header.tsx            # Site header
│   ├── Footer.tsx            # Site footer
│   └── MainLayout.tsx        # Main page layout
└── forms/                   # Form components
    └── BookingForm.tsx      # Repair booking form
```

### Component Usage Pattern
```typescript
// Import components from local library
import { Button, Card, Input } from '@/components/ui';
import { HeroSection } from '@/components/sections';
import { MainLayout } from '@/components/layout';

// Use with proper typing
export function HomePage() {
  return (
    <MainLayout>
      <HeroSection 
        title="Professional Repair Services"
        variant="primary"
      />
      <Card>
        <Button variant="primary" size="lg">
          Book Repair
        </Button>
      </Card>
    </MainLayout>
  );
}
```