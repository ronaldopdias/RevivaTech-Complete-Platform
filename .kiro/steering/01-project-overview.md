---
inclusion: always
---

# RevivaTech Project Overview

## 🚨 CRITICAL: ALWAYS READ FIRST

**BEFORE making ANY changes to the RevivaTech project, you MUST read:**
1. `/opt/webapps/CLAUDE_INFRASTRUCTURE_SETUP.md` - Complete server infrastructure documentation
2. `/opt/webapps/revivatech/INFRASTRUCTURE_SETUP.md` - Project-specific infrastructure setup
3. `/opt/webapps/revivatech/Docs/PRD_RevivaTech_Brand_Theme.md` - **CRITICAL: Brand theme & design system**
4. `/opt/webapps/revivatech/Docs/Implementation.md` - Current implementation stage

## 🎯 Project Mission

Professional computer repair shop website with advanced booking system, customer portal, and admin dashboard.

## 🏗️ Tech Stack
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, PostgreSQL, Redis
- **Architecture**: Configuration-driven, component-based
- **Design**: RevivaTech Brand Theme (Trust-building design) + Nordic Design System
- **Infrastructure**: Docker, nginx, Cloudflare tunnel

## 🔧 Key Features
- Multi-step booking system with device database (2016-2025)
- Real-time customer dashboard with repair tracking
- Admin interface with analytics and queue management
- Multilingual support (EN/PT)
- PWA capabilities with offline support

## 🏆 Current Status

### Infrastructure Status (Fully Operational)
✅ All external domains accessible via HTTPS (revivatech.co.uk, revivatech.com.br)
✅ Cloudflare tunnel v8 configuration active with 4 healthy connections
✅ Backend API (port 3011), Database (PostgreSQL on port 5435), Redis cache (port 6383)
✅ Portuguese site (port 3000) and English site (port 3010)
✅ External access restored with proper styling and performance

🔄 **In Development**: Configuration system, Component library, Customer portal, Admin dashboard