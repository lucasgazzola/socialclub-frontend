import { z } from 'zod';

/** Fecha local "datetime-local" → convierte a Date para validar */
function parseDatetimeLocal(val: unknown): Date | undefined {
  if (!val || typeof val !== 'string') return undefined;
  const d = new Date(val);
  return isNaN(d.getTime()) ? undefined : d;
}

/** Límites: ahora + 3 años */
function ahoraLimites() {
  const ahora = new Date();
  const margen = new Date(ahora.getTime() - 5 * 60 * 1000); // 5 min atrás (para inicioVenta default)
  const maxFecha = new Date(ahora.getTime() + 3 * 365.25 * 24 * 60 * 60 * 1000);
  return { ahora, margen, maxFecha };
}

/** Zod helper: string datetime-local requerido */
const fechaRequerida = z
  .string()
  .min(1, 'Este campo es obligatorio');

/** Zod helper: string datetime-local opcional (vacío = undefined) */
const fechaOpcional = z
  .string()
  .optional()
  .transform((v) => (v === '' ? undefined : v));

export const crearEventoSchema = z
  .object({
    nombre: z.string().min(1, 'El nombre es obligatorio'),
    descripcion: z.string().optional(),

    requiereEntrada: z.boolean().optional().default(true),

    estado: z
      .enum(['BORRADOR', 'PUBLICADO', 'CANCELADO', 'FINALIZADO'])
      .optional()
      .default('PUBLICADO'),

    capacidadMaxima: z
      .number({ message: 'Debe ser un número' })
      .int('Debe ser un entero')
      .min(1, 'La capacidad máxima debe ser al menos 1')
      .optional()
      .nullable(),

    entradasDisponibles: z
      .number({ message: 'Debe ser un número' })
      .int('Debe ser un entero')
      .min(0, 'Las entradas disponibles no pueden ser negativas')
      .optional()
      .nullable(),

    precio: z
      .number({ message: 'Debe ser un número' })
      .min(0, 'El precio no puede ser negativo')
      .optional(),

    descuentoSocio: z
      .number({ message: 'Debe ser un número' })
      .int()
      .min(0)
      .max(100)
      .multipleOf(5, 'El descuento debe ser múltiplo de 5')
      .optional()
      .default(0),

    fechaEvento: fechaRequerida,
    fechaFin: fechaOpcional,

    lugarAcreditacion: z.string().min(1, 'El lugar de acreditación es obligatorio'),

    inicioVenta: fechaOpcional,
    finVenta: fechaOpcional,
  })
  // --- Validaciones de negocio ---
  .superRefine((data, ctx) => {
    const { margen, maxFecha } = ahoraLimites();

    // fechaEvento: no en el pasado (con margen de 5 min), no más de 3 años
    if (data.fechaEvento) {
      const dEvento = parseDatetimeLocal(data.fechaEvento);
      if (dEvento) {
        if (dEvento < margen) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'La fecha del evento no puede estar en el pasado', path: ['fechaEvento'] });
        }
        if (dEvento > maxFecha) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'La fecha del evento supera el límite de 3 años', path: ['fechaEvento'] });
        }
      }
    }

    // fechaFin: no en el pasado, no > 3 años, debe ser posterior a fechaEvento
    if (data.fechaFin) {
      const dFin = parseDatetimeLocal(data.fechaFin);
      const dEvento = data.fechaEvento ? parseDatetimeLocal(data.fechaEvento) : undefined;
      if (dFin) {
        if (dFin < margen) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'La fecha de fin no puede estar en el pasado', path: ['fechaFin'] });
        }
        if (dFin > maxFecha) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'La fecha de fin supera el límite de 3 años', path: ['fechaFin'] });
        }
        if (dEvento && dFin <= dEvento) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'La fecha de fin debe ser posterior a la fecha del evento', path: ['fechaFin'] });
        }
      }
    }

    // inicioVenta: no en el pasado (con margen de 5 min), no > 3 años
    if (data.inicioVenta) {
      const dInicio = parseDatetimeLocal(data.inicioVenta);
      if (dInicio) {
        if (dInicio < margen) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'La fecha de inicio de venta no puede estar en el pasado', path: ['inicioVenta'] });
        }
        if (dInicio > maxFecha) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'La fecha de inicio de venta supera el límite de 3 años', path: ['inicioVenta'] });
        }
      }
    }

    // finVenta: no > 3 años, >= inicioVenta, <= fechaEvento
    if (data.finVenta) {
      const dFin = parseDatetimeLocal(data.finVenta);
      const dInicioV = data.inicioVenta ? parseDatetimeLocal(data.inicioVenta) : undefined;
      const dEvento = data.fechaEvento ? parseDatetimeLocal(data.fechaEvento) : undefined;
      if (dFin) {
        if (dFin > maxFecha) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'La fecha de fin de venta supera el límite de 3 años', path: ['finVenta'] });
        }
        if (dInicioV && dFin < dInicioV) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'La fecha de fin de venta debe ser posterior o igual al inicio de venta', path: ['finVenta'] });
        }
        if (dEvento && dFin > dEvento) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'La fecha de fin de venta no puede ser posterior a la fecha del evento', path: ['finVenta'] });
        }
      }
    }

    // descuentoSocio > 0 solo si requiereEntrada y precio > 0
    if ((data.descuentoSocio ?? 0) > 0) {
      if (!data.requiereEntrada) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'El descuento solo aplica si se requieren entradas', path: ['descuentoSocio'] });
      }
      if (!data.precio || data.precio <= 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'El descuento solo aplica si el evento tiene precio mayor a 0', path: ['descuentoSocio'] });
      }
    }
  });

export type CrearEventoSchema = z.infer<typeof crearEventoSchema>;