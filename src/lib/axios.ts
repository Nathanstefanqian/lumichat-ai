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
    // 后端拦截器 ResponseInterceptor 会把所有响应包裹在 { code, message, data } 里
    // 我们只需要返回 data 字段给组件使用
    const { code, data, message } = response.data;
    
    // 如果 code 是 200/201，说明是业务成功
    if (code === 200 || code === 201) {
      return data;
    }
    
    // 否则说明是业务错误，也抛出异常走错误处理逻辑
    return Promise.reject(new Error(message || '操作失败'));
  },
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    
    // 强制从 error.response.data 中提取后端吐出来的具体错误信息
    // 兼容多种可能的错误结构
    const data = error.response?.data;
    let finalMessage = '未知错误';

    if (data) {
      if (typeof data === 'string') {
        // 如果后端返回的是 HTML (通常是 Nginx 或未捕获的崩溃)
        if (data.includes('<!DOCTYPE html>') || data.includes('<html>')) {
          finalMessage = `服务器繁忙 (HTTP ${error.response?.status})`;
        } else {
          finalMessage = data;
        }
      } else if (data.message) {
        finalMessage = Array.isArray(data.message) ? data.message.join(', ') : data.message;
      } else if (data.error) {
        finalMessage = data.error;
      }
    } else {
      finalMessage = error.message || '网络请求失败';
    }
    
    console.error('[Axios Error Detail]', {
      status: error.response?.status,
      data: error.response?.data,
      message: finalMessage,
      headers: error.response?.headers
    });

    return Promise.reject(new Error(finalMessage));
  }
);

export default api;
