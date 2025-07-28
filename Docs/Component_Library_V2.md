# RevivaTech Component Library V2.0 - Modern UI Components
*Complete component specifications for the RevivaTech platform redesign*

**Linked to**: [PRD_04_Design_Overhaul.md](./PRD_04_Design_Overhaul.md)  
**Design System**: [Design_System_V2.md](./Design_System_V2.md)

---

## 🧩 Component Architecture

### Design Principles

```typescript
interface ComponentPhilosophy {
  principles: [
    "Composition over inheritance",
    "Variant-driven design",
    "Accessibility by default", 
    "Mobile-first responsive",
    "Performance optimized"
  ];
  
  patterns: {
    variants: "Configurable visual variants";
    compound: "Composable component systems";
    polymorphic: "Flexible element rendering";
    controlled: "Controlled and uncontrolled states";
  };
}
```

### Component Categories

```typescript
const COMPONENT_CATEGORIES = {
  foundations: ['Button', 'Input', 'Select', 'Checkbox', 'Radio'],
  layout: ['Container', 'Grid', 'Stack', 'Divider', 'Spacer'],
  navigation: ['Navbar', 'Breadcrumb', 'Pagination', 'Tabs'],
  feedback: ['Alert', 'Toast', 'Loading', 'Progress', 'Skeleton'],
  overlay: ['Modal', 'Dialog', 'Popover', 'Tooltip', 'BottomSheet'],
  data: ['Table', 'Card', 'Badge', 'Avatar', 'Stats'],
  forms: ['FormField', 'FormGroup', 'FormValidation', 'FileUpload'],
  business: ['DeviceCard', 'RepairStatus', 'PriceDisplay', 'BookingWizard']
};
```

---

## 🎨 Foundation Components

### Button Component

```typescript
interface ButtonProps {
  // Variants
  variant: 'primary' | 'secondary' | 'ghost' | 'outline' | 'destructive';
  size: 'sm' | 'md' | 'lg' | 'xl';
  
  // States
  loading?: boolean;
  disabled?: boolean;
  
  // Visual
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  
  // Behavior
  onClick?: () => void;
  href?: string;
  type?: 'button' | 'submit' | 'reset';
  
  // Styling
  className?: string;
  style?: React.CSSProperties;
  
  // Accessibility
  'aria-label'?: string;
  'aria-describedby'?: string;
}
```

**Button Variants**:
```scss
// Primary Button - Main actions
.btn-primary {
  background: linear-gradient(135deg, var(--primary-500) 0%, var(--primary-600) 100%);
  color: var(--neutral-white);
  border: none;
  box-shadow: var(--shadow-primary);
  
  &:hover {
    background: linear-gradient(135deg, var(--primary-600) 0%, var(--primary-700) 100%);
    transform: translateY(-1px);
    box-shadow: var(--shadow-primary), 0 0 20px rgba(var(--primary-500), 0.4);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    background: var(--neutral-300);
    color: var(--neutral-500);
    box-shadow: none;
    cursor: not-allowed;
  }
}

// Secondary Button - Secondary actions
.btn-secondary {
  background: linear-gradient(135deg, var(--secondary-500) 0%, var(--secondary-600) 100%);
  color: var(--neutral-white);
  border: none;
  box-shadow: var(--shadow-secondary);
  
  &:hover {
    background: linear-gradient(135deg, var(--secondary-600) 0%, var(--secondary-700) 100%);
    transform: translateY(-1px);
  }
}

// Ghost Button - Subtle actions
.btn-ghost {
  background: rgba(var(--primary-500), 0.1);
  color: var(--primary-600);
  border: 1px solid rgba(var(--primary-500), 0.2);
  backdrop-filter: blur(8px);
  
  &:hover {
    background: rgba(var(--primary-500), 0.15);
    border-color: rgba(var(--primary-500), 0.3);
  }
}

// Outline Button - Alternative actions
.btn-outline {
  background: transparent;
  color: var(--primary-600);
  border: 2px solid var(--primary-500);
  
  &:hover {
    background: var(--primary-500);
    color: var(--neutral-white);
  }
}

// Destructive Button - Dangerous actions
.btn-destructive {
  background: linear-gradient(135deg, var(--danger-500) 0%, var(--danger-600) 100%);
  color: var(--neutral-white);
  border: none;
  
  &:hover {
    background: linear-gradient(135deg, var(--danger-600) 0%, var(--danger-700) 100%);
  }
}
```

