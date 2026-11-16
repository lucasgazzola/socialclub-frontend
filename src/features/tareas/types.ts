/** DT-22: tareas automáticas y sus ejecuciones. */
export type OrigenEjecucion = 'PROGRAMADA' | 'MANUAL';
export type EstadoEjecucion = 'EN_CURSO' | 'EXITOSA' | 'FALLIDA' | 'OMITIDA';

export interface EjecucionTarea {
  id: number;
  tarea: string;
  origen: OrigenEjecucion;
  usuarioId: number | null;
  usuario?: { id: number; nombre: string; apellido: string } | null;
  estado: EstadoEjecucion;
  inicio: string;
  fin: string | null;
  /** Resumen que devolvió la tarea (contadores). */
  resultado: Record<string, number | string | boolean | null> | null;
  error: string | null;
}

export interface TareaAutomatica {
  nombre: string;
  descripcion: string;
  horario: string;
  ultimaEjecucion: EjecucionTarea | null;
}
