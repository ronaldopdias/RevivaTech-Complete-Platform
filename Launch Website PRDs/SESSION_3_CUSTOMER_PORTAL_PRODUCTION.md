# Session 3: Customer Portal Production Implementation

**Session Priority**: HIGH - Customer-facing functionality  
**Estimated Duration**: Full implementation session  
**Prerequisites**: Session 1 completed (Backend foundation + Database operational)  
**Objective**: Complete customer portal with booking, tracking, payments, and notifications  

---

## 🎯 Session Objectives

### Primary Goals
1. **Complete Booking System**: Multi-step booking with 2016-2025 device database
2. **Real-time Repair Tracking**: WebSocket-powered status updates  
3. **Stripe Payment Integration**: Full payment processing and invoice generation
4. **Notification System**: Email/SMS alerts for repair updates
5. **File Upload System**: Photo uploads for device issues and documentation

### Success Criteria
- [x] ✅ **Customer can complete full booking workflow with real device database** (COMPLETED)
- [x] ✅ **Real-time repair tracking operational via WebSocket** (COMPLETED)
- [x] ✅ **Email notifications sending for all repair events** (COMPLETED - Booking confirmations)
- [x] ✅ **Customer portal with live repair status updates** (COMPLETED)
- [ ] Payment processing functional with Stripe
- [ ] SMS notifications sending for all repair events
- [ ] File upload working for repair documentation
- [ ] Mobile-optimized responsive experience

---

## 📋 Prerequisites Verification

### Session 1 Completion Check
- [ ] PostgreSQL database operational with complete schema
- [ ] JWT authentication system working
- [ ] Core API endpoints functional (auth, bookings, devices, users)
- [ ] WebSocket server running and accepting connections
- [ ] Frontend components connected to real backend (no mock data in core features)

### Infrastructure Requirements
- [ ] Stripe account configured with API keys
- [ ] Email service configured (SendGrid/AWS SES)
- [ ] SMS service configured (Twilio/AWS SNS)
- [ ] File storage configured (local/S3)
- [ ] Domain SSL certificates active

---

## 🗄️ Device Database Implementation

### 1. Complete Device Database Schema

**Extend**: `/backend/database/seeds/002_device_database.sql`

