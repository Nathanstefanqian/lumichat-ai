import api from '@/lib/axios';
import type { User } from '../types';

export const getProfile = async (userId?: number): Promise<User> => {
  return api.get(userId ? `/users/${userId}` : '/users/profile');
};
