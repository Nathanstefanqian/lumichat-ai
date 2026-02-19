# 05-FORMS-AND-VALIDATION (表单处理与验证)

本文档将详细讲解 Fungleo 前端项目的表单处理方案，包括如何使用 React Hook Form 管理状态，以及如何使用 Zod 进行数据校验。

## 1. 表单方案概览

本项目采用了 **React Hook Form** + **Zod** 的黄金组合：

| 库 | 作用 | 优势 |
| :--- | :--- | :--- |
| **React Hook Form** | 管理表单状态、提交处理、错误收集。 | **非受控组件**模式，减少重渲染，性能极佳。 |
| **Zod** | 定义数据结构Schema，进行同步/异步校验。 | TypeScript 优先，类型推导强大，Schema 复用性高。 |
| **@hookform/resolvers** | 连接 React Hook Form 和 Zod。 | 将 Zod 的校验结果转换为 RHF 可识别的错误对象。 |

## 2. 表单实现流程 (`src/features/auth/components/login-form.tsx`)

### 2.1 定义 Schema

首先使用 Zod 定义表单的数据结构和校验规则。

```typescript
import * as z from 'zod';

const loginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'), // 必填且符合邮箱格式
  password: z.string().min(6, '密码至少需要6个字符'), // 必填且最小长度6
});

// 从 Schema 推导出 TypeScript 类型
type LoginFormData = z.infer<typeof loginSchema>;
// 等同于: { email: string; password: string; }
```

### 2.2 初始化 Hook

使用 `useForm` 初始化表单实例，并传入 `zodResolver`。

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

export function LoginForm() {
  const {
    register, // 注册输入框
    handleSubmit, // 处理提交
    formState: { errors }, // 获取错误状态
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema), // 绑定校验规则
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // ...
}
```

### 2.3 绑定 UI 组件

将 `register` 函数返回的属性展开到 `<input>` 或自定义组件上。

```typescript
<form onSubmit={handleSubmit(onSubmit)}>
  <div className="grid gap-2">
    <Label htmlFor="email">邮箱</Label>
    <Input
      id="email"
      type="email"
      {...register('email')} // 关键步骤：注册字段
    />
    {/* 显示错误信息 */}
    {errors.email && (
      <p className="text-sm text-red-500">{errors.email.message}</p>
    )}
  </div>
  
  <div className="grid gap-2">
    <Label htmlFor="password">密码</Label>
    <Input
      id="password"
      type="password"
      {...register('password')}
    />
    {errors.password && (
      <p className="text-sm text-red-500">{errors.password.message}</p>
    )}
  </div>

  <Button type="submit">登录</Button>
</form>
```

### 2.4 处理提交

`handleSubmit` 接收一个回调函数，只有当校验通过时才会执行。

```typescript
const onSubmit = (data: LoginFormData) => {
  // data 是经过校验的强类型数据
  console.log(data); 
  // 调用 API
  login(data);
};
```

## 3. 进阶用法

### 3.1 异步校验

Zod 支持异步校验规则，例如检查用户名是否已存在。

```typescript
const schema = z.object({
  username: z.string().refine(async (val) => {
    const isAvailable = await checkUsername(val);
    return isAvailable;
  }, '用户名已被占用'),
});
```

### 3.2 动态表单

使用 `useFieldArray` 处理数组类型的表单字段（如：添加多个联系人）。

```typescript
const { fields, append, remove } = useFieldArray({
  control,
  name: "contacts"
});
```

### 3.3 受控组件集成

对于无法直接使用 `register` 的第三方组件（如 Select, DatePicker），使用 `Controller` 组件进行包装。

```typescript
import { Controller } from "react-hook-form";

<Controller
  control={control}
  name="role"
  render={({ field }) => (
    <Select
      value={field.value}
      onValueChange={field.onChange}
    >
      {/* ... */}
    </Select>
  )}
/>
```
