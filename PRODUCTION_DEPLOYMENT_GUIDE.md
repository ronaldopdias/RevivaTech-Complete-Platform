# RevivaTech Production Deployment Guide

## 🚀 Production Readiness Status

**✅ PRODUCTION READY** - All critical systems operational and optimized

### 🎯 Key Achievements
- ✅ **Build System**: Production builds working without errors
- ✅ **Performance**: Optimized Next.js configuration and Docker containers
- ✅ **Security**: Comprehensive security hardening implemented
- ✅ **Infrastructure**: Complete deployment automation and monitoring
- ✅ **Analytics**: Server-side analytics with API endpoints operational
- ✅ **Health Monitoring**: Automated health checks and alerting

## 📋 Pre-Deployment Checklist

### Environment Setup
- [ ] Copy `.env.production.example` to `.env.production`
- [ ] Fill in all required environment variables
- [ ] Verify database credentials and connectivity
- [ ] Configure SendGrid API key for email notifications
- [ ] Set up Cloudflare API tokens for DNS management

### Security Configuration
- [ ] Run security hardening script: `sudo ./scripts/security-hardening.sh`
- [ ] Configure SSL certificates: `certbot --nginx -d revivatech.co.uk -d revivatech.com.br`
- [ ] Verify firewall rules: `ufw status verbose`
- [ ] Test fail2ban configuration: `fail2ban-client status`

### Infrastructure Verification
- [ ] Docker and Docker Compose installed and configured
- [ ] Nginx installed and production config ready
- [ ] Monitoring scripts executable and scheduled
- [ ] Backup directories created with proper permissions

## 🔧 Deployment Process

### 1. Initial Setup (First-time deployment)
```bash
# Clone or update repository
cd /opt/webapps/revivatech

# Copy and configure environment
cp .env.production.example .env.production
nano .env.production

# Run security hardening
sudo ./scripts/security-hardening.sh

# Configure SSL certificates
sudo certbot --nginx -d revivatech.co.uk -d revivatech.com.br
```

### 2. Deploy Application
```bash
# Deploy to production
sudo ./scripts/deploy-production.sh deploy

# Monitor deployment logs
docker-compose -f docker-compose.production.yml logs -f
```

### 3. Verification
```bash
# Check service health
./scripts/deploy-production.sh health

# Test endpoints
curl https://revivatech.co.uk/api/health
curl https://revivatech.com.br/api/health
curl https://revivatech.co.uk/api/analytics
```

## 🏗️ Architecture Overview

### Container Structure
```
┌─ revivatech_frontend_prod (port 3010) ─ English Site
├─ revivatech_backend_prod (port 3011)  ─ API Server
├─ revivatech_database_prod (port 5435) ─ PostgreSQL
├─ revivatech_redis_prod (port 6383)    ─ Redis Cache
└─ revivatech_nginx_prod (80/443)       ─ Reverse Proxy
```

### Network Configuration
- **External Access**: Through Cloudflare tunnel and nginx reverse proxy
- **Internal Communication**: Docker bridge network (172.21.0.0/16)
- **Security**: UFW firewall with minimal port exposure
- **SSL/TLS**: Let's Encrypt certificates with auto-renewal

### Data Flow
```
Internet → Cloudflare → Nginx → Frontend/Backend → Database/Redis
         ↓
    Domain Routing:
    - revivatech.co.uk → Port 3010 (English)
    - revivatech.com.br → Port 3000 (Portuguese)
    - API requests → Port 3011 (Backend)
```

## 📊 Monitoring & Maintenance

### Health Monitoring
- **Automated Health Checks**: Every 5 minutes via cron
- **Service Monitoring**: Frontend, Backend, Database, Redis
- **Resource Monitoring**: CPU, Memory, Disk space
- **Log Location**: `/var/log/revivatech/health-check.log`

### Backup Strategy
- **Automated Backups**: Created before each deployment
- **Database Backup**: PostgreSQL dump with retention
- **Redis Backup**: RDB snapshots for cache recovery
- **Application Backup**: Complete application state
- **Retention**: 30 days with automatic cleanup

