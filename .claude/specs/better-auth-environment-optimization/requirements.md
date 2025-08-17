# Better Auth Environment Configuration Optimization - Requirements

## Executive Summary

This PRD addresses critical environment configuration issues in the RevivaTech Better Auth implementation that cause authentication failures when deploying from development to production. The primary issue is the "login works in dev but not in prod" problem caused by hardcoded URLs, improper cookie configuration, and inconsistent environment variable usage.

## Problem Statement

### Current Issues Identified

1. **Environment Configuration Mismatch**
   - Hardcoded `localhost` URLs in production builds
   - Inconsistent environment variable naming (`BETTER_AUTH_URL` vs `NEXT_PUBLIC_BETTER_AUTH_URL`)
   - Missing dynamic URL resolution for different deployment environments

2. **Cookie and Session Problems**
   - Cookies not configured for production HTTPS requirements
   - Missing domain and SameSite configurations for cross-environment compatibility
   - Secure flag not environment-aware

3. **CORS and Origin Issues**
   - Trusted origins list not dynamically generated
   - Development URLs hardcoded in production configurations
   - Missing fallback mechanisms for different deployment scenarios

4. **API Integration Inconsistencies**
   - Mix of absolute and relative URL usage in frontend components
   - Direct fetch calls with hardcoded endpoints
   - Inconsistent usage of existing `EnvironmentAwareUrlResolver`

## Business Requirements

### BR-1: Environment Portability
**Description**: Authentication system must work seamlessly across all deployment environments without code changes.

**Business Value**: 
- Reduces deployment failures and rollback incidents
- Enables faster release cycles
- Reduces support tickets from authentication failures

**Success Metrics**:
- Zero authentication-related deployment failures
- 99.9% authentication success rate across all environments
- Reduced average deployment time by 30%

### BR-2: Security Compliance
**Description**: Authentication must maintain security best practices in all environments while allowing development flexibility.

**Business Value**:
- Maintains customer trust through secure authentication
- Complies with industry security standards
- Prevents data breaches from insecure configurations

**Success Metrics**:
- All production cookies use `Secure` flag
- Proper CORS configuration in production
- No security warnings in browser developer tools

### BR-3: Developer Experience
**Description**: Developers should be able to work locally without complex authentication setup while maintaining production parity.

**Business Value**:
- Faster developer onboarding
- Reduced development environment setup time
- Increased developer productivity

**Success Metrics**:
- Local authentication setup in <5 minutes
- Zero authentication-related developer support tickets
- 100% development environment consistency

## Technical Requirements

### TR-1: Dynamic URL Resolution
**Description**: Implement environment-aware URL resolution that automatically detects and configures appropriate authentication endpoints.

**Technical Specifications**:
- Use relative URLs (`/api/auth/...`) for same-origin requests
- Dynamic `baseURL` configuration based on environment detection
- Leverage existing `EnvironmentAwareUrlResolver` utility
- Fallback mechanisms for edge cases

**Dependencies**:
- Existing `api-config.ts` utility
- Better Auth client configuration
- Environment variable standardization

**Acceptance Criteria**:
- ✅ Authentication works on `http://localhost:3010` (development)
- ✅ Authentication works on `https://revivatech.co.uk` (production)
- ✅ No hardcoded URLs in any authentication-related code
- ✅ Automatic environment detection without manual configuration

### TR-2: Environment-Aware Cookie Configuration
**Description**: Configure cookies with appropriate security settings based on the deployment environment.

**Technical Specifications**:
- `Secure` flag enabled only in production (HTTPS)
- `SameSite=lax` for general compatibility
- Domain setting only for production (`.revivatech.co.uk`)
- `HttpOnly` flag always enabled for security

**Implementation Details**:
```typescript
cookies: {
  sessionToken: {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    domain: process.env.NODE_ENV === "production" ? ".revivatech.co.uk" : undefined,
    httpOnly: true
  }
}
```

**Acceptance Criteria**:
- ✅ Cookies work in both HTTP (dev) and HTTPS (prod) environments
- ✅ Session persistence maintained across browser restarts
- ✅ No browser console warnings about cookie security
- ✅ Proper domain scope in production

### TR-3: CORS and Origin Management
**Description**: Dynamic trusted origins configuration that adapts to deployment environment.

**Technical Specifications**:
- Development origins: `http://localhost:3010`, `http://localhost:3011`
- Production origins: `https://revivatech.co.uk`, `https://api.revivatech.co.uk`
- Dynamic origin detection for staging environments
- Fallback to environment variables when needed

**Acceptance Criteria**:
- ✅ No CORS errors in development
- ✅ No CORS errors in production
- ✅ Proper preflight handling for authenticated requests
- ✅ Cross-origin requests work when needed

### TR-4: API Integration Standardization
**Description**: Standardize all authentication-related API calls to use consistent URL resolution patterns.

