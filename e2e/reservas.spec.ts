import { test, expect, iniciarSesion, resaltar, USUARIOS } from './soporte/fixtures';

/**
 * Flujo: reservas de espacios (US-60, US-61, US-62). Secretaría evalúa las
 * solicitudes (aprueba una, rechaza la que se superpone y cancela otra por
 * falta de pago) y la socia sigue sus reservas desde «Mis reservas», paga una
 * seña con la pasarela simulada y cancela otra.
 *
 * Usa las reservas de ejemplo RES-SEED* del seed, que vuelven a su estado
 * inicial en cada corrida (SEED_RESETEAR_RESERVAS=1). Hasta que existan
 * US-55 (crear espacio) y US-59 (solicitar reserva) no se pueden crear por pantalla.
 */
test.describe.configure({ mode: 'serial' });

const fila = (page: import('@playwright/test').Page, codigo: string) => page.getByTestId(`reserva-${codigo}`);

test(
  'TC-275 · Aprobar una solicitud: plazo para la seña y turno bloqueado',
  { tag: ['@US-60'] },
  async ({ page, paso }) => {
    await paso('1. Como colaborador, abrir «Solicitudes de reserva»: las pendientes, por fecha del turno', async () => {
      await iniciarSesion(page, USUARIOS.colaborador);
      await page.goto('/reservas/solicitudes');
      await expect(fila(page, 'RES-SEED01')).toContainText('Lucía Registrada');
      await expect(fila(page, 'RES-SEED01')).toContainText('Socio');
      await resaltar(fila(page, 'RES-SEED01'), fila(page, 'RES-SEED02'));
    });

    await paso('2. Aprobar RES-SEED01 y confirmar', async () => {
      await fila(page, 'RES-SEED01').getByRole('button', { name: /Aprobar/ }).click();
      const dialogo = page.getByRole('dialog', { name: 'Aprobar solicitud' });
      await resaltar(dialogo);
      await dialogo.getByRole('button', { name: 'Aprobar' }).click();
    });

    await paso('3. La reserva pasa a «Pendientes de pago» con el plazo de la seña', async () => {
      await expect(page.getByText(/Solicitud RES-SEED01 aprobada\. El turno quedó bloqueado/)).toBeVisible();
      await page.getByText('Pendientes de pago', { exact: true }).click();
      await expect(fila(page, 'RES-SEED01')).toContainText('Aprobada · pendiente de pago');
      await expect(fila(page, 'RES-SEED01')).toContainText(/Seña hasta el/);
      await resaltar(fila(page, 'RES-SEED01'));
    });
  },
);

test(
  'TC-276 · Impedir aprobar una solicitud cuyo turno ya está ocupado',
  { tag: ['@US-60'] },
  async ({ page, paso }) => {
    await paso('1. RES-SEED02 avisa que su turno se superpone con RES-SEED01', async () => {
      await iniciarSesion(page, USUARIOS.colaborador);
      await page.goto('/reservas/solicitudes');
      await expect(fila(page, 'RES-SEED02')).toContainText('Turno ocupado: Reserva RES-SEED01');
      await resaltar(fila(page, 'RES-SEED02'));
    });

    await paso('2. Intentar aprobarla: el sistema lo impide y la solicitud sigue pendiente', async () => {
      await fila(page, 'RES-SEED02').getByRole('button', { name: /Aprobar/ }).click();
      await page.getByRole('dialog', { name: 'Aprobar solicitud' }).getByRole('button', { name: 'Aprobar' }).click();
      const error = page.getByText(/El turno ya no está disponible: se superpone con Reserva RES-SEED01/);
      await expect(error).toBeVisible();
      await page.getByRole('dialog', { name: 'Aprobar solicitud' }).getByRole('button', { name: /Cancelar/ }).click();
      await expect(fila(page, 'RES-SEED02')).toContainText('Pendiente de aprobación');
      await resaltar(error);
    });
  },
);

test(
  'TC-277 · Rechazar una solicitud con motivo obligatorio y avisar al solicitante',
  { tag: ['@US-60'] },
  async ({ page, paso }) => {
    const motivo = 'El turno se superpone con otra reserva aprobada.';
    const dialogo = page.getByRole('dialog', { name: 'Rechazar solicitud' });

    await paso('1. Rechazar RES-SEED02 sin motivo: el sistema lo exige', async () => {
      await iniciarSesion(page, USUARIOS.colaborador);
      await page.goto('/reservas/solicitudes');
      await fila(page, 'RES-SEED02').getByRole('button', { name: /Rechazar/ }).click();
      await dialogo.getByRole('button', { name: 'Rechazar solicitud' }).click();
      await expect(dialogo.getByText('El motivo es obligatorio (al menos 5 caracteres).')).toBeVisible();
      await resaltar(dialogo);
    });

    await paso('2. Escribir el motivo y confirmar: la solicitud queda rechazada con su motivo', async () => {
      await dialogo.getByLabel('Motivo *').fill(motivo);
      await dialogo.getByRole('button', { name: 'Rechazar solicitud' }).click();
      await expect(page.getByText('Solicitud RES-SEED02 rechazada. Le avisamos al solicitante.')).toBeVisible();
      await page.getByText('Rechazadas', { exact: true }).click();
      await expect(fila(page, 'RES-SEED02')).toContainText(`Motivo: ${motivo}`);
      await resaltar(fila(page, 'RES-SEED02'));
    });
  },
);

