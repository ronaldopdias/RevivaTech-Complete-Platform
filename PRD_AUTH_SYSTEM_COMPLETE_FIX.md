# 📋 **COMPREHENSIVE PRD: Authentication System Complete Recreation**

## 🎯 **EXECUTIVE SUMMARY**

**Project**: RevivaTech Authentication System - Fresh Start Implementation  
**Approach**: COMPLETE RECREATION - No data preservation needed  
**Priority**: CRITICAL - P0  
**Timeline**: 1-2 days implementation  
**Risk Level**: LOW - No existing user data to protect  
**Created**: August 30, 2025

## 🔄 **FRESH START STRATEGY**

Since there's **no important user data to preserve**, we can take the cleanest approach:
1. **DROP** all existing authentication tables
2. **CREATE** new Better Auth-compliant schema from scratch
3. **IMPLEMENT** proper configuration from day one
4. **TEST** with fresh data
5. **REMOVE** all duplicate/legacy files

## 📊 **SCOPE & OBJECTIVES**

### Primary Objectives
1. **Build new Better Auth v1.3.7 compliant system from scratch**
2. **Implement Google OAuth with progressive registration**
3. **Ensure proper field naming conventions throughout**
4. **Create clean, maintainable authentication architecture**
5. **Establish comprehensive testing framework**
6. **Remove all legacy authentication files and duplicates**

### Success Criteria
- ✅ Google OAuth works on first attempt
- ✅ Progressive registration captures phone numbers
- ✅ Clean database schema matching Better Auth exactly
- ✅ No legacy compatibility issues
- ✅ Zero authentication errors
- ✅ Professional error handling (no container hostnames)
- ✅ No duplicate files or code left behind

## 🏗️ **IMPLEMENTATION PLAN - CLEAN SLATE APPROACH**

### **Phase 1: Complete Cleanup (30 minutes)**

#### TODO List for Phase 1:
- [ ] Backup current database (just in case)
- [ ] Drop all existing auth tables
- [ ] Remove all old auth-related files
- [ ] Clear Prisma generated files
- [ ] Document removed files for reference

#### 1.1 Database Reset
```sql
-- Drop all existing auth tables
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS verification_tokens CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS verification CASCADE;
DROP TABLE IF EXISTS authenticator CASCADE;
DROP TABLE IF EXISTS user_two_factor CASCADE;

-- Clean up User table auth fields
ALTER TABLE users 
  DROP COLUMN IF EXISTS password_hash,
  DROP COLUMN IF EXISTS googleId,
  DROP COLUMN IF EXISTS profilePicture,
  DROP COLUMN IF EXISTS locale,
  DROP COLUMN IF EXISTS domain,
  DROP COLUMN IF EXISTS registrationStatus,
  DROP COLUMN IF EXISTS profileCompletedAt;
```

#### 1.2 File Cleanup (CRITICAL - Remove ALL Duplicates)
```bash
# List of files to be REMOVED (no duplicates left behind)
# Backend auth files
rm -f backend/lib/better-auth-fixed.js
rm -f backend/lib/better-auth-express-handler.js
rm -f backend/lib/better-auth.js
rm -f backend/lib/auth-handler.js
rm -f backend/routes/test-better-auth.js
rm -f backend/routes/auth.js
rm -f backend/routes/auth-routes.js

# Old migration files
rm -f backend/database/migrations/005_better_auth_schema_alignment.sql
rm -f backend/database/migrations/*auth*.sql

# Duplicate schema files
rm -f backend/schema-better-auth.prisma
rm -f backend/prisma/schema-backup.prisma

# Clear Prisma generated files
rm -rf backend/node_modules/.prisma
rm -rf backend/prisma/migrations

# Frontend old auth files
rm -rf frontend/src/lib/auth-old.ts
rm -rf frontend/src/lib/better-auth-client.ts
rm -rf frontend/src/hooks/useAuth.ts
rm -rf frontend/src/hooks/useProfileCompletion.ts
```

### **Phase 2: Fresh Schema Creation (1 hour)**

