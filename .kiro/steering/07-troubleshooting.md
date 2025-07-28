---
inclusion: always
---

# 🔧 Common Issues & Solutions

## Frontend Container Issues
```bash
# Container not starting
docker restart revivatech_new_frontend
docker logs revivatech_new_frontend --tail 20

# Missing dependencies
docker exec -it revivatech_new_frontend npm install

# Hot reload not working
docker exec revivatech_new_frontend touch /app/styles/globals.css
```

## WebSocket HMR Connection Issues
```bash
# WebSocket connection errors in console
# Common error: "WebSocket connection to 'ws://100.122.130.67:3010/_next/webpack-hmr' failed"

# Solution: Ensure allowedDevOrigins includes Tailscale IP
# Check Next.js config includes:
# allowedDevOrigins: ['localhost:3010', '100.122.130.67:3010', '100.122.130.67']

# Test WebSocket connection
node /opt/webapps/revivatech/frontend/test-hmr-connection.js

# Restart container after config changes
docker restart revivatech_new_frontend
```

## Network Access Issues
```bash
# Issue: Changes not reflecting on Tailscale IP (100.122.130.67:3010)
# Cause: Tailscale VPN not connected on client device
# Solution: Ensure Tailscale is running and connected

# Issue: External users can't access site
# Cause: Trying to access Tailscale IP directly
# Solution: External access is via Cloudflare tunnel, not Tailscale IP

# Test network access
curl http://localhost:3010                    # Local access
curl http://100.122.130.67:3010              # Tailscale access (requires VPN)
curl https://revivatech.co.uk                # External access (Cloudflare tunnel)
```

## Configuration Changes Not Reflecting
```bash
# Restart frontend container
docker restart revivatech_new_frontend

# Check logs for errors
docker logs revivatech_new_frontend --tail 20

# Verify container is healthy
curl http://localhost:3010/health
```

## CSS/Styling Issues - Modular Architecture
```bash
# 🆕 TOKEN LIMIT SOLUTION: Use modular CSS files
# No more "File content exceeds maximum allowed tokens" errors!

# Read specific modules instead of massive globals.css
Read /opt/webapps/revivatech/frontend/src/styles/modules/design-tokens.css    # Colors, typography, spacing
Read /opt/webapps/revivatech/frontend/src/styles/modules/animations.css      # Keyframes, transitions
Read /opt/webapps/revivatech/frontend/src/styles/modules/utilities.css       # Utility classes
Read /opt/webapps/revivatech/frontend/src/styles/modules/responsive.css      # Mobile optimization

# Trigger recompilation
docker exec revivatech_new_frontend touch /app/src/app/globals.css

# Check compilation logs
docker logs revivatech_new_frontend --tail 10
```

## Key Infrastructure Details
- **Tunnel ID**: `89792b6f-6990-4591-a529-8982596a2eaf`
- **API Credentials**: Available in CLAUDE_INFRASTRUCTURE_SETUP.md
- **External Testing**: Use `--resolve` method to bypass local DNS overrides
- **Monitoring**: Cloudflare audit scripts available in `/scripts/`

## Quick Health Check
```bash
# Verify all services
curl http://localhost:3010/health  # English frontend
curl http://localhost:3011/health  # Backend API
curl http://localhost:3000/health  # Portuguese frontend

# Check container status
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep revivatech
```

## 📈 Next Steps & Priorities

### IMMEDIATE PRIORITIES
1. **Complete Component Library** - Finish UI component implementations
2. **Customer Dashboard** - Real-time updates and notifications
3. **Admin Dashboard** - Analytics and queue management
4. **Booking System** - Multi-step form with device database
5. **Performance Optimization** - Bundle analysis and optimization

### PHASE 2 FEATURES
1. **Payment Processing** - Stripe integration
2. **Mobile App** - PWA enhancement
3. **AI Diagnostics** - Automated repair suggestions
4. **Advanced Analytics** - Business intelligence
5. **Multi-tenant Support** - White-label capabilities

## ⚠️ FINAL REMINDER

**CRITICAL RESTRICTIONS:**
- ❌ **NEVER touch `/opt/webapps/website/` or `/opt/webapps/CRM/`**
- ❌ **NEVER use ports: 3000, 3001, 5000, 5001, 3308, 5433, 6380, 6381**
- ❌ **NEVER create pages without referencing `/Docs/PRD_RevivaTech_Brand_Theme.md`**
- ❌ **NEVER use colors outside the brand palette (Trust Blue, Professional Teal, Neutral Grey)**
- ✅ **ONLY work within `/opt/webapps/revivatech/`**
- ✅ **ONLY use ports: 3010, 3011, 5435, 6383, or 8080-8099**
- ✅ **ALWAYS use brand theme colors and trust-building components**

**This project is self-contained within `/opt/webapps/revivatech/`. Any work outside this directory requires explicit user permission.**

**🎨 DESIGN REMINDER: Every new page MUST follow the RevivaTech Brand Theme guidelines for trust-building design, authentic imagery, and transparent pricing principles.**