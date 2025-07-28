/**
 * Design System V2 - Typography Token System
 * Enhanced typography system with responsive scaling and accessibility
 */

export interface FontFamily {
  display: string;
  body: string;
  mono: string;
  system: string;
}

export interface FontWeight {
  thin: number;
  extralight: number;
  light: number;
  normal: number;
  medium: number;
  semibold: number;
  bold: number;
  extrabold: number;
  black: number;
}

export interface FontSize {
  xs: string;
  sm: string;
  base: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  '4xl': string;
  '5xl': string;
  '6xl': string;
  '7xl': string;
  '8xl': string;
  '9xl': string;
}

export interface LineHeight {
  none: number;
  tight: number;
  snug: number;
  normal: number;
  relaxed: number;
  loose: number;
}

export interface LetterSpacing {
  tighter: string;
  tight: string;
  normal: string;
  wide: string;
  wider: string;
  widest: string;
}

export interface TypographyScale {
  fontSize: string;
  lineHeight: string;
  letterSpacing: string;
  fontWeight: number;
  fontFamily: string;
}

export interface TypographyTokens {
  fontFamily: FontFamily;
  fontSize: FontSize;
  fontWeight: FontWeight;
  lineHeight: LineHeight;
  letterSpacing: LetterSpacing;
  
  // Semantic scales
  scale: {
    h1: TypographyScale;
    h2: TypographyScale;
    h3: TypographyScale;
    h4: TypographyScale;
    h5: TypographyScale;
    h6: TypographyScale;
    'body-lg': TypographyScale;
    'body-base': TypographyScale;
    'body-sm': TypographyScale;
    'body-xs': TypographyScale;
    'caption': TypographyScale;
    'overline': TypographyScale;
    'button': TypographyScale;
    'input': TypographyScale;
    'label': TypographyScale;
    'code': TypographyScale;
  };
  
  // Responsive scaling
  responsive: {
    mobile: {
      scale: number;
      lineHeightAdjustment: number;
    };
    tablet: {
      scale: number;
      lineHeightAdjustment: number;
    };
    desktop: {
      scale: number;
      lineHeightAdjustment: number;
    };
  };
}

// Font stack configuration
const fontStacks = {
  display: [
    'Clash Display',
    'Inter',
    'SF Pro Display',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'Helvetica Neue',
    'Arial',
    'sans-serif',
  ].join(', '),
  
  body: [
    'Inter',
    'SF Pro Text',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'Helvetica Neue',
    'Arial',
    'sans-serif',
  ].join(', '),
  
  mono: [
    'JetBrains Mono',
    'SF Mono',
    'Monaco',
    'Inconsolata',
    'Roboto Mono',
    'Consolas',
    'Liberation Mono',
    'Menlo',
    'Courier',
    'monospace',
  ].join(', '),
  
  system: [
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'Helvetica Neue',
    'Arial',
    'sans-serif',
  ].join(', '),
};

