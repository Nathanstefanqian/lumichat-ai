import { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Game } from './Game';
import { MobileControls } from './MobileControls';
import { useGameStore, type MapType } from '../store/index';
import { Maximize, Minimize, Shield, Snowflake, Building2, Terminal, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    const uaMatch = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
    return uaMatch || coarsePointer || window.innerWidth < 768;
  });

  useEffect(() => {
    const check = () => {
      const uaMatch = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
      setIsMobile(uaMatch || coarsePointer || window.innerWidth < 768);
    };
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return isMobile;
}

function Minimap() {
  const enemies = useGameStore(state => state.enemies);
  const otherPlayers = useGameStore(state => state.otherPlayers);
  const mapType = useGameStore(state => state.mapType);
  
  return (
    <div className="absolute bottom-6 right-6 w-48 h-48 bg-black/60 backdrop-blur-md border-2 border-cyan-500/30 rounded-xl overflow-hidden shadow-2xl pointer-events-none z-50">
      <div className="relative w-full h-full">
        <div className={cn(
          "absolute inset-0 opacity-20",
          mapType === 'desert' ? "bg-orange-900" : 
          mapType === 'snow' ? "bg-blue-100" :
          mapType === 'office' ? "bg-gray-700" : "bg-cyan-950"
        )} />
        
        {enemies.filter(e => e.state === 'active').map(enemy => (
          <div 
            key={enemy.id}
            className="absolute w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_5px_red]"
            style={{ 
              left: `${(enemy.position[0] + 100) / 200 * 100}%`,
              top: `${(enemy.position[2] + 100) / 200 * 100}%`,
              transform: 'translate(-50%, -50%)'
            }}
          />
        ))}

        {Object.values(otherPlayers).filter(p => p.state === 'active').map(player => (
          <div 
            key={player.id}
            className="absolute w-2 h-2 bg-fuchsia-500 rounded-full shadow-[0_0_8px_fuchsia]"
            style={{ 
              left: `${(player.position[0] + 100) / 200 * 100}%`,
              top: `${(player.position[2] + 100) / 200 * 100}%`,
              transform: 'translate(-50%, -50%)'
            }}
          />
        ))}

        <div className="absolute top-1/2 left-1/2 w-2.5 h-2.5 bg-cyan-400 rounded-full border border-white shadow-[0_0_10px_#22d3ee] z-10" />
      </div>
      
      <div className="absolute top-2 left-2 text-[8px] font-black text-cyan-400/50 uppercase tracking-widest">
        Tactical Radar
      </div>
    </div>
  );
}

function HUD() {
  const gameState = useGameStore(state => state.gameState);
  const score = useGameStore(state => state.score);
  const timeLeft = useGameStore(state => state.timeLeft);
  const playerState = useGameStore(state => state.playerState);
  const otherPlayers = useGameStore(state => state.otherPlayers);
  const events = useGameStore(state => state.events);
  const leaveGame = useGameStore(state => state.leaveGame);
  const playerCount = Object.keys(otherPlayers).length + 1;
  const isMobile = useIsMobile();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(e => {
        console.error(`Error attempting to enable full-screen mode: ${e.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const leaderboard = useMemo(() => {
    const players = [
      { id: 'You', score: score, isMe: true },
      ...Object.values(otherPlayers).map(p => ({
        id: p.name,
        score: p.score,
        isMe: false
      }))
    ];
    return players.sort((a, b) => b.score - a.score);
  }, [score, otherPlayers]);

  return (
    <>
      {/* Crosshair */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center z-50">
        <div className="relative">
          <div className={`w-4 h-4 border-2 rounded-full ${playerState === 'disabled' ? 'border-red-500' : 'border-cyan-400'}`} />
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 rounded-full ${playerState === 'disabled' ? 'bg-red-500' : 'bg-cyan-400'}`} />
        </div>
        {!isMobile && <div className="mt-4 text-cyan-400/50 text-[10px] tracking-widest font-bold uppercase">Ready to Fire</div>}
      </div>

      {/* HUD Left - Score & Leaderboard */}
      <div className="absolute top-4 left-4 flex flex-col gap-4 pointer-events-none z-50">
        <div className="text-cyan-400 text-2xl font-black drop-shadow-[0_0_10px_rgba(34,211,238,0.8)] italic tracking-tighter">
          ARENA SCORE: {score.toString().padStart(4, '0')}
        </div>
        
        {!isMobile && (
          <div className="bg-black/40 backdrop-blur-md border border-cyan-500/20 p-4 rounded-xl w-56 flex flex-col gap-2 shadow-2xl">
            <div className="text-cyan-400/80 text-[10px] font-black mb-1 border-b border-cyan-500/20 pb-2 uppercase tracking-[0.2em]">Rankings</div>
            {leaderboard.map((p, i) => (
              <div key={p.id} className={`flex justify-between items-center text-xs ${p.isMe ? 'text-cyan-400 font-black' : 'text-cyan-400/60'}`}>
                <span className="truncate max-w-[120px]">{i + 1}. {p.id}</span>
                <span className="font-mono">{p.score}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* HUD Right - Time, Fullscreen, Leave, Events */}
      <div className="absolute top-4 right-4 flex flex-col items-end gap-4 z-50">
        <div className="flex items-center gap-4">
          {gameState === 'playing' && (
            <div className="text-cyan-400 text-2xl font-black drop-shadow-[0_0_10px_rgba(34,211,238,0.8)] pointer-events-none italic tracking-tighter">
              TIME REMAINING: {Math.floor(timeLeft / 60)}:{(Math.floor(timeLeft) % 60).toString().padStart(2, '0')}
            </div>
          )}
          
          <button
            onClick={toggleFullscreen}
            className="p-3 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-xl hover:bg-cyan-500 hover:text-black transition-all duration-300 backdrop-blur-md pointer-events-auto"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>

          <button
            onClick={leaveGame}
            className="p-3 bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl hover:bg-red-500 hover:text-black transition-all duration-300 backdrop-blur-md pointer-events-auto"
            title="Leave Game"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        {!isMobile && <div className="text-cyan-400/40 text-[9px] font-black uppercase tracking-[0.3em] pointer-events-none">Press ESC to unlock Mouse</div>}

        {/* Event Log */}
        <div className="mt-4 flex flex-col items-end gap-2 pointer-events-none">
          <AnimatePresence>
            {events.slice(-4).map(event => (
              <motion.div 
                key={event.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-[10px] font-black text-fuchsia-400 bg-black/60 px-3 py-1.5 rounded-lg border border-fuchsia-500/30 backdrop-blur-md shadow-lg"
              >
                {event.message.toUpperCase()}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Minimap */}
      <Minimap />

      {/* Multiplayer Info */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-50">
        <div className="text-cyan-400/60 text-[10px] font-black drop-shadow-[0_0_8px_rgba(34,211,238,0.4)] uppercase tracking-[0.4em]">
          Arena Occupants: {playerCount}
        </div>
        <div className="text-cyan-400/40 text-[8px] font-bold mt-1 uppercase tracking-widest">
          Sector: {useGameStore.getState().roomId}
        </div>
      </div>

      {/* Damage Overlay */}
      {playerState === 'disabled' && (
        <div className="absolute inset-0 bg-red-500/10 pointer-events-none flex items-center justify-center z-[60] backdrop-blur-[2px]">
          <div className="text-red-600 text-5xl md:text-8xl font-black tracking-tighter drop-shadow-[0_0_30px_rgba(220,38,38,1)] animate-pulse text-center italic uppercase">
            System Critical<br/>Rebooting...
          </div>
        </div>
      )}

      {/* Mobile Controls */}
      {isMobile && gameState === 'playing' && <MobileControls />}
    </>
  );
}

// ... (useIsMobile remains the same)

export const LaserTagView: React.FC = () => {
  const gameState = useGameStore(state => state.gameState);
  const score = useGameStore(state => state.score);
  const startGame = useGameStore(state => state.startGame);
  const [roomInput, setRoomInput] = useState('');
  const [selectedMap, setSelectedMap] = useState<MapType>('neon');

  const maps = [
    { id: 'neon', name: 'NEON CITY', icon: Terminal, color: 'text-cyan-400', bg: 'bg-cyan-950/20' },
    { id: 'desert', name: 'SAND DUNES', icon: Shield, color: 'text-orange-400', bg: 'bg-orange-950/20' },
    { id: 'snow', name: 'FROST PEAK', icon: Snowflake, color: 'text-blue-200', bg: 'bg-blue-900/20' },
    { id: 'office', name: 'HQ OFFICE', icon: Building2, color: 'text-gray-400', bg: 'bg-gray-800/20' },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-black relative overflow-hidden font-mono select-none">
      {/* 3D Canvas */}
      <div className="absolute inset-0 z-0">
        <Game />
      </div>

      {/* UI Overlay */}
      {gameState === 'playing' && <HUD />}

      {/* Menus */}
      {gameState === 'menu' && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50 pointer-events-auto backdrop-blur-md overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center w-full max-w-2xl px-6 py-12"
          >
            <h1 className="text-5xl md:text-7xl font-black text-cyan-400 mb-2 drop-shadow-[0_0_30px_rgba(34,211,238,0.6)] tracking-tighter italic">
              NEON ARENA
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent mb-8" />
            
            {/* Map Selection */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 w-full">
              {maps.map((map) => (
                <button
                  key={map.id}
                  onClick={() => setSelectedMap(map.id as MapType)}
                  className={cn(
                    "flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all duration-300",
                    selectedMap === map.id 
                      ? "bg-cyan-500/20 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.3)] scale-105" 
                      : "bg-white/5 border-white/10 hover:border-white/30 grayscale opacity-60 hover:grayscale-0 hover:opacity-100"
                  )}
                >
                  <map.icon className={cn("w-8 h-8", map.color)} />
                  <span className={cn("text-[10px] font-black tracking-widest uppercase", map.color)}>
                    {map.name}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-4 w-full max-w-sm">
              <div className="relative group">
                <input 
                  type="text" 
                  placeholder="ENTER ROOM ID (OPTIONAL)"
                  value={roomInput}
                  onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
                  className="w-full bg-black/50 border-2 border-cyan-900/50 rounded-xl px-4 py-4 text-cyan-400 placeholder:text-cyan-900/50 focus:outline-none focus:border-cyan-400/50 transition-all text-center tracking-widest font-bold"
                />
                <div className="absolute inset-0 rounded-xl bg-cyan-400/5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity" />
              </div>

              <button
                onClick={() => startGame(roomInput || 'default', selectedMap)}
                className="w-full px-8 py-5 bg-cyan-500/10 border-2 border-cyan-400/50 text-cyan-400 text-xl font-black rounded-xl hover:bg-cyan-400 hover:text-black transition-all duration-300 shadow-[0_0_20px_rgba(34,211,238,0.2)] group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-cyan-400 opacity-0 group-hover:opacity-10 transition-opacity" />
                DEPLOY TO ARENA
              </button>
            </div>
            
            <p className="mt-8 text-[10px] text-cyan-900 font-bold tracking-[0.2em] uppercase text-center">
              WASD: Move • Space: Jump • Mouse: Fire<br/>
              Join common room to challenge friends
            </p>
          </motion.div>
        </div>
      )}

      {gameState === 'gameover' && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-50 pointer-events-auto backdrop-blur-xl">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center"
          >
            <h1 className="text-6xl md:text-8xl font-black text-red-500 mb-4 drop-shadow-[0_0_40px_rgba(239,68,68,0.6)] tracking-tighter italic">
              GAME OVER
            </h1>
            <div className="text-2xl md:text-3xl text-cyan-400 mb-12 font-bold tracking-widest">
              FINAL SCORE: <span className="text-white">{score}</span>
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={() => startGame(roomInput || 'default', selectedMap)}
                className="px-12 py-5 bg-red-500/10 border-2 border-red-500/50 text-red-500 text-xl font-black rounded-xl hover:bg-red-500 hover:text-black transition-all duration-300 shadow-[0_0_20px_rgba(239,68,68,0.2)] group relative overflow-hidden"
              >
                REBOOT SYSTEM
              </button>
              <button
                onClick={() => useGameStore.getState().leaveGame()}
                className="px-8 py-5 bg-white/5 border-2 border-white/10 text-white text-xl font-black rounded-xl hover:bg-white hover:text-black transition-all duration-300"
              >
                EXIT
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

