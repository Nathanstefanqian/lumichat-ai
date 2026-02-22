import api from '@/lib/axios';
import type { CreateVideoTaskPayload, UpdateVideoTaskPayload, VideoTask } from '../types';

// Assuming base URL is /api, so we just need /video-task
const API_BASE = '/video-task';

export const videoTaskApi = {
  getAll: () => 
    api.get(API_BASE)
      .then((res) => res as unknown as VideoTask[]),
  
  create: (payload: CreateVideoTaskPayload) => 
    api.post(API_BASE, payload)
      .then((res) => res as unknown as VideoTask),

  update: (id: string, payload: UpdateVideoTaskPayload) =>
    api.patch(`${API_BASE}/${id}`, payload)
      .then((res) => res as unknown as VideoTask),

  delete: (id: string) =>
    api.delete(`${API_BASE}/${id}`),

  deleteBatch: (ids: string[]) =>
    api.post(`${API_BASE}/batch-delete`, { ids }),

  deleteAll: () =>
    api.delete(`${API_BASE}/all`),

  generateAuto: () =>
    api.post(`${API_BASE}/generate-auto`, {}, { timeout: 60000 })
      .then((res) => res as unknown as VideoTask[]),
};
