import { describe, expect, it } from 'vitest';
import { formatearFechaHora24 } from './fecha';

describe('formatearFechaHora24', () => {
  it('muestra la hora en formato de 24 h, sin «a. m.» ni «p. m.»', () => {
    const texto = formatearFechaHora24(new Date(2026, 10, 15, 13, 34, 8));
    expect(texto).toContain('15/11/2026');
    expect(texto).toContain('13:34:08');
    expect(texto).not.toMatch(/[ap]\.\s?m\./i);
  });
});
