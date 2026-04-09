import { useEffect, useMemo, useRef, useState } from 'react';
import { Send, User, Users, ChevronLeft, Trash2, Image as ImageIcon, Mic, X, Copy, RotateCcw, Maximize, Minimize, Play, Pause, Phone, Video } from 'lucide-react';
import { useRtc } from '../hooks/use-rtc';
import { RtcCallOverlay } from './rtc-call-overlay';
import { IncomingCallModal } from './incoming-call-modal';
import { OutgoingCallModal } from './outgoing-call-modal';

function WaveformPlayer({ src }: { src: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioData, setAudioData] = useState<number[]>([]);

  useEffect(() => {
    // 预解析音频生成波形数据
    const fetchAudioData = async () => {
      try {
        const response = await fetch(src);
        const arrayBuffer = await response.arrayBuffer();
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        const rawData = audioBuffer.getChannelData(0);
        const samples = 40; // 波形条数量
        const blockSize = Math.floor(rawData.length / samples);
        const filteredData = [];
        for (let i = 0; i < samples; i++) {
          const blockStart = blockSize * i;
          let sum = 0;
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(rawData[blockStart + j]);
          }
          filteredData.push(sum / blockSize);
        }
        setAudioData(filteredData);
        setDuration(audioBuffer.duration);
        await audioCtx.close();
      } catch (err) {
        console.error('Failed to parse waveform:', err);
      }
    };
    fetchAudioData();
  }, [src]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  return (
    <div className="flex items-center gap-3 min-w-[180px] h-10 px-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
      <audio 
        ref={audioRef} 
        src={src} 
        onTimeUpdate={handleTimeUpdate} 
        onEnded={handleEnded} 
        className="hidden" 
      />
      <button 
        onClick={togglePlay}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors shrink-0"
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
      </button>
      
      <div className="flex-1 flex items-center gap-0.5 h-6 overflow-hidden">
        {audioData.map((val, i) => {
          const progress = (currentTime / duration) || 0;
          const isPlayed = (i / audioData.length) < progress;
          const height = Math.max(20, val * 150); // 最小高度 20%
          return (
            <div 
              key={i}
              className={cn(
                "w-1 rounded-full transition-all duration-300",
                isPlayed ? "bg-white" : "bg-white/30"
              )}
              style={{ height: `${height}%` }}
            />
          );
        })}
      </div>
      
      <span className="text-[10px] font-mono text-white/80 shrink-0 w-8 text-right">
        {Math.round(duration - currentTime)}s
      </span>
    </div>
  );
}

function AudioVisualizer({ stream }: { stream: MediaStream }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!stream) return;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const draw = () => {
      animationId = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height;

        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#f2a68d');
        gradient.addColorStop(1, '#ff6b6b');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      audioContext.close();
    };
  }, [stream]);

  return <canvas ref={canvasRef} className="w-full h-8 opacity-80" width={300} height={32} />;
}

import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth';
import { useSocketStore } from '@/stores/socket';
import { useUserChatStore } from '@/stores/user-chat';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import {
  fetchUsers,
  fetchConversations,
  fetchMessages,
  createUserConversation,
  sendMessage,
  fetchFriends,
  fetchFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  deleteFriend,
  uploadFile,
  deleteMessage,
  deleteConversation,
  markAsRead,
  type ChatConversation,
  type ChatMessage,
  type FriendRequest,
} from '@/features/chat/api/chat';
import { type ChatSocket } from '@/features/chat/api/socket';

interface UserItem {
  id: number;
  username: string;
  email: string;
  avatar?: string;
  isOnline?: boolean;
  lastSeen?: string;
}

// 格式化时间函数
const formatChatTime = (dateStr?: string | number) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  // If very recent (less than 1 min), show "Just now"
  if (diffMins < 1) return '刚刚';

  const isToday = date.getDate() === now.getDate() && 
                 date.getMonth() === now.getMonth() && 
                 date.getFullYear() === now.getFullYear();
                 
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.getDate() === yesterday.getDate() && 
                      date.getMonth() === yesterday.getMonth() && 
                      date.getFullYear() === yesterday.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  if (isYesterday) {
    return `昨天 ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`;
  }
  
  return `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`;
};

import { AddFriendDialog } from './add-friend-dialog';

