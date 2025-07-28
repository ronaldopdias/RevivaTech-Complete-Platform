#!/bin/bash

# Production SSL/HTTPS Setup Script for RevivaTech
# This script configures SSL certificates, security headers, and production settings

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN_EN="revivatech.co.uk"
DOMAIN_PT="revivatech.com.br"
EMAIL="admin@revivatech.co.uk"
NGINX_CONF_DIR="/etc/nginx/sites-available"
NGINX_ENABLED_DIR="/etc/nginx/sites-enabled"
SSL_DIR="/etc/ssl/certs/revivatech"
BACKUP_DIR="/opt/backups/ssl-setup-$(date +%Y%m%d_%H%M%S)"

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root"
    fi
}

# Backup existing configuration
backup_config() {
    log "Creating backup of existing configuration..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup nginx configs
    if [[ -f "$NGINX_CONF_DIR/revivatech-production.conf" ]]; then
        cp "$NGINX_CONF_DIR/revivatech-production.conf" "$BACKUP_DIR/"
    fi
    
    # Backup existing SSL certificates
    if [[ -d "$SSL_DIR" ]]; then
        cp -r "$SSL_DIR" "$BACKUP_DIR/"
    fi
    
    success "Backup created at $BACKUP_DIR"
}

# Install required packages
install_dependencies() {
    log "Installing required packages..."
    
    apt update
    apt install -y certbot python3-certbot-nginx nginx openssl
    
    success "Dependencies installed"
}

# Create SSL directory structure
create_ssl_structure() {
    log "Creating SSL directory structure..."
    
    mkdir -p "$SSL_DIR"
    mkdir -p "$SSL_DIR/live"
    mkdir -p "$SSL_DIR/archive"
    
    success "SSL directory structure created"
}

# Generate strong Diffie-Hellman parameters
generate_dhparam() {
    log "Generating Diffie-Hellman parameters (this may take several minutes)..."
    
    if [[ ! -f "$SSL_DIR/dhparam.pem" ]]; then
        openssl dhparam -out "$SSL_DIR/dhparam.pem" 2048
        success "Diffie-Hellman parameters generated"
    else
        warning "Diffie-Hellman parameters already exist"
    fi
}

