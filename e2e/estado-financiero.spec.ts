import { test, expect, iniciarSesion, resaltar, USUARIOS } from './soporte/fixtures';

/**
 * Flujo: Tesorería (ADMIN o COLABORADOR) genera el reporte de estado
 * financiero, cambia el período y lo filtra por disciplina; el delegado no
 * tiene acceso (US-35). Usa los datos del seed.
 */
const pesos = (texto: string) => Number(texto.replace(/[^\d,]/g, '').replace(',', '.'));

async function abrirReporte(page: import('@playwright/test').Page) {
  await iniciarSesion(page, USUARIOS.colaborador);
  await page.getByRole('link', { name: 'Estado financiero' }).click();
  await expect(page.getByTestId('total-recaudado')).toBeVisible();
}

test(
  'TC-212 · Mostrar total recaudado, total adeudado, cantidad de morosos y porcentaje de cobranza del período',
  { tag: ['@US-35'] },
  async ({ page, paso }) => {
    await paso(
      '1. Como colaborador, abrir «Estado financiero» y elegir el 3.º trimestre',
      async () => {
        await abrirReporte(page);
        await page.getByLabel('Trimestre').selectOption('3');
        await expect(page.getByTestId('descripcion-reporte')).toContainText('Julio');
      },
    );

    await paso('2. El reporte muestra los cuatro indicadores', async () => {
      for (const id of [
        'total-recaudado',
        'total-adeudado',
        'total-morosos',
        'porcentaje-cobranza',
      ]) {
        await expect(page.getByTestId(id)).not.toBeEmpty();
      }
      await expect(page.getByTestId('porcentaje-cobranza')).toContainText('%');
      await expect(page.getByText(/por fecha de cobro/)).toBeVisible();
      await resaltar(page.getByTestId('total-recaudado').locator('xpath=ancestor::div[2]'));
    });
  },
);

test(
  'TC-215 · Seleccionar el período por mes, trimestre o rango personalizado',
  { tag: ['@US-35'] },
  async ({ page, paso }) => {
    await paso('1. Elegir un mes', async () => {
      await abrirReporte(page);
      await page.getByRole('tab', { name: 'Mes', exact: true }).click();
      await page.getByLabel('Mes', { exact: true }).selectOption('8');
      await expect(page.getByTestId('descripcion-reporte')).toContainText('Agosto 2026');
      await resaltar(page.getByTestId('descripcion-reporte'));
    });

    await paso('2. Elegir un rango personalizado', async () => {
      await page.getByRole('tab', { name: 'Rango', exact: true }).click();
      await page.getByLabel('Mes desde').selectOption('3');
      await page.getByLabel('Mes hasta').selectOption('9');
      await expect(page.getByTestId('descripcion-reporte')).toContainText(
        'Marzo 2026 a septiembre 2026',
      );
      await expect(page.getByTestId('barra-2026-03')).toBeVisible();
      await expect(page.getByTestId('barra-2026-09')).toBeVisible();
      await resaltar(page.getByTestId('descripcion-reporte'));
    });
  },
);

test('TC-217 · Filtrar el reporte por disciplina', { tag: ['@US-35'] }, async ({ page, paso }) => {
  await paso('1. Elegir «Natación» en el filtro de disciplina', async () => {
    await abrirReporte(page);
    await page.getByLabel('Filtrar por disciplina').selectOption({ label: 'Natación' });
  });

  await paso('2. El reporte muestra solo la cuota deportiva de Natación', async () => {
    await expect(page.getByTestId('descripcion-reporte')).toContainText(
      'solo cuota deportiva de Natación',
    );
    const conceptos = page.getByRole('table', { name: 'Estado por concepto' });
    await expect(conceptos.getByText('Cuota social')).toHaveCount(0);
    await expect(conceptos.getByText('Cuota deportiva')).toBeVisible();
    await resaltar(page.getByTestId('descripcion-reporte'), conceptos);
  });
});

test(
  'TC-219 · Coincidir la deuda del reporte con los listados de morosos',
  { tag: ['@US-35'] },
  async ({ page, paso }) => {
    let adeudadoDeportivo = 0;

    await paso('1. Generar el reporte de enero al mes actual', async () => {
      await abrirReporte(page);
      await page.getByRole('tab', { name: 'Rango', exact: true }).click();
      await page.getByLabel('Mes desde').selectOption('1');
      await page.getByLabel('Año desde').selectOption(String(new Date().getFullYear()));
      const fila = page
        .getByRole('table', { name: 'Estado por concepto' })
        .getByRole('row', { name: /Cuota deportiva/ });
      adeudadoDeportivo = pesos(await fila.getByRole('cell').nth(2).innerText());
      await resaltar(fila);
    });

    await paso(
      '2. El listado de morosos de cuota deportiva suma la misma deuda vencida',
      async () => {
        await page.getByRole('link', { name: /Ver morosos de cuota deportiva/ }).click();
        const total = page.getByTestId('deuda-total');
        await expect(total).toBeVisible();
        // Espera a que cargue el listado (arranca en $ 0,00).
        await expect.poll(async () => pesos(await total.innerText())).toBe(adeudadoDeportivo);
        await resaltar(total);
      },
    );
  },
);

test(
  'TC-220 · Restringir el reporte a los roles que gestionan la cobranza',
  { tag: ['@US-35'] },
  async ({ page, paso }) => {
    await paso('1. Como delegado, abrir el reporte por URL', async () => {
      await iniciarSesion(page, USUARIOS.delegado);
      await expect(page.getByRole('link', { name: 'Estado financiero' })).toHaveCount(0);
      await page.goto('/reportes/estado-financiero');
      const aviso = page.getByText('No tenés permisos para acceder a esta sección.');
      await expect(aviso).toBeVisible();
      await resaltar(aviso);
    });

    await paso('2. La API también lo rechaza (403)', async () => {
      const r = await page.request.get(
        'http://localhost:3101/api/v1/reportes/estado-financiero?desde=2026-07&hasta=2026-09',
      );
      expect(r.status()).toBe(403);
    });
  },
);
