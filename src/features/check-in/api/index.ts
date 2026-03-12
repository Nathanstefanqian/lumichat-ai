import api from '@/lib/axios';
import type { CheckInRecord, CheckInReward } from '../types';

export const submitCheckIn = (data: { type: string; imageUrl: string; content?: string }): Promise<CheckInRecord> => {
  return api.post('/check-in', data);
};

export const getCheckInHistory = (): Promise<CheckInRecord[]> => {
  return api.get('/check-in/history');
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