```sql
-- Complete device categories with icons and specifications
INSERT INTO device_categories (name, slug, description, icon, sort_order, active) VALUES
('MacBook', 'macbook', 'Apple MacBook laptops (2016-2025)', 'laptop', 1, TRUE),
('MacBook Pro', 'macbook-pro', 'Apple MacBook Pro (2016-2025)', 'laptop', 2, TRUE),
('MacBook Air', 'macbook-air', 'Apple MacBook Air (2018-2025)', 'laptop', 3, TRUE),
('iMac', 'imac', 'Apple iMac desktop computers (2017-2025)', 'monitor', 4, TRUE),
('iMac Pro', 'imac-pro', 'Apple iMac Pro (2017-2021)', 'monitor', 5, TRUE),
('Mac Studio', 'mac-studio', 'Apple Mac Studio (2022-2025)', 'pc', 6, TRUE),
('Mac Pro', 'mac-pro', 'Apple Mac Pro (2019-2025)', 'pc', 7, TRUE),
('Mac Mini', 'mac-mini', 'Apple Mac Mini (2018-2025)', 'pc', 8, TRUE),
('iPad Pro', 'ipad-pro', 'Apple iPad Pro (2016-2025)', 'tablet', 9, TRUE),
('iPad Air', 'ipad-air', 'Apple iPad Air (2019-2025)', 'tablet', 10, TRUE),
('iPad', 'ipad', 'Apple iPad (2017-2025)', 'tablet', 11, TRUE),
('iPad Mini', 'ipad-mini', 'Apple iPad Mini (2019-2025)', 'tablet', 12, TRUE),
('iPhone 15', 'iphone-15', 'iPhone 15 series (2023)', 'smartphone', 13, TRUE),
('iPhone 14', 'iphone-14', 'iPhone 14 series (2022)', 'smartphone', 14, TRUE),
('iPhone 13', 'iphone-13', 'iPhone 13 series (2021)', 'smartphone', 15, TRUE),
('iPhone 12', 'iphone-12', 'iPhone 12 series (2020)', 'smartphone', 16, TRUE),
('iPhone 11', 'iphone-11', 'iPhone 11 series (2019)', 'smartphone', 17, TRUE),
('iPhone X/XS', 'iphone-x-xs', 'iPhone X and XS series (2017-2018)', 'smartphone', 18, TRUE),
('iPhone 8', 'iphone-8', 'iPhone 8 and 8 Plus (2017)', 'smartphone', 19, TRUE),
('iPhone 7', 'iphone-7', 'iPhone 7 and 7 Plus (2016)', 'smartphone', 20, TRUE),
('Windows Laptop', 'windows-laptop', 'Windows laptops (2016-2025)', 'laptop', 21, TRUE),
('Gaming Laptop', 'gaming-laptop', 'Gaming laptops (2016-2025)', 'laptop', 22, TRUE),
('Desktop PC', 'desktop-pc', 'Desktop computers (2016-2025)', 'pc', 23, TRUE),
('Gaming PC', 'gaming-pc', 'Gaming desktop computers (2016-2025)', 'pc', 24, TRUE),
('PlayStation', 'playstation', 'PlayStation consoles (PS4/PS5)', 'gamepad2', 25, TRUE),
('Xbox', 'xbox', 'Xbox consoles (One/Series)', 'gamepad2', 26, TRUE),
('Nintendo Switch', 'nintendo-switch', 'Nintendo Switch console (2017-2025)', 'gamepad2', 27, TRUE),
('Samsung Galaxy', 'samsung-galaxy', 'Samsung Galaxy smartphones (2016-2025)', 'smartphone', 28, TRUE),
('Google Pixel', 'google-pixel', 'Google Pixel smartphones (2016-2025)', 'smartphone', 29, TRUE),
('OnePlus', 'oneplus', 'OnePlus smartphones (2016-2025)', 'smartphone', 30, TRUE);

-- Sample device models (implement complete database per category)
INSERT INTO device_models (category_id, brand, model, year, specifications, image_url, repair_difficulty, common_issues, active) VALUES
-- MacBook Pro models
(2, 'Apple', 'MacBook Pro 13" M3', 2024, '{"chip": "M3", "ram": "8GB-24GB", "storage": "256GB-2TB", "ports": "2x Thunderbolt 4"}', '/images/macbook-pro-13-m3.jpg', 'medium', ARRAY['Battery drain', 'Keyboard issues', 'Screen damage'], TRUE),
(2, 'Apple', 'MacBook Pro 14" M3', 2023, '{"chip": "M3 Pro/Max", "ram": "18GB-36GB", "storage": "512GB-4TB", "ports": "3x Thunderbolt 4, HDMI, SD"}', '/images/macbook-pro-14-m3.jpg', 'medium', ARRAY['Battery drain', 'Port issues', 'Screen damage'], TRUE),
(2, 'Apple', 'MacBook Pro 16" M3', 2023, '{"chip": "M3 Pro/Max", "ram": "18GB-48GB", "storage": "512GB-8TB", "ports": "3x Thunderbolt 4, HDMI, SD"}', '/images/macbook-pro-16-m3.jpg', 'medium', ARRAY['Battery drain', 'Thermal issues', 'Screen damage'], TRUE),
-- Add more models per category...
;

-- Comprehensive repair types for all categories
INSERT INTO repair_types (name, description, category_id, base_price, estimated_time_hours, difficulty_level, parts_required, active) VALUES
-- MacBook repairs
('MacBook Screen Replacement', 'Replace cracked or damaged MacBook screen', 1, 299.99, 2, 'medium', '{"screen_assembly": true, "tools": ["pentalobe", "torx"]}', TRUE),
('MacBook Battery Replacement', 'Replace worn MacBook battery', 1, 149.99, 1, 'easy', '{"battery": true, "adhesive_strips": true}', TRUE),
('MacBook Keyboard Repair', 'Fix or replace MacBook keyboard', 1, 199.99, 3, 'hard', '{"keyboard_assembly": true, "backlight": true}', TRUE),
('MacBook Logic Board Repair', 'Diagnose and repair logic board issues', 1, 599.99, 8, 'hard', '{"microsoldering": true, "diagnostic_tools": true}', TRUE),
('MacBook Liquid Damage Repair', 'Clean and repair liquid damage', 1, 449.99, 12, 'hard', '{"cleaning_solution": true, "replacement_parts": "variable"}', TRUE),
-- iPhone repairs  
('iPhone Screen Replacement', 'Replace cracked iPhone screen', 13, 199.99, 1, 'medium', '{"screen_assembly": true, "adhesive": true}', TRUE),
('iPhone Battery Replacement', 'Replace iPhone battery', 13, 89.99, 1, 'easy', '{"battery": true, "adhesive_strips": true}', TRUE),
('iPhone Camera Repair', 'Fix or replace iPhone camera', 13, 149.99, 2, 'medium', '{"camera_module": true, "flex_cable": true}', TRUE),
('iPhone Charging Port Repair', 'Fix iPhone charging port', 13, 119.99, 2, 'medium', '{"charging_port": true, "flex_cable": true}', TRUE),
-- Add repair types for all device categories...
;
```

