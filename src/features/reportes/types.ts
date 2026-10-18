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
