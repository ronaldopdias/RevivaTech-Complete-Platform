#!/bin/bash

# RevivaTech Security Hardening Script
# Applies production security configurations

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root or with sudo"
    fi
}

# Update system packages
update_system() {
    log "Updating system packages..."
    apt update && apt upgrade -y
    success "System packages updated"
}

# Configure firewall
configure_firewall() {
    log "Configuring UFW firewall..."
    
    # Reset UFW to defaults
    ufw --force reset
    
    # Default policies
    ufw default deny incoming
    ufw default allow outgoing
    
    # Allow SSH (adjust port if needed)
    ufw allow 22/tcp
    
    # Allow HTTP and HTTPS
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # Allow application ports (restrict to localhost for internal services)
    ufw allow from 127.0.0.1 to any port 3010
    ufw allow from 127.0.0.1 to any port 3011
    ufw allow from 127.0.0.1 to any port 5435
    ufw allow from 127.0.0.1 to any port 6383
    
    # Allow Docker networks
    ufw allow from 172.21.0.0/16
    
    # Enable UFW
    ufw --force enable
    
    success "Firewall configured"
}

# Secure Docker daemon
secure_docker() {
    log "Securing Docker daemon..."
    
    # Create Docker daemon configuration
    cat > /etc/docker/daemon.json << EOF
{
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "10m",
        "max-file": "3"
    },
    "live-restore": true,
    "userland-proxy": false,
    "no-new-privileges": true,
    "seccomp-profile": "/etc/docker/seccomp/default.json",
    "storage-driver": "overlay2"
}
EOF
    
    # Restart Docker
    systemctl restart docker
    
    success "Docker daemon secured"
}

# Configure fail2ban
configure_fail2ban() {
    log "Installing and configuring fail2ban..."
    
    # Install fail2ban
    apt install -y fail2ban
    
    # Create nginx jail configuration
    cat > /etc/fail2ban/jail.d/nginx.conf << EOF
[nginx-http-auth]
enabled = true
filter = nginx-http-auth
logpath = /var/log/nginx/error.log
maxretry = 3
bantime = 3600

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/error.log
maxretry = 10
bantime = 3600
EOF

    # Create nginx filter
    cat > /etc/fail2ban/filter.d/nginx-limit-req.conf << EOF
[Definition]
failregex = limiting requests, excess: .* by zone .*, client: <HOST>
ignoreregex =
EOF
    
    # Restart fail2ban
    systemctl restart fail2ban
    systemctl enable fail2ban
    
    success "Fail2ban configured"
}

# Secure system settings
secure_system() {
    log "Applying system security settings..."
    
    # Disable IPv6 if not needed
    echo "net.ipv6.conf.all.disable_ipv6 = 1" >> /etc/sysctl.conf
    echo "net.ipv6.conf.default.disable_ipv6 = 1" >> /etc/sysctl.conf
    
    # Network security
    echo "net.ipv4.ip_forward = 0" >> /etc/sysctl.conf
    echo "net.ipv4.conf.all.send_redirects = 0" >> /etc/sysctl.conf
    echo "net.ipv4.conf.default.send_redirects = 0" >> /etc/sysctl.conf
    echo "net.ipv4.conf.all.accept_redirects = 0" >> /etc/sysctl.conf
    echo "net.ipv4.conf.default.accept_redirects = 0" >> /etc/sysctl.conf
    echo "net.ipv4.conf.all.accept_source_route = 0" >> /etc/sysctl.conf
    echo "net.ipv4.conf.default.accept_source_route = 0" >> /etc/sysctl.conf
    echo "net.ipv4.conf.all.log_martians = 1" >> /etc/sysctl.conf
    echo "net.ipv4.icmp_echo_ignore_broadcasts = 1" >> /etc/sysctl.conf
    echo "net.ipv4.icmp_ignore_bogus_error_responses = 1" >> /etc/sysctl.conf
    echo "net.ipv4.tcp_syncookies = 1" >> /etc/sysctl.conf
    
    # Apply settings
    sysctl -p
    
    success "System security settings applied"
}

# Setup automatic security updates
setup_auto_updates() {
    log "Setting up automatic security updates..."
    
    # Install unattended-upgrades
    apt install -y unattended-upgrades
    
    # Configure automatic updates
    cat > /etc/apt/apt.conf.d/50unattended-upgrades << EOF
Unattended-Upgrade::Allowed-Origins {
    "\${distro_id}:\${distro_codename}-security";
    "\${distro_id}ESMApps:\${distro_codename}-apps-security";
    "\${distro_id}ESM:\${distro_codename}-infra-security";
};

Unattended-Upgrade::AutoFixInterruptedDpkg "true";
Unattended-Upgrade::MinimalSteps "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
EOF
    
    # Enable automatic updates
    cat > /etc/apt/apt.conf.d/20auto-upgrades << EOF
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
EOF
    
    success "Automatic security updates configured"
}

