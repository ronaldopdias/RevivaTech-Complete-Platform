#!/bin/bash

# Full Cloudflare Settings Audit Script
# Requires API token with full Zone permissions
# Provides detailed analysis and recommendations

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}🔍 COMPREHENSIVE CLOUDFLARE SETTINGS AUDIT${NC}"
echo -e "${BLUE}==============================================${NC}\n"

# Configuration
API_TOKEN="${CLOUDFLARE_API_TOKEN:-$1}"
ACCOUNT_ID="393107996abab7da2c2e393b2e668235"
DOMAIN="revivatech.co.uk"
ZONE_ID="d7e8be68d4be89b94953dc300cea18d4"
TUNNEL_ID="89792b6f-6990-4591-a529-8982596a2eaf"

if [ -z "$API_TOKEN" ]; then
    echo -e "${RED}❌ Please provide API token with full permissions:${NC}"
    echo "Usage: CLOUDFLARE_API_TOKEN=your_token ./full-cloudflare-settings-audit.sh"
    echo "   or: ./full-cloudflare-settings-audit.sh your_token"
    echo ""
    echo -e "${YELLOW}💡 Need a token? Run: cat generate-api-token-guide.md${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Audit Configuration:${NC}"
echo "   Domain: $DOMAIN"
echo "   Zone ID: $ZONE_ID"
echo "   Account ID: $ACCOUNT_ID"
echo "   Tunnel ID: $TUNNEL_ID"
echo "   API Token: ${API_TOKEN:0:10}..."
echo ""

# Create comprehensive report
timestamp=$(date +%Y%m%d_%H%M%S)
report_file="/tmp/cloudflare_full_audit_${timestamp}.json"
html_report="/tmp/cloudflare_audit_${timestamp}.html"

# Function to make API calls with comprehensive error handling
api_call() {
    local method="$1"
    local endpoint="$2"
    local data="$3"
    local description="$4"
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "%{http_code}" -X "$method" \
            -H "Authorization: Bearer $API_TOKEN" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "https://api.cloudflare.com/client/v4$endpoint" 2>/dev/null)
    else
        response=$(curl -s -w "%{http_code}" -X "$method" \
            -H "Authorization: Bearer $API_TOKEN" \
            -H "Content-Type: application/json" \
            "https://api.cloudflare.com/client/v4$endpoint" 2>/dev/null)
    fi
    
    http_code="${response: -3}"
    json_response="${response%???}"
    
    if [ "$http_code" = "200" ]; then
        echo "$json_response"
        return 0
    else
        echo "{\"error\": \"HTTP $http_code\", \"message\": \"$json_response\"}"
        return 1
    fi
}

# Function to extract setting value
get_setting_value() {
    local json="$1"
    local setting="$2"
    echo "$json" | grep -o "\"$setting\":{[^}]*}" | grep -o '"value":"[^"]*"' | cut -d'"' -f4
}

# Function to check if setting is optimal
check_setting_optimal() {
    local setting="$1"
    local value="$2"
    local optimal="$3"
    
    if [ "$value" = "$optimal" ]; then
        echo -e "${GREEN}   ✅ $setting: $value (Optimal)${NC}"
        return 0
    else
        echo -e "${YELLOW}   ⚠️  $setting: $value (Recommended: $optimal)${NC}"
        return 1
    fi
}

# Start comprehensive audit
echo -e "${PURPLE}🔍 STARTING COMPREHENSIVE AUDIT...${NC}\n"

