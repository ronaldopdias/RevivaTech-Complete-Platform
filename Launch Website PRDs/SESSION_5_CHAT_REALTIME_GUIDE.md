# Session 5: Chat Integration & Real-time Features - Implementation Guide

**Session Priority**: HIGH - Real-time communication and live features  
**Estimated Duration**: Full implementation session  
**Prerequisites**: Sessions 1-4 completed (Backend foundation + AI system operational)  
**Objective**: Implement Chatwoot integration, real-time chat, live notifications, and WebSocket-powered features  

---

## 🎯 Session Objectives

### Primary Goals
1. **Chatwoot Chat Integration**: Professional customer support chat system
2. **Real-time Notifications**: Live updates via WebSocket for all user interactions
3. **Live Admin Features**: Real-time admin dashboard updates and team collaboration
4. **Multi-channel Communication**: Chat, email, SMS coordination
5. **Mobile Real-time Experience**: Push notifications and offline capability

### Success Criteria
- [ ] Chatwoot chat system fully integrated with customer portal and admin dashboard
- [ ] Real-time notifications working across all features (bookings, repairs, messages)
- [ ] WebSocket connections stable with automatic reconnection
- [ ] Mobile push notifications operational
- [ ] Live collaboration features for admin team
- [ ] Multi-channel communication unified in admin interface

---

## 💬 Chatwoot Integration Implementation

### 1. Chatwoot Configuration Backend

**Create**: `/backend/services/chatwoot-service.js`

```javascript
const axios = require('axios');
const { User, Booking, ChatMessage } = require('../models');

class ChatwootService {
  constructor() {
    this.apiUrl = process.env.CHATWOOT_API_URL;
    this.apiKey = process.env.CHATWOOT_API_KEY;
    this.accountId = process.env.CHATWOOT_ACCOUNT_ID;
    this.inboxId = process.env.CHATWOOT_INBOX_ID;
  }

  async createContact(customer) {
    try {
      const contactData = {
        name: `${customer.first_name} ${customer.last_name}`,
        email: customer.email,
        phone_number: customer.phone,
        custom_attributes: {
          customer_id: customer.id,
          total_bookings: await this.getCustomerBookingCount(customer.id),
          last_booking_date: await this.getLastBookingDate(customer.id)
        }
      };

      const response = await axios.post(
        `${this.apiUrl}/api/v1/accounts/${this.accountId}/contacts`,
        contactData,
        {
          headers: {
            'api_access_token': this.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Chatwoot create contact error:', error);
      throw error;
    }
  }

  async createConversation(contactId, bookingReference = null) {
    try {
      const conversationData = {
        source_id: contactId,
        inbox_id: this.inboxId,
        contact_id: contactId,
        custom_attributes: {
          booking_reference: bookingReference,
          conversation_type: bookingReference ? 'booking_support' : 'general_inquiry'
        }
      };

      const response = await axios.post(
        `${this.apiUrl}/api/v1/accounts/${this.accountId}/conversations`,
        conversationData,
        {
          headers: {
            'api_access_token': this.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Chatwoot create conversation error:', error);
      throw error;
    }
  }

  async sendMessage(conversationId, message, messageType = 'outgoing') {
    try {
      const messageData = {
        content: message.content,
        message_type: messageType,
        content_type: 'text',
        content_attributes: {
          sent_by: message.sent_by,
          booking_id: message.booking_id
        }
      };

      const response = await axios.post(
        `${this.apiUrl}/api/v1/accounts/${this.accountId}/conversations/${conversationId}/messages`,
        messageData,
        {
          headers: {
            'api_access_token': this.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      // Store in local database for backup
      await ChatMessage.create({
        conversation_id: conversationId,
        user_id: message.user_id,
        message: message.content,
        message_type: messageType,
        chatwoot_message_id: response.data.id
      });

      return response.data;
    } catch (error) {
      console.error('Chatwoot send message error:', error);
      throw error;
    }
  }

  async handleWebhook(webhookData) {
    try {
      const { event_type, conversation, message } = webhookData;

      switch (event_type) {
        case 'message_created':
          await this.handleNewMessage(conversation, message);
          break;
        case 'conversation_status_changed':
          await this.handleStatusChange(conversation);
          break;
        case 'conversation_assigned':
          await this.handleAssignment(conversation);
          break;
      }
    } catch (error) {
      console.error('Chatwoot webhook error:', error);
    }
  }

  async handleNewMessage(conversation, message) {
    // Broadcast new message via WebSocket
    const wsService = require('./websocket-service');
    wsService.broadcastToUser(conversation.meta.sender.id, {
      type: 'new_message',
      conversation_id: conversation.id,
      message: {
        content: message.content,
        sender: message.sender.name,
        timestamp: message.created_at
      }
    });

    // Send push notification if mobile
    await this.sendPushNotification(conversation.meta.sender.id, {
      title: 'New message from RevivaTech',
      body: message.content.substring(0, 100),
      data: { conversation_id: conversation.id }
    });
  }
}

module.exports = ChatwootService;
```

