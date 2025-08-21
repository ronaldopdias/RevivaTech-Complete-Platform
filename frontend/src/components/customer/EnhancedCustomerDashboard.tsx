'use client';

/**
 * Enhanced Customer Dashboard
 * Advanced customer portal with real-time tracking and comprehensive features
 * 
 * Features:
 * - Real-time repair tracking with live updates
 * - Interactive repair timeline
 * - File upload and photo sharing
 * - Communication center with messaging
 * - Invoice and payment management
 * - Appointment scheduling
 * - Loyalty points and rewards
 * - Order history and reordering
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Smartphone,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  FileText,
  Calendar,
  Star,
  Gift,
  Download,
  Upload,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Package,
  Wrench,
  Shield,
  Bell,
  Settings,
  History,
  Users,
  Camera
} from 'lucide-react';

// Repair Status Types
interface RepairStatus {
  id: string;
  name: string;
  description: string;
  completed: boolean;
  timestamp?: Date;
  estimatedCompletion?: Date;
  technician?: string;
  notes?: string;
}

interface Repair {
  id: string;
  deviceType: string;
  deviceModel: string;
  issue: string;
  status: 'received' | 'diagnosing' | 'parts_ordered' | 'repairing' | 'testing' | 'ready' | 'completed';
  createdAt: Date;
  estimatedCompletion: Date;
  actualCompletion?: Date;
  cost: number;
  technician: string;
  statuses: RepairStatus[];
  photos: string[];
  invoiceId?: string;
  warrantyExpires?: Date;
}

interface Message {
  id: string;
  from: 'customer' | 'technician' | 'admin';
  content: string;
  timestamp: Date;
  attachments?: string[];
  repairId?: string;
}

interface LoyaltyProgram {
  points: number;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  nextTierPoints: number;
  totalSpent: number;
  completedRepairs: number;
}

// Mock data
const mockRepairs: Repair[] = [
  {
    id: 'REP-001',
    deviceType: 'iPhone',
    deviceModel: 'iPhone 14 Pro',
    issue: 'Cracked screen replacement',
    status: 'repairing',
    createdAt: new Date('2024-01-15'),
    estimatedCompletion: new Date('2024-01-18'),
    cost: 289.99,
    technician: 'Sarah Johnson',
    statuses: [
      {
        id: '1',
        name: 'Received',
        description: 'Device received and logged',
        completed: true,
        timestamp: new Date('2024-01-15T09:00:00')
      },
      {
        id: '2',
        name: 'Initial Diagnosis',
        description: 'Assessing damage and creating repair plan',
        completed: true,
        timestamp: new Date('2024-01-15T10:30:00')
      },
      {
        id: '3',
        name: 'Parts Ordered',
        description: 'Genuine Apple screen ordered',
        completed: true,
        timestamp: new Date('2024-01-15T14:00:00')
      },
      {
        id: '4',
        name: 'Repair in Progress',
        description: 'Screen replacement underway',
        completed: false,
        estimatedCompletion: new Date('2024-01-17T16:00:00')
      },
      {
        id: '5',
        name: 'Quality Testing',
        description: 'Testing all functions post-repair',
        completed: false
      },
      {
        id: '6',
        name: 'Ready for Collection',
        description: 'Repair completed successfully',
        completed: false
      }
    ],
    photos: ['/images/repairs/iphone-before.jpg', '/images/repairs/iphone-progress.jpg'],
    warrantyExpires: new Date('2025-01-18')
  }
];

const mockMessages: Message[] = [
  {
    id: 'msg-1',
    from: 'technician',
    content: 'Hi! Your iPhone screen repair is progressing well. We\'ve successfully removed the damaged screen and are now installing the new genuine Apple display. Expected completion is tomorrow afternoon.',
    timestamp: new Date('2024-01-16T14:30:00'),
    repairId: 'REP-001'
  },
  {
    id: 'msg-2',
    from: 'customer',
    content: 'Thanks for the update! Is the new screen the same quality as the original?',
    timestamp: new Date('2024-01-16T15:45:00'),
    repairId: 'REP-001'
  }
];

const mockLoyalty: LoyaltyProgram = {
  points: 850,
  tier: 'Gold',
  nextTierPoints: 1200,
  totalSpent: 1450.99,
  completedRepairs: 8
};

// Repair Timeline Component
const RepairTimeline: React.FC<{ repair: Repair }> = ({ repair }) => {
  const getStatusIcon = (status: RepairStatus) => {
    if (status.completed) return <CheckCircle className="h-5 w-5 text-green-500" />;
    return <Clock className="h-5 w-5 text-gray-400" />;
  };

  const currentProgress = (repair.statuses.filter(s => s.completed).length / repair.statuses.length) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          {repair.deviceModel} - {repair.issue}
        </CardTitle>
        <CardDescription>
          Repair ID: {repair.id} | Technician: {repair.technician}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{Math.round(currentProgress)}% Complete</span>
          </div>
          <Progress value={currentProgress} className="h-2" />
        </div>

        {/* Timeline */}
        <div className="space-y-4">
          {repair.statuses.map((status, index) => (
            <div key={status.id} className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                {getStatusIcon(status)}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className={`font-medium ${status.completed ? 'text-gray-900' : 'text-gray-500'}`}>
                    {status.name}
                  </h4>
                  {status.timestamp && (
                    <span className="text-sm text-gray-500">
                      {status.timestamp.toLocaleDateString()} {status.timestamp.toLocaleTimeString()}
                    </span>
                  )}
                </div>
                <p className={`text-sm ${status.completed ? 'text-gray-600' : 'text-gray-400'}`}>
                  {status.description}
                </p>
                {status.estimatedCompletion && !status.completed && (
                  <p className="text-sm text-blue-600">
                    Estimated completion: {status.estimatedCompletion.toLocaleDateString()}
                  </p>
                )}
                {status.notes && (
                  <p className="text-sm text-gray-600 italic">{status.notes}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-4 border-t">
          <Button variant="outline" size="sm">
            <MessageSquare className="h-4 w-4 mr-2" />
            Message Technician
          </Button>
          <Button variant="outline" size="sm">
            <Camera className="h-4 w-4 mr-2" />
            View Photos
          </Button>
          {repair.invoiceId && (
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              View Invoice
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Messages Component
const MessagesCenter: React.FC<{ messages: Message[] }> = ({ messages }) => {
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // In real implementation, this would send the message
      console.log('Sending message:', newMessage);
      setNewMessage('');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Messages
        </CardTitle>
        <CardDescription>
          Communicate with our technical team
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-64 overflow-y-auto mb-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.from === 'customer' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.from === 'customer'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p className={`text-xs mt-1 ${
                  message.from === 'customer' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <Button onClick={handleSendMessage}>Send</Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Loyalty Program Component
const LoyaltyCard: React.FC<{ loyalty: LoyaltyProgram }> = ({ loyalty }) => {
  const progressToNext = (loyalty.points / loyalty.nextTierPoints) * 100;
  const pointsNeeded = loyalty.nextTierPoints - loyalty.points;

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Bronze': return 'text-orange-600 bg-orange-100';
      case 'Silver': return 'text-gray-600 bg-gray-100';
      case 'Gold': return 'text-yellow-600 bg-yellow-100';
      case 'Platinum': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Loyalty Program
          </div>
          <Badge className={`${getTierColor(loyalty.tier)} text-sm`}>
            {loyalty.tier}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold">{loyalty.points}</p>
            <p className="text-sm opacity-90">Current Points</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{loyalty.completedRepairs}</p>
            <p className="text-sm opacity-90">Repairs Completed</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress to Platinum</span>
            <span>{pointsNeeded} points needed</span>
          </div>
          <Progress value={progressToNext} className="h-2 bg-white/20" />
        </div>

        <div className="pt-2 border-t border-white/20">
          <p className="text-sm opacity-90">
            Total Spent: £{loyalty.totalSpent.toFixed(2)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

// Main Enhanced Customer Dashboard
export const EnhancedCustomerDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('repairs');
  const [notifications, setNotifications] = useState(3);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
            <p className="text-gray-500">Welcome back! Here's what's happening with your repairs.</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
              {notifications > 0 && (
                <Badge className="ml-2 bg-red-500 text-white">{notifications}</Badge>
              )}
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Repairs</p>
                  <p className="text-2xl font-bold">2</p>
                </div>
                <Wrench className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold">8</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Spent</p>
                  <p className="text-2xl font-bold">£1,451</p>
                </div>
                <CreditCard className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Loyalty Points</p>
                  <p className="text-2xl font-bold">850</p>
                </div>
                <Star className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="repairs">Active Repairs</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="loyalty">Loyalty</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          {/* Active Repairs Tab */}
          <TabsContent value="repairs" className="space-y-6">
            {mockRepairs.map((repair) => (
              <RepairTimeline key={repair.id} repair={repair} />
            ))}
            
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button className="w-full">
                    <Package className="h-4 w-4 mr-2" />
                    Book New Repair
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Appointment
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Photos
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages">
            <MessagesCenter messages={mockMessages} />
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Repair History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Historical repairs would be listed here */}
                  <p className="text-gray-500 text-center py-8">
                    Your completed repairs will appear here
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Loyalty Tab */}
          <TabsContent value="loyalty">
            <LoyaltyCard loyalty={mockLoyalty} />
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Profile Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-gray-500 text-center py-8">
                    Profile management interface would be here
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EnhancedCustomerDashboard;