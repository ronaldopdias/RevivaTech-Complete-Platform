# RevivaTech Environment Variable Schema

## Overview

This document defines the standardized environment variable schema for RevivaTech's container networking architecture. The schema separates internal container communication from external access patterns, enabling robust networking that survives container name changes and deployment scenarios.

## Environment Variable Categories

### Internal Container Communication
These variables are used for service-to-service communication within the Docker network:

```bash
# Backend Service Internal URL (container networking)
BACKEND_INTERNAL_URL=http://revivatech_backend:3011

# Database Internal Connection (container networking)  
DATABASE_INTERNAL_HOST=revivatech_database
DATABASE_INTERNAL_PORT=5432

# Redis Internal Connection (container networking)
REDIS_INTERNAL_URL=redis://revivatech_redis:6379

# Network Configuration
DOCKER_NETWORK_NAME=revivatech_network
```

### External Client Access
These variables are used for client-side access and external connections:

```bash
# Public API URL (client-side access)
NEXT_PUBLIC_API_URL=http://localhost:3011  # Development
NEXT_PUBLIC_API_URL=https://api.revivatech.co.uk  # Production

# WebSocket URL (client-side)
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:3011  # Development  
NEXT_PUBLIC_WEBSOCKET_URL=wss://api.revivatech.co.uk  # Production

# Domain Configuration
NEXT_PUBLIC_DOMAIN=revivatech.co.uk
NEXT_PUBLIC_HTTPS_PORT=3010
```

### Service Configuration
Service-specific configuration variables:

```bash
# Frontend Configuration
FRONTEND_INTERNAL_PORT=3010
FRONTEND_EXTERNAL_PORT=3010

# Backend Configuration  
BACKEND_INTERNAL_PORT=3011
BACKEND_EXTERNAL_PORT=3011

# Database Configuration
DB_HOST=${DATABASE_INTERNAL_HOST}
DB_PORT=${DATABASE_INTERNAL_PORT}
DB_NAME=revivatech
DB_USER=revivatech
DB_PASSWORD=revivatech_password

# Redis Configuration
REDIS_HOST=revivatech_redis
REDIS_PORT=6379
REDIS_URL=${REDIS_INTERNAL_URL}
```

## Environment-Specific Values

### Development Environment
```bash
# Internal communication (container-to-container)
BACKEND_INTERNAL_URL=http://revivatech_backend:3011
DATABASE_INTERNAL_HOST=revivatech_database
REDIS_INTERNAL_URL=redis://revivatech_redis:6379

# External access (development)
NEXT_PUBLIC_API_URL=http://localhost:3011
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:3011
NEXT_PUBLIC_DOMAIN=localhost
```

### Production Environment
```bash
# Internal communication (container-to-container)
BACKEND_INTERNAL_URL=http://revivatech_backend:3011
DATABASE_INTERNAL_HOST=revivatech_database  
REDIS_INTERNAL_URL=redis://revivatech_redis:6379

# External access (production)
NEXT_PUBLIC_API_URL=https://api.revivatech.co.uk
NEXT_PUBLIC_WEBSOCKET_URL=wss://api.revivatech.co.uk
NEXT_PUBLIC_DOMAIN=revivatech.co.uk
```

## Variable Usage Patterns

### Server-Side Code (Backend, SSR)
Use **INTERNAL** variables for service communication:
```typescript
// ✅ CORRECT - Server-side uses internal container networking
const backendUrl = process.env.BACKEND_INTERNAL_URL || 'http://revivatech_backend:3011';
const dbHost = process.env.DATABASE_INTERNAL_HOST || 'revivatech_database';
```

### Client-Side Code (Browser, Frontend)
Use **NEXT_PUBLIC** variables or proxy routing:
```typescript
// ✅ CORRECT - Client-side uses public URLs or proxy
const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''; // Empty = use proxy
const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:3011';
```

### Universal Code (Server + Client)
Use environment detection pattern:
```typescript
// ✅ CORRECT - Environment-aware URL resolution
function getApiUrl(): string {
  if (typeof window === 'undefined') {
    // Server-side: use internal container networking
    return process.env.BACKEND_INTERNAL_URL || 'http://revivatech_backend:3011';
  }
  // Client-side: use public URL or proxy
  return process.env.NEXT_PUBLIC_API_URL || '';
}
```

## Migration from Legacy Variables

### Legacy Variable Mapping
```bash
# OLD (problematic)
NEXT_PUBLIC_API_URL=http://localhost:3011  # Used for both internal and external

# NEW (environment-aware)
BACKEND_INTERNAL_URL=http://revivatech_backend:3011  # Internal only
NEXT_PUBLIC_API_URL=http://localhost:3011            # External only
```

### Container Name Migration
```bash
# OLD container references
revivatech_new_frontend -> revivatech_frontend
revivatech_new_backend -> revivatech_backend  
revivatech_new_database -> revivatech_database
revivatech_new_redis -> revivatech_redis
```

## Validation Rules

### Required Variables (All Environments)
- `BACKEND_INTERNAL_URL` - Must be valid HTTP URL with container name
- `DATABASE_INTERNAL_HOST` - Must be valid hostname (container name)
- `REDIS_INTERNAL_URL` - Must be valid Redis URL with container name

### Development-Specific Requirements
- `NEXT_PUBLIC_API_URL` - Must point to localhost:3011 for external access
- External ports must be exposed for development access

### Production-Specific Requirements  
- `NEXT_PUBLIC_API_URL` - Must use HTTPS with valid domain
- `NEXT_PUBLIC_WEBSOCKET_URL` - Must use WSS with valid domain
- Internal URLs must not be exposed externally

## Security Considerations

### Internal Variables
- Internal URLs should **never** be exposed to client-side code
- Internal hostnames should only resolve within container network
- Internal credentials should not be logged or exposed

### External Variables
- External URLs must use HTTPS in production
- External access should be properly authenticated
- Rate limiting should be applied to external endpoints

## Error Handling

### Missing Variables
- Server should fail startup if required internal variables are missing
- Client should gracefully degrade if public variables are missing
- Clear error messages should indicate which variables are required

### Invalid Variables
- URL validation should occur at startup
- Network connectivity should be verified during health checks
- Configuration validation should prevent deployment of invalid configs

## Examples

### Docker Compose Integration
```yaml
services:
  revivatech_frontend:
    environment:
      - BACKEND_INTERNAL_URL=http://revivatech_backend:3011
      - NEXT_PUBLIC_API_URL=http://localhost:3011
      - NEXT_PUBLIC_DOMAIN=localhost
    
  revivatech_backend:
    environment:
      - DATABASE_INTERNAL_HOST=revivatech_database
      - REDIS_INTERNAL_URL=redis://revivatech_redis:6379
```

### Service Integration
```typescript
// API service with environment-aware URL resolution
class ApiService {
  private getBaseUrl(): string {
    if (typeof window === 'undefined') {
      return process.env.BACKEND_INTERNAL_URL || 'http://revivatech_backend:3011';
    }
    return process.env.NEXT_PUBLIC_API_URL || '';
  }
  
  async get(endpoint: string): Promise<any> {
    const url = `${this.getBaseUrl()}${endpoint}`;
    return fetch(url);
  }
}
```

---

**Document Version:** 1.0  
**Created:** August 14, 2025  
**Author:** Container Networking Overhaul Project