### 2. Chat Widget Integration

**Create**: `/frontend/src/components/chat/ChatWidget.tsx`

```typescript
'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  MessageCircle, 
  Send, 
  X, 
  Minimize2, 
  Maximize2,
  Phone,
  Mail
} from 'lucide-react';

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  timestamp: string;
  senderName?: string;
}

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [agentOnline, setAgentOnline] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !conversationId) {
      initializeChat();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeChat = async () => {
    try {
      const response = await fetch('/api/chat/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      setConversationId(data.conversation_id);
      setIsConnected(true);

      // Load existing messages
      if (data.messages) {
        setMessages(data.messages);
      }

      // Add welcome message
      setMessages(prev => [...prev, {
        id: 'welcome',
        content: 'Hello! How can we help you today?',
        sender: 'agent',
        timestamp: new Date().toISOString(),
        senderName: 'RevivaTech Support'
      }]);

    } catch (error) {
      console.error('Chat initialization failed:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversationId) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: newMessage,
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');

    try {
      const response = await fetch('/api/chat/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          message: newMessage
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Send message failed:', error);
      // Add error message
      setMessages(prev => [...prev, {
        id: 'error',
        content: 'Sorry, there was an error sending your message. Please try again.',
        sender: 'agent',
        timestamp: new Date().toISOString(),
        senderName: 'System'
      }]);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full w-14 h-14 bg-trust-500 hover:bg-trust-700 shadow-lg"
        >
          <MessageCircle className="h-6 w-6 text-white" />
        </Button>
        {agentOnline && (
          <Badge className="absolute -top-2 -left-2 bg-green-500">
            Live
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${isMinimized ? 'w-80' : 'w-96'}`}>
      <Card className="overflow-hidden shadow-2xl">
        {/* Chat Header */}
        <div className="bg-trust-500 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            <div>
              <h3 className="font-semibold">RevivaTech Support</h3>
              <p className="text-xs text-trust-100">
                {agentOnline ? 'Agent online' : 'Leave a message'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-white hover:bg-trust-600"
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-trust-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Chat Messages */}
            <div className="h-96 overflow-y-auto p-4 space-y-4 bg-neutral-50">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      message.sender === 'user'
                        ? 'bg-trust-500 text-white'
                        : 'bg-white border border-neutral-200 text-neutral-700'
                    }`}
                  >
                    {message.sender === 'agent' && message.senderName && (
                      <p className="text-xs text-neutral-500 mb-1">{message.senderName}</p>
                    )}
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender === 'user' ? 'text-trust-100' : 'text-neutral-400'
                    }`}>
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            <div className="p-3 border-t border-neutral-200 bg-white">
              <div className="flex space-x-2 mb-3">
                <Button variant="outline" size="sm" className="text-xs">
                  Track my repair
                </Button>
                <Button variant="outline" size="sm" className="text-xs">
                  Book new repair
                </Button>
              </div>
              
              {/* Message Input */}
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type your message..."
                  className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-trust-500"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="bg-trust-500 hover:bg-trust-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Alternative Contact Methods */}
            <div className="p-3 bg-neutral-100 border-t border-neutral-200">
              <p className="text-xs text-neutral-600 mb-2">Need immediate help?</p>
              <div className="flex space-x-4">
                <a
                  href="tel:+442012345678"
                  className="flex items-center space-x-1 text-xs text-professional-600 hover:text-professional-800"
                >
                  <Phone className="h-3 w-3" />
                  <span>Call us</span>
                </a>
                <a
                  href="mailto:support@revivatech.co.uk"
                  className="flex items-center space-x-1 text-xs text-professional-600 hover:text-professional-800"
                >
                  <Mail className="h-3 w-3" />
                  <span>Email</span>
                </a>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default ChatWidget;
```

---

## 🔄 Real-time Notifications System

### 1. Advanced WebSocket Service

**Create**: `/backend/services/realtime-notification-service.js`

```javascript
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const { User, Notification } = require('../models');

class RealtimeNotificationService {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.clients = new Map(); // Map of user_id -> Set of WebSocket connections
    this.adminClients = new Set(); // Admin connections for broadcast
    
