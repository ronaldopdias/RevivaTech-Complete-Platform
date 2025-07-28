# Session 1: Backend Foundation & Real Data Infrastructure

**Session Priority**: CRITICAL - Foundation for all subsequent sessions  
**Estimated Duration**: Full implementation session  
**Prerequisites**: Current RevivaTech codebase, Docker infrastructure access  
**Objective**: Establish real backend services and eliminate ALL mock data  

---

## 🎯 Session Objectives

### Primary Goals
1. **PostgreSQL Database**: Complete schema with relationships and indexes
2. **Authentication System**: JWT with refresh tokens, role-based access
3. **Core API Endpoints**: All major features connected to real backend
4. **Mock Data Elimination**: Remove ALL mock data from frontend components
5. **WebSocket Infrastructure**: Real-time communication foundation

### Success Criteria
- [ ] Database operational with complete schema
- [ ] Authentication working with real JWT tokens
- [ ] All frontend components connected to real APIs (zero mock data)
- [ ] WebSocket server running for real-time features
- [ ] Basic CRUD operations functional for all entities

---

## 📋 Prerequisites Checklist

### Infrastructure Requirements
- [ ] Docker containers running: `revivatech_new_frontend`, `revivatech_new_backend`, `revivatech_new_database`
- [ ] PostgreSQL database accessible on port 5435
- [ ] Redis cache accessible on port 6383
- [ ] Backend API port 3011 available
- [ ] Node.js and npm/yarn installed in backend container

### Current State Verification
- [ ] RevivaTech frontend components exist and are functional
- [ ] Current mock data locations identified
- [ ] Container health confirmed via `curl http://localhost:3010/health`
- [ ] Database connection possible

---

## 🗄️ Database Schema Implementation

### 1. Core Tables Structure

**Create**: `/backend/database/schema/001_core_tables.sql`

```sql
-- Users table with role-based access
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL CHECK (role IN ('customer', 'admin', 'technician')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Device categories and models
CREATE TABLE device_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    sort_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE device_models (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES device_categories(id),
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(200) NOT NULL,
    year INTEGER,
    specifications JSONB,
    image_url VARCHAR(500),
    repair_difficulty VARCHAR(20) CHECK (repair_difficulty IN ('easy', 'medium', 'hard')),
    common_issues TEXT[],
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Repair types and pricing
CREATE TABLE repair_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES device_categories(id),
    base_price DECIMAL(10,2),
    estimated_time_hours INTEGER,
    difficulty_level VARCHAR(20),
    parts_required JSONB,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customer bookings
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES users(id),
    device_category_id INTEGER REFERENCES device_categories(id),
    device_model_id INTEGER REFERENCES device_models(id),
    repair_type_id INTEGER REFERENCES repair_types(id),
    issue_description TEXT NOT NULL,
    customer_phone VARCHAR(20),
    customer_email VARCHAR(255),
    preferred_date DATE,
    preferred_time TIME,
    appointment_confirmed BOOLEAN DEFAULT FALSE,
    appointment_datetime TIMESTAMP,
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
    estimated_cost DECIMAL(10,2),
    final_cost DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Repair tracking
CREATE TABLE repairs (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES bookings(id),
    technician_id INTEGER REFERENCES users(id),
    status VARCHAR(30) DEFAULT 'received' CHECK (status IN ('received', 'diagnosing', 'awaiting_parts', 'in_repair', 'testing', 'completed', 'quality_check', 'ready_for_pickup')),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    diagnosis TEXT,
    parts_needed JSONB,
    parts_cost DECIMAL(10,2),
    labor_cost DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    estimated_completion TIMESTAMP,
    actual_completion TIMESTAMP,
    quality_notes TEXT,
    customer_notified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Status updates and tracking
CREATE TABLE repair_status_updates (
    id SERIAL PRIMARY KEY,
    repair_id INTEGER REFERENCES repairs(id),
    status VARCHAR(30) NOT NULL,
    message TEXT,
    technician_id INTEGER REFERENCES users(id),
    customer_notified BOOLEAN DEFAULT FALSE,
    images JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    read BOOLEAN DEFAULT FALSE,
    email_sent BOOLEAN DEFAULT FALSE,
    sms_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- File uploads
CREATE TABLE file_uploads (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    uploaded_by INTEGER REFERENCES users(id),
    entity_type VARCHAR(50),
    entity_id INTEGER,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Analytics and metrics
CREATE TABLE analytics_events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    user_id INTEGER REFERENCES users(id),
    session_id VARCHAR(255),
    data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Indexes and Performance

**Create**: `/backend/database/schema/002_indexes.sql`

```sql
-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Device indexes
CREATE INDEX idx_device_models_category ON device_models(category_id);
CREATE INDEX idx_device_models_brand ON device_models(brand);
CREATE INDEX idx_device_models_active ON device_models(active);

