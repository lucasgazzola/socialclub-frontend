import { test, expect, iniciarSesion, sufijoUnico, resaltar, USUARIOS } from './soporte/fixtures';

/**
 * Flujo: el ciclo completo de un evento. El administrador lo crea, un socio
 * compra entradas con la pasarela de prueba y recibe sus QR, y un colaborador
 * valida una en la puerta y rechaza el reingreso (US-29, US-30, US-52, US-31).
 */
test.describe.configure({ mode: 'serial' });

const evento = { nombre: `Peña E2E ${sufijoUnico()}`, lugar: 'Salón principal' };
let tokens: string[] = [];

/** dd/mm/aaaa de hoy + `dias`. */
function fechaEn(dias: number) {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

test(
  'TC-059 · Validar la creación de un evento con datos válidos',
  { tag: ['@US-29'] },
  async ({ page, paso }) => {
    await paso('1. Como administrador, abrir Eventos y «Nuevo evento»', async () => {
      await iniciarSesion(page, USUARIOS.admin);
      await page.goto('/eventos');
      await page.getByRole('button', { name: 'Nuevo evento' }).click();
    });

    const dialogo = page.getByRole('dialog', { name: 'Nuevo evento' });
    await paso('2. Completar nombre, lugar, cupo, precio y fecha (dentro de 7 días)', async () => {
      await dialogo.locator('#nombre').fill(evento.nombre);
      await dialogo.locator('#descripcion').fill('Evento creado por la prueba E2E');
      await dialogo.locator('#lugarAcreditacion').fill(evento.lugar);
      await dialogo.locator('#capacidadMaxima').fill('50');
      await dialogo.locator('#entradasDisponibles').fill('50');
      await dialogo.locator('#precio').fill('1500');
      await dialogo.locator('#fechaEvento').fill(fechaEn(7));
      await dialogo.locator('#fechaEvento-hora').fill('20:00');
      await dialogo.locator('#fechaFin').fill(fechaEn(7));
      await dialogo.locator('#fechaFin-hora').fill('23:30');
    });

    await paso('3. Crear el evento: aparece publicado en el listado', async () => {
      await dialogo.getByRole('button', { name: 'Crear evento' }).click();
      await expect(dialogo).toBeHidden();
      await page.getByPlaceholder('buscar por nombre o descripción…').fill(evento.nombre);
      const tarjeta = page.getByRole('article').filter({ hasText: evento.nombre });
      await expect(tarjeta).toBeVisible();
      await expect(tarjeta).toContainText(evento.lugar);
      await resaltar(tarjeta);
    });
  },
);

test(
  'TC-069 · Verificar que la compra de varias entradas genera múltiples QRs individuales',
  { tag: ['@US-30'] },
  async ({ page, paso }) => {
    await paso('1. Como socio, abrir el evento y elegir 2 entradas', async () => {
      await iniciarSesion(page, USUARIOS.socio);
      await page.goto('/eventos');
      await page.getByPlaceholder('buscar por nombre o descripción…').fill(evento.nombre);
      const tarjeta = page.getByRole('article').filter({ hasText: evento.nombre });
      await tarjeta.getByRole('button', { name: 'Comprar entradas' }).click();
      await expect(page.getByRole('heading', { name: 'Comprar entradas' })).toBeVisible();
      await page.getByLabel('Cantidad').fill('2');
    });

    const pasarela = page.getByRole('dialog', { name: 'Pasarela de pago (simulación)' });
    await paso('2. Pagar con la pasarela de prueba', async () => {
      await page.getByRole('button', { name: 'Comprar entradas' }).click();
      await pasarela.getByLabel('Nombre del titular').fill('Lucía Registrada');
      await pasarela.getByLabel('Número de tarjeta').fill('4500000000000000');
      await pasarela.getByLabel('Vencimiento').fill('12/30');
      await pasarela.getByLabel('Código CVC').fill('123');
      await resaltar(pasarela);
    });

    await paso('3. Confirmar: se generan dos entradas, cada una con su QR y su token', async () => {
      await pasarela.getByRole('button', { name: /Confirmar y pagar/ }).click();
      await expect(pasarela).toBeHidden();
      const adquiridas = page.locator('section').filter({ hasText: 'Entradas adquiridas' });
      await expect(adquiridas.getByText(/^Entrada #\d+$/)).toHaveCount(2);
      tokens = await adquiridas.locator('p.font-mono').allInnerTexts();
      expect(new Set(tokens).size).toBe(2);
      await resaltar(adquiridas);
    });
  },
);

test(
  'TC-180 · Validar el acceso con una entrada válida',
  { tag: ['@US-31'] },
  async ({ page, paso }) => {
    await paso('1. Como colaborador, abrir Validar QR y elegir el evento', async () => {
      await iniciarSesion(page, USUARIOS.colaborador);
      await page.goto('/entradas/validar');
      await page.getByPlaceholder('Buscar evento por nombre o descripción...').fill(evento.nombre);
      await page.getByRole('heading', { name: evento.nombre }).click();
    });

    await paso('2. Ingresar el token de la entrada manualmente', async () => {
      await page.getByRole('button', { name: /Ingreso Manual/ }).click();
      await page.getByLabel('Token UUID de la Entrada').fill(tokens[0]);
      await page.getByRole('button', { name: 'Validar Token Manualmente' }).click();
    });

    await paso('3. El sistema permite el acceso', async () => {
      const resultado = page.getByRole('heading', { name: '¡ACCESO PERMITIDO!' });
      await expect(resultado).toBeVisible();
      await resaltar(resultado);
    });
  },
);

test('TC-181 · Rechazar una entrada ya utilizada', { tag: ['@US-31'] }, async ({ page, paso }) => {
  await paso('1. Como colaborador, volver a validar la misma entrada', async () => {
    await iniciarSesion(page, USUARIOS.colaborador);
    await page.goto('/entradas/validar');
    await page.getByPlaceholder('Buscar evento por nombre o descripción...').fill(evento.nombre);
    await page.getByRole('heading', { name: evento.nombre }).click();
    await page.getByRole('button', { name: /Ingreso Manual/ }).click();
    await page.getByLabel('Token UUID de la Entrada').fill(tokens[0]);
    await page.getByRole('button', { name: 'Validar Token Manualmente' }).click();
  });

  await paso('2. El sistema rechaza el reingreso', async () => {
    const resultado = page.getByRole('heading', { name: '¡ENTRADA YA UTILIZADA!' });
    await expect(resultado).toBeVisible();
    await expect(
      page.getByText('Posible intento de reingreso no autorizado.').first(),
    ).toBeVisible();
    await resaltar(resultado);
  });
});
