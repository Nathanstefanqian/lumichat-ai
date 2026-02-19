import { useMutation } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { RegisterCredentials, User } from '../types';
import { useNavigate } from 'react-router-dom';

export const registerUser = (data: RegisterCredentials): Promise<User> => {
  return api.post('/users/register', data);
};

export const useRegister = () => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: registerUser,
    onSuccess: () => {
      // Registration successful, redirect to login
      navigate('/login');
    },
  });
};
