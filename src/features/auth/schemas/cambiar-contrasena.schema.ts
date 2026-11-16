import { z } from 'zod';

/**
 * Validación del cambio de contraseña propio (US-41).
 *
 * Es el espejo frontend del `CambiarContrasenaDto` del backend: misma política
 * de complejidad que el alta (US-01) y el registro público (US-38) para que una
 * contraseña nueva nunca pueda quedar más débil que la exigida al nacer la
 * cuenta. Se agregan además dos comprobaciones locales que el backend también
 * aplica, adelantadas acá para que el usuario vea el error en el campo antes de
 * gastar un request: la confirmación coincidente y que la nueva no repita la
 * contraseña actual.
 */
export const cambiarContrasenaSchema = z
  .object({
    passwordActual: z.string().min(1, 'La contraseña actual es obligatoria'),
    nuevaContrasena: z
      .string()
      .min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/,
        'Debe incluir mayúscula, minúscula, número y un carácter especial',
      ),
    confirmarNuevaContrasena: z.string().min(1, 'Debes confirmar la nueva contraseña'),
  })
  .superRefine((valores, ctx) => {
    if (valores.confirmarNuevaContrasena !== valores.nuevaContrasena) {
      ctx.addIssue({
        code: 'custom',
        path: ['confirmarNuevaContrasena'],
        message: 'La confirmación no coincide con la nueva contraseña',
      });
    }

    if (valores.nuevaContrasena === valores.passwordActual) {
      ctx.addIssue({
        code: 'custom',
        path: ['nuevaContrasena'],
        message: 'La nueva contraseña no puede ser igual a la actual',
      });
    }
  });

export type CambiarContrasenaFormValues = z.infer<typeof cambiarContrasenaSchema>;
