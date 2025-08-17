# API Routing Standardization Requirements

## Executive Summary

RevivaTech's current API routing system requires critical standardization to resolve production deployment issues, eliminate hardcoded configurations, and align with industry best practices. This document outlines the comprehensive requirements for standardizing API routing across development, staging, and production environments.

## Current State Analysis

### Architecture Overview
- **Frontend**: Next.js with App Router, TypeScript strict mode
- **Backend**: Node.js/Express with Better Auth integration  
- **Deployment**: Docker containerized with dual-domain setup (revivatech.co.uk, revivatech.com.br)
- **Development**: Hot reload with HTTPS/HTTP mixed configuration

### Existing Strengths (85% Best Practice Compliance)
1. **Environment-Aware URL Resolution** (`api-config.ts`)
   - Dynamic server/client-side detection
   - Container-aware internal/external routing
   - Sophisticated environment detection

2. **Better Auth Integration**
   - Modern authentication with proper baseURL detection
   - Environment-aware configuration
   - Security-first cookie handling

3. **Container Networking**
   - Clean separation of internal container communication
   - External access routing through proxy
   - Docker Compose network isolation

4. **TypeScript Implementation**
   - Strict type checking
   - Comprehensive interface definitions
   - Type-safe API client implementation

## Critical Issues Requiring Resolution

### 🚨 High Priority Issues

#### 1. CLAUDE.md Rule Violation
- **File**: `/opt/webapps/revivatech/frontend/next.config.ts:41`
- **Issue**: Hardcoded Tailscale IP `'100.122.130.67:3010'`
- **Violation**: CLAUDE.md RULE 3 - "Never touch Tailscale IPs (100.x.x.x) - Never hardcode in config/code"
- **Impact**: 
  - Deployment fragility across environments
  - Project boundary violations
  - Configuration drift between developers
- **Business Risk**: HIGH - Deployment failures, inconsistent environments

#### 2. Mixed HTTP/HTTPS Configuration
- **Files**: Multiple configuration files across frontend/backend
- **Issue**: Inconsistent protocol handling between environments
- **Problems**:
  - Development uses HTTP, production uses HTTPS
  - Authentication failures due to protocol mismatches
  - Cookie security issues (SameSite, Secure flags)
  - CORS origin mismatches
- **Impact**: Authentication session persistence failures
- **Business Risk**: HIGH - User login/session issues in production

#### 3. Better Auth URL Misalignment  
- **File**: `/opt/webapps/revivatech/frontend/src/lib/auth/better-auth-client.ts`
- **Issue**: Recent changes force localhost for development
- **Problems**:
  - Line 16: `return 'http://localhost:3010'` hardcoded for development
  - May cause authentication failures when using Tailscale IPs
  - Inconsistent with environment-aware patterns elsewhere
- **Impact**: Authentication not working across different development setups
- **Business Risk**: HIGH - Developer productivity, authentication testing

### ⚠️ Medium Priority Issues

#### 4. Inconsistent Environment Variable Names
- **Files**: `.env`, `backend/.env`, configuration files
- **Issue**: Multiple naming patterns for similar configurations
- **Examples**:
  - `NEXT_PUBLIC_API_URL` vs `BETTER_AUTH_URL` vs `FRONTEND_URL_EN`
  - `BACKEND_INTERNAL_URL` vs internal hardcoded references
  - Inconsistent `NEXT_PUBLIC_` prefixing
- **Impact**: Configuration confusion, deployment errors
- **Business Risk**: MEDIUM - Deployment complexity, maintenance overhead

#### 5. Missing Fallback Mechanisms
- **File**: `/opt/webapps/revivatech/frontend/src/lib/utils/api.ts`
- **Issue**: API calls lack robust error handling for URL resolution failures
- **Problems**:
  - No retry mechanisms for failed API calls
  - No fallback URL resolution if primary fails
  - Inadequate error logging for troubleshooting
- **Impact**: Service interruptions, poor user experience
- **Business Risk**: MEDIUM - Service reliability, customer satisfaction

#### 6. Security Configuration Gaps
- **Files**: CORS configurations, SSL settings
- **Issues**:
  - Development mode allows insecure connections
  - Certificate validation disabled in some contexts
  - Incomplete CORS origin whitelisting for dual-domain setup
- **Impact**: Security vulnerabilities, authentication issues
- **Business Risk**: MEDIUM - Security posture, compliance issues

## Business Requirements

### BR-1: CLAUDE.md Compliance
- **Requirement**: 100% compliance with CLAUDE.md project rules
- **Success Criteria**: Zero hardcoded Tailscale IPs or forbidden configurations
- **Priority**: CRITICAL

### BR-2: Multi-Environment Deployment
- **Requirement**: Seamless deployment across dev/staging/production environments
- **Success Criteria**: Single configuration works across all environments without modification
- **Priority**: HIGH

### BR-3: Authentication Reliability  
- **Requirement**: Bulletproof authentication flows across all environments and access methods
- **Success Criteria**: Login/session persistence works 100% of the time
- **Priority**: HIGH

### BR-4: Developer Experience
- **Requirement**: Maintain excellent developer experience and productivity
- **Success Criteria**: Hot reload, debugging, and local development work flawlessly
- **Priority**: MEDIUM

### BR-5: Security Compliance
- **Requirement**: Industry-standard security practices for production
- **Success Criteria**: HTTPS enforcement, secure cookies, proper CORS policies
- **Priority**: MEDIUM

## Technical Requirements

