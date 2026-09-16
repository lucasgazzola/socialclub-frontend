import { z } from 'zod';

const DNI_REGEX = /^\d{7,8}$/;

export const inscripcionSchema = z
  .object({
    personaId: z.number().int().positive().optional(),

    nombre: z.string().trim().optional(),
    apellido: z.string().trim().optional(),
    dni: z.string().trim().optional().refine((valor) => !valor || DNI_REGEX.test(valor), { message: 'El DNI debe tener entre 7 y 8 dígitos numéricos', }),
    fechaNacimiento: z.string().optional(),
    email: z.string().trim().optional().refine((valor) => !valor || z.string().email().safeParse(valor).success, { message: 'El email no tiene un formato válido',}),
    telefono: z.string().trim().optional(),
    disciplinaId: z.number({ error: 'Debe seleccionar una disciplina',}),
    categoriaDisciplinaId: z.number().int().optional(), })
  .superRefine((data, ctx) => {
    if (data.personaId) return; 


    if (!data.nombre) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['nombre'], message: 'El nombre es obligatorio' });
    }
    if (!data.apellido) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['apellido'], message: 'El apellido es obligatorio' });
    }
    if (!data.dni) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['dni'], message: 'El DNI es obligatorio' });
    }
  });

export type InscripcionFormValues = z.infer<typeof inscripcionSchema>;