#!/bin/bash
# RevivaTech Claude Code Aliases and Shortcuts
# Source this file in your .bashrc or .zshrc: source /opt/webapps/revivatech/.claude/aliases.sh

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🚀 Loading RevivaTech Claude Code Aliases...${NC}"

# Core aliases
alias reviva-check='/opt/webapps/revivatech/.claude/context-loader.sh'
alias reviva-status='reviva-check'
alias reviva-health='curl -s http://localhost:3011/api/health | jq .'
alias reviva-logs='docker logs revivatech_backend --tail 50'
alias reviva-frontend-logs='docker logs revivatech_frontend --tail 50'

# Container management
alias reviva-restart='docker restart revivatech_backend revivatech_frontend'
alias reviva-restart-backend='docker restart revivatech_backend'
alias reviva-restart-frontend='docker restart revivatech_frontend'
alias reviva-containers='docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep revivatech'

# Development shortcuts
alias reviva-dev='cd /opt/webapps/revivatech && code .'
alias reviva-frontend='cd /opt/webapps/revivatech/frontend'
alias reviva-backend='cd /opt/webapps/revivatech/backend'
alias reviva-docs='cd /opt/webapps/revivatech/Docs'

# API testing shortcuts
alias reviva-api-test='curl -s http://localhost:3011/api/health/all | jq .'
alias reviva-db-test='curl -s http://localhost:3011/api/health/database | jq .'
alias reviva-redis-test='curl -s http://localhost:3011/api/health/redis | jq .'

# Rule 1 Methodology shortcuts
alias reviva-identify='echo "🔍 RULE 1 STEP 1: IDENTIFY - Discovering existing services..." && docker exec revivatech_backend find /app -name "*.js" -type f | grep -E "(route|service|controller|api)" | head -20'
alias reviva-services='docker exec revivatech_backend ls -la /app/routes/ /app/services/'
alias reviva-tables='docker exec revivatech_database psql -U revivatech_user -d revivatech -c "\dt"'

# Quick navigation
alias reviva-claude='cd /opt/webapps/revivatech/.claude'
alias reviva-specs='cd /opt/webapps/revivatech/.claude/specs'

# Development dashboard
alias reviva-dashboard='echo "🎯 RevivaTech Development Dashboard" && echo "=========================" && echo "📊 Containers:" && reviva-containers && echo "" && echo "🔌 API Health:" && reviva-api-test && echo "" && echo "📋 Quick Commands:" && echo "  reviva-check    - System health check" && echo "  reviva-restart  - Restart all containers" && echo "  reviva-logs     - View backend logs" && echo "  reviva-dev      - Open in VS Code"'

# Functions for complex operations
reviva-rule1() {
    echo -e "${YELLOW}🚨 RULE 1 METHODOLOGY: 6-STEP SYSTEMATIC PROCESS${NC}"
    echo "================================================"
    echo "1. IDENTIFY - Discover existing services (reviva-identify)"
    echo "2. VERIFY - Test discovered functionality"
    echo "3. ANALYZE - Compare existing vs required functionality"
    echo "4. DECISION - Choose integration over creation"
    echo "5. TEST - End-to-end integration verification"
    echo "6. DOCUMENT - Create completion report"
    echo ""
    echo "Use: reviva-identify to start discovery process"
}

reviva-quick-start() {
    echo -e "${GREEN}🚀 RevivaTech Quick Start${NC}"
    echo "========================"
    echo "1. Check system health: reviva-check"
    echo "2. View containers: reviva-containers"
    echo "3. Open development: reviva-dev"
    echo "4. View logs: reviva-logs"
    echo "5. API testing: reviva-api-test"
    echo "6. Rule 1 help: reviva-rule1"
    echo ""
    echo "Dashboard: reviva-dashboard"
}

# Auto-completion function
_reviva_complete() {
    local cur prev opts
    COMPREPLY=()
    cur="${COMP_WORDS[COMP_INDEX]}"
    prev="${COMP_WORDS[COMP_INDEX-1]}"
    
    opts="check status health logs frontend-logs restart restart-backend restart-frontend containers dev frontend backend docs api-test db-test redis-test identify services tables claude specs dashboard rule1 quick-start"
    
    COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
    return 0
}

# Register completion for reviva- commands
complete -F _reviva_complete reviva-check reviva-status reviva-health

echo -e "${GREEN}✅ RevivaTech aliases loaded successfully!${NC}"
echo -e "${BLUE}💡 Type 'reviva-quick-start' to see available commands${NC}"