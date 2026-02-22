import {
  MessageSquare,
  Image as ImageIcon,
  Mic,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sparkles,
  Users,
  Settings,
  Gamepad2,
  Video,
  Clapperboard,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth';
import { useNavigate } from 'react-router-dom';

export type TabType = 'chat' | 'image' | 'voice' | 'user' | 'settings' | 'game' | 'video-task' | 'watch-party';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function Sidebar({ isOpen, toggleSidebar, activeTab, onTabChange }: SidebarProps) {
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { id: 'chat', icon: MessageSquare, label: 'AI 对话', color: 'text-blue-500' },
    { id: 'user', icon: Users, label: '用户对话', color: 'text-indigo-500' },
    { id: 'video-task', icon: Video, label: '视频企划', color: 'text-rose-500' },
    { id: 'watch-party', icon: Clapperboard, label: '浪漫放映室', color: 'text-pink-500' },
    { id: 'image', icon: ImageIcon, label: 'AI 图片/视频', color: 'text-purple-500' },
    { id: 'voice', icon: Mic, label: 'AI 语音', color: 'text-green-500' },
    { id: 'game', icon: Gamepad2, label: '星际战机', color: 'text-orange-500' },
    { id: 'settings', icon: Settings, label: '设置', color: 'text-gray-500' },
  ] as const;

  return (
    <div 
      className={cn(
        "relative flex flex-col h-screen bg-card border-r border-border shadow-sm transition-all duration-300 ease-in-out",
        isOpen ? "w-64" : "w-20"
      )}
    >
      {/* Header / Logo */}
      <div className={cn("flex items-center h-20 border-b border-border overflow-hidden", isOpen ? "px-6" : "justify-center")}>
        <div className="flex items-center space-x-3 min-w-max">
          <div className="p-2.5 bg-gradient-to-br from-pink-400 to-purple-500 rounded-xl shadow-md shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span className={cn(
            "text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent transition-all duration-300 origin-left",
            isOpen ? "opacity-100 scale-100 w-auto" : "opacity-0 scale-0 w-0"
          )}>
            LumiChat
          </span>
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-24 bg-card border border-border rounded-full p-1.5 shadow-md hover:bg-accent transition-colors z-10"
      >
        {isOpen ? (
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {/* Navigation */}
      <div className="flex-1 py-6 px-3 space-y-2 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "w-full flex items-center p-3 rounded-2xl transition-all duration-200 group relative",
                isActive 
                  ? "bg-accent shadow-sm" 
                  : "hover:bg-accent/50",
                !isOpen && "justify-center"
              )}
              title={!isOpen ? item.label : undefined}
            >
              {isActive && (
                <div className={cn(
                  "absolute bg-gradient-to-b from-pink-400 to-purple-500 rounded-full transition-all duration-300",
                  isOpen ? "left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full" : "inset-0 opacity-10 rounded-2xl bg-current"
                )} />
              )}
              
              <item.icon 
                className={cn(
                  "w-6 h-6 shrink-0 transition-colors duration-200",
                  isActive ? item.color : "text-muted-foreground group-hover:text-foreground"
                )} 
              />
              
              <span 
                className={cn(
                  "ml-3 font-medium transition-all duration-300 whitespace-nowrap overflow-hidden",
                  isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground",
                  isOpen ? "opacity-100 w-auto" : "opacity-0 w-0 ml-0"
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Footer / User */}
      <div className="p-4 border-t border-border overflow-hidden">
        {user && (
          <div className={cn("flex items-center gap-3 mb-4", !isOpen && "justify-center")}>
            <div className="w-10 h-10 min-w-[2.5rem] rounded-full bg-muted flex items-center justify-center overflow-hidden border border-border shrink-0">
              {user.avatar ? (
                <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
              ) : (
                <span className="font-bold text-muted-foreground">{user.username?.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className={cn(
              "flex-1 overflow-hidden transition-all duration-300",
              isOpen ? "opacity-100 w-auto" : "opacity-0 w-0"
            )}>
              <p className="font-medium truncate text-sm">{user.username}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className={cn(
            "w-full flex items-center p-3 rounded-2xl hover:bg-red-50 transition-colors group whitespace-nowrap",
            !isOpen && "justify-center"
          )}
          title={!isOpen ? "退出登录" : undefined}
        >
          <LogOut className="w-5 h-5 shrink-0 text-muted-foreground group-hover:text-red-500 transition-colors" />
          <span className={cn(
            "ml-3 text-muted-foreground group-hover:text-red-500 font-medium transition-all duration-300 overflow-hidden",
            isOpen ? "opacity-100 w-auto" : "opacity-0 w-0 ml-0"
          )}>
            退出登录
          </span>
        </button>
      </div>
    </div>
  );
}
