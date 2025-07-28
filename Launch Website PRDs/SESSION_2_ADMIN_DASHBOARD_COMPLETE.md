# Session 2: Admin Dashboard Complete Implementation

**Session Priority**: HIGH - Core business functionality  
**Estimated Duration**: Full implementation session  
**Prerequisites**: Session 1 completed - Backend foundation operational  
**Objective**: Implement fully functional admin dashboard with analytics, AI, and chat  

---

## 🎯 Session Objectives

### Primary Goals
1. **Real Analytics Dashboard**: Live business intelligence with charts and KPIs
2. **AI Diagnostic System**: Automated repair predictions and recommendations
3. **Chatwoot Chat Integration**: Live customer support system
4. **Complete User Management**: CRUD operations for all user types
5. **Repair Queue Management**: Full workflow tracking and management

### Success Criteria
- [x] ✅ **Customer portal implemented and operational** (Session 2 actual work)
- [x] ✅ **Real-time repair tracking with 7-stage timeline implemented**
- [x] ✅ **Booking confirmation email system complete**
- [x] ✅ **Customer dashboard with live updates working**
- [ ] Admin dashboard displays real analytics data
- [ ] AI features operational for diagnostics and predictions
- [ ] Chat system integrated and functional
- [ ] User management fully operational (create, edit, delete users)
- [ ] Repair queue management working with real-time updates
- [ ] No demo/mock data in any admin components

---

## 📋 Prerequisites Verification

### Session 1 Completion Check
- [ ] PostgreSQL database operational with complete schema
- [ ] Authentication system working (JWT tokens)
- [ ] Basic API endpoints functional (`/auth`, `/bookings`, `/devices`)
- [ ] WebSocket server running and accepting connections
- [ ] Frontend components connected to real backend (no mock data)

### Infrastructure Requirements
- [ ] Admin user account exists and can login
- [ ] Database has seed data (categories, repair types)
- [ ] Backend container running on port 3011
- [ ] Frontend container running on port 3010
- [ ] Redis cache operational on port 6383

---

## 📊 Analytics Dashboard Implementation

### 1. Backend Analytics API

**Create**: `/backend/routes/analytics.js`

