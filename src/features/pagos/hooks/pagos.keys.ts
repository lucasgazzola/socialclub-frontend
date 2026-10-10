/** Claves de cache de react-query para el módulo de pagos. */
export const pagosKeys = {
  all: ['pagos'] as const,
  misCuotas: () => [...pagosKeys.all, 'mis-cuotas'] as const,
  historial: () => [...pagosKeys.all, 'historial'] as const,
  cuotasPendientesSocio: (socioId: number) =>
    [...pagosKeys.all, 'socio', socioId, 'cuotas-pendientes'] as const,
  pendientesDeportivos: (personaId: number) =>
    [...pagosKeys.all, 'deportivos', personaId, 'pendientes'] as const,
  historialDeportivo: (personaId: number, desde?: string, hasta?: string) =>
    [...pagosKeys.all, 'deportivos', personaId, 'historial', desde ?? '', hasta ?? ''] as const,
  morososCuotaSocial: (filtros?: import('../types').FiltrosMorososCuotaSocial) =>
    [...pagosKeys.all, 'morosos', filtros] as const,
  morososCuotaDeportiva: (filtros?: import('../types').FiltrosMorososCuotaDeportiva) =>
    [...pagosKeys.all, 'deportivos', 'morosos', filtros] as const,
};
