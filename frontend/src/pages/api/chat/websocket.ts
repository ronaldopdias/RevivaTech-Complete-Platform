import { NextApiRequest, NextApiResponse } from 'next';
import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { ChatMessage, ChatParticipant, ChatRoom } from '@/components/chat/RealTimeChatSystem';

// Extend the NextApiResponse to include socket server
interface NextApiResponseWithSocket extends NextApiResponse {
  socket: {
    server: HttpServer & {
      io?: SocketIOServer;
    };
  };
}

// In-memory storage (in production, use Redis or database)
const chatRooms = new Map<string, ChatRoom>();
const userSessions = new Map<string, { socketId: string; user: ChatParticipant }>();
const roomMessages = new Map<string, ChatMessage[]>();
const typingUsers = new Map<string, Set<string>>();

// AI Assistant Integration
interface AIAssistantRequest {
  roomId: string;
  repairTicketId?: string;
  context: ChatMessage[];
  requestType: 'general' | 'diagnostic' | 'troubleshooting' | 'quote';
}

export default function handler(req: NextApiRequest, res: NextApiResponseWithSocket) {
  if (!res.socket.server.io) {
    
    const io = new SocketIOServer(res.socket.server, {
      path: '/api/chat/websocket',
      addTrailingSlash: false,
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3010",
        methods: ["GET", "POST"]
      }
    });

    // Socket connection handling
    io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Handle user authentication and registration
      socket.on('authenticate', (auth: { userId: string; userRole: string; repairTicketId?: string }) => {
        const user: ChatParticipant = {
          id: auth.userId,
          name: getUserName(auth.userId, auth.userRole),
          role: auth.userRole as any,
          status: 'online',
          avatar: generateAvatar(auth.userId),
          expertise: getExpertise(auth.userRole)
        };

        // Register user session
        userSessions.set(auth.userId, { socketId: socket.id, user });
        socket.userId = auth.userId;
        socket.user = user;

        // Join repair-specific room if provided
        if (auth.repairTicketId) {
          joinRepairChat(socket, auth.repairTicketId, user);
        }

        // Broadcast user online status
        broadcastUserStatus(io);

        socket.emit('authenticated', { user, rooms: getUserRooms(auth.userId) });
      });

      // Handle joining repair chat
      socket.on('join_repair_chat', (repairTicketId: string) => {
        if (socket.user) {
          joinRepairChat(socket, repairTicketId, socket.user);
        }
      });

      // Handle sending messages
      socket.on('send_message', (data: { roomId: string; message: ChatMessage }) => {
        handleSendMessage(io, socket, data.roomId, data.message);
      });

      // Handle typing indicators
      socket.on('typing', (data: { roomId: string; isTyping: boolean }) => {
        handleTyping(io, socket, data.roomId, data.isTyping);
      });

      // Handle message read receipts
      socket.on('mark_read', (data: { roomId: string; messageId: string }) => {
        handleMarkRead(io, socket, data.roomId, data.messageId);
      });

      // Handle AI assistance requests
      socket.on('request_ai_assistance', (data: AIAssistantRequest) => {
        handleAIAssistance(io, socket, data);
      });

      // Handle video call requests
      socket.on('start_video_call', (data: { roomId: string; callType: 'audio' | 'video' }) => {
        handleVideoCall(io, socket, data.roomId, data.callType);
      });

      // Handle file sharing
      socket.on('share_file', (data: { roomId: string; file: any }) => {
        handleFileShare(io, socket, data.roomId, data.file);
      });

      // Handle room management
      socket.on('create_room', (data: { name: string; type: 'direct' | 'group' | 'support'; participants: string[] }) => {
        handleCreateRoom(io, socket, data);
      });

      socket.on('leave_room', (roomId: string) => {
        handleLeaveRoom(io, socket, roomId);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        
        if (socket.userId) {
          // Update user status to offline
          const session = userSessions.get(socket.userId);
          if (session) {
            session.user.status = 'offline';
            session.user.lastSeen = new Date().toISOString();
          }
          
          // Clean up typing indicators
          typingUsers.forEach((users, roomId) => {
            users.delete(socket.userId);
            if (users.size === 0) {
              typingUsers.delete(roomId);
            }
          });

          // Broadcast user offline status
          broadcastUserStatus(io);
        }
      });
    });

    res.socket.server.io = io;
  }

  res.end();
}

