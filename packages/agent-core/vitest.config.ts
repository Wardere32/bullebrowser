import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      include: ['src/**/*.ts'],
      // dom-runtime.ts is browser-only DOM glue with no Node-testable surface
      // (it operates window/document); it's exercised live in the embedded
      // widget, not here. The node runtime it mirrors (agent/runtime.ts, in the
      // desktop app) is likewise browser-driven and lives outside this package.
      exclude: ['src/**/*.test.ts', 'src/index.ts', 'src/skills/**/*.ts', 'src/dom-runtime.ts'],
      thresholds: {
        lines: 70,
        functions: 55,
        statements: 70,
        branches: 58,
      },
    },
  },
});
