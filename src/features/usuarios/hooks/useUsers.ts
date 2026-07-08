import { useQuery } from '@tanstack/react-query';
import { usuariosApi, type UsuariosQuery } from '../api/usuarios.api';
import { usuariosKeys } from './users.keys';

export function useUsers(query: UsuariosQuery = {}) {
  return useQuery({
    queryKey: usuariosKeys.list(query),
    queryFn: () => usuariosApi.list(query),
  });
}