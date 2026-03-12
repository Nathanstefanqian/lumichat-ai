import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useLogin } from '../api/login';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, MessageCircle } from 'lucide-react';

const loginSchema = z.object({
  username: z.string().min(1, '请输入用户名'),
  password: z.string(),
}).superRefine((data, ctx) => {
  if (data.username === 'codegod') {
    return;
  }
  
  if (data.password.length < 6) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: '密码至少需要6个字符',
      path: ['password'],
    });
  }
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { mutate: login, isPending, error } = useLogin();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormData) => {
    login(data);
  };

  return (
    <div className="grid gap-6">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="username" className="text-gray-600 pl-2">用户名</Label>
            <Input
              id="username"
              placeholder="请输入用户名"
              type="text"
              autoCapitalize="none"
              autoComplete="username"
              autoCorrect="off"
              disabled={isPending}
              className="rounded-full border-gray-200 bg-gray-50/50 focus:border-pink-300 focus:ring-4 focus:ring-pink-100 transition-all duration-300 h-12 px-6"
              {...register('username')}
            />
            {errors.username && (
              <p className="text-sm text-red-500 pl-2">{errors.username.message}</p>
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

      <div className="relative my-2">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-gray-500">或者使用</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        disabled={true}
        className="w-full rounded-full border-gray-200 text-gray-400 bg-gray-50 h-12 cursor-not-allowed"
      >
        <MessageCircle className="mr-2 h-4 w-4 text-gray-400" />
        微信扫码登录 (暂未开放)
      </Button>
    </div>
  );
}
