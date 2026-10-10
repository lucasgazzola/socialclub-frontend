import { describe, expect, it } from 'vitest';
import {
  aniosDisponibles,
  describirRango,
  mesCorto,
  nombreDelMes,
  rangoDeTrimestre,
  trimestreDe,
} from './periodo';

describe('US-35 · períodos del reporte', () => {
  it('un trimestre va del primer al tercer mes', () => {
    expect(rangoDeTrimestre(2026, 3)).toEqual({ desde: '2026-07', hasta: '2026-09' });
    expect(rangoDeTrimestre(2026, 4)).toEqual({ desde: '2026-10', hasta: '2026-12' });
    expect(trimestreDe(10)).toBe(4);
  });

  it('describe el rango en castellano', () => {
    expect(describirRango({ desde: '2026-07', hasta: '2026-09' })).toBe(
      'Julio 2026 a septiembre 2026',
    );
    expect(describirRango({ desde: '2026-10', hasta: '2026-10' })).toBe('Octubre 2026');
    expect(nombreDelMes('2026-01')).toBe('enero 2026');
    expect(mesCorto('2026-08')).toBe('ago 26');
  });

  it('ofrece los años desde 2025 hasta el actual', () => {
    expect(aniosDisponibles(new Date(2026, 9, 10))).toEqual([2026, 2025]);
  });
});
