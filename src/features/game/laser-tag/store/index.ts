/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth';

export type GameState = 'menu' | 'playing' | 'gameover';
export type EntityState = 'active' | 'disabled';
export type MapType = 'neon' | 'desert' | 'snow' | 'office';

export interface EnemyData {
  id: string;
  position: [number, number, number];
  state: EntityState;
  disabledUntil: number;
}

export interface PlayerData {
  id: string;
  name: string;
  position: [number, number, number];
  rotation: number;
  state: EntityState;
  disabledUntil: number;
  score: number;
  color: string;
  avatar?: string;
  room?: string;
}

export interface LaserData {
  id: string;
  start: [number, number, number];
  end: [number, number, number];
  timestamp: number;
  color: string;
}

export interface ParticleData {
  id: string;
  position: [number, number, number];
  timestamp: number;
  color: string;
}

export interface GameEvent {
  id: string;
  message: string;
  timestamp: number;
}

interface GameStore {
  gameState: GameState;
  score: number;
  timeLeft: number;
  playerState: EntityState;
  playerDisabledUntil: number;
  enemies: EnemyData[];
  lasers: LaserData[];
  particles: ParticleData[];
  events: GameEvent[];
  
  // Multiplayer
  socket: Socket | null;
  otherPlayers: Record<string, PlayerData>;
  roomId: string;
  mapType: MapType;

  startGame: (roomId?: string, mapType?: MapType) => void;
  endGame: () => void;
  leaveGame: () => void;
  updateTime: (delta: number) => void;
  hitPlayer: () => void;
  hitEnemy: (id: string, byPlayer?: boolean) => void;
  addLaser: (start: [number, number, number], end: [number, number, number], color: string) => void;
  addParticles: (position: [number, number, number], color: string) => void;
  addEvent: (message: string) => void;
  updateEnemies: (time: number) => void;
  cleanupEffects: (time: number) => void;
  setPlayerState: (state: EntityState) => void;
  
  // Multiplayer actions
  updatePlayerPosition: (position: [number, number, number], rotation: number) => void;

  // Mobile Controls
  mobileInput: {
    move: { x: number, y: number };
    look: { x: number, y: number };
    shooting: boolean;
  };
  setMobileInput: (input: Partial<{
    move: { x: number, y: number };
    look: { x: number, y: number };
    shooting: boolean;
  }>) => void;
}

const INITIAL_ENEMIES: EnemyData[] = [
  { id: 'bot-1', position: [40, 1, 40], state: 'active', disabledUntil: 0 },
  { id: 'bot-2', position: [-40, 1, 40], state: 'active', disabledUntil: 0 },
  { id: 'bot-3', position: [40, 1, -40], state: 'active', disabledUntil: 0 },
  { id: 'bot-4', position: [-40, 1, -40], state: 'active', disabledUntil: 0 },
  { id: 'bot-5', position: [0, 1, -50], state: 'active', disabledUntil: 0 },
  { id: 'bot-6', position: [60, 1, 0], state: 'active', disabledUntil: 0 },
  { id: 'bot-7', position: [-60, 1, 0], state: 'active', disabledUntil: 0 },
  { id: 'bot-8', position: [0, 1, 50], state: 'active', disabledUntil: 0 },
];

