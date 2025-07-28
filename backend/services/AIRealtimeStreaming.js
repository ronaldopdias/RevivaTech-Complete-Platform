/**
 * AI Real-time Diagnostic Streaming Service for RevivaTech
 * 
 * WebSocket-based real-time streaming for AI diagnostic analysis
 * - Live progress updates during analysis
 * - Real-time cost estimation streaming
 * - Instant diagnostic results delivery
 * - Multi-client session management
 * 
 * Business Impact: Instant customer feedback, enhanced UX, real-time admin monitoring
 */

const WebSocket = require('ws');
const { EventEmitter } = require('events');

class AIRealtimeStreaming extends EventEmitter {
  constructor(server) {
    super();
    
    this.wss = new WebSocket.Server({ 
      server,
      path: '/ws/ai-diagnostics'
    });
    
    this.sessions = new Map(); // sessionId -> session data
    this.clients = new Map();  // client websocket -> client info
    this.adminClients = new Set(); // admin dashboard clients
    
    this.isInitialized = false;
    
    // Performance metrics
    this.metrics = {
      totalSessions: 0,
      activeSessions: 0,
      connectedClients: 0,
      dataTransferred: 0,
      averageSessionDuration: 0
    };
    
    this.setupWebSocketServer();
  }

  /**
   * Initialize real-time streaming service
   */
  async initialize() {
    try {
      console.log('🔴 Initializing AI Real-time Streaming Service...');
      
      this.isInitialized = true;
      console.log('✅ AI Real-time Streaming Service ready');
      
      return {
        status: 'initialized',
        capabilities: [
          'Live Diagnostic Progress Streaming',
          'Real-time Cost Estimation Updates',
          'Instant Results Delivery',
          'Multi-client Session Management',
          'Admin Dashboard Live Monitoring'
        ],
        websocketEndpoint: '/ws/ai-diagnostics',
        features: {
          progressStreaming: true,
          resultStreaming: true,
          adminMonitoring: true,
          sessionManagement: true
        }
      };
    } catch (error) {
      console.error('❌ AI Real-time Streaming Service initialization failed:', error);
      throw error;
    }
  }

