# Third-Party Analytics Integration - Implementation Guide

## 🎯 Overview

This document provides comprehensive guidance for the RevivaTech third-party analytics integration, including Google Analytics 4, Facebook Pixel, and PostHog analytics services with full GDPR/CCPA compliance.

## 📊 Analytics Stack

### Integrated Services

1. **Google Analytics 4 (GA4)**
   - Advanced web analytics
   - Conversion tracking
   - Enhanced ecommerce
   - Custom dimensions and events

2. **Facebook Pixel**
   - Social media advertising optimization
   - Conversion tracking
   - Audience building
   - Retargeting campaigns

3. **PostHog**
   - Product analytics
   - Session recording
   - Feature flags
   - Funnel analysis

## 🏗️ Architecture

### Component Structure

```
src/
├── components/analytics/
│   ├── ConsentManager.tsx           # GDPR/CCPA consent management
│   ├── ThirdPartyAnalyticsWrapper.tsx # Main analytics wrapper
│   └── BookingFlowTracker.tsx       # Conversion funnel tracking
├── lib/analytics/
│   ├── ThirdPartyAnalytics.ts       # Core analytics service
│   ├── setup.ts                     # Initialization and configuration
│   └── test.ts                      # Testing and validation
├── hooks/
│   └── useEventTracking.ts          # Event tracking hooks
└── config/
    └── analytics.config.ts          # Configuration and event definitions
```

### Data Flow

```
User Action → Event Tracking Hook → Analytics Wrapper → Third-Party Services
                                                    ↓
                              Consent Manager ← Privacy Compliance
```

## 🚀 Setup Instructions

### 1. Environment Variables

Add the following to your `.env.local` file:

```bash
# Google Analytics 4
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX

# Facebook Pixel
NEXT_PUBLIC_FB_PIXEL_ID=123456789012345
FACEBOOK_ACCESS_TOKEN=your-facebook-access-token

# PostHog Analytics
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Analytics Control
NEXT_PUBLIC_ENABLE_DEV_ANALYTICS=false
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

### 2. Service Configuration

#### Google Analytics 4 Setup

1. Create a GA4 property in Google Analytics
2. Get your Measurement ID (G-XXXXXXXXXX)
3. Add the ID to your environment variables
4. The integration will handle:
   - Pageview tracking
   - Event tracking
   - Conversion tracking
   - Custom dimensions

#### Facebook Pixel Setup

1. Create a Facebook Pixel in Business Manager
2. Get your Pixel ID
3. For server-side events, get an Access Token
4. Add both to environment variables
5. The integration provides:
   - Standard events tracking
   - Custom conversions
   - Audience building
   - E-commerce tracking

#### PostHog Setup

1. Create a PostHog account
2. Get your API key from project settings
3. Add to environment variables
4. Features include:
   - Event tracking
   - Session recording
   - Funnel analysis
   - Feature flags

## 🎮 Usage Examples

### Basic Event Tracking

```tsx
import { useEventTracking } from '@/hooks/useEventTracking';

function BookingButton() {
  const { trackServiceInteraction } = useEventTracking();

  const handleClick = () => {
    trackServiceInteraction('click', 'screen_repair', {
      device_type: 'iPhone',
      location: 'hero_section'
    });
  };

  return <button onClick={handleClick}>Book Repair</button>;
}
```

### Conversion Tracking

```tsx
import { useEventTracking } from '@/hooks/useEventTracking';

function BookingConfirmation({ booking }) {
  const { trackBookingCompleted } = useEventTracking();

  useEffect(() => {
    trackBookingCompleted(
      booking.id,
      booking.deviceType,
      booking.repairType,
      booking.totalValue,
      booking.serviceLevel
    );
  }, [booking]);

  return <div>Booking confirmed!</div>;
}
```

### Booking Flow Tracking

```tsx
import BookingFlowTracker from '@/components/analytics/BookingFlowTracker';

function DeviceSelectionStep({ selectedDevice }) {
  return (
    <BookingFlowTracker
      step="device_selection"
      deviceType={selectedDevice?.brand}
      deviceModel={selectedDevice?.model}
      repairType="screen_repair"
    >
      <DeviceSelector />
    </BookingFlowTracker>
  );
}
```

## 🔒 Privacy Compliance

### GDPR/CCPA Compliance Features

1. **Consent Management**
   - Cookie consent banner
   - Granular consent controls
   - Consent persistence
   - Easy withdrawal

2. **Privacy Features**
   - IP anonymization
   - Do Not Track respect
   - Data retention controls
   - Clear data on consent withdrawal

3. **User Rights**
   - Easy consent management
   - Data export capabilities
   - Deletion requests handling
   - Transparency reports

### Consent Manager Integration

```tsx
import ConsentManager from '@/components/analytics/ConsentManager';

