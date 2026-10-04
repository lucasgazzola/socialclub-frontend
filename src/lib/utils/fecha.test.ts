import { describe, expect, it } from 'vitest';
import { displayAIso, enmascararFecha, isoADisplay, localAInstante } from './fecha';

describe('DT-40 · utilidades de fecha dd/mm/aaaa', () => {
  it('convierte ISO a dd/mm/aaaa', () => {
    expect(isoADisplay('2026-10-01')).toBe('01/10/2026');
    expect(isoADisplay('2026-10-01T03:00:00.000Z')).toBe('01/10/2026');
    expect(isoADisplay('')).toBe('');
    expect(isoADisplay(undefined)).toBe('');
  });

  it('convierte dd/mm/aaaa a ISO', () => {
    expect(displayAIso('01/10/2026')).toBe('2026-10-01');
    expect(displayAIso('29/02/2024')).toBe('2024-02-29');
  });

  it('rechaza fechas incompletas o inexistentes', () => {
    expect(displayAIso('01/10/20')).toBeNull();
    expect(displayAIso('31/02/2026')).toBeNull();
    expect(displayAIso('29/02/2026')).toBeNull();
    expect(displayAIso('00/10/2026')).toBeNull();
    expect(displayAIso('15/13/2026')).toBeNull();
  });

  it('aplica la máscara mientras se escribe', () => {
    expect(enmascararFecha('0')).toBe('0');
    expect(enmascararFecha('011')).toBe('01/1');
    expect(enmascararFecha('01102026')).toBe('01/10/2026');
    expect(enmascararFecha('01/10/2026')).toBe('01/10/2026');
    expect(enmascararFecha('011020261234')).toBe('01/10/2026');
    expect(enmascararFecha('ab01')).toBe('01');
  });
});

describe('DT-40 · fecha y hora locales hacia la API', () => {
  it('convierte "aaaa-mm-ddThh:mm" local en un instante ISO con zona', () => {
    expect(localAInstante('2027-01-15T18:00')).toBe(new Date(2027, 0, 15, 18, 0).toISOString());
  });

  it('deja igual lo que no es fecha y hora local', () => {
    expect(localAInstante('2027-01-15T21:00:00.000Z')).toBe('2027-01-15T21:00:00.000Z');
    expect(localAInstante('')).toBe('');
    expect(localAInstante(null)).toBeNull();
    expect(localAInstante(undefined)).toBeUndefined();
  });
});
