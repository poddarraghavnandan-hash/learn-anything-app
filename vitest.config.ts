import { defineConfig } from 'vitest/config';

// Engine tests only: pure TypeScript, no React Native imports, runs in Node.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
