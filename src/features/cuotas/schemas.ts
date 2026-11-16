import { z } from 'zod';

export const cuotaFormSchema = z.object({
  disciplinaId: z.coerce
    .number({ error: 'Seleccioná una disciplina' })
    .int()
    .positive('Seleccioná una disciplina'),
  // TASK-33: vacío = tarifa base de la disciplina.
  categoriaDisciplinaId: z.preprocess(
    (v) => (v === '' || v === undefined || v === null ? undefined : Number(v)),
    z.number().int().positive().optional(),
  ),
  descuentoSocioPorcentaje: z.preprocess(
    (v) => (v === '' || v === undefined || v === null ? 0 : Number(v)),
    z
      .number({ error: 'Ingresá un porcentaje válido' })
      .int('El descuento debe ser un número entero')
      .min(0, 'El descuento no puede ser negativo')
      .max(100, 'El descuento no puede superar el 100 %'),
  ),
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
