# SSL/TLS Troubleshooting Guide for RevivaTech

## Quick Reference Commands

### Check Certificate Status
```bash
# Check production certificate
openssl s_client -connect revivatech.co.uk:443 -servername revivatech.co.uk 2>/dev/null | openssl x509 -noout -dates

# Check local services
curl -I http://localhost:3010
curl -I http://localhost:3011/health

# Run SSL monitoring
/opt/webapps/revivatech/scripts/ssl-certificate-monitor.sh
```

### Check Cloudflare Tunnel Status
```bash
# Check tunnel service
systemctl status cloudflared

# Check recent logs
journalctl -u cloudflared --since "10 minutes ago"

# Test ingress rules
cd /etc/cloudflared && cloudflared tunnel ingress rule https://revivatech.co.uk
```

### Check Certificate Renewal
```bash
# Test Let's Encrypt renewal
certbot renew --dry-run --cert-name revivatech.co.uk

# Check renewal timer
systemctl status certbot.timer

# View renewal configuration
cat /etc/letsencrypt/renewal/revivatech.co.uk.conf
```

## Architecture Overview

### Current SSL Architecture (Post-Remediation)
```
Internet → Cloudflare Edge (SSL termination) → Cloudflare Tunnel → Local HTTP Services
```

**Benefits**:
- Single SSL termination point at edge
- No SSL overhead in application layer  
- Better performance and simplified debugging
- Industry-standard architecture

### Service Communication
- **External**: HTTPS (Cloudflare handles SSL)
- **Cloudflare → Local**: HTTP over secure tunnel
- **Container → Container**: HTTP (trusted network)

## Common Issues & Solutions

### 1. Production Site Not Accessible (502 Errors)

**Symptoms**: `https://revivatech.co.uk` returns 502 Bad Gateway

**Diagnosis**:
```bash
# Check if local service is running
curl -I http://localhost:3010

# Check tunnel configuration
journalctl -u cloudflared --since "5 minutes ago"

# Check container status
docker ps --filter "name=revivatech_frontend"
```

**Solutions**:
1. **Container Issue**: Restart frontend container
   ```bash
   docker restart revivatech_frontend
   ```

2. **Tunnel Configuration Issue**: Check Cloudflare tunnel config
   ```bash
   cloudflared tunnel ingress rule https://revivatech.co.uk
   ```

3. **Remote Configuration Override**: Update via API
   ```bash
   curl -X PUT "https://api.cloudflare.com/client/v4/accounts/393107996abab7da2c2e393b2e668235/cfd_tunnel/89792b6f-6990-4591-a529-8982596a2eaf/configurations" \
     -H "Authorization: Bearer dQ10MfJmQL0mChrVOknXbcNSn2OACBfTyFNdBqrQ" \
     -H "Content-Type: application/json" \
     --data @/opt/webapps/revivatech/tunnel-config.json
   ```

### 2. Certificate Expiry Warnings

**Symptoms**: SSL monitoring alerts about expiring certificates

**Diagnosis**:
```bash
# Check certificate expiry
openssl s_client -connect revivatech.co.uk:443 2>/dev/null | openssl x509 -noout -dates

# Check Let's Encrypt status
certbot certificates
```

**Solutions**:
1. **Manual Renewal**:
   ```bash
   certbot renew --cert-name revivatech.co.uk
   ```

2. **Fix Automatic Renewal**:
   ```bash
   # Check timer status
   systemctl status certbot.timer

   # Enable if disabled
   systemctl enable certbot.timer
   systemctl start certbot.timer
   ```

3. **Cloudflare Credentials Issue**:
   ```bash
   # Verify credentials
   cat /root/.cloudflare-credentials
   
   # Test DNS access
   curl -X GET "https://api.cloudflare.com/client/v4/zones/d7e8be68d4be89b94953dc300cea18d4/dns_records" \
     -H "Authorization: Bearer dQ10MfJmQL0mChrVOknXbcNSn2OACBfTyFNdBqrQ"
   ```

### 3. Local Development SSL Issues

**Symptoms**: Local HTTPS not working, certificate warnings

**Current Solution**: Local development uses HTTP only
```bash
# Access local development
http://localhost:3010

# For HTTPS in development, use Cloudflare tunnel
https://revivatech.co.uk
```

**Alternative**: If HTTPS needed locally, use mkcert:
```bash
# Install mkcert (if needed)
apt install mkcert

# Generate local certificates
mkcert localhost 127.0.0.1

# Configure nginx for local HTTPS if required
```

