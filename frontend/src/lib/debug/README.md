# Debug Log Capture System - Complete Documentation

## 🎯 **Overview**

The Debug Log Capture System provides comprehensive runtime debugging and error analysis capabilities for the RevivaTech platform. It automatically captures console logs, network requests, authentication events, and performance data, making them accessible for AI analysis and troubleshooting.

## 🚀 **Quick Start for AI Analysis**

### **When Users Ask Debug Questions:**

**Common Phrases that Trigger Debug Analysis:**
- "Read the latest debug errors from the log files"
- "Check what errors are in the debug capture logs" 
- "Analyze recent network failures from the backend logs"
- "Show me the debug summary from today"
- "What console errors happened recently?"
- "Find all authentication errors in the debug logs"

**Immediate Response Commands:**
```bash
# Get recent errors (most common request)
curl -s 'http://localhost:3011/api/debug/logs?severity=error&limit=20' | jq .

# Get comprehensive summary
curl -s http://localhost:3011/api/debug/logs/summary | jq .

# Export full debug dataset
curl -s http://localhost:3011/api/debug/export | jq .
```

## 📡 **API Endpoints Reference**

### **Core Debug API (`/api/debug/*`)**

| Endpoint | Method | Purpose | Example |
|----------|--------|---------|---------|
| `/logs` | POST | Upload debug events (batch) | `curl -X POST -d '{"events":[...]}' /api/debug/logs` |
| `/log` | POST | Upload single debug event | `curl -X POST -d '{"type":"error",...}' /api/debug/log` |
| `/logs` | GET | Retrieve debug events | `curl '/api/debug/logs?severity=error&limit=10'` |
| `/logs/summary` | GET | Get dashboard summary | `curl /api/debug/logs/summary` |
| `/export` | GET | Export all data (JSON/CSV) | `curl '/api/debug/export?format=csv'` |
| `/files` | GET | List available log files | `curl /api/debug/files` |
| `/logs` | DELETE | Clear logs (dev only) | `curl -X DELETE /api/debug/logs` |

### **Query Parameters**

**For `/logs` GET endpoint:**
- `severity`: Filter by severity (`low`, `medium`, `high`, `critical`)
- `type`: Filter by event type (`console`, `network`, `auth`, `error`, `performance`)
- `limit`: Maximum number of events (default: 100)
- `offset`: Pagination offset (default: 0)
- `date`: Specific date (YYYY-MM-DD format)

**For `/export` endpoint:**
- `format`: Export format (`json` or `csv`)
- `days`: Number of days to include (default: 7)
- `severity`: Filter by severity

### **Event Data Format**

```json
{
  "id": "debug_event_1691234567890_abc123",
  "timestamp": "2025-08-13T14:30:00.000Z",
  "type": "console|network|auth|error|performance",
  "severity": "low|medium|high|critical",
  "source": "console-manager|network-interceptor|auth-logger|...",
  "message": "Human-readable event description",
  "data": {
    // Event-specific data (varies by type)
  },
  "sessionId": "session_1691234567890_xyz789",
  "userId": "user123",
  "server_received_at": "2025-08-13T14:30:01.000Z"
}
```

## 🛠️ **CLI Commands**

### **Available Commands (via npm)**

```bash
# Show all available commands
npm run debug:help

# Capture test debug event
npm run debug:capture

# View all debug logs
npm run debug:logs

# View only errors and critical issues  
npm run debug:logs:errors

# View 10 most recent events
npm run debug:logs:recent

# Get dashboard summary
npm run debug:summary

# Export logs as JSON file
npm run debug:export

# Export logs as CSV file
npm run debug:export:csv

# Clear all logs (development only)
npm run debug:clear
```

### **Direct curl Examples**

```bash
# Test single event capture
curl -X POST http://localhost:3011/api/debug/log \
  -H "Content-Type: application/json" \
  -d '{"type":"manual","severity":"info","message":"Test event","source":"cli"}'

# Get errors from the last 24 hours
curl -s "http://localhost:3011/api/debug/logs?severity=error&severity=critical" | jq .

# Get network failures only
curl -s "http://localhost:3011/api/debug/logs?type=network&severity=high" | jq .

# Export last 3 days as CSV
curl -s "http://localhost:3011/api/debug/export?format=csv&days=3" > debug-export.csv
```

## 🏗️ **System Architecture**

### **Components Overview**

```
Frontend (Auto-Capture)          Backend (Storage)           Analysis
├── Console Manager        →     ├── /api/debug/logs    →    ├── AI Analysis
├── Network Interceptor    →     ├── Daily Log Files    →    ├── CLI Commands  
├── Debug Integration      →     ├── JSON/CSV Export    →    ├── Dashboard
└── Local Log Writer       →     └── Filter/Search      →    └── Troubleshooting
```

