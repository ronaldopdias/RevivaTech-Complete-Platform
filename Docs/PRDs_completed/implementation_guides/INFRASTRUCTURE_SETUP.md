# RevivaTech Infrastructure Setup & Port Routing

## 🏗️ INFRASTRUCTURE OVERVIEW

This document provides the complete infrastructure setup for the RevivaTech project, including containerized services, nginx routing, and Cloudflare tunnel configuration.

## 📋 CONTAINERIZED SERVICES

### Active Docker Containers

```
revivatech_new_frontend    healthy    
shared    shared_new-frontend    2025-07-11 11:15:54    172.20.0.5    3010:3010    
administrators

revivatech_new_backend     healthy    
shared    shared_new-backend     2025-07-11 09:53:45    172.20.0.4    3011:3011    
administrators

revivatech_new_database    healthy    
shared    postgres:15-alpine     2025-07-11 09:53:14    172.20.0.3    5435:5432    
administrators

revivatech_new_redis       healthy    
shared    redis:7-alpine         2025-07-11 09:53:14    172.20.0.2    6383:6379    
administrators

website_frontend_pt_dev    healthy    
website   website_frontend-pt    2025-07-09 13:49:15    172.18.0.4    3000:3000    
administrators
```

### Container Details

| Container | Service | Port Mapping | Purpose | Status |
|-----------|---------|--------------|---------|---------|
| `revivatech_new_frontend` | Next.js | 3010:3010 | English RevivaTech.co.uk | ✅ Active |
| `revivatech_new_backend` | Node.js API | 3011:3011 | Backend API | ✅ Active |
| `revivatech_new_database` | PostgreSQL | 5435:5432 | Database | ✅ Active |
| `revivatech_new_redis` | Redis | 6383:6379 | Cache/Sessions | ✅ Active |
| `website_frontend_pt_dev` | Next.js | 3000:3000 | Portuguese RevivaTech.com.br | ✅ Active |

## 🌐 PORT ROUTING & DOMAIN MAPPING

### Direct Access Ports
- **Port 3010**: `revivatech_new_frontend` (English site)
- **Port 3000**: `website_frontend_pt_dev` (Portuguese site)
- **Port 3011**: `revivatech_new_backend` (API)
- **Port 5435**: Database (PostgreSQL)
- **Port 6383**: Redis cache

### Domain Routing

| Domain | Target Port | Container | Language |
|--------|-------------|-----------|----------|
| `revivatech.co.uk` | 3010 | `revivatech_new_frontend` | English |
| `www.revivatech.co.uk` | 3010 | `revivatech_new_frontend` | English |
| `revivatech.com.br` | 3000 | `website_frontend_pt_dev` | Portuguese |
| `www.revivatech.com.br` | 3000 | `website_frontend_pt_dev` | Portuguese |
| `crm.revivatech.com.br` | 3001 | CRM System | Portuguese |
| `crm.revivatech.co.uk` | 3001 | CRM System | English |

## 🔧 NGINX CONFIGURATION

### File Location
```
/etc/nginx/sites-enabled/revivatech-dual-domain.conf
```

### Configuration Summary
```nginx
# Portuguese site: revivatech.com.br -> port 3000
server {
    listen 80;
    server_name revivatech.com.br www.revivatech.com.br;
    
    location / {
        proxy_pass http://localhost:3000;
        # Headers and hot reload config
    }
}

# English site: revivatech.co.uk -> port 3010
server {
    listen 80;
    server_name revivatech.co.uk www.revivatech.co.uk;
    
    location / {
        proxy_pass http://localhost:3010;
        # Headers and hot reload config
    }
}
```

## ☁️ CLOUDFLARE TUNNEL CONFIGURATION

### File Location
```
/etc/cloudflared/config.yml
```

### Tunnel ID
```
89792b6f-6990-4591-a529-8982596a2eaf
```

