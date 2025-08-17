# Admin Login Fix - Requirements Document

## Introduction

The admin login functionality at https://revivatech.co.uk/admin/login is currently failing with a "Login failed" message despite having valid credentials (admin@revivatech.co.uk / admin123). This spec addresses the need to diagnose and fix the authentication flow to ensure admin users can successfully access the admin dashboard.

## Requirements

### Requirement 1: Admin Authentication Diagnosis

**User Story:** As a system administrator, I want to understand why the admin login is failing so that I can identify the root cause of the authentication issue.

#### Acceptance Criteria

1. WHEN the system performs authentication diagnostics THEN it SHALL verify backend API connectivity
2. WHEN the system tests the auth endpoint THEN it SHALL confirm the login API is responding correctly
3. WHEN the system checks user credentials THEN it SHALL verify the admin user exists in the database
4. WHEN the system validates the auth flow THEN it SHALL identify any CORS, network, or API configuration issues
5. IF authentication fails THEN the system SHALL provide detailed error logging for troubleshooting

### Requirement 2: Admin Login Flow Repair

**User Story:** As an admin user, I want to successfully log in to the admin dashboard using my credentials so that I can access administrative functions.

#### Acceptance Criteria

1. WHEN an admin user enters valid credentials (admin@revivatech.co.uk / admin123) THEN the system SHALL authenticate successfully
2. WHEN authentication succeeds THEN the system SHALL redirect the user to the admin dashboard
3. WHEN authentication fails with invalid credentials THEN the system SHALL display appropriate error messages
4. WHEN the system encounters network errors THEN it SHALL provide user-friendly error feedback
5. WHEN an admin user is authenticated THEN the system SHALL maintain the session properly

### Requirement 3: Authentication Error Handling

**User Story:** As an admin user, I want clear feedback when login fails so that I can understand what went wrong and how to resolve it.

#### Acceptance Criteria

1. WHEN login fails due to invalid credentials THEN the system SHALL display "Invalid email or password"
2. WHEN login fails due to network issues THEN the system SHALL display "Connection error - please try again"
3. WHEN login fails due to server errors THEN the system SHALL display "Server error - please contact support"
4. WHEN rate limiting is triggered THEN the system SHALL display appropriate lockout messages
5. WHEN the backend is unreachable THEN the system SHALL provide fallback error handling

### Requirement 4: Admin Session Management

**User Story:** As an admin user, I want my login session to be properly managed so that I can work efficiently without unexpected logouts.

#### Acceptance Criteria

1. WHEN an admin successfully logs in THEN the system SHALL store authentication tokens securely
2. WHEN tokens expire THEN the system SHALL attempt automatic refresh
3. WHEN token refresh fails THEN the system SHALL redirect to login with appropriate messaging
4. WHEN an admin navigates between admin pages THEN the system SHALL maintain authentication state
5. WHEN an admin logs out THEN the system SHALL clear all authentication data

### Requirement 5: Admin Role Verification

**User Story:** As a system administrator, I want to ensure only users with admin roles can access the admin dashboard so that security is maintained.

#### Acceptance Criteria

1. WHEN a user logs in THEN the system SHALL verify their role is ADMIN or SUPER_ADMIN
2. WHEN a non-admin user attempts admin login THEN the system SHALL deny access with "Admin privileges required"
3. WHEN role verification fails THEN the system SHALL log the security event
4. WHEN an admin's role is revoked THEN existing sessions SHALL be invalidated
5. WHEN role verification succeeds THEN the system SHALL grant appropriate admin permissions