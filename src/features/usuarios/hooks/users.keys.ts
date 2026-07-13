import type { UsuariosQuery } from '../api/usuarios.api';

export const usuariosKeys = {
  all: ['usuarios'] as const,
  list: (query: UsuariosQuery) => [...usuariosKeys.all, 'list', query] as const,
};