'use client';

/**
 * Real-Time Chat System Test Page
 * 
 * Comprehensive testing environment for the chat system:
 * - Multi-user simulation
 * - Different user roles (customer, technician, admin, AI)
 * - File sharing and image uploads
 * - Video call simulation
 * - Typing indicators and read receipts
 * - AI assistant integration
 * - Real-time notifications
 */

import React, { useState, useEffect } from 'react';
import RealTimeChatSystem, { ChatParticipant, ChatRoom } from '@/components/chat/RealTimeChatSystem';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';

interface TestUser {
  participant: ChatParticipant;
  active: boolean;
  chatProps: any;
}

const TEST_USERS: TestUser[] = [
  {
    participant: {
      id: 'customer_1',
      name: 'John Smith',
      role: 'customer',
      status: 'online',
      avatar: 'https://api.dicebear.com/6.x/initials/svg?seed=john',
    },
    active: false,
    chatProps: {}
  },
  {
    participant: {
      id: 'technician_1',
      name: 'Alex Rodriguez',
      role: 'technician',
      status: 'online',
      avatar: 'https://api.dicebear.com/6.x/initials/svg?seed=alex',
      expertise: ['MacBook Repair', 'iOS Troubleshooting', 'Hardware Diagnostics']
    },
    active: false,
    chatProps: {}
  },
  {
    participant: {
      id: 'admin_1',
      name: 'Sarah Manager',
      role: 'admin',
      status: 'online',
      avatar: 'https://api.dicebear.com/6.x/initials/svg?seed=sarah',
      expertise: ['Customer Support', 'System Management', 'Quality Assurance']
    },
    active: false,
    chatProps: {}
  },
  {
    participant: {
      id: 'customer_2',
      name: 'Emily Chen',
      role: 'customer',
      status: 'away',
      avatar: 'https://api.dicebear.com/6.x/initials/svg?seed=emily',
    },
    active: false,
    chatProps: {}
  }
];

const TEST_SCENARIOS = [
  {
    id: 'macbook_screen_issue',
    name: 'MacBook Screen Issue',
    description: 'Customer with MacBook Pro screen flickering problem',
    repairTicketId: 'RPR-2025-001',
    participants: ['customer_1', 'technician_1'],
    initialMessages: [
      'Hi, I\'m having issues with my MacBook Pro screen flickering',
      'The screen goes black randomly and comes back after a few seconds',
      'It\'s getting worse and I\'m worried about losing my work'
    ]
  },
  {
    id: 'iphone_battery_drain',
    name: 'iPhone Battery Drain',
    description: 'Customer with rapid battery drainage on iPhone',
    repairTicketId: 'RPR-2025-002',
    participants: ['customer_2', 'technician_1'],
    initialMessages: [
      'My iPhone 14 Pro battery drains incredibly fast',
      'Goes from 100% to 20% in about 2 hours',
      'Also gets very hot during charging'
    ]
  },
  {
    id: 'gaming_pc_overheating',
    name: 'Gaming PC Overheating',
    description: 'Custom gaming PC with thermal issues and crashes',
    repairTicketId: 'RPR-2025-003',
    participants: ['customer_1', 'technician_1', 'admin_1'],
    initialMessages: [
      'Gaming PC overheating and crashing during games',
      'Fans running at maximum speed constantly',
      'Sometimes I smell something burning'
    ]
  }
];

