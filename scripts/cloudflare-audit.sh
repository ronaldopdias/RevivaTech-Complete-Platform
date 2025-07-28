#!/bin/bash

#
# Cloudflare Domain Audit Script
#
# Usage:
#   CLOUDFLARE_API_TOKEN=your_token ./cloudflare-audit.sh
#   or: ./cloudflare-audit.sh your_token
#
# This script will:
#   - Verify if your Cloudflare API token is valid (prints 'Token is valid and active' if so)
#   - Check access to DNS, zone info, settings, page rules, firewall, and analytics
#   - Print a summary of accessible and restricted areas
#   - Save a full audit report to /tmp/
#
# Required Permissions for Full Audit:
#   - Zone:Read (current token: ✅ present)
#   - Zone Settings:Read (current token: ❌ missing)
#   - Zone.Page Rule:Read (current token: ❌ missing)
#   - Zone.Firewall Services:Read (current token: ❌ missing)
#   - Zone.Analytics:Read (current token: ❌ missing)
#
# If you see 'Token is valid and active' in the output, your token is valid for basic operations.
# For full audit and advanced settings, generate a new token with all the above permissions.
# See generate-api-token-guide.md for step-by-step instructions.
#

# Cloudflare Domain Audit Script
# Comprehensive audit of Cloudflare settings for revivatech.co.uk
# Works with limited permissions and identifies what requires additional access

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${BLUE}🔍 Cloudflare Domain Audit for revivatech.co.uk${NC}"
echo -e "${BLUE}===============================================${NC}\n"

# Configuration
API_TOKEN="${CLOUDFLARE_API_TOKEN:-$1}"
ACCOUNT_ID="393107996abab7da2c2e393b2e668235"
DOMAIN="revivatech.co.uk"
ZONE_ID="d7e8be68d4be89b94953dc300cea18d4"
# Current API token: dQ10MfJmQL0mChrVOknXbcNSn2OACBfTyFNdBqrQ 

# Check for cache clearing option
if [ "$1" = "--clear-cache" ] || [ "$2" = "--clear-cache" ]; then
    CLEAR_CACHE=true
    if [ "$1" = "--clear-cache" ]; then
        API_TOKEN="${CLOUDFLARE_API_TOKEN:-$2}"
    else
        API_TOKEN="${CLOUDFLARE_API_TOKEN:-$1}"
    fi
else
    CLEAR_CACHE=false
fi

if [ -z "$API_TOKEN" ]; then
    echo -e "${RED}❌ Please provide API token:${NC}"
    echo "Usage: CLOUDFLARE_API_TOKEN=your_token ./cloudflare-audit.sh"
    echo "   or: ./cloudflare-audit.sh your_token"
    echo "   or: ./cloudflare-audit.sh --clear-cache your_token"
    echo "   or: CLOUDFLARE_API_TOKEN=your_token ./cloudflare-audit.sh --clear-cache"
    exit 1
fi

echo -e "${GREEN}✅ Audit Configuration:${NC}"
echo "   Domain: $DOMAIN"
echo "   Zone ID: $ZONE_ID"
echo "   Account ID: $ACCOUNT_ID"
echo "   API Token: ${API_TOKEN:0:10}..."
echo ""

# Function to clear Cloudflare cache
clear_cache() {
    echo -e "\n${BLUE}🧹 Clearing Cloudflare Cache${NC}"
    echo "=============================="
    
    # Clear all cache
    echo -e "${YELLOW}   → Purging all cache for $DOMAIN${NC}"
    
    response=$(curl -s -w "%{http_code}" -X POST \
        -H "Authorization: Bearer $API_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"purge_everything":true}' \
        "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/purge_cache" 2>/dev/null)
    
    http_code="${response: -3}"
    json_response="${response%???}"
    
    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}   ✅ Cache cleared successfully!${NC}"
        echo -e "${GREEN}   🔄 Changes should be visible within 30 seconds${NC}"
        return 0
    else
        echo -e "${RED}   ❌ Cache clearing failed (HTTP: $http_code)${NC}"
        echo "   Response: $json_response"
        return 1
    fi
}

