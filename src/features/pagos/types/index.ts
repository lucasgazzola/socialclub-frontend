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

export type MetodoPagoSecretaria = 'EFECTIVO' | 'TRANSFERENCIA' | 'DEBITO' | 'CREDITO' | 'OTRO';

export interface CuotasPendientesSocioResponse {
  personaId: number;
  socioNombre: string;
  dni: string;
  categoria: string;
  categoriaId: number;
  estadoFinanciero: EstadoFinancieroSocio;
  cuotasPendientes: CuotaPendiente[];
  totalAdeudado: number;
}

export interface RegistrarPagoSocioPayload {
  periodos: string[];
  metodoPago: MetodoPagoSecretaria;
  observaciones?: string;
}

// ── US-21 · Cuota deportiva (secretaría) ──────────────────────────────────────

export type EstadoDeudaDeportiva = 'AL_DIA' | 'MOROSO';

export interface CuotaDeportivaPendiente {
  disciplinaId: number;
  disciplinaNombre: string;
  periodo: string; // "YYYY-MM"
  monto: number;
}

export interface PendientesDeportivosResponse {
  personaId: number;
  participanteNombre: string;
  dni: string | null;
  categoria: string | null;
  categoriaId: number | null;
  estadoDeuda: EstadoDeudaDeportiva;
  cuotasPendientes: CuotaDeportivaPendiente[];
  totalAdeudado: number;
}

export interface RegistrarPagoDeportivoPayload {
  disciplinaId: number;
  periodos: string[];
  metodoPago: MetodoPagoSecretaria;
  observaciones?: string;
}

export interface RespuestaPagoDeportivo {
  mensaje: string;
  montoTotal: number;
  fechaHora: string;
  periodosCubiertos: string[];
  disciplinaId: number;
  disciplinaNombre: string;
  usuarioResponsableId: number;
  pagos: PagoRealizado[];
  estadoDeudaActual: EstadoDeudaDeportiva;
  cuotasPendientesRestantes: number;
}