### Ingress Rules
```yaml
ingress:
  - hostname: revivatech.com.br
    service: http://127.0.0.1:3000     # Portuguese site
  - hostname: www.revivatech.com.br
    service: http://127.0.0.1:3000     # Portuguese site
  - hostname: crm.revivatech.com.br
    service: http://127.0.0.1:3001     # CRM system
  - hostname: revivatech.co.uk
    service: http://127.0.0.1:3010     # English site
  - hostname: www.revivatech.co.uk
    service: http://127.0.0.1:3010     # English site
  - hostname: crm.revivatech.co.uk
    service: http://127.0.0.1:3001     # CRM system
  - service: http_status:404           # Catch-all
```

## 📁 PROJECT STRUCTURE

### Main RevivaTech Project
```
/opt/webapps/revivatech/
├── frontend/                    # Local development files
│   ├── src/app/globals.css     # CSS with SVG icon fixes
│   ├── package.json
│   └── ...
├── backend/                     # Backend source
├── scripts/                     # Infrastructure scripts
│   └── cloudflare-audit.sh    # Cloudflare management
├── CLAUDE.md                   # Claude configuration
└── INFRASTRUCTURE_SETUP.md    # This file
```

### Container Source Mapping
```
Container: revivatech_new_frontend
Local Development: /opt/webapps/revivatech/frontend/
Local CSS: /opt/webapps/revivatech/frontend/src/app/globals.css
Live Path: /app/styles/globals.css (in container)
```

## 🛠️ DEVELOPMENT WORKFLOW

### Starting Services
```bash
# Check container status
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Restart specific container
docker restart revivatech_new_frontend

# Check logs
docker logs revivatech_new_frontend --tail 20
```

### CSS Changes (SVG Icon Fixes)
```bash
# Apply changes to running container
docker exec revivatech_new_frontend sh -c 'echo "CSS_CHANGES" >> /app/styles/globals.css'

# Trigger hot reload
docker exec revivatech_new_frontend touch /app/styles/globals.css

# Verify compilation
docker logs revivatech_new_frontend --tail 5
```

### Nginx Management
```bash
# Test configuration
nginx -t

# Reload configuration
nginx -s reload

# Check status
systemctl status nginx
```

### Cloudflare Tunnel Management
```bash
# Restart tunnel
systemctl restart cloudflared

# Check status
systemctl status cloudflared

# Validate config
cloudflared tunnel --config /etc/cloudflared/config.yml ingress validate
```

## 🔍 TROUBLESHOOTING

### Common Issues & Solutions

1. **Changes not reflecting on website**
   - Check if editing correct container files
   - Verify hot reload is working
   - Clear browser cache

2. **Port conflicts**
   - Use `ss -tlnp | grep :PORT` to check port usage
   - Restart conflicting services

3. **Tunnel not routing correctly**
   - Verify config at `/etc/cloudflared/config.yml`
   - Restart cloudflared service
   - Check container is running on expected port

### Health Checks
```bash
# Frontend health
curl http://localhost:3010/health
curl http://localhost:3000/health

# Backend health  
curl http://localhost:3011/health

# Container status
docker ps | grep revivatech
```

## 📊 MONITORING

### Key Metrics to Monitor
- Container health status
- Port accessibility
- Nginx response times
- Cloudflare tunnel connectivity

### Log Locations
```
Container logs: docker logs CONTAINER_NAME
Nginx logs: /var/log/nginx/
Cloudflare logs: journalctl -u cloudflared
```

## 🚨 CRITICAL PATHS

### Files that MUST NOT be modified
- `/etc/cloudflared/config.yml` (only update with proper validation)
- Running container configs (without proper restart)

### Files safe to modify
- `/opt/webapps/revivatech/frontend/src/app/globals.css` (local development)
- `/etc/nginx/sites-enabled/revivatech-dual-domain.conf` (with nginx reload)

## 📝 CHANGE LOG

### 2025-07-11 - SVG Icon Fix
- Applied SVG sizing fixes to container CSS
- Updated tunnel config to route revivatech.co.uk to port 3010
- Cleaned up nginx configuration
- Fixed `svg[fill-rule="evenodd"]` elements to 20px size

---

**Last Updated**: 2025-07-11  
**Infrastructure Version**: 2.0  
**Status**: ✅ Operational