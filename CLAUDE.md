# CLAUDE.md - RevivaTech Project Configuration

## 🚨 CRITICAL: ALWAYS READ FIRST

**BEFORE making ANY changes to RevivaTech:**
1. `/opt/webapps/CLAUDE_INFRASTRUCTURE_SETUP.md` - Complete server infrastructure
2. `/opt/webapps/revivatech/Docs/PRD_RevivaTech_Brand_Theme.md` - **CRITICAL: Brand theme & design**
3. `/opt/webapps/revivatech/Docs/Implementation.md` - Current implementation stage

## 🔥 MANDATORY DEVELOPMENT RULES

### **🚨 RULE 1 METHODOLOGY: 6-STEP SYSTEMATIC PROCESS**
**MANDATORY FOR EVERY TASK - NEVER SKIP ANY STEP**

*This methodology saved 16-24 weeks by discovering 90% of backend services already implemented.*

#### **STEP 1: IDENTIFY**
**Discover existing services BEFORE building new ones:**
```bash
# Primary: Use Serena MCP tools for AI-powered discovery
# Fallback: Manual container exploration
docker exec revivatech_backend find /app -name "*.js" -type f | grep -E "(route|service|controller|api)"
docker exec revivatech_backend ls -la /app/routes/ /app/services/
```

#### **STEP 2: VERIFY** 
**Test discovered functionality:**
```bash
# Test API endpoints
curl -X GET http://localhost:3011/api/[discovered-endpoint]
# Verify database tables
docker exec revivatech_database psql -U revivatech -d revivatech -c "\dt"
```

#### **STEP 3: ANALYZE**
**Compare existing vs required functionality:**
- [ ] Core functionality exists (≥70% of requirements)
- [ ] Database schema and data present
- [ ] API endpoints implemented
- [ ] Service can be mounted/connected
- [ ] Authentication framework exists

#### **STEP 4: DECISION**
**Choose integration over recreation:**
- **INTEGRATE** when ≥3 analysis criteria met
- **CREATE NEW** only when no existing functionality found

#### **STEP 5: TEST**
**End-to-end integration verification:**
- [ ] Service properly mounted in server.js
- [ ] API endpoints respond correctly
- [ ] Database queries execute successfully
- [ ] Frontend integration working
- [ ] Authentication/authorization functional

#### **STEP 6: DOCUMENT**
**Create completion report:**
```markdown
## RULE 1 COMPLETION REPORT
**Task:** [Description]
**Date:** [YYYY-MM-DD]
**Time Saved:** [Estimated weeks]
**Services Found:** [List discovered services]
**Integration Status:** [Success/Issues]
**Next Steps:** [Action items]
```

#### **❌ VIOLATIONS RESULT IN:**
- Duplicate work and wasted development time
- Missing existing functionality
- Incomplete integration breaking systems

### **🚨 RULE 2: CONFIGURATION FILE SAFETY**
**BEFORE deleting/reducing ANY configuration:**
1. Read ENTIRE file to understand purpose
2. Check if lines are placeholders for API keys/tokens
3. Verify sections support existing services
4. ASK USER before removing anything

### **🚨 RULE 3: CONNECTION OVER CREATION**
**Always prefer:**
1. Mount/connect existing services vs building new
2. Fix configuration issues in existing implementations
3. Update service connections in server.js/providers

## 🚫 PROJECT BOUNDARIES - ABSOLUTE RESTRICTIONS

### **FORBIDDEN DIRECTORIES:**
❌ **NEVER touch:** `/opt/webapps/website/`, `/opt/webapps/CRM/`, any `/opt/webapps/` except `revivatech/`

### **FORBIDDEN PORTS:**
❌ **NEVER use:** 3000, 3001, 5000, 5001, 3308, 5433, 6380, 6381 (other projects)
✅ **ONLY use:** 3010, 3011, 5435, 6383, 8080-8099 (RevivaTech only)