# Configure log rotation
configure_logging() {
    log "Configuring log rotation..."
    
    # Create logrotate configuration for RevivaTech
    cat > /etc/logrotate.d/revivatech << EOF
/var/log/nginx/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0644 www-data www-data
    postrotate
        if [ -f /var/run/nginx.pid ]; then
            kill -USR1 \$(cat /var/run/nginx.pid)
        fi
    endscript
}

/var/log/revivatech-deploy.log {
    weekly
    missingok
    rotate 4
    compress
    delaycompress
    notifempty
    create 0644 root root
}

/var/log/revivatech/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 0644 root root
}
EOF
    
    success "Log rotation configured"
}

# Create monitoring script
create_monitoring() {
    log "Creating system monitoring script..."
    
    mkdir -p /opt/revivatech/monitoring
    
    cat > /opt/revivatech/monitoring/health-check.sh << 'EOF'
#!/bin/bash

# Health monitoring script for RevivaTech
LOG_FILE="/var/log/revivatech/health-check.log"
mkdir -p "$(dirname "$LOG_FILE")"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Check service health
check_service() {
    local service_name="$1"
    local url="$2"
    
    if curl -f -s "$url" > /dev/null; then
        log "✓ $service_name is healthy"
        return 0
    else
        log "✗ $service_name is unhealthy"
        return 1
    fi
}

# Check disk space
check_disk_space() {
    local usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$usage" -gt 80 ]; then
        log "⚠ Disk usage is high: ${usage}%"
        return 1
    else
        log "✓ Disk usage is normal: ${usage}%"
        return 0
    fi
}

# Check memory usage
check_memory() {
    local usage=$(free | awk 'NR==2{printf "%.2f", $3*100/$2}')
    local usage_int=$(echo "$usage" | cut -d. -f1)
    if [ "$usage_int" -gt 80 ]; then
        log "⚠ Memory usage is high: ${usage}%"
        return 1
    else
        log "✓ Memory usage is normal: ${usage}%"
        return 0
    fi
}

# Main health check
main() {
    log "Starting health check..."
    
    local failed=0
    
    # Check services
    check_service "Frontend" "http://localhost:3010/api/health" || ((failed++))
    check_service "Backend" "http://localhost:3011/health" || ((failed++))
    
    # Check system resources
    check_disk_space || ((failed++))
    check_memory || ((failed++))
    
    # Check Docker containers
    if ! docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "Up"; then
        log "✗ Some Docker containers are not running"
        ((failed++))
    else
        log "✓ Docker containers are running"
    fi
    
    if [ $failed -eq 0 ]; then
        log "✓ All health checks passed"
        exit 0
    else
        log "✗ $failed health checks failed"
        exit 1
    fi
}

main "$@"
EOF
    
    chmod +x /opt/revivatech/monitoring/health-check.sh
    
    # Add to crontab
    (crontab -l 2>/dev/null; echo "*/5 * * * * /opt/revivatech/monitoring/health-check.sh") | crontab -
    
    success "Health monitoring configured"
}

# Setup SSL certificate renewal
setup_ssl_renewal() {
    log "Setting up SSL certificate renewal..."
    
    # Install certbot
    apt install -y certbot python3-certbot-nginx
    
    # Create renewal script
    cat > /opt/revivatech/scripts/renew-ssl.sh << 'EOF'
#!/bin/bash
certbot renew --nginx --quiet
systemctl reload nginx
EOF
    
    chmod +x /opt/revivatech/scripts/renew-ssl.sh
    
    # Add to crontab for monthly renewal
    (crontab -l 2>/dev/null; echo "0 3 1 * * /opt/revivatech/scripts/renew-ssl.sh") | crontab -
    
    success "SSL certificate renewal configured"
}

# Main execution
main() {
    log "Starting RevivaTech security hardening..."
    
    check_root
    update_system
    configure_firewall
    secure_docker
    configure_fail2ban
    secure_system
    setup_auto_updates
    configure_logging
    create_monitoring
    setup_ssl_renewal
    
    success "Security hardening completed successfully!"
    
    echo ""
    echo "Security hardening summary:"
    echo "✓ System packages updated"
    echo "✓ UFW firewall configured"
    echo "✓ Docker daemon secured"
    echo "✓ Fail2ban configured"
    echo "✓ System security settings applied"
    echo "✓ Automatic security updates enabled"
    echo "✓ Log rotation configured"
    echo "✓ Health monitoring setup"
    echo "✓ SSL certificate auto-renewal configured"
    echo ""
    echo "Next steps:"
    echo "1. Configure SSL certificates: certbot --nginx -d revivatech.co.uk -d revivatech.com.br"
    echo "2. Review and test firewall rules: ufw status verbose"
    echo "3. Monitor logs: tail -f /var/log/revivatech/health-check.log"
    echo "4. Test deployment: /opt/webapps/revivatech/scripts/deploy-production.sh"
}

main "$@"