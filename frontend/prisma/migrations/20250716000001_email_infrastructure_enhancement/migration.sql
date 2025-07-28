-- Email Infrastructure Enhancement Migration
-- Adds support for production email queue, analytics, and multi-channel notifications

-- Email Queue table for production email system
CREATE TABLE IF NOT EXISTS "EmailQueue" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "to" JSONB NOT NULL,
  "cc" JSONB,
  "bcc" JSONB,
  "subject" TEXT NOT NULL,
  "template" TEXT NOT NULL,
  "data" JSONB NOT NULL,
  "priority" TEXT NOT NULL DEFAULT 'normal',
  "scheduledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "tags" TEXT[],
  "metadata" JSONB,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "maxAttempts" INTEGER NOT NULL DEFAULT 3,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastAttempt" TIMESTAMP(3),
  "sentAt" TIMESTAMP(3),
  "error" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "provider" TEXT NOT NULL DEFAULT 'smtp',
  "messageId" TEXT,
  "opens" INTEGER NOT NULL DEFAULT 0,
  "clicks" INTEGER NOT NULL DEFAULT 0,
  "bounced" BOOLEAN NOT NULL DEFAULT false,
  "complained" BOOLEAN NOT NULL DEFAULT false,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Email Analytics table for tracking email performance
CREATE TABLE IF NOT EXISTS "EmailAnalytics" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "emailId" TEXT NOT NULL,
  "event" TEXT NOT NULL,
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "recipient" TEXT NOT NULL,
  "template" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "metadata" JSONB,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Email Templates table for dynamic template management
CREATE TABLE IF NOT EXISTS "EmailTemplate" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL UNIQUE,
  "subject" TEXT NOT NULL,
  "htmlContent" TEXT NOT NULL,
  "textContent" TEXT,
  "variables" JSONB,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "version" INTEGER NOT NULL DEFAULT 1,
  "category" TEXT NOT NULL DEFAULT 'general',
  "description" TEXT,
  "previewText" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdBy" TEXT,
  "updatedBy" TEXT
);

-- Email Campaigns table for marketing automation
CREATE TABLE IF NOT EXISTS "EmailCampaign" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "templateId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "scheduledAt" TIMESTAMP(3),
  "sentAt" TIMESTAMP(3),
  "targetAudience" JSONB,
  "sendCount" INTEGER NOT NULL DEFAULT 0,
  "openCount" INTEGER NOT NULL DEFAULT 0,
  "clickCount" INTEGER NOT NULL DEFAULT 0,
  "bounceCount" INTEGER NOT NULL DEFAULT 0,
  "unsubscribeCount" INTEGER NOT NULL DEFAULT 0,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdBy" TEXT
);

-- SMS Queue table for SMS notifications
CREATE TABLE IF NOT EXISTS "SmsQueue" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "to" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "template" TEXT,
  "data" JSONB,
  "priority" TEXT NOT NULL DEFAULT 'normal',
  "scheduledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "maxAttempts" INTEGER NOT NULL DEFAULT 3,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastAttempt" TIMESTAMP(3),
  "sentAt" TIMESTAMP(3),
  "error" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "provider" TEXT NOT NULL DEFAULT 'twilio',
  "messageId" TEXT,
  "cost" DECIMAL(10,4),
  "metadata" JSONB
);

-- Push Notification Queue table
CREATE TABLE IF NOT EXISTS "PushNotificationQueue" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT,
  "deviceTokens" JSONB NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "data" JSONB,
  "priority" TEXT NOT NULL DEFAULT 'normal',
  "scheduledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "maxAttempts" INTEGER NOT NULL DEFAULT 3,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastAttempt" TIMESTAMP(3),
  "sentAt" TIMESTAMP(3),
  "error" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "deliveryCount" INTEGER NOT NULL DEFAULT 0,
  "clickCount" INTEGER NOT NULL DEFAULT 0,
  "metadata" JSONB
);

-- Notification Preferences table for user preferences
CREATE TABLE IF NOT EXISTS "NotificationPreference" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "email" BOOLEAN NOT NULL DEFAULT true,
  "sms" BOOLEAN NOT NULL DEFAULT false,
  "push" BOOLEAN NOT NULL DEFAULT true,
  "marketing" BOOLEAN NOT NULL DEFAULT false,
  "frequency" TEXT NOT NULL DEFAULT 'immediate',
  "quietHours" JSONB,
  "preferences" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Webhook Events table for payment and CRM webhooks
CREATE TABLE IF NOT EXISTS "PaymentWebhookEvent" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "gateway" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "processed" BOOLEAN NOT NULL DEFAULT false,
  "processedAt" TIMESTAMP(3),
  "errorMessage" TEXT,
  "retryCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("gateway", "eventId")
);

