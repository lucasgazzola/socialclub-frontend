import { describe, it, expect } from 'vitest';
import { formatearDni } from './dni';

describe('formatearDni', () => {
  it('formatea un DNI estándar con separador de miles en puntos', () => {
    expect(formatearDni('25123456')).toBe('25.123.456');
    expect(formatearDni('8123456')).toBe('8.123.456');
    expect(formatearDni('10000001')).toBe('10.000.001');
  });

  it('devuelve fallback cuando el DNI es null, undefined o vacío', () => {
    expect(formatearDni(null)).toBe('—');
    expect(formatearDni(undefined)).toBe('—');
    expect(formatearDni('')).toBe('—');
    expect(formatearDni('   ')).toBe('—');
    expect(formatearDni(null, 'Sin DNI')).toBe('Sin DNI');
  });

  it('devuelve el string original si no contiene solo dígitos', () => {
    expect(formatearDni('DNI-123')).toBe('DNI-123');
    expect(formatearDni('EXT123456')).toBe('EXT123456');
  });
});
