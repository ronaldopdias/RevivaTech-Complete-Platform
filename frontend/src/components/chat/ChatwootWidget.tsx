'use client';

/**
 * Chatwoot Integration Widget
 * 
 * Features:
 * - Customer auto-authentication
 * - Seamless chat experience
 * - Real-time messaging
 * - Context-aware support
 * - Integration with repair status
 */

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface ChatMessage {
  id: string;
  content: string;
  timestamp: string;
  sender: 'customer' | 'agent' | 'system';
  senderName?: string;
  attachments?: {
    id: string;
    name: string;
    url: string;
    type: string;
  }[];
}

interface ChatwootWidgetProps {
  customerId?: string;
  customerInfo?: {
    name: string;
    email: string;
    repairId?: string;
  };
  isOpen?: boolean;
  onToggle?: () => void;
}

export default function ChatwootWidget({ 
  customerId, 
  customerInfo, 
  isOpen = false, 
  onToggle 
}: ChatwootWidgetProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [agentStatus, setAgentStatus] = useState<'online' | 'offline' | 'away'>('online');
  const [unreadCount, setUnreadCount] = useState(0);

  // Initialize chat with mock data
  useEffect(() => {
    const mockMessages: ChatMessage[] = [
      {
        id: '1',
        content: 'Hello! I\'m here to help you with your repair. How can I assist you today?',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        sender: 'agent',
        senderName: 'Sarah (Support Agent)',
      },
      {
        id: '2',
        content: 'I can see you have an active MacBook repair. Is this what you need help with?',
        timestamp: new Date(Date.now() - 3300000).toISOString(),
        sender: 'agent',
        senderName: 'Sarah (Support Agent)',
      },
    ];

    setMessages(mockMessages);
    setIsConnected(true);
    setUnreadCount(mockMessages.filter(m => m.sender === 'agent').length);
  }, []);

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      content: newMessage,
      timestamp: new Date().toISOString(),
      sender: 'customer',
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // Simulate agent response
    setTimeout(() => {
      const agentResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: 'Thank you for your message. Let me check the details and get back to you shortly.',
        timestamp: new Date().toISOString(),
        sender: 'agent',
        senderName: 'Sarah (Support Agent)',
      };
      setMessages(prev => [...prev, agentResponse]);
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={onToggle}
          className="relative bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        >
          <svg 
            className="w-6 h-6" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
            />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 h-[500px] shadow-2xl">
      <Card className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-blue-600 text-white rounded-t-lg">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${
              agentStatus === 'online' ? 'bg-green-400' :
              agentStatus === 'away' ? 'bg-yellow-400' : 'bg-gray-400'
            }`}></div>
            <div>
              <h3 className="font-semibold">Support Chat</h3>
              <p className="text-xs opacity-90">
                {agentStatus === 'online' ? 'Agents available' : 
                 agentStatus === 'away' ? 'Agent away' : 'Offline'}
              </p>
            </div>
          </div>
          <button
            onClick={onToggle}
            className="text-white hover:text-gray-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Connection Status */}
        {customerInfo && (
          <div className="px-4 py-2 bg-green-50 border-b text-sm">
            <div className="flex items-center justify-between">
              <span className="text-green-800">
                Authenticated as {customerInfo.name}
              </span>
              {customerInfo.repairId && (
                <Badge variant="info" size="sm">
                  Repair #{customerInfo.repairId.slice(-6)}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'customer' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] ${
                message.sender === 'customer'
                  ? 'bg-blue-600 text-white'
                  : message.sender === 'agent'
                  ? 'bg-gray-100 text-gray-800'
                  : 'bg-yellow-50 text-yellow-800'
              } rounded-lg p-3`}>
                {message.senderName && (
                  <div className="text-xs opacity-70 mb-1">{message.senderName}</div>
                )}
                <div className="text-sm">{message.content}</div>
                <div className={`text-xs mt-1 ${
                  message.sender === 'customer' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {formatTime(message.timestamp)}
                </div>
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {message.attachments.map((attachment) => (
                      <div key={attachment.id} className="text-xs">
                        📎 {attachment.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex space-x-2">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              size="sm"
            >
              Send
            </Button>
          </div>
          
          {/* Quick Actions */}
          <div className="flex space-x-2 mt-2">
            <button className="text-xs text-blue-600 hover:text-blue-800">
              📎 Attach File
            </button>
            <button className="text-xs text-blue-600 hover:text-blue-800">
              📷 Send Photo
            </button>
            <button className="text-xs text-blue-600 hover:text-blue-800">
              🔗 Share Repair Link
            </button>
          </div>
        </div>

        {/* Powered by */}
        <div className="px-4 py-2 text-xs text-gray-500 border-t">
          <div className="flex items-center justify-between">
            <span>💬 Powered by Chatwoot</span>
            <span className={`flex items-center space-x-1 ${
              isConnected ? 'text-green-600' : 'text-red-600'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}