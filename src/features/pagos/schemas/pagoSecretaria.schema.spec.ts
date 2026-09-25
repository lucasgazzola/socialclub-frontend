import { describe, it, expect } from 'vitest';
import { pagoSecretariaSchema } from './pagoSecretaria.schema';

describe('US-17 · pagoSecretariaSchema', () => {
  it('valida exitosamente un payload correcto con efectivo', () => {
    const data = {
      periodos: ['2026-08', '2026-09'],
      metodoPago: 'EFECTIVO',
      observaciones: 'Pago en ventanilla secretaría',
    };

    const resultado = pagoSecretariaSchema.safeParse(data);
    expect(resultado.success).toBe(true);
    if (resultado.success) {
      expect(resultado.data.periodos).toEqual(['2026-08', '2026-09']);
      expect(resultado.data.metodoPago).toBe('EFECTIVO');
      expect(resultado.data.observaciones).toBe('Pago en ventanilla secretaría');
    }
  });

  it('permite omitir el campo opcional de observaciones', () => {
    const data = {
      periodos: ['2026-08'],
      metodoPago: 'TRANSFERENCIA',
    };

    const resultado = pagoSecretariaSchema.safeParse(data);
    expect(resultado.success).toBe(true);
  });

  it('falla si la lista de períodos está vacía', () => {
    const data = {
      periodos: [],
      metodoPago: 'EFECTIVO',
    };

    const resultado = pagoSecretariaSchema.safeParse(data);
    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.issues[0]?.message).toMatch(/al menos un período/i);
    }
  });

  it('falla si el método de pago no pertenece a los permitidos', () => {
    const data = {
      periodos: ['2026-08'],
      metodoPago: 'BITCOIN',
    };

    const resultado = pagoSecretariaSchema.safeParse(data);
    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.issues[0]?.message).toMatch(/método de pago válido/i);
    }
  });

  it('falla si las observaciones superan los 255 caracteres', () => {
    const data = {
      periodos: ['2026-08'],
      metodoPago: 'EFECTIVO',
      observaciones: 'a'.repeat(256),
    };

    const resultado = pagoSecretariaSchema.safeParse(data);
    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.issues[0]?.message).toMatch(/255 caracteres/i);
    }
  });
});
