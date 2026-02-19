# LumiChat 前端

LumiChat 是一个面向 AI 创作与社交沟通的现代化单页应用，聚焦 **AI 对话**、**用户聊天** 与 **多主题动态体验**。本仓库为前端项目，后端位于 `nestjs-be`。

## ✨ 产品定位

- **AI 助手**：提供流式对话、历史记录与上下文管理
- **社交对话**：支持好友体系与用户间即时沟通
- **视觉体验**：内置多主题与动态背景效果

## ✅ 已实现能力

- 登录 / 注册 / JWT 鉴权
- AI 对话（SSE 流式输出、历史记录拉取）
- 好友系统（请求、接受、拒绝）
- 用户聊天（WebSocket 实时通信）
- 主题系统（亮色 / 暗色 / 护眼 / 浪漫）
- WebSocket 连接状态可视化

## 🚧 正在开发

- AI 对话：标题自动总结、对话质量优化
- 用户聊天：实时对话稳定性与体验优化

## 🧱 技术栈

- **Core**: React 19, TypeScript, Vite
- **State**: Zustand
- **Routing**: React Router v7
- **UI/Styling**: Tailwind CSS, Shadcn/ui, Lucide React
- **Forms**: React Hook Form, Zod
- **Network**: Axios
- **Realtime**: Socket.IO Client

## 📁 目录结构

```text
src/
├── app/                    # 全局 Provider
├── components/             # 通用组件与布局
├── features/               # 业务功能模块
│   ├── ai/                 # AI 对话
│   ├── auth/               # 认证
│   ├── chat/               # 用户聊天与好友
│   └── dashboard/          # 主界面
├── lib/                    # 工具与通用函数
├── stores/                 # Zustand 状态
└── index.css               # 主题与全局样式
```

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

默认地址：`http://localhost:5173`  
API 将代理到后端：`http://localhost:3000`

### 构建生产版本

```bash
npm run build
```

## 🔧 环境变量

支持 `VITE_API_URL` 指定后端地址：

```bash
VITE_API_URL=http://localhost:3000/api
```

## 🧪 常用脚本

```bash
npm run dev      # 本地开发
npm run build    # 生产构建
npm run lint     # 代码检查
npm run preview  # 预览生产包
```

## 🧩 功能开发建议

- 新功能建议放在 `src/features/<feature>` 内
- API 统一封装在 `src/lib/axios.ts`
- 全局状态统一放在 `src/stores/`

## 📚 文档

更详细的架构与规范说明可查看：

- `docs/knowledge-base/README.md`
