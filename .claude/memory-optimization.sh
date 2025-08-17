#!/bin/bash
# Memory and Context Optimization for Claude Code
# Analyzes and optimizes token usage in CLAUDE.md files

PROJECT_ROOT="/opt/webapps/revivatech"
USER_CLAUDE="/root/.claude/CLAUDE.md"
PROJECT_CLAUDE="$PROJECT_ROOT/CLAUDE.md"
BACKUP_DIR="$PROJECT_ROOT/.claude/backups"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}💾 Claude Code Memory Optimization${NC}"
echo "===================================="

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Function to estimate tokens (rough approximation: 1 token ≈ 4 characters)
estimate_tokens() {
    local file=$1
    if [ -f "$file" ]; then
        local chars=$(wc -c < "$file")
        local tokens=$((chars / 4))
        echo $tokens
    else
        echo 0
    fi
}

# Analyze current token usage
echo -e "${YELLOW}📊 Current Token Analysis:${NC}"
echo "------------------------"

user_tokens=$(estimate_tokens "$USER_CLAUDE")
project_tokens=$(estimate_tokens "$PROJECT_CLAUDE")
total_tokens=$((user_tokens + project_tokens))

echo "User CLAUDE.md: ~${user_tokens} tokens"
echo "Project CLAUDE.md: ~${project_tokens} tokens"
echo "Total Context: ~${total_tokens} tokens"

if [ $total_tokens -gt 10000 ]; then
    echo -e "${RED}⚠️  High token usage detected (>${total_tokens}k tokens)${NC}"
elif [ $total_tokens -gt 8000 ]; then
    echo -e "${YELLOW}⚠️  Moderate token usage (${total_tokens}k tokens)${NC}"
else
    echo -e "${GREEN}✅ Optimal token usage (<8k tokens)${NC}"
fi

echo ""
echo -e "${YELLOW}🔧 Optimization Recommendations:${NC}"
echo "--------------------------------"

# Check for potential optimizations
if [ $project_tokens -gt 6000 ]; then
    echo "📝 Project CLAUDE.md could be modularized:"
    echo "  • Split large sections into separate .md files"
    echo "  • Use @include directives for common patterns"
    echo "  • Archive completed implementation notes"
fi

if grep -q "TODO\|FIXME\|XXX" "$PROJECT_CLAUDE" 2>/dev/null; then
    echo "🧹 Remove completed TODOs and implementation notes"
fi

if grep -q "example\|Example\|EXAMPLE" "$PROJECT_CLAUDE" 2>/dev/null; then
    echo "📖 Consider moving examples to separate documentation"
fi

# Memory usage recommendations
echo ""
echo -e "${BLUE}💡 Memory Usage Best Practices:${NC}"
echo "------------------------------"
echo "1. Keep CLAUDE.md under 8k total tokens"
echo "2. Use modular includes for reusable content"
echo "3. Archive completed implementation phases"
echo "4. Remove outdated examples and TODOs"
echo "5. Use concise language for rules and guidelines"

# Create optimized version suggestions
echo ""
echo -e "${GREEN}🚀 Quick Optimization Commands:${NC}"
echo "------------------------------"
echo "# Create backup before optimization:"
echo "cp $PROJECT_CLAUDE $BACKUP_DIR/CLAUDE-backup-\$(date +%Y%m%d).md"
echo ""
echo "# Remove completed TODOs:"
echo "sed -i '/TODO.*COMPLETED/d' $PROJECT_CLAUDE"
echo ""
echo "# Archive old implementation notes:"
echo "mkdir -p $PROJECT_ROOT/Docs/Archive/"
echo "# Move completed sections to Archive/"

# Show memory impact of recent changes
echo ""
echo -e "${YELLOW}📈 Memory Impact Analysis:${NC}"
echo "--------------------------"

# Check if we have git history
if git -C "$PROJECT_ROOT" rev-parse --git-dir > /dev/null 2>&1; then
    echo "📊 Recent CLAUDE.md changes:"
    git -C "$PROJECT_ROOT" log --oneline -5 -- CLAUDE.md 2>/dev/null || echo "No recent changes to track"
else
    echo "📊 Git not available for change tracking"
fi

echo ""
echo -e "${GREEN}✅ Memory optimization analysis complete${NC}"
echo "💡 Current usage: ~${total_tokens} tokens (Target: <8k)"