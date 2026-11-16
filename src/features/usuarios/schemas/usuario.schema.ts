import { z } from 'zod';
import { errorConfirmacionEmail, mismoEmail } from '@/lib/utils/email';

/** DT-42: el delegado recibe las alertas de las disciplinas que tiene a cargo. */
export const ROL_DELEGADO = 'DELEGADO';

const usuarioBaseSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  apellido: z.string().min(1, 'El apellido es obligatorio'),
  dni: z
    .string()
    .regex(/^\d{7,8}$/, 'El DNI debe tener 7 u 8 dígitos sin puntos ni comas'),
  email: z.string().email('Debe ingresar un email válido'),
  /** DT-54: el email escrito por segunda vez. */
  confirmarEmail: z.string(),
  roles: z.array(z.string()).min(1, 'Debe seleccionar al menos un rol'),
  /** Ids como texto (valores de los checkboxes); la página los pasa a número. */
  disciplinasIds: z.array(z.string()),
});

/** Un delegado tiene que tener al menos una disciplina a cargo. */
function exigirDisciplinasDelDelegado(
  valores: { roles: string[]; disciplinasIds: string[] },
  ctx: z.RefinementCtx,
) {
  if (valores.roles.includes(ROL_DELEGADO) && valores.disciplinasIds.length === 0) {
    ctx.addIssue({
      code: 'custom',
      path: ['disciplinasIds'],
      message: 'Seleccioná al menos una disciplina a cargo del delegado',
    });
  }
}

/** DT-54: la confirmación tiene que coincidir con el email. */
function exigirConfirmacionEmail(
  valores: { email: string; confirmarEmail: string },
  ctx: z.RefinementCtx,
) {
  const error = errorConfirmacionEmail(valores.email, valores.confirmarEmail);
  if (error) ctx.addIssue({ code: 'custom', path: ['confirmarEmail'], message: error });
}

/**
 * DT-54: el alta no lleva contraseña. La persona recibe un email con un
 * enlace (vence en 24 h) para elegirla y verificar su email.
 */
export const usuarioCreateSchema = usuarioBaseSchema.superRefine((valores, ctx) => {
  exigirDisciplinasDelDelegado(valores, ctx);
  exigirConfirmacionEmail(valores, ctx);
});

/** En la edición, la confirmación se pide solo si cambia el email. */
export function crearUsuarioEditSchema(emailOriginal?: string | null) {
  return usuarioBaseSchema.superRefine((valores, ctx) => {
    exigirDisciplinasDelDelegado(valores, ctx);
    if (!mismoEmail(valores.email, emailOriginal)) exigirConfirmacionEmail(valores, ctx);
  });
}

export const usuarioEditSchema = crearUsuarioEditSchema();

/**
 * DT-42: ids de las disciplinas a cargo para la API. Si el usuario no es
 * delegado se manda la lista vacía, así pierde las que tuviera.
 */
export function disciplinasIdsParaApi(valores: { roles: string[]; disciplinasIds?: string[] }) {
  if (!valores.roles.includes(ROL_DELEGADO)) return [];
  return (valores.disciplinasIds ?? []).map(Number);
}


export const usuarioSchema = usuarioCreateSchema;

export type UsuarioCreateFormValues = z.infer<typeof usuarioCreateSchema>;
export type UsuarioEditFormValues = z.infer<typeof usuarioEditSchema>;
export type UsuarioFormValues = UsuarioCreateFormValues;

export const usuariosFilterSchema = z.object({
  busqueda: z.string().optional(),
  rolId: z.string().optional(),
});

export type UsuariosFilterValues = z.infer<typeof usuariosFilterSchema>;