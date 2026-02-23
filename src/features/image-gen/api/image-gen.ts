import api from '@/lib/axios';

export interface GenerateImageOptions {
  model?: string;
  aspect_ratio?: string;
  prompt_optimizer?: boolean;
  aigc_watermark?: boolean;
  seed?: number;
  reference_image?: string;
}

export interface GeneratedImage {
  _id: string;
  userId: number;
  url: string;
  prompt: string;
  model: string;
  aspectRatio: string;
  seed: number;
  cost?: number;
  currency?: string;
  createdAt: string;
}

export const getTotalCost = async () => {
  return api.get<{ totalCost: number; currency: string }>('/ai/image/cost') as unknown as Promise<{ totalCost: number; currency: string }>;
};

export const generateImage = async (
  prompt: string,
  options: GenerateImageOptions = {},
) => {
  return api.post<{ imageUrl: string }>('/ai/image/generate', {
    prompt,
    model: options.model || 'image-01',
    aspect_ratio: options.aspect_ratio || '1:1',
    prompt_optimizer: options.prompt_optimizer,
    aigc_watermark: options.aigc_watermark,
    seed: options.seed,
    reference_image: options.reference_image,
  }) as unknown as Promise<{ imageUrl: string }>;
};

export const uploadReferenceImage = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post<{ url: string }>('/common/upload?folder=ai-references', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const getHistory = async () => {
  return api.get<GeneratedImage[]>('/ai/image/history') as unknown as Promise<GeneratedImage[]>;
};

export const deleteHistory = async (id: string) => {
  return api.delete(`/ai/image/history/${id}`);
};
