# Analytics Quick Reference Guide

## 🚀 Quick Start

### Testing the Integration
1. **Visit Test Page**: Navigate to `/analytics-test`
2. **Grant Consent**: Accept analytics cookies via consent banner
3. **Run Tests**: Click "Run All Tests" button
4. **Check Network**: Open DevTools → Network tab to see tracking requests
5. **Verify Data**: Check real-time reports in Google Analytics

### Using Analytics in Components

```typescript
import useEventTracking from '@/hooks/useEventTracking';

function YourComponent() {
  const { trackServiceInteraction, trackContactInteraction } = useEventTracking();

  return (
    <button onClick={() => 
      trackServiceInteraction('click', 'mac_repair', {
        service_name: 'Mac Repair',
        cta_location: 'header'
      })
    }>
      Book Mac Repair
    </button>
  );
}
```

## 📊 Available Tracking Methods

### Core Events
```typescript
// Page views
trackPageView({ page_section: 'homepage', visit_intent: 'research' });

// Service interactions  
trackServiceInteraction('click', 'mac_repair', { cta_location: 'hero' });

// Contact interactions (conversions)
trackContactInteraction('phone', 'footer');  // £15 lead value
trackContactInteraction('email', 'contact_page');  // £10 lead value
```

### Conversion Events
```typescript
// Quote requests (£25 lead value)
trackQuoteRequest('iPhone', 'Screen Repair', 149);

// Booking completions (actual repair value)
trackBookingCompleted('booking-123', 'MacBook Pro', 'Battery', 179, 'urgent');
```

### Feature & Engagement
```typescript
// Feature usage
trackFeatureUsage('ai_assistant', 'completed', { repair_type: 'screen' });

// Engagement milestones
trackEngagementMilestone('scroll_75_percent', 75, { page: 'homepage' });
```

## 🎯 Event Names & Parameters

### Standard Event Names
- `page_view` - Page navigation
- `service_viewed` - Service page/section viewed
- `device_selected` - Device chosen in booking
- `quote_requested` - Price quote requested (conversion)
- `booking_completed` - Booking finalized (major conversion)
- `phone_clicked` - Phone number clicked (lead)
- `email_clicked` - Email address clicked (lead)

### Custom Dimensions
- `customer_type`: new, returning, premium
- `device_preference`: apple, android, pc, gaming  
- `repair_category`: screen, battery, water_damage, logic_board
- `service_level`: standard, urgent, emergency
- `visit_intent`: research, quote, booking, support

## 🔧 Environment Setup

### Required Environment Variables
```bash
# Google Analytics 4
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX

# Facebook Pixel
NEXT_PUBLIC_FB_PIXEL_ID=123456789012345

# PostHog Analytics  
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxx

# Control flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_DEV_ANALYTICS=false
```

## 🧪 Testing & Debugging

### Browser Console Commands
```javascript
// Test analytics manually
window.testAnalytics();

// Check service status
window.gtag && console.log('Google Analytics loaded');
window.fbq && console.log('Facebook Pixel loaded');  
window.posthog && console.log('PostHog loaded');
```

### Network Requests to Monitor
- `google-analytics.com/g/collect` - GA4 events
- `facebook.com/tr` - Facebook Pixel events
- `posthog.com/batch` - PostHog events

### Debugging Checklist
- [ ] Consent granted for analytics
- [ ] Environment variables set correctly
- [ ] No console errors
- [ ] Network requests visible in DevTools
- [ ] Events appearing in real-time reports

## 📈 Business Metrics Tracked

### Conversion Values
- **Quote Request**: £25 per conversion
- **Phone Contact**: £15 per interaction  
- **Email Contact**: £10 per interaction
- **Completed Booking**: Actual repair price (£49-599+)

### Key Performance Indicators
- **Conversion Rate**: Visitors → Quote Requests
- **Booking Rate**: Quote Requests → Completed Bookings
- **Average Order Value**: Revenue per completed booking
- **Lead Quality**: Contact interactions → Actual bookings
- **Service Popularity**: Most requested repair types
- **Customer Segments**: Device preference distribution

## 🛠️ Troubleshooting

### Common Issues
1. **Events Not Tracking**
   - Check consent is granted
   - Verify environment variables
   - Check browser console for errors

2. **Conversion Values Missing**  
   - Ensure conversion events include value parameter
   - Check currency is set to 'GBP'

3. **Custom Dimensions Not Populating**
   - Verify parameter names match configuration
   - Check Google Analytics custom dimension setup

### Support Resources
- **Testing Page**: `/analytics-test`
- **Documentation**: `/docs/THIRD_PARTY_ANALYTICS_IMPLEMENTATION.md`  
- **Browser Console**: `window.testAnalytics()` for manual testing

---

**Quick Links**:
- 🧪 [Analytics Test Page](/analytics-test)
- 📊 [Google Analytics](https://analytics.google.com)
- 📱 [Facebook Business Manager](https://business.facebook.com)  
- 📈 [PostHog Dashboard](https://app.posthog.com)

*Updated*: July 21, 2025