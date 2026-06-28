import axios, { AxiosError } from 'axios';
import { env } from '@/config/env';
import type { ApiError } from '@/types/api';

/**
 * Cliente HTTP único de la aplicación.
 * - `withCredentials: true` permite que viaje la cookie httpOnly del JWT.
 * - El interceptor normaliza los errores a un `Error` con mensaje legible,
 *   de modo que las features (y react-query) reciban siempre lo mismo.
 */
export const apiClient = axios.create({
  baseURL: env.apiUrl,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    const raw = error.response?.data?.message;
    const mensaje = Array.isArray(raw)
      ? raw.join(', ')
      : (raw ?? 'Ocurrió un error inesperado. Intentá nuevamente.');
    return Promise.reject(new Error(mensaje));
  },
);