### Log Management
- **Nginx Logs**: `/var/log/nginx/` (rotated daily)
- **Application Logs**: Docker container logs
- **Security Logs**: Fail2ban and UFW logs
- **Deployment Logs**: `/var/log/revivatech-deploy.log`

## 🔒 Security Features

### Network Security
- **UFW Firewall**: Restrictive rules with minimal exposure
- **Fail2ban**: Intrusion detection and prevention
- **Rate Limiting**: Nginx-based API and general rate limits
- **DDoS Protection**: Cloudflare protection layer

### Application Security
- **Security Headers**: HSTS, CSP, X-Frame-Options, etc.
- **Input Validation**: Zod schemas and sanitization
- **Authentication**: JWT with refresh token rotation
- **API Security**: Rate limiting and request validation

### Infrastructure Security
- **Container Security**: Non-root users, minimal images
- **Secrets Management**: Environment-based configuration
- **Automatic Updates**: Security patches via unattended-upgrades
- **Monitoring**: Real-time security event logging

## 🚨 Incident Response

### Emergency Procedures

#### Service Down
```bash
# Check service status
docker-compose -f docker-compose.production.yml ps

# View logs
docker-compose -f docker-compose.production.yml logs [service_name]

# Restart specific service
docker-compose -f docker-compose.production.yml restart [service_name]
```

#### Database Issues
```bash
# Check database health
docker exec revivatech_database_prod pg_isready -U revivatech_user

# Access database console
docker exec -it revivatech_database_prod psql -U revivatech_user -d revivatech_prod

# Restore from backup
./scripts/deploy-production.sh rollback [backup_path]
```

#### Performance Issues
```bash
# Check resource usage
docker stats

# Check nginx status
systemctl status nginx

# Monitor real-time logs
tail -f /var/log/nginx/access.log
```

### Rollback Procedures
```bash
# Rollback to latest backup
sudo ./scripts/deploy-production.sh rollback

# Rollback to specific backup
sudo ./scripts/deploy-production.sh rollback /opt/backups/revivatech/backup_20250720_120000
```

## 📈 Performance Optimization

### Current Optimizations
- **Next.js Production Build**: Minification, tree shaking, code splitting
- **Image Optimization**: AVIF/WebP formats with lazy loading
- **Caching Strategy**: Redis for API responses, nginx for static assets
- **Bundle Analysis**: Webpack bundle analyzer for size optimization
- **CDN Integration**: Cloudflare for global content delivery

### Performance Monitoring
- **Core Web Vitals**: LCP, FID, CLS tracking
- **Bundle Size**: Automated analysis and recommendations
- **API Response Times**: Health check timing
- **Database Performance**: Query optimization and indexing

## 🔄 CI/CD Integration (Future)

### Recommended Pipeline
1. **Code Push** → GitHub/GitLab
2. **Automated Testing** → Unit and integration tests
3. **Security Scanning** → Vulnerability assessment
4. **Build Images** → Docker image creation
5. **Deploy Staging** → Staging environment testing
6. **Production Deploy** → Automated production deployment
7. **Health Checks** → Post-deployment verification

### Deployment Triggers
- **Manual**: Via deployment script
- **Scheduled**: Automated updates with approval
- **Hotfix**: Emergency patches with fast-track process

## 📞 Support Contacts

### Emergency Contacts
- **System Administrator**: [Contact Information]
- **Development Team**: [Contact Information]
- **Hosting Provider**: [Provider Support]

### Documentation
- **Application Documentation**: `/opt/webapps/revivatech/Docs/`
- **Infrastructure Setup**: `/opt/webapps/CLAUDE_INFRASTRUCTURE_SETUP.md`
- **Security Policies**: Security team documentation

---

## 🎉 Success! 

RevivaTech is now **production-ready** with:
- ✅ Zero-downtime deployment capability
- ✅ Comprehensive security hardening
- ✅ Automated monitoring and alerting
- ✅ Database backup and recovery
- ✅ Performance optimization
- ✅ Incident response procedures

**Next Step**: Execute `sudo ./scripts/deploy-production.sh deploy` to go live!

---

*Last Updated: July 2025*
*Status: Production Ready*
*Version: 1.0.0*