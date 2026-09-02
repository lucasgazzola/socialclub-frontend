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

/** Estado informado al validar el acceso (incluye NO_ENCONTRADA además de los de la entrada). */
export type EstadoValidacion = EstadoEntrada | 'NO_ENCONTRADA';

/** Resultado de validar el acceso por QR (US-31). */
export interface ResultadoValidacion {
  valido: boolean;
  estado: EstadoValidacion;
  motivo: string;
  entrada: {
    id: number;
    token: string;
    estado: EstadoEntrada;
    evento: { id: number; nombre: string };
  } | null;
}