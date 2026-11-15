import type { UsuarioAutenticado } from '@/features/auth/types';

/**
 * H02 — Misma regla que el back (`EntradasService.cotizar`): es socio quien
 * tiene el rol SOCIO o una membresía sin fecha de baja.
 */
export function aplicaDescuentoSocio(usuario: UsuarioAutenticado | null | undefined): boolean {
  if (!usuario) return false;
  return (
    usuario.roles.includes('SOCIO') ||
    Boolean(usuario.persona?.membresias?.some((m) => !m.fechaBaja))
  );
}

/** Precio unitario con el descuento aplicado, redondeado a centavos como el back. */
export function precioUnitarioEntrada(precio: number, descuentoPorcentaje: number): number {
  return Math.round(Math.max(0, precio * (1 - descuentoPorcentaje / 100)) * 100) / 100;
}

/** Total de la compra, redondeado a centavos como el back. */
export function totalCompraEntradas(precioUnitario: number, cantidad: number): number {
  return Math.round(precioUnitario * cantidad * 100) / 100;
}
