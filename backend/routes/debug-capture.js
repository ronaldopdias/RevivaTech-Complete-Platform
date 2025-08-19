/**
 * Debug Log Capture API
 * Receives and stores debug events from frontend for analysis
 * Provides endpoints for retrieving and exporting debug data
 */

const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();

// Debug log storage configuration - use /tmp for development or ensure writable directory
const DEBUG_LOGS_DIR = process.env.DEBUG_LOGS_DIR || '/tmp/debug-capture';
const MAX_LOG_SIZE = 50 * 1024 * 1024; // 50MB max log file size
const MAX_LOG_FILES = 30; // Keep 30 days of logs

// Ensure debug logs directory exists
async function ensureDebugLogsDir() {
  try {
    await fs.access(DEBUG_LOGS_DIR);
  } catch (error) {
    await fs.mkdir(DEBUG_LOGS_DIR, { recursive: true });
  }
}

// Get current log file path (daily rotation)
function getCurrentLogFile() {
  const today = new Date().toISOString().split('T')[0];
  return path.join(DEBUG_LOGS_DIR, `debug-${today}.log`);
}

// Clean old log files
async function cleanOldLogs() {
  try {
    const files = await fs.readdir(DEBUG_LOGS_DIR);
    const logFiles = files
      .filter(file => file.startsWith('debug-') && file.endsWith('.log'))
      .map(file => ({
        file,
        path: path.join(DEBUG_LOGS_DIR, file),
        date: file.replace('debug-', '').replace('.log', '')
      }))
      .sort((a, b) => b.date.localeCompare(a.date));

    // Remove files older than MAX_LOG_FILES days
    if (logFiles.length > MAX_LOG_FILES) {
      const filesToDelete = logFiles.slice(MAX_LOG_FILES);
      for (const { path: filePath } of filesToDelete) {
        await fs.unlink(filePath);
      }
    }
  } catch (error) {
    console.error('Error cleaning old debug logs:', error);
  }
}

// Rotate log file if it's too large
async function rotateLogFileIfNeeded(logFile) {
  try {
    const stats = await fs.stat(logFile);
    if (stats.size > MAX_LOG_SIZE) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const rotatedFile = logFile.replace('.log', `-${timestamp}.log`);
      await fs.rename(logFile, rotatedFile);
    }
  } catch (error) {
    // File doesn't exist yet, which is fine
  }
}

// Write debug event to log file
async function writeDebugEvent(event) {
  await ensureDebugLogsDir();
  
  const logFile = getCurrentLogFile();
  await rotateLogFileIfNeeded(logFile);
  
  const logEntry = {
    timestamp: new Date().toISOString(),
    ...event,
    server_received_at: new Date().toISOString()
  };
  
  const logLine = JSON.stringify(logEntry) + '\n';
  await fs.appendFile(logFile, logLine);
}

// Parse log file and return events
async function readDebugEvents(options = {}) {
  const {
    date = new Date().toISOString().split('T')[0],
    severity,
    type,
    limit = 100,
    offset = 0
  } = options;
  
  const logFile = path.join(DEBUG_LOGS_DIR, `debug-${date}.log`);
  
  try {
    const content = await fs.readFile(logFile, 'utf8');
    const lines = content.trim().split('\n').filter(line => line.trim());
    
    let events = lines.map(line => {
      try {
        return JSON.parse(line);
      } catch (error) {
        return null;
      }
    }).filter(Boolean);
    
    // Apply filters
    if (severity) {
      events = events.filter(event => event.severity === severity);
    }
    
    if (type) {
      events = events.filter(event => event.type === type);
    }
    
    // Sort by timestamp (newest first)
    events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Apply pagination
    const total = events.length;
    events = events.slice(offset, offset + limit);
    
    return { events, total, page: Math.floor(offset / limit) + 1 };
  } catch (error) {
    return { events: [], total: 0, page: 1 };
  }
}

// API Routes

/**
 * POST /api/debug/logs
 * Receive debug events from frontend
 */
router.post('/logs', async (req, res) => {
  try {
    const { events } = req.body;
    
    if (!Array.isArray(events)) {
      return res.status(400).json({ error: 'Events must be an array' });
    }
    
    // Process each event
    for (const event of events) {
      if (!event.type || !event.severity || !event.message) {
        continue; // Skip invalid events
      }
      
      await writeDebugEvent(event);
    }
    
    // Clean old logs periodically
    if (Math.random() < 0.1) { // 10% chance
      cleanOldLogs().catch(console.error);
    }
    
    res.json({ 
      success: true, 
      processed: events.length,
      message: 'Debug events logged successfully'
    });
  } catch (error) {
    console.error('Error processing debug events:', error);
    res.status(500).json({ error: 'Failed to process debug events' });
  }
});

/**
 * POST /api/debug/log
 * Receive single debug event from frontend
 */
router.post('/log', async (req, res) => {
  try {
    const event = req.body;
    
    if (!event.type || !event.severity || !event.message) {
      return res.status(400).json({ error: 'Invalid debug event format' });
    }
    
    await writeDebugEvent(event);
    
    res.json({ 
      success: true,
      message: 'Debug event logged successfully'
    });
  } catch (error) {
    console.error('Error processing debug event:', error);
    res.status(500).json({ error: 'Failed to process debug event' });
  }
});

