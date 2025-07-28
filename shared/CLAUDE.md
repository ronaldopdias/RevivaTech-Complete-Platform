# RevivaTech New Platform - Development Configuration

## Platform Overview

The RevivaTech platform has been successfully migrated to a new architecture with dedicated infrastructure for the English (.co.uk) domain while preserving the existing Portuguese (.com.br) and CRM systems.

### Architecture Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                        Cloudflare Tunnel                        │
├─────────────────────────────────────────────────────────────────┤
│                         Host nginx                              │
├─────────────────────┬─────────────────────┬─────────────────────┤
│   .com.br (PT)      │     .co.uk (EN)     │    CRM Subdomain    │
│   Port 3000         │     Port 3010       │     Port 3001       │
│   (Existing)        │     (NEW)           │    (Existing)       │
└─────────────────────┴─────────────────────┴─────────────────────┘
```

## Services Configuration

### New Platform Services (.co.uk)

**Frontend**: `revivatech_new_frontend`
- Port: `3010:3010`
- Technology: Next.js 14 + TypeScript + Tailwind CSS
- Features: Shared components integration, PWA, hot-reload
- Health Check: `http://localhost:3010/api/health`

**Backend**: `revivatech_new_backend`
- Port: `3011:3011`
- Technology: Node.js + Express + PostgreSQL + Redis
- Features: RESTful API, Auth0 integration, comprehensive logging
- Health Check: `http://localhost:3011/health`
- API Endpoint: `http://localhost:3011/api/info`

**Database**: `revivatech_new_database`
- Port: `5435:5432`
- Technology: PostgreSQL 15
- Features: UUID-based schema, data recovery tables, audit logging
- Connection: `postgresql://revivatech_user:revivatech_password@localhost:5435/revivatech_new`

**Cache**: `revivatech_new_redis`
- Port: `6383:6379`
- Technology: Redis 7
- Features: Session storage, caching, background job queue
- Connection: `redis://localhost:6383` (password protected)

### Preserved Services

**Portuguese Platform (.com.br)**
- Frontend PT: Port 3000 (unchanged)
- Backend: Port 5000 (unchanged)
- Database: Port 3308 MySQL (unchanged)
- Redis: Port 6380 (unchanged)

**CRM System**
- Frontend: Port 3001 (unchanged)
- Backend: Port 5001 (unchanged)
- Database: Port 5433 PostgreSQL (unchanged)
- Redis: Port 6381 (unchanged)

## Deployment Commands

### Development Deployment

```bash
# Navigate to shared directory
cd /opt/webapps/website/shared

# Start all new platform services
docker-compose -f docker-compose.dev.yml up -d

# Check service status
docker-compose -f docker-compose.dev.yml ps

# View logs
docker-compose -f docker-compose.dev.yml logs -f new-backend
docker-compose -f docker-compose.dev.yml logs -f new-frontend
```

### Service Management

```bash
# Restart a specific service
docker-compose -f docker-compose.dev.yml restart new-backend

# Rebuild and restart
docker-compose -f docker-compose.dev.yml up -d --build new-backend

# Stop all new services
docker-compose -f docker-compose.dev.yml down

# View service health
curl http://localhost:3011/health
curl http://localhost:3011/api/info
```

## nginx Configuration

The nginx configuration has been updated to route the .co.uk domain to the new platform:

**Location**: `/etc/nginx/sites-enabled/revivatech-dual-domain-docker.conf`

**Key Changes**:
- API routes: `http://localhost:5000/api/` → `http://localhost:3011/api/`
- Frontend routes: `http://localhost:3002` → `http://localhost:3010`
- HMR support: Updated for port 3010

**Test Configuration**:
```bash
# Test nginx config
nginx -t

# Reload nginx
nginx -s reload

# Test routing
curl -H "Host: revivatech.co.uk" http://localhost/api/info
```

## Cloudflare Tunnel Configuration

**Location**: `/opt/webapps/website/scripts/fix-tunnel-config.json`

**Updated Routes**:
- `revivatech.co.uk`: `http://127.0.0.1:3002` → `http://127.0.0.1:3010`
- `www.revivatech.co.uk`: `http://127.0.0.1:3002` → `http://127.0.0.1:3010`

**Preserved Routes**:
- `revivatech.com.br`: `http://127.0.0.1:3000` (unchanged)
- `crm.revivatech.com.br`: `http://127.0.0.1:3001` (unchanged)

## Environment Variables

### Backend Environment (.env)

```bash
# Server Configuration
NODE_ENV=development
PORT=3011
LOG_LEVEL=debug

# Database Configuration
DB_HOST=new-database
DB_PORT=5432
DB_NAME=revivatech_new
DB_USER=revivatech_user
DB_PASSWORD=revivatech_password

# Redis Configuration
REDIS_HOST=new-redis
REDIS_PORT=6379
REDIS_PASSWORD=revivatech_redis_password

# Security
SESSION_SECRET=new-platform-session-secret-change-in-production
JWT_SECRET=new-platform-jwt-secret-change-in-production

# API Configuration
API_BASE_URL=http://localhost:3011
FRONTEND_URL=http://localhost:3010
CORS_ORIGIN=http://localhost:3010,https://revivatech.co.uk
```