### 2. Device Database API Enhancement

**Create**: `/backend/routes/device-database.js`

```javascript
const express = require('express');
const { DeviceCategory, DeviceModel, RepairType } = require('../models');
const { Op } = require('sequelize');
const router = express.Router();

// Get all categories with model counts
router.get('/categories', async (req, res) => {
  try {
    const categories = await DeviceCategory.findAll({
      where: { active: true },
      include: [{
        model: DeviceModel,
        attributes: [],
        where: { active: true },
        required: false
      }],
      attributes: {
        include: [
          [sequelize.fn('COUNT', sequelize.col('DeviceModels.id')), 'modelCount']
        ]
      },
      group: ['DeviceCategory.id'],
      order: [['sort_order', 'ASC'], ['name', 'ASC']]
    });
    
    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Search device models with advanced filtering
router.get('/search', async (req, res) => {
  try {
    const { 
      query, 
      category, 
      year_from, 
      year_to, 
      brand, 
      limit = 20, 
      offset = 0 
    } = req.query;

    const where = { active: true };
    
    if (query) {
      where[Op.or] = [
        { brand: { [Op.iLike]: `%${query}%` } },
        { model: { [Op.iLike]: `%${query}%` } }
      ];
    }
    
    if (category) where.category_id = category;
    if (brand) where.brand = { [Op.iLike]: `%${brand}%` };
    
    if (year_from || year_to) {
      where.year = {};
      if (year_from) where.year[Op.gte] = parseInt(year_from);
      if (year_to) where.year[Op.lte] = parseInt(year_to);
    }

    const models = await DeviceModel.findAndCountAll({
      where,
      include: [{
        model: DeviceCategory,
        attributes: ['name', 'slug', 'icon']
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['brand', 'ASC'], ['year', 'DESC'], ['model', 'ASC']]
    });

    res.json({
      models: models.rows,
      total: models.count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Device search error:', error);
    res.status(500).json({ error: 'Failed to search devices' });
  }
});

// Get device model details with repair options
router.get('/models/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const model = await DeviceModel.findByPk(id, {
      include: [
        {
          model: DeviceCategory,
          attributes: ['name', 'slug', 'icon']
        },
        {
          model: RepairType,
          where: { active: true },
          required: false,
          through: { attributes: [] }
        }
      ]
    });

    if (!model) {
      return res.status(404).json({ error: 'Device model not found' });
    }

    // Get available repair types for this category
    const repairTypes = await RepairType.findAll({
      where: { 
        category_id: model.category_id,
        active: true
      },
      order: [['name', 'ASC']]
    });

    res.json({ 
      model,
      repairTypes,
      commonIssues: model.common_issues || []
    });
  } catch (error) {
    console.error('Get device model error:', error);
    res.status(500).json({ error: 'Failed to fetch device model' });
  }
});

module.exports = router;
```

---

## 📱 Complete Booking System Implementation

### 1. Multi-Step Booking Backend

**Create**: `/backend/routes/customer-bookings.js`