### **FORBIDDEN NETWORK ADDRESSES:**
❌ **NEVER use Tailscale IPs:** Any IP in 100.x.x.x range (e.g., 100.122.130.67)
❌ **NEVER hardcode Tailscale endpoints** in configuration files
❌ **NEVER reference Tailscale hostnames** in production code
✅ **ONLY use:** localhost, domain names (revivatech.co.uk), or environment variables

### **CRITICAL API CONFIGURATION:**
❌ **NEVER:** Use empty string ("") as API base URL - breaks hostname detection
❌ **NEVER:** Use static API endpoint URLs - breaks hostname detection
❌ **NEVER:** Use Tailscale IP addresses (100.x.x.x range) in code or configuration
✅ **ALWAYS:** Use dynamic URL detection with hostname-based routing

```typescript
// ✅ CORRECT
const getApiBaseUrl = () => {
  if (typeof window === 'undefined') return 'http://localhost:3011';
  const hostname = window.location.hostname;
  if (hostname === '100.122.130.67') return 'http://100.122.130.67:3011';
  if (hostname.includes('revivatech.co.uk')) return 'https://api.revivatech.co.uk';
  return 'http://localhost:3011';
};
```

### **VALIDATION CHECKLIST:**
- [ ] Working in `/opt/webapps/revivatech/` only
- [ ] Using allowed ports only (3010, 3011, 5435, 6383, 8080-8099)
- [ ] No references to other projects
- [ ] Dynamic API configuration
- [ ] **NO Tailscale IPs (100.x.x.x range) in any code or configuration**
- [ ] No hardcoded network addresses except localhost

## 🔧 ESSENTIAL COMMANDS

### **Container Management:**
```bash
# Check RevivaTech containers
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep revivatech

# Restart services
docker restart revivatech_frontend  # Port 3010
docker restart revivatech_backend   # Port 3011

# Check health
curl http://localhost:3010/health
curl http://localhost:3011/health
```

### **API Validation Protocol:**
```bash
# BEFORE API changes, test current endpoints
curl -I http://localhost:3011/api/auth/health       # Local

# AFTER changes, test all access methods
curl -X POST -H "Content-Type: application/json" \
     -d '{"email":"admin@revivatech.co.uk","password":"AdminPass123"}' \
     http://localhost:3011/api/auth/login
```

### **Code Change Protocol:**
```bash
# MANDATORY after ANY code change:
docker restart revivatech_frontend  # For frontend changes
docker exec revivatech_frontend rm -rf /app/.next /app/node_modules/.cache
curl -I http://localhost:3010  # Verify live
docker logs revivatech_frontend --tail 10  # Check errors
```

### **CSS/Styling (Modular Architecture):**
```bash
# Edit specific CSS modules (prevents token limits)
Read /opt/webapps/revivatech/frontend/src/styles/modules/design-tokens.css
Read /opt/webapps/revivatech/frontend/src/styles/modules/animations.css
Read /opt/webapps/revivatech/frontend/src/styles/modules/utilities.css
Read /opt/webapps/revivatech/frontend/src/styles/modules/responsive.css

# Trigger recompilation
docker exec revivatech_frontend touch /app/src/app/globals.css
```

## 🎨 BRAND THEME & DESIGN

### **CRITICAL:** Always reference `/Docs/PRD_RevivaTech_Brand_Theme.md` before creating pages/components

### **Primary Brand Colors:**
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

### **Trust-Building Requirements:**
- Include trust elements above the fold
- Transparent pricing without hidden fees
- Authentic customer photos (no generic stock)
- Clear repair process explanation

## ⚙️ CONFIGURATION PATTERNS

### **Component Variants Pattern:**
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

## 🏗️ INFRASTRUCTURE OVERVIEW

**Container Structure:**
- `revivatech_frontend` (3010) - English site
- `revivatech_backend` (3011) - API backend  
- `revivatech_database` (5435) - PostgreSQL
- `revivatech_redis` (6383) - Cache

**Domain Routing:**
- `revivatech.co.uk` → port 3010 (English)
- `revivatech.com.br` → port 3000 (Portuguese)

## 📂 PROJECT STRUCTURE

