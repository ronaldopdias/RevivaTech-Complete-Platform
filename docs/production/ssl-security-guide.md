# SSL/HTTPS Security Configuration Guide

## Overview

This guide covers the complete SSL/HTTPS security configuration for the RevivaTech production environment, including security headers, certificate management, and monitoring.

## Table of Contents

1. [SSL Certificate Management](#ssl-certificate-management)
2. [Security Headers Configuration](#security-headers-configuration)
3. [Nginx Security Optimization](#nginx-security-optimization)
4. [Monitoring and Maintenance](#monitoring-and-maintenance)
5. [Troubleshooting](#troubleshooting)
6. [Security Testing](#security-testing)

---

## SSL Certificate Management

### Automatic Setup

Run the production SSL setup script to configure everything automatically:

```bash
sudo /opt/webapps/revivatech/scripts/production-ssl-setup.sh
```

This script will:
- Install required dependencies (certbot, nginx, openssl)
- Generate Diffie-Hellman parameters
- Obtain SSL certificates for both domains
- Configure nginx with security headers
- Set up automatic renewal
- Configure firewall rules
- Optimize nginx for production

### Manual Certificate Management

#### Obtaining Certificates

```bash
# For English domain (revivatech.co.uk)
sudo certbot certonly --standalone \
  --email admin@revivatech.co.uk \
  --agree-tos \
  --domains revivatech.co.uk,www.revivatech.co.uk

# For Portuguese domain (revivatech.com.br)  
sudo certbot certonly --standalone \
  --email admin@revivatech.co.uk \
  --agree-tos \
  --domains revivatech.com.br,www.revivatech.com.br
```

#### Certificate Renewal

Certificates are automatically renewed by certbot. To test renewal:

```bash
sudo certbot renew --dry-run
```

To force renewal:

```bash
sudo certbot renew --force-renewal
```

#### Certificate Verification

Check certificate details:

```bash
# Check certificate for English domain
openssl s_client -connect revivatech.co.uk:443 -servername revivatech.co.uk < /dev/null | openssl x509 -noout -text

# Check certificate for Portuguese domain
openssl s_client -connect revivatech.com.br:443 -servername revivatech.com.br < /dev/null | openssl x509 -noout -text
```

---

## Security Headers Configuration

### HTTPS Strict Transport Security (HSTS)

```nginx
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
```

**Purpose**: Forces browsers to use HTTPS for all future requests
**Configuration**: 2 years max-age with subdomain inclusion and preload eligibility

### Content Security Policy (CSP)

```nginx
map $sent_http_content_type $csp_header {
    default "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.stripe.com wss://revivatech.co.uk ws://revivatech.co.uk; frame-src 'self' https://js.stripe.com;";
}

add_header Content-Security-Policy $csp_header always;
```

**Purpose**: Prevents XSS attacks by controlling resource loading
**Customization**: Modify the CSP header for additional third-party services

### Frame Options

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
```

**Purpose**: Prevents clickjacking attacks
**Options**: `DENY`, `SAMEORIGIN`, or `ALLOW-FROM uri`

### Content Type Options

```nginx
add_header X-Content-Type-Options "nosniff" always;
```

**Purpose**: Prevents MIME type sniffing attacks

### XSS Protection

```nginx
add_header X-XSS-Protection "1; mode=block" always;
```

**Purpose**: Enables browser XSS filtering (legacy browsers)

### Referrer Policy

```nginx
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

**Purpose**: Controls referrer information sent with requests

### Permissions Policy

```nginx
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
```

**Purpose**: Controls access to browser features

---

## Nginx Security Optimization

### SSL/TLS Configuration

```nginx
# SSL protocols and ciphers
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;

# SSL session settings
ssl_session_timeout 1d;
ssl_session_cache shared:SSL:50m;
ssl_session_tickets off;

# OCSP stapling
ssl_stapling on;
ssl_stapling_verify on;
resolver 8.8.8.8 8.8.4.4 valid=300s;
resolver_timeout 5s;
```

### Rate Limiting

```nginx
# Rate limiting zones
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;
limit_req_zone $binary_remote_addr zone=general:10m rate=20r/m;

# Usage in location blocks
location /api/auth/login {
    limit_req zone=login burst=3 nodelay;
    # ... other config
}

location /api/ {
    limit_req zone=api burst=50 nodelay;
    # ... other config
}
```

### Server Hardening

```nginx
# Hide nginx version
server_tokens off;

# Buffer size limits
client_body_buffer_size 128k;
client_max_body_size 10m;
client_header_buffer_size 1k;
large_client_header_buffers 4 4k;

# Timeout settings
client_body_timeout 60s;
client_header_timeout 60s;
keepalive_timeout 65s;
send_timeout 60s;
```

---

## Monitoring and Maintenance

### Automated Monitoring

The SSL monitoring script runs daily to check certificate expiration:

```bash
# View the monitoring script
cat /opt/revivatech/scripts/ssl-monitor.sh

# Run manually
sudo /opt/revivatech/scripts/ssl-monitor.sh
```

### Certificate Status Check

```bash
# Check certificate expiration dates
sudo certbot certificates

# Check certificate status for specific domain
echo | openssl s_client -servername revivatech.co.uk -connect revivatech.co.uk:443 2>/dev/null | openssl x509 -noout -dates
```

### Nginx Status Monitoring

```bash
# Check nginx status
sudo systemctl status nginx

# Test nginx configuration
sudo nginx -t

# Reload configuration (after changes)
sudo nginx -s reload

# View nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Security Headers Testing

Run the security headers test script:

```bash
# Test all security configurations
sudo /opt/webapps/revivatech/scripts/security-headers-test.sh
```

This script tests:
- SSL/TLS configuration
- Security headers presence and values
- HTTPS redirects
- API security (rate limiting, CORS)
- Common vulnerabilities

---

## Troubleshooting

### Common SSL Issues

#### Certificate Not Found
```bash
# Check if certificates exist
sudo ls -la /etc/letsencrypt/live/

# Re-obtain certificates if missing
sudo certbot certonly --standalone --domains revivatech.co.uk,www.revivatech.co.uk
```

#### SSL Handshake Failures
```bash
# Test SSL connection
openssl s_client -connect revivatech.co.uk:443 -servername revivatech.co.uk

# Check nginx SSL configuration
sudo nginx -t
```

#### Mixed Content Warnings
- Ensure all resources (images, scripts, stylesheets) use HTTPS URLs
- Update Content Security Policy if needed
- Check for hardcoded HTTP URLs in application code

### Security Headers Issues

#### CSP Violations
```bash
# Check browser console for CSP violation reports
# Update CSP header in nginx configuration
# Test with relaxed policy first, then tighten

# Example: allowing additional domains
map $sent_http_content_type $csp_header {
    default "default-src 'self' https://newdomain.com; ...";
}
```

#### HSTS Issues
```bash
# Clear HSTS settings in browser (Chrome)
# chrome://net-internals/#hsts
# Enter domain and delete

# Check HSTS header
curl -I https://revivatech.co.uk | grep -i strict-transport
```

### Performance Issues

#### SSL Handshake Optimization
```nginx
# Optimize SSL session cache
ssl_session_cache shared:SSL:50m;
ssl_session_timeout 1d;

# Enable OCSP stapling
ssl_stapling on;
ssl_stapling_verify on;
```

#### Rate Limiting Tuning
```nginx
# Adjust rate limits based on traffic patterns
limit_req_zone $binary_remote_addr zone=api:10m rate=200r/m;  # Increased rate
limit_req_zone $binary_remote_addr zone=general:10m rate=50r/m;  # Increased burst
```

---

## Security Testing

### Automated Testing

Run the comprehensive security test:

```bash
sudo /opt/webapps/revivatech/scripts/security-headers-test.sh
```

### External Security Testing

#### SSL Labs Test
```bash
# Test SSL configuration quality
curl -s "https://api.ssllabs.com/api/v3/analyze?host=revivatech.co.uk&startNew=on"
```

#### Security Headers Testing
```bash
# Test security headers
curl -I https://revivatech.co.uk
curl -I https://revivatech.com.br
```

### Manual Security Checks

#### Certificate Chain Validation
```bash
# Check certificate chain
openssl s_client -connect revivatech.co.uk:443 -servername revivatech.co.uk -showcerts
```

#### Cipher Suite Testing
```bash
# Test supported cipher suites
nmap --script ssl-enum-ciphers -p 443 revivatech.co.uk
```

#### HTTP Security
```bash
# Test HTTPS redirect
curl -I http://revivatech.co.uk
curl -I http://revivatech.com.br

# Test security headers
curl -I https://revivatech.co.uk
curl -I https://revivatech.com.br
```

---

## Security Checklist

### Pre-Production Checklist

- [ ] SSL certificates obtained for both domains
- [ ] HTTPS redirects working for HTTP requests
- [ ] Security headers configured and tested
- [ ] Rate limiting implemented for API endpoints
- [ ] CORS policies properly configured
- [ ] Server information disclosure minimized
- [ ] Firewall configured to allow only necessary ports
- [ ] Automatic certificate renewal configured
- [ ] SSL monitoring script installed and scheduled
- [ ] Security testing script runs without failures

### Regular Maintenance Tasks

#### Weekly
- [ ] Review nginx error logs
- [ ] Check certificate expiration status
- [ ] Monitor rate limiting effectiveness

#### Monthly
- [ ] Run security headers test script
- [ ] Review and update CSP policies if needed
- [ ] Check for nginx security updates
- [ ] Test certificate auto-renewal

#### Quarterly
- [ ] Review and update security headers configuration
- [ ] Conduct external security scan
- [ ] Review firewall rules
- [ ] Update SSL cipher suites if needed
- [ ] Review rate limiting thresholds

---

## Configuration Files

### Main Nginx Configuration
- Location: `/etc/nginx/sites-available/revivatech-production.conf`
- Symlink: `/etc/nginx/sites-enabled/revivatech-production.conf`

### SSL Certificates
- Location: `/etc/letsencrypt/live/`
- Renewal config: `/etc/letsencrypt/renewal/`

### Monitoring Scripts
- SSL Monitor: `/opt/revivatech/scripts/ssl-monitor.sh`
- Security Test: `/opt/webapps/revivatech/scripts/security-headers-test.sh`
- Setup Script: `/opt/webapps/revivatech/scripts/production-ssl-setup.sh`

### Backup Locations
- Configuration backup: `/opt/backups/ssl-setup-[timestamp]/`
- Certificate backup: `/opt/backups/ssl-setup-[timestamp]/`

---

## Emergency Procedures

### Certificate Expiration Emergency

1. **Immediate Response**
   ```bash
   # Check certificate status
   sudo certbot certificates
   
   # Force renewal
   sudo certbot renew --force-renewal
   
   # Reload nginx
   sudo nginx -s reload
   ```

2. **If renewal fails**
   ```bash
   # Stop nginx temporarily
   sudo systemctl stop nginx
   
   # Obtain new certificate
   sudo certbot certonly --standalone --domains revivatech.co.uk,www.revivatech.co.uk
   
   # Start nginx
   sudo systemctl start nginx
   ```

### Security Incident Response

1. **Immediate Actions**
   ```bash
   # Check current connections
   sudo netstat -tulnp | grep :443
   
   # Review recent access logs
   sudo tail -100 /var/log/nginx/access.log
   
   # Check for suspicious activity
   sudo grep "error" /var/log/nginx/error.log | tail -20
   ```

2. **Temporary Hardening**
   ```bash
   # Increase rate limiting temporarily
   # Edit nginx config to reduce rate limits
   sudo nginx -s reload
   
   # Block suspicious IPs if needed
   sudo ufw deny from [suspicious-ip]
   ```

---

*Last Updated: July 2025*  
*Next Review: October 2025*

For additional support or questions, contact the technical team or refer to the main documentation portal.