```javascript
const express = require('express');
const { Booking, DeviceCategory, DeviceModel, RepairType, User } = require('../models');
const { generateBookingReference, sendBookingConfirmation } = require('../services/booking-service');
const router = express.Router();

// Multi-step booking creation
router.post('/create', async (req, res) => {
  try {
    const {
      // Step 1: Device selection
      deviceCategoryId,
      deviceModelId,
      deviceCondition,
      
      // Step 2: Issue description
      repairTypeId,
      issueDescription,
      urgency,
      
      // Step 3: Customer details
      customerInfo,
      
      // Step 4: Appointment preference
      appointmentPreference,
      
      // Step 5: Additional options
      additionalServices
    } = req.body;

    // Validate required fields
    if (!deviceCategoryId || !deviceModelId || !repairTypeId || !issueDescription) {
      return res.status(400).json({ error: 'Missing required booking information' });
    }

    // Generate booking reference
    const bookingReference = generateBookingReference();

    // Create or find customer
    let customer = null;
    if (req.user) {
      customer = req.user;
    } else {
      // Guest booking - create temporary customer
      customer = await User.findOrCreate({
        where: { email: customerInfo.email },
        defaults: {
          email: customerInfo.email,
          first_name: customerInfo.firstName,
          last_name: customerInfo.lastName,
          phone: customerInfo.phone,
          role: 'customer',
          password_hash: await bcrypt.hash(Math.random().toString(36), 10),
          email_verified: false
        }
      });
      customer = customer[0];
    }

    // Calculate estimated cost
    const repairType = await RepairType.findByPk(repairTypeId);
    const deviceModel = await DeviceModel.findByPk(deviceModelId);
    
    let estimatedCost = repairType.base_price;
    
    // Adjust cost based on device age and condition
    const deviceAge = new Date().getFullYear() - (deviceModel.year || 2020);
    if (deviceAge > 5) estimatedCost *= 1.2;
    if (deviceCondition === 'poor') estimatedCost *= 1.3;
    if (urgency === 'urgent') estimatedCost *= 1.5;

    // Create booking
    const booking = await Booking.create({
      booking_reference: bookingReference,
      customer_id: customer.id,
      device_category_id: deviceCategoryId,
      device_model_id: deviceModelId,
      repair_type_id: repairTypeId,
      issue_description: issueDescription,
      device_condition: deviceCondition,
      urgency: urgency || 'normal',
      customer_phone: customerInfo.phone,
      customer_email: customerInfo.email,
      preferred_date: appointmentPreference.date,
      preferred_time: appointmentPreference.time,
      estimated_cost: Math.round(estimatedCost * 100) / 100,
      additional_services: additionalServices,
      status: 'pending',
      booking_data: {
        customerInfo,
        appointmentPreference,
        additionalServices,
        deviceCondition,
        urgency
      }
    });

    // Send confirmation email
    await sendBookingConfirmation(booking, customer);

    // Fetch complete booking data
    const completeBooking = await Booking.findByPk(booking.id, {
      include: [
        { model: DeviceCategory, attributes: ['name', 'slug', 'icon'] },
        { model: DeviceModel, attributes: ['brand', 'model', 'year'] },
        { model: RepairType, attributes: ['name', 'description'] }
      ]
    });

    res.status(201).json({ 
      booking: completeBooking,
      bookingReference,
      estimatedCost: Math.round(estimatedCost * 100) / 100,
      nextSteps: [
        'You will receive a confirmation email shortly',
        'Our team will contact you within 24 hours to confirm appointment',
        'Bring your device and any relevant accessories'
      ]
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// Get booking status and tracking
router.get('/:reference/status', async (req, res) => {
  try {
    const { reference } = req.params;
    
    const booking = await Booking.findOne({
      where: { booking_reference: reference },
      include: [
        { model: DeviceCategory, attributes: ['name', 'icon'] },
        { model: DeviceModel, attributes: ['brand', 'model'] },
        { model: RepairType, attributes: ['name'] },
        {
          model: Repair,
          include: [
            {
              model: RepairStatusUpdate,
              order: [['created_at', 'DESC']]
            }
          ]
        }
      ]
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({ booking });
  } catch (error) {
    console.error('Get booking status error:', error);
    res.status(500).json({ error: 'Failed to fetch booking status' });
  }
});

module.exports = router;
```

### 2. Frontend Booking Flow

**Create**: `/frontend/src/components/booking/MultiStepBookingFlow.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import { Badge } from '@/components/ui/Badge';
import { 
  ChevronRight, 
  ChevronLeft, 
  Smartphone, 
  Laptop, 
  Monitor,
  Calendar,
  User,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const BOOKING_STEPS = [
  { id: 'device', title: 'Select Device', description: 'Choose your device type and model' },
  { id: 'issue', title: 'Describe Issue', description: 'Tell us what needs fixing' },
  { id: 'customer', title: 'Your Details', description: 'Contact information' },
  { id: 'appointment', title: 'Appointment', description: 'Choose date and time' },
  { id: 'review', title: 'Review', description: 'Confirm your booking' },
  { id: 'confirmation', title: 'Confirmation', description: 'Booking complete' }
];

interface BookingData {
  device: {
    categoryId?: string;
    modelId?: string;
    condition?: string;
  };
  issue: {
    repairTypeId?: string;
    description?: string;
    urgency?: string;
  };
  customer: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
  appointment: {
    date?: string;
    time?: string;
    location?: string;
  };
}

const MultiStepBookingFlow = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [bookingData, setBookingData] = useState<BookingData>({
    device: {},
    issue: {},
    customer: {},
    appointment: {}
  });
  const [deviceCategories, setDeviceCategories] = useState([]);
  const [deviceModels, setDeviceModels] = useState([]);
  const [repairTypes, setRepairTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Device selection step component would go here
  // Issue description step component would go here  
  // Customer details step component would go here
  // Appointment selection step component would go here
  // Review and confirmation components would go here

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress indicator */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-neutral-700">Book a Repair</h2>
          <Badge variant="secondary">
            Step {currentStep + 1} of {BOOKING_STEPS.length}
          </Badge>
        </div>
        
        <Progress value={(currentStep / (BOOKING_STEPS.length - 1)) * 100} className="mb-4" />
        
        <div className="flex justify-between text-sm">
          {BOOKING_STEPS.map((step, index) => (
            <div 
              key={step.id}
              className={`text-center ${index <= currentStep ? 'text-trust-600' : 'text-neutral-400'}`}
            >
              <div className="font-medium">{step.title}</div>
              <div className="text-xs">{step.description}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Step content */}
      <Card className="p-6 min-h-96">
        {/* Step components would be rendered here based on currentStep */}
      </Card>
    </div>
  );
};

export default MultiStepBookingFlow;
```

