import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trophy, RefreshCw, ListOrdered, X, Medal, Clock, Settings } from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore } from '@/stores/auth';

// 格式化日期函数
const formatDate = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  } catch {
    return dateStr;
  }
};

// 排行榜数据接口
interface LeaderboardEntry {
  userId: {
    id: number;
    username: string;
    avatar: string;
  };
  score: number;
  achievedAt: string;
}

// 排行榜组件
const LeaderboardModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard();
    }
  }, [isOpen]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const data = await api.get('/game/leaderboard/flappy-bird');
      setEntries(data as unknown as LeaderboardEntry[]);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <Card
        className="w-full max-w-md theme-card rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90%] border-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-6 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 drop-shadow-md" />
            <h2 className="text-2xl font-black tracking-tight uppercase">Leaderboard</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20 rounded-full h-10 w-10">
            <X className="w-6 h-6" />
          </Button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="w-8 h-8 animate-spin text-orange-500" />
            </div>
          ) : entries.length > 0 ? (
            entries.map((entry, index) => (
              <div 
                key={entry.userId.id} 
                className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${
                  index === 0 ? 'bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-700/50' : 
                  index === 1 ? 'bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700' :
                  index === 2 ? 'bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-100 dark:border-orange-800/50' : 'theme-muted border border-border'
                }`}
              >
                <div className="w-8 flex justify-center">
                  {index < 3 ? (
                    <Medal className={`w-6 h-6 ${
                      index === 0 ? 'text-yellow-500' : 
                      index === 1 ? 'text-slate-400' : 'text-orange-400'
                    }`} />
                  ) : (
                    <span className="theme-subtle font-bold">{index + 1}</span>
                  )}
                </div>
                
                <img 
                  src={entry.userId.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.userId.username}`} 
                  alt={entry.userId.username}
                  className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-700 shadow-sm"
                />
                
                <div className="flex-1 min-w-0">
                  <p className="font-bold theme-text truncate">{entry.userId.username}</p>
                  <p className="text-xs theme-subtle flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(entry.achievedAt)}
                  </p>
                </div>
                
                <div className="text-right">
                  <p className="text-xl font-black text-orange-600 leading-none">{entry.score}</p>
                  <p className="text-[10px] font-bold theme-subtle uppercase tracking-tighter">Pts</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 theme-subtle font-medium">暂无排名，快去挑战吧！</div>
          )}
        </div>
      </Card>
    </div>
  );
};

// 游戏难度设置弹窗
const SettingsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  settings: GameSettings;
  onSettingsChange: (settings: GameSettings) => void;
  onReset: () => void;
}> = ({ isOpen, onClose, settings, onSettingsChange, onReset }) => {
  if (!isOpen) return null;

  const handleChange = (key: keyof GameSettings, value: number) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const configItems = [
    { key: 'gravity', label: '重力', min: 0.05, max: 0.5, step: 0.01, unit: '' },
    { key: 'jumpStrength', label: '跳跃力度', min: -8, max: -2, step: 0.1, unit: '' },
    { key: 'pipeSpeed', label: '管道速度', min: 1, max: 6, step: 0.1, unit: '' },
    { key: 'pipeGap', label: '管道间隙', min: 120, max: 400, step: 10, unit: 'px' },
    { key: 'pipeInterval', label: '生成间隔', min: 800, max: 4000, step: 100, unit: 'ms' },
  ] as const;

  return (
    <div 
      className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <Card 
        className="w-full max-w-md theme-card rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90%] border-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <Settings className="w-8 h-8 drop-shadow-md" />
            <h2 className="text-2xl font-black tracking-tight uppercase">游戏设置</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20 rounded-full h-10 w-10">
            <X className="w-6 h-6" />
          </Button>
        </div>

        {/* Settings List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 theme-card">
          {configItems.map((item) => (
            <div key={item.key} className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="font-bold theme-text">{item.label}</label>
                <span className="text-sm font-mono text-purple-600 bg-purple-50 dark:bg-purple-900/30 px-2 py-1 rounded">
                  {settings[item.key]}{item.unit}
                </span>
              </div>
              <input
                type="range"
                min={item.min}
                max={item.max}
                step={item.step}
                value={settings[item.key]}
                onChange={(e) => handleChange(item.key, parseFloat(e.target.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <div className="flex justify-between text-xs theme-subtle">
                <span>{item.min}</span>
                <span>{item.max}</span>
              </div>
            </div>
          ))}

          <Button
            onClick={onReset}
            variant="outline"
            className="w-full mt-4 border-2 border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-purple-600 dark:text-purple-400 font-bold py-3 rounded-xl"
          >
            恢复默认设置
          </Button>
        </div>

        {/* Footer Tip */}
        <div className="p-4 theme-muted border-t border-border text-center">
          <p className="text-xs theme-subtle">
            💡 修改设置后会立即生效，下一局游戏将使用新设置
          </p>
        </div>
      </Card>
    </div>
  );
};

