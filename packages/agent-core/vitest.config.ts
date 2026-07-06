import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/index.ts', 'src/skills/**/*.ts'],
      thresholds: {
        lines: 70,
        functions: 55,
        statements: 70,
        branches: 58,
      },
    },
  },
});
