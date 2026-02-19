import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import type { TabType } from '@/components/layout/sidebar';
import { useAuthStore } from '@/stores/auth';
import { Sparkles, Image as ImageIcon, Mic, Sun, Moon, Leaf, Heart } from 'lucide-react';
import { ChatView } from '@/features/ai/components/chat-view';
import { UserChatView } from '@/features/chat/components/user-chat-view';
import { useThemeStore } from '@/stores/theme';
import { useSocketStore } from '@/stores/socket';

const ACTIVE_TAB_KEY = 'dashboard-active-tab';

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const saved = localStorage.getItem(ACTIVE_TAB_KEY) as TabType | null;
    return saved || 'chat';
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const user = useAuthStore((state) => state.user);
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);
  const socketStatus = useSocketStore((state) => state.status);
  const socketLastEvent = useSocketStore((state) => state.lastEvent);
  const socketLastUpdatedAt = useSocketStore((state) => state.lastUpdatedAt);

  const themeOptions = [
    { id: 'light', label: '亮色', icon: Sun },
    { id: 'dark', label: '暗色', icon: Moon },
    { id: 'green', label: '护眼', icon: Leaf },
    { id: 'purple', label: '浪漫', icon: Heart },
  ] as const;

  const socketBadge = () => {
    switch (socketStatus) {
      case 'connected':
        return 'bg-emerald-500';
      case 'connecting':
        return 'bg-amber-500';
      case 'error':
        return 'bg-rose-500';
      default:
        return 'bg-slate-400';
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    localStorage.setItem(ACTIVE_TAB_KEY, activeTab);
  }, [activeTab]);

  const renderContent = () => {
    switch (activeTab) {
      case 'chat':
        return <ChatView />;
      case 'image':
        return (
          <div className="flex-1 p-8 theme-muted h-screen overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="flex items-center space-x-4">
                <div className="p-3 theme-accent rounded-2xl shadow-sm">
                  <ImageIcon className="w-8 h-8 text-foreground" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold theme-text">AI 创意工坊</h2>
                  <p className="theme-subtle">将您的想象转化为令人惊叹的视觉艺术</p>
                </div>
              </div>

              {/* Image Gen Interface Placeholder */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="theme-surface rounded-3xl shadow-sm border h-64 flex items-center justify-center">
                   <div className="text-center space-y-2">
                     <ImageIcon className="w-8 h-8 mx-auto text-muted-foreground" />
                     <p className="theme-subtle text-sm">上传参考图</p>
                   </div>
                </div>
                <div className="theme-surface rounded-3xl shadow-sm border h-64 flex items-center justify-center theme-muted">
                   <div className="text-center space-y-2">
                     <Sparkles className="w-8 h-8 mx-auto text-foreground animate-pulse" />
                     <p className="font-medium theme-text">生成结果展示区</p>
                   </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'voice':
        return (
          <div className="flex-1 p-8 theme-muted h-screen overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="flex items-center space-x-4">
                <div className="p-3 theme-accent rounded-2xl shadow-sm">
                  <Mic className="w-8 h-8 text-foreground" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold theme-text">AI 语音合成</h2>
                  <p className="theme-subtle">生成逼真、富有情感的语音内容</p>
                </div>
              </div>

              {/* Voice Interface Placeholder */}
              <div className="theme-surface rounded-3xl shadow-sm border p-8 space-y-6">
                <div className="h-24 theme-muted rounded-2xl border-2 border-dashed theme-border flex items-center justify-center cursor-pointer hover:opacity-80 transition-colors">
                  <div className="flex items-center space-x-2 theme-subtle">
                    <Mic className="w-5 h-5" />
                    <span>点击录制或上传音频文件</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'user':
        return <UserChatView />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background font-sans theme-page">
      <Sidebar 
        isOpen={isSidebarOpen} 
        toggleSidebar={toggleSidebar} 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />
      
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300">
        <header className="h-16 theme-surface border-b flex items-center justify-between px-8 shadow-sm z-10">
          <h1 className="text-lg font-semibold theme-text">
            {activeTab === 'chat' && '对话'}
            {activeTab === 'user' && '用户对话'}
            {activeTab === 'image' && '绘图'}
            {activeTab === 'voice' && '语音'}
          </h1>
          <div className="flex items-center space-x-4">
            <div className="hidden lg:flex items-center gap-3 rounded-full border theme-border bg-background/70 px-3 py-1 text-xs text-muted-foreground">
              <span className={`h-2.5 w-2.5 rounded-full ${socketBadge()}`} />
              <span>WS: {socketStatus}</span>
              <span>{socketLastEvent ? `事件: ${socketLastEvent}` : '等待事件'}</span>
              {socketLastUpdatedAt && (
                <span>{new Date(socketLastUpdatedAt).toLocaleTimeString()}</span>
              )}
            </div>
            <div className="hidden md:flex items-center gap-2 rounded-full border theme-border bg-background/60 px-2 py-1 backdrop-blur">
              {themeOptions.map((option) => {
                const Icon = option.icon;
                const active = theme === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => setTheme(option.id)}
                    className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs transition ${
                      active
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {option.label}
                  </button>
                );
              })}
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium theme-text">{user?.username || 'Guest'}</p>
              <p className="text-xs theme-subtle">{user?.email || 'guest@example.com'}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 p-[2px]">
              <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-600">
                  {(user?.username || 'G')[0].toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </header>

        {renderContent()}
      </main>
    </div>
  );
}
