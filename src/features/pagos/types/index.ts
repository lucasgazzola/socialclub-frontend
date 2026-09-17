export type EstadoFinancieroSocio = 'AL_DIA' | 'MOROSO';

export interface CuotaPendiente {
  periodo: string; // "YYYY-MM"
  monto: number;
  categoriaNombre: string;
}

export interface ResumenCuotas {
  personaId: number;
  socioNombre: string;
  categoria: string;
  estadoFinanciero: EstadoFinancieroSocio;
  cuotasPendientes: CuotaPendiente[];
  totalAdeudado: number;
}

export interface RegistrarPagoPayload {
  periodos: string[];
  metodoPago?: string;
  // Campos mock de tarjeta (solo visuales)
  numeroTarjeta?: string;
  vencimiento?: string;
  cvc?: string;
  titular?: string;
}

export interface PagoRealizado {
  id: number;
  periodo: string;
  monto: number;
  fechaPago: string;
  metodoPago: string;
}

export interface RespuestaPago {
  mensaje: string;
  pagos: PagoRealizado[];
  estadoFinancieroActual: EstadoFinancieroSocio;
  cuotasPendientesRestantes: number;
}
