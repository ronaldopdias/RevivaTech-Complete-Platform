const express = require('express');
const router = express.Router();

// WebSocket health check
router.get('/health', (req, res) => {
  const io = req.app.locals.io;
  
  if (!io) {
    return res.status(503).json({
      status: 'unhealthy',
      error: 'WebSocket server not initialized'
    });
  }
  
  const sockets = io.sockets.sockets;
  const connectedClients = sockets.size;
  
  res.json({
    status: 'healthy',
    connectedClients,
    engine: io.engine.transport,
    timestamp: new Date().toISOString()
  });
});

// WebSocket test endpoint
router.post('/test', (req, res) => {
  const { event, data, room } = req.body;
  const io = req.app.locals.io;
  
  if (!io) {
    return res.status(503).json({
      success: false,
      error: 'WebSocket server not initialized'
    });
  }
  
  try {
    if (room) {
      io.to(room).emit(event || 'test', data || { message: 'Test broadcast' });
    } else {
      io.emit(event || 'test', data || { message: 'Test broadcast' });
    }
    
    res.json({
      success: true,
      message: 'WebSocket event emitted',
      event: event || 'test',
      data: data || { message: 'Test broadcast' },
      room: room || 'all'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;