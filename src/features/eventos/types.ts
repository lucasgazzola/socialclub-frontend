export interface Evento {
  id: number;
  nombre: string;
  descripcion?: string | null;
  entradasDisponibles: number;
  entradasVendidas: number;
  creadoEn: string;
  actualizadoEn?: string;
  capacidadMaxima: number;
  cierreInscripcion: string;
  estado: 'BORRADOR' | 'PUBLICADO' | 'CANCELADO' | 'FINALIZADO';
  fechaEvento: string;
  imagen?: string | null;
  lugarAcreditacion: string;
  precio: number | string;
  inicioVenta: string;
  finVenta: string;
}

export interface CrearEventoFormData {
  nombre: string;
  descripcion?: string;
  entradasDisponibles: number;
}