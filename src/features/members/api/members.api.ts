import { apiClient } from '@/lib/api/client';
import type { Paginated } from '@/types/api';
import type { Member, MemberFormData, MembersQuery } from '../types';

export const sociosApi = {
  async list(query: MembersQuery = {}): Promise<Paginated<Member>> {
    const { data } = await apiClient.get<Paginated<Member>>('/members', {
      params: {
        search: query.search || undefined,
        categoryId: query.categoryId || undefined,
        status: query.status || undefined,
        page: query.page,
        perPage: query.perPage,
      },
    });
    return data;
  },

  async getById(id: number): Promise<Member> {
    const { data } = await apiClient.get<Member>(`/members/${id}`);
    return data;
  },

  async create(formData: MemberFormData): Promise<Member> {
    const { data } = await apiClient.post<Member>('/members', formData);
    return data;
  },

  async update(id: number, formData: Partial<MemberFormData>): Promise<Member> {
    const { data } = await apiClient.patch<Member>(`/members/${id}`, formData);
    return data;
  },
};
