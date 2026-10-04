import {
  test,
  expect,
  iniciarSesion,
  dniUnico,
  sufijoUnico,
  resaltar,
  USUARIOS,
} from './soporte/fixtures';

/**
 * Flujo: alta y baja de un socio desde la gestión del club (US-12, US-14).
 */
test.describe.configure({ mode: 'serial' });

const socio = {
  nombre: 'Julieta',
  apellido: `Socia ${sufijoUnico()}`,
  dni: dniUnico(),
  email: `julieta.${Date.now()}@club.local`,
};

/** Fila del socio en el listado, buscándolo por DNI. */
async function buscarSocio(page: import('@playwright/test').Page) {
  await page.getByPlaceholder('Buscar por nombre, apellido o DNI...').fill(socio.dni);
  return page.getByRole('row').filter({ hasText: socio.apellido });
}

test(
  'TC-026 · Registrar un nuevo socio con datos válidos',
  { tag: ['@US-12'] },
  async ({ page, paso }) => {
    await paso('1. Como administrador, abrir Socios y «Nuevo Socio»', async () => {
      await iniciarSesion(page, USUARIOS.admin);
      await page.goto('/socios');
      await page.getByRole('button', { name: 'Nuevo Socio' }).click();
    });

    const dialogo = page.getByRole('dialog', { name: 'Nuevo socio' });
    await paso('2. Completar los datos y la categoría', async () => {
      await dialogo.getByLabel('Nombre').fill(socio.nombre);
      await dialogo.getByLabel('Apellido').fill(socio.apellido);
      await dialogo.getByLabel('DNI').fill(socio.dni);
      await dialogo.getByLabel('Email').fill(socio.email);
      await dialogo.getByLabel('Categoría').selectOption({ label: 'Cuota General' });
      await resaltar(dialogo);
    });

    await paso('3. Crear el socio: figura activo en el listado', async () => {
      await dialogo.getByRole('button', { name: 'Crear socio' }).click();
      await expect(dialogo).toBeHidden();
      const fila = await buscarSocio(page);
      await expect(fila).toContainText(socio.dni);
      await expect(fila).toContainText('Cuota General');
      await expect(fila).toContainText('Activo');
      await resaltar(fila);
    });
  },
);

test('TC-039 · Validar la baja lógica de un socio', { tag: ['@US-14'] }, async ({ page, paso }) => {
  await paso('1. Como administrador, buscar al socio en Socios', async () => {
    await iniciarSesion(page, USUARIOS.admin);
    await page.goto('/socios');
    const fila = await buscarSocio(page);
    await expect(fila).toContainText('Activo');
  });

  await paso('2. Elegir «Dar de baja» y confirmar', async () => {
    const fila = page.getByRole('row').filter({ hasText: socio.apellido });
    await fila.getByRole('button', { name: 'Dar de baja' }).click();
    await resaltar(fila);
    await fila.getByRole('button', { name: 'Sí' }).click();
  });

  await paso('3. El socio queda inactivo', async () => {
    const fila = page.getByRole('row').filter({ hasText: socio.apellido });
    await expect(fila).toContainText('Inactivo');
    await resaltar(fila);
  });
});

test(
  'TC-043 · Validar que un socio dado de baja no aparezca en el listado activo',
  { tag: ['@US-14'] },
  async ({ page, paso }) => {
    await paso('1. Como administrador, filtrar Socios por «Activos»', async () => {
      await iniciarSesion(page, USUARIOS.admin);
      await page.goto('/socios');
      await page.getByRole('tab', { name: /Activos/ }).click();
      await page.getByPlaceholder('Buscar por nombre, apellido o DNI...').fill(socio.dni);
      await expect(page.getByRole('row').filter({ hasText: socio.apellido })).toHaveCount(0);
    });

    await paso('2. En «Inactivos» sí aparece', async () => {
      await page.getByRole('tab', { name: /Inactivos/ }).click();
      const fila = page.getByRole('row').filter({ hasText: socio.apellido });
      await expect(fila).toContainText('Inactivo');
      await resaltar(fila);
    });
  },
);