### TR-1: Environment Variable Standardization
- **Standard Naming Convention**:
  ```
  # API URLs
  NEXT_PUBLIC_API_URL=<external_api_url>
  BACKEND_INTERNAL_URL=<internal_container_url>
  
  # Authentication
  BETTER_AUTH_URL=<auth_base_url>
  NEXT_PUBLIC_APP_URL=<frontend_url>
  
  # Development
  TAILSCALE_DEV_IP=<dynamic_ip>
  ```
- **Requirement**: All API URL configurations must follow this pattern
- **Success Criteria**: No configuration name conflicts or duplicates

### TR-2: Dynamic IP Resolution
- **Requirement**: Replace all hardcoded IPs with environment variable patterns
- **Pattern**: `${process.env.TAILSCALE_DEV_IP}:${port}` for development IPs
- **Success Criteria**: Zero hardcoded IP addresses in codebase

### TR-3: Protocol Consistency
- **Requirement**: Consistent HTTP/HTTPS handling based on environment
- **Rules**:
  - Development: HTTP acceptable for localhost, HTTPS for external access
  - Production: HTTPS mandatory for all external communication
  - Container-internal: HTTP acceptable for performance
- **Success Criteria**: No protocol-related authentication failures

### TR-4: Error Handling Enhancement
- **Requirement**: Robust error handling and fallback mechanisms
- **Components**:
  - API call retry logic with exponential backoff
  - Fallback URL resolution (primary → secondary → localhost)
  - Comprehensive error logging with context
- **Success Criteria**: 99.9% API call success rate with proper error recovery

### TR-5: Security Hardening
- **Requirement**: Production-grade security configurations
- **Components**:
  - HTTPS enforcement in production
  - Secure cookie flags (HttpOnly, Secure, SameSite)
  - Strict CORS origin whitelisting
  - Proper CSP headers
- **Success Criteria**: Pass security audit with no critical findings

## Constraints and Assumptions

### Technical Constraints
- Must maintain existing Docker container architecture
- Cannot break existing authentication flows during transition
- Must support dual-domain setup (revivatech.co.uk, revivatech.com.br)
- Backward compatibility required for existing environment variables

### Business Constraints  
- Zero downtime deployment required
- Must not impact developer productivity during implementation
- Changes must be reversible with rollback plan
- Implementation must be completed in phases

### Assumptions
- Current Better Auth implementation is fundamentally sound
- Docker container networking configuration is optimal
- Existing API endpoints are correctly implemented
- Development team has access to all necessary environment configurations

## Success Metrics

### Compliance Metrics
- [ ] Zero hardcoded IPs or domains in codebase
- [ ] 100% CLAUDE.md rule compliance
- [ ] All environment variables follow standard naming convention

### Reliability Metrics  
- [ ] 100% authentication success rate across environments
- [ ] Zero configuration-related deployment failures
- [ ] API calls succeed with fallback mechanisms

### Security Metrics
- [ ] HTTPS enforced in production environments
- [ ] Secure cookie configuration verified
- [ ] CORS policies properly implemented and tested

### Performance Metrics
- [ ] No performance degradation from configuration changes
- [ ] Hot reload functionality maintained
- [ ] API response times within acceptable ranges

## Acceptance Criteria

### Phase 1: Critical Fixes
- [ ] All hardcoded Tailscale IPs removed from codebase
- [ ] Better Auth URL configuration standardized across environments  
- [ ] HTTP/HTTPS protocol handling implemented consistently
- [ ] All authentication flows tested and working

### Phase 2: Standardization
- [ ] Environment variable naming convention implemented
- [ ] Error handling and fallback mechanisms added
- [ ] Configuration validation implemented
- [ ] Documentation updated

### Phase 3: Security & Validation
- [ ] Security configurations hardened for production
- [ ] Comprehensive testing suite implemented  
- [ ] Monitoring and logging enhanced
- [ ] Final security audit passed

## Dependencies

### Internal Dependencies
- Docker container configuration access
- Environment variable management system
- Git repository access for backups
- Testing environment availability

### External Dependencies  
- Better Auth library compatibility
- Next.js framework constraints
- SSL certificate management
- Domain DNS configuration

## Risk Assessment

### High Risk
- **Authentication System Disruption**: Changes to auth configuration could break login flows
- **Mitigation**: Comprehensive backup strategy, incremental rollout, extensive testing

### Medium Risk  
- **Environment Configuration Drift**: Different environments could have inconsistent configurations
- **Mitigation**: Standardized deployment scripts, configuration validation

### Low Risk
- **Performance Impact**: URL resolution changes could affect performance
- **Mitigation**: Performance testing, optimization if needed

## Compliance Requirements

### CLAUDE.md Compliance
- RULE 1: 6-Step Methodology (IDENTIFY → VERIFY → ANALYZE → DECISION → TEST → DOCUMENT)
- RULE 2: Complex Feature Specs (requirements.md, design.md, tasks.md)
- RULE 3: Config Safety (no hardcoded Tailscale IPs)
- RULE 4: Connection Over Creation (integrate existing systems)

### Security Compliance
- HTTPS enforcement in production
- Secure authentication token handling
- CORS policy implementation
- Data privacy protection

## Timeline

### Immediate (Week 1)
- Complete backup strategy implementation
- Critical compliance fixes (hardcoded IPs, auth URLs)

### Short Term (Week 2-3)
- Environment variable standardization
- Error handling enhancement
- Security configuration hardening

### Long Term (Week 4+)
- Comprehensive testing implementation
- Monitoring and logging enhancements
- Documentation finalization

---

**Document Version**: 1.0  
**Last Updated**: $(date)  
**Next Review**: After implementation completion