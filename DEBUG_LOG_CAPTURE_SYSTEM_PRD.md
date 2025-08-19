# Debug Log Capture System - Product Requirements Document (PRD)

## 🎯 **PROJECT OVERVIEW**
**Objective:** Create a comprehensive system to capture debug logs from the Enhanced Error & Console Management System and make them accessible for AI analysis.

**Context:** User requested ability to check runtime errors from the new debug system. Current limitation: AI cannot access live browser debug data.

**Solution:** Server-side capture system that streams debug events from client to backend, stores them in accessible log files, and provides APIs for analysis.

---

## 📋 **CURRENT IMPLEMENTATION STATUS**

### ✅ **COMPLETED:**
- **Phase 1 Started:** Server-side debug log capture API 
- **File Created:** `/backend/routes/debug-capture.js` (COMPLETE - 400+ lines)
- **Features Implemented:**
  - POST `/api/debug/logs` - Batch event upload
  - POST `/api/debug/log` - Single event upload  
  - GET `/api/debug/logs` - Retrieve with filtering
  - GET `/api/debug/logs/summary` - Dashboard summary
  - GET `/api/debug/export` - Full data export (JSON/CSV)
  - GET `/api/debug/files` - List log files
  - DELETE `/api/debug/logs` - Clear logs (dev only)
  - Daily log rotation (50MB max, 30 days retention)
  - Structured JSON log format with timestamps

### 🔄 **IN PROGRESS:**
- **Server Integration:** Adding debug-capture routes to main server.js

### ⏳ **REMAINING PHASES:**

**Phase 2: Client-Side Auto-Upload System**
- Modify existing debug systems to auto-upload events
- Batch upload every 30 seconds or on 50+ events
- Smart upload logic (errors/warnings by default, full in debug mode)

**Phase 3: Structured Debug Log File System**
- Create accessible log files in `/frontend/debug-logs/`
- Files: `console-errors.log`, `network-failures.log`, `system-correlations.log`, `performance-issues.log`
- Human-readable format for AI analysis

**Phase 4: CLI Debug Commands**
- `npm run debug:capture` - Capture current state
- `npm run debug:export` - Export to files
- `npm run debug:errors` - Show only errors
- WebSocket real-time streaming

**Phase 5: Integration with Existing Systems**
- Connect Console Manager, Network Interceptor, Debug Integration Layer
- Auto-upload critical events in real-time
- Maintain existing browser functionality

---

## 🔧 **TECHNICAL ARCHITECTURE**

### **Backend API (COMPLETED)**
```javascript
// Routes implemented in /backend/routes/debug-capture.js
POST /api/debug/logs      // Batch event upload
POST /api/debug/log       // Single event upload
GET  /api/debug/logs      // Retrieve with filtering
GET  /api/debug/logs/summary  // Dashboard summary
GET  /api/debug/export    // Export (JSON/CSV)
GET  /api/debug/files     // List available log files
DELETE /api/debug/logs    // Clear logs (dev only)
```

### **Log Storage Structure**
```
/backend/logs/debug-capture/
├── debug-2025-08-13.log    # Daily rotation
├── debug-2025-08-12.log
└── debug-2025-08-11.log
```

### **Event Format**
```json
{
  "id": "debug_event_1691234567890_abc123def",
  "timestamp": "2025-08-13T14:30:00.000Z",
  "type": "console|network|auth|error|performance",
  "severity": "low|medium|high|critical", 
  "source": "console-manager|network-interceptor|auth-logger",
  "message": "Error description",
  "data": { /* event-specific data */ },
  "sessionId": "session_1691234567890_xyz789",
  "userId": "user123",
  "server_received_at": "2025-08-13T14:30:01.000Z"
}
```

---

## 🚀 **IMPLEMENTATION PLAN TO COMPLETE**

### **IMMEDIATE NEXT STEPS:**

1. **Complete Server Integration** (5 minutes)
   ```javascript
   // Add to /backend/server.js after line 663:
   try {
     const debugCaptureRoutes = require('./routes/debug-capture');
     app.use('/api/debug', debugCaptureRoutes);
     logger.info('✅ Debug capture routes mounted successfully');
   } catch (error) {
     logger.error('❌ Debug capture routes not available:', error.message);
   }
   ```

