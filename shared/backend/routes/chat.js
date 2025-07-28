const express = require('express');
const router = express.Router();

// This route file handles REST API endpoints for chat
// The real-time chat functionality is handled by ChatService

// =========================
// CHAT ROOM MANAGEMENT
// =========================

// Create support ticket (chat room)
router.post('/support/create', async (req, res) => {
  try {
    const chatService = req.app.locals.chatService;
    
    if (!chatService) {
      return res.status(500).json({
        success: false,
        error: 'Chat service not initialized'
      });
    }

    const { customerId, issue, priority = 'normal' } = req.body;

    if (!customerId || !issue) {
      return res.status(400).json({
        success: false,
        error: 'customerId and issue are required'
      });
    }

    const result = await chatService.createSupportTicket(customerId, issue, priority);
    
    res.json({
      success: true,
      data: result,
      message: 'Support ticket created successfully'
    });
  } catch (error) {
    console.error('❌ Support ticket creation failed:', error);
    res.status(400).json({
      success: false,
      error: error.message,
      message: 'Failed to create support ticket'
    });
  }
});

// Assign agent to chat room
router.post('/support/assign', async (req, res) => {
  try {
    const chatService = req.app.locals.chatService;
    
    if (!chatService) {
      return res.status(500).json({
        success: false,
        error: 'Chat service not initialized'
      });
    }

    const { agentId, roomId } = req.body;

    if (!agentId || !roomId) {
      return res.status(400).json({
        success: false,
        error: 'agentId and roomId are required'
      });
    }

    const result = await chatService.assignAgentToRoom(agentId, roomId);
    
    res.json({
      success: true,
      data: result,
      message: 'Agent assigned to room successfully'
    });
  } catch (error) {
    console.error('❌ Agent assignment failed:', error);
    res.status(400).json({
      success: false,
      error: error.message,
      message: 'Failed to assign agent to room'
    });
  }
});

// Get room information
router.get('/room/:roomId', async (req, res) => {
  try {
    const chatService = req.app.locals.chatService;
    
    if (!chatService) {
      return res.status(500).json({
        success: false,
        error: 'Chat service not initialized'
      });
    }

    const { roomId } = req.params;
    const room = chatService.getRoomInfo(roomId);

    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found'
      });
    }

    // Convert participants Map to array for JSON response
    const roomData = {
      ...room,
      participants: Array.from(room.participants.entries()).map(([userId, data]) => ({
        userId,
        ...data
      }))
    };
    
    res.json({
      success: true,
      data: roomData,
      message: 'Room information retrieved'
    });
  } catch (error) {
    console.error('❌ Get room info failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to retrieve room information'
    });
  }
});

// Get room messages
router.get('/room/:roomId/messages', async (req, res) => {
  try {
    const chatService = req.app.locals.chatService;
    
    if (!chatService) {
      return res.status(500).json({
        success: false,
        error: 'Chat service not initialized'
      });
    }

    const { roomId } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    const messages = await chatService.getRoomMessages(roomId, limit);
    
    res.json({
      success: true,
      data: {
        messages,
        count: messages.length
      },
      message: 'Room messages retrieved'
    });
  } catch (error) {
    console.error('❌ Get room messages failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to retrieve room messages'
    });
  }
});

// =========================
// USER MANAGEMENT
// =========================

// Get user chat session
router.get('/user/:userId/session', async (req, res) => {
  try {
    const chatService = req.app.locals.chatService;
    
    if (!chatService) {
      return res.status(500).json({
        success: false,
        error: 'Chat service not initialized'
      });
    }

    const { userId } = req.params;
    const session = chatService.getUserSession(userId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'User session not found'
      });
    }
    
    res.json({
      success: true,
      data: session,
      message: 'User session retrieved'
    });
  } catch (error) {
    console.error('❌ Get user session failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to retrieve user session'
    });
  }
});

// =========================
// ADMIN ENDPOINTS
// =========================

// Get all active rooms
router.get('/admin/rooms', async (req, res) => {
  try {
    const chatService = req.app.locals.chatService;
    
    if (!chatService) {
      return res.status(500).json({
        success: false,
        error: 'Chat service not initialized'
      });
    }

    const activeRooms = chatService.getActiveRooms();
    
    // Convert participants Maps to arrays for JSON response
    const roomsData = activeRooms.map(room => ({
      ...room,
      participants: Array.from(room.participants.entries()).map(([userId, data]) => ({
        userId,
        ...data
      }))
    }));
    
    res.json({
      success: true,
      data: {
        rooms: roomsData,
        count: roomsData.length
      },
      message: 'Active rooms retrieved'
    });
  } catch (error) {
    console.error('❌ Get active rooms failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to retrieve active rooms'
    });
  }
});

