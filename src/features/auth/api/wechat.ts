import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useAuthStore } from '@/stores/auth';
import { useNavigate } from 'react-router-dom';
import type { LoginResponse } from '../types';

export const getWechatLoginUrl = (): Promise<{ url: string }> => {
  return api.get('/auth/wechat/login-url');
};

export const wechatCallback = (code: string): Promise<LoginResponse> => {
  return api.get(`/auth/wechat/callback?code=${code}`);
};

export const useWechatLoginUrl = () => {
  return useQuery({
    queryKey: ['wechat-login-url'],
    queryFn: getWechatLoginUrl,
    enabled: false, // Only fetch when triggered manually
  });
};

export const useWechatCallback = () => {
  const setToken = useAuthStore((state) => state.setToken);
  const setUser = useAuthStore((state) => state.setUser);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: wechatCallback,
    onSuccess: (response) => {
      setToken(response.access_token);
      setUser(response.user);
      navigate('/');
    },
    onError: (error) => {
      console.error('WeChat Login Failed:', error);
      navigate('/login?error=wechat_failed');
    }
  });
};
