import { z } from 'zod';

/** Fecha local de hoy en formato YYYY-MM-DD (para comparar sin desfase de zona horaria). */
function hoyISO(): string {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60_000).toISOString().slice(0, 10);
}

/**
 * Validación del formulario de documentación (US-24), alineada al backend:
 * tipo (del catálogo) obligatorio y fecha obligatoria salvo para el DNI (DT-43);
 * si se indica fecha de vencimiento, no puede ser anterior a hoy.
 */
export const documentacionSchema = z
  .object({
    // Del catálogo, entre los exigidos al participante (TASK-31).
    tipoDocumento: z.string().min(1, 'Seleccioná el tipo de documento'),
    fechaVencimiento: z.string().optional().default(''),
  })
  .superRefine((val, ctx) => {
    const fecha = val.fechaVencimiento?.trim() ?? '';
    if (!fecha && val.tipoDocumento !== 'DNI') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['fechaVencimiento'],
        message: 'La fecha de vencimiento es obligatoria',
      });
    } else if (fecha && fecha < hoyISO()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['fechaVencimiento'],
        message: 'La fecha de vencimiento no puede ser anterior a hoy',
      });
    }
  });

export type DocumentacionFormValues = z.infer<typeof documentacionSchema>;
