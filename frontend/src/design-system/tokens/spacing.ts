/**
 * Design System V2 - Spacing & Layout Token System
 * Comprehensive spacing system with responsive scaling and layout utilities
 */

export interface SpacingScale {
  0: string;
  px: string;
  0.5: string;
  1: string;
  1.5: string;
  2: string;
  2.5: string;
  3: string;
  3.5: string;
  4: string;
  5: string;
  6: string;
  7: string;
  8: string;
  9: string;
  10: string;
  11: string;
  12: string;
  14: string;
  16: string;
  20: string;
  24: string;
  28: string;
  32: string;
  36: string;
  40: string;
  44: string;
  48: string;
  52: string;
  56: string;
  60: string;
  64: string;
  72: string;
  80: string;
  96: string;
}

export interface BreakpointScale {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
}

export interface ContainerConfig {
  center: boolean;
  padding: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
  };
  maxWidth: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
  };
}

export interface GridSystem {
  columns: number;
  gap: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  gutters: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}

export interface SpacingTokens {
  // Base spacing scale
  scale: SpacingScale;
  
  // Responsive breakpoints
  breakpoints: BreakpointScale;
  
  // Container configuration
  container: ContainerConfig;
  
  // Grid system
  grid: GridSystem;
  
  // Component spacing
  component: {
    // Button spacing
    button: {
      paddingX: {
        xs: string;
        sm: string;
        md: string;
        lg: string;
        xl: string;
      };
      paddingY: {
        xs: string;
        sm: string;
        md: string;
        lg: string;
        xl: string;
      };
      gap: string;
    };
    
    // Input spacing
    input: {
      paddingX: string;
      paddingY: string;
      gap: string;
    };
    
    // Card spacing
    card: {
      padding: {
        xs: string;
        sm: string;
        md: string;
        lg: string;
        xl: string;
      };
      gap: string;
    };
    
    // Navigation spacing
    navigation: {
      padding: string;
      gap: string;
      itemPadding: string;
    };
    
    // Form spacing
    form: {
      fieldGap: string;
      groupGap: string;
      sectionGap: string;
    };
    
    // Layout spacing
    layout: {
      sectionGap: string;
      componentGap: string;
      elementGap: string;
    };
  };
  
  // Semantic spacing
  semantic: {
    // Content spacing
    content: {
      paragraphGap: string;
      headingGap: string;
      listGap: string;
      blockGap: string;
    };
    
    // Interactive spacing
    interactive: {
      clickTarget: string;
      touchTarget: string;
      hoverArea: string;
    };
    
    // Visual spacing
    visual: {
      minSeparation: string;
      optimalSeparation: string;
      maxSeparation: string;
    };
  };
  
  // Responsive multipliers
  responsive: {
    mobile: {
      scale: number;
      touchMultiplier: number;
    };
    tablet: {
      scale: number;
      touchMultiplier: number;
    };
    desktop: {
      scale: number;
      touchMultiplier: number;
    };
  };
}

// 8px base spacing system
const baseUnit = 4; // 4px base unit for more granular control

