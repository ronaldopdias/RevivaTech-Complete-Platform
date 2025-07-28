# Email Service Environment Variables

This document outlines all the environment variables required for the RevivaTech Email Template System with Automation.

## Required Environment Variables

### SendGrid Configuration (Primary Email Provider)
```bash
# SendGrid API Key (Required)
SENDGRID_API_KEY=SG.your_sendgrid_api_key_here

# SendGrid Webhook Signing Key (Optional but recommended)
SENDGRID_WEBHOOK_KEY=your_webhook_signing_key

# Default From Email (Required)
FROM_EMAIL=noreply@revivatech.co.uk

# Default From Name (Optional)
FROM_NAME=RevivaTech
```

### Alternative SMTP Configuration (Nodemailer)
```bash
# SMTP Settings (if using nodemailer instead of SendGrid)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### Database Configuration
```bash
# PostgreSQL Database (Required)
DATABASE_URL=postgresql://username:password@localhost:5432/revivatech_db

# Redis Cache (Required for analytics and rate limiting)
REDIS_URL=redis://localhost:6379
```

### Email Service Configuration
```bash
# Environment Mode (affects sandbox mode)
NODE_ENV=production  # or development

# Email Provider Selection
EMAIL_PROVIDER=sendgrid  # or nodemailer

# Rate Limiting
MAX_EMAILS_PER_MINUTE=100

# Retry Configuration
EMAIL_MAX_RETRIES=3
EMAIL_RETRY_DELAY=60000  # milliseconds

# Compliance Settings
ENABLE_GDPR_COMPLIANCE=true
ENABLE_CAN_SPAM_COMPLIANCE=true
RESPECT_UNSUBSCRIBES=true
```

### Analytics and Tracking
```bash
# Enable Email Tracking Features
ENABLE_OPEN_TRACKING=true
ENABLE_CLICK_TRACKING=true
ENABLE_UNSUBSCRIBE_TRACKING=true

# Analytics Data Retention
ANALYTICS_RETENTION_DAYS=365

# Real-time Analytics
ENABLE_REALTIME_ANALYTICS=true
```

### Security and Authentication
```bash
# JWT Secret for admin authentication
JWT_SECRET=your_super_secret_jwt_key

# Admin API Key (for admin routes)
ADMIN_API_KEY=your_admin_api_key

# Webhook Security
WEBHOOK_SECRET=your_webhook_secret_key
```

### Domain and URL Configuration
```bash
# Base URLs for tracking links
BASE_URL=https://revivatech.co.uk
FRONTEND_URL=https://revivatech.co.uk

# Unsubscribe and Preferences URLs
UNSUBSCRIBE_URL=https://revivatech.co.uk/unsubscribe
PREFERENCES_URL=https://revivatech.co.uk/email-preferences
```

### Feature Flags
```bash
# Enable/Disable Email Features
ENABLE_EMAIL_AUTOMATION=true
ENABLE_AB_TESTING=true
ENABLE_TEMPLATE_PERSONALIZATION=true
ENABLE_BULK_EMAIL_SENDING=true
ENABLE_EMAIL_TEMPLATES=true
ENABLE_EMAIL_ANALYTICS=true

# Development Features
ENABLE_EMAIL_SANDBOX=false  # Set to true in development
ENABLE_EMAIL_LOGGING=true
```

## Example .env File

Create a `.env` file in your backend directory with these variables:

```bash
# Email Service Configuration - RevivaTech
NODE_ENV=production
EMAIL_PROVIDER=sendgrid

# SendGrid Settings
SENDGRID_API_KEY=SG.your_actual_sendgrid_api_key_here
SENDGRID_WEBHOOK_KEY=your_webhook_signing_key
FROM_EMAIL=noreply@revivatech.co.uk
FROM_NAME=RevivaTech

# Database
DATABASE_URL=postgresql://revivatech_user:your_password@localhost:5432/revivatech_db
REDIS_URL=redis://localhost:6379

# URLs
BASE_URL=https://revivatech.co.uk
FRONTEND_URL=https://revivatech.co.uk
UNSUBSCRIBE_URL=https://revivatech.co.uk/unsubscribe
PREFERENCES_URL=https://revivatech.co.uk/email-preferences

# Security
JWT_SECRET=your_super_secret_jwt_key_here
ADMIN_API_KEY=your_admin_api_key_here
WEBHOOK_SECRET=your_webhook_secret_here

# Email Features
ENABLE_EMAIL_AUTOMATION=true
ENABLE_AB_TESTING=true
ENABLE_TEMPLATE_PERSONALIZATION=true
ENABLE_OPEN_TRACKING=true
ENABLE_CLICK_TRACKING=true
ENABLE_UNSUBSCRIBE_TRACKING=true
ENABLE_GDPR_COMPLIANCE=true
ENABLE_CAN_SPAM_COMPLIANCE=true

