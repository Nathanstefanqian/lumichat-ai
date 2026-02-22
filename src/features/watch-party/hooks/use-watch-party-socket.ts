
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth';

export interface RoomState {
  roomId: string;
  hostId: string;
  hostName: string;
  videoUrl: string;
  isPlaying: boolean;
  currentTime: number;
  lastUpdated: number;
  members: { id: string; name: string }[];
}

export function useWatchPartySocket() {
  const socketRef = useRef<Socket | null>(null);
  const [room, setRoom] = useState<RoomState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<{ userId: string; userName: string; message: string }[]>([]);
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!token || !user) return;

    // In development, connect directly to the backend to avoid Vite proxy issues with WebSockets
    const isDev = import.meta.env.DEV;
    let url = import.meta.env.VITE_API_URL || window.location.origin;
    
    if (url.endsWith('/api')) {
        url = url.replace(/\/api$/, '');
    }

    // FORCE localhost:3000 in development mode to bypass Vite proxy completely
    if (isDev) {
        url = 'http://127.0.0.1:3000';
    }
    
    console.log('Environment:', { isDev, VITE_API_URL: import.meta.env.VITE_API_URL });
    console.log('Connecting to WatchParty Socket at:', url);

    // Manually connect to namespace if needed, or use the namespace in URL
    // Socket.io client: io(url) where url includes namespace
    // But if we use options, it's safer to just use the namespace URL
    socketRef.current = io(`${url}/watch-party`, {
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      auth: { token },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('Connected to watch-party namespace');
      setError(null);
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('Connection error:', err);
      setError('无法连接到服务器');
      setIsConnected(false);
    });

    socket.on('room_created', (data: RoomState) => {
      setRoom(data);
      setMessages([]);
    });

    socket.on('room_joined', (data: RoomState) => {
      setRoom(data);
      setMessages([]);
    });

    socket.on('user_joined', (data: { userId: string; userName: string; members: { id: string; name: string }[] }) => {
        setRoom((prev) => {
            if (!prev) return null;
            return { ...prev, members: data.members };
        });
        // Optional: add system message
    });

    socket.on('user_left', (data: { userId: string }) => {
        setRoom((prev) => {
            if (!prev) return null;
            return {
                ...prev,
                members: prev.members.filter(m => m.id !== data.userId)
            };
        });
    });

    socket.on('state_updated', (state: Partial<RoomState>) => {
      setRoom((prev) => {
        if (!prev) return null;
        return { ...prev, ...state };
      });
    });
    
    socket.on('sync_response', (state: Partial<RoomState>) => {
        setRoom((prev) => {
            if (!prev) return null;
            return { ...prev, ...state };
        });
    });

    socket.on('new_message', (data: { userId: string, userName: string, message: string }) => {
        setMessages(prev => [...prev, data]);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, user?.userId]);

  const createRoom = () => {
    if (!socketRef.current || !user) return;
    socketRef.current.emit('create_room', { hostId: String(user.userId), hostName: user.username });
  };

  const joinRoom = (roomId: string) => {
    if (!socketRef.current || !user) return;
    socketRef.current.emit('join_room', { roomId, userId: String(user.userId), userName: user.username });
  };

  const updateState = (state: { isPlaying?: boolean; currentTime?: number; videoUrl?: string }) => {
    if (!socketRef.current || !room || !user) return;
    // Optimistic update
    setRoom((prev) => prev ? { ...prev, ...state } : null);
    
    socketRef.current.emit('update_state', {
      roomId: room.roomId,
      userId: String(user.userId),
      state,
    });
  };
  
  const sendMessage = (message: string) => {
    if (!socketRef.current || !room || !user) return;
    socketRef.current.emit('send_message', {
      roomId: room.roomId,
      userId: String(user.userId),
      userName: user.username,
      message,
    });
  };

  const leaveRoom = () => {
    if (!socketRef.current || !room) return;
    socketRef.current.emit('leave_room', { roomId: room.roomId });
    setRoom(null);
    setMessages([]);
  };

  return {
    isConnected,
    room,
    messages,
    error,
    createRoom,
    joinRoom,
    updateState,
    sendMessage,
    leaveRoom,
    user,
  };
}