const resolveSocketUrl = () => {
  const isDev = import.meta.env.DEV;
  const base = import.meta.env.VITE_API_URL || '';
  
  if (isDev && !base) {
    return 'http://127.0.0.1:3000/laser-tag';
  }

  const origin = base ? (base.endsWith('/api') ? base.replace(/\/api$/, '') : base) : window.location.origin;
  return `${origin}/laser-tag`;
};

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: 'menu',
  score: 0,
  timeLeft: 120, // 2 minutes
  playerState: 'active',
  playerDisabledUntil: 0,
  enemies: [],
  lasers: [],
  particles: [],
  events: [],
  
  socket: null,
  otherPlayers: {},
  roomId: 'default',
  mapType: 'neon',

  mobileInput: {
    move: { x: 0, y: 0 },
    look: { x: 0, y: 0 },
    shooting: false
  },

  setMobileInput: (input) => set((state) => ({
    mobileInput: { ...state.mobileInput, ...input }
  })),

  startGame: (roomId = 'default', mapType = 'neon') => {
    const { socket } = get();
    const token = useAuthStore.getState().token;
    
    if (socket) {
      socket.disconnect();
    }

    const url = resolveSocketUrl();
    const newSocket = io(url, {
      auth: { token },
      transports: ['websocket'],
    });
    
    newSocket.on('connect', () => {
      console.log('[LaserTag] Socket connected:', newSocket.id);
      newSocket.emit('joinGame', { roomId, mapType });
    });

    newSocket.on('gameError', (msg: string) => {
      console.error('[LaserTag] Game error:', msg);
      alert(msg);
      get().leaveGame();
    });

    newSocket.on('gameJoined', (data: { players: Record<string, PlayerData>, mapType: MapType }) => {
      console.log('[LaserTag] Game joined:', data);
      const otherPlayers = { ...data.players };
      delete otherPlayers[newSocket.id!];
      set({ 
        otherPlayers,
        gameState: 'playing',
        timeLeft: 120,
        score: 0,
        roomId,
        mapType: data.mapType,
        enemies: INITIAL_ENEMIES.map(e => ({ ...e, state: 'active', disabledUntil: 0 }))
      });
    });

    newSocket.on('playerJoined', (player: PlayerData) => {
      console.log('[LaserTag] Player joined:', player);
      set(state => ({
        otherPlayers: { ...state.otherPlayers, [player.id]: player },
        events: [...state.events, { id: Math.random().toString(), message: `${player.name} joined`, timestamp: Date.now() }]
      }));
    });

    newSocket.on('playerMoved', (data: { id: string, position: [number, number, number], rotation: number }) => {
      // console.log('[LaserTag] Player moved:', data.id);
      set(state => {
        if (!state.otherPlayers[data.id]) return state;
        return {
          otherPlayers: {
            ...state.otherPlayers,
            [data.id]: {
              ...state.otherPlayers[data.id],
              position: data.position,
              rotation: data.rotation
            }
          }
        };
      });
    });

    newSocket.on('playerShot', (data: { id: string, start: [number, number, number], end: [number, number, number], color: string }) => {
      set(state => ({
        lasers: [...state.lasers, { id: Math.random().toString(36).substring(2, 9), start: data.start, end: data.end, timestamp: Date.now(), color: data.color }],
        particles: [...state.particles, { id: Math.random().toString(36).substring(2, 9), position: data.end, timestamp: Date.now(), color: data.color }]
      }));
    });

    newSocket.on('playerHit', (data: { targetId: string, shooterId: string, targetDisabledUntil: number, shooterScore: number }) => {
      set(state => {
        const now = Date.now();
        const isLocalShooter = data.shooterId === newSocket.id;
        const isLocalTarget = data.targetId === newSocket.id;
        
        const shooterName = isLocalShooter ? 'You' : (state.otherPlayers[data.shooterId]?.name || 'Unknown');
        const targetName = isLocalTarget ? 'You' : (state.otherPlayers[data.targetId]?.name || 'Unknown');
        const eventMsg = `${shooterName} tagged ${targetName}`;
        const newEvent = { id: Math.random().toString(), message: eventMsg, timestamp: now };

        const newState: Partial<GameStore> = {
          events: [...state.events, newEvent]
        };

        if (isLocalTarget) {
          newState.playerState = 'disabled';
          newState.playerDisabledUntil = data.targetDisabledUntil;
        }

        if (isLocalShooter) {
          newState.score = data.shooterScore;
        }

        const players = { ...state.otherPlayers };
        let playersChanged = false;

        if (!isLocalTarget && players[data.targetId]) {
          players[data.targetId] = {
            ...players[data.targetId],
            state: 'disabled',
            disabledUntil: data.targetDisabledUntil
          };
          playersChanged = true;
        }

        if (!isLocalShooter && players[data.shooterId]) {
          players[data.shooterId] = {
            ...players[data.shooterId],
            score: data.shooterScore
          };
          playersChanged = true;
        }

        if (playersChanged) {
          newState.otherPlayers = players;
        }

        return newState;
      });
    });

    newSocket.on('playerLeft', (id: string) => {
      set(state => {
        const players = { ...state.otherPlayers };
        const playerName = players[id]?.name || 'Unknown';
        delete players[id];
        return { 
          otherPlayers: players,
          events: [...state.events, { id: Math.random().toString(), message: `${playerName} left`, timestamp: Date.now() }]
        };
      });
    });

    set({
      gameState: 'playing',
      score: 0,
      timeLeft: 120,
      playerState: 'active',
      playerDisabledUntil: 0,
      roomId,
      mapType,
      enemies: INITIAL_ENEMIES.map(e => ({ ...e, state: 'active', disabledUntil: 0 })),
      lasers: [],
      particles: [],
      events: [],
      socket: newSocket,
      otherPlayers: {},
    });
  },

  endGame: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
    }
    set({ gameState: 'gameover', socket: null });
  },

  leaveGame: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
    }
    set({
      gameState: 'menu',
      socket: null,
      otherPlayers: {},
      enemies: [],
      lasers: [],
      particles: [],
      events: [],
      score: 0,
      timeLeft: 120,
      playerState: 'active',
      roomId: 'default',
      mapType: 'neon'
    });
  },

  updateTime: (delta) => set((state) => {
    if (state.gameState !== 'playing') return state;
    const newTime = state.timeLeft - delta;
    if (newTime <= 0) {
      if (state.socket) state.socket.disconnect();
      return { timeLeft: 0, gameState: 'gameover', socket: null };
    }
    return { timeLeft: newTime };
  }),

  hitPlayer: () => set((state) => {
    if (state.playerState === 'disabled' || state.gameState !== 'playing') return state;
    return {
      playerState: 'disabled',
      playerDisabledUntil: Date.now() + 3000,
      score: Math.max(0, state.score - 50),
    };
  }),

  hitEnemy: (id, byPlayer = false) => set((state) => {
    if (state.gameState !== 'playing') return state;
    
    if (state.socket && state.otherPlayers[id]) {
      state.socket.emit('hitPlayer', id);
      return state;
    }

    const enemies = state.enemies.map(e => {
      if (e.id === id && e.state === 'active') {
        // AI robot "killed" logic: disappear for 5 seconds
        return { ...e, state: 'disabled' as EntityState, disabledUntil: Date.now() + 5000 };
      }
      return e;
    });
    return {
      enemies,
      score: byPlayer ? state.score + 100 : state.score,
      events: byPlayer ? [...state.events, { id: Math.random().toString(), message: `Bot ${id.split('-')[1]} Terminated`, timestamp: Date.now() }] : state.events
    };
  }),

  addLaser: (start, end, color) => {
    const { socket } = get();
    if (socket) {
      socket.emit('shoot', { start, end, color });
    }
    set((state) => ({
      lasers: [...state.lasers, { id: Math.random().toString(36).substring(2, 9), start, end, timestamp: Date.now(), color }]
    }));
  },

  addParticles: (position, color) => set((state) => ({
    particles: [...state.particles, { id: Math.random().toString(36).substring(2, 9), position, timestamp: Date.now(), color }]
  })),

  addEvent: (message) => set((state) => ({
    events: [...state.events, { id: Math.random().toString(), message, timestamp: Date.now() }]
  })),

  updateEnemies: (time) => set((state) => {
    let changed = false;
    const enemies = state.enemies.map(e => {
      if (e.state === 'disabled' && time > e.disabledUntil) {
        changed = true;
        return { ...e, state: 'active' as EntityState };
      }
      return e;
    });
    
    let otherPlayers = state.otherPlayers;
    let playersChanged = false;
    Object.values(state.otherPlayers).forEach(p => {
      if (p.state === 'disabled' && time > p.disabledUntil) {
        if (!playersChanged) {
          otherPlayers = { ...state.otherPlayers };
          playersChanged = true;
        }
        otherPlayers[p.id] = { ...p, state: 'active' };
      }
    });

    if (state.playerState === 'disabled' && time > state.playerDisabledUntil) {
      return { enemies, playerState: 'active', otherPlayers: playersChanged ? otherPlayers : state.otherPlayers };
    }
    return changed || playersChanged ? { enemies, otherPlayers } : state;
  }),

  cleanupEffects: (time) => set((state) => {
    const lasers = state.lasers.filter(l => time - l.timestamp < 200);
    const particles = state.particles.filter(p => time - p.timestamp < 500);
    const events = state.events.filter(e => time - e.timestamp < 5000);
    if (lasers.length !== state.lasers.length || particles.length !== state.particles.length || events.length !== state.events.length) {
      return { lasers, particles, events };
    }
    return state;
  }),

  setPlayerState: (playerState) => set({ playerState }),

  updatePlayerPosition: (position, rotation) => {
    const { socket } = get();
    if (socket) {
      socket.emit('updatePosition', { position, rotation });
    }
  }
}));
