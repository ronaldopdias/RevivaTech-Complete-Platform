#!/bin/bash
# SSL Certificate Setup Script for RevivaTech
# This script sets up both Let's Encrypt (production) and mkcert (development) certificates

set -e

echo "🔒 RevivaTech SSL Certificate Setup"
echo "=================================="

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if running as root for Let's Encrypt
check_root() {
    if [[ $EUID -ne 0 ]]; then
        warning "Some operations require root privileges for Let's Encrypt setup"
        info "Run with sudo for full SSL setup: sudo $0"
    fi
}

# Setup mkcert certificates for development
setup_mkcert() {
    info "Setting up mkcert certificates for development..."
    
    # Check if mkcert is installed
    if ! command -v mkcert &> /dev/null; then
        error "mkcert is not installed"
        info "Install mkcert: https://github.com/FiloSottile/mkcert#installation"
        return 1
    fi
    
    # Install CA if not already done
    info "Installing mkcert CA..."
    mkcert -install
    
    # Generate certificates
    cd /opt/webapps/revivatech/frontend/certificates/
    
    info "Generating trusted certificates for all access methods..."
    mkcert localhost 127.0.0.1 100.122.130.67 ::1
    
    # Rename for consistency
    if [[ -f "localhost+3.pem" ]]; then
        mv localhost+3.pem localhost-trusted.pem
        mv localhost+3-key.pem localhost-trusted-key.pem
        success "mkcert certificates generated successfully"
        
        # Show certificate details
        info "Certificate details:"
        openssl x509 -in localhost-trusted.pem -text -noout | grep -A 2 "DNS:\|IP Address:" || true
    else
        error "Failed to generate mkcert certificates"
        return 1
    fi
}

# Setup Let's Encrypt certificates for production
setup_letsencrypt() {
    if [[ $EUID -ne 0 ]]; then
        warning "Skipping Let's Encrypt setup (requires root privileges)"
        return 0
    fi
    
    info "Setting up Let's Encrypt certificates..."
    
    # Check if certbot is installed
    if ! command -v certbot &> /dev/null; then
        error "certbot is not installed"
        info "Install certbot: apt-get install certbot python3-certbot-dns-cloudflare"
        return 1
    fi
    
    # Check if Cloudflare credentials exist
    if [[ ! -f "/etc/letsencrypt/cloudflare.ini" ]]; then
        warning "Cloudflare credentials not found at /etc/letsencrypt/cloudflare.ini"
        info "Please configure your Cloudflare API token:"
        echo ""
        echo "1. Go to https://dash.cloudflare.com/profile/api-tokens"
        echo "2. Create token with Zone:Read, DNS:Edit permissions for revivatech.co.uk"
        echo "3. Add to /etc/letsencrypt/cloudflare.ini:"
        echo "   dns_cloudflare_api_token = YOUR_API_TOKEN_HERE"
        echo "4. Run: chmod 600 /etc/letsencrypt/cloudflare.ini"
        echo ""
        return 1
    fi
    
    # Test if certificates already exist
    if [[ -f "/etc/letsencrypt/live/revivatech.co.uk/fullchain.pem" ]]; then
        success "Let's Encrypt certificates already exist"
        info "Certificate expires: $(openssl x509 -in /etc/letsencrypt/live/revivatech.co.uk/fullchain.pem -text -noout | grep "Not After" | cut -d: -f2-)"
        return 0
    fi
    
    info "Obtaining Let's Encrypt wildcard certificate..."
    
    # Obtain certificate with DNS challenge
    if certbot certonly \
        --dns-cloudflare \
        --dns-cloudflare-credentials /etc/letsencrypt/cloudflare.ini \
        -d "revivatech.co.uk" \
        -d "*.revivatech.co.uk" \
        --email admin@revivatech.co.uk \
        --agree-tos \
        --non-interactive; then
        
        success "Let's Encrypt certificate obtained successfully"
        
        # Setup auto-renewal
        info "Setting up auto-renewal..."
        (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
        
        success "Auto-renewal configured (daily check at 12:00)"
    else
        error "Failed to obtain Let's Encrypt certificate"
        warning "Please check your Cloudflare API token and DNS settings"
        return 1
    fi
}

# Test SSL certificates
test_certificates() {
    info "Testing SSL certificates..."
    
    # Test mkcert certificate
    if [[ -f "/opt/webapps/revivatech/frontend/certificates/localhost-trusted.pem" ]]; then
        if openssl x509 -in /opt/webapps/revivatech/frontend/certificates/localhost-trusted.pem -verify -noout; then
            success "Development certificate is valid"
        else
            error "Development certificate is invalid"
        fi
    else
        warning "Development certificate not found"
    fi
    
    # Test Let's Encrypt certificate
    if [[ -f "/etc/letsencrypt/live/revivatech.co.uk/fullchain.pem" ]]; then
        if openssl x509 -in /etc/letsencrypt/live/revivatech.co.uk/fullchain.pem -verify -noout; then
            success "Production certificate is valid"
        else
            error "Production certificate is invalid"
        fi
    else
        warning "Production certificate not found"
    fi
}

# Update permissions
fix_permissions() {
    info "Fixing certificate permissions..."
    
    # Fix mkcert certificate permissions
    if [[ -d "/opt/webapps/revivatech/frontend/certificates" ]]; then
        chmod -R 644 /opt/webapps/revivatech/frontend/certificates/*.pem 2>/dev/null || true
        chmod -R 600 /opt/webapps/revivatech/frontend/certificates/*key*.pem 2>/dev/null || true
        success "Development certificate permissions fixed"
    fi
    
    # Fix Let's Encrypt permissions (if running as root)
    if [[ $EUID -eq 0 ]] && [[ -d "/etc/letsencrypt/live" ]]; then
        chmod -R 755 /etc/letsencrypt/live/
        chmod -R 644 /etc/letsencrypt/live/*/fullchain.pem 2>/dev/null || true
        chmod -R 600 /etc/letsencrypt/live/*/privkey.pem 2>/dev/null || true
        success "Production certificate permissions fixed"
    fi
}

# Main execution
main() {
    check_root
    
    echo ""
    info "Setting up SSL certificates for RevivaTech..."
    echo ""
    
    # Always setup mkcert for development
    setup_mkcert
    echo ""
    
    # Setup Let's Encrypt if running as root
    setup_letsencrypt  
    echo ""
    
    # Fix permissions
    fix_permissions
    echo ""
    
    # Test certificates
    test_certificates
    echo ""
    
    success "SSL setup complete!"
    echo ""
    info "Next steps:"
    echo "1. Restart containers: docker-compose -f docker-compose.dev.yml restart"
    echo "2. Test HTTPS access:"
    echo "   - Local: https://localhost:3010"
    echo "   - Tailscale: https://100.122.130.67:3010"
    echo "   - Production: https://revivatech.co.uk"
    echo ""
}

# Run main function
main "$@"