#### TODO List for Phase 2:
- [ ] Create new Better Auth migration SQL
- [ ] Update Prisma schema with Better Auth format
- [ ] Add all required fields and relations
- [ ] Create necessary indexes
- [ ] Validate schema against Better Auth docs

#### 2.1 New Better Auth Migration
```sql
-- Migration: 001_better_auth_fresh_start.sql
-- Purpose: Create Better Auth v1.3.7 compliant schema from scratch
-- Date: August 30, 2025

-- Create User table extensions
ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS image TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS emailVerified BOOLEAN DEFAULT false;

-- Add Google OAuth fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS googleId VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profilePicture TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locale VARCHAR(10);
ALTER TABLE users ADD COLUMN IF NOT EXISTS domain VARCHAR(255);

-- Add Progressive Registration fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS registrationStatus VARCHAR(50) DEFAULT 'PENDING_PROFILE_COMPLETION';
ALTER TABLE users ADD COLUMN IF NOT EXISTS profileCompletedAt TIMESTAMP;

-- Create Account table (Better Auth format)
CREATE TABLE account (
  id                    VARCHAR(255) PRIMARY KEY,
  accountId             VARCHAR(255) NOT NULL,
  providerId            VARCHAR(255) NOT NULL,
  userId                VARCHAR(255) NOT NULL,
  accessToken           TEXT,
  refreshToken          TEXT,
  idToken               TEXT,
  accessTokenExpiresAt  TIMESTAMP,
  refreshTokenExpiresAt TIMESTAMP,
  scope                 TEXT,
  password              TEXT,
  createdAt             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(providerId, accountId)
);

-- Create Session table (Better Auth format)
CREATE TABLE session (
  id        VARCHAR(255) PRIMARY KEY,
  expiresAt TIMESTAMP NOT NULL,
  token     VARCHAR(255) UNIQUE NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ipAddress VARCHAR(45),
  userAgent TEXT,
  userId    VARCHAR(255) NOT NULL,
  
  CONSTRAINT fk_session_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Create Verification table (Better Auth format)
CREATE TABLE verification (
  id         VARCHAR(255) PRIMARY KEY,
  identifier VARCHAR(255) NOT NULL,
  value      VARCHAR(255) NOT NULL,
  expiresAt  TIMESTAMP NOT NULL,
  createdAt  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_account_userId ON account(userId);
CREATE INDEX idx_account_providerId ON account(providerId);
CREATE INDEX idx_session_userId ON session(userId);
CREATE INDEX idx_session_token ON session(token);
CREATE INDEX idx_verification_identifier ON verification(identifier);
```

#### 2.2 New Prisma Schema (Complete - SINGLE SOURCE OF TRUTH)
```prisma
// schema.prisma - Fresh Better Auth v1.3.7 compliant schema
// This is the ONLY schema file - no duplicates

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// User model with Better Auth requirements
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String    
  image         String?   
  emailVerified Boolean   @default(false)
  
  // Standard fields
  firstName     String?
  lastName      String?
  phone         String?
  role          UserRole  @default(CUSTOMER)
  isActive      Boolean   @default(true)
  
  // Google OAuth fields
  googleId      String?   @unique
  profilePicture String?
  locale        String?
  domain        String?
  
  // Progressive Registration
  registrationStatus   RegistrationStatus @default(PENDING_PROFILE_COMPLETION)
  profileCompletedAt   DateTime?
  
  // Timestamps
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Relations
  accounts      Account[]
  sessions      Session[]
  
  @@map("user")
}

// Account model - Better Auth exact format
model Account {
  id                    String    @id @default(cuid())
  accountId             String
  providerId            String
  userId                String
  accessToken           String?
  refreshToken          String?
  idToken               String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  password              String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([providerId, accountId])
  @@map("account")
}

// Session model - Better Auth exact format
model Session {
  id        String   @id @default(cuid())
  expiresAt DateTime
  token     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  ipAddress String?
  userAgent String?
  userId    String
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("session")
}

// Verification model - Better Auth exact format
model Verification {
  id         String    @id @default(cuid())
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime? @default(now())
  updatedAt  DateTime? @updatedAt
  
  @@map("verification")
}

enum UserRole {
  CUSTOMER
  ADMIN
  TECHNICIAN
  MANAGER
}

enum RegistrationStatus {
  PENDING_PROFILE_COMPLETION
  COMPLETE
}
```

