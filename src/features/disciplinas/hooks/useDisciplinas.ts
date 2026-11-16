import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  actualizarDisciplina,
  crearDisciplina,
  desactivarDisciplina,
  listarDisciplinas,
  obtenerDisciplina,
  reactivarDisciplina,
} from '../api/disciplina.api';
import type { CreateDisciplinaPayload, DisciplinasQuery, UpdateDisciplinaPayload } from '../types';

export const disciplinasKeys = {
  all: ['disciplinas'] as const,
  list: (query: DisciplinasQuery) => ['disciplinas', 'list', query] as const,
  detail: (id: number) => ['disciplinas', id] as const,
};

export function useDisciplinas(query: DisciplinasQuery) {
  return useQuery({ queryKey: disciplinasKeys.list(query), queryFn: () => listarDisciplinas(query), placeholderData: (previous) => previous });
}

export function useDisciplina(id: number | undefined) {
  return useQuery({
    queryKey: id === undefined ? disciplinasKeys.all : disciplinasKeys.detail(id),
    queryFn: () => obtenerDisciplina(id as number),
    enabled: id !== undefined,
  });
}

function invalidarListado(queryClient: ReturnType<typeof useQueryClient>) {
  return queryClient.invalidateQueries({ queryKey: disciplinasKeys.all });
}

export function useCrearDisciplina() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDisciplinaPayload) => crearDisciplina(payload),
    onSuccess: () => {
      void invalidarListado(queryClient);
      toast.success('Disciplina creada correctamente');
    },
    onError: (error: unknown) => toast.error(error instanceof Error ? error.message : 'No se pudo crear la disciplina'),
  });
}

export function useActualizarDisciplina() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateDisciplinaPayload }) =>
      actualizarDisciplina(id, payload),
    onSuccess: (_data, variables) => {
      void invalidarListado(queryClient);
      void queryClient.invalidateQueries({ queryKey: disciplinasKeys.detail(variables.id) });
      toast.success('Disciplina actualizada correctamente');
    },
    onError: (error: unknown) => toast.error(error instanceof Error ? error.message : 'No se pudo actualizar la disciplina'),
  });
}

export function useDesactivarDisciplina() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: desactivarDisciplina,
    onSuccess: () => {
      void invalidarListado(queryClient);
      toast.success('Disciplina desactivada correctamente');
    },
    onError: (error: unknown) => toast.error(error instanceof Error ? error.message : 'No se pudo desactivar la disciplina'),
  });
}

export function useReactivarDisciplina() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reactivarDisciplina,
    onSuccess: () => {
      void invalidarListado(queryClient);
      toast.success('Disciplina reactivada correctamente');
    },
    onError: (error: unknown) => toast.error(error instanceof Error ? error.message : 'No se pudo reactivar la disciplina'),
  });
}