**Button Sizes**:
```scss
.btn-sm {
  height: 32px;
  padding: 0 var(--spacing-3);
  font-size: var(--text-sm);
  border-radius: var(--radius-md);
}

.btn-md {
  height: 40px;
  padding: 0 var(--spacing-4);
  font-size: var(--text-base);
  border-radius: var(--radius-lg);
}

.btn-lg {
  height: 48px;
  padding: 0 var(--spacing-6);
  font-size: var(--text-lg);
  border-radius: var(--radius-xl);
}

.btn-xl {
  height: 56px;
  padding: 0 var(--spacing-8);
  font-size: var(--text-xl);
  border-radius: var(--radius-2xl);
}
```

**Implementation Example**:
```tsx
<Button 
  variant="primary" 
  size="lg" 
  leftIcon={<Icon name="plus" />}
  onClick={handleBookRepair}
  loading={isLoading}
>
  Book Repair Now
</Button>
```

### Input Component

```typescript
interface InputProps {
  // Types
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
  
  // Variants
  variant?: 'default' | 'filled' | 'flushed' | 'unstyled';
  size?: 'sm' | 'md' | 'lg';
  
  // States
  disabled?: boolean;
  invalid?: boolean;
  required?: boolean;
  
  // Visual
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  placeholder?: string;
  
  // Behavior
  value?: string;
  defaultValue?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  
  // Validation
  errorMessage?: string;
  helperText?: string;
  
  // Accessibility
  'aria-label'?: string;
  'aria-describedby'?: string;
}
```

**Input Styles**:
```scss
.input-base {
  width: 100%;
  border: 2px solid var(--neutral-200);
  border-radius: var(--radius-lg);
  background: var(--neutral-white);
  color: var(--neutral-900);
  transition: all var(--duration-fast) var(--easing-interface);
  
  &::placeholder {
    color: var(--neutral-400);
  }
  
  &:focus {
    outline: none;
    border-color: var(--primary-500);
    box-shadow: 0 0 0 3px rgba(var(--primary-500), 0.1);
  }
  
  &:invalid {
    border-color: var(--danger-500);
    box-shadow: 0 0 0 3px rgba(var(--danger-500), 0.1);
  }
  
  &:disabled {
    background: var(--neutral-100);
    color: var(--neutral-500);
    cursor: not-allowed;
  }
}

.input-sm {
  height: 36px;
  padding: 0 var(--spacing-3);
  font-size: var(--text-sm);
}

.input-md {
  height: 44px;
  padding: 0 var(--spacing-4);
  font-size: var(--text-base);
}

.input-lg {
  height: 52px;
  padding: 0 var(--spacing-5);
  font-size: var(--text-lg);
}

// Filled variant
.input-filled {
  background: var(--neutral-100);
  border: 2px solid transparent;
  
  &:focus {
    background: var(--neutral-white);
    border-color: var(--primary-500);
  }
}

// With icons
.input-with-left-element {
  padding-left: var(--spacing-10);
}

.input-with-right-element {
  padding-right: var(--spacing-10);
}
```

### Card Component

```typescript
interface CardProps {
  // Variants
  variant?: 'elevated' | 'outline' | 'ghost' | 'glass';
  
  // Visual
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  
  // Interactive
  hoverable?: boolean;
  clickable?: boolean;
  onClick?: () => void;
  
  // Content
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  
  // Styling
  className?: string;
}
```

