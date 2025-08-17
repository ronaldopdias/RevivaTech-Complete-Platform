# Better Auth Environment Configuration Optimization - Implementation Tasks

## Task Overview

This document provides a detailed, step-by-step implementation plan for optimizing Better Auth environment configuration. Tasks are organized by phases and include specific file changes, testing procedures, and validation criteria.

## Phase 1: Environment Configuration Foundation (Week 1)

### Task 1.1: Environment Variable Standardization
**Priority**: Critical  
**Estimated Time**: 2 hours  
**Dependencies**: None

#### Subtasks:
1. **Audit Current Environment Variables**
   ```bash
   # Review all .env files for inconsistencies
   find /opt/webapps/revivatech -name "*.env*" -exec grep -H "BETTER_AUTH\|AUTH_URL\|API_URL" {} \;
   ```

2. **Standardize Naming Convention**
   - Update all environment files to use consistent naming
   - Remove deprecated environment variables
   - Document new naming convention

3. **Files to Update**:
   - `/frontend/.env.local`
   - `/frontend/.env.production`
   - `/frontend/.env.staging`
   - `/backend/.env`
   - `/backend/.env.example`

#### Implementation Details:
```bash
# New standardized environment variables
NEXT_PUBLIC_BETTER_AUTH_URL=<environment-specific-url>
BETTER_AUTH_SECRET=<secure-secret-key>
BETTER_AUTH_DATABASE_URL=<database-connection-string>
```

#### Acceptance Criteria:
- [ ] All environment files use consistent variable names
- [ ] No deprecated variables remain
- [ ] Environment variable documentation updated
- [ ] All environments tested with new variables

#### Validation:
```bash
# Verify environment variable consistency
grep -r "BETTER_AUTH" /opt/webapps/revivatech/frontend/.env* | sort | uniq
```

### Task 1.2: Create Environment-Aware URL Resolver
**Priority**: Critical  
**Estimated Time**: 4 hours  
**Dependencies**: Task 1.1

#### Implementation:
1. **Create BetterAuthUrlResolver Class**
   - File: `/frontend/src/lib/auth/better-auth-url-resolver.ts`
   - Implement interface defined in design document
   - Integrate with existing `EnvironmentAwareUrlResolver`

2. **Implementation Code**:
```typescript
// File: /frontend/src/lib/auth/better-auth-url-resolver.ts
import { EnvironmentAwareUrlResolver } from '@/lib/utils/api-config';

export interface AuthUrlResolver {
  getBaseUrl(): string;
  getApiUrl(): string;
  getTrustedOrigins(): string[];
  isSecureContext(): boolean;
}

export class BetterAuthUrlResolver implements AuthUrlResolver {
  private urlResolver: EnvironmentAwareUrlResolver;
  
  constructor() {
    this.urlResolver = new EnvironmentAwareUrlResolver();
  }
  
  getBaseUrl(): string {
    // Server-side: use internal URLs
    if (this.urlResolver.isServerSide()) {
      return this.urlResolver.getInternalApiUrl();
    }
    
    // Client-side: use current origin for same-domain requests
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    
    // Fallback: environment variable
    return process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'http://localhost:3010';
  }
  
  getTrustedOrigins(): string[] {
    const baseOrigins = [
      this.getBaseUrl(),
      this.urlResolver.getApiUrl()
    ];
    
    // Add environment-specific origins
    if (this.urlResolver.isDevelopment()) {
      return [...baseOrigins, 'http://localhost:3010', 'http://localhost:3011'];
    }
    
    if (this.urlResolver.isProduction()) {
      return [...baseOrigins, 'https://revivatech.co.uk', 'https://api.revivatech.co.uk'];
    }
    
    return baseOrigins;
  }
  
  isSecureContext(): boolean {
    return this.urlResolver.isProduction() || 
           (typeof window !== 'undefined' && window.location.protocol === 'https:');
  }
  
  getApiUrl(): string {
    return this.urlResolver.getApiUrl();
  }
}
```

#### Testing:
```typescript
// File: /frontend/src/lib/auth/__tests__/better-auth-url-resolver.test.ts
describe('BetterAuthUrlResolver', () => {
  // Test cases for each environment
  // Test edge cases and fallbacks
});
```

