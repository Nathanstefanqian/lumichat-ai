import { useMutation } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { LoginCredentials, LoginResponse } from '../types';
import { useAuthStore } from '@/stores/auth';
import { useNavigate } from 'react-router-dom';

export const loginWithEmailAndPassword = (data: LoginCredentials): Promise<LoginResponse> => {
  return api.post('/auth/login', data);
};

export const useLogin = () => {
  const setToken = useAuthStore((state) => state.setToken);
  const setUser = useAuthStore((state) => state.setUser);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: loginWithEmailAndPassword,
    onSuccess: (response) => {
      setToken(response.access_token);
      setUser(response.user);
      navigate('/'); // Redirect to dashboard/home after login
    },
  });
};
