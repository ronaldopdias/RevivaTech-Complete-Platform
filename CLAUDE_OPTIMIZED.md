# CLAUDE.md - RevivaTech Project Configuration

Comprehensive configuration and guidance for the RevivaTech computer repair shop platform.

## 🚨 CRITICAL: REQUIRED READING

**BEFORE making ANY changes, you MUST read:**
1. `/opt/webapps/CLAUDE_INFRASTRUCTURE_SETUP.md` - Server infrastructure documentation
2. This CLAUDE.md file for project configuration
3. `/opt/webapps/revivatech/Docs/PRD_RevivaTech_Brand_Theme.md` - Brand theme & design system
4. `/opt/webapps/revivatech/Docs/Implementation.md` - Current implementation stage

## ⛔ PROJECT BOUNDARIES

### **ALLOWED**
- **Directory**: `/opt/webapps/revivatech/` ONLY
- **Ports**: 3010 (frontend), 3011 (backend), 5435 (PostgreSQL), 6383 (Redis), 8080-8099 (dev)
- **Containers**: `revivatech_*` containers only

### **FORBIDDEN**
- **Directories**: `/opt/webapps/website/`, `/opt/webapps/CRM/`, any other `/opt/webapps/` subdirectory
- **Ports**: 3000, 3001, 5000, 5001, 3308, 5433, 6380, 6381 (belong to other projects)
- **Containers**: `website_*`, `crm_*` containers

## 🔥 MANDATORY DEVELOPMENT RULES

### **RULE 1: SYSTEMATIC SERVICE DISCOVERY (6-STEP METHODOLOGY)**

This methodology saved 16-24 weeks by discovering 90% of backend services already implemented.

#### **The 6 Steps (NEVER SKIP ANY)**

**1. IDENTIFY** - Discover existing services
   - Primary: Serena MCP semantic search tools
   - Fallback: Container exploration (`docker exec` commands)
   - Search: routes, services, models, controllers, middleware

**2. VERIFY** - Test functionality
   - Primary: Serena automated testing tools
   - Fallback: Manual API testing (curl), database checks
   - Validate: endpoints, data integrity, service mounting

**3. ANALYZE** - Compare with requirements
   - Assess: functionality coverage (≥70% = integrate)
   - Check: data completeness, API coverage, integration status
   - Score: quality, performance, security

**4. DECISION** - Choose integration vs creation
   - Integrate if: ≥3 criteria met (functionality, schema, APIs, mountable, auth, <25% effort)
   - Create if: no functionality found, incompatible, or integration > recreation effort

**5. TEST** - End-to-end verification
   - Test: service mounting, API responses, database queries
   - Verify: frontend integration, authentication, error handling
   - Measure: performance metrics

**6. DOCUMENT** - Track everything
   - Create: Discovery report, integration log, test results
   - Record: performance metrics, maintenance requirements
   - Generate: RULE 1 Completion Report (see templates)

### **RULE 2: CONFIGURATION FILE SAFETY**
- **Read ENTIRE file** before modifying
- **Check for placeholders** (API keys, tokens, URLs)
- **Verify service dependencies**
- **NEVER simplify** comprehensive configs
- **ASK before removing** anything

### **RULE 3: CONNECTION OVER CREATION**
- **Prefer mounting/connecting** existing services
- **Fix configurations** rather than rebuild
- **Update connections** in server.js/providers
- **Test integration** thoroughly

### **RULE 4: API CONFIGURATION**
```typescript
// ✅ CORRECT - Dynamic URL detection
const getApiBaseUrl = () => {
  if (typeof window === 'undefined') return 'http://localhost:3011';
  const hostname = window.location.hostname;
  if (hostname === '100.122.130.67') return 'http://100.122.130.67:3011';
  if (hostname.includes('revivatech.co.uk')) return 'https://api.revivatech.co.uk';
  return 'http://localhost:3011';
};

// ❌ WRONG - Never use empty string or static URLs
const getApiBaseUrl = () => ''; // Breaks authentication
const API_BASE_URL = getApiBaseUrl(); // Static evaluation breaks hostname detection
```

## 🏗️ PROJECT OVERVIEW

### **Tech Stack**
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, PostgreSQL, Redis
- **Infrastructure**: Docker, nginx, Cloudflare tunnel
- **Design**: RevivaTech Brand Theme + Nordic Design System

### **Key Features**
- Multi-step booking system with device database
- Real-time customer dashboard with repair tracking
- Admin interface with analytics and queue management
- Multilingual support (EN/PT)
- PWA capabilities with offline support

### **Container Architecture**
- `revivatech_new_frontend` (3010) - English site
- `revivatech_new_backend` (3011) - API backend
- `revivatech_new_database` (5435) - PostgreSQL
- `revivatech_new_redis` (6383) - Cache
- `website_frontend_pt_dev` (3000) - Portuguese site (separate project)

## 🎨 BRAND & DESIGN SYSTEM