### **Phase 3: Clean Better Auth Implementation (1 hour)**

#### TODO List for Phase 3:
- [ ] Create single auth.js file (no duplicates)
- [ ] Configure Better Auth with Google OAuth
- [ ] Set up proper hooks for progressive registration
- [ ] Ensure proper environment variable usage
- [ ] Test configuration locally

#### 3.1 New Better Auth Configuration (SINGLE FILE - NO DUPLICATES)
```javascript
// backend/lib/auth.js - THE ONLY AUTH FILE
const { betterAuth } = require("better-auth");
const { prismaAdapter } = require("better-auth/adapters/prisma");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql"
  }),
  
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false
  },
  
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectURI: process.env.NODE_ENV === 'production' 
        ? 'https://revivatech.co.uk/api/auth/callback/google'
        : 'http://localhost:3011/api/auth/callback/google'
    }
  },
  
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24      // Update every 24 hours
  },
  
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_BASE_URL || 'http://localhost:3011/api/auth',
  basePath: '/api/auth',
  
  trustedOrigins: [
    'http://localhost:3010',
    'http://localhost:3011', 
    'https://revivatech.co.uk',
    'https://www.revivatech.co.uk'
  ],
  
  user: {
    additionalFields: {
      firstName: { 
        type: 'string', 
        required: false 
      },
      lastName: { 
        type: 'string', 
        required: false 
      },
      phone: { 
        type: 'string', 
        required: false 
      },
      role: { 
        type: 'string', 
        required: false,
        defaultValue: 'CUSTOMER' 
      },
      googleId: { 
        type: 'string', 
        required: false 
      },
      profilePicture: { 
        type: 'string', 
        required: false 
      },
      locale: { 
        type: 'string', 
        required: false 
      },
      domain: { 
        type: 'string', 
        required: false 
      },
      registrationStatus: { 
        type: 'string', 
        required: false,
        defaultValue: 'PENDING_PROFILE_COMPLETION' 
      },
      profileCompletedAt: { 
        type: 'string', 
        required: false 
      }
    }
  },
  
  hooks: {
    user: {
      create: {
        before: async (user, context) => {
          // Handle Google OAuth user creation
          if (context?.provider === 'google') {
            const profile = context.profile;
            return {
              ...user,
              name: profile.name || `${profile.given_name} ${profile.family_name}`,
              firstName: profile.given_name,
              lastName: profile.family_name,
              googleId: profile.sub,
              profilePicture: profile.picture,
              locale: profile.locale,
              domain: profile.hd,
              emailVerified: profile.email_verified,
              registrationStatus: 'PENDING_PROFILE_COMPLETION'
            };
          }
          return user;
        }
      }
    },
    
    session: {
      create: {
        after: async ({ session, user }) => {
          // Check if user needs progressive registration
          if (user.registrationStatus === 'PENDING_PROFILE_COMPLETION') {
            // Flag session for progressive registration redirect
            session.requiresProfileCompletion = true;
          }
          return { session, user };
        }
      }
    }
  }
});

module.exports = auth;
```

#### 3.2 Simple Express Integration (UPDATE server.js - NO NEW FILES)
```javascript
// backend/server.js - Update existing file, don't create new
const auth = require('./lib/auth');

// Remove old auth mounting code first
// Then add new Better Auth mounting
app.use('/api/auth/*', async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const request = new Request(url, {
    method: req.method,
    headers: req.headers,
    body: req.method !== 'GET' && req.method !== 'HEAD' 
      ? JSON.stringify(req.body) 
      : undefined
  });
  
  const response = await auth.handler(request);
  
  res.status(response.status);
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  
  const body = await response.text();
  res.send(body);
});
```

### **Phase 4: Frontend Clean Implementation (1.5 hours)**

#### TODO List for Phase 4:
- [ ] Create single auth client file
- [ ] Remove all old auth hooks and utilities
- [ ] Create Google sign-in component
- [ ] Create progressive registration page
- [ ] Create auth callback handler
- [ ] Update existing components to use new auth

