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
}

export interface Entrada {
  id: number;
  token: string;
  eventoId: number;
  estado: EstadoEntrada;
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
}

export interface ValidarAccesoResponse {
  acceso: 'PERMITIDO';
  entrada: {
    id: number;
    eventoId: number;
    eventoNombre: string;
  };
}
