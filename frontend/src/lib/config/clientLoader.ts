// Client-side config loader that doesn't use filesystem
import { ThemeConfig } from '@/types/config';

// Mock theme configuration for client-side usage
const mockThemeConfig: ThemeConfig = {
  name: 'nordic',
  description: 'Nordic design theme with Apple-inspired aesthetics',
  colors: {
    primary: {
      50: '#EBF5FF',
      100: '#DBEAFE',
      200: '#BFDBFE',
      300: '#93C5FD',
      400: '#60A5FA',
      500: '#007AFF',
      600: '#1E40AF',
      700: '#1E3A8A',
      800: '#1E3A8A',
      900: '#1E3A8A',
    },
    secondary: {
      50: '#F3F4F6',
      100: '#E5E7EB',
      200: '#D1D5DB',
      300: '#9CA3AF',
      400: '#6B7280',
      500: '#5856D6',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
    },
    neutral: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#1D1D1F',
    },
    semantic: {
      success: {
        light: '#D1FAE5',
        main: '#10B981',
        dark: '#047857',
      },
      warning: {
        light: '#FEF3C7',
        main: '#F59E0B',
        dark: '#D97706',
      },
      error: {
        light: '#FEE2E2',
        main: '#EF4444',
        dark: '#DC2626',
      },
      info: {
        light: '#DBEAFE',
        main: '#3B82F6',
        dark: '#1D4ED8',
      },
    },
  },
  typography: {
    fonts: {
      heading: 'SF Pro Display, Inter, system-ui, sans-serif',
      body: 'SF Pro Text, Inter, system-ui, sans-serif',
      mono: 'SF Mono, Monaco, monospace',
    },
    sizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
    },
    weights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeights: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  spacing: {
    base: 8,
    scale: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
      '2xl': '3rem',
      '3xl': '4rem',
    },
  },
  layout: {
    breakpoints: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    container: {
      maxWidth: '1200px',
      padding: {
        sm: '1rem',
        md: '1.5rem',
        lg: '2rem',
      },
    },
    grid: {
      columns: 12,
      gap: '1rem',
    },
  },
  effects: {
    shadows: {
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
      xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
    },
    radii: {
      sm: '0.25rem',
      md: '0.375rem',
      lg: '0.5rem',
      xl: '0.75rem',
    },
    transitions: {
      fast: 'all 150ms ease',
      normal: 'all 250ms ease',
      slow: 'all 400ms ease',
    },
    blurs: {
      sm: '4px',
      md: '8px',
      lg: '16px',
      xl: '24px',
    },
  },
};

export class ClientConfigLoader {
  private static instance: ClientConfigLoader;
  private themeConfig: ThemeConfig = mockThemeConfig;

  private constructor() {}

  static getInstance(): ClientConfigLoader {
    if (!ClientConfigLoader.instance) {
      ClientConfigLoader.instance = new ClientConfigLoader();
    }
    return ClientConfigLoader.instance;
  }

  async loadThemeConfig(themeName: string = 'nordic'): Promise<ThemeConfig> {
    // In a real implementation, this would make an API call to load theme config
    // For now, return the mock config
    return Promise.resolve(this.themeConfig);
  }
}

export const clientConfigLoader = ClientConfigLoader.getInstance();