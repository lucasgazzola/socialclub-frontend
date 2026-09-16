import { useQuery } from '@tanstack/react-query';
import { usuariosApi } from '../api/usuarios.api';
import { usuariosKeys } from './users.keys';

export function useUsers() {
  return useQuery({
    queryKey: usuariosKeys.list(),
    queryFn: () => usuariosApi.list(),
  });
}
