import { cuotaFormSchema } from './schemas';

function baseValues(overrides: Record<string, unknown> = {}) {
  return { disciplinaId: 1, categoriaId: 1, monto: 15000, periodoAplicacion: '', ...overrides };
}

describe('cuotaFormSchema', () => {
  it('acepta un monto mayor a cero con combinación disciplina-categoría', () => {
    const result = cuotaFormSchema.safeParse(baseValues());
    expect(result.success).toBe(true);
  });

  it('rechaza monto igual a cero', () => {
    const result = cuotaFormSchema.safeParse(baseValues({ monto: 0 }));
    expect(result.success).toBe(false);
  });

  it('rechaza monto negativo', () => {
    const result = cuotaFormSchema.safeParse(baseValues({ monto: -100 }));
    expect(result.success).toBe(false);
  });

  it('rechaza monto nulo', () => {
    const result = cuotaFormSchema.safeParse(baseValues({ monto: null }));
    expect(result.success).toBe(false);
  });

  it('rechaza la ausencia de disciplina', () => {
    const result = cuotaFormSchema.safeParse(baseValues({ disciplinaId: 0 }));
    expect(result.success).toBe(false);
  });

  it('rechaza la ausencia de categoría', () => {
    const result = cuotaFormSchema.safeParse(baseValues({ categoriaId: 0 }));
    expect(result.success).toBe(false);
  });

  it('acepta un período de aplicación opcional en formato YYYY-MM', () => {
    const result = cuotaFormSchema.safeParse(baseValues({ periodoAplicacion: '2026-09' }));
    expect(result.success).toBe(true);
  });

  it('rechaza un período de aplicación mal formateado', () => {
    const result = cuotaFormSchema.safeParse(baseValues({ periodoAplicacion: '2026-13' }));
    expect(result.success).toBe(false);
  });
});