  /**
   * Setup WebSocket server and event handlers
   */
  setupWebSocketServer() {
    this.wss.on('connection', (ws, request) => {
      const clientId = this.generateClientId();
      const clientInfo = {
        id: clientId,
        connectedAt: new Date(),
        lastActivity: new Date(),
        sessionId: null,
        isAdmin: false,
        url: request.url
      };

      this.clients.set(ws, clientInfo);
      this.metrics.connectedClients++;

      console.log(`🔗 Client connected: ${clientId} (Total: ${this.metrics.connectedClients})`);

      // Send welcome message
      this.sendToClient(ws, {
        type: 'connection_established',
        data: {
          clientId,
          timestamp: new Date().toISOString(),
          capabilities: [
            'diagnostic_progress',
            'cost_estimation',
            'results_streaming',
            'session_management'
          ]
        }
      });

      // Handle incoming messages
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          this.handleClientMessage(ws, message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
          this.sendError(ws, 'Invalid message format');
        }
      });

      // Handle client disconnect
      ws.on('close', () => {
        this.handleClientDisconnect(ws);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.handleClientDisconnect(ws);
      });
    });

    console.log('🌐 WebSocket server configured for AI diagnostic streaming');
  }

  /**
   * Handle incoming client messages
   */
  handleClientMessage(ws, message) {
    const clientInfo = this.clients.get(ws);
    if (!clientInfo) return;

    clientInfo.lastActivity = new Date();

    switch (message.type) {
      case 'join_session':
        this.handleJoinSession(ws, message.data);
        break;
      
      case 'start_analysis':
        this.handleStartAnalysis(ws, message.data);
        break;
      
      case 'admin_subscribe':
        this.handleAdminSubscribe(ws, message.data);
        break;
      
      case 'get_session_status':
        this.handleGetSessionStatus(ws, message.data);
        break;
      
      case 'ping':
        this.sendToClient(ws, { type: 'pong', timestamp: new Date().toISOString() });
        break;
      
      default:
        this.sendError(ws, `Unknown message type: ${message.type}`);
    }
  }

  /**
   * Handle client joining a diagnostic session
   */
  handleJoinSession(ws, data) {
    const { sessionId } = data;
    const clientInfo = this.clients.get(ws);
    
    if (!sessionId) {
      this.sendError(ws, 'Session ID required');
      return;
    }

    clientInfo.sessionId = sessionId;
    
    // Create session if it doesn't exist
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, {
        id: sessionId,
        startTime: new Date(),
        status: 'waiting',
        progress: 0,
        clients: new Set(),
        analysisSteps: [],
        results: null
      });
      this.metrics.totalSessions++;
      this.metrics.activeSessions++;
    }

    const session = this.sessions.get(sessionId);
    session.clients.add(ws);

    this.sendToClient(ws, {
      type: 'session_joined',
      data: {
        sessionId,
        status: session.status,
        progress: session.progress,
        timestamp: new Date().toISOString()
      }
    });

    // Notify admin clients
    this.broadcastToAdmins({
      type: 'session_update',
      data: {
        sessionId,
        action: 'client_joined',
        clientCount: session.clients.size,
        timestamp: new Date().toISOString()
      }
    });

    console.log(`👤 Client joined session ${sessionId}`);
  }

  /**
   * Handle analysis start request
   */
  handleStartAnalysis(ws, data) {
    const clientInfo = this.clients.get(ws);
    const sessionId = clientInfo?.sessionId;
    
    if (!sessionId) {
      this.sendError(ws, 'No active session');
      return;
    }

    const session = this.sessions.get(sessionId);
    if (!session) {
      this.sendError(ws, 'Session not found');
      return;
    }

    // Start analysis simulation
    this.startAnalysisSimulation(sessionId, data);
  }

  /**
   * Handle admin dashboard subscription
   */
  handleAdminSubscribe(ws, data) {
    const clientInfo = this.clients.get(ws);
    clientInfo.isAdmin = true;
    this.adminClients.add(ws);

    this.sendToClient(ws, {
      type: 'admin_subscribed',
      data: {
        totalSessions: this.metrics.totalSessions,
        activeSessions: this.metrics.activeSessions,
        connectedClients: this.metrics.connectedClients,
        timestamp: new Date().toISOString()
      }
    });

    console.log('👨‍💼 Admin client subscribed to live monitoring');
  }

  /**
   * Start analysis simulation with real-time updates
   */
  async startAnalysisSimulation(sessionId, analysisData) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.status = 'analyzing';
    session.analysisData = analysisData;

    const analysisSteps = [
      { step: 'image_preprocessing', name: 'Image Preprocessing', duration: 1000 },
      { step: 'computer_vision', name: 'Computer Vision Analysis', duration: 2000 },
      { step: 'damage_detection', name: 'Damage Detection', duration: 1500 },
      { step: 'cost_estimation', name: 'ML Cost Estimation', duration: 1000 },
      { step: 'documentation', name: 'Documentation Generation', duration: 800 },
      { step: 'finalization', name: 'Results Finalization', duration: 500 }
    ];

    // Broadcast analysis start
    this.broadcastToSession(sessionId, {
      type: 'analysis_started',
      data: {
        sessionId,
        steps: analysisSteps.map(s => s.name),
        estimatedDuration: analysisSteps.reduce((sum, s) => sum + s.duration, 0),
        timestamp: new Date().toISOString()
      }
    });

    // Execute analysis steps with real-time updates
    let currentProgress = 0;
    const totalSteps = analysisSteps.length;

    for (let i = 0; i < analysisSteps.length; i++) {
      const step = analysisSteps[i];
      
      // Update progress
      currentProgress = Math.round(((i + 0.5) / totalSteps) * 100);
      session.progress = currentProgress;

      // Broadcast step start
      this.broadcastToSession(sessionId, {
        type: 'analysis_progress',
        data: {
          sessionId,
          currentStep: step.name,
          stepIndex: i,
          totalSteps,
          progress: currentProgress,
          timestamp: new Date().toISOString()
        }
      });

      // Simulate step processing time
      await this.sleep(step.duration);

      // Broadcast step completion
      this.broadcastToSession(sessionId, {
        type: 'step_completed',
        data: {
          sessionId,
          completedStep: step.name,
          stepIndex: i,
          timestamp: new Date().toISOString()
        }
      });

      // Stream intermediate results for certain steps
      if (step.step === 'damage_detection') {
        this.streamIntermediateResults(sessionId, 'damage_detection', {
          detectedIssues: 3,
          severity: 'medium',
          confidence: 0.87
        });
      } else if (step.step === 'cost_estimation') {
        this.streamIntermediateResults(sessionId, 'cost_estimation', {
          estimatedCost: Math.round(150 + Math.random() * 200),
          currency: 'GBP',
          confidence: 0.91
        });
      }
    }

    // Complete analysis
    await this.completeAnalysis(sessionId);
  }

  /**
   * Stream intermediate results during analysis
   */
  streamIntermediateResults(sessionId, resultType, results) {
    this.broadcastToSession(sessionId, {
      type: 'intermediate_results',
      data: {
        sessionId,
        resultType,
        results,
        timestamp: new Date().toISOString()
      }
    });

    // Notify admin clients
    this.broadcastToAdmins({
      type: 'session_intermediate_results',
      data: {
        sessionId,
        resultType,
        results,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Complete analysis and send final results
   */
  async completeAnalysis(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.status = 'completed';
    session.progress = 100;
    session.completedAt = new Date();

    // Generate mock final results
    const finalResults = {
      sessionId,
      summary: {
        totalIssuesFound: Math.floor(Math.random() * 3) + 1,
        overallCondition: 'fair',
        repairability: 'repairable',
        estimatedCost: Math.round(150 + Math.random() * 200),
        confidence: 0.92,
        urgency: 'medium'
      },
      visionAnalysis: {
        imagesAnalyzed: session.analysisData?.imageCount || 2,
        damageDetected: true,
        confidence: 0.89
      },
      costEstimation: {
        parts: Math.round(80 + Math.random() * 120),
        labor: Math.round(60 + Math.random() * 90),
        total: Math.round(150 + Math.random() * 200),
        currency: 'GBP'
      },
      documentation: {
        reportGenerated: true,
        pagesCount: 8,
        sectionsCount: 6
      },
      processingTime: Date.now() - session.startTime.getTime(),
      timestamp: new Date().toISOString()
    };

    session.results = finalResults;

    // Broadcast final results
    this.broadcastToSession(sessionId, {
      type: 'analysis_completed',
      data: finalResults
    });

    // Notify admin clients
    this.broadcastToAdmins({
      type: 'session_completed',
      data: {
        sessionId,
        duration: finalResults.processingTime,
        results: finalResults.summary,
        timestamp: new Date().toISOString()
      }
    });

    // Update metrics
    this.metrics.activeSessions--;
    this.updateSessionMetrics(session);

    console.log(`✅ Analysis completed for session ${sessionId}`);
  }

  /**
   * Broadcast message to all clients in a session
   */
  broadcastToSession(sessionId, message) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.clients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        this.sendToClient(ws, message);
      }
    });
  }

  /**
   * Broadcast message to all admin clients
   */
  broadcastToAdmins(message) {
    this.adminClients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        this.sendToClient(ws, message);
      }
    });
  }

  /**
   * Send message to specific client
   */
  sendToClient(ws, message) {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message));
        this.metrics.dataTransferred += JSON.stringify(message).length;
      } catch (error) {
        console.error('Failed to send message to client:', error);
      }
    }
  }

  /**
   * Send error message to client
   */
  sendError(ws, error) {
    this.sendToClient(ws, {
      type: 'error',
      data: {
        message: error,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Handle client disconnect
   */
  handleClientDisconnect(ws) {
    const clientInfo = this.clients.get(ws);
    if (!clientInfo) return;

    // Remove from session
    if (clientInfo.sessionId) {
      const session = this.sessions.get(clientInfo.sessionId);
      if (session) {
        session.clients.delete(ws);
        
        // Notify remaining clients
        if (session.clients.size > 0) {
          this.broadcastToSession(clientInfo.sessionId, {
            type: 'client_disconnected',
            data: {
              clientId: clientInfo.id,
              remainingClients: session.clients.size,
              timestamp: new Date().toISOString()
            }
          });
        }
      }
    }

    // Remove from admin clients
    if (clientInfo.isAdmin) {
      this.adminClients.delete(ws);
    }

    // Clean up
    this.clients.delete(ws);
    this.metrics.connectedClients--;

    console.log(`🔌 Client disconnected: ${clientInfo.id} (Total: ${this.metrics.connectedClients})`);
  }

  /**
   * Utility methods
   */

  generateClientId() {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  updateSessionMetrics(session) {
    const duration = session.completedAt.getTime() - session.startTime.getTime();
    this.metrics.averageSessionDuration = 
      (this.metrics.averageSessionDuration + duration) / 2;
  }

  /**
   * Get current streaming metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      activeSessions: this.sessions.size,
      connectedClients: this.clients.size,
      adminClients: this.adminClients.size,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Handle session status request
   */
  handleGetSessionStatus(ws, data) {
    const { sessionId } = data;
    const session = this.sessions.get(sessionId);

    if (!session) {
      this.sendError(ws, 'Session not found');
      return;
    }

    this.sendToClient(ws, {
      type: 'session_status',
      data: {
        sessionId,
        status: session.status,
        progress: session.progress,
        startTime: session.startTime,
        completedAt: session.completedAt,
        clientCount: session.clients.size,
        results: session.results,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions() {
    const now = new Date();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    this.sessions.forEach((session, sessionId) => {
      const age = now.getTime() - session.startTime.getTime();
      if (age > maxAge && session.clients.size === 0) {
        this.sessions.delete(sessionId);
        console.log(`🧹 Cleaned up expired session: ${sessionId}`);
      }
    });
  }

  /**
   * Start periodic cleanup
   */
  startPeriodicCleanup() {
    setInterval(() => {
      this.cleanupExpiredSessions();
    }, 60 * 60 * 1000); // Run every hour
  }

  /**
   * Health check for monitoring
   */
  async healthCheck() {
    return {
      status: this.isInitialized ? 'operational' : 'initializing',
      websocketServer: {
        listening: this.wss.listening || false,
        clientsConnected: this.metrics.connectedClients,
        activeSessions: this.metrics.activeSessions
      },
      metrics: this.getMetrics(),
      capabilities: {
        realtimeStreaming: true,
        sessionManagement: true,
        adminMonitoring: true,
        progressUpdates: true
      }
    };
  }
}

module.exports = AIRealtimeStreaming;