// Get chat metrics
router.get('/admin/metrics', async (req, res) => {
  try {
    const chatService = req.app.locals.chatService;
    
    if (!chatService) {
      return res.status(500).json({
        success: false,
        error: 'Chat service not initialized'
      });
    }

    const metrics = chatService.getMetrics();
    
    res.json({
      success: true,
      data: metrics,
      message: 'Chat metrics retrieved'
    });
  } catch (error) {
    console.error('❌ Get chat metrics failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to retrieve chat metrics'
    });
  }
});

// =========================
// FILE HANDLING
// =========================

// Serve chat files (implement proper file serving in production)
router.get('/files/:fileId/:fileName', async (req, res) => {
  try {
    const { fileId, fileName } = req.params;
    
    // In production, retrieve file from cloud storage
    // For now, just return a placeholder response
    res.json({
      success: false,
      error: 'File serving not implemented in demo mode',
      message: 'This would serve the actual file in production'
    });
  } catch (error) {
    console.error('❌ File serving failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to serve file'
    });
  }
});

// =========================
// BUSINESS INTEGRATION
// =========================

// Create chat room for repair consultation
router.post('/repair/consultation', async (req, res) => {
  try {
    const chatService = req.app.locals.chatService;
    
    if (!chatService) {
      return res.status(500).json({
        success: false,
        error: 'Chat service not initialized'
      });
    }

    const { customerId, repairId, deviceInfo } = req.body;

    if (!customerId || !repairId) {
      return res.status(400).json({
        success: false,
        error: 'customerId and repairId are required'
      });
    }

    const issue = `Repair consultation for ${deviceInfo?.brand || 'device'} ${deviceInfo?.model || ''} (Repair ID: ${repairId})`;
    const result = await chatService.createSupportTicket(customerId, issue, 'normal');
    
    res.json({
      success: true,
      data: {
        ...result,
        repairId,
        consultationType: 'repair'
      },
      message: 'Repair consultation chat created'
    });
  } catch (error) {
    console.error('❌ Repair consultation creation failed:', error);
    res.status(400).json({
      success: false,
      error: error.message,
      message: 'Failed to create repair consultation chat'
    });
  }
});

// Create chat room for booking support
router.post('/booking/support', async (req, res) => {
  try {
    const chatService = req.app.locals.chatService;
    
    if (!chatService) {
      return res.status(500).json({
        success: false,
        error: 'Chat service not initialized'
      });
    }

    const { customerId, bookingId, issue } = req.body;

    if (!customerId || !bookingId) {
      return res.status(400).json({
        success: false,
        error: 'customerId and bookingId are required'
      });
    }

    const supportIssue = issue || `Booking support for booking ID: ${bookingId}`;
    const result = await chatService.createSupportTicket(customerId, supportIssue, 'high');
    
    res.json({
      success: true,
      data: {
        ...result,
        bookingId,
        consultationType: 'booking'
      },
      message: 'Booking support chat created'
    });
  } catch (error) {
    console.error('❌ Booking support creation failed:', error);
    res.status(400).json({
      success: false,
      error: error.message,
      message: 'Failed to create booking support chat'
    });
  }
});

// =========================
// MAINTENANCE ENDPOINTS
// =========================

// Clean up expired messages
router.post('/admin/maintenance/cleanup-messages', async (req, res) => {
  try {
    const chatService = req.app.locals.chatService;
    
    if (!chatService) {
      return res.status(500).json({
        success: false,
        error: 'Chat service not initialized'
      });
    }

    const cleanedCount = chatService.cleanupExpiredMessages();
    
    res.json({
      success: true,
      data: { cleanedCount },
      message: `Cleaned up ${cleanedCount} expired messages`
    });
  } catch (error) {
    console.error('❌ Message cleanup failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to cleanup expired messages'
    });
  }
});

// Clean up inactive rooms
router.post('/admin/maintenance/cleanup-rooms', async (req, res) => {
  try {
    const chatService = req.app.locals.chatService;
    
    if (!chatService) {
      return res.status(500).json({
        success: false,
        error: 'Chat service not initialized'
      });
    }

    const cleanedCount = chatService.cleanupInactiveRooms();
    
    res.json({
      success: true,
      data: { cleanedCount },
      message: `Cleaned up ${cleanedCount} inactive rooms`
    });
  } catch (error) {
    console.error('❌ Room cleanup failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to cleanup inactive rooms'
    });
  }
});

// =========================
// HEALTH CHECK
// =========================

// Health check
router.get('/health', async (req, res) => {
  try {
    const chatService = req.app.locals.chatService;
    
    if (!chatService) {
      return res.status(500).json({
        success: false,
        error: 'Chat service not initialized'
      });
    }

    const health = chatService.healthCheck();
    
    res.json({
      success: true,
      data: health,
      message: 'Chat service health check completed'
    });
  } catch (error) {
    console.error('❌ Chat health check failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Chat health check failed'
    });
  }
});

module.exports = router;