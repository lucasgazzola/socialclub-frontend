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
    // Un proceso por núcleo saturaba la máquina (3,1 GB de RAM); con el 25 %: 1,1 GB.
    maxWorkers: '25%',
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
      thresholds: { statements: 33, branches: 33, functions: 28, lines: 33 },
    },
  },
});