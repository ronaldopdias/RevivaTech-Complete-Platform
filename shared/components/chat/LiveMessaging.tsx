'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Paperclip, 
  Smile, 
  Image, 
  File,
  MoreVertical,
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  Phone,
  Video,
  Info
} from 'lucide-react';
import { useWebSocket, useWebSocketSubscription } from '../realtime/WebSocketProvider';
import { useAuth } from '../auth/AuthContext';
import { ChatFileUpload } from './ChatFileUpload';

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderType: 'customer' | 'agent' | 'system';
  content: string;
  timestamp: string;
  messageType: 'text' | 'image' | 'file' | 'system';
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  attachments?: {
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
  }[];
  replyTo?: {
    messageId: string;
    content: string;
    senderName: string;
  };
}

interface Conversation {
  id: string;
  participants: {
    id: string;
    name: string;
    role: string;
    avatar?: string;
    online: boolean;
    lastSeen?: string;
  }[];
  title?: string;
  lastMessage?: Message;
  unreadCount: number;
  typing?: {
    userId: string;
    userName: string;
  }[];
}

interface LiveMessagingProps {
  conversationId: string;
  height?: string;
  showHeader?: boolean;
  showParticipants?: boolean;
  allowFileUpload?: boolean;
  allowVoiceCall?: boolean;
  allowVideoCall?: boolean;
}

