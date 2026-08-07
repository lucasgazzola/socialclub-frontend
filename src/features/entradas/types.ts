export type EstadoEntrada = 'VALIDA' | 'USADA' | 'EXPIRADA';

export interface Evento {
  id: number;
  nombre: string;
  descripcion?: string | null;
  entradasDisponibles: number;
  entradasVendidas: number;
  creadoEn: string;
  actualizadoEn: string;
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