-- Customer Intelligence table for behavior tracking
CREATE TABLE IF NOT EXISTS "CustomerIntelligence" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "customerId" TEXT,
  "sessionId" TEXT,
  "fingerprint" TEXT,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "events" JSONB NOT NULL,
  "score" INTEGER,
  "segment" TEXT,
  "lastActivity" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Behavioral Events table for journey mapping
CREATE TABLE IF NOT EXISTS "BehavioralEvent" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "sessionId" TEXT NOT NULL,
  "customerId" TEXT,
  "eventType" TEXT NOT NULL,
  "eventName" TEXT NOT NULL,
  "properties" JSONB,
  "pageUrl" TEXT,
  "referrer" TEXT,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Customer Journey table for path analysis
CREATE TABLE IF NOT EXISTS "CustomerJourney" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "customerId" TEXT,
  "sessionId" TEXT NOT NULL,
  "startTime" TIMESTAMP(3) NOT NULL,
  "endTime" TIMESTAMP(3),
  "touchpoints" JSONB NOT NULL,
  "conversion" BOOLEAN NOT NULL DEFAULT false,
  "conversionValue" DECIMAL(10,2),
  "source" TEXT,
  "medium" TEXT,
  "campaign" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS "EmailQueue_status_idx" ON "EmailQueue"("status");
CREATE INDEX IF NOT EXISTS "EmailQueue_scheduledAt_idx" ON "EmailQueue"("scheduledAt");
CREATE INDEX IF NOT EXISTS "EmailQueue_priority_idx" ON "EmailQueue"("priority");
CREATE INDEX IF NOT EXISTS "EmailAnalytics_emailId_idx" ON "EmailAnalytics"("emailId");
CREATE INDEX IF NOT EXISTS "EmailAnalytics_timestamp_idx" ON "EmailAnalytics"("timestamp");
CREATE INDEX IF NOT EXISTS "SmsQueue_status_idx" ON "SmsQueue"("status");
CREATE INDEX IF NOT EXISTS "PushNotificationQueue_status_idx" ON "PushNotificationQueue"("status");
CREATE INDEX IF NOT EXISTS "NotificationPreference_userId_idx" ON "NotificationPreference"("userId");
CREATE INDEX IF NOT EXISTS "CustomerIntelligence_customerId_idx" ON "CustomerIntelligence"("customerId");
CREATE INDEX IF NOT EXISTS "CustomerIntelligence_fingerprint_idx" ON "CustomerIntelligence"("fingerprint");
CREATE INDEX IF NOT EXISTS "BehavioralEvent_sessionId_idx" ON "BehavioralEvent"("sessionId");
CREATE INDEX IF NOT EXISTS "BehavioralEvent_customerId_idx" ON "BehavioralEvent"("customerId");
CREATE INDEX IF NOT EXISTS "BehavioralEvent_timestamp_idx" ON "BehavioralEvent"("timestamp");
CREATE INDEX IF NOT EXISTS "CustomerJourney_customerId_idx" ON "CustomerJourney"("customerId");

-- Add foreign key constraints (if not already exists)
-- Note: These may need adjustment based on existing schema

-- Insert default email templates
INSERT INTO "EmailTemplate" ("name", "subject", "htmlContent", "category", "description") VALUES 
('booking-confirmation', 'Booking Confirmed - RevivaTech', '<!DOCTYPE html><html><body><h1>Booking Confirmed</h1><p>Your repair booking has been confirmed.</p></body></html>', 'booking', 'Booking confirmation email template'),
('payment-confirmation', 'Payment Confirmation - RevivaTech', '<!DOCTYPE html><html><body><h1>Payment Confirmed</h1><p>Your payment has been processed successfully.</p></body></html>', 'payment', 'Payment confirmation email template'),
('repair-status-update', 'Repair Status Update - RevivaTech', '<!DOCTYPE html><html><body><h1>Repair Update</h1><p>Your repair status has been updated.</p></body></html>', 'repair', 'Repair status update email template'),
('welcome', 'Welcome to RevivaTech', '<!DOCTYPE html><html><body><h1>Welcome</h1><p>Welcome to RevivaTech computer repair services.</p></body></html>', 'onboarding', 'Welcome email for new customers'),
('newsletter', 'RevivaTech Newsletter', '<!DOCTYPE html><html><body><h1>Newsletter</h1><p>Latest updates from RevivaTech.</p></body></html>', 'marketing', 'Monthly newsletter template')
ON CONFLICT (name) DO NOTHING;

-- Insert default notification preferences
-- This will be done programmatically for existing users