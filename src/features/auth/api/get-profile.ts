import api from '@/lib/axios';
import type { User } from '../types';

interface ProfileResponse {
  user: User;
  message: string;
}

export const getProfile = async (userId?: number): Promise<User> => {
  if (userId) {
    return api.get(`/users/${userId}`);
  }
  const response = (await api.get('/auth/profile')) as unknown as ProfileResponse;
  return response.user;
};
