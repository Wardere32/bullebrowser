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
          hover: '#1A9BAE',
        },
        accent: {
          DEFAULT: '#E8D833',
          hover: '#CBBC26',
        },
        surface: {
          dark: '#071422',
          light: '#FFFFFF',
          muted: '#EFF7F8',
        },
        ink: {
          primary: '#191825',
          secondary: '#818891',
          inverse: '#FFFFFF',
        },
        line: {
          DEFAULT: '#DCE9EC',
          strong: '#BFD4D9',
        },
      },
      fontFamily: {
        ui: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'ui-monospace', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