// Spacing scale using 4px base unit
export const spacingSystem: SpacingTokens = {
  scale: {
    0: '0',
    px: '1px',
    0.5: `${baseUnit * 0.5}px`,    // 2px
    1: `${baseUnit * 1}px`,        // 4px
    1.5: `${baseUnit * 1.5}px`,    // 6px
    2: `${baseUnit * 2}px`,        // 8px
    2.5: `${baseUnit * 2.5}px`,    // 10px
    3: `${baseUnit * 3}px`,        // 12px
    3.5: `${baseUnit * 3.5}px`,    // 14px
    4: `${baseUnit * 4}px`,        // 16px
    5: `${baseUnit * 5}px`,        // 20px
    6: `${baseUnit * 6}px`,        // 24px
    7: `${baseUnit * 7}px`,        // 28px
    8: `${baseUnit * 8}px`,        // 32px
    9: `${baseUnit * 9}px`,        // 36px
    10: `${baseUnit * 10}px`,      // 40px
    11: `${baseUnit * 11}px`,      // 44px
    12: `${baseUnit * 12}px`,      // 48px
    14: `${baseUnit * 14}px`,      // 56px
    16: `${baseUnit * 16}px`,      // 64px
    20: `${baseUnit * 20}px`,      // 80px
    24: `${baseUnit * 24}px`,      // 96px
    28: `${baseUnit * 28}px`,      // 112px
    32: `${baseUnit * 32}px`,      // 128px
    36: `${baseUnit * 36}px`,      // 144px
    40: `${baseUnit * 40}px`,      // 160px
    44: `${baseUnit * 44}px`,      // 176px
    48: `${baseUnit * 48}px`,      // 192px
    52: `${baseUnit * 52}px`,      // 208px
    56: `${baseUnit * 56}px`,      // 224px
    60: `${baseUnit * 60}px`,      // 240px
    64: `${baseUnit * 64}px`,      // 256px
    72: `${baseUnit * 72}px`,      // 288px
    80: `${baseUnit * 80}px`,      // 320px
    96: `${baseUnit * 96}px`,      // 384px
  },
  
  breakpoints: {
    xs: '475px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
    '3xl': '1920px',
  },
  
  container: {
    center: true,
    padding: {
      xs: '1rem',
      sm: '1.5rem',
      md: '2rem',
      lg: '2.5rem',
      xl: '3rem',
      '2xl': '3.5rem',
    },
    maxWidth: {
      xs: '100%',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
      '3xl': '1920px',
    },
  },
  
  grid: {
    columns: 12,
    gap: {
      xs: '1rem',
      sm: '1.5rem',
      md: '2rem',
      lg: '2.5rem',
      xl: '3rem',
    },
    gutters: {
      xs: '1rem',
      sm: '1.5rem',
      md: '2rem',
      lg: '2.5rem',
      xl: '3rem',
    },
  },
  
  component: {
    button: {
      paddingX: {
        xs: '0.5rem',
        sm: '0.75rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
      },
      paddingY: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.25rem',
      },
      gap: '0.5rem',
    },
    
    input: {
      paddingX: '0.75rem',
      paddingY: '0.5rem',
      gap: '0.5rem',
    },
    
    card: {
      padding: {
        xs: '1rem',
        sm: '1.5rem',
        md: '2rem',
        lg: '2.5rem',
        xl: '3rem',
      },
      gap: '1rem',
    },
    
    navigation: {
      padding: '1rem',
      gap: '0.5rem',
      itemPadding: '0.5rem',
    },
    
    form: {
      fieldGap: '1rem',
      groupGap: '1.5rem',
      sectionGap: '2rem',
    },
    
    layout: {
      sectionGap: '3rem',
      componentGap: '2rem',
      elementGap: '1rem',
    },
  },
  
  semantic: {
    content: {
      paragraphGap: '1rem',
      headingGap: '1.5rem',
      listGap: '0.5rem',
      blockGap: '2rem',
    },
    
    interactive: {
      clickTarget: '44px',
      touchTarget: '48px',
      hoverArea: '52px',
    },
    
    visual: {
      minSeparation: '0.5rem',
      optimalSeparation: '1rem',
      maxSeparation: '2rem',
    },
  },
  
  responsive: {
    mobile: {
      scale: 0.875,
      touchMultiplier: 1.2,
    },
    tablet: {
      scale: 0.95,
      touchMultiplier: 1.1,
    },
    desktop: {
      scale: 1,
      touchMultiplier: 1,
    },
  },
};

// Spacing utility functions
export const spacingUtils = {
  // Convert rem to px
  remToPx: (rem: string) => {
    const value = parseFloat(rem);
    return `${value * 16}px`;
  },
  
  // Convert px to rem
  pxToRem: (px: string) => {
    const value = parseFloat(px);
    return `${value / 16}rem`;
  },
  
  // Get responsive spacing
  getResponsiveSpacing: (baseSpacing: string, breakpoint: 'mobile' | 'tablet' | 'desktop') => {
    const scale = spacingSystem.responsive[breakpoint].scale;
    const value = parseFloat(baseSpacing);
    return `${value * scale}rem`;
  },
  
  // Get touch-optimized spacing
  getTouchSpacing: (baseSpacing: string, breakpoint: 'mobile' | 'tablet' | 'desktop') => {
    const multiplier = spacingSystem.responsive[breakpoint].touchMultiplier;
    const value = parseFloat(baseSpacing);
    return `${value * multiplier}rem`;
  },
  
  // Calculate optimal spacing based on content
  calculateOptimalSpacing: (contentType: 'text' | 'interactive' | 'visual') => {
    switch (contentType) {
      case 'text':
        return spacingSystem.semantic.content.paragraphGap;
      case 'interactive':
        return spacingSystem.semantic.interactive.clickTarget;
      case 'visual':
        return spacingSystem.semantic.visual.optimalSeparation;
      default:
        return spacingSystem.semantic.visual.optimalSeparation;
    }
  },
  
  // Get container padding for breakpoint
  getContainerPadding: (breakpoint: keyof typeof spacingSystem.container.padding) => {
    return spacingSystem.container.padding[breakpoint];
  },
  
  // Get grid gap for breakpoint
  getGridGap: (breakpoint: keyof typeof spacingSystem.grid.gap) => {
    return spacingSystem.grid.gap[breakpoint];
  },
  
  // Validate spacing value
  validateSpacing: (value: string) => {
    const validUnits = ['px', 'rem', 'em', '%', 'vh', 'vw'];
    const unit = value.replace(/[0-9.-]/g, '');
    return validUnits.includes(unit) && !isNaN(parseFloat(value));
  },
  
  // Get spacing scale array
  getSpacingScale: () => {
    return Object.values(spacingSystem.scale);
  },
  
  // Calculate golden ratio spacing
  getGoldenRatioSpacing: (baseSize: number) => {
    const golden = 1.618;
    return {
      smaller: `${baseSize / golden}rem`,
      base: `${baseSize}rem`,
      larger: `${baseSize * golden}rem`,
    };
  },
};

