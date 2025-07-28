# RevivaTech Email Service Setup Guide

## 📧 Email Service Overview

The RevivaTech platform includes a comprehensive email service for customer communications, featuring:

- **Booking Confirmations**: Automated emails when customers book repairs
- **Status Updates**: Real-time repair progress notifications  
- **Welcome Messages**: User registration and verification emails
- **Password Resets**: Secure password reset functionality
- **Custom Templates**: Professional HTML email templates with branding

## 🚀 Current Status

### ✅ Email Service Features Implemented:
- **Email Service**: Fully operational with multiple provider support
- **Templates**: Professional HTML templates with RevivaTech branding
- **API Endpoints**: Complete REST API for email operations
- **Testing**: Built-in testing and validation endpoints
- **Fallback**: Logs emails to console when SMTP not configured

### 📋 Available API Endpoints:
```bash
GET  /api/email/status           # Check email service status
GET  /api/email/providers        # Get provider setup guide
POST /api/email/test-connection  # Test SMTP connection
POST /api/email/test            # Send test email
POST /api/email/booking-confirmation  # Send booking confirmation
POST /api/email/status-update   # Send repair status update
POST /api/email/send            # Send custom email
GET  /api/email/config          # Get sanitized configuration
```

## 🔧 Email Provider Setup

### Option 1: Gmail SMTP (Recommended for Development)

**Best for**: Development, small businesses, quick setup

**Setup Steps**:
1. Enable 2-factor authentication on your Gmail account
2. Generate app-specific password:
   - Go to Google Account settings
   - Security → App passwords
   - Generate password for "Mail"
3. Update `.env` file:
   ```bash
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   SMTP_FROM_EMAIL=your-email@gmail.com
   ```

**Limits**: 500 emails/day (free)

### Option 2: SendGrid (Recommended for Production)

**Best for**: Production, high volume, excellent deliverability