### **Data Flow**

1. **Capture**: Frontend systems automatically detect and capture debug events
2. **Upload**: Events batched and uploaded every 30 seconds or when 50+ events queued
3. **Storage**: Backend stores events in daily-rotated log files (`/tmp/debug-capture/`)
4. **Access**: Multiple access methods (API, CLI, files) for analysis
5. **Analysis**: AI systems can read and analyze captured debug data

### **File Structure**

```
frontend/src/lib/debug/
├── README.md                     # This documentation
├── debug-upload-service.ts       # Client-side auto-upload system
├── debug-integration.ts          # Cross-system correlation
├── local-log-writer.ts          # Client-side file generation
└── [existing systems integrated]
    ├── ../console/console-manager.ts      # Console log capture
    ├── ../network/network-interceptor.ts  # Network monitoring  
    └── ../auth/auth-logger.ts            # Auth event logging

backend/routes/
└── debug-capture.js              # Server-side API endpoints

backend/logs/debug-capture/       # Log file storage
├── debug-2025-08-13.log         # Daily rotated logs
├── debug-2025-08-12.log
└── debug-2025-08-11.log
```

## 🔧 **Integration Points**

### **Existing Systems Connected**

1. **Console Manager** (`/lib/console/console-manager.ts`)
   - Captures all console.log, error, warn statements
   - Auto-uploads console events with severity mapping
   - Integration: Added `uploadToDebugCapture()` method

2. **Network Interceptor** (`/lib/network/network-interceptor.ts`)
   - Monitors fetch() and XMLHttpRequest calls
   - Captures request/response data, timing, errors
   - Integration: Added network event upload in `addRequest()`

3. **Debug Integration Layer** (`/lib/debug/debug-integration.ts`)
   - Correlates events across systems
   - Identifies patterns and relationships
   - Integration: Added correlation event uploads

4. **Enhanced Error & Console Management System**
   - Extends existing error reporting infrastructure
   - Preserves all original functionality
   - Adds server-side persistence layer

### **Auto-Upload Configuration**

```typescript
// Default upload settings
{
  enabled: true,
  batchSize: 50,              // Events per batch
  uploadInterval: 30000,      // 30 seconds
  uploadOnError: true,        // Always upload errors
  uploadOnWarning: false,     // Skip warnings by default
  uploadInProduction: false,  // Configurable for production
}
```

## 📊 **Data Analysis Guide**

### **Event Types & Severity Mapping**

| Event Type | Sources | Severity Rules |
|------------|---------|---------------|
| `console` | console-manager | error/trace=high, warn=medium, others=low |
| `network` | network-interceptor | 5xx=high, 4xx=medium, slow(>5s)=medium |
| `auth` | auth-logger, debug-integration | login_failed=high, others=low |
| `error` | error-reporting | Based on error severity |
| `performance` | memory-profiler | memory>80%=high, slow_component=medium |

### **Common Analysis Patterns**

**Error Correlation:**
```bash
# Find errors that happen together
curl -s '/api/debug/logs?severity=error' | jq '[.events[] | select(.timestamp > "2025-08-13T20:00:00Z")] | group_by(.sessionId)'
```

**Performance Investigation:**
```bash
# Get slow network requests and memory issues
curl -s '/api/debug/logs' | jq '.events[] | select(.type=="network" and .data.duration > 5000 or .type=="performance")'
```

**User Journey Analysis:**
```bash
# Trace user session events
curl -s '/api/debug/logs' | jq '.events[] | select(.sessionId=="session_123") | sort_by(.timestamp)'
```

### **Dashboard Summary Interpretation**

```json
{
  "total": 245,                    // Total events captured
  "by_severity": {
    "critical": 2,                 // Immediate attention needed
    "high": 15,                    // Important errors to investigate  
    "medium": 45,                  // Warnings and performance issues
    "low": 183                     // Informational events
  },
  "by_type": {
    "console": 120,                // Console log events
    "network": 78,                 // Network request events
    "auth": 25,                    // Authentication events
    "error": 15,                   // Error boundary catches
    "performance": 7               // Performance monitoring events
  },
  "recent_errors": [...],          // Last 10 error events
  "top_sources": [...]             // Most active debug sources
}
```

## 🔍 **Troubleshooting Guide**

### **Common Issues**

**1. No Debug Events Captured**
```bash
# Check if backend is receiving events
curl http://localhost:3011/api/debug/files

# Test manual event capture
npm run debug:capture

# Verify frontend upload service status
# (Check browser console for upload errors)
```

**2. API Endpoints Not Responding**
```bash
# Verify backend container is running
docker ps | grep revivatech_backend

# Check if debug routes are mounted
docker logs revivatech_backend | grep "Debug capture routes"

# Test backend health
curl http://localhost:3011/health
```

