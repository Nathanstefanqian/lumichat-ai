import { useState, useEffect, useRef } from 'react';
import { Music, Settings, Disc, Minimize2, Play, Pause, SkipForward, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { MusicParticleLoader } from '@/components/ui/particle-loader';

/* eslint-disable @typescript-eslint/no-explicit-any */
const getAPlayer = (element: any) => (element as any)?.aplayer;

export function MusicPlayer() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  // 默认网易云热歌榜
  const DEFAULT_PLAYLIST_ID = '3778678';
  const [playlistId, setPlaylistId] = useState(() => localStorage.getItem('music-playlist-id') || DEFAULT_PLAYLIST_ID);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempId, setTempId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const hasLoadedOnce = useRef(false);
  
  // 迷你控制器状态
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState<{ title: string; author: string; pic: string } | null>(null);
  const aplayerRef = useRef<any>(null);

  // Load external scripts
  useEffect(() => {
    const loadScript = (src: string) => {
      if (document.querySelector(`script[src="${src}"]`)) return Promise.resolve();
      return new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve();
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };

    const loadStyle = (href: string) => {
      if (document.querySelector(`link[href="${href}"]`)) return;
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    };

    loadStyle('https://cdn.jsdelivr.net/npm/aplayer/dist/APlayer.min.css');
    
    // Load APlayer first, then Meting
    loadScript('https://cdn.jsdelivr.net/npm/aplayer/dist/APlayer.min.js')
      .then(() => loadScript('https://cdn.jsdelivr.net/npm/meting@2/dist/Meting.min.js'))
      .then(() => {
        // 定期检查 APlayer 实例并绑定事件
        const checkTimer = setInterval(() => {
          const metingElement = document.querySelector('meting-js') as (HTMLElement & { aplayer?: unknown });
          const ap = getAPlayer(metingElement);
          if (ap) {
            aplayerRef.current = ap;
            
            // 绑定事件同步状态
            ap.on('play', () => setIsPlaying(true));
            ap.on('pause', () => setIsPlaying(false));
            ap.on('listswitch', () => {
              const song = ap.list.audios[ap.list.index];
              if (song) {
                setCurrentSong({
                  title: song.title,
                  author: song.author,
                  pic: song.pic
                });
              }
            });
            
            // 初始化当前歌曲信息
            const initialSong = ap.list.audios[ap.list.index];
            if (initialSong) {
              setCurrentSong({
                title: initialSong.title,
                author: initialSong.author,
                pic: initialSong.pic
              });
            }
            
            clearInterval(checkTimer);
          }
        }, 1000);
        return () => clearInterval(checkTimer);
      })
      .catch(err => console.error('Failed to load music player scripts:', err));
  }, []);

  // 控制函数
  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (aplayerRef.current) {
      aplayerRef.current.toggle();
    }
  };

  const nextSong = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (aplayerRef.current) {
      aplayerRef.current.list.next();
    }
  };

  // Handle loading state
  useEffect(() => {
    if (isOpen && !hasLoadedOnce.current) {
      const timer = setTimeout(() => {
        setIsLoading(true);
        hasLoadedOnce.current = true;
        setTimeout(() => setIsLoading(false), 2000);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setIsLoading(true);
        setTimeout(() => setIsLoading(false), 2000);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [playlistId, isOpen]);
  
  useEffect(() => {
    localStorage.setItem('music-playlist-id', playlistId);
  }, [playlistId]);

  // Inject custom styles for APlayer to match theme
  useEffect(() => {
    const styleId = 'aplayer-custom-style';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
      /* CD 旋转动画 */
      @keyframes spin-cd {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      .animate-spin-cd {
        animation: spin-cd 10s linear infinite;
      }
      .animate-spin-cd-paused {
        animation-play-state: paused;
      }
      
      /* Hide outer scrollbar but allow scrolling */
      .music-player-scroll-container::-webkit-scrollbar {
        display: none; /* Chrome, Safari, Opera */
      }
      .music-player-scroll-container {
        -ms-overflow-style: none;  /* IE and Edge */
        scrollbar-width: none;  /* Firefox */
      }
      
      /* Customize APlayer scrollbar - Make it thinner and subtle */
      .aplayer .aplayer-list ol::-webkit-scrollbar {
        width: 3px;
      }
      .aplayer .aplayer-list ol::-webkit-scrollbar-thumb {
        background-color: rgba(255, 255, 255, 0.2);
        border-radius: 3px;
      }
      .aplayer .aplayer-list ol::-webkit-scrollbar-track {
        background-color: transparent;
      }

      /* Dark mode / Theme adaptation */
      .dark .aplayer,
      .purple .aplayer,
      .night .aplayer,
      .aplayer {
        background: transparent !important;
        font-family: inherit;
        box-shadow: none !important;
      }
      
      /* Ensure text colors adapt to theme */
      .dark .aplayer,
      .purple .aplayer,
      .night .aplayer {
        color: hsl(var(--foreground));
      }
      
      /* Header/Info area */
      .dark .aplayer .aplayer-info,
      .purple .aplayer .aplayer-info,
      .night .aplayer .aplayer-info {
        border-bottom: 1px solid hsl(var(--border) / 0.1);
        background: transparent !important;
      }
      .dark .aplayer .aplayer-info .aplayer-music .aplayer-title,
      .purple .aplayer .aplayer-info .aplayer-music .aplayer-title,
      .night .aplayer .aplayer-info .aplayer-music .aplayer-title {
        color: hsl(var(--foreground));
      }
      .dark .aplayer .aplayer-info .aplayer-music .aplayer-author,
      .purple .aplayer .aplayer-info .aplayer-music .aplayer-author,
      .night .aplayer .aplayer-info .aplayer-music .aplayer-author {
        color: hsl(var(--muted-foreground));
      }
      .dark .aplayer .aplayer-info .aplayer-controller .aplayer-time,
      .purple .aplayer .aplayer-info .aplayer-controller .aplayer-time,
      .night .aplayer .aplayer-info .aplayer-controller .aplayer-time {
        color: hsl(var(--muted-foreground));
      }
      .dark .aplayer .aplayer-info .aplayer-controller .aplayer-icon,
      .purple .aplayer .aplayer-info .aplayer-controller .aplayer-icon,
      .night .aplayer .aplayer-info .aplayer-controller .aplayer-icon {
        color: hsl(var(--foreground));
      }
      .dark .aplayer .aplayer-info .aplayer-controller .aplayer-icon:hover,
      .purple .aplayer .aplayer-info .aplayer-controller .aplayer-icon:hover,
      .night .aplayer .aplayer-info .aplayer-controller .aplayer-icon:hover {
        color: hsl(var(--primary));
      }
      .dark .aplayer .aplayer-info .aplayer-controller .aplayer-icon.aplayer-icon-mode,
      .purple .aplayer .aplayer-info .aplayer-controller .aplayer-icon.aplayer-icon-mode,
      .night .aplayer .aplayer-info .aplayer-controller .aplayer-icon.aplayer-icon-mode {
        color: hsl(var(--muted-foreground));
      }
      .dark .aplayer .aplayer-info .aplayer-controller .aplayer-icon.aplayer-icon-mode:hover,
      .purple .aplayer .aplayer-info .aplayer-controller .aplayer-icon.aplayer-icon-mode:hover,
      .night .aplayer .aplayer-info .aplayer-controller .aplayer-icon.aplayer-icon-mode:hover {
        color: hsl(var(--primary));
      }

      /* List area */
      .dark .aplayer .aplayer-list,
      .purple .aplayer .aplayer-list,
      .night .aplayer .aplayer-list {
        background: transparent !important;
        border-color: transparent;
      }
      .dark .aplayer .aplayer-list ol li,
      .purple .aplayer .aplayer-list ol li,
      .night .aplayer .aplayer-list ol li {
        border-top: 1px solid hsl(var(--border) / 0.1);
      }
      .dark .aplayer .aplayer-list ol li:hover {
        background: rgba(255, 255, 255, 0.05) !important;
      }
      .purple .aplayer .aplayer-list ol li:hover {
        background: rgba(167, 139, 250, 0.1) !important;
      }
      .night .aplayer .aplayer-list ol li:hover {
        background: rgba(255, 255, 255, 0.05) !important;
      }
      
      /* Active song background - fix white bar issue */
      .dark .aplayer .aplayer-list ol li.aplayer-list-light {
        background: rgba(255, 255, 255, 0.1) !important;
      }
      .purple .aplayer .aplayer-list ol li.aplayer-list-light {
        background: rgba(167, 139, 250, 0.25) !important;
        border-left: 2px solid #a78bfa;
      }
      .night .aplayer .aplayer-list ol li.aplayer-list-light {
        background: rgba(255, 255, 255, 0.1) !important;
      }
      
      .dark .aplayer .aplayer-list ol li .aplayer-list-index,
      .dark .aplayer .aplayer-list ol li .aplayer-list-author,
      .purple .aplayer .aplayer-list ol li .aplayer-list-index,
      .purple .aplayer .aplayer-list ol li .aplayer-list-author,
      .night .aplayer .aplayer-list ol li .aplayer-list-index,
      .night .aplayer .aplayer-list ol li .aplayer-list-author {
        color: hsl(var(--muted-foreground));
      }
      .dark .aplayer .aplayer-list ol li .aplayer-list-title,
      .purple .aplayer .aplayer-list ol li .aplayer-list-title,
      .night .aplayer .aplayer-list ol li .aplayer-list-title {
        color: hsl(var(--foreground));
      }

      /* Lyrics area - Remove gradients to fix white bar */
      .aplayer .aplayer-lrc:before,
      .aplayer .aplayer-lrc:after {
          display: none !important;
      }
      .dark .aplayer .aplayer-lrc p,
      .purple .aplayer .aplayer-lrc p,
      .night .aplayer .aplayer-lrc p {
        color: hsl(var(--muted-foreground));
        opacity: 0.8;
      }
      .dark .aplayer .aplayer-lrc p.aplayer-lrc-current,
      .purple .aplayer .aplayer-lrc p.aplayer-lrc-current,
      .night .aplayer .aplayer-lrc p.aplayer-lrc-current {
        color: hsl(var(--primary));
        opacity: 1;
        font-weight: bold;
      }
      
      /* Miniswitcher */
      .dark .aplayer .aplayer-miniswitcher,
      .purple .aplayer .aplayer-miniswitcher,
      .night .aplayer .aplayer-miniswitcher {
        background: hsl(var(--muted) / 0.5) !important;
      }
      .dark .aplayer .aplayer-miniswitcher .aplayer-icon,
      .purple .aplayer .aplayer-miniswitcher .aplayer-icon,
      .night .aplayer .aplayer-miniswitcher .aplayer-icon {
        color: hsl(var(--foreground));
      }
    `;
    document.head.appendChild(style);
    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  const handleUpdatePlaylist = () => {
    if (tempId.trim()) {
      setIsLoading(true);
      setPlaylistId(tempId.trim());
      setIsSettingsOpen(false);
      setTempId('');
      // Force minimum 5s loading time for new playlist
      setTimeout(() => setIsLoading(false), 5000);
    }
  };

  const handleResetPlaylist = () => {
    setIsLoading(true);
    setPlaylistId(DEFAULT_PLAYLIST_ID);
    setIsSettingsOpen(false);
    setTempId('');
    setTimeout(() => setIsLoading(false), 5000);
  };

  const handlePreviewAnimation = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 5000);
  };

  return (
    <div className={cn(
      "fixed z-50 bottom-24 right-0 transition-all duration-500 ease-in-out flex items-center",
      isMinimized ? "translate-x-[calc(100%-32px)]" : "translate-x-0"
    )}>
      {/* 展开/收起按钮 (侧边箭头) */}
      <button
        onClick={() => setIsMinimized(!isMinimized)}
        className="flex items-center justify-center w-8 h-12 bg-background/80 backdrop-blur-md border border-r-0 border-border/50 rounded-l-xl hover:bg-background transition-all shadow-lg group/arrow"
      >
        {isMinimized ? (
          <ChevronLeft className="h-4 w-4 text-primary animate-pulse" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover/arrow:text-primary transition-colors" />
        )}
      </button>

      {/* 播放器内容区域 */}
      <div className="bg-background/80 backdrop-blur-md border border-l-0 border-border/50 p-1 pr-3 rounded-r-none rounded-l-none shadow-xl flex items-center gap-3">
        {/* 迷你控制器 (当播放器面板关闭时显示在侧边栏内) */}
        {!isOpen && (
          <div 
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 transition-all cursor-pointer group/mini overflow-hidden"
          >
            {/* 滚动的 CD 封面 */}
            <div className="relative flex-shrink-0 ml-1">
              <div className={cn(
                "h-10 w-10 rounded-full border border-primary/20 overflow-hidden flex items-center justify-center bg-muted shadow-inner",
                isPlaying ? "animate-spin-cd" : "animate-spin-cd animate-spin-cd-paused"
              )}>
                {currentSong?.pic ? (
                  <img src={currentSong.pic} alt="cover" className="h-full w-full object-cover" />
                ) : (
                  <Music className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              {/* CD 中心点 */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-background border border-primary/20 rounded-full z-10 shadow-sm" />
            </div>

            {/* 歌曲信息 (仅 PC 端显示) */}
            <div className="hidden lg:flex flex-col min-w-[100px] max-w-[140px]">
              <span className="text-[11px] font-bold truncate leading-tight text-foreground/90">{currentSong?.title || '未在播放'}</span>
              <span className="text-[10px] text-muted-foreground truncate leading-tight">{currentSong?.author || 'Lumi Music'}</span>
            </div>

            {/* 控制按钮 */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                onClick={togglePlay}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 translate-x-0.5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                onClick={nextSong}
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* 播放器面板 (点击迷你控制器后弹出) */}
        <div className={cn(
          "absolute bottom-full right-4 mb-4 bg-background/95 backdrop-blur-md border border-border rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 origin-bottom-right",
          isOpen ? "w-[90vw] h-[70vh] sm:w-[500px] md:w-[40vw] min-h-[400px] opacity-100 scale-100" : "w-0 h-0 opacity-0 scale-0 pointer-events-none"
        )}>
          {/* Loading Overlay */}
          {isLoading && <MusicParticleLoader />}

          {/* 标题栏 */}
          <div className="flex items-center justify-between p-3 bg-muted/50 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-primary/10 rounded-full">
                <Disc className={cn("h-4 w-4 text-primary", isPlaying && "animate-spin-slow")} />
              </div>
              <span className="font-medium text-sm">网易云音乐</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => {
                  setIsSettingsOpen(!isSettingsOpen);
                  if (!isSettingsOpen) setTempId(playlistId);
                }}
                title="设置歌单"
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setIsOpen(false)}
                title="最小化"
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* 设置面板 */}
          {isSettingsOpen ? (
            <div className="p-4 space-y-4 h-[calc(100%-48px)] flex flex-col justify-center">
              <div className="space-y-2">
                <Label htmlFor="playlist-id">歌单 ID</Label>
                <Input
                  id="playlist-id"
                  value={tempId}
                  onChange={(e) => setTempId(e.target.value)}
                  placeholder="输入网易云歌单ID"
                />
                <p className="text-xs text-muted-foreground">
                  在网易云音乐网页版 URL 中找到 id 参数，例如: 3778678
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  className="flex-1" 
                  onClick={handleUpdatePlaylist}
                >
                  确认
                </Button>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  className="flex-1 text-xs h-8" 
                  onClick={handlePreviewAnimation}
                >
                  预览加载动画
                </Button>
                <Button 
                  variant="ghost" 
                  className="flex-1 text-xs h-8" 
                  onClick={handleResetPlaylist}
                >
                  重置为热歌榜
                </Button>
              </div>
              <p className="text-[10px] text-center text-muted-foreground/50">
                 如果歌单无法播放，请尝试重置或检查 ID 是否有效
              </p>
            </div>
          ) : (
            /* 播放器 Iframe */
            <div className="h-[calc(100%-48px)] w-full overflow-y-auto music-player-scroll-container">
              {/* @ts-expect-error meting-js is a custom element */}
              <meting-js
                server="netease"
                type="playlist"
                id={playlistId}
                autoplay="false"
                order="random"
                loop="all"
                list-max-height="50vh"
                theme="hsl(var(--primary))"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
