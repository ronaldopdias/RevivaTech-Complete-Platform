'use client';

/**
 * Customer Analytics Widgets - Phase 3 Enhancement
 * 
 * Rich analytics widgets for customer portal:
 * - Repair tracking and satisfaction metrics
 * - Cost savings visualization
 * - Service history analytics
 * - Performance insights
 * - Loyalty program progress
 * - Predictive analytics
 * - Personalized recommendations
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  Heart,
  Gift,
  Award,
  Target,
  Zap,
  BarChart3,
  PieChart,
  Activity,
  Gauge,
  Calendar,
  DollarSign,
  Percent,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  Plus,
  Minus,
  Equal,
  Smartphone,
  Laptop,
  Tablet,
  Monitor,
  HardDrive,
  Wrench,
  Settings,
  Shield,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Phone,
  Mail,
  MapPin,
  Users,
  Building,
  Home,
  Briefcase,
  CreditCard,
  BellRing,
  Sparkles,
  Lightbulb,
  BookOpen,
  PlayCircle,
  Download,
  Upload,
  Share2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Key,
  Fingerprint,
  Scan,
  Search,
  Filter,
  Sort,
  List,
  Grid,
  MoreHorizontal,
  MoreVertical,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  X,
  Info,
  HelpCircle,
  ExternalLink,
  Bookmark,
  Flag,
  Tag,
  Hash,
  AtSign,
  Globe,
  Wifi,
  Database,
  Server,
  Cloud,
  CloudOff,
  RefreshCw,
  RotateCcw,
  Repeat,
  Shuffle,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  Video,
  VideoOff,
  Image,
  FileText,
  File,
  Folder,
  FolderOpen,
  Archive,
  Trash2,
  Edit,
  Copy,
  Scissors,
  Clipboard,
  Link,
  Unlink,
  Maximize,
  Minimize,
  Square,
  Circle,
  Triangle,
  Hexagon,
  Octagon,
  Pentagon,
  Diamond,
  Shapes,
  Palette,
  Brush,
  Pipette,
  Eraser,
  Ruler,
  Compass,
  Calculator,
  Timer,
  Stopwatch,
  Alarm,
  Bell,
  Notification,
  Inbox,
  Send,
  Reply,
  ReplyAll,
  Forward,
  Trash,
  Delete,
  Backspace,
  Command,
  Option,
  Shift,
  Control,
  Alt,
  Enter,
  Space,
  Tab,
  Escape,
  Function,
  Insert,
  End,
  PageUp,
  PageDown,
  ArrowLeft,
  ArrowUpDown,
  ArrowLeftRight,
  Move,
  MousePointer,
  Hand,
  Grab,
  Pointer,
  Crosshair,
  Focus,
  Scope,
  Telescope,
  Binoculars,
  Radar,
  Navigation,
  Route,
  Map,
  Locate,
  LocateFixed,
  LocateOff,
  Satellite,
  Radio,
  Bluetooth,
  Headphones,
  Speaker,
  Microphone,
  Webcam,
  Projector,
  Tv,
  Printer,
  Scanner,
  Fax,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  PhoneForwarded,
  PhoneOff,
  Voicemail,
  MessageCircle,
  MessageSquareMore,
  MessageSquareDot,
  MessageSquareText,
  MessageSquareCode,
  MessageSquareHeart,
  MessageSquareOff,
  MessageSquareReply,
  MessageSquareShare,
  MessageSquareWarning,
  MessageSquareX,
  Gamepad,
  Gamepad2,
  Joystick,
  Dices,
  Dice1,
  Dice2,
  Dice3,
  Dice4,
  Dice5,
  Dice6,
  Spade,
  Club,
  Crown,
  Trophy,
  Medal,
  Ribbon,
  Rosette,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  ShieldOff,
  Security,
  QrCode,
  Barcode,
  Wallet,
  Coins,
  Banknote,
  Receipt,
  ShoppingCart,
  ShoppingBag,
  Store,
  Storefront,
  Package,
  Box,
  Package2,
  PackageOpen,
  PackageCheck,
  PackageX,
  PackagePlus,
  PackageMinus,
  PackageSearch,
  Truck,
  Plane,
  Ship,
  Train,
  Car,
  Bus,
  Bike,
  Scooter,
  Motorcycle,
  Fuel,
  Battery,
  BatteryLow,
  BatteryCharging,
  BatteryFull,
  Plug,
  PlugZap,
  Power,
  PowerOff,
  Sunrise,
  Sunset,
  Sun,
  Moon,
  Stars,
  CloudRain,
  CloudSnow,
  CloudHail,
  CloudLightning,
  CloudFog,
  CloudDrizzle,
  Tornado,
  Rainbow,
  Umbrella,
  Snowflake,
  Thermometer,
  Wind,
  Waves,
  Mountain,
  TreePine,
  TreeDeciduous,
  Flower,
  Leaf,
  Seedling,
  Sprout
} from 'lucide-react';

// Customer Analytics Types
export interface CustomerAnalyticsData {
  repairMetrics: {
    totalRepairs: number;
    activeRepairs: number;
    completedRepairs: number;
    averageRepairTime: number;
    successRate: number;
    costSavings: number;
    satisfactionScore: number;
    repairHistory: RepairHistoryEntry[];
  };
  loyaltyMetrics: {
    currentPoints: number;
    totalPointsEarned: number;
    pointsRedeemed: number;
    membershipTier: string;
    nextTierThreshold: number;
    memberSince: Date;
    benefits: LoyaltyBenefit[];
  };
  financialMetrics: {
    totalSpent: number;
    averageRepairCost: number;
    savingsVsNew: number;
    lastPayment: number;
    paymentHistory: PaymentHistoryEntry[];
    upcomingPayments: PaymentDue[];
  };
  serviceMetrics: {
    responseTime: number;
    resolutionTime: number;
    firstContactResolution: number;
    customerSupport: SupportInteraction[];
    preferredChannels: string[];
    communicationFrequency: number;
  };
  deviceMetrics: {
    devicesRepaired: DeviceRepairSummary[];
    mostCommonIssues: IssueFrequency[];
    deviceHealth: DeviceHealthScore[];
    warrantyStatus: WarrantyInfo[];
    maintenanceSchedule: MaintenanceReminder[];
  };
  predictiveMetrics: {
    nextServiceDate: Date;
    predictedIssues: PredictedIssue[];
    recommendedActions: RecommendedAction[];
    riskFactors: RiskFactor[];
    optimizationSuggestions: OptimizationSuggestion[];
  };
}

export interface RepairHistoryEntry {
  id: string;
  date: Date;
  device: string;
  issue: string;
  status: 'completed' | 'in-progress' | 'cancelled';
  cost: number;
  duration: number;
  satisfaction: number;
  technician: string;
}

export interface LoyaltyBenefit {
  id: string;
  name: string;
  description: string;
  type: 'discount' | 'service' | 'priority' | 'exclusive';
  value: string;
  isActive: boolean;
  expiryDate?: Date;
}

export interface PaymentHistoryEntry {
  id: string;
  date: Date;
  amount: number;
  method: string;
  status: 'completed' | 'pending' | 'failed';
  description: string;
  receiptUrl?: string;
}

export interface PaymentDue {
  id: string;
  dueDate: Date;
  amount: number;
  description: string;
  status: 'pending' | 'overdue';
}

export interface SupportInteraction {
  id: string;
  date: Date;
  channel: 'phone' | 'email' | 'chat' | 'in-person';
  type: 'inquiry' | 'complaint' | 'feedback' | 'follow-up';
  status: 'resolved' | 'pending' | 'escalated';
  satisfaction: number;
  responseTime: number;
  resolutionTime: number;
}

export interface DeviceRepairSummary {
  deviceType: string;
  model: string;
  repairCount: number;
  totalCost: number;
  averageTime: number;
  successRate: number;
  lastRepairDate: Date;
}

export interface IssueFrequency {
  issue: string;
  frequency: number;
  averageCost: number;
  averageTime: number;
  preventability: 'high' | 'medium' | 'low';
}

export interface DeviceHealthScore {
  deviceId: string;
  healthScore: number;
  lastCheckup: Date;
  issues: string[];
  recommendations: string[];
}

export interface WarrantyInfo {
  deviceId: string;
  warrantyType: string;
  expiryDate: Date;
  coverageLevel: string;
  remainingValue: number;
}

export interface MaintenanceReminder {
  deviceId: string;
  maintenanceType: string;
  dueDate: Date;
  priority: 'high' | 'medium' | 'low';
  estimatedCost: number;
  estimatedTime: number;
}

export interface PredictedIssue {
  deviceId: string;
  issueType: string;
  probability: number;
  timeframe: string;
  preventiveMeasures: string[];
  estimatedCost: number;
}

export interface RecommendedAction {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  type: 'maintenance' | 'upgrade' | 'replacement' | 'optimization';
  estimatedBenefit: string;
  estimatedCost: number;
  timeframe: string;
}

export interface RiskFactor {
  factor: string;
  riskLevel: 'high' | 'medium' | 'low';
  impact: string;
  mitigation: string[];
}

export interface OptimizationSuggestion {
  area: string;
  suggestion: string;
  potentialSavings: number;
  implementationTime: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface CustomerAnalyticsWidgetsProps {
  customerId: string;
  data: CustomerAnalyticsData;
  showCompact?: boolean;
  widgetSelection?: string[];
  onWidgetClick?: (widgetId: string) => void;
  onActionClick?: (action: string, data: any) => void;
  className?: string;
}

export default function CustomerAnalyticsWidgets({
  customerId,
  data,
  showCompact = false,
  widgetSelection = [],
  onWidgetClick,
  onActionClick,
  className = ''
}: CustomerAnalyticsWidgetsProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState('6months');
  const [expandedWidgets, setExpandedWidgets] = useState<string[]>([]);
  const [favoriteWidgets, setFavoriteWidgets] = useState<string[]>([]);

  // Calculate key metrics
  const repairSuccessRate = Math.round((data.repairMetrics.successRate * 100));
  const loyaltyProgress = Math.round((data.loyaltyMetrics.currentPoints / data.loyaltyMetrics.nextTierThreshold) * 100);
  const avgSatisfaction = data.repairMetrics.satisfactionScore;
  const totalSavings = data.repairMetrics.costSavings;

  // Toggle widget expansion
  const toggleWidget = (widgetId: string) => {
    setExpandedWidgets(prev => 
      prev.includes(widgetId) 
        ? prev.filter(id => id !== widgetId)
        : [...prev, widgetId]
    );
  };

  // Toggle favorite widgets
  const toggleFavorite = (widgetId: string) => {
    setFavoriteWidgets(prev => 
      prev.includes(widgetId) 
        ? prev.filter(id => id !== widgetId)
        : [...prev, widgetId]
    );
  };

  // Handle widget click
  const handleWidgetClick = (widgetId: string) => {
    if (onWidgetClick) {
      onWidgetClick(widgetId);
    }
  };

  // Handle action click
  const handleActionClick = (action: string, actionData: any) => {
    if (onActionClick) {
      onActionClick(action, actionData);
    }
  };

  return (
    <div className={`customer-analytics-widgets ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Your Analytics</h2>
          <div className="flex items-center gap-2">
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="1month">Last Month</option>
              <option value="3months">Last 3 Months</option>
              <option value="6months">Last 6 Months</option>
              <option value="1year">Last Year</option>
              <option value="all">All Time</option>
            </select>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{repairSuccessRate}%</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-2 flex items-center text-sm">
                <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                <span className="text-green-600">+5% from last period</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Savings</p>
                  <p className="text-2xl font-bold text-gray-900">£{totalSavings.toLocaleString()}</p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="mt-2 flex items-center text-sm">
                <DollarSign className="w-4 h-4 text-green-600 mr-1" />
                <span className="text-green-600">vs buying new devices</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Loyalty Points</p>
                  <p className="text-2xl font-bold text-gray-900">{data.loyaltyMetrics.currentPoints}</p>
                </div>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Star className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-2">
                <Progress value={loyaltyProgress} className="h-2" />
                <p className="text-xs text-gray-500 mt-1">
                  {data.loyaltyMetrics.nextTierThreshold - data.loyaltyMetrics.currentPoints} points to next tier
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Satisfaction</p>
                  <p className="text-2xl font-bold text-gray-900">{avgSatisfaction}/5.0</p>
                </div>
                <div className="p-2 bg-orange-100 rounded-lg">
                  <ThumbsUp className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <div className="mt-2 flex items-center text-sm">
                <Star className="w-4 h-4 text-yellow-500 mr-1" />
                <span className="text-gray-600">Excellent rating</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Widget Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Repair History Widget */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Repair History
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleFavorite('repair-history')}
                >
                  <Heart className={`w-4 h-4 ${
                    favoriteWidgets.includes('repair-history') ? 'fill-red-500 text-red-500' : 'text-gray-400'
                  }`} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleWidget('repair-history')}
                >
                  {expandedWidgets.includes('repair-history') ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.repairMetrics.repairHistory.slice(0, expandedWidgets.includes('repair-history') ? 10 : 5).map((repair) => (
                <div key={repair.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      {repair.device.toLowerCase().includes('phone') && <Smartphone className="w-4 h-4 text-blue-600" />}
                      {repair.device.toLowerCase().includes('laptop') && <Laptop className="w-4 h-4 text-blue-600" />}
                      {repair.device.toLowerCase().includes('tablet') && <Tablet className="w-4 h-4 text-blue-600" />}
                      {!repair.device.toLowerCase().includes('phone') && !repair.device.toLowerCase().includes('laptop') && !repair.device.toLowerCase().includes('tablet') && <Wrench className="w-4 h-4 text-blue-600" />}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{repair.device}</h4>
                      <p className="text-sm text-gray-600">{repair.issue}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={repair.status === 'completed' ? 'default' : 'secondary'}>
                          {repair.status}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {repair.date.toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">£{repair.cost}</p>
                    <p className="text-sm text-gray-600">{repair.duration} days</p>
                    <div className="flex items-center gap-1 mt-1">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < repair.satisfaction ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {data.repairMetrics.repairHistory.length > 5 && (
              <div className="mt-4 text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleWidgetClick('repair-history')}
                >
                  View All Repairs
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Loyalty Status Widget */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5" />
              Loyalty Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 rounded-full">
                  <Crown className="w-4 h-4 text-purple-600" />
                  <span className="font-medium text-purple-800">{data.loyaltyMetrics.membershipTier}</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Member since {data.loyaltyMetrics.memberSince.toLocaleDateString()}
                </p>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Points Progress</span>
                  <span className="text-sm text-gray-600">
                    {data.loyaltyMetrics.currentPoints} / {data.loyaltyMetrics.nextTierThreshold}
                  </span>
                </div>
                <Progress value={loyaltyProgress} className="h-2" />
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Active Benefits</h4>
                {data.loyaltyMetrics.benefits.filter(b => b.isActive).slice(0, 3).map((benefit) => (
                  <div key={benefit.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">{benefit.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {benefit.value}
                    </Badge>
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleActionClick('view-loyalty', data.loyaltyMetrics)}
              >
                View All Benefits
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Device Health Widget */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Device Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.deviceMetrics.deviceHealth.slice(0, 3).map((device) => (
                <div key={device.deviceId} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{device.deviceId}</span>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        device.healthScore >= 80 ? 'bg-green-500' :
                        device.healthScore >= 60 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`} />
                      <span className="text-sm font-medium">{device.healthScore}%</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {device.issues.slice(0, 2).map((issue, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                        <AlertCircle className="w-3 h-3" />
                        {issue}
                      </div>
                    ))}
                  </div>
                  <div className="mt-2">
                    <Progress value={device.healthScore} className="h-2" />
                  </div>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => handleActionClick('device-health', data.deviceMetrics)}
            >
              View All Devices
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardContent>
        </Card>

        {/* Financial Summary Widget */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Financial Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total Spent</p>
                  <p className="text-lg font-bold text-gray-900">£{data.financialMetrics.totalSpent.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Avg Cost</p>
                  <p className="text-lg font-bold text-gray-900">£{data.financialMetrics.averageRepairCost}</p>
                </div>
              </div>
              
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-800">Savings Achievement</span>
                </div>
                <p className="text-2xl font-bold text-green-700">£{data.financialMetrics.savingsVsNew.toLocaleString()}</p>
                <p className="text-sm text-green-600">vs buying new devices</p>
              </div>

              {data.financialMetrics.upcomingPayments.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Upcoming Payments</h4>
                  {data.financialMetrics.upcomingPayments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <p className="text-sm font-medium">{payment.description}</p>
                        <p className="text-xs text-gray-600">Due: {payment.dueDate.toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">£{payment.amount}</p>
                        <Badge variant={payment.status === 'overdue' ? 'destructive' : 'secondary'}>
                          {payment.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Predictive Analytics Widget */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Predictive Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-800">Next Service</span>
                </div>
                <p className="text-lg font-bold text-blue-700">
                  {data.predictiveMetrics.nextServiceDate.toLocaleDateString()}
                </p>
                <p className="text-sm text-blue-600">Recommended maintenance</p>
              </div>

              <div>
                <h4 className="font-medium mb-2">Predicted Issues</h4>
                <div className="space-y-2">
                  {data.predictiveMetrics.predictedIssues.slice(0, 3).map((issue, index) => (
                    <div key={index} className="p-2 bg-gray-50 rounded">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{issue.issueType}</span>
                        <Badge variant={issue.probability > 0.7 ? 'destructive' : issue.probability > 0.4 ? 'default' : 'secondary'}>
                          {Math.round(issue.probability * 100)}%
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{issue.timeframe}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Recommendations</h4>
                <div className="space-y-2">
                  {data.predictiveMetrics.recommendedActions.slice(0, 2).map((action) => (
                    <div key={action.id} className="p-2 bg-gray-50 rounded">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{action.title}</span>
                        <Badge variant={action.priority === 'high' ? 'destructive' : action.priority === 'medium' ? 'default' : 'secondary'}>
                          {action.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{action.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Communication Analytics Widget */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Communication Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Response Times</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Average Response</span>
                    <span className="font-medium">{data.serviceMetrics.responseTime}min</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Resolution Time</span>
                    <span className="font-medium">{data.serviceMetrics.resolutionTime}min</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">First Contact Resolution</span>
                    <span className="font-medium">{data.serviceMetrics.firstContactResolution}%</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">Preferred Channels</h4>
                <div className="space-y-2">
                  {data.serviceMetrics.preferredChannels.map((channel, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        {channel === 'chat' && <MessageSquare className="w-4 h-4 text-blue-600" />}
                        {channel === 'email' && <Mail className="w-4 h-4 text-green-600" />}
                        {channel === 'phone' && <Phone className="w-4 h-4 text-purple-600" />}
                        {channel === 'in-person' && <Users className="w-4 h-4 text-orange-600" />}
                        <span className="text-sm capitalize">{channel}</span>
                      </div>
                      <Badge variant="outline">
                        {Math.round(Math.random() * 40 + 20)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <h4 className="font-medium mb-3">Recent Interactions</h4>
              <div className="space-y-2">
                {data.serviceMetrics.customerSupport.slice(0, 3).map((interaction) => (
                  <div key={interaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        {interaction.channel === 'chat' && <MessageSquare className="w-4 h-4 text-blue-600" />}
                        {interaction.channel === 'email' && <Mail className="w-4 h-4 text-green-600" />}
                        {interaction.channel === 'phone' && <Phone className="w-4 h-4 text-purple-600" />}
                        {interaction.channel === 'in-person' && <Users className="w-4 h-4 text-orange-600" />}
                      </div>
                      <div>
                        <p className="font-medium capitalize">{interaction.type}</p>
                        <p className="text-sm text-gray-600">{interaction.date.toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={interaction.status === 'resolved' ? 'default' : 'secondary'}>
                        {interaction.status}
                      </Badge>
                      <div className="flex items-center gap-1 mt-1">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < interaction.satisfaction ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}