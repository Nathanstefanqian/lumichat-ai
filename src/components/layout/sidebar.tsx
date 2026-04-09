import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth';
import { useUserChatStore } from '@/stores/user-chat';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useMemo } from 'react';
import { getProfile } from '@/features/auth/api/get-profile';
import api from '@/lib/axios';

export type TabType = 'chat' | 'image' | 'voice' | 'user' | 'settings' | 'game-center' | 'video-task' | 'watch-party' | 'snow-world' | 'media-compressor' | 'new-year' | 'check-in' | 'hand-tracking' | 'graphics-pipeline' | 'fractal-geometry' | 'exam-prep' | 'interview-prep' | 'key-detector' | 'grading-history' | 'willpower-lab' | 'roundtable' | 'video-gen';

interface MenuItem {
  menuId: string;
  label: string;
  icon: string;
  group: string;
  color?: string;
}

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function Sidebar({ isOpen, toggleSidebar, activeTab, onTabChange }: SidebarProps) {
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const token = useAuthStore((state) => state.token);
  const unreadTotal = useUserChatStore((state) => state.unreadTotal);
  const navigate = useNavigate();
  const [dynamicMenus, setDynamicMenus] = useState<MenuItem[]>([]);

  // 侧边栏加载时自动获取一次用户信息以更新头像
  useEffect(() => {
    const fetchProfile = async () => {
      if (token && user) {
        try {
          const fullProfile = await getProfile(user.userId);
          setUser({
            ...user,
            ...fullProfile
          });
        } catch (error) {
          console.error('Failed to fetch profile in sidebar:', error);
        }
      }
    };
    fetchProfile();
  }, [token]);

  // 获取动态菜单
  useEffect(() => {
    const fetchMenus = async () => {
      try {
        // 如果已登录，获取个性化菜单；否则获取公共菜单
        const endpoint = token ? '/menus/my' : '/menus';
        const response = await api.get(endpoint);
        // api 实例已经处理了拦截器，直接返回的就是 data
        setDynamicMenus(Array.isArray(response) ? response : []);
      } catch (error) {
        console.error('Failed to fetch dynamic menus:', error);
        setDynamicMenus([]);
      }
    };
    fetchMenus();
  }, [token, user?.level]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuGroups = useMemo(() => {
    const groups: { title: string; items: any[] }[] = [];
    const groupMap = new Map<string, any[]>();

    // 严谨起见，判断一下 dynamicMenus 是否存在且是数组
    if (Array.isArray(dynamicMenus)) {
      dynamicMenus.forEach(menu => {
        if (!groupMap.has(menu.group)) {
          groupMap.set(menu.group, []);
        }
        const IconComponent = (Icons as any)[menu.icon] || Icons.HelpCircle;
        groupMap.get(menu.group)?.push({
          id: menu.menuId,
          label: menu.label,
          icon: IconComponent,
          color: menu.color
        });
      });
    }

    groupMap.forEach((items, title) => {
      groups.push({ title, items });
    });

    return groups;
  }, [dynamicMenus]);

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
          <div className="rounded-xl shadow-md shrink-0 overflow-hidden w-11 h-11 border border-border">
            <img src="/logo.jpg" alt="Lumi" className="w-full h-full object-cover" />
          </div>
          {isOpen && (
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-500 tracking-tight">
              Lumi
            </span>
          )}
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-24 bg-card border border-border rounded-full p-1.5 shadow-md hover:bg-accent transition-colors z-10"
      >
        {isOpen ? (
          <Icons.ChevronLeft className="w-4 h-4 text-muted-foreground" />
        ) : (
          <Icons.ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-6 scrollbar-hidden">
        {menuGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            {isOpen && (
              <h3 className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 mb-2">
                {group.title}
              </h3>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id as TabType)}
                    className={cn(
                      "group flex items-center w-full rounded-xl transition-all duration-200 relative",
                      isOpen ? "px-3 py-2.5" : "justify-center p-3 mx-auto",
                      isActive 
                        ? "bg-primary/10 text-primary shadow-sm" 
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      item.className
                    )}
                  >
                    <Icon className={cn(
                      "w-5 h-5 shrink-0 transition-transform duration-200",
                      isActive ? "scale-110" : "group-hover:scale-110",
                      isActive ? "text-primary" : item.color
                    )} />
                    
                    {isOpen && (
                      <span className={cn(
                        "ml-3 text-sm font-medium transition-all duration-200 truncate",
                        isActive ? "opacity-100" : "opacity-80 group-hover:opacity-100"
                      )}>
                        {item.label}
                      </span>
                    )}

                    {/* Unread badge for user chat */}
                    {item.id === 'user' && unreadTotal > 0 && (
                      <span className={cn(
                        "absolute flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 shadow-sm border border-card",
                        isOpen ? "right-3" : "top-2 right-2"
                      )}>
                        {unreadTotal > 99 ? '99+' : unreadTotal}
                      </span>
                    )}
                    
                    {/* Active Indicator */}
                    {isActive && (
                      <div className={cn(
                        "absolute bg-primary rounded-full transition-all duration-300",
                        isOpen ? "left-0 w-1 h-6 top-1/2 -translate-y-1/2" : "bottom-1 w-6 h-1 left-1/2 -translate-x-1/2"
                      )} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer / User */}
      <div className="p-4 border-t border-border overflow-hidden bg-muted/30">
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
              <p className="text-[10px] text-muted-foreground truncate uppercase tracking-tighter opacity-70">
                {user.role || 'USER'} · L{user.level || 0}
              </p>
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
          <Icons.LogOut className="w-5 h-5 shrink-0 text-muted-foreground group-hover:text-red-500 transition-colors" />
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
