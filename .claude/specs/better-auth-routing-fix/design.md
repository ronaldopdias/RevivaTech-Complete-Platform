# Better Auth Routing Fix - Design Document

## Technical Architecture

### Overview

This document outlines the technical design for fixing Better Auth routing issues in the RevivaTech authentication system. The solution addresses route handler implementation, configuration management, database schema alignment, and container networking problems.

### Current Architecture Analysis

#### Problematic Components
```
/opt/webapps/revivatech/frontend/src/app/api/auth/
├── [...better-auth]/
│   └── route.ts          # ❌ Incorrect export pattern
├── better-auth-config.ts # ❌ Configuration conflict
└── better-auth-server.ts # ❌ Duplicate configuration

Backend Configuration:
├── better-auth.js        # ❌ Mixed with middleware
├── middleware/           # ❌ Auth logic scattered
└── database/             # ❌ Schema mismatches
```

#### Root Cause Analysis

1. **Route Handler Export Pattern**: Using `export { handler as GET, handler as POST }` instead of Next.js 13+ App Router pattern
2. **Configuration Duplication**: Multiple Better Auth initialization files causing conflicts
3. **Database Schema**: Column names not matching Better Auth v1.3.4 expectations
4. **Container Networking**: SSL termination and proxy issues for auth endpoints

## Solution Design

### 1. Route Handler Architecture

#### Current (Broken)
```typescript
// ❌ Wrong pattern
import { handler } from "@/lib/better-auth-server"
export { handler as GET, handler as POST }
```

#### Proposed (Fixed)
```typescript
// ✅ Correct Next.js App Router pattern
import { betterAuth } from "better-auth"
import { config } from "@/lib/better-auth-config"

const auth = betterAuth(config)

export const GET = auth.handler
export const POST = auth.handler
```

### 2. Configuration Architecture

#### Unified Configuration Strategy
```typescript
// /frontend/src/lib/better-auth-config.ts
import { betterAuth } from "better-auth"
import { 
  passkey, 
  emailOTP, 
  twoFactor 
} from "better-auth/plugins"

export const betterAuthConfig = {
  database: {
    provider: "postgresql",
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT || "5435"),
    database: process.env.DATABASE_NAME,
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    ssl: process.env.NODE_ENV === "production"
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 7 // 7 days
    }
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      // Email implementation
    }
  },
  plugins: [
    emailOTP(),
    twoFactor(),
    passkey({
      relyingPartyName: "RevivaTech"
    })
  ],
  trustedOrigins: [
    "http://localhost:3010",
    "https://localhost:3010",
    process.env.FRONTEND_URL
  ].filter(Boolean)
}

export const auth = betterAuth(betterAuthConfig)
```

### 3. Database Schema Design

#### Required Schema Updates

```sql
-- User table alignment
ALTER TABLE users 
RENAME COLUMN email_verified TO emailVerified;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS image TEXT,
ADD COLUMN IF NOT EXISTS createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Session table alignment  
CREATE TABLE IF NOT EXISTS session (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expiresAt TIMESTAMP NOT NULL,
    ipAddress TEXT,
    userAgent TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Account table for OAuth (future)
CREATE TABLE IF NOT EXISTS account (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    providerAccountId TEXT NOT NULL,
    type TEXT NOT NULL,
    accessToken TEXT,
    refreshToken TEXT,
    expiresAt TIMESTAMP,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider, providerAccountId)
);

-- Verification table for email verification
CREATE TABLE IF NOT EXISTS verification (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    token TEXT NOT NULL,
    expires TIMESTAMP NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(identifier, token)
);
```

### 4. Container Networking Design

#### Docker Configuration Updates

```yaml
# docker-compose.yml updates
services:
  revivatech_frontend:
    environment:
      - BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
      - BETTER_AUTH_URL=https://localhost:3010
      - DATABASE_URL=postgresql://revivatech_user:${DATABASE_PASSWORD}@revivatech_postgres:5432/revivatech_db
    labels:
      - "traefik.http.routers.revivatech-frontend.tls=true"
      - "traefik.http.services.revivatech-frontend.loadbalancer.server.port=3000"
```

#### Nginx/Proxy Configuration
```nginx
# Auth endpoint routing
location /api/auth/ {
    proxy_pass http://frontend:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # Better Auth specific headers
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Port $server_port;
}
```

### 5. Error Handling Design

#### Centralized Error Management
```typescript
// /lib/auth-error-handler.ts
export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

export const handleAuthError = (error: unknown) => {
  console.error('[AUTH ERROR]:', error)
  
  if (error instanceof AuthError) {
    return {
      error: error.message,
      code: error.code,
      statusCode: error.statusCode
    }
  }
  
  return {
    error: 'Internal authentication error',
    code: 'INTERNAL_ERROR',
    statusCode: 500
  }
}
```

## Implementation Strategy

### Phase 1: Route Handler Fix (Days 1-3)

#### Step 1: Update Route Handler
1. **Delete Conflicting Files**
   - Remove `better-auth-server.ts`
   - Clean up middleware conflicts
   