    this.wss.on('connection', this.handleConnection.bind(this));
    this.setupHeartbeat();
  }

  async handleConnection(ws, req) {
    try {
      const token = new URL(req.url, 'http://localhost:3011').searchParams.get('token');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.userId);
      
      if (!user) {
        ws.close(1008, 'Invalid user');
        return;
      }

      // Store connection
      if (!this.clients.has(user.id)) {
        this.clients.set(user.id, new Set());
      }
      this.clients.get(user.id).add(ws);

      if (user.role === 'admin' || user.role === 'technician') {
        this.adminClients.add(ws);
      }

      // Set up connection handlers
      ws.user = user;
      ws.isAlive = true;
      
      ws.on('pong', () => { ws.isAlive = true; });
      ws.on('close', () => this.handleDisconnection(ws));
      ws.on('message', (message) => this.handleMessage(ws, message));

      // Send connection confirmation
      this.sendToClient(ws, {
        type: 'connected',
        message: 'Real-time notifications active',
        user: { id: user.id, name: user.first_name }
      });

      // Send any pending notifications
      await this.sendPendingNotifications(user.id, ws);

    } catch (error) {
      console.error('WebSocket connection error:', error);
      ws.close(1008, 'Authentication failed');
    }
  }

  handleDisconnection(ws) {
    if (ws.user) {
      const userConnections = this.clients.get(ws.user.id);
      if (userConnections) {
        userConnections.delete(ws);
        if (userConnections.size === 0) {
          this.clients.delete(ws.user.id);
        }
      }
      this.adminClients.delete(ws);
    }
  }

  async handleMessage(ws, message) {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'subscribe_booking':
          await this.subscribeToBooking(ws, data.bookingId);
          break;
        case 'mark_notification_read':
          await this.markNotificationRead(data.notificationId, ws.user.id);
          break;
        case 'typing_start':
          await this.broadcastTyping(ws, data.conversationId, true);
          break;
        case 'typing_stop':
          await this.broadcastTyping(ws, data.conversationId, false);
          break;
      }
    } catch (error) {
      console.error('WebSocket message handling error:', error);
    }
  }

  // Notification Broadcasting Methods
  async broadcastToUser(userId, notification) {
    const userConnections = this.clients.get(userId);
    if (userConnections) {
      for (const ws of userConnections) {
        this.sendToClient(ws, notification);
      }
    }

    // Store notification in database
    await Notification.create({
      user_id: userId,
      type: notification.type,
      title: notification.title || 'Notification',
      message: notification.message,
      data: notification.data || {},
      read: false
    });
  }

  async broadcastToAdmins(notification) {
    for (const ws of this.adminClients) {
      this.sendToClient(ws, notification);
    }
  }

  async broadcastToAll(notification) {
    for (const [userId, connections] of this.clients) {
      for (const ws of connections) {
        this.sendToClient(ws, notification);
      }
    }
  }

  // Specific Notification Types
  async notifyBookingUpdate(bookingId, update) {
    const booking = await Booking.findByPk(bookingId, { include: [User] });
    
    await this.broadcastToUser(booking.customer_id, {
      type: 'booking_update',
      title: 'Booking Update',
      message: update.message,
      data: { 
        booking_id: bookingId,
        status: update.status,
        booking_reference: booking.booking_reference
      }
    });

    // Notify admins
    await this.broadcastToAdmins({
      type: 'admin_booking_update',
      title: 'Booking Status Changed',
      message: `Booking ${booking.booking_reference} status: ${update.status}`,
      data: { booking_id: bookingId, status: update.status }
    });
  }

  async notifyNewMessage(conversationId, message, recipientId) {
    await this.broadcastToUser(recipientId, {
      type: 'new_chat_message',
      title: 'New Message',
      message: message.content.substring(0, 50) + '...',
      data: {
        conversation_id: conversationId,
        sender: message.sender_name,
        full_message: message.content
      }
    });
  }

  async notifyRepairComplete(repairId) {
    const repair = await Repair.findByPk(repairId, {
      include: [{ model: Booking, include: [User] }]
    });

    await this.broadcastToUser(repair.Booking.customer_id, {
      type: 'repair_complete',
      title: 'Repair Completed!',
      message: `Your ${repair.Booking.DeviceModel.brand} ${repair.Booking.DeviceModel.model} repair is ready for collection`,
      data: {
        repair_id: repairId,
        booking_reference: repair.Booking.booking_reference,
        action_url: `/track/${repair.Booking.booking_reference}`
      }
    });
  }

  // Utility Methods
  sendToClient(ws, message) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        ...message,
        timestamp: new Date().toISOString(),
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }));
    }
  }

  setupHeartbeat() {
    setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
          return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000); // 30 second heartbeat
  }

  async sendPendingNotifications(userId, ws) {
    const pendingNotifications = await Notification.findAll({
      where: { user_id: userId, read: false },
      order: [['created_at', 'DESC']],
      limit: 10
    });

    for (const notification of pendingNotifications) {
      this.sendToClient(ws, {
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        id: notification.id,
        isPending: true
      });
    }
  }
}