/**
 * Join repair-specific chat room
 */
function joinRepairChat(socket: any, repairTicketId: string, user: ChatParticipant) {
  const roomId = `repair_${repairTicketId}`;
  socket.join(roomId);

  // Create or update room
  let room = chatRooms.get(roomId);
  if (!room) {
    room = {
      id: roomId,
      name: `Repair #${repairTicketId.slice(-6)}`,
      type: 'support',
      participants: [user],
      unreadCount: 0,
      createdAt: new Date().toISOString(),
      repairTicketId,
      metadata: {
        priority: 'medium',
        tags: ['support', 'repair']
      }
    };
    chatRooms.set(roomId, room);
    roomMessages.set(roomId, []);
  } else {
    // Add user to participants if not already present
    if (!room.participants.find(p => p.id === user.id)) {
      room.participants.push(user);
    }
  }

  // Send room history
  const messages = roomMessages.get(roomId) || [];
  socket.emit('room_joined', { room, messages: messages.slice(-50) });

  // Notify other participants
  socket.to(roomId).emit('user_joined', { room, user });

  console.log(`User ${user.name} joined repair chat ${repairTicketId}`);
}

/**
 * Handle sending messages
 */
function handleSendMessage(io: SocketIOServer, socket: any, roomId: string, message: ChatMessage) {
  if (!socket.user) return;

  // Validate and enhance message
  const enhancedMessage: ChatMessage = {
    ...message,
    sender: socket.user,
    timestamp: new Date().toISOString(),
    status: 'sent',
    metadata: {
      ...message.metadata,
      readBy: [{ userId: socket.user.id, readAt: new Date().toISOString() }]
    }
  };

  // Store message
  const messages = roomMessages.get(roomId) || [];
  messages.push(enhancedMessage);
  roomMessages.set(roomId, messages);

  // Update room last message
  const room = chatRooms.get(roomId);
  if (room) {
    room.lastMessage = enhancedMessage;
    chatRooms.set(roomId, room);
  }

  // Broadcast to room participants
  io.to(roomId).emit('message', enhancedMessage);

  // Send push notifications to offline users
  sendPushNotifications(roomId, enhancedMessage);

  console.log(`Message sent in room ${roomId} by ${socket.user.name}`);
}

/**
 * Handle typing indicators
 */
function handleTyping(io: SocketIOServer, socket: any, roomId: string, isTyping: boolean) {
  if (!socket.user) return;

  let users = typingUsers.get(roomId) || new Set();
  
  if (isTyping) {
    users.add(socket.user.name);
  } else {
    users.delete(socket.user.name);
  }
  
  typingUsers.set(roomId, users);

  // Broadcast typing status to room (excluding sender)
  socket.to(roomId).emit('typing', {
    userId: socket.user.id,
    userName: socket.user.name,
    isTyping
  });
}

/**
 * Handle message read receipts
 */
function handleMarkRead(io: SocketIOServer, socket: any, roomId: string, messageId: string) {
  if (!socket.user) return;

  const messages = roomMessages.get(roomId) || [];
  const messageIndex = messages.findIndex(m => m.id === messageId);
  
  if (messageIndex !== -1) {
    const message = messages[messageIndex];
    const readBy = message.metadata?.readBy || [];
    
    // Add read receipt if not already present
    if (!readBy.find(r => r.userId === socket.user.id)) {
      readBy.push({ userId: socket.user.id, readAt: new Date().toISOString() });
      message.metadata = { ...message.metadata, readBy };
      messages[messageIndex] = message;
      roomMessages.set(roomId, messages);

      // Broadcast read receipt
      io.to(roomId).emit('message_read', {
        messageId,
        userId: socket.user.id,
        readAt: new Date().toISOString()
      });
    }
  }
}

