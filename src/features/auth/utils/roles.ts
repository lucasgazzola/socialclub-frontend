import type { UsuarioAutenticado } from '../types';

/**
 * Determina si el usuario autenticado corresponde al portal exclusivo de Socios y Participantes
 * (todo usuario autenticado que no posea roles de gestión: ADMIN, COLABORADOR o DELEGADO).
 */
export function esUsuarioPortalSocio(usuario: UsuarioAutenticado | null | undefined): boolean {
  if (!usuario) return false;
  return !usuario.roles?.some(
    (rol) => rol === 'ADMIN' || rol === 'COLABORADOR' || rol === 'DELEGADO',
  );
}
