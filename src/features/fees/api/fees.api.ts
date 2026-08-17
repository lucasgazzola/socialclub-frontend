import { apiClient } from '@/lib/api/client';
import type { Paginated } from '@/types/api';
import type {
  UpdateFeeDto,
  SportsFeeConfig,
  ConfigureFeeDto,
  FeesQuery,
} from '../types';

export const cuotasApi = {
  async list(query: FeesQuery = {}): Promise<Paginated<SportsFeeConfig>> {
    const { data } = await apiClient.get<Paginated<SportsFeeConfig>>('/fees', {
      params: {
        disciplineId: query.disciplineId || undefined,
        categoryId: query.categoryId || undefined,
        appliedPeriod: query.appliedPeriod || undefined,
        page: query.page,
        perPage: query.perPage,
      },
    });
    return data;
  },

  async create(payload: ConfigureFeeDto): Promise<SportsFeeConfig> {
    const { data } = await apiClient.post<SportsFeeConfig>('/fees', payload);
    return data;
  },

  async update(
    id: number,
    payload: UpdateFeeDto,
  ): Promise<SportsFeeConfig> {
    const { data } = await apiClient.patch<SportsFeeConfig>(`/fees/${id}`, payload);
    return data;
  },
};
