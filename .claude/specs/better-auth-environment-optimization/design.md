# Better Auth Environment Configuration Optimization - Technical Design

## Design Overview

This document outlines the technical architecture and implementation strategy for optimizing Better Auth environment configuration to solve the "login works in dev but not in prod" problem. The design leverages existing infrastructure while implementing environment-aware patterns for authentication.

## Architecture Principles

### 1. Environment Agnostic Design
- Single codebase works across all environments
- Configuration driven by environment variables
- Automatic environment detection with manual overrides
- Graceful fallbacks for edge cases

### 2. Security by Default
- Production-first security configuration
- Development convenience without compromising production security
- Secure defaults with environment-specific optimizations
- Cookie and session security based on deployment context

### 3. Leverage Existing Infrastructure
- Utilize existing `EnvironmentAwareUrlResolver` utility
- Extend current configuration patterns
- Maintain compatibility with existing authentication flows
- Minimize changes to working components

## Current State Analysis

### Existing Better Auth Implementation

#### Server Configuration (`better-auth-server.ts`)
```typescript
// Current Issues:
- Hardcoded baseURL configuration
- Static trusted origins list
- Container-specific database URL resolution
- Missing environment-aware cookie settings
```

#### Client Configuration (`better-auth-client.ts`)
```typescript
// Current Issues:
- getAuthBaseURL() function with hardcoded fallbacks
- Client-side origin detection without production considerations
- Mixed URL resolution patterns
- No integration with existing api-config.ts
```

#### API Route Handler (`/api/auth/[...auth]/route.ts`)
```typescript
// Recently Updated:
- Uses Better Auth native handlers
- Proper NextRequest integration
- Console logging for debugging
```

### Environment Configuration Analysis

#### Current Environment Variables
```bash
# Development (.env.local)
NEXT_PUBLIC_BETTER_AUTH_URL=https://localhost:3010
BETTER_AUTH_DATABASE_URL=postgresql://revivatech:revivatech_password@localhost:5435/revivatech
NEXT_PUBLIC_API_URL=http://localhost:3011

# Production (.env.production)
NEXT_PUBLIC_BETTER_AUTH_URL=https://revivatech.co.uk
BETTER_AUTH_DATABASE_URL=PRODUCTION_DATABASE_URL_PLACEHOLDER
NEXT_PUBLIC_API_URL=https://api.revivatech.co.uk
```

**Issues Identified**:
- Inconsistent naming (`BETTER_AUTH_URL` vs `NEXT_PUBLIC_BETTER_AUTH_URL`)
- Missing staging environment configuration
- No fallback mechanisms for environment detection
- Hardcoded localhost URLs in some configurations

## Proposed Architecture

### 1. Environment-Aware URL Resolution System

#### Design Pattern
```typescript
interface AuthUrlResolver {
  getBaseUrl(): string;
  getApiUrl(): string;
  getTrustedOrigins(): string[];
  isSecureContext(): boolean;
}
```

#### Implementation Strategy
```typescript
class BetterAuthUrlResolver implements AuthUrlResolver {
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
}
```

### 2. Environment-Aware Cookie Configuration

#### Design Pattern
```typescript
interface CookieConfig {
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  domain?: string;
  httpOnly: boolean;
  maxAge: number;
}
```

#### Implementation Strategy
```typescript
function getCookieConfig(environment: Environment): CookieConfig {
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
```

### 3. Better Auth Server Configuration Redesign

#### Updated Server Configuration
```typescript
import { EnvironmentAwareUrlResolver } from '@/lib/utils/api-config';

const urlResolver = new EnvironmentAwareUrlResolver();
const authUrlResolver = new BetterAuthUrlResolver();

export const auth = betterAuth({
  // Dynamic database configuration
  database: drizzleAdapter(createDynamicDatabaseConnection(), {
    provider: "pg",
  }),
  
  // Environment-aware base URL
  baseURL: authUrlResolver.getBaseUrl(),
  
  // Dynamic secret resolution
  secret: process.env.BETTER_AUTH_SECRET || 
          process.env.JWT_SECRET || 
          (() => {
            if (process.env.NODE_ENV === 'production') {
              throw new Error('BETTER_AUTH_SECRET required in production');
            }
            return 'development-secret-key';
          })(),
  
  // Environment-aware cookie configuration
  cookies: {
    sessionToken: {
      name: "better-auth.session-token",
      ...getCookieConfig(urlResolver.detectEnvironment()),
    },
  },
  
  // Dynamic trusted origins
  trustedOrigins: authUrlResolver.getTrustedOrigins(),
  
  // Enhanced session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // Update daily
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },
  
  // Environment-aware features
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: urlResolver.isProduction(),
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  
  // Rate limiting configuration
  rateLimit: {
    window: 15 * 60, // 15 minutes
    max: urlResolver.isDevelopment() ? 100 : 5, // More lenient in dev
  },
});
```

