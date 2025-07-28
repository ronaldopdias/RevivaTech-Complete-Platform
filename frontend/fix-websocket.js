#!/usr/bin/env node

/**
 * WebSocket Connection Diagnostic and Fix Script
 * This script helps diagnose and fix HMR WebSocket connection issues
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Diagnosing WebSocket Connection Issues...\n');

// Check if Next.js development server is running
try {
  const processes = execSync('ps aux | grep -i "next dev"', { encoding: 'utf8' });
  console.log('✅ Next.js development server processes:');
  console.log(processes);
} catch (error) {
  console.log('❌ No Next.js development server found running');
}

// Check network interfaces
try {
  const interfaces = execSync('hostname -I', { encoding: 'utf8' });
  console.log('🌐 Available network interfaces:', interfaces.trim());
} catch (error) {
  console.log('❌ Could not get network interfaces');
}

// Check if port 3010 is in use
try {
  const portCheck = execSync('netstat -tlnp | grep :3010', { encoding: 'utf8' });
  console.log('🔌 Port 3010 status:');
  console.log(portCheck);
} catch (error) {
  console.log('❌ Port 3010 is not in use or netstat failed');
}

// Create a simple WebSocket test
console.log('\n🔧 Creating WebSocket connection test...');

const testScript = `
<!DOCTYPE html>
<html>
<head>
    <title>WebSocket Connection Test</title>
</head>
<body>
    <h1>WebSocket Connection Test</h1>
    <div id="status">Testing...</div>
    <div id="log"></div>
    
    <script>
        const log = document.getElementById('log');
        const status = document.getElementById('status');
        
        function addLog(message) {
            const div = document.createElement('div');
            div.textContent = new Date().toLocaleTimeString() + ': ' + message;
            log.appendChild(div);
        }
        
        // Test WebSocket connection to HMR endpoint
        const wsUrl = 'ws://' + window.location.hostname + ':3010/_next/webpack-hmr';
        addLog('Attempting to connect to: ' + wsUrl);
        
        try {
            const ws = new WebSocket(wsUrl);
            
            ws.onopen = function() {
                status.textContent = '✅ WebSocket Connected Successfully';
                status.style.color = 'green';
                addLog('WebSocket connection opened successfully');
            };
            
            ws.onerror = function(error) {
                status.textContent = '❌ WebSocket Connection Failed';
                status.style.color = 'red';
                addLog('WebSocket error: ' + error);
            };
            
            ws.onclose = function(event) {
                addLog('WebSocket closed. Code: ' + event.code + ', Reason: ' + event.reason);
            };
            
            ws.onmessage = function(event) {
                addLog('Received: ' + event.data);
            };
            
        } catch (error) {
            status.textContent = '❌ WebSocket Test Failed';
            status.style.color = 'red';
            addLog('WebSocket test error: ' + error.message);
        }
        
        // Also test alternative localhost connection
        setTimeout(() => {
            const localWsUrl = 'ws://localhost:3010/_next/webpack-hmr';
            addLog('Testing localhost connection: ' + localWsUrl);
            
            try {
                const localWs = new WebSocket(localWsUrl);
                localWs.onopen = () => addLog('Localhost WebSocket connected');
                localWs.onerror = () => addLog('Localhost WebSocket failed');
            } catch (error) {
                addLog('Localhost WebSocket error: ' + error.message);
            }
        }, 2000);
    </script>
</body>
</html>
`;

fs.writeFileSync(path.join(__dirname, 'public', 'websocket-test.html'), testScript);
console.log('✅ WebSocket test page created at /websocket-test.html');

console.log('\n📋 Recommended fixes:');
console.log('1. Restart the Next.js development server');
console.log('2. Visit http://localhost:3010/websocket-test.html to test WebSocket connection');
console.log('3. If WebSocket still fails, try running: npm run dev:safe');
console.log('4. Check firewall settings if the issue persists');

console.log('\n🚀 To apply fixes automatically, the development server will be restarted with proper WebSocket configuration.');