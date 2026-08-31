import { z } from 'zod';

export const socioFormSchema = z.object({
  nombre: z.string().min(1, 'Requerido').max(30).regex(/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s'-]+$/),
  apellido: z.string().min(1, 'Requerido').max(30).regex(/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s'-]+$/),
  dni: z.string().min(6).max(8).regex(/^\d+$/, 'Solo números'),
  fechaNacimiento: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  telefono: z.string().optional(),
  categoriaId: z.number().int().optional(),
});

export type SocioFormData = z.infer<typeof socioFormSchema>;

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
