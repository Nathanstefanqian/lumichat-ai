import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Trophy, RotateCcw, Play, Pause } from 'lucide-react';

// 游戏配置
const BALL_RADIUS = 15;
const PATH_POINTS_COUNT = 1000;
const BALL_SPACING = 32;
const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7']; // 红、蓝、绿、黄、紫

interface Point {
  x: number;
  y: number;
}

interface Ball {
  id: number;
  color: string;
  position: number; // 在路径上的进度 (0-1)
  isShooting: boolean;
  targetX?: number;
  targetY?: number;
  currentX?: number;
  currentY?: number;
  angle?: number;
}

export const ZumaGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'paused' | 'gameover' | 'win'>('idle');
  const [score, setScore] = useState(0);
  const [highScore] = useState(0);
  
  // 游戏逻辑引用
  const requestRef = useRef<number>(0);
  const pathRef = useRef<Point[]>([]);
  const ballsRef = useRef<Ball[]>([]);
  const shooterBallRef = useRef<Ball | null>(null);
  const nextBallColorRef = useRef<string>(COLORS[Math.floor(Math.random() * COLORS.length)]);
  const mousePosRef = useRef<Point>({ x: 0, y: 0 });
  const ballIdCounter = useRef(0);

  // 初始化路径 (简单的螺旋路径)
  const initPath = useCallback((width: number, height: number) => {
    const points: Point[] = [];
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) * 0.4;
    
    for (let i = 0; i <= PATH_POINTS_COUNT; i++) {
      const t = i / PATH_POINTS_COUNT;
      const angle = t * Math.PI * 6; // 3圈
      const radius = maxRadius * (1 - t * 0.8);
      points.push({
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius
      });
    }
    pathRef.current = points;
  }, []);

  // 获取路径上的坐标
  const getPointOnPath = (progress: number): Point => {
    const index = Math.floor(Math.min(Math.max(progress, 0), 0.999) * PATH_POINTS_COUNT);
    return pathRef.current[index];
  };

  // 发射球球
  const shootBall = () => {
    if (gameState !== 'playing' || !shooterBallRef.current) return;

    const angle = Math.atan2(
      mousePosRef.current.y - (canvasRef.current?.height || 0) / 2,
      mousePosRef.current.x - (canvasRef.current?.width || 0) / 2
    );

    shooterBallRef.current = {
      ...shooterBallRef.current,
      isShooting: true,
      angle: angle,
      currentX: (canvasRef.current?.width || 0) / 2,
      currentY: (canvasRef.current?.height || 0) / 2,
    };

    // 准备下一个发射球
    setTimeout(() => {
      if (gameState === 'playing') {
        shooterBallRef.current = {
          id: ballIdCounter.current++,
          color: nextBallColorRef.current,
          position: 0,
          isShooting: false,
        };
        nextBallColorRef.current = COLORS[Math.floor(Math.random() * COLORS.length)];
      }
    }, 100);
  };

  // 核心游戏循环
  const update = (_time: number) => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. 绘制轨道
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 40;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    pathRef.current.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();

    // 2. 更新并绘制轨道上的球
    const balls = ballsRef.current;
    
    // 增加新球逻辑
    if (balls.length === 0 || balls[0].position > (BALL_SPACING / (PATH_POINTS_COUNT * 10))) {
        balls.unshift({
            id: ballIdCounter.current++,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            position: 0,
            isShooting: false
        });
    }

    // 移动球
    balls.forEach(ball => {
        ball.position += 0.0005; // 基础移动速度
    });

    // 检查是否到达终点
    if (balls.some(b => b.position >= 1)) {
        setGameState('gameover');
        return;
    }

    // 绘制球
    balls.forEach(ball => {
      const p = getPointOnPath(ball.position);
      drawBall(ctx, p.x, p.y, ball.color);
    });

    // 3. 更新并绘制发射中的球
    if (shooterBallRef.current) {
      const sb = shooterBallRef.current;
      if (sb.isShooting && sb.currentX !== undefined && sb.currentY !== undefined && sb.angle !== undefined) {
        sb.currentX += Math.cos(sb.angle) * 10;
        sb.currentY += Math.sin(sb.angle) * 10;
        drawBall(ctx, sb.currentX, sb.currentY, sb.color);

        // 碰撞检测
        for (let i = 0; i < balls.length; i++) {
          const p = getPointOnPath(balls[i].position);
          const dist = Math.sqrt((sb.currentX - p.x)**2 + (sb.currentY - p.y)**2);
          if (dist < BALL_RADIUS * 2) {
            // 插入球球
            balls.splice(i, 0, {
              id: sb.id,
              color: sb.color,
              position: balls[i].position - 0.01,
              isShooting: false
            });
            shooterBallRef.current = null;
            checkMatch(i);
            break;
          }
        }

        // 越界检查
        if (sb.currentX < 0 || sb.currentX > canvas.width || sb.currentY < 0 || sb.currentY > canvas.height) {
          shooterBallRef.current = null;
        }
      } else {
        // 绘制炮台上的球
        const angle = Math.atan2(
          mousePosRef.current.y - canvas.height / 2,
          mousePosRef.current.x - canvas.width / 2
        );
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(angle);
        
        // 绘制炮台主体
        ctx.fillStyle = '#444';
        ctx.beginPath();
        ctx.arc(0, 0, 40, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制准备发射的球
        drawBall(ctx, 30, 0, sb.color);
        // 绘制下一个球预览
        drawBall(ctx, 0, 0, nextBallColorRef.current, 10);
        
        ctx.restore();
      }
    }

    requestRef.current = requestAnimationFrame(update);
  };

  const drawBall = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, radius = BALL_RADIUS) => {
    ctx.beginPath();
    const gradient = ctx.createRadialGradient(x - radius/3, y - radius/3, radius/10, x, y, radius);
    gradient.addColorStop(0, '#fff');
    gradient.addColorStop(0.2, color);
    gradient.addColorStop(1, '#000');
    ctx.fillStyle = gradient;
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
  };

  const checkMatch = (index: number) => {
    const balls = ballsRef.current;
    const color = balls[index].color;
    let start = index;
    let end = index;

    while (start > 0 && balls[start - 1].color === color) start--;
    while (end < balls.length - 1 && balls[end + 1].color === color) end++;

    if (end - start + 1 >= 3) {
      balls.splice(start, end - start + 1);
      setScore(prev => prev + (end - start + 1) * 10);
    }
  };

  // 初始化游戏
  const startGame = () => {
    if (!canvasRef.current) return;
    const { width, height } = canvasRef.current;
    initPath(width, height);
    ballsRef.current = [];
    setScore(0);
    ballIdCounter.current = 0;
    shooterBallRef.current = {
      id: ballIdCounter.current++,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      position: 0,
      isShooting: false,
    };
    setGameState('playing');
  };

  useEffect(() => {
    if (gameState === 'playing') {
      requestRef.current = requestAnimationFrame(update);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState]);

  // 响应式画布
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        canvasRef.current.width = containerRef.current.clientWidth;
        canvasRef.current.height = containerRef.current.clientHeight;
        if (gameState === 'playing') {
            initPath(canvasRef.current.width, canvasRef.current.height);
        }
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [gameState, initPath]);

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white overflow-hidden">
      {/* 顶栏 */}
      <div className="flex items-center justify-between p-4 bg-slate-900/50 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center space-x-6">
          <div className="flex flex-col">
            <span className="text-xs opacity-50 uppercase tracking-wider">Score</span>
            <span className="text-2xl font-black text-yellow-400 font-mono">{score.toString().padStart(6, '0')}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs opacity-50 uppercase tracking-wider">High Score</span>
            <span className="text-xl font-bold text-slate-300 font-mono">{highScore.toString().padStart(6, '0')}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {gameState === 'playing' ? (
            <Button variant="ghost" size="icon" onClick={() => setGameState('paused')}>
              <Pause className="w-6 h-6" />
            </Button>
          ) : gameState === 'paused' ? (
            <Button variant="ghost" size="icon" onClick={() => setGameState('playing')}>
              <Play className="w-6 h-6" />
            </Button>
          ) : null}
          <Button variant="ghost" size="icon" onClick={startGame}>
            <RotateCcw className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* 游戏区域 */}
      <div ref={containerRef} className="flex-1 relative cursor-crosshair">
        <canvas
          ref={canvasRef}
          onMouseMove={(e) => {
            const rect = canvasRef.current?.getBoundingClientRect();
            if (rect) {
              mousePosRef.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
              };
            }
          }}
          onClick={shootBall}
          className="w-full h-full"
        />

        {/* 状态遮罩 */}
        {gameState === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="mb-8 text-center">
              <h2 className="text-6xl font-black mb-2 bg-gradient-to-b from-yellow-200 to-yellow-600 bg-clip-text text-transparent">ZUMA</h2>
              <p className="text-slate-400">经典祖玛消除游戏</p>
            </div>
            <Button size="lg" onClick={startGame} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-12 py-6 text-xl rounded-full shadow-[0_0_30px_rgba(234,179,8,0.3)]">
              开始挑战
            </Button>
          </div>
        )}

        {(gameState === 'gameover' || gameState === 'win') && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-950/80 backdrop-blur-md">
            <Trophy className="w-20 h-20 text-yellow-500 mb-4 animate-bounce" />
            <h2 className="text-4xl font-black mb-2">{gameState === 'win' ? 'YOU WIN!' : 'GAME OVER'}</h2>
            <p className="text-xl mb-8 opacity-80">最终得分: {score}</p>
            <Button size="lg" onClick={startGame} className="bg-white text-black hover:bg-slate-200 font-bold px-8">
              再来一局
            </Button>
          </div>
        )}
      </div>

      {/* 底栏提示 */}
      <div className="p-2 text-center text-xs opacity-30 pointer-events-none">
        鼠标移动控制方向 · 点击左键发射球球 · 3个相同颜色消除
      </div>
    </div>
  );
};

export default ZumaGame;