**Card Variants**:
```scss
.card-base {
  border-radius: var(--radius-xl);
  transition: all var(--duration-base) var(--easing-interface);
  position: relative;
  overflow: hidden;
}

// Elevated Card
.card-elevated {
  background: var(--neutral-white);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--neutral-100);
  
  &.hoverable:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-xl);
  }
}

// Outline Card
.card-outline {
  background: var(--neutral-white);
  border: 2px solid var(--neutral-200);
  
  &.hoverable:hover {
    border-color: var(--primary-300);
    box-shadow: var(--shadow-md);
  }
}

// Glass Card (Glassmorphism)
.card-glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: var(--shadow-lg);
  
  &.hoverable:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.3);
  }
}

// Interactive Card
.card-clickable {
  cursor: pointer;
  
  &:active {
    transform: scale(0.98);
  }
}

// Card Sections
.card-header {
  padding: var(--spacing-6) var(--spacing-6) 0;
  border-bottom: 1px solid var(--neutral-100);
  padding-bottom: var(--spacing-4);
  margin-bottom: var(--spacing-4);
}

.card-body {
  padding: var(--spacing-6);
}

.card-footer {
  padding: 0 var(--spacing-6) var(--spacing-6);
  border-top: 1px solid var(--neutral-100);
  padding-top: var(--spacing-4);
  margin-top: var(--spacing-4);
}
```

---

## 🚀 Interactive Components

### Modal Component

```typescript
interface ModalProps {
  // Visibility
  isOpen: boolean;
  onClose: () => void;
  
  // Size
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  
  // Behavior
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  
  // Content
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  
  // Styling
  centered?: boolean;
  scrollBehavior?: 'inside' | 'outside';
  
  // Accessibility
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
}
```

**Modal Implementation**:
```scss
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fade-in var(--duration-slow) var(--easing-interface);
}

.modal-content {
  background: var(--neutral-white);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-2xl);
  max-height: 90vh;
  max-width: 90vw;
  animation: scale-in var(--duration-slow) var(--easing-bounce);
  
  &.modal-sm { width: 400px; }
  &.modal-md { width: 600px; }
  &.modal-lg { width: 800px; }
  &.modal-xl { width: 1200px; }
  &.modal-full { 
    width: 100vw; 
    height: 100vh; 
    border-radius: 0; 
  }
}

.modal-header {
  padding: var(--spacing-6);
  border-bottom: 1px solid var(--neutral-100);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-body {
  padding: var(--spacing-6);
  overflow-y: auto;
}

.modal-footer {
  padding: var(--spacing-6);
  border-top: 1px solid var(--neutral-100);
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-3);
}
```

### Toast Component

```typescript
interface ToastProps {
  // Content
  title?: string;
  description?: string;
  
  // Type
  status?: 'success' | 'error' | 'warning' | 'info';
  
  // Behavior
  duration?: number;
  isClosable?: boolean;
  onClose?: () => void;
  
  // Position
  position?: 'top' | 'top-right' | 'bottom' | 'bottom-right';
  
  // Visual
  variant?: 'solid' | 'subtle' | 'left-accent';
  
  // Actions
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

**Toast Styles**:
```scss
.toast-container {
  position: fixed;
  z-index: 1100;
  pointer-events: none;
  
  &.toast-top { top: var(--spacing-4); }
  &.toast-bottom { bottom: var(--spacing-4); }
  &.toast-right { right: var(--spacing-4); }
  &.toast-left { left: var(--spacing-4); }
}

.toast {
  background: var(--neutral-white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  padding: var(--spacing-4);
  margin-bottom: var(--spacing-2);
  pointer-events: auto;
  animation: slide-in-right var(--duration-slow) var(--easing-interface);
  max-width: 400px;
  
  &.toast-success {
    border-left: 4px solid var(--success-500);
    .toast-icon { color: var(--success-500); }
  }
  
  &.toast-error {
    border-left: 4px solid var(--danger-500);
    .toast-icon { color: var(--danger-500); }
  }
  
  &.toast-warning {
    border-left: 4px solid var(--warning-500);
    .toast-icon { color: var(--warning-500); }
  }
  
  &.toast-info {
    border-left: 4px solid var(--info-500);
    .toast-icon { color: var(--info-500); }
  }
}

.toast-content {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-3);
}

.toast-icon {
  flex-shrink: 0;
  margin-top: var(--spacing-1);
}

.toast-text {
  flex: 1;
}

.toast-title {
  font-weight: 600;
  color: var(--neutral-900);
  margin-bottom: var(--spacing-1);
}

.toast-description {
  color: var(--neutral-600);
  font-size: var(--text-sm);
}
```

---

## 📱 Mobile Components

### Bottom Sheet Component

```typescript
interface BottomSheetProps {
  // Visibility
  isOpen: boolean;
  onClose: () => void;
  
  // Behavior
  snapPoints?: number[];
  initialSnap?: number;
  dismissible?: boolean;
  
