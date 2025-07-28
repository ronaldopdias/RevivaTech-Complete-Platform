// Analytics Route Patch
// Add this to the existing server.js file

// Import analytics routes
const { router: analyticsRoutes, setupWebSocketServer } = require('./routes/analytics');

// Add analytics middleware and routes
app.use('/api/analytics', (req, res, next) => {
  req.pool = pool;
  req.logger = logger;
  req.app = app;
  next();
}, analyticsRoutes);

// Setup Analytics WebSocket Server
const { wss: analyticsWss, clients: analyticsClients } = setupWebSocketServer(server);
app.locals.analyticsWss = analyticsWss;
app.locals.wsClients = analyticsClients;

// Add analytics emit function
const emitAnalyticsUpdate = (data) => {
  io.to('analytics:realtime').emit('analytics:updated', data);
};

// Add to websocket exports
if (app.locals.websocket) {
  app.locals.websocket.emitAnalyticsUpdate = emitAnalyticsUpdate;
}

logger.info('Analytics routes and WebSocket server initialized');