#### Acceptance Criteria:
- [ ] BetterAuthUrlResolver class created and tested
- [ ] Integration with existing EnvironmentAwareUrlResolver
- [ ] Unit tests pass for all environments
- [ ] No hardcoded URLs in implementation

### Task 1.3: Environment-Aware Cookie Configuration
**Priority**: Critical  
**Estimated Time**: 2 hours  
**Dependencies**: Task 1.2

#### Implementation:
1. **Create Cookie Configuration Utility**
   - File: `/frontend/src/lib/auth/better-auth-cookie-config.ts`

```typescript
// File: /frontend/src/lib/auth/better-auth-cookie-config.ts
import { Environment } from '@/lib/utils/api-config';

export interface CookieConfig {
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  domain?: string;
  httpOnly: boolean;
  maxAge: number;
}

export function getCookieConfig(environment: Environment): CookieConfig {
  const isProduction = environment === Environment.PRODUCTION;
  const isSecure = isProduction || 
    (typeof window !== 'undefined' && window.location.protocol === 'https:');
  
  return {
    secure: isSecure,
    sameSite: 'lax', // Compatible with most scenarios
    domain: isProduction ? '.revivatech.co.uk' : undefined,
    httpOnly: true, // Security best practice
    maxAge: 30 * 24 * 60 * 60 // 30 days
  };
}

export function getSessionCookieConfig() {
  // Detect environment and return appropriate config
  const environment = process.env.NODE_ENV === 'production' 
    ? Environment.PRODUCTION 
    : Environment.DEVELOPMENT;
    
  return {
    name: "better-auth.session-token",
    ...getCookieConfig(environment),
  };
}
```

#### Testing:
```typescript
// Test cookie configuration for each environment
describe('Cookie Configuration', () => {
  test('development uses insecure cookies', () => {
    const config = getCookieConfig(Environment.DEVELOPMENT);
    expect(config.secure).toBe(false);
    expect(config.domain).toBeUndefined();
  });
  
  test('production uses secure cookies', () => {
    const config = getCookieConfig(Environment.PRODUCTION);
    expect(config.secure).toBe(true);
    expect(config.domain).toBe('.revivatech.co.uk');
  });
});
```

#### Acceptance Criteria:
- [ ] Cookie configuration utility created
- [ ] Environment-specific cookie settings implemented
- [ ] Unit tests pass for all scenarios
- [ ] Security requirements met for production

## Phase 2: Better Auth Configuration Update (Week 1-2)

### Task 2.1: Update Better Auth Server Configuration
**Priority**: Critical  
**Estimated Time**: 6 hours  
**Dependencies**: Tasks 1.1, 1.2, 1.3

#### Implementation:
1. **Update better-auth-server.ts**
   - File: `/frontend/src/lib/auth/better-auth-server.ts`
   - Replace hardcoded configurations with dynamic resolution
   - Integrate new URL resolver and cookie configuration

2. **Code Changes**:
```typescript
// File: /frontend/src/lib/auth/better-auth-server.ts
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { organization, twoFactor, bearer } from "better-auth/plugins"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "../../../auth-schema"
import { BetterAuthUrlResolver } from './better-auth-url-resolver'
import { getSessionCookieConfig } from './better-auth-cookie-config'

// Create resolver instances
const authUrlResolver = new BetterAuthUrlResolver();

// Enhanced database URL resolution
const getDatabaseURL = () => {
  console.log('[Better Auth] Environment check - NODE_ENV:', process.env.NODE_ENV);
  
  // Priority order for database URL resolution
  const candidates = [
    process.env.BETTER_AUTH_DATABASE_URL,
    process.env.DATABASE_URL,
    // Container fallback
    `postgresql://revivatech:revivatech_password@revivatech_database:5432/revivatech`
  ];
  
  for (const url of candidates) {
    if (url && !url.includes('PLACEHOLDER')) {
      console.log('[Better Auth] Using database URL pattern:', url.replace(/\/\/([^:]+):([^@]+)@/, '//[USER]:[PASSWORD]@'));
      return url;
    }
  }
  
  throw new Error('[Better Auth] No valid database URL found');
};

