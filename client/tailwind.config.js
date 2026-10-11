/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    // -------------------------------------------------------------------------
    // BRUTALIST PRECISION CONSTRAINT: ZERO BORDER RADIUS ENFORCEMENT
    // -------------------------------------------------------------------------
    borderRadius: {
      none: '0px',
      sm: '0px',
      DEFAULT: '0px',
      md: '0px',
      lg: '0px',
      xl: '0px',
      '2xl': '0px',
      '3xl': '0px',
      full: '0px',
    },
    // -------------------------------------------------------------------------
    // ANTI-PATTERN SUPPRESSION: DISABLE ALL SOFT/BLURRED DROP SHADOWS
    // -------------------------------------------------------------------------
    boxShadow: {
      none: 'none',
      sm: 'none',
      DEFAULT: 'none',
      md: 'none',
      lg: 'none',
      xl: 'none',
      '2xl': 'none',
      inner: 'none',
      'tactical-phosphor': '0 0 0 1px #cfff04',
      'tactical-hazard': '0 0 0 1px #ff3333',
      'tactical-stroke': '0 0 0 1px #242b27',
    },
    extend: {
      // -----------------------------------------------------------------------
      // MONOSPACE EXCLUSIVITY: OVERRIDE BOTH MONO AND SANS
      // -----------------------------------------------------------------------
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Space Mono"', '"Roboto Mono"', 'monospace'],
        sans: ['"JetBrains Mono"', '"Space Mono"', '"Roboto Mono"', 'monospace'],
      },
      // -----------------------------------------------------------------------
      // TRACKING / LETTER SPACING MATRIX (SPEC SECTION 4)
      // -----------------------------------------------------------------------
      letterSpacing: {
        tightest: '0.02em',
        ui: '0.08em',
        label: '0.12em',
        alert: '0.16em',
      },
      // -----------------------------------------------------------------------
      // TACTICAL FUI COLOR HIERARCHY (SPEC SECTION 3)
      // -----------------------------------------------------------------------
      colors: {
        black: '#000000',
        charcoal: {
          base: '#070707',
          panel: '#0b0c0c',
          surface: '#0e1010',
          hover: '#141716',
        },
        phosphor: {
          DEFAULT: '#cfff04',
          dim: 'rgba(207, 255, 4, 0.4)',
          wash: 'rgba(207, 255, 4, 0.08)',
          bright: '#e2ff4f',
        },
        teal: {
          DEFAULT: '#548474',
          dim: 'rgba(84, 132, 116, 0.2)',
          wash: 'rgba(84, 132, 116, 0.08)',
        },
        hazard: {
          DEFAULT: '#ff3333',
          dim: 'rgba(255, 51, 51, 0.3)',
          wash: 'rgba(255, 51, 51, 0.12)',
        },
        stroke: {
          dim: '#1a1f1d',
          mid: '#242b27',
          bright: '#2f3833',
        },
        tactical: {
          muted: '#687771',
          main: '#d4ded9',
          bright: '#ffffff',
        },
      },
      animation: {
        'hazard-scroll': 'hazardScroll 8s linear infinite',
        'crt-pulse': 'crtPulse 4s ease-in-out infinite',
        'shake': 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both',
      },
      keyframes: {
        hazardScroll: {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '40px 0' },
        },
        crtPulse: {
          '0%, 100%': { opacity: '0.04' },
          '50%': { opacity: '0.06' },
        },
        shake: {
          '10%, 90%': { transform: 'translate3d(-1px, 0, 0)' },
          '20%, 80%': { transform: 'translate3d(2px, 0, 0)' },
          '30%, 50%, 70%': { transform: 'translate3d(-3px, 0, 0)' },
          '40%, 60%': { transform: 'translate3d(3px, 0, 0)' },
        },
      },
    },
  },
  plugins: [],
};