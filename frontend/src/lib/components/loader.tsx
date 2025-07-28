import { ComponentType, lazy, LazyExoticComponent } from 'react';
import { ComponentConfig } from '@/types/config';
import { componentRegistry } from './registry';

export interface ComponentModule {
  default: ComponentType<any>;
  config: ComponentConfig;
}

export interface LoadedComponent {
  component: ComponentType<any>;
  config: ComponentConfig;
}

export class ComponentLoader {
  private static instance: ComponentLoader;
  private loadedComponents = new Map<string, LoadedComponent>();
  private loadingPromises = new Map<string, Promise<LoadedComponent>>();
  private componentPaths = new Map<string, string>();

  private constructor() {
    this.setupComponentPaths();
  }

  static getInstance(): ComponentLoader {
    if (!ComponentLoader.instance) {
      ComponentLoader.instance = new ComponentLoader();
    }
    return ComponentLoader.instance;
  }

  /**
   * Setup known component paths
   */
  private setupComponentPaths(): void {
    // UI Components
    this.componentPaths.set('Button', 'ui/Button');
    this.componentPaths.set('Card', 'ui/Card');
    this.componentPaths.set('Input', 'ui/Input');
    this.componentPaths.set('Select', 'ui/Select');
    this.componentPaths.set('Textarea', 'ui/Textarea');
    this.componentPaths.set('Label', 'ui/Label');
    this.componentPaths.set('Checkbox', 'ui/Checkbox');
    this.componentPaths.set('Radio', 'ui/Radio');
    this.componentPaths.set('Switch', 'ui/Switch');
    this.componentPaths.set('Slider', 'ui/Slider');
    this.componentPaths.set('Dialog', 'ui/Dialog');
    this.componentPaths.set('Dropdown', 'ui/Dropdown');
    this.componentPaths.set('Accordion', 'ui/Accordion');
    this.componentPaths.set('Tabs', 'ui/Tabs');
    this.componentPaths.set('Toast', 'ui/Toast');
    this.componentPaths.set('Tooltip', 'ui/Tooltip');
    this.componentPaths.set('Popover', 'ui/Popover');
    this.componentPaths.set('Progress', 'ui/Progress');
    this.componentPaths.set('Badge', 'ui/Badge');
    this.componentPaths.set('Avatar', 'ui/Avatar');
    this.componentPaths.set('Spinner', 'ui/Spinner');

    // Layout Components
    this.componentPaths.set('Header', 'layout/Header');
    this.componentPaths.set('Footer', 'layout/Footer');
    this.componentPaths.set('Sidebar', 'layout/Sidebar');
    this.componentPaths.set('Navigation', 'layout/Navigation');
    this.componentPaths.set('FloatingNav', 'layout/FloatingNav');
    this.componentPaths.set('Container', 'layout/Container');
    this.componentPaths.set('Grid', 'layout/Grid');
    this.componentPaths.set('Flex', 'layout/Flex');
    this.componentPaths.set('Stack', 'layout/Stack');

    // Booking Components
    this.componentPaths.set('DeviceSelection', 'booking/DeviceSelection');
    this.componentPaths.set('ModelSelection', 'booking/ModelSelection');
    this.componentPaths.set('RepairSelection', 'booking/RepairSelection');
    this.componentPaths.set('BookingForm', 'booking/BookingForm');
    this.componentPaths.set('PriceCalculator', 'booking/PriceCalculator');
    this.componentPaths.set('AppointmentCalendar', 'booking/AppointmentCalendar');
    this.componentPaths.set('BookingConfirmation', 'booking/BookingConfirmation');
    this.componentPaths.set('ProgressIndicator', 'booking/ProgressIndicator');

    // Customer Components
    this.componentPaths.set('DashboardLayout', 'customer/DashboardLayout');
    this.componentPaths.set('StatsCards', 'customer/StatsCards');
    this.componentPaths.set('QuoteCenter', 'customer/QuoteCenter');
    this.componentPaths.set('RecentActivity', 'customer/RecentActivity');
    this.componentPaths.set('RepairTracking', 'customer/RepairTracking');
    this.componentPaths.set('ProfileSettings', 'customer/ProfileSettings');

    // Admin Components
    this.componentPaths.set('AdminDashboard', 'admin/AdminDashboard');
    this.componentPaths.set('RepairQueue', 'admin/RepairQueue');
    this.componentPaths.set('CustomerList', 'admin/CustomerList');
    this.componentPaths.set('Analytics', 'admin/Analytics');
    this.componentPaths.set('InventoryManager', 'admin/InventoryManager');
    this.componentPaths.set('ChatDashboard', 'admin/ChatDashboard');

    // Chat Components
    this.componentPaths.set('ChatWidget', 'chat/ChatWidget');
    this.componentPaths.set('ChatButton', 'chat/ChatButton');
    this.componentPaths.set('MessageList', 'chat/MessageList');
    this.componentPaths.set('MessageInput', 'chat/MessageInput');
    this.componentPaths.set('FileUpload', 'chat/FileUpload');

    // Shared Components
    this.componentPaths.set('LoadingSpinner', 'shared/LoadingSpinner');
    this.componentPaths.set('ErrorBoundary', 'shared/ErrorBoundary');
    this.componentPaths.set('NotificationCenter', 'shared/NotificationCenter');
    this.componentPaths.set('ThemeToggle', 'shared/ThemeToggle');
    this.componentPaths.set('LanguageSelector', 'shared/LanguageSelector');

    // Page Components
    this.componentPaths.set('HeroSection', 'sections/HeroSection');
    this.componentPaths.set('ServiceGrid', 'sections/ServiceGrid');
    this.componentPaths.set('FeatureSection', 'sections/FeatureSection');
    this.componentPaths.set('TestimonialCarousel', 'sections/TestimonialCarousel');
    this.componentPaths.set('CTASection', 'sections/CTASection');
    this.componentPaths.set('ContactForm', 'sections/ContactForm');
    this.componentPaths.set('PricingTable', 'sections/PricingTable');
  }

