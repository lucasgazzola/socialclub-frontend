/**
 * Punto único y tipado de acceso a la configuración del entorno.
 * Evita esparcir `import.meta.env.VITE_...` por todo el código y centraliza
 * los valores por defecto.
 */
export const env = {
  apiUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1',
} as const;