2. **Implement Correct Pattern**
   - Update `[...better-auth]/route.ts`
   - Use proper Next.js App Router exports
   - Add error handling

3. **Test Basic Connectivity**
   - Verify endpoints return 200 status
   - Test with curl commands
   - Check container logs

#### Step 2: Configuration Consolidation
1. **Create Unified Config**
   - Single `better-auth-config.ts` file
   - Environment variable integration
   - Plugin configuration

2. **Environment Setup**
   - Update `.env` files
   - Add missing variables
   - Validate configuration

### Phase 2: Database Alignment (Days 4-5)

#### Step 1: Schema Migration
1. **Backup Current Database**
   ```bash
   docker exec revivatech_postgres pg_dump -U revivatech_user revivatech_db > backup.sql
   ```

2. **Apply Schema Changes**
   - Run migration scripts
   - Validate data integrity
   - Update indexes

3. **Test Database Connection**
   - Verify Better Auth can connect
   - Test user operations
   - Validate session storage

### Phase 3: Container Integration (Days 6-7)

#### Step 1: Networking Configuration
1. **Update Docker Compose**
   - Add environment variables
   - Configure networking
   - Update health checks

2. **Proxy Configuration**
   - Configure SSL termination
   - Update routing rules
   - Test HTTPS endpoints

#### Step 2: SSL & Security
1. **Certificate Management**
   - Ensure SSL certificates valid
   - Configure secure cookies
   - Test cross-origin requests

## Testing Strategy

### Unit Testing
```typescript
// __tests__/auth-config.test.ts
import { betterAuthConfig } from '@/lib/better-auth-config'

describe('Better Auth Configuration', () => {
  it('should have required database configuration', () => {
    expect(betterAuthConfig.database).toBeDefined()
    expect(betterAuthConfig.database.provider).toBe('postgresql')
  })
  
  it('should have email and password enabled', () => {
    expect(betterAuthConfig.emailAndPassword.enabled).toBe(true)
  })
})
```

### Integration Testing
```bash
# Test auth endpoints
curl -X POST http://localhost:3010/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

curl -X GET http://localhost:3010/api/auth/session \
  -H "Cookie: better-auth.session_token=..."
```

### End-to-End Testing
- User registration flow
- User login flow
- Session persistence
- Password reset flow
- Error scenarios

## Monitoring & Observability

### Logging Strategy
```typescript
// Enhanced logging for auth operations
const logger = {
  auth: (operation: string, userId?: string, metadata?: any) => {
    console.log(`[AUTH] ${operation}`, {
      userId,
      timestamp: new Date().toISOString(),
      ...metadata
    })
  },
  error: (operation: string, error: any, context?: any) => {
    console.error(`[AUTH ERROR] ${operation}`, {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      ...context
    })
  }
}
```

### Health Checks
```typescript
// /api/health/auth route
export async function GET() {
  try {
    // Test database connection
    const dbHealth = await testDatabaseConnection()
    
    // Test auth configuration
    const configHealth = validateAuthConfig()
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: dbHealth,
        configuration: configHealth
      }
    })
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: error.message
    }, { status: 500 })
  }
}
```

## Security Considerations

### Authentication Security
- Secure password hashing (bcrypt minimum cost 12)
- Session token rotation
- CSRF protection enabled
- Rate limiting on auth endpoints

### Data Protection
- Sensitive data encryption at rest
- Secure cookie configuration
- HTTPS enforcement
- Input validation and sanitization

### Network Security
- Container network isolation
- Firewall rules for auth endpoints
- SSL/TLS configuration
- CORS policy enforcement

## Performance Optimization

### Database Optimization
- Connection pooling configuration
- Query optimization for auth operations
- Index optimization for user lookups
- Session cleanup automation

### Caching Strategy
- Session caching in Redis
- Configuration caching
- Query result caching
- CDN configuration for static auth assets

## Rollback Strategy

### Immediate Rollback (< 5 minutes)
1. Revert route handler changes
2. Restore previous configuration
3. Restart containers
4. Verify basic functionality

### Database Rollback (< 30 minutes)
1. Stop application containers
2. Restore database from backup
3. Revert schema changes
4. Restart with previous configuration

### Full System Rollback (< 1 hour)
1. Git revert to previous commit
2. Rebuild containers
3. Restore database backup
4. Validate full system functionality

## Success Metrics

### Technical Metrics
- Route handler response time: < 200ms
- Database query performance: < 50ms
- Error rate: < 1%
- Container startup time: < 30s

### Functional Metrics
- Authentication success rate: > 99%
- Session persistence: > 95%
- User experience ratings: > 4.5/5
- Support ticket reduction: > 80%

## Documentation Requirements

### Technical Documentation
- API endpoint documentation
- Configuration guide
- Troubleshooting guide
- Performance tuning guide

### User Documentation
- Authentication flow guide
- Error message explanations
- FAQ for common issues
- Migration notes

---

**Document Version**: 1.0  
**Architecture Review**: Pending  
**Security Review**: Pending  
**Performance Review**: Pending