// Enhanced database connection
const client = postgres(getDatabaseURL(), {
  max: process.env.NODE_ENV === 'production' ? 10 : 2,
  idle_timeout: 20,
  connect_timeout: 60,
  ssl: process.env.NODE_ENV === 'production' && !getDatabaseURL().includes('localhost'),
  transform: {
    undefined: null
  }
});

const db = drizzle(client, { 
  schema,
  casing: 'preserve'
});

// Enhanced Better Auth configuration
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
      organization: schema.organization,
      member: schema.member,
      invitation: schema.invitation,
      twoFactor: schema.twofactor,
    }
  }),
  
  // Dynamic base URL resolution
  baseURL: authUrlResolver.getBaseUrl(),
  
  // Enhanced secret resolution
  secret: (() => {
    const secret = process.env.BETTER_AUTH_SECRET || process.env.JWT_SECRET;
    if (!secret && process.env.NODE_ENV === 'production') {
      throw new Error('BETTER_AUTH_SECRET is required in production');
    }
    return secret || 'development-secret-key';
  })(),
  
  // Environment-aware email and password configuration
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: process.env.NODE_ENV === 'production',
  },
  
  // Dynamic session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // Update session every 24 hours
  },
  
  // Enhanced user configuration
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "CUSTOMER"
      },
      firstName: {
        type: "string",
        required: true
      },
      lastName: {
        type: "string", 
        required: true
      },
      phone: {
        type: "string",
        required: false
      },
      isActive: {
        type: "boolean",
        required: false,
        defaultValue: true
      },
      isVerified: {
        type: "boolean",
        required: false,
        defaultValue: false
      }
    }
  },
  
  // Dynamic cookie configuration
  cookies: {
    sessionToken: getSessionCookieConfig()
  },
  
  // Dynamic plugins configuration
  plugins: [
    organization({
      allowUserToCreateOrganization: true,
      organizationLimit: 5,
    }),
    twoFactor(),
    bearer(),
  ],
  
  // Dynamic trusted origins
  trustedOrigins: authUrlResolver.getTrustedOrigins(),
  
  // Environment-aware rate limiting
  rateLimit: {
    window: 15 * 60, // 15 minutes
    max: process.env.NODE_ENV === 'development' ? 100 : 5,
  },
});

export type Auth = typeof auth
export const { GET, POST } = auth.handler

// Enhanced logging
console.log('[Better Auth] Configuration initialized:', {
  environment: process.env.NODE_ENV,
  baseURL: authUrlResolver.getBaseUrl(),
  trustedOrigins: authUrlResolver.getTrustedOrigins(),
  cookieSecure: getSessionCookieConfig().secure,
});
```

#### Testing:
```bash
# Test database connection
npm run test:auth:db

# Test configuration in different environments
NODE_ENV=development npm run test:auth:config
NODE_ENV=production npm run test:auth:config
```

#### Acceptance Criteria:
- [ ] Server configuration uses dynamic URL resolution
- [ ] Cookie configuration is environment-aware
- [ ] Database connection is robust with fallbacks
- [ ] Trusted origins are dynamically generated
- [ ] All environments tested successfully

### Task 2.2: Update Better Auth Client Configuration
**Priority**: Critical  
**Estimated Time**: 4 hours  
**Dependencies**: Task 2.1

#### Implementation:
1. **Update better-auth-client.ts**
   - File: `/frontend/src/lib/auth/better-auth-client.ts`
   - Replace hardcoded URL logic with relative URL pattern
   - Integrate with existing API configuration

2. **Key Changes**:
```typescript
// File: /frontend/src/lib/auth/better-auth-client.ts (key sections)

// Remove hardcoded URL resolution
function getAuthClientBaseURL(): string {
  // Client-side: always use relative URLs for same-origin requests
  if (typeof window !== 'undefined') {
    return '/api/auth';
  }
  
  // Server-side: use environment-aware API URL
  const apiUrl = getApiUrl();
  return apiUrl ? `${apiUrl}/api/auth` : '/api/auth';
}

// Update client configuration
export const betterAuthClient = createAuthClient({
  baseURL: getAuthClientBaseURL(),
  plugins: [
    organization(),
    twoFactor(),
  ],
  // Enhanced fetch configuration
  fetchOptions: {
    credentials: 'same-origin',
    timeout: 10000,
  },
});

