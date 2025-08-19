# Authentication Endpoints Mapping

## Current Endpoint Conflicts

### Frontend API Routes (Next.js)

| Route | File | Purpose | Status | Issues |
|-------|------|---------|--------|--------|
| `/api/auth/[...auth]` | `frontend/src/app/api/auth/[...auth]/route.ts` | Proxy to Better Auth backend | 🔴 Conflicted | Creates confusion, proxies to backend |
| `/api/auth/session` | `frontend/src/app/api/auth/session/route.ts` | Session validation | 🔴 Conflicted | Tries to handle both auth types |
| `/api/auth/debug` | `frontend/src/app/api/auth/debug/route.ts` | Debug endpoint | 🟡 Development | Only for development |

### Backend API Routes (Express.js)

#### Legacy Authentication Routes (`backend/routes/auth.js`)
| Endpoint | Method | Purpose | Status | Issues |
|----------|--------|---------|--------|--------|
| `/api/auth/register` | POST | User registration | 🔴 Legacy | JWT-based, conflicts with Better Auth |
| `/api/auth/login` | POST | User login | 🔴 Legacy | JWT-based, conflicts with Better Auth |
| `/api/auth/logout` | POST | User logout | 🔴 Legacy | JWT-based, conflicts with Better Auth |
| `/api/auth/refresh` | POST | Token refresh | 🔴 Legacy | JWT-based, conflicts with Better Auth |
| `/api/auth/me` | GET | Get user profile | 🔴 Legacy | JWT-based, conflicts with Better Auth |
| `/api/auth/validate` | GET | Token validation | 🔴 Legacy | JWT-based, conflicts with Better Auth |
| `/api/auth/session` | GET | NextAuth-compatible session | 🔴 Legacy | Compatibility layer, not needed |
| `/api/auth/permissions` | GET | User permissions | 🔴 Legacy | JWT-based, conflicts with Better Auth |

#### Better Auth Routes (`backend/routes/better-auth.js`)
| Endpoint | Method | Purpose | Status | Issues |
|----------|--------|---------|--------|--------|
| `/api/better-auth/sign-in` | POST | User sign in | 🟡 Partial | Working but not fully integrated |
| `/api/better-auth/sign-up` | POST | User sign up | 🟡 Partial | Working but not fully integrated |
| `/api/better-auth/sign-out` | POST | User sign out | 🟡 Partial | Working but not fully integrated |
| `/api/better-auth/session` | GET | Get session | 🟡 Partial | Working but not fully integrated |
| `/api/better-auth/user` | GET | Get user profile | 🟡 Partial | Working but not fully integrated |
| `/api/better-auth/use-active-organization` | GET | Organization context | 🟡 Partial | Working but not fully integrated |
| `/api/better-auth/organization/list` | GET | List organizations | 🟡 Partial | Working but not fully integrated |

## Authentication Service Endpoint Usage

### Legacy Auth Service (`authService.ts`)
```typescript
// Uses enhanced auth service which calls:
- POST /api/auth/login
- POST /api/auth/register  
- POST /api/auth/logout
- POST /api/auth/refresh
- GET /api/auth/validate
```

### Enhanced API Auth Service (`api-auth-service.ts`)
```typescript
// Dynamic endpoint generation based on environment:
const endpoints = {
  login: `${baseUrl}/api/auth/login`,
  register: `${baseUrl}/api/auth/register`,
  logout: `${baseUrl}/api/auth/logout`,
  refresh: `${baseUrl}/api/auth/refresh`,
  validate: `${baseUrl}/api/auth/validate`,
  // ... more endpoints
}
```

### Better Auth Client (`better-auth-client.ts`)
```typescript
// Uses Better Auth client which calls:
- Better Auth endpoints through client configuration
- Proxied through frontend /api/auth/[...auth] route
```

## Endpoint Conflicts Analysis

