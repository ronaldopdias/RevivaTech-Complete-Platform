---
inclusion: always
---

# 🔧 INFRASTRUCTURE & CONTAINER MANAGEMENT

## Infrastructure Overview

**Container Structure:**
- `revivatech_new_frontend` (port 3010) - English site (revivatech.co.uk)
- `revivatech_new_backend` (port 3011) - API backend
- `website_frontend_pt_dev` (port 3000) - Portuguese site (revivatech.com.br)
- Database: PostgreSQL (port 5435)
- Cache: Redis (port 6383)

**Network Access Configuration:**
- **Local Development**: `localhost:3010` (direct server access)
- **Tailscale Network**: `100.122.130.67:3010` (private VPN access - only when Tailscale is connected)
- **External Public Access**: Via Cloudflare tunnel (not direct IP access)
- **WebSocket HMR**: Configured for both localhost and Tailscale IP in `allowedDevOrigins`

**Important Network Notes:**
- The IP `100.122.130.67` is a Tailscale private network IP
- This IP is only accessible when Tailscale VPN is active on the client device
- External users access the site through Cloudflare tunnel, not the Tailscale IP
- Next.js `allowedDevOrigins` includes both localhost and Tailscale IP for proper HMR

**Critical File Locations:**
- **Container CSS**: `/app/styles/globals.css` (in `revivatech_new_frontend` container)
- **Local CSS**: `/opt/webapps/revivatech/frontend/src/app/globals.css`
- **Nginx Config**: `/etc/nginx/sites-enabled/revivatech-dual-domain.conf`
- **Tunnel Config**: `/etc/cloudflared/config.yml`

**Domain Routing:**
- `revivatech.co.uk` → port 3010 (English)
- `revivatech.com.br` → port 3000 (Portuguese)

## Container Management Commands

### Check Container Status
```bash
# Check all RevivaTech containers
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep revivatech

# Restart English frontend (port 3010)
docker restart revivatech_new_frontend

# Restart backend API (port 3011)  
docker restart revivatech_new_backend

# View frontend logs (hot reload)
docker logs revivatech_new_frontend --tail 20

# Check container health
curl http://localhost:3010/health  # English frontend
curl http://localhost:3011/health  # Backend API
curl http://localhost:3000/health  # Portuguese frontend
```

### CSS/Styling Changes - Modular Architecture
```bash
# 🆕 MODULAR CSS ARCHITECTURE (No more token limit issues!)
# Edit specific CSS modules instead of massive globals.css file

# Edit color palette and design tokens
Read /opt/webapps/revivatech/frontend/src/styles/modules/design-tokens.css

# Edit animations and micro-interactions  
Read /opt/webapps/revivatech/frontend/src/styles/modules/animations.css

# Edit utility classes and accessibility
Read /opt/webapps/revivatech/frontend/src/styles/modules/utilities.css

# Edit responsive design and mobile optimization
Read /opt/webapps/revivatech/frontend/src/styles/modules/responsive.css

# Edit main globals.css (imports modules + base styles)
Read /opt/webapps/revivatech/frontend/src/app/globals.css

# Trigger hot reload for CSS changes
docker exec revivatech_new_frontend touch /app/src/app/globals.css

# Verify compilation
docker logs revivatech_new_frontend --tail 5
```

### Infrastructure Health Check Protocol
```bash
# Complete infrastructure status
echo "=== Container Status ===" && docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep revivatech
echo "=== Service Response ===" && curl -I http://localhost:3010 | head -1 && curl -I http://localhost:3000 | head -1
echo "=== Tunnel Status ===" && systemctl status cloudflared --no-pager
echo "=== External Access ===" && curl -I --resolve "revivatech.co.uk:443:104.21.64.1" https://revivatech.co.uk | head -1
```

### Infrastructure Management
```bash
# Nginx configuration
nginx -t                           # Test config
nginx -s reload                    # Reload config

# Cloudflare tunnel management
systemctl restart cloudflared      # Restart tunnel
systemctl status cloudflared       # Check status
cloudflared tunnel --config /etc/cloudflared/config.yml ingress validate

# Cloudflare audit (use provided API token)
cd /opt/webapps/revivatech/scripts
CLOUDFLARE_API_TOKEN="dQ10MfJmQL0mChrVOknXbcNSn2OACBfTyFNdBqrQ" ./cloudflare-audit.sh

# External access testing (bypass local DNS)
curl --resolve "revivatech.co.uk:443:104.21.64.1" https://revivatech.co.uk
curl --resolve "revivatech.com.br:443:104.21.64.1" https://revivatech.com.br

# Port diagnostics
ss -tlnp | grep :3010             # Check port 3010
ss -tlnp | grep :3000             # Check port 3000
```

## Local Development
```bash
# Frontend development (when not using containers)
cd /opt/webapps/revivatech/frontend
npm run dev                        # Start dev server (port 3003/3004)
npm run build                      # Build for production
npm run lint                       # Run linting

# Check TypeScript
npx tsc --noEmit                   # Type checking
```