// Update UnifiedAuthClient class methods to use relative URLs
class UnifiedAuthClient {
  // ... existing code ...
  
  async signIn(credentials: LoginCredentials): Promise<AuthResponse<{ user: User; tokens: AuthTokens }>> {
    authLogger.info('SIGNIN_ATTEMPT', { email: credentials.email });

    try {
      // Use Better Auth client with relative URLs
      const result = await betterAuthClient.signIn.email({
        email: credentials.email,
        password: credentials.password,
        rememberMe: credentials.rememberMe || false,
      });
      
      // ... rest of implementation remains the same ...
    } catch (error) {
      // Enhanced error handling
      const authError = AuthErrorHandler.handleError(error, 'Sign in');
      // ... error handling ...
    }
  }
  
  // ... update all other methods similarly ...
}
```

#### Testing:
```typescript
// Test client configuration
describe('Better Auth Client', () => {
  test('uses relative URLs in browser', () => {
    // Mock window object
    Object.defineProperty(window, 'location', {
      value: { origin: 'https://example.com' },
      writable: true,
    });
    
    const baseURL = getAuthClientBaseURL();
    expect(baseURL).toBe('/api/auth');
  });
});
```

#### Acceptance Criteria:
- [ ] Client uses relative URLs for same-origin requests
- [ ] No hardcoded domain references
- [ ] Error handling improved
- [ ] All authentication methods tested

## Phase 3: API Integration Updates (Week 2)

### Task 3.1: Update Authentication Components
**Priority**: High  
**Estimated Time**: 4 hours  
**Dependencies**: Task 2.2

#### Files to Update:
1. **Resend Verification Page**
   - File: `/frontend/src/app/auth/resend-verification/page.tsx`
   - Line 33: Update fetch URL to relative path

2. **Implementation**:
```typescript
// Before (line 33):
const response = await fetch('/api/auth/send-verification-email', {

// After (same line):
const response = await fetch('/api/auth/send-verification-email', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ email }),
  credentials: 'same-origin' // Add this for cookie handling
});
```

3. **Additional Components to Review**:
   - Search for all hardcoded auth API calls
   - Update error handling
   - Add consistent timeout and retry logic

#### Search and Update Process:
```bash
# Find all hardcoded auth API calls
grep -r "fetch.*api.*auth" /opt/webapps/revivatech/frontend/src --include="*.tsx" --include="*.ts"

# Find hardcoded localhost URLs
grep -r "localhost.*auth" /opt/webapps/revivatech/frontend/src --include="*.tsx" --include="*.ts"

# Find hardcoded revivatech.co.uk URLs
grep -r "revivatech\.co\.uk.*auth" /opt/webapps/revivatech/frontend/src --include="*.tsx" --include="*.ts"
```

#### Acceptance Criteria:
- [ ] All auth API calls use relative URLs
- [ ] Consistent error handling across components
- [ ] Proper credential handling in fetch calls
- [ ] No hardcoded domain references

### Task 3.2: Create Authentication API Utility
**Priority**: Medium  
**Estimated Time**: 3 hours  
**Dependencies**: Task 3.1

#### Implementation:
1. **Create API Utility**
   - File: `/frontend/src/lib/auth/auth-api-client.ts`

```typescript
// File: /frontend/src/lib/auth/auth-api-client.ts
export class AuthApiClient {
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = endpoint.startsWith('/') ? endpoint : `/api/auth/${endpoint}`;
    
