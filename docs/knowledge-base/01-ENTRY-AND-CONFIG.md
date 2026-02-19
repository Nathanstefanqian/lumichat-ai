# 01-ENTRY-AND-CONFIG (基础架构与配置)

本文档将详细讲解 Fungleo 前端项目的基础入口、构建配置以及核心依赖。

## 1. 核心技术栈 (Technology Stack)

| 领域 | 选型 | 作用 |
| :--- | :--- | :--- |
| **框架** | **React 19** | 构建用户界面的核心库。 |
| **构建工具** | **Vite 7** | 极速冷启动、热更新 (HMR)、打包工具。 |
| **语言** | **TypeScript 5.9** | 提供静态类型检查，提升代码健壮性。 |
| **CSS 框架** | **Tailwind CSS 3.4** | 原子化 CSS，快速编写样式。 |

## 2. 配置文件详解

### 2.1 `vite.config.ts` (构建配置)

Vite 配置文件负责项目的构建行为、插件配置以及开发服务器设置。

```typescript
import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()], // 启用 React 支持
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // 路径别名配置，使用 @ 引用 src 目录
    },
  },
  server: {
    proxy: {
      '/api': { // 代理配置：解决跨域问题
        target: 'http://localhost:3000', // 将 /api 开头的请求转发到后端服务
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''), // 去掉 /api 前缀
      },
    },
  },
})
```

**关键点解析:**
- **别名 (@)**: 允许我们在代码中使用 `@/components/...` 而不是 `../../components/...`，这得益于 `path.resolve`。
- **代理 (Proxy)**: 开发环境中，前端运行在 5173 端口，后端在 3000 端口。通过代理，前端请求 `/api/auth/login` 会被转发到 `http://localhost:3000/auth/login`，避免了浏览器的同源策略限制。

### 2.2 `tsconfig.app.json` (TypeScript 配置)

定义了 TypeScript 编译器的行为。

```json
{
  "compilerOptions": {
    "target": "ES2022", // 编译目标版本
    "jsx": "react-jsx", // 支持 JSX 语法
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"] // 配合 Vite 配置路径别名，让 TS 也能识别 @
    }
    // ...其他严格模式配置
  }
}
```

## 3. 应用入口 (Entry Point)

### 3.1 `index.html` (HTML 模板)

这是单页应用 (SPA) 的唯一 HTML 文件。

```html
<!doctype html>
<html lang="en">
  <body>
    <div id="root"></div> <!-- React 应用挂载点 -->
    <script type="module" src="/src/main.tsx"></script> <!-- 加载入口脚本 -->
  </body>
</html>
```

### 3.2 `src/main.tsx` (脚本入口)

React 应用的启动文件。

```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css' // 引入全局样式 (包含 Tailwind 指令)
import App from './App.tsx'
import { AppProvider } from './app/provider' // 全局 Provider 包装器

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider> {/* 注入全局 Context (Router, QueryClient) */}
      <App />
    </AppProvider>
  </StrictMode>,
)
```

### 3.3 `src/app/provider.tsx` (全局 Provider)

为了让应用支持 **路由** 和 **数据请求**，我们需要在顶层包裹相应的 Provider。

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import type { ReactNode } from 'react';

const queryClient = new QueryClient(); // 创建 React Query 客户端实例

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}> {/* 数据请求层 */}
      <BrowserRouter> {/* 路由层 */}
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
}
```

## 4. 样式入口 (`src/index.css`)

这里引入了 Tailwind CSS 的基础指令，以及定义了 CSS 变量 (用于 Shadcn/ui 的主题系统)。

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* 定义颜色变量，如 --background, --primary 等 */
    --background: 0 0% 100%;
    /* ... */
  }
}
```

这些变量使得我们可以通过修改 CSS 变量轻松实现 **暗色模式 (Dark Mode)** 或 **主题切换**。
