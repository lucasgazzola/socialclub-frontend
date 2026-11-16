import {
  test,
  expect,
  iniciarSesion,
  dniUnico,
  sufijoUnico,
  resaltar,
  USUARIOS,
  enlaceDeVerificacion,
} from './soporte/fixtures';

/**
 * Flujo: un delegado inscribe a un participante nuevo con documentación
 * faltante, la alerta aparece en su Inicio y solo la ven los delegados de esa
 * disciplina (US-05, US-26, DT-42).
 *
 * Natación (seed) exige la ficha técnica al inscribirse (plazo 0, se adjunta
 * en el alta desde H13) y el certificado médico a los 10 días: ese faltante
 * entra en la ventana de alertas desde el primer día. El delegado del seed
 * tiene Natación a cargo.
 */
test.describe.configure({ mode: 'serial' });

const participante = {
  dni: dniUnico(),
  nombre: 'Martina',
  apellido: `Prueba ${sufijoUnico()}`,
  nacimiento: '15/03/1995',
};
const nombreEnAlertas = `${participante.apellido}, ${participante.nombre}`;
const delegadoBasquet = {
  dni: dniUnico(),
  email: `delegado.basquet.${Date.now()}@socialclub.local`,
  password: 'Delegado123!',
};

test(
  'TC-017 · Registrar correctamente un participante en una disciplina activa',
  { tag: ['@US-05'] },
  async ({ page, paso }) => {
    await paso('1. Iniciar sesión como delegado', async () => {
      await iniciarSesion(page, USUARIOS.delegado);
    });

    await paso('2. Abrir Participantes y elegir «Nuevo participante»', async () => {
      await page.goto('/admin/participantes');
      await page.getByRole('button', { name: 'Nuevo participante' }).click();
      await expect(page.getByRole('dialog', { name: 'Nuevo participante' })).toBeVisible();
    });

    const dialogo = page.getByRole('dialog');
    await paso('3. Completar los datos de un participante con DNI nuevo', async () => {
      await dialogo.getByLabel('DNI').fill(participante.dni);
      await expect(
        dialogo.getByText('DNI nuevo: se va a registrar un participante nuevo.'),
      ).toBeVisible();
      await dialogo.getByLabel('Nombre').fill(participante.nombre);
      await dialogo.getByLabel('Apellido').fill(participante.apellido);
      await dialogo.locator('#fechaNacimiento').fill(participante.nacimiento);
      await dialogo.getByLabel('Género').selectOption('FEMENINO');
    });

    await paso(
      '4. Elegir Natación · Adultos / Libre y revisar la documentación exigida',
      async () => {
        await dialogo.getByLabel('Disciplina').selectOption({ label: 'Natación' });
        await dialogo.getByLabel('Categoría').selectOption({ label: 'Adultos / Libre' });
        const requisitos = dialogo.getByRole('region', { name: 'Requisitos de la inscripción' });
        // H13: la ficha técnica (plazo 0) se presenta al inscribir; el certificado tiene plazo.
        await expect(requisitos.getByText('Hay que presentarlo al inscribirse')).toBeVisible();
        await expect(requisitos.getByText('Ficha técnica: Natación')).toBeVisible();
        await expect(requisitos.getByText('Con plazo para presentar')).toBeVisible();
        await expect(requisitos.getByText('Certificado médico de aptitud física')).toBeVisible();
        await resaltar(requisitos);
      },
    );

    await paso('5. Adjuntar la ficha técnica, que hay que presentar al inscribirse', async () => {
      const ficha = dialogo.getByRole('listitem').filter({ hasText: 'Ficha técnica: Natación' });
      await ficha.getByRole('button', { name: 'Cargar' }).click();
      await ficha
        .locator('#vencimiento-FICHA_TECNICA_NATACION')
        .fill(`15/03/${new Date().getFullYear() + 1}`);
      await ficha.getByLabel('Archivo para Ficha técnica: Natación').setInputFiles({
        name: 'ficha-natacion.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('%PDF-1.4 ficha técnica de prueba'),
      });
      await resaltar(ficha);
    });

    await paso('6. Registrar al participante sin el certificado, que tiene plazo', async () => {
      await dialogo.getByRole('button', { name: 'Registrar participante' }).click();
      const resultado = dialogo.getByRole('status');
      await expect(resultado).toContainText(
        `${participante.nombre} ${participante.apellido} quedó inscripto correctamente.`,
      );
      await expect(resultado).toContainText('Documentación:');
      await resaltar(resultado);
    });
  },
);