/**
 * Handle AI assistance requests
 */
async function handleAIAssistance(io: SocketIOServer, socket: any, request: AIAssistantRequest) {
  if (!socket.user) return;

  console.log(`AI assistance requested for room ${request.roomId}`);

  // Create AI participant
  const aiAssistant: ChatParticipant = {
    id: 'ai_assistant',
    name: 'AI Repair Assistant',
    role: 'ai',
    status: 'online',
    expertise: ['diagnostics', 'troubleshooting', 'quotes', 'general_support']
  };

  // Add AI to room participants
  const room = chatRooms.get(request.roomId);
  if (room && !room.participants.find(p => p.id === aiAssistant.id)) {
    room.participants.push(aiAssistant);
    chatRooms.set(request.roomId, room);
  }

  // Generate AI response based on context
  const aiResponse = await generateAIResponse(request);

  // Send AI message
  const aiMessage: ChatMessage = {
    id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    content: aiResponse.content,
    sender: aiAssistant,
    timestamp: new Date().toISOString(),
    type: aiResponse.type || 'text',
    status: 'sent',
    metadata: aiResponse.metadata
  };

  // Store and broadcast AI message
  const messages = roomMessages.get(request.roomId) || [];
  messages.push(aiMessage);
  roomMessages.set(request.roomId, messages);

  io.to(request.roomId).emit('message', aiMessage);

  // If AI suggests escalation to human technician
  if (aiResponse.escalate) {
    requestHumanTechnician(io, request.roomId, aiResponse.escalationReason);
  }
}

/**
 * Generate AI response based on context
 */
async function generateAIResponse(request: AIAssistantRequest): Promise<{
  content: string;
  type?: string;
  metadata?: any;
  escalate?: boolean;
  escalationReason?: string;
}> {
  // Analyze recent messages for context
  const recentMessages = request.context.slice(-5);
  const symptoms = extractSymptoms(recentMessages);
  const urgency = assessUrgency(recentMessages);

  // Generate contextual response
  if (symptoms.length > 0) {
    return {
      content: `I've analyzed your symptoms: ${symptoms.join(', ')}. Based on this, I recommend the following steps:\n\n1. **Immediate Check**: ${getImmediateAction(symptoms)}\n2. **Next Steps**: ${getNextSteps(symptoms)}\n3. **Estimated Timeline**: ${getTimeline(symptoms)}\n\nWould you like me to connect you with a human technician for detailed diagnosis?`,
      type: 'ai_suggestion',
      metadata: {
        suggestions: getActionSuggestions(symptoms),
        urgency: urgency,
        estimatedCost: estimateCost(symptoms)
      },
      escalate: urgency === 'high',
      escalationReason: urgency === 'high' ? 'High urgency issue detected' : undefined
    };
  }

  return {
    content: "I'm here to help! I can assist with:\n\n🔧 **Device Diagnostics** - Analyze symptoms and suggest solutions\n💰 **Repair Quotes** - Estimate costs and timeline\n📋 **Troubleshooting** - Step-by-step problem solving\n📞 **Technician Connection** - Connect you with human experts\n\nWhat specific issue can I help you with today?",
    type: 'ai_suggestion',
    metadata: {
      quickReplies: [
        'Device won\'t turn on',
        'Screen issues',
        'Performance problems',
        'Get repair quote',
        'Talk to technician'
      ]
    }
  };
}

/**
 * Handle video call initiation
 */
