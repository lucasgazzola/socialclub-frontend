import { useQuery } from '@tanstack/react-query';
import { usuariosApi } from '@/features/usuarios/api/usuarios.api';

export interface ResponsableAuditoria {
  id: number;
  nombre: string;
  apellido: string;
}

export const RESPONSABLES_AUDITORIA_QUERY_KEY = ['auditoria', 'responsables'] as const;

export function useResponsables() {
  return useQuery({
    queryKey: RESPONSABLES_AUDITORIA_QUERY_KEY,
    queryFn: async (): Promise<ResponsableAuditoria[]> => {
      const data = await usuariosApi.list({ porPagina: 100 });
      return (data.items ?? []).map((u) => ({
        id: u.id,
        nombre: u.nombre,
        apellido: u.apellido,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });
}

