import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/layout/sidebar';
import type { TabType } from '@/components/layout/sidebar';
import { useAuthStore } from '@/stores/auth';
import { Sparkles, Image as ImageIcon, Mic, Sun, Moon, Leaf, Heart, Users, Settings, Menu, X, UserPlus, Gamepad2, Video, Clapperboard, Grid3X3, LogOut, Maximize, Minimize } from 'lucide-react';
import { ChatView } from '@/features/ai/components/chat-view';
import { UserChatView } from '@/features/chat/components/user-chat-view';
import { SettingsView } from '@/features/settings/components/settings-view';
import { ImageGenView } from '@/features/image-gen/components/image-gen-view';
import { PlaneShooterGame } from '@/features/game/components/plane-shooter-game';
import { GomokuGame } from '@/features/game/components/gomoku/gomoku-game';
import { VideoPlannerPage } from '@/features/video-task/components/video-planner-page';
import { WatchPartyPage } from '@/features/watch-party/components/watch-party-page';
import { useThemeStore } from '@/stores/theme';
import { useSocketStore } from '@/stores/socket';
import { useUserChatStore } from '@/stores/user-chat';
import { fetchUsers, type ChatMessage, type ChatConversation } from '@/features/chat/api/chat';
import { toast } from 'sonner';

const ACTIVE_TAB_KEY = 'dashboard-active-tab';

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const saved = localStorage.getItem(ACTIVE_TAB_KEY) as TabType | null;
    return saved || 'chat';
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const doc = document as unknown as {
        fullscreenElement: Element | null;
        webkitFullscreenElement?: Element | null;
        mozFullScreenElement?: Element | null;
        msFullscreenElement?: Element | null;
      };
      
      const isFull = !!(
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      );
      setIsFullscreen(isFull);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      const doc = document as unknown as {
        fullscreenElement: Element | null;
        webkitFullscreenElement?: Element | null;
        mozFullScreenElement?: Element | null;
        msFullscreenElement?: Element | null;
        exitFullscreen: () => Promise<void>;
        webkitExitFullscreen?: () => Promise<void>;
        mozCancelFullScreen?: () => Promise<void>;
        msExitFullscreen?: () => Promise<void>;
      };

      const isFull = !!(
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      );

      if (!isFull) {
        const element = document.documentElement as unknown as {
          requestFullscreen: () => Promise<void>;
          webkitRequestFullscreen?: () => Promise<void>;
          mozRequestFullScreen?: () => Promise<void>;
          msRequestFullscreen?: () => Promise<void>;
        };

        if (element.requestFullscreen) {
          await element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) {
          await element.webkitRequestFullscreen();
        } else if (element.mozRequestFullScreen) {
          await element.mozRequestFullScreen();
        } else if (element.msRequestFullscreen) {
          await element.msRequestFullscreen();
        }
      } else {
        if (doc.exitFullscreen) {
          await doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        } else if (doc.mozCancelFullScreen) {
          await doc.mozCancelFullScreen();
        } else if (doc.msExitFullscreen) {
          await doc.msExitFullscreen();
        }
      }
    } catch (err) {
      console.error('Fullscreen toggle failed:', err);
    }
  };

  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  // Socket & Chat Store
  const socketStatus = useSocketStore((state) => state.status);
  const socketLastEvent = useSocketStore((state) => state.lastEvent);
  const connectSocket = useSocketStore((state) => state.connect);
  const disconnectSocket = useSocketStore((state) => state.disconnect);
  const socket = useSocketStore((state) => state.socket);
  const setUsers = useUserChatStore((state) => state.setUsers);
  const users = useUserChatStore((state) => state.users);
  const activeConversationId = useUserChatStore((state) => state.activeConversationId);
  const setActiveConversationId = useUserChatStore((state) => state.setActiveConversationId);

  const themeOptions = [
    { id: 'light', label: '亮色', icon: Sun },
    { id: 'dark', label: '暗色', icon: Moon },
    { id: 'green', label: '护眼', icon: Leaf },
    { id: 'purple', label: '浪漫', icon: Heart },
  ] as const;

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Connect Socket & Fetch Users
  useEffect(() => {
    if (token) {
      connectSocket(token);
      fetchUsers().then(setUsers).catch(console.error);
    }
    return () => {
      disconnectSocket();
    };
  }, [token, connectSocket, disconnectSocket, setUsers]);

  // Global Notification Listener
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (payload: { conversationId: string; message: ChatMessage; conversation: ChatConversation }) => {
      // Don't notify for own messages
      if (String(payload.message.senderId) === String(user?.userId)) return;

      const isUserChatActive = activeTab === 'user';
      const isViewingConversation = isUserChatActive && activeConversationId === payload.conversationId;

      if (!isViewingConversation) {
        const senderId = payload.message.senderId;
        const sender = users.find((u) => u.id === senderId);
        const senderName = sender?.username || `用户 ${senderId}`;
        const avatarChar = (senderName[0] || '?').toUpperCase();

        toast.custom((t) => (
          <div className="flex w-full md:w-96 items-start gap-4 rounded-2xl bg-white/95 dark:bg-zinc-900/95 p-5 shadow-xl border border-border backdrop-blur-md animate-in slide-in-from-right-full duration-300">
            <div className="shrink-0 pt-0.5">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-base shadow-sm">
                {avatarChar}
              </div>
            </div>
            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => {
               setActiveTab('user');
               setActiveConversationId(payload.conversationId);
               toast.dismiss(t);
            }}>
              <div className="flex items-center justify-between">
                <p className="text-base font-semibold text-foreground">
                  {senderName}
                </p>
                <span className="text-xs text-muted-foreground">刚刚</span>
              </div>
              <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {payload.message.content}
              </p>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                toast.dismiss(t);
              }} 
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors -mr-2 -mt-2 p-2 rounded-full hover:bg-muted/50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        ), { duration: 5000, position: 'top-right' });
      }
    };

    const handleFriendRequest = (request: { requesterId: number }) => {
      const sender = users.find((u) => u.id === request.requesterId);
      const senderName = sender?.username || `用户 ${request.requesterId}`;

      toast.custom((t) => (
        <div className="flex w-full md:w-96 items-start gap-4 rounded-2xl bg-white/95 dark:bg-zinc-900/95 p-5 shadow-xl border border-border backdrop-blur-md animate-in slide-in-from-right-full duration-300">
          <div className="shrink-0 pt-0.5">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-base shadow-sm">
              <UserPlus className="w-6 h-6" />
            </div>
          </div>
          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => {
             setActiveTab('user');
             toast.dismiss(t);
          }}>
            <div className="flex items-center justify-between">
              <p className="text-base font-semibold text-foreground">
                好友请求
              </p>
              <span className="text-xs text-muted-foreground">刚刚</span>
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              <span className="font-medium text-foreground">{senderName}</span> 请求添加您为好友
            </p>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              toast.dismiss(t);
            }} 
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors -mr-2 -mt-2 p-2 rounded-full hover:bg-muted/50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      ), { duration: 8000, position: 'top-right' });
    };

    socket.on('chat:message', handleMessage);
    socket.on('friend:request', handleFriendRequest);
    return () => {
      socket.off('chat:message', handleMessage);
      socket.off('friend:request', handleFriendRequest);
    };
  }, [socket, activeTab, activeConversationId, users, user?.userId, setActiveConversationId]);

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
      case 'video-task':
        return <VideoPlannerPage />;
      case 'watch-party':
        return <WatchPartyPage />;
      case 'settings':
        return <SettingsView />;
      case 'game':
        return <PlaneShooterGame />;
      case 'gomoku':
        return <GomokuGame />;
      case 'image':
        return <ImageGenView />;
      case 'voice':
        return (
          <div className="flex-1 p-4 md:p-8 pb-[calc(1rem+env(safe-area-inset-bottom))] md:pb-8 theme-muted overflow-y-auto scrollbar-hidden">
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
    <div className="flex h-[100dvh] overflow-hidden bg-background font-sans theme-page">
      <div className="hidden md:block">
        <Sidebar 
          isOpen={isSidebarOpen} 
          toggleSidebar={toggleSidebar} 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
        />
      </div>
      
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300 relative">
        <header className="hidden md:flex h-16 theme-surface border-b items-center justify-between px-8 shadow-sm z-10">
          <h1 className="text-lg font-semibold theme-text">
            {activeTab === 'chat' && '对话'}
            {activeTab === 'user' && '用户对话'}
            {activeTab === 'video-task' && '视频企划'}
            {activeTab === 'watch-party' && '浪漫放映室'}
            {activeTab === 'image' && '绘图'}
            {activeTab === 'voice' && '语音'}
            {activeTab === 'settings' && '设置'}
            {activeTab === 'game' && '星际战机'}
            {activeTab === 'gomoku' && '五子棋'}
          </h1>
          <div className="flex items-center space-x-4">
            <div className="hidden lg:flex items-center gap-3 rounded-full border theme-border bg-background/70 px-3 py-1 text-xs text-muted-foreground">
              <span 
                className={`h-2.5 w-2.5 rounded-full ${socketBadge()} animate-pulse scale-110`} 
                style={{
                  animationDuration: '1s'
                }}
              />
              <span>WS: {socketStatus}</span>
              <span>{socketLastEvent ? `事件: ${socketLastEvent}` : '等待事件'}</span>
              <span className="font-mono">{currentTime.toLocaleTimeString()}</span>
            </div>
            <div className="hidden md:flex items-center gap-2 rounded-full border theme-border bg-background/60 px-2 py-1 backdrop-blur">
              <button
                onClick={toggleFullscreen}
                className="flex items-center gap-1 rounded-full px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition"
                title={isFullscreen ? '退出全屏' : '全屏'}
              >
                {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
                <span className="sr-only">全屏</span>
              </button>
              <div className="w-[1px] h-4 bg-border mx-1" />
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

        {/* Mobile Fullscreen Button */}
        <button
          onClick={toggleFullscreen}
          className="md:hidden fixed top-3 right-16 z-50 p-2 rounded-full bg-background/80 backdrop-blur border theme-border shadow-sm text-foreground hover:bg-muted"
        >
          {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
        </button>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="md:hidden fixed top-3 right-4 z-50 p-2 rounded-full bg-background/80 backdrop-blur border theme-border shadow-sm text-foreground hover:bg-muted"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile Menu Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-[100] flex justify-end">
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" 
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="relative w-64 h-full bg-background border-l theme-border shadow-xl p-6 flex flex-col animate-in slide-in-from-right duration-300">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-lg font-bold theme-text">菜单</h2>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 -mr-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-2 flex-1">
                {[
                  { id: 'chat', label: '对话', icon: Sparkles },
                  { id: 'user', label: '用户', icon: Users },
                  { id: 'video-task', label: '视频企划', icon: Video },
                  { id: 'watch-party', label: '放映室', icon: Clapperboard },
                  { id: 'image', label: '绘图', icon: ImageIcon },
                  { id: 'voice', label: '语音', icon: Mic },
                  { id: 'game', label: '星际战机', icon: Gamepad2 },
                  { id: 'gomoku', label: '五子棋', icon: Grid3X3 },
                  { id: 'settings', label: '设置', icon: Settings },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id as TabType);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                        isActive
                          ? 'bg-primary text-primary-foreground font-medium'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="border-t theme-border pt-6 mt-6">
                <div className="flex items-center gap-3 px-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 p-[2px]">
                    <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                      <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-600">
                        {(user?.username || 'G')[0].toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium theme-text truncate">{user?.username || 'Guest'}</p>
                  <p className="text-xs theme-subtle truncate">{user?.email || 'guest@example.com'}</p>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-2 mt-4 text-red-500 hover:bg-red-500/10 rounded-lg py-2 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">退出登录</span>
              </button>
            </div>
          </div>
        </div>
      )}
      </main>
    </div>
  );
}
