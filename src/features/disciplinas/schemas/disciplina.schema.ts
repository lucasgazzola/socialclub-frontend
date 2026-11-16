import { z } from 'zod';

export const disciplinaSchema = z
  .object({
    nombre: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(60),
    descripcion: z.string().trim().max(500, 'La descripción no puede superar los 500 caracteres'),
    genero: z.enum(['FEMENINO', 'MASCULINO', 'NO_BINARIO_NO_ESPECIFICADO']).optional(),
    edadMinima: z.number().int().min(0).nullable(),
    edadMaxima: z.number().int().min(0).nullable(),
    solicitaDocumentacion: z.boolean(),
    activo: z.boolean(),
    requerimientosDocumentacion: z.array(z.object({
      tipoDocumento: z.enum([
        'DNI', 'FICHA_INSCRIPCION', 'CERTIFICADO_MEDICO_APTITUD_FISICA',
        'SEGURO_COBERTURA_MEDICA', 'AUTORIZACION_PADRES_TUTORES',
        'CARNET_FEDERATIVO_LICENCIA_DEPORTIVA', 'REGLAMENTO_INTERNO_FIRMADO',
        'FICHA_TECNICA_NATACION', 'FICHA_TECNICA_GIMNASIO_FITNESS',
        'FICHA_TECNICA_ARTES_MARCIALES', 'FICHA_TECNICA_DEPORTES_CONTACTO',
        'COMPROBANTE_PAGO_CUOTA_SOCIAL_DEPORTIVA',
      ]),
      plazoDiasTolerancia: z.number().int().min(0),
    })),
  })
  .superRefine((valores, contexto) => {
    if (
      valores.edadMinima !== null &&
      valores.edadMaxima !== null &&
      valores.edadMinima >= valores.edadMaxima
    ) {
      contexto.addIssue({
        code: 'custom',
        path: ['edadMaxima'],
        message: 'La edad máxima debe ser mayor que la edad mínima',
      });
    }

    if (valores.solicitaDocumentacion && valores.requerimientosDocumentacion.length === 0) {
      contexto.addIssue({
        code: 'custom',
        path: ['requerimientosDocumentacion'],
        message: 'Agregá al menos un tipo de documentación',
      });
    }
  });

export type DisciplinaFormValues = z.infer<typeof disciplinaSchema>;
