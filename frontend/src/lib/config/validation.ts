import { z } from 'zod';

// Base schemas for configuration validation

// Color validation
export const ColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$|^rgb\(|^rgba\(|^hsl\(|^hsla\(/);

// Color scale schema
export const ColorScaleSchema = z.object({
  50: ColorSchema.optional(),
  100: ColorSchema.optional(),
  200: ColorSchema.optional(),
  300: ColorSchema.optional(),
  400: ColorSchema.optional(),
  500: ColorSchema,
  600: ColorSchema.optional(),
  700: ColorSchema.optional(),
  800: ColorSchema.optional(),
  900: ColorSchema.optional(),
  950: ColorSchema.optional(),
});

// Color variant schema
export const ColorVariantSchema = z.object({
  light: ColorSchema,
  main: ColorSchema,
  dark: ColorSchema,
  contrast: ColorSchema.optional(),
});

// Typography schema
export const TypographySystemSchema = z.object({
  fonts: z.object({
    heading: z.string(),
    body: z.string(),
    mono: z.string(),
  }),
  sizes: z.record(z.string(), z.string()),
  weights: z.record(z.string(), z.number()),
  lineHeights: z.record(z.string(), z.number()),
  letterSpacing: z.record(z.string(), z.string()).optional(),
});

// Spacing schema
export const SpacingSystemSchema = z.object({
  base: z.number(),
  scale: z.record(z.string(), z.string()),
});

// Layout schema
export const LayoutSystemSchema = z.object({
  breakpoints: z.record(z.string(), z.string()),
  container: z.object({
    maxWidth: z.string(),
    padding: z.record(z.string(), z.string()),
  }),
  grid: z.object({
    columns: z.number(),
    gap: z.string(),
  }).optional(),
});

// Effects schema
export const EffectsSystemSchema = z.object({
  shadows: z.record(z.string(), z.string()),
  radii: z.record(z.string(), z.string()),
  transitions: z.record(z.string(), z.string()),
  blurs: z.record(z.string(), z.string()).optional(),
});

// Theme configuration schema
export const ThemeConfigSchema = z.object({
  name: z.string(),
  description: z.string(),
  colors: z.object({
    primary: ColorScaleSchema,
    secondary: ColorScaleSchema,
    neutral: ColorScaleSchema,
    semantic: z.object({
      success: ColorVariantSchema,
      warning: ColorVariantSchema,
      error: ColorVariantSchema,
      info: ColorVariantSchema,
    }),
    custom: z.record(z.string(), ColorSchema).optional(),
  }),
  typography: TypographySystemSchema,
  spacing: SpacingSystemSchema,
  layout: LayoutSystemSchema,
  effects: EffectsSystemSchema,
});

// Component schemas
export const PropDefinitionSchema = z.object({
  type: z.string(),
  required: z.boolean().optional(),
  default: z.any().optional(),
  description: z.string().optional(),
  enum: z.array(z.string()).optional(),
  validation: z.any().optional(),
});

export const SlotDefinitionSchema = z.object({
  name: z.string(),
  required: z.boolean().optional(),
  allowedComponents: z.array(z.string()).optional(),
});

export const EventDefinitionSchema = z.object({
  description: z.string(),
  payload: z.string().optional(),
});

export const ComponentConfigSchema = z.object({
  name: z.string(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  description: z.string(),
  category: z.enum(['ui', 'layout', 'form', 'display', 'navigation']),
  props: z.record(z.string(), PropDefinitionSchema),
  variants: z.record(z.string(), z.any()).optional(),
  slots: z.record(z.string(), SlotDefinitionSchema).optional(),
  events: z.record(z.string(), EventDefinitionSchema).optional(),
  styling: z.object({
    responsive: z.boolean().optional(),
    themeable: z.boolean().optional(),
    customizable: z.array(z.string()).optional(),
  }).optional(),
});

// Page configuration schemas
export const PageMetaSchema = z.object({
  title: z.string(),
  description: z.string(),
  keywords: z.array(z.string()).optional(),
  ogImage: z.string().optional(),
  robots: z.string().optional(),
});

export const ConditionSchema = z.object({
  type: z.enum(['feature', 'user', 'time', 'custom']),
  operator: z.enum(['equals', 'notEquals', 'contains', 'greaterThan', 'lessThan']),
  value: z.any(),
});

export const VisibilityConfigSchema = z.object({
  conditions: z.array(ConditionSchema).optional(),
  responsive: z.object({
    mobile: z.boolean().optional(),
    tablet: z.boolean().optional(),
    desktop: z.boolean().optional(),
  }).optional(),
});

export const SectionConfigSchema = z.object({
  id: z.string(),
  component: z.string(),
  props: z.record(z.string(), z.any()),
  visibility: VisibilityConfigSchema.optional(),
  variants: z.array(z.string()).optional(),
});

export const AuthConfigSchema = z.object({
  required: z.boolean(),
  roles: z.array(z.string()).optional(),
  redirectTo: z.string().optional(),
});

export const AnalyticsConfigSchema = z.object({
  pageType: z.string(),
  category: z.string(),
  customDimensions: z.record(z.string(), z.any()).optional(),
});

export const PageConfigSchema = z.object({
  meta: PageMetaSchema,
  layout: z.string(),
  sections: z.array(SectionConfigSchema),
  features: z.array(z.string()).optional(),
  auth: AuthConfigSchema.optional(),
  analytics: AnalyticsConfigSchema.optional(),
});

// Service configuration schemas
export const ServiceAuthConfigSchema = z.object({
  type: z.enum(['jwt', 'apiKey', 'oauth', 'basic']),
  tokenKey: z.string().optional(),
  headerName: z.string().optional(),
});

export const ConnectionConfigSchema = z.object({
  baseURL: z.string(),
  timeout: z.number().optional(),
  headers: z.record(z.string(), z.string()).optional(),
  auth: ServiceAuthConfigSchema.optional(),
});

export const CacheConfigSchema = z.object({
  enabled: z.boolean(),
  ttl: z.number().optional(),
  strategy: z.enum(['memory', 'redis', 'localStorage']).optional(),
  invalidateOn: z.array(z.string()).optional(),
});

export const ParamConfigSchema = z.object({
  name: z.string(),
  type: z.string(),
  required: z.boolean().optional(),
  default: z.any().optional(),
});

export const EndpointConfigSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  path: z.string(),
  params: z.array(ParamConfigSchema).optional(),
  validation: z.object({
    body: z.string().optional(),
    query: z.string().optional(),
    params: z.string().optional(),
  }).optional(),
  cache: CacheConfigSchema.optional(),
});

export const RetryConfigSchema = z.object({
  attempts: z.number(),
  delay: z.number(),
  backoff: z.enum(['linear', 'exponential']).optional(),
  retryOn: z.array(z.number()).optional(),
});

export const FallbackConfigSchema = z.object({
  strategy: z.enum(['cache', 'default', 'error']),
  message: z.string().optional(),
  data: z.any().optional(),
});

export const LoggingConfigSchema = z.object({
  level: z.enum(['debug', 'info', 'warn', 'error']),
  includeStack: z.boolean().optional(),
});

export const ErrorHandlingConfigSchema = z.object({
  retry: RetryConfigSchema.optional(),
  fallback: FallbackConfigSchema.optional(),
  logging: LoggingConfigSchema.optional(),
});

export const ServiceConfigSchema = z.object({
  name: z.string(),
  version: z.string(),
  description: z.string(),
  connection: ConnectionConfigSchema,
  endpoints: z.record(z.string(), EndpointConfigSchema),
  errorHandling: ErrorHandlingConfigSchema.optional(),
  cache: CacheConfigSchema.optional(),
});

// Feature flag schemas
export const RolloutConfigSchema = z.object({
  strategy: z.enum(['all', 'percentage', 'users', 'custom']),
  percentage: z.number().optional(),
  users: z.array(z.string()).optional(),
  conditions: z.array(ConditionSchema).optional(),
});

export const FeatureFlagSchema = z.object({
  name: z.string(),
  description: z.string(),
  enabled: z.boolean(),
  rollout: RolloutConfigSchema.optional(),
  config: z.record(z.string(), z.any()).optional(),
  dependencies: z.array(z.string()).optional(),
  expires: z.string().optional(),
});

// Environment configuration schemas
export const CORSConfigSchema = z.object({
  origins: z.array(z.string()),
  credentials: z.boolean(),
  maxAge: z.number().optional(),
});

export const RateLimitConfigSchema = z.object({
  windowMs: z.number(),
  max: z.number(),
  message: z.string().optional(),
});

export const EncryptionConfigSchema = z.object({
  algorithm: z.string(),
  keyRotation: z.string().optional(),
});

export const SecurityConfigSchema = z.object({
  cors: CORSConfigSchema,
  rateLimit: RateLimitConfigSchema,
  encryption: EncryptionConfigSchema.optional(),
});

export const MonitoringConfigSchema = z.object({
  enabled: z.boolean(),
  services: z.array(z.string()),
  config: z.record(z.string(), z.any()).optional(),
});

export const ApiEnvironmentConfigSchema = z.object({
  baseURL: z.string(),
  version: z.string(),
  timeout: z.number(),
});

export const ServiceEnvironmentConfigSchema = z.object({
  url: z.string().optional(),
  enabled: z.boolean().optional(),
  config: z.record(z.string(), z.any()).optional(),
});

export const EnvironmentConfigSchema = z.object({
  name: z.string(),
  api: ApiEnvironmentConfigSchema,
  features: z.record(z.string(), z.boolean()).optional(),
  services: z.record(z.string(), ServiceEnvironmentConfigSchema),
  security: SecurityConfigSchema,
  monitoring: MonitoringConfigSchema,
});

// App configuration schemas
export const LanguageSchema = z.object({
  code: z.string(),
  name: z.string(),
  flag: z.string().optional(),
  enabled: z.boolean(),
});

export const SiteConfigSchema = z.object({
  name: z.string(),
  tagline: z.string(),
  logo: z.string(),
  favicon: z.string(),
  languages: z.array(LanguageSchema),
  defaultLanguage: z.string(),
});

export const IntegrationConfigSchema = z.object({
  enabled: z.boolean(),
  config: z.record(z.string(), z.any()),
});

export const ApiConfigSchema = z.object({
  endpoints: z.record(z.string(), z.string()),
  timeout: z.number(),
  retryPolicy: RetryConfigSchema,
});

export const AppConfigSchema = z.object({
  site: SiteConfigSchema,
  features: z.record(z.string(), FeatureFlagSchema),
  theme: ThemeConfigSchema,
  api: ApiConfigSchema,
  integrations: z.record(z.string(), IntegrationConfigSchema),
});

// Route configuration schema
export const RouteConfigSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    path: z.string(),
    page: z.string(),
    exact: z.boolean().optional(),
    middleware: z.array(z.string()).optional(),
    subroutes: z.array(RouteConfigSchema).optional(),
    dynamic: z.boolean().optional(),
  })
);

