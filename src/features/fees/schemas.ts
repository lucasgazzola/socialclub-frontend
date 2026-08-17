import { z } from 'zod';

export const cuotaFormSchema = z.object({
  disciplineId: z.coerce
    .number({ error: 'Seleccioná una disciplina' })
    .int()
    .positive('Seleccioná una disciplina'),
  categoryId: z.coerce
    .number({ error: 'Seleccioná una categoría' })
    .int()
    .positive('Seleccioná una categoría'),
  amount: z.coerce
    .number({ error: 'Ingresá un monto válido' })
    .positive('El monto debe ser mayor a cero')
    .max(99_999_999.99, 'El monto es demasiado grande'),
  appliedPeriod: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Formato YYYY-MM (ej: 2026-09)')
    .optional()
    .or(z.literal('')),
});

/** Valores tal como llegan del formulario (los selects/monto entran como string). */
export type FeeFormInput = z.input<typeof cuotaFormSchema>;
/** Valores ya parseados por zod (coercionados a number). */
export type FeeFormValues = z.infer<typeof cuotaFormSchema>;
