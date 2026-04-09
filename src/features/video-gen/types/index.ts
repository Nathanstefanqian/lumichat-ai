export type VideoModelType = 'doubao-seedance-2-0-260128' | 'doubao-seedance-2-0-fast-260128';

export type VideoRatio = '16:9' | '21:9' | '9:16' | '3:4' | '1:1' | '4:3';

export type VideoResolution = '480p' | '720p';

export interface VideoContentInput {
  type: 'text' | 'image' | 'video' | 'audio';
  text?: string;
  image_url?: string;
  video_url?: string;
  audio_url?: string;
}

export interface CreateVideoDto {
  model: VideoModelType;
  content: VideoContentInput[];
  ratio: VideoRatio;
  resolution: VideoResolution;
  duration: number; // 4-15s
  generate_audio: boolean;
  seed?: number;
  draft?: boolean;
}

export interface VideoTaskResponse {
  task_id: string;
  status: 'pending' | 'running' | 'succeeded' | 'success' | 'failed';
  video_url?: string;
  cover_url?: string;
  error_message?: string;
  created_at: string;
}