// Content configuration schemas
export const RichTextSchema = z.object({
  type: z.literal('richtext'),
  content: z.string(),
  format: z.enum(['markdown', 'html']).optional(),
});

export const MediaContentSchema = z.object({
  type: z.enum(['image', 'video']),
  src: z.string(),
  alt: z.string().optional(),
  caption: z.string().optional(),
});

export const ContentItemSchema = z.union([
  z.string(),
  RichTextSchema,
  MediaContentSchema,
]);

export const ContentGroupSchema: z.ZodType<any> = z.lazy(() =>
  z.record(z.string(), z.union([ContentItemSchema, ContentGroupSchema]))
);

export const ContentConfigSchema = z.object({
  locale: z.string(),
  namespace: z.string(),
  content: z.record(z.string(), z.union([ContentItemSchema, ContentGroupSchema])),
});

// Validation helper functions
export function validateConfig<T>(config: unknown, schema: z.ZodSchema<T>): T {
  try {
    return schema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Configuration validation failed:', error.issues);
      throw new Error(`Invalid configuration: ${JSON.stringify(error.issues)}`);
    }
    throw error;
  }
}

export function isValidConfig<T>(config: unknown, schema: z.ZodSchema<T>): boolean {
  try {
    schema.parse(config);
    return true;
  } catch {
    return false;
  }
}

export function getConfigErrors<T>(config: unknown, schema: z.ZodSchema<T>): z.ZodError | null {
  try {
    schema.parse(config);
    return null;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error;
    }
    return null;
  }
}