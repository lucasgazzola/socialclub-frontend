import {
  test,
  expect,
  iniciarSesion,
  dniUnico,
  sufijoUnico,
  resaltar,
  ok,
  USUARIOS,
} from './soporte/fixtures';

/**
 * Flujo: cuotas. El administrador configura la cuota social del período
 * siguiente y secretaría cobra la cuota deportiva de un participante hasta
 * dejarlo al día; un delegado no puede entrar al cobro (US-16, US-21).
 *
 * El participante se prepara por API (el alta por pantalla la cubre TC-017):
 * inscripto hoy en Natación · Adultos / Libre, cuya tarifa del seed es $16.000.
 */
test.describe.configure({ mode: 'serial' });

const participante = { dni: dniUnico(), nombre: 'Tomás', apellido: `Cuotas ${sufijoUnico()}` };
const montoSocial = String(20_000 + Math.floor(Math.random() * 9_000));
const periodoActual = (() => {
  const d = new Date();
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
})();

interface Disciplina {
  id: number;
  nombre: string;
  categorias: { id: number; nombre: string }[];
}

test.beforeAll(async ({ apiAdmin }) => {
  const { items } = await ok<{ items: Disciplina[] }>(
    await apiAdmin.get('disciplinas', { params: { estado: 'ACTIVA', porPagina: 100 } }),
  );
  const natacion = items.find((d) => d.nombre === 'Natación')!;
  await ok(
    await apiAdmin.post('inscripcion', {
      data: {
        ...participante,
        fechaNacimiento: '1990-05-10',
        genero: 'MASCULINO',
        disciplinaId: natacion.id,
        categoriaDisciplinaId: natacion.categorias.find((c) => c.nombre === 'Adultos / Libre')!.id,
      },
    }),
  );
});

test(
  'TC-091 · Configurar la cuota social de una categoría para el período siguiente',
  { tag: ['@US-16'] },
  async ({ page, paso }) => {
    await paso(
      '1. Como administrador, abrir Cuota social y «Configurar cuota social»',
      async () => {
        await iniciarSesion(page, USUARIOS.admin);
        await page.goto('/cuotas/social');
        await page.getByRole('button', { name: 'Configurar cuota social' }).click();
      },
    );

    const dialogo = page.getByRole('dialog', { name: 'Nueva cuota social' });
    await paso(
      '2. Elegir la categoría y el monto, sin período (rige desde el siguiente)',
      async () => {
        await dialogo.getByLabel('Categoría').selectOption({ label: 'Cuota General' });
        await dialogo.getByLabel('Monto mensual ($)').fill(montoSocial);
        await resaltar(dialogo);
      },
    );

    await paso('3. Guardar: la configuración figura en el listado', async () => {
      await dialogo.getByRole('button', { name: 'Configurar cuota social' }).click();
      await expect(dialogo).toBeHidden();
      const monto = Number(montoSocial).toLocaleString('es-AR');
      const fila = page
        .getByRole('row')
        .filter({ hasText: 'Cuota General' })
        .filter({ hasText: monto });
      await expect(fila.first()).toBeVisible();
      await resaltar(fila.first());
    });
  },
);

test(
  'TC-117 · Visualizar las cuotas deportivas pendientes por disciplina',
  { tag: ['@US-21'] },
  async ({ page, paso }) => {
    await paso('1. Como colaborador, abrir «Cobrar cuota deportiva»', async () => {
      await iniciarSesion(page, USUARIOS.colaborador);
      await page.goto('/cuotas/deportiva/cobrar');
      await expect(
        page.getByRole('heading', { name: 'Registrar pago de cuota deportiva' }),
      ).toBeVisible();
    });

    await paso(
      '2. Buscar al participante por DNI: muestra Natación con el mes en curso',
      async () => {
        await page.getByLabel('Buscar participante por DNI').fill(participante.dni);
        await page.getByRole('button', { name: 'Buscar' }).click();
        await expect(page.getByText('Con deuda')).toBeVisible();
        const natacion = page.getByRole('heading', { name: /Natación/ });
        await expect(natacion).toBeVisible();
        await expect(page.getByRole('checkbox', { name: periodoActual })).toBeVisible();
        await expect(
          page.getByText('$ 16.000').or(page.getByText('$16.000')).first(),
        ).toBeVisible();
        await resaltar(natacion);
      },
    );
  },
);

test(
  'TC-110 · Cambiar el estado del integrante a «al día» al saldar todos los períodos',
  { tag: ['@US-21'] },
  async ({ page, paso }) => {
    await paso(
      '1. Como colaborador, buscar al participante y marcar el período adeudado',
      async () => {
        await iniciarSesion(page, USUARIOS.colaborador);
        await page.goto('/cuotas/deportiva/cobrar');
        await page.getByLabel('Buscar participante por DNI').fill(participante.dni);
        await page.getByRole('button', { name: 'Buscar' }).click();
        await page.getByRole('checkbox', { name: periodoActual }).check();
      },
    );

    await paso('2. Registrar el cobro: el participante queda «Al día»', async () => {
      await page.getByRole('button', { name: 'Registrar cobro' }).click();
      const estado = page.getByText('Al día', { exact: true });
      await expect(estado).toBeVisible();
      await expect(page.getByRole('checkbox', { name: periodoActual })).toHaveCount(0);
      await resaltar(estado);
    });
  },
);

test(
  'TC-116 · Impedir el acceso al cobro sin rol autorizado',
  { tag: ['@US-21'] },
  async ({ page, paso }) => {
    await paso('1. Como delegado, abrir «Cobrar cuota deportiva» por URL', async () => {
      await iniciarSesion(page, USUARIOS.delegado);
      await page.goto('/cuotas/deportiva/cobrar');
      const aviso = page.getByText('No tenés permisos para acceder a esta sección.');
      await expect(aviso).toBeVisible();
      await resaltar(aviso);
    });

    await paso('2. La API también lo rechaza (403)', async () => {
      const r = await page.request.get(
        `http://localhost:3101/api/v1/pagos-deportivos/persona/1/pendientes`,
      );
      expect(r.status()).toBe(403);
    });
  },
);