```
/opt/webapps/revivatech/
├── frontend/                 # Next.js frontend
│   ├── src/
│   │   ├── app/             # Next.js app router
│   │   ├── components/      # React components
│   │   │   ├── ui/         # Base UI (Button, Card, Input)
│   │   │   ├── sections/   # Page sections
│   │   │   └── layout/     # Layout components
│   │   ├── lib/            # Utilities
│   │   └── styles/         # Modular CSS architecture
│   │       └── modules/    # design-tokens, animations, utilities, responsive
│   ├── config/             # Configuration files
│   └── package.json
├── backend/                 # Node.js API
├── Docs/                   # Documentation
└── scripts/                # Infrastructure scripts
```

## 🚨 CRITICAL DEVELOPMENT RULES

### **NEVER DO:**
❌ Skip RULE 1 METHODOLOGY (all 6 steps mandatory)
❌ Build new services without IDENTIFY step
❌ Complete tasks without DOCUMENT step
❌ Modify `/opt/webapps/website/` or `/opt/webapps/CRM/`
❌ Use forbidden ports or touch other project containers
❌ Complete work without updating documentation

### **ALWAYS DO:**
✅ Execute complete RULE 1 METHODOLOGY for ANY development task
✅ Read `/Docs/Implementation.md` before starting
✅ Use configuration-driven development patterns
✅ Follow TypeScript strict mode and Nordic design system
✅ Restart containers and clear cache after code changes
✅ Update documentation and create completion reports
✅ Test all API access methods before/after changes

## 📋 TASK EXECUTION PROTOCOL

### **Before Starting ANY Task:**
1. Read infrastructure and implementation docs
2. Check infrastructure health: `curl http://localhost:3010/health`
3. Verify containers: `docker ps | grep revivatech`
4. **EXECUTE RULE 1 METHODOLOGY** (all 6 steps)
5. Create todo list for complex tasks

### **Completion Criteria:**
✅ RULE 1 METHODOLOGY completed and documented
✅ Code follows TypeScript strict mode
✅ Components use proper variant patterns
✅ Container restarted and cache cleared
✅ Changes verified live at http://localhost:3010
✅ Documentation updated with progress

## 📚 DOCUMENTATION HIERARCHY

### **Priority 1 - Must Read:**
1. `/opt/webapps/CLAUDE_INFRASTRUCTURE_SETUP.md` - Infrastructure
2. `/Docs/PRD_RevivaTech_Brand_Theme.md` - Brand theme
3. `/Docs/Implementation.md` - Current stage/tasks

### **Priority 2 - Core:**
4. `/Docs/Configuration_Standards.md` - Patterns
5. `/Docs/project_structure.md` - Structure
6. `/Docs/Bug_tracking.md` - Issues

## 🚀 CURRENT PROJECT STATUS

### **Phase 3 Complete - Production Backend Operational**
**Progress:** 65% Complete
**Achievement:** Mock-to-Real API transformation (saved 16-24 weeks)

**Ready for Integration:**
✅ Device database API (27 brands, 135 models)
✅ Customer management API 
✅ Booking system API
✅ Pricing engine API
✅ Authentication API (JWT)

### **Stage 3 Completed Tasks:**
✅ **API Proxy Connection** - Frontend-backend communication restored
✅ **Database Schema Alignment** - User/booking table conflicts resolved  
✅ **Authentication Implementation** - Better Auth fully operational
✅ **Admin Dashboard Integration** - Real management APIs connected

### **Stage 4 Ready Tasks:**
1. **Frontend Health Check** - Complete remaining proxy routes
2. **Database Data Seeding** - Add demo customers, devices, bookings
3. **Missing Route Implementation** - Complete API endpoint coverage
4. **User Experience Optimization** - Streamline workflows

### **Infrastructure Status:**
✅ All external domains HTTPS accessible
✅ Frontend-Backend proxy communication working
✅ Backend API, Database, Redis operational  
✅ Better Auth authentication system functional
✅ Admin customer management API operational

---

**RevivaTech Platform Status**: 🚀 **STAGE 4 READY - FRONTEND-BACKEND INTEGRATED**

*Integrated Frontend + Backend | Last Updated: August 22, 2025*