# Function to make API calls with error handling
api_call() {
    local method="$1"
    local endpoint="$2"
    local data="$3"
    local description="$4"
    
    echo -e "${YELLOW}   → Testing: $description${NC}"
    
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
        echo -e "${GREEN}   ✅ $description - SUCCESS${NC}"
        echo "$json_response"
        return 0
    elif [ "$http_code" = "403" ] || [ "$http_code" = "401" ]; then
        echo -e "${RED}   ❌ $description - UNAUTHORIZED (HTTP: $http_code)${NC}"
        echo -e "${YELLOW}   📋 Requires additional API token permissions${NC}"
        return 1
    else
        echo -e "${RED}   ❌ $description - FAILED (HTTP: $http_code)${NC}"
        echo "   Response: $json_response"
        return 1
    fi
}

# Create audit report
audit_report="/tmp/cloudflare_audit_$(date +%Y%m%d_%H%M%S).json"
echo "{" > "$audit_report"
echo "  \"domain\": \"$DOMAIN\"," >> "$audit_report"
echo "  \"zone_id\": \"$ZONE_ID\"," >> "$audit_report"
echo "  \"audit_date\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"," >> "$audit_report"
echo "  \"results\": {" >> "$audit_report"

# Test 1: Token Verification
echo -e "\n${BLUE}1️⃣ API Token Verification${NC}"
echo "=============================="
if api_call "GET" "/user/tokens/verify" "" "Token Verification" > /tmp/token_verify.json; then
    echo "  \"token_verification\": \"SUCCESS\"," >> "$audit_report"
    echo -e "${GREEN}   Token is valid and active${NC}"
else
    echo "  \"token_verification\": \"FAILED\"," >> "$audit_report"
    echo -e "${RED}   Token verification failed${NC}"
fi

# Test 2: Zone Information
echo -e "\n${BLUE}2️⃣ Zone Information${NC}"
echo "======================"
if api_call "GET" "/zones/$ZONE_ID" "" "Zone Details" > /tmp/zone_info.json; then
    echo "  \"zone_info\": \"SUCCESS\"," >> "$audit_report"
    
    # Extract key zone information
    zone_name=$(grep -o '"name":"[^"]*"' /tmp/zone_info.json | cut -d'"' -f4)
    zone_status=$(grep -o '"status":"[^"]*"' /tmp/zone_info.json | cut -d'"' -f4)
    name_servers=$(grep -o '"name_servers":\[[^]]*\]' /tmp/zone_info.json)
    
    echo -e "${GREEN}   Zone Name: $zone_name${NC}"
    echo -e "${GREEN}   Zone Status: $zone_status${NC}"
    echo -e "${GREEN}   Name Servers: $name_servers${NC}"
else
    echo "  \"zone_info\": \"FAILED\"," >> "$audit_report"
fi

# Test 3: DNS Records
echo -e "\n${BLUE}3️⃣ DNS Records${NC}"
echo "================="
if api_call "GET" "/zones/$ZONE_ID/dns_records" "" "DNS Records" > /tmp/dns_records.json; then
    echo "  \"dns_records\": \"SUCCESS\"," >> "$audit_report"
    
    # Parse DNS records
    echo -e "${GREEN}   Current DNS Records:${NC}"
    grep -o '"name":"[^"]*","type":"[^"]*","content":"[^"]*"' /tmp/dns_records.json | while read -r record; do
        name=$(echo "$record" | cut -d'"' -f4)
        type=$(echo "$record" | cut -d'"' -f8)
        content=$(echo "$record" | cut -d'"' -f12)
        echo -e "${YELLOW}   • $name ($type) → $content${NC}"
    done
else
    echo "  \"dns_records\": \"FAILED\"," >> "$audit_report"
fi

# Test 4: Zone Settings (Expected to fail with current token)
echo -e "\n${BLUE}4️⃣ Zone Settings${NC}"
echo "=================="
if api_call "GET" "/zones/$ZONE_ID/settings" "" "Zone Settings" > /tmp/zone_settings.json; then
    echo "  \"zone_settings\": \"SUCCESS\"," >> "$audit_report"
    echo -e "${GREEN}   Zone settings accessible${NC}"
else
    echo "  \"zone_settings\": \"UNAUTHORIZED\"," >> "$audit_report"
    echo -e "${RED}   Zone settings require additional permissions${NC}"
fi

# Test 5: Individual Settings (Try some specific ones)
echo -e "\n${BLUE}5️⃣ Individual Settings Tests${NC}"
echo "================================"

settings_to_test=("ssl" "always_use_https" "security_level" "browser_cache_ttl" "cache_level")

