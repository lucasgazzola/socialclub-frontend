import { test, expect, iniciarSesion, resaltar, USUARIOS } from './soporte/fixtures';

/**
 * Flujo: pago online de la cuota social con la pasarela (TASK-51). Corre con
 * la pasarela simulada, que sigue el mismo circuito que Mercado Pago: orden →
 * pasarela → vuelta → confirmación contra la API.
 *
 * Se rechaza y se cancela a propósito: así no se salda deuda de la socia del
 * seed que usan otros flujos (morosos, estado financiero). La aprobación y la
 * acreditación las cubre la compra de entradas (TC-069).
 */
test.describe.configure({ mode: 'serial' });

test(
  'TC-260 · Mantener la cuota pendiente cuando el pago es rechazado y permitir reintentar o cancelar',
  { tag: ['@US-10', '@TASK-51'] },
  async ({ page, paso }) => {
    let periodo = '';

    await paso('1. Como socia, elegir la cuota pendiente más antigua y confirmar el pago', async () => {
      await iniciarSesion(page, USUARIOS.socio);
      await page.goto('/mis-cuotas');
      const primera = page.getByRole('checkbox').nth(1);
      await primera.check();
      periodo = (await primera.locator('xpath=ancestor::tr').innerText()).match(/\d{4}-\d{2}/)![0];
      await page.getByRole('button', { name: /Pagar seleccionadas/ }).click();
      const confirmacion = page.getByRole('dialog', { name: 'Confirmar pago' });
      await expect(confirmacion).toContainText(periodo);
      await expect(confirmacion).not.toContainText('Número de tarjeta');
      await resaltar(confirmacion);
      await confirmacion.getByRole('button', { name: 'Ir a pagar' }).click();
      await expect(page).toHaveURL(/\/pagos\/simulador\?referencia=/);
    });

    await paso('2. La pasarela muestra el concepto y el total; rechazar el pago', async () => {
      await expect(page.getByText(`Cuota social ${periodo}`)).toBeVisible();
      await page.getByTestId('simulador-rechazar').click();
    });

    await paso('3. El resultado informa el rechazo y permite reintentar o cancelar', async () => {
      await expect(page).toHaveURL(/\/pagos\/resultado\?referencia=/);
      const rechazado = page.getByTestId('pago-rechazado');
      await expect(rechazado).toBeVisible();
      await expect(page.getByRole('button', { name: /Volver a la pasarela/ })).toBeVisible();
      await resaltar(rechazado);
    });

    await paso('4. Cancelar: no se cobró nada y la cuota sigue pendiente', async () => {
      await page.getByRole('button', { name: 'Cancelar pago' }).click();
      await expect(page.getByTestId('pago-cancelado')).toBeVisible();
      await page.getByRole('button', { name: 'Ver mis cuotas' }).click();
      const fila = page.getByRole('row').filter({ hasText: periodo });
      await expect(fila).toBeVisible();
      await resaltar(fila);
    });
  },
);