---

## 💳 Stripe Payment Integration

### 1. Payment Processing Backend

**Create**: `/backend/routes/payments.js`

```javascript
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Booking, Repair, Payment } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Create payment intent
router.post('/create-intent', authenticateToken, async (req, res) => {
  try {
    const { bookingId, amount, currency = 'gbp' } = req.body;

    const booking = await Booking.findByPk(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to pence
      currency,
      metadata: {
        booking_id: bookingId,
        customer_id: req.user.id
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Confirm payment
router.post('/confirm', authenticateToken, async (req, res) => {
  try {
    const { paymentIntentId, bookingId } = req.body;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status === 'succeeded') {
      // Update booking status
      await Booking.update(
        { 
          status: 'confirmed',
          payment_status: 'paid',
          payment_intent_id: paymentIntentId
        },
        { where: { id: bookingId } }
      );

      // Create payment record
      await Payment.create({
        booking_id: bookingId,
        stripe_payment_intent_id: paymentIntentId,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status: 'completed'
      });

      res.json({ success: true, paymentStatus: 'completed' });
    } else {
      res.status(400).json({ error: 'Payment not completed' });
    }
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
});

module.exports = router;
```

### 2. Stripe Frontend Integration

**Create**: `/frontend/src/components/payments/StripePayment.tsx`

```typescript
'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { apiClient } from '@/lib/api';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentFormProps {
  amount: number;
  bookingId: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

const PaymentForm = ({ amount, bookingId, onSuccess, onError }: PaymentFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    setProcessing(true);

    try {
      // Create payment intent
      const { clientSecret } = await apiClient.createPaymentIntent({
        bookingId,
        amount
      });

      // Confirm payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        }
      });

      if (error) {
        onError(error.message || 'Payment failed');
      } else if (paymentIntent.status === 'succeeded') {
        await apiClient.confirmPayment({
          paymentIntentId: paymentIntent.id,
          bookingId
        });
        onSuccess();
      }
    } catch (err) {
      onError('Payment processing failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border border-neutral-300 rounded-lg">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
            },
          }}
        />
      </div>
      
      <Button
        type="submit"
        disabled={!stripe || processing}
        className="w-full bg-trust-500 hover:bg-trust-700 text-white"
      >
        {processing ? 'Processing...' : `Pay £${amount.toFixed(2)}`}
      </Button>
    </form>
  );
};

const StripePayment = ({ amount, bookingId, onSuccess, onError }: PaymentFormProps) => {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm
        amount={amount}
        bookingId={bookingId}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  );
};

export default StripePayment;
```

---

## 🔔 Notification System Implementation

### 1. Email/SMS Service Backend

**Create**: `/backend/services/notification-service.js`

