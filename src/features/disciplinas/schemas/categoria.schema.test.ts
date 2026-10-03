import { describe, expect, it } from 'vitest';
import { categoriaSchema } from './categoria.schema';

const sinRestriccion = { genero: null, edadMinima: null, edadMaxima: null };

describe('US-48/49 · categoriaSchema', () => {
  it('acepta restricciones de género y un rango de edad', () => {
    const resultado = categoriaSchema.safeParse({ nombre: 'Sub-15', genero: 'FEMENINO', edadMinima: 13, edadMaxima: 15, requerimientosDocumentacion: [] });
    expect(resultado.success).toBe(true);
  });

  it('rechaza una edad máxima menor que la mínima', () => {
    const resultado = categoriaSchema.safeParse({ nombre: 'Sub-15', genero: null, edadMinima: 15, edadMaxima: 13, requerimientosDocumentacion: [] });
    expect(resultado.success).toBe(false);
    expect(resultado.error?.issues[0]?.message).toBe('La edad máxima no puede ser menor que la edad mínima');
  });

  it('acepta una categoría sin documentación adicional', () => {
    expect(categoriaSchema.safeParse({ ...sinRestriccion, nombre: 'Primera', requerimientosDocumentacion: [] }).success).toBe(true);
  });

  it('acepta documentación adicional del catálogo con su plazo', () => {
    const resultado = categoriaSchema.safeParse({
      ...sinRestriccion,
      nombre: 'Sub-15',
      requerimientosDocumentacion: [{ tipoDocumento: 'AUTORIZACION_PADRES_TUTORES', plazoDiasTolerancia: 15 }],
    });
    expect(resultado.success).toBe(true);
  });

  it('rechaza un nombre vacío o con solo espacios', () => {
    const resultado = categoriaSchema.safeParse({ ...sinRestriccion, nombre: '   ', requerimientosDocumentacion: [] });
    expect(resultado.success).toBe(false);
    expect(resultado.error?.issues[0]?.message).toBe('El nombre de la categoría es obligatorio');
  });

  it('rechaza un tipo de documento fuera del catálogo', () => {
    const resultado = categoriaSchema.safeParse({
      ...sinRestriccion,
      nombre: 'Sub-15',
      requerimientosDocumentacion: [{ tipoDocumento: 'CV', plazoDiasTolerancia: 0 }],
    });
    expect(resultado.success).toBe(false);
  });

  it('rechaza un plazo negativo', () => {
    const resultado = categoriaSchema.safeParse({
      ...sinRestriccion,
      nombre: 'Sub-15',
      requerimientosDocumentacion: [{ tipoDocumento: 'DNI', plazoDiasTolerancia: -1 }],
    });
    expect(resultado.success).toBe(false);
  });
});
