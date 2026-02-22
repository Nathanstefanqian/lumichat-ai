import { create } from 'zustand';
import { io, type Socket } from 'socket.io-client';

export type SocketStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

interface SocketState {
  socket: Socket | null;
  status: SocketStatus;
  lastEvent: string | null;
  lastUpdatedAt: number | null;
  connect: (token: string) => void;
  disconnect: () => void;
  setStatus: (status: SocketStatus) => void;
  setLastEvent: (event: string) => void;
}

const resolveSocketUrl = () => {
  const isDev = import.meta.env.DEV;
  const base = import.meta.env.VITE_API_URL || '';
  
  // FORCE localhost:3000 in development mode to bypass Vite proxy completely
  if (isDev && !base) {
    return 'http://127.0.0.1:3000';
  }

  if (!base) {
    return window.location.origin;
  }
  return base.endsWith('/api') ? base.replace(/\/api$/, '') : base;
};

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  status: 'disconnected',
  lastEvent: null,
  lastUpdatedAt: null,
  
  connect: (token: string) => {
    // Prevent multiple connection attempts
    const current = get();
    if (current.status === 'connecting' || current.status === 'connected') {
      return;
    }
    
    set({ status: 'connecting' });
    
    // Cleanup previous socket if exists
    if (get().socket) {
      get().socket?.disconnect();
    }

    const url = resolveSocketUrl();
    console.log('[GlobalSocket] Connecting to:', url);

    const socket = io(url, {
      auth: { token },
      transports: ['websocket', 'polling'], // Try websocket first
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    set({ socket, status: 'connecting' });

    socket.on('connect', () => {
      set({ status: 'connected', lastUpdatedAt: Date.now() });
    });

    socket.on('disconnect', () => {
      set({ status: 'disconnected', lastUpdatedAt: Date.now() });
    });

    socket.on('connect_error', () => {
      set({ status: 'error', lastUpdatedAt: Date.now() });
    });

    // Listen to any event to update lastEvent
    socket.onAny((event) => {
      set({ lastEvent: event, lastUpdatedAt: Date.now() });
    });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
    }
    set({ socket: null, status: 'disconnected' });
  },

  setStatus: (status) => set({ status, lastUpdatedAt: Date.now() }),
  setLastEvent: (event) => set({ lastEvent: event, lastUpdatedAt: Date.now() }),
}));
