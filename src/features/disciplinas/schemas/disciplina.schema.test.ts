import { describe, expect, it } from 'vitest';
import { disciplinaSchema } from './disciplina.schema';

const base = {
  nombre: 'Natación',
  descripcion: '',
  genero: 'NO_BINARIO_NO_ESPECIFICADO' as const,
  edadMinima: null,
  edadMaxima: null,
  solicitaDocumentacion: false,
  activo: true,
  requerimientosDocumentacion: [],
};

describe('disciplinaSchema', () => {
  it('acepta una disciplina sin restricciones ni documentación', () => {
    expect(disciplinaSchema.safeParse(base).success).toBe(true);
  });

  it('requiere plazo y tipos cuando solicita documentación', () => {
    const resultado = disciplinaSchema.safeParse({ ...base, solicitaDocumentacion: true });
    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.issues.map((issue) => issue.path.join('.'))).toEqual(
        expect.arrayContaining(['requerimientosDocumentacion']),
      );
    }
  });

  it('rechaza un rango de edad invertido', () => {
    const resultado = disciplinaSchema.safeParse({ ...base, edadMinima: 18, edadMaxima: 12 });
    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.issues[0]?.message).toContain('edad máxima');
    }
  });
});
