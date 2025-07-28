'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Icon } from '@/components/ui/Icon';

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type?: 'text' | 'quick-reply' | 'card' | 'typing';
  metadata?: any;
}

interface QuickReply {
  text: string;
  payload: string;
}

interface AIChatbotProps {
  onClose?: () => void;
  userId?: string;
  className?: string;
  minimized?: boolean;
  onMinimize?: () => void;
}

export function AIChatbot({
  onClose,
  userId,
  className = '',
  minimized = false,
  onMinimize
}: AIChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isOpen, setIsOpen] = useState(!minimized);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      content: "Hi! I'm your AI repair assistant. I can help with device issues, repair quotes, booking questions, and more. How can I assist you today?",
      sender: 'ai',
      timestamp: new Date(),
      type: 'text'
    };
    setMessages([welcomeMessage]);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Quick replies for common questions
  const quickReplies: QuickReply[] = [
    { text: "Get repair quote", payload: "quote" },
    { text: "Check repair status", payload: "status" },
    { text: "Book appointment", payload: "booking" },
    { text: "Device diagnostics", payload: "diagnostics" },
    { text: "Warranty info", payload: "warranty" },
    { text: "Contact support", payload: "support" }
  ];

  const handleSendMessage = async (message: string = inputMessage) => {
    if (!message.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: message,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(async () => {
      const aiResponse = await generateAIResponse(message);
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleQuickReply = (payload: string, text: string) => {
    handleSendMessage(text);
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (onMinimize) onMinimize();
  };

  if (minimized || !isOpen) {
    return (
      <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
        <Button
          onClick={toggleChat}
          className="w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-primary hover:bg-primary/90"
        >
          <Icon name="message-circle" className="w-6 h-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 w-96 h-[500px] z-50 ${className}`}>
      <Card className="h-full flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground rounded-t-lg">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mr-3">
              <Icon name="cpu" className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-medium">AI Assistant</h3>
              <p className="text-xs opacity-90">Always here to help</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleChat}
              className="w-8 h-8 p-0 text-primary-foreground hover:bg-white/20"
            >
              <Icon name="minus" className="w-4 h-4" />
            </Button>
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="w-8 h-8 p-0 text-primary-foreground hover:bg-white/20"
              >
                <Icon name="x" className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          
          {isTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Replies */}
        {messages.length <= 2 && (
          <div className="px-4 pb-2">
            <div className="grid grid-cols-2 gap-2">
              {quickReplies.slice(0, 4).map((reply, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleQuickReply(reply.payload, reply.text)}
                  className="text-xs h-8"
                >
                  {reply.text}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex space-x-2">
            <Input
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type your message..."
              className="flex-1"
              disabled={isTyping}
            />
            <Button
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || isTyping}
              size="sm"
            >
              <Icon name="send" className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Message bubble component
function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.sender === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-lg px-3 py-2 ${
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground'
        }`}
      >
        {message.type === 'card' ? (
          <div>{message.content}</div>
        ) : (
          <p className="text-sm">{message.content}</p>
        )}
        <p className="text-xs opacity-70 mt-1">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

// Typing indicator
function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-muted rounded-lg px-3 py-2 max-w-[80%]">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
}

// AI response generator (mock implementation)
async function generateAIResponse(userMessage: string): Promise<ChatMessage> {
  const lowerMessage = userMessage.toLowerCase();
  
  let response = '';
  let metadata = {};

  if (lowerMessage.includes('quote') || lowerMessage.includes('price') || lowerMessage.includes('cost')) {
    response = "I can help you get a repair quote! To provide an accurate estimate, I'll need to know:\n\n• What device do you need repaired?\n• What specific issue are you experiencing?\n• When did the problem start?\n\nWould you like to start our quick diagnostic tool?";
  } else if (lowerMessage.includes('appointment') || lowerMessage.includes('book') || lowerMessage.includes('schedule')) {
    response = "Great! I can help you book a repair appointment. Our available services include:\n\n• In-store diagnosis (Free)\n• Express repair (Same day)\n• Standard repair (2-3 days)\n• Data recovery services\n\nWhat type of service interests you?";
  } else if (lowerMessage.includes('status') || lowerMessage.includes('track') || lowerMessage.includes('progress')) {
    response = "To check your repair status, I'll need your booking reference number. It usually starts with 'REP-' followed by numbers.\n\nAlternatively, I can look it up using your email address or phone number. Which would you prefer?";
  } else if (lowerMessage.includes('diagnostic') || lowerMessage.includes('problem') || lowerMessage.includes('issue')) {
    response = "I can run a quick AI diagnostic! This will help identify potential issues and provide repair recommendations.\n\n🔧 Our AI can analyze:\n• Screen problems\n• Performance issues\n• Battery problems\n• Audio/speaker issues\n• Connectivity problems\n\nShall I start the diagnostic wizard?";
  } else if (lowerMessage.includes('warranty') || lowerMessage.includes('guarantee')) {
    response = "Our warranty information:\n\n✅ All repairs: 6 months warranty\n✅ New parts: 12 months warranty\n✅ Data recovery: 30 days guarantee\n✅ Free re-service if same issue recurs\n\nDo you have a specific warranty question about a previous repair?";
  } else if (lowerMessage.includes('contact') || lowerMessage.includes('support') || lowerMessage.includes('human')) {
    response = "I'll connect you with our human support team! Here are your options:\n\n📞 Call: 0800 123 4567\n💬 Live chat with technician\n📧 Email: support@revivatech.co.uk\n🏪 Visit our store\n\nWould you like me to transfer you to live chat now?";
  } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    response = "Hello! Welcome to RevivaTech! 👋\n\nI'm here to help with all your device repair needs. I can assist with:\n\n• Getting repair quotes\n• Booking appointments\n• Device diagnostics\n• Tracking repairs\n• Technical support\n\nWhat can I help you with today?";
  } else {
    response = "I understand you're asking about device repairs. Let me help you with that!\n\nI can assist with:\n• 📱 Phone & tablet repairs\n• 💻 Laptop & computer fixes\n• 🖥️ Desktop diagnostics\n• 🔧 Hardware troubleshooting\n\nCould you tell me more about your specific device or issue?";
  }

  return {
    id: Date.now().toString(),
    content: response,
    sender: 'ai',
    timestamp: new Date(),
    type: 'text',
    metadata
  };
}

// Floating chat button for pages
export function FloatingChatButton({ className = '' }: { className?: string }) {
  const [showChat, setShowChat] = useState(false);

  return (
    <>
      {!showChat && (
        <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
          <Button
            onClick={() => setShowChat(true)}
            className="w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-primary hover:bg-primary/90 animate-pulse"
          >
            <Icon name="message-circle" className="w-6 h-6" />
          </Button>
          <div className="absolute -top-2 -left-20 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-75">
            Need help?
          </div>
        </div>
      )}
      
      {showChat && (
        <AIChatbot
          onClose={() => setShowChat(false)}
          onMinimize={() => setShowChat(false)}
        />
      )}
    </>
  );
}

// AI chat analytics (for admin dashboard)
export function AIChatAnalytics({ className = '' }: { className?: string }) {
  const [analytics] = useState({
    totalConversations: 1247,
    averageResolution: 2.4,
    satisfactionScore: 4.6,
    commonTopics: [
      { topic: 'Repair Quotes', count: 342, percentage: 27 },
      { topic: 'Booking Appointments', count: 289, percentage: 23 },
      { topic: 'Repair Status', count: 234, percentage: 19 },
      { topic: 'Technical Support', count: 187, percentage: 15 },
      { topic: 'Warranty Questions', count: 123, percentage: 10 },
      { topic: 'Other', count: 72, percentage: 6 }
    ]
  });

  return (
    <Card className={`p-6 ${className}`}>
      <h3 className="text-lg font-semibold mb-4">AI Chat Analytics</h3>
      
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">{analytics.totalConversations}</div>
          <div className="text-sm text-muted-foreground">Total Conversations</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{analytics.averageResolution}min</div>
          <div className="text-sm text-muted-foreground">Avg Resolution Time</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">{analytics.satisfactionScore}/5</div>
          <div className="text-sm text-muted-foreground">Satisfaction Score</div>
        </div>
      </div>

      <div>
        <h4 className="font-medium mb-3">Common Topics</h4>
        <div className="space-y-2">
          {analytics.commonTopics.map((topic, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm">{topic.topic}</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full" 
                    style={{ width: `${topic.percentage}%` }}
                  ></div>
                </div>
                <span className="text-xs text-muted-foreground w-8 text-right">
                  {topic.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}