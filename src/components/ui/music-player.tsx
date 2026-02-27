import { useState, useEffect, useRef } from 'react';
import { Music, Settings, Disc, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { MusicParticleLoader } from '@/components/ui/particle-loader';

export function MusicPlayer() {
  const [isOpen, setIsOpen] = useState(false);
  // 默认网易云热歌榜
  const DEFAULT_PLAYLIST_ID = '3778678';
  const [playlistId, setPlaylistId] = useState(() => localStorage.getItem('music-playlist-id') || DEFAULT_PLAYLIST_ID);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempId, setTempId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const hasLoadedOnce = useRef(false);
  
  // Load external scripts

  useEffect(() => {
    const loadScript = (src: string) => {
      if (document.querySelector(`script[src="${src}"]`)) return Promise.resolve();
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
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
      .catch(err => console.error('Failed to load music player scripts:', err));
  }, []);

  // Handle loading state
  useEffect(() => {
    if (isOpen && !hasLoadedOnce.current) {
      const timer = setTimeout(() => {
        setIsLoading(true);
        hasLoadedOnce.current = true;
        setTimeout(() => setIsLoading(false), 5000);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setIsLoading(true);
        setTimeout(() => setIsLoading(false), 5000);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [playlistId]);
  
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
      // Keep style on unmount or remove? Better remove to avoid conflicts if re-mounted
      // But since it's global for APlayer, keeping it is fine. 
      // Actually let's remove it to be clean.
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
    <div className="fixed z-50 bottom-32 right-4 transition-all duration-300 ease-in-out">
      {/* 悬浮按钮 (当播放器关闭时显示) */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          size="icon"
          className="h-12 w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground animate-bounce-slow"
          title="打开音乐播放器"
        >
          <Music className="h-6 w-6" />
        </Button>
      )}

      {/* 播放器面板 */}
      <div className={cn(
        "relative bg-background/95 backdrop-blur-md border border-border rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 origin-bottom-right",
        isOpen ? "w-[90vw] h-[70vh] sm:w-[500px] md:w-[40vw] min-h-[600px] opacity-100 scale-100 translate-y-28" : "w-0 h-0 opacity-0 scale-0 pointer-events-none"
      )}>
        {/* Loading Overlay */}
        {isLoading && <MusicParticleLoader />}

        {/* 标题栏 */}
        <div className="flex items-center justify-between p-3 bg-muted/50 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-full">
              <Disc className={cn("h-4 w-4 text-primary", isOpen && "animate-spin-slow")} />
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
              autoplay="true"
              order="random"
              loop="all"
              list-max-height="50vh"
              theme="hsl(var(--primary))"
            />
          </div>
        )}
      </div>
    </div>
  );
}
