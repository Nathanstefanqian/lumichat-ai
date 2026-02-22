export type VideoTaskStatus = 'pending' | 'filmed' | 'edited' | 'completed';
export type VideoTaskAngle = 'fisheye' | 'handheld-indoor' | 'handheld-outdoor' | 'fixed-indoor' | 'other';

export interface VideoTask {
  _id: string;
  userId: number;
  artist: string;
  song: string;
  snippet?: string;
  angle: VideoTaskAngle;
  status: VideoTaskStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVideoTaskPayload {
  artist: string;
  song: string;
  snippet?: string;
  angle?: VideoTaskAngle;
}

export interface UpdateVideoTaskPayload {
  artist?: string;
  song?: string;
  snippet?: string;
  angle?: VideoTaskAngle;
  status?: VideoTaskStatus;
}