```javascript
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const { Notification } = require('../models');

// Email configuration
const emailTransporter = nodemailer.createTransporter({
  service: 'SendGrid',
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY
  }
});

// SMS configuration
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

class NotificationService {
  static async sendBookingConfirmation(booking, customer) {
    try {
      const emailHtml = `
        <h2>Booking Confirmation - RevivaTech</h2>
        <p>Dear ${customer.first_name},</p>
        <p>Your repair booking has been confirmed:</p>
        <ul>
          <li><strong>Reference:</strong> ${booking.booking_reference}</li>
          <li><strong>Device:</strong> ${booking.DeviceModel.brand} ${booking.DeviceModel.model}</li>
          <li><strong>Issue:</strong> ${booking.RepairType.name}</li>
          <li><strong>Estimated Cost:</strong> £${booking.estimated_cost}</li>
        </ul>
        <p>We'll contact you within 24 hours to confirm your appointment.</p>
        <p>Best regards,<br>RevivaTech Team</p>
      `;

      // Send email
      await emailTransporter.sendMail({
        from: 'noreply@revivatech.co.uk',
        to: customer.email,
        subject: `Booking Confirmation - ${booking.booking_reference}`,
        html: emailHtml
      });

      // Send SMS if phone provided
      if (customer.phone) {
        await twilioClient.messages.create({
          body: `RevivaTech: Your repair booking ${booking.booking_reference} is confirmed. We'll contact you within 24 hours.`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: customer.phone
        });
      }

      // Log notification
      await Notification.create({
        user_id: customer.id,
        type: 'booking_confirmation',
        title: 'Booking Confirmed',
        message: `Your booking ${booking.booking_reference} has been confirmed`,
        data: { booking_id: booking.id },
        email_sent: true,
        sms_sent: !!customer.phone
      });

    } catch (error) {
      console.error('Send booking confirmation error:', error);
    }
  }

  static async sendRepairUpdate(repair, statusUpdate) {
    try {
      const booking = await repair.getBooking({ include: [User] });
      const customer = booking.Customer;

      const emailHtml = `
        <h2>Repair Update - RevivaTech</h2>
        <p>Dear ${customer.first_name},</p>
        <p>Your repair status has been updated:</p>
        <ul>
          <li><strong>Reference:</strong> ${booking.booking_reference}</li>
          <li><strong>Status:</strong> ${statusUpdate.status}</li>
          <li><strong>Update:</strong> ${statusUpdate.message}</li>
        </ul>
        <p>Track your repair: https://revivatech.co.uk/track/${booking.booking_reference}</p>
        <p>Best regards,<br>RevivaTech Team</p>
      `;

      // Send email
      await emailTransporter.sendMail({
        from: 'noreply@revivatech.co.uk',
        to: customer.email,
        subject: `Repair Update - ${booking.booking_reference}`,
        html: emailHtml
      });

      // Send SMS
      if (customer.phone) {
        await twilioClient.messages.create({
          body: `RevivaTech: Your repair ${booking.booking_reference} status: ${statusUpdate.status}. ${statusUpdate.message}`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: customer.phone
        });
      }

      // Log notification
      await Notification.create({
        user_id: customer.id,
        type: 'repair_update',
        title: 'Repair Status Update',
        message: statusUpdate.message,
        data: { repair_id: repair.id, status: statusUpdate.status },
        email_sent: true,
        sms_sent: !!customer.phone
      });

    } catch (error) {
      console.error('Send repair update error:', error);
    }
  }
}

module.exports = NotificationService;
```

---

## ✅ Session 3 Implementation Checklist

### Booking System
- [ ] Complete device database (2016-2025) implemented and seeded
- [ ] Multi-step booking flow functional with real device selection
- [ ] Booking reference generation and tracking working
- [ ] Guest booking capability for non-registered users
- [ ] Real-time cost estimation based on device and repair type

### Payment Integration
- [ ] Stripe payment processing operational
- [ ] Payment intent creation and confirmation working
- [ ] Invoice generation and payment tracking
- [ ] Booking status updates after successful payment
- [ ] Refund and dispute handling capabilities

### Notification System
- [ ] Email notifications sending for all booking events
- [ ] SMS notifications operational for repair updates
- [ ] Real-time in-app notifications via WebSocket
- [ ] Notification preferences and management
- [ ] Email templates designed and tested

### File Upload System
- [ ] Photo upload for device issues working
- [ ] Document upload for warranty/receipts
- [ ] File storage and retrieval system
- [ ] Image optimization and compression
- [ ] Secure file access controls

### Customer Portal
- [ ] Real-time repair tracking functional
- [ ] Customer dashboard with booking history
- [ ] Profile management and preferences
- [ ] Communication with technicians
- [ ] Mobile-optimized responsive design

### Real-time Tracking & WebSocket
- [ ] WebSocket connections established for live updates
- [ ] Real-time repair status broadcasting
- [ ] Live chat with technicians operational
- [ ] Push notifications for mobile users
- [ ] Connection resilience and reconnection logic

### Mobile Optimization
- [ ] Progressive Web App (PWA) functionality
- [ ] Offline capability for viewing booking status
- [ ] Touch-optimized booking flow
- [ ] Camera integration for photo uploads
- [ ] Mobile payment optimization

---

## 📱 File Upload System Implementation

### 1. File Upload Backend

**Create**: `/backend/routes/file-uploads.js`

```javascript
const express = require('express');
const multer = require('multer');
const path = require('path');
const { FileUpload, Booking } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Upload files for booking
router.post('/:bookingId/upload', authenticateToken, upload.array('files', 5), async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { description } = req.body;
    
    const booking = await Booking.findByPk(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const uploadedFiles = [];
    
    for (const file of req.files) {
      const fileRecord = await FileUpload.create({
        booking_id: bookingId,
        filename: file.filename,
        original_name: file.originalname,
        file_path: file.path,
        file_size: file.size,
        mime_type: file.mimetype,
        uploaded_by: req.user.id,
        description: description || 'Device issue photo'
      });
      
      uploadedFiles.push(fileRecord);
    }

    res.json({ files: uploadedFiles });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'Failed to upload files' });
  }
});

