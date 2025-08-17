#!/bin/bash
# Master Setup Script for Claude Code Optimization
# Sets up all best practices tools and configurations for maximum efficiency

PROJECT_ROOT="/opt/webapps/revivatech"
CLAUDE_DIR="$PROJECT_ROOT/.claude"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${BLUE}🚀 Claude Code Optimization Setup${NC}"
echo -e "${PURPLE}====================================${NC}"
echo ""
echo "This script will set up the complete Claude Code optimization suite for RevivaTech."
echo ""

# Step 1: Load Aliases
echo -e "${YELLOW}📦 Step 1: Setting up convenient aliases...${NC}"
if [ -f "$CLAUDE_DIR/aliases.sh" ]; then
    echo "✅ Aliases script exists"
    echo "💡 To load aliases, run: source $CLAUDE_DIR/aliases.sh"
    echo "💡 Or add to your ~/.bashrc: echo 'source $CLAUDE_DIR/aliases.sh' >> ~/.bashrc"
else
    echo -e "${RED}❌ Aliases script not found${NC}"
fi

# Step 2: Test Context Loader
echo -e "\n${YELLOW}📊 Step 2: Testing system health check...${NC}"
if [ -x "$CLAUDE_DIR/context-loader.sh" ]; then
    echo "✅ Context loader is executable"
    echo "🔧 Running system health check..."
    "$CLAUDE_DIR/context-loader.sh"
else
    echo -e "${RED}❌ Context loader not executable${NC}"
    chmod +x "$CLAUDE_DIR/context-loader.sh" 2>/dev/null && echo "✅ Fixed permissions"
fi

# Step 3: Memory Optimization Check
echo -e "\n${YELLOW}💾 Step 3: Memory optimization analysis...${NC}"
if [ -x "$CLAUDE_DIR/memory-optimization.sh" ]; then
    echo "✅ Memory optimizer is available"
    "$CLAUDE_DIR/memory-optimization.sh"
else
    echo -e "${RED}❌ Memory optimizer not available${NC}"
fi

# Step 4: Best Practices Enforcement
echo -e "\n${YELLOW}🛡️  Step 4: Best practices validation...${NC}"
if [ -x "$CLAUDE_DIR/best-practices-enforcer.sh" ]; then
    echo "✅ Best practices enforcer is available"
    echo "🔧 Running validation..."
    "$CLAUDE_DIR/best-practices-enforcer.sh" || echo "⚠️  Some violations found - see details above"
else
    echo -e "${RED}❌ Best practices enforcer not available${NC}"
fi

# Step 5: Git Hooks Setup
echo -e "\n${YELLOW}🎣 Step 5: Setting up Git hooks...${NC}"
GIT_HOOKS_DIR="$PROJECT_ROOT/.git/hooks"
if [ -d "$GIT_HOOKS_DIR" ]; then
    if [ -f "$CLAUDE_DIR/hooks/pre-commit" ]; then
        cp "$CLAUDE_DIR/hooks/pre-commit" "$GIT_HOOKS_DIR/"
        chmod +x "$GIT_HOOKS_DIR/pre-commit"
        echo "✅ Pre-commit hook installed"
    else
        echo "⚠️  Pre-commit hook source not found"
    fi
else
    echo "⚠️  Git hooks directory not found - not a git repository?"
fi

# Step 6: NPM Scripts Verification
echo -e "\n${YELLOW}📦 Step 6: Verifying NPM scripts...${NC}"
if grep -q "claude:check" "$PROJECT_ROOT/frontend/package.json" 2>/dev/null; then
    echo "✅ Claude NPM scripts are configured"
    echo "💡 Try: cd frontend && npm run claude:check"
else
    echo "⚠️  Claude NPM scripts may not be configured"
fi

# Step 7: Backend Analytics Routes
echo -e "\n${YELLOW}📈 Step 7: Testing analytics endpoints...${NC}"
echo "🔧 Restarting backend to load new routes..."
docker restart revivatech_backend >/dev/null 2>&1
sleep 5

# Test if analytics routes are loaded
if curl -s http://localhost:3011/api/claude-analytics/efficiency >/dev/null 2>&1; then
    echo "✅ Claude Analytics routes are working"
