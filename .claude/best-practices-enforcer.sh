#!/bin/bash
# Automated Best Practices Enforcement for Claude Code
# Validates and enforces RevivaTech development standards

PROJECT_ROOT="/opt/webapps/revivatech"
VIOLATIONS_LOG="/tmp/reviva-violations.log"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🛡️  Claude Code Best Practices Enforcer${NC}"
echo "=========================================="

# Initialize violations log
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting best practices validation" > "$VIOLATIONS_LOG"

violations=0

# Rule 1: RULE 1 METHODOLOGY Validation
echo -e "${YELLOW}📋 Checking RULE 1 METHODOLOGY compliance...${NC}"

check_rule1_compliance() {
    local recent_commits=$(git -C "$PROJECT_ROOT" log --oneline -10 --grep="RULE 1" 2>/dev/null | wc -l)
    if [ "$recent_commits" -eq 0 ]; then
        echo "⚠️  No recent commits reference RULE 1 METHODOLOGY"
        echo "[$(date)] RULE 1 violation: No methodology references in recent commits" >> "$VIOLATIONS_LOG"
        ((violations++))
    else
        echo "✅ RULE 1 METHODOLOGY references found in recent commits"
    fi
}

# Rule 2: Service Discovery Before Development
echo -e "${YELLOW}🔍 Checking service discovery patterns...${NC}"

check_service_discovery() {
    # Check for new route files without corresponding discovery documentation
    local new_routes=$(find "$PROJECT_ROOT" -name "*route*.js" -o -name "*service*.js" -newer "$PROJECT_ROOT/.claude/context-loader.sh" 2>/dev/null | wc -l)
    if [ "$new_routes" -gt 0 ]; then
        echo "⚠️  New services detected - ensure RULE 1 IDENTIFY step was completed"
        echo "[$(date)] Service discovery check: New services without documented discovery" >> "$VIOLATIONS_LOG"
        ((violations++))
    else
        echo "✅ No undocumented new services found"
    fi
}

# Rule 3: Forbidden Network Addresses
echo -e "${YELLOW}🌐 Checking for forbidden network configurations...${NC}"

check_forbidden_addresses() {
    # Check for Tailscale IPs in code (forbidden)
    local tailscale_ips=$(grep -r "100\.[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}" "$PROJECT_ROOT" --include="*.js" --include="*.ts" --include="*.tsx" --include="*.json" 2>/dev/null | grep -v node_modules | wc -l)
    if [ "$tailscale_ips" -gt 0 ]; then
        echo "❌ CRITICAL: Hardcoded Tailscale IPs detected (forbidden)"
        echo "[$(date)] CRITICAL: Hardcoded Tailscale IPs found in code" >> "$VIOLATIONS_LOG"
        grep -r "100\.[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}" "$PROJECT_ROOT" --include="*.js" --include="*.ts" --include="*.tsx" --include="*.json" 2>/dev/null | grep -v node_modules | head -5
        ((violations++))
    else
        echo "✅ No forbidden Tailscale IPs found"
    fi
    
    # Check for forbidden ports
    local forbidden_ports=$(grep -r "300[01]\|500[01]\|3308\|5433\|638[01]" "$PROJECT_ROOT" --include="*.js" --include="*.ts" --include="*.tsx" --include="*.json" 2>/dev/null | grep -v node_modules | wc -l)
    if [ "$forbidden_ports" -gt 0 ]; then
        echo "⚠️  WARNING: Potentially forbidden ports detected"
        echo "[$(date)] Port warning: Forbidden ports may be in use" >> "$VIOLATIONS_LOG"
        ((violations++))
    else
        echo "✅ No forbidden ports detected"
    fi
}

# Rule 4: Memory Optimization
echo -e "${YELLOW}💾 Checking memory optimization...${NC}"

check_memory_optimization() {
    local claude_size=$(wc -c < "$PROJECT_ROOT/CLAUDE.md" 2>/dev/null || echo 0)
    local estimated_tokens=$((claude_size / 4))
    
    if [ "$estimated_tokens" -gt 6000 ]; then
        echo "⚠️  Project CLAUDE.md is large (~${estimated_tokens} tokens)"
        echo "[$(date)] Memory warning: Project CLAUDE.md size: ${estimated_tokens} tokens" >> "$VIOLATIONS_LOG"
        ((violations++))
    else
        echo "✅ Project CLAUDE.md size optimal (~${estimated_tokens} tokens)"
    fi
}

# Rule 5: Container Health
echo -e "${YELLOW}🐳 Checking container health...${NC}"

