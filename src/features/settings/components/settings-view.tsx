import { useThemeStore } from '@/stores/theme';
import { Sun, Moon, Leaf, Heart, Monitor, Settings as SettingsIcon, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SettingsView() {
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);

  const themeOptions = [
    { id: 'light', label: '亮色', icon: Sun, description: '清晰明亮的经典界面' },
    { id: 'dark', label: '暗色', icon: Moon, description: '适合夜间使用的深色界面' },
    { id: 'green', label: '护眼', icon: Leaf, description: '柔和舒适的绿色调' },
    { id: 'purple', label: '浪漫', icon: Heart, description: '富有情调的紫色调' },
  ] as const;

  return (
    <div className="flex-1 p-4 md:p-8 h-screen overflow-y-auto bg-background/50">
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

          <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
            <div className="flex items-center space-x-3 mb-6">
              <Trash2 className="w-5 h-5 text-destructive" />
              <h3 className="text-lg font-semibold text-destructive">危险区域</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              如果遇到数据异常或界面显示错误，可以尝试清除本地缓存。这将删除所有未同步到服务器的本地数据。
            </p>
            <button
              onClick={() => {
                if (confirm('确定要清除所有本地缓存吗？这将删除所有未同步的对话记录，并重新加载页面。')) {
                  localStorage.removeItem('chat-storage');
                  window.location.reload();
                }
              }}
              className="w-full p-4 bg-destructive/10 text-destructive rounded-xl hover:bg-destructive/20 transition-colors flex items-center justify-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>清除本地缓存并刷新</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