  // Content
  header?: React.ReactNode;
  children: React.ReactNode;
  
  // Styling
  maxHeight?: string;
  
  // Gestures
  onSwipeDown?: () => void;
  onSwipeUp?: () => void;
}
```

**Bottom Sheet Styles**:
```scss
.bottom-sheet-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1000;
  animation: fade-in var(--duration-base) var(--easing-interface);
}

.bottom-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--neutral-white);
  border-radius: var(--radius-2xl) var(--radius-2xl) 0 0;
  box-shadow: var(--shadow-2xl);
  animation: slide-up var(--duration-slow) var(--easing-interface);
  touch-action: none;
}

.bottom-sheet-handle {
  width: 40px;
  height: 4px;
  background: var(--neutral-300);
  border-radius: var(--radius-full);
  margin: var(--spacing-3) auto;
  cursor: grab;
  
  &:active {
    cursor: grabbing;
  }
}

.bottom-sheet-header {
  padding: 0 var(--spacing-6) var(--spacing-4);
  border-bottom: 1px solid var(--neutral-100);
}

.bottom-sheet-content {
  padding: var(--spacing-6);
  max-height: 70vh;
  overflow-y: auto;
}
```

### Touch Optimized Button

```scss
.touch-button {
  min-height: 48px;
  min-width: 48px;
  position: relative;
  overflow: hidden;
  
  // Ripple effect for touch feedback
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    opacity: 0;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
    transform: scale(0);
    transition: all var(--duration-fast) var(--easing-interface);
  }
  
  &:active::after {
    opacity: 1;
    transform: scale(2);
  }
  
  // Haptic feedback simulation
  &:active {
    transform: scale(0.95);
  }
}
```

---

## 🏢 Business Components

### Device Card Component

```typescript
interface DeviceCardProps {
  // Device Data
  device: {
    id: string;
    name: string;
    brand: string;
    category: string;
    year: number;
    image?: string;
    repairability: number;
    avgCost: number;
    popularity: number;
  };
  
  // State
  selected?: boolean;
  disabled?: boolean;
  
  // Behavior
  onSelect?: (device: Device) => void;
  
  // Visual
  variant?: 'default' | 'compact' | 'detailed';
  showPricing?: boolean;
  showSpecs?: boolean;
}
```

**Device Card Implementation**:
```scss
.device-card {
  background: var(--neutral-white);
  border: 2px solid var(--neutral-200);
  border-radius: var(--radius-xl);
  padding: var(--spacing-6);
  transition: all var(--duration-base) var(--easing-interface);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(var(--primary-500), 0.03) 0%, transparent 70%);
    transition: transform var(--duration-slower) var(--easing-interface);
    transform: scale(0);
  }
  
  &:hover {
    border-color: var(--primary-300);
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
    
    &::before {
      transform: scale(1);
    }
    
    .device-image {
      transform: scale(1.05);
    }
  }
  
  &.selected {
    border-color: var(--primary-500);
    background: rgba(var(--primary-500), 0.05);
    box-shadow: var(--shadow-primary);
  }
  
  &:active {
    transform: translateY(-2px) scale(0.98);
  }
}

.device-image {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-lg);
  object-fit: cover;
  transition: transform var(--duration-base) var(--easing-interface);
}

.device-info {
  margin-top: var(--spacing-4);
}

.device-name {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--neutral-900);
  margin-bottom: var(--spacing-1);
}

.device-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: var(--spacing-3);
}

.device-brand {
  color: var(--neutral-600);
  font-size: var(--text-sm);
}

.device-year {
  background: var(--neutral-100);
  color: var(--neutral-700);
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  font-weight: 500;
}

.repairability-score {
  display: flex;
  gap: var(--spacing-1);
  
  .score-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--neutral-300);
    
    &.filled {
      background: var(--success-500);
    }
  }
}

.pricing-preview {
  margin-top: var(--spacing-4);
  padding-top: var(--spacing-4);
  border-top: 1px solid var(--neutral-100);
  
  .price-label {
    color: var(--neutral-600);
    font-size: var(--text-sm);
  }
  
  .price-value {
    color: var(--primary-600);
    font-weight: 600;
    font-size: var(--text-lg);
  }
}
```

### Repair Status Component

```typescript
interface RepairStatusProps {
  // Status Data
  repair: {
    id: string;
    deviceName: string;
    status: 'pending' | 'diagnosed' | 'parts-ordered' | 'in-progress' | 'testing' | 'completed';
    progress: number;
    estimatedCompletion?: string;
    technicianName?: string;
    lastUpdate?: string;
  };
  
