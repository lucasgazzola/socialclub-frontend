import { cuotaFormSchema } from './schemas';

function baseValues(overrides: Record<string, unknown> = {}) {
  return { disciplinaId: 1, categoriaDisciplinaId: 7, monto: 15000, periodoAplicacion: '', ...overrides };
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

  it('TASK-33: sin categoría es la tarifa base de la disciplina', () => {
    const result = cuotaFormSchema.safeParse(baseValues({ categoriaDisciplinaId: '' }));
    expect(result.success).toBe(true);
    expect(result.data?.categoriaDisciplinaId).toBeUndefined();
  });

  it('TASK-33: el descuento para socios es un entero de 0 a 100 (vacío = 0)', () => {
    expect(cuotaFormSchema.safeParse(baseValues({ descuentoSocioPorcentaje: '' })).data?.descuentoSocioPorcentaje).toBe(0);
    expect(cuotaFormSchema.safeParse(baseValues({ descuentoSocioPorcentaje: '101' })).success).toBe(false);
    expect(cuotaFormSchema.safeParse(baseValues({ descuentoSocioPorcentaje: '12.5' })).success).toBe(false);
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
