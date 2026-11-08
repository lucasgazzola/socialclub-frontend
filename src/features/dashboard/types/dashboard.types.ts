export interface DashboardEvento {
  id: number;
  nombre: string;
  fechaEvento: string;
  fechaFin: string | null;
  lugarAcreditacion: string;
  capacidadMaxima: number | null;
  entradasDisponibles: number | null;
  entradasVendidas: number;
}

export interface InscripcionesIrregulares {
  total: number;
  pendientes: number;
  bloqueadas: number;
}

export interface DashboardMetricas {
  totalIntegrantesActivos: number;
  porcentajeMorosos: number;
  cantidadMorosos: number;
  documentosPorVencer: number;
  inscripcionesIrregulares: InscripcionesIrregulares;
  proximosEventos: DashboardEvento[];
}
