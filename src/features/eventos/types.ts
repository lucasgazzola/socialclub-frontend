export type EstadoEventoBackend = 'BORRADOR' | 'PUBLICADO' | 'CANCELADO' | 'FINALIZADO';

export interface Evento {
  id: number;
  nombre: string;
  descripcion?: string | null;
  requiereEntrada: boolean;
  capacidadMaxima?: number | null;
  entradasDisponibles?: number | null;
  entradasVendidas?: number;
  precio: string | number;
  descuentoSocio: number;
  estado: EstadoEventoBackend;
  fechaEvento: string;
  fechaFin?: string | null;
  inicioVenta?: string | null;
  finVenta?: string | null;
  lugarAcreditacion: string;
  imageUrl: string;
  tempImageUrl?: string | null;
  creadoEn?: string;
  actualizadoEn?: string;
}

export interface CrearEventoFormData {
  nombre: string;
  descripcion?: string;
  requiereEntrada?: boolean;
  capacidadMaxima?: number | null;
  entradasDisponibles?: number | null;
  precio?: number;
  descuentoSocio?: number;
  estado?: EstadoEventoBackend;
  fechaEvento: string;
  fechaFin?: string | null;
  lugarAcreditacion: string;
  inicioVenta?: string | null;
  finVenta?: string | null;
  imagenFile?: File | null;
}

export interface EventosPaginados {
  items: Evento[];
  total: number;
  pagina: number;
  porPagina: number;
  totalPaginas: number;
}