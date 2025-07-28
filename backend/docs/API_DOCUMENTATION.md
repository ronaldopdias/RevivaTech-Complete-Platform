# RevivaTech API Documentation v2.0.0

## Overview

The RevivaTech API provides comprehensive endpoints for managing a computer repair shop business. This RESTful API supports customer bookings, device management, authentication, analytics, and administrative functions.

**Base URL**: `http://localhost:3011` (Development) | `https://api.revivatech.co.uk` (Production)  
**API Version**: 2.0.0  
**Authentication**: JWT Bearer Token  

## Authentication

### JWT Authentication
All protected endpoints require a Bearer token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

### Obtaining Access Tokens

**POST** `/api/auth/login`
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "user123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "CUSTOMER"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_token_here",
    "expiresIn": "24h"
  }
}
```

## API Services

### 1. Authentication Service (`/api/auth`)

#### Register New User
**POST** `/api/auth/register`
```json
{
  "email": "customer@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+44 123 456 7890"
}
```

#### Login User
**POST** `/api/auth/login`
```json
{
  "email": "customer@example.com",
  "password": "SecurePass123"
}
```

#### Refresh Token
**POST** `/api/auth/refresh`
```json
{
  "refreshToken": "your_refresh_token"
}
```

#### Get Current User Profile
**GET** `/api/auth/me`
- **Authentication**: Required
- **Response**: User profile information

#### Health Check
**GET** `/api/auth/health`
- **Authentication**: None
- **Response**: Service health status

---

### 2. Devices Service (`/api/devices`)

#### Get Device Categories
**GET** `/api/devices/categories`
- **Authentication**: None
- **Response**: List of 14 device categories (MacBook, iPhone, iPad, etc.)

```json
{
  "success": true,
  "categories": [
    {
      "id": "cmd1rthbh0000lfdclp2m957z",
      "name": "MacBook",
      "slug": "macbook",
      "description": "Apple MacBook laptops - Air and Pro models",
      "iconName": "laptop",
      "sortOrder": 1
    }
  ]
}
```

#### Get Device Brands by Category
**GET** `/api/devices/categories/{categoryId}/brands`
- **Authentication**: None
- **Response**: Device brands for specific category

#### Get Device Models by Brand
**GET** `/api/devices/brands/{brandId}/models`
- **Authentication**: None
- **Response**: Device models (135+ available)

#### Get Device Details
**GET** `/api/devices/models/{modelId}`
- **Authentication**: None
- **Response**: Detailed device specifications

---

### 3. Customers Service (`/api/customers`)

#### Get Customer Bookings
**GET** `/api/customers/my-bookings`
- **Authentication**: Required (CUSTOMER role)
- **Response**: Customer's repair bookings and history

```json
{
  "success": true,
  "data": [
    {
      "id": "booking123",
      "deviceModel": "MacBook Air 13\" M3",
      "deviceBrand": "Apple",
      "repairType": "SCREEN_REPAIR",
      "status": "PENDING",
      "basePrice": 150.00,
      "createdAt": "2025-07-23T12:00:00Z"
    }
  ]
}
```

#### Get Customer Dashboard Stats
**GET** `/api/customers/dashboard-stats`
- **Authentication**: Required (CUSTOMER role)
- **Response**: Customer statistics (total bookings, spending, etc.)

#### Get Recent Activity
**GET** `/api/customers/recent-activity`
- **Authentication**: Required (CUSTOMER role)
- **Response**: Recent booking updates and notifications

#### Get Customer Profile
**GET** `/api/customers/profile`
- **Authentication**: Required (CUSTOMER role)
- **Response**: Customer profile information

#### Update Customer Profile
**PUT** `/api/customers/profile`
- **Authentication**: Required (CUSTOMER role)
- **Body**: Profile update data

---

### 4. Bookings Service (`/api/bookings`)

#### Create New Booking
**POST** `/api/bookings`
- **Authentication**: Optional (supports anonymous bookings)
```json
{
  "deviceModelId": "cmd1rthd4001xlfdcj9kfvor7",
  "repairType": "SCREEN_REPAIR",
  "problemDescription": "Screen has visible cracks",
  "urgencyLevel": "STANDARD",
  "customerInfo": {
    "name": "John Smith",
    "email": "john@example.com",
    "phone": "+44123456789"
  },
  "deviceCondition": {
    "physicalDamage": "Cracked screen",
    "functionalIssues": "Touch not working"
  }
}
```

#### Get All Bookings (Admin)
**GET** `/api/bookings`
- **Authentication**: Required (ADMIN role)
- **Response**: All bookings with pagination

#### Get Booking Details
**GET** `/api/bookings/{bookingId}`
- **Authentication**: Required
- **Response**: Detailed booking information

#### Update Booking Status
**PUT** `/api/bookings/{bookingId}/status`
- **Authentication**: Required (ADMIN/TECHNICIAN role)
```json
{
  "status": "IN_PROGRESS",
  "notes": "Started repair process"
}
```

---

### 5. Pricing Service (`/api/pricing`)

#### Calculate Repair Price
**POST** `/api/pricing/calculate`
- **Authentication**: None
```json
{
  "deviceModelId": "cmd1rthd4001xlfdcj9kfvor7",
  "repairType": "SCREEN_REPAIR",
  "urgencyLevel": "STANDARD"
}
```

**Response**:
```json
{
  "success": true,
  "pricing": {
    "basePrice": 150.00,
    "urgencyMultiplier": 1.0,
    "finalPrice": 150.00,
    "estimatedTime": "2-3 business days",
    "warranty": "90 days"
  }
}
```

---

### 6. Repairs Service (`/api/repairs`)

#### Get Repair Queue (Admin)
**GET** `/api/repairs`
- **Authentication**: Required (ADMIN/TECHNICIAN role)
- **Response**: Current repair queue with status

#### Update Repair Progress
**PUT** `/api/repairs/{repairId}/progress`
- **Authentication**: Required (TECHNICIAN role)
```json
{
  "status": "IN_PROGRESS",
  "progress": 50,
  "notes": "Waiting for parts",
  "estimatedCompletion": "2025-07-25T16:00:00Z"
}
```

---

### 7. Analytics Service (`/api/analytics`)

#### Get Business Analytics
**GET** `/api/analytics/dashboard`
- **Authentication**: Required (ADMIN role)
- **Response**: Business performance metrics

#### Get Revenue Analytics
**GET** `/api/analytics/revenue`
- **Authentication**: Required (ADMIN role)
- **Response**: Revenue and financial metrics

---

## Health & Monitoring Endpoints

### Basic Health Check
**GET** `/health`
- **Response**: Basic service health status

### Comprehensive Health Monitoring
**GET** `/api/health`
- **Response**: Detailed system health with database connectivity

### Readiness Probe
**GET** `/api/health/ready`
- **Response**: Service readiness for container orchestration

### Liveness Probe
**GET** `/api/health/live`
- **Response**: Service liveness status

### Performance Metrics
**GET** `/api/health/metrics`
- **Response**: System performance and database metrics

### Detailed Status
**GET** `/api/health/status`
- **Response**: Comprehensive system component status

---

## Error Responses

All API endpoints return standardized error responses:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": ["Additional error details"]
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `429` - Too Many Requests
- `500` - Internal Server Error
- `503` - Service Unavailable

## Rate Limiting

- **Authentication endpoints**: 5 requests per 15 minutes
- **General endpoints**: 20 requests per 15 minutes
- **Customer endpoints**: 50 requests per 15 minutes

## Security Features

1. **JWT Authentication** with `revivatech-app` audience
2. **Password complexity requirements** (8+ chars, uppercase, lowercase, number)
3. **Rate limiting** on authentication endpoints
4. **Role-based access control** (CUSTOMER, ADMIN, TECHNICIAN)
5. **CORS protection** with allowed origins
6. **Helmet security headers**
7. **Request logging** for monitoring

## Database Schema

- **44 tables** in production database
- **Device catalog**: 14 categories, 27+ brands, 135+ models
- **Real data integration**: All endpoints return production data
- **Zero mock services**: 100% real API integration

## Development Information

- **Node.js**: v18.20.8
- **Database**: PostgreSQL
- **Cache**: Redis
- **Authentication**: JWT with bcrypt password hashing
- **Environment**: Containerized with Docker
- **Monitoring**: Comprehensive health checks and metrics

---

**API Version**: 2.0.0  
**Last Updated**: July 23, 2025  
**Documentation Status**: Production Ready  