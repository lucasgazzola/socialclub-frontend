import { z } from 'zod';
import { errorConfirmacionEmail, mismoEmail } from '@/lib/utils/email';

export const socioFormSchema = z.object({
  nombre: z.string().min(1, 'Requerido').max(30).regex(/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s'-]+$/),
  apellido: z.string().min(1, 'Requerido').max(30).regex(/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s'-]+$/),
  dni: z.string().min(6).max(8).regex(/^\d+$/, 'Solo números'),
  fechaNacimiento: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  /** DT-54: el email escrito por segunda vez (al cargarlo o cambiarlo). */
  confirmarEmail: z.string().optional(),
  telefono: z.string().optional(),
  categoriaId: z.number().int().optional(),
});

export type SocioFormData = z.infer<typeof socioFormSchema>;

/**
 * DT-54: si se carga un email nuevo (o cambia en la edición), hay que
 * escribirlo dos veces. En el alta, el socio recibe un enlace para activar
 * su cuenta.
 */
export function crearSocioFormSchema(emailOriginal?: string | null) {
  return socioFormSchema.superRefine((valores, ctx) => {
    if (mismoEmail(valores.email, emailOriginal)) return;
    const error = errorConfirmacionEmail(valores.email, valores.confirmarEmail);
    if (error) ctx.addIssue({ code: 'custom', path: ['confirmarEmail'], message: error });
  });
}

/** Formulario de 'Hacerme socio'. Solo DNI y categoria son editables. */
export const hacermeSocioFormSchema = z.object({
  dni: z
    .string()
    .min(6, 'El DNI debe tener al menos 6 dígitos')
    .max(8, 'El DNI no puede tener más de 8 dígitos')
    .regex(/^\d+$/, 'Solo números'),
  categoriaId: z.string().min(1, 'Elegí una categoría de socio'),
});

export type HacermeSocioFormValues = z.infer<typeof hacermeSocioFormSchema>;

/** Formulario de 'Editar datos personales' (US-11). */
export const perfilSocioSchema = z.object({
  nombre: z
    .string()
    .min(1, 'El nombre es obligatorio')
    .max(30, 'El nombre no puede tener más de 30 caracteres')
    .regex(/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s'-]+$/, 'El nombre solo puede contener letras'),
  apellido: z
    .string()
    .min(1, 'El apellido es obligatorio')
    .max(30, 'El apellido no puede tener más de 30 caracteres')
    .regex(/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s'-]+$/, 'El apellido solo puede contener letras'),
  email: z
    .string()
    .min(1, 'El email es obligatorio')
    .email('El formato de email no es válido (ejemplo: usuario@dominio.com)'),
  telefono: z
    .string()
    .max(30, 'El teléfono no puede tener más de 30 caracteres')
    .optional()
    .or(z.literal('')),
});

export type PerfilSocioFormData = z.infer<typeof perfilSocioSchema>;

