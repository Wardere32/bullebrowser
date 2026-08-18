import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#20BAD1',
          hover: '#1FA6BB',
        },
        accent: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
        },
        surface: {
          dark: '#0B1E3D',
          light: '#FFFFFF',
          muted: '#F9FAFB',
        },
        ink: {
          primary: '#142127',
          secondary: '#6B7280',
          inverse: '#FFFFFF',
        },
        line: {
          DEFAULT: '#E5E7EB',
          strong: '#CBD5E1',
        },
      },
      fontFamily: {
        ui: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'ui-monospace', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
