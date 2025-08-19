# 🐛 Debug Log Capture System - Quick Reference

## ⚡ **For AI Assistants: Immediate Commands**

**When users ask debug-related questions, use these commands immediately:**

### **Most Common Request:**
```bash
# "Read the latest debug errors from the log files"
curl -s 'http://localhost:3011/api/debug/logs?severity=error&limit=20' | jq .
```

### **Dashboard Overview:**
```bash
# "Show me the debug summary" or "What's the system health?"
curl -s http://localhost:3011/api/debug/logs/summary | jq .
```

### **Full Analysis Export:**
```bash
# "Analyze all debug data" or "Export debug information"
curl -s http://localhost:3011/api/debug/export | jq .
```

## 🎯 **User Request Patterns → Commands**

| User Request | Command | Purpose |
|--------------|---------|---------|
| "Read the latest debug errors" | `curl -s 'http://localhost:3011/api/debug/logs?severity=error&limit=20' \| jq .` | Get recent errors |
| "Check debug capture logs" | `curl -s http://localhost:3011/api/debug/logs/summary \| jq .` | Get overview |
| "Show network failures" | `curl -s 'http://localhost:3011/api/debug/logs?type=network&severity=high' \| jq .` | Network issues |
| "What console errors happened?" | `curl -s 'http://localhost:3011/api/debug/logs?type=console&severity=error' \| jq .` | Console errors |
| "Find authentication errors" | `curl -s 'http://localhost:3011/api/debug/logs?type=auth' \| jq .` | Auth issues |
| "Analyze recent activity" | `curl -s 'http://localhost:3011/api/debug/logs?limit=50' \| jq .` | Recent events |

## 🛠️ **Quick CLI Access**

```bash
# Show enhanced help (includes API commands)
npm run debug:help

# Get recent errors (most useful)
npm run debug:logs:errors

# Get dashboard summary  
npm run debug:summary

# Export data for analysis
npm run debug:export
```

## 📊 **API Endpoint Quick Reference**

### **Primary Endpoints:**
- `GET /api/debug/logs/summary` - Dashboard overview (most useful)
- `GET /api/debug/logs?severity=error` - Error events only
- `GET /api/debug/export` - Full data export
- `GET /api/debug/logs?type=network&severity=high` - Network failures

### **Query Parameters:**
- `severity`: `error`, `critical`, `high`, `medium`, `low`
- `type`: `console`, `network`, `auth`, `error`, `performance`
- `limit`: Number of events (default: 100)
- `date`: Specific date (YYYY-MM-DD)

## 🎯 **Common Analysis Scenarios**

### **Error Investigation:**
```bash
# 1. Get error summary
curl -s http://localhost:3011/api/debug/logs/summary | jq '.recent_errors'

# 2. Get full error details
curl -s 'http://localhost:3011/api/debug/logs?severity=error' | jq '.events[0]'

# 3. Find error patterns
curl -s 'http://localhost:3011/api/debug/logs?severity=error' | jq '[.events[].message] | group_by(.) | map({message: .[0], count: length}) | sort_by(.count) | reverse'
```

### **Performance Analysis:**
```bash
# Slow network requests
curl -s 'http://localhost:3011/api/debug/logs?type=network' | jq '.events[] | select(.data.duration > 3000)'

# Memory issues
curl -s 'http://localhost:3011/api/debug/logs?type=performance' | jq '.events[] | select(.message | contains("memory"))'
```

### **Session Tracking:**
```bash
# Get specific user session
curl -s 'http://localhost:3011/api/debug/logs' | jq '.events[] | select(.sessionId=="session_xyz")'
```

## 🔍 **System Status Check**

```bash
# Quick system health check
echo "=== Debug System Status ===" && \
curl -s http://localhost:3011/api/debug/logs/summary | jq '{total: .total, errors: .by_severity.error, critical: .by_severity.critical}' && \
echo "=== Recent Activity ===" && \
curl -s 'http://localhost:3011/api/debug/logs?limit=3' | jq '.events[] | {time: .timestamp, type: .type, severity: .severity, message: .message}'
```

## 📁 **File Locations**

- **Log Storage:** `/tmp/debug-capture/debug-YYYY-MM-DD.log`
- **API Routes:** `/opt/webapps/revivatech/backend/routes/debug-capture.js`  
- **Frontend Integration:** `/opt/webapps/revivatech/frontend/src/lib/debug/`
- **Full Documentation:** `/opt/webapps/revivatech/frontend/src/lib/debug/README.md`

## ⚠️ **Troubleshooting**

### **No Data Found:**
```bash
# Check if system is capturing events
npm run debug:capture && sleep 2 && npm run debug:logs:recent
```

### **API Not Responding:**
```bash
# Verify backend is running
docker ps | grep revivatech_backend
curl http://localhost:3011/health
```

### **Permission Issues:**
```bash
# Check log directory
ls -la /tmp/debug-capture/
```

## 💡 **Tips for AI Analysis**

1. **Start with summary:** Always check `/api/debug/logs/summary` first
2. **Filter by severity:** Use `severity=error` for most troubleshooting
3. **Use timestamps:** Events are sorted newest first
4. **Check correlations:** Look for events with same `sessionId`
5. **Export for complex analysis:** Use `/api/debug/export` for detailed investigation

## 🚀 **Advanced Usage**

### **Custom Filtering:**
```bash
# Events from last hour
curl -s 'http://localhost:3011/api/debug/logs' | jq --arg hour "$(date -u -d '1 hour ago' +%Y-%m-%dT%H)" '.events[] | select(.timestamp > ($hour + ":00:00Z"))'

# Group by source
curl -s 'http://localhost:3011/api/debug/logs' | jq '.events | group_by(.source) | map({source: .[0].source, count: length})'
```

### **Data Export:**
```bash
# Export as CSV
curl -s 'http://localhost:3011/api/debug/export?format=csv' > debug-data.csv

# Export specific date range
curl -s 'http://localhost:3011/api/debug/export?days=3&severity=error' > recent-errors.json
```

---

## 🎯 **Remember: When in doubt, run `npm run debug:help` for full system overview!**