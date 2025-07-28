#!/bin/bash

# RevivaTech SSL Certificate Management Script
# Manages SSL certificates, monitors expiry, and handles renewals

set -euo pipefail

# Configuration
DOMAINS=(
  "revivatech.co.uk"
  "www.revivatech.co.uk"
  "revivatech.com.br"
  "www.revivatech.com.br"
  "crm.revivatech.com.br"
  "crm.revivatech.co.uk"
)

CERT_DIR="/etc/ssl/certs/revivatech"
PRIVATE_KEY_DIR="/etc/ssl/private/revivatech"
BACKUP_DIR="/opt/webapps/revivatech/backups/ssl"
LOG_FILE="/var/log/revivatech-ssl.log"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging
timestamp() {
  date '+%Y-%m-%d %H:%M:%S'
}

log() {
  echo "$(timestamp) $1" | tee -a "$LOG_FILE"
}

# Create necessary directories
setup_directories() {
  local dirs=("$CERT_DIR" "$PRIVATE_KEY_DIR" "$BACKUP_DIR")
  
  for dir in "${dirs[@]}"; do
    if [[ ! -d "$dir" ]]; then
      echo "Creating directory: $dir"
      sudo mkdir -p "$dir"
      sudo chmod 755 "$dir"
    fi
  done
  
  # Set proper permissions for private key directory
  sudo chmod 700 "$PRIVATE_KEY_DIR"
}

