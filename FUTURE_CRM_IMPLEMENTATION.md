# Future CRM Implementation Documentation

This document contains the CRM components and architecture that were designed for RevivaTech's Phase 3 implementation. These components are preserved here for future implementation when you decide to build an internal CRM system within RevivaTech.

## Overview

The internal CRM system was designed to provide comprehensive customer relationship management capabilities specifically tailored for computer repair businesses. This documentation serves as a reference for when you're ready to implement these features internally.

## Preserved Components

### 1. CRM Dashboard Component
**Location**: Previously at `/components/crm/dashboard/CRMDashboard.tsx`
**Purpose**: Main CRM analytics dashboard with real-time metrics

Key features:
- Customer lifecycle pipeline visualization
- Lead conversion metrics
- Customer segment distribution
- Real-time activity feed
- Quick action buttons

### 2. Customer Value Analytics Component
**Location**: Previously at `/components/crm/analytics/CustomerValueAnalytics.tsx`
**Purpose**: Analyze customer lifetime value, segments, and churn risk

Key features:
- Customer value segmentation
- Churn risk scoring
- Satisfaction metrics
- Predictive value calculations

### 3. Lead Management Component
**Location**: Previously at `/components/crm/leads/LeadManagement.tsx`
**Purpose**: Manage leads through qualification and conversion pipeline

Key features:
- Lead scoring system
- Qualification workflow
- Follow-up scheduling
- Conversion tracking

## Database Schema Extensions

The following database schema was designed for the internal CRM:

