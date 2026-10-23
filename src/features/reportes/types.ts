/** US-35 — Reporte de estado financiero (contrato de GET /reportes/estado-financiero). */

export type ConceptoCuota = 'CUOTA_SOCIAL' | 'CUOTA_DEPORTIVA';

export interface Indicadores {
  recaudado: number;
  adeudado: number;
  morosos: number;
  /** recaudado / (recaudado + adeudado), en %; null si no hubo nada. */
  porcentajeCobranza: number | null;
}

export interface EstadoFinanciero {
  desde: string;
  hasta: string;
  disciplinaId: number | null;
  diaVencimiento: number;
  generadoEn: string;
  totales: Indicadores & { ingresadoPorFechaDeCobro: number };
  porConcepto: (Indicadores & { concepto: ConceptoCuota })[];
  porDisciplina: (Indicadores & { disciplinaId: number; disciplinaNombre: string })[];
  porMes: { periodo: string; recaudado: number; adeudado: number }[];
}

export interface FiltrosEstadoFinanciero {
  desde: string;
  hasta: string;
  disciplinaId?: number;
}

/** US-36 — Reporte de asistencia y ocupación de eventos (contrato de GET /reportes/asistencia-eventos). */

export interface EventoReporteItem {
  id: number;
  nombre: string;
  descripcion: string | null;
  estado: string;
  requiereEntrada: boolean;
  fechaEvento: string;
  fechaFin: string | null;
  lugarAcreditacion: string;
  capacidadMaxima: number | null;
  entradasDisponibles: number | null;
  precio: number;
  totalEntradas: number;
  ingresosValidados: number;
  ausentes: number;
  porcentajeOcupacion: number | null;
  porcentajeAsistencia: number | null;
  recaudado: number;
}

export interface TotalesAsistenciaEventos {
  totalEventos: number;
  totalCapacidad: number;
  totalEntradas: number;
  totalAsistentes: number;
  totalAusentes: number;
  porcentajeOcupacionPromedio: number | null;
  porcentajeAsistenciaPromedio: number | null;
  totalRecaudado: number;
}

export interface FiltrosAsistenciaEventos {
  eventoId?: number;
  desde?: string;
  hasta?: string;
  estado?: string;
}

export interface ReporteAsistenciaEventos {
  generadoEn: string;
  filtros: FiltrosAsistenciaEventos;
  totales: TotalesAsistenciaEventos;
  eventos: EventoReporteItem[];
}
