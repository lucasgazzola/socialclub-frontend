import { useQuery } from '@tanstack/react-query';
import { usuariosApi } from '../api/usuarios.api';
import { usuariosKeys } from './users.keys';
import type { GetUsuariosParams } from '../types';

export function useUsers(params?: GetUsuariosParams) {
  return useQuery({
    queryKey: usuariosKeys.list(params),
    queryFn: () => usuariosApi.list(params),
  });
}
