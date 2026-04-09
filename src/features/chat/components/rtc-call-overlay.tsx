import React, { useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Video as VideoIcon, 
  VideoOff, 
  PhoneOff,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RtcCallOverlayProps {
  isJoined: boolean;
  mode: 'audio' | 'video';
  localAudioTrack: boolean;
  localVideoTrack: boolean;
  remoteUsers: string[];
  otherUserName?: string;
  otherUserAvatar?: string;
  onLeave: () => void;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  setLocalVideoPlayer: (el: HTMLElement) => void;
  setRemoteVideoPlayer: (userId: string, el: HTMLElement) => void;
}

export const RtcCallOverlay: React.FC<RtcCallOverlayProps> = ({
  isJoined,
  mode,
  localAudioTrack,
  localVideoTrack,
  remoteUsers,
  otherUserName,
  otherUserAvatar,
  onLeave,
  onToggleAudio,
  onToggleVideo,
  setLocalVideoPlayer,
  setRemoteVideoPlayer,
}) => {
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    if (isJoined && mode === 'video' && localVideoRef.current) {
      // 延迟一小会儿，确保 DOM 已经挂载并且 SDK 准备好
      const timer = setTimeout(() => {
        if (localVideoRef.current) {
          setLocalVideoPlayer(localVideoRef.current);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isJoined, mode, setLocalVideoPlayer, localVideoTrack]);

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    remoteUsers.forEach(userId => {
      if (remoteVideoRefs.current[userId]) {
        const timer = setTimeout(() => {
          if (remoteVideoRefs.current[userId]) {
            setRemoteVideoPlayer(userId, remoteVideoRefs.current[userId]!);
          }
        }, 500);
        timers.push(timer);
      }
    });
    return () => timers.forEach(clearTimeout);
  }, [remoteUsers, setRemoteVideoPlayer]);

  if (!isJoined) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-zinc-950 flex flex-col items-center justify-center animate-in fade-in duration-300">
      {/* 视频渲染区域 */}
      {mode === 'video' ? (
        <div className="relative w-full h-full flex items-center justify-center">
          {/* 远端视频 (大窗) */}
          <div className="w-full h-full bg-zinc-900 overflow-hidden flex items-center justify-center">
            {remoteUsers.length > 0 ? (
              remoteUsers.map(userId => (
                <div 
                  key={userId}
                  ref={(el) => {
                    if (el) remoteVideoRefs.current[userId] = el;
                  }}
                  className="w-full h-full object-cover"
                />
              ))
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border-2 border-zinc-700 shadow-xl">
                  {otherUserAvatar ? (
                    <img src={otherUserAvatar} alt={otherUserName} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-zinc-500" />
                  )}
                </div>
                <div className="text-zinc-400 animate-pulse text-lg font-medium">正在等待对方加入...</div>
              </div>
            )}
          </div>

          {/* 本地视频 (小窗) */}
          <div className="absolute top-6 right-6 w-32 md:w-48 aspect-[3/4] bg-zinc-800 rounded-2xl overflow-hidden border-2 border-zinc-700/50 shadow-2xl z-10 group transition-transform hover:scale-105">
            <div ref={localVideoRef} className="w-full h-full object-cover" />
            {!localVideoTrack && (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-800">
                <VideoOff className="w-8 h-8 text-zinc-600" />
              </div>
            )}
            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm text-[10px] text-white">
              我
            </div>
          </div>
        </div>
      ) : (
        /* 语音通话区域 */
        <div className="flex flex-col items-center gap-12">
          <div className="relative">
            <div className="absolute -inset-4 rounded-full bg-blue-500/20 animate-ping duration-[3s]" />
            <div className="absolute -inset-8 rounded-full bg-blue-500/10 animate-ping duration-[4s]" />
            <div className="w-32 h-32 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border-4 border-zinc-700 shadow-2xl relative z-10">
              {otherUserAvatar ? (
                <img src={otherUserAvatar} alt={otherUserName} className="w-full h-full object-cover" />
              ) : (
                <User className="w-16 h-16 text-zinc-500" />
              )}
            </div>
          </div>
          
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">{otherUserName || '语音通话'}</h2>
            <p className="text-blue-400 font-medium animate-pulse">
              {remoteUsers.length > 0 ? '通话中...' : '正在等待对方加入...'}
            </p>
          </div>
        </div>
      )}

      {/* 控制栏 */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-6 px-8 py-4 bg-zinc-900/80 backdrop-blur-xl rounded-full border border-zinc-800/50 shadow-2xl z-50">
        <Button
          size="icon"
          variant={localAudioTrack ? "secondary" : "destructive"}
          className="w-14 h-14 rounded-full transition-all hover:scale-110 active:scale-95 shadow-lg"
          onClick={onToggleAudio}
        >
          {localAudioTrack ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
        </Button>

        {mode === 'video' && (
          <Button
            size="icon"
            variant={localVideoTrack ? "secondary" : "destructive"}
            className="w-14 h-14 rounded-full transition-all hover:scale-110 active:scale-95 shadow-lg"
            onClick={onToggleVideo}
          >
            {localVideoTrack ? <VideoIcon className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </Button>
        )}

        <Button
          size="icon"
          variant="destructive"
          className="w-16 h-16 rounded-full transition-all hover:scale-110 active:scale-95 shadow-xl hover:rotate-12"
          onClick={onLeave}
        >
          <PhoneOff className="w-8 h-8" />
        </Button>
      </div>
    </div>
  );
};
