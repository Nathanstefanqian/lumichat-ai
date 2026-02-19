import { create } from 'zustand';

export type SocketStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

interface SocketState {
  status: SocketStatus;
  lastEvent: string | null;
  lastUpdatedAt: number | null;
  setStatus: (status: SocketStatus) => void;
  setLastEvent: (event: string) => void;
}

export const useSocketStore = create<SocketState>((set) => ({
  status: 'disconnected',
  lastEvent: null,
  lastUpdatedAt: null,
  setStatus: (status) => set({ status, lastUpdatedAt: Date.now() }),
  setLastEvent: (event) => set({ lastEvent: event, lastUpdatedAt: Date.now() }),
}));
