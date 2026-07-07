import { z } from 'zod';

export const socioFormSchema = z.object({
  nombre: z.string().min(1, 'Requerido').max(30).regex(/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s'-]+$/),
  apellido: z.string().min(1, 'Requerido').max(30).regex(/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s'-]+$/),
  dni: z.string().min(6).max(20).regex(/^\d+$/, 'Solo números'),
  fechaNacimiento: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  telefono: z.string().optional(),
  categoriaId: z.number().int().optional(),
});

export type SocioFormData = z.infer<typeof socioFormSchema>;
