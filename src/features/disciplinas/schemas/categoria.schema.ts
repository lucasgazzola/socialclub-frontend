import { z } from 'zod';
import { TIPOS_DOCUMENTACION_DISCIPLINA, type TipoDocumentacionDisciplina } from '../types';

const tiposCatalogo = TIPOS_DOCUMENTACION_DISCIPLINA.map((opcion) => opcion.value) as [
  TipoDocumentacionDisciplina,
  ...TipoDocumentacionDisciplina[],
];

const edad = z.number().int('La edad debe ser un número entero').min(0, 'La edad no puede ser negativa').max(120, 'La edad no es válida').nullable();

/**
 * US-48/49: nombre, restricciones propias (null = hereda de la disciplina) y
 * documentación adicional. La edad es la que se cumple en el año calendario.
 */
export const categoriaSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, 'El nombre de la categoría es obligatorio')
    .max(60, 'El nombre no puede superar los 60 caracteres'),
  genero: z.enum(['FEMENINO', 'MASCULINO', 'NO_BINARIO_NO_ESPECIFICADO']).nullable(),
  edadMinima: edad,
  edadMaxima: edad,
  requerimientosDocumentacion: z.array(
    z.object({
      tipoDocumento: z.enum(tiposCatalogo),
      plazoDiasTolerancia: z.number().int().min(0, 'El plazo no puede ser negativo'),
    }),
  ),
}).superRefine((valores, contexto) => {
  if (valores.edadMinima !== null && valores.edadMaxima !== null && valores.edadMinima > valores.edadMaxima) {
    contexto.addIssue({ code: 'custom', path: ['edadMaxima'], message: 'La edad máxima no puede ser menor que la edad mínima' });
  }
});

export type CategoriaFormValues = z.infer<typeof categoriaSchema>;
