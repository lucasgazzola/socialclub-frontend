import { describe, expect, it } from 'vitest';
import { crearSocioFormSchema } from './schemas';

const base = { nombre: 'Ana', apellido: 'Paz', dni: '40111222' };
const mensajes = (r: ReturnType<ReturnType<typeof crearSocioFormSchema>['safeParse']>) =>
  r.success ? [] : r.error.issues.map((i) => i.message);

/** DT-54 — Al cargar el email del socio se escribe dos veces. */
describe('crearSocioFormSchema (DT-54)', () => {
  it('en el alta, con email pide repetirlo y que coincida', () => {
    const schema = crearSocioFormSchema();
    expect(mensajes(schema.safeParse({ ...base, email: 'ana@club.local' }))).toEqual([
      'Confirmá el email',
    ]);
    expect(
      mensajes(schema.safeParse({ ...base, email: 'ana@club.local', confirmarEmail: 'an@club.local' })),
    ).toEqual(['Los emails no coinciden']);
    expect(
      schema.safeParse({ ...base, email: 'ana@club.local', confirmarEmail: 'ANA@club.local' }).success,
    ).toBe(true);
  });

  it('sin email no pide confirmación', () => {
    expect(crearSocioFormSchema().safeParse({ ...base, email: '' }).success).toBe(true);
  });

  it('en la edición solo la pide si cambia el email', () => {
    const schema = crearSocioFormSchema('ana@club.local');
    expect(schema.safeParse({ ...base, email: 'ana@club.local' }).success).toBe(true);
    expect(mensajes(schema.safeParse({ ...base, email: 'nueva@club.local' }))).toEqual([
      'Confirmá el email',
    ]);
  });
});