    const config: RequestInit = {
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };
    
    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new AuthError(
          `HTTP ${response.status}: ${errorData.message || response.statusText}`
        );
      }
      
      return await response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new AuthError('Network error: Please check your connection');
      }
      throw error;
    }
  }
  
  static async sendVerificationEmail(email: string): Promise<any> {
    return this.request('/api/auth/send-verification-email', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }
  
  static async verifyEmail(token: string): Promise<any> {
    return this.request('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }
  
  // Add other auth API methods as needed
}
```

2. **Update Components to Use Utility**:
```typescript
// Update resend-verification page
import { AuthApiClient } from '@/lib/auth/auth-api-client';

// Replace fetch call with:
const result = await AuthApiClient.sendVerificationEmail(email);
```

#### Acceptance Criteria:
- [ ] Centralized auth API client created
- [ ] Consistent error handling
- [ ] All components updated to use utility
- [ ] Proper TypeScript types

## Phase 4: Testing and Validation (Week 2-3)

### Task 4.1: Create Comprehensive Test Suite
**Priority**: Critical  
**Estimated Time**: 8 hours  
**Dependencies**: All previous tasks

#### Test Categories:
1. **Unit Tests**
   - URL resolution logic
   - Cookie configuration
   - Environment detection
   - Error handling

2. **Integration Tests**
   - Authentication flows
   - Session management
   - Database connectivity
   - API endpoint responses

3. **Environment Tests**
   - Development environment validation
   - Production configuration validation
   - Staging environment testing

#### Implementation:
```typescript
// File: /frontend/src/lib/auth/__tests__/environment-integration.test.ts
describe('Better Auth Environment Integration', () => {
  describe('Development Environment', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
      delete process.env.NEXT_PUBLIC_BETTER_AUTH_URL;
    });
    
    test('authentication flow works with relative URLs', async () => {
      // Test complete auth flow
    });
    
    test('cookies are not secure in development', () => {
      // Test cookie configuration
    });
    
    test('CORS allows localhost origins', () => {
      // Test CORS configuration
    });
  });
  
  describe('Production Environment', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
      process.env.NEXT_PUBLIC_BETTER_AUTH_URL = 'https://revivatech.co.uk';
    });
    
    test('authentication flow works with HTTPS', async () => {
      // Test production auth flow
    });
    
    test('cookies are secure in production', () => {
      // Test secure cookie configuration
    });
    
    test('CORS allows only production origins', () => {
      // Test production CORS
    });
  });
});
```

#### Test Commands:
```bash
# Run all auth tests
npm run test:auth

# Run environment-specific tests
npm run test:auth:development
npm run test:auth:production

# Run integration tests
npm run test:auth:integration

# Run E2E tests
npm run test:auth:e2e
```

#### Acceptance Criteria:
- [ ] All unit tests pass
- [ ] Integration tests validate auth flows
- [ ] Environment-specific tests pass
- [ ] E2E tests validate user experience
- [ ] Test coverage > 90%

### Task 4.2: Performance Validation
**Priority**: Medium  
**Estimated Time**: 4 hours  
**Dependencies**: Task 4.1

#### Performance Tests:
1. **Authentication Response Time**
   - Login: < 500ms
   - Session validation: < 100ms
   - Logout: < 200ms

2. **Bundle Size Impact**
   - Measure JavaScript bundle size change
   - Ensure minimal impact from new utilities

3. **Database Connection Performance**
   - Connection establishment time
   - Query performance
   - Connection pool efficiency

#### Implementation:
```typescript
// File: /frontend/src/lib/auth/__tests__/performance.test.ts
describe('Authentication Performance', () => {
  test('login completes within 500ms', async () => {
    const start = Date.now();
    await authClient.signIn(testCredentials);
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(500);
  });
  
  test('session validation completes within 100ms', async () => {
    const start = Date.now();
    await authClient.getSession();
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(100);
  });
});
```

#### Monitoring Setup:
```typescript
// Add performance monitoring
const performanceMonitor = {
  trackAuthOperation: (operation: string, duration: number) => {
    console.log(`[Auth Performance] ${operation}: ${duration}ms`);
    // Send to monitoring service in production
  }
};
```

#### Acceptance Criteria:
- [ ] Authentication operations meet performance targets
- [ ] Bundle size impact < 5KB
- [ ] Database performance maintained
- [ ] Performance monitoring implemented

### Task 4.3: Security Validation
**Priority**: Critical  
**Estimated Time**: 6 hours  
**Dependencies**: Task 4.2

#### Security Checklist:
1. **Cookie Security**
   - Secure flag in production
   - HttpOnly flag always set
   - Proper domain scope
   - SameSite configuration

2. **CORS Configuration**
   - Production origins only in production
   - No wildcard origins
   - Proper preflight handling

3. **Environment Variables**
   - No secrets in client-side code
   - Proper secret validation in production
   - Environment isolation

4. **Database Security**
   - SSL in production
   - Proper connection string handling
   - No credentials in logs

#### Security Tests:
```typescript
// File: /frontend/src/lib/auth/__tests__/security.test.ts
describe('Authentication Security', () => {
  describe('Production Security', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });
    
    test('cookies have secure flag', () => {
      const config = getSessionCookieConfig();
      expect(config.secure).toBe(true);
    });
    
    test('CORS allows only production origins', () => {
      const resolver = new BetterAuthUrlResolver();
      const origins = resolver.getTrustedOrigins();
      expect(origins).not.toContain('http://localhost:3010');
      expect(origins).toContain('https://revivatech.co.uk');
    });
    
    test('requires BETTER_AUTH_SECRET in production', () => {
      delete process.env.BETTER_AUTH_SECRET;
      delete process.env.JWT_SECRET;
      
      expect(() => {
        // Initialize auth configuration
      }).toThrow('BETTER_AUTH_SECRET is required in production');
    });
  });
});
```

#### Security Audit:
```bash
# Run security audit
npm audit

