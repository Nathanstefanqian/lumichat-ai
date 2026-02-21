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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth';
import { useNavigate } from 'react-router-dom';

export type TabType = 'chat' | 'image' | 'voice' | 'user' | 'settings';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function Sidebar({ isOpen, toggleSidebar, activeTab, onTabChange }: SidebarProps) {
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { id: 'chat', icon: MessageSquare, label: 'AI 对话', color: 'text-blue-500' },
    { id: 'user', icon: Users, label: '用户对话', color: 'text-indigo-500' },
    { id: 'image', icon: ImageIcon, label: 'AI 图片/视频', color: 'text-purple-500' },
    { id: 'voice', icon: Mic, label: 'AI 语音', color: 'text-green-500' },
    { id: 'settings', icon: Settings, label: '设置', color: 'text-gray-500' },
  ] as const;

  return (
    <div 
      className={cn(
        "relative flex flex-col h-screen bg-card border-r border-border shadow-sm transition-all duration-300 ease-in-out",
        isOpen ? "w-64" : "w-14"
      )}
    >
      {/* Header / Logo */}
      <div className="flex items-center justify-center h-20 border-b border-border">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-gradient-to-br from-pink-400 to-purple-500 rounded-xl shadow-md">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          {isOpen && (
            <span className="text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent transition-opacity duration-300">
              LumiChat
            </span>
          )}
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-24 bg-card border border-border rounded-full p-1 shadow-md hover:bg-accent transition-colors z-10"
      >
        {isOpen ? (
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {/* Navigation */}
      <div className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              "w-full flex items-center p-3 rounded-2xl transition-all duration-200 group relative overflow-hidden",
              activeTab === item.id 
                ? "bg-accent shadow-sm" 
                : "hover:bg-accent/50"
            )}
          >
            {activeTab === item.id && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-pink-400 to-purple-500 rounded-r-full" />
            )}
            
            <item.icon 
              className={cn(
                "w-6 h-6 transition-colors duration-200",
                activeTab === item.id ? item.color : "text-muted-foreground group-hover:text-foreground",
                !isOpen && "mx-auto"
              )} 
            />
            
            {isOpen && (
              <span 
                className={cn(
                  "ml-3 font-medium transition-colors duration-200",
                  activeTab === item.id ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                )}
              >
                {item.label}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Footer / User */}
      <div className="p-4 border-t border-border">
        <button
          onClick={handleLogout}
          className={cn(
            "w-full flex items-center p-3 rounded-2xl hover:bg-red-50 transition-colors group",
            !isOpen && "justify-center"
          )}
        >
          <LogOut className="w-5 h-5 text-muted-foreground group-hover:text-red-500 transition-colors" />
          {isOpen && (
            <span className="ml-3 text-muted-foreground group-hover:text-red-500 font-medium transition-colors">
              退出登录
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
