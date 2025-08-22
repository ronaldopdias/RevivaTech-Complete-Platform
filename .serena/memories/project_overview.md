# RevivaTech Project Overview

## Project Purpose
RevivaTech is a comprehensive device repair business platform combining:
- **Customer-facing website** for booking device repairs
- **Admin management system** for business operations
- **Real-time analytics and ML** for business intelligence
- **Multi-format communication** (email, SMS, PDF templates)

## Current Status (Phase 3 - 65% Complete)
- ✅ **Backend API**: Fully operational with 90+ endpoints
- ✅ **Database**: PostgreSQL with comprehensive schema
- ✅ **Infrastructure**: Docker containers, Cloudflare tunnels
- ❌ **Frontend Integration**: Missing API routes, auth issues
- ❌ **Database Schema**: Missing critical tables (users, etc.)

## Tech Stack
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, PostgreSQL, Redis
- **Authentication**: Better Auth (configured but not working)
- **Infrastructure**: Docker, Cloudflare tunnels
- **Analytics**: Custom analytics service with ML models

## Critical Architecture
- Frontend (port 3010) proxies API calls to Backend (port 3011)
- Better Auth configured for `/api/auth` endpoints
- Comprehensive business module system (27 brands, 135+ device models)
- Real-time WebSocket communication for notifications