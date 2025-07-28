# Analytics Production Setup Guide

## Overview
This guide provides step-by-step instructions for configuring analytics in the RevivaTech production environment.

## 🚀 Production Analytics Stack

### 1. Google Analytics 4 (GA4)
**Purpose**: Website traffic analysis, user behavior, conversion tracking
**Cost**: Free (up to 10M events/month)

#### Setup Steps:
1. **Create GA4 Property**:
   - Go to [Google Analytics](https://analytics.google.com/)
   - Create new property for `revivatech.co.uk`
   - Get Measurement ID (format: `G-XXXXXXXXXX`)

2. **Configure Environment Variable**:
   ```bash
   # Add to .env.production
   NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
   ```

3. **Enhanced Ecommerce Setup**:
   ```javascript
   // Already implemented in /src/lib/analytics/analytics-service.ts
   gtag('event', 'purchase', {
     transaction_id: 'booking-12345',
     value: 89.99,
     currency: 'GBP',
     items: [{
       item_id: 'repair_iphone_screen',
       item_name: 'iPhone Screen Repair',
       category: 'repair_services',
       quantity: 1,
       price: 89.99
     }]
   });
   ```

### 2. Facebook Pixel
**Purpose**: Social media advertising optimization, lookalike audiences
**Cost**: Free

#### Setup Steps:
1. **Create Facebook Pixel**:
   - Go to [Facebook Business Manager](https://business.facebook.com/)
   - Navigate to Events Manager
   - Create new pixel, get Pixel ID (format: `1234567890123456`)

2. **Configure Environment Variable**:
   ```bash
   # Add to .env.production
   NEXT_PUBLIC_FACEBOOK_PIXEL_ID=1234567890123456
   ```

3. **Purchase Event Configuration**:
   ```javascript
   // Already implemented
   fbq('track', 'Purchase', {
     value: 89.99,
     currency: 'GBP',
     content_name: 'iPhone Screen Repair',
     content_type: 'product'
   });
   ```

### 3. PostHog (Self-hosted Analytics)
**Purpose**: Product analytics, user journey analysis, feature flags
**Cost**: Free tier (1M events/month), then $0.00031/event

#### Setup Steps:
1. **Create PostHog Account**:
   - Go to [PostHog](https://posthog.com/)
   - Create new project
   - Get Project API Key and Host URL

2. **Configure Environment Variables**:
   ```bash
   # Add to .env.production
   NEXT_PUBLIC_POSTHOG_KEY=phc_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
   ```

3. **Revenue Tracking**:
   ```javascript
   // Already implemented
   posthog.capture('booking_completed', {
     booking_id: 'booking-12345',
     revenue: 89.99,
     device_brand: 'Apple',
     repair_type: 'Screen Repair'
   });
   ```

## 🔧 Configuration Files

### Environment Variables (.env.production)
```bash
# Analytics Configuration
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_FACEBOOK_PIXEL_ID=1234567890123456
NEXT_PUBLIC_POSTHOG_KEY=phc_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Analytics Features
NEXT_PUBLIC_ANALYTICS_ENABLED=true
NEXT_PUBLIC_ANALYTICS_DEBUG=false
NEXT_PUBLIC_ANALYTICS_CONSENT_REQUIRED=true
```

### Docker Configuration
```yaml
# docker-compose.production.yml
services:
  revivatech_frontend:
    environment:
      - NEXT_PUBLIC_GA4_MEASUREMENT_ID=${NEXT_PUBLIC_GA4_MEASUREMENT_ID}
      - NEXT_PUBLIC_FACEBOOK_PIXEL_ID=${NEXT_PUBLIC_FACEBOOK_PIXEL_ID}
      - NEXT_PUBLIC_POSTHOG_KEY=${NEXT_PUBLIC_POSTHOG_KEY}
      - NEXT_PUBLIC_POSTHOG_HOST=${NEXT_PUBLIC_POSTHOG_HOST}
      - NEXT_PUBLIC_ANALYTICS_ENABLED=true
```

## 📊 Analytics Implementation Status

### ✅ Completed Features
- [x] Multi-provider analytics service (GA4, Facebook, PostHog)
- [x] Service page analytics with user journey tracking
- [x] Booking flow analytics with conversion funnel
- [x] Event tracking system with user engagement metrics
- [x] Error boundary with analytics reporting
- [x] Performance monitoring integration
- [x] Cookie consent management
- [x] Privacy-compliant data collection

### 🔄 Production Setup Required
- [ ] Configure GA4 Measurement ID
- [ ] Set up Facebook Pixel ID  
- [ ] Configure PostHog project
- [ ] Set up Google Tag Manager (optional)
- [ ] Configure server-side analytics (backend)
- [ ] Set up analytics dashboards
- [ ] Configure automated alerts

## 📈 Key Metrics to Track

### Service Page Analytics
- Page views by service type
- Time spent on service pages
- CTA click rates (Get Quote, Book Now)
- Service comparison interactions
- Mobile vs desktop usage

### Booking Funnel Analytics
- Funnel conversion rates by step:
  1. Landing → Device Selection: Target 85%+
  2. Device Selection → Issue Description: Target 75%+
  3. Issue Description → Pricing: Target 80%+
  4. Pricing → Contact Details: Target 70%+
  5. Contact Details → Confirmation: Target 90%+
- Average time per funnel step
- Drop-off points and reasons
- Device type preferences
- Price sensitivity analysis

### Business Intelligence
- Revenue per booking
- Average order value (AOV)
- Customer lifetime value (CLV)
- Popular repair services
- Seasonal demand patterns
- Geographic distribution

## 🚨 GDPR & Privacy Compliance

### Cookie Consent Implementation
```javascript
// Already implemented in ConsentManager
const consent = {
  necessary: true,      // Always required
  analytics: user_choice,   // Opt-in required
  marketing: user_choice,   // Opt-in required
  personalization: user_choice // Opt-in required
};
```

### Data Retention Policies
- **Google Analytics**: 26 months (configurable)
- **Facebook Pixel**: 180 days (standard)
- **PostHog**: Configurable (recommend 24 months)

### Privacy Controls
- Users can opt-out at any time
- Data deletion requests supported
- Anonymous analytics collection available
- IP address anonymization enabled

## 🔧 Deployment Instructions

### 1. Update Environment Configuration
```bash
# Production server
cd /opt/webapps/revivatech
cp .env.production.example .env.production

# Update with your actual analytics IDs
nano .env.production
```

### 2. Restart Services
```bash
# Restart frontend container with new environment
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d

# Verify analytics loading
docker logs revivatech_new_frontend --tail 20
```

### 3. Verify Analytics Setup
```bash
# Test analytics initialization
curl -I "https://revivatech.co.uk"

# Check for analytics scripts in page source
curl -s "https://revivatech.co.uk" | grep -E "(gtag|fbq|posthog)"
```

## 📊 Analytics Dashboard Setup

### Google Analytics 4
1. **Custom Events**: All booking events are already configured
2. **Conversion Goals**: 
   - Set 'booking_completed' as primary conversion
   - Set 'quote_requested' as micro-conversion
3. **Audiences**: Create segments for device types, service categories
4. **Reports**: Custom funnel reports for booking flow

### Facebook Events Manager
1. **Standard Events**: Purchase, Lead, ViewContent already implemented
2. **Custom Conversions**: Set up for different service types
3. **Audiences**: Lookalike audiences based on completed bookings

### PostHog Dashboard
1. **Funnels**: Booking flow conversion analysis
2. **User Paths**: Journey analysis from landing to conversion
3. **Cohort Analysis**: Customer retention tracking
4. **Feature Flags**: A/B test different booking flows

## 🚀 Next Steps

1. **Immediate (Week 1)**:
   - Set up GA4, Facebook Pixel, PostHog accounts
   - Configure production environment variables
   - Deploy with analytics enabled
   - Verify event tracking working

2. **Short-term (Week 2-4)**:
   - Set up conversion goals and audiences
   - Configure automated reporting dashboards
   - Implement A/B testing for booking flow
   - Set up performance alerts

3. **Long-term (Month 2+)**:
   - Implement server-side analytics
   - Set up customer data platform (CDP)
   - Advanced segmentation and personalization
   - Machine learning insights integration

## 📞 Support & Troubleshooting

### Common Issues
1. **Analytics not loading**: Check environment variables and CSP headers
2. **GDPR compliance**: Ensure consent management is working
3. **Event not tracking**: Check browser console for JavaScript errors
4. **Performance impact**: Monitor Core Web Vitals impact

### Debug Mode
```javascript
// Enable debug mode in development
window.gtag_debug = true;
window.fbq_debug = true;
window.posthog_debug = true;
```

---

**Version**: 1.0  
**Last Updated**: July 2025  
**Environment**: Production Ready  
**Status**: Implementation Complete, Configuration Required