/**
 * GET /api/debug/logs
 * Retrieve debug events with filtering
 */
router.get('/logs', async (req, res) => {
  try {
    const {
      date,
      severity,
      type,
      limit = 100,
      offset = 0
    } = req.query;
    
    const result = await readDebugEvents({
      date,
      severity,
      type,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error retrieving debug events:', error);
    res.status(500).json({ error: 'Failed to retrieve debug events' });
  }
});

/**
 * GET /api/debug/logs/summary
 * Get debug events summary for dashboard
 */
router.get('/logs/summary', async (req, res) => {
  try {
    const { date = new Date().toISOString().split('T')[0] } = req.query;
    
    const { events } = await readDebugEvents({ date, limit: 10000 });
    
    const summary = {
      total: events.length,
      by_severity: {},
      by_type: {},
      by_hour: {},
      recent_errors: [],
      top_sources: {}
    };
    
    // Analyze events
    events.forEach(event => {
      // Count by severity
      summary.by_severity[event.severity] = (summary.by_severity[event.severity] || 0) + 1;
      
      // Count by type
      summary.by_type[event.type] = (summary.by_type[event.type] || 0) + 1;
      
      // Count by hour
      const hour = new Date(event.timestamp).getHours();
      summary.by_hour[hour] = (summary.by_hour[hour] || 0) + 1;
      
      // Collect recent errors
      if (event.severity === 'error' || event.severity === 'critical') {
        summary.recent_errors.push({
          timestamp: event.timestamp,
          type: event.type,
          source: event.source,
          message: event.message.substring(0, 100)
        });
      }
      
      // Count by source
      summary.top_sources[event.source] = (summary.top_sources[event.source] || 0) + 1;
    });
    
    // Limit recent errors to 10
    summary.recent_errors = summary.recent_errors
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);
    
    // Convert top sources to sorted array
    summary.top_sources = Object.entries(summary.top_sources)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([source, count]) => ({ source, count }));
    
    res.json(summary);
  } catch (error) {
    console.error('Error generating debug summary:', error);
    res.status(500).json({ error: 'Failed to generate debug summary' });
  }
});

/**
 * GET /api/debug/export
 * Export all debug data as JSON
 */
router.get('/export', async (req, res) => {
  try {
    const { 
      days = 7,
      format = 'json',
      severity
    } = req.query;
    
    const exportData = {
      export_timestamp: new Date().toISOString(),
      days_included: parseInt(days),
      events: []
    };
    
    // Collect events from multiple days
    const daysToExport = parseInt(days);
    for (let i = 0; i < daysToExport; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const { events } = await readDebugEvents({ 
        date: dateStr, 
        severity,
        limit: 10000 
      });
      
      exportData.events.push(...events);
    }
    
    // Sort all events by timestamp
    exportData.events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    if (format === 'csv') {
      // Convert to CSV format
      const csvLines = ['timestamp,type,severity,source,message'];
      exportData.events.forEach(event => {
        const line = [
          event.timestamp,
          event.type,
          event.severity,
          event.source,
          `"${event.message.replace(/"/g, '""')}"`
        ].join(',');
        csvLines.push(line);
      });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="debug-export-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvLines.join('\n'));
    } else {
      // JSON format
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="debug-export-${new Date().toISOString().split('T')[0]}.json"`);
      res.json(exportData);
    }
  } catch (error) {
    console.error('Error exporting debug data:', error);
    res.status(500).json({ error: 'Failed to export debug data' });
  }
});

/**
 * GET /api/debug/files
 * List available debug log files
 */
router.get('/files', async (req, res) => {
  try {
    await ensureDebugLogsDir();
    const files = await fs.readdir(DEBUG_LOGS_DIR);
    
    const logFiles = files
      .filter(file => file.startsWith('debug-') && file.endsWith('.log'))
      .map(file => {
        const filePath = path.join(DEBUG_LOGS_DIR, file);
        return {
          name: file,
          date: file.replace('debug-', '').replace('.log', ''),
          path: filePath
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date));
    
    // Get file sizes
    for (const file of logFiles) {
      try {
        const stats = await fs.stat(file.path);
        file.size = stats.size;
        file.modified = stats.mtime;
      } catch (error) {
        file.size = 0;
        file.modified = null;
      }
    }
    
    res.json({ files: logFiles });
  } catch (error) {
    console.error('Error listing debug files:', error);
    res.status(500).json({ error: 'Failed to list debug files' });
  }
});

/**
 * DELETE /api/debug/logs
 * Clear debug logs (development only)
 */
router.delete('/logs', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Log clearing disabled in production' });
    }
    
    await ensureDebugLogsDir();
    const files = await fs.readdir(DEBUG_LOGS_DIR);
    
    const logFiles = files.filter(file => 
      file.startsWith('debug-') && file.endsWith('.log')
    );
    
    for (const file of logFiles) {
      await fs.unlink(path.join(DEBUG_LOGS_DIR, file));
    }
    
    res.json({ 
      success: true, 
      message: `Cleared ${logFiles.length} debug log files`,
      files_deleted: logFiles
    });
  } catch (error) {
    console.error('Error clearing debug logs:', error);
    res.status(500).json({ error: 'Failed to clear debug logs' });
  }
});

module.exports = router;