import api from '@/lib/axios';

export interface GenerateImageOptions {
  model?: string;
  size?: string;
  watermark?: boolean;
  seed?: number;
  reference_images?: string[];
  sequential_image_generation?: 'auto' | 'disabled';
  sequential_image_generation_options?: {
    max_images?: number;
  };
  tools?: Array<{ type: string }>;
  stream?: boolean;
  guidance_scale?: number;
  optimize_prompt_options?: {
    mode: string;
  };
  output_format?: string;
  n?: number;
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
    ...options
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