export function UserChatView() {
  const currentUser = useAuthStore((state) => state.user);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [friends, setFriends] = useState<UserItem[]>([]);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversation, setActiveConversation] =
    useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const listRef = useRef<HTMLDivElement | null>(null);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<number>>(new Set());
  const socketRef = useRef<ChatSocket | null>(null);
  const usersRef = useRef<UserItem[]>([]);
  const activeConversationRef = useRef<string | null>(null);
  const setSocketLastEvent = useSocketStore((state) => state.setLastEvent);
  const socket = useSocketStore((state) => state.socket);
  const { activeConversationId, setActiveConversationId, setUnreadTotal } = useUserChatStore();
  const [isFullscreen, setIsFullscreen] = useState(false);

  // RTC 通话
  const [rtcMode, setRtcMode] = useState<'audio' | 'video'>('audio');
  const [pendingOutgoingCall, setPendingOutgoingCall] = useState<{
    targetUserId: number;
    conversationId: string;
    mode: 'audio' | 'video';
  } | null>(null);
  const [incomingCall, setIncomingCall] = useState<{
    callerId: number;
    callerName?: string;
    conversationId: string;
    mode: 'audio' | 'video';
  } | null>(null);
  const {
    isJoined,
    remoteUsers,
    localAudioTrack,
    localVideoTrack,
    joinRoom,
    leaveRoom,
    toggleAudio,
    toggleVideo,
    setLocalVideoPlayer,
    setRemoteVideoPlayer,
  } = useRtc({
    roomId: activeConversation?._id || '',
    userId: String(currentUser?.userId || ''),
  });

  const getOtherParticipantId = (conversation?: ChatConversation | null) => {
    if (!conversation || !currentUser?.userId) return null;
    const otherId = conversation.participants.find((id) => id !== currentUser.userId);
    return typeof otherId === 'number' ? otherId : null;
  };

  const handleStartCall = async (mode: 'audio' | 'video') => {
    if (!activeConversation) return;
    const targetUserId = getOtherParticipantId(activeConversation);
    if (!targetUserId) {
      alert('未找到通话对象');
      return;
    }
    const socket = socketRef.current;
    if (!socket?.connected) {
      alert('实时连接未建立，请稍后重试');
      return;
    }
    setRtcMode(mode);
    setPendingOutgoingCall({
      targetUserId,
      conversationId: activeConversation._id,
      mode,
    });
    socket.emit('call:invite', {
      targetUserId,
      conversationId: activeConversation._id,
      mode,
    });
  };

  const handleCancelOutgoingCall = () => {
    if (!pendingOutgoingCall) return;
    const socket = socketRef.current;
    if (socket?.connected) {
      socket.emit('call:end', {
        targetUserId: pendingOutgoingCall.targetUserId,
        conversationId: pendingOutgoingCall.conversationId,
      });
    }
    setPendingOutgoingCall(null);
  };

  const handleLeaveCall = async () => {
    const socket = socketRef.current;
    const targetUserId = getOtherParticipantId(activeConversation);
    if (socket?.connected && targetUserId && activeConversation?._id) {
      socket.emit('call:end', {
        targetUserId,
        conversationId: activeConversation._id,
      });
    }
    setPendingOutgoingCall(null);
    await leaveRoom();
  };

  const handleAcceptIncomingCall = async () => {
    if (!incomingCall) return;
    const socket = socketRef.current;
    if (!socket?.connected) {
      alert('实时连接未建立，请稍后重试');
      return;
    }
    setRtcMode(incomingCall.mode);
    setActiveConversationId(incomingCall.conversationId);
    socket.emit('call:accept', {
      callerId: incomingCall.callerId,
      conversationId: incomingCall.conversationId,
      mode: incomingCall.mode,
    });
    await joinRoom(incomingCall.mode, incomingCall.conversationId);
    setIncomingCall(null);
  };

  const handleRejectIncomingCall = () => {
    if (!incomingCall) return;
    const socket = socketRef.current;
    if (socket?.connected) {
      socket.emit('call:reject', {
        callerId: incomingCall.callerId,
        conversationId: incomingCall.conversationId,
      });
    }
    setIncomingCall(null);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const total = conversations.reduce((acc, conv) => acc + (conv.unreadCount || 0), 0);
    setUnreadTotal(total);
  }, [conversations, setUnreadTotal]);
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleSendMedia = async (type: 'image' | 'audio', fileUrl: string, previewText: string) => {
     if (!activeConversation) return;

     const socket = socketRef.current;
     if (socket?.connected) {
       const localId = `local-${Date.now()}`;
       const tempMsg: ChatMessage = {
          _id: localId,
          conversationId: activeConversation._id,
          senderId: currentUser?.userId || null,
          role: 'user',
          content: previewText,
          type,
          fileUrl,
          createdAt: new Date().toISOString(),
       };

       setMessages((prev) => [...prev, tempMsg]);

       socket.emit(
        'chat:send',
        { conversationId: activeConversation._id, content: previewText, type, fileUrl },
        (response: { ok: boolean; message?: ChatMessage }) => {
          if (response?.message) {
            setMessages((prev) =>
              prev.map((item) =>
                item._id === localId ? (response.message as ChatMessage) : item,
              ),
            );
          }
        },
      );
      return;
     }
     
     // Fallback to HTTP
     const message = await sendMessage(activeConversation._id, previewText, type, fileUrl);
     setMessages((prev) => [...prev, message]);
      setConversations((prev) =>
      prev.map((conv) =>
        conv._id === activeConversation._id
          ? {
              ...conv,
              lastMessagePreview: previewText,
              lastMessageAt: new Date().toISOString(),
            }
          : conv,
      ),
    );
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { url } = await uploadFile(file);
      await handleSendMedia('image', url, '[图片]');
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert('图片上传失败');
    }
    // Clear input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMediaStream(stream);
      
      // 动态检测浏览器支持的音频格式
      const mimeTypes = ['audio/mp4', 'audio/aac', 'audio/webm', 'audio/wav'];
      const mimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || '';
      
      const options = mimeType ? { mimeType } : {};
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // 强制使用 audio/mpeg (MP3) 进行文件封装发送
        const finalMimeType = 'audio/mpeg';
        const audioBlob = new Blob(audioChunksRef.current, { type: finalMimeType });
        const file = new File([audioBlob], 'voice.mp3', { type: finalMimeType });
        
        try {
          const { url } = await uploadFile(file);
          await handleSendMedia('audio', url, '[语音]');
        } catch (error) {
          console.error('Failed to upload voice:', error);
          alert('语音发送失败');
        }
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('无法访问麦克风');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setMediaStream(null);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleCancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      // Just stop without processing
      mediaRecorderRef.current.onstop = null; // Remove handler
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setMediaStream(null);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleDeleteMessageItem = async (messageId: string) => {
      if (!window.confirm('确定要删除这条消息吗？')) return;
      
      try {
          await deleteMessage(messageId);
          setMessages(prev => prev.filter(m => m._id !== messageId));
      } catch (error) {
          console.error('Failed to delete message:', error);
          alert('删除失败');
      }
  };

  const handleDeleteConversationItem = async (conversationId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!window.confirm('确定要删除这个对话吗？')) return;

      try {
          await deleteConversation(conversationId);
          setConversations(prev => prev.filter(c => c._id !== conversationId));
          if (activeConversation?._id === conversationId) {
              setActiveConversation(null);
          }
      } catch (error) {
          console.error('Failed to delete conversation:', error);
          alert('删除失败');
      }
  };

  const selectConversation = async (conversation: ChatConversation) => {
    setActiveConversation(conversation);
    const list = await fetchMessages(conversation._id);
    setMessages(list);
    
    // Clear unread count locally
    setConversations(prev => prev.map(c => 
      c._id === conversation._id ? { ...c, unreadCount: 0 } : c
    ));

    // 标记为已读
    try {
      await markAsRead(conversation._id);
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  useEffect(() => {
    const load = async () => {
      const [userList, convoList, friendList, requests] = await Promise.all([
        fetchUsers(),
        fetchConversations('user'),
        fetchFriends(),
        fetchFriendRequests(),
      ]);
      setUsers(
        userList.filter((item) => String(item.id) !== String(currentUser?.userId || -1)),
      );
      setConversations(convoList);
      setFriends(friendList);
      setIncomingRequests(requests.incoming);
      setOutgoingRequests(requests.outgoing);
      usersRef.current = userList;
      if (convoList.length > 0) {
        const currentActiveId = useUserChatStore.getState().activeConversationId;
        const target = currentActiveId ? convoList.find((c) => c._id === currentActiveId) : null;
        if (target) {
          await selectConversation(target);
        }
      }
    };
    load().catch(() => {});
  }, [currentUser]);

  useEffect(() => {
    usersRef.current = users;
  }, [users]);

  useEffect(() => {
    activeConversationRef.current = activeConversation?._id || null;
  }, [activeConversation?._id]);

  useEffect(() => {
    if (!currentUser?.userId || !socket) {
      return;
    }
    
    socketRef.current = socket;

    const handleMessage = (payload: { conversationId: string; message: ChatMessage; conversation: ChatConversation }) => {
      setSocketLastEvent('chat:message');
      setConversations((prev) => {
        const exists = prev.find((conv) => conv._id === payload.conversationId);
        const isActive = activeConversationRef.current === payload.conversationId;
        const isFromOther = String(payload.message.senderId) !== String(currentUser?.userId);

        if (exists) {
          return prev.map((conv) =>
            conv._id === payload.conversationId
              ? {
                  ...conv,
                  lastMessagePreview: payload.message.content.slice(0, 100),
                  lastMessageAt: payload.message.createdAt,
                  unreadCount: (conv.unreadCount || 0) + (isFromOther && !isActive ? 1 : 0),
                }
              : conv,
          );
        }
        return [
          {
            ...payload.conversation,
            lastMessagePreview: payload.message.content.slice(0, 100),
            lastMessageAt: payload.message.createdAt,
            unreadCount: isFromOther && !isActive ? 1 : 0,
          },
          ...prev,
        ];
      });

      if (activeConversationRef.current === payload.conversationId) {
        setMessages((prev) => {
          if (prev.find((item) => item._id === payload.message._id)) {
            return prev;
          }
          // Check for local message to replace
           if (String(payload.message.senderId) === String(currentUser?.userId)) {
             const localMsg = prev.find(
               (m) =>
                 typeof m._id === 'string' &&
                 m._id.startsWith('local-') &&
                 m.content === payload.message.content
             );
            if (localMsg) {
               return prev.map(m => m._id === localMsg._id ? payload.message : m);
            }
          }
          return [...prev, payload.message];
        });

        // 如果是当前正在进行的对话，收到消息后立即标记为已读
        if (payload.message.conversationId === activeConversationRef.current) {
          markAsRead(payload.message.conversationId).catch(console.error);
        }
      }
    };

    const handleFriendRequest = (request: FriendRequest) => {
      setSocketLastEvent('friend:request');
      setIncomingRequests((prev) => [request, ...prev]);
    };

    const handleFriendRequestSent = (request: FriendRequest) => {
      setSocketLastEvent('friend:request:sent');
      setOutgoingRequests((prev) => [request, ...prev]);
    };

    const handleFriendAccepted = (request: FriendRequest) => {
      setSocketLastEvent('friend:accepted');
      setIncomingRequests((prev) => prev.filter((item) => item._id !== request._id));
      setOutgoingRequests((prev) => prev.filter((item) => item._id !== request._id));
      const friendId =
        request.requesterId === currentUser.userId
          ? request.addresseeId
          : request.requesterId;
      const friendUser = usersRef.current.find((item) => item.id === friendId);
      if (friendUser) {
        setFriends((prev) => {
          if (prev.find((item) => item.id === friendUser.id)) {
            return prev;
          }
          return [friendUser, ...prev];
        });
      }
    };

    const handleFriendRejected = (request: FriendRequest) => {
      setSocketLastEvent('friend:rejected');
      setIncomingRequests((prev) => prev.filter((item) => item._id !== request._id));
      setOutgoingRequests((prev) => prev.filter((item) => item._id !== request._id));
    };

    const handleFriendDeleted = (payload: { friendId: number }) => {
      setSocketLastEvent('friend:deleted');
      setFriends((prev) => prev.filter((item) => item.id !== payload.friendId));
    };

    const handleUserOnline = (payload: { userId: number }) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        next.add(payload.userId);
        return next;
      });
    };

    const handleUserOffline = (payload: { userId: number }) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        next.delete(payload.userId);
        return next;
      });
    };

    const handleOnlineList = (payload: { userIds: number[] }) => {
      setOnlineUserIds(new Set(payload.userIds));
    };

    const handleCallIncoming = async (payload: {
      callerId: number;
      callerName?: string;
      conversationId: string;
      mode: 'audio' | 'video';
    }) => {
      setIncomingCall(payload);
    };

    const handleCallAccepted = async (payload: {
      calleeId: number;
      conversationId: string;
      mode: 'audio' | 'video';
    }) => {
      if (
        !pendingOutgoingCall ||
        pendingOutgoingCall.conversationId !== payload.conversationId
      ) {
        return;
      }
      await joinRoom(pendingOutgoingCall.mode, pendingOutgoingCall.conversationId);
      setPendingOutgoingCall(null);
    };

    const handleCallRejected = (payload: { conversationId: string }) => {
      if (
        pendingOutgoingCall &&
        pendingOutgoingCall.conversationId === payload.conversationId
      ) {
        alert('对方拒绝了通话邀请');
        setPendingOutgoingCall(null);
      }
    };

    const handleCallEnded = async () => {
      if (isJoined) {
        await leaveRoom();
      }
      setPendingOutgoingCall(null);
      setIncomingCall(null);
      alert('通话已结束');
    };

    socket.on('chat:message', handleMessage);
    socket.on('friend:request', handleFriendRequest);
    socket.on('friend:request:sent', handleFriendRequestSent);
    socket.on('friend:accepted', handleFriendAccepted);
    socket.on('friend:rejected', handleFriendRejected);
    socket.on('friend:deleted', handleFriendDeleted);
    socket.on('user:online', handleUserOnline);
    socket.on('user:offline', handleUserOffline);
    socket.on('users:online:list', handleOnlineList);
    socket.on('call:incoming', handleCallIncoming);
    socket.on('call:accepted', handleCallAccepted);
    socket.on('call:rejected', handleCallRejected);
    socket.on('call:ended', handleCallEnded);

    return () => {
      socket.off('chat:message', handleMessage);
      socket.off('friend:request', handleFriendRequest);
      socket.off('friend:request:sent', handleFriendRequestSent);
      socket.off('friend:accepted', handleFriendAccepted);
      socket.off('friend:rejected', handleFriendRejected);
      socket.off('friend:deleted', handleFriendDeleted);
      socket.off('user:online', handleUserOnline);
      socket.off('user:offline', handleUserOffline);
      socket.off('users:online:list', handleOnlineList);
      socket.off('call:incoming', handleCallIncoming);
      socket.off('call:accepted', handleCallAccepted);
      socket.off('call:rejected', handleCallRejected);
      socket.off('call:ended', handleCallEnded);
    };
  }, [currentUser?.userId, socket, setSocketLastEvent, joinRoom, leaveRoom, pendingOutgoingCall, isJoined]);

  // Sync activeConversationId from store to local state
  useEffect(() => {
    if (activeConversationId && conversations.length > 0) {
        const target = conversations.find(c => c._id === activeConversationId);
        if (target && target._id !== activeConversationRef.current) {
            setTimeout(() => selectConversation(target), 0);
        }
    }
  }, [activeConversationId, conversations]);

  // Sync local activeConversation to store
  useEffect(() => {
    if (activeConversation) {
        if (activeConversation._id !== activeConversationId) {
             setActiveConversationId(activeConversation._id);
        }
    }
  }, [activeConversation, activeConversationId, setActiveConversationId]);


  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const canSend = useMemo(() => input.trim().length > 0, [input]);

  const handleSelectUser = async (userId: number) => {
    if (!friends.find((friend) => friend.id === userId)) {
      return;
    }
    const conversation = await createUserConversation(userId);
    if (!conversations.find((conv) => conv._id === conversation._id)) {
      setConversations([conversation, ...conversations]);
    }
    await selectConversation(conversation);
  };

  const handleSendFriendRequest = async (userId: number) => {
    const socket = socketRef.current;
    if (socket?.connected) {
      socket.emit('friend:request', { targetUserId: userId }, (response: { ok: boolean; request?: FriendRequest }) => {
        if (response?.request) {
          setOutgoingRequests((prev) => [response.request as FriendRequest, ...prev]);
        }
      });
      return;
    }
    const request = await sendFriendRequest(userId);
    setOutgoingRequests((prev) => [request, ...prev]);
  };

  const handleAcceptRequest = async (requestId: string) => {
    const socket = socketRef.current;
    if (socket?.connected) {
      socket.emit('friend:accept', { requestId });
      return;
    }
    const request = await acceptFriendRequest(requestId);
    setIncomingRequests((prev) => prev.filter((item) => item._id !== requestId));
    const friendId =
      request.requesterId === currentUser?.userId
        ? request.addresseeId
        : request.requesterId;
    const friendUser = users.find((item) => item.id === friendId);
    if (friendUser) {
      setFriends((prev) => [friendUser, ...prev]);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    const socket = socketRef.current;
    if (socket?.connected) {
      socket.emit('friend:reject', { requestId });
      return;
    }
    await rejectFriendRequest(requestId);
    setIncomingRequests((prev) => prev.filter((item) => item._id !== requestId));
  };

  const handleDeleteFriend = async (userId: number) => {
    if (!window.confirm('确定要删除该好友吗？')) {
      return;
    }
    const socket = socketRef.current;
    if (socket?.connected) {
      socket.emit('friend:delete', { targetUserId: userId }, (response: { success: boolean }) => {
        if (response?.success) {
          setFriends((prev) => prev.filter((item) => item.id !== userId));
        }
      });
      return;
    }
    await deleteFriend(userId);
    setFriends((prev) => prev.filter((item) => item.id !== userId));
  };

  const handleSend = async () => {
    if (!activeConversation || !canSend) {
      return;
    }
    const content = input.trim();
    setInput('');
    const socket = socketRef.current;
    if (socket?.connected) {
      const localId = `local-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          _id: localId,
          conversationId: activeConversation._id,
          senderId: currentUser?.userId || null,
          role: 'user',
          content,
          createdAt: new Date().toISOString(),
        },
      ]);
      socket.emit(
        'chat:send',
        { conversationId: activeConversation._id, content },
        (response: { ok: boolean; message?: ChatMessage }) => {
          if (response?.message) {
            setMessages((prev) =>
              prev.map((item) =>
                item._id === localId ? (response.message as ChatMessage) : item,
              ),
            );
          }
        },
      );
      return;
    }
    const message = await sendMessage(activeConversation._id, content);
    setMessages((prev) => [...prev, message]);
    setConversations((prev) =>
      prev.map((conv) =>
        conv._id === activeConversation._id
          ? {
              ...conv,
              lastMessagePreview: content.slice(0, 100),
              lastMessageAt: new Date().toISOString(),
            }
          : conv,
      ),
    );
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex-1 md:p-5 theme-muted overflow-hidden">
      <div className="w-full h-full flex flex-col">
        <div className="bg-card text-card-foreground md:rounded-3xl shadow-sm md:border border-border flex-1 min-h-0 flex flex-col">
          <div className="flex-1 min-h-0 flex flex-col md:flex-row">
            <div className={cn(
              "md:w-72 border-b md:border-b-0 md:border-r border-border p-4 space-y-4 flex flex-col min-h-0 overflow-y-auto",
              activeConversation ? "hidden md:flex" : "flex"
            )}>
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Users className="w-4 h-4" />
                  好友请求
                </div>
                <div className="mt-3 space-y-2 max-h-[160px] overflow-y-auto scrollbar-hidden pr-1">
                  {incomingRequests.length === 0 ? (
                    <div className="text-xs text-muted-foreground text-center py-2">暂无请求</div>
                  ) : (
                    incomingRequests.map((request) => {
                      const requester = users.find(
                        (item) => item.id === request.requesterId,
                      );
                      return (
                        <div
                          key={request._id}
                          className="flex items-center justify-between rounded-xl border border-border px-3 py-2"
                        >
                          <div className="text-xs text-muted-foreground truncate">
                            {requester?.username || request.requesterId}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleAcceptRequest(request._id)}
                              className="text-xs text-blue-600 hover:text-blue-700"
                            >
                              接受
                            </button>
                            <button
                              onClick={() => handleRejectRequest(request._id)}
                              className="text-xs text-muted-foreground hover:text-foreground"
                            >
                              拒绝
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex flex-col min-h-0">
                <div className="flex items-center justify-between gap-2 text-sm font-semibold text-foreground">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    好友列表
                  </div>
                  <AddFriendDialog 
                    friends={friends} 
                    outgoingRequests={outgoingRequests} 
                    onAddFriend={handleSendFriendRequest}
                  />
                </div>
                <div className="mt-3 space-y-2 max-h-[160px] overflow-y-auto scrollbar-hidden pr-1">
                  {friends.length === 0 ? (
                    <div className="text-xs text-muted-foreground text-center py-2">暂无好友</div>
                  ) : (
                    friends.map((item) => (
                      <ContextMenu key={item.id}>
                        <ContextMenuTrigger asChild>
                          <div
                            className="w-full flex items-center justify-between rounded-xl px-3 py-2 text-left text-sm hover:bg-muted group active:scale-[0.98] transition-transform duration-200 touch-none select-none cursor-pointer"
                          >
                            <button
                              onClick={() => handleSelectUser(item.id)}
                              className="flex-1 flex items-center gap-2 min-w-0"
                            >
                              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center relative shrink-0 overflow-hidden border border-border">
                                {item.avatar ? (
                                  <img src={item.avatar} alt={item.username} className="w-full h-full object-cover" />
                                ) : (
                                  <User className="w-4 h-4 text-muted-foreground" />
                                )}
                                {onlineUserIds.has(item.id) && (
                                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-background rounded-full"></span>
                                )}
                              </div>
                              <div className="truncate text-left">
                                <div className="text-foreground truncate flex items-center gap-2">
                                    {item.username}
                                    {!onlineUserIds.has(item.id) && item.lastSeen && (
                                        <span className="text-[10px] text-muted-foreground font-normal">
                                            {formatChatTime(item.lastSeen)}
                                        </span>
                                    )}
                                </div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {item.email}
                                </div>
                              </div>
                            </button>
                          </div>
                        </ContextMenuTrigger>
                        <ContextMenuContent className="w-40 animate-in zoom-in-95 duration-200">
                          <ContextMenuItem 
                            onClick={() => handleDeleteFriend(item.id)}
                            className="gap-2 text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                            删除好友
                          </ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>
                    ))
                  )}
                </div>
              </div>

              <div className="flex flex-col flex-1 min-h-0">
                <div className="text-sm font-semibold text-foreground">
                  最近对话
                </div>
                <div className="mt-3 space-y-2 flex-1 overflow-y-auto scrollbar-hidden pr-1">
                  {conversations.map((conv) => {
                    // Find other participant
                    const otherId = conv.participants.find(
                      (id) => id !== currentUser?.userId,
                    );
                    const otherUser = users.find((u) => u.id === otherId);
                    const displayName = otherUser?.username || `用户 ${otherId}`;
                    const avatarChar = (displayName[0] || '?').toUpperCase();
                    const lastMessageTime = conv.lastMessageAt ? formatChatTime(conv.lastMessageAt) : '';

                    return (
                      <ContextMenu key={conv._id}>
                        <ContextMenuTrigger asChild>
                          <div
                            className={cn(
                              'w-full text-left rounded-xl p-3 transition flex items-center gap-3 group relative cursor-pointer active:scale-[0.98] transition-transform duration-200 touch-none select-none',
                              conv._id === activeConversation?._id
                                ? 'bg-blue-50'
                                : 'hover:bg-muted',
                            )}
                            onClick={() => selectConversation(conv)}
                          >
                            {/* Avatar */}
                            <div className="shrink-0 relative">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-400 to-cyan-400 p-[1px]">
                                <div className="w-full h-full rounded-[7px] bg-background flex items-center justify-center overflow-hidden">
                                  {conv.participantInfo?.avatar ? (
                                    <img src={conv.participantInfo.avatar} alt={displayName} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-br from-indigo-500 to-cyan-500">
                                      {avatarChar}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {/* Unread Badge */}
                              {conv.unreadCount !== undefined && conv.unreadCount > 0 && (
                                <div className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-background shadow-sm z-10">
                                  {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                                </div>
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                              <div className="flex items-center justify-between mb-0.5">
                                <span className={cn(
                                  "font-medium truncate text-sm",
                                  conv._id === activeConversation?._id ? "text-blue-900" : "text-foreground"
                                )}>
                                  {displayName}
                                </span>
                                <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                                  {lastMessageTime}
                                </span>
                              </div>
                              <div className={cn(
                                "truncate text-xs",
                                conv._id === activeConversation?._id ? "text-blue-700/80" : "text-muted-foreground"
                              )}>
                                {conv.lastMessagePreview || '开始新的对话'}
                              </div>
                            </div>
                          </div>
                        </ContextMenuTrigger>
                        <ContextMenuContent className="w-40 animate-in zoom-in-95 duration-200">
                          <ContextMenuItem 
                            onClick={(e) => handleDeleteConversationItem(conv._id, e as React.MouseEvent)}
                            className="gap-2 text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                            删除对话
                          </ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className={cn(
              "flex-1 min-h-0 flex flex-col",
              !activeConversation ? "hidden md:flex" : "flex"
            )}>
              {/* Mobile & Desktop Header */}
              {activeConversation && (
                <div className="flex-none flex items-center h-12 px-4 border-b border-border bg-card/95 backdrop-blur z-10">
                  <button
                    onClick={() => setActiveConversation(null)}
                    className="md:hidden mr-2 p-1 -ml-1 hover:bg-muted rounded-full"
                  >
                    <ChevronLeft className="w-5 h-5 text-foreground" />
                  </button>
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {(() => {
                      const otherId = activeConversation.participants.find((id) => id !== currentUser?.userId);
                      const otherUser = users.find((u) => u.id === otherId);
                      const displayName = otherUser?.username || activeConversation.title || `用户 ${otherId}`;
                      const isOnline = otherId ? onlineUserIds.has(otherId) : false;
                      const avatar = otherUser?.avatar || activeConversation.participantInfo?.avatar;
                      
                      return (
                        <>
                          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden border border-border shadow-sm">
                            {avatar ? (
                              <img src={avatar} alt={displayName} className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                          <span className="font-semibold truncate text-foreground flex items-center gap-1.5 text-sm md:text-base">
                            {displayName}
                            {isOnline && (
                              <span className="w-2 h-2 bg-green-500 rounded-full" title="在线" />
                            )}
                          </span>
                        </>
                      );
                    })()}
                  </div>

                  {/* RTC Call Buttons */}
                  <div className="flex items-center gap-1 md:gap-2 mr-2">
                    <button
                      onClick={() => handleStartCall('audio')}
                      className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors"
                      title="语音通话"
                    >
                      <Phone className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleStartCall('video')}
                      className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors"
                      title="视频通话"
                    >
                      <Video className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {/* Desktop Fullscreen Toggle */}
                  <button
                    onClick={toggleFullscreen}
                    className="hidden md:flex p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors"
                    title={isFullscreen ? '退出全屏' : '全屏'}
                  >
                    {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                  </button>
                </div>
              )}

              <div
                ref={listRef}
                className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 space-y-4 scrollbar-hidden"
              >
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-16 space-y-4">
                    <User className="w-12 h-12 mx-auto text-muted-foreground/60" />
                    <p>选择用户开始聊天</p>
                  </div>
                ) : (
                  messages.map((message, index) => {
                    const prevMessage = messages[index - 1];
                    const showTime =
                      !prevMessage ||
                      new Date(message.createdAt).getTime() - new Date(prevMessage.createdAt).getTime() > 5 * 60 * 1000;
                    return (
                      <div key={message._id} className="space-y-4">
                        {showTime && (
                          <div className="flex justify-center my-4">
                            <span className="text-xs text-muted-foreground/70 bg-muted/50 px-2 py-1 rounded-full">
                              {formatChatTime(message.createdAt)}
                            </span>
                          </div>
                        )}
                          <div
                            className={cn(
                              'flex items-start gap-3 group',
                              String(message.senderId) === String(currentUser?.userId) ? 'flex-row-reverse' : 'flex-row',
                            )}
                          >
                            {/* Avatar */}
                            <div className="shrink-0 mt-0.5">
                              {String(message.senderId) === String(currentUser?.userId) ? (
                                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center overflow-hidden border border-purple-200 dark:border-purple-800/50 shadow-sm">
                                  {currentUser?.avatar ? (
                                    <img src={currentUser.avatar} alt="Me" className="w-full h-full object-cover" />
                                  ) : (
                                    <User className="w-4 h-4 text-purple-600 dark:text-purple-300" />
                                  )}
                                </div>
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center overflow-hidden border border-blue-200 dark:border-blue-800/50 shadow-sm">
                                  {(() => {
                                    const otherId = activeConversation?.participants.find(id => id !== currentUser?.userId);
                                    const otherUser = users.find(u => u.id === otherId);
                                    return otherUser?.avatar ? (
                                      <img src={otherUser.avatar} alt={otherUser.username} className="w-full h-full object-cover" />
                                    ) : (
                                      <User className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                                    );
                                  })()}
                                </div>
                              )}
                            </div>

                            <ContextMenu>
                              <ContextMenuTrigger asChild>
                                <div
                                  className={cn(
                                    'max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed overflow-hidden shadow-sm cursor-default active:scale-[0.98] transition-transform duration-200 touch-none select-none',
                                    String(message.senderId) === String(currentUser?.userId)
                                      ? 'bg-[#6b6b6b] text-white rounded-tr-none'
                                      : 'bg-white dark:bg-zinc-800/80 text-gray-700 dark:text-gray-100 rounded-tl-none border border-gray-100 dark:border-zinc-700/50',
                                  )}
                                >
                                  {message.type === 'image' && message.fileUrl ? (
                                      <img src={message.fileUrl} alt="Image" className="max-w-[200px] md:max-w-[300px] h-auto rounded-lg object-contain" />
                                  ) : message.type === 'audio' && message.fileUrl ? (
                                      <WaveformPlayer src={message.fileUrl} />
                                  ) : (
                                      <span className="whitespace-pre-wrap break-words">{message.content}</span>
                                  )}
                                </div>
                              </ContextMenuTrigger>
                              <ContextMenuContent className="w-40 animate-in zoom-in-95 duration-200">
                                {message.type === 'text' && (
                                  <ContextMenuItem 
                                    onClick={() => {
                                      navigator.clipboard.writeText(message.content);
                                    }}
                                    className="gap-2"
                                  >
                                    <Copy className="w-4 h-4" />
                                    复制
                                  </ContextMenuItem>
                                )}
                                {String(message.senderId) === String(currentUser?.userId) && (
                                  <>
                                    <ContextMenuSeparator />
                                    <ContextMenuItem 
                                      onClick={() => handleDeleteMessageItem(message._id)}
                                      className="gap-2 text-destructive focus:text-destructive"
                                    >
                                      <RotateCcw className="w-4 h-4" />
                                      撤回消息
                                    </ContextMenuItem>
                                  </>
                                )}
                              </ContextMenuContent>
                            </ContextMenu>

                            <div className="w-1 md:w-4 shrink-0" />
                          </div>
                        {/* Read status - Only show for the last message from current user */}
                        {String(message.senderId) === String(currentUser?.userId) && index === messages.length - 1 && (
                          <div className="flex justify-end pr-2 -mt-3 mb-4">
                            <span className="text-[10px] text-muted-foreground">
                              {message.isRead ? (
                                <span className="text-[#f2a68d]">
                                  已读 {message.readAt ? formatChatTime(message.readAt) : ''}
                                </span>
                              ) : (
                                '未读'
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {(() => {
                const otherId = activeConversation?.participants.find((id) => id !== currentUser?.userId);
                const isFriend = otherId ? friends.some((f) => f.id === otherId) : false;

                if (activeConversation && !isFriend) {
                  return (
                    <div className="flex-none p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-card z-10 text-center text-muted-foreground text-sm border-t border-border">
                      您已经不是对方的好友无法发信息
                    </div>
                  );
                }

                return (
                  <div className="flex-none border-t border-border p-4 pb-0 md:pb-[calc(1rem+env(safe-area-inset-bottom))] bg-card z-10">
                    <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                    />

                    {isRecording ? (
                        <div className="flex items-center gap-3 h-12 bg-red-50 dark:bg-red-950/20 rounded-2xl px-4 animate-in fade-in border border-red-100 dark:border-red-900/30">
                            <div className="flex-1 flex items-center gap-3 min-w-0">
                              <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                              {mediaStream && <div className="flex-1 min-w-0 h-8"><AudioVisualizer stream={mediaStream} /></div>}
                              <span className="font-mono text-red-600 dark:text-red-400 font-medium shrink-0">
                                  {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button onClick={handleCancelRecording} className="p-2 text-muted-foreground hover:text-foreground transition-colors" title="取消">
                                  <X className="w-5 h-5" />
                              </button>
                              <button onClick={handleStopRecording} className="p-2 text-red-600 bg-red-100 dark:bg-red-900/40 rounded-full hover:bg-red-200 transition-colors" title="发送">
                                  <Send className="w-5 h-5" />
                              </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-end gap-2">
                          <button 
                            onClick={handleImageClick}
                            className="p-3 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors shrink-0"
                            title="发送图片"
                            disabled={!activeConversation}
                          >
                            <ImageIcon className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={handleStartRecording}
                            className="p-3 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors shrink-0"
                            title="发送语音"
                            disabled={!activeConversation}
                          >
                            <Mic className="w-5 h-5" />
                          </button>

                          <textarea
                            value={input}
                            onChange={(event) => setInput(event.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="输入消息..."
                            className="flex-1 resize-none rounded-2xl border border-input bg-background px-4 py-3 text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring scrollbar-hidden"
                            rows={1}
                            style={{ minHeight: '48px', maxHeight: '120px' }}
                            disabled={!activeConversation}
                          />
                          <button
                            onClick={handleSend}
                            disabled={!canSend || !activeConversation}
                            className={cn(
                              'h-12 w-12 rounded-2xl flex items-center justify-center transition shrink-0',
                              canSend && activeConversation
                                ? 'bg-[#6b6b6b] text-white shadow-md hover:shadow-lg'
                                : 'bg-muted text-muted-foreground cursor-not-allowed',
                            )}
                          >
                            <Send className="w-5 h-5" />
                          </button>
                        </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* RTC Call Overlay */}
      {isJoined && (
        <RtcCallOverlay
          isJoined={isJoined}
          mode={rtcMode}
          localAudioTrack={localAudioTrack}
          localVideoTrack={localVideoTrack}
          remoteUsers={remoteUsers}
          otherUserName={(() => {
            const otherId = activeConversation?.participants.find(id => id !== currentUser?.userId);
            const otherUser = users.find(u => u.id === otherId);
            return otherUser?.username;
          })()}
          otherUserAvatar={(() => {
            const otherId = activeConversation?.participants.find(id => id !== currentUser?.userId);
            const otherUser = users.find(u => u.id === otherId);
            return otherUser?.avatar;
          })()}
          onLeave={handleLeaveCall}
          onToggleAudio={toggleAudio}
          onToggleVideo={toggleVideo}
          setLocalVideoPlayer={setLocalVideoPlayer}
          setRemoteVideoPlayer={setRemoteVideoPlayer}
        />
      )}
      <OutgoingCallModal
        open={!!pendingOutgoingCall && !isJoined}
        calleeName={(() => {
          if (!pendingOutgoingCall) return undefined;
          const target = users.find((u) => u.id === pendingOutgoingCall.targetUserId);
          return target?.username;
        })()}
        calleeAvatar={(() => {
          if (!pendingOutgoingCall) return undefined;
          const target = users.find((u) => u.id === pendingOutgoingCall.targetUserId);
          return target?.avatar;
        })()}
        mode={pendingOutgoingCall?.mode || 'audio'}
        onCancel={handleCancelOutgoingCall}
      />
      <IncomingCallModal
        open={!!incomingCall}
        callerName={incomingCall?.callerName}
        callerAvatar={(() => {
          if (!incomingCall) return undefined;
          const caller = users.find((u) => u.id === incomingCall.callerId);
          return caller?.avatar;
        })()}
        mode={incomingCall?.mode || 'audio'}
        onAccept={handleAcceptIncomingCall}
        onReject={handleRejectIncomingCall}
      />
    </div>
  );
}
