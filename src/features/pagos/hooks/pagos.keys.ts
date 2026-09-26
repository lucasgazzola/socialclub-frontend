/** Claves de cache de react-query para el módulo de pagos. */
export const pagosKeys = {
  all: ['pagos'] as const,
  misCuotas: () => [...pagosKeys.all, 'mis-cuotas'] as const,
  historial: () => [...pagosKeys.all, 'historial'] as const,
  cuotasPendientesSocio: (socioId: number) =>
    [...pagosKeys.all, 'socio', socioId, 'cuotas-pendientes'] as const,
  pendientesDeportivos: (personaId: number) =>
    [...pagosKeys.all, 'deportivos', personaId, 'pendientes'] as const,
};
