/**
 * TASK-51 · Pasarela de pagos. El front no sabe qué pasarela hay detrás
 * (Mercado Pago o la simulada): inicia la orden, redirige a `urlPago` y, a la
 * vuelta, le pide a la API que confirme el pago.
 */
export type ConceptoCobro = 'CUOTA_SOCIAL' | 'ENTRADAS';

export type EstadoOrdenPago =
  | 'PENDIENTE'
  | 'APROBADA'
  | 'CANCELADA'
  | 'VENCIDA'
  | 'REQUIERE_REVISION';

export interface OrdenPago {
  referencia: string;
  concepto: ConceptoCobro;
  estado: EstadoOrdenPago;
  /** MERCADO_PAGO, SIMULADA o SIN_COSTO. */
  pasarela: string;
  descripcion: string;
  monto: number;
  /** A dónde redirigir para pagar; null si la orden ya no está pendiente. */
  urlPago: string | null;
  detalleEstado: string | null;
  expiraEn: string;
  creadoEn: string;
}

/** Nombre legible de cada método de pago (historiales y comprobantes). */
export const ETIQUETA_METODO_PAGO: Record<string, string> = {
  MERCADO_PAGO: 'Mercado Pago',
  SIMULADA: 'Pago simulado',
  SIN_COSTO: 'Sin costo',
  MOCK_TARJETA: 'Tarjeta (simulada)',
  EFECTIVO: 'Efectivo',
  TRANSFERENCIA: 'Transferencia',
  DEBITO: 'Débito',
  CREDITO: 'Crédito',
  OTRO: 'Otro',
};

export function etiquetaMetodoPago(metodo: string): string {
  return ETIQUETA_METODO_PAGO[metodo] ?? metodo;
}
