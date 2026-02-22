import api from '@/lib/axios';

export const generateImage = async (prompt: string, model: string = 'dall-e-3') => {
  return api.post<{ imageUrl: string }>('/ai/image/generate', {
    prompt,
    model,
  }) as unknown as Promise<{ imageUrl: string }>;
};