# Create nginx production configuration
create_nginx_config() {
    log "Creating nginx production configuration..."
    
    cat > "$NGINX_CONF_DIR/revivatech-production.conf" << 'EOF'
# RevivaTech Production Configuration
# Dual-domain setup with SSL/HTTPS and security headers

# Rate limiting zones
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;
limit_req_zone $binary_remote_addr zone=general:10m rate=20r/m;

# Upstream definitions
upstream revivatech_backend {
    server 127.0.0.1:3011 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

upstream revivatech_frontend_en {
    server 127.0.0.1:3010 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

upstream revivatech_frontend_pt {
    server 127.0.0.1:3000 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

# Security headers map
map $sent_http_content_type $csp_header {
    default "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.stripe.com wss://localhost:3011 ws://localhost:3011; frame-src 'self' https://js.stripe.com;";
    ~^text/html "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.stripe.com wss://revivatech.co.uk ws://revivatech.co.uk; frame-src 'self' https://js.stripe.com;";
}

# English Domain (revivatech.co.uk)
server {
    listen 80;
    server_name revivatech.co.uk www.revivatech.co.uk;
    
    # Security headers for HTTP
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name revivatech.co.uk www.revivatech.co.uk;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/revivatech.co.uk/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/revivatech.co.uk/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/revivatech.co.uk/chain.pem;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_dhparam /etc/ssl/certs/revivatech/dhparam.pem;
    
    # SSL Session Settings
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;
    
    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
    add_header Content-Security-Policy $csp_header always;
    
    # General Settings
    client_max_body_size 10M;
    client_body_timeout 60s;
    client_header_timeout 60s;
    keepalive_timeout 65s;
    send_timeout 60s;
    
    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
    
    # API Routes
    location /api/ {
        limit_req zone=api burst=50 nodelay;
        
        proxy_pass http://revivatech_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # CORS headers for API
        add_header Access-Control-Allow-Origin "https://revivatech.co.uk" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-Requested-With" always;
        add_header Access-Control-Allow-Credentials "true" always;
        
        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }
    
    # WebSocket Support
    location /socket.io/ {
        proxy_pass http://revivatech_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket timeout settings
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
    
    # Health checks
    location /health {
        limit_req zone=general burst=10 nodelay;
        proxy_pass http://revivatech_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        access_log off;
    }
    
    # Static assets with caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header X-Content-Type-Options "nosniff" always;
        
        proxy_pass http://revivatech_frontend_en;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Frontend routes
    location / {
        limit_req zone=general burst=20 nodelay;
        
        proxy_pass http://revivatech_frontend_en;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Next.js specific headers
        proxy_set_header Accept-Encoding gzip;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        proxy_busy_buffers_size 8k;
    }
    
    # Security.txt
    location /.well-known/security.txt {
        return 200 "Contact: security@revivatech.co.uk\nExpires: 2026-01-01T00:00:00.000Z\nPreferred-Languages: en\nCanonical: https://revivatech.co.uk/.well-known/security.txt";
        add_header Content-Type text/plain;
    }
    
    # Robots.txt
    location /robots.txt {
        proxy_pass http://revivatech_frontend_en;
        proxy_set_header Host $host;
    }
    
    # Error pages
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
}

# Portuguese Domain (revivatech.com.br)
server {
    listen 80;
    server_name revivatech.com.br www.revivatech.com.br;
    
    # Security headers for HTTP
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name revivatech.com.br www.revivatech.com.br;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/revivatech.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/revivatech.com.br/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/revivatech.com.br/chain.pem;
    
    # SSL Security Settings (same as English domain)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_dhparam /etc/ssl/certs/revivatech/dhparam.pem;
    
    # SSL Session Settings
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;
    
    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
    add_header Content-Security-Policy $csp_header always;
    
    # General Settings
    client_max_body_size 10M;
    client_body_timeout 60s;
    client_header_timeout 60s;
    keepalive_timeout 65s;
    send_timeout 60s;
    
    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
    
    # Frontend routes (Portuguese)
    location / {
        limit_req zone=general burst=20 nodelay;
        
        proxy_pass http://revivatech_frontend_pt;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Next.js specific headers
        proxy_set_header Accept-Encoding gzip;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        proxy_busy_buffers_size 8k;
    }
    
    # Static assets with caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header X-Content-Type-Options "nosniff" always;
        
        proxy_pass http://revivatech_frontend_pt;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Error pages
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
}
EOF

    success "Nginx production configuration created"
}

# Obtain SSL certificates
obtain_ssl_certificates() {
    log "Obtaining SSL certificates for both domains..."
    
    # Stop nginx temporarily to avoid port conflicts
    systemctl stop nginx
    
    # Obtain certificate for English domain
    log "Obtaining certificate for $DOMAIN_EN..."
    certbot certonly --standalone \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        --domains "$DOMAIN_EN,www.$DOMAIN_EN" \
        --non-interactive
    
    # Obtain certificate for Portuguese domain
    log "Obtaining certificate for $DOMAIN_PT..."
    certbot certonly --standalone \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        --domains "$DOMAIN_PT,www.$DOMAIN_PT" \
        --non-interactive
    
    success "SSL certificates obtained"
}

# Setup certificate auto-renewal
setup_auto_renewal() {
    log "Setting up automatic certificate renewal..."
    
    # Create renewal hook script
    cat > /etc/letsencrypt/renewal-hooks/deploy/nginx-reload.sh << 'EOF'
#!/bin/bash
# Reload nginx after certificate renewal
systemctl reload nginx
EOF
    
    chmod +x /etc/letsencrypt/renewal-hooks/deploy/nginx-reload.sh
    
    # Test auto-renewal
    certbot renew --dry-run
    
    success "Auto-renewal configured and tested"
}

# Enable the configuration
enable_configuration() {
    log "Enabling nginx configuration..."
    
    # Remove any existing symlinks
    rm -f "$NGINX_ENABLED_DIR/revivatech-production.conf"
    rm -f "$NGINX_ENABLED_DIR/default"
    
    # Create symlink
    ln -s "$NGINX_CONF_DIR/revivatech-production.conf" "$NGINX_ENABLED_DIR/"
    
    # Test configuration
    nginx -t
    
    success "Configuration enabled and tested"
}

# Configure firewall
configure_firewall() {
    log "Configuring firewall rules..."
    
    # Install ufw if not already installed
    apt install -y ufw
    
    # Reset firewall rules
    ufw --force reset
    
    # Default policies
    ufw default deny incoming
    ufw default allow outgoing
    
    # Allow SSH
    ufw allow ssh
    
    # Allow HTTP and HTTPS
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # Enable firewall
    ufw --force enable
    
    success "Firewall configured"
}

# Optimize nginx for production
optimize_nginx() {
    log "Optimizing nginx for production..."
    
    # Backup original nginx.conf
    cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup
    
    # Create optimized nginx.conf
    cat > /etc/nginx/nginx.conf << 'EOF'
user www-data;
worker_processes auto;
worker_rlimit_nofile 65535;
pid /run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    # Basic Settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_tokens off;
    client_body_buffer_size 128k;
    client_max_body_size 10m;
    client_header_buffer_size 1k;
    large_client_header_buffers 4 4k;
    output_buffers 1 32k;
    postpone_output 1460;
    
    # MIME
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    # Logging Settings
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    
    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;
    
    # Gzip Settings
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
    
    # Virtual Host Configs
    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
EOF

    success "Nginx optimized for production"
}

# Start services
start_services() {
    log "Starting services..."
    
    # Start and enable nginx
    systemctl enable nginx
    systemctl start nginx
    
    # Verify nginx is running
    systemctl status nginx --no-pager
    
    success "Services started"
}

# Verify SSL configuration
verify_ssl() {
    log "Verifying SSL configuration..."
    
    # Check certificates
    echo "Checking certificate for $DOMAIN_EN..."
    timeout 10 openssl s_client -connect "$DOMAIN_EN:443" -servername "$DOMAIN_EN" < /dev/null
    
    echo "Checking certificate for $DOMAIN_PT..."
    timeout 10 openssl s_client -connect "$DOMAIN_PT:443" -servername "$DOMAIN_PT" < /dev/null
    
    # Test HTTPS redirect
    echo "Testing HTTPS redirect..."
    curl -sI "http://$DOMAIN_EN" | grep -i "location: https://"
    curl -sI "http://$DOMAIN_PT" | grep -i "location: https://"
    
    success "SSL configuration verified"
}

# Create monitoring script
create_monitoring_script() {
    log "Creating SSL monitoring script..."
    
    cat > /opt/revivatech/scripts/ssl-monitor.sh << 'EOF'
#!/bin/bash

# SSL Certificate Monitoring Script
# Checks certificate expiration and sends alerts

DOMAINS=("revivatech.co.uk" "revivatech.com.br")
WARNING_DAYS=30
CRITICAL_DAYS=7
EMAIL="admin@revivatech.co.uk"

for domain in "${DOMAINS[@]}"; do
    exp_date=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -dates | grep notAfter | cut -d= -f2)
    exp_epoch=$(date -d "$exp_date" +%s)
    now_epoch=$(date +%s)
    days_until_exp=$(( (exp_epoch - now_epoch) / 86400 ))
    
    if [ $days_until_exp -le $CRITICAL_DAYS ]; then
        echo "CRITICAL: SSL certificate for $domain expires in $days_until_exp days!"
        # Send critical alert
    elif [ $days_until_exp -le $WARNING_DAYS ]; then
        echo "WARNING: SSL certificate for $domain expires in $days_until_exp days"
        # Send warning alert
    else
        echo "OK: SSL certificate for $domain expires in $days_until_exp days"
    fi
done
EOF

    chmod +x /opt/revivatech/scripts/ssl-monitor.sh
    
    # Add to crontab for daily monitoring
    (crontab -l 2>/dev/null; echo "0 8 * * * /opt/revivatech/scripts/ssl-monitor.sh") | crontab -
    
    success "SSL monitoring script created and scheduled"
}

# Main execution
main() {
    log "Starting RevivaTech SSL/HTTPS Production Setup"
    
    check_root
    backup_config
    install_dependencies
    create_ssl_structure
    generate_dhparam
    create_nginx_config
    obtain_ssl_certificates
    setup_auto_renewal
    enable_configuration
    configure_firewall
    optimize_nginx
    start_services
    verify_ssl
    create_monitoring_script
    
    success "SSL/HTTPS production setup completed successfully!"
    
    echo
    echo "======================================"
    echo "Production SSL Setup Summary"
    echo "======================================"
    echo "✅ SSL certificates obtained for both domains"
    echo "✅ Nginx configured with security headers"
    echo "✅ Auto-renewal configured"
    echo "✅ Firewall configured"
    echo "✅ Monitoring script installed"
    echo
    echo "Next steps:"
    echo "1. Update DNS records to point to this server"
    echo "2. Test both domains: https://$DOMAIN_EN and https://$DOMAIN_PT"
    echo "3. Configure backup procedures"
    echo "4. Set up monitoring and alerting"
    echo
    echo "Backup location: $BACKUP_DIR"
    echo "SSL certificates: /etc/letsencrypt/live/"
    echo "Nginx config: $NGINX_CONF_DIR/revivatech-production.conf"
    echo
}

# Run if executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi