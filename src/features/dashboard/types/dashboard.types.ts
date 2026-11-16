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
  habilitadas?: number;
}

export interface ComposicionIntegrantes {
  soloSocios: number;
  sociosDeportistas: number;
  soloDeportistas: number;
}

export interface MorosidadPorConcepto {
  cuotaSocial: number;
  cuotaDeportiva: number;
  ambasCuotas: number;
}

export interface DisciplinaResumenDashboard {
  disciplinaId: number;
  nombre: string;
  inscriptos: number;
  habilitados: number;
  irregulares: number;
}

export interface DashboardMetricas {
  totalIntegrantesActivos: number;
  porcentajeMorosos: number;
  cantidadMorosos: number;
  documentosPorVencer: number;
  inscripcionesIrregulares: InscripcionesIrregulares;
  proximosEventos: DashboardEvento[];
  composicionIntegrantes?: ComposicionIntegrantes;
  morosidadPorConcepto?: MorosidadPorConcepto;
  participantesPorDisciplina?: DisciplinaResumenDashboard[];
}
