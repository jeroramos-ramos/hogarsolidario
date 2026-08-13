import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0F2A2E',
          2: '#1B3D42',
        },
        paper: '#EDF0EE',
        surface: '#FFFFFF',
        line: {
          DEFAULT: '#CBD6D2',
          soft: '#E1E8E5',
        },
        muted: '#5E7175',
        signal: {
          DEFAULT: '#F0A202',
          soft: '#FDF1D6',
          line: '#EFD79B',
          ink: '#7A5502',
        },
        verify: {
          DEFAULT: '#1D7A5F',
          soft: '#E2F1EB',
          line: '#BFE0D3',
          ink: '#125C46',
        },
        alert: {
          DEFAULT: '#B23A20',
          soft: '#FAE7E2',
          line: '#EDCABF',
        },
      },
      fontFamily: {
        display: ['Archivo', 'Helvetica', 'Arial', 'sans-serif'],
        body: [
          '"IBM Plex Sans"',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'sans-serif',
        ],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'Menlo', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '4px',
      },
      letterSpacing: {
        display: '-0.02em',
        mono: '0.06em',
        monoHi: '0.1em',
        eyebrow: '0.12em',
      },
      maxWidth: {
        wrap: '1120px',
      },
      boxShadow: {
        toast: '0 6px 22px rgba(15, 42, 46, 0.28)',
      },
      keyframes: {
        pulse: {
          '0%,100%': { opacity: '1' },
          '50%': { opacity: '0.25' },
        },
      },
      animation: {
        pulse: 'pulse 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
