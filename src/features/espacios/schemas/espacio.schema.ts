import { z } from 'zod';
import type { CreateBloqueoPayload, CreateEspacioPayload, CreateSubespacioPayload } from '../types';

const HORA_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;
const FECHA_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const subespacioFormSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, 'El nombre de la unidad es obligatorio')
    .max(120, 'El nombre no puede superar los 120 caracteres'),
  capacidadMaxima: z
    .number({ message: 'La capacidad debe ser un número válido' })
    .int('La capacidad debe ser un número entero')
    .min(1, 'La capacidad de la unidad debe ser mayor a cero'),
  descripcion: z.string().trim().max(500, 'Máximo 500 caracteres').optional(),
});

export const bloqueoFormSchema = z
  .object({
    tipo: z.enum(['RECURRENTE', 'PUNTUAL']),
    diasSemana: z.array(z.number().int().min(0).max(6)).optional(),
    fecha: z.string().optional(),
    diaCompleto: z.boolean().optional(),
    horaInicio: z.string().optional(),
    horaFin: z.string().optional(),
    vigenteDesde: z.string().optional(),
    vigenteHasta: z.string().optional(),
    disciplinaId: z.number().int().positive().nullable().optional(),
    motivo: z.string().optional(),
  })
  .superRefine((bloqueo, ctx) => {
    if (bloqueo.tipo === 'RECURRENTE') {
      if (!bloqueo.diasSemana || bloqueo.diasSemana.length === 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['diasSemana'],
          message: 'Seleccioná al menos un día de la semana',
        });
      }

      if (!bloqueo.horaInicio || !HORA_REGEX.test(bloqueo.horaInicio)) {
        ctx.addIssue({
          code: 'custom',
          path: ['horaInicio'],
          message: 'La hora de inicio es obligatoria (HH:MM)',
        });
      }

      if (!bloqueo.horaFin || !HORA_REGEX.test(bloqueo.horaFin)) {
        ctx.addIssue({
          code: 'custom',
          path: ['horaFin'],
          message: 'La hora de fin es obligatoria (HH:MM)',
        });
      }

      if (
        bloqueo.horaInicio &&
        bloqueo.horaFin &&
        HORA_REGEX.test(bloqueo.horaInicio) &&
        HORA_REGEX.test(bloqueo.horaFin) &&
        bloqueo.horaFin <= bloqueo.horaInicio
      ) {
        ctx.addIssue({
          code: 'custom',
          path: ['horaFin'],
          message: 'La hora de fin debe ser posterior a la hora de inicio',
        });
      }

      if (!bloqueo.vigenteHasta || !FECHA_REGEX.test(bloqueo.vigenteHasta)) {
        ctx.addIssue({
          code: 'custom',
          path: ['vigenteHasta'],
          message: 'La fecha límite de vigencia es obligatoria',
        });
      }

      if (
        bloqueo.vigenteDesde &&
        bloqueo.vigenteHasta &&
        FECHA_REGEX.test(bloqueo.vigenteDesde) &&
        FECHA_REGEX.test(bloqueo.vigenteHasta) &&
        bloqueo.vigenteHasta < bloqueo.vigenteDesde
      ) {
        ctx.addIssue({
          code: 'custom',
          path: ['vigenteHasta'],
          message: 'La fecha límite no puede ser anterior al inicio de vigencia',
        });
      }
    } else if (bloqueo.tipo === 'PUNTUAL') {
      if (!bloqueo.fecha || !FECHA_REGEX.test(bloqueo.fecha)) {
        ctx.addIssue({
          code: 'custom',
          path: ['fecha'],
          message: 'La fecha específica es obligatoria',
        });
      }

      if (!bloqueo.motivo || !bloqueo.motivo.trim()) {
        ctx.addIssue({
          code: 'custom',
          path: ['motivo'],
          message: 'El motivo es obligatorio para bloqueos puntuales',
        });
      }

      const esDiaCompleto = Boolean(bloqueo.diaCompleto);
      if (!esDiaCompleto) {
        const tieneInicio = Boolean(bloqueo.horaInicio && bloqueo.horaInicio.trim());
        const tieneFin = Boolean(bloqueo.horaFin && bloqueo.horaFin.trim());

        if (!tieneInicio || !HORA_REGEX.test(bloqueo.horaInicio!)) {
          ctx.addIssue({
            code: 'custom',
            path: ['horaInicio'],
            message: 'Indicá la hora de inicio (HH:MM) o marcá Día completo',
          });
        }
        if (!tieneFin || !HORA_REGEX.test(bloqueo.horaFin!)) {
          ctx.addIssue({
            code: 'custom',
            path: ['horaFin'],
            message: 'Indicá la hora de fin (HH:MM) o marcá Día completo',
          });
        }
        if (
          tieneInicio &&
          tieneFin &&
          HORA_REGEX.test(bloqueo.horaInicio!) &&
          HORA_REGEX.test(bloqueo.horaFin!) &&
          bloqueo.horaFin! <= bloqueo.horaInicio!
        ) {
          ctx.addIssue({
            code: 'custom',
            path: ['horaFin'],
            message: 'La hora de fin debe ser posterior a la hora de inicio',
          });
        }
      }
    }
  });

