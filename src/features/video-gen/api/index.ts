import api from '@/lib/axios';
import type { CreateVideoDto, VideoTaskResponse } from '../types';

/**
 * 创建视频生成任务
 */
export const createVideoTask = (dto: CreateVideoDto): Promise<VideoTaskResponse> => {
  return api.post('/video-gen/tasks', dto);
};

/**
 * 获取任务详情
 */
export const getVideoTask = (taskId: string): Promise<VideoTaskResponse> => {
  return api.get(`/video-gen/tasks/${taskId}`);
};

/**
 * 获取任务列表
 */
export const getVideoTasks = (): Promise<VideoTaskResponse[]> => {
  return api.get('/video-gen/tasks');
};

/**
 * 删除任务
 */
export const deleteVideoTask = (taskId: string): Promise<void> => {
  return api.delete(`/video-gen/tasks/${taskId}`);
};

/**
 * 上传参考素材
 */
export const uploadReferenceMedia = (file: File): Promise<{ url: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/video-gen/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