# Check SSL certificate expiry
check_cert_expiry() {
  local domain=$1
  echo -e "${BLUE}🔒 Checking SSL certificate for $domain${NC}"
  
  if ! command -v openssl >/dev/null 2>&1; then
    echo -e "${RED}❌ OpenSSL not found${NC}"
    return 1
  fi
  
  # Use external IP to bypass local DNS issues
  local cloudflare_ip="104.21.64.1"
  local cert_info
  if cert_info=$(echo | timeout 10 openssl s_client -servername "$domain" -connect "$cloudflare_ip:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null); then
    local not_before not_after
    not_before=$(echo "$cert_info" | grep "notBefore" | cut -d= -f2)
    not_after=$(echo "$cert_info" | grep "notAfter" | cut -d= -f2)
    
    echo "Certificate valid from: $not_before"
    echo "Certificate expires: $not_after"
    
    # Calculate days until expiry
    local expiry_timestamp current_timestamp days_until_expiry
    if expiry_timestamp=$(date -d "$not_after" +%s 2>/dev/null); then
      current_timestamp=$(date +%s)
      days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
      
      if [[ $days_until_expiry -gt 30 ]]; then
        echo -e "${GREEN}✅ Certificate valid for $days_until_expiry days${NC}"
        log "INFO: SSL certificate for $domain valid for $days_until_expiry days"
      elif [[ $days_until_expiry -gt 7 ]]; then
        echo -e "${YELLOW}⚠️  Certificate expires in $days_until_expiry days${NC}"
        log "WARNING: SSL certificate for $domain expires in $days_until_expiry days"
      elif [[ $days_until_expiry -gt 0 ]]; then
        echo -e "${RED}🚨 Certificate expires in $days_until_expiry days!${NC}"
        log "CRITICAL: SSL certificate for $domain expires in $days_until_expiry days"
      else
        echo -e "${RED}❌ Certificate has expired!${NC}"
        log "CRITICAL: SSL certificate for $domain has expired"
      fi
      
      return "$days_until_expiry"
    else
      echo -e "${RED}❌ Could not parse certificate dates${NC}"
      return 1
    fi
  else
    echo -e "${RED}❌ Could not retrieve certificate for $domain${NC}"
    log "ERROR: Could not retrieve SSL certificate for $domain"
    return 1
  fi
}

# Get certificate details
get_cert_details() {
  local domain=$1
  echo -e "${BLUE}📋 Certificate details for $domain${NC}"
  
  # Use external IP to bypass local DNS issues
  local cloudflare_ip="104.21.64.1"
  if cert_data=$(echo | timeout 10 openssl s_client -servername "$domain" -connect "$cloudflare_ip:443" 2>/dev/null | openssl x509 -text -noout 2>/dev/null); then
    echo "Issuer:"
    echo "$cert_data" | grep "Issuer:" | sed 's/^        /  /'
    
    echo "Subject:"
    echo "$cert_data" | grep "Subject:" | sed 's/^        /  /'
    
    echo "Subject Alternative Names:"
    echo "$cert_data" | grep -A 1 "Subject Alternative Name:" | tail -1 | sed 's/^        /  /' || echo "  None"
    
    echo "Signature Algorithm:"
    echo "$cert_data" | grep "Signature Algorithm:" | head -1 | sed 's/^        /  /'
    
    echo "Public Key Algorithm:"
    echo "$cert_data" | grep "Public Key Algorithm:" | sed 's/^        /  /'
    
    echo "Key Size:"
    echo "$cert_data" | grep -E "(RSA Public-Key|Public-Key):" | sed 's/^        /  /'
  else
    echo -e "${RED}❌ Could not retrieve certificate details${NC}"
    return 1
  fi
}

# Test SSL configuration
test_ssl_config() {
  local domain=$1
  echo -e "${BLUE}🧪 Testing SSL configuration for $domain${NC}"
  
  # Test SSL Labs grade (if available)
  if command -v curl >/dev/null 2>&1; then
    echo "Testing SSL connection..."
    
    # Test TLS versions
    for version in "1.2" "1.3"; do
      if curl -I --tlsv$version --tls-max $version --connect-timeout 10 --max-time 30 "https://$domain" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ TLS $version supported${NC}"
      else
        echo -e "${YELLOW}⚠️  TLS $version not supported or failed${NC}"
      fi
    done
    
    # Test HTTP/2 support
    if curl -I --http2 --connect-timeout 10 --max-time 30 "https://$domain" 2>/dev/null | grep -q "HTTP/2"; then
      echo -e "${GREEN}✅ HTTP/2 supported${NC}"
    else
      echo -e "${YELLOW}⚠️  HTTP/2 not supported${NC}"
    fi
    
    # Test HSTS header
    if curl -I --connect-timeout 10 --max-time 30 "https://$domain" 2>/dev/null | grep -qi "strict-transport-security"; then
      echo -e "${GREEN}✅ HSTS header present${NC}"
    else
      echo -e "${YELLOW}⚠️  HSTS header missing${NC}"
    fi
  fi
}

# Backup SSL certificates
backup_certificates() {
  echo -e "${BLUE}💾 Backing up SSL certificates${NC}"
  
  local backup_file="$BACKUP_DIR/ssl-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
  
  if [[ -d "$CERT_DIR" || -d "$PRIVATE_KEY_DIR" ]]; then
    if sudo tar -czf "$backup_file" -C / "etc/ssl/certs/revivatech" "etc/ssl/private/revivatech" 2>/dev/null; then
      echo -e "${GREEN}✅ Certificates backed up to $backup_file${NC}"
      log "INFO: SSL certificates backed up to $backup_file"
      
      # Keep only last 10 backups
      local backup_count
      backup_count=$(ls -1 "$BACKUP_DIR"/ssl-backup-*.tar.gz 2>/dev/null | wc -l)
      if [[ $backup_count -gt 10 ]]; then
        echo "Cleaning up old backups..."
        ls -1t "$BACKUP_DIR"/ssl-backup-*.tar.gz | tail -n +11 | xargs rm -f
      fi
    else
      echo -e "${RED}❌ Failed to backup certificates${NC}"
      return 1
    fi
  else
    echo -e "${YELLOW}⚠️  No certificate directories found to backup${NC}"
  fi
}

# Monitor all domains
monitor_all_domains() {
  echo -e "${GREEN}🚀 Monitoring SSL certificates for all domains${NC}"
  echo "============================================"
  
  local critical_count=0
  local warning_count=0
  
  for domain in "${DOMAINS[@]}"; do
    echo -e "\n--- $domain ---"
    
    if days_left=$(check_cert_expiry "$domain"); then
      if [[ $days_left -lt 7 ]]; then
        ((critical_count++))
      elif [[ $days_left -lt 30 ]]; then
        ((warning_count++))
      fi
    else
      ((critical_count++))
    fi
  done
  
  echo -e "\n${YELLOW}📊 SUMMARY${NC}"
  echo "Critical (expires in <7 days): $critical_count"
  echo "Warning (expires in <30 days): $warning_count"
  echo "Total domains monitored: ${#DOMAINS[@]}"
  
  if [[ $critical_count -gt 0 ]]; then
    echo -e "${RED}🚨 $critical_count domains require immediate attention!${NC}"
    log "CRITICAL: $critical_count SSL certificates require immediate attention"
    return 1
  elif [[ $warning_count -gt 0 ]]; then
    echo -e "${YELLOW}⚠️  $warning_count domains need attention soon${NC}"
    log "WARNING: $warning_count SSL certificates need attention soon"
    return 2
  else
    echo -e "${GREEN}✅ All SSL certificates are healthy${NC}"
    log "INFO: All SSL certificates are healthy"
    return 0
  fi
}

# Generate SSL monitoring report
generate_ssl_report() {
  local report_file="/tmp/revivatech-ssl-report-$(date +%Y%m%d-%H%M%S).txt"
  
  echo "RevivaTech SSL Certificate Monitoring Report" > "$report_file"
  echo "Generated: $(timestamp)" >> "$report_file"
  echo "============================================" >> "$report_file"
  echo "" >> "$report_file"
  
  for domain in "${DOMAINS[@]}"; do
    echo "=== $domain ===" >> "$report_file"
    {
      check_cert_expiry "$domain"
      echo ""
      get_cert_details "$domain"
      echo ""
      test_ssl_config "$domain"
      echo ""
    } >> "$report_file" 2>&1
  done
  
  echo -e "${GREEN}📄 SSL report generated: $report_file${NC}"
  return "$report_file"
}

# Setup SSL monitoring cron job
setup_monitoring_cron() {
  echo -e "${BLUE}⏰ Setting up SSL monitoring cron job${NC}"
  
  local cron_script="/opt/webapps/revivatech/scripts/ssl-daily-check.sh"
  
  # Create daily monitoring script
  cat > "$cron_script" << 'EOF'
#!/bin/bash
# Daily SSL monitoring for RevivaTech
cd /opt/webapps/revivatech/scripts
./ssl-management.sh --monitor --quiet
EOF
  
  chmod +x "$cron_script"
  
  # Add to crontab (run daily at 6 AM)
  local cron_line="0 6 * * * /opt/webapps/revivatech/scripts/ssl-daily-check.sh"
  
  if ! crontab -l 2>/dev/null | grep -q "ssl-daily-check.sh"; then
    (crontab -l 2>/dev/null; echo "$cron_line") | crontab -
    echo -e "${GREEN}✅ SSL monitoring cron job added${NC}"
    log "INFO: SSL monitoring cron job configured"
  else
    echo -e "${YELLOW}⚠️  SSL monitoring cron job already exists${NC}"
  fi
}

# Show help
show_help() {
  cat << EOF
RevivaTech SSL Certificate Management Script

Usage: $0 [OPTIONS]

OPTIONS:
  -h, --help              Show this help message
  -m, --monitor           Monitor all domain certificates
  -d, --domain DOMAIN     Check specific domain
  -c, --details DOMAIN    Get detailed certificate info
  -t, --test DOMAIN       Test SSL configuration
  -b, --backup            Backup SSL certificates
  -r, --report            Generate detailed SSL report
  -s, --setup             Setup monitoring directories
  --cron                  Setup daily monitoring cron job
  -q, --quiet             Quiet mode (minimal output)

Examples:
  $0 --monitor                          # Monitor all domains
  $0 --domain revivatech.co.uk         # Check specific domain
  $0 --details revivatech.co.uk        # Get certificate details
  $0 --test revivatech.co.uk           # Test SSL configuration
  $0 --backup                          # Backup certificates
  $0 --report                          # Generate report
  $0 --setup --cron                    # Setup monitoring

EOF
}

# Parse command line arguments
QUIET=false

while [[ $# -gt 0 ]]; do
  case $1 in
    -h|--help)
      show_help
      exit 0
      ;;
    -m|--monitor)
      monitor_all_domains
      exit $?
      ;;
    -d|--domain)
      if [[ -n "${2:-}" ]]; then
        check_cert_expiry "$2"
        exit $?
      else
        echo "Error: --domain requires a domain name"
        exit 1
      fi
      ;;
    -c|--details)
      if [[ -n "${2:-}" ]]; then
        get_cert_details "$2"
        exit $?
      else
        echo "Error: --details requires a domain name"
        exit 1
      fi
      ;;
    -t|--test)
      if [[ -n "${2:-}" ]]; then
        test_ssl_config "$2"
        exit $?
      else
        echo "Error: --test requires a domain name"
        exit 1
      fi
      ;;
    -b|--backup)
      setup_directories
      backup_certificates
      exit $?
      ;;
    -r|--report)
      generate_ssl_report
      exit $?
      ;;
    -s|--setup)
      setup_directories
      echo -e "${GREEN}✅ SSL directories setup complete${NC}"
      exit 0
      ;;
    --cron)
      setup_monitoring_cron
      exit $?
      ;;
    -q|--quiet)
      QUIET=true
      ;;
    *)
      echo "Unknown option: $1"
      show_help
      exit 1
      ;;
  esac
  shift
done

# Default action if no arguments
if [[ $QUIET == true ]]; then
  monitor_all_domains >/dev/null 2>&1
  exit $?
else
  echo -e "${GREEN}🔒 RevivaTech SSL Certificate Management${NC}"
  echo "Use --help for available options"
  echo ""
  monitor_all_domains
fi