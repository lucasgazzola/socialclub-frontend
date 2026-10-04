import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { eventosApi } from '../api/eventos.api';
import type { FiltrarEventosParams } from '../api/eventos.api';
import type { Evento, CrearEventoFormData, EventosPaginados } from '../types';

export const eventosKeys = {
  all: ['eventos'] as const,
  list: (params?: FiltrarEventosParams) => ['eventos', 'list', params] as const,
  byId: (id: number) => ['eventos', id] as const,
};

// Mapa global en memoria para asociar tempImageUrl a eventId durante la sesión actual
const tempImagesMap = new Map<number, string>();

export function useEventos(params?: FiltrarEventosParams) {
  const query = useQuery({
    queryKey: eventosKeys.list(params),
    queryFn: () => eventosApi.list(params),
  });

  // Inyectar tempImageUrl en los items del resultado paginado
  const dataConTempImages: EventosPaginados | undefined = query.data
    ? {
        ...query.data,
        items: query.data.items.map((ev) => ({
          ...ev,
          tempImageUrl: tempImagesMap.get(ev.id) ?? null,
        })),
      }
    : undefined;

  return {
    ...query,
    data: dataConTempImages,
  };
}

export function useEvento(id: number) {
  const query = useQuery({
    queryKey: eventosKeys.byId(id),
    queryFn: () => eventosApi.getById(id),
    enabled: !!id,
  });

  const dataConTempImage: Evento | undefined = query.data
    ? {
        ...query.data,
        tempImageUrl: tempImagesMap.get(query.data.id) ?? null,
      }
    : undefined;

  return {
    ...query,
    data: dataConTempImage,
  };
}

export function useCrearEvento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      payload: CrearEventoFormData & { tempPreviewUrl?: string | null },
    ) => {
      const { tempPreviewUrl } = payload;
      const apiPayload = { ...payload };
      delete apiPayload.tempPreviewUrl;
      delete apiPayload.imagenFile;
      const created = await eventosApi.create(apiPayload);

      if (tempPreviewUrl && created.id) {
        tempImagesMap.set(created.id, tempPreviewUrl);
      }

      return created;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: eventosKeys.all });
      toast.success('Evento creado correctamente');
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Error al crear el evento');
    },
  });
}
