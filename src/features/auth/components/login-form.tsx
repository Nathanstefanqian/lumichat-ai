import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useLogin } from '../api/login';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码至少需要6个字符'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { mutate: login, isPending, error } = useLogin();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormData) => {
    login(data);
  };

  const handleQuickFill = (email: string) => {
    setValue('email', email);
    setValue('password', 'Qq119063507@');
  };

  return (
    <div className="grid gap-6">
      <div className="flex justify-center gap-4 text-xs">
        <button
          type="button"
          onClick={() => handleQuickFill('test@test.com')}
          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors"
        >
          测试账号 1
        </button>
        <button
          type="button"
          onClick={() => handleQuickFill('demo@example.com')}
          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors"
        >
          测试账号 2
        </button>
      </div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4">
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
              {...register('email')}
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
              autoComplete="current-password"
              disabled={isPending}
              className="rounded-full border-gray-200 bg-gray-50/50 focus:border-pink-300 focus:ring-4 focus:ring-pink-100 transition-all duration-300 h-12 px-6"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-sm text-red-500 pl-2">{errors.password.message}</p>
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
            登录
          </Button>
        </div>
      </form>
    </div>
  );
}
