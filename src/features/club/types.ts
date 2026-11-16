/** TASK-60 · Respuesta de `GET /club/publico`. */
export interface PlanSocio {
  categoriaId: number;
  nombre: string;
  descripcion: string | null;
  /** Cuota social vigente; null si la categoría todavía no tiene una configurada. */
  cuotaMensual: number | null;
}

export interface DisciplinaPublica {
  id: number;
  nombre: string;
  descripcion: string | null;
  genero: 'FEMENINO' | 'MASCULINO' | 'NO_BINARIO_NO_ESPECIFICADO' | 'PREFIERO_NO_DECIRLO' | null;
  edadMinima: number | null;
  edadMaxima: number | null;
  categorias: string[];
}

export interface NumerosClub {
  socios: number;
  participantes: number;
  disciplinas: number;
  eventosProximos: number;
}

export interface InformacionPublicaClub {
  planes: PlanSocio[];
  disciplinas: DisciplinaPublica[];
  numeros: NumerosClub;
}