2. **Create Client-Side Upload Service** (15 minutes)
   ```typescript
   // /frontend/src/lib/debug/debug-upload-service.ts
   class DebugUploadService {
     private queue: DebugEvent[] = [];
     private uploadInterval: NodeJS.Timeout;
     
     constructor() {
       this.startPeriodicUpload();
     }
     
     addEvent(event: DebugEvent) {
       this.queue.push(event);
       if (this.queue.length >= 50) {
         this.uploadBatch();
       }
     }
     
     async uploadBatch() {
       const events = this.queue.splice(0, 50);
       await fetch('/api/debug/logs', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ events })
       });
     }
   }
   ```

3. **Integrate with Existing Debug Systems** (10 minutes)
   ```typescript
   // Update console-manager.ts, network-interceptor.ts, debug-integration.ts
   // Add uploadService.addEvent(event) calls to each system
   ```

4. **Create Local Log Files** (10 minutes)
   ```typescript
   // /frontend/src/lib/debug/local-log-writer.ts
   // Write critical errors to downloadable files
   ```

---

## 📖 **USAGE AFTER COMPLETION**

### **For User to Request Debug Analysis:**
- **"Read the latest debug errors from the log files"**
- **"Check what errors are in the debug capture logs"** 
- **"Analyze recent network failures from the backend logs"**
- **"Show me the debug summary from today"**

### **Commands User Can Run:**
```bash
# Get recent errors via API
curl http://localhost:3011/api/debug/logs?severity=error&limit=20

# Export debug data
curl http://localhost:3011/api/debug/export > debug-export.json

# Clear logs (development)
curl -X DELETE http://localhost:3011/api/debug/logs

# Future CLI commands (Phase 4)
npm run debug:capture
npm run debug:export  
npm run debug:errors
```

### **Files AI Can Read:**
- `/backend/logs/debug-capture/debug-2025-08-13.log` - All debug events
- `/frontend/debug-logs/console-errors.log` - Console errors only
- `/frontend/debug-logs/network-failures.log` - Failed requests
- `/frontend/debug-logs/system-correlations.log` - Cross-system patterns

---

## 🎯 **SUCCESS CRITERIA**

### **Phase 1 Complete When:**
- [x] Debug capture API routes implemented
- [x] Daily log rotation working
- [x] JSON event format standardized
- [ ] Routes integrated into main server.js
- [ ] API endpoints responding correctly

### **Phase 2 Complete When:**
- [ ] Console Manager auto-uploads errors
- [ ] Network Interceptor auto-uploads failures  
- [ ] Debug Integration auto-uploads correlations
- [ ] Batch upload working (30s intervals or 50+ events)

### **Phase 3 Complete When:**
- [ ] Local log files created and writable
- [ ] Human-readable format implemented
- [ ] File categorization working (errors, network, correlations, performance)

### **Phase 4 Complete When:**
- [ ] CLI commands functional
- [ ] Real-time streaming via WebSocket
- [ ] Export commands generate proper files

### **Phase 5 Complete When:**
- [ ] All existing debug systems integrated
- [ ] Zero disruption to existing functionality
- [ ] Auto-upload working in both dev and production
- [ ] User can ask AI to analyze actual runtime errors

---

## 🔥 **CRITICAL CONTINUATION COMMANDS**

### **To Resume Implementation:**
```bash
# 1. Complete server integration
# Add debug-capture routes to server.js after line 663

# 2. Test API endpoints
curl -X POST http://localhost:3011/api/debug/log \
  -H "Content-Type: application/json" \
  -d '{"type":"test","severity":"info","message":"Test debug event","source":"manual"}'

# 3. Verify log file creation
ls -la /opt/webapps/revivatech/backend/logs/debug-capture/

# 4. Continue with Phase 2 client-side integration
```

### **Files to Continue Working On:**
1. `/backend/server.js` - Add debug-capture route integration
2. `/frontend/src/lib/debug/debug-upload-service.ts` - Create upload service
3. `/frontend/src/lib/console/console-manager.ts` - Add upload integration
4. `/frontend/src/lib/network/network-interceptor.ts` - Add upload integration
5. `/frontend/src/lib/debug/debug-integration.ts` - Add upload integration

---

## 💡 **IMMEDIATE VALUE**

**After Phase 1 Complete:** User can manually export debug data via API
**After Phase 2 Complete:** Automatic capture of runtime errors  
**After Phase 3 Complete:** AI can read debug logs from files
**After Phase 4 Complete:** Full CLI debug workflow
**After Phase 5 Complete:** Seamless debug-to-analysis pipeline

**Current Progress: Phase 1 - 80% Complete (API implemented, needs server integration)**

---

*Last Updated: August 13, 2025*  
*Status: 80% Phase 1 Complete - Ready for server integration and Phase 2*