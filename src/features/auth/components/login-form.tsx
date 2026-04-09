import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useLogin } from '../api/login';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, MessageCircle, UserCircle } from 'lucide-react';

const loginSchema = z.object({
  username: z.string().min(1, '请输入用户名'),
  password: z.string(),
}).superRefine((data, ctx) => {
  if (data.username === 'codegod' || data.username === 'momo') {
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
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormData) => {
    login(data);
  };

  const loginAsTestUser = () => {
    setValue('username', 'momo');
    setValue('password', 'Password123!');
    login({ username: 'momo', password: 'Password123!' });
  };

  return (
    <div className="grid gap-6">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="username" className="text-foreground/70 pl-2">用户名</Label>
            <Input
              id="username"
              placeholder="请输入用户名"
              type="text"
              autoCapitalize="none"
              autoComplete="username"
              autoCorrect="off"
              disabled={isPending}
              className="rounded-full border-primary/20 bg-background/50 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-300 h-12 px-6"
              {...register('username')}
            />
            {errors.username && (
              <p className="text-sm text-rose-500 pl-2">{errors.username.message}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password" className="text-foreground/70 pl-2">密码</Label>
            <Input
              id="password"
              type="password"
              placeholder="******"
              autoComplete="current-password"
              disabled={isPending}
              className="rounded-full border-primary/20 bg-background/50 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-300 h-12 px-6"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-sm text-rose-500 pl-2">{errors.password.message}</p>
            )}
          </div>
          
          {error && (
            <div className="text-sm text-rose-500 text-center bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
              {(error as Error).message}
            </div>
          )}

          <Button 
            disabled={isPending} 
            className="w-full rounded-full bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 text-white font-bold h-12 transition-all duration-300 transform hover:-translate-y-0.5 mt-2 border-none"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            立即登录
          </Button>
        </div>
      </form>

      <div className="relative my-2 flex flex-col gap-3">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border/50" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
            <span className="bg-card/90 backdrop-blur-md px-3 text-muted-foreground">或者使用</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={loginAsTestUser}
            disabled={isPending}
            className="rounded-full border-indigo-500/30 text-indigo-400 bg-indigo-500/5 hover:bg-indigo-500/10 hover:text-indigo-300 h-12 transition-all duration-300 border-dashed"
          >
            <UserCircle className="mr-2 h-4 w-4" />
            测试账号 momo
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={true}
            className="rounded-full border-border/50 text-muted-foreground bg-muted/30 h-12 cursor-not-allowed opacity-50"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            微信登录
          </Button>
        </div>
      </div>
    </div>
  );
}
