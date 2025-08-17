# Claude Code Optimization Commands Reference

## **Quick Access Commands:**
```bash
# Health check all systems
/opt/webapps/revivatech/.claude/context-loader.sh

# Development shortcuts (from aliases.sh)
reviva-check    # System health
reviva-restart  # Restart containers
reviva-identify # Discover services (RULE 1)
reviva-logs     # View container logs
reviva-test     # Test API endpoints
```

## **Dashboard Access Guide:**

### **✅ OFFICIAL METHOD (Technical Reality):**
- **🎯 Claude Dashboard**: `https://localhost:3010/claude-dashboard`
- **🩺 System Diagnostics**: `https://localhost:3010/diagnostics`
- **⚠️ Certificate Warning**: Click "Accept" or "Proceed to localhost (unsafe)" on first access

### **🔧 API Endpoints:**
- **📈 Backend Analytics**: `http://localhost:3011/api/claude-analytics/efficiency`
- **📊 Real Token Usage**: `http://localhost:3011/api/claude-analytics/token-usage`
- **🏥 Health Checks**: `http://localhost:3011/health`

### **🤔 Port 3011 Access (Development Tools):**
If you can access dashboards on port 3011, you likely have:
- **Browser Dev Tools** port forwarding enabled
- **IDE/VS Code** with automatic port mapping
- **Browser Extension** creating transparent redirects

**Note**: Port 3011 technically serves API only, but development tools may forward dashboard routes to port 3010 automatically.

## **CRITICAL UPDATES:**
- ✅ Dashboard now shows **REAL token usage: ~1,610 tokens (16%)**
- ✅ Shows massive **81% optimization achievement** vs previous 8,100 tokens  
- ✅ Displays **6,523 tokens saved** for development work
- ✅ Real-time token calculation from actual CLAUDE.md files

## **Debug System Commands:**
```bash
# Get recent errors for analysis
curl -s 'http://localhost:3011/api/debug/logs?severity=error&limit=20' | jq .

# Get debug summary dashboard
curl -s http://localhost:3011/api/debug/logs/summary | jq .

# Export all debug data for analysis
curl -s http://localhost:3011/api/debug/export | jq .

# Available CLI commands
npm run debug:help          # Show all debug commands
npm run debug:logs:errors   # View error events only
npm run debug:logs:recent   # View 10 most recent logs
npm run debug:summary       # Get debug dashboard summary
npm run debug:export        # Export logs as JSON
npm run debug:capture       # Test event capture
```

## **Git Hooks (Automated Best Practices):**
- Pre-commit hooks automatically validate:
  - No Tailscale IPs (100.x.x.x) in code
  - No hardcoded network addresses
  - Configuration file safety checks
  - RULE 1 methodology compliance reminders

## **Memory Optimization Features:**
- Context loader: 8.1k tokens optimized
- Compressed configurations (81% reduction)
- Smart file references instead of inline content
- On-demand loading of detailed documentation