**3. Log Files Not Created**
```bash
# Check log directory permissions
ls -la /tmp/debug-capture/

# Verify directory creation
curl -X POST http://localhost:3011/api/debug/log \
  -H "Content-Type: application/json" \
  -d '{"type":"test","severity":"info","message":"Permission test","source":"troubleshoot"}'
```

**4. Large Log Files**
```bash
# Check current file sizes
curl -s http://localhost:3011/api/debug/files | jq '.files[] | {name: .name, size: .size}'

# Clear logs if needed (development only)
npm run debug:clear
```

### **Performance Considerations**

- **Upload Frequency**: Default 30-second batches balance performance vs real-time capture
- **Batch Size**: 50 events per batch prevents overwhelming the backend
- **File Rotation**: Daily rotation with 50MB size limits prevents disk space issues
- **Production Mode**: Configurable upload settings for production environments

## 📝 **Usage Examples**

### **Scenario 1: Investigating Console Errors**

```bash
# 1. Get recent console errors
curl -s 'http://localhost:3011/api/debug/logs?type=console&severity=error&limit=10' | jq .

# 2. Look for patterns in error messages
curl -s 'http://localhost:3011/api/debug/logs?type=console&severity=error' | jq '.events[].message'

# 3. Get full context of specific error
curl -s 'http://localhost:3011/api/debug/logs?type=console' | jq '.events[] | select(.message | contains("Hydration"))'
```

### **Scenario 2: Network Performance Analysis**

```bash
# 1. Find slow network requests
curl -s 'http://localhost:3011/api/debug/logs?type=network' | jq '.events[] | select(.data.duration > 3000)'

# 2. Identify failing endpoints
curl -s 'http://localhost:3011/api/debug/logs?type=network&severity=high' | jq '.events[] | .data.url'

# 3. Get timing breakdown for requests
curl -s 'http://localhost:3011/api/debug/logs?type=network' | jq '.events[] | {url: .data.url, duration: .data.duration, timing: .data.timing}'
```

### **Scenario 3: Authentication Issues**

```bash
# 1. Get auth-related events
curl -s 'http://localhost:3011/api/debug/logs?type=auth' | jq .

# 2. Find login failures
curl -s 'http://localhost:3011/api/debug/logs' | jq '.events[] | select(.message | contains("login") or contains("auth"))'

# 3. Track user session issues
curl -s 'http://localhost:3011/api/debug/logs' | jq '.events[] | select(.sessionId=="session_xyz")'
```

## 🚀 **Advanced Features**

### **Custom Event Capture**

```typescript
// Add custom debug events from your code
import { debugUploadService } from '@/lib/debug/debug-upload-service';

debugUploadService.addEvent({
  type: 'custom',
  severity: 'medium',
  source: 'my-component',
  message: 'Custom debugging event',
  data: { customData: 'additional context' }
});
```

### **Local File Generation**

```typescript
// Generate downloadable debug logs
import { localLogWriter } from '@/lib/debug/local-log-writer';

// Auto-download when threshold reached
localLogWriter.updateConfig({ autoDownload: true, downloadThreshold: 100 });

// Manual download
localLogWriter.generateAndDownloadLogs();
```

### **Real-time Monitoring**

```typescript
// Subscribe to debug upload service events
import { debugUploadService } from '@/lib/debug/debug-upload-service';

const unsubscribe = debugUploadService.subscribe((stats) => {
  console.log('Debug upload stats:', stats);
});
```

## 📊 **Monitoring & Maintenance**

### **Regular Health Checks**

```bash
# Daily debug system health check
npm run debug:summary

# Weekly log file cleanup (automatic via rotation)
curl -s http://localhost:3011/api/debug/files | jq '.files | length'

# Monthly export for analysis
npm run debug:export
```

### **Log Rotation Configuration**

- **Daily Rotation**: New log file created each day
- **Size Limits**: 50MB maximum per file
- **Retention**: 30 days of logs kept
- **Cleanup**: Automatic old file removal

---

## 🎯 **For AI Assistants: Quick Reference**

**When users request debug analysis, immediately use these commands:**

```bash
# Primary analysis command (covers 90% of requests)
curl -s http://localhost:3011/api/debug/logs/summary | jq .

# Error-specific analysis
curl -s 'http://localhost:3011/api/debug/logs?severity=error&limit=20' | jq .

# Full data export for complex analysis
curl -s http://localhost:3011/api/debug/export | jq .
```

**Key phrases that indicate debug analysis needed:**
- "debug logs", "error logs", "console errors"
- "network failures", "api errors", "request issues"  
- "authentication problems", "login issues"
- "performance problems", "memory issues"
- "recent errors", "what's failing", "system health"

This system provides comprehensive debugging capabilities for both automated analysis and manual troubleshooting.