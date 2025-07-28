import express from 'express';
const router = express.Router();

// Device routes - this will be the FIRST mock service replacement
// Priority: Week 3-4 implementation (CRITICAL for pricing)

// GET /api/devices - Get all device categories
router.get('/', (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Device database API under development - PRIORITY IMPLEMENTATION',
    replaces: 'MockDeviceService from frontend/src/lib/services/mockServices.ts',
    currentMockData: 'Hardcoded device models and repair categories',
    realImplementation: {
      database: '2000+ device models (iPhone 12-16, MacBook, Samsung, Google Pixel)',
      features: [
        'Device model lookup by brand/year',
        'Repair categories per device type',
        'Parts compatibility matrix',
        'Repair difficulty ratings',
        'Estimated repair times'
      ],
      apiEndpoints: [
        'GET /api/devices - List all device categories',
        'GET /api/devices/brands - Get all supported brands',
        'GET /api/devices/brands/:brand - Get models for specific brand',
        'GET /api/devices/:deviceId - Get specific device details',
        'GET /api/devices/:deviceId/repairs - Get repair options for device',
        'GET /api/devices/:deviceId/parts - Get available parts for device'
      ]
    },
    timeline: 'Week 3-4 - CRITICAL PATH for pricing system',
    priority: 'HIGH - Required for real booking system'
  });
});

// GET /api/devices/brands
router.get('/brands', (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Device brands API under development',
    expectedData: [
      'Apple (iPhone, iPad, MacBook, iMac)',
      'Samsung (Galaxy S/Note, Tab)',
      'Google (Pixel series)',
      'OnePlus',
      'Xiaomi',
      'Huawei',
      'Microsoft (Surface)'
    ],
    timeline: 'Week 3-4'
  });
});

// GET /api/devices/brands/:brand
router.get('/brands/:brand', (req, res) => {
  const { brand } = req.params;
  
  res.status(501).json({
    success: false,
    message: `${brand} device models API under development`,
    timeline: 'Week 3-4'
  });
});

// GET /api/devices/:deviceId
router.get('/:deviceId', (req, res) => {
  const { deviceId } = req.params;
  
  res.status(501).json({
    success: false,
    message: 'Device details API under development',
    expectedData: {
      id: 'device-id',
      brand: 'Apple',
      model: 'iPhone 15 Pro',
      year: 2023,
      specifications: {},
      repairCategories: [],
      averageRepairCost: 0,
      partsCatalog: []
    },
    timeline: 'Week 3-4'
  });
});

// GET /api/devices/:deviceId/repairs
router.get('/:deviceId/repairs', (req, res) => {
  const { deviceId } = req.params;
  
  res.status(501).json({
    success: false,
    message: 'Device repair options API under development',
    expectedData: {
      deviceId,
      availableRepairs: [
        'screen_replacement',
        'battery_replacement',
        'camera_repair',
        'charging_port_repair',
        'water_damage_repair'
      ],
      pricing: {},
      estimatedTimes: {}
    },
    timeline: 'Week 3-4'
  });
});

export default router;