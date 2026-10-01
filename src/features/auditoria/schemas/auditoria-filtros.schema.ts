import { z } from 'zod';

export const auditoriaFiltrosSchema = z
  .object({
    accion: z.string().optional(),
    entidad: z.string().optional(),
    fechaDesde: z.string().optional(),
    fechaHasta: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.fechaDesde && data.fechaHasta) {
        return data.fechaDesde <= data.fechaHasta;
      }
      return true;
    },
    {
      message: 'La fecha "Desde" no puede ser posterior a "Hasta"',
      path: ['fechaHasta'],
    },
  );

export type AuditoriaFiltrosFormValues = z.infer<typeof auditoriaFiltrosSchema>;