### 4. Better Auth Client Configuration Redesign

#### Updated Client Configuration
```typescript
import { getApiUrl } from '@/lib/utils/api-config';

function getAuthClientBaseURL(): string {
  // Client-side: always use relative URLs for same-origin requests
  if (typeof window !== 'undefined') {
    return window.location.origin + '/api/auth';
  }
  
  // Server-side: use environment-aware API URL
  const apiUrl = getApiUrl();
  return apiUrl ? `${apiUrl}/auth` : '/api/auth';
}

export const betterAuthClient = createAuthClient({
  baseURL: getAuthClientBaseURL(),
  plugins: [
    organization(),
    twoFactor(),
  ],
  // Fetch configuration for better error handling
  fetchOptions: {
    credentials: 'same-origin', // Include cookies in same-origin requests
    timeout: 10000, // 10 second timeout
  },
});
```

### 5. API Integration Standardization

#### Relative URL Pattern
```typescript
// ✅ Correct: Use relative URLs for same-origin auth requests
const response = await fetch('/api/auth/send-verification-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email }),
  credentials: 'same-origin'
});
```

#### Error Handling Pattern
```typescript
async function authApiCall<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('/') ? endpoint : `/api/auth/${endpoint}`;
  
  try {
    const response = await fetch(url, {
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    
    if (!response.ok) {
      throw new AuthError(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new AuthError('Network error: Please check your connection');
    }
    throw error;
  }
}
```

## Database Configuration Design

### Environment-Aware Database Connection
```typescript
function createDatabaseConnection(): DrizzleClient {
  const databaseUrl = getDatabaseUrl();
  
  const connectionConfig = {
    max: getConnectionPoolSize(),
    ssl: shouldUseSsl(),
    connection: {
      application_name: `better-auth-revivatech-${process.env.NODE_ENV}`,
    },
  };
  
  try {
    const client = postgres(databaseUrl, connectionConfig);
    return drizzle(client, { 
      schema: authSchema,
      casing: 'preserve'
    });
  } catch (error) {
    console.error('Database connection failed:', error);
    throw new Error('Failed to connect to authentication database');
  }
}

function getDatabaseUrl(): string {
  // Priority order for database URL resolution
  const candidates = [
    process.env.BETTER_AUTH_DATABASE_URL,
    process.env.DATABASE_URL,
    getInternalDatabaseUrl(),
  ];
  
  for (const url of candidates) {
    if (url && !url.includes('PLACEHOLDER')) {
      return url;
    }
  }
  
  throw new Error('No valid database URL found');
}

function getConnectionPoolSize(): number {
  if (process.env.NODE_ENV === 'production') {
    return 10; // Higher pool size for production
  }
  return 2; // Lower pool size for development
}

function shouldUseSsl(): boolean {
  // SSL enabled only for external database connections
  return process.env.NODE_ENV === 'production' && 
         !process.env.DATABASE_URL?.includes('localhost');
}
```

## Security Design

### Production Security Configuration
```typescript
const securityConfig = {
  production: {
    cookies: {
      secure: true,
      sameSite: 'lax',
      domain: '.revivatech.co.uk',
      httpOnly: true,
    },
    cors: {
      origin: ['https://revivatech.co.uk', 'https://api.revivatech.co.uk'],
      credentials: true,
    },
    session: {
      rotateSessionOnAuth: true,
      invalidateOnPasswordChange: true,
    },
  },
  development: {
    cookies: {
      secure: false, // Allow HTTP in development
      sameSite: 'lax',
      httpOnly: true,
    },
    cors: {
      origin: ['http://localhost:3010', 'http://localhost:3011'],
      credentials: true,
    },
    session: {
      rotateSessionOnAuth: false, // Easier debugging
    },
  },
};
```

### CSRF Protection
```typescript
// Better Auth handles CSRF automatically, but we can enhance it
const csrfConfig = {
  enabled: true,
  // Custom CSRF token validation for API routes
  customValidation: (request: NextRequest) => {
    // Additional validation logic if needed
    return true;
  },
};
```

## Error Handling and Logging Design