// CSS custom properties generator
export const generateSpacingCSS = () => {
  const { scale, breakpoints, container, grid, component, semantic } = spacingSystem;
  
  let css = '/* Spacing Scale */\n';
  Object.entries(scale).forEach(([key, value]) => {
    css += `  --spacing-${key}: ${value};\n`;
  });
  
  css += '\n/* Breakpoints */\n';
  Object.entries(breakpoints).forEach(([key, value]) => {
    css += `  --breakpoint-${key}: ${value};\n`;
  });
  
  css += '\n/* Container */\n';
  Object.entries(container.padding).forEach(([key, value]) => {
    css += `  --container-padding-${key}: ${value};\n`;
  });
  
  Object.entries(container.maxWidth).forEach(([key, value]) => {
    css += `  --container-max-width-${key}: ${value};\n`;
  });
  
  css += '\n/* Grid */\n';
  css += `  --grid-columns: ${grid.columns};\n`;
  Object.entries(grid.gap).forEach(([key, value]) => {
    css += `  --grid-gap-${key}: ${value};\n`;
  });
  
  Object.entries(grid.gutters).forEach(([key, value]) => {
    css += `  --grid-gutter-${key}: ${value};\n`;
  });
  
  css += '\n/* Component Spacing */\n';
  
  // Button spacing
  Object.entries(component.button.paddingX).forEach(([key, value]) => {
    css += `  --button-padding-x-${key}: ${value};\n`;
  });
  Object.entries(component.button.paddingY).forEach(([key, value]) => {
    css += `  --button-padding-y-${key}: ${value};\n`;
  });
  css += `  --button-gap: ${component.button.gap};\n`;
  
  // Input spacing
  css += `  --input-padding-x: ${component.input.paddingX};\n`;
  css += `  --input-padding-y: ${component.input.paddingY};\n`;
  css += `  --input-gap: ${component.input.gap};\n`;
  
  // Card spacing
  Object.entries(component.card.padding).forEach(([key, value]) => {
    css += `  --card-padding-${key}: ${value};\n`;
  });
  css += `  --card-gap: ${component.card.gap};\n`;
  
  // Navigation spacing
  css += `  --navigation-padding: ${component.navigation.padding};\n`;
  css += `  --navigation-gap: ${component.navigation.gap};\n`;
  css += `  --navigation-item-padding: ${component.navigation.itemPadding};\n`;
  
  // Form spacing
  css += `  --form-field-gap: ${component.form.fieldGap};\n`;
  css += `  --form-group-gap: ${component.form.groupGap};\n`;
  css += `  --form-section-gap: ${component.form.sectionGap};\n`;
  
  // Layout spacing
  css += `  --layout-section-gap: ${component.layout.sectionGap};\n`;
  css += `  --layout-component-gap: ${component.layout.componentGap};\n`;
  css += `  --layout-element-gap: ${component.layout.elementGap};\n`;
  
  css += '\n/* Semantic Spacing */\n';
  
  // Content spacing
  css += `  --content-paragraph-gap: ${semantic.content.paragraphGap};\n`;
  css += `  --content-heading-gap: ${semantic.content.headingGap};\n`;
  css += `  --content-list-gap: ${semantic.content.listGap};\n`;
  css += `  --content-block-gap: ${semantic.content.blockGap};\n`;
  
  // Interactive spacing
  css += `  --interactive-click-target: ${semantic.interactive.clickTarget};\n`;
  css += `  --interactive-touch-target: ${semantic.interactive.touchTarget};\n`;
  css += `  --interactive-hover-area: ${semantic.interactive.hoverArea};\n`;
  
  // Visual spacing
  css += `  --visual-min-separation: ${semantic.visual.minSeparation};\n`;
  css += `  --visual-optimal-separation: ${semantic.visual.optimalSeparation};\n`;
  css += `  --visual-max-separation: ${semantic.visual.maxSeparation};\n`;
  
  return css;
};

// Layout utility classes
export const layoutUtilities = {
  // Container utilities
  container: {
    base: 'w-full mx-auto px-4 sm:px-6 lg:px-8',
    fluid: 'w-full mx-auto px-4 sm:px-6 lg:px-8',
    constrained: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  },
  
  // Grid utilities
  grid: {
    base: 'grid',
    responsive: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    auto: 'grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))]',
    masonry: 'columns-1 md:columns-2 lg:columns-3',
  },
  
  // Flex utilities
  flex: {
    center: 'flex items-center justify-center',
    between: 'flex items-center justify-between',
    start: 'flex items-start justify-start',
    end: 'flex items-end justify-end',
    column: 'flex flex-col',
    columnCenter: 'flex flex-col items-center justify-center',
  },
  
  // Spacing utilities
  spacing: {
    stack: 'space-y-4',
    stackLg: 'space-y-6',
    stackXl: 'space-y-8',
    inline: 'space-x-4',
    inlineLg: 'space-x-6',
    inlineXl: 'space-x-8',
  },
};

export default spacingSystem;