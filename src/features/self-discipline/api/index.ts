import axios from '@/lib/axios';
import type { WillpowerStatus, BehaviorLog, RecordBehaviorDto } from '../types';

export const getWillpowerStatus = (): Promise<WillpowerStatus> => {
  return axios.get('/self-discipline/status');
};

export const recordBehavior = (data: RecordBehaviorDto): Promise<BehaviorLog> => {
  return axios.post('/self-discipline/record', data);
};

export const deleteBehaviorLog = (logId: string): Promise<{ success: boolean }> => {
  return axios.post('/self-discipline/delete-log', { logId });
};

export const getBehaviorLogs = (): Promise<BehaviorLog[]> => {
  return axios.get('/self-discipline/logs');
};

export const refreshAiReport = (): Promise<void> => {
  return axios.post('/self-discipline/ai-report/refresh');
};

export const setGuardian = (guardianId: number | null): Promise<void> => {
  return axios.post('/self-discipline/guardian', { guardianId });
};

export const getFriends = (): Promise<any[]> => {
  return axios.get('/friends');
};