test(
  'TC-162 · Alertar un documento faltante cuyo plazo de presentación termina en los próximos 10 días',
  { tag: ['@US-26'] },
  async ({ page, paso }) => {
    await paso('1. Iniciar sesión como delegado', async () => {
      await iniciarSesion(page, USUARIOS.delegado);
    });

    await paso('2. Mirar las alertas del Inicio', async () => {
      const alertas = page.getByRole('region', { name: 'Alertas de documentación' });
      const filas = alertas.getByRole('row').filter({ hasText: nombreEnAlertas });
      // El certificado médico tiene 10 días: entra en la ventana de alertas.
      // La ficha técnica se presentó al inscribir (H13), así que no falta.
      const certificado = filas.filter({ hasText: 'Certificado médico de aptitud física' });
      await expect(certificado).toContainText('Natación · Adultos / Libre');
      await expect(certificado).toContainText('en 10 días');
      await expect(certificado).toContainText('Falta presentar');
      await expect(filas.filter({ hasText: 'Ficha técnica: Natación' })).toHaveCount(0);
      await resaltar(certificado);
    });
  },
);

test(
  'TC-176 · DT-42: asignar disciplinas a cargo a un delegado desde Usuarios',
  { tag: ['@US-26'] },
  async ({ page, paso }) => {
    await paso('1. Iniciar sesión como administrador y abrir Usuarios', async () => {
      await iniciarSesion(page, USUARIOS.admin);
      await page.goto('/admin/usuarios');
      await page.getByRole('button', { name: 'Nuevo usuario' }).click();
    });

    const dialogo = page.getByRole('dialog');
    await paso('2. Cargar un delegado nuevo sin disciplinas: el formulario las exige', async () => {
      await dialogo.getByLabel('Nombre').fill('Bruno');
      await dialogo.getByLabel('Apellido').fill('Delegado');
      await dialogo.getByLabel('DNI').fill(delegadoBasquet.dni);
      await dialogo.getByLabel('Email', { exact: true }).fill(delegadoBasquet.email);
      // DT-54: el email se escribe dos veces; la contraseña la elige el delegado.
      await dialogo.getByLabel('Repetí el email').fill(delegadoBasquet.email);
      await dialogo.getByRole('checkbox', { name: 'ADMIN' }).uncheck();
      await dialogo.getByRole('checkbox', { name: 'DELEGADO' }).check();
      await dialogo.getByRole('button', { name: 'Crear usuario' }).click();
      const aviso = dialogo.getByText('Seleccioná al menos una disciplina a cargo del delegado');
      await expect(aviso).toBeVisible();
      await resaltar(aviso);
    });

    await paso('3. Marcar Básquet en «Disciplinas a cargo» y guardar', async () => {
      await dialogo.getByRole('checkbox', { name: 'Básquet' }).check();
      await dialogo.getByRole('button', { name: 'Crear usuario' }).click();
      await expect(dialogo).toBeHidden();
    });

    await paso('4. La grilla muestra la disciplina debajo del rol', async () => {
      // Por DNI: la base de los E2E acumula un «Bruno Delegado» por corrida.
      await page.getByPlaceholder(/Buscar por nombre/).fill(delegadoBasquet.dni);
      const fila = page.getByRole('row').filter({ hasText: delegadoBasquet.email });
      await expect(fila).toContainText('DELEGADO');
      await expect(fila).toContainText('Básquet');
      await resaltar(fila);
    });

    await paso('5. El delegado activa su cuenta desde el enlace del email (DT-54)', async () => {
      await page.context().clearCookies();
      await page.goto(await enlaceDeVerificacion(delegadoBasquet.email));
      await page.getByLabel('Contraseña', { exact: true }).fill(delegadoBasquet.password);
      await page.getByLabel('Repetí la contraseña').fill(delegadoBasquet.password);
      await page.getByRole('button', { name: 'Activar mi cuenta' }).click();
      await expect(page.getByRole('status')).toContainText('Tu cuenta quedó activa');
    });
  },
);

test(
  'TC-173 · DT-42: el delegado ve solo las alertas de las disciplinas que tiene a cargo',
  { tag: ['@US-26'] },
  async ({ page, paso }) => {
    const alertas = page.getByRole('region', { name: 'Alertas de documentación' });

    await paso('1. El delegado de Básquet no ve la alerta de Natación', async () => {
      await iniciarSesion(page, delegadoBasquet.email, delegadoBasquet.password);
      await expect(page.getByRole('heading', { name: /Inicio|Hola/ }).first()).toBeVisible();
      await expect(alertas.getByText(nombreEnAlertas)).toHaveCount(0);
    });

    await paso('2. El delegado de Natación sí la ve', async () => {
      await page.context().clearCookies();
      await iniciarSesion(page, USUARIOS.delegado);
      const fila = alertas.getByRole('row').filter({ hasText: nombreEnAlertas });
      await expect(fila.first()).toBeVisible();
      await resaltar(fila.first());
    });
  },
);
