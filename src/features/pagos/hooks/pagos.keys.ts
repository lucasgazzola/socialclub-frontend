/** Claves de cache de react-query para el módulo de pagos. */
export const pagosKeys = {
  all: ['pagos'] as const,
  misCuotas: () => [...pagosKeys.all, 'mis-cuotas'] as const,
  historial: () => [...pagosKeys.all, 'historial'] as const,
};