```javascript
const express = require('express');
const { Booking, Repair, User, AnalyticsEvent } = require('../models');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { Op } = require('sequelize');
const router = express.Router();

// Dashboard overview statistics
router.get('/dashboard-stats', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { period = '30' } = req.query; // Days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Parallel queries for performance
    const [
      totalBookings,
      activeRepairs,
      completedToday,
      totalRevenue,
      bookingsByStatus,
      repairsByStatus,
      dailyBookings,
      customerCount,
      technicianCount
    ] = await Promise.all([
      // Total bookings in period
      Booking.count({
        where: { created_at: { [Op.gte]: startDate } }
      }),
      
      // Active repairs
      Repair.count({
        where: { status: { [Op.in]: ['received', 'diagnosing', 'in_repair', 'testing'] } }
      }),
      
      // Completed today
      Repair.count({
        where: {
          status: 'completed',
          actual_completion: {
            [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      
      // Total revenue
      Repair.sum('total_cost', {
        where: {
          status: 'completed',
          created_at: { [Op.gte]: startDate }
        }
      }),
      
      // Bookings by status
      Booking.findAll({
        attributes: ['status', [sequelize.fn('COUNT', '*'), 'count']],
        where: { created_at: { [Op.gte]: startDate } },
        group: ['status']
      }),
      
      // Repairs by status
      Repair.findAll({
        attributes: ['status', [sequelize.fn('COUNT', '*'), 'count']],
        group: ['status']
      }),
      
      // Daily bookings trend
      Booking.findAll({
        attributes: [
          [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
          [sequelize.fn('COUNT', '*'), 'count']
        ],
        where: { created_at: { [Op.gte]: startDate } },
        group: [sequelize.fn('DATE', sequelize.col('created_at'))],
        order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']]
      }),
      
      // Customer count
      User.count({ where: { role: 'customer' } }),
      
      // Technician count
      User.count({ where: { role: 'technician' } })
    ]);

    res.json({
      overview: {
        totalBookings,
        activeRepairs,
        completedToday,
        revenue: totalRevenue || 0,
        customerCount,
        technicianCount
      },
      charts: {
        bookingsByStatus: bookingsByStatus.map(item => ({
          status: item.status,
          count: parseInt(item.dataValues.count)
        })),
        repairsByStatus: repairsByStatus.map(item => ({
          status: item.status,
          count: parseInt(item.dataValues.count)
        })),
        dailyTrend: dailyBookings.map(item => ({
          date: item.dataValues.date,
          bookings: parseInt(item.dataValues.count)
        }))
      }
    });
  } catch (error) {
    console.error('Analytics dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// Revenue analytics
router.get('/revenue', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { period = '30', groupBy = 'day' } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    let dateFormat;
    switch (groupBy) {
      case 'hour': dateFormat = 'YYYY-MM-DD HH24:00:00'; break;
      case 'day': dateFormat = 'YYYY-MM-DD'; break;
      case 'week': dateFormat = 'YYYY-"W"WW'; break;
      case 'month': dateFormat = 'YYYY-MM'; break;
      default: dateFormat = 'YYYY-MM-DD';
    }

    const revenueData = await Repair.findAll({
      attributes: [
        [sequelize.fn('TO_CHAR', sequelize.col('created_at'), dateFormat), 'period'],
        [sequelize.fn('SUM', sequelize.col('total_cost')), 'revenue'],
        [sequelize.fn('COUNT', '*'), 'repairs']
      ],
      where: {
        status: 'completed',
        created_at: { [Op.gte]: startDate },
        total_cost: { [Op.not]: null }
      },
      group: [sequelize.fn('TO_CHAR', sequelize.col('created_at'), dateFormat)],
      order: [[sequelize.fn('TO_CHAR', sequelize.col('created_at'), dateFormat), 'ASC']]
    });

    res.json({
      revenue: revenueData.map(item => ({
        period: item.dataValues.period,
        revenue: parseFloat(item.dataValues.revenue) || 0,
        repairs: parseInt(item.dataValues.repairs)
      }))
    });
  } catch (error) {
    console.error('Revenue analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch revenue analytics' });
  }
});

// Performance metrics
router.get('/performance', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const [
      avgRepairTime,
      customerSatisfaction,
      firstTimeFixRate,
      technicianPerformance
    ] = await Promise.all([
      // Average repair time
      Repair.findOne({
        attributes: [
          [sequelize.fn('AVG', 
            sequelize.fn('EXTRACT', 
              sequelize.literal('EPOCH FROM (actual_completion - created_at)')
            )
          ), 'avg_hours']
        ],
        where: { status: 'completed', actual_completion: { [Op.not]: null } }
      }),
      
      // Customer satisfaction (would need a ratings table, simulated for now)
      Promise.resolve({ rating: 4.7, responses: 156 }),
      
      // First time fix rate
      Repair.findAll({
        attributes: [
          [sequelize.fn('COUNT', 
            sequelize.case()
              .when(sequelize.col('status'), 'completed')
              .then(1)
          ), 'completed'],
          [sequelize.fn('COUNT', '*'), 'total']
        ]
      }),
      
      // Technician performance
      Repair.findAll({
        attributes: [
          'technician_id',
          [sequelize.fn('COUNT', '*'), 'total_repairs'],
          [sequelize.fn('AVG', 
            sequelize.fn('EXTRACT', 
              sequelize.literal('EPOCH FROM (actual_completion - created_at)')
            )
          ), 'avg_time'],
          [sequelize.fn('COUNT', 
            sequelize.case()
              .when(sequelize.col('status'), 'completed')
              .then(1)
          ), 'completed']
        ],
        include: [{
          model: User,
          as: 'technician',
          attributes: ['first_name', 'last_name']
        }],
        where: { technician_id: { [Op.not]: null } },
        group: ['technician_id', 'technician.id', 'technician.first_name', 'technician.last_name']
      })
    ]);

    res.json({
      metrics: {
        averageRepairTime: parseFloat(avgRepairTime?.dataValues?.avg_hours || 0) / 3600, // Convert to hours
        customerSatisfaction: customerSatisfaction.rating,
        satisfactionResponses: customerSatisfaction.responses,
        firstTimeFixRate: firstTimeFixRate.length > 0 ? 
          (parseInt(firstTimeFixRate[0].dataValues.completed) / parseInt(firstTimeFixRate[0].dataValues.total)) * 100 : 0
      },
      technicianPerformance: technicianPerformance.map(tech => ({
        technician: `${tech.technician.first_name} ${tech.technician.last_name}`,
        totalRepairs: parseInt(tech.dataValues.total_repairs),
        completionRate: (parseInt(tech.dataValues.completed) / parseInt(tech.dataValues.total_repairs)) * 100,
        averageTime: parseFloat(tech.dataValues.avg_time || 0) / 3600 // Convert to hours
      }))
    });
  } catch (error) {
    console.error('Performance analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch performance metrics' });
  }
});

module.exports = router;
```

### 2. Frontend Analytics Dashboard

