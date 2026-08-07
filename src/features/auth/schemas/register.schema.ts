import { z } from 'zod';

/** Validación del registro público (US-38), alineada con el backend. */
export const registerSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  apellido: z.string().min(1, 'El apellido es obligatorio'),
  email: z.string().email('Ingresá un email válido'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/,
      'Debe incluir mayúscula, minúscula, número y un carácter especial',
    ),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;