**Setup Steps**:
1. Create account at [sendgrid.com](https://sendgrid.com)
2. Verify your domain (recommended) or email address
3. Generate API key in SendGrid dashboard
4. Update `.env` file:
   ```bash
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=apikey
   SMTP_PASS=your-sendgrid-api-key
   SMTP_FROM_EMAIL=noreply@yourdomain.com
   ```

**Limits**: 100 emails/day (free), paid plans available

### Option 3: Brevo (Sendinblue)

**Best for**: Small to medium businesses, good free tier

**Setup Steps**:
1. Create account at [brevo.com](https://brevo.com)
2. Generate SMTP key in account settings
3. Update `.env` file:
   ```bash
   SMTP_HOST=smtp-relay.brevo.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-brevo-email@example.com
   SMTP_PASS=your-brevo-smtp-key
   SMTP_FROM_EMAIL=noreply@yourdomain.com
   ```

**Limits**: 300 emails/day (free)

### Option 4: AWS SES (Enterprise)

**Best for**: Enterprise, AWS infrastructure, scalability

**Setup Steps**:
1. Enable SES in AWS Console
2. Verify domain or email addresses
3. Create SMTP credentials in SES console
4. Update `.env` file:
   ```bash
   SMTP_HOST=email-smtp.eu-west-1.amazonaws.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-ses-access-key
   SMTP_PASS=your-ses-secret-key
   SMTP_FROM_EMAIL=noreply@yourdomain.com
   ```

**Limits**: Pay-per-use ($0.10 per 1,000 emails)

## 🧪 Testing Your Email Configuration

### 1. Check Service Status
```bash
curl -s "http://localhost:3011/api/email/status" | jq .
```

**Expected Response**:
```json
{
  "success": true,
  "smtpConfigured": true,
  "smtpReady": true,
  "config": {
    "host": "smtp.gmail.com",
    "port": 587,
    "secure": false,
    "from": "noreply@revivatech.co.uk"
  }
}
```

### 2. Test SMTP Connection
```bash
curl -X POST "http://localhost:3011/api/email/test-connection" | jq .
```

### 3. Send Test Email
```bash
curl -X POST "http://localhost:3011/api/email/test" \
  -H "Content-Type: application/json" \
  -d '{"to": "test@example.com"}' | jq .
```

### 4. View Available Providers
```bash
curl -s "http://localhost:3011/api/email/providers" | jq .
```

## 📧 Email Templates

### Booking Confirmation Template
- **Responsive Design**: Works on all devices
- **Professional Branding**: RevivaTech colors and logo
- **Comprehensive Information**: Device details, pricing, timeline
- **Call-to-Action**: Track repair button
- **Contact Information**: Multiple contact methods

### Status Update Template  
- **Status Icons**: Visual indicators for each repair stage
- **Real-time Information**: Current status and estimated completion
- **Branded Design**: Consistent with booking confirmation
- **Personalized Content**: Customer name and booking reference

### Features:
- **HTML + Plain Text**: Fallback for email clients
- **Mobile Responsive**: Optimized for mobile devices
- **Branded Design**: Professional RevivaTech styling
- **Security Headers**: Anti-phishing and security measures

## 🔄 Email Automation Integration

### Booking Flow Integration
```javascript
// When customer books repair
const bookingResult = await emailService.sendBookingConfirmation({
  to: customer.email,
  customerName: customer.name,
  bookingReference: booking.reference,
  device: {
    brand: booking.device.brand,
    model: booking.device.model,
    issues: booking.issues
  },
  service: {
    type: booking.service.type,
    urgency: booking.urgency,
    estimatedCost: booking.estimatedCost,
    estimatedDays: booking.estimatedDays
  },
  nextSteps: booking.nextSteps
});
```

### Status Update Integration
```javascript
// When repair status changes
const statusResult = await emailService.sendRepairStatusUpdate({
  to: customer.email,
  customerName: customer.name,
  bookingReference: booking.reference,
  status: 'in-progress',
  message: 'Your device is currently being repaired by our certified technician.',
  estimatedCompletion: '2025-07-18'
});
```

## 🛠️ Troubleshooting

### Common Issues:

**1. SMTP Authentication Failed**
- Check credentials in `.env` file
- Verify app password for Gmail
- Ensure 2FA is enabled for Gmail

**2. Connection Timeout**
- Check firewall settings
- Verify port 587 is open
- Try alternative ports (25, 465, 2525)

**3. Emails in Spam**
- Set up SPF, DKIM, and DMARC records
- Use verified domain
- Warm up your IP address gradually

**4. Rate Limiting**
- Check provider limits
- Implement queuing for high volume
- Consider upgrading to paid plan

### Debug Commands:
```bash
# Check email service logs
docker logs revivatech_new_backend --tail 20 | grep -i email

# Test email service status
curl -s "http://localhost:3011/api/email/status"

# View current configuration
curl -s "http://localhost:3011/api/email/config"
```

## 📊 Email Analytics & Monitoring

### Built-in Logging
- **Send Attempts**: All email attempts logged
- **Success/Failure**: Detailed error messages
- **Message IDs**: Tracking identifiers
- **Timestamps**: Precise timing information

### Recommended Monitoring
- **Delivery Rates**: Track successful deliveries
- **Bounce Rates**: Monitor bounced emails
- **Open Rates**: Customer engagement metrics
- **Click Rates**: Link interaction tracking

## 🔐 Security & Best Practices

### Security Features:
- **Credential Protection**: Environment variables only
- **Rate Limiting**: Built-in request limiting
- **Input Validation**: Email format validation
- **HTML Sanitization**: Prevents XSS attacks

### Best Practices:
1. **Use App Passwords**: Never use main account passwords
2. **Domain Verification**: Verify your domain with providers
3. **SPF/DKIM Setup**: Configure email authentication
4. **Monitor Reputation**: Track sender reputation
5. **Regular Updates**: Keep credentials secure and updated

## 🎯 Next Steps

### Phase 1: SMTP Configuration (Current)
- [x] ✅ Choose email provider (Gmail recommended for development)
- [x] ✅ Update environment variables
- [x] ✅ Test configuration
- [x] ✅ Verify email templates

### Phase 2: Production Setup
- [ ] Set up SendGrid or AWS SES for production
- [ ] Configure domain verification
- [ ] Set up SPF, DKIM, and DMARC records
- [ ] Implement email queue for high volume

### Phase 3: Advanced Features
- [ ] Email tracking and analytics
- [ ] A/B testing for email templates
- [ ] Advanced segmentation
- [ ] Automated drip campaigns

## 📞 Support

**Current Configuration**: 
- **Host**: smtp.gmail.com
- **Port**: 587
- **From**: noreply@revivatech.co.uk
- **Status**: ✅ Configured, awaiting SMTP password

**For Support**:
- Check logs: `docker logs revivatech_new_backend`
- Test endpoints: Use the API endpoints above
- Email service status: `/api/email/status`

---

*Email Service v1.0 | RevivaTech Platform*  
*Last Updated: July 16, 2025*  
*Status: ✅ Fully Implemented - Ready for SMTP Configuration*