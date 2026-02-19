import { io, type Socket } from 'socket.io-client';

const resolveSocketUrl = () => {
  const base = import.meta.env.VITE_API_URL || '';
  if (!base) {
    return window.location.origin;
  }
  return base.endsWith('/api') ? base.replace(/\/api$/, '') : base;
};

export const createChatSocket = (token: string | null) => {
  return io(resolveSocketUrl(), {
    auth: token ? { token } : undefined,
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
  });
};

export type ChatSocket = Socket;