  /**
   * Load component dynamically
   */
  async loadComponent(componentName: string): Promise<LoadedComponent> {
    // Check if already loaded
    const cached = this.loadedComponents.get(componentName);
    if (cached) {
      return cached;
    }

    // Check if currently loading
    const loadingPromise = this.loadingPromises.get(componentName);
    if (loadingPromise) {
      return loadingPromise;
    }

    // Start loading
    const promise = this.doLoadComponent(componentName);
    this.loadingPromises.set(componentName, promise);

    try {
      const result = await promise;
      this.loadedComponents.set(componentName, result);
      this.loadingPromises.delete(componentName);
      return result;
    } catch (error) {
      this.loadingPromises.delete(componentName);
      throw error;
    }
  }

  /**
   * Load component and register it
   */
  async loadAndRegister(componentName: string): Promise<void> {
    const loaded = await this.loadComponent(componentName);
    componentRegistry.register(loaded.config, loaded.component);
  }

  /**
   * Load multiple components
   */
  async loadComponents(componentNames: string[]): Promise<LoadedComponent[]> {
    const promises = componentNames.map(name => this.loadComponent(name));
    return Promise.all(promises);
  }

  /**
   * Load and register multiple components
   */
  async loadAndRegisterComponents(componentNames: string[]): Promise<void> {
    const promises = componentNames.map(name => this.loadAndRegister(name));
    await Promise.all(promises);
  }

  /**
   * Create lazy component
   */
  createLazyComponent(componentName: string): LazyExoticComponent<ComponentType<any>> {
    return lazy(async () => {
      const loaded = await this.loadComponent(componentName);
      return { default: loaded.component };
    });
  }

  /**
   * Preload component
   */
  preloadComponent(componentName: string): void {
    // Start loading but don't wait for it
    this.loadComponent(componentName).catch(error => {
      console.warn(`Failed to preload component ${componentName}:`, error);
    });
  }

  /**
   * Preload components for a page
   */
  preloadPageComponents(pageComponents: string[]): void {
    pageComponents.forEach(componentName => {
      this.preloadComponent(componentName);
    });
  }

  /**
   * Check if component is loaded
   */
  isLoaded(componentName: string): boolean {
    return this.loadedComponents.has(componentName);
  }

  /**
   * Check if component is loading
   */
  isLoading(componentName: string): boolean {
    return this.loadingPromises.has(componentName);
  }

  /**
   * Get loaded component names
   */
  getLoadedComponents(): string[] {
    return Array.from(this.loadedComponents.keys());
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.loadedComponents.clear();
    this.loadingPromises.clear();
  }

  /**
   * Actually load the component
   */
  private async doLoadComponent(componentName: string): Promise<LoadedComponent> {
    const componentPath = this.componentPaths.get(componentName);
    if (!componentPath) {
      throw new Error(`Unknown component: ${componentName}`);
    }

    try {
      // Dynamic import with proper error handling
      const module = await import(`@/components/${componentPath}`) as ComponentModule;
      
      if (!module.default) {
        throw new Error(`Component ${componentName} has no default export`);
      }

      if (!module.config) {
        throw new Error(`Component ${componentName} has no config export`);
      }

      return {
        component: module.default,
        config: module.config,
      };
    } catch (error) {
      console.error(`Failed to load component ${componentName} from ${componentPath}:`, error);
      
      // Return fallback component
      return {
        component: this.createFallbackComponent(componentName),
        config: this.createFallbackConfig(componentName),
      };
    }
  }

  /**
   * Create fallback component for failed loads
   */
  private createFallbackComponent(componentName: string): ComponentType<any> {
    return function FallbackComponent(props: any) {
      return (
        <div className="border border-red-200 bg-red-50 p-4 rounded-md">
          <p className="text-red-600 font-medium">
            Failed to load component: {componentName}
          </p>
          <p className="text-red-500 text-sm mt-1">
            Please check the component path and configuration.
          </p>
        </div>
      );
    };
  }

  /**
   * Create fallback config for failed loads
   */
  private createFallbackConfig(componentName: string): ComponentConfig {
    return {
      name: componentName,
      version: '1.0.0',
      description: `Fallback configuration for ${componentName}`,
      category: 'ui',
      props: {},
    };
  }
}

// Export singleton instance
export const componentLoader = ComponentLoader.getInstance();