export default function ChatSystemTestPage() {
  const [activeUsers, setActiveUsers] = useState<Set<string>>(new Set());
  const [selectedScenario, setSelectedScenario] = useState(TEST_SCENARIOS[0]);
  const [chatRooms, setChatRooms] = useState<Map<string, ChatRoom>>(new Map());
  const [testMode, setTestMode] = useState<'single' | 'multi' | 'scenario'>('single');
  const [stats, setStats] = useState({
    messagesExchanged: 0,
    activeConnections: 0,
    aiInteractions: 0,
    filesShaped: 0
  });

  // Initialize test chat rooms
  useEffect(() => {
    const rooms = new Map<string, ChatRoom>();
    
    TEST_SCENARIOS.forEach(scenario => {
      const participants = scenario.participants.map(userId => 
        TEST_USERS.find(u => u.participant.id === userId)?.participant
      ).filter(Boolean) as ChatParticipant[];

      const room: ChatRoom = {
        id: `room_${scenario.id}`,
        name: scenario.name,
        type: 'support',
        participants,
        unreadCount: 0,
        createdAt: new Date().toISOString(),
        repairTicketId: scenario.repairTicketId,
        metadata: {
          priority: 'medium',
          tags: ['support', 'repair']
        }
      };

      rooms.set(room.id, room);
    });

    setChatRooms(rooms);
  }, []);

  const toggleUser = (userId: string) => {
    setActiveUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const activateScenario = (scenario: typeof TEST_SCENARIOS[0]) => {
    setSelectedScenario(scenario);
    
    // Activate users for this scenario
    const newActiveUsers = new Set(scenario.participants);
    setActiveUsers(newActiveUsers);
    setTestMode('scenario');
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'customer': return 'bg-blue-100 text-blue-800';
      case 'technician': return 'bg-green-100 text-green-800';
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'ai': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Real-Time Chat System Test Lab
          </h1>
          <p className="text-gray-600 mb-4">
            Test multi-user chat, AI assistance, file sharing, and video calls
          </p>
          
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="info">💬 Real-time Chat</Badge>
            <Badge variant="success">🤖 AI Assistant</Badge>
            <Badge variant="warning">📁 File Sharing</Badge>
            <Badge variant="secondary">📹 Video Calls</Badge>
          </div>
        </div>

        {/* Test Statistics */}
        <Card className="p-4 mb-6 bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-3">📊 Test Session Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.messagesExchanged}</div>
              <div className="text-sm text-blue-700">Messages Exchanged</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{activeUsers.size}</div>
              <div className="text-sm text-blue-700">Active Connections</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.aiInteractions}</div>
              <div className="text-sm text-blue-700">AI Interactions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.filesShaped}</div>
              <div className="text-sm text-blue-700">Files Shared</div>
            </div>
          </div>
        </Card>

        {/* Test Mode Selection */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🧪 Test Mode</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setTestMode('single')}
              className={`p-4 border-2 rounded-lg text-left transition-all ${
                testMode === 'single'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-lg">Single User</div>
              <div className="text-sm text-gray-600">Test individual chat functionality</div>
            </button>
            <button
              onClick={() => setTestMode('multi')}
              className={`p-4 border-2 rounded-lg text-left transition-all ${
                testMode === 'multi'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-lg">Multi-User</div>
              <div className="text-sm text-gray-600">Test multiple simultaneous chats</div>
            </button>
            <button
              onClick={() => setTestMode('scenario')}
              className={`p-4 border-2 rounded-lg text-left transition-all ${
                testMode === 'scenario'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-lg">Scenarios</div>
              <div className="text-sm text-gray-600">Test realistic repair scenarios</div>
            </button>
          </div>
        </Card>

        {/* Test Scenarios */}
        {testMode === 'scenario' && (
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">📋 Test Scenarios</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {TEST_SCENARIOS.map((scenario) => (
                <button
                  key={scenario.id}
                  onClick={() => activateScenario(scenario)}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    selectedScenario.id === scenario.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-lg mb-1">{scenario.name}</div>
                  <div className="text-sm text-gray-600 mb-2">{scenario.description}</div>
                  <div className="text-xs text-gray-500">
                    Ticket: {scenario.repairTicketId}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {scenario.participants.map(userId => {
                      const user = TEST_USERS.find(u => u.participant.id === userId);
                      return user ? (
                        <Badge key={userId} className={`text-xs ${getRoleColor(user.participant.role)}`}>
                          {user.participant.role}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* User Selection */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">👥 Test Users</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {TEST_USERS.map((testUser) => (
              <button
                key={testUser.participant.id}
                onClick={() => toggleUser(testUser.participant.id)}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  activeUsers.has(testUser.participant.id)
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-sm font-medium">
                      {testUser.participant.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(testUser.participant.status)}`}></div>
                  </div>
                  <div>
                    <div className="font-medium">{testUser.participant.name}</div>
                    <Badge className={`text-xs ${getRoleColor(testUser.participant.role)}`}>
                      {testUser.participant.role}
                    </Badge>
                  </div>
                </div>
                {testUser.participant.expertise && (
                  <div className="text-xs text-gray-500">
                    Skills: {testUser.participant.expertise.join(', ')}
                  </div>
                )}
                <div className="mt-2">
                  {activeUsers.has(testUser.participant.id) ? (
                    <Badge variant="success">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Chat Interfaces */}
        {activeUsers.size > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-center">💬 Active Chat Sessions</h2>
            
            <div className={`grid gap-6 ${
              activeUsers.size === 1 ? 'grid-cols-1 max-w-4xl mx-auto' :
              activeUsers.size === 2 ? 'grid-cols-1 lg:grid-cols-2' :
              'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'
            }`}>
              {Array.from(activeUsers).map(userId => {
                const testUser = TEST_USERS.find(u => u.participant.id === userId);
                if (!testUser) return null;

                const activeRoom = testMode === 'scenario' 
                  ? chatRooms.get(`room_${selectedScenario.id}`)
                  : undefined;

                return (
                  <Card key={userId} className="overflow-hidden">
                    <div className="bg-gray-100 p-3 border-b">
                      <div className="flex items-center space-x-2">
                        <div className="relative">
                          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm font-medium">
                            {testUser.participant.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-white ${getStatusColor(testUser.participant.status)}`}></div>
                        </div>
                        <div>
                          <div className="font-medium text-sm">{testUser.participant.name}</div>
                          <Badge className={`text-xs ${getRoleColor(testUser.participant.role)}`}>
                            {testUser.participant.role}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <RealTimeChatSystem
                      currentUser={testUser.participant}
                      repairTicketId={testMode === 'scenario' ? selectedScenario.repairTicketId : undefined}
                      initialRoom={activeRoom}
                      onRoomChange={(room) => {
                        setChatRooms(prev => new Map(prev.set(room.id, room)));
                      }}
                      embedded={true}
                      className="border-0"
                    />
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* No Active Users Message */}
        {activeUsers.size === 0 && (
          <Card className="p-8 text-center">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-xl font-semibold mb-2">No Active Chat Sessions</h3>
            <p className="text-gray-600 mb-4">
              Select users above to start testing the chat system
            </p>
            <Button onClick={() => setActiveUsers(new Set(['customer_1']))}>
              Start with Customer Chat
            </Button>
          </Card>
        )}

        {/* Feature Testing Guide */}
        <Card className="p-6 mt-6 bg-green-50 border-green-200">
          <h3 className="font-semibold text-green-800 mb-4">🧪 Testing Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium text-green-700 mb-2">Real-time Messaging</h4>
              <ul className="text-sm text-green-600 space-y-1">
                <li>• Send messages between users</li>
                <li>• Test typing indicators</li>
                <li>• Verify message delivery status</li>
                <li>• Check read receipts</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-green-700 mb-2">AI Assistant</h4>
              <ul className="text-sm text-green-600 space-y-1">
                <li>• Click 🤖 button to request AI help</li>
                <li>• Test diagnostic suggestions</li>
                <li>• Verify cost estimations</li>
                <li>• Check escalation to technician</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-green-700 mb-2">File Sharing</h4>
              <ul className="text-sm text-green-600 space-y-1">
                <li>• Click 📎 to attach files</li>
                <li>• Upload damage photos</li>
                <li>• Share documents</li>
                <li>• Test image preview</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-green-700 mb-2">Video Calls</h4>
              <ul className="text-sm text-green-600 space-y-1">
                <li>• Click 📹 to start video call</li>
                <li>• Test call invitations</li>
                <li>• Simulate call acceptance/decline</li>
                <li>• Check call status messages</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-green-700 mb-2">Multi-user Chat</h4>
              <ul className="text-sm text-green-600 space-y-1">
                <li>• Activate multiple users</li>
                <li>• Test group conversations</li>
                <li>• Verify participant indicators</li>
                <li>• Check online status updates</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-green-700 mb-2">Scenarios</h4>
              <ul className="text-sm text-green-600 space-y-1">
                <li>• Test realistic repair cases</li>
                <li>• Customer-technician interactions</li>
                <li>• Admin oversight capabilities</li>
                <li>• Escalation workflows</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}