import { useQuery } from '@tanstack/react-query';
import {
  listarInscripciones,
  getInscripcion,
  getInscripcionesPorPersona,
} from '../api/inscripcion.api';
import type { InscripcionesQuery } from '../types';

export const inscripcionesKeys = {
  all: ['inscripciones'] as const,
  list: (query: InscripcionesQuery) => [...inscripcionesKeys.all, 'list', query] as const,
  detail: (id: number) => [...inscripcionesKeys.all, 'detail', id] as const,
  byPersona: (personaId: number) => [...inscripcionesKeys.all, 'byPersona', personaId] as const,
};

export function useInscripciones(query: InscripcionesQuery = {}) {
  const pagina = query.pagina ?? 1;
  const porPagina = query.porPagina ?? 10;
  const busqueda = query.busqueda;
  return useQuery({
    queryKey: inscripcionesKeys.list({ pagina, porPagina, busqueda }),
    queryFn: () => listarInscripciones({ pagina, porPagina, busqueda }),
  });
}

export function useInscripcion(id: number) {
  return useQuery({
    queryKey: inscripcionesKeys.detail(id),
    queryFn: () => getInscripcion(id),
    enabled: !!id,
  });
}

export function useInscripcionesPorPersona(personaId: number) {
  return useQuery({
    queryKey: inscripcionesKeys.byPersona(personaId),
    queryFn: () => getInscripcionesPorPersona(personaId),
    enabled: !!personaId,
  });
}