check_container_health() {
    local required_containers=("revivatech_frontend" "revivatech_backend" "revivatech_database" "revivatech_redis")
    local unhealthy_containers=0
    
    for container in "${required_containers[@]}"; do
        if ! docker ps --format "{{.Names}}" | grep -q "^${container}$"; then
            echo "❌ Container $container is not running"
            echo "[$(date)] Container health: $container not running" >> "$VIOLATIONS_LOG"
            ((unhealthy_containers++))
        fi
    done
    
    if [ "$unhealthy_containers" -eq 0 ]; then
        echo "✅ All required containers are running"
    else
        ((violations++))
    fi
}

# Rule 6: API Health
echo -e "${YELLOW}🔌 Checking API health...${NC}"

check_api_health() {
    if ! curl -s -o /dev/null -w "%{http_code}" http://localhost:3011/api/health | grep -q "200"; then
        echo "❌ Backend API health check failed"
        echo "[$(date)] API health: Backend API not responding properly" >> "$VIOLATIONS_LOG"
        ((violations++))
    else
        echo "✅ Backend API is healthy"
    fi
}

# Rule 7: Documentation Standards
echo -e "${YELLOW}📖 Checking documentation standards...${NC}"

check_documentation() {
    # Check if critical documentation exists
    local critical_docs=("CLAUDE.md" "Docs/Implementation.md" "Docs/PRD_RevivaTech_Brand_Theme.md")
    local missing_docs=0
    
    for doc in "${critical_docs[@]}"; do
        if [ ! -f "$PROJECT_ROOT/$doc" ]; then
            echo "❌ Missing critical documentation: $doc"
            echo "[$(date)] Documentation: Missing $doc" >> "$VIOLATIONS_LOG"
            ((missing_docs++))
        fi
    done
    
    if [ "$missing_docs" -eq 0 ]; then
        echo "✅ All critical documentation present"
    else
        ((violations++))
    fi
}

# Rule 8: Sequential Thinking Validation
echo -e "${YELLOW}🧠 Checking Sequential Thinking compliance...${NC}"

check_sequential_thinking() {
    # Check for TODO patterns indicating incomplete sequences
    local incomplete_sequences=$(grep -r "TODO.*STEP\|FIXME.*PARSE\|TODO.*PLAN\|TODO.*EXECUTE" "$PROJECT_ROOT" --exclude-dir=node_modules 2>/dev/null | wc -l)
    if [ "$incomplete_sequences" -gt 0 ]; then
        echo "⚠️  Incomplete Sequential Thinking patterns detected"
        echo "[$(date)] Sequential Thinking: Incomplete sequences found" >> "$VIOLATIONS_LOG"
        ((violations++))
    else
        echo "✅ Sequential Thinking patterns are complete"
    fi
}

# Execute all checks
check_rule1_compliance
check_service_discovery
check_forbidden_addresses
check_memory_optimization
check_container_health
check_api_health
check_documentation
check_sequential_thinking

# Summary
echo ""
echo -e "${BLUE}📊 Best Practices Validation Summary${NC}"
echo "===================================="

if [ "$violations" -eq 0 ]; then
    echo -e "${GREEN}🎉 All best practices checks passed!${NC}"
    echo "✅ RevivaTech project is following Claude Code best practices"
else
    echo -e "${YELLOW}⚠️  Found $violations potential violations${NC}"
    echo "📝 Check $VIOLATIONS_LOG for details"
    
    if [ "$violations" -gt 5 ]; then
        echo -e "${RED}🚨 High number of violations detected${NC}"
        echo "🔧 Recommended actions:"
        echo "  1. Review RULE 1 METHODOLOGY compliance"
        echo "  2. Run memory optimization: ./.claude/memory-optimization.sh"
        echo "  3. Check container health: ./.claude/context-loader.sh"
        echo "  4. Remove any hardcoded network addresses"
    fi
fi

echo ""
echo -e "${BLUE}🛠️  Quick Fix Commands:${NC}"
echo "---------------------"
echo "🔧 Fix containers: docker restart revivatech_backend revivatech_frontend"
echo "📊 Check system: ./.claude/context-loader.sh"
echo "💾 Optimize memory: ./.claude/memory-optimization.sh"
echo "🔍 Service discovery: npm run claude:identify"
echo "📋 RULE 1 reminder: npm run claude:rule1"

echo ""
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Best practices validation completed. Violations: $violations" >> "$VIOLATIONS_LOG"

# Exit with non-zero if violations found (for CI/CD integration)
exit "$violations"