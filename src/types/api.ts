/** Tipos compartidos para las respuestas de la API. */

/** Resultado paginado estándar que devuelven los endpoints de listado. */
export interface Paginated<T> {
  items: T[];
  total: number;
  pagina: number;
  porPagina: number;
}

/** Formato uniforme de error que devuelve el backend (HttpExceptionFilter). */
export interface ApiError {
  statusCode: number;
  path: string;
  timestamp: string;
  message: string | string[];
}
