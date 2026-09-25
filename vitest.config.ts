import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: [
      'engines/**/*.test.ts',
      'packages/**/*.test.ts',
      'schemas/**/*.test.ts',
      'scripts/**/*.test.ts',
      'tests/unit/**/*.test.ts',
    ],
    exclude: ['**/node_modules/**', '**/dist/**'],
    testTimeout: 20_000,
  },
});
