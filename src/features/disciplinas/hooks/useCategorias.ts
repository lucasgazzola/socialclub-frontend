import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  actualizarCategoria,
  crearCategoria,
  desactivarCategoria,
  listarCategorias,
  reactivarCategoria,
} from '../api/categoria.api';
import { disciplinasKeys } from './useDisciplinas';
import type { CategoriaPayload, CategoriasQuery } from '../types';

export const categoriasKeys = {
  all: (disciplinaId: number) => ['disciplinas', disciplinaId, 'categorias'] as const,
  list: (disciplinaId: number, query: CategoriasQuery) => ['disciplinas', disciplinaId, 'categorias', query] as const,
};

export function useCategorias(disciplinaId: number, query: CategoriasQuery) {
  return useQuery({
    queryKey: categoriasKeys.list(disciplinaId, query),
    queryFn: () => listarCategorias(disciplinaId, query),
    placeholderData: (previous) => previous,
  });
}

/** Las categorías también viajan dentro de la disciplina (selector de inscripción). */
function invalidar(queryClient: ReturnType<typeof useQueryClient>) {
  return queryClient.invalidateQueries({ queryKey: disciplinasKeys.all });
}

function mensajeError(error: unknown, porDefecto: string) {
  return error instanceof Error ? error.message : porDefecto;
}

export function useCrearCategoria(disciplinaId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CategoriaPayload) => crearCategoria(disciplinaId, payload),
    onSuccess: () => {
      void invalidar(queryClient);
      toast.success('Categoría creada correctamente');
    },
    onError: (error: unknown) => toast.error(mensajeError(error, 'No se pudo crear la categoría')),
  });
}

export function useActualizarCategoria(disciplinaId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<CategoriaPayload> }) =>
      actualizarCategoria(disciplinaId, id, payload),
    onSuccess: () => {
      void invalidar(queryClient);
      toast.success('Categoría actualizada correctamente');
    },
    onError: (error: unknown) => toast.error(mensajeError(error, 'No se pudo actualizar la categoría')),
  });
}

export function useDesactivarCategoria(disciplinaId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => desactivarCategoria(disciplinaId, id),
    onSuccess: () => {
      void invalidar(queryClient);
      toast.success('Categoría dada de baja correctamente');
    },
    onError: (error: unknown) => toast.error(mensajeError(error, 'No se pudo dar de baja la categoría')),
  });
}

export function useReactivarCategoria(disciplinaId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => reactivarCategoria(disciplinaId, id),
    onSuccess: () => {
      void invalidar(queryClient);
      toast.success('Categoría reactivada correctamente');
    },
    onError: (error: unknown) => toast.error(mensajeError(error, 'No se pudo reactivar la categoría')),
  });
}