export const espacioSchema = z
  .object({
    nombre: z
      .string()
      .trim()
      .min(1, 'El nombre del espacio es obligatorio')
      .max(120, 'El nombre no puede superar los 120 caracteres'),
    tipo: z.enum(['DEPORTIVO', 'SOCIAL', 'MULTIUSO'], {
      message: 'Seleccioná el tipo de espacio',
    }),
    capacidadMaxima: z
      .number({ message: 'La capacidad máxima debe ser un número válido' })
      .int('La capacidad máxima debe ser un número entero')
      .min(1, 'La capacidad máxima debe ser mayor a cero'),
    modalidad: z.enum(['POR_HORA', 'DIA_COMPLETO'], {
      message: 'Seleccioná la modalidad de reserva',
    }),
    ubicacion: z.string().trim().max(200, 'La ubicación no puede superar los 200 caracteres').optional(),
    descripcion: z.string().trim().max(500, 'La descripción no puede superar los 500 caracteres').optional(),
    precio: z
      .number({ message: 'El precio de alquiler debe ser un número válido' })
      .positive('El precio de alquiler debe ser mayor a cero'),
    descuentoSocio: z
      .number({ message: 'El descuento para socios debe ser un número válido' })
      .int('El descuento para socios debe ser un número entero')
      .min(0, 'El descuento no puede ser negativo')
      .max(100, 'El descuento no puede ser superior al 100%')
      .default(0),
    precioSocio: z
      .number({ message: 'El precio para socios debe ser un número válido' })
      .positive('El precio para socios debe ser mayor a cero')
      .nullable()
      .optional(),
    montoSena: z
      .number({ message: 'El monto de la seña debe ser un número válido' })
      .positive('El monto de la seña debe ser mayor a cero'),
    disciplinaIds: z.array(z.number().int().positive()),
    bloqueos: z.array(bloqueoFormSchema),
    // Patrón Composite — Sub-espacios / Unidades Múltiples (opcional)
    divisibleEnSubespacios: z.boolean().optional(),
    modoSubespacios: z.enum(['LOTE', 'PERSONALIZADO']).optional(),
    cantidadSubespacios: z.number().int().nullable().optional(),
    prefijoSubespacio: z.string().trim().optional(),
    capacidadSubespacio: z.number().int().nullable().optional(),
    subespacios: z.array(subespacioFormSchema).optional(),
  })
  .superRefine((valores, ctx) => {
    if (valores.montoSena > valores.precio) {
      ctx.addIssue({
        code: 'custom',
        path: ['montoSena'],
        message: 'El monto de la seña requerida no puede ser superior al precio de alquiler',
      });
    }

    if (valores.divisibleEnSubespacios) {
      const modo = valores.modoSubespacios ?? 'LOTE';
      if (modo === 'LOTE') {
        const cant = valores.cantidadSubespacios;
        if (cant === null || cant === undefined || Number.isNaN(cant) || cant < 1 || cant > 50) {
          ctx.addIssue({
            code: 'custom',
            path: ['cantidadSubespacios'],
            message: 'Indicá una cantidad de sub-espacios entre 1 y 50',
          });
        }
        const capSub = valores.capacidadSubespacio;
        if (capSub !== null && capSub !== undefined && (Number.isNaN(capSub) || capSub < 1)) {
          ctx.addIssue({
            code: 'custom',
            path: ['capacidadSubespacio'],
            message: 'La capacidad por unidad debe ser mayor a cero',
          });
        }
      } else if (modo === 'PERSONALIZADO') {
        if (!valores.subespacios || valores.subespacios.length === 0) {
          ctx.addIssue({
            code: 'custom',
            path: ['subespacios'],
            message: 'Agregá al menos un sub-espacio personalizado',
          });
        }
      }
    }
  });