module.exports = router;
```

### 2. File Upload Frontend Component

**Create**: `/frontend/src/components/uploads/FileUpload.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Upload, X, FileImage, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface FileUploadProps {
  bookingId: string;
  onUploadComplete: (files: any[]) => void;
  maxFiles?: number;
}

const FileUpload = ({ bookingId, onUploadComplete, maxFiles = 5 }: FileUploadProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    setFiles(prev => [...prev, ...selectedFiles].slice(0, maxFiles));
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    const droppedFiles = Array.from(event.dataTransfer.files);
    setFiles(prev => [...prev, ...droppedFiles].slice(0, maxFiles));
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    try {
      const response = await fetch(`/api/file-uploads/${bookingId}/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        onUploadComplete(result.files);
        setFiles([]);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Upload Photos</h3>
      
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragOver ? 'border-trust-500 bg-trust-50' : 'border-neutral-300'
        }`}
      >
        <Upload className="mx-auto h-12 w-12 text-neutral-400 mb-4" />
        <p className="text-neutral-600 mb-2">Drag and drop files here, or click to select</p>
        <input
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx"
          onChange={handleFileSelect}
          className="hidden"
          id="file-input"
        />
        <label htmlFor="file-input">
          <Button variant="outline" size="sm">
            Choose Files
          </Button>
        </label>
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-neutral-50 rounded">
              <div className="flex items-center space-x-2">
                {file.type.startsWith('image/') ? (
                  <FileImage className="h-4 w-4 text-trust-500" />
                ) : (
                  <FileText className="h-4 w-4 text-professional-500" />
                )}
                <span className="text-sm">{file.name}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          
          <Button 
            onClick={uploadFiles} 
            disabled={uploading}
            className="w-full mt-4 bg-trust-500 hover:bg-trust-700"
          >
            {uploading ? 'Uploading...' : `Upload ${files.length} file(s)`}
          </Button>
        </div>
      )}
    </Card>
  );
};

export default FileUpload;
```

---

## 🔄 Real-time Tracking Implementation

### 1. WebSocket Repair Tracking

**Create**: `/backend/services/websocket-service.js`

```javascript
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

class WebSocketService {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.clients = new Map();
    
    this.wss.on('connection', this.handleConnection.bind(this));
  }

  async handleConnection(ws, req) {
    try {
      // Authenticate WebSocket connection
      const token = new URL(req.url, 'http://localhost:3011').searchParams.get('token');
      if (!token) {
        ws.close(1008, 'Authentication required');
        return;
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.userId);
      
      if (!user) {
        ws.close(1008, 'Invalid user');
        return;
      }

      // Store connection with user context
      this.clients.set(ws, { user, subscriptions: new Set() });

      ws.on('message', (message) => {
        this.handleMessage(ws, JSON.parse(message));
      });

      ws.on('close', () => {
        this.clients.delete(ws);
      });

      // Send welcome message
      this.sendToClient(ws, {
        type: 'connected',
        message: 'Connected to real-time updates'
      });

    } catch (error) {
      console.error('WebSocket authentication error:', error);
      ws.close(1008, 'Authentication failed');
    }
  }

  handleMessage(ws, message) {
    const client = this.clients.get(ws);
    if (!client) return;

    switch (message.type) {
      case 'subscribe_booking':
        client.subscriptions.add(`booking_${message.bookingId}`);
        break;
      case 'unsubscribe_booking':
        client.subscriptions.delete(`booking_${message.bookingId}`);
        break;
    }
  }

  broadcastRepairUpdate(bookingId, update) {
    const message = {
      type: 'repair_update',
      bookingId,
      update
    };

    for (const [ws, client] of this.clients) {
      if (client.subscriptions.has(`booking_${bookingId}`)) {
        this.sendToClient(ws, message);
      }
    }
  }

  sendToClient(ws, message) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }
}

