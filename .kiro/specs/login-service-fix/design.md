# Login Service Fix - Design Document

## Overview

The login service failure is caused by multiple interconnected issues in the authentication pipeline. The primary problems identified are:

1. **Database Configuration Mismatch**: Backend is configured to connect to "revivatech_new" but the actual database is "revivatech"
2. **API Route Mapping Issues**: Frontend proxy is not correctly mapping authentication endpoints to the backend
3. **Request/Response Format Inconsistencies**: Mismatch between frontend client expectations and backend response format
4. **Environment Variable Conflicts**: Multiple conflicting database configurations in environment files

## Architecture

### Current Authentication Flow
```
Frontend (port 3010) → Next.js API Route (/api/auth/[...auth]) → Backend Proxy → Backend Service (port 3011) → Database (port 5435)
```

### Problem Points Identified
1. **Database Connection**: Backend server.js uses `DB_NAME=revivatech_new` but database is `revivatech`
2. **API Proxy**: Frontend proxy maps `/api/auth/sign-in/email` to `/api/better-auth/sign-in` but backend expects different format
3. **Response Format**: Backend returns Better Auth format but frontend client expects different structure
4. **Session Management**: Cookie domain and security settings may be incorrect for development environment

## Components and Interfaces

### 1. Database Connection Component
**File**: `backend/server.js`
**Issue**: PostgreSQL pool configuration uses incorrect database name
**Fix**: Update database connection to use correct database name and credentials

```javascript
// Current (incorrect)
const pool = new Pool({
  database: process.env.DB_NAME || 'revivatech_new',
  // ...
});

// Fixed
const pool = new Pool({
  database: 'revivatech', // Use actual database name
  // ...
});
```

### 2. API Route Proxy Component
**File**: `frontend/src/app/api/auth/[...auth]/route.ts`
**Issue**: Incorrect endpoint mapping and response handling
**Fix**: Correct the endpoint mapping logic and response processing

### 3. Better Auth Backend Routes
**File**: `backend/routes/better-auth.js`
**Issue**: Response format doesn't match frontend client expectations
**Fix**: Ensure response format matches Better Auth client requirements

### 4. Frontend Authentication Client
**File**: `frontend/src/lib/auth/better-auth-client.ts`
**Issue**: Error handling and response parsing issues
**Fix**: Improve error handling and response format validation

## Data Models

### Authentication Request Format
```typescript
interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}
```

### Authentication Response Format
```typescript
interface LoginResponse {
  success: boolean;
  data?: {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
      // ...
    };
    session: {
      id: string;
      userId: string;
      expiresAt: Date;
    };
  };
  error?: {
    code: string;
    message: string;
  };
}
```

### Database Schema Validation
Ensure the following tables exist and have correct structure:
- `users` table with correct column names and types
- `session` table for Better Auth sessions
- `account` table for Better Auth accounts

## Error Handling

### 1. Database Connection Errors
- Implement connection retry logic
- Add detailed logging for connection failures
- Provide fallback error responses

### 2. Authentication Validation Errors
- Validate request format before processing
- Return specific error codes for different failure types
- Log authentication attempts for security monitoring

### 3. API Proxy Errors
- Handle network timeouts and connection failures
- Implement retry logic for transient failures
- Provide meaningful error messages to frontend

## Testing Strategy

### 1. Database Connection Testing
- Test database connectivity with correct credentials
- Verify user table structure and data
- Test password hash verification

### 2. API Endpoint Testing
- Test direct backend authentication endpoints
- Test frontend proxy routing
- Verify request/response format compatibility

### 3. Integration Testing
- Test complete authentication flow from frontend to database
- Verify session creation and cookie handling
- Test error scenarios and recovery

### 4. Manual Testing Scenarios
- Test with known valid credentials (admin@revivatech.co.uk)
- Test with invalid credentials
- Test session persistence across page refreshes
- Test logout functionality

## Implementation Priority

### Phase 1: Critical Fixes (Immediate)
1. Fix database connection configuration
2. Correct API route mapping
3. Fix response format issues

### Phase 2: Enhancement (Follow-up)
1. Improve error handling and logging
2. Add comprehensive testing
3. Optimize session management

### Phase 3: Monitoring (Ongoing)
1. Add authentication metrics
2. Implement security monitoring
3. Performance optimization

## Configuration Changes Required

### Backend Environment Variables
```env
# Fix database configuration
DB_NAME=revivatech
DATABASE_URL=postgresql://revivatech:revivatech_password@localhost:5435/revivatech
BETTER_AUTH_DATABASE_URL=postgresql://revivatech:revivatech_password@localhost:5435/revivatech
```

### Frontend API Proxy Configuration
- Update endpoint mapping logic
- Fix response format handling
- Improve error handling

### Cookie Configuration
- Set correct domain for development environment
- Ensure proper security settings
- Fix SameSite and Secure attributes

## Security Considerations

1. **Password Security**: Ensure bcrypt hashing is working correctly
2. **Session Security**: Verify session tokens are properly generated and validated
3. **CORS Configuration**: Ensure CORS settings allow proper authentication flow
4. **Rate Limiting**: Verify rate limiting is not blocking legitimate requests
5. **Error Information**: Avoid leaking sensitive information in error messages

## Performance Considerations

1. **Database Connection Pooling**: Ensure connection pool is properly configured
2. **Session Storage**: Optimize session storage and retrieval
3. **API Response Times**: Monitor and optimize authentication response times
4. **Caching**: Implement appropriate caching for user data and sessions