import { z } from 'zod';

export const crearEventoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  descripcion: z.string().optional(),
  entradasDisponibles: z.number().int().min(1, 'Debe haber al menos 1 entrada disponible'),
});

export type CrearEventoSchema = z.infer<typeof crearEventoSchema>;