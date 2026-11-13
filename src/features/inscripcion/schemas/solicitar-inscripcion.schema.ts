import { z } from 'zod';

export const solicitarInscripcionSchema = z.object({
  disciplinaId: z
    .number({
      error: 'Debe seleccionar una disciplina',
    })
    .int()
    .positive('Debe seleccionar una disciplina'),
  categoriaDisciplinaId: z.number().int().positive().optional(),
});

export type SolicitarInscripcionFormValues = z.infer<typeof solicitarInscripcionSchema>;
