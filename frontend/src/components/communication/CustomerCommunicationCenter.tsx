'use client';

/**
 * Customer Communication Center Component
 * 
 * Comprehensive communication hub for customers:
 * - Real-time chat with technicians and support
 * - Video consultation and screen sharing
 * - File sharing and photo uploads
 * - Voice messages and audio calls
 * - Automated notifications and updates
 * - Multi-channel communication (SMS, email, push)
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { 
  MessageCircle, 
  Phone, 
  Video, 
  Paperclip, 
  Mic, 
  Send, 
  User, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Image,
  FileText,
  Download,
  Camera,
  Settings,
  Volume2,
  VolumeX,
  Maximize,
  Minimize
} from 'lucide-react';

interface Message {
  id: string;
  from: 'customer' | 'technician' | 'support' | 'system';
  fromName: string;
  fromAvatar?: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'voice' | 'video' | 'system';
  timestamp: string;
  read: boolean;
  repairId?: string;
  attachments?: Attachment[];
  replyTo?: string;
  reactions?: Reaction[];
}

interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'document' | 'audio' | 'video';
  url: string;
  size: number;
  thumbnail?: string;
}

interface Reaction {
  id: string;
  emoji: string;
  userId: string;
  userName: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  title: string;
  participants: Participant[];
  lastMessage?: Message;
  unreadCount: number;
  status: 'active' | 'archived' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface Participant {
  id: string;
  name: string;
  role: 'customer' | 'technician' | 'support' | 'manager';
  avatar?: string;
  isOnline: boolean;
  lastSeen?: string;
}

interface VideoCall {
  id: string;
  status: 'calling' | 'connected' | 'ended';
  participants: Participant[];
  duration: number;
  quality: 'low' | 'medium' | 'high';
  features: {
    screenShare: boolean;
    recording: boolean;
    chat: boolean;
  };
}

interface CustomerCommunicationCenterProps {
  customerId: string;
  repairId?: string;
  initialConversationId?: string;
  enableVideo?: boolean;
  enableVoice?: boolean;
  enableFileSharing?: boolean;
  className?: string;
}

export default function CustomerCommunicationCenter({
  customerId,
  repairId,
  initialConversationId,
  enableVideo = true,
  enableVoice = true,
  enableFileSharing = true,
  className = ''
}: CustomerCommunicationCenterProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(initialConversationId || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState<string[]>([]);
  const [videoCall, setVideoCall] = useState<VideoCall | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [notifications, setNotifications] = useState({
    sound: true,
    push: true,
    email: true,
    sms: false
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordingRef = useRef<MediaRecorder | null>(null);

  // Load conversations
  useEffect(() => {
    // Mock conversations data
    const mockConversations: Conversation[] = [
      {
        id: 'conv-001',
        title: 'MacBook Pro Screen Repair',
        participants: [
          {
            id: 'tech-001',
            name: 'Sarah Johnson',
            role: 'technician',
            avatar: '/avatars/sarah.jpg',
            isOnline: true,
            lastSeen: new Date().toISOString()
          },
          {
            id: customerId,
            name: 'You',
            role: 'customer',
            isOnline: true
          }
        ],
        lastMessage: {
          id: 'msg-last',
          from: 'technician',
          fromName: 'Sarah Johnson',
          content: 'The replacement screen has arrived and I\'m starting the repair now. Should be completed within 2 hours.',
          type: 'text',
          timestamp: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
          read: false
        },
        unreadCount: 2,
        status: 'active',
        priority: 'normal',
        tags: ['repair', 'screen', 'macbook'],
        createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        updatedAt: new Date(Date.now() - 300000).toISOString()
      },
      {
        id: 'conv-002',
        title: 'General Support',
        participants: [
          {
            id: 'support-001',
            name: 'Mike Chen',
            role: 'support',
            avatar: '/avatars/mike.jpg',
            isOnline: false,
            lastSeen: new Date(Date.now() - 1800000).toISOString() // 30 minutes ago
          },
          {
            id: customerId,
            name: 'You',
            role: 'customer',
            isOnline: true
          }
        ],
        lastMessage: {
          id: 'msg-support',
          from: 'support',
          fromName: 'Mike Chen',
          content: 'I\'ve updated your delivery address. Is there anything else I can help you with?',
          type: 'text',
          timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          read: true
        },
        unreadCount: 0,
        status: 'active',
        priority: 'low',
        tags: ['support', 'general'],
        createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        updatedAt: new Date(Date.now() - 3600000).toISOString()
      }
    ];

    setConversations(mockConversations);
    
    if (!activeConversation && mockConversations.length > 0) {
      setActiveConversation(mockConversations[0].id);
    }
  }, [customerId, activeConversation]);

  // Load messages for active conversation
  useEffect(() => {
    if (activeConversation) {
      // Mock messages for the conversation
      const mockMessages: Message[] = [
        {
          id: 'msg-001',
          from: 'system',
          fromName: 'System',
          content: 'Welcome to your repair communication center. Your technician Sarah Johnson will be with you shortly.',
          type: 'system',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          read: true,
          repairId: repairId
        },
        {
          id: 'msg-002',
          from: 'technician',
          fromName: 'Sarah Johnson',
          fromAvatar: '/avatars/sarah.jpg',
          content: 'Hi! I\'ve received your MacBook Pro and completed the initial diagnostic. The screen assembly needs to be replaced as suspected.',
          type: 'text',
          timestamp: new Date(Date.now() - 82800000).toISOString(),
          read: true,
          repairId: repairId
        },
        {
          id: 'msg-003',
          from: 'technician',
          fromName: 'Sarah Johnson',
          fromAvatar: '/avatars/sarah.jpg',
          content: 'Here are some photos showing the extent of the damage:',
          type: 'text',
          timestamp: new Date(Date.now() - 82740000).toISOString(),
          read: true,
          repairId: repairId,
          attachments: [
            {
              id: 'att-001',
              name: 'macbook-damage-assessment.jpg',
              type: 'image',
              url: '/repair-photos/macbook-damage.jpg',
              size: 2048000,
              thumbnail: '/repair-photos/macbook-damage-thumb.jpg'
            },
            {
              id: 'att-002',
              name: 'internal-inspection.jpg',
              type: 'image',
              url: '/repair-photos/macbook-internal.jpg',
              size: 1856000,
              thumbnail: '/repair-photos/macbook-internal-thumb.jpg'
            }
          ]
        },
        {
          id: 'msg-004',
          from: 'customer',
          fromName: 'You',
          content: 'Thanks for the detailed photos. How long will the repair take?',
          type: 'text',
          timestamp: new Date(Date.now() - 82680000).toISOString(),
          read: true,
          repairId: repairId
        },
        {
          id: 'msg-005',
          from: 'technician',
          fromName: 'Sarah Johnson',
          fromAvatar: '/avatars/sarah.jpg',
          content: 'The replacement screen has arrived and I\'m starting the repair now. Should be completed within 2 hours.',
          type: 'text',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          read: false,
          repairId: repairId
        }
      ];

      setMessages(mockMessages);
    }
  }, [activeConversation, repairId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Send message
  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !activeConversation) return;

    const message: Message = {
      id: `msg-${Date.now()}`,
      from: 'customer',
      fromName: 'You',
      content: newMessage.trim(),
      type: 'text',
      timestamp: new Date().toISOString(),
      read: true,
      repairId: repairId
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // Update conversation last message
    setConversations(prev => prev.map(conv => 
      conv.id === activeConversation 
        ? { ...conv, lastMessage: message, updatedAt: new Date().toISOString() }
        : conv
    ));

    // Simulate technician response (for demo)
    setTimeout(() => {
      const responses = [
        'Thanks for your message. I\'ll update you shortly.',
        'Understood. Let me check on that for you.',
        'I\'ve noted your request and will address it right away.',
        'Great question! Let me get back to you with details.'
      ];
      
      const response: Message = {
        id: `msg-${Date.now()}-response`,
        from: 'technician',
        fromName: 'Sarah Johnson',
        fromAvatar: '/avatars/sarah.jpg',
        content: responses[Math.floor(Math.random() * responses.length)],
        type: 'text',
        timestamp: new Date().toISOString(),
        read: false,
        repairId: repairId
      };

      setMessages(prev => [...prev, response]);
      
      // Show notification
      if (notifications.sound && 'Audio' in window) {
        const audio = new Audio('/sounds/message-notification.mp3');
        audio.play().catch(() => {});
      }
    }, 2000 + Math.random() * 3000);
  }, [newMessage, activeConversation, repairId, notifications.sound]);

  // Handle file upload
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !activeConversation) return;

    Array.from(files).forEach(file => {
      const attachment: Attachment = {
        id: `att-${Date.now()}`,
        name: file.name,
        type: file.type.startsWith('image/') ? 'image' : 'document',
        url: URL.createObjectURL(file),
        size: file.size
      };

      const message: Message = {
        id: `msg-${Date.now()}-file`,
        from: 'customer',
        fromName: 'You',
        content: `Shared ${file.name}`,
        type: 'file',
        timestamp: new Date().toISOString(),
        read: true,
        repairId: repairId,
        attachments: [attachment]
      };

      setMessages(prev => [...prev, message]);
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [activeConversation, repairId]);

  // Start voice recording
  const startRecording = useCallback(async () => {
    if (!enableVoice) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      recordingRef.current = mediaRecorder;

      const chunks: BlobPart[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        
        const message: Message = {
          id: `msg-${Date.now()}-voice`,
          from: 'customer',
          fromName: 'You',
          content: 'Voice message',
          type: 'voice',
          timestamp: new Date().toISOString(),
          read: true,
          repairId: repairId,
          attachments: [{
            id: `voice-${Date.now()}`,
            name: 'voice-message.webm',
            type: 'audio',
            url,
            size: blob.size
          }]
        };

        setMessages(prev => [...prev, message]);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  }, [enableVoice, repairId]);

  // Stop voice recording
  const stopRecording = useCallback(() => {
    if (recordingRef.current && isRecording) {
      recordingRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  // Start video call
  const startVideoCall = useCallback(async () => {
    if (!enableVideo) return;

    const mockVideoCall: VideoCall = {
      id: `call-${Date.now()}`,
      status: 'calling',
      participants: [
        {
          id: 'tech-001',
          name: 'Sarah Johnson',
          role: 'technician',
          avatar: '/avatars/sarah.jpg',
          isOnline: true
        }
      ],
      duration: 0,
      quality: 'high',
      features: {
        screenShare: false,
        recording: false,
        chat: true
      }
    };

    setVideoCall(mockVideoCall);

    // Simulate call connection
    setTimeout(() => {
      setVideoCall(prev => prev ? { ...prev, status: 'connected' } : null);
    }, 3000);
  }, [enableVideo]);

  // End video call
  const endVideoCall = useCallback(() => {
    setVideoCall(null);
  }, []);

  // Format timestamp
  const formatTimestamp = useCallback((timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  }, []);

  const activeConv = conversations.find(c => c.id === activeConversation);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center space-x-3">
          {activeConv && (
            <>
              <div className="relative">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-500" />
                </div>
                {activeConv.participants.some(p => p.isOnline && p.id !== customerId) && (
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                )}
              </div>
              <div>
                <h3 className="font-semibold">{activeConv.title}</h3>
                <p className="text-sm text-gray-600">
                  {activeConv.participants
                    .filter(p => p.id !== customerId)
                    .map(p => p.isOnline ? `${p.name} (online)` : `${p.name} (${formatTimestamp(p.lastSeen || '')})`)
                    .join(', ')
                  }
                </p>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {enableVideo && (
            <Button size="sm" variant="outline" onClick={startVideoCall}>
              <Video className="w-4 h-4" />
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => setShowSettings(!showSettings)}>
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.from === 'customer' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-xs lg:max-w-md ${message.from === 'customer' ? 'order-1' : 'order-2'}`}>
              {message.from !== 'customer' && message.from !== 'system' && (
                <div className="flex items-center space-x-2 mb-1">
                  <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-3 h-3 text-gray-500" />
                  </div>
                  <span className="text-xs text-gray-600">{message.fromName}</span>
                </div>
              )}
              
              <div
                className={`p-3 rounded-lg ${
                  message.from === 'customer'
                    ? 'bg-blue-600 text-white'
                    : message.from === 'system'
                    ? 'bg-gray-100 text-gray-700 text-center'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {message.attachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center space-x-2">
                        {attachment.type === 'image' ? (
                          <Image className="w-4 h-4" />
                        ) : attachment.type === 'audio' ? (
                          <Volume2 className="w-4 h-4" />
                        ) : (
                          <FileText className="w-4 h-4" />
                        )}
                        <span className="text-xs">{attachment.name}</span>
                        <Button size="sm" variant="ghost">
                          <Download className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="mt-1 text-xs text-gray-500 flex items-center space-x-2">
                <span>{formatTimestamp(message.timestamp)}</span>
                {message.from === 'customer' && (
                  <CheckCircle className="w-3 h-3 text-green-500" />
                )}
              </div>
            </div>
          </div>
        ))}
        
        {isTyping.length > 0 && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3">
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

      {/* Input Area */}
      <div className="p-4 border-t bg-white">
        <div className="flex items-center space-x-2">
          <div className="flex-1 flex items-center space-x-2 border rounded-lg px-3 py-2">
            <Input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 border-0 focus:ring-0 p-0"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            
            {enableFileSharing && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
              </>
            )}
            
            <Button size="sm" variant="ghost" onClick={() => {}}>
              <Camera className="w-4 h-4" />
            </Button>
          </div>
          
          {enableVoice && (
            <Button
              size="sm"
              variant={isRecording ? "destructive" : "outline"}
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
            >
              <Mic className="w-4 h-4" />
            </Button>
          )}
          
          <Button 
            onClick={sendMessage}
            disabled={!newMessage.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Video Call Overlay */}
      {videoCall && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl h-96 bg-gray-900 text-white">
            <div className="p-4 flex items-center justify-between border-b border-gray-700">
              <div className="flex items-center space-x-3">
                <User className="w-8 h-8" />
                <div>
                  <h3 className="font-semibold">Video Call with Sarah Johnson</h3>
                  <p className="text-sm text-gray-400">
                    {videoCall.status === 'calling' ? 'Calling...' : 
                     videoCall.status === 'connected' ? 'Connected' : 'Ended'}
                  </p>
                </div>
              </div>
              <Button variant="destructive" onClick={endVideoCall}>
                End Call
              </Button>
            </div>
            
            <div className="flex-1 flex items-center justify-center">
              {videoCall.status === 'calling' && (
                <div className="text-center">
                  <div className="animate-pulse">
                    <Phone className="w-16 h-16 mx-auto mb-4" />
                  </div>
                  <p>Connecting to technician...</p>
                </div>
              )}
              
              {videoCall.status === 'connected' && (
                <div className="text-center">
                  <Video className="w-16 h-16 mx-auto mb-4" />
                  <p>Video call active</p>
                  <p className="text-sm text-gray-400">This is a demo - actual video would appear here</p>
                </div>
              )}
            </div>
            
            <div className="p-4 flex items-center justify-center space-x-4 border-t border-gray-700">
              <Button size="sm" variant="outline" onClick={() => setIsMuted(!isMuted)}>
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
              <Button size="sm" variant="outline">
                <Maximize className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute top-16 right-4 w-64 bg-white border rounded-lg shadow-lg p-4 z-40">
          <h4 className="font-semibold mb-3">Communication Settings</h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Sound notifications</span>
              <input
                type="checkbox"
                checked={notifications.sound}
                onChange={(e) => setNotifications(prev => ({ ...prev, sound: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Push notifications</span>
              <input
                type="checkbox"
                checked={notifications.push}
                onChange={(e) => setNotifications(prev => ({ ...prev, push: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Email notifications</span>
              <input
                type="checkbox"
                checked={notifications.email}
                onChange={(e) => setNotifications(prev => ({ ...prev, email: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">SMS notifications</span>
              <input
                type="checkbox"
                checked={notifications.sms}
                onChange={(e) => setNotifications(prev => ({ ...prev, sms: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <Button 
            size="sm" 
            className="w-full mt-4" 
            onClick={() => setShowSettings(false)}
          >
            Save Settings
          </Button>
        </div>
      )}
    </div>
  );
}