### Frontend Environment (.env.local)

```bash
# Application Configuration
NODE_ENV=development
PORT=3010
NEXT_PUBLIC_API_URL=http://localhost:3011
NEXT_PUBLIC_DOMAIN=en
NEXT_PUBLIC_LOCALE=en-GB
NEXT_PUBLIC_CURRENCY=GBP

# Development
WATCHPACK_POLLING=true
CHOKIDAR_USEPOLLING=true
NEXT_TELEMETRY_DISABLED=1
```

## Database Schema

The new platform uses PostgreSQL with a comprehensive schema including:

### Core Tables
- `customers`: Customer information
- `users`: System users (admin, technicians)
- `data_recovery_bookings`: Data recovery service bookings
- `recovery_analyses`: Technician analysis results
- `customer_verifications`: Customer verification portal
- `repair_bookings`: General repair services
- `audit_logs`: System audit trail

### Key Features
- UUID-based primary keys
- JSONB for flexible data storage
- Comprehensive indexing for performance
- Automatic timestamp triggers
- Built-in audit trail

## Shared Components Library

**Location**: `/opt/webapps/website/shared/components/`

**Available Components**: 44 components including:
- UI Components (Button, Card, Input, LoadingSpinner)
- Auth0 Integration (Auth0Provider, Auth0LoginButton, etc.)
- Business Components (Analytics, Booking, Customer Management)
- Real-time Features (WebSocket, Notifications)

**Usage in Frontend**:
```typescript
import { Button, Card, LoadingSpinner } from '@shared';
```

## Health Checks & Monitoring

### Backend Health Check
```bash
curl http://localhost:3011/health
```

**Expected Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-07-11T08:32:51.876Z",
  "database": "connected",
  "redis": "connected",
  "version": "2.0.0"
}
```

### Frontend Health Check
```bash
curl http://localhost:3010/api/health
```

### Service Monitoring
```bash
# Check all container status
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Check specific service logs
docker logs revivatech_new_backend -f
docker logs revivatech_new_frontend -f
docker logs revivatech_new_database -f
```

## Troubleshooting

### Common Issues

**Backend Container Failing**:
1. Check database connectivity: `docker logs revivatech_new_database`
2. Verify Redis connection: `docker logs revivatech_new_redis`
3. Check environment variables in `.env`

**Frontend Build Issues**:
1. Clear node_modules: `docker-compose -f docker-compose.dev.yml build --no-cache new-frontend`
2. Check shared components linking
3. Verify TypeScript configuration

**nginx Routing Issues**:
1. Test configuration: `nginx -t`
2. Check port availability: `ss -tlnp | grep 3010`
3. Verify host headers

**Database Connection Issues**:
1. Check PostgreSQL logs: `docker logs revivatech_new_database`
2. Verify credentials in environment file
3. Test direct connection: `psql -h localhost -p 5435 -U revivatech_user -d revivatech_new`

### Performance Optimization

**Database**:
- Regular VACUUM and ANALYZE operations
- Monitor query performance with EXPLAIN
- Consider connection pooling adjustments

**Redis**:
- Monitor memory usage
- Configure appropriate eviction policies
- Use Redis CLI for debugging: `redis-cli -h localhost -p 6383`

**nginx**:
- Enable gzip compression
- Configure appropriate buffer sizes
- Monitor access logs for performance issues

## Security Considerations

### Development Environment
- All services run with non-root users
- Database credentials are environment-specific
- Redis is password protected
- Session secrets are configurable

### Production Preparation
- Update all default passwords
- Configure SSL certificates
- Enable rate limiting
- Set up proper logging and monitoring
- Configure backup procedures

## Next Steps

1. **Frontend Enhancement**: Complete Next.js frontend implementation with all shared components
2. **Authentication**: Integrate Auth0 for user management
3. **Database Migration**: Migrate relevant data from existing MySQL database
4. **Testing**: Implement comprehensive test suite
5. **Monitoring**: Set up production monitoring and alerting
6. **Backup**: Configure automated backup procedures
7. **Documentation**: API documentation with OpenAPI/Swagger

## Support Information

**Container Names**:
- Backend: `revivatech_new_backend`
- Frontend: `revivatech_new_frontend`
- Database: `revivatech_new_database`
- Redis: `revivatech_new_redis`

**Port Allocation**:
- Frontend: 3010
- Backend: 3011
- Database: 5435
- Redis: 6383

**Network**: `revivatech-new-network`

**Volumes**:
- Database: `revivatech_new_db_data`
- Redis: `revivatech_new_redis_data`
- Backend Uploads: `revivatech_new_backend_uploads`
- Backend Logs: `revivatech_new_backend_logs`

---

*Last Updated: 2025-07-11*
*Platform Version: 2.0.0*
*Environment: Development*