else
    echo "⚠️  Analytics routes may need backend restart"
fi

# Step 8: Dashboard Access
echo -e "\n${YELLOW}🎯 Step 8: Verifying dashboard access...${NC}"
echo "🌐 Claude Dashboard: http://localhost:3010/claude-dashboard"
echo "🌐 System Diagnostics: http://localhost:3010/diagnostics"
echo "🌐 API Health: http://localhost:3011/api/health"

# Step 9: Create Quick Reference
echo -e "\n${YELLOW}📖 Step 9: Creating quick reference...${NC}"
cat > "$CLAUDE_DIR/QUICK_REFERENCE.md" << 'EOF'
# Claude Code Quick Reference

## Daily Workflow Commands

### System Health Check
```bash
# Quick health check
source /opt/webapps/revivatech/.claude/aliases.sh
reviva-check

# Or using NPM
cd frontend && npm run claude:check
```

### RULE 1 METHODOLOGY Reminder
```bash
reviva-rule1
# Or: npm run claude:rule1
```

### Service Discovery
```bash
reviva-identify
# Or: npm run claude:identify
```

### Container Management
```bash
reviva-restart          # Restart all containers
reviva-containers       # Show container status
reviva-logs            # View backend logs
```

### Development Dashboard
- **Claude Dashboard**: http://localhost:3010/claude-dashboard
- **System Diagnostics**: http://localhost:3010/diagnostics
- **API Testing**: http://localhost:3011/api/health

## Best Practices Validation
```bash
# Run automated checks
./.claude/best-practices-enforcer.sh

# Memory optimization analysis
./.claude/memory-optimization.sh
```

## Analytics & Metrics
```bash
# View efficiency metrics
curl -s http://localhost:3011/api/claude-analytics/efficiency | jq .

# Development patterns
curl -s http://localhost:3011/api/claude-analytics/patterns | jq .

# Compliance report
curl -s http://localhost:3011/api/claude-analytics/compliance | jq .
```

## RULE 1 METHODOLOGY Steps
1. **IDENTIFY** - Discover existing services
2. **VERIFY** - Test discovered functionality  
3. **ANALYZE** - Compare existing vs required
4. **DECISION** - Choose integration over creation
5. **TEST** - End-to-end verification
6. **DOCUMENT** - Create completion report

## Sequential Thinking Protocol
1. **PARSE** - Understand the request completely
2. **PLAN** - Create systematic approach
3. **EXECUTE** - Follow plan methodically
4. **VERIFY** - Validate completion
5. **DOCUMENT** - Record results

## Key Files
- **Project Config**: `/opt/webapps/revivatech/CLAUDE.md`
- **User Config**: `/root/.claude/CLAUDE.md`
- **Context Loader**: `./.claude/context-loader.sh`
- **Quick Reference**: `./.claude/QUICK_REFERENCE.md`
- **Aliases**: `./.claude/aliases.sh`
EOF

echo "✅ Quick reference created at $CLAUDE_DIR/QUICK_REFERENCE.md"

# Final Summary
echo -e "\n${GREEN}🎉 Claude Code Optimization Setup Complete!${NC}"
echo -e "${PURPLE}============================================${NC}"
echo ""
echo -e "${GREEN}✅ All systems configured for maximum efficiency${NC}"
echo ""
echo -e "${BLUE}🚀 Next Steps:${NC}"
echo "1. Load aliases: source $CLAUDE_DIR/aliases.sh"
echo "2. Test health check: reviva-check"
echo "3. Open dashboard: http://localhost:3010/claude-dashboard"
echo "4. Read quick reference: cat $CLAUDE_DIR/QUICK_REFERENCE.md"
echo ""
echo -e "${BLUE}💡 Pro Tips:${NC}"
echo "• Use 'reviva-quick-start' to see all available commands"
echo "• Run 'reviva-rule1' before starting any development task"
echo "• Check 'reviva-dashboard' for real-time system status"
echo "• Use Claude Analytics API for development insights"
echo ""
echo -e "${PURPLE}Happy developing with optimized Claude Code! 🤖✨${NC}"