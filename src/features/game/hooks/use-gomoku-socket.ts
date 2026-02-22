import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth';

const resolveSocketUrl = () => {
  const isDev = import.meta.env.DEV;
  const base = import.meta.env.VITE_API_URL || '';
  if (isDev && !base) return 'http://127.0.0.1:3000';
  if (!base) return window.location.origin;
  return base.endsWith('/api') ? base.replace(/\/api$/, '') : base;
};

export interface GameRoom {
  roomId: string;
  players: { id: string; userId: number; username: string; color?: 'black' | 'white' }[];
  spectators: { id: string; userId: number; username: string }[];
  board: (string | null)[][];
  currentTurn: 'black' | 'white';
  winner: 'black' | 'white' | 'draw' | null;
  status: 'waiting' | 'playing' | 'finished';
}

export function useGomokuSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [gameState, setGameState] = useState<GameRoom | null>(null);
  const [error, setError] = useState<string | null>(null);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    if (!token) return;

    const url = resolveSocketUrl();
    const socket = io(`${url}/gomoku`, {
      auth: { token },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to Gomoku socket');
      setIsConnected(true);
      setError(null);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from Gomoku socket');
      setIsConnected(false);
    });

    socket.on('game_state', (state: GameRoom) => {
      setGameState(state);
      setError(null);
    });
    
    socket.on('error', (err: { message: string }) => {
        console.error('Socket error:', err);
        setError(err.message);
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  const createRoom = () => {
    if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('create_room');
    }
  };

  const joinRoom = (roomId: string) => {
    if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('join_room', { roomId });
    }
  };

  const joinGame = (roomId: string) => {
    if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('join_game', { roomId });
    }
  };

  const makeMove = (x: number, y: number, roomId: string) => {
    if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('make_move', { roomId, x, y });
    }
  };

  const restartGame = (roomId: string) => {
    if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('restart_game', { roomId });
    }
  };
  
  const leaveGame = (roomId: string) => {
    if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('leave_room', { roomId });
        setGameState(null);
        setError(null);
    }
  }

  return { 
      isConnected, 
      gameState, 
      error,
      createRoom,
      joinRoom,
      joinGame,
      makeMove, 
      restartGame, 
      leaveGame 
  };
}