# Initialize JSON report
cat > "$report_file" << EOF
{
  "domain": "$DOMAIN",
  "zone_id": "$ZONE_ID",
  "audit_timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "audit_type": "comprehensive",
  "recommendations": [],
  "security_score": 0,
  "performance_score": 0,
  "results": {
EOF

# 1. Zone Information
echo -e "${BLUE}1️⃣ ZONE INFORMATION${NC}"
echo "===================="
zone_info=$(api_call "GET" "/zones/$ZONE_ID" "" "Zone Information")
if echo "$zone_info" | grep -q '"success":true'; then
    zone_status=$(echo "$zone_info" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    zone_plan=$(echo "$zone_info" | grep -o '"plan":{"[^}]*"name":"[^"]*"' | cut -d'"' -f6)
    echo -e "${GREEN}   Status: $zone_status${NC}"
    echo -e "${GREEN}   Plan: $zone_plan${NC}"
    
    cat >> "$report_file" << EOF
    "zone_info": {
      "status": "$zone_status",
      "plan": "$zone_plan"
    },
EOF
else
    echo -e "${RED}   ❌ Failed to get zone information${NC}"
fi

# 2. DNS Records Analysis
echo -e "\n${BLUE}2️⃣ DNS RECORDS ANALYSIS${NC}"
echo "========================="
dns_records=$(api_call "GET" "/zones/$ZONE_ID/dns_records" "" "DNS Records")
if echo "$dns_records" | grep -q '"success":true'; then
    echo -e "${GREEN}   DNS Records:${NC}"
    
    # Count record types
    a_count=$(echo "$dns_records" | grep -o '"type":"A"' | wc -l)
    cname_count=$(echo "$dns_records" | grep -o '"type":"CNAME"' | wc -l)
    mx_count=$(echo "$dns_records" | grep -o '"type":"MX"' | wc -l)
    txt_count=$(echo "$dns_records" | grep -o '"type":"TXT"' | wc -l)
    
    echo -e "${CYAN}   • A Records: $a_count${NC}"
    echo -e "${CYAN}   • CNAME Records: $cname_count${NC}"
    echo -e "${CYAN}   • MX Records: $mx_count${NC}"
    echo -e "${CYAN}   • TXT Records: $txt_count${NC}"
    
    # Check for security records
    if echo "$dns_records" | grep -q '"name":"_dmarc'; then
        echo -e "${GREEN}   ✅ DMARC record found${NC}"
    else
        echo -e "${YELLOW}   ⚠️  No DMARC record found${NC}"
    fi
    
    cat >> "$report_file" << EOF
    "dns_analysis": {
      "record_counts": {
        "A": $a_count,
        "CNAME": $cname_count,
        "MX": $mx_count,
        "TXT": $txt_count
      }
    },
EOF
fi

# 3. SSL/TLS Settings
echo -e "\n${BLUE}3️⃣ SSL/TLS CONFIGURATION${NC}"
echo "=========================="
ssl_settings=$(api_call "GET" "/zones/$ZONE_ID/settings/ssl" "" "SSL Setting")
if echo "$ssl_settings" | grep -q '"success":true'; then
    ssl_mode=$(get_setting_value "$ssl_settings" "ssl")
    check_setting_optimal "SSL Mode" "$ssl_mode" "full"
    
    # Check additional SSL settings
    settings_to_check=(
        "always_use_https:on"
        "ssl_recommender:on"
        "tls_1_3:on"
        "automatic_https_rewrites:on"
        "min_tls_version:1.2"
    )
    
    for setting_check in "${settings_to_check[@]}"; do
        setting_name=$(echo "$setting_check" | cut -d':' -f1)
        optimal_value=$(echo "$setting_check" | cut -d':' -f2)
        
        setting_response=$(api_call "GET" "/zones/$ZONE_ID/settings/$setting_name" "" "$setting_name")
        if echo "$setting_response" | grep -q '"success":true'; then
            current_value=$(get_setting_value "$setting_response" "$setting_name")
            check_setting_optimal "$setting_name" "$current_value" "$optimal_value"
        fi
    done
    
    cat >> "$report_file" << EOF
    "ssl_settings": {
      "ssl_mode": "$ssl_mode"
    },
EOF
fi

# 4. Security Settings
echo -e "\n${BLUE}4️⃣ SECURITY CONFIGURATION${NC}"
echo "=========================="
security_settings=(
    "security_level:high"
    "challenge_ttl:1800"
    "browser_check:on"
    "hotlink_protection:on"
    "ip_geolocation:on"
    "email_obfuscation:on"
    "server_side_exclude:on"
)

security_score=0
total_security_checks=0

for setting_check in "${security_settings[@]}"; do
    setting_name=$(echo "$setting_check" | cut -d':' -f1)
    optimal_value=$(echo "$setting_check" | cut -d':' -f2)
    
    setting_response=$(api_call "GET" "/zones/$ZONE_ID/settings/$setting_name" "" "$setting_name")
    if echo "$setting_response" | grep -q '"success":true'; then
        current_value=$(get_setting_value "$setting_response" "$setting_name")
        if check_setting_optimal "$setting_name" "$current_value" "$optimal_value"; then
            security_score=$((security_score + 1))
        fi
        total_security_checks=$((total_security_checks + 1))
    fi
done

security_percentage=$((security_score * 100 / total_security_checks))
echo -e "\n${PURPLE}   Security Score: $security_score/$total_security_checks ($security_percentage%)${NC}"

# 5. Performance Settings
echo -e "\n${BLUE}5️⃣ PERFORMANCE CONFIGURATION${NC}"
echo "============================="
performance_settings=(
    "cache_level:aggressive"
    "browser_cache_ttl:31536000"
    "edge_cache_ttl:7200"
    "development_mode:off"
    "minify:on"
    "rocket_loader:on"
    "mirage:on"
    "polish:lossless"
)

performance_score=0
total_performance_checks=0

for setting_check in "${performance_settings[@]}"; do
    setting_name=$(echo "$setting_check" | cut -d':' -f1)
    optimal_value=$(echo "$setting_check" | cut -d':' -f2)
    
    setting_response=$(api_call "GET" "/zones/$ZONE_ID/settings/$setting_name" "" "$setting_name")
    if echo "$setting_response" | grep -q '"success":true'; then
        current_value=$(get_setting_value "$setting_response" "$setting_name")
        if check_setting_optimal "$setting_name" "$current_value" "$optimal_value"; then
            performance_score=$((performance_score + 1))
        fi
        total_performance_checks=$((total_performance_checks + 1))
    fi
done

performance_percentage=$((performance_score * 100 / total_performance_checks))
echo -e "\n${PURPLE}   Performance Score: $performance_score/$total_performance_checks ($performance_percentage%)${NC}"

# 6. Page Rules
echo -e "\n${BLUE}6️⃣ PAGE RULES${NC}"
echo "==============="
page_rules=$(api_call "GET" "/zones/$ZONE_ID/pagerules" "" "Page Rules")
if echo "$page_rules" | grep -q '"success":true'; then
    rule_count=$(echo "$page_rules" | grep -o '"id":"[^"]*"' | wc -l)
    echo -e "${GREEN}   Page Rules: $rule_count configured${NC}"
    
    if [ "$rule_count" -gt 0 ]; then
        echo -e "${CYAN}   Rules configured for performance optimization${NC}"
    else
        echo -e "${YELLOW}   ⚠️  No page rules configured - consider adding for better performance${NC}"
    fi
    
    cat >> "$report_file" << EOF
    "page_rules": {
      "count": $rule_count
    },
EOF
fi

# 7. Firewall Rules
echo -e "\n${BLUE}7️⃣ FIREWALL CONFIGURATION${NC}"
echo "=========================="
firewall_rules=$(api_call "GET" "/zones/$ZONE_ID/firewall/rules" "" "Firewall Rules")
if echo "$firewall_rules" | grep -q '"success":true'; then
    firewall_count=$(echo "$firewall_rules" | grep -o '"id":"[^"]*"' | wc -l)
    echo -e "${GREEN}   Firewall Rules: $firewall_count configured${NC}"
    
    cat >> "$report_file" << EOF
    "firewall_rules": {
      "count": $firewall_count
    },
EOF
fi

# 8. Analytics Summary
echo -e "\n${BLUE}8️⃣ ANALYTICS OVERVIEW${NC}"
echo "======================"
analytics=$(api_call "GET" "/zones/$ZONE_ID/analytics/dashboard?since=-168h" "" "Analytics")
if echo "$analytics" | grep -q '"success":true'; then
    echo -e "${GREEN}   Analytics data accessible${NC}"
    echo -e "${CYAN}   Showing last 7 days of data${NC}"
    
    cat >> "$report_file" << EOF
    "analytics": {
      "accessible": true,
      "period": "7_days"
    }
EOF
fi

# Close JSON report
cat >> "$report_file" << EOF
  },
  "scores": {
    "security": $security_percentage,
    "performance": $performance_percentage,
    "overall": $(( (security_percentage + performance_percentage) / 2 ))
  }
}
EOF

# Generate HTML Report
cat > "$html_report" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Cloudflare Audit Report - $DOMAIN</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f4f4f4; padding: 20px; border-radius: 5px; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .score { font-size: 24px; font-weight: bold; }
        .good { color: #28a745; }
        .warning { color: #ffc107; }
        .error { color: #dc3545; }
        .info { color: #17a2b8; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔍 Cloudflare Audit Report</h1>
        <p><strong>Domain:</strong> $DOMAIN</p>
        <p><strong>Date:</strong> $(date)</p>
        <p><strong>Zone ID:</strong> $ZONE_ID</p>
    </div>
    
    <div class="section">
        <h2>📊 Overall Scores</h2>
        <p class="score">Security: <span class="$([ $security_percentage -ge 80 ] && echo "good" || echo "warning")">$security_percentage%</span></p>
        <p class="score">Performance: <span class="$([ $performance_percentage -ge 80 ] && echo "good" || echo "warning")">$performance_percentage%</span></p>
        <p class="score">Overall: <span class="$([ $(( (security_percentage + performance_percentage) / 2 )) -ge 80 ] && echo "good" || echo "warning")">$(( (security_percentage + performance_percentage) / 2 ))%</span></p>
    </div>
    
    <div class="section">
        <h2>🔍 Detailed Analysis</h2>
        <p>For detailed technical analysis, see the JSON report: <code>$report_file</code></p>
    </div>
</body>
</html>
EOF

# Final Summary
echo -e "\n${PURPLE}📊 COMPREHENSIVE AUDIT SUMMARY${NC}"
echo -e "${PURPLE}================================${NC}"
echo -e "${GREEN}✅ Audit completed successfully!${NC}"
echo -e "${BLUE}   Security Score: $security_percentage%${NC}"
echo -e "${BLUE}   Performance Score: $performance_percentage%${NC}"
echo -e "${BLUE}   Overall Score: $(( (security_percentage + performance_percentage) / 2 ))%${NC}"
echo ""
echo -e "${YELLOW}📋 Reports Generated:${NC}"
echo -e "${CYAN}   JSON Report: $report_file${NC}"
echo -e "${CYAN}   HTML Report: $html_report${NC}"
echo ""

# Recommendations
echo -e "${YELLOW}🎯 KEY RECOMMENDATIONS:${NC}"
if [ $security_percentage -lt 80 ]; then
    echo -e "${RED}   • Improve security settings (currently $security_percentage%)${NC}"
fi
if [ $performance_percentage -lt 80 ]; then
    echo -e "${RED}   • Optimize performance settings (currently $performance_percentage%)${NC}"
fi
echo -e "${GREEN}   • Review detailed JSON report for specific recommendations${NC}"
echo -e "${GREEN}   • Monitor analytics for traffic patterns${NC}"
echo -e "${GREEN}   • Consider upgrading to Pro plan for additional features${NC}"

echo -e "\n${GREEN}✅ Full audit completed! Review the reports for detailed analysis.${NC}"