// Typography system configuration
export const typographySystem: TypographyTokens = {
  fontFamily: {
    display: fontStacks.display,
    body: fontStacks.body,
    mono: fontStacks.mono,
    system: fontStacks.system,
  },
  
  fontSize: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
    '6xl': '3.75rem',  // 60px
    '7xl': '4.5rem',   // 72px
    '8xl': '6rem',     // 96px
    '9xl': '8rem',     // 128px
  },
  
  fontWeight: {
    thin: 100,
    extralight: 200,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  },
  
  lineHeight: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
  
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
  
  scale: {
    h1: {
      fontSize: '3rem',
      lineHeight: '1.2',
      letterSpacing: '-0.02em',
      fontWeight: 700,
      fontFamily: fontStacks.display,
    },
    h2: {
      fontSize: '2.25rem',
      lineHeight: '1.3',
      letterSpacing: '-0.01em',
      fontWeight: 600,
      fontFamily: fontStacks.display,
    },
    h3: {
      fontSize: '1.875rem',
      lineHeight: '1.3',
      letterSpacing: '-0.01em',
      fontWeight: 600,
      fontFamily: fontStacks.display,
    },
    h4: {
      fontSize: '1.5rem',
      lineHeight: '1.4',
      letterSpacing: '0em',
      fontWeight: 600,
      fontFamily: fontStacks.display,
    },
    h5: {
      fontSize: '1.25rem',
      lineHeight: '1.4',
      letterSpacing: '0em',
      fontWeight: 600,
      fontFamily: fontStacks.display,
    },
    h6: {
      fontSize: '1.125rem',
      lineHeight: '1.4',
      letterSpacing: '0em',
      fontWeight: 600,
      fontFamily: fontStacks.display,
    },
    'body-lg': {
      fontSize: '1.125rem',
      lineHeight: '1.6',
      letterSpacing: '0em',
      fontWeight: 400,
      fontFamily: fontStacks.body,
    },
    'body-base': {
      fontSize: '1rem',
      lineHeight: '1.6',
      letterSpacing: '0em',
      fontWeight: 400,
      fontFamily: fontStacks.body,
    },
    'body-sm': {
      fontSize: '0.875rem',
      lineHeight: '1.5',
      letterSpacing: '0em',
      fontWeight: 400,
      fontFamily: fontStacks.body,
    },
    'body-xs': {
      fontSize: '0.75rem',
      lineHeight: '1.5',
      letterSpacing: '0em',
      fontWeight: 400,
      fontFamily: fontStacks.body,
    },
    'caption': {
      fontSize: '0.75rem',
      lineHeight: '1.4',
      letterSpacing: '0.025em',
      fontWeight: 500,
      fontFamily: fontStacks.body,
    },
    'overline': {
      fontSize: '0.625rem',
      lineHeight: '1.2',
      letterSpacing: '0.1em',
      fontWeight: 600,
      fontFamily: fontStacks.body,
    },
    'button': {
      fontSize: '0.875rem',
      lineHeight: '1.2',
      letterSpacing: '0.025em',
      fontWeight: 600,
      fontFamily: fontStacks.body,
    },
    'input': {
      fontSize: '1rem',
      lineHeight: '1.5',
      letterSpacing: '0em',
      fontWeight: 400,
      fontFamily: fontStacks.body,
    },
    'label': {
      fontSize: '0.875rem',
      lineHeight: '1.4',
      letterSpacing: '0em',
      fontWeight: 500,
      fontFamily: fontStacks.body,
    },
    'code': {
      fontSize: '0.875rem',
      lineHeight: '1.5',
      letterSpacing: '0em',
      fontWeight: 400,
      fontFamily: fontStacks.mono,
    },
  },
  
  responsive: {
    mobile: {
      scale: 0.875,
      lineHeightAdjustment: 1.1,
    },
    tablet: {
      scale: 0.95,
      lineHeightAdjustment: 1.05,
    },
    desktop: {
      scale: 1,
      lineHeightAdjustment: 1,
    },
  },
};

