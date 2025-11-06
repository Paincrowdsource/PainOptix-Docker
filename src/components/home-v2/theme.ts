/**
 * PainOptix Brand Tokens - V1 Source of Truth
 *
 * These tokens are extracted from V1 (LandingPageV1Client.tsx) and represent
 * the authoritative brand design system for PainOptix.
 *
 * DO NOT modify these values without reviewing V1 first.
 */

export const brand = {
  // Primary brand colors - NEVER change these without V1 approval
  colors: {
    primary: '#0B5394',       // Primary brand blue
    primaryHover: '#084074',  // Hover state for primary

    // Grays (Tailwind gray scale)
    gray50: '#F9FAFB',
    gray100: '#F3F4F6',
    gray200: '#E5E7EB',
    gray300: '#D1D5DB',
    gray400: '#9CA3AF',
    gray500: '#6B7280',
    gray600: '#4B5563',
    gray700: '#374151',
    gray800: '#1F2937',
    gray900: '#111827',

    // Blue tints (for backgrounds)
    blue50: '#EFF6FF',

    white: '#FFFFFF',
  },

  // Typography scale (matches V1)
  typography: {
    hero: {
      fontSize: 'text-5xl md:text-6xl lg:text-7xl',
      fontWeight: 'font-normal',
      lineHeight: 'leading-[1.1]',
      letterSpacing: 'tracking-tight',
      textShadow: '0 2px 4px rgba(0,0,0,0.04)',
    },
    sectionHeading: {
      fontSize: 'text-3xl',
      fontWeight: 'font-light',      // V1 uses elegant font-light
      color: 'text-gray-900',
    },
    subheading: {
      fontSize: 'text-xl',
      fontWeight: 'font-medium',
      color: 'text-gray-900',
    },
    body: {
      fontSize: 'text-lg',
      color: 'text-gray-600',
      lineHeight: 'leading-relaxed',
    },
    bodyMd: {
      fontSize: 'text-lg md:text-xl',
      color: 'text-gray-600',
      lineHeight: 'leading-relaxed',
    },
    small: {
      fontSize: 'text-sm',
      color: 'text-gray-600',
    },
  },

  // Spacing rhythm (V1 standards)
  spacing: {
    sectionPadding: 'py-24',           // Standard section
    sectionPaddingLarge: 'py-32',      // Major sections
    containerPadding: 'px-6 lg:px-8',
    containerMaxWidth: 'max-w-7xl',
  },

  // Shadow system (V1 hierarchy)
  shadows: {
    subtle: 'shadow-sm',
    medium: 'shadow-md',
    large: 'shadow-lg',
    extraLarge: 'shadow-xl',
  },

  // Border radius (medical professionalism)
  radii: {
    button: 'rounded',           // 4px - professional
    card: 'rounded-2xl',         // 16px - major cards
    cardSmall: 'rounded-lg',     // 8px - minor cards
    full: 'rounded-full',        // circles
  },

  // Button styles (V1 exact match)
  button: {
    primary: {
      base: 'inline-flex px-8 py-3 bg-[#0B5394] text-white text-lg font-medium rounded shadow-sm',
      hover: 'hover:bg-[#084074] hover:scale-[1.02]',
      active: 'active:scale-[0.98]',
      transition: 'transition-all duration-200',
    },
    secondary: {
      base: 'px-6 py-2 bg-[#0B5394] text-white font-medium rounded',
      hover: 'hover:bg-[#084074]',
      transition: 'transition-colors',
    },
  },
} as const