#### 4.1 Auth Client Setup (SINGLE FILE)
```typescript
// frontend/src/lib/auth.ts - THE ONLY AUTH CLIENT FILE
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL 
    ? `${process.env.NEXT_PUBLIC_API_URL}/api/auth`
    : "http://localhost:3011/api/auth"
});

export const { 
  useSession, 
  signIn, 
  signOut, 
  useUser 
} = authClient;
```

#### 4.2 Google Sign-In Component
```typescript
// frontend/src/components/auth/GoogleSignIn.tsx
import { signIn } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { FcGoogle } from 'react-icons/fc';

export function GoogleSignIn() {
  const handleGoogleSignIn = async () => {
    try {
      await signIn.social({
        provider: 'google',
        callbackURL: '/auth/callback'
      });
    } catch (error) {
      console.error('Google sign-in failed:', error);
    }
  };
  
  return (
    <Button
      onClick={handleGoogleSignIn}
      variant="outline"
      className="w-full"
    >
      <FcGoogle className="mr-2 h-5 w-5" />
      Continue with Google
    </Button>
  );
}
```

#### 4.3 Progressive Registration Page
```typescript
// frontend/src/app/auth/complete-profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function CompleteProfilePage() {
  const { user, refetch } = useUser();
  const router = useRouter();
  const [formData, setFormData] = useState({
    phone: '',
    firstName: '',
    lastName: ''
  });
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }
    
    if (user.registrationStatus === 'COMPLETE') {
      router.push('/dashboard');
      return;
    }
    
    // Pre-fill from Google data
    setFormData(prev => ({
      ...prev,
      firstName: user.firstName || '',
      lastName: user.lastName || ''
    }));
  }, [user, router]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/user/complete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          registrationStatus: 'COMPLETE',
          profileCompletedAt: new Date().toISOString()
        })
      });
      
      if (response.ok) {
        await refetch();
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Profile completion failed:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (!user) return null;
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8">
        <div>
          <h2 className="text-3xl font-bold">Complete Your Profile</h2>
          <p className="mt-2 text-gray-600">
            Welcome {user.name}! Just a few more details to get started.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                required
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+44 7XXX XXXXXX"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              required
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Completing...' : 'Complete Registration'}
          </Button>
        </form>
      </div>
    </div>
  );
}
```

#### 4.4 Auth Callback Handler
```typescript
// frontend/src/app/auth/callback/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/auth';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { user, isLoading } = useUser();
  
  useEffect(() => {
    if (isLoading) return;
    
    if (!user) {
      router.push('/auth/signin');
      return;
    }
    
    // Check if profile needs completion
    if (user.registrationStatus === 'PENDING_PROFILE_COMPLETION') {
      router.push('/auth/complete-profile');
    } else {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-4">Authenticating...</h2>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      </div>
    </div>
  );
}
```

### **Phase 5: API Endpoints for Progressive Registration (1 hour)**

