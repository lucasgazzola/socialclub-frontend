import { QueryClient } from '@tanstack/react-query';

/**
 * Configuración central de react-query (estado del servidor).
 * Defaults conservadores y razonables para toda la app.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000, // 30s: evita refetches innecesarios entre navegaciones
    },
  },
});