-- Booking indexes
CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_created_at ON bookings(created_at);
CREATE INDEX idx_bookings_appointment_date ON bookings(appointment_datetime);

-- Repair indexes
CREATE INDEX idx_repairs_booking ON repairs(booking_id);
CREATE INDEX idx_repairs_technician ON repairs(technician_id);
CREATE INDEX idx_repairs_status ON repairs(status);
CREATE INDEX idx_repairs_created_at ON repairs(created_at);

-- Notification indexes
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Analytics indexes
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_user ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);
```

### 3. Seed Data for Real Operations

**Create**: `/backend/database/seeds/001_initial_data.sql`

```sql
-- Device categories
INSERT INTO device_categories (name, slug, description, icon, sort_order) VALUES
('MacBook', 'macbook', 'Apple MacBook laptops', 'laptop', 1),
('iMac', 'imac', 'Apple iMac desktop computers', 'monitor', 2),
('iPad', 'ipad', 'Apple iPad tablets', 'tablet', 3),
('iPhone', 'iphone', 'Apple iPhone smartphones', 'smartphone', 4),
('PC Laptop', 'pc-laptop', 'Windows and Linux laptops', 'laptop', 5),
('PC Desktop', 'pc-desktop', 'Desktop computers', 'pc', 6),
('Gaming Console', 'gaming-console', 'Gaming consoles', 'gamepad2', 7),
('Android Phone', 'android-phone', 'Android smartphones', 'smartphone', 8);

-- Repair types
INSERT INTO repair_types (name, description, category_id, base_price, estimated_time_hours, difficulty_level) VALUES
('Screen Replacement', 'Replace cracked or damaged screen', 1, 299.99, 2, 'medium'),
('Battery Replacement', 'Replace worn out battery', 1, 149.99, 1, 'easy'),
('Keyboard Repair', 'Fix or replace keyboard', 1, 199.99, 3, 'hard'),
('Logic Board Repair', 'Diagnose and repair logic board issues', 1, 599.99, 8, 'hard'),
('Data Recovery', 'Recover data from damaged devices', 1, 399.99, 24, 'hard'),
('Liquid Damage Repair', 'Clean and repair liquid damage', 1, 449.99, 12, 'hard');

-- Sample admin user (password: admin123!)
INSERT INTO users (email, password_hash, first_name, last_name, role, email_verified) VALUES
('admin@revivatech.co.uk', '$2b$10$8K1oE2sX9Q4tV6wR3mN2kuN8Y9XzGjHkL5pF7dR9cA2sB4wT6eR1u', 'Admin', 'User', 'admin', TRUE);

-- Sample technician user (password: tech123!)
INSERT INTO users (email, password_hash, first_name, last_name, role, email_verified) VALUES
('tech@revivatech.co.uk', '$2b$10$9L2pF3tY0R5uW7xS4oO3lvO9Z0YzHkImM6qG8eS0dB3tC5xU7fS2v', 'Tech', 'Expert', 'technician', TRUE);
```

---

## 🔐 Authentication System Implementation

### 1. JWT Authentication Middleware

**Create**: `/backend/middleware/auth.js`

```javascript
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';

// Generate access token (15 minutes)
const generateAccessToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name
    },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
};

// Generate refresh token (7 days)
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
};

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    
    if (!user || user.status !== 'active') {
      return res.status(401).json({ error: 'Invalid or inactive user' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Role-based authorization
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  authenticateToken,
  authorizeRoles
};
```

### 2. Authentication Routes

**Create**: `/backend/routes/auth.js`

```javascript
const express = require('express');
const bcrypt = require('bcrypt');
const { User } = require('../models');
const { generateAccessToken, generateRefreshToken, authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, role = 'customer' } = req.body;

    // Validate input
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
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
      email_verified: false
    });

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check user status
    if (user.status !== 'active') {
      return res.status(401).json({ error: 'Account is not active' });
    }

    // Update last login
    await user.update({ last_login: new Date() });

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
router.get('/me', authenticateToken, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      firstName: req.user.first_name,
      lastName: req.user.last_name,
      role: req.user.role,
      emailVerified: req.user.email_verified
    }
  });
});

