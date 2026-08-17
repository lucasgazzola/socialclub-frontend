import { cuotaFormSchema } from './schemas';

function baseValues(overrides: Record<string, unknown> = {}) {
  return { disciplineId: 1, categoryId: 1, amount: 15000, appliedPeriod: '', ...overrides };
}

describe('cuotaFormSchema', () => {
  it('acepta un monto mayor a cero con combinación disciplina-categoría', () => {
    const result = cuotaFormSchema.safeParse(baseValues());
    expect(result.success).toBe(true);
  });

  it('rechaza monto igual a cero', () => {
    const result = cuotaFormSchema.safeParse(baseValues({ amount: 0 }));
    expect(result.success).toBe(false);
  });

  it('rechaza monto negativo', () => {
    const result = cuotaFormSchema.safeParse(baseValues({ amount: -100 }));
    expect(result.success).toBe(false);
  });

  it('rechaza monto nulo', () => {
    const result = cuotaFormSchema.safeParse(baseValues({ amount: null }));
    expect(result.success).toBe(false);
  });

  it('rechaza la ausencia de disciplina', () => {
    const result = cuotaFormSchema.safeParse(baseValues({ disciplineId: 0 }));
    expect(result.success).toBe(false);
  });

  it('rechaza la ausencia de categoría', () => {
    const result = cuotaFormSchema.safeParse(baseValues({ categoryId: 0 }));
    expect(result.success).toBe(false);
  });

  it('acepta un período de aplicación opcional en formato YYYY-MM', () => {
    const result = cuotaFormSchema.safeParse(baseValues({ appliedPeriod: '2026-09' }));
    expect(result.success).toBe(true);
  });

  it('rechaza un período de aplicación mal formateado', () => {
    const result = cuotaFormSchema.safeParse(baseValues({ appliedPeriod: '2026-13' }));
    expect(result.success).toBe(false);
  });
});
