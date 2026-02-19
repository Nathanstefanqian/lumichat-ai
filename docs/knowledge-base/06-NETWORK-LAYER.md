# 06-NETWORK-LAYER (网络层设计)

本文档将详细讲解 Fungleo 前端项目的网络层设计，包括如何使用 Axios 进行 API 调用封装，以及如何处理认证 Token 和统一错误。

## 1. 网络层概览

本项目采用了 **Axios** + **拦截器** 的模式，集中处理所有的 HTTP 请求逻辑。

| 模块 | 文件 | 作用 |
| :--- | :--- | :--- |
| **Axios 实例** | `src/lib/axios.ts` | 配置 BaseURL、超时、拦截器。 |
| **API 模块** | `src/features/**/api/*.ts` | 定义具体的 API 请求函数。 |
| **类型定义** | `src/types/index.ts` | 定义通用的响应结构。 |

## 2. Axios 实例封装 (`src/lib/axios.ts`)

### 2.1 创建实例

```typescript
import axios from 'axios';
import { useAuthStore } from '@/stores/auth';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api', // 优先使用环境变量，默认为 /api
  timeout: 10000, // 超时时间 10s
});
```

### 2.2 请求拦截器 (Request Interceptor)

用于在发送请求前自动注入 JWT Token。

```typescript
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token; // 从 Zustand Store 获取 Token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`; // 添加 Authorization 头
  }
  return config;
});
```

### 2.3 响应拦截器 (Response Interceptor)

用于统一处理后端返回的数据结构和错误。

```typescript
api.interceptors.response.use(
  (response) => {
    // 解构后端返回的标准格式
    const { code, data, message } = response.data;
    
    // 假设后端约定 200/201 为成功
    if (code === 200 || code === 201) {
      return data; // 直接返回 data 部分，简化调用方代码
    }
    
    // 如果 code 不为 200，视为业务错误，抛出异常
    return Promise.reject(new Error(message || 'Unknown error'));
  },
  (error) => {
    // 处理 HTTP 状态码错误
    if (error.response?.status === 401) {
      // 401 未授权 -> 自动登出
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);
```

## 3. API 模块化组织

为了保持代码整洁，我们将 API 请求函数按功能模块划分。

### 3.1 定义类型 (`src/types/index.ts`)

```typescript
export interface ResponseFormat<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp: string;
  path: string;
}
```

### 3.2 定义请求函数 (`src/features/auth/api/login.ts`)

```typescript
import api from '@/lib/axios';
import type { LoginCredentials, LoginResponse } from '../types';

export const loginWithEmailAndPassword = (data: LoginCredentials): Promise<LoginResponse> => {
  return api.post('/auth/login', data);
};
```

**注意**: 由于拦截器已经解包了 `response.data.data`，这里的返回值类型直接标注为 `Promise<LoginResponse>`，而不是 `Promise<AxiosResponse<...>>`。这大大简化了组件中的使用。

## 4. 结合 React Query

在组件中，我们通常不会直接调用 API 函数，而是通过 React Query 的 Hooks 进行调用。

```typescript
// src/features/auth/api/login.ts

export const useLogin = () => {
  return useMutation({
    mutationFn: loginWithEmailAndPassword,
    // ...
  });
};
```

这种模式实现了 **数据获取逻辑与 UI 组件的解耦**。

## 5. 错误处理策略

### 5.1 全局错误

- **401 Unauthorized**: 自动跳转登录页（由拦截器处理）。
- **500 Internal Server Error**: 可以在拦截器中添加全局 Toast 提示。

### 5.2 局部错误

- **表单验证错误**: 由 React Hook Form 处理。
- **业务逻辑错误**: 由 React Query 的 `onError` 回调处理，或在组件中通过 `isError` 状态展示。

```typescript
const { error, isError } = useQuery(...);

if (isError) {
  return <ErrorMessage message={error.message} />;
}
```
