export interface CategoriaDisciplina {
  id: number;
  nombre: string;
  activo: boolean;
}

export interface Disciplina {
  id: number;
  nombre: string;
  descripcion?: string | null;
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;
  categorias: CategoriaDisciplina[];
}

/** Opción liviana para el selector de disciplina del flujo de inscripción. */
export interface CategoriaDisciplinaOption {
  id: number;
  nombre: string;
  activo: boolean;
}

export interface DisciplinaOption {
  id: number;
  nombre: string;
  activo: boolean;
  categorias: CategoriaDisciplinaOption[];
}
