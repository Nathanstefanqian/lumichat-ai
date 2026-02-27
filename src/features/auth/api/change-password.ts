import axios from '@/lib/axios';

export type ChangePasswordDto = {
  oldPassword: string;
  newPassword: string;
};

export const changePassword = (data: ChangePasswordDto) => {
  return axios.post('/users/password', data);
};