  // Visual
  variant?: 'card' | 'timeline' | 'compact';
  showProgress?: boolean;
  showTechnician?: boolean;
}
```

**Repair Status Styles**:
```scss
.repair-status {
  background: var(--neutral-white);
  border-radius: var(--radius-xl);
  padding: var(--spacing-6);
  border-left: 4px solid var(--primary-500);
  box-shadow: var(--shadow-md);
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-4);
}

.status-badge {
  padding: var(--spacing-1) var(--spacing-3);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  
  &.status-pending {
    background: var(--warning-100);
    color: var(--warning-800);
  }
  
  &.status-diagnosed {
    background: var(--info-100);
    color: var(--info-800);
  }
  
  &.status-in-progress {
    background: var(--primary-100);
    color: var(--primary-800);
  }
  
  &.status-completed {
    background: var(--success-100);
    color: var(--success-800);
  }
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: var(--neutral-200);
  border-radius: var(--radius-full);
  overflow: hidden;
  margin: var(--spacing-4) 0;
  
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--primary-500), var(--primary-400));
    border-radius: var(--radius-full);
    transition: width var(--duration-slow) var(--easing-interface);
    position: relative;
    
    &::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
      animation: shimmer 2s infinite;
    }
  }
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.timeline-steps {
  display: flex;
  justify-content: space-between;
  margin-top: var(--spacing-6);
  
  .timeline-step {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
    position: relative;
    
    &:not(:last-child)::after {
      content: '';
      position: absolute;
      top: 12px;
      left: 50%;
      width: 100%;
      height: 2px;
      background: var(--neutral-200);
      z-index: -1;
    }
    
    &.completed::after {
      background: var(--success-500);
    }
    
    .step-marker {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: var(--neutral-200);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: var(--spacing-2);
      transition: all var(--duration-base) var(--easing-interface);
      
      &.completed {
        background: var(--success-500);
        color: white;
      }
      
      &.current {
        background: var(--primary-500);
        color: white;
        box-shadow: 0 0 0 4px rgba(var(--primary-500), 0.2);
      }
    }
    
    .step-label {
      font-size: var(--text-xs);
      color: var(--neutral-600);
      text-align: center;
      
      &.completed {
        color: var(--success-600);
        font-weight: 500;
      }
      
      &.current {
        color: var(--primary-600);
        font-weight: 600;
      }
    }
  }
}
```

### Price Display Component

```typescript
interface PriceDisplayProps {
  // Price Data
  price: {
    base: number;
    final: number;
    currency: string;
    breakdown?: Array<{
      name: string;
      amount: number;
      type: 'addition' | 'discount';
    }>;
  };
  
  // Visual
  variant?: 'simple' | 'detailed' | 'comparison';
  size?: 'sm' | 'md' | 'lg';
  showBreakdown?: boolean;
  
  // Behavior
  animated?: boolean;
  highlightSavings?: boolean;
}
```

**Price Display Styles**:
```scss
.price-display {
  background: linear-gradient(135deg, var(--neutral-50) 0%, var(--neutral-100) 100%);
  border: 2px solid var(--neutral-200);
  border-radius: var(--radius-xl);
  padding: var(--spacing-6);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, var(--primary-500), var(--secondary-500), var(--accent-500));
  }
}

.price-main {
  text-align: center;
  margin-bottom: var(--spacing-4);
  
  .currency-symbol {
    font-size: var(--text-2xl);
    color: var(--neutral-600);
    vertical-align: top;
  }
  
  .price-amount {
    font-size: var(--text-5xl);
    font-weight: 700;
    color: var(--neutral-900);
    font-family: var(--font-display);
    
    &.animated {
      animation: price-count-up var(--duration-slower) var(--easing-interface);
    }
  }
}