# Rate Limiting
MAX_EMAILS_PER_MINUTE=100
EMAIL_MAX_RETRIES=3
EMAIL_RETRY_DELAY=60000

# Analytics
ANALYTICS_RETENTION_DAYS=365
ENABLE_REALTIME_ANALYTICS=true

# Development (set to false in production)
ENABLE_EMAIL_SANDBOX=false
ENABLE_EMAIL_LOGGING=true
```

## SendGrid Setup Instructions

### 1. Create SendGrid Account
1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Verify your account and domain
3. Create an API key with Full Access permissions

### 2. Configure Domain Authentication
1. Go to Settings > Sender Authentication
2. Add and verify your domain (revivatech.co.uk)
3. Set up SPF, DKIM, and DMARC records

### 3. Set Up Webhooks (Optional but Recommended)
1. Go to Settings > Mail Settings > Event Webhook
2. Set the webhook URL to: `https://revivatech.co.uk/api/email/webhook/sendgrid`
3. Select events to track: delivered, open, click, bounce, spam, unsubscribe
4. Save the signing key and add it to `SENDGRID_WEBHOOK_KEY`

## Database Setup

### 1. Create Email Tables
Run the SQL schema file to create the required database tables:

```bash
psql -d revivatech_db -f backend/database/email-schema.sql
```

### 2. Create Database Indexes
The schema includes performance indexes, but you may want to add additional ones based on your query patterns.

## Testing Configuration

### Development Environment
```bash
NODE_ENV=development
ENABLE_EMAIL_SANDBOX=true
SENDGRID_API_KEY=SG.test_key_here
FROM_EMAIL=test@revivatech.co.uk
```

### Test Email Sending
Use the test endpoint to verify configuration:

```bash
curl -X POST http://localhost:3011/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email",
    "html": "<h1>Test Email</h1><p>This is a test email.</p>"
  }'
```

## Monitoring and Logging

### Email Service Health Check
```bash
curl http://localhost:3011/api/email/health
```

### View Service Metrics
```bash
curl http://localhost:3011/api/email/metrics
```

### Admin Dashboard Access
```bash
curl -H "Authorization: Bearer admin_token_here" \
  http://localhost:3011/api/admin/email/dashboard
```

## Security Considerations

1. **API Keys**: Never commit API keys to version control
2. **Webhook Security**: Always verify webhook signatures
3. **Rate Limiting**: Configure appropriate rate limits for your volume
4. **Data Retention**: Set up automated cleanup of old analytics data
5. **Access Control**: Implement proper authentication for admin endpoints

## Troubleshooting

### Common Issues

1. **SendGrid 401 Unauthorized**
   - Check API key is correct and has Full Access permissions
   - Verify API key hasn't expired

2. **Database Connection Errors**
   - Verify PostgreSQL is running
   - Check database credentials and connection string

3. **Redis Connection Errors**
   - Verify Redis is running
   - Check Redis URL and port

4. **Webhook Not Receiving Events**
   - Verify webhook URL is publicly accessible
   - Check webhook signature verification
   - Ensure HTTPS is configured properly

5. **High Bounce Rates**
   - Verify domain authentication (SPF, DKIM, DMARC)
   - Check email content for spam triggers
   - Review recipient list quality

### Debug Mode
Enable debug logging:

```bash
LOG_LEVEL=debug
ENABLE_EMAIL_LOGGING=true
```

## Performance Optimization

### Recommended Settings for High Volume

```bash
# Increase rate limits for high volume
MAX_EMAILS_PER_MINUTE=1000

# Optimize retry settings
EMAIL_MAX_RETRIES=2
EMAIL_RETRY_DELAY=30000

# Batch processing
EMAIL_BATCH_SIZE=100
EMAIL_BATCH_DELAY=1000

# Analytics optimization
ANALYTICS_AGGREGATION_INTERVAL=300000  # 5 minutes
ENABLE_REALTIME_ANALYTICS=false  # Disable for very high volume
```

## Compliance Configuration

### GDPR Compliance
```bash
ENABLE_GDPR_COMPLIANCE=true
DATA_RETENTION_DAYS=730  # 2 years
ENABLE_DATA_EXPORT=true
ENABLE_RIGHT_TO_DELETION=true
```

### CAN-SPAM Compliance
```bash
ENABLE_CAN_SPAM_COMPLIANCE=true
REQUIRE_PHYSICAL_ADDRESS=true
REQUIRE_UNSUBSCRIBE_LINK=true
```

This configuration ensures your email system is compliant with international email regulations and provides a robust foundation for the RevivaTech email automation system.