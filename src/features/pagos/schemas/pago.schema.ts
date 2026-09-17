import { z } from 'zod';

export const mockPagoSchema = z.object({
  titular: z
    .string()
    .min(3, 'El nombre del titular debe tener al menos 3 caracteres'),
  numeroTarjeta: z
    .string()
    .transform((val) => val.replace(/\s+/g, ''))
    .refine((val) => /^\d{16}$/.test(val), {
      message: 'El número de tarjeta debe tener 16 dígitos',
    }),
  vencimiento: z
    .string()
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Formato inválido. Usá MM/AA (ej: 12/28)'),
  cvc: z.string().regex(/^\d{3,4}$/, 'El CVC debe ser de 3 o 4 dígitos'),
});

export type MockPagoFormData = z.infer<typeof mockPagoSchema>;
