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

// ── US-22 · Historial de cuotas deportivas ────────────────────────────────────

export interface PagoDeportivoHistorial {
  id: number;
  disciplinaId: number;
  disciplinaNombre: string;
  periodo: string;
  monto: number;
  fechaPago: string;
  metodoPago: string;
  registradoPor: { id: number; nombre: string } | null;
}

export interface HistorialDeportivoFiltro {
  desde?: string; // YYYY-MM-DD
  hasta?: string; // YYYY-MM-DD
}

export interface HistorialDeportivoResponse {
  personaId: number;
  participanteNombre: string;
  dni: string | null;
  categoria: string | null;
  categoriaId: number | null;
  estadoDeuda: EstadoDeudaDeportiva;
  filtro: { desde: string | null; hasta: string | null };
  pagos: PagoDeportivoHistorial[];
  adeudados: CuotaDeportivaPendiente[];
  totalPagado: number;
  totalAdeudado: number;
}
