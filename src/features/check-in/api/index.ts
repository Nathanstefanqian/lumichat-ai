import api from '@/lib/axios';
import type { CheckInRecord, CheckInReward } from '../types';

export interface CheckInHistoryResponse {
  items: CheckInRecord[];
  total: number;
  page: number;
  totalPages: number;
}

export const getCheckInHistory = (page = 1, limit = 10, date?: string): Promise<CheckInHistoryResponse> => {
  let url = `/check-in/history?page=${page}&limit=${limit}`;
  if (date) url += `&date=${date}`;
  return api.get(url);
};

export const deleteCheckIn = (id: string): Promise<void> => {
  return api.delete(`/check-in/${id}`);
};

export interface CheckInResponse extends CheckInRecord {
  ocrPending?: boolean;
  ocrInfo?: {
    wordCount: number;
    date: string;
  };
}

export const submitCheckIn = (data: { 
  type: string; 
  imageUrls: string[]; 
  content?: string;
  paperId?: string;
  section?: string;
  totalQuestions?: number;
  correctQuestions?: number;
  score?: number;
}): Promise<CheckInResponse> => {
  return api.post('/check-in', data);
};

export const getWeeklyRewards = (): Promise<CheckInReward[]> => {
  return api.get('/check-in/rewards');
};

export const redeemReward = (rewardId: string): Promise<{ message: string; remainingPoints: number }> => {
  return api.post(`/check-in/redeem/${rewardId}`);
};

export const getAllCheckInsAdmin = (): Promise<CheckInRecord[]> => {
  return api.get('/check-in/admin/all');
};
