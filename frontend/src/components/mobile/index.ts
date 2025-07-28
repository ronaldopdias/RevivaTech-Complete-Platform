// Phase D5: Mobile Experience Excellence Components
// Native app-like mobile experience components

export { MobileNavigation } from './MobileNavigation';
export { 
  TouchButton, 
  SwipeableCard, 
  PullToRefresh, 
  TouchGesture 
} from './TouchOptimized';
export { 
  CameraIntegration, 
  BottomSheet, 
  haptics, 
  deviceInfo 
} from './NativeFeatures';
export { 
  MobileCardStack, 
  MobileProgressSteps, 
  MobileActionSheet, 
  MobileTabSwitcher 
} from './MobilePatterns';

// Re-export everything as default for convenience
export default {
  // Navigation
  MobileNavigation,
  
  // Touch Interactions
  TouchButton,
  SwipeableCard,
  PullToRefresh,
  TouchGesture,
  
  // Native Features
  CameraIntegration,
  BottomSheet,
  haptics,
  deviceInfo,
  
  // Mobile Patterns
  MobileCardStack,
  MobileProgressSteps,
  MobileActionSheet,
  MobileTabSwitcher,
};