@keyframes price-count-up {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.price-breakdown {
  border-top: 1px solid var(--neutral-200);
  padding-top: var(--spacing-4);
  
  .breakdown-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-2) 0;
    
    &.discount {
      color: var(--success-600);
      
      .breakdown-amount::before {
        content: '-';
      }
    }
    
    &.addition {
      color: var(--neutral-700);
      
      .breakdown-amount::before {
        content: '+';
      }
    }
  }
  
  .breakdown-total {
    border-top: 1px solid var(--neutral-200);
    padding-top: var(--spacing-3);
    margin-top: var(--spacing-3);
    font-weight: 600;
    font-size: var(--text-lg);
  }
}

.savings-badge {
  position: absolute;
  top: var(--spacing-4);
  right: var(--spacing-4);
  background: var(--success-500);
  color: white;
  padding: var(--spacing-2) var(--spacing-3);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  font-weight: 600;
  animation: bounce-in var(--duration-base) var(--easing-bounce);
}
```

---

## 🎯 Form Components

### Form Field Component

```typescript
interface FormFieldProps {
  // Field Configuration
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'select' | 'textarea';
  
  // Validation
  required?: boolean;
  validation?: {
    pattern?: RegExp;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    custom?: (value: any) => boolean;
  };
  
  // State
  value?: any;
  error?: string;
  disabled?: boolean;
  
  // Visual
  placeholder?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  
  // Behavior
  onChange?: (value: any) => void;
  onBlur?: () => void;
  onFocus?: () => void;
}
```

**Form Field Styles**:
```scss
.form-field {
  margin-bottom: var(--spacing-6);
  
  .field-label {
    display: block;
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--neutral-700);
    margin-bottom: var(--spacing-2);
    
    .required-indicator {
      color: var(--danger-500);
      margin-left: var(--spacing-1);
    }
  }
  
  .field-input-wrapper {
    position: relative;
    
    .field-icon-left {
      position: absolute;
      left: var(--spacing-3);
      top: 50%;
      transform: translateY(-50%);
      color: var(--neutral-400);
      z-index: 1;
    }
    
    .field-icon-right {
      position: absolute;
      right: var(--spacing-3);
      top: 50%;
      transform: translateY(-50%);
      color: var(--neutral-400);
      z-index: 1;
    }
  }
  
  .field-helper {
    margin-top: var(--spacing-2);
    font-size: var(--text-sm);
    color: var(--neutral-600);
    
    &.error {
      color: var(--danger-600);
      
      &::before {
        content: '⚠ ';
      }
    }
  }
  
  .field-validation-icon {
    position: absolute;
    right: var(--spacing-3);
    top: 50%;
    transform: translateY(-50%);
    
    &.valid {
      color: var(--success-500);
    }
    
    &.invalid {
      color: var(--danger-500);
    }
  }
}

// Form validation states
.form-field {
  &.has-error {
    .field-input {
      border-color: var(--danger-500);
      box-shadow: 0 0 0 3px rgba(var(--danger-500), 0.1);
    }
  }
  
  &.has-success {
    .field-input {
      border-color: var(--success-500);
      box-shadow: 0 0 0 3px rgba(var(--success-500), 0.1);
    }
  }
}
```

### File Upload Component

```typescript
interface FileUploadProps {
  // Upload Configuration
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxFileSize?: number; // in bytes
  
  // Visual
  variant?: 'dropzone' | 'button' | 'minimal';
  preview?: boolean;
  
  // Behavior
  onFilesChange?: (files: File[]) => void;
  onFilesRemove?: (file: File) => void;
  onUploadProgress?: (progress: number) => void;
  
  // Content
  title?: string;
  description?: string;
  
  // State
  uploading?: boolean;
  disabled?: boolean;
  error?: string;
}
```

**File Upload Styles**:
```scss
.file-upload-dropzone {
  border: 2px dashed var(--neutral-300);
  border-radius: var(--radius-xl);
  padding: var(--spacing-8);
  text-align: center;
  background: var(--neutral-50);
  transition: all var(--duration-base) var(--easing-interface);
  cursor: pointer;
  
  &:hover {
    border-color: var(--primary-400);
    background: var(--primary-50);
  }
  
  &.dragover {
    border-color: var(--primary-500);
    background: var(--primary-100);
    transform: scale(1.02);
  }
  
  &.has-files {
    border-color: var(--success-500);
    background: var(--success-50);
  }
  
  &.has-error {
    border-color: var(--danger-500);
    background: var(--danger-50);
  }
  
  .upload-icon {
    width: 48px;
    height: 48px;
    margin: 0 auto var(--spacing-4);
    color: var(--neutral-400);
    
    .dropzone:hover & {
      color: var(--primary-500);
    }
  }
  
  .upload-title {
    font-size: var(--text-lg);
    font-weight: 600;
    color: var(--neutral-900);
    margin-bottom: var(--spacing-2);
  }
  
  .upload-description {
    font-size: var(--text-sm);
    color: var(--neutral-600);
    
    .upload-button {
      color: var(--primary-600);
      text-decoration: underline;
      cursor: pointer;
    }
  }
}

