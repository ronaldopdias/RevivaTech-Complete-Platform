# API Protection Rules Added to CLAUDE.md

**Date:** July 22, 2025  
**Purpose:** Prevent authentication-breaking mistakes in future sessions

## New Rules Added

### 🚫 Critical API Configuration Rules (Lines 15-61)

**NEVER make these mistakes that break authentication:**

❌ **NEVER use empty string ("") as API base URL for auth services**
- This routes calls through Next.js proxy which doesn't have auth endpoints
- Breaks Tailscale IP access and external domains

❌ **NEVER use static API endpoint URLs**
- Static URLs are evaluated once at module load, not per request
- Different hostnames need different backend URLs

✅ **CORRECT API Configuration Pattern:**
```typescript
// ✅ CORRECT - Dynamic URL detection
const getApiBaseUrl = () => {
  if (typeof window === 'undefined') return 'http://localhost:3011';
  
  const hostname = window.location.hostname;
  if (hostname === '100.122.130.67') return 'http://100.122.130.67:3011';
  if (hostname.includes('revivatech.co.uk')) return 'https://api.revivatech.co.uk';
  return 'http://localhost:3011';
};

// ✅ CORRECT - Dynamic endpoint generation
const getAuthEndpoints = () => {
  const baseUrl = getApiBaseUrl();
  return { login: `${baseUrl}/api/auth/login` };
};
```

### 🚨 Mandatory API Changes Validation Protocol (Lines 298-330)

**BEFORE making ANY API configuration changes:**

1. **🔍 VALIDATE current API endpoints are working**
2. **⚠️ API CHANGE SAFETY CHECKLIST** - 5 critical questions
3. **🧪 TEST ALL ACCESS METHODS** with curl commands
4. **❌ STOP IMMEDIATELY if any test fails**

### 🚨 Updated NEVER DO Rules (Lines 634-648)

Added 4 new **AUTHENTICATION BREAKER** rules:
- ❌ Use empty string ("") as API base URL - breaks Tailscale login
- ❌ Use static API endpoint URLs - breaks hostname detection  
- ❌ Route auth calls through Next.js proxy - no auth routes exist
- ❌ Make API changes without testing all access methods first

### ✅ Updated ALWAYS DO Rules (Lines 650-664)

Added 4 new **AUTHENTICATION PROTECTION** rules:
- ✅ Use dynamic URL detection with hostname-based routing
- ✅ Generate API endpoints per-request, never statically
- ✅ Test all access methods before and after API changes
- ✅ Route auth calls directly to backend, never through Next.js

## Key Requirements for All Future API Changes

### 🔍 Pre-Change Validation
```bash
# Test current endpoints work
curl -I http://100.122.130.67:3011/api/auth/health
curl -I http://localhost:3011/api/auth/health
```

### 🧪 Post-Change Testing
```bash
# Test Tailscale authentication
curl -X POST -H "Content-Type: application/json" \
     -d '{"email":"admin@revivatech.co.uk","password":"admin123"}' \
     http://100.122.130.67:3011/api/auth/login

# Test localhost authentication  
curl -X POST -H "Content-Type: application/json" \
     -d '{"email":"admin@revivatech.co.uk","password":"admin123"}' \
     http://localhost:3011/api/auth/login
```

## Impact

These rules will prevent:
- ❌ Breaking Tailscale IP authentication (100.122.130.67:3010)
- ❌ Breaking external domain authentication (revivatech.co.uk)
- ❌ Breaking localhost authentication
- ❌ Routing auth calls through non-existent Next.js proxy routes
- ❌ Using static URLs that don't adapt to hostname context

## Files Updated

- `/opt/webapps/revivatech/CLAUDE.md` - Added comprehensive API protection rules
- `/opt/webapps/revivatech/API_PROTECTION_RULES_ADDED.md` - This summary document

These rules should prevent the same authentication-breaking mistake from happening again! 🛡️