// 游戏基础常量
const BIRD_SIZE = 26;
const PIPE_WIDTH = 45;
const GROUND_HEIGHT = 80;

// 50 级动态难度配置 (线性平滑插值)
const DIFFICULTY = {
  START_SCORE: 0,
  MAX_SCORE: 100, // 100 分达到满级
  SPEED: { START: 2.0, END: 3.5 },
  GAP: { START: 320, END: 180 },
  INTERVAL: { START: 2600, END: 1400 },
};

// 游戏难度设置接口
interface GameSettings {
  gravity: number;
  jumpStrength: number;
  pipeSpeed: number;
  pipeGap: number;
  pipeInterval: number;
}

// 默认设置
const DEFAULT_SETTINGS: GameSettings = {
  gravity: 0.15,
  jumpStrength: -4.5,
  pipeSpeed: 2.0,
  pipeGap: 320,
  pipeInterval: 2600,
};

interface Pipe {
  id: number;
  x: number;
  topHeight: number;
  gap: number; // 每个管道记录自己的间隙，防止生成后难度突变
  passed: boolean;
  level: number; // 记录生成时的等级，用于颜色区分
}

export const FlappyBirdGame: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [birdY, setBirdY] = useState(250);
  const [velocity, setVelocity] = useState(0);
  const [pipes, setPipes] = useState<Pipe[]>([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const { user } = useAuthStore();

  // 动态难度计算 (使用用户设置的值)
  const progress = Math.min(score / DIFFICULTY.MAX_SCORE, 1);
  const currentLevel = Math.min(50, Math.floor(score / 2) + 1);
  const currentSpeed = settings.pipeSpeed + (DIFFICULTY.SPEED.END - settings.pipeSpeed) * progress;
  const currentGap = settings.pipeGap - (settings.pipeGap - DIFFICULTY.GAP.END) * progress;
  const currentInterval = settings.pipeInterval - (settings.pipeInterval - DIFFICULTY.INTERVAL.END) * progress;

  const requestRef = useRef<number>(0);
  const lastSpawnTime = useRef<number>(0);
  const pipeIdCounter = useRef<number>(0);

  // 初始化容器大小和最高分
  useEffect(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setContainerSize({ width, height });
      setBirdY(height / 2);
    }

    const fetchHighScore = async () => {
      if (user) {
        try {
          const data = await api.get('/game/high-score/flappy-bird');
          if (data) {
            setHighScore((data as unknown as { score: number }).score || 0);
          }
        } catch (error) {
          console.error('Failed to fetch high score:', error);
        }
      }
    };
    fetchHighScore();
  }, [user]);

  const jump = useCallback(() => {
    if (!gameStarted) {
      setGameStarted(true);
      return;
    }
    if (gameOver) return;
    setVelocity(settings.jumpStrength);
  }, [gameStarted, gameOver, settings.jumpStrength]);

  // 处理键盘事件 (PC 端)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [jump]);

  const submitScore = useCallback(async (finalScore: number) => {
    if (user) {
      try {
        await api.post('/game/score', {
          gameType: 'flappy-bird',
          score: finalScore,
        });
        if (finalScore > highScore) {
          setHighScore(finalScore);
        }
      } catch (error) {
        console.error('Failed to submit score:', error);
      }
    }
  }, [user, highScore]);

  const resetGame = () => {
    setBirdY(containerSize.height / 2);
    setVelocity(0);
    setPipes([]);
    setScore(0);
    setGameOver(false);
    setGameStarted(false);
    lastSpawnTime.current = 0;
  };

  const update = useCallback((time: number) => {
    if (!gameStarted || gameOver) return;

    // 1. 更新小鸟位置
    setBirdY((prevY) => {
      const nextY = prevY + velocity;
      // 碰撞检测：天花板和地板
      if (nextY < 0 || nextY + BIRD_SIZE > containerSize.height - GROUND_HEIGHT) {
        setGameOver(true);
        submitScore(score);
        return prevY;
      }
      return nextY;
    });
    setVelocity((v) => v + settings.gravity);

    // 2. 生成管道
    if (time - lastSpawnTime.current > currentInterval) {
      const minPipeHeight = 50;
      const maxPipeHeight = containerSize.height - GROUND_HEIGHT - currentGap - minPipeHeight;
      const topHeight = Math.random() * (maxPipeHeight - minPipeHeight) + minPipeHeight;
      
      const newPipe: Pipe = {
        id: pipeIdCounter.current++,
        x: containerSize.width,
        topHeight: topHeight,
        gap: currentGap,
        level: currentLevel,
        passed: false,
      };
      setPipes((prev) => [...prev, newPipe]);
      lastSpawnTime.current = time;
    }

    // 3. 移动管道
    setPipes((prevPipes) => {
      return prevPipes
        .map((pipe) => ({ ...pipe, x: pipe.x - currentSpeed }))
        .filter((pipe) => pipe.x + PIPE_WIDTH > -50);
    });

    requestRef.current = requestAnimationFrame(update);
  }, [gameStarted, gameOver, velocity, containerSize, currentSpeed, currentGap, currentInterval, currentLevel, score, submitScore, settings]);

  // 碰撞检测逻辑
  useEffect(() => {
    if (!gameStarted || gameOver || containerSize.width === 0) return;

    const birdX = containerSize.width / 4;
    
    // 检查是否有新的得分或碰撞
    let collisionDetected = false;
    let scoreIncrement = 0;

    const newPipes = pipes.map(pipe => {
      if (collisionDetected) return pipe;

      // 水平范围检测
      if (
        birdX + BIRD_SIZE > pipe.x &&
        birdX < pipe.x + PIPE_WIDTH
      ) {
        // 垂直范围检测
        if (
          birdY < pipe.topHeight ||
          birdY + BIRD_SIZE > pipe.topHeight + pipe.gap
        ) {
          collisionDetected = true;
        }
      }

      // 得分检测
      if (!pipe.passed && pipe.x + PIPE_WIDTH < birdX) {
        scoreIncrement++;
        return { ...pipe, passed: true };
      }

      return pipe;
    });

    if (collisionDetected) {
      setGameOver(true);
      submitScore(score);
    } else if (scoreIncrement > 0) {
      setScore(s => s + scoreIncrement);
      setPipes(newPipes);
    } else {
      const hasPassedChanged = newPipes.some((p, i) => p.passed !== pipes[i].passed);
      if (hasPassedChanged) {
        setPipes(newPipes);
      }
    }
  }, [birdY, pipes, gameStarted, gameOver, containerSize, score, submitScore]);

  useEffect(() => {
    if (gameStarted && !gameOver) {
      requestRef.current = requestAnimationFrame(update);
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [gameStarted, gameOver, update]);

  // 获取管道颜色
  const getPipeColor = (level: number) => {
    const intensity = Math.min((level - 1) / 49, 1);
    // 从淡绿色 (rgb(74, 222, 128)) 渐变为深红色 (rgb(220, 38, 38))
    const r = Math.floor(74 + (220 - 74) * intensity);
    const g = Math.floor(222 + (38 - 222) * intensity);
    const b = Math.floor(128 + (38 - 128) * intensity);
    return `rgb(${r}, ${g}, ${b})`;
  };

  return (
    <Card
      className="relative w-full h-full min-h-[500px] overflow-hidden select-none cursor-pointer border-0 shadow-none theme-page"
      ref={containerRef}
      onClick={() => {
        // 如果有弹窗打开，则不触发游戏点击
        if (isSettingsOpen || isLeaderboardOpen) return;
        jump();
      }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {/* 排行榜组件 */}
      <LeaderboardModal isOpen={isLeaderboardOpen} onClose={() => setIsLeaderboardOpen(false)} />

      {/* 设置弹窗 */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSettingsChange={setSettings}
        onReset={() => setSettings(DEFAULT_SETTINGS)}
      />

      {/* 背景 */}
      <div className="absolute inset-0 theme-page" />

      {/* 管道渲染 */}
      {pipes.map((pipe) => (
        <React.Fragment key={pipe.id}>
          {/* 上管道 */}
          <div
            className="absolute border-2 border-slate-800 dark:border-slate-700 rounded-b-lg transition-colors duration-500 shadow-sm"
            style={{
              left: pipe.x,
              top: 0,
              width: PIPE_WIDTH,
              height: pipe.topHeight,
              backgroundColor: getPipeColor(pipe.level),
            }}
          />
          {/* 下管道 */}
          <div
            className="absolute border-2 border-slate-800 dark:border-slate-700 rounded-t-lg transition-colors duration-500 shadow-sm"
            style={{
              left: pipe.x,
              top: pipe.topHeight + pipe.gap,
              width: PIPE_WIDTH,
              bottom: GROUND_HEIGHT,
              backgroundColor: getPipeColor(pipe.level),
            }}
          />
        </React.Fragment>
      ))}

      {/* 小鸟 */}
      <div
        className="absolute bg-yellow-400 border-2 border-slate-800 rounded-full flex items-center justify-center shadow-md"
        style={{
          top: birdY,
          left: containerSize.width / 4,
          width: BIRD_SIZE,
          height: BIRD_SIZE,
          transform: `rotate(${Math.min(Math.max(velocity * 3, -30), 90)}deg)`,
        }}
      >
        <div className="w-1 h-1 bg-slate-800 rounded-full absolute top-2 right-2" />
      </div>

      {/* 地面 */}
      <div 
        className="absolute bottom-0 w-full bg-amber-800 dark:bg-amber-950 border-t-4 border-slate-800 dark:border-slate-900 shadow-[0_-4px_10px_rgba(0,0,0,0.1)]"
        style={{ height: GROUND_HEIGHT }}
      />

      {/* 等级和分数显示 */}
      <div className="absolute top-4 left-0 right-0 flex flex-col items-center pointer-events-none z-10">
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-black text-pink-500 uppercase tracking-widest opacity-40">Level</span>
          <span className="text-4xl font-black text-pink-500 drop-shadow-sm">{currentLevel}</span>
        </div>
        <span className="text-6xl font-black theme-text drop-shadow-lg opacity-80 mt-2">
          {score}
        </span>
      </div>

      {/* 顶部操作按钮区域 */}
      {!gameStarted && !gameOver && (
        <div className="absolute top-4 right-4 flex gap-2 z-20">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              setIsSettingsOpen(true);
            }}
            className="bg-background/80 hover:bg-background theme-text border-2 border-border rounded-2xl shadow-sm flex items-center gap-2"
            size="sm"
          >
            <Settings className="w-4 h-4 text-blue-500" />
            <span className="font-bold">设置</span>
          </Button>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              setIsLeaderboardOpen(true);
            }}
            className="bg-background/80 hover:bg-background theme-text border-2 border-border rounded-2xl shadow-sm flex items-center gap-2"
            size="sm"
          >
            <ListOrdered className="w-4 h-4 text-orange-500" />
            <span className="font-bold">排行榜</span>
          </Button>
        </div>
      )}

      {/* 游戏状态提示 */}
      {!gameStarted && !gameOver && (
        <div className="absolute inset-0 bg-background/10 flex flex-col items-center justify-center pointer-events-none">
          <h2 className="text-4xl font-black text-pink-500 drop-shadow-md mb-4 uppercase tracking-tighter">FLAPPY BIRD</h2>
          <div className="flex flex-col items-center gap-2">
            <p className="theme-text font-bold flex items-center gap-2">
              点击或按 <span className="px-2 py-1 bg-muted rounded border border-border">空格</span> 开始飞行
            </p>
            <p className="theme-subtle text-sm font-medium">挑战 50 级动态难度上限</p>
          </div>
        </div>
      )}

      {/* 游戏结束弹窗 */}
      {gameOver && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="theme-card p-8 rounded-3xl shadow-2xl flex flex-col items-center max-w-[80%] animate-in zoom-in duration-300 border-0">
            <h3 className="text-3xl font-black text-red-500 mb-2">GAME OVER</h3>
            <div className="flex flex-col items-center gap-1 mb-6">
              <div className="flex items-center gap-2">
                <Trophy className="text-yellow-500 w-6 h-6" />
                <span className="text-2xl font-bold theme-text">得分: {score}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-sm font-bold theme-subtle">最高分: {Math.max(score, highScore)}</span>
                {score > highScore && score > 0 && (
                  <span className="text-xs font-black text-orange-500 animate-bounce mt-1">NEW RECORD! 🎉</span>
                )}
                <span className="text-sm font-bold theme-subtle mt-1">最终等级: LV.{currentLevel}</span>
              </div>
            </div>
            
            <div className="flex flex-col w-full gap-3">
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  resetGame();
                }}
                className="bg-pink-500 hover:bg-pink-600 text-white px-8 py-4 rounded-2xl text-lg font-bold flex gap-2 h-auto w-full"
              >
                <RefreshCw className="w-5 h-5" />
                重试
              </Button>
              
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsLeaderboardOpen(true);
                }}
                variant="outline"
                className="border-2 border-border hover:bg-muted theme-text px-8 py-4 rounded-2xl text-lg font-bold flex gap-2 h-auto w-full"
              >
                <ListOrdered className="w-5 h-5 text-orange-500" />
                排行榜
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
