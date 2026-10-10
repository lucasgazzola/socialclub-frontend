import { describe, it, expect } from 'vitest';
import { auditoriaFiltrosSchema } from './auditoria-filtros.schema';

describe('US-33 · auditoriaFiltrosSchema', () => {
  it('valida un objeto vacío o con campos opcionales sin error', () => {
    const res = auditoriaFiltrosSchema.safeParse({});
    expect(res.success).toBe(true);
  });

  it('permite fechas válidas en orden cronológico (fechaDesde <= fechaHasta)', () => {
    const res = auditoriaFiltrosSchema.safeParse({
      fechaDesde: '2026-01-01',
      fechaHasta: '2026-01-31',
    });
    expect(res.success).toBe(true);
  });

  it('permite misma fecha en desde y hasta (un solo día)', () => {
    const res = auditoriaFiltrosSchema.safeParse({
      fechaDesde: '2026-03-15',
      fechaHasta: '2026-03-15',
    });
    expect(res.success).toBe(true);
  });

  it('rechaza cuando fechaDesde es posterior a fechaHasta', () => {
    const res = auditoriaFiltrosSchema.safeParse({
      fechaDesde: '2026-03-20',
      fechaHasta: '2026-03-10',
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0].message).toBe(
        'La fecha "Desde" no puede ser posterior a "Hasta"',
      );
      expect(res.error.issues[0].path).toContain('fechaHasta');
    }
  });

  it('permite especificar solo fechaDesde o solo fechaHasta', () => {
    const resDesde = auditoriaFiltrosSchema.safeParse({ fechaDesde: '2026-01-01' });
    const resHasta = auditoriaFiltrosSchema.safeParse({ fechaHasta: '2026-12-31' });

    expect(resDesde.success).toBe(true);
    expect(resHasta.success).toBe(true);
  });

  it('permite valores válidos de período (todo, 1h, 24h, 7d, personalizado)', () => {
    const periodos = ['todo', '1h', '24h', '7d', 'personalizado'] as const;
    for (const periodo of periodos) {
      const res = auditoriaFiltrosSchema.safeParse({ periodo });
      expect(res.success).toBe(true);
    }
  });
});
