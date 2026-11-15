import { describe, expect, it } from 'vitest';
import {
  MENSAJE_CONFIRMAR_EMAIL,
  MENSAJE_EMAILS_DISTINTOS,
  errorConfirmacionEmail,
  mismoEmail,
} from './email';

/** DT-54 — El email se escribe dos veces al cargarlo. */
describe('confirmación de email (DT-54)', () => {
  it('compara sin distinguir mayúsculas ni espacios en los extremos', () => {
    expect(mismoEmail('Ana@Club.local', ' ana@club.LOCAL ')).toBe(true);
    expect(mismoEmail('ana@club.local', 'ana@clu.local')).toBe(false);
  });

  it('exige la confirmación solo si se cargó un email', () => {
    expect(errorConfirmacionEmail('', '')).toBeNull();
    expect(errorConfirmacionEmail('ana@club.local', '')).toBe(MENSAJE_CONFIRMAR_EMAIL);
    expect(errorConfirmacionEmail('ana@club.local', 'otra@club.local')).toBe(
      MENSAJE_EMAILS_DISTINTOS,
    );
    expect(errorConfirmacionEmail('ana@club.local', 'ANA@club.local')).toBeNull();
  });
});