function handleVideoCall(io: SocketIOServer, socket: any, roomId: string, callType: 'audio' | 'video') {
  if (!socket.user) return;

  const callId = `call_${Date.now()}`;
  const callMessage: ChatMessage = {
    id: `call_${Date.now()}`,
    content: `${socket.user.name} started a ${callType} call`,
    sender: socket.user,
    timestamp: new Date().toISOString(),
    type: 'video_call',
    status: 'sent',
    metadata: {
      callData: {
        callType,
        status: 'initiated'
      }
    }
  };

  // Store call message
  const messages = roomMessages.get(roomId) || [];
  messages.push(callMessage);
  roomMessages.set(roomId, messages);

  // Broadcast call invitation
  socket.to(roomId).emit('video_call_invitation', {
    callId,
    caller: socket.user,
    callType,
    roomId
  });

  io.to(roomId).emit('message', callMessage);

  console.log(`${callType} call initiated by ${socket.user.name} in room ${roomId}`);
}

/**
 * Handle file sharing
 */
function handleFileShare(io: SocketIOServer, socket: any, roomId: string, file: any) {
  if (!socket.user) return;

  const fileMessage: ChatMessage = {
    id: `file_${Date.now()}`,
    content: `Shared ${file.name}`,
    sender: socket.user,
    timestamp: new Date().toISOString(),
    type: 'file',
    status: 'sent',
    metadata: {
      attachments: [file]
    }
  };

  // Store and broadcast file message
  const messages = roomMessages.get(roomId) || [];
  messages.push(fileMessage);
  roomMessages.set(roomId, messages);

  io.to(roomId).emit('message', fileMessage);
}

/**
 * Handle room creation
 */
function handleCreateRoom(io: SocketIOServer, socket: any, data: { name: string; type: 'direct' | 'group' | 'support'; participants: string[] }) {
  if (!socket.user) return;

  const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const participants = [socket.user];

  // Add other participants
  data.participants.forEach(userId => {
    const session = userSessions.get(userId);
    if (session) {
      participants.push(session.user);
    }
  });

  const room: ChatRoom = {
    id: roomId,
    name: data.name,
    type: data.type,
    participants,
    unreadCount: 0,
    createdAt: new Date().toISOString()
  };

  chatRooms.set(roomId, room);
  roomMessages.set(roomId, []);

  // Join all participants to the room
  participants.forEach(participant => {
    const session = userSessions.get(participant.id);
    if (session) {
      io.to(session.socketId).socketsJoin(roomId);
    }
  });

  // Broadcast room creation
  io.to(roomId).emit('room_created', room);
}

/**
 * Handle leaving room
 */
function handleLeaveRoom(io: SocketIOServer, socket: any, roomId: string) {
  if (!socket.user) return;

  socket.leave(roomId);

  const room = chatRooms.get(roomId);
  if (room) {
    room.participants = room.participants.filter(p => p.id !== socket.user.id);
    chatRooms.set(roomId, room);

    // Broadcast user left
    socket.to(roomId).emit('user_left', { room, user: socket.user });
  }
}

/**
 * Broadcast user status updates
 */
function broadcastUserStatus(io: SocketIOServer) {
  const onlineUsers = Array.from(userSessions.values()).map(session => session.user);
  io.emit('user_status_update', onlineUsers);
}

/**
 * Send push notifications to offline users
 */
function sendPushNotifications(roomId: string, message: ChatMessage) {
  const room = chatRooms.get(roomId);
  if (!room) return;

  const offlineUsers = room.participants.filter(p => {
    const session = userSessions.get(p.id);
    return !session || session.user.status === 'offline';
  });

  // In production, integrate with push notification service
  offlineUsers.forEach(user => {
    console.log(`Sending push notification to ${user.name}: ${message.content.substring(0, 50)}...`);
  });
}

/**
 * Request human technician
 */
function requestHumanTechnician(io: SocketIOServer, roomId: string, reason: string) {
  // In production, this would trigger technician assignment system
  console.log(`Human technician requested for room ${roomId}: ${reason}`);
  
  const systemMessage: ChatMessage = {
    id: `system_${Date.now()}`,
    content: `🔧 A human technician has been notified and will join shortly. Reason: ${reason}`,
    sender: {
      id: 'system',
      name: 'System',
      role: 'ai',
      status: 'online'
    },
    timestamp: new Date().toISOString(),
    type: 'system',
    status: 'sent'
  };

  const messages = roomMessages.get(roomId) || [];
  messages.push(systemMessage);
  roomMessages.set(roomId, messages);

  io.to(roomId).emit('message', systemMessage);
}