function App() {
  return (
    <div>
      {/* Your app content */}
      <ConsentManager 
        showBanner={true}
        position="bottom"
        onConsentUpdate={(consents) => {
          // Handle consent updates
          console.log('Consent updated:', consents);
        }}
      />
    </div>
  );
}
```

## 📈 Event Tracking Strategy

### Standard Events

#### Page Events
- `page_view` - Every page load
- `page_load_complete` - Page fully loaded
- `scroll_milestone` - 25%, 50%, 75%, 90% scroll

#### Business Events
- `service_viewed` - Service page viewed
- `device_selected` - Device chosen in booking
- `quote_requested` - Price quote requested
- `booking_initiated` - Booking process started
- `booking_completed` - Booking confirmed

#### Conversion Events
- `lead_generated` - Contact form submission
- `phone_clicked` - Phone number clicked
- `email_clicked` - Email address clicked
- `purchase` - Booking payment completed

### Custom Dimensions

1. **Customer Type**: new, returning, premium
2. **Device Preference**: apple, android, pc, gaming
3. **Repair Category**: screen, battery, water_damage, etc.
4. **Service Level**: standard, urgent, emergency
5. **Visit Intent**: research, quote, booking, support

## 🧪 Testing & Validation

### Automatic Testing

Run the comprehensive test suite:

```javascript
// In browser console
testAnalytics();
```

### Manual Validation

1. **Check Environment Variables**
   ```javascript
   console.log(process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID);
   ```

2. **Verify Services Loading**
   ```javascript
   // Google Analytics
   console.log(typeof window.gtag);
   
   // Facebook Pixel
   console.log(typeof window.fbq);
   
   // PostHog
   console.log(typeof window.posthog);
   ```

3. **Test Event Tracking**
   ```javascript
   // Send test event
   window.gtag('event', 'test_event', {
     test_parameter: 'test_value'
   });
   ```

### Network Monitoring

Monitor these requests in Network tab:
- `google-analytics.com` - GA4 events
- `facebook.com/tr` - Facebook Pixel events
- `posthog.com` - PostHog events

## 🔧 Configuration Options

### Analytics Config

Located in `src/config/analytics.config.ts`:

```typescript
export const analyticsConfig = {
  googleAnalytics: {
    enabled: true,
    measurementId: process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID,
    customDimensions: {
      'customer_type': 'custom_customer_type',
      'device_preference': 'custom_device_preference'
    }
  },
  facebookPixel: {
    enabled: process.env.NODE_ENV === 'production',
    pixelId: process.env.NEXT_PUBLIC_FB_PIXEL_ID
  },
  postHog: {
    enabled: true,
    apiKey: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    enableSessionRecording: true,
    enableHeatmaps: true
  },
  privacy: {
    requireConsent: true,
    anonymizeIP: true,
    respectDoNotTrack: true
  }
};
```

### Event Names

Standardized event names in `eventNames` object:

```typescript
export const eventNames = {
  PAGE_VIEW: 'page_view',
  QUOTE_REQUESTED: 'quote_requested',
  BOOKING_COMPLETED: 'booking_completed',
  // ... more events
} as const;
```

## 🚨 Troubleshooting

### Common Issues

1. **Analytics not loading**
   - Check environment variables
   - Verify consent is granted
   - Check network requests in DevTools

2. **Events not tracking**
   - Ensure analytics is initialized
   - Check console for errors
   - Verify consent for analytics

3. **Conversion not tracking**
   - Check conversion setup in platform
   - Verify event parameters
   - Monitor network requests

### Debug Mode

Enable debug mode in development:

```typescript
<ThirdPartyAnalyticsWrapper debugMode={true}>
  {/* Your app */}
</ThirdPartyAnalyticsWrapper>
```

### Error Monitoring

All analytics errors are logged to console and tracked as events:

```javascript
// Error tracking example
trackError('analytics_initialization', error.message, error.stack);
```

## 📊 Performance Considerations

### Optimization Features

1. **Lazy Loading**
   - Scripts load asynchronously
   - No blocking of page render
   - Progressive enhancement

2. **Batching**
   - Events batched for efficiency
   - Configurable batch size
   - Automatic flushing

3. **Caching**
   - Consent preferences cached
   - Configuration cached
   - Reduced redundant calls

### Performance Metrics

Monitor these metrics:
- Script loading time
- First Contentful Paint impact
- Network request count
- Error rates

## 🔄 Maintenance

### Regular Tasks

1. **Monthly**
   - Review analytics reports
   - Check conversion rates
   - Monitor error logs

2. **Quarterly**
   - Update event definitions
   - Review privacy compliance
   - Optimize tracking strategy

3. **Annually**
   - Review analytics stack
   - Update service configurations
   - Audit data retention policies

### Updates & Migrations

When updating analytics services:

1. Test in development first
2. Use feature flags for gradual rollout
3. Monitor error rates
4. Have rollback plan ready

## 📚 Resources

### Documentation Links
- [Google Analytics 4 Documentation](https://developers.google.com/analytics/devguides/collection/ga4)
- [Facebook Pixel Documentation](https://developers.facebook.com/docs/facebook-pixel)
- [PostHog Documentation](https://posthog.com/docs)

### Support Contacts
- **Technical Issues**: development team
- **Privacy Questions**: compliance team
- **Analytics Strategy**: marketing team

---

**Version**: 1.0  
**Last Updated**: July 2025  
**Status**: ✅ Implementation Complete