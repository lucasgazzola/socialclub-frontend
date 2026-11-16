import { apiClient } from '@/lib/api/client';
import type { EjecucionTarea, TareaAutomatica } from '../types';

export const tareasApi = {
  async listar(): Promise<TareaAutomatica[]> {
    const { data } = await apiClient.get<TareaAutomatica[]>('/tareas');
    return data;
  },

  async ejecuciones(nombre: string): Promise<EjecucionTarea[]> {
    const { data } = await apiClient.get<EjecucionTarea[]>(`/tareas/${nombre}/ejecuciones`);
    return data;
  },

  /** Ejecución manual (queda auditada con el usuario). */
  async ejecutar(nombre: string): Promise<EjecucionTarea> {
    const { data } = await apiClient.post<EjecucionTarea>(`/tareas/${nombre}/ejecutar`);
    return data;
  },
};
