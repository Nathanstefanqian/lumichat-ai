import { useThemeStore } from '@/stores/theme';
import { useAuthStore } from '@/stores/auth';
import { Sun, Moon, Leaf, Heart, Monitor, Settings as SettingsIcon, User, Save, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AvatarUpload } from './avatar-upload';
import { useState } from 'react';
import { updateProfile } from '@/features/auth/api/update-profile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function SettingsView() {
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);
  const { user, setUser } = useAuthStore();
  
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const updatedUser = await updateProfile(formData);
      setUser(updatedUser);
      setMessage({ type: 'success', text: '个人信息更新成功' });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: (error as Error).message || '更新失败，请重试' 
      });
    } finally {
      setLoading(false);
    }
  };

  const themeOptions = [
    { id: 'light', label: '亮色', icon: Sun, description: '清晰明亮的经典界面' },
    { id: 'dark', label: '暗色', icon: Moon, description: '适合夜间使用的深色界面' },
    { id: 'green', label: '护眼', icon: Leaf, description: '柔和舒适的绿色调' },
    { id: 'purple', label: '浪漫', icon: Heart, description: '富有情调的紫色调' },
  ] as const;

  return (
    <div className="flex-1 p-4 md:p-8 pb-[calc(1rem+env(safe-area-inset-bottom))] md:pb-8 overflow-y-auto scrollbar-hidden bg-background/50">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center space-x-4 mb-8">
          <div className="p-3 bg-primary/10 rounded-2xl">
            <SettingsIcon className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">设置</h2>
            <p className="text-muted-foreground">自定义您的应用体验</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
            <div className="flex items-center space-x-3 mb-6">
              <User className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">个人资料</h3>
            </div>
            
            <div className="flex items-center gap-6">
              <AvatarUpload />
              <div className="flex-1 space-y-1">
                <h4 className="font-medium">头像设置</h4>
                <p className="text-sm text-muted-foreground">点击头像上传新图片，支持缩放裁剪</p>
              </div>
            </div>

            <div className="border-t border-border my-6" />

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="username">用户名</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="请输入用户名"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">邮箱</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="请输入邮箱"
                  />
                </div>
              </div>

              {message && (
                <div className={cn(
                  "p-3 rounded-md text-sm",
                  message.type === 'success' ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                )}>
                  {message.text}
                </div>
              )}

              <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <Save className="w-4 h-4 mr-2" />
                  保存修改
                </Button>
              </div>
            </form>
          </div>

          <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
            <div className="flex items-center space-x-3 mb-6">
              <Monitor className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">主题外观</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {themeOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setTheme(option.id)}
                  className={cn(
                    "relative flex items-start p-4 rounded-xl border-2 transition-all duration-200 text-left group",
                    theme === option.id 
                      ? "border-primary bg-primary/5 shadow-sm" 
                      : "border-transparent bg-muted/50 hover:bg-muted hover:border-muted-foreground/20"
                  )}
                >
                  <div className={cn(
                    "p-2.5 rounded-full mr-4 transition-colors",
                    theme === option.id 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-background text-muted-foreground group-hover:text-foreground"
                  )}>
                    <option.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn(
                        "font-medium",
                        theme === option.id ? "text-primary" : "text-foreground"
                      )}>
                        {option.label}
                      </span>
                      {theme === option.id && (
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {option.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* More settings sections can be added here */}
          <div className="bg-card rounded-2xl p-6 shadow-sm border border-border opacity-50 cursor-not-allowed">
            <h3 className="text-lg font-semibold mb-4 text-muted-foreground">通用设置 (开发中)</h3>
            <div className="space-y-4">
               <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                 <span className="text-sm text-muted-foreground">系统通知</span>
                 <div className="w-10 h-6 bg-muted rounded-full relative">
                   <div className="w-4 h-4 bg-background rounded-full absolute left-1 top-1 shadow-sm" />
                 </div>
               </div>
               <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                 <span className="text-sm text-muted-foreground">自动更新</span>
                 <div className="w-10 h-6 bg-muted rounded-full relative">
                   <div className="w-4 h-4 bg-background rounded-full absolute left-1 top-1 shadow-sm" />
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
