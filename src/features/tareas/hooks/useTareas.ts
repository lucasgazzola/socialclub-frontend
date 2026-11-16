import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tareasApi } from '../api/tareas.api';

export const tareasKeys = {
  all: ['tareas'] as const,
  ejecuciones: (nombre: string) => [...tareasKeys.all, 'ejecuciones', nombre] as const,
};

/** DT-22: tareas automáticas con su última ejecución. */
export function useTareas() {
  return useQuery({ queryKey: tareasKeys.all, queryFn: () => tareasApi.listar() });
}

/** DT-22: historial de una tarea (solo cuando hay una seleccionada). */
export function useEjecuciones(nombre: string | null) {
  return useQuery({
    queryKey: tareasKeys.ejecuciones(nombre ?? ''),
    queryFn: () => tareasApi.ejecuciones(nombre as string),
    enabled: !!nombre,
  });
}

/** DT-22: ejecuta una tarea a mano y refresca la lista y su historial. */
export function useEjecutarTarea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (nombre: string) => tareasApi.ejecutar(nombre),
    onSuccess: () => qc.invalidateQueries({ queryKey: tareasKeys.all }),
  });
}
