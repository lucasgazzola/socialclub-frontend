/** US-60 · US-61 · US-62 — Reservas de espacios. */
export type EstadoReserva =
  | 'PENDIENTE_APROBACION'
  | 'APROBADA_PENDIENTE_PAGO'
  | 'CONFIRMADA'
  | 'RECHAZADA'
  | 'CANCELADA_USUARIO'
  | 'CANCELADA_FALTA_PAGO'
  | 'CANCELADA_INSTITUCION';

export const ETIQUETA_ESTADO_RESERVA: Record<EstadoReserva, string> = {
  PENDIENTE_APROBACION: 'Pendiente de aprobación',
  APROBADA_PENDIENTE_PAGO: 'Aprobada · pendiente de pago',
  CONFIRMADA: 'Confirmada',
  RECHAZADA: 'Rechazada',
  CANCELADA_USUARIO: 'Cancelada por el usuario',
  CANCELADA_FALTA_PAGO: 'Cancelada por falta de pago',
  CANCELADA_INSTITUCION: 'Cancelada por el club',
};

export interface Reserva {
  id: number;
  codigo: string;
  estado: EstadoReserva;
  espacio: { id: number; nombre: string; modalidad: 'POR_HORA' | 'DIA_COMPLETO' };
  inicio: string;
  fin: string;
  /** Turno ya formateado en hora del club. */
  turno: string;
  esSocio: boolean;
  montoTotal: number;
  montoSena: number;
  observaciones: string | null;
  limitePagoSena: string | null;
  limitePagoSenaTexto: string | null;
  senaPagadaEn: string | null;
  metodoPagoSena: string | null;
  motivoRechazo: string | null;
  motivoCancelacion: string | null;
  creadoEn: string;
}

/** US-60: fila de la bandeja de la administración. */
export interface SolicitudReserva extends Reserva {
  solicitante: {
    usuarioId: number;
    nombre: string;
    dni: string | null;
    telefono: string | null;
    email: string;
    esSocio: boolean;
    cuotasAdeudadas: number;
    deuda: number;
  };
  conflictos: { tipo: 'RESERVA' | 'BLOQUEO'; detalle: string; desde: string; hasta: string }[];
}

/** US-62: reserva propia, con lo que el usuario puede hacer. */
export interface MiReserva extends Reserva {
  limiteCancelacion: string;
  limiteCancelacionTexto: string;
  puedeCancelar: boolean;
  puedePagarSena: boolean;
  instruccionesSena: string | null;
}

export interface ResultadoAccion {
  mensaje: string;
  reserva: Reserva;
}

export type MetodoPagoSena = 'EFECTIVO' | 'TRANSFERENCIA' | 'DEBITO' | 'CREDITO' | 'OTRO';

/** US-59: espacio disponible para solicitar reserva. */
export interface EspacioParaReserva {
  id: number;
  nombre: string;
  tipo: string;
  capacidadMaxima: number;
  modalidad: 'POR_HORA' | 'DIA_COMPLETO';
  ubicacion: string | null;
  descripcion: string | null;
  espacioPadreId: number | null;
  espacioPadre: { id: number; nombre: string } | null;
  subespacios: { id: number; nombre: string }[];
  precio: number;
  descuentoSocio: number;
  precioSocio: number | null;
  montoSena: number;
  disciplinas: { id: number; nombre: string }[];
}

export interface IntervaloOcupado {
  tipo: 'RESERVA' | 'BLOQUEO';
  inicio: string;
  fin: string;
  detalle: string;
}

export interface DisponibilidadEspacio {
  espacioId: number;
  modalidad: 'POR_HORA' | 'DIA_COMPLETO';
  desde: string;
  hasta: string;
  ocupados: IntervaloOcupado[];
}

export interface SolicitudPresupuestoInput {
  espacioId: number;
  fecha: string;
  horaInicio?: string;
  horaFin?: string;
}

export type CreateReservaInput = SolicitudPresupuestoInput;

export interface PresupuestoReserva {
  disponible: boolean;
  conflictos: IntervaloOcupado[];
  inicio: string;
  fin: string;
  modalidad: 'POR_HORA' | 'DIA_COMPLETO';
  cantidad: number;
  esSocio: boolean;
  alDia: boolean;
  aplicaTarifaSocio: boolean;
  cuotasAdeudadas: number;
  precioRegularUnitario: number;
  precioSocioUnitario: number;
  descuentoSocioPct: number;
  montoRegular: number;
  descuentoAplicado: number;
  montoTotal: number;
  montoSena: number;
}

export function formatearPesos(n: number): string {
  return `$${n.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
}
