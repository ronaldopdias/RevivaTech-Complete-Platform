# Admin Authentication Setup Documentation

## Overview
This document describes the authentication configuration for the RevivaTech admin panel, including the fix implemented to ensure proper redirect flow for unauthenticated users.

## Authentication Flow

### Current Implementation (Fixed)
When a user accesses `/admin` without authentication:
1. The `ProtectedRoute` component checks authentication status
2. If not authenticated, user is redirected to `/admin/login`
3. After successful login, user is redirected back to admin dashboard

### Components Involved

#### 1. Admin Page (`/src/app/admin/page.tsx`)
```typescript
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { UserRole } from '@/lib/auth/types';

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute 
      requiredRole={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}
      redirectTo="/admin/login"
    >
      {/* Admin dashboard content */}
    </ProtectedRoute>
  );
}
```

#### 2. ProtectedRoute Component (`/src/components/auth/ProtectedRoute.tsx`)
- Handles authentication checks
- Manages role-based access control
- Provides redirect functionality
- Shows loading state during auth verification

#### 3. Admin Layout (`/src/app/admin/layout.tsx`)
- Wraps child admin pages with authentication
- Excludes `/admin/login` from auth requirements
- Provides consistent admin navigation

## Configuration Requirements

### Required Roles
The admin panel requires one of the following roles:
- `UserRole.ADMIN` - Standard admin access
- `UserRole.SUPER_ADMIN` - Full system access

### Redirect URLs
- **Login Page**: `/admin/login`
- **After Login**: Returns to originally requested page
- **Logout**: Redirects to `/admin/login`

### Environment Variables
Ensure these are set in your `.env` file:
```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3011
```

## Authentication Context
The authentication system uses React Context (`AuthContext`) to manage:
- User state
- Authentication status
- Role checking
- Permission validation

### Key Functions
- `useAuth()` - Hook to access auth state
- `isAuthenticated` - Boolean indicating auth status
- `user` - Current user object with role information
- `checkPermission()` - Validate specific permissions

## Troubleshooting

### Common Issues

1. **"Access Denied" Message**
   - **Cause**: Page not wrapped with ProtectedRoute
   - **Fix**: Wrap page component with ProtectedRoute

2. **Redirect Loop**
   - **Cause**: Login page has auth requirement
   - **Fix**: Exclude login page from auth checks in layout

3. **Role Not Recognized**
   - **Cause**: User role not matching required roles
   - **Fix**: Verify user has ADMIN or SUPER_ADMIN role in database

### Testing Authentication

1. **Test Unauthenticated Access**:
   ```bash
   curl -I http://localhost:3010/admin
   # Should redirect to login
   ```

2. **Test with Invalid Role**:
   - Login as customer user
   - Try accessing `/admin`
   - Should see "Access Denied" with proper message

3. **Test with Valid Role**:
   - Login as admin user
   - Access `/admin`
   - Should see dashboard

## Security Best Practices

1. **Always Use ProtectedRoute**
   - Wrap all admin pages with authentication
   - Specify required roles explicitly

2. **Server-Side Validation**
   - Client-side auth is for UX only
   - Always validate on API endpoints

3. **Session Management**
   - Use secure, httpOnly cookies
   - Implement session timeout
   - Clear sessions on logout

## Code Examples

### Protected Admin Page Template
```typescript
'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { UserRole } from '@/lib/auth/types';
import AdminLayout from '@/components/admin/AdminLayout';

export default function AdminFeaturePage() {
  return (
    <ProtectedRoute 
      requiredRole={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}
      redirectTo="/admin/login"
    >
      <AdminLayout title="Feature Name">
        {/* Page content */}
      </AdminLayout>
    </ProtectedRoute>
  );
}
```

### Role-Based Component Rendering
```typescript
import { AuthGuard } from '@/components/auth/AuthGuard';
import { UserRole } from '@/lib/auth/types';

// Show component only for super admins
<AuthGuard 
  role={UserRole.SUPER_ADMIN}
  fallback={<p>This feature requires super admin access</p>}
>
  <SuperAdminFeature />
</AuthGuard>
```

## Maintenance Notes

- **Container Restart**: Always restart after auth changes
  ```bash
  docker restart revivatech_new_frontend
  ```

- **Cache Clearing**: Clear browser cache if auth state stuck
- **Session Storage**: Check Redis for session data

## Related Files
- `/src/lib/auth/AuthContext.tsx` - Auth context provider
- `/src/components/auth/ProtectedRoute.tsx` - Route protection
- `/src/components/auth/AuthGuard.tsx` - Component protection
- `/src/app/admin/login/page.tsx` - Admin login page
- `/src/app/admin/layout.tsx` - Admin layout with auth

---

Last Updated: July 22, 2025
Fix Commit: e4a7822