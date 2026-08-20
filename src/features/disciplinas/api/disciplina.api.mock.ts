import type { DisciplinaOption } from '../types';

/**
 * Datos de prueba para poder desarrollar y probar el flujo de inscripción
 * mientras no exista GET /disciplinas en el backend. Borrar este archivo
 * (y la bandera USAR_MOCK en disciplinasApi.ts) en cuanto el endpoint real
 * esté listo.
 *
 * Incluye a propósito una disciplina CON categorías (Fútbol) y dos SIN
 * categorías (Ajedrez, Yoga), para poder probar ambas ramas de
 * DisciplinaCategoriaSelector (con y sin select de categoría) sin
 * depender de cómo esté cargada la base real.
 */
const DISCIPLINAS_MOCK: DisciplinaOption[] = [
  {
    id: 1,
    nombre: 'Fútbol',
    categorias: [
      { id: 2, nombre: 'Sub-15' },
      { id: 1, nombre: 'Sub-17' },
      { id: 3, nombre: 'Primera' },
    ],
  },
  {
    id: 2,
    nombre: 'Natación',
    categorias: [
      { id: 201, nombre: 'Infantil' },
      { id: 202, nombre: 'Juvenil' },
      { id: 203, nombre: 'Adultos' },
    ],
  },
  {
    id: 3,
    nombre: 'Ajedrez',
    categorias: [],
  },
  {
    id: 4,
    nombre: 'Yoga',
    categorias: [],
  },
];

const LATENCIA_SIMULADA_MS = 400;

export function listarDisciplinasActivasMock(): Promise<DisciplinaOption[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(structuredClone(DISCIPLINAS_MOCK));
    }, LATENCIA_SIMULADA_MS);
  });
}