### 4. Container SSL Configuration Issues

**Symptoms**: Container trying to use SSL when it shouldn't

**Diagnosis**:
```bash
# Check container process
docker exec revivatech_frontend ps aux | grep node

# Check environment variables
docker exec revivatech_frontend env | grep -E "(SSL|HTTPS)"
```

**Solutions**:
1. **Rebuild Container**:
   ```bash
   docker-compose -f /opt/webapps/revivatech/docker-compose.dev.yml build --no-cache revivatech_frontend
   docker-compose -f /opt/webapps/revivatech/docker-compose.dev.yml restart revivatech_frontend
   ```

2. **Check Dockerfile**:
   - Ensure `CMD ["npm", "run", "dev"]` (not `dev:ssl`)
   - Remove SSL environment variables
   - Remove certificate volume mounts

### 5. Cloudflare Tunnel Not Starting

**Symptoms**: Tunnel service fails to start or connect

**Diagnosis**:
```bash
# Check service status
systemctl status cloudflared

# Check configuration
cloudflared tunnel ingress validate /etc/cloudflared/config.yml

# Test credentials
ls -la /root/.cloudflared/
```

**Solutions**:
1. **Configuration Issue**:
   ```bash
   # Validate config
   cloudflared tunnel ingress validate /etc/cloudflared/config.yml
   
   # Restart service
   systemctl restart cloudflared
   ```

2. **Credentials Issue**:
   ```bash
   # Check tunnel exists
   cloudflared tunnel list
   
   # Re-authenticate if needed
   cloudflared tunnel login
   ```

## Performance Monitoring

### SSL Performance Metrics
```bash
# Test response times
time curl -I https://revivatech.co.uk

# Check SSL handshake time
curl -w "@curl-format.txt" -o /dev/null -s https://revivatech.co.uk

# Monitor tunnel connections
journalctl -u cloudflared -f | grep "connection"
```

### Certificate Monitoring
```bash
# Run daily monitoring
/opt/webapps/revivatech/scripts/ssl-certificate-monitor.sh

# Enable email alerts
/opt/webapps/revivatech/scripts/ssl-certificate-monitor.sh --alert --email admin@revivatech.co.uk

# Check monitoring logs
tail -f /var/log/ssl-certificate-monitor.log
```

## Security Best Practices

### Current Security Measures
- ✅ TLS 1.2 and 1.3 enabled
- ✅ HSTS enabled with preload
- ✅ Strong cipher suites (Cloudflare managed)
- ✅ Certificate transparency monitoring
- ✅ Automated certificate renewal

### Additional Security Recommendations
1. **Certificate Pinning**: Consider implementing for mobile apps
2. **CAA Records**: Add DNS CAA records to restrict certificate authorities
3. **OCSP Stapling**: Verify OCSP stapling is enabled (Cloudflare default)
4. **Security Headers**: Review CSP and other security headers

## Emergency Procedures

### Complete SSL Failure
1. **Immediate**: Check if site accessible via HTTP tunnel
2. **Temporary**: Use Cloudflare "Always Use HTTPS" disabled if needed
3. **Fix**: Identify root cause (certificate, tunnel, or service)
4. **Restore**: Apply fix and verify full SSL chain

### Certificate Renewal Failure
1. **Manual Renewal**: Try manual certbot renewal
2. **Alternative Method**: Use Cloudflare Origin Certificates if needed
3. **DNS Issues**: Verify Cloudflare API credentials
4. **Escalation**: Contact Cloudflare support if API issues

### Performance Issues
1. **Check**: Local service response times
2. **Monitor**: Tunnel connection health
3. **Optimize**: Review caching and compression settings
4. **Scale**: Consider additional tunnel connections if needed

## Monitoring & Alerts

### Automated Monitoring
- **Daily**: SSL certificate monitoring (6 AM)
- **Real-time**: Cloudflare tunnel health
- **Weekly**: Full SSL security audit

### Alert Thresholds
- **Warning**: Certificate expires < 30 days
- **Critical**: Certificate expires < 7 days
- **Emergency**: Service unavailable > 5 minutes

### Contact Information
- **Infrastructure**: Check server access and container status
- **DNS/SSL**: Cloudflare dashboard and API
- **Monitoring**: Review logs in `/var/log/ssl-certificate-monitor.log`

---

**Last Updated**: August 17, 2025  
**Next Review**: September 17, 2025  
**Emergency Contact**: Check CLAUDE.md for current procedures