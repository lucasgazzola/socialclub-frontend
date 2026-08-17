import { useQuery } from '@tanstack/react-query';
import { usuariosApi, type UsersQuery } from '../api/users.api';
import { usuariosKeys } from './users.keys';

export function useUsers(query: UsersQuery = {}) {
  return useQuery({
    queryKey: usuariosKeys.list(query),
    queryFn: () => usuariosApi.list(query),
  });
}