export const LiveMessaging: React.FC<LiveMessagingProps> = ({
  conversationId,
  height = '600px',
  showHeader = true,
  showParticipants = true,
  allowFileUpload = true,
  allowVoiceCall = false,
  allowVideoCall = false
}) => {
  const { user } = useAuth();
  const { isConnected, sendMessage } = useWebSocket();

  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load conversation and messages
  useEffect(() => {
    loadConversation();
    loadMessages();
  }, [conversationId]);

  // WebSocket subscriptions
  useWebSocketSubscription('message_received', (data) => {
    if (data.conversationId === conversationId) {
      addMessage(data.message);
      markMessageAsDelivered(data.message.id);
    }
  });

  useWebSocketSubscription('message_status_updated', (data) => {
    if (data.conversationId === conversationId) {
      updateMessageStatus(data.messageId, data.status);
    }
  });

  useWebSocketSubscription('user_typing', (data) => {
    if (data.conversationId === conversationId && data.userId !== user?.id) {
      setTypingUsers(prev => [...prev.filter(id => id !== data.userId), data.userId]);
      
      // Clear typing after 3 seconds
      setTimeout(() => {
        setTypingUsers(prev => prev.filter(id => id !== data.userId));
      }, 3000);
    }
  });

  useWebSocketSubscription('user_stopped_typing', (data) => {
    if (data.conversationId === conversationId) {
      setTypingUsers(prev => prev.filter(id => id !== data.userId));
    }
  });

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversation = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockConversation: Conversation = {
        id: conversationId,
        participants: [
          {
            id: user?.id || 'user-1',
            name: user?.name || 'You',
            role: 'customer',
            online: true
          },
          {
            id: 'agent-1',
            name: 'Sarah Johnson',
            role: 'agent',
            online: true,
            avatar: '/api/placeholder/32/32'
          }
        ],
        title: 'Repair Support',
        unreadCount: 0
      };
      
      setConversation(mockConversation);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockMessages: Message[] = [
        {
          id: 'msg-1',
          conversationId,
          senderId: 'agent-1',
          senderName: 'Sarah Johnson',
          senderType: 'agent',
          content: 'Hi! I see you have a question about your MacBook Pro repair. How can I help you today?',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          messageType: 'text',
          status: 'read'
        },
        {
          id: 'msg-2',
          conversationId,
          senderId: user?.id || 'user-1',
          senderName: user?.name || 'Customer',
          senderType: 'customer',
          content: 'Yes, I submitted my MacBook for screen repair yesterday and wanted to check the status.',
          timestamp: new Date(Date.now() - 240000).toISOString(),
          messageType: 'text',
          status: 'read'
        },
        {
          id: 'msg-3',
          conversationId,
          senderId: 'agent-1',
          senderName: 'Sarah Johnson',
          senderType: 'agent',
          content: 'Let me check that for you. What\'s your repair reference number?',
          timestamp: new Date(Date.now() - 180000).toISOString(),
          messageType: 'text',
          status: 'read'
        }
      ];
      
      setMessages(mockMessages);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const addMessage = (message: Message) => {
    setMessages(prev => [...prev, message]);
  };

  const updateMessageStatus = (messageId: string, status: Message['status']) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, status } : msg
    ));
  };

  const markMessageAsDelivered = (messageId: string) => {
    updateMessageStatus(messageId, 'delivered');
  };

  const sendMessageHandler = async () => {
    if (!messageInput.trim() || !isConnected) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      conversationId,
      senderId: user?.id || 'user-1',
      senderName: user?.name || 'Customer',
      senderType: 'customer',
      content: messageInput.trim(),
      timestamp: new Date().toISOString(),
      messageType: 'text',
      status: 'sending',
      replyTo: replyingTo ? {
        messageId: replyingTo.id,
        content: replyingTo.content,
        senderName: replyingTo.senderName
      } : undefined
    };

    // Add message immediately (optimistic update)
    addMessage(newMessage);
    setMessageInput('');
    setReplyingTo(null);
    stopTyping();

    // Send via WebSocket
    try {
      sendMessage({
        type: 'send_message',
        payload: {
          conversationId,
          message: newMessage
        },
        timestamp: new Date().toISOString()
      });

      // Update status to sent
      setTimeout(() => {
        updateMessageStatus(newMessage.id, 'sent');
      }, 500);

      // Simulate delivery
      setTimeout(() => {
        updateMessageStatus(newMessage.id, 'delivered');
      }, 1000);
    } catch (error) {
      console.error('Failed to send message:', error);
      updateMessageStatus(newMessage.id, 'failed');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessageHandler();
    }
  };

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      sendMessage({
        type: 'user_typing',
        payload: {
          conversationId,
          userId: user?.id,
          userName: user?.name
        },
        timestamp: new Date().toISOString()
      });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 2000);
  };

  const stopTyping = () => {
    if (isTyping) {
      setIsTyping(false);
      sendMessage({
        type: 'user_stopped_typing',
        payload: {
          conversationId,
          userId: user?.id
        },
        timestamp: new Date().toISOString()
      });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  const getMessageStatusIcon = (status: Message['status']) => {
    switch (status) {
      case 'sending':
        return <Clock className="h-3 w-3 text-gray-400" />;
      case 'sent':
        return <Check className="h-3 w-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      case 'failed':
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      default:
        return null;
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const isOwnMessage = (message: Message) => {
    return message.senderId === user?.id;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-white dark:bg-gray-800 rounded-lg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div 
      className="flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden"
      style={{ height }}
    >
      {/* Header */}
      {showHeader && conversation && (
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {conversation.participants.find(p => p.id !== user?.id)?.name?.charAt(0) || 'A'}
                </span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                {conversation.title || 'Support Chat'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {conversation.participants.find(p => p.id !== user?.id)?.name} is online
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {allowVoiceCall && (
              <button className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400">
                <Phone className="h-4 w-4" />
              </button>
            )}
            {allowVideoCall && (
              <button className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
                <Video className="h-4 w-4" />
              </button>
            )}
            <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <Info className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${isOwnMessage(message) ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-xs lg:max-w-md ${isOwnMessage(message) ? 'order-2' : 'order-1'}`}>
              {/* Reply indicator */}
              {message.replyTo && (
                <div className="mb-1 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                  <p className="font-medium text-gray-600 dark:text-gray-400">
                    Replying to {message.replyTo.senderName}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 truncate">
                    {message.replyTo.content}
                  </p>
                </div>
              )}

              <div
                className={`relative px-4 py-2 rounded-lg ${
                  isOwnMessage(message)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                }`}
              >
                {!isOwnMessage(message) && (
                  <p className="text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">
                    {message.senderName}
                  </p>
                )}
                
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                
                {/* Attachments */}
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {message.attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center space-x-2 p-2 bg-white/10 rounded"
                      >
                        <File className="h-4 w-4" />
                        <span className="text-sm truncate">{attachment.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs opacity-75">
                    {formatMessageTime(message.timestamp)}
                  </span>
                  {isOwnMessage(message) && (
                    <div className="ml-2">
                      {getMessageStatusIcon(message.status)}
                    </div>
                  )}
                </div>

                {/* Message actions */}
                <button
                  onClick={() => setReplyingTo(message)}
                  className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 p-1 text-xs"
                >
                  Reply
                </button>
              </div>
            </div>

            {/* Avatar */}
            {!isOwnMessage(message) && (
              <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center mr-2 order-0">
                <span className="text-xs font-medium text-white">
                  {message.senderName.charAt(0)}
                </span>
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Reply indicator */}
      {replyingTo && (
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Replying to {replyingTo.senderName}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {replyingTo.content}
              </p>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <AlertCircle className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* File Upload */}
      {showFileUpload && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <ChatFileUpload
            onFilesUploaded={(files) => {
              // Handle file upload completion
              setShowFileUpload(false);
            }}
            onFileRemoved={(fileId) => {
              // Handle file removal
            }}
          />
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <textarea
              ref={messageInputRef}
              value={messageInput}
              onChange={(e) => {
                setMessageInput(e.target.value);
                handleTyping();
              }}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              rows={1}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
          </div>

          <div className="flex items-center space-x-1">
            {allowFileUpload && (
              <button
                onClick={() => setShowFileUpload(!showFileUpload)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <Paperclip className="h-5 w-5" />
              </button>
            )}

            <button
              onClick={sendMessageHandler}
              disabled={!messageInput.trim() || !isConnected}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>

        {!isConnected && (
          <p className="text-xs text-red-500 mt-2">
            Connection lost. Trying to reconnect...
          </p>
        )}
      </div>
    </div>
  );
};

export default LiveMessaging;