/**
 * Utility functions
 */
function getUserName(userId: string, role: string): string {
  // In production, fetch from user database
  const names = {
    customer: ['John Smith', 'Sarah Wilson', 'Michael Brown', 'Emily Davis'],
    technician: ['Alex Tech', 'Sam Repair', 'Jordan Fix', 'Casey Support'],
    admin: ['Admin User', 'Manager Account']
  };
  
  const roleNames = names[role as keyof typeof names] || names.customer;
  return roleNames[Math.floor(Math.random() * roleNames.length)] || `User ${userId.slice(-4)}`;
}

function generateAvatar(userId: string): string {
  return `https://api.dicebear.com/6.x/initials/svg?seed=${userId}`;
}

function getExpertise(role: string): string[] {
  const expertise = {
    technician: ['hardware_repair', 'software_troubleshooting', 'diagnostics'],
    admin: ['customer_support', 'system_management'],
    ai: ['diagnostics', 'troubleshooting', 'quotes']
  };
  
  return expertise[role as keyof typeof expertise] || [];
}

function getUserRooms(userId: string): ChatRoom[] {
  return Array.from(chatRooms.values()).filter(room => 
    room.participants.some(p => p.id === userId)
  );
}

function extractSymptoms(messages: ChatMessage[]): string[] {
  const symptoms: string[] = [];
  const symptomKeywords = [
    'broken', 'cracked', 'slow', 'hot', 'freeze', 'crash', 'dead', 'flickering',
    'noise', 'battery', 'charging', 'screen', 'keyboard', 'mouse', 'wifi'
  ];

  messages.forEach(message => {
    const content = message.content.toLowerCase();
    symptomKeywords.forEach(keyword => {
      if (content.includes(keyword) && !symptoms.includes(keyword)) {
        symptoms.push(keyword);
      }
    });
  });

  return symptoms;
}

function assessUrgency(messages: ChatMessage[]): 'low' | 'medium' | 'high' {
  const urgentKeywords = ['emergency', 'urgent', 'critical', 'dead', 'broken', 'fire', 'smoke'];
  const content = messages.map(m => m.content.toLowerCase()).join(' ');
  
  if (urgentKeywords.some(keyword => content.includes(keyword))) {
    return 'high';
  }
  
  return 'medium';
}

function getImmediateAction(symptoms: string[]): string {
  if (symptoms.includes('dead') || symptoms.includes('broken')) {
    return 'Check power connection and try a different outlet';
  }
  if (symptoms.includes('hot') || symptoms.includes('overheat')) {
    return 'Turn off device immediately and ensure proper ventilation';
  }
  if (symptoms.includes('screen') || symptoms.includes('flickering')) {
    return 'Try adjusting display settings and check cable connections';
  }
  return 'Restart the device and observe if the issue persists';
}

function getNextSteps(symptoms: string[]): string {
  return 'Document when the issue occurs, take photos if visible damage, and prepare device serial number';
}

function getTimeline(symptoms: string[]): string {
  if (symptoms.includes('dead') || symptoms.includes('broken')) {
    return '2-3 business days for diagnosis and repair';
  }
  return '1-2 business days for diagnosis';
}

function getActionSuggestions(symptoms: string[]): string[] {
  return [
    'Schedule diagnostic appointment',
    'Get repair quote',
    'Backup important data',
    'Check warranty status'
  ];
}

function estimateCost(symptoms: string[]): { min: number; max: number; currency: string } {
  if (symptoms.includes('screen') || symptoms.includes('display')) {
    return { min: 100, max: 300, currency: 'GBP' };
  }
  if (symptoms.includes('battery')) {
    return { min: 80, max: 200, currency: 'GBP' };
  }
  return { min: 50, max: 150, currency: 'GBP' };
}

// This is required for Next.js API routes with Socket.IO
export const config = {
  api: {
    bodyParser: false,
  },
};