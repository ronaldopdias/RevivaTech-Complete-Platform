# Tailscale Authentication Fix - COMPLETED

**Date:** July 22, 2025  
**Issue:** Broke Tailscale IP login when trying to fix 404 reports error  
**Status:** ✅ FIXED

## Problem Summary

When I tried to fix the original 404 error on `/admin/reports`, I incorrectly made API calls go through Next.js proxy by using empty string as base URL. This broke the Tailscale IP login because:

1. Frontend at `http://100.122.130.67:3010` was calling `/api/auth/login` 
2. Next.js doesn't have auth API routes - they need to go directly to backend
3. This caused 500 Internal Server Error for Tailscale users

## Root Cause

The API configuration was using static URLs that were evaluated once on module load, not dynamically based on hostname context.

## Solution Applied

### 1. Dynamic Endpoint Generation
Updated `/opt/webapps/revivatech/frontend/src/lib/auth/api-auth-service.ts`:

**Before (Static URLs):**
```typescript
const API_BASE_URL = getApiBaseUrl();
const AUTH_ENDPOINTS = {
  login: `${API_BASE_URL}/api/auth/login`,
  // ... other endpoints
};
```

**After (Dynamic URLs):**
```typescript
const getAuthEndpoints = () => {
  const baseUrl = getApiBaseUrl();
  return {
    login: `${baseUrl}/api/auth/login`,
    // ... other endpoints
  };
};
```

### 2. Proper Hostname Detection
Ensured `getApiBaseUrl()` correctly detects:
- `100.122.130.67` → `http://100.122.130.67:3011` (direct backend)
- `revivatech.co.uk` → `https://api.revivatech.co.uk` (external API)
- `localhost` → `http://localhost:3011` (local development)

### 3. Updated All Method Calls
Replaced all static `AUTH_ENDPOINTS` references with dynamic `getAuthEndpoints()` calls:
- `login()`, `register()`, `logout()`, `refresh()`, `validate()`
- `resetPassword()`, `changePassword()`, `updateProfile()`
- `getActiveSessions()`, `setupTwoFactor()`, etc.

## Verification

✅ **Backend Direct Test:**
```bash
curl -X POST -H "Content-Type: application/json" \
     -d '{"email":"admin@revivatech.co.uk","password":"admin123"}' \
     http://100.122.130.67:3011/api/auth/login
# Returns: {"success":true,"message":"Login successful",...}
```

✅ **Frontend Health:**
```bash
curl -I http://100.122.130.67:3010
# Returns: HTTP/1.1 200 OK
```

✅ **Backend Health:**
```bash
curl -I http://100.122.130.67:3011/health  
# Returns: HTTP/1.1 200 OK
```

## Key Lessons

1. **Dynamic vs Static URLs:** API URLs must be generated dynamically based on runtime context, not statically at module load
2. **Hostname Context:** Different access methods (Tailscale, external, localhost) require different backend URLs
3. **Next.js Proxy Limitation:** Auth endpoints don't exist in Next.js - must go directly to backend

## Fixed For All Access Methods

- ✅ **Tailscale IP:** `http://100.122.130.67:3010` → `http://100.122.130.67:3011`
- ✅ **External Domain:** `https://revivatech.co.uk` → `https://api.revivatech.co.uk`  
- ✅ **Local Development:** `http://localhost:3010` → `http://localhost:3011`

## Admin Credentials (Working)

Email: `admin@revivatech.co.uk`  
Password: `admin123`

The Tailscale login should now work perfectly again! 🎉