import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  // Note: @vitejs/plugin-react is NOT listed in package.json devDependencies.
  // Using vitest's built-in React support via jsdom environment instead.
  // If you need JSX transforms, run: npm install -D @vitejs/plugin-react
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'src/generated', 'src/__tests__/e2e'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/generated/',
        'src/tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/types/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@':          resolve(__dirname, './src'),
      '@modules':   resolve(__dirname, './src/modules'),
      '@shared':    resolve(__dirname, './src/shared'),
      '@services':  resolve(__dirname, './src/services'),
      '@store':     resolve(__dirname, './src/store'),
      '@generated': resolve(__dirname, './src/generated'),
      '@config':    resolve(__dirname, './src/config'),
      '@providers': resolve(__dirname, './src/providers'),
    },
  },
});