```sql
-- Customer Lifecycle Management
CREATE TABLE customer_lifecycle (
  id                    VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  customer_id           VARCHAR(36) NOT NULL REFERENCES users(id),
  current_stage         ENUM('LEAD', 'PROSPECT', 'CUSTOMER', 'RETENTION', 'ADVOCACY') NOT NULL,
  stage_entered_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  previous_stage        VARCHAR(20),
  lifecycle_score       DECIMAL(5,2) DEFAULT 0.00,
  estimated_value       DECIMAL(10,2) DEFAULT 0.00,
  next_action_due       TIMESTAMP,
  assigned_to           VARCHAR(36) REFERENCES users(id),
  created_at            TIMESTAMP DEFAULT NOW(),
  updated_at            TIMESTAMP DEFAULT NOW() ON UPDATE NOW()
);

-- Lead Management
CREATE TABLE leads (
  id                    VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  source_type           ENUM('WEBSITE', 'PHONE', 'WALK_IN', 'REFERRAL', 'SOCIAL', 'EMAIL', 'OTHER') NOT NULL,
  source_details        JSON,
  lead_score            DECIMAL(5,2) DEFAULT 0.00,
  qualification_status  ENUM('UNQUALIFIED', 'QUALIFYING', 'QUALIFIED', 'DISQUALIFIED') DEFAULT 'UNQUALIFIED',
  contact_info          JSON NOT NULL,
  device_interest       JSON,
  initial_needs         TEXT,
  budget_range          VARCHAR(50),
  urgency_level         ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') DEFAULT 'MEDIUM',
  assigned_to           VARCHAR(36) REFERENCES users(id),
  converted_customer_id VARCHAR(36) REFERENCES users(id),
  converted_at          TIMESTAMP NULL,
  follow_up_count       INT DEFAULT 0,
  last_contact_at       TIMESTAMP,
  next_follow_up        TIMESTAMP,
  status                ENUM('ACTIVE', 'CONVERTED', 'LOST', 'UNRESPONSIVE') DEFAULT 'ACTIVE',
  lost_reason           VARCHAR(255),
  created_at            TIMESTAMP DEFAULT NOW(),
  updated_at            TIMESTAMP DEFAULT NOW() ON UPDATE NOW()
);

-- Customer Interactions
CREATE TABLE customer_interactions (
  id              VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  customer_id     VARCHAR(36) NOT NULL REFERENCES users(id),
  interaction_type ENUM('CALL', 'EMAIL', 'SMS', 'CHAT', 'VISIT', 'BOOKING', 'PAYMENT', 'REVIEW', 'COMPLAINT', 'INQUIRY') NOT NULL,
  channel         ENUM('PHONE', 'EMAIL', 'WEBSITE', 'SOCIAL', 'IN_PERSON', 'SMS', 'CHAT') NOT NULL,
  direction       ENUM('INBOUND', 'OUTBOUND') NOT NULL,
  subject         VARCHAR(255),
  content         TEXT,
  metadata        JSON,
  staff_member_id VARCHAR(36) REFERENCES users(id),
  booking_id      VARCHAR(36) REFERENCES bookings(id),
  duration_minutes INT,
  outcome         VARCHAR(255),
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_date  TIMESTAMP NULL,
  sentiment       ENUM('POSITIVE', 'NEUTRAL', 'NEGATIVE') DEFAULT 'NEUTRAL',
  created_at      TIMESTAMP DEFAULT NOW()
);

-- Customer Segmentation
CREATE TABLE customer_segments (
  id          VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name        VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  criteria    JSON NOT NULL,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW() ON UPDATE NOW()
);

-- Customer Value Metrics
CREATE TABLE customer_value_metrics (
  id                    VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  customer_id           VARCHAR(36) NOT NULL REFERENCES users(id),
  total_spent           DECIMAL(10,2) DEFAULT 0.00,
  total_bookings        INT DEFAULT 0,
  avg_booking_value     DECIMAL(10,2) DEFAULT 0.00,
  first_booking_date    TIMESTAMP,
  last_booking_date     TIMESTAMP,
  booking_frequency_days DECIMAL(8,2),
  lifetime_value        DECIMAL(10,2) DEFAULT 0.00,
  predicted_value       DECIMAL(10,2) DEFAULT 0.00,
  satisfaction_score    DECIMAL(3,2),
  referral_count        INT DEFAULT 0,
  referral_value        DECIMAL(10,2) DEFAULT 0.00,
  churn_risk_score      DECIMAL(5,2) DEFAULT 0.00,
  last_calculated_at    TIMESTAMP DEFAULT NOW()
);

-- Referral System
CREATE TABLE referrals (
  id                VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  referrer_id       VARCHAR(36) NOT NULL REFERENCES users(id),
  referee_email     VARCHAR(255) NOT NULL,
  referee_id        VARCHAR(36) REFERENCES users(id),
  referral_code     VARCHAR(20) UNIQUE NOT NULL,
  status            ENUM('PENDING', 'REGISTERED', 'CONVERTED', 'EXPIRED') DEFAULT 'PENDING',
  reward_type       ENUM('DISCOUNT', 'CREDIT', 'CASH', 'SERVICE') NOT NULL,
  reward_value      DECIMAL(10,2) NOT NULL,
  reward_claimed    BOOLEAN DEFAULT FALSE,
  reward_claimed_at TIMESTAMP NULL,
  converted_booking_id VARCHAR(36) REFERENCES bookings(id),
  expires_at        TIMESTAMP NOT NULL,
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW() ON UPDATE NOW()
);

-- Marketing Campaigns
CREATE TABLE marketing_campaigns (
  id          VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name        VARCHAR(255) NOT NULL,
  type        ENUM('EMAIL', 'SMS', 'PUSH', 'SOCIAL', 'PRINT', 'RADIO', 'TV', 'ONLINE_AD') NOT NULL,
  status      ENUM('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED') DEFAULT 'DRAFT',
  target_segments JSON,
  content     JSON NOT NULL,
  schedule    JSON,
  budget      DECIMAL(10,2),
  start_date  TIMESTAMP,
  end_date    TIMESTAMP,
  metrics     JSON,
  created_by  VARCHAR(36) NOT NULL REFERENCES users(id),
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW() ON UPDATE NOW()
);

-- Customer Feedback
CREATE TABLE customer_feedback (
  id              VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  customer_id     VARCHAR(36) NOT NULL REFERENCES users(id),
  booking_id      VARCHAR(36) REFERENCES bookings(id),
  feedback_type   ENUM('REVIEW', 'COMPLAINT', 'SUGGESTION', 'TESTIMONIAL', 'SURVEY') NOT NULL,
  rating          DECIMAL(2,1),
  title           VARCHAR(255),
  content         TEXT,
  source          ENUM('WEBSITE', 'EMAIL', 'PHONE', 'GOOGLE', 'FACEBOOK', 'TRUSTPILOT', 'IN_PERSON') NOT NULL,
  is_public       BOOLEAN DEFAULT FALSE,
  response        TEXT,
  responded_by    VARCHAR(36) REFERENCES users(id),
  responded_at    TIMESTAMP NULL,
  status          ENUM('NEW', 'IN_REVIEW', 'RESPONDED', 'RESOLVED', 'ESCALATED') DEFAULT 'NEW',
  priority        ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') DEFAULT 'MEDIUM',
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW() ON UPDATE NOW()
);
```

