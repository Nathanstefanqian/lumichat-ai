import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRegister } from '../api/register';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

const registerSchema = z.object({
  username: z.string()
    .min(2, '用户名至少需要2个字符')
    .max(20, '用户名最多20个字符')
    .regex(/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/, '用户名只能包含字母、数字、下划线和中文'),
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string()
    .min(6, '密码至少需要6个字符')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, '密码必须包含大小写字母和数字'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "两次输入的密码不一致",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const { mutate: register, isPending, error } = useRegister();
  
  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = (data: RegisterFormData) => {
    // Remove confirmPassword before sending to API
    const { confirmPassword: _confirmPassword, ...registerData } = data;
    void _confirmPassword;
    register(registerData);
  };

  return (
    <div className="grid gap-6">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="username" className="text-gray-600 pl-2">用户名</Label>
            <Input
              id="username"
              placeholder="fungleo"
              type="text"
              autoCapitalize="none"
              autoCorrect="off"
              disabled={isPending}
              className="rounded-full border-gray-200 bg-gray-50/50 focus:border-pink-300 focus:ring-4 focus:ring-pink-100 transition-all duration-300 h-12 px-6"
              {...registerField('username')}
            />
            {errors.username && (
              <p className="text-sm text-red-500 pl-2">{errors.username.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email" className="text-gray-600 pl-2">邮箱</Label>
            <Input
              id="email"
              placeholder="name@example.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isPending}
              className="rounded-full border-gray-200 bg-gray-50/50 focus:border-pink-300 focus:ring-4 focus:ring-pink-100 transition-all duration-300 h-12 px-6"
              {...registerField('email')}
            />
            {errors.email && (
              <p className="text-sm text-red-500 pl-2">{errors.email.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password" className="text-gray-600 pl-2">密码</Label>
            <Input
              id="password"
              type="password"
              placeholder="******"
              autoComplete="new-password"
              disabled={isPending}
              className="rounded-full border-gray-200 bg-gray-50/50 focus:border-pink-300 focus:ring-4 focus:ring-pink-100 transition-all duration-300 h-12 px-6"
              {...registerField('password')}
            />
            {errors.password && (
              <p className="text-sm text-red-500 pl-2">{errors.password.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="confirmPassword" className="text-gray-600 pl-2">确认密码</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="******"
              autoComplete="new-password"
              disabled={isPending}
              className="rounded-full border-gray-200 bg-gray-50/50 focus:border-pink-300 focus:ring-4 focus:ring-pink-100 transition-all duration-300 h-12 px-6"
              {...registerField('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-500 pl-2">{errors.confirmPassword.message}</p>
            )}
          </div>
          
          {error && (
            <div className="text-sm text-red-500 text-center bg-red-50 p-2 rounded-lg">
              {(error as Error).message}
            </div>
          )}

          <Button 
            disabled={isPending} 
            className="w-full rounded-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 shadow-lg shadow-pink-200/50 text-white font-medium h-12 transition-all duration-300 transform hover:-translate-y-0.5 mt-2"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            立即注册
          </Button>
        </div>
      </form>
    </div>
  );
}
