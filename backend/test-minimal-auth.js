#!/usr/bin/env node
/**
 * Minimal Better Auth Server Test
 * Tests if Better Auth can be mounted and accessed independently
 */

const express = require('express');
const { toNodeHandler } = require("better-auth/node");

console.log('🔧 Starting minimal Better Auth test server...');

const app = express();

try {
  console.log('📦 Loading Better Auth server configuration...');
  const auth = require('./lib/better-auth-server');
  console.log('✅ Better Auth config loaded');
  
  console.log('🔧 Creating Better Auth node handler...');
  const handler = toNodeHandler(auth);
  console.log('✅ Better Auth handler created');
  
  console.log('🔧 Mounting Better Auth at /api/auth...');
  app.use("/api/auth", handler);
  console.log('✅ Better Auth mounted');
  
  // Test endpoint
  app.get('/test', (req, res) => {
    res.json({ status: 'ok', message: 'Test server running' });
  });
  
  const PORT = 3012;
  app.listen(PORT, () => {
    console.log(`🚀 Test server running on port ${PORT}`);
    console.log(`📍 Better Auth available at http://localhost:${PORT}/api/auth/`);
    console.log(`📍 Test endpoint at http://localhost:${PORT}/test`);
  });
  
} catch (error) {
  console.error('❌ Error starting test server:', error.message);
  console.error('Stack:', error.stack);
}