export type SubespacioFormValues = z.infer<typeof subespacioFormSchema>;
export type BloqueoFormValues = z.infer<typeof bloqueoFormSchema>;
export type EspacioFormValues = z.infer<typeof espacioSchema>;

export function normalizarBloqueoPayload(b: BloqueoFormValues): CreateBloqueoPayload {
  if (b.tipo === 'RECURRENTE') {
    return {
      tipo: 'RECURRENTE',
      diasSemana: b.diasSemana ?? [],
      horaInicio: b.horaInicio,
      horaFin: b.horaFin,
      ...(b.vigenteDesde ? { vigenteDesde: b.vigenteDesde } : {}),
      vigenteHasta: b.vigenteHasta,
      ...(b.disciplinaId ? { disciplinaId: b.disciplinaId } : {}),
      ...(b.motivo?.trim() ? { motivo: b.motivo.trim() } : {}),
    };
  }

  return {
    tipo: 'PUNTUAL',
    fecha: b.fecha,
    ...(!b.diaCompleto && b.horaInicio ? { horaInicio: b.horaInicio } : {}),
    ...(!b.diaCompleto && b.horaFin ? { horaFin: b.horaFin } : {}),
    motivo: b.motivo?.trim(),
  };
}

export function normalizarEspacioPayload(values: EspacioFormValues): CreateEspacioPayload {
  const esSocial = values.tipo === 'SOCIAL';
  const disciplinaIds = esSocial ? [] : values.disciplinaIds;

  let compositeProps: Partial<CreateEspacioPayload> = {};
  if (values.divisibleEnSubespacios) {
    const modo = values.modoSubespacios ?? 'LOTE';
    if (modo === 'LOTE' && values.cantidadSubespacios && values.cantidadSubespacios > 0) {
      compositeProps = {
        cantidadSubespacios: values.cantidadSubespacios,
        ...(values.prefijoSubespacio?.trim()
          ? { prefijoSubespacio: values.prefijoSubespacio.trim() }
          : {}),
        ...(values.capacidadSubespacio && values.capacidadSubespacio > 0
          ? { capacidadSubespacio: values.capacidadSubespacio }
          : {}),
      };
    } else if (modo === 'PERSONALIZADO' && values.subespacios && values.subespacios.length > 0) {
      const subespacios: CreateSubespacioPayload[] = values.subespacios.map((s) => ({
        nombre: s.nombre.trim(),
        capacidadMaxima: s.capacidadMaxima,
        ...(s.descripcion?.trim() ? { descripcion: s.descripcion.trim() } : {}),
      }));
      compositeProps = { subespacios };
    }
  }

  const descuento = values.descuentoSocio ?? 0;

  return {
    nombre: values.nombre.trim(),
    tipo: values.tipo,
    capacidadMaxima: values.capacidadMaxima,
    modalidad: values.modalidad,
    ...(values.ubicacion?.trim() ? { ubicacion: values.ubicacion.trim() } : {}),
    ...(values.descripcion?.trim() ? { descripcion: values.descripcion.trim() } : {}),
    precio: values.precio,
    ...(descuento > 0 ? { descuentoSocio: descuento } : {}),
    montoSena: values.montoSena,
    ...compositeProps,
    ...(disciplinaIds.length > 0 ? { disciplinaIds } : {}),
    ...(values.bloqueos.length > 0
      ? { bloqueos: values.bloqueos.map(normalizarBloqueoPayload) }
      : {}),
  };
}
