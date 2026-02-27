import api from '@/lib/axios';

export interface UploadResponse {
  url: string;
}

export const uploadMedia = async (
  file: File, 
  folder: string = 'media-compressor',
  onProgress?: (progress: number) => void
): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  
  // The backend supports a 'folder' query param
  const response = await api.post<UploadResponse>(
    `/common/upload?folder=${folder}`, 
    formData, 
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress?.(percentCompleted);
        }
      },
    }
  );
  
  // Axios returns data in response.data, but our api wrapper might return data directly.
  // Checking existing code usage (e.g. image-gen/api/image-gen.ts), api.post returns Promise<T>.
  return response as unknown as UploadResponse;
};