## API Endpoints Specification

### Lead Management Endpoints
```typescript
GET    /api/crm/leads                     // List leads with filtering
POST   /api/crm/leads                     // Create new lead
GET    /api/crm/leads/:id                 // Get lead details
PUT    /api/crm/leads/:id                 // Update lead
DELETE /api/crm/leads/:id                 // Delete lead
POST   /api/crm/leads/:id/qualify         // Mark lead as qualified
POST   /api/crm/leads/:id/convert         // Convert lead to customer
POST   /api/crm/leads/:id/schedule-follow-up // Schedule follow-up
```

### Customer Lifecycle Endpoints
```typescript
GET    /api/crm/customers/:id/lifecycle   // Get customer lifecycle status
PUT    /api/crm/customers/:id/lifecycle   // Update lifecycle stage
GET    /api/crm/customers/lifecycle/stats // Lifecycle distribution stats
```

### Customer Value Endpoints
```typescript
GET    /api/crm/customers/:id/value       // Customer value metrics
POST   /api/crm/customers/calculate-values // Bulk value calculation
GET    /api/crm/analytics/customer-value  // Value analytics dashboard
```

### Segmentation Endpoints
```typescript
GET    /api/crm/segments                  // List segments
POST   /api/crm/segments                  // Create segment
GET    /api/crm/segments/:id              // Get segment details
PUT    /api/crm/segments/:id              // Update segment
DELETE /api/crm/segments/:id              // Delete segment
```

## Business Intelligence KPIs

### Lead Management KPIs
- Lead Conversion Rate
- Lead Response Time
- Lead Source ROI
- Lead Velocity
- Cost Per Lead
- Lead Quality Score

### Customer Lifecycle KPIs
- Customer Acquisition Cost (CAC)
- Customer Lifetime Value (CLV)
- CLV:CAC Ratio
- Churn Rate
- Retention Rate
- Upsell/Cross-sell Rate

### Customer Satisfaction KPIs
- Net Promoter Score (NPS)
- Customer Satisfaction Score (CSAT)
- Customer Effort Score (CES)
- Response Time
- Resolution Rate
- Complaint Resolution Time

### Revenue KPIs
- Monthly Recurring Revenue (MRR)
- Average Order Value (AOV)
- Revenue Growth Rate
- Profit Margin per Customer
- Referral Revenue
- Segment Revenue

## Implementation Roadmap (When Ready)

### Phase 1: Foundation (2 weeks)
- Database schema implementation
- Basic API endpoints
- Core CRM dashboard

### Phase 2: Customer Management (2 weeks)
- Customer profile 360-degree view
- Interaction tracking
- Value calculation engine
- Segmentation

### Phase 3: Analytics & Insights (2 weeks)
- Analytics dashboard
- KPI tracking
- Predictive analytics

### Phase 4: Marketing Automation (2 weeks)
- Campaign management
- Email integration
- Automated workflows
- Referral program

### Phase 5: Advanced Features (2 weeks)
- Advanced segmentation
- Predictive churn modeling
- Social media integration
- Advanced reporting

### Phase 6: Testing & Optimization (2 weeks)
- Comprehensive testing
- Performance optimization
- User training
- Production deployment

## Integration Points

When implementing the internal CRM, it should integrate with:
- Existing authentication system
- Booking management system
- Payment processing
- Notification system
- WebSocket infrastructure
- Device database
- Pricing engine

## Notes

This CRM system was designed specifically for computer repair businesses with features tailored to:
- Track customer device repair history
- Manage repair lifecycle from lead to advocacy
- Analyze repair patterns and customer value
- Automate follow-ups and marketing
- Predict customer behavior and churn risk

The architecture follows RevivaTech's configuration-driven development pattern and Nordic design system principles.

---

**Created**: December 2024
**Purpose**: Future reference for internal CRM implementation
**Status**: Documented for future development