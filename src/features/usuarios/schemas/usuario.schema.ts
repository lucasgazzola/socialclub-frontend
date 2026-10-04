import { z } from 'zod';

/** DT-42: el delegado recibe las alertas de las disciplinas que tiene a cargo. */
export const ROL_DELEGADO = 'DELEGADO';

const usuarioBaseSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  apellido: z.string().min(1, 'El apellido es obligatorio'),
  dni: z
    .string()
    .regex(/^\d{7,8}$/, 'El DNI debe tener 7 u 8 dígitos sin puntos ni comas'),
  email: z.string().email('Debe ingresar un email válido'),
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

export const usuarioCreateSchema = usuarioBaseSchema
  .extend({
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  })
  .superRefine(exigirDisciplinasDelDelegado);

export const usuarioEditSchema = usuarioBaseSchema.superRefine(exigirDisciplinasDelDelegado);

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