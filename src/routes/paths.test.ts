import { describe, expect, it } from 'vitest';
import { ROUTES, destinoAlIngresar, esDeGestion, rutaNuevaDe } from './paths';

describe('TASK-60 · zonas del sitio', () => {
  it('el panel vive en /admin, lo personal en /mi-club y las rutas que arma la API no se mueven', () => {
    expect(ROUTES.dashboard).toBe('/admin');
    expect(ROUTES.socios).toBe('/admin/socios');
    expect(ROUTES.miClub).toBe('/mi-club');
    expect(ROUTES.misEntradas).toBe('/mi-club/entradas');
    expect(ROUTES.inicio).toBe('/');
    expect(ROUTES.verificarEmail).toBe('/verificar-email');
    expect(ROUTES.resultadoPago).toBe('/pagos/resultado');
  });

  it.each([
    [['ADMIN'], true],
    [['COLABORADOR'], true],
    [['DELEGADO', 'SOCIO'], true],
    [['SOCIO'], false],
    [[], false],
    [undefined, false],
  ])('esDeGestion(%j) = %s', (roles, esperado) => {
    expect(esDeGestion(roles as string[] | undefined)).toBe(esperado);
  });

  it('al ingresar, la gestión va al panel y el resto a Mi club', () => {
    expect(destinoAlIngresar(['ADMIN'])).toBe('/admin');
    expect(destinoAlIngresar(['SOCIO'])).toBe('/mi-club');
    expect(destinoAlIngresar([])).toBe('/mi-club');
  });

  it.each([
    ['/socios', '/admin/socios'],
    ['/cuotas/social/morosos', '/admin/cuotas/social/morosos'],
    ['/participante/3/editar', '/admin/participante/3/editar'],
    ['/entradas/validar', '/admin/entradas/validar'],
    ['/eventos/4/validar', '/admin/eventos/4/validar'],
    ['/mis-entradas', '/mi-club/entradas'],
    ['/mis-cuotas', '/mi-club/cuotas'],
    ['/hacerme-socio', '/asociarme'],
    ['/eventos', '/mi-club/eventos'],
    ['/eventos/4/entradas', '/mi-club/eventos/4/entradas'],
    ['/inscripcion/mis-solicitudes', '/mi-club/disciplinas/solicitudes'],
  ])('la ruta vieja %s lleva a %s', (vieja, nueva) => {
    expect(rutaNuevaDe(vieja)).toBe(nueva);
  });

  it('no inventa destino para rutas desconocidas ni confunde prefijos', () => {
    expect(rutaNuevaDe('/no-existe')).toBeNull();
    expect(rutaNuevaDe('/sociosx')).toBeNull();
  });
});
