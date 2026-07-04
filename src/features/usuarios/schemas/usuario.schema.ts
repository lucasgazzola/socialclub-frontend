import { z } from 'zod';

export const usuarioSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  apellido: z.string().min(1, 'El apellido es obligatorio'),
  dni: z.string().min(8, 'El DNI debe tener al menos 8 caracteres'),
  email: z.string().email('Debe ingresar un email válido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  roles: z.array(z.string()).min(1, 'Debe seleccionar al menos un rol'),
});

export type UsuarioFormValues = z.infer<typeof usuarioSchema>;