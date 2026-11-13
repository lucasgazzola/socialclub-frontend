import { z } from 'zod';

/** Validación del registro público (US-38), alineada con el backend. */
const fechaNacimientoSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ingresá una fecha válida')
  .refine((value) => {
    const [anio, mes, dia] = value.split('-').map(Number);
    const fecha = new Date(anio, mes - 1, dia);
    const hoy = new Date();
    const fechaMinima = new Date(1900, 0, 1);
    const fechaMaxima = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    return (
      fecha.getFullYear() === anio &&
      fecha.getMonth() === mes - 1 &&
      fecha.getDate() === dia &&
      fecha >= fechaMinima &&
      fecha <= fechaMaxima
    );
  }, 'La fecha debe estar entre el 01/01/1900 y el día de hoy');

export const registerSchema = z
  .object({
    nombre: z.string().min(1, 'El nombre es obligatorio'),
    apellido: z.string().min(1, 'El apellido es obligatorio'),
    email: z.string().email('Ingresá un email válido'),
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/,
        'Debe incluir mayúscula, minúscula, número y un carácter especial',
      ),
    confirmarPassword: z.string().min(1, 'Confirmá la contraseña'),
    fechaNacimiento: fechaNacimientoSchema,
    genero: z.enum(['FEMENINO', 'MASCULINO', 'NO_BINARIO_NO_ESPECIFICADO', 'PREFIERO_NO_DECIRLO'], {
      message: 'Seleccioná un género',
    }),
  })
  .refine((values) => values.password === values.confirmarPassword, {
    path: ['confirmarPassword'],
    message: 'Las contraseñas no coinciden',
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
