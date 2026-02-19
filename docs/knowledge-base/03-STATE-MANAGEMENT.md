# 03-STATE-MANAGEMENT (状态管理)

本文档将详细讲解 Fungleo 前端项目的状态管理方案：为什么需要两种状态管理库，以及如何使用它们。

## 1. 状态管理概览

本项目采用了 **分离关注点** 的状态管理策略：

| 类型 | 库 | 作用 | 示例 |
| :--- | :--- | :--- | :--- |
| **客户端状态** (Client State) | **Zustand** | 全局 UI 状态、用户会话、主题偏好等。 | `token`, `isSidebarOpen`, `theme` |
| **服务端状态** (Server State) | **TanStack Query** | 异步数据获取、缓存、加载状态、错误处理。 | `useLogin`, `usePosts`, `isLoading`, `error` |

### 为什么不只用一个？

- **React Query 专注于异步数据**: 它内置了请求去重、自动重试、缓存失效、后台更新等复杂逻辑，这不仅是简单的 `useState` 或 `useEffect` 能轻松实现的。
- **Zustand 专注于全局共享**: 它非常轻量，API 简单，适合跨组件共享少量状态（如 User Token），且不需要复杂的 Redux Boilerplate。

## 2. 客户端状态 (Zustand)

### 2.1 创建 Store (`src/stores/auth.ts`)

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware'; // 持久化中间件
import type { User } from '@/features/auth/types';

interface AuthState {
  token: string | null;
  user: User | null;
  setToken: (token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setToken: (token) => set({ token }), // 更新 token
      setUser: (user) => set({ user }),   // 更新 user
      logout: () => set({ token: null, user: null }), // 清除状态
    }),
    {
      name: 'auth-storage', // localStorage 中的 key
    }
  )
);
```

**关键点:**
- `create<AuthState>()`: 创建一个强类型的 Store。
- `persist`: 中间件，自动将状态同步到 `localStorage`，刷新页面后 Token 不丢失。
- `set`: 更新状态的函数，类似于 React 的 `setState`。

### 2.2 使用 Store

在组件中消费状态非常简单：

```typescript
import { useAuthStore } from '@/stores/auth';

function MyComponent() {
  const token = useAuthStore((state) => state.token); // 只订阅 token 变化
  const logout = useAuthStore((state) => state.logout); // 获取 action

  return <button onClick={logout}>Logout</button>;
}
```

或者在非组件环境（如 Axios 拦截器）中使用：

```typescript
// src/lib/axios.ts
import { useAuthStore } from '@/stores/auth';

const token = useAuthStore.getState().token; // 直接获取当前快照
```

## 3. 服务端状态 (TanStack Query)

### 3.1 封装 API (`src/features/auth/api/login.ts`)

首先定义纯异步函数：

```typescript
import api from '@/lib/axios';

export const loginWithEmailAndPassword = (data: LoginCredentials): Promise<LoginResponse> => {
  return api.post('/auth/login', data);
};
```

### 3.2 自定义 Hook (`useLogin`)

然后将其包装为 React Query Mutation：

```typescript
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth';
import { useNavigate } from 'react-router-dom';

export const useLogin = () => {
  const setToken = useAuthStore((state) => state.setToken);
  const setUser = useAuthStore((state) => state.setUser);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: loginWithEmailAndPassword, // 传入异步函数
    onSuccess: (response) => {
      // 请求成功后的副作用
      setToken(response.access_token);
      setUser(response.user);
      navigate('/'); // 跳转首页
    },
    onError: (error) => {
      // 可以在这里做全局错误提示
      console.error('登录失败', error);
    }
  });
};
```

### 3.3 在组件中使用

```typescript
import { useLogin } from '../api/login';

export function LoginForm() {
  // 解构出 mutation 函数和状态
  const { mutate: login, isPending, error } = useLogin();

  const onSubmit = (data) => {
    login(data); // 触发请求
  };

  return (
    <button disabled={isPending}>
      {isPending ? '登录中...' : '登录'}
    </button>
  );
}
```

**优势:**
- 无需手动维护 `isLoading` 和 `error` 状态。
- 逻辑复用性高（Hook 可在任何组件调用）。
- 自动处理竞态条件（Race Conditions）。