**Technical Specifications**:
- Replace all hardcoded fetch URLs with relative paths
- Use centralized `getApiUrl()` utility for external requests
- Implement consistent error handling for network failures
- Add proper retry mechanisms for authentication requests

**Files to Update**:
- `/frontend/src/app/auth/resend-verification/page.tsx`
- `/frontend/src/lib/auth/better-auth-client.ts`
- Any component making direct auth API calls

**Acceptance Criteria**:
- ✅ All auth API calls use relative URLs
- ✅ Consistent error handling across all auth components
- ✅ No hardcoded domain references in code
- ✅ Proper fallback for network failures

## User Stories

### US-1: Developer Authentication Setup
**As a** developer joining the RevivaTech team  
**I want** to authenticate locally without complex configuration  
**So that** I can start contributing immediately without authentication setup delays

**Acceptance Criteria**:
- Git clone and `npm install` provides working authentication
- Local login works with test credentials
- No manual environment variable configuration required
- Clear error messages for common setup issues

### US-2: DevOps Deployment
**As a** DevOps engineer deploying to production  
**I want** authentication to work without code changes  
**So that** deployments are reliable and predictable

**Acceptance Criteria**:
- Same codebase works in all environments
- Environment variables control behavior
- No authentication-related deployment failures
- Clear deployment validation procedures

### US-3: End User Experience
**As a** RevivaTech customer  
**I want** to log in consistently across all platforms  
**So that** I can access my account reliably

**Acceptance Criteria**:
- Login works on all supported browsers
- Session persists across browser restarts
- No confusing error messages
- Consistent behavior in all environments

### US-4: QA Testing
**As a** QA engineer  
**I want** to test authentication across different environments  
**So that** I can validate the user experience before release

**Acceptance Criteria**:
- Authentication testable in staging environment
- Clear test procedures for auth flows
- Consistent behavior across test environments
- Easy setup of test user accounts

## Non-Functional Requirements

### NFR-1: Performance
- Authentication response time < 500ms
- Session validation < 100ms
- No performance regression from URL resolution
- Minimal JavaScript bundle size impact

### NFR-2: Reliability
- 99.9% authentication availability
- Graceful degradation for network issues
- Automatic retry for transient failures
- Clear error reporting and logging

### NFR-3: Security
- All production communications use HTTPS
- Secure cookie configuration in production
- No sensitive data in client-side logs
- Proper CORS configuration

### NFR-4: Maintainability
- Environment configuration centralized
- Clear separation of concerns
- Comprehensive error handling
- Detailed logging for debugging

## Constraints and Assumptions

### Constraints
- Must maintain compatibility with existing user sessions
- Cannot break current authentication flows during migration
- Must use existing Better Auth framework
- Limited to current environment variable system

### Assumptions
- Production deployment uses HTTPS
- Development uses HTTP on localhost
- Existing `api-config.ts` utility is reliable
- Better Auth framework supports required configurations

## Risk Assessment

### High Risk
- **Session Migration**: Existing user sessions may be invalidated
  - **Mitigation**: Implement gradual migration with fallback support

### Medium Risk
- **Environment Detection Failure**: Automatic detection may fail in edge cases
  - **Mitigation**: Provide manual override through environment variables

### Low Risk
- **Performance Impact**: URL resolution may add minimal latency
  - **Mitigation**: Cache resolution results and optimize detection logic

## Success Criteria

### Phase 1 - Configuration (Week 1)
- ✅ Environment variables standardized across all environments
- ✅ Dynamic URL resolution implemented
- ✅ Cookie configuration updated for production

### Phase 2 - Integration (Week 2)
- ✅ All hardcoded URLs replaced with relative/dynamic paths
- ✅ CORS configuration updated
- ✅ Error handling improved

### Phase 3 - Validation (Week 3)
- ✅ End-to-end testing in all environments
- ✅ Performance validation
- ✅ Security audit completed

### Final Success Metrics
- Zero authentication failures in production deployments
- 100% developer environment consistency
- All security requirements met
- Documentation and procedures updated

## Dependencies

### Internal Dependencies
- Existing `EnvironmentAwareUrlResolver` utility
- Better Auth configuration system
- Environment variable management system
- Current deployment pipeline

### External Dependencies
- Better Auth framework updates (if needed)
- Browser cookie support
- HTTPS certificate configuration in production
- DNS configuration for domain cookie scope

## Timeline

- **Week 1**: Requirements analysis and design completion
- **Week 2**: Implementation and initial testing
- **Week 3**: Integration testing and production validation
- **Week 4**: Documentation and team training

## Approval Criteria

This PRD is approved when:
- All technical requirements have clear implementation plans
- Risk mitigation strategies are defined
- Success criteria are measurable and achievable
- Timeline is realistic and achievable
- Dependencies are identified and managed