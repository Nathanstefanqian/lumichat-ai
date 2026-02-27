import { useEffect, useMemo, useRef, useState } from 'react';
import { Send, User, Users, ChevronLeft, Trash2, Image as ImageIcon, Mic, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth';
import { useSocketStore } from '@/stores/socket';
import { useUserChatStore } from '@/stores/user-chat';
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

  useEffect(() => {
    const total = conversations.reduce((acc, conv) => acc + (conv.unreadCount || 0), 0);
    setUnreadTotal(total);
  }, [conversations, setUnreadTotal]);
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
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

    socket.on('chat:message', handleMessage);
    socket.on('friend:request', handleFriendRequest);
    socket.on('friend:request:sent', handleFriendRequestSent);
    socket.on('friend:accepted', handleFriendAccepted);
    socket.on('friend:rejected', handleFriendRejected);
    socket.on('friend:deleted', handleFriendDeleted);
    socket.on('user:online', handleUserOnline);
    socket.on('user:offline', handleUserOffline);
    socket.on('users:online:list', handleOnlineList);

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
    };
  }, [currentUser?.userId, socket, setSocketLastEvent]);

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
                      <div
                        key={item.id}
                        className="w-full flex items-center justify-between rounded-xl px-3 py-2 text-left text-sm hover:bg-muted group"
                      >
                        <button
                          onClick={() => handleSelectUser(item.id)}
                          className="flex-1 flex items-center gap-2 min-w-0"
                        >
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center relative shrink-0 overflow-hidden">
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
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFriend(item.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-background text-muted-foreground hover:text-destructive transition-all ml-2"
                          title="删除好友"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
                      <div
                        key={conv._id}
                        className={cn(
                          'w-full text-left rounded-xl p-3 transition flex items-center gap-3 group relative cursor-pointer',
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

                        <button
                          onClick={(e) => handleDeleteConversationItem(conv._id, e)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 rounded-md bg-background/80 hover:bg-destructive hover:text-destructive-foreground text-muted-foreground transition-all shadow-sm"
                          title="删除对话"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
                  <span className="font-semibold truncate text-foreground flex items-center gap-2 text-sm md:text-base">
                    {(() => {
                      const otherId = activeConversation.participants.find((id) => id !== currentUser?.userId);
                      const otherUser = users.find((u) => u.id === otherId);
                      const displayName = otherUser?.username || activeConversation.title || `用户 ${otherId}`;
                      const isOnline = otherId ? onlineUserIds.has(otherId) : false;
                      
                      return (
                        <>
                          {displayName}
                          {isOnline && (
                            <span className="w-2 h-2 bg-green-500 rounded-full" title="在线" />
                          )}
                        </>
                      );
                    })()}
                  </span>
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
                            'flex items-start gap-2 group',
                            String(message.senderId) === String(currentUser?.userId) ? 'justify-end' : 'justify-start',
                          )}
                        >
                          {/* Delete Button (Left side for user messages) */}
                          {String(message.senderId) === String(currentUser?.userId) && (
                              <button 
                                  onClick={() => handleDeleteMessageItem(message._id)}
                                  className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-destructive transition-opacity self-center"
                                  title="撤回消息"
                              >
                                  <Trash2 className="w-4 h-4" />
                              </button>
                          )}

                          <div
                            className={cn(
                              'max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed overflow-hidden',
                              String(message.senderId) === String(currentUser?.userId)
                                ? 'bg-blue-600 text-white rounded-br-md'
                                : 'bg-gray-50 text-gray-700 rounded-bl-md',
                            )}
                          >
                            {message.type === 'image' && message.fileUrl ? (
                                <img src={message.fileUrl} alt="Image" className="max-w-[200px] md:max-w-[300px] h-auto rounded-lg object-contain" />
                            ) : message.type === 'audio' && message.fileUrl ? (
                                <audio controls src={message.fileUrl} className="max-w-[200px] md:max-w-[240px] h-8" />
                            ) : (
                                <span className="whitespace-pre-wrap break-words">{message.content}</span>
                            )}
                          </div>
                        </div>
                        {/* Read status - Only show for the last message from current user */}
                        {String(message.senderId) === String(currentUser?.userId) && index === messages.length - 1 && (
                          <div className="flex justify-end pr-2 -mt-3 mb-4">
                            <span className="text-[10px] text-muted-foreground">
                              {message.isRead ? (
                                <span className="text-blue-500">
                                  已读 {message.readAt ? new Date(message.readAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : ''}
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
                  <div className="flex-none border-t border-border p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-card z-10">
                    <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                    />

                    {isRecording ? (
                        <div className="flex items-center gap-3 h-12 bg-red-50 rounded-2xl px-4 animate-in fade-in">
                            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                            <span className="flex-1 font-mono text-red-600 font-medium">
                                {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                            </span>
                            <button onClick={handleCancelRecording} className="p-2 text-muted-foreground hover:text-foreground" title="取消">
                                <X className="w-5 h-5" />
                            </button>
                            <button onClick={handleStopRecording} className="p-2 text-red-600 bg-red-100 rounded-full hover:bg-red-200" title="发送">
                                <Send className="w-5 h-5" />
                            </button>
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
                                ? 'bg-primary text-primary-foreground shadow-md hover:shadow-lg'
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
    </div>
  );
}
