import type { UsersQuery } from '../api/users.api';

export const usuariosKeys = {
  all: ['usuarios'] as const,
  list: (query: UsersQuery) => [...usuariosKeys.all, 'list', query] as const,
};