test(
  'TC-281 · Cancelar por falta de pago una reserva con la seña vencida',
  { tag: ['@US-61'] },
  async ({ page, paso }) => {
    await paso('1. En «Pendientes de pago», RES-SEED06 muestra la seña vencida', async () => {
      await iniciarSesion(page, USUARIOS.colaborador);
      await page.goto('/reservas/solicitudes');
      await page.getByText('Pendientes de pago', { exact: true }).click();
      await expect(fila(page, 'RES-SEED06')).toContainText(/Seña vencida el/);
      await resaltar(fila(page, 'RES-SEED06'));
    });

    await paso('2. Cancelar por falta de pago y confirmar: el turno queda libre', async () => {
      await fila(page, 'RES-SEED06').getByRole('button', { name: 'Cancelar por falta de pago' }).click();
      await page.getByRole('dialog', { name: 'Cancelar por falta de pago' }).getByRole('button', { name: 'Cancelar reserva' }).click();
      await expect(page.getByText('Reserva RES-SEED06 cancelada por falta de pago. El turno quedó libre.')).toBeVisible();
      await page.getByText('Canceladas', { exact: true }).click();
      await expect(fila(page, 'RES-SEED06')).toContainText('Cancelada por falta de pago');
      await resaltar(fila(page, 'RES-SEED06'));
    });
  },
);

test(
  'TC-286 · Consultar «Mis Reservas» con el estado y el detalle de cada solicitud',
  { tag: ['@US-62'] },
  async ({ page, paso }) => {
    await paso('1. Como socia, abrir «Mis reservas» desde el menú', async () => {
      await iniciarSesion(page, USUARIOS.socio);
      await page.getByRole('link', { name: 'Mis reservas' }).click();
      await expect(page.getByRole('heading', { name: 'Mis reservas', exact: true })).toBeVisible();
    });

    await paso('2. Cada reserva muestra código, espacio, turno, monto y estado; la rechazada, su motivo', async () => {
      const aprobada = page.getByTestId('mi-reserva-RES-SEED01');
      const rechazada = page.getByTestId('mi-reserva-RES-SEED05');
      await expect(aprobada).toContainText('Cancha de fútbol 5');
      await expect(aprobada).toContainText('Aprobada · pendiente de pago');
      await expect(rechazada).toContainText('Rechazada');
      await expect(rechazada).toContainText('Motivo: La cancha estaba reservada para un torneo oficial.');
      await expect(page.getByTestId('mi-reserva-RES-SEED04')).toContainText('Confirmada');
      await resaltar(aprobada, rechazada);
    });
  },
);

test(
  'TC-287 · Destacar el límite y las instrucciones para pagar la seña',
  { tag: ['@US-62'] },
  async ({ page, paso }) => {
    await paso('1. En «Mis reservas», la reserva aprobada destaca el límite y cómo pagar la seña', async () => {
      await iniciarSesion(page, USUARIOS.socio);
      await page.goto('/mis-reservas');
      const aviso = page.getByTestId('sena-pendiente-RES-SEED03');
      await expect(aviso).toContainText('Pagá la seña de $15.000,00 antes del');
      await expect(aviso).toContainText('Mercado Pago o en la secretaría del club');
      await expect(aviso.getByRole('button', { name: /Pagar seña con Mercado Pago/ })).toBeVisible();
      await resaltar(aviso);
    });
  },
);

test(
  'TC-279 · Pagar la seña online con la pasarela y confirmar la reserva',
  { tag: ['@US-60'] },
  async ({ page, paso }) => {
    await paso('1. Pagar la seña de RES-SEED03: redirige a la pasarela', async () => {
      await iniciarSesion(page, USUARIOS.socio);
      await page.goto('/mis-reservas');
      await page.getByTestId('sena-pendiente-RES-SEED03').getByRole('button', { name: /Pagar seña con Mercado Pago/ }).click();
      await expect(page).toHaveURL(/\/pagos\/simulador\?referencia=/);
      await expect(page.getByText('Seña de la reserva RES-SEED03 (Quincho)')).toBeVisible();
    });

    await paso('2. Aprobar el pago: vuelve con el pago aprobado', async () => {
      await page.getByTestId('simulador-aprobar').click();
      const aprobado = page.getByTestId('pago-aprobado');
      await expect(aprobado).toBeVisible();
      await resaltar(aprobado);
    });

    await paso('3. En «Mis reservas» la reserva quedó confirmada', async () => {
      await page.getByRole('button', { name: 'Ver mis reservas' }).click();
      const reserva = page.getByTestId('mi-reserva-RES-SEED03');
      await expect(reserva).toContainText('Confirmada');
      await expect(page.getByTestId('sena-pendiente-RES-SEED03')).toHaveCount(0);
      await resaltar(reserva);
    });
  },
);

test(
  'TC-284 · El solicitante cancela su reserva antes del plazo de penalización',
  { tag: ['@US-61'] },
  async ({ page, paso }) => {
    const reserva = page.getByTestId('mi-reserva-RES-SEED04');

    await paso('1. En «Mis reservas», elegir «Cancelar» en RES-SEED04', async () => {
      await iniciarSesion(page, USUARIOS.socio);
      await page.goto('/mis-reservas');
      await reserva.getByRole('button', { name: 'Cancelar' }).click();
      const dialogo = page.getByRole('dialog', { name: 'Cancelar reserva' });
      await resaltar(dialogo);
      await dialogo.getByRole('button', { name: 'Cancelar reserva' }).click();
    });

    await paso('2. La reserva queda cancelada por el usuario y el turno libre', async () => {
      await expect(page.getByText('Cancelaste la reserva RES-SEED04. El turno quedó libre.')).toBeVisible();
      await expect(reserva).toContainText('Cancelada por el usuario');
      await expect(reserva.getByRole('button', { name: 'Cancelar' })).toHaveCount(0);
      await resaltar(reserva);
    });
  },
);
