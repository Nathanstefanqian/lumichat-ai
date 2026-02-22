import api from '@/lib/axios';
import type { User } from '../types';

export interface UpdateProfileData {
  username?: string;
  email?: string;
}

export const updateProfile = async (data: UpdateProfileData): Promise<User> => {
  return api.put('/users/profile', data);
};
