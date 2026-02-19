# 04-UI-AND-STYLING (UI组件与样式系统)

本文档将详细讲解 Fungleo 前端项目的 UI 设计原则、样式方案以及组件库的使用。

## 1. 样式方案概览

本项目采用 **Tailwind CSS** 作为原子化 CSS 框架，结合 **Shadcn/ui** 组件库模式，实现高度定制化的设计系统。

### 为什么选择 Tailwind CSS？

- **原子化**: 像搭积木一样组合样式，无需记忆类名，如 `text-center`, `p-4`, `bg-blue-500`。
- **响应式**: 前缀修饰符（`md:`, `lg:`）轻松适配不同屏幕。
- **主题化**: 配合 CSS 变量（`--primary`, `--background`）实现深色模式和多主题切换。

## 2. 核心 UI 组件 (`src/components/ui`)

这些组件是基于 **Radix UI** 无头组件库封装的，兼顾无障碍访问性 (A11y) 和样式自由度。

### 2.1 按钮组件 (`src/components/ui/button.tsx`)

```typescript
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

// 定义按钮样式的变体
const buttonVariants = cva(
  "inline-flex items-center justify-center ... transition-colors focus-visible:outline-none ...",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

// 转发 Ref，使其能作为其它组件的子元素
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))} // 合并类名
        ref={ref}
        {...props}
      />
    )
  }
)
```

**关键工具:**
- **cva (Class Variance Authority)**: 用于构建多变体组件的样式生成器。
- **cn (clsx + tailwind-merge)**: 用于合并类名，解决 Tailwind 类名冲突问题（后面的覆盖前面的）。
- **Slot (Radix UI)**: 允许将组件作为子元素的容器，实现多态渲染（如 `asChild`）。

### 2.2 输入框组件 (`src/components/ui/input.tsx`)

```typescript
import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background ...",
          className // 允许外部覆盖默认样式
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
```

## 3. 图标库 (`Lucide React`)

本项目使用 **Lucide React**作为图标库，它轻量、风格统一且支持 Tree Shaking。

```typescript
import { Sparkles, MessageSquare } from 'lucide-react';

<Sparkles className="w-5 h-5 text-yellow-500" />
```

## 4. 动画与过渡

Tailwind 内置了常用的过渡类名，配合自定义动画可以实现流畅的交互效果。

### 4.1 过渡 (Transition)

```html
<button className="transition-all duration-300 hover:scale-105">
  Hover Me
</button>
```

- `transition-all`: 启用所有属性的过渡。
- `duration-300`: 持续时间 300ms。
- `hover:scale-105`: 鼠标悬停时放大 1.05 倍。

### 4.2 自定义动画 (`tailwind.config.js`)

我们在配置文件中扩展了动画关键帧：

```javascript
// tailwind.config.js
theme: {
  extend: {
    keyframes: {
      "accordion-down": {
        from: { height: "0" },
        to: { height: "var(--radix-accordion-content-height)" },
      },
      // ...
    },
    animation: {
      "accordion-down": "accordion-down 0.2s ease-out",
    },
  },
}
```

## 5. 响应式设计

Tailwind 采用 **移动端优先 (Mobile First)** 的设计理念。

- `sm`: >= 640px (平板)
- `md`: >= 768px (桌面显示器)
- `lg`: >= 1024px (大屏)
- `xl`: >= 1280px (超大屏)

```html
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {/* 移动端 1 列，平板 2 列，大屏 3 列 */}
</div>
```