# Check for hardcoded secrets
grep -r "secret\|password\|key" /opt/webapps/revivatech/frontend/src --exclude-dir=node_modules

# Validate environment variable usage
npm run lint:env-vars
```

#### Acceptance Criteria:
- [ ] All security tests pass
- [ ] No secrets in client-side code
- [ ] Proper CORS configuration
- [ ] Cookie security validated
- [ ] Security audit passes

## Phase 5: Documentation and Deployment (Week 3-4)

### Task 5.1: Update Documentation
**Priority**: Medium  
**Estimated Time**: 4 hours  
**Dependencies**: All testing tasks

#### Documentation Updates:
1. **Developer Setup Guide**
   - Update environment variable requirements
   - Add new authentication setup steps
   - Document common troubleshooting

2. **Deployment Guide**
   - Update production configuration requirements
   - Add environment-specific deployment notes
   - Document validation procedures

3. **API Documentation**
   - Update authentication endpoint documentation
   - Add environment configuration examples
   - Document error responses

#### Files to Update:
- `/README.md` - Main project setup
- `/CLAUDE.md` - Development procedures
- `/Docs/Implementation.md` - Technical implementation
- Create: `/Docs/Authentication-Environment-Setup.md`

#### Acceptance Criteria:
- [ ] All documentation updated
- [ ] Developer setup guide tested
- [ ] Deployment procedures documented
- [ ] API documentation complete

### Task 5.2: Create Migration Plan
**Priority**: Critical  
**Estimated Time**: 3 hours  
**Dependencies**: Task 5.1

#### Migration Strategy:
1. **Pre-Migration Checklist**
   - Backup current configuration
   - Document rollback procedures
   - Test new configuration in staging

2. **Migration Steps**
   - Deploy to staging environment
   - Validate all authentication flows
   - Monitor for issues
   - Deploy to production with rollback plan

3. **Post-Migration Validation**
   - Verify authentication works in all environments
   - Monitor error rates
   - Validate user session persistence

#### Migration Script:
```bash
#!/bin/bash
# File: /scripts/migrate-auth-config.sh

echo "Starting Better Auth environment configuration migration..."

# Backup current configuration
cp .env.production .env.production.backup
cp .env.local .env.local.backup

# Update environment variables
echo "Updating environment variables..."
# ... migration commands ...

# Test configuration
echo "Testing new configuration..."
npm run test:auth:integration

# Deploy if tests pass
if [ $? -eq 0 ]; then
  echo "Tests passed. Deploying..."
  npm run deploy:staging
else
  echo "Tests failed. Rolling back..."
  # Rollback commands