### 1. Duplicate Functionality
- **Login**: Both `/api/auth/login` (legacy) and `/api/better-auth/sign-in` (modern)
- **Registration**: Both `/api/auth/register` (legacy) and `/api/better-auth/sign-up` (modern)
- **Logout**: Both `/api/auth/logout` (legacy) and `/api/better-auth/sign-out` (modern)
- **Session**: Both `/api/auth/session` (legacy) and `/api/better-auth/session` (modern)

### 2. Proxy Confusion
- Frontend `/api/auth/[...auth]` proxies to backend `/api/better-auth/*`
- Creates unnecessary complexity and potential routing conflicts
- Better Auth client expects direct backend access

### 3. Authentication Method Conflicts
- Legacy endpoints use JWT tokens with custom validation
- Better Auth endpoints use Better Auth sessions with different validation
- Both systems store sessions differently (user_sessions vs session table)

## Recommended Endpoint Strategy

### Phase 1: Immediate Fixes
1. **Disable legacy backend routes** - Comment out or remove `/api/auth/*` routes
2. **Update frontend proxy** - Ensure `/api/auth/[...auth]` only proxies to Better Auth
3. **Fix client configuration** - Point Better Auth client to correct endpoints

### Phase 2: Consolidation
1. **Remove frontend proxy** - Let Better Auth client call backend directly
2. **Standardize on Better Auth endpoints** - Use only `/api/better-auth/*` pattern
3. **Update all service calls** - Point to Better Auth endpoints only

### Phase 3: Cleanup
1. **Remove legacy route files** - Delete `backend/routes/auth.js`
2. **Remove legacy middleware** - Delete JWT authentication middleware
3. **Clean up frontend routes** - Remove unnecessary proxy routes

## Target Endpoint Architecture

### Backend Only (Express.js)
```
/api/better-auth/sign-in       POST   - User authentication
/api/better-auth/sign-up       POST   - User registration  
/api/better-auth/sign-out      POST   - User logout
/api/better-auth/session       GET    - Get current session
/api/better-auth/user          GET    - Get user profile
/api/better-auth/organization/* GET    - Organization management
```

### Frontend (Next.js) - Minimal
```
/api/health                    GET    - Health check only
```

## Migration Path

### Step 1: Backend Route Consolidation
```javascript
// Disable in backend/server.js or main app file:
// app.use('/api/auth', authRoutes); // DISABLE THIS

// Keep only:
app.use('/api/better-auth', betterAuthRoutes);
```

### Step 2: Frontend Client Update
```typescript
// Update Better Auth client configuration:
export const authClient = createAuthClient({
  baseURL: 'http://localhost:3011', // Direct to backend
  // Remove proxy configuration
})
```

### Step 3: Service Update
```typescript
// Replace all authentication services with single Better Auth client:
import { authClient } from '@/lib/auth/better-auth-client'

// Remove:
// - authService.ts
// - api-auth-service.ts
// - All legacy authentication imports
```

## Testing Strategy

### Endpoint Testing Checklist
- [ ] `/api/better-auth/sign-in` - User can login
- [ ] `/api/better-auth/sign-up` - User can register
- [ ] `/api/better-auth/sign-out` - User can logout
- [ ] `/api/better-auth/session` - Session validation works
- [ ] `/api/better-auth/user` - User profile retrieval works
- [ ] Legacy endpoints return 404 or disabled message
- [ ] Frontend proxy routes removed or disabled
- [ ] No authentication conflicts in browser network tab

## Security Considerations

### During Migration
1. **Invalidate all existing sessions** - Both JWT and Better Auth
2. **Force user re-authentication** - Ensure clean state
3. **Monitor for authentication bypasses** - Check for security gaps
4. **Validate session isolation** - Ensure no cross-contamination

### Post-Migration
1. **Single authentication method** - Only Better Auth active
2. **Consistent session management** - Only Better Auth sessions
3. **Proper CORS configuration** - Backend accessible from frontend
4. **Rate limiting** - Protect authentication endpoints

This endpoint mapping provides the roadmap for consolidating the authentication system to use only Better Auth endpoints and eliminate conflicts.