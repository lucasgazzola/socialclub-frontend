import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';

/**
 * TASK-43 — Pruebas E2E con evidencia.
 *
 * Cada corrida levanta el sistema real: la API del repo hermano contra una base
 * propia (`socialclub_e2e`) con las migraciones y el seed aplicados, y el front
 * apuntando a esa API. Así los flujos prueban front + API + base juntos.
 *
 * La base no se borra: el seed (idempotente) deja los datos base siempre
 * iguales y cada test crea sus propios datos con DNI y email únicos. En el CI
 * la base es efímera, así que además arranca vacía.
 *
 * Variables (todas con valor por defecto para correr en local):
 * - E2E_BACKEND_DIR: carpeta de socialclub-backend (default: ../socialclub-backend).
 * - E2E_DATABASE_URL: base exclusiva de las pruebas (se crea si no existe).
 * - E2E_REUTILIZAR=1: usar una API y un front ya levantados en los puertos E2E.
 */
const BACKEND_DIR = path.resolve(process.env.E2E_BACKEND_DIR ?? '../socialclub-backend');
const DATABASE_URL =
  process.env.E2E_DATABASE_URL ??
  'postgresql://socialclub:socialclub@localhost:5432/socialclub_e2e?schema=public';
const API_PORT = 3101;
const FRONT_PORT = 5174;
export const API_URL = `http://localhost:${API_PORT}/api/v1`;
const FRONT_URL = `http://localhost:${FRONT_PORT}`;

if (!/_e2e\b|_e2e\?/.test(DATABASE_URL)) {
  // Las pruebas escriben datos: nunca apuntar a la base de desarrollo.
  throw new Error(
    `E2E_DATABASE_URL debe ser una base exclusiva de pruebas (*_e2e): ${DATABASE_URL}`,
  );
}

const reutilizar = process.env.E2E_REUTILIZAR === '1';

export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results/e2e',
  // Los flujos comparten la base: se corren de a uno y en orden.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/e2e-resultados.json' }],
  ],
  use: {
    baseURL: FRONT_URL,
    locale: 'es-AR',
    timezoneId: 'America/Argentina/Buenos_Aires',
    viewport: { width: 1366, height: 860 },
    // La evidencia por paso la saca el fixture `paso`; además queda el video
    // del flujo completo y el trace para diagnosticar un fallo.
    screenshot: 'only-on-failure',
    video: 'on',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      name: 'API',
      cwd: BACKEND_DIR,
      // Estado conocido: migraciones pendientes + seed, y la API encima.
      command: 'npx prisma migrate deploy && npx prisma db seed && npx nest start',
      url: `${API_URL.replace('/api/v1', '')}/api/v1/health`,
      reuseExistingServer: reutilizar,
      timeout: 180_000,
      stdout: 'ignore',
      stderr: 'pipe',
      env: {
        DATABASE_URL,
        PORT: String(API_PORT),
        CORS_ORIGIN: FRONT_URL,
        NODE_ENV: 'development',
        JWT_SECRET: process.env.E2E_JWT_SECRET ?? 'secreto-solo-para-pruebas-e2e',
        TAREAS_TOKEN: 'token-tareas-e2e',
        SMTP_HOST: '',
        APP_URL: FRONT_URL,
        PRISMA_HIDE_UPDATE_MESSAGE: '1',
      },
    },
    {
      name: 'Front',
      command: `npx vite --port ${FRONT_PORT} --strictPort`,
      url: FRONT_URL,
      reuseExistingServer: reutilizar,
      timeout: 60_000,
      env: { VITE_API_URL: API_URL },
    },
  ],
});
