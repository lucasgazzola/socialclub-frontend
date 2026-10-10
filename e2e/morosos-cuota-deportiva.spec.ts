import { test, expect, iniciarSesion, resaltar, USUARIOS } from './soporte/fixtures';

/**
 * Flujo: secretaría consulta los morosos de cuota deportiva, revisa el detalle
 * de la deuda de cada disciplina y abre el cobro desde el listado (US-23).
 *
 * Usa los datos del seed: Valeria Historica (DNI 60000006) tiene cuotas
 * impagas de Fútbol Femenino desde 2026 y de Pelota Paleta hasta su baja
 * (febrero de 2026). Todas vencieron (la cuota de un mes vence el día 10).
 */
const VALERIA = { nombre: 'Valeria Historica', dni: '60000006' };

test(
  'TC-201 · Mostrar por moroso nombre completo, DNI, disciplina, períodos adeudados y monto total',
  { tag: ['@US-23'] },
  async ({ page, paso }) => {
    await paso('1. Como colaborador, abrir «Morosos cuota deportiva»', async () => {
      await iniciarSesion(page, USUARIOS.colaborador);
      await page.getByRole('link', { name: 'Morosos cuota deportiva' }).click();
      await expect(
        page.getByRole('main').getByRole('heading', { name: 'Morosos de Cuota Deportiva' }),
      ).toBeVisible();
      await expect(page.getByText(/vence el día 10/)).toBeVisible();
    });

    await paso(
      '2. Ubicar al moroso: nombre, DNI, deuda por disciplina, períodos y total',
      async () => {
        const fila = page.getByRole('row', { name: new RegExp(VALERIA.nombre) });
        await expect(fila).toContainText(VALERIA.dni);
        await expect(fila).toContainText('Fútbol Femenino');
        await expect(fila).toContainText('Pelota Paleta');
        await expect(fila).toContainText(/per\. · \$/);
        await expect(fila).toContainText(/\$\s?[\d.]+,00/);
        await resaltar(fila);
      },
    );
  },
);

test(
  'TC-208 · Identificar por separado la deuda de cada disciplina',
  { tag: ['@US-23'] },
  async ({ page, paso }) => {
    await paso('1. Como colaborador, abrir el detalle del moroso', async () => {
      await iniciarSesion(page, USUARIOS.colaborador);
      await page.goto('/cuotas/deportiva/morosos');
      await page.getByRole('button', { name: `Ver detalle de ${VALERIA.nombre}` }).click();
    });

    await paso(
      '2. Cada disciplina lista sus cuotas vencidas con vencimiento, importe y estado',
      async () => {
        const futbol = page.getByRole('region', { name: 'Cuotas adeudadas de Fútbol Femenino' });
        const paleta = page.getByRole('region', { name: 'Cuotas adeudadas de Pelota Paleta' });
        await expect(futbol.getByText('Vencida · impaga').first()).toBeVisible();
        await expect(futbol.getByText(/^10\/\d{2}\/2026$/).first()).toBeVisible();
        await expect(paleta).toContainText('Dada de baja');
        await expect(paleta).toContainText('02/2026');
        await resaltar(futbol, paleta);
      },
    );
  },
);

test(
  'TC-211 · Abrir el cobro de la cuota deportiva desde un moroso',
  { tag: ['@US-23'] },
  async ({ page, paso }) => {
    await paso('1. Como colaborador, elegir «Cobrar» en la fila del moroso', async () => {
      await iniciarSesion(page, USUARIOS.colaborador);
      await page.goto('/cuotas/deportiva/morosos');
      const fila = page.getByRole('row', { name: new RegExp(VALERIA.nombre) });
      await fila.getByRole('button', { name: 'Cobrar' }).click();
    });

    await paso('2. Se abre el cobro con el DNI cargado y las cuotas del moroso', async () => {
      await expect(page).toHaveURL(new RegExp(`/cuotas/deportiva/cobrar\\?dni=${VALERIA.dni}`));
      await expect(page.getByLabel('Buscar participante por DNI')).toHaveValue(VALERIA.dni);
      await expect(page.getByText(VALERIA.nombre)).toBeVisible();
      const estado = page.getByText('Con deuda');
      await expect(estado).toBeVisible();
      await resaltar(page.getByLabel('Buscar participante por DNI'), estado);
    });
  },
);

test(
  'TC-210 · Restringir el listado a los roles que gestionan la cobranza',
  { tag: ['@US-23'] },
  async ({ page, paso }) => {
    await paso('1. Como delegado, abrir el listado por URL', async () => {
      await iniciarSesion(page, USUARIOS.delegado);
      await expect(page.getByRole('link', { name: 'Morosos cuota deportiva' })).toHaveCount(0);
      await page.goto('/cuotas/deportiva/morosos');
      const aviso = page.getByText('No tenés permisos para acceder a esta sección.');
      await expect(aviso).toBeVisible();
      await resaltar(aviso);
    });

    await paso('2. La API también lo rechaza (403)', async () => {
      const r = await page.request.get('http://localhost:3101/api/v1/pagos-deportivos/morosos');
      expect(r.status()).toBe(403);
    });
  },
);
