#!/bin/bash

# RevivaTech Domain & SSL Monitoring Script
# Monitors domain accessibility, SSL certificate status, and service health

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

SERVICES=(
  "http://localhost:3010,RevivaTech Frontend (EN)"
  "http://localhost:3011,RevivaTech Backend API"
  "http://localhost:3000,Website Frontend (PT)"
  "http://localhost:5000,Website Backend"
  "http://localhost:3001,CRM Frontend"
  "http://localhost:5001,CRM Backend"
)

CLOUDFLARE_IPS=(
  "104.21.64.1"
  "172.67.74.226"
  "104.21.65.1"
)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging
LOG_FILE="/var/log/revivatech-monitor.log"
timestamp() {
  date '+%Y-%m-%d %H:%M:%S'
}

log() {
  echo "$(timestamp) $1" | tee -a "$LOG_FILE"
}

# Check if command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check SSL certificate
check_ssl_cert() {
  local domain=$1
  echo -e "${BLUE}🔒 Checking SSL certificate for $domain${NC}"
  
  if command_exists openssl; then
    local cert_info
    cert_info=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
    
    if [[ -n "$cert_info" ]]; then
      local not_after
      not_after=$(echo "$cert_info" | grep "notAfter" | cut -d= -f2)
      local expiry_date
      expiry_date=$(date -d "$not_after" +%s 2>/dev/null || echo "0")
      local current_date
      current_date=$(date +%s)
      local days_until_expiry
      days_until_expiry=$(( (expiry_date - current_date) / 86400 ))
      
      if [[ $days_until_expiry -gt 30 ]]; then
        echo -e "${GREEN}✅ SSL certificate valid for $days_until_expiry days${NC}"
      elif [[ $days_until_expiry -gt 7 ]]; then
        echo -e "${YELLOW}⚠️  SSL certificate expires in $days_until_expiry days${NC}"
        log "WARNING: SSL certificate for $domain expires in $days_until_expiry days"
      else
        echo -e "${RED}❌ SSL certificate expires in $days_until_expiry days!${NC}"
        log "CRITICAL: SSL certificate for $domain expires in $days_until_expiry days"
      fi
    else
      echo -e "${RED}❌ Could not retrieve SSL certificate${NC}"
    fi
  else
    echo -e "${YELLOW}⚠️  OpenSSL not available for SSL check${NC}"
  fi
}

# Check domain accessibility
check_domain_access() {
  local domain=$1
  echo -e "${BLUE}🌐 Checking domain accessibility: $domain${NC}"
  
  # Test with multiple Cloudflare IPs
  for ip in "${CLOUDFLARE_IPS[@]}"; do
    echo "Testing with IP: $ip"
    
    if curl -I --connect-timeout 10 --max-time 30 --resolve "$domain:443:$ip" "https://$domain" >/dev/null 2>&1; then
      echo -e "${GREEN}✅ $domain accessible via $ip${NC}"
      
      # Get response details
      local response
      response=$(curl -I --connect-timeout 10 --max-time 30 --resolve "$domain:443:$ip" "https://$domain" 2>/dev/null | head -1)
      echo "Response: $response"
      
      # Check SSL
      check_ssl_cert "$domain"
      return 0
    else
      echo -e "${RED}❌ $domain not accessible via $ip${NC}"
    fi
  done
  
  log "ERROR: Domain $domain not accessible from any Cloudflare IP"
  return 1
}

# Check local service health
check_service_health() {
  local service_url=$1
  local service_name=$2
  echo -e "${BLUE}🔧 Checking service: $service_name${NC}"
  
  if curl -I --connect-timeout 5 --max-time 10 "$service_url" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ $service_name is healthy${NC}"
    
    # Try to get health endpoint if available
    local health_url="${service_url%/}/health"
    if curl -s --connect-timeout 5 --max-time 10 "$health_url" >/dev/null 2>&1; then
      local health_status
      health_status=$(curl -s --connect-timeout 5 --max-time 10 "$health_url" | jq -r '.status' 2>/dev/null || echo "unknown")
      echo "Health status: $health_status"
    fi
  else
    echo -e "${RED}❌ $service_name is not responding${NC}"
    log "ERROR: Service $service_name ($service_url) is not responding"
    return 1
  fi
}

# Check Cloudflare tunnel status
check_tunnel_status() {
  echo -e "${BLUE}🚇 Checking Cloudflare tunnel status${NC}"
  
  if systemctl is-active --quiet cloudflared; then
    echo -e "${GREEN}✅ Cloudflare tunnel is running${NC}"
    
    # Get tunnel info
    local tunnel_status
    tunnel_status=$(systemctl status cloudflared --no-pager -l | grep -E "(Active|Main PID)" | head -2)
    echo "$tunnel_status"
    
    # Check for recent errors
    local recent_errors
    recent_errors=$(journalctl -u cloudflared --since "1 hour ago" --grep "ERR" --no-pager -q | wc -l)
    if [[ $recent_errors -gt 0 ]]; then
      echo -e "${YELLOW}⚠️  $recent_errors errors in the last hour${NC}"
      echo "Recent errors:"
      journalctl -u cloudflared --since "1 hour ago" --grep "ERR" --no-pager -q | tail -3
    fi
  else
    echo -e "${RED}❌ Cloudflare tunnel is not running${NC}"
    log "ERROR: Cloudflare tunnel service is not active"
    return 1
  fi
}

