# Mac Repair Page Implementation Guide

## Overview
Based on the analysis of the existing repair booking application, this guide outlines the implementation of a comprehensive Mac Repair Page with multi-step booking flow.

## Component Architecture

### 1. Device Selection Component
**Purpose**: Allow users to select their device category (MacBook, iMac, Mac Mini, etc.)

```typescript
interface DeviceSelectionProps {
  onDeviceSelect: (device: DeviceType) => void;
  selectedDevice?: DeviceType;
}

interface DeviceType {
  id: string;
  name: string;
  icon: string;
  description: string;
  subcategories: string[];
}
```

**Features**:
- Grid layout with device cards
- Device icons and descriptions
- Hover effects and animations
- Mobile-responsive design
- Search/filter functionality

### 2. Model Selection Component
**Purpose**: Display specific models based on selected device type

```typescript
interface ModelSelectionProps {
  deviceType: DeviceType;
  onModelSelect: (model: DeviceModel) => void;
  selectedModel?: DeviceModel;
}

interface DeviceModel {
  id: string;
  name: string;
  year: string;
  screenSize?: string;
  processor?: string;
  image: string;
  commonIssues: RepairType[];
}
```

**Features**:
- Filterable list by year, screen size, specs
- Visual model identification (images)
- Quick search functionality
- Model comparison option
- Auto-complete suggestions

### 3. Repair Type Selection
**Purpose**: Choose specific repair needed

```typescript
interface RepairType {
  id: string;
  name: string;
  description: string;
  estimatedTime: string;
  priceRange: {
    min: number;
    max: number;
  };
  urgency: 'standard' | 'urgent' | 'emergency';
}
```

**Common Repair Types**:
- Screen Replacement
- Battery Replacement
- Keyboard/Trackpad Repair
- Logic Board Repair
- SSD Upgrade
- RAM Upgrade
- Liquid Damage Repair
- Port Replacement
- Software Issues
- Data Recovery

### 4. Booking Form Component
**Purpose**: Collect customer information and booking details

```typescript
interface BookingFormData {
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  
  // Device Information
  deviceType: string;
  deviceModel: string;
  serialNumber?: string;
  
  // Repair Details
  repairType: string[];
  issueDescription: string;
  urgency: 'standard' | 'urgent' | 'emergency';
  
  // Scheduling
  preferredDate: Date;
  preferredTime: string;
  dropOffMethod: 'in-store' | 'mail-in' | 'pickup';
  
  // Additional Options
  dataBackup: boolean;
  loanerDevice: boolean;
  expressService: boolean;
}
```

### 5. Progress Indicator Component
**Purpose**: Show user progress through booking flow

```typescript
interface ProgressStep {
  id: number;
  label: string;
  status: 'completed' | 'current' | 'upcoming';
}
```

**Steps**:
1. Select Device
2. Choose Model
3. Select Repair
4. Enter Details
5. Confirm Booking

## Data Structure

### Device Catalog Structure
```javascript
const deviceCatalog = {
  macbook: {
    name: "MacBook",
    icon: "laptop",
    subcategories: {
      macbookAir: {
        name: "MacBook Air",
        models: [
          {
            id: "mba-m3-15-2024",
            name: "MacBook Air 15-inch (M3, 2024)",
            specs: {
              processor: "Apple M3",
              screenSize: "15.3 inches",
              year: "2024",
              ports: ["USB-C", "MagSafe 3"],
            },
            commonIssues: ["screen", "battery", "keyboard"],
            image: "/images/devices/mba-m3-15-2024.jpg"
          },
          // ... more models from 2016-2024
        ]
      },
      macbookPro: {
        name: "MacBook Pro",
        models: [
          // All Pro models 2016-2024
        ]
      }
    }
  },
  imac: {
    name: "iMac",
    icon: "desktop",
    subcategories: {
      // iMac models
    }
  },
  // ... other device types
};
```

## Implementation Features

### 1. Smart Device Recognition
- Auto-detect device from serial number
- Quick model identification via image upload
- Previous repair history lookup

### 2. Real-time Availability
- Live appointment slot checking
- Technician availability display
- Estimated repair completion time

### 3. Price Transparency
- Instant repair cost estimates
- Part availability checking
- Multiple repair package options

### 4. Customer Communication
- SMS/Email booking confirmations
- Repair progress notifications
- Two-way messaging with technicians

### 5. Integration Points
- CRM API for customer data
- Inventory system for parts
- Payment gateway for deposits
- Calendar system for scheduling

## UI/UX Considerations

### Desktop Experience
- Multi-column layout for device selection
- Side-by-side comparison views
- Hover states with additional info
- Keyboard navigation support

### Mobile Experience
- Single column layouts
- Touch-optimized controls
- Swipe gestures for navigation
- Compressed progress indicators
- Native app-like interactions

### Accessibility
- ARIA labels for all controls
- Keyboard navigation
- Screen reader compatibility
- High contrast mode support
- Clear focus indicators

## Technical Implementation

### State Management
```typescript
interface RepairBookingState {
  currentStep: number;
  selectedDevice?: DeviceType;
  selectedModel?: DeviceModel;
  selectedRepairs: RepairType[];
  bookingData: Partial<BookingFormData>;
  availableSlots: TimeSlot[];
  priceEstimate?: PriceEstimate;
}
```

### API Endpoints
```typescript
// Device catalog
GET /api/devices
GET /api/devices/:type/models
GET /api/models/:id/repairs

// Booking
POST /api/bookings/check-availability
POST /api/bookings/create
GET /api/bookings/:id

// Customer
POST /api/customers/lookup
GET /api/customers/:id/history
```

### Component Hierarchy
```
MacRepairPage
├── Header
├── ProgressIndicator
├── StepContainer
│   ├── DeviceSelection
│   ├── ModelSelection
│   ├── RepairSelection
│   ├── BookingForm
│   └── BookingConfirmation
├── PriceSummary
└── Footer
```

## Performance Optimizations

1. **Lazy Loading**: Load device images and data on demand
2. **Caching**: Cache device catalog data locally
3. **Prefetching**: Prefetch next step data
4. **Debouncing**: Debounce search inputs
5. **Virtual Scrolling**: For long model lists

## Security Considerations

1. **Data Validation**: Validate all form inputs
2. **CSRF Protection**: Implement CSRF tokens
3. **Rate Limiting**: Limit booking attempts
4. **Encryption**: Encrypt sensitive customer data
5. **Authentication**: Secure admin access

## Testing Strategy

1. **Unit Tests**: Test individual components
2. **Integration Tests**: Test booking flow
3. **E2E Tests**: Complete user journeys
4. **Accessibility Tests**: WCAG compliance
5. **Performance Tests**: Load time targets

## Deployment Checklist

- [ ] Device catalog data populated
- [ ] All repair types configured
- [ ] Pricing rules implemented
- [ ] Email templates created
- [ ] SMS notifications setup
- [ ] Payment gateway integrated
- [ ] CRM connection tested
- [ ] Admin dashboard deployed
- [ ] Staff training completed
- [ ] Backup procedures in place