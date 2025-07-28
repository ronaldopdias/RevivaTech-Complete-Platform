const EventEmitter = require('events');

class ChatService extends EventEmitter {
  constructor(io, options = {}) {
    super();
    this.io = io;
    this.options = {
      enablePersistence: true,
      maxMessagesPerRoom: 1000,
      messageTTL: 30 * 24 * 60 * 60 * 1000, // 30 days
      enableFileSharing: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      enableTypingIndicators: true,
      enableReadReceipts: true,
      rateLimiting: {
        enabled: true,
        maxMessagesPerMinute: 30,
        maxMessagesPerHour: 500
      },
      ...options
    };

    this.chatRooms = new Map(); // Room ID -> Room data
    this.userSessions = new Map(); // User ID -> Session data
    this.messages = new Map(); // Room ID -> Messages array
    this.rateLimiter = new Map(); // User ID -> Rate limit data
    
    // Metrics
    this.metrics = {
      totalRooms: 0,
      activeRooms: 0,
      messagesSent: 0,
      filesShared: 0,
      activeUsers: 0,
      averageResponseTime: 0,
      errors: []
    };

    this.setupSocketListeners();
  }

  setupSocketListeners() {
    this.io.on('connection', (socket) => {
      console.log(`💬 New chat connection: ${socket.id}`);

      // Handle user joining chat
      socket.on('chat:join', async (data) => {
        try {
          const { userId, userType, roomId, userInfo } = data;
          
          // Validate user and room
          const room = await this.joinRoom(userId, userType, roomId, userInfo);
          
          // Join socket room
          socket.join(roomId);
          socket.userId = userId;
          socket.userType = userType;
          socket.roomId = roomId;
          
          // Track user session
          this.userSessions.set(userId, {
            socketId: socket.id,
            roomId,
            userType,
            joinedAt: Date.now(),
            lastActivity: Date.now()
          });
          
          // Send room data to user
          socket.emit('chat:joined', {
            success: true,
            room,
            messages: await this.getRoomMessages(roomId),
            timestamp: Date.now()
          });
          
          // Notify others in room
          socket.to(roomId).emit('chat:user_joined', {
            userId,
            userType,
            userInfo,
            timestamp: Date.now()
          });
          
          console.log(`💬 User ${userId} joined room ${roomId}`);
        } catch (error) {
          console.error('❌ Chat join failed:', error);
          socket.emit('chat:error', {
            error: error.message,
            action: 'join'
          });
        }
      });

      // Handle sending messages
      socket.on('chat:message', async (data) => {
        try {
          const { message, type = 'text', metadata = {} } = data;
          
          if (!socket.userId || !socket.roomId) {
            throw new Error('User not authenticated or not in a room');
          }
          
          // Check rate limiting
          if (!this.checkRateLimit(socket.userId)) {
            throw new Error('Rate limit exceeded');
          }
          
          // Create message object
          const messageObj = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            roomId: socket.roomId,
            userId: socket.userId,
            userType: socket.userType,
            message,
            type,
            metadata,
            timestamp: Date.now(),
            readBy: new Set([socket.userId]) // Sender has read it
          };
          
          // Store message
          await this.storeMessage(messageObj);
          
          // Broadcast to room
          this.io.to(socket.roomId).emit('chat:message', {
            id: messageObj.id,
            userId: messageObj.userId,
            userType: messageObj.userType,
            message: messageObj.message,
            type: messageObj.type,
            metadata: messageObj.metadata,
            timestamp: messageObj.timestamp
          });
          
          // Update metrics
          this.metrics.messagesSent++;
          
          // Emit message sent event
          this.emit('messageSent', {
            messageId: messageObj.id,
            roomId: socket.roomId,
            userId: socket.userId,
            type: messageObj.type
          });
          
          console.log(`💬 Message sent in room ${socket.roomId} by user ${socket.userId}`);
        } catch (error) {
          console.error('❌ Message send failed:', error);
          socket.emit('chat:error', {
            error: error.message,
            action: 'send_message'
          });
        }
      });

      // Handle typing indicators
      socket.on('chat:typing', (data) => {
        if (socket.userId && socket.roomId) {
          socket.to(socket.roomId).emit('chat:typing', {
            userId: socket.userId,
            userType: socket.userType,
            isTyping: data.isTyping,
            timestamp: Date.now()
          });
        }
      });

      // Handle read receipts
      socket.on('chat:mark_read', async (data) => {
        try {
          const { messageIds } = data;
          
          if (!socket.userId || !socket.roomId) {
            return;
          }
          
          await this.markMessagesAsRead(socket.roomId, messageIds, socket.userId);
          
          // Notify others about read status
          socket.to(socket.roomId).emit('chat:messages_read', {
            userId: socket.userId,
            messageIds,
            timestamp: Date.now()
          });
        } catch (error) {
          console.error('❌ Mark read failed:', error);
        }
      });

      // Handle file sharing
      socket.on('chat:file', async (data) => {
        try {
          const { fileName, fileSize, fileType, fileData } = data;
          
          if (!socket.userId || !socket.roomId) {
            throw new Error('User not authenticated or not in a room');
          }
          
          if (!this.options.enableFileSharing) {
            throw new Error('File sharing is disabled');
          }
          
          if (fileSize > this.options.maxFileSize) {
            throw new Error('File size exceeds maximum allowed size');
          }
          
          // Store file (in production, use cloud storage)
          const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const fileUrl = await this.storeFile(fileId, fileName, fileData);
          
          // Create file message
          const messageObj = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            roomId: socket.roomId,
            userId: socket.userId,
            userType: socket.userType,
            message: fileName,
            type: 'file',
            metadata: {
              fileId,
              fileName,
              fileSize,
              fileType,
              fileUrl
            },
            timestamp: Date.now(),
            readBy: new Set([socket.userId])
          };
          
          // Store message
          await this.storeMessage(messageObj);
          
          // Broadcast to room
          this.io.to(socket.roomId).emit('chat:message', {
            id: messageObj.id,
            userId: messageObj.userId,
            userType: messageObj.userType,
            message: messageObj.message,
            type: messageObj.type,
            metadata: messageObj.metadata,
            timestamp: messageObj.timestamp
          });
          
          // Update metrics
          this.metrics.filesShared++;
          
          console.log(`📁 File shared in room ${socket.roomId}: ${fileName}`);
        } catch (error) {
          console.error('❌ File share failed:', error);
          socket.emit('chat:error', {
            error: error.message,
            action: 'file_share'
          });
        }
      });

      // Handle leaving room
      socket.on('chat:leave', async () => {
        await this.handleUserLeave(socket);
      });

      // Handle disconnect
      socket.on('disconnect', async () => {
        await this.handleUserLeave(socket);
        console.log(`💬 Chat disconnected: ${socket.id}`);
      });
    });
  }

  async joinRoom(userId, userType, roomId, userInfo) {
    // Create room if it doesn't exist
    if (!this.chatRooms.has(roomId)) {
      const room = {
        id: roomId,
        name: `Chat Room ${roomId}`,
        type: this.determineRoomType(userType),
        createdAt: Date.now(),
        participants: new Map(),
        isActive: true,
        metadata: {}
      };
      
      this.chatRooms.set(roomId, room);
      this.messages.set(roomId, []);
      this.metrics.totalRooms++;
    }
    
    const room = this.chatRooms.get(roomId);
    
    // Add user to room participants
    room.participants.set(userId, {
      userId,
      userType,
      userInfo,
      joinedAt: Date.now(),
      lastActivity: Date.now()
    });
    
    // Update active room count
    this.updateActiveRoomCount();
    
    return room;
  }

  determineRoomType(userType) {
    // Determine room type based on participants
    if (userType === 'admin' || userType === 'support') {
      return 'support';
    } else {
      return 'customer_support';
    }
  }

  async storeMessage(messageObj) {
    if (!this.options.enablePersistence) {
      return;
    }
    
    if (!this.messages.has(messageObj.roomId)) {
      this.messages.set(messageObj.roomId, []);
    }
    
    const roomMessages = this.messages.get(messageObj.roomId);
    roomMessages.push(messageObj);
    
    // Keep only the latest messages
    if (roomMessages.length > this.options.maxMessagesPerRoom) {
      roomMessages.splice(0, roomMessages.length - this.options.maxMessagesPerRoom);
    }
    
    // Clean up expired messages
    const now = Date.now();
    const validMessages = roomMessages.filter(m => (now - m.timestamp) < this.options.messageTTL);
    this.messages.set(messageObj.roomId, validMessages);
  }

  async storeFile(fileId, fileName, fileData) {
    // In production, upload to cloud storage (S3, etc.)
    // For now, just return a mock URL
    const fileUrl = `/api/chat/files/${fileId}/${encodeURIComponent(fileName)}`;
    
    // Store file metadata (implement actual file storage)
    console.log(`📁 File stored: ${fileId} (${fileName})`);
    
    return fileUrl;
  }

  async getRoomMessages(roomId, limit = 50) {
    if (!this.messages.has(roomId)) {
      return [];
    }
    
    const roomMessages = this.messages.get(roomId);
    
    // Return latest messages
    return roomMessages.slice(-limit).map(msg => ({
      id: msg.id,
      userId: msg.userId,
      userType: msg.userType,
      message: msg.message,
      type: msg.type,
      metadata: msg.metadata,
      timestamp: msg.timestamp,
      readCount: msg.readBy.size
    }));
  }

  async markMessagesAsRead(roomId, messageIds, userId) {
    if (!this.messages.has(roomId)) {
      return;
    }
    
    const roomMessages = this.messages.get(roomId);
    
    messageIds.forEach(messageId => {
      const message = roomMessages.find(m => m.id === messageId);
      if (message) {
        message.readBy.add(userId);
      }
    });
  }

  checkRateLimit(userId) {
    if (!this.options.rateLimiting.enabled) {
      return true;
    }
    
    const now = Date.now();
    const oneMinute = 60 * 1000;
    const oneHour = 60 * 60 * 1000;
    
    if (!this.rateLimiter.has(userId)) {
      this.rateLimiter.set(userId, {
        minuteCount: 0,
        hourCount: 0,
        lastMinute: now,
        lastHour: now
      });
    }
    
    const limits = this.rateLimiter.get(userId);
    
    // Reset counters if time has passed
    if (now - limits.lastMinute >= oneMinute) {
      limits.minuteCount = 0;
      limits.lastMinute = now;
    }
    
    if (now - limits.lastHour >= oneHour) {
      limits.hourCount = 0;
      limits.lastHour = now;
    }
    
    // Check limits
    if (limits.minuteCount >= this.options.rateLimiting.maxMessagesPerMinute) {
      return false;
    }
    
    if (limits.hourCount >= this.options.rateLimiting.maxMessagesPerHour) {
      return false;
    }
    
    // Increment counters
    limits.minuteCount++;
    limits.hourCount++;
    
    return true;
  }

  async handleUserLeave(socket) {
    if (socket.userId && socket.roomId) {
      const room = this.chatRooms.get(socket.roomId);
      
      if (room) {
        // Remove user from room
        room.participants.delete(socket.userId);
        
        // Notify others in room
        socket.to(socket.roomId).emit('chat:user_left', {
          userId: socket.userId,
          timestamp: Date.now()
        });
        
        // Clean up empty rooms
        if (room.participants.size === 0) {
          room.isActive = false;
        }
      }
      
      // Remove user session
      this.userSessions.delete(socket.userId);
      
      // Update active room count
      this.updateActiveRoomCount();
      
      console.log(`💬 User ${socket.userId} left room ${socket.roomId}`);
    }
  }

  updateActiveRoomCount() {
    this.metrics.activeRooms = Array.from(this.chatRooms.values())
      .filter(room => room.isActive && room.participants.size > 0).length;
    
    this.metrics.activeUsers = this.userSessions.size;
  }

  // Business methods
  async createSupportTicket(customerId, issue, priority = 'normal') {
    const roomId = `support_${customerId}_${Date.now()}`;
    
    // Create support room
    const room = await this.joinRoom(customerId, 'customer', roomId, {
      issue,
      priority,
      status: 'open'
    });
    
    // Send initial support message
    const welcomeMessage = {
      id: `msg_${Date.now()}_system`,
      roomId,
      userId: 'system',
      userType: 'system',
      message: `Hello! Thank you for contacting RevivaTech support. We'll be with you shortly to help with: ${issue}`,
      type: 'text',
      metadata: { isSystemMessage: true },
      timestamp: Date.now(),
      readBy: new Set(['system'])
    };
    
    await this.storeMessage(welcomeMessage);
    
    // Emit to support agents
    this.io.to('support_agents').emit('chat:new_ticket', {
      roomId,
      customerId,
      issue,
      priority,
      timestamp: Date.now()
    });
    
    return { roomId, room };
  }

  async assignAgentToRoom(agentId, roomId) {
    const room = this.chatRooms.get(roomId);
    
    if (!room) {
      throw new Error('Room not found');
    }
    
    // Add agent to room
    await this.joinRoom(agentId, 'support', roomId, {
      role: 'support_agent'
    });
    
    // Send assignment message
    const assignmentMessage = {
      id: `msg_${Date.now()}_system`,
      roomId,
      userId: 'system',
      userType: 'system',
      message: `Support agent has joined the chat and will assist you shortly.`,
      type: 'text',
      metadata: { isSystemMessage: true, agentId },
      timestamp: Date.now(),
      readBy: new Set(['system'])
    };
    
    await this.storeMessage(assignmentMessage);
    
    // Notify room participants
    this.io.to(roomId).emit('chat:agent_assigned', {
      agentId,
      timestamp: Date.now()
    });
    
    return { success: true };
  }

  // Analytics and monitoring
  getMetrics() {
    return {
      ...this.metrics,
      totalStoredMessages: Array.from(this.messages.values())
        .reduce((sum, messages) => sum + messages.length, 0),
      rateLimiterEntries: this.rateLimiter.size
    };
  }

  getRoomInfo(roomId) {
    return this.chatRooms.get(roomId);
  }

  getUserSession(userId) {
    return this.userSessions.get(userId);
  }

  getActiveRooms() {
    return Array.from(this.chatRooms.values())
      .filter(room => room.isActive && room.participants.size > 0);
  }

  // Maintenance methods
  cleanupExpiredMessages() {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [roomId, messages] of this.messages.entries()) {
      const validMessages = messages.filter(m => (now - m.timestamp) < this.options.messageTTL);
      
      if (validMessages.length !== messages.length) {
        cleanedCount += messages.length - validMessages.length;
        this.messages.set(roomId, validMessages);
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} expired chat messages`);
    }
    
    return cleanedCount;
  }

  cleanupInactiveRooms() {
    const now = Date.now();
    const inactivityThreshold = 24 * 60 * 60 * 1000; // 24 hours
    let cleanedCount = 0;
    
    for (const [roomId, room] of this.chatRooms.entries()) {
      if (!room.isActive || room.participants.size === 0) {
        const timeSinceLastActivity = now - room.createdAt;
        
        if (timeSinceLastActivity > inactivityThreshold) {
          this.chatRooms.delete(roomId);
          this.messages.delete(roomId);
          cleanedCount++;
        }
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} inactive chat rooms`);
    }
    
    return cleanedCount;
  }

  // Health check
  healthCheck() {
    return {
      status: 'healthy',
      metrics: this.getMetrics(),
      activeRooms: this.getActiveRooms().length,
      timestamp: Date.now()
    };
  }
}

module.exports = ChatService;