import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    include: ['src/**/*.spec.{ts,tsx}', 'src/**/*.test.{ts,tsx}'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'json-summary', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.{spec,test}.{ts,tsx}',
        'src/main.tsx',
        'src/**/*.d.ts',
        'src/setupTests.ts',
        'src/**/types.ts',
      ],
      // Ratchet: piso actual (solo puede subir). Objetivo DoD: 70% en componentes/hooks críticos.
      // Subir estos umbrales a medida que /casos-a-tests agregue tests.
      thresholds: { statements: 15, branches: 18, functions: 13, lines: 15 },
    },
  },
});