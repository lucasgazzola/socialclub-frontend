import type { MemberFormData } from './schemas';

export type { MemberFormData };

export interface MemberCategory {
  id: number;
  name: string;
  description?: string | null;
}

export interface Member {
  id: number;
  name: string;
  lastName: string;
  dni: string;
  email?: string | null;
  phone?: string | null;
  birthDate?: string | null;
  active: boolean;
  categoryId?: number | null;
  category?: MemberCategory | null;
  createdAt: string;
}

export type MemberStatusFilter = 'ALTA' | 'BAJA';

/** Parámetros del listado de socios (US-15: búsqueda, filtros + paginación). */
export interface MembersQuery {
  search?: string;
  categoryId?: number;
  status?: MemberStatusFilter;
  page?: number;
  perPage?: number;
}

/** Convierte un Member (de API) en datos de formulario. */
export function socioToFormData(socio: Member): MemberFormData {
  return {
    name: socio.name,
    lastName: socio.lastName,
    dni: socio.dni,
    birthDate: socio.birthDate ?? undefined,
    email: socio.email ?? undefined,
    phone: socio.phone ?? undefined,
    categoryId: socio.categoryId ?? undefined,
  };
}
