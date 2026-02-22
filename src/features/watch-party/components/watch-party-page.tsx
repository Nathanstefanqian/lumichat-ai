import { useEffect, useRef, useState } from 'react';
import { useWatchPartySocket } from '../hooks/use-watch-party-socket';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
    Play, 
    Pause, 
    Send, 
    Users, 
    Copy, 
    LogOut, 
    Film, 
    Heart, 
    Sparkles, 
    Volume2, 
    VolumeX, 
    Maximize, 
    Minimize,
    MessageCircle,
    Upload,
    Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth';

export function WatchPartyPage() {
  const {
    isConnected,
    room,
    error,
    createRoom,
    joinRoom,
    updateState,
    sendMessage,
    messages,
    user,
    leaveRoom
  } = useWatchPartySocket();
  
  const [joinId, setJoinId] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [messageInput, setMessageInput] = useState('');
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [showControls, setShowControls] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [localCurrentTime, setLocalCurrentTime] = useState(0);
  const [localDuration, setLocalDuration] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  const controlsTimeoutRef = useRef<NodeJS.Timeout>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const token = useAuthStore((state) => state.token);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, showChat]);

  // Sync Logic
  useEffect(() => {
    if (!room || !videoRef.current) return;

    const video = videoRef.current;
    
    // Sync Play/Pause
    if (room.isPlaying && video.paused) {
      video.play().catch(e => console.log('Autoplay blocked', e));
    } else if (!room.isPlaying && !video.paused) {
      video.pause();
    }

    // Sync Time (if drift > 2 seconds)
    if (Math.abs(video.currentTime - room.currentTime) > 2) {
      video.currentTime = room.currentTime;
    }
  }, [room?.isPlaying, room?.currentTime, room?.lastUpdated]);

  useEffect(() => {
      if (error) {
          toast.error(error);
      }
  }, [error]);

  const handleCopyRoomId = () => {
    if (room?.roomId) {
      navigator.clipboard.writeText(room.roomId);
      toast.success('房间号已复制');
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageInput.trim()) {
      sendMessage(messageInput);
      setMessageInput('');
    }
  };

  const handleVideoUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (videoUrlInput.trim()) {
      updateState({
        videoUrl: videoUrlInput,
        isPlaying: false,
        currentTime: 0
      });
      setVideoUrlInput('');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 2GB limit
    if (file.size > 2 * 1024 * 1024 * 1024) {
      toast.error('文件大小不能超过 2GB');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/api/watch-party/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error('Upload failed');
        }

        const data = await response.json();
        // Construct full URL if needed, or use relative if proxy is set up correctly
        // Assuming /uploads proxy works
        updateState({
            videoUrl: data.url,
            isPlaying: true,
            currentTime: 0
        });
        toast.success('视频上传成功，开始播放！');
    } catch (error) {
        console.error('Upload error:', error);
        toast.error('视频上传失败');
    } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }
  };

  const isHost = room?.hostId === String(user?.userId);

  // Host Controls
  const handlePlayPause = () => {
    if (!isHost || !videoRef.current) return;
    const video = videoRef.current;
    
    if (video.paused) {
        video.play();
        updateState({ isPlaying: true, currentTime: video.currentTime });
    } else {
        video.pause();
        updateState({ isPlaying: false, currentTime: video.currentTime });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isHost || !videoRef.current) return;
      const time = parseFloat(e.target.value);
      videoRef.current.currentTime = time;
      updateState({ currentTime: time });
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newVolume = parseFloat(e.target.value);
      setVolume(newVolume);
      if (videoRef.current) {
          videoRef.current.volume = newVolume;
          setIsMuted(newVolume === 0);
      }
  };

  const toggleMute = () => {
      if (videoRef.current) {
          const newMuted = !isMuted;
          setIsMuted(newMuted);
          videoRef.current.muted = newMuted;
          if (!newMuted && volume === 0) {
              setVolume(0.5);
              videoRef.current.volume = 0.5;
          }
      }
  };

  const toggleFullscreen = () => {
      if (!containerRef.current) return;

      if (!document.fullscreenElement) {
          containerRef.current.requestFullscreen();
          setIsFullscreen(true);
      } else {
          document.exitFullscreen();
          setIsFullscreen(false);
      }
  };
  
  // Show/Hide controls
  const handleMouseMove = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
  };

  // Format time helper
  const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFileUploadTrigger = () => {
    fileInputRef.current?.click();
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh] w-full bg-gradient-to-br from-pink-50 to-purple-100 dark:from-pink-950 dark:to-purple-900">
        <div className="text-center space-y-4 px-6">
          <Sparkles className="w-12 h-12 text-pink-500 mx-auto animate-pulse" />
          <p className="text-muted-foreground font-medium text-lg">
            {error ? (
                <span className="text-red-500">连接失败: {error}</span>
            ) : (
                '正在连接到浪漫放映室...'
            )}
          </p>
          {error && (
            <div className="pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => window.location.reload()}
                  className="bg-white/10 hover:bg-white/20"
                >
                  刷新页面重试
                </Button>
                <p className="text-xs text-muted-foreground mt-4">
                    请检查后端服务是否启动 (端口 3000)
                </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex items-center justify-center h-full min-h-[calc(100vh-4rem)] bg-gradient-to-br from-pink-50 to-purple-100 dark:from-pink-950 dark:to-purple-900 p-4 md:p-6">
        <div className="max-w-md w-full bg-white/80 dark:bg-black/50 backdrop-blur-xl rounded-3xl shadow-2xl p-6 md:p-8 border border-white/20 mx-auto">
          <div className="text-center mb-6 md:mb-8">
            <div className="w-16 h-16 bg-gradient-to-tr from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg transform rotate-3">
              <Film className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              浪漫放映室
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              与特别的人一起，跨越距离，共享此刻
            </p>
          </div>

          <div className="space-y-6">
            <Button 
              className="w-full h-12 text-lg bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 shadow-md transition-all hover:scale-[1.02]"
              onClick={createRoom}
            >
              <Heart className="w-5 h-5 mr-2 fill-current" />
              创建放映室
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-muted/50" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground rounded-full">或者</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Input 
                placeholder="输入房间号加入..." 
                value={joinId}
                onChange={(e) => setJoinId(e.target.value.toUpperCase())}
                className="h-12 text-center text-lg tracking-widest uppercase bg-white/50 dark:bg-black/20"
                maxLength={6}
              />
              <Button 
                variant="secondary"
                className="h-12 px-6"
                onClick={() => joinRoom(joinId)}
                disabled={joinId.length !== 6}
              >
                加入
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex flex-col md:flex-row h-full bg-black text-white overflow-hidden relative group/container">
      <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="video/mp4,video/webm,video/ogg"
          onChange={handleFileUpload}
      />
      {/* Main Video Area */}
      <div 
        className={cn(
            "relative flex flex-col justify-center items-center bg-black transition-all duration-300",
            "w-full",
            // Mobile: Video takes 40% height when chat is open, or full height when closed
            showChat ? "h-[40vh] md:h-full md:flex-1" : "h-full md:flex-1"
        )}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setShowControls(false)}
        onClick={() => {
            if (isHost) handlePlayPause();
            setShowControls(true);
        }}
      >
        {room.videoUrl ? (
            <video
                ref={videoRef}
                src={room.videoUrl}
                className="w-full h-full object-contain max-h-screen"
                onClick={(e) => e.stopPropagation()} // Prevent double toggle
                onTimeUpdate={(e) => {
                   setLocalCurrentTime(e.currentTarget.currentTime);
                }}
                onLoadedMetadata={(e) => {
                    setLocalDuration(e.currentTarget.duration);
                }}
                onError={(e) => {
                    console.error('Video error:', e);
                    toast.error('视频加载失败，请检查文件格式或网络连接');
                }}
            />
        ) : (
            <div className="text-center p-8 space-y-4">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto animate-pulse">
                    <Film className="w-10 h-10 text-white/20" />
                </div>
                <h3 className="text-xl font-medium text-white/80">等待播放</h3>
                {isHost ? (
                    <div className="max-w-md mx-auto space-y-2">
                        <p className="text-sm text-white/50">作为房主，请输入视频链接开始播放</p>
                        <form onSubmit={handleVideoUrlSubmit} className="flex gap-2">
                            <Input
                                placeholder="输入 MP4/WebM 视频链接..."
                                value={videoUrlInput}
                                onChange={(e) => setVideoUrlInput(e.target.value)}
                                className="bg-white/10 border-white/20 text-white placeholder:text-white/30"
                                onClick={(e) => e.stopPropagation()}
                            />
                            <Button type="submit" variant="secondary">播放</Button>
                            
                            <Button 
                                type="button" 
                                variant="outline" 
                                className="bg-white/10 border-white/20 text-white hover:bg-white/20 px-3"
                                onClick={handleFileUploadTrigger}
                                disabled={isUploading}
                                title="上传本地视频"
                            >
                                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                            </Button>
                        </form>
                    </div>
                ) : (
                    <p className="text-sm text-white/50">等待房主选择视频...</p>
                )}
            </div>
        )}

        {/* Top Bar (Overlay) */}
        <div className={cn(
            "absolute top-0 left-0 right-0 z-20 p-2 md:p-4 bg-gradient-to-b from-black/80 to-transparent transition-opacity duration-300 flex justify-between items-start",
            showControls ? "opacity-100" : "opacity-0"
        )} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 md:gap-3">
                <div className="bg-white/10 backdrop-blur-md px-2 md:px-3 py-1 md:py-1.5 rounded-full flex items-center gap-2 border border-white/10 hover:bg-white/20 transition-colors">
                    <span className="text-[10px] md:text-xs font-medium text-pink-300">ROOM</span>
                    <span className="font-mono text-xs md:text-sm font-bold tracking-wider">{room.roomId}</span>
                    <button onClick={handleCopyRoomId} className="hover:text-pink-400 transition-colors p-1">
                        <Copy className="w-3 h-3 md:w-3.5 md:h-3.5" />
                    </button>
                </div>
                <div className="bg-white/10 backdrop-blur-md px-2 md:px-3 py-1 md:py-1.5 rounded-full flex items-center gap-2 border border-white/10 hidden sm:flex">
                   <Users className="w-3 h-3 md:w-3.5 md:h-3.5 text-purple-300" />
                   <span className="text-xs md:text-sm">{room.members.length} 人在线</span>
                </div>
            </div>
            
            <div className="flex gap-1 md:gap-2">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-white/70 hover:text-white hover:bg-white/10 rounded-full h-8 w-8 md:h-10 md:w-10"
                    onClick={() => setShowChat(!showChat)}
                >
                    <MessageCircle className="w-4 h-4 md:w-5 md:h-5" />
                </Button>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-white/70 hover:text-red-400 hover:bg-white/10 rounded-full h-8 w-8 md:h-10 md:w-10"
                    onClick={leaveRoom}
                >
                    <LogOut className="w-4 h-4 md:w-5 md:h-5" />
                </Button>
            </div>
        </div>

        {/* Bottom Controls (Overlay) */}
        {room.videoUrl && (
            <div className={cn(
                "absolute bottom-0 left-0 right-0 z-20 p-3 md:p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-opacity duration-300",
                showControls ? "opacity-100" : "opacity-0"
            )} onClick={(e) => e.stopPropagation()}>
                {/* Progress Bar */}
                <div className="mb-2 md:mb-4 flex items-center gap-2 md:gap-3 group/progress">
                    <span className="text-[10px] md:text-xs font-mono text-white/70 min-w-[32px] md:min-w-[40px]">
                        {formatTime(localCurrentTime)}
                    </span>
                    <div className="relative flex-1 h-6 flex items-center cursor-pointer group/slider">
                        <input 
                            type="range" 
                            min={0} 
                            max={localDuration || 100} 
                            step={0.1}
                            value={localCurrentTime}
                            onChange={handleSeek}
                            disabled={!isHost}
                            className={cn(
                                "absolute w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-pink-500 [&::-webkit-slider-thumb]:transition-all hover:[&::-webkit-slider-thumb]:scale-125",
                                !isHost && "cursor-not-allowed opacity-50"
                            )}
                        />
                         {/* Buffered indication could go here */}
                    </div>
                    <span className="text-[10px] md:text-xs font-mono text-white/70 min-w-[32px] md:min-w-[40px]">
                        {formatTime(localDuration || 0)}
                    </span>
                </div>

                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 md:gap-4">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className={cn("w-8 h-8 md:w-10 md:h-10 rounded-full hover:bg-white/10 text-white hover:text-pink-400 transition-all", !isHost && "opacity-50 cursor-not-allowed")}
                            onClick={handlePlayPause}
                            disabled={!isHost}
                        >
                            {room.isPlaying ? <Pause className="w-4 h-4 md:w-5 md:h-5 fill-current" /> : <Play className="w-4 h-4 md:w-5 md:h-5 fill-current ml-1" />}
                        </Button>

                        <div className="flex items-center gap-1 md:gap-2 group/volume">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="w-8 h-8 rounded-full hover:bg-white/10 text-white/70 hover:text-white"
                                onClick={toggleMute}
                            >
                                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                            </Button>
                            <input 
                                type="range"
                                min={0}
                                max={1}
                                step={0.1}
                                value={isMuted ? 0 : volume}
                                onChange={handleVolumeChange}
                                className="w-16 md:w-20 h-1 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white hover:[&::-webkit-slider-thumb]:bg-pink-400"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-4">
                        {isHost && (
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="w-8 h-8 md:w-10 md:h-10 rounded-full hover:bg-white/10 text-white hover:text-pink-400 transition-all"
                                onClick={handleFileUploadTrigger}
                                disabled={isUploading}
                                title="更换视频"
                            >
                                {isUploading ? <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" /> : <Upload className="w-4 h-4 md:w-5 md:h-5" />}
                            </Button>
                        )}
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="w-8 h-8 md:w-10 md:h-10 rounded-full hover:bg-white/10 text-white hover:text-pink-400 transition-all"
                            onClick={toggleFullscreen}
                        >
                            {isFullscreen ? <Minimize className="w-4 h-4 md:w-5 md:h-5" /> : <Maximize className="w-4 h-4 md:w-5 md:h-5" />}
                        </Button>
                    </div>
                </div>
            </div>
        )}
      </div>

      {/* Chat Sidebar */}
      <div className={cn(
          "bg-background/95 backdrop-blur-xl border-border transition-all duration-300 flex flex-col z-30",
          // Borders
          "border-t md:border-t-0 md:border-l",
          
          // Mobile Logic (default)
          "w-full",
          showChat ? "flex-1 opacity-100" : "h-0 opacity-0 overflow-hidden border-none",

          // Desktop Logic (md:)
          "md:h-full md:relative",
          showChat ? "md:w-80" : "md:w-0 md:border-none"
      )}>
        {/* Chat Header */}
        <div className="h-16 border-b border-border flex items-center justify-between px-4 bg-background/50">
            <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-pink-500 fill-current animate-pulse" />
                <span className="font-semibold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                    聊天室
                </span>
            </div>
            <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 md:hidden"
                onClick={() => setShowChat(false)}
            >
                <Minimize className="w-4 h-4 rotate-90" />
            </Button>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-romantic">
            {messages.map((msg, idx) => {
                const isMe = msg.userId === String(user?.userId);
                return (
                    <div key={idx} className={cn("flex flex-col max-w-[85%]", isMe ? "ml-auto items-end" : "items-start")}>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] text-muted-foreground">{msg.userName}</span>
                            {room.hostId === msg.userId && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-pink-500/10 text-pink-500 rounded-full border border-pink-500/20">
                                    房主
                                </span>
                            )}
                        </div>
                        <div className={cn(
                            "px-3 py-2 rounded-2xl text-sm break-words",
                            isMe 
                                ? "bg-gradient-to-br from-pink-500 to-purple-600 text-white rounded-tr-none" 
                                : "bg-muted text-foreground rounded-tl-none"
                        )}>
                            {msg.message}
                        </div>
                    </div>
                );
            })}
            <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div className="p-4 border-t border-border bg-background/50">
            <form onSubmit={handleSendMessage} className="relative">
                <Input
                    placeholder="说点什么..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    className="pr-10 rounded-full bg-muted/50 border-muted focus-visible:ring-pink-500"
                />
                <Button 
                    type="submit" 
                    size="icon" 
                    className="absolute right-1 top-1 h-8 w-8 rounded-full bg-pink-500 hover:bg-pink-600 text-white"
                    disabled={!messageInput.trim()}
                >
                    <Send className="w-4 h-4" />
                </Button>
            </form>
        </div>
      </div>
    </div>
  );
}