### **Primary Colors (MUST USE)**
```scss
// Trust Blue (Primary - customer confidence)
--trust-500: #ADD8E6     // Main CTAs
--trust-700: #4A9FCC     // Text and accents
--trust-900: #1A5266     // Headers

// Professional Teal (Secondary - expertise)
--professional-500: #008080  // Secondary CTAs
--professional-700: #0F766E  // Accents
--professional-900: #134E4A  // Supporting

// Neutral Grey (Foundation)
--neutral-700: #36454F   // Body text
--neutral-600: #4B5563   // Secondary text
--neutral-300: #D1D5DB   // Borders
```

### **Trust-Building Requirements**
- Include trust signals above the fold
- Show transparent pricing
- Use authentic customer photos
- Explain repair process clearly
- Display guarantees and warranties

### **Required Components**
- TrustSignal, TestimonialCard, PricingDisplay
- ProcessStep, CertificationBadge
- All must follow brand guidelines

## 🔧 UNIFIED CHANGE MANAGEMENT PROTOCOL

### **For ANY Change (Code, API, Config):**

1. **PRE-CHANGE VALIDATION**
   ```bash
   # Check current state
   docker ps | grep revivatech
   curl -I http://localhost:3010
   curl -I http://localhost:3011/health
   ```

2. **MAKE CHANGES**
   - Follow configuration-driven patterns
   - Use TypeScript strict mode
   - Apply design tokens
   - Test with variants

3. **POST-CHANGE REQUIREMENTS**
   ```bash
   # Restart affected containers
   docker restart revivatech_new_frontend  # or backend
   
   # Clear caches
   docker exec revivatech_new_frontend rm -rf /app/.next /app/node_modules/.cache
   
   # Verify changes
   curl -I http://localhost:3010
   docker logs revivatech_new_frontend --tail 10
   ```

4. **DOCUMENTATION UPDATE**
   - Update `/Docs/Implementation.md` with progress
   - Mark completed features in PRDs
   - Create completion reports for major work
   - Update bug tracking if applicable

5. **API-SPECIFIC TESTING** (if API changes)
   ```bash
   # Test all access methods
   curl -X POST -H "Content-Type: application/json" \
        -d '{"email":"admin@revivatech.co.uk","password":"admin123"}' \
        http://100.122.130.67:3011/api/auth/login
   ```

## 📋 TASK EXECUTION CHECKLIST

### **Before Starting**
- [ ] Read infrastructure setup and implementation docs
- [ ] Check container health
- [ ] Review related documentation
- [ ] Execute RULE 1 methodology (all 6 steps)
- [ ] Create todo list for complex tasks

### **During Development**
- [ ] Configuration-first approach
- [ ] Follow component patterns
- [ ] Use TypeScript strict mode
- [ ] Apply design tokens
- [ ] Test variants

### **Completion Criteria**
- [ ] RULE 1 methodology completed
- [ ] Code follows standards
- [ ] No hardcoded values
- [ ] Container restarted and cache cleared
- [ ] Changes verified at http://localhost:3010
- [ ] Documentation updated
- [ ] Completion report created

## 🚀 CURRENT STATUS (July 22, 2025)

**Phase 3 Complete** - Production backend operational
- 65% overall completion
- 6 comprehensive backend services discovered
- 41 tables, 135 device models, JWT auth ready
- Saved 16-24 weeks development time

**Current Stage**: Stage 3 - Repair Booking (25% complete)
- Backend APIs ready, frontend integration needed
- Focus: booking flow, authentication, customer portal

## 📚 QUICK REFERENCE

### **Container Commands**
```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep revivatech
docker restart revivatech_new_frontend
docker logs revivatech_new_frontend --tail 20
curl http://localhost:3010/health
```

### **CSS Modular Architecture**
```bash
# Edit specific modules (avoids token limits)
/opt/webapps/revivatech/frontend/src/styles/modules/
├── design-tokens.css    # Colors, typography
├── animations.css       # Keyframes, transitions
├── utilities.css        # Utility classes
└── responsive.css       # Mobile optimization
```

### **Infrastructure Health Check**
```bash
echo "=== Container Status ===" && docker ps | grep revivatech
echo "=== Services ===" && curl -I http://localhost:3010 | head -1
echo "=== Tunnel ===" && systemctl status cloudflared --no-pager
```

## 📄 APPENDIX: TEMPLATES

### **RULE 1 Completion Report Template**
```markdown
## RULE 1 METHODOLOGY COMPLETION REPORT
**Task:** [Description]
**Date:** [YYYY-MM-DD]

### STEP 1: IDENTIFY ✅
- Services Found: [List]
- Discovery Method: [Serena/Manual]

### STEP 2: VERIFY ✅
- Working Endpoints: [List]
- Data Verified: [Yes/No]

### STEP 3: ANALYZE ✅
- Coverage: [X%]
- Recommendation: [Integrate/Create]

### STEP 4: DECISION ✅
- Choice: [Integration/Creation]
- Justification: [Reason]

### STEP 5: TEST ✅
- Status: [Success/Issues]
- Performance: [Metrics]

### STEP 6: DOCUMENT ✅
- Time Saved: [X weeks]
- Next Steps: [Actions]
```

---

**RevivaTech Configuration v3.0** | Production Backend + Development Frontend
*Remember: Always follow RULE 1 methodology and update documentation*