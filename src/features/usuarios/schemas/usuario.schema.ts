import { z } from 'zod';

const usuarioBaseSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  apellido: z.string().min(1, 'El apellido es obligatorio'),
  dni: z
    .string()
    .regex(/^\d{7,8}$/, 'El DNI debe tener 7 u 8 dígitos sin puntos ni comas'),
  email: z.string().email('Debe ingresar un email válido'),
  roles: z.array(z.string()).min(1, 'Debe seleccionar al menos un rol'),
});

export const usuarioCreateSchema = usuarioBaseSchema.extend({
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

export const usuarioEditSchema = usuarioBaseSchema;


export const usuarioSchema = usuarioCreateSchema;

export type UsuarioCreateFormValues = z.infer<typeof usuarioCreateSchema>;
export type UsuarioEditFormValues = z.infer<typeof usuarioEditSchema>;
export type UsuarioFormValues = UsuarioCreateFormValues;