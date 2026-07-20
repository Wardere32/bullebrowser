/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/**/*.{ts,tsx,html}'],
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
        ui: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};