// Typography utility functions
export const typographyUtils = {
  // Get font load optimization
  getFontDisplay: (fontFamily: string) => {
    const webFonts = ['Clash Display', 'Inter', 'JetBrains Mono'];
    return webFonts.some(font => fontFamily.includes(font)) ? 'swap' : 'auto';
  },
  
  // Get responsive font size
  getResponsiveSize: (baseSize: string, breakpoint: 'mobile' | 'tablet' | 'desktop') => {
    const scale = typographySystem.responsive[breakpoint].scale;
    const size = parseFloat(baseSize);
    return `${size * scale}rem`;
  },
  
  // Get responsive line height
  getResponsiveLineHeight: (baseLineHeight: string, breakpoint: 'mobile' | 'tablet' | 'desktop') => {
    const adjustment = typographySystem.responsive[breakpoint].lineHeightAdjustment;
    const lineHeight = parseFloat(baseLineHeight);
    return `${lineHeight * adjustment}`;
  },
  
  // Calculate reading time
  calculateReadingTime: (text: string, wordsPerMinute: number = 200) => {
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min read`;
  },
  
  // Get optimal line length
  getOptimalLineLength: (fontSize: string) => {
    const size = parseFloat(fontSize);
    const minChars = Math.round(45 * (size / 16));
    const maxChars = Math.round(75 * (size / 16));
    return { min: minChars, max: maxChars, optimal: Math.round(65 * (size / 16)) };
  },
  
  // Check text contrast
  checkReadability: (textColor: string, backgroundColor: string) => {
    // This would integrate with the color system's contrast checking
    return {
      isReadable: true, // Placeholder
      contrastRatio: 4.5, // Placeholder
      level: 'AA' as 'AA' | 'AAA' | 'fail',
    };
  },
};

// CSS custom properties generator
export const generateTypographyCSS = (theme: 'light' | 'dark' = 'light') => {
  const { fontFamily, fontSize, fontWeight, lineHeight, letterSpacing, scale } = typographySystem;
  
  return `
    /* Font Families */
    --font-display: ${fontFamily.display};
    --font-body: ${fontFamily.body};
    --font-mono: ${fontFamily.mono};
    --font-system: ${fontFamily.system};
    
    /* Font Sizes */
    --text-xs: ${fontSize.xs};
    --text-sm: ${fontSize.sm};
    --text-base: ${fontSize.base};
    --text-lg: ${fontSize.lg};
    --text-xl: ${fontSize.xl};
    --text-2xl: ${fontSize['2xl']};
    --text-3xl: ${fontSize['3xl']};
    --text-4xl: ${fontSize['4xl']};
    --text-5xl: ${fontSize['5xl']};
    --text-6xl: ${fontSize['6xl']};
    --text-7xl: ${fontSize['7xl']};
    --text-8xl: ${fontSize['8xl']};
    --text-9xl: ${fontSize['9xl']};
    
    /* Font Weights */
    --font-thin: ${fontWeight.thin};
    --font-extralight: ${fontWeight.extralight};
    --font-light: ${fontWeight.light};
    --font-normal: ${fontWeight.normal};
    --font-medium: ${fontWeight.medium};
    --font-semibold: ${fontWeight.semibold};
    --font-bold: ${fontWeight.bold};
    --font-extrabold: ${fontWeight.extrabold};
    --font-black: ${fontWeight.black};
    
    /* Line Heights */
    --leading-none: ${lineHeight.none};
    --leading-tight: ${lineHeight.tight};
    --leading-snug: ${lineHeight.snug};
    --leading-normal: ${lineHeight.normal};
    --leading-relaxed: ${lineHeight.relaxed};
    --leading-loose: ${lineHeight.loose};
    
    /* Letter Spacing */
    --tracking-tighter: ${letterSpacing.tighter};
    --tracking-tight: ${letterSpacing.tight};
    --tracking-normal: ${letterSpacing.normal};
    --tracking-wide: ${letterSpacing.wide};
    --tracking-wider: ${letterSpacing.wider};
    --tracking-widest: ${letterSpacing.widest};
    
    /* Semantic Scales */
    --type-h1-size: ${scale.h1.fontSize};
    --type-h1-line-height: ${scale.h1.lineHeight};
    --type-h1-letter-spacing: ${scale.h1.letterSpacing};
    --type-h1-font-weight: ${scale.h1.fontWeight};
    --type-h1-font-family: ${scale.h1.fontFamily};
    
    --type-h2-size: ${scale.h2.fontSize};
    --type-h2-line-height: ${scale.h2.lineHeight};
    --type-h2-letter-spacing: ${scale.h2.letterSpacing};
    --type-h2-font-weight: ${scale.h2.fontWeight};
    --type-h2-font-family: ${scale.h2.fontFamily};
    
    --type-h3-size: ${scale.h3.fontSize};
    --type-h3-line-height: ${scale.h3.lineHeight};
    --type-h3-letter-spacing: ${scale.h3.letterSpacing};
    --type-h3-font-weight: ${scale.h3.fontWeight};
    --type-h3-font-family: ${scale.h3.fontFamily};
    
    --type-h4-size: ${scale.h4.fontSize};
    --type-h4-line-height: ${scale.h4.lineHeight};
    --type-h4-letter-spacing: ${scale.h4.letterSpacing};
    --type-h4-font-weight: ${scale.h4.fontWeight};
    --type-h4-font-family: ${scale.h4.fontFamily};
    
    --type-h5-size: ${scale.h5.fontSize};
    --type-h5-line-height: ${scale.h5.lineHeight};
    --type-h5-letter-spacing: ${scale.h5.letterSpacing};
    --type-h5-font-weight: ${scale.h5.fontWeight};
    --type-h5-font-family: ${scale.h5.fontFamily};
    
    --type-h6-size: ${scale.h6.fontSize};
    --type-h6-line-height: ${scale.h6.lineHeight};
    --type-h6-letter-spacing: ${scale.h6.letterSpacing};
    --type-h6-font-weight: ${scale.h6.fontWeight};
    --type-h6-font-family: ${scale.h6.fontFamily};
    
    --type-body-lg-size: ${scale['body-lg'].fontSize};
    --type-body-lg-line-height: ${scale['body-lg'].lineHeight};
    --type-body-lg-letter-spacing: ${scale['body-lg'].letterSpacing};
    --type-body-lg-font-weight: ${scale['body-lg'].fontWeight};
    --type-body-lg-font-family: ${scale['body-lg'].fontFamily};
    
    --type-body-base-size: ${scale['body-base'].fontSize};
    --type-body-base-line-height: ${scale['body-base'].lineHeight};
    --type-body-base-letter-spacing: ${scale['body-base'].letterSpacing};
    --type-body-base-font-weight: ${scale['body-base'].fontWeight};
    --type-body-base-font-family: ${scale['body-base'].fontFamily};
    
    --type-body-sm-size: ${scale['body-sm'].fontSize};
    --type-body-sm-line-height: ${scale['body-sm'].lineHeight};
    --type-body-sm-letter-spacing: ${scale['body-sm'].letterSpacing};
    --type-body-sm-font-weight: ${scale['body-sm'].fontWeight};
    --type-body-sm-font-family: ${scale['body-sm'].fontFamily};
    
    --type-body-xs-size: ${scale['body-xs'].fontSize};
    --type-body-xs-line-height: ${scale['body-xs'].lineHeight};
    --type-body-xs-letter-spacing: ${scale['body-xs'].letterSpacing};
    --type-body-xs-font-weight: ${scale['body-xs'].fontWeight};
    --type-body-xs-font-family: ${scale['body-xs'].fontFamily};
    
    --type-caption-size: ${scale.caption.fontSize};
    --type-caption-line-height: ${scale.caption.lineHeight};
    --type-caption-letter-spacing: ${scale.caption.letterSpacing};
    --type-caption-font-weight: ${scale.caption.fontWeight};
    --type-caption-font-family: ${scale.caption.fontFamily};
    
    --type-overline-size: ${scale.overline.fontSize};
    --type-overline-line-height: ${scale.overline.lineHeight};
    --type-overline-letter-spacing: ${scale.overline.letterSpacing};
    --type-overline-font-weight: ${scale.overline.fontWeight};
    --type-overline-font-family: ${scale.overline.fontFamily};
    
    --type-button-size: ${scale.button.fontSize};
    --type-button-line-height: ${scale.button.lineHeight};
    --type-button-letter-spacing: ${scale.button.letterSpacing};
    --type-button-font-weight: ${scale.button.fontWeight};
    --type-button-font-family: ${scale.button.fontFamily};
    
    --type-input-size: ${scale.input.fontSize};
    --type-input-line-height: ${scale.input.lineHeight};
    --type-input-letter-spacing: ${scale.input.letterSpacing};
    --type-input-font-weight: ${scale.input.fontWeight};
    --type-input-font-family: ${scale.input.fontFamily};
    
    --type-label-size: ${scale.label.fontSize};
    --type-label-line-height: ${scale.label.lineHeight};
    --type-label-letter-spacing: ${scale.label.letterSpacing};
    --type-label-font-weight: ${scale.label.fontWeight};
    --type-label-font-family: ${scale.label.fontFamily};
    
    --type-code-size: ${scale.code.fontSize};
    --type-code-line-height: ${scale.code.lineHeight};
    --type-code-letter-spacing: ${scale.code.letterSpacing};
    --type-code-font-weight: ${scale.code.fontWeight};
    --type-code-font-family: ${scale.code.fontFamily};
  `;
};

export default typographySystem;