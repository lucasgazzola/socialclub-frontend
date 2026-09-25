import { z } from 'zod';

export const METODOS_PAGO_SECRETARIA = [
  { value: 'EFECTIVO', label: 'Efectivo (Ventanilla)' },
  { value: 'TRANSFERENCIA', label: 'Transferencia bancaria' },
  { value: 'DEBITO', label: 'Tarjeta de Débito' },
  { value: 'CREDITO', label: 'Tarjeta de Crédito' },
  { value: 'OTRO', label: 'Otro' },
] as const;

export const pagoSecretariaSchema = z.object({
  periodos: z
    .array(z.string())
    .min(1, 'Seleccioná al menos un período para registrar el cobro'),
  metodoPago: z.enum(['EFECTIVO', 'TRANSFERENCIA', 'DEBITO', 'CREDITO', 'OTRO'], {
    message: 'Seleccioná un método de pago válido',
  }),
  observaciones: z
    .string()
    .max(255, 'Las observaciones no pueden superar los 255 caracteres')
    .optional(),
});

export type PagoSecretariaFormData = z.infer<typeof pagoSecretariaSchema>;
