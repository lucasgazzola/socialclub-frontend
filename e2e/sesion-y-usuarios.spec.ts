import {
  test,
  expect,
  iniciarSesion,
  dniUnico,
  sufijoUnico,
  resaltar,
  USUARIOS,
  PASSWORD_SEED,
} from './soporte/fixtures';

/**
 * Flujo: sesión y ciclo de vida de un usuario administrativo. Login correcto e
 * incorrecto, alta de un usuario, su baja y el bloqueo de su acceso, y cierre
 * de sesión (US-39, US-01, US-03, US-40).
 */
test.describe.configure({ mode: 'serial' });

const colaborador = {
  nombre: 'Carla',
  apellido: `Colaboradora ${sufijoUnico()}`,
  email: `carla.${Date.now()}@socialclub.local`,
  password: 'Colabora123!',
};

test(
  'TC-085 · Iniciar sesión con credenciales válidas',
  { tag: ['@US-39'] },
  async ({ page, paso }) => {
    await paso('1. Abrir la pantalla de inicio de sesión', async () => {
      await page.goto('/login');
      await expect(page.getByRole('button', { name: 'Ingresar' })).toBeVisible();
    });

    await paso('2. Ingresar email y contraseña válidos', async () => {
      await page.getByLabel('Email').fill(USUARIOS.admin);
      await page.getByLabel('Contraseña').fill(PASSWORD_SEED);
      await page.getByRole('button', { name: 'Ingresar' }).click();
      await expect(page).not.toHaveURL(/\/login/);
      await expect(page.getByRole('heading', { name: /^Hola,/ })).toBeVisible();
    });
  },
);

test(
  'TC-086 · Rechazar inicio de sesión con credenciales inválidas',
  { tag: ['@US-39'] },
  async ({ page, paso }) => {
    await paso('1. Ingresar una contraseña incorrecta', async () => {
      await page.goto('/login');
      await page.getByLabel('Email').fill(USUARIOS.admin);
      await page.getByLabel('Contraseña').fill('Incorrecta123!');
      await page.getByRole('button', { name: 'Ingresar' }).click();
      const error = page.getByText('Credenciales inválidas');
      await expect(error).toBeVisible();
      await expect(page).toHaveURL(/\/login/);
      await resaltar(error);
    });
  },
);

test('TC-001 · Registrar un usuario válido', { tag: ['@US-01'] }, async ({ page, paso }) => {
  await paso('1. Como administrador, abrir Usuarios y «Nuevo usuario»', async () => {
    await iniciarSesion(page, USUARIOS.admin);
    await page.goto('/usuarios');
    await page.getByRole('button', { name: 'Nuevo usuario' }).click();
  });

  const dialogo = page.getByRole('dialog');
  await paso('2. Completar los datos con el rol COLABORADOR', async () => {
    await dialogo.getByLabel('Nombre').fill(colaborador.nombre);
    await dialogo.getByLabel('Apellido').fill(colaborador.apellido);
    await dialogo.getByLabel('DNI').fill(dniUnico());
    await dialogo.getByLabel('Email').fill(colaborador.email);
    await dialogo.getByLabel('Contraseña').fill(colaborador.password);
    await dialogo.getByRole('checkbox', { name: 'ADMIN' }).uncheck();
    await dialogo.getByRole('checkbox', { name: 'COLABORADOR' }).check();
  });

  await paso('3. Guardar: el usuario aparece activo en la grilla', async () => {
    await dialogo.getByRole('button', { name: 'Crear usuario' }).click();
    await expect(dialogo).toBeHidden();
    await page.getByPlaceholder(/Buscar por nombre/).fill(colaborador.apellido);
    const fila = page.getByRole('listitem').filter({ hasText: colaborador.email });
    await expect(fila).toContainText('COLABORADOR');
    await expect(fila).toContainText('Activo');
    await resaltar(fila);
  });
});

test(
  'TC-013 · Dar de baja correctamente a un integrante',
  { tag: ['@US-03'] },
  async ({ page, paso }) => {
    const fila = page.getByRole('listitem').filter({ hasText: colaborador.email });

    await paso('1. Como administrador, buscar al usuario en Usuarios', async () => {
      await iniciarSesion(page, USUARIOS.admin);
      await page.goto('/usuarios');
      await page.getByPlaceholder(/Buscar por nombre/).fill(colaborador.apellido);
      await expect(fila).toContainText('Activo');
    });

    await paso('2. Elegir «Desactivar» y confirmar', async () => {
      await fila.getByRole('button', { name: 'Desactivar' }).click();
      const confirmacion = page.getByRole('dialog', { name: 'Desactivar usuario' });
      await expect(confirmacion).toBeVisible();
      await resaltar(confirmacion);
    });

    await paso('3. El usuario queda inactivo', async () => {
      await page.getByRole('dialog').getByRole('button', { name: 'Desactivar' }).click();
      await expect(fila).toContainText('Inactivo');
      await resaltar(fila);
    });
  },
);

test(
  'TC-014 · Verificar que un integrante dado de baja no pueda iniciar sesión',
  { tag: ['@US-03'] },
  async ({ page, paso }) => {
    await paso('1. Intentar iniciar sesión con el usuario dado de baja', async () => {
      await page.goto('/login');
      await page.getByLabel('Email').fill(colaborador.email);
      await page.getByLabel('Contraseña').fill(colaborador.password);
      await page.getByRole('button', { name: 'Ingresar' }).click();
      const error = page.getByText('El usuario se encuentra dado de baja');
      await expect(error).toBeVisible();
      await expect(page).toHaveURL(/\/login/);
      await resaltar(error);
    });
  },
);

test('TC-088 · Cerrar sesión correctamente', { tag: ['@US-40'] }, async ({ page, paso }) => {
  await paso('1. Iniciar sesión como administrador', async () => {
    await iniciarSesion(page, USUARIOS.admin);
  });

  await paso('2. Elegir «Cerrar sesión»: vuelve a la pantalla de ingreso', async () => {
    await page.getByRole('button', { name: 'Cerrar sesión' }).click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('button', { name: 'Ingresar' })).toBeVisible();
  });
});

test(
  'TC-089 · Bloquear el acceso a secciones protegidas tras cerrar sesión',
  { tag: ['@US-40'] },
  async ({ page, paso }) => {
    await paso('1. Iniciar sesión y cerrarla', async () => {
      await iniciarSesion(page, USUARIOS.admin);
      await page.getByRole('button', { name: 'Cerrar sesión' }).click();
      await expect(page).toHaveURL(/\/login/);
    });

    await paso('2. Abrir Usuarios por URL: redirige al ingreso', async () => {
      await page.goto('/usuarios');
      await expect(page).toHaveURL(/\/login/);
      const r = await page.request.get('http://localhost:3101/api/v1/auth/me');
      expect(r.status()).toBe(401);
    });
  },
);