module.exports = WebSocketService;
```

### 2. Real-time Tracking Component

**Create**: `/frontend/src/components/tracking/RealTimeTracker.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  CheckCircle, 
  Clock, 
  Wrench, 
  Package,
  MapPin,
  Phone
} from 'lucide-react';

interface RepairUpdate {
  id: string;
  status: string;
  message: string;
  timestamp: string;
  technician?: string;
}

interface RealTimeTrackerProps {
  bookingReference: string;
}

const STATUS_ICONS = {
  'received': Clock,
  'in_progress': Wrench,
  'testing': CheckCircle,
  'ready': Package,
  'completed': CheckCircle
};

const STATUS_COLORS = {
  'received': 'bg-neutral-500',
  'in_progress': 'bg-professional-500',
  'testing': 'bg-trust-500',
  'ready': 'bg-green-500',
  'completed': 'bg-green-600'
};

const RealTimeTracker = ({ bookingReference }: RealTimeTrackerProps) => {
  const [updates, setUpdates] = useState<RepairUpdate[]>([]);
  const [currentStatus, setCurrentStatus] = useState('received');
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Initialize WebSocket connection
    const token = localStorage.getItem('token');
    const websocket = new WebSocket(`ws://localhost:3011?token=${token}`);

    websocket.onopen = () => {
      setConnected(true);
      setWs(websocket);
      
      // Subscribe to booking updates
      websocket.send(JSON.stringify({
        type: 'subscribe_booking',
        bookingId: bookingReference
      }));
    };

    websocket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      if (message.type === 'repair_update') {
        setUpdates(prev => [message.update, ...prev]);
        setCurrentStatus(message.update.status);
      }
    };

    websocket.onclose = () => {
      setConnected(false);
    };

    return () => {
      websocket.close();
    };
  }, [bookingReference]);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Repair Status</h2>
          <Badge variant={connected ? 'success' : 'secondary'}>
            {connected ? 'Live Updates' : 'Offline'}
          </Badge>
        </div>

        {/* Current Status */}
        <div className="flex items-center space-x-3 mb-6">
          <div className={`p-3 rounded-full ${STATUS_COLORS[currentStatus]} text-white`}>
            {React.createElement(STATUS_ICONS[currentStatus] || Clock, { className: 'h-6 w-6' })}
          </div>
          <div>
            <h3 className="font-medium capitalize">{currentStatus.replace('_', ' ')}</h3>
            <p className="text-sm text-neutral-600">
              Last updated: {updates[0]?.timestamp ? new Date(updates[0].timestamp).toLocaleString() : 'N/A'}
            </p>
          </div>
        </div>

        {/* Progress Timeline */}
        <div className="space-y-4">
          {updates.map((update, index) => (
            <div key={update.id} className="flex items-start space-x-3">
              <div className={`p-2 rounded-full ${STATUS_COLORS[update.status]} text-white flex-shrink-0`}>
                {React.createElement(STATUS_ICONS[update.status] || Clock, { className: 'h-4 w-4' })}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-medium capitalize">{update.status.replace('_', ' ')}</span>
                  <span className="text-sm text-neutral-500">
                    {new Date(update.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-neutral-600">{update.message}</p>
                {update.technician && (
                  <p className="text-sm text-professional-600 mt-1">
                    Technician: {update.technician}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Contact & Actions */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Need Help?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3">
            <Phone className="h-5 w-5 text-professional-500" />
            <div>
              <p className="font-medium">Call Us</p>
              <p className="text-sm text-neutral-600">+44 20 1234 5678</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <MapPin className="h-5 w-5 text-trust-500" />
            <div>
              <p className="font-medium">Visit Shop</p>
              <p className="text-sm text-neutral-600">123 High Street, London</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default RealTimeTracker;
```

---

**Session 3 Success Criteria**: Complete customer-facing functionality operational with real data - booking, payments, tracking, notifications all working end-to-end.

**Next Session**: Execute Session 4 using `SESSION_4_AI_ANALYTICS_GUIDE.md` for advanced AI features and business intelligence.