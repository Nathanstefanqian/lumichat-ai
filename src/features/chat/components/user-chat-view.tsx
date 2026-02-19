import { useEffect, useMemo, useRef, useState } from 'react';
import { Send, User, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth';
import { useSocketStore } from '@/stores/socket';
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
  type ChatConversation,
  type ChatMessage,
  type FriendRequest,
} from '@/features/chat/api/chat';
import { createChatSocket, type ChatSocket } from '@/features/chat/api/socket';

interface UserItem {
  id: number;
  username: string;
  email: string;
}

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
  const socketRef = useRef<ChatSocket | null>(null);
  const usersRef = useRef<UserItem[]>([]);
  const activeConversationRef = useRef<string | null>(null);
  const setSocketStatus = useSocketStore((state) => state.setStatus);
  const setSocketLastEvent = useSocketStore((state) => state.setLastEvent);

  const selectConversation = async (conversation: ChatConversation) => {
    setActiveConversation(conversation);
    const list = await fetchMessages(conversation._id);
    setMessages(list);
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
        userList.filter((item) => item.id !== (currentUser?.userId || -1)),
      );
      setConversations(convoList);
      setFriends(friendList);
      setIncomingRequests(requests.incoming);
      setOutgoingRequests(requests.outgoing);
      usersRef.current = userList;
      if (convoList.length > 0) {
        await selectConversation(convoList[0]);
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
    if (!currentUser?.userId) {
      return;
    }
    const token = useAuthStore.getState().token;
    const socket = createChatSocket(token);
    socketRef.current = socket;
    setSocketStatus('connecting');

    socket.on('connect', () => {
      setSocketStatus('connected');
    });

    socket.on('disconnect', () => {
      setSocketStatus('disconnected');
    });

    socket.on('connect_error', () => {
      setSocketStatus('error');
    });

    socket.on('chat:message', (payload: { conversationId: string; message: ChatMessage; conversation: ChatConversation }) => {
      setSocketLastEvent('chat:message');
      setConversations((prev) => {
        const exists = prev.find((conv) => conv._id === payload.conversationId);
        if (exists) {
          return prev.map((conv) =>
            conv._id === payload.conversationId
              ? {
                  ...conv,
                  lastMessagePreview: payload.message.content.slice(0, 100),
                  lastMessageAt: payload.message.createdAt,
                }
              : conv,
          );
        }
        return [
          {
            ...payload.conversation,
            lastMessagePreview: payload.message.content.slice(0, 100),
            lastMessageAt: payload.message.createdAt,
          },
          ...prev,
        ];
      });

      if (activeConversationRef.current === payload.conversationId) {
        setMessages((prev) => [...prev, payload.message]);
      }
    });

    socket.on('friend:request', (request: FriendRequest) => {
      setSocketLastEvent('friend:request');
      setIncomingRequests((prev) => [request, ...prev]);
    });
    socket.on('friend:request:sent', (request: FriendRequest) => {
      setSocketLastEvent('friend:request:sent');
      setOutgoingRequests((prev) => [request, ...prev]);
    });
    socket.on('friend:accepted', (request: FriendRequest) => {
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
    });
    socket.on('friend:rejected', (request: FriendRequest) => {
      setSocketLastEvent('friend:rejected');
      setIncomingRequests((prev) => prev.filter((item) => item._id !== request._id));
      setOutgoingRequests((prev) => prev.filter((item) => item._id !== request._id));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [currentUser?.userId, setSocketLastEvent, setSocketStatus]);

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
    <div className="flex-1 p-3 md:p-5 theme-muted h-screen overflow-hidden">
      <div className="w-full h-full flex flex-col">
        <div className="bg-card text-card-foreground rounded-3xl shadow-sm border border-border flex-1 min-h-0 flex flex-col">
          <div className="flex-1 min-h-0 flex flex-col md:flex-row">
            <div className="md:w-72 border-b md:border-b-0 md:border-r border-border p-4 space-y-4">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Users className="w-4 h-4" />
                  好友请求
                </div>
                <div className="mt-3 space-y-2 max-h-[160px] overflow-y-auto scrollbar-hidden pr-1">
                  {incomingRequests.length === 0 ? (
                    <div className="text-xs text-muted-foreground">暂无请求</div>
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

              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Users className="w-4 h-4" />
                  好友列表
                </div>
                <div className="mt-3 space-y-2 max-h-[160px] overflow-y-auto scrollbar-hidden pr-1">
                  {friends.length === 0 ? (
                    <div className="text-xs text-muted-foreground">暂无好友</div>
                  ) : (
                    friends.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleSelectUser(item.id)}
                        className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-muted"
                      >
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <User className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="truncate">
                          <div className="text-foreground">{item.username}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {item.email}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Users className="w-4 h-4" />
                  用户列表
                </div>
                <div className="mt-3 space-y-2 max-h-[200px] overflow-y-auto scrollbar-hidden pr-1">
                  {users.map((item) => {
                    const isFriend = friends.some((friend) => friend.id === item.id);
                    const pendingOutgoing = outgoingRequests.some(
                      (req) => req.addresseeId === item.id,
                    );
                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-xl px-3 py-2 text-left text-sm hover:bg-muted"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            <User className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div className="truncate">
                            <div className="text-foreground">{item.username}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {item.email}
                            </div>
                          </div>
                        </div>
                        <div>
                          {isFriend ? (
                            <span className="text-xs text-green-600">已添加</span>
                          ) : pendingOutgoing ? (
                            <span className="text-xs text-muted-foreground">待确认</span>
                          ) : (
                            <button
                              onClick={() => handleSendFriendRequest(item.id)}
                              className="text-xs text-blue-600 hover:text-blue-700"
                            >
                              添加
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold text-foreground">
                  最近对话
                </div>
                <div className="mt-3 space-y-2 max-h-[160px] overflow-y-auto scrollbar-hidden pr-1">
                  {conversations.map((conv) => (
                    <button
                      key={conv._id}
                      onClick={() => selectConversation(conv)}
                      className={cn(
                        'w-full text-left rounded-xl px-3 py-2 text-sm transition',
                        conv._id === activeConversation?._id
                          ? 'bg-blue-50 text-blue-700'
                          : 'hover:bg-muted text-muted-foreground',
                      )}
                    >
                      <div className="truncate">
                        {conv.lastMessagePreview || '新的对话'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex-1 min-h-0 flex flex-col">
              <div
                ref={listRef}
                className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4 scrollbar-hidden"
              >
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-16 space-y-4">
                    <User className="w-12 h-12 mx-auto text-muted-foreground/60" />
                    <p>选择用户开始聊天</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message._id}
                      className={cn(
                        'flex items-start gap-3',
                        message.senderId === currentUser?.userId
                          ? 'justify-end'
                          : 'justify-start',
                      )}
                    >
                      <div
                        className={cn(
                          'max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                          message.senderId === currentUser?.userId
                            ? 'bg-blue-600 text-white rounded-br-md'
                            : 'bg-gray-50 text-gray-700 rounded-bl-md',
                        )}
                      >
                        <span className="whitespace-pre-wrap">
                          {message.content}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-border p-4">
                <div className="flex items-end gap-3">
                  <textarea
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="输入消息..."
                    className="flex-1 resize-none rounded-2xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                    rows={2}
                    disabled={!activeConversation}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!canSend || !activeConversation}
                    className={cn(
                      'h-12 w-12 rounded-2xl flex items-center justify-center transition',
                      canSend && activeConversation
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed',
                    )}
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
