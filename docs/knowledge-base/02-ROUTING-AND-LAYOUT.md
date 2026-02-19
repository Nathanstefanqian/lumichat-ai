# 02-ROUTING-AND-LAYOUT (路由与布局)

本文档将详细讲解 Fungleo 前端项目的路由系统、受保护路由机制以及侧边栏布局的实现。

## 1. 路由配置 (`src/App.tsx`)

我们使用 **React Router v7** (兼容 v6 API) 来管理页面导航。

```typescript
import { Routes, Route } from 'react-router-dom'
import { LoginPage } from './features/auth/routes/login'
import { Dashboard } from './features/dashboard/routes/dashboard'
import { ProtectedRoute } from './lib/protected-route'

function App() {
  return (
    <div className="min-h-screen bg-background font-sans antialiased text-foreground">
      <Routes>
        {/* 受保护的路由组 */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Dashboard />} />
        </Route>
        
        {/* 公开路由 */}
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </div>
  )
}
```

**解析:**
- `<Routes>`: 路由容器。
- `<Route path="/login" element={<LoginPage />} />`: 当 URL 为 `/login` 时，渲染登录页面。
- **嵌套路由 (Nested Routes)**: `<Route element={<ProtectedRoute />}>` 是一个布局路由，它没有 `path`，但包裹了内部的 `<Route path="/" ... />`。这意味着访问 `/` 必须先通过 `ProtectedRoute` 的检查。

## 2. 受保护路由 (`src/lib/protected-route.tsx`)

这是实现权限控制的核心组件。

```typescript
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';

export const ProtectedRoute = () => {
  const token = useAuthStore((state) => state.token); // 从 Zustand Store 获取 Token

  if (!token) {
    // 如果没有 Token，重定向到登录页，并使用 replace 替换当前历史记录
    return <Navigate to="/login" replace />;
  }

  // 如果有 Token，渲染子路由 (即 Dashboard)
  return <Outlet />;
};
```

**关键点:**
- `useAuthStore`: 我们使用 Zustand 全局状态来检查用户是否登录。
- `<Navigate />`: 声明式导航组件，用于重定向。
- `<Outlet />`: 占位符组件，表示渲染子路由的内容。

## 3. 布局设计 (`src/components/layout/sidebar.tsx`)

我们的 Dashboard 采用经典的 **侧边栏布局**。

### 3.1 组件接口定义

```typescript
export type TabType = 'chat' | 'image' | 'voice';

interface SidebarProps {
  isOpen: boolean;                // 侧边栏展开状态
  toggleSidebar: () => void;      // 切换展开/收起的回调
  activeTab: TabType;             // 当前选中的 Tab
  onTabChange: (tab: TabType) => void; // 切换 Tab 的回调
}
```

这里体现了 **React 的受控组件 (Controlled Component)** 思想：侧边栏本身不持有 `isOpen` 或 `activeTab` 状态，而是由父组件 (`Dashboard`) 传入并控制。这使得状态可以在父组件中被其他子组件共享。

### 3.2 动态样式 (`cn` 函数)

我们使用 `cn` (clsx + tailwind-merge) 来根据状态动态生成类名。

```typescript
<div 
  className={cn(
    "relative flex flex-col h-screen bg-white ... transition-all duration-300",
    isOpen ? "w-64" : "w-20" // 根据 isOpen 切换宽度
  )}
>
```

### 3.3 导航项渲染

```typescript
const navItems = [
  { id: 'chat', icon: MessageSquare, label: 'AI 对话', color: 'text-blue-500' },
  // ...
] as const;

// 渲染列表
{navItems.map((item) => (
  <button
    key={item.id}
    onClick={() => onTabChange(item.id)}
    className={cn(...)}
  >
    <item.icon className={cn(...)} />
    {isOpen && <span>{item.label}</span>} {/* 仅在展开时显示文字 */}
  </button>
))}
```

## 4. Dashboard 页面 (`src/features/dashboard/routes/dashboard.tsx`)

这是主页面，负责管理布局状态和内容区域的切换。

```typescript
export function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // 根据 activeTab 渲染不同内容
  const renderContent = () => {
    switch (activeTab) {
      case 'chat': return <ChatView />; // 示例
      case 'image': return <ImageView />;
      // ...
    }
  };

  return (
    <div className="flex h-screen ...">
      <Sidebar ... /> {/* 传入状态和控制函数 */}
      <main className="flex-1 ...">
        {renderContent()}
      </main>
    </div>
  );
}
```

这种模式称为 **条件渲染 (Conditional Rendering)**，非常适合构建单页应用的多视图切换。