#### TODO List for Phase 5:
- [ ] Create complete-profile endpoint
- [ ] Add to existing user routes (don't create new files)
- [ ] Add proper session validation
- [ ] Test endpoint functionality

#### 5.1 Complete Profile Endpoint (ADD to existing user.js)
```javascript
// backend/routes/user.js - ADD to existing file
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Add this endpoint to existing user routes
router.post('/complete-profile', async (req, res) => {
  try {
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { 
      firstName, 
      lastName, 
      phone, 
      registrationStatus, 
      profileCompletedAt 
    } = req.body;
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        phone,
        registrationStatus,
        profileCompletedAt: new Date(profileCompletedAt)
      }
    });
    
    res.json({ 
      success: true, 
      user: updatedUser 
    });
  } catch (error) {
    console.error('Profile completion error:', error);
    res.status(500).json({ 
      error: 'Failed to complete profile' 
    });
  }
});

module.exports = router;
```

### **Phase 6: Environment Setup (30 minutes)**

#### TODO List for Phase 6:
- [ ] Update .env file with all required variables
- [ ] Update docker-compose.yml environment section
- [ ] Generate new BETTER_AUTH_SECRET
- [ ] Verify Google OAuth credentials
- [ ] Test environment variable loading

#### 6.1 Environment Variables
```bash
# .env - Complete fresh configuration
NODE_ENV=development

# Database
DATABASE_URL=postgresql://revivatech:revivatech_password@localhost:5435/revivatech?schema=public

# Better Auth
BETTER_AUTH_SECRET=generate-new-64-char-secret-here
BETTER_AUTH_BASE_URL=http://localhost:3011/api/auth
BETTER_AUTH_URL=http://localhost:3011/api/auth

# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID=328702953276-secdqrkfa9bgb3asmu8vaq5djh0505q2.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# Frontend URLs
NEXT_PUBLIC_API_URL=http://localhost:3011
NEXT_PUBLIC_APP_URL=http://localhost:3010
```

#### 6.2 Docker Configuration
```yaml
# docker-compose.yml - Updated environment
services:
  revivatech_backend:
    environment:
      - NODE_ENV=${NODE_ENV}
      - DATABASE_URL=${DATABASE_URL}
      - BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
      - BETTER_AUTH_BASE_URL=${BETTER_AUTH_BASE_URL}
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
```

### **Phase 7: Testing & Validation (1.5 hours)**

#### TODO List for Phase 7:
- [ ] Run schema validation script
- [ ] Test Google OAuth flow end-to-end
- [ ] Test progressive registration
- [ ] Verify session management
- [ ] Check error handling
- [ ] Validate no duplicate files exist

#### 7.1 Database Validation Script
```javascript
// scripts/validate-auth-schema.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function validateSchema() {
  console.log('🔍 Validating Better Auth Schema...\n');
  
  // Check Account table
  try {
    const account = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'account'
    `;
    
    const requiredFields = ['accountId', 'providerId', 'userId'];
    const hasRequiredFields = requiredFields.every(field => 
      account.some(col => col.column_name === field)
    );
    
    console.log(`✅ Account table: ${hasRequiredFields ? 'VALID' : 'INVALID'}`);
  } catch (error) {
    console.log('❌ Account table: MISSING');
  }
  
  // Check Session table
  try {
    const session = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'session'
    `;
    
    console.log('✅ Session table: VALID');
  } catch (error) {
    console.log('❌ Session table: MISSING');
  }
  
  // Check User fields
  try {
    const user = await prisma.user.findFirst();
    console.log('✅ User model: ACCESSIBLE');
  } catch (error) {
    console.log('❌ User model: ERROR', error.message);
  }
}

validateSchema();
```

#### 7.2 Duplicate File Check Script
```bash
#!/bin/bash
# scripts/check-duplicates.sh

echo "🔍 Checking for duplicate auth files..."

# Check for multiple auth files in backend
AUTH_FILES=$(find backend/lib -name "*auth*.js" -type f | wc -l)
if [ $AUTH_FILES -gt 1 ]; then
  echo "❌ Found multiple auth files in backend/lib:"
  find backend/lib -name "*auth*.js" -type f
else
  echo "✅ Single auth file in backend/lib"
fi

# Check for multiple schema files
SCHEMA_FILES=$(find backend -name "*.prisma" -type f | wc -l)
if [ $SCHEMA_FILES -gt 1 ]; then
  echo "❌ Found multiple Prisma schema files:"
  find backend -name "*.prisma" -type f
else
  echo "✅ Single Prisma schema file"
fi

# Check for old auth route files
OLD_AUTH_ROUTES=$(find backend/routes -name "*auth*.js" -type f | wc -l)
if [ $OLD_AUTH_ROUTES -gt 0 ]; then
  echo "⚠️ Found auth route files (should be integrated in server.js):"
  find backend/routes -name "*auth*.js" -type f
fi

echo "✅ Duplicate check complete"
```

#### 7.3 End-to-End Test Checklist
```markdown
## Authentication System Test Checklist

### Pre-Implementation Cleanup
- [ ] All old auth tables dropped
- [ ] All duplicate files removed
- [ ] Prisma cache cleared
- [ ] No legacy code remaining

### Google OAuth Flow
- [ ] Click "Sign in with Google" button
- [ ] Google OAuth consent screen appears
- [ ] Select Google account
- [ ] Redirect back to application
- [ ] Progressive registration form appears for new users
- [ ] Existing users go directly to dashboard

### Progressive Registration
- [ ] Form pre-filled with Google data (name, email)
- [ ] Phone number field is required
- [ ] Form submission works
- [ ] User redirected to dashboard after completion
- [ ] User data saved correctly in database

### Session Management
- [ ] User stays logged in after refresh
- [ ] Session expires after 7 days
- [ ] Logout works correctly
- [ ] Multiple device sessions supported

### Error Handling
- [ ] No container hostnames in error URLs
- [ ] Proper error messages displayed
- [ ] Failed auth attempts handled gracefully
- [ ] Network errors handled properly

### Database Integrity
- [ ] No "accountId" field errors in logs
- [ ] All Better Auth queries succeed
- [ ] User data persists correctly
- [ ] Sessions created and destroyed properly

### File System Integrity
- [ ] No duplicate auth files
- [ ] No legacy auth code
- [ ] Single source of truth for each component
- [ ] Clean file structure
```

### **Phase 8: Deployment Steps (30 minutes)**

#### TODO List for Phase 8:
- [ ] Stop all services
- [ ] Reset database completely
- [ ] Apply new schema
- [ ] Deploy new code
- [ ] Restart services
- [ ] Validate deployment
- [ ] Run duplicate check

```bash
# Deployment Script
#!/bin/bash

echo "🚀 Starting Fresh Authentication System Deployment"

# Step 1: Stop services
echo "📦 Stopping services..."
docker-compose down

# Step 2: Backup (optional since no data)
echo "💾 Creating backup..."
docker exec revivatech_database pg_dump -U revivatech revivatech > backup_$(date +%Y%m%d_%H%M%S).sql

# Step 3: Clean old files
echo "🧹 Removing old auth files..."
rm -f backend/lib/better-auth-*.js
rm -f backend/routes/*auth*.js
rm -rf backend/node_modules/.prisma

# Step 4: Reset database
echo "🗃️ Resetting database..."
docker exec revivatech_database psql -U revivatech -d revivatech -f /migrations/001_better_auth_fresh_start.sql

# Step 5: Update Prisma schema
echo "📝 Updating Prisma schema..."
cp new-schema.prisma backend/prisma/schema.prisma

# Step 6: Generate Prisma client
echo "🔧 Generating Prisma client..."
cd backend && npx prisma generate && npx prisma db push

# Step 7: Update application code
echo "📦 Deploying new code..."
cp auth.js backend/lib/auth.js
# ... copy all new files

# Step 8: Rebuild containers
echo "🏗️ Rebuilding containers..."
docker-compose build --no-cache

# Step 9: Start services
echo "▶️ Starting services..."
docker-compose up -d

# Step 10: Wait for services
echo "⏳ Waiting for services to start..."
sleep 10

# Step 11: Validate
echo "✅ Validating deployment..."
node scripts/validate-auth-schema.js

# Step 12: Check for duplicates
echo "🔍 Checking for duplicate files..."
bash scripts/check-duplicates.sh

# Step 13: Test OAuth endpoint
echo "🧪 Testing OAuth endpoint..."
curl -I http://localhost:3011/api/auth/sign-in/google

echo "✅ Deployment complete!"
```

## 📊 **SUCCESS METRICS**

### Immediate (Day 1)
- ✅ Zero authentication errors in logs
- ✅ Google OAuth endpoint returns 302 (not 404)
- ✅ Database queries use correct field names
- ✅ Progressive registration captures data
- ✅ No duplicate files in codebase

### Short-term (Week 1)
- 100% OAuth completion rate
- 80%+ progressive registration completion
- < 2 second authentication time
- Zero support tickets
- Clean codebase maintained

### Long-term (Month 1)
- 99.9% authentication uptime
- Support for additional OAuth providers
- Enhanced security features
- Performance optimizations
- Documentation complete

## ⏱️ **TIMELINE**

### Day 1: Implementation (8 hours)
- **Hour 1-2**: Database cleanup & schema creation
- **Hour 3-4**: Better Auth implementation
- **Hour 5-6**: Frontend integration
- **Hour 7-8**: Testing & validation

### Day 2: Polish & Deploy (4 hours)
- **Hour 1-2**: Bug fixes & optimizations
- **Hour 3**: Deployment to production
- **Hour 4**: Monitoring & verification

## ✅ **MASTER TODO CHECKLIST**

### Phase 1 - Cleanup
- [ ] Backup database
- [ ] Drop all auth tables
- [ ] Remove ALL duplicate files
- [ ] Clear Prisma cache
- [ ] Document removed files

### Phase 2 - Schema
- [ ] Create Better Auth migration
- [ ] Update Prisma schema
- [ ] Run migration
- [ ] Generate Prisma client
- [ ] Validate schema structure

### Phase 3 - Backend Auth
- [ ] Create single auth.js file
- [ ] Configure Better Auth
- [ ] Mount in server.js
- [ ] Remove old mounting code
- [ ] Test auth endpoints

### Phase 4 - Frontend Auth
- [ ] Create auth client
- [ ] Create Google sign-in component
- [ ] Create progressive registration
- [ ] Create callback handler
- [ ] Update existing components

### Phase 5 - API Endpoints
- [ ] Add complete-profile endpoint
- [ ] Test profile completion
- [ ] Verify session handling
- [ ] Test error cases

### Phase 6 - Environment
- [ ] Update .env file
- [ ] Update docker-compose.yml
- [ ] Generate new secret
- [ ] Verify Google credentials
- [ ] Test env loading

### Phase 7 - Testing
- [ ] Run validation script
- [ ] Test OAuth flow
- [ ] Test progressive registration
- [ ] Check for duplicates
- [ ] Complete E2E checklist

### Phase 8 - Deployment
- [ ] Run deployment script
- [ ] Verify all services running
- [ ] Test production OAuth
- [ ] Monitor logs
- [ ] Document deployment

## 🚨 **CRITICAL REMINDERS**

1. **NO DUPLICATE FILES**: Every file should have a single purpose
2. **REMOVE OLD CODE**: Don't comment out, DELETE completely
3. **SINGLE SOURCE OF TRUTH**: One auth.js, one schema.prisma
4. **TEST AFTER EACH PHASE**: Don't wait until the end
5. **CHECK LOGS FREQUENTLY**: Catch errors early

## 📝 **POST-IMPLEMENTATION CHECKLIST**

- [ ] All TODO items completed
- [ ] No duplicate files exist
- [ ] OAuth works end-to-end
- [ ] Progressive registration functional
- [ ] No errors in logs
- [ ] Documentation updated
- [ ] Team notified of changes
- [ ] Monitoring dashboard configured

## 🎯 **FINAL DELIVERABLES**

1. **Working Authentication System**
   - Google OAuth fully functional
   - Progressive registration complete
   - Clean database schema
   - No duplicate files

2. **Documentation**
   - This PRD with all TODOs checked
   - API documentation
   - Setup instructions
   - Troubleshooting guide

3. **Testing Suite**
   - Validation scripts
   - Duplicate check script
   - E2E test checklist
   - Performance benchmarks

## 📚 **APPENDIX: File Structure After Implementation**

```
backend/
├── lib/
│   └── auth.js                 # ONLY auth file
├── prisma/
│   └── schema.prisma           # ONLY schema file
├── routes/
│   └── user.js                 # Contains complete-profile endpoint
├── server.js                   # Updated with Better Auth mounting
└── scripts/
    ├── validate-auth-schema.js
    └── check-duplicates.sh

frontend/
├── src/
│   ├── lib/
│   │   └── auth.ts            # ONLY auth client
│   ├── components/
│   │   └── auth/
│   │       ├── GoogleSignIn.tsx
│   │       └── (no other auth files)
│   └── app/
│       └── auth/
│           ├── callback/page.tsx
│           ├── complete-profile/page.tsx
│           └── signin/page.tsx
```

---

**Implementation Note**: This PRD ensures ZERO gaps and NO duplicate files. Follow each TODO sequentially and check off as completed. The duplicate check script should be run after each phase to ensure clean implementation.

**Created**: August 30, 2025  
**Version**: 1.0 - Fresh Start Implementation  
**Status**: Ready for Implementation