import {
  test as base,
  expect,
  request,
  type APIRequestContext,
  type Locator,
  type Page,
} from '@playwright/test';
import { API_URL } from '../../playwright.config';

/**
 * TASK-43 — Soporte de las pruebas E2E.
 *
 * Convención: cada test es la ejecución de un caso de la planilla.
 * - El título empieza con su ID: `TC-017 · Registrar un participante…`.
 * - Lleva la US como tag: `{ tag: ['@US-05'] }`.
 * - Cada paso del caso es un `paso('1. …', async () => …)`: al terminar, saca
 *   una captura que queda adjunta al reporte y que `scripts/evidencia-e2e.mjs`
 *   copia a `docs/pruebas/evidencias/<US>/e2e/`.
 */

/** Usuarios del seed del backend (`prisma/seed.ts`). */
export const USUARIOS = {
  admin: 'admin@socialclub.local',
  colaborador: 'colaborador@socialclub.local',
  delegado: 'delegado@socialclub.local',
  socio: 'lucia.registrada@club.local',
} as const;
export const PASSWORD_SEED = 'Admin123!';
export type Rol = keyof typeof USUARIOS;

type Paso = (titulo: string, cuerpo: () => Promise<void>) => Promise<void>;

interface Fixtures {
  /** Un paso del caso, con captura de pantalla al final. */
  paso: Paso;
  /** Cliente de la API logueado como ADMIN, para preparar datos. */
  apiAdmin: APIRequestContext;
}

export const test = base.extend<Fixtures>({
  paso: async ({ page }, use, testInfo) => {
    let n = 0;
    await use(async (titulo, cuerpo) => {
      await base.step(titulo, async () => {
        await cuerpo();
        n += 1;
        // Deja que terminen animaciones y pedidos antes de la captura.
        await page.waitForLoadState('networkidle').catch(() => {});
        const nn = String(n).padStart(2, '0');
        // JPEG: en capturas de pantalla se ve igual y pesa ~4 veces menos
        // (la evidencia se versiona en docs/pruebas/evidencias).
        const ruta = testInfo.outputPath(`paso-${nn}.jpg`);
        await page.screenshot({ path: ruta, type: 'jpeg', quality: 80 });
        await testInfo.attach(`paso-${nn} ${titulo}`, { path: ruta, contentType: 'image/jpeg' });
      });
    });
  },

  apiAdmin: async ({}, use) => {
    const api = await sesionApi('admin');
    await use(api);
    await api.dispose();
  },
});

export { expect };

/** Cliente de la API con la sesión iniciada (cookie httpOnly). */
export async function sesionApi(rol: Rol, password = PASSWORD_SEED) {
  const api = await request.newContext({ baseURL: `${API_URL}/` });
  const r = await api.post('auth/login', { data: { email: USUARIOS[rol], password } });
  expect(r.ok(), `login de ${rol} en la API`).toBeTruthy();
  return api;
}

/** Inicia sesión desde la pantalla de login y espera el Inicio. */
export async function iniciarSesion(page: Page, email: string, password = PASSWORD_SEED) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Contraseña').fill(password);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

/**
 * Lleva el elemento a la vista y lo marca con un borde, para que la captura
 * del paso muestre qué se verificó. Usar al final del paso.
 */
export async function resaltar(...elementos: Locator[]) {
  for (const [i, el] of elementos.entries()) {
    if (i === 0) await el.scrollIntoViewIfNeeded();
    await el.evaluate((nodo: HTMLElement) => {
      nodo.style.outline = '3px solid #f59e0b';
      nodo.style.outlineOffset = '2px';
    });
  }
}

/** Sufijo único con letras (los nombres y apellidos no admiten números). */
export function sufijoUnico() {
  return Array.from(
    { length: 6 },
    () => 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)],
  )
    .join('')
    .replace(/^./, (c) => c.toUpperCase());
}

/** DNI único por corrida, para no chocar con el seed ni con corridas previas. */
export function dniUnico() {
  return String(30_000_000 + Math.floor(Math.random() * 9_000_000));
}

/** Lanza si la respuesta de la API no es 2xx, con el cuerpo para diagnosticar. */
export async function ok<T = unknown>(respuesta: Awaited<ReturnType<APIRequestContext['get']>>) {
  if (!respuesta.ok()) {
    throw new Error(`${respuesta.status()} ${respuesta.url()}: ${await respuesta.text()}`);
  }
  return (await respuesta.json()) as T;
}
