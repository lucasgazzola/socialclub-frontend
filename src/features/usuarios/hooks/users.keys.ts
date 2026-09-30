import type { GetUsuariosParams } from '../types';

export const usuariosKeys = {
  all: ['usuarios'] as const,
  list: (params?: GetUsuariosParams) => [...usuariosKeys.all, 'list', params] as const,
};
