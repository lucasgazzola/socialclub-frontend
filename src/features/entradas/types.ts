export type EstadoEntrada = 'VALIDA' | 'USADA' | 'EXPIRADA';

export interface Evento {
  id: number;
  nombre: string;
  descripcion?: string | null;
  entradasDisponibles: number;
  entradasVendidas: number;
  creadoEn: string;
  actualizadoEn: string;
  estado?: 'BORRADOR' | 'PUBLICADO' | 'CANCELADO' | 'FINALIZADO';
  precio?: number | string;
  inicioVenta?: string;
  finVenta?: string;
  /** TASK-60: datos para mostrar la entrada (los devuelve `mis-entradas`). */
  fechaEvento?: string;
  fechaFin?: string | null;
  lugarAcreditacion?: string;
}

export interface Entrada {
  id: number;
  token: string;
  eventoId: number;
  /** TASK-60: la API ya devuelve EXPIRADA si el evento terminó o se canceló. */
  estado: EstadoEntrada;
  /** TASK-60: cuándo se validó en la puerta. */
  usadaEn?: string | null;
  creadoEn: string;
  evento?: Evento;
}

export interface CrearEntradasResult {
  eventoId: number;
  eventoNombre: string;
  cantidad: number;
  entradas: Entrada[];
}

/** US-52 · TASK-51: qué entradas se compran. El pago lo hace la pasarela. */
export interface ComprarEntradasPayload {
  eventoId: number;
  cantidad: number;
}

export interface ValidarEntradaDto {
  token: string;
  eventoId: number;
}

export interface FiltrosMisEntradas {
  page?: number;
  limit?: number;
  pagina?: number;
  porPagina?: number;
  search?: string;
  estado?: EstadoEntrada;
  /** TASK-60: PROXIMAS (válidas) o HISTORIAL (usadas y vencidas). */
  vigencia?: 'PROXIMAS' | 'HISTORIAL';
}

export interface MisEntradasPaginadas {
  items: Entrada[];
  total: number;
  pagina: number;
  porPagina: number;
  totalPaginas: number;
}

export interface ValidarAccesoResponse {
  acceso: 'PERMITIDO';
  entrada: {
    id: number;
    eventoId: number;
    eventoNombre: string;
  };
}
