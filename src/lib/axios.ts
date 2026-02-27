import axios from 'axios';
import { useAuthStore } from '@/stores/auth';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 60000,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    const { code, data, message } = response.data;
    // Assuming backend returns 200/201 for success
    if (code === 200 || code === 201) {
      return data;
    }
    return Promise.reject(new Error(message || 'Unknown error'));
  },
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    // Extract error message from backend response if available
    const message = error.response?.data?.message || error.message || 'Unknown error';
    // If message is array (e.g. NestJS validation errors), join them
    const finalMessage = Array.isArray(message) ? message.join(', ') : message;
    
    return Promise.reject(new Error(finalMessage));
  }
);

export default api;