# Check Docker containers
check_docker_containers() {
  echo -e "${BLUE}🐳 Checking Docker containers${NC}"
  
  if command_exists docker; then
    echo "RevivaTech containers:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(revivatech|website|crm)" || echo "No containers found"
    
    # Check for unhealthy containers
    local unhealthy
    unhealthy=$(docker ps --format "{{.Names}}\t{{.Status}}" | grep -E "(revivatech|website|crm)" | grep -v "healthy" | wc -l)
    if [[ $unhealthy -gt 0 ]]; then
      echo -e "${YELLOW}⚠️  $unhealthy containers are not healthy${NC}"
    fi
  else
    echo -e "${YELLOW}⚠️  Docker not available${NC}"
  fi
}

# Generate monitoring report
generate_report() {
  local report_file="/tmp/revivatech-monitoring-report-$(date +%Y%m%d-%H%M%S).txt"
  
  echo "RevivaTech Infrastructure Monitoring Report" > "$report_file"
  echo "Generated: $(timestamp)" >> "$report_file"
  echo "============================================" >> "$report_file"
  echo "" >> "$report_file"
  
  # Run all checks and capture output
  {
    echo "=== Domain & SSL Status ==="
    for domain in "${DOMAINS[@]}"; do
      echo "--- $domain ---"
      check_domain_access "$domain" 2>&1
      echo ""
    done
    
    echo "=== Service Health ==="
    while IFS=',' read -r url name; do
      echo "--- $name ---"
      check_service_health "$url" "$name" 2>&1
      echo ""
    done <<< "$(printf '%s\n' "${SERVICES[@]}")"
    
    echo "=== Infrastructure Status ==="
    check_tunnel_status 2>&1
    echo ""
    check_docker_containers 2>&1
    
  } >> "$report_file"
  
  echo -e "${GREEN}📄 Report generated: $report_file${NC}"
  return "$report_file"
}

# Send alert (placeholder for notification system)
send_alert() {
  local message=$1
  local severity=${2:-"warning"}
  
  log "ALERT [$severity]: $message"
  
  # TODO: Integrate with notification systems:
  # - Email notifications
  # - Slack/Discord webhooks
  # - SMS alerts
  # - PagerDuty integration
  
  echo -e "${RED}🚨 ALERT [$severity]: $message${NC}"
}

# Main monitoring function
main_monitor() {
  echo -e "${GREEN}🚀 Starting RevivaTech Infrastructure Monitoring${NC}"
  echo "Timestamp: $(timestamp)"
  echo "============================================"
  
  local errors=0
  
  # Check domains
  echo -e "\n${YELLOW}📡 DOMAIN & SSL CHECKS${NC}"
  for domain in "${DOMAINS[@]}"; do
    if ! check_domain_access "$domain"; then
      ((errors++))
      send_alert "Domain $domain is not accessible" "critical"
    fi
    echo ""
  done
  
  # Check services
  echo -e "\n${YELLOW}🔧 SERVICE HEALTH CHECKS${NC}"
  while IFS=',' read -r url name; do
    if ! check_service_health "$url" "$name"; then
      ((errors++))
      send_alert "Service $name is not responding" "critical"
    fi
    echo ""
  done <<< "$(printf '%s\n' "${SERVICES[@]}")"
  
  # Check infrastructure
  echo -e "\n${YELLOW}🏗️ INFRASTRUCTURE CHECKS${NC}"
  if ! check_tunnel_status; then
    ((errors++))
    send_alert "Cloudflare tunnel is not running" "critical"
  fi
  echo ""
  
  check_docker_containers
  echo ""
  
  # Summary
  echo -e "\n${YELLOW}📊 MONITORING SUMMARY${NC}"
  if [[ $errors -eq 0 ]]; then
    echo -e "${GREEN}✅ All systems operational ($errors errors)${NC}"
    log "INFO: Monitoring completed successfully - all systems operational"
  else
    echo -e "${RED}❌ $errors issues detected${NC}"
    log "WARNING: Monitoring completed with $errors issues"
    send_alert "$errors issues detected in infrastructure monitoring" "warning"
  fi
  
  return $errors
}

# Help function
show_help() {
  cat << EOF
RevivaTech Domain & SSL Monitoring Script

Usage: $0 [OPTIONS]

OPTIONS:
  -h, --help        Show this help message
  -r, --report      Generate detailed monitoring report
  -q, --quiet       Quiet mode (minimal output)
  -d, --domain      Check specific domain only
  -s, --service     Check specific service only
  --ssl-only        Check SSL certificates only
  --tunnel-only     Check Cloudflare tunnel only
  --docker-only     Check Docker containers only

Examples:
  $0                                    # Full monitoring
  $0 --domain revivatech.co.uk        # Check specific domain
  $0 --report                          # Generate report
  $0 --ssl-only                        # SSL certificates only

EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -h|--help)
      show_help
      exit 0
      ;;
    -r|--report)
      generate_report
      exit 0
      ;;
    -d|--domain)
      if [[ -n "${2:-}" ]]; then
        check_domain_access "$2"
        exit $?
      else
        echo "Error: --domain requires a domain name"
        exit 1
      fi
      ;;
    --ssl-only)
      for domain in "${DOMAINS[@]}"; do
        check_ssl_cert "$domain"
      done
      exit 0
      ;;
    --tunnel-only)
      check_tunnel_status
      exit $?
      ;;
    --docker-only)
      check_docker_containers
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      show_help
      exit 1
      ;;
  esac
  shift
done

# Run main monitoring if no specific options
main_monitor
exit $?