// Logout (invalidate token on frontend)
router.post('/logout', authenticateToken, (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
```

---

## 🌐 Core API Endpoints

### 1. Bookings API

**Create**: `/backend/routes/bookings.js`

```javascript
const express = require('express');
const { Booking, DeviceCategory, DeviceModel, RepairType, User } = require('../models');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const router = express.Router();

// Get all bookings (admin/technician)
router.get('/', authenticateToken, authorizeRoles('admin', 'technician'), async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    
    const where = {};
    if (status) where.status = status;

    const bookings = await Booking.findAndCountAll({
      where,
      include: [
        { model: User, as: 'customer', attributes: ['id', 'first_name', 'last_name', 'email', 'phone'] },
        { model: DeviceCategory, attributes: ['id', 'name', 'slug'] },
        { model: DeviceModel, attributes: ['id', 'brand', 'model', 'year'] },
        { model: RepairType, attributes: ['id', 'name', 'base_price'] }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.json({
      bookings: bookings.rows,
      total: bookings.count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Get customer's bookings
router.get('/my-bookings', authenticateToken, async (req, res) => {
  try {
    const bookings = await Booking.findAll({
      where: { customer_id: req.user.id },
      include: [
        { model: DeviceCategory, attributes: ['name', 'slug'] },
        { model: DeviceModel, attributes: ['brand', 'model'] },
        { model: RepairType, attributes: ['name'] }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({ bookings });
  } catch (error) {
    console.error('Get customer bookings error:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Create new booking
router.post('/', async (req, res) => {
  try {
    const {
      customerEmail,
      customerPhone,
      customerName,
      deviceCategoryId,
      deviceModelId,
      repairTypeId,
      issueDescription,
      preferredDate,
      preferredTime
    } = req.body;

    // Validate required fields
    if (!customerEmail || !deviceCategoryId || !repairTypeId || !issueDescription) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Find or create customer
    let customer = null;
    if (req.user) {
      customer = req.user;
    } else {
      // For guest bookings, create a customer record
      const [firstName, lastName] = (customerName || 'Guest User').split(' ');
      customer = await User.findOrCreate({
        where: { email: customerEmail },
        defaults: {
          email: customerEmail,
          first_name: firstName || 'Guest',
          last_name: lastName || 'User',
          phone: customerPhone,
          role: 'customer',
          password_hash: await bcrypt.hash(Math.random().toString(36), 10) // Temporary password
        }
      });
      customer = customer[0];
    }

    // Create booking
    const booking = await Booking.create({
      customer_id: customer.id,
      device_category_id: deviceCategoryId,
      device_model_id: deviceModelId,
      repair_type_id: repairTypeId,
      issue_description: issueDescription,
      customer_phone: customerPhone,
      customer_email: customerEmail,
      preferred_date: preferredDate,
      preferred_time: preferredTime,
      status: 'pending'
    });

    // Fetch complete booking data
    const completeBooking = await Booking.findByPk(booking.id, {
      include: [
        { model: DeviceCategory, attributes: ['name', 'slug'] },
        { model: DeviceModel, attributes: ['brand', 'model'] },
        { model: RepairType, attributes: ['name', 'base_price'] }
      ]
    });

    res.status(201).json({ booking: completeBooking });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// Update booking status
router.patch('/:id/status', authenticateToken, authorizeRoles('admin', 'technician'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const booking = await Booking.findByPk(id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    await booking.update({ status, notes, updated_at: new Date() });

    res.json({ booking });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

module.exports = router;
```

### 2. Device Database API

**Create**: `/backend/routes/devices.js`

```javascript
const express = require('express');
const { DeviceCategory, DeviceModel, RepairType } = require('../models');
const router = express.Router();

// Get all device categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await DeviceCategory.findAll({
      where: { active: true },
      order: [['sort_order', 'ASC'], ['name', 'ASC']]
    });
    
    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get models for a category
router.get('/categories/:id/models', async (req, res) => {
  try {
    const { id } = req.params;
    const { search, year } = req.query;

    const where = { category_id: id, active: true };
    if (search) {
      where[Op.or] = [
        { brand: { [Op.iLike]: `%${search}%` } },
        { model: { [Op.iLike]: `%${search}%` } }
      ];
    }
    if (year) where.year = year;

    const models = await DeviceModel.findAll({
      where,
      order: [['brand', 'ASC'], ['model', 'ASC'], ['year', 'DESC']]
    });

    res.json({ models });
  } catch (error) {
    console.error('Get models error:', error);
    res.status(500).json({ error: 'Failed to fetch models' });
  }
});

// Get repair types for a category
router.get('/categories/:id/repair-types', async (req, res) => {
  try {
    const { id } = req.params;
    
    const repairTypes = await RepairType.findAll({
      where: { category_id: id, active: true },
      order: [['name', 'ASC']]
    });

    res.json({ repairTypes });
  } catch (error) {
    console.error('Get repair types error:', error);
    res.status(500).json({ error: 'Failed to fetch repair types' });
  }
});

module.exports = router;
```

---

## 🔄 WebSocket Server Setup

### WebSocket Implementation

**Create**: `/backend/websocket/server.js`

```javascript
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

class WebSocketServer {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.clients = new Map(); // Store authenticated clients
    
    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });
  }

  async handleConnection(ws, req) {
    try {
      // Extract token from query string or headers
      const url = new URL(req.url, `http://${req.headers.host}`);
      const token = url.searchParams.get('token') || req.headers.authorization?.split(' ')[1];

      if (!token) {
        ws.close(1008, 'Authentication required');
        return;
      }

      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findByPk(decoded.id);

      if (!user || user.status !== 'active') {
        ws.close(1008, 'Invalid user');
        return;
      }

      // Store authenticated client
      const clientId = `${user.id}_${Date.now()}`;
      this.clients.set(clientId, {
        ws,
        userId: user.id,
        userRole: user.role,
        connectedAt: new Date()
      });

      // Send connection confirmation
      ws.send(JSON.stringify({
        type: 'connection',
        status: 'connected',
        userId: user.id,
        clientId
      }));

      // Handle messages
      ws.on('message', (message) => {
        this.handleMessage(clientId, message);
      });

      // Handle disconnection
      ws.on('close', () => {
        this.clients.delete(clientId);
        console.log(`Client ${clientId} disconnected`);
      });

      console.log(`User ${user.email} connected via WebSocket`);

    } catch (error) {
      console.error('WebSocket connection error:', error);
      ws.close(1008, 'Authentication failed');
    }
  }

  handleMessage(clientId, message) {
    try {
      const data = JSON.parse(message);
      const client = this.clients.get(clientId);

      if (!client) return;

      switch (data.type) {
        case 'ping':
          client.ws.send(JSON.stringify({ type: 'pong' }));
          break;
        
        case 'subscribe':
          // Handle room subscriptions (repair updates, notifications, etc.)
          this.handleSubscription(clientId, data);
          break;

        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Message handling error:', error);
    }
  }

  handleSubscription(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Add client to subscription rooms
    client.subscriptions = client.subscriptions || new Set();
    
    if (data.rooms) {
      data.rooms.forEach(room => {
        client.subscriptions.add(room);
      });
    }

    client.ws.send(JSON.stringify({
      type: 'subscription_confirmed',
      rooms: Array.from(client.subscriptions)
    }));
  }

  // Broadcast to specific user
  sendToUser(userId, message) {
    for (const [clientId, client] of this.clients) {
      if (client.userId === userId) {
        client.ws.send(JSON.stringify(message));
      }
    }
  }

  // Broadcast to users by role
  sendToRole(role, message) {
    for (const [clientId, client] of this.clients) {
      if (client.userRole === role) {
        client.ws.send(JSON.stringify(message));
      }
    }
  }

  // Broadcast to subscription room
  sendToRoom(room, message) {
    for (const [clientId, client] of this.clients) {
      if (client.subscriptions && client.subscriptions.has(room)) {
        client.ws.send(JSON.stringify(message));
      }
    }
  }

  // Get connected users count
  getStats() {
    const stats = {
      totalConnections: this.clients.size,
      byRole: {},
      connectionTimes: []
    };

    for (const [clientId, client] of this.clients) {
      stats.byRole[client.userRole] = (stats.byRole[client.userRole] || 0) + 1;
      stats.connectionTimes.push(client.connectedAt);
    }

    return stats;
  }
}

module.exports = WebSocketServer;
```

---

## 🗑️ Mock Data Elimination Strategy

### 1. Identify Mock Data Locations

**Frontend Mock Data Audit**:
```bash
# Find all mock data files
find /opt/webapps/revivatech/frontend -name "*mock*" -type f
find /opt/webapps/revivatech/frontend -name "*demo*" -type f
grep -r "mockData\|demoData\|MOCK\|DEMO" /opt/webapps/revivatech/frontend/src --include="*.ts" --include="*.tsx"
```

### 2. Component Updates Required

**Update**: `/frontend/src/lib/api.ts` - Replace mock API calls

```typescript
// Remove mock data imports
// import { mockBookings, mockRepairs, mockUsers } from './mockData';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3011/api';

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = API_BASE_URL;
    // Get token from localStorage
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('accessToken');
    }
  }

  private async fetch(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Authentication
  async login(email: string, password: string) {
    const response = await this.fetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.accessToken) {
      this.token = response.accessToken;
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
    }
    
    return response;
  }

  async register(userData: any) {
    return this.fetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async logout() {
    try {
      await this.fetch('/auth/logout', { method: 'POST' });
    } finally {
      this.token = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  }

  // Bookings
  async getBookings(params: any = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.fetch(`/bookings?${queryString}`);
  }

  async createBooking(booking: any) {
    return this.fetch('/bookings', {
      method: 'POST',
      body: JSON.stringify(booking),
    });
  }

  async updateBookingStatus(id: number, status: string, notes?: string) {
    return this.fetch(`/bookings/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
  }

  // Devices
  async getDeviceCategories() {
    return this.fetch('/devices/categories');
  }

  async getDeviceModels(categoryId: number, params: any = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.fetch(`/devices/categories/${categoryId}/models?${queryString}`);
  }

  async getRepairTypes(categoryId: number) {
    return this.fetch(`/devices/categories/${categoryId}/repair-types`);
  }
}

export const apiClient = new ApiClient();
```

### 3. Update Frontend Components

**Update these components to use real API**:
- `/frontend/src/components/admin/AdminDashboard.tsx`
- `/frontend/src/components/admin/DashboardStats.tsx`
- `/frontend/src/components/admin/RecentActivity.tsx`
- `/frontend/src/components/booking/BookingForm.tsx`
- `/frontend/src/app/dashboard/page.tsx`

**Example Update**: `/frontend/src/components/admin/DashboardStats.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Users, Wrench, CheckCircle, TrendingUp } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface DashboardStats {
  totalBookings: number;
  activeRepairs: number;
  completedToday: number;
  revenue: number;
}

const DashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getDashboardStats();
      setStats(response.stats);
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
      setError('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading statistics...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!stats) return <div>No data available</div>;

  const statCards = [
    {
      title: 'Total Bookings',
      value: stats.totalBookings,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Active Repairs',
      value: stats.activeRepairs,
      icon: Wrench,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      title: 'Completed Today',
      value: stats.completedToday,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Revenue',
      value: `£${stats.revenue.toLocaleString()}`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => (
        <Card key={index} className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
            <div className={`p-3 rounded-full ${stat.bgColor}`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default DashboardStats;
```

---

## ✅ Session Completion Checklist

### Database Setup
- [ ] PostgreSQL database schema created and running
- [ ] All tables created with proper relationships
- [ ] Indexes created for performance
- [ ] Seed data inserted (categories, repair types, admin user)
- [ ] Database connection from backend verified

### Authentication System
- [ ] JWT authentication middleware implemented
- [ ] User registration and login routes working
- [ ] Role-based authorization functional
- [ ] Password hashing and verification working
- [ ] Token refresh mechanism implemented

### API Endpoints
- [ ] Authentication routes (`/auth/login`, `/auth/register`, `/auth/me`)
- [ ] Bookings API (`/bookings` - GET, POST, PATCH)
- [ ] Device database API (`/devices/categories`, `/devices/models`)
- [ ] Basic CRUD operations tested with Postman/curl

### WebSocket Server
- [ ] WebSocket server running and accepting connections
- [ ] Authentication for WebSocket connections working
- [ ] Basic message handling implemented
- [ ] Room/subscription system functional

### Frontend Integration
- [ ] All mock data imports removed from components
- [ ] ApiClient class implemented and configured
- [ ] Frontend components connected to real API endpoints
- [ ] Authentication flow working in frontend
- [ ] Error handling implemented for API failures

### Testing Validation
- [ ] User can register and login through frontend
- [ ] Admin dashboard shows real data (even if empty initially)
- [ ] Booking form submits to real backend
- [ ] Device categories and models load from database
- [ ] WebSocket connection established from frontend

---

## 📋 Next Session Preparation

### Context for Session 2
After completing Session 1, the following should be operational:
- Real database with core schema
- Authentication system functional
- Basic API endpoints available
- No mock data in any frontend components
- WebSocket infrastructure ready

### Session 2 Prerequisites
- All Session 1 deliverables completed
- Admin user account created and can login
- Database populated with basic seed data
- API endpoints responding correctly

### Files to Reference for Session 2
- **Admin Components**: All files in `/frontend/src/components/admin/`
- **Analytics Components**: Components requiring real business intelligence
- **Chat Integration**: Chatwoot setup and WebSocket integration
- **AI Features**: Diagnostic and prediction system implementation

---

**Session 1 Success Criteria**: Zero mock data remaining, real backend services operational, authentication working, basic API functionality complete.

**Next Session**: Execute Session 2 using `SESSION_2_ADMIN_DASHBOARD_COMPLETE.md` guide.