.file-preview-list {
  margin-top: var(--spacing-4);
  
  .file-preview-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
    padding: var(--spacing-3);
    border: 1px solid var(--neutral-200);
    border-radius: var(--radius-lg);
    background: var(--neutral-white);
    margin-bottom: var(--spacing-2);
    
    .file-icon {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-md);
      background: var(--primary-100);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--primary-600);
    }
    
    .file-info {
      flex: 1;
      
      .file-name {
        font-weight: 500;
        color: var(--neutral-900);
        margin-bottom: var(--spacing-1);
      }
      
      .file-size {
        font-size: var(--text-sm);
        color: var(--neutral-600);
      }
    }
    
    .file-progress {
      width: 60px;
      height: 4px;
      background: var(--neutral-200);
      border-radius: var(--radius-full);
      overflow: hidden;
      
      .progress-bar {
        height: 100%;
        background: var(--primary-500);
        transition: width var(--duration-base) var(--easing-interface);
      }
    }
    
    .file-remove {
      color: var(--neutral-400);
      cursor: pointer;
      padding: var(--spacing-1);
      border-radius: var(--radius-md);
      
      &:hover {
        color: var(--danger-500);
        background: var(--danger-50);
      }
    }
  }
}
```

---

## 🎨 Loading & Skeleton Components

### Loading Spinner

```scss
.loading-spinner {
  display: inline-block;
  position: relative;
  
  &.spinner-sm { width: 16px; height: 16px; }
  &.spinner-md { width: 24px; height: 24px; }
  &.spinner-lg { width: 32px; height: 32px; }
  
  .spinner-circle {
    width: 100%;
    height: 100%;
    border: 2px solid var(--neutral-200);
    border-top: 2px solid var(--primary-500);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  &.spinner-dots {
    display: flex;
    gap: var(--spacing-1);
    
    .dot {
      width: 6px;
      height: 6px;
      background: var(--primary-500);
      border-radius: 50%;
      animation: bounce 1.4s ease-in-out infinite;
      
      &:nth-child(1) { animation-delay: -0.32s; }
      &:nth-child(2) { animation-delay: -0.16s; }
      &:nth-child(3) { animation-delay: 0; }
    }
  }
}

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}
```

### Skeleton Components

```scss
.skeleton {
  background: linear-gradient(90deg, var(--neutral-200) 25%, var(--neutral-100) 50%, var(--neutral-200) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-md);
  
  &.skeleton-text {
    height: 1em;
    margin-bottom: var(--spacing-2);
    
    &.skeleton-title { height: 1.5em; }
    &.skeleton-caption { height: 0.875em; }
  }
  
  &.skeleton-circle {
    border-radius: 50%;
  }
  
  &.skeleton-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
  }
  
  &.skeleton-button {
    height: 40px;
    width: 120px;
    border-radius: var(--radius-lg);
  }
  
  &.skeleton-card {
    height: 200px;
    border-radius: var(--radius-xl);
  }
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

// Skeleton Templates
.skeleton-device-card {
  padding: var(--spacing-6);
  
  .skeleton-image {
    width: 80px;
    height: 80px;
    border-radius: var(--radius-lg);
    margin-bottom: var(--spacing-4);
  }
  
  .skeleton-title {
    height: 1.25em;
    width: 80%;
    margin-bottom: var(--spacing-2);
  }
  
  .skeleton-subtitle {
    height: 1em;
    width: 60%;
    margin-bottom: var(--spacing-4);
  }
  
  .skeleton-footer {
    display: flex;
    justify-content: space-between;
    
    .skeleton-price {
      height: 1.5em;
      width: 80px;
    }
    
    .skeleton-rating {
      height: 1em;
      width: 60px;
    }
  }
}
```

---

## 📱 Implementation Guidelines

### Component Props Pattern

```typescript
// Base component props interface
interface BaseComponentProps {
  className?: string;
  style?: React.CSSProperties;
  'data-testid'?: string;
  children?: React.ReactNode;
}

