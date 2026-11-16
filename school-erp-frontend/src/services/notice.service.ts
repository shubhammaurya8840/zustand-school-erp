import { apiClient } from './api-client';

export const noticeService = {
  async getAll(params?: {
    category?: string;
    page?: number;
    limit?: number;
  }): Promise<{ total: number; page: number; limit: number; notices: any[] }> {
    return apiClient.get('/notices', params);
  },

  async getById(id: string): Promise<any> {
    return apiClient.get(`/notices/${id}`);
  },

  async create(payload: {
    title: string;
    content: string;
    category: string;
    priority: string;
    targetAudience: string;
    targetClassId?: string;
    targetSectionId?: string;
    expiresAt?: string;
  }): Promise<any> {
    return apiClient.post('/notices', payload);
  },

  async archive(id: string): Promise<any> {
    return apiClient.put(`/notices/${id}/archive`);
  },
};

