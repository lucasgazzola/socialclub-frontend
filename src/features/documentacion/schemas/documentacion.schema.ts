import { z } from 'zod';

/** Fecha local de hoy en formato YYYY-MM-DD (para comparar sin desfase de zona horaria). */
function hoyISO(): string {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60_000).toISOString().slice(0, 10);
}

/**
 * Validación del formulario de documentación (US-24), alineada al backend:
 * tipo y fecha obligatorios; la fecha de vencimiento no puede ser anterior a hoy.
 */
export const documentacionSchema = z.object({
  tipo: z.string().min(1, 'El tipo de documento es obligatorio'),
  fechaVencimiento: z
    .string()
    .min(1, 'La fecha de vencimiento es obligatoria')
    .refine((v) => v >= hoyISO(), 'La fecha de vencimiento no puede ser anterior a hoy'),
});

export type DocumentacionFormValues = z.infer<typeof documentacionSchema>;