fi
```

#### Acceptance Criteria:
- [ ] Migration plan documented
- [ ] Rollback procedures tested
- [ ] Staging deployment successful
- [ ] Production deployment plan ready

### Task 5.3: Production Deployment
**Priority**: Critical  
**Estimated Time**: 4 hours  
**Dependencies**: Task 5.2

#### Deployment Checklist:
1. **Pre-Deployment**
   - [ ] All tests pass
   - [ ] Staging validation complete
   - [ ] Team notified of deployment
   - [ ] Rollback plan confirmed

2. **Deployment**
   - [ ] Deploy to production
   - [ ] Validate authentication endpoints
   - [ ] Monitor error rates
   - [ ] Verify user sessions

3. **Post-Deployment**
   - [ ] Monitor for 24 hours
   - [ ] Validate user feedback
   - [ ] Document any issues
   - [ ] Update team on results

#### Monitoring Commands:
```bash
# Monitor authentication success rates
curl -s "https://revivatech.co.uk/api/auth/health" | jq .

# Monitor error logs
docker logs revivatech_frontend --tail 100 | grep -i auth

# Monitor database connections
docker logs revivatech_backend --tail 100 | grep -i "better.*auth"
```

#### Acceptance Criteria:
- [ ] Production deployment successful
- [ ] Authentication works for all users
- [ ] No increase in error rates
- [ ] User sessions maintained
- [ ] Performance targets met

## Validation and Testing Procedures

### Environment Validation
```bash
# Development Environment
NODE_ENV=development npm run test:auth:full

# Production Environment (staging)
NODE_ENV=production npm run test:auth:full

# Cross-browser testing
npm run test:auth:browsers
```

### User Acceptance Testing
1. **Login Flow**
   - [ ] User can log in successfully
   - [ ] Session persists across browser restarts
   - [ ] Logout works correctly

2. **Registration Flow**
   - [ ] User can register new account
   - [ ] Email verification works
   - [ ] Account activation successful

3. **Password Reset Flow**
   - [ ] Password reset email sent
   - [ ] Reset link works correctly
   - [ ] New password saves successfully

### Performance Validation
```bash
# Load testing
npm run test:auth:load

# Performance monitoring
npm run test:auth:performance

# Bundle size analysis
npm run analyze:bundle
```

## Risk Mitigation

### High-Risk Items
1. **Session Migration**
   - **Risk**: Existing user sessions invalidated
   - **Mitigation**: Gradual rollout with session preservation
   - **Rollback**: Immediate rollback to previous configuration

2. **Database Connection Issues**
   - **Risk**: Authentication database becomes inaccessible
   - **Mitigation**: Multiple fallback database URLs
   - **Rollback**: Revert to previous database configuration

### Medium-Risk Items
1. **Environment Detection Failure**
   - **Risk**: Automatic environment detection fails
   - **Mitigation**: Manual environment variable overrides
   - **Rollback**: Use hardcoded fallbacks temporarily

2. **Cookie Configuration Issues**
   - **Risk**: Cookies don't work in production
   - **Mitigation**: Extensive testing in staging environment
   - **Rollback**: Revert to previous cookie settings

## Success Metrics

### Technical Metrics
- [ ] Authentication success rate: > 99%
- [ ] Session persistence rate: > 95%
- [ ] Authentication response time: < 500ms
- [ ] Zero CORS errors in production
- [ ] Zero hardcoded URLs in codebase

### Business Metrics
- [ ] Zero authentication-related deployment failures
- [ ] Developer environment setup: < 5 minutes
- [ ] Zero security vulnerabilities
- [ ] 100% user session preservation during migration

## Timeline Summary

**Week 1**: Environment configuration foundation
- Tasks 1.1-1.3: Environment variables, URL resolver, cookie config
- Tasks 2.1-2.2: Better Auth server and client updates

**Week 2**: API integration and testing
- Tasks 3.1-3.2: Component updates and API utility
- Tasks 4.1-4.2: Testing and performance validation

**Week 3**: Security and deployment preparation
- Task 4.3: Security validation
- Tasks 5.1-5.2: Documentation and migration planning

**Week 4**: Production deployment and monitoring
- Task 5.3: Production deployment
- Post-deployment monitoring and validation

## Dependencies and Prerequisites

### Internal Dependencies
- Existing `EnvironmentAwareUrlResolver` utility
- Better Auth framework configuration
- Current environment variable system
- Database connection infrastructure

### External Dependencies
- Better Auth framework (current version)
- PostgreSQL database availability
- HTTPS certificate in production
- DNS configuration for domain cookies

### Team Dependencies
- Development team for implementation
- DevOps team for deployment
- QA team for testing validation
- Product team for user acceptance testing