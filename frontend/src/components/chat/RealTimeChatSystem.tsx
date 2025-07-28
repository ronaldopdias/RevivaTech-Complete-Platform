'use client';

/**
 * Real-Time Chat System
 * 
 * Comprehensive chat system featuring:
 * - Customer <-> Technician real-time communication
 * - AI Assistant integration
 * - File sharing and image uploads
 * - Video call integration
 * - Chat history and persistence
 * - Typing indicators and read receipts
 * - Notification system
 * - Multi-participant support
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { EnhancedFileUpload, UploadedFile } from '@/components/ui/EnhancedFileUpload';
import io, { Socket } from 'socket.io-client';

export interface ChatParticipant {
  id: string;
  name: string;
  role: 'customer' | 'technician' | 'admin' | 'ai';
  avatar?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen?: string;
  expertise?: string[];
}

export interface ChatMessage {
  id: string;
  content: string;
  sender: ChatParticipant;
  timestamp: string;
  type: 'text' | 'image' | 'file' | 'system' | 'ai_suggestion' | 'video_call' | 'typing';
  metadata?: {
    attachments?: UploadedFile[];
    replyTo?: string;
    edited?: boolean;
    editedAt?: string;
    reactions?: { emoji: string; users: string[] }[];
    readBy?: { userId: string; readAt: string }[];
    callData?: {
      duration?: number;
      callType: 'audio' | 'video';
      status: 'missed' | 'completed' | 'declined';
    };
  };
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
}

export interface ChatRoom {
  id: string;
  name: string;
  type: 'direct' | 'group' | 'support';
  participants: ChatParticipant[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  createdAt: string;
  repairTicketId?: string;
  metadata?: {
    deviceInfo?: any;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    tags?: string[];
  };
}

interface RealTimeChatSystemProps {
  currentUser: ChatParticipant;
  repairTicketId?: string;
  initialRoom?: ChatRoom;
  onRoomChange?: (room: ChatRoom) => void;
  onClose?: () => void;
  className?: string;
  embedded?: boolean;
}

export default function RealTimeChatSystem({
  currentUser,
  repairTicketId,
  initialRoom,
  onRoomChange,
  onClose,
  className = '',
  embedded = false
}: RealTimeChatSystemProps) {
  // State management
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(initialRoom || null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState<string[]>([]);
  const [uploadFiles, setUploadFiles] = useState<UploadedFile[]>([]);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [viewMode, setViewMode] = useState<'chat' | 'rooms' | 'participants'>('chat');
  const [onlineUsers, setOnlineUsers] = useState<ChatParticipant[]>([]);
  const [notifications, setNotifications] = useState<ChatMessage[]>([]);
  
  // WebSocket and refs
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3011', {
      auth: {
        userId: currentUser.id,
        userRole: currentUser.role,
        repairTicketId
      }
    });

    newSocket.on('connect', () => {
      console.log('Connected to chat server');
      if (repairTicketId) {
        newSocket.emit('join_repair_chat', repairTicketId);
      }
    });

    newSocket.on('message', (message: ChatMessage) => {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
      
      // Show notification if not in active room
      if (message.sender.id !== currentUser.id) {
        setNotifications(prev => [message, ...prev.slice(0, 4)]);
      }
    });

    newSocket.on('typing', ({ userId, userName, isTyping: typingStatus }) => {
      setIsTyping(prev => {
        if (typingStatus) {
          return [...prev.filter(id => id !== userId), userName];
        } else {
          return prev.filter(name => name !== userName);
        }
      });
    });

    newSocket.on('user_status_update', (users: ChatParticipant[]) => {
      setOnlineUsers(users);
    });

    newSocket.on('room_update', (room: ChatRoom) => {
      setRooms(prev => {
        const existing = prev.find(r => r.id === room.id);
        if (existing) {
          return prev.map(r => r.id === room.id ? room : r);
        } else {
          return [...prev, room];
        }
      });
    });

    newSocket.on('message_read', ({ messageId, userId, readAt }) => {
      setMessages(prev => prev.map(msg => {
        if (msg.id === messageId) {
          const readBy = msg.metadata?.readBy || [];
          return {
            ...msg,
            metadata: {
              ...msg.metadata,
              readBy: [...readBy.filter(r => r.userId !== userId), { userId, readAt }]
            }
          };
        }
        return msg;
      }));
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [currentUser.id, repairTicketId]);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (socket && activeRoom) {
      socket.emit('typing', { roomId: activeRoom.id, isTyping: true });
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing', { roomId: activeRoom.id, isTyping: false });
      }, 2000);
    }
  }, [socket, activeRoom]);

  // Send message
  const sendMessage = useCallback(async () => {
    if (!inputMessage.trim() && uploadFiles.length === 0) return;
    if (!socket || !activeRoom) return;

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newMessage: ChatMessage = {
      id: messageId,
      content: inputMessage.trim(),
      sender: currentUser,
      timestamp: new Date().toISOString(),
      type: uploadFiles.length > 0 ? 'file' : 'text',
      metadata: {
        attachments: uploadFiles.length > 0 ? uploadFiles : undefined,
      },
      status: 'sending'
    };

    // Add message optimistically
    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');
    setUploadFiles([]);
    setShowFileUpload(false);

    // Send via WebSocket
    socket.emit('send_message', {
      roomId: activeRoom.id,
      message: newMessage
    });

    // Clear typing indicator
    socket.emit('typing', { roomId: activeRoom.id, isTyping: false });
  }, [inputMessage, uploadFiles, socket, activeRoom, currentUser]);

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString();
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  // Get role badge
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'technician': return { text: 'Tech', color: 'bg-blue-100 text-blue-800' };
      case 'admin': return { text: 'Admin', color: 'bg-purple-100 text-purple-800' };
      case 'ai': return { text: 'AI', color: 'bg-green-100 text-green-800' };
      default: return { text: 'Customer', color: 'bg-gray-100 text-gray-800' };
    }
  };

  // Request AI assistance
  const requestAIAssistance = async () => {
    if (!socket || !activeRoom) return;

    const aiMessage: ChatMessage = {
      id: `ai_${Date.now()}`,
      content: 'AI Assistant has joined the conversation and is analyzing the repair context...',
      sender: {
        id: 'ai_assistant',
        name: 'AI Assistant',
        role: 'ai',
        status: 'online'
      },
      timestamp: new Date().toISOString(),
      type: 'system',
      status: 'sent'
    };

    socket.emit('request_ai_assistance', {
      roomId: activeRoom.id,
      repairTicketId,
      context: messages.slice(-10) // Send recent context
    });

    setMessages(prev => [...prev, aiMessage]);
  };

  // Start video call
  const startVideoCall = () => {
    if (!socket || !activeRoom) return;

    socket.emit('start_video_call', {
      roomId: activeRoom.id,
      callType: 'video'
    });
  };

  if (!embedded && viewMode === 'rooms') {
    return (
      <Card className={`w-full max-w-4xl mx-auto ${className}`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">Chat Rooms</h2>
            <Button onClick={() => setViewMode('chat')}>
              Back to Chat
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map(room => (
              <motion.div
                key={room.id}
                whileHover={{ scale: 1.02 }}
                className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                onClick={() => {
                  setActiveRoom(room);
                  setViewMode('chat');
                  onRoomChange?.(room);
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{room.name}</h3>
                  {room.unreadCount > 0 && (
                    <Badge variant="destructive">{room.unreadCount}</Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  {room.participants.length} participants
                </p>
                {room.lastMessage && (
                  <p className="text-xs text-gray-500 truncate">
                    {room.lastMessage.content}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`flex flex-col h-96 md:h-[600px] ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          {activeRoom && (
            <>
              <div className="relative">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                  {activeRoom.name.charAt(0).toUpperCase()}
                </div>
                <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusColor('online')}`}></div>
              </div>
              <div>
                <h3 className="font-medium">{activeRoom.name}</h3>
                <div className="flex items-center space-x-2">
                  <p className="text-sm text-gray-500">
                    {activeRoom.participants.length} participants
                  </p>
                  {isTyping.length > 0 && (
                    <p className="text-sm text-blue-600">
                      {isTyping.join(', ')} typing...
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={startVideoCall}
            title="Start Video Call"
          >
            📹
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={requestAIAssistance}
            title="Request AI Assistance"
          >
            🤖
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('participants')}
            title="View Participants"
          >
            👥
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              ✕
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex ${message.sender.id === currentUser.id ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs md:max-w-md ${message.sender.id === currentUser.id ? 'order-2' : 'order-1'}`}>
                {message.sender.id !== currentUser.id && (
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="relative">
                      <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs">
                        {message.sender.name.charAt(0).toUpperCase()}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white ${getStatusColor(message.sender.status)}`}></div>
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {message.sender.name}
                    </span>
                    <Badge className={`text-xs ${getRoleBadge(message.sender.role).color}`}>
                      {getRoleBadge(message.sender.role).text}
                    </Badge>
                  </div>
                )}
                
                <div className={`p-3 rounded-lg ${
                  message.sender.id === currentUser.id
                    ? 'bg-blue-500 text-white'
                    : message.sender.role === 'ai'
                      ? 'bg-green-100 text-green-800 border border-green-200'
                      : 'bg-gray-100 text-gray-900'
                }`}>
                  {message.type === 'text' && (
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  )}
                  
                  {message.type === 'file' && message.metadata?.attachments && (
                    <div className="space-y-2">
                      {message.content && (
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        {message.metadata.attachments.map(file => (
                          <div key={file.id} className="bg-white/20 rounded p-2">
                            {file.type.startsWith('image/') ? (
                              <img
                                src={file.url}
                                alt={file.originalName}
                                className="w-full h-20 object-cover rounded"
                              />
                            ) : (
                              <div className="flex items-center space-x-2">
                                <span>📄</span>
                                <span className="text-xs truncate">{file.originalName}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {message.type === 'system' && (
                    <p className="text-sm italic">{message.content}</p>
                  )}
                </div>
                
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-500">
                    {formatTime(message.timestamp)}
                  </span>
                  {message.sender.id === currentUser.id && (
                    <div className="flex items-center space-x-1">
                      {message.status === 'sending' && <span className="text-xs text-gray-400">⏳</span>}
                      {message.status === 'sent' && <span className="text-xs text-gray-400">✓</span>}
                      {message.status === 'delivered' && <span className="text-xs text-gray-400">✓✓</span>}
                      {message.status === 'read' && <span className="text-xs text-blue-400">✓✓</span>}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* File Upload */}
      <AnimatePresence>
        {showFileUpload && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-gray-200 p-4"
          >
            <EnhancedFileUpload
              files={uploadFiles}
              onFilesChange={setUploadFiles}
              maxFiles={5}
              maxSizePerFile={10}
              acceptedTypes={['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/plain']}
              category="chat"
              showCamera={true}
              showBatchOperations={false}
              allowReordering={false}
              className="mb-0"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-end space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFileUpload(!showFileUpload)}
            className="mb-1"
          >
            📎
          </Button>
          
          <div className="flex-1">
            <Input
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => {
                setInputMessage(e.target.value);
                handleTyping();
              }}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="resize-none"
              disabled={!activeRoom}
            />
          </div>
          
          <Button
            onClick={sendMessage}
            disabled={!inputMessage.trim() && uploadFiles.length === 0}
            size="sm"
            className="mb-1"
          >
            Send
          </Button>
        </div>
        
        {uploadFiles.length > 0 && (
          <div className="mt-2 flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              {uploadFiles.length} file(s) ready to send
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setUploadFiles([])}
            >
              Clear
            </Button>
          </div>
        )}
      </div>

      {/* Notifications */}
      <AnimatePresence>
        {notifications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed top-4 right-4 z-50 space-y-2"
          >
            {notifications.slice(0, 3).map(notification => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-sm"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                    {notification.sender.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{notification.sender.name}</p>
                    <p className="text-xs text-gray-600 truncate">{notification.content}</p>
                  </div>
                  <button
                    onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}