// Variant-based props
interface VariantProps<T> {
  variant?: T;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

// State props
interface StateProps {
  disabled?: boolean;
  loading?: boolean;
  error?: boolean;
}

// Interactive props
interface InteractiveProps {
  onClick?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onKeyDown?: (event: React.KeyboardEvent) => void;
}
```

### Accessibility Implementation

```typescript
// Accessibility helper hooks
const useAccessibleFocus = () => {
  const [focusVisible, setFocusVisible] = useState(false);
  
  const handleFocus = () => setFocusVisible(true);
  const handleBlur = () => setFocusVisible(false);
  
  return {
    focusVisible,
    focusProps: {
      onFocus: handleFocus,
      onBlur: handleBlur,
      'data-focus-visible': focusVisible
    }
  };
};

// ARIA label helpers
const useAriaLabel = (label?: string, labelledBy?: string) => {
  return {
    'aria-label': label,
    'aria-labelledby': labelledBy
  };
};
```

### Component Testing Utilities

```typescript
// Testing props for components
interface TestableProps {
  'data-testid'?: string;
  'data-cy'?: string; // Cypress selector
  'data-test'?: string; // General test selector
}

// Component test helpers
export const getTestId = (component: string, variant?: string) => {
  return variant ? `${component}-${variant}` : component;
};

// Example usage
<Button 
  data-testid={getTestId('button', 'primary')}
  data-cy="book-repair-button"
>
  Book Repair
</Button>
```

---

## 🚀 Performance Optimizations

### Component Lazy Loading

```typescript
// Lazy load heavy components
const DeviceSelector = lazy(() => import('./DeviceSelector'));
const BookingWizard = lazy(() => import('./BookingWizard'));
const AnalyticsDashboard = lazy(() => import('./AnalyticsDashboard'));

// Loading fallback
const ComponentSuspense = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<ComponentSkeleton />}>
    {children}
  </Suspense>
);
```

### CSS-in-JS Optimization

```typescript
// Use CSS custom properties for dynamic styles
const Button = styled.button<ButtonProps>`
  --button-bg: ${props => `var(--color-${props.variant}-500)`};
  --button-hover-bg: ${props => `var(--color-${props.variant}-600)`};
  
  background: var(--button-bg);
  
  &:hover {
    background: var(--button-hover-bg);
  }
`;
```

### Bundle Size Optimization

```typescript
// Tree-shakeable component exports
export { Button } from './Button';
export { Input } from './Input';
export { Card } from './Card';
export type { ButtonProps, InputProps, CardProps } from './types';

// Conditional imports for platform-specific components
export const MobileComponents = {
  BottomSheet: lazy(() => import('./BottomSheet')),
  TouchButton: lazy(() => import('./TouchButton'))
};
```

---

## 🎯 Quality Standards

### Component Checklist

**Functionality**:
- [ ] Component renders correctly with all variants
- [ ] Props are properly typed with TypeScript
- [ ] Default props are set appropriately
- [ ] Error boundaries handle edge cases

**Accessibility**:
- [ ] Proper ARIA labels and roles
- [ ] Keyboard navigation support
- [ ] Screen reader compatibility
- [ ] Focus management

**Performance**:
- [ ] No unnecessary re-renders
- [ ] Proper memoization where needed
- [ ] CSS optimizations applied
- [ ] Bundle size impact measured

**Testing**:
- [ ] Unit tests cover all variants
- [ ] Integration tests for complex components
- [ ] Visual regression tests
- [ ] Accessibility tests

**Documentation**:
- [ ] Storybook stories for all variants
- [ ] Props documentation
- [ ] Usage examples
- [ ] Design tokens documented

---

**RevivaTech Component Library V2.0**: Modern, accessible, and performant components for the ultimate user experience 🧩

*This component library provides the building blocks for a premium, professional platform that delights users and drives conversions.*