import { z } from 'zod';

/** Validación del formulario de login (alineada con el backend). */
export const loginSchema = z.object({
  email: z.string().email('Ingresá un email válido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
