/**
 * Obioma Design Tokens — Single Source of Truth
 * Used by: marketing site (obiomacare.com) + app (app.obiomacare.com)
 * 
 * RULE: No hardcoded values outside this file. All components reference these tokens.
 * 
 * @license MIT — Obioma Care
 */

const tokens = {
  // ─── Colors ───
  color: {
    // Navy scale (dark backgrounds)
    navy: {
      900: '#0a1628',   // Primary background
      800: '#0f1d32',   // Card/surface background
      700: '#162544',   // Elevated surface
      600: '#1e3560',   // Border/divider
      500: '#2a4578',   // Hover state
      400: '#3d5a8a',   // Subtle accent
    },
    // Coral scale (brand accent)
    coral: {
      DEFAULT: '#c53030',
      dark: '#9b2c2c',
      light: '#E85D4E',
      muted: 'rgba(255, 107, 91, 0.15)',
      glow: 'rgba(255, 107, 91, 0.25)',
    },
    // Text scale
    text: {
      primary: '#e2e8f0',
      secondary: '#94a3b8',
      muted: '#64748b',
      inverse: '#0a1628',
    },
    // Semantic
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    // Utility
    white: '#ffffff',
    black: '#000000',
    transparent: 'transparent',
  },

  // ─── Typography ───
  font: {
    family: {
      sans: "'Inter', system-ui, -apple-system, sans-serif",
      mono: "'JetBrains Mono', 'Fira Code', monospace",
    },
    size: {
      '2xs': '0.625rem',   // 10px
      xs: '0.75rem',       // 12px
      sm: '0.875rem',      // 14px
      base: '1rem',        // 16px
      lg: '1.125rem',      // 18px
      xl: '1.25rem',       // 20px
      '2xl': '1.5rem',     // 24px
      '3xl': '1.875rem',   // 30px
      '4xl': '2.25rem',    // 36px
      '5xl': '3rem',       // 48px
      '6xl': '3.75rem',    // 60px
      '7xl': '4.5rem',     // 72px
    },
    weight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
      black: 900,
    },
    lineHeight: {
      tight: 1.2,
      snug: 1.375,
      normal: 1.6,
      relaxed: 1.75,
    },
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em',
    },
  },

  // ─── Spacing ───
  // Base unit: 4px (0.25rem)
  space: {
    0: '0',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
    20: '5rem',     // 80px
    24: '6rem',     // 96px
    32: '8rem',     // 128px
    40: '10rem',    // 160px
    48: '12rem',    // 192px
  },

  // ─── Border Radius ───
  radius: {
    none: '0',
    sm: '0.25rem',   // 4px
    DEFAULT: '0.5rem', // 8px
    md: '0.75rem',   // 12px
    lg: '1rem',      // 16px
    xl: '1.5rem',    // 24px
    '2xl': '2rem',   // 32px
    full: '9999px',
  },

  // ─── Shadows ───
  shadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    DEFAULT: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.3)',
    md: '0 6px 12px -2px rgba(0, 0, 0, 0.4), 0 3px 6px -3px rgba(0, 0, 0, 0.3)',
    lg: '0 10px 24px -4px rgba(0, 0, 0, 0.5), 0 4px 8px -4px rgba(0, 0, 0, 0.3)',
    xl: '0 20px 40px -8px rgba(0, 0, 0, 0.6)',
    coral: '0 4px 20px rgba(255, 107, 91, 0.25)',
    glow: '0 0 40px rgba(255, 107, 91, 0.15)',
  },

  // ─── Transitions ───
  transition: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    DEFAULT: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '400ms cubic-bezier(0.4, 0, 0.2, 1)',
    spring: '500ms cubic-bezier(0.34, 1.56, 0.64, 1)',
  },

  // ─── Z-Index Scale ───
  z: {
    base: 0,
    dropdown: 50,
    sticky: 100,
    overlay: 200,
    modal: 300,
    toast: 400,
    tooltip: 500,
  },

  // ─── Breakpoints ───
  breakpoint: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // ─── Icon Size ───
  icon: {
    xs: '0.75rem',   // 12px
    sm: '1rem',      // 16px
    md: '1.25rem',   // 20px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '2.5rem', // 40px
  },
};

// ─── CSS Custom Properties Output ───
// Use this to generate CSS variables for the token system
function generateCSSVariables() {
  const vars = [];
  
  // Colors
  vars.push(`  --color-navy-900: ${tokens.color.navy[900]};`);
  vars.push(`  --color-navy-800: ${tokens.color.navy[800]};`);
  vars.push(`  --color-navy-700: ${tokens.color.navy[700]};`);
  vars.push(`  --color-navy-600: ${tokens.color.navy[600]};`);
  vars.push(`  --color-navy-500: ${tokens.color.navy[500]};`);
  vars.push(`  --color-navy-400: ${tokens.color.navy[400]};`);
  vars.push(`  --color-coral: ${tokens.color.coral.DEFAULT};`);
  vars.push(`  --color-coral-dark: ${tokens.color.coral.dark};`);
  vars.push(`  --color-coral-light: ${tokens.color.coral.light};`);
  vars.push(`  --color-coral-muted: ${tokens.color.coral.muted};`);
  vars.push(`  --color-coral-glow: ${tokens.color.coral.glow};`);
  vars.push(`  --color-text-primary: ${tokens.color.text.primary};`);
  vars.push(`  --color-text-secondary: ${tokens.color.text.secondary};`);
  vars.push(`  --color-text-muted: ${tokens.color.text.muted};`);
  vars.push(`  --color-text-inverse: ${tokens.color.text.inverse};`);
  vars.push(`  --color-success: ${tokens.color.success};`);
  vars.push(`  --color-warning: ${tokens.color.warning};`);
  vars.push(`  --color-error: ${tokens.color.error};`);
  vars.push(`  --color-info: ${tokens.color.info};`);
  
  // Spacing
  Object.entries(tokens.space).forEach(([key, value]) => {
    if (key !== '0') vars.push(`  --space-${key}: ${value};`);
  });
  
  // Border radius
  Object.entries(tokens.radius).forEach(([key, value]) => {
    const name = key === 'DEFAULT' ? 'DEFAULT' : key;
    vars.push(`  --radius-${name}: ${value};`);
  });
  
  // Shadows
  Object.entries(tokens.shadow).forEach(([key, value]) => {
    const name = key === 'DEFAULT' ? 'DEFAULT' : key;
    vars.push(`  --shadow-${name}: ${value};`);
  });
  
  // Transitions
  Object.entries(tokens.transition).forEach(([key, value]) => {
    const name = key === 'DEFAULT' ? 'DEFAULT' : key;
    vars.push(`  --transition-${name}: ${value};`);
  });
  
  // Icon sizes
  Object.entries(tokens.icon).forEach(([key, value]) => {
    vars.push(`  --icon-${key}: ${value};`);
  });
  
  return `:root {\n${vars.join('\n')}\n}`;
}

// Export for both CommonJS and ES module environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { tokens, generateCSSVariables };
}
if (typeof window !== 'undefined') {
  window.ObiomaTokens = tokens;
}
