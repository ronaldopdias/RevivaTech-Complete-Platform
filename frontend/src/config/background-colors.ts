// Background color configurations for AnimatedStarsBackground component
// Easy customization for developers

export interface BackgroundColorTheme {
  name: string;
  primaryColor: string;
  secondaryColor: string;
  description: string;
}

export const backgroundColorThemes: Record<string, BackgroundColorTheme> = {
  // Default theme - neutral whites
  default: {
    name: 'Default White',
    primaryColor: '#ffffff',
    secondaryColor: '#e0e7ff',
    description: 'Clean white stars with light blue accents'
  },

  // Brand themes
  revivatech: {
    name: 'RevivaTech Brand',
    primaryColor: '#0EA5E9', // Primary blue
    secondaryColor: '#14B8A6', // Secondary teal
    description: 'RevivaTech brand colors - optimized for performance'
  },

  // Nature themes
  ocean: {
    name: 'Ocean',
    primaryColor: '#3B82F6',
    secondaryColor: '#06B6D4',
    description: 'Ocean blue gradient'
  },

  sunset: {
    name: 'Sunset',
    primaryColor: '#F59E0B',
    secondaryColor: '#EF4444',
    description: 'Warm sunset colors'
  },

  forest: {
    name: 'Forest',
    primaryColor: '#10B981',
    secondaryColor: '#059669',
    description: 'Forest green tones'
  },

  // Elegant themes
  purple: {
    name: 'Purple',
    primaryColor: '#8B5CF6',
    secondaryColor: '#A855F7',
    description: 'Elegant purple gradient'
  },

  rose: {
    name: 'Rose',
    primaryColor: '#F43F5E',
    secondaryColor: '#EC4899',
    description: 'Romantic rose tones'
  },

  // Professional themes
  corporate: {
    name: 'Corporate',
    primaryColor: '#6B7280',
    secondaryColor: '#9CA3AF',
    description: 'Professional gray tones'
  },

  tech: {
    name: 'Tech',
    primaryColor: '#06B6D4',
    secondaryColor: '#8B5CF6',
    description: 'Modern tech gradient'
  }
};

// Helper function to get theme colors
export const getBackgroundTheme = (themeName: string): BackgroundColorTheme => {
  return backgroundColorThemes[themeName] || backgroundColorThemes.default;
};

// Pre-configured theme props for easy use
export const getThemeProps = (themeName: string) => {
  const theme = getBackgroundTheme(themeName);
  return {
    primaryColor: theme.primaryColor,
    secondaryColor: theme.secondaryColor
  };
};