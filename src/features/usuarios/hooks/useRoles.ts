import { useQuery } from '@tanstack/react-query';
import { usuariosApi } from '../api/usuarios.api';
import { usuariosKeys } from './users.keys';

export function useRoles() {
  return useQuery({
    queryKey: usuariosKeys.roles(),
    queryFn: () => usuariosApi.getRoles(),
    staleTime: 1000 * 60 * 10,
  });
}