module.exports = RealtimeNotificationService;
```

### 2. Live Notifications Component

**Create**: `/frontend/src/components/realtime/LiveNotifications.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Bell, 
  X, 
  CheckCircle, 
  Clock, 
  MessageSquare,
  Package,
  AlertCircle
} from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  data?: any;
  actionUrl?: string;
}

const NOTIFICATION_ICONS = {
  booking_update: Clock,
  repair_complete: CheckCircle,
  new_chat_message: MessageSquare,
  payment_confirmed: Package,
  system_alert: AlertCircle
};

const NOTIFICATION_COLORS = {
  booking_update: 'text-trust-500',
  repair_complete: 'text-green-500',
  new_chat_message: 'text-professional-500',
  payment_confirmed: 'text-green-600',
  system_alert: 'text-orange-500'
};

const LiveNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    initializeWebSocket();
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  useEffect(() => {
    const unread = notifications.filter(n => !n.read).length;
    setUnreadCount(unread);
  }, [notifications]);

  const initializeWebSocket = () => {
    const token = localStorage.getItem('token');
    const websocket = new WebSocket(`ws://localhost:3011?token=${token}`);

    websocket.onopen = () => {
      setWs(websocket);
      console.log('Real-time notifications connected');
    };

    websocket.onmessage = (event) => {
      const notification = JSON.parse(event.data);
      
      if (notification.type !== 'connected') {
        setNotifications(prev => [notification, ...prev].slice(0, 50)); // Keep last 50
        
        // Show browser notification if page not visible
        if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico',
            tag: notification.id
          });
        }
      }
    };

    websocket.onclose = () => {
      console.log('Real-time notifications disconnected');
      // Attempt to reconnect after 5 seconds
      setTimeout(initializeWebSocket, 5000);
    };
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ notification_id: notificationId })
      });

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );

      // Send WebSocket message to mark as read
      if (ws) {
        ws.send(JSON.stringify({
          type: 'mark_notification_read',
          notificationId
        }));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const clearAll = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    // Mark all as read in backend
    fetch('/api/notifications/mark-all-read', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    
    if (notification.data?.action_url) {
      window.location.href = notification.data.action_url;
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs min-w-5 h-5 flex items-center justify-center rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-96 z-50">
          <Card className="max-h-96 overflow-hidden shadow-lg">
            <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
              <h3 className="font-semibold">Notifications</h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearAll}>
                    Mark all read
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="overflow-y-auto max-h-80">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-neutral-500">
                  <Bell className="h-8 w-8 mx-auto mb-2 text-neutral-300" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                notifications.map((notification) => {
                  const IconComponent = NOTIFICATION_ICONS[notification.type] || Bell;
                  const iconColor = NOTIFICATION_COLORS[notification.type] || 'text-neutral-500';
                  
                  return (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-4 border-b border-neutral-100 cursor-pointer hover:bg-neutral-50 transition-colors ${
                        !notification.read ? 'bg-trust-50' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <IconComponent className={`h-5 w-5 mt-0.5 ${iconColor}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <h4 className={`text-sm font-medium ${!notification.read ? 'text-neutral-900' : 'text-neutral-700'}`}>
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-trust-500 rounded-full ml-2"></div>
                            )}
                          </div>
                          <p className="text-sm text-neutral-600 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-neutral-400 mt-2">
                            {new Date(notification.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default LiveNotifications;
```

---

## ✅ Session 5 Implementation Checklist

### Chatwoot Integration
- [ ] Chatwoot service configured and operational
- [ ] Contact and conversation creation automated
- [ ] Message synchronization working both ways
- [ ] Webhook handling for real-time updates
- [ ] Chat widget integrated in customer portal

### Real-time Features
- [ ] WebSocket service with auto-reconnection
- [ ] Live notifications across all features
- [ ] Real-time typing indicators
- [ ] Live status updates for bookings/repairs
- [ ] Multi-device synchronization

### Communication Hub
- [ ] Unified chat, email, SMS coordination
- [ ] Agent assignment and routing
- [ ] Conversation history and context
- [ ] File sharing in chat conversations
- [ ] Automated responses and chatbots

### Mobile Real-time
- [ ] Push notifications for mobile users
- [ ] Offline message queuing
- [ ] Background sync when app returns online
- [ ] Mobile-optimized chat interface
- [ ] Voice message support

### Admin Collaboration
- [ ] Real-time admin dashboard updates
- [ ] Team chat and internal messaging
- [ ] Live repair status collaboration
- [ ] Shared customer context
- [ ] Activity feeds and updates

---

**Session 5 Success Criteria**: Complete real-time communication system with Chatwoot integration, live notifications, and seamless multi-channel customer support.

**Next Session**: Execute Session 6 using `SESSION_6_SECURITY_PERFORMANCE_GUIDE.md` for production hardening and optimization.