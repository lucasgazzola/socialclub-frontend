export interface Evento {
  id: number;
  nombre: string;
  descripcion?: string | null;
  entradasDisponibles: number;
  entradasVendidas: number;
  creadoEn: string;
}

export interface CrearEventoFormData {
  nombre: string;
  descripcion?: string;
  entradasDisponibles: number;
}