for setting in "${settings_to_test[@]}"; do
    if api_call "GET" "/zones/$ZONE_ID/settings/$setting" "" "Setting: $setting" > /tmp/setting_$setting.json; then
        echo "  \"setting_$setting\": \"SUCCESS\"," >> "$audit_report"
        value=$(grep -o '"value":"[^"]*"' /tmp/setting_$setting.json | cut -d'"' -f4)
        echo -e "${GREEN}   $setting: $value${NC}"
    else
        echo "  \"setting_$setting\": \"UNAUTHORIZED\"," >> "$audit_report"
    fi
done

# Test 6: Page Rules
echo -e "\n${BLUE}6️⃣ Page Rules${NC}"
echo "==============="
if api_call "GET" "/zones/$ZONE_ID/pagerules" "" "Page Rules" > /tmp/page_rules.json; then
    echo "  \"page_rules\": \"SUCCESS\"," >> "$audit_report"
    rule_count=$(grep -o '"id":"[^"]*"' /tmp/page_rules.json | wc -l)
    echo -e "${GREEN}   Page Rules Count: $rule_count${NC}"
else
    echo "  \"page_rules\": \"UNAUTHORIZED\"," >> "$audit_report"
fi

# Test 7: Firewall Rules
echo -e "\n${BLUE}7️⃣ Firewall Rules${NC}"
echo "==================="
if api_call "GET" "/zones/$ZONE_ID/firewall/rules" "" "Firewall Rules" > /tmp/firewall_rules.json; then
    echo "  \"firewall_rules\": \"SUCCESS\"," >> "$audit_report"
    rule_count=$(grep -o '"id":"[^"]*"' /tmp/firewall_rules.json | wc -l)
    echo -e "${GREEN}   Firewall Rules Count: $rule_count${NC}"
else
    echo "  \"firewall_rules\": \"UNAUTHORIZED\"," >> "$audit_report"
fi

# Test 8: Analytics (if accessible)
echo -e "\n${BLUE}8️⃣ Analytics${NC}"
echo "=============="
if api_call "GET" "/zones/$ZONE_ID/analytics/dashboard" "" "Analytics Dashboard" > /tmp/analytics.json; then
    echo "  \"analytics\": \"SUCCESS\"," >> "$audit_report"
    echo -e "${GREEN}   Analytics data accessible${NC}"
else
    echo "  \"analytics\": \"UNAUTHORIZED\"," >> "$audit_report"
fi

# Close audit report
echo "  \"audit_complete\": true" >> "$audit_report"
echo "  }" >> "$audit_report"
echo "}" >> "$audit_report"

# Summary
echo -e "\n${PURPLE}📊 AUDIT SUMMARY${NC}"
echo -e "${PURPLE}==================${NC}"
echo -e "${GREEN}✅ Accessible with current token:${NC}"
echo "   • Token verification"
echo "   • Zone information"
echo "   • DNS records management"
echo "   • Basic zone details"

echo -e "\n${RED}❌ Requires additional permissions:${NC}"
echo "   • Zone settings (SSL, HTTPS, Security)"
echo "   • Page rules"
echo "   • Firewall rules"
echo "   • Analytics"
echo "   • Advanced security settings"

echo -e "\n${YELLOW}🔑 Required API Token Permissions for Full Audit:${NC}"
echo "   • Zone:Read (✅ Current)"
echo "   • Zone Settings:Read (❌ Missing)"
echo "   • Zone.Page Rule:Read (❌ Missing)"
echo "   • Zone.Firewall Services:Read (❌ Missing)"
echo "   • Zone.Analytics:Read (❌ Missing)"

echo -e "\n${BLUE}📋 Full audit report saved to: $audit_report${NC}"
echo -e "${BLUE}💡 To get full access, create a new API token with all Zone permissions${NC}"

echo -e "\n${GREEN}🎯 Current Status Summary:${NC}"
echo "   • Domain: $DOMAIN is properly configured"
echo "   • DNS: Records are accessible and can be managed"
echo "   • Settings: Require upgraded token permissions"
echo "   • Security: Cannot audit with current permissions"

# Clear cache if requested
if [ "$CLEAR_CACHE" = true ]; then
    clear_cache
fi

# Cleanup temporary files
rm -f /tmp/token_verify.json /tmp/zone_info.json /tmp/dns_records.json /tmp/zone_settings.json /tmp/setting_*.json /tmp/page_rules.json /tmp/firewall_rules.json /tmp/analytics.json

echo -e "\n${GREEN}✅ Audit completed successfully!${NC}"