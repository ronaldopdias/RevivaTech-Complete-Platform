// Configuration Types for RevivaTech

// Base configuration types
export interface ConfigValue {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  value: any;
  ref?: string; // Reference to another config value
}

// Component configuration
export interface ComponentConfig {
  name: string;
  version: string;
  description: string;
  category: 'ui' | 'layout' | 'form' | 'display' | 'navigation';
  props: Record<string, PropDefinition>;
  variants?: Record<string, Partial<any>>;
  slots?: Record<string, SlotDefinition>;
  events?: Record<string, EventDefinition>;
  styling?: {
    responsive?: boolean;
    themeable?: boolean;
    customizable?: string[];
  };
}

export interface PropDefinition {
  type: string;
  required?: boolean;
  default?: any;
  description?: string;
  enum?: string[];
  validation?: any;
}

export interface SlotDefinition {
  name: string;
  required?: boolean;
  allowedComponents?: string[];
}

export interface EventDefinition {
  description: string;
  payload?: string;
}

// Page configuration
export interface PageConfig {
  meta: PageMeta;
  layout: string;
  sections: SectionConfig[];
  features?: string[];
  auth?: AuthConfig;
  analytics?: AnalyticsConfig;
}

export interface PageMeta {
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string;
  robots?: string;
}

export interface SectionConfig {
  id: string;
  component: string;
  props: Record<string, any>;
  visibility?: VisibilityConfig;
  variants?: string[];
}

export interface VisibilityConfig {
  conditions?: Condition[];
  responsive?: {
    mobile?: boolean;
    tablet?: boolean;
    desktop?: boolean;
  };
}

export interface Condition {
  type: 'feature' | 'user' | 'time' | 'custom';
  operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan';
  value: any;
}

export interface AuthConfig {
  required: boolean;
  roles?: string[];
  redirectTo?: string;
}

export interface AnalyticsConfig {
  pageType: string;
  category: string;
  customDimensions?: Record<string, any>;
}

// Service configuration
export interface ServiceConfig {
  name: string;
  version: string;
  description: string;
  connection: ConnectionConfig;
  endpoints: Record<string, EndpointConfig>;
  errorHandling?: ErrorHandlingConfig;
  cache?: CacheConfig;
}

export interface ConnectionConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
  auth?: ServiceAuthConfig;
}

export interface ServiceAuthConfig {
  type: 'jwt' | 'apiKey' | 'oauth' | 'basic';
  tokenKey?: string;
  headerName?: string;
}

export interface EndpointConfig {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  params?: ParamConfig[];
  validation?: {
    body?: string;
    query?: string;
    params?: string;
  };
  cache?: CacheConfig;
}

export interface ParamConfig {
  name: string;
  type: string;
  required?: boolean;
  default?: any;
}

export interface ErrorHandlingConfig {
  retry?: RetryConfig;
  fallback?: FallbackConfig;
  logging?: LoggingConfig;
}

export interface RetryConfig {
  attempts: number;
  delay: number;
  backoff?: 'linear' | 'exponential';
  retryOn?: number[];
}

export interface FallbackConfig {
  strategy: 'cache' | 'default' | 'error';
  message?: string;
  data?: any;
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  includeStack?: boolean;
}

export interface CacheConfig {
  enabled: boolean;
  ttl?: number;
  strategy?: 'memory' | 'redis' | 'localStorage';
  invalidateOn?: string[];
}

// Theme configuration
export interface ThemeConfig {
  name: string;
  description: string;
  colors: ColorSystem;
  typography: TypographySystem;
  spacing: SpacingSystem;
  layout: LayoutSystem;
  effects: EffectsSystem;
}

export interface ColorSystem {
  primary: ColorScale;
  secondary: ColorScale;
  neutral: ColorScale;
  semantic: SemanticColors;
  custom?: Record<string, string>;
}

export interface ColorScale {
  50?: string;
  100?: string;
  200?: string;
  300?: string;
  400?: string;
  500: string; // Main color
  600?: string;
  700?: string;
  800?: string;
  900?: string;
  950?: string;
}