### Centralized Error Handling
```typescript
class AuthErrorHandler {
  static handleEnvironmentError(error: Error, context: string): AuthError {
    console.error(`[Better Auth] ${context}:`, error);
    
    if (error.message.includes('ECONNREFUSED')) {
      return new AuthError('Database connection failed. Check your database configuration.');
    }
    
    if (error.message.includes('Invalid origin')) {
      return new AuthError('CORS error. Check your domain configuration.');
    }
    
    return new AuthError(`Authentication error in ${context}: ${error.message}`);
  }
  
  static logEnvironmentInfo(): void {
    console.log('[Better Auth] Environment:', process.env.NODE_ENV);
    console.log('[Better Auth] Base URL:', process.env.NEXT_PUBLIC_BETTER_AUTH_URL);
    console.log('[Better Auth] API URL:', process.env.NEXT_PUBLIC_API_URL);
    // Don't log sensitive information
  }
}
```

### Development Debug Logging
```typescript
const debugConfig = {
  enabled: process.env.NODE_ENV === 'development',
  logLevel: 'info',
  logDatabase: false, // Don't log database queries in production
  logRequests: process.env.NODE_ENV === 'development',
};
```

## Performance Optimization Design

### Caching Strategy
```typescript
class AuthConfigCache {
  private static cache = new Map<string, any>();
  private static TTL = 5 * 60 * 1000; // 5 minutes
  
  static get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.value;
  }
  
  static set<T>(key: string, value: T): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
  }
}
```

### Bundle Size Optimization
```typescript
// Lazy load authentication utilities
const authUtils = {
  async getUrlResolver() {
    const { EnvironmentAwareUrlResolver } = await import('@/lib/utils/api-config');
    return new EnvironmentAwareUrlResolver();
  },
  
  async getBetterAuthClient() {
    const { betterAuthClient } = await import('@/lib/auth/better-auth-client');
    return betterAuthClient;
  },
};
```

## Testing Strategy Design

### Environment Testing
```typescript
describe('Better Auth Environment Configuration', () => {
  describe('Development Environment', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });
    
    it('should use HTTP URLs', () => {
      const resolver = new BetterAuthUrlResolver();
      expect(resolver.getBaseUrl()).toMatch(/^http:/);
    });
    
    it('should not require secure cookies', () => {
      const config = getCookieConfig(Environment.DEVELOPMENT);
      expect(config.secure).toBe(false);
    });
  });
  
  describe('Production Environment', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });
    
    it('should use HTTPS URLs', () => {
      const resolver = new BetterAuthUrlResolver();
      expect(resolver.getBaseUrl()).toMatch(/^https:/);
    });
    
    it('should require secure cookies', () => {
      const config = getCookieConfig(Environment.PRODUCTION);
      expect(config.secure).toBe(true);
    });
  });
});
```

## Migration Strategy

### Phase 1: Configuration Update
1. Update environment variables across all environments
2. Implement new URL resolution classes
3. Update Better Auth server configuration
4. Test in development environment

### Phase 2: Client Integration
1. Update Better Auth client configuration
2. Replace hardcoded URLs in components
3. Implement error handling improvements
4. Test authentication flows

### Phase 3: Production Deployment
1. Deploy to staging environment
2. Validate all authentication flows
3. Monitor for any issues
4. Deploy to production with rollback plan

### Rollback Strategy
```typescript
// Feature flag for new authentication configuration
const USE_NEW_AUTH_CONFIG = process.env.FEATURE_NEW_AUTH_CONFIG === 'true';

export const auth = betterAuth(
  USE_NEW_AUTH_CONFIG 
    ? newAuthConfiguration 
    : legacyAuthConfiguration
);
```

## Monitoring and Observability

### Key Metrics
- Authentication success/failure rates by environment
- Session persistence rates
- Cookie-related errors
- CORS error frequency
- Database connection health

### Logging Strategy
```typescript
const authLogger = {
  info: (message: string, data?: any) => {
    console.log(`[Better Auth] ${message}`, data);
  },
  
  error: (message: string, error?: Error) => {
    console.error(`[Better Auth] ERROR: ${message}`, error);
    // Send to monitoring service in production
  },
  
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[Better Auth] DEBUG: ${message}`, data);
    }
  },
};
```

## Success Criteria

### Technical Validation
- [ ] Authentication works in all environments without code changes
- [ ] No hardcoded URLs in authentication code
- [ ] Proper cookie configuration for all environments
- [ ] CORS errors eliminated
- [ ] Performance impact < 50ms per request

### Business Validation
- [ ] Zero authentication-related deployment failures
- [ ] Developer environment setup < 5 minutes
- [ ] Production security audit passes
- [ ] User session persistence maintained

## Future Considerations

### Extensibility
- Support for additional environments (staging, testing)
- Integration with service discovery for dynamic URLs
- Advanced caching strategies for high-load scenarios
- Support for multiple authentication providers

### Maintenance
- Regular security audits of cookie configuration
- Performance monitoring and optimization
- Documentation updates for new team members
- Automated testing of environment configurations