**Update**: `/frontend/src/components/admin/AnalyticsWidget.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, Users, Wrench, DollarSign, Clock, Star } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface DashboardStats {
  overview: {
    totalBookings: number;
    activeRepairs: number;
    completedToday: number;
    revenue: number;
    customerCount: number;
    technicianCount: number;
  };
  charts: {
    bookingsByStatus: Array<{ status: string; count: number }>;
    repairsByStatus: Array<{ status: string; count: number }>;
    dailyTrend: Array<{ date: string; bookings: number }>;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const AnalyticsWidget = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30');

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedPeriod]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const [dashboardResponse, revenueResponse] = await Promise.all([
        apiClient.getDashboardStats(selectedPeriod),
        apiClient.getRevenueAnalytics(selectedPeriod)
      ]);
      
      setStats(dashboardResponse);
      setRevenueData(revenueResponse.revenue);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Loading analytics...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;
  if (!stats) return <div className="p-6">No analytics data available</div>;

  const overviewCards = [
    {
      title: 'Total Bookings',
      value: stats.overview.totalBookings,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Active Repairs',
      value: stats.overview.activeRepairs,
      icon: Wrench,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      title: 'Completed Today',
      value: stats.overview.completedToday,
      icon: Clock,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Revenue',
      value: `£${stats.overview.revenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-neutral-700">Analytics Dashboard</h2>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="px-3 py-2 border border-neutral-300 rounded-lg"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last year</option>
        </select>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {overviewCards.map((card, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">{card.title}</p>
                <p className="text-2xl font-bold text-neutral-900">{card.value}</p>
              </div>
              <div className={`p-3 rounded-full ${card.bgColor}`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Bookings Trend */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-neutral-700 mb-4">Daily Bookings Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.charts.dailyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="bookings" stroke="#0088FE" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Bookings by Status */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-neutral-700 mb-4">Bookings by Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats.charts.bookingsByStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({status, percent}) => `${status} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {stats.charts.bookingsByStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Revenue Trend */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-neutral-700 mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip formatter={(value) => [`£${value}`, 'Revenue']} />
              <Bar dataKey="revenue" fill="#00C49F" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Repairs by Status */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-neutral-700 mb-4">Repair Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.charts.repairsByStatus} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="status" type="category" width={80} />
              <Tooltip />
              <Bar dataKey="count" fill="#FFBB28" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsWidget;
```

---

## 🤖 AI Diagnostic System Implementation

### 1. AI Diagnostic Backend

**Create**: `/backend/routes/ai-diagnostics.js`

```javascript
const express = require('express');
const { DeviceModel, RepairType, Repair, Booking } = require('../models');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { Op } = require('sequelize');
const router = express.Router();

// AI diagnostic prediction based on symptoms
router.post('/predict-issue', authenticateToken, async (req, res) => {
  try {
    const { deviceModelId, symptoms, customerDescription } = req.body;

    if (!deviceModelId || !symptoms || !Array.isArray(symptoms)) {
      return res.status(400).json({ error: 'Device model and symptoms required' });
    }

    // Get device model
    const deviceModel = await DeviceModel.findByPk(deviceModelId, {
      include: [{ model: DeviceCategory }]
    });

    if (!deviceModel) {
      return res.status(404).json({ error: 'Device model not found' });
    }

    // AI prediction algorithm (simplified version)
    const predictions = await predictRepairIssues(deviceModel, symptoms, customerDescription);

    // Get historical data for similar issues
    const historicalData = await getHistoricalRepairData(deviceModelId, predictions);

    res.json({
      deviceModel: {
        brand: deviceModel.brand,
        model: deviceModel.model,
        year: deviceModel.year
      },
      predictions: predictions.map(pred => ({
        ...pred,
        historicalSuccess: historicalData[pred.repairTypeId] || {}
      })),
      confidence: calculateOverallConfidence(predictions),
      recommendations: generateRecommendations(predictions, deviceModel)
    });

  } catch (error) {
    console.error('AI diagnostic prediction error:', error);
    res.status(500).json({ error: 'Failed to generate diagnostic prediction' });
  }
});

// Predictive algorithm (simplified)
async function predictRepairIssues(deviceModel, symptoms, description) {
  // Get all possible repair types for this device category
  const repairTypes = await RepairType.findAll({
    where: { category_id: deviceModel.category_id, active: true }
  });

  // Symptom-to-repair mapping (in production, this would be ML-based)
  const symptomMapping = {
    'screen_damage': { repairTypes: ['Screen Replacement'], weight: 0.9 },
    'battery_drain': { repairTypes: ['Battery Replacement'], weight: 0.85 },
    'liquid_damage': { repairTypes: ['Liquid Damage Repair'], weight: 0.8 },
    'keyboard_issues': { repairTypes: ['Keyboard Repair'], weight: 0.75 },
    'performance_slow': { repairTypes: ['Logic Board Repair', 'Data Recovery'], weight: 0.6 },
    'overheating': { repairTypes: ['Logic Board Repair', 'Battery Replacement'], weight: 0.7 },
    'charging_issues': { repairTypes: ['Battery Replacement', 'Logic Board Repair'], weight: 0.8 },
    'audio_issues': { repairTypes: ['Logic Board Repair'], weight: 0.65 }
  };

  const predictions = [];
  const symptomWeights = {};

  // Analyze symptoms
  symptoms.forEach(symptom => {
    if (symptomMapping[symptom]) {
      symptomMapping[symptom].repairTypes.forEach(repairTypeName => {
        if (!symptomWeights[repairTypeName]) {
          symptomWeights[repairTypeName] = 0;
        }
        symptomWeights[repairTypeName] += symptomMapping[symptom].weight;
      });
    }
  });

  // Text analysis of customer description (simplified)
  if (description) {
    const keywords = {
      'cracked': { repair: 'Screen Replacement', weight: 0.9 },
      'broken': { repair: 'Screen Replacement', weight: 0.8 },
      'battery': { repair: 'Battery Replacement', weight: 0.85 },
      'slow': { repair: 'Logic Board Repair', weight: 0.6 },
      'liquid': { repair: 'Liquid Damage Repair', weight: 0.9 },
      'water': { repair: 'Liquid Damage Repair', weight: 0.9 },
      'keyboard': { repair: 'Keyboard Repair', weight: 0.8 },
      'keys': { repair: 'Keyboard Repair', weight: 0.75 }
    };

    const descriptionLower = description.toLowerCase();
    Object.entries(keywords).forEach(([keyword, data]) => {
      if (descriptionLower.includes(keyword)) {
        if (!symptomWeights[data.repair]) {
          symptomWeights[data.repair] = 0;
        }
        symptomWeights[data.repair] += data.weight;
      }
    });
  }

  // Create predictions
  Object.entries(symptomWeights).forEach(([repairTypeName, weight]) => {
    const repairType = repairTypes.find(rt => rt.name === repairTypeName);
    if (repairType) {
      predictions.push({
        repairTypeId: repairType.id,
        repairTypeName: repairType.name,
        confidence: Math.min(weight, 1.0),
        estimatedCost: repairType.base_price,
        estimatedTime: repairType.estimated_time_hours,
        priority: weight > 0.8 ? 'high' : weight > 0.6 ? 'medium' : 'low'
      });
    }
  });

  // Sort by confidence
  return predictions.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
}

// Get historical repair data
async function getHistoricalRepairData(deviceModelId, predictions) {
  const repairTypeIds = predictions.map(p => p.repairTypeId);
  
  const historicalData = await Repair.findAll({
    attributes: [
      'repair_type_id',
      [sequelize.fn('COUNT', '*'), 'total'],
      [sequelize.fn('COUNT', sequelize.case()
        .when(sequelize.col('status'), 'completed')
        .then(1)
      ), 'successful'],
      [sequelize.fn('AVG', sequelize.col('total_cost')), 'avg_cost'],
      [sequelize.fn('AVG', 
        sequelize.fn('EXTRACT', 
          sequelize.literal('EPOCH FROM (actual_completion - created_at)')
        )
      ), 'avg_time']
    ],
    include: [{
      model: Booking,
      where: { device_model_id: deviceModelId },
      attributes: []
    }],
    where: {
      repair_type_id: { [Op.in]: repairTypeIds }
    },
    group: ['repair_type_id']
  });

  const result = {};
  historicalData.forEach(item => {
    result[item.repair_type_id] = {
      totalRepairs: parseInt(item.dataValues.total),
      successRate: (parseInt(item.dataValues.successful) / parseInt(item.dataValues.total)) * 100,
      averageCost: parseFloat(item.dataValues.avg_cost) || 0,
      averageTime: parseFloat(item.dataValues.avg_time) / 3600 || 0 // Convert to hours
    };
  });

  return result;
}

// Calculate overall confidence
function calculateOverallConfidence(predictions) {
  if (predictions.length === 0) return 0;
  
  const totalConfidence = predictions.reduce((sum, pred) => sum + pred.confidence, 0);
  return totalConfidence / predictions.length;
}

// Generate recommendations
function generateRecommendations(predictions, deviceModel) {
  const recommendations = [];

  if (predictions.length === 0) {
    recommendations.push({
      type: 'diagnostic',
      message: 'Unable to determine issue from symptoms. Recommend full diagnostic.',
      priority: 'high'
    });
    return recommendations;
  }

  const topPrediction = predictions[0];

  if (topPrediction.confidence > 0.8) {
    recommendations.push({
      type: 'confident',
      message: `High confidence in ${topPrediction.repairTypeName}. Recommend immediate booking.`,
      priority: 'high'
    });
  } else if (topPrediction.confidence > 0.6) {
    recommendations.push({
      type: 'likely',
      message: `Likely ${topPrediction.repairTypeName}. Consider diagnostic to confirm.`,
      priority: 'medium'
    });
  } else {
    recommendations.push({
      type: 'uncertain',
      message: 'Multiple possible issues detected. Full diagnostic recommended.',
      priority: 'medium'
    });
  }

  // Device-specific recommendations
  if (deviceModel.year && deviceModel.year < 2018) {
    recommendations.push({
      type: 'age_warning',
      message: 'Older device - parts availability may be limited.',
      priority: 'low'
    });
  }

  return recommendations;
}

// Repair cost estimation
router.post('/estimate-cost', authenticateToken, async (req, res) => {
  try {
    const { repairTypeId, deviceModelId, complexity = 'standard' } = req.body;

    const repairType = await RepairType.findByPk(repairTypeId);
    const deviceModel = await DeviceModel.findByPk(deviceModelId);

    if (!repairType || !deviceModel) {
      return res.status(404).json({ error: 'Repair type or device model not found' });
    }

    // Calculate estimated cost based on complexity and device age
    let baseCost = repairType.base_price;
    let complexityMultiplier = 1.0;

    switch (complexity) {
      case 'simple': complexityMultiplier = 0.8; break;
      case 'complex': complexityMultiplier = 1.3; break;
      case 'very_complex': complexityMultiplier = 1.6; break;
      default: complexityMultiplier = 1.0;
    }

    // Age factor
    const currentYear = new Date().getFullYear();
    const deviceAge = currentYear - (deviceModel.year || currentYear);
    const ageMultiplier = deviceAge > 5 ? 1.2 : deviceAge > 3 ? 1.1 : 1.0;

    const estimatedCost = baseCost * complexityMultiplier * ageMultiplier;
    const estimatedTime = repairType.estimated_time_hours * complexityMultiplier;

    res.json({
      baseCost,
      estimatedCost: Math.round(estimatedCost * 100) / 100,
      estimatedTime: Math.round(estimatedTime * 100) / 100,
      factors: {
        complexity: complexityMultiplier,
        age: ageMultiplier,
        deviceAge
      }
    });

  } catch (error) {
    console.error('Cost estimation error:', error);
    res.status(500).json({ error: 'Failed to estimate cost' });
  }
});

module.exports = router;
```

### 2. AI Diagnostic Frontend Component

**Create**: `/frontend/src/components/admin/AIDiagnosticDashboard.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Brain, Zap, Target, AlertCircle, CheckCircle, Clock, DollarSign } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface DiagnosticForm {
  deviceModelId: string;
  symptoms: string[];
  customerDescription: string;
}

interface DiagnosticPrediction {
  repairTypeId: number;
  repairTypeName: string;
  confidence: number;
  estimatedCost: number;
  estimatedTime: number;
  priority: 'high' | 'medium' | 'low';
  historicalSuccess?: {
    totalRepairs: number;
    successRate: number;
    averageCost: number;
    averageTime: number;
  };
}

interface DiagnosticResult {
  deviceModel: {
    brand: string;
    model: string;
    year: number;
  };
  predictions: DiagnosticPrediction[];
  confidence: number;
  recommendations: Array<{
    type: string;
    message: string;
    priority: string;
  }>;
}

const AIDiagnosticDashboard = () => {
  const [form, setForm] = useState<DiagnosticForm>({
    deviceModelId: '',
    symptoms: [],
    customerDescription: ''
  });
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableSymptoms = [
    { id: 'screen_damage', label: 'Screen Damage/Cracks' },
    { id: 'battery_drain', label: 'Fast Battery Drain' },
    { id: 'liquid_damage', label: 'Liquid Damage' },
    { id: 'keyboard_issues', label: 'Keyboard Problems' },
    { id: 'performance_slow', label: 'Slow Performance' },
    { id: 'overheating', label: 'Overheating' },
    { id: 'charging_issues', label: 'Charging Problems' },
    { id: 'audio_issues', label: 'Audio Issues' }
  ];

  const handleSymptomToggle = (symptomId: string) => {
    setForm(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptomId)
        ? prev.symptoms.filter(s => s !== symptomId)
        : [...prev.symptoms, symptomId]
    }));
  };

  const runDiagnostic = async () => {
    if (!form.deviceModelId || form.symptoms.length === 0) {
      setError('Please select a device model and at least one symptom');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.predictIssue({
        deviceModelId: parseInt(form.deviceModelId),
        symptoms: form.symptoms,
        customerDescription: form.customerDescription
      });
      
      setResult(response);
    } catch (err) {
      console.error('Diagnostic prediction failed:', err);
      setError('Failed to run diagnostic prediction');
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Brain className="w-8 h-8 text-professional-600" />
        <h2 className="text-2xl font-bold text-neutral-700">AI Diagnostic System</h2>
      </div>

      {/* Diagnostic Form */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-neutral-700 mb-4">Issue Prediction</h3>
        
        <div className="space-y-4">
          {/* Device Selection */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Device Model
            </label>
            <select
              value={form.deviceModelId}
              onChange={(e) => setForm(prev => ({ ...prev, deviceModelId: e.target.value }))}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
            >
              <option value="">Select device model...</option>
              {/* This would be populated from device models API */}
              <option value="1">MacBook Pro 13" 2020</option>
              <option value="2">MacBook Air M1 2021</option>
              <option value="3">iMac 24" M1 2021</option>
            </select>
          </div>

          {/* Symptoms */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Symptoms (select all that apply)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {availableSymptoms.map(symptom => (
                <Button
                  key={symptom.id}
                  variant={form.symptoms.includes(symptom.id) ? 'default' : 'secondary'}
                  size="sm"
                  onClick={() => handleSymptomToggle(symptom.id)}
                  className="justify-start"
                >
                  {symptom.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Customer Description */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Customer Description
            </label>
            <textarea
              value={form.customerDescription}
              onChange={(e) => setForm(prev => ({ ...prev, customerDescription: e.target.value }))}
              placeholder="Describe the issue in the customer's words..."
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg h-24"
            />
          </div>

          <Button
            onClick={runDiagnostic}
            disabled={loading || !form.deviceModelId || form.symptoms.length === 0}
            className="bg-professional-500 hover:bg-professional-700 text-white"
          >
            {loading ? (
              <>
                <Brain className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Run AI Diagnostic
              </>
            )}
          </Button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}
      </Card>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Overview */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-neutral-700">
                Diagnostic Results for {result.deviceModel.brand} {result.deviceModel.model} ({result.deviceModel.year})
              </h3>
              <Badge className={getConfidenceColor(result.confidence)}>
                {(result.confidence * 100).toFixed(0)}% Overall Confidence
              </Badge>
            </div>

            {/* Predictions */}
            <div className="space-y-4">
              <h4 className="font-medium text-neutral-700">Predicted Issues</h4>
              {result.predictions.map((prediction, index) => (
                <div key={index} className="border border-neutral-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h5 className="font-semibold text-neutral-700">{prediction.repairTypeName}</h5>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-neutral-600">
                        <span className="flex items-center space-x-1">
                          <DollarSign className="w-4 h-4" />
                          <span>£{prediction.estimatedCost}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{prediction.estimatedTime}h</span>
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <Badge className={getConfidenceColor(prediction.confidence)}>
                        {(prediction.confidence * 100).toFixed(0)}% confidence
                      </Badge>
                      <Badge className={getPriorityColor(prediction.priority)}>
                        {prediction.priority} priority
                      </Badge>
                    </div>
                  </div>

                  {/* Historical Data */}
                  {prediction.historicalSuccess && (
                    <div className="bg-neutral-50 rounded p-3 mt-3">
                      <h6 className="text-sm font-medium text-neutral-700 mb-2">Historical Performance</h6>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-neutral-600">Total Repairs:</span>
                          <span className="font-medium ml-1">{prediction.historicalSuccess.totalRepairs}</span>
                        </div>
                        <div>
                          <span className="text-neutral-600">Success Rate:</span>
                          <span className="font-medium ml-1">{prediction.historicalSuccess.successRate.toFixed(1)}%</span>
                        </div>
                        <div>
                          <span className="text-neutral-600">Avg Cost:</span>
                          <span className="font-medium ml-1">£{prediction.historicalSuccess.averageCost.toFixed(0)}</span>
                        </div>
                        <div>
                          <span className="text-neutral-600">Avg Time:</span>
                          <span className="font-medium ml-1">{prediction.historicalSuccess.averageTime.toFixed(1)}h</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Recommendations */}
            <div className="mt-6">
              <h4 className="font-medium text-neutral-700 mb-3">AI Recommendations</h4>
              <div className="space-y-2">
                {result.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <Target className="w-4 h-4 text-professional-600 mt-1" />
                    <span className="text-sm text-neutral-700">{rec.message}</span>
                    <Badge className={getPriorityColor(rec.priority)}>
                      {rec.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AIDiagnosticDashboard;
```

---

## 💬 Chatwoot Chat Integration

### 1. Chatwoot Setup Backend

**Create**: `/backend/routes/chat.js`

```javascript
const express = require('express');
const { User } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Chatwoot configuration
const CHATWOOT_BASE_URL = process.env.CHATWOOT_BASE_URL || 'https://app.chatwoot.com';
const CHATWOOT_API_ACCESS_TOKEN = process.env.CHATWOOT_API_ACCESS_TOKEN;
const CHATWOOT_ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID;

// Generate Chatwoot contact
router.post('/create-contact', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    // Create or find contact in Chatwoot
    const contactData = {
      name: `${user.first_name} ${user.last_name}`,
      email: user.email,
      phone_number: user.phone,
      custom_attributes: {
        user_id: user.id,
        role: user.role,
        signup_date: user.created_at
      }
    };

    // In production, make actual API call to Chatwoot
    const chatwootResponse = await createChatwootContact(contactData);
    
    res.json({
      contactId: chatwootResponse.id,
      widgetToken: generateWidgetToken(user)
    });

  } catch (error) {
    console.error('Chatwoot contact creation error:', error);
    res.status(500).json({ error: 'Failed to create chat contact' });
  }
});

// Generate widget configuration
router.get('/widget-config', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    const config = {
      websiteToken: process.env.CHATWOOT_WEBSITE_TOKEN,
      baseUrl: CHATWOOT_BASE_URL,
      user: {
        identifier: user.email,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        phone: user.phone,
        custom_attributes: {
          user_id: user.id,
          role: user.role
        }
      },
      customAttributes: {
        currentPage: req.headers.referer || 'Unknown',
        userAgent: req.headers['user-agent']
      }
    };

    res.json(config);

  } catch (error) {
    console.error('Widget config error:', error);
    res.status(500).json({ error: 'Failed to generate widget config' });
  }
});

// Get chat statistics (admin only)
router.get('/stats', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    // In production, fetch real stats from Chatwoot API
    const stats = await getChatwootStats();
    
    res.json({
      activeConversations: stats.active_conversations || 0,
      totalConversations: stats.total_conversations || 0,
      averageResponseTime: stats.avg_response_time || 0,
      customerSatisfaction: stats.csat_score || 0,
      agentStatus: stats.agent_status || []
    });

  } catch (error) {
    console.error('Chat stats error:', error);
    res.status(500).json({ error: 'Failed to fetch chat statistics' });
  }
});

// Helper functions (implement actual Chatwoot API calls)
async function createChatwootContact(contactData) {
  // Simulated response - implement actual Chatwoot API call
  return { id: Date.now(), ...contactData };
}

function generateWidgetToken(user) {
  // Generate secure token for widget authentication
  return Buffer.from(JSON.stringify({ userId: user.id, email: user.email })).toString('base64');
}

async function getChatwootStats() {
  // Implement actual Chatwoot API calls for statistics
  return {
    active_conversations: 12,
    total_conversations: 156,
    avg_response_time: 2.5,
    csat_score: 4.7,
    agent_status: [
      { name: 'Support Agent 1', status: 'online', conversations: 5 },
      { name: 'Support Agent 2', status: 'busy', conversations: 7 }
    ]
  };
}

module.exports = router;
```

### 2. Chat Widget Frontend Component

**Create**: `/frontend/src/components/chat/ChatWidget.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { MessageCircle, X, Send, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { apiClient } from '@/lib/api';

interface ChatConfig {
  websiteToken: string;
  baseUrl: string;
  user: {
    identifier: string;
    name: string;
    email: string;
    phone?: string;
    custom_attributes: Record<string, any>;
  };
}

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  timestamp: Date;
}

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [config, setConfig] = useState<ChatConfig | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    initializeChat();
  }, []);

  const initializeChat = async () => {
    try {
      const response = await apiClient.getChatWidgetConfig();
      setConfig(response);
      
      // Initialize Chatwoot widget
      if (window.chatwootSettings) {
        window.chatwootSettings = {
          hideMessageBubble: true, // We'll use our custom UI
          position: 'right',
          locale: 'en',
          type: 'standard',
          ...response
        };
        
        // Load Chatwoot script
        loadChatwootScript(response.websiteToken, response.baseUrl);
      }
      
      setIsConnected(true);
    } catch (error) {
      console.error('Failed to initialize chat:', error);
    }
  };

  const loadChatwootScript = (token: string, baseUrl: string) => {
    const script = document.createElement('script');
    script.src = `${baseUrl}/packs/js/sdk.js`;
    script.defer = true;
    script.async = true;
    
    script.onload = () => {
      window.chatwootSDK.run({
        websiteToken: token,
        baseUrl: baseUrl
      });
      
      // Listen for Chatwoot events
      window.addEventListener('chatwoot:ready', () => {
        setIsConnected(true);
      });
      
      window.addEventListener('chatwoot:on-message', (event: any) => {
        const message: ChatMessage = {
          id: event.detail.id,
          content: event.detail.content,
          sender: event.detail.message_type === 0 ? 'agent' : 'user',
          timestamp: new Date(event.detail.created_at)
        };
        
        setMessages(prev => [...prev, message]);
        if (!isOpen && message.sender === 'agent') {
          setUnreadCount(prev => prev + 1);
        }
      });
    };
    
    document.head.appendChild(script);
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setUnreadCount(0);
      setIsMinimized(false);
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !config) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      content: newMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, message]);
    
    // Send to Chatwoot
    if (window.chatwootSDK) {
      window.chatwootSDK.sendMessage(newMessage);
    }
    
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Chat Trigger Button */}
      <Button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-professional-500 hover:bg-professional-700 text-white shadow-lg"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        {unreadCount > 0 && !isOpen && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-24 right-6 z-50 w-80 h-96 flex flex-col shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-professional-500 text-white rounded-t-lg">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="font-semibold">Support Chat</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-white hover:bg-professional-600"
              >
                <Minimize2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleChat}
                className="text-white hover:bg-professional-600"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center text-neutral-500 text-sm">
                    <MessageCircle className="w-8 h-8 mx-auto mb-2 text-neutral-400" />
                    <p>Welcome! How can we help you today?</p>
                  </div>
                ) : (
                  messages.map(message => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                          message.sender === 'user'
                            ? 'bg-professional-500 text-white'
                            : 'bg-neutral-200 text-neutral-800'
                        }`}
                      >
                        {message.content}
                      </div>
                    </div>
                  ))
                )}
                
                {!isConnected && (
                  <div className="text-center text-yellow-600 text-sm">
                    Connecting to support...
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="p-4 border-t">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                    disabled={!isConnected}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || !isConnected}
                    size="sm"
                    className="bg-professional-500 hover:bg-professional-700 text-white"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      )}
    </>
  );
};

// Extend window interface for Chatwoot
declare global {
  interface Window {
    chatwootSettings: any;
    chatwootSDK: any;
  }
}

export default ChatWidget;
```

---

## 👥 Complete User Management System

### 1. User Management Backend

**Create**: `/backend/routes/users.js`

```javascript
const express = require('express');
const bcrypt = require('bcrypt');
const { User, Booking, Repair } = require('../models');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { Op } = require('sequelize');
const router = express.Router();

// Get all users (admin only)
router.get('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { role, status, search, limit = 50, offset = 0 } = req.query;
    
    const where = {};
    if (role) where.role = role;
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { first_name: { [Op.iLike]: `%${search}%` } },
        { last_name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const users = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password_hash', 'reset_token'] },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.json({
      users: users.rows,
      total: users.count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by ID
router.get('/:id', authenticateToken, authorizeRoles('admin', 'technician'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password_hash', 'reset_token'] },
      include: [
        {
          model: Booking,
          as: 'bookings',
          limit: 10,
          order: [['created_at', 'DESC']]
        }
      ]
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user statistics
    const stats = await getUserStats(id);

    res.json({ user, stats });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Create new user (admin only)
router.post('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, role, status = 'active' } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      email,
      password_hash: passwordHash,
      first_name: firstName,
      last_name: lastName,
      phone,
      role,
      status,
      email_verified: true // Admin-created users are pre-verified
    });

    // Return user without sensitive data
    const { password_hash, reset_token, ...userResponse } = user.toJSON();
    res.status(201).json({ user: userResponse });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check authorization
    if (req.user.role !== 'admin' && req.user.id !== parseInt(id)) {
      return res.status(403).json({ error: 'Can only update own profile' });
    }

    // Get user
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Validate role changes (admin only)
    if (updates.role && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can change user roles' });
    }

    // Handle password update
    if (updates.password) {
      updates.password_hash = await bcrypt.hash(updates.password, 10);
      delete updates.password;
    }

    // Update user
    await user.update(updates);

    // Return updated user without sensitive data
    const { password_hash, reset_token, ...userResponse } = user.toJSON();
    res.json({ user: userResponse });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user (admin only)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check for dependencies (bookings, repairs)
    const bookingCount = await Booking.count({ where: { customer_id: id } });
    const repairCount = await Repair.count({ where: { technician_id: id } });

    if (bookingCount > 0 || repairCount > 0) {
      // Soft delete by deactivating instead
      await user.update({ status: 'inactive' });
      res.json({ message: 'User deactivated due to existing bookings/repairs' });
    } else {
      // Hard delete if no dependencies
      await user.destroy();
      res.json({ message: 'User deleted successfully' });
    }
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get user statistics
async function getUserStats(userId) {
  const [
    totalBookings,
    completedRepairs,
    activeRepairs,
    totalSpent
  ] = await Promise.all([
    Booking.count({ where: { customer_id: userId } }),
    Repair.count({ 
      include: [{ model: Booking, where: { customer_id: userId } }],
      where: { status: 'completed' }
    }),
    Repair.count({ 
      include: [{ model: Booking, where: { customer_id: userId } }],
      where: { status: { [Op.in]: ['received', 'diagnosing', 'in_repair', 'testing'] } }
    }),
    Repair.sum('total_cost', {
      include: [{ model: Booking, where: { customer_id: userId } }],
      where: { status: 'completed' }
    })
  ]);

  return {
    totalBookings,
    completedRepairs,
    activeRepairs,
    totalSpent: totalSpent || 0
  };
}

// Reset user password (admin only)
router.post('/:id/reset-password', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await user.update({ password_hash: passwordHash });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

module.exports = router;
```

### 2. User Management Frontend

**Update**: `/frontend/src/components/admin/UserManagement.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Shield, 
  User, 
  Wrench,
  Eye,
  MoreHorizontal
} from 'lucide-react';
import { apiClient } from '@/lib/api';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: 'customer' | 'admin' | 'technician';
  status: 'active' | 'suspended' | 'inactive';
  email_verified: boolean;
  last_login?: string;
  created_at: string;
}

interface UserStats {
  totalBookings: number;
  completedRepairs: number;
  activeRepairs: number;
  totalSpent: number;
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (roleFilter !== 'all') params.role = roleFilter;
      if (statusFilter !== 'all') params.status = statusFilter;

      const response = await apiClient.getUsers(params);
      setUsers(response.users);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="w-4 h-4" />;
      case 'technician': return <Wrench className="w-4 h-4" />;
      case 'customer': return <User className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'technician': return 'bg-blue-100 text-blue-800';
      case 'customer': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'suspended': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await apiClient.deleteUser(userId);
      await fetchUsers();
    } catch (err) {
      console.error('Failed to delete user:', err);
      alert('Failed to delete user');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) return <div className="p-6">Loading users...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Users className="w-8 h-8 text-professional-600" />
          <h2 className="text-2xl font-bold text-neutral-700">User Management</h2>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-professional-500 hover:bg-professional-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-wrap items-center space-x-4 space-y-2">
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-neutral-400" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-neutral-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-neutral-300 rounded-lg"
            >
              <option value="all">All Roles</option>
              <option value="customer">Customers</option>
              <option value="technician">Technicians</option>
              <option value="admin">Admins</option>
            </select>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-neutral-300 rounded-lg"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </Card>

      {/* Users Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-neutral-900">
                        {user.first_name} {user.last_name}
                      </div>
                      <div className="text-sm text-neutral-500">{user.email}</div>
                      {user.phone && (
                        <div className="text-sm text-neutral-500">{user.phone}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={`inline-flex items-center space-x-1 ${getRoleColor(user.role)}`}>
                      {getRoleIcon(user.role)}
                      <span className="capitalize">{user.role}</span>
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                      <Badge className={getStatusColor(user.status)}>
                        {user.status}
                      </Badge>
                      {!user.email_verified && (
                        <Badge className="bg-orange-100 text-orange-800 text-xs">
                          Unverified
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                    {user.last_login ? formatDate(user.last_login) : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedUser(user)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowEditModal(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
            <p className="text-neutral-500">No users found</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default UserManagement;
```

---

## ✅ Session 2 Completion Checklist

### Analytics Dashboard
- [ ] Analytics API endpoints implemented (`/analytics/dashboard-stats`, `/analytics/revenue`, `/analytics/performance`)
- [ ] Real-time analytics dashboard displaying live business data
- [ ] Charts and visualizations working with real data
- [ ] Performance metrics and KPIs operational
- [ ] Revenue analytics with trend analysis

### AI Diagnostic System
- [ ] AI prediction API implemented (`/ai-diagnostics/predict-issue`)
- [ ] Symptom analysis and repair prediction functional
- [ ] Historical data integration for accuracy improvement
- [ ] Cost estimation system operational
- [ ] AI recommendations engine working

### Chat Integration
- [ ] Chatwoot integration API implemented (`/chat/widget-config`, `/chat/stats`)
- [ ] Chat widget component functional in frontend
- [ ] Real-time messaging capability established
- [ ] User context passing to chat system
- [ ] Admin chat statistics dashboard

### User Management
- [ ] Complete user CRUD API (`/users` - GET, POST, PATCH, DELETE)
- [ ] User management interface fully operational
- [ ] Role-based access control working
- [ ] User statistics and profile management
- [ ] Password reset and user status management

### Integration Validation
- [ ] All components connected to real backend APIs
- [ ] No mock/demo data remaining in admin components
- [ ] Error handling implemented for all API calls
- [ ] Loading states and user feedback working
- [ ] Real-time updates functional where applicable

---

## 📋 Next Session Preparation

### Context for Session 3
After completing Session 2, the following should be operational:
- ✅ **Customer portal with real-time dashboard** (COMPLETED)
- ✅ **Real-time repair tracking system** (COMPLETED)
- ✅ **Email notification system** (COMPLETED)
- ✅ **Booking API with validation fixes** (COMPLETED)
- [ ] Complete admin dashboard with real analytics
- [ ] AI diagnostic system functional
- [ ] Chat integration working
- [ ] User management fully operational
- [ ] All admin features connected to real backend

### Session 3 Prerequisites
- Session 2 deliverables completed and tested
- Admin can access all dashboard features
- Analytics displaying real business data
- AI diagnostics working with device database
- Chat system integrated and functional

### Files Ready for Session 3
- **Customer Portal Components**: All customer-facing components
- **Booking System**: Multi-step booking with device database
- **Payment Integration**: Stripe setup and processing
- **Notification System**: Email/SMS alerts and real-time updates

---

**Session 2 Success Criteria**: Admin dashboard fully operational with analytics, AI, chat, and user management - all connected to real backend services with zero mock data.

**Next Session**: Execute Session 3 using `SESSION_3_CUSTOMER_PORTAL_PRODUCTION.md` guide.