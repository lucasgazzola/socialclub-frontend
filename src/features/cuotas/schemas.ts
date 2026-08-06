import { z } from 'zod';

export const cuotaFormSchema = z.object({
  disciplinaId: z.coerce
    .number({ error: 'Seleccioná una disciplina' })
    .int()
    .positive('Seleccioná una disciplina'),
  categoriaId: z.coerce
    .number({ error: 'Seleccioná una categoría' })
    .int()
    .positive('Seleccioná una categoría'),
  monto: z.coerce
    .number({ error: 'Ingresá un monto válido' })
    .positive('El monto debe ser mayor a cero')
    .max(99_999_999.99, 'El monto es demasiado grande'),
  periodoAplicacion: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Formato YYYY-MM (ej: 2026-09)')
    .optional()
    .or(z.literal('')),
});

/** Valores tal como llegan del formulario (los selects/monto entran como string). */
export type CuotaFormInput = z.input<typeof cuotaFormSchema>;
/** Valores ya parseados por zod (coercionados a number). */
export type CuotaFormValues = z.infer<typeof cuotaFormSchema>;
