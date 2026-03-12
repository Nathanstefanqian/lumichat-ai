import { useMutation } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { LoginCredentials, LoginResponse } from '../types';
import { useAuthStore } from '@/stores/auth';
import { useNavigate } from 'react-router-dom';
import { getProfile } from './get-profile';

export const loginWithEmailAndPassword = (data: LoginCredentials): Promise<LoginResponse> => {
  return api.post('/auth/login', data);
};

export const useLogin = () => {
  const setToken = useAuthStore((state) => state.setToken);
  const setUser = useAuthStore((state) => state.setUser);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: loginWithEmailAndPassword,
    onSuccess: async (response) => {
      setToken(response.access_token);
      
      // 登录成功后，立即调用获取个人信息接口以更新头像和昵称
      try {
        const fullProfile = await getProfile(response.user.userId);
        setUser({
          ...response.user,
          ...fullProfile
        });
      } catch (error) {
        console.error('Failed to fetch full profile after login:', error);
        setUser(response.user);
      }
      
      navigate('/'); // Redirect to dashboard/home after login
    },
  });
};
