import { z } from 'zod';

export const socioFormSchema = z.object({
  name: z.string().min(1, 'Requerido').max(30).regex(/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s'-]+$/),
  lastName: z.string().min(1, 'Requerido').max(30).regex(/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s'-]+$/),
  dni: z.string().min(6).max(20).regex(/^\d+$/, 'Solo números'),
  birthDate: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  categoryId: z.number().int().optional(),
});

export type MemberFormData = z.infer<typeof socioFormSchema>;
