export interface CategoriaDisciplinaOption {
  id: number;
  nombre: string;
}

export interface DisciplinaOption {
  id: number;
  nombre: string;
  categorias: CategoriaDisciplinaOption[];
}