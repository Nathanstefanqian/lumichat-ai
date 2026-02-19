# Fungleo Frontend 知识库 (Knowledge Base)

本文档旨在通过详细的分解，从最基础的入口开始，全面解析本项目的技术栈、架构设计、核心功能实现及最佳实践。

## 📚 目录

### 1. 基础架构与配置 (Foundation)
- [01-ENTRY-AND-CONFIG.md](01-ENTRY-AND-CONFIG.md)
  - Vite 配置与代理
  - TypeScript 配置
  - `main.tsx` 与入口逻辑
  - `AppProvider` 全局状态注入
  - Tailwind CSS 配置详解

### 2. 路由与布局 (Routing & Layout)
- [02-ROUTING-AND-LAYOUT.md](02-ROUTING-AND-LAYOUT.md)
  - React Router v7 路由定义
  - 受保护路由 (Protected Route) 实现原理
  - 布局组件设计 (Sidebar)
  - 页面跳转与导航

### 3. 状态管理 (State Management)
- [03-STATE-MANAGEMENT.md](03-STATE-MANAGEMENT.md)
  - **客户端状态**: Zustand (Auth Store, Sidebar State)
  - **服务端状态**: TanStack Query (Data Fetching, Caching)
  - 为什么我们需要两种状态管理？

### 4. UI 组件与样式系统 (UI & Styling)
- [04-UI-AND-STYLING.md](04-UI-AND-STYLING.md)
  - Tailwind CSS 实用类详解
  - Shadcn/ui 组件模式 (Button, Input, Label)
  - `clsx` 与 `tailwind-merge` 的作用
  - Lucide React 图标库使用
  - 响应式设计与暗色模式基础

### 5. 表单处理与验证 (Forms & Validation)
- [05-FORMS-AND-VALIDATION.md](05-FORMS-AND-VALIDATION.md)
  - React Hook Form 核心概念
  - Zod Schema 定义与校验
  - 表单错误处理与 UI 反馈
  - `useForm` hook 深度解析

### 6. 网络层设计 (Network Layer)
- [06-NETWORK-LAYER.md](06-NETWORK-LAYER.md)
  - Axios 实例封装
  - 请求拦截器 (Request Interceptor) - Token 注入
  - 响应拦截器 (Response Interceptor) - 统一错误处理
  - API 模块化组织结构

---

## 🚀 学习路径建议

1.  先阅读 **01-ENTRY-AND-CONFIG** 了解项目是如何启动的。
2.  接着阅读 **02-ROUTING-AND-LAYOUT** 理解页面是如何组织的。
3.  通过 **04-UI-AND-STYLING** 学习如何写漂亮的界面。
4.  深入 **03-STATE-MANAGEMENT** 和 **06-NETWORK-LAYER** 掌握数据流向。
5.  最后通过 **05-FORMS-AND-VALIDATION** 学习复杂的交互逻辑。