export interface SemanticColors {
  success: ColorVariant;
  warning: ColorVariant;
  error: ColorVariant;
  info: ColorVariant;
}

export interface ColorVariant {
  light: string;
  main: string;
  dark: string;
  contrast?: string;
}

export interface TypographySystem {
  fonts: {
    heading: string;
    body: string;
    mono: string;
  };
  sizes: Record<string, string>;
  weights: Record<string, number>;
  lineHeights: Record<string, number>;
  letterSpacing?: Record<string, string>;
}

export interface SpacingSystem {
  base: number;
  scale: Record<string, string>;
}

export interface LayoutSystem {
  breakpoints: Record<string, string>;
  container: {
    maxWidth: string;
    padding: Record<string, string>;
  };
  grid?: {
    columns: number;
    gap: string;
  };
}

export interface EffectsSystem {
  shadows: Record<string, string>;
  radii: Record<string, string>;
  transitions: Record<string, string>;
  blurs?: Record<string, string>;
}

// Content configuration
export interface ContentConfig {
  locale: string;
  namespace: string;
  content: Record<string, ContentItem | ContentGroup>;
}

export type ContentItem = string | RichText | MediaContent;

export interface ContentGroup {
  [key: string]: ContentItem | ContentGroup;
}

export interface RichText {
  type: 'richtext';
  content: string;
  format?: 'markdown' | 'html';
}

export interface MediaContent {
  type: 'image' | 'video';
  src: string;
  alt?: string;
  caption?: string;
}

// Feature flags
export interface FeatureFlag {
  name: string;
  description: string;
  enabled: boolean;
  rollout?: RolloutConfig;
  config?: Record<string, any>;
  dependencies?: string[];
  expires?: string;
}

export interface RolloutConfig {
  strategy: 'all' | 'percentage' | 'users' | 'custom';
  percentage?: number;
  users?: string[];
  conditions?: Condition[];
}

// Environment configuration
export interface EnvironmentConfig {
  name: string;
  api: ApiEnvironmentConfig;
  features?: Partial<Record<string, boolean>>;
  services: Record<string, ServiceEnvironmentConfig>;
  security: SecurityConfig;
  monitoring: MonitoringConfig;
}

export interface ApiEnvironmentConfig {
  baseURL: string;
  version: string;
  timeout: number;
}

export interface ServiceEnvironmentConfig {
  url?: string;
  enabled?: boolean;
  config?: Record<string, any>;
}

export interface SecurityConfig {
  cors: CORSConfig;
  rateLimit: RateLimitConfig;
  encryption?: EncryptionConfig;
}

export interface CORSConfig {
  origins: string[];
  credentials: boolean;
  maxAge?: number;
}

export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
}

export interface EncryptionConfig {
  algorithm: string;
  keyRotation?: string;
}

export interface MonitoringConfig {
  enabled: boolean;
  services: string[];
  config?: Record<string, any>;
}

// App configuration
export interface AppConfig {
  site: SiteConfig;
  features: Record<string, FeatureFlag>;
  theme: ThemeConfig;
  api: ApiConfig;
  integrations: Record<string, IntegrationConfig>;
}

export interface SiteConfig {
  name: string;
  tagline: string;
  logo: string;
  favicon: string;
  languages: Language[];
  defaultLanguage: string;
}

export interface Language {
  code: string;
  name: string;
  flag?: string;
  enabled: boolean;
}

export interface ApiConfig {
  endpoints: Record<string, string>;
  timeout: number;
  retryPolicy: RetryConfig;
}

export interface IntegrationConfig {
  enabled: boolean;
  config: Record<string, any>;
}

// Route configuration
export interface RouteConfig {
  path: string;
  page: string;
  exact?: boolean;
  middleware?: string[];
  subroutes?: RouteConfig[];
  dynamic?: boolean;
}

// Reference system
export interface ConfigReference {
  path: string;
  fallback?: any;
}

// Validation schemas
export interface ValidationSchema {
  type: string;
  properties?: Record<string, ValidationSchema>;
  required?: string[];
  enum?: any[];
  min?: number;
  max?: number;
  pattern?: string;
  format?: string;
}