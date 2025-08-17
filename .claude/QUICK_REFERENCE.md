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
