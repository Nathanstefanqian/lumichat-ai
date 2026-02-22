import { useEffect, useRef, useState, useCallback } from 'react';
import { Play, RotateCcw, Trophy } from 'lucide-react';

interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  color: string;
}

interface Bullet extends GameObject {
  active: boolean;
}

interface Enemy extends GameObject {
  active: boolean;
  hp: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  brightness: number;
  color: string;
}

export function PlaneShooterGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [wallHp, setWallHp] = useState(100);
  const [highScore, setHighScore] = useState(() => {
    return Number(localStorage.getItem('plane-shooter-highscore') || 0);
  });

  // Use a ref to track game status for the animation loop to avoid stale closures
  const gameStatusRef = useRef<'start' | 'playing' | 'gameover'>('start');

  const stateRef = useRef({
    player: { x: 0, y: 0, width: 40, height: 40, speed: 5, color: '#3b82f6' },
    bullets: [] as Bullet[],
    enemies: [] as Enemy[],
    particles: [] as Particle[],
    stars: [] as Star[],
    lastShot: 0,
    lastEnemySpawn: 0,
    score: 0,
    level: 1,
    wallHp: 100,
    maxWallHp: 100,
    keys: {} as Record<string, boolean>,
    animationId: 0,
    canvas: { width: 0, height: 0 },
    dragOffset: { x: 0, y: 0 },
    isDragging: false,
  });

  // Update ref when state changes
  useEffect(() => {
    gameStatusRef.current = gameState;
  }, [gameState]);

  // Star background effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Initialize stars if needed
    if (stateRef.current.stars.length === 0) {
      for (let i = 0; i < 100; i++) {
        stateRef.current.stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 0.5,
          speed: Math.random() * 3 + 0.5,
          brightness: Math.random(),
          color: Math.random() > 0.8 ? '#f472b6' : (Math.random() > 0.5 ? '#a78bfa' : '#ffffff') // Pink, Purple, or White
        });
      }
    }
  }, []);

  const createExplosion = useCallback((x: number, y: number, color: string) => {
    for (let i = 0; i < 10; i++) {
      stateRef.current.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 1.0,
        color,
      });
    }
  }, []);

  const gameTick = useCallback(() => {
    if (gameStatusRef.current !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const now = Date.now();
    const state = stateRef.current;

    // Draw Background (Starry Sky)
    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1a0b2e'); // Deep Purple/Black
    gradient.addColorStop(1, '#310d20'); // Dark Pink/Purple
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Stars
    state.stars.forEach((star) => {
      star.y += star.speed;
      if (star.y > canvas.height) {
        star.y = 0;
        star.x = Math.random() * canvas.width;
      }
      
      ctx.globalAlpha = Math.abs(Math.sin(now / 1000 + star.x)) * 0.5 + 0.5; // Twinkle
      ctx.fillStyle = star.color;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    });

    // Draw Wall (Bottom)
    const wallHeight = 10;
    const wallY = canvas.height - wallHeight;
    
    // Wall Health Bar Background
    ctx.fillStyle = '#3f3f46';
    ctx.fillRect(0, canvas.height - 10, canvas.width, 10);
    
    // Wall Health Bar Foreground
    const wallHpPercent = Math.max(0, state.wallHp / state.maxWallHp);
    const wallColor = wallHpPercent > 0.6 ? '#22c55e' : (wallHpPercent > 0.3 ? '#eab308' : '#ef4444');
    
    ctx.fillStyle = wallColor;
    ctx.shadowBlur = 10;
    ctx.shadowColor = wallColor;
    ctx.fillRect(0, canvas.height - 10, canvas.width * wallHpPercent, 10);
    ctx.shadowBlur = 0;
    
    // Wall Line Glow
    ctx.beginPath();
    ctx.strokeStyle = wallColor;
    ctx.lineWidth = 2;
    ctx.moveTo(0, wallY);
    ctx.lineTo(canvas.width, wallY);
    ctx.stroke();

    // Update Player (Keyboard)
    if (state.keys['ArrowLeft'] || state.keys['a']) state.player.x -= state.player.speed;
    if (state.keys['ArrowRight'] || state.keys['d']) state.player.x += state.player.speed;
    if (state.keys['ArrowUp'] || state.keys['w']) state.player.y -= state.player.speed;
    if (state.keys['ArrowDown'] || state.keys['s']) state.player.y += state.player.speed;

    // Clamp Player
    state.player.x = Math.max(0, Math.min(state.player.x, canvas.width - state.player.width));
    state.player.y = Math.max(0, Math.min(state.player.y, canvas.height - state.player.height));

    // Draw Player
    ctx.fillStyle = state.player.color;
    ctx.beginPath();
    ctx.moveTo(state.player.x + state.player.width / 2, state.player.y);
    ctx.lineTo(state.player.x + state.player.width, state.player.y + state.player.height);
    ctx.lineTo(state.player.x + state.player.width / 2, state.player.y + state.player.height - 10);
    ctx.lineTo(state.player.x, state.player.y + state.player.height);
    ctx.closePath();
    ctx.fill();
    
    // Thruster
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(state.player.x + state.player.width / 2 - 5, state.player.y + state.player.height - 5);
    ctx.lineTo(state.player.x + state.player.width / 2 + 5, state.player.y + state.player.height - 5);
    ctx.lineTo(state.player.x + state.player.width / 2, state.player.y + state.player.height + 10 + Math.random() * 10);
    ctx.closePath();
    ctx.fill();

    // Shooting
    if (now - state.lastShot > 100) {
      state.bullets.push({
        x: state.player.x + state.player.width / 2 - 2,
        y: state.player.y,
        width: 4,
        height: 10,
        speed: 10,
        color: '#fbbf24',
        active: true,
      });
      state.lastShot = now;
    }

    // Spawn Enemies
    const spawnRate = Math.max(300, 1500 - state.level * 15); // Slower spawn rate
    
    if (now - state.lastEnemySpawn > spawnRate) {
      const size = 30 + Math.random() * 20;
      let speed = 1 + Math.random() * 1.5 + state.level * 0.05; // Slower speed
      let color = '#ef4444'; // Default Red
      let hp = Math.floor(size / 10) + Math.floor(state.level / 5);

      // Enemy Types based on Level
      const rand = Math.random();
      if (state.level >= 5 && rand > 0.7) {
        // Fast Enemy (Yellow)
        speed *= 1.5;
        color = '#eab308';
        hp = Math.floor(hp * 0.7);
      } else if (state.level >= 10 && rand > 0.8) {
        // Tank Enemy (Purple)
        speed *= 0.5;
        color = '#a855f7';
        hp *= 3;
      } else if (state.level >= 20 && rand > 0.9) {
        // Elite Enemy (Cyan)
        speed *= 1.2;
        color = '#06b6d4';
        hp *= 5;
      }

      state.enemies.push({
        x: Math.random() * (canvas.width - size),
        y: -size,
        width: size,
        height: size,
        speed,
        color,
        active: true,
        hp,
      });
      state.lastEnemySpawn = now;
    }

    // Update Bullets
    state.bullets.forEach((bullet) => {
      bullet.y -= bullet.speed;
      if (bullet.y < 0) bullet.active = false;
    });

    // Update Enemies
    state.enemies.forEach((enemy) => {
      enemy.y += enemy.speed;
      
      // Hit Wall logic
      if (enemy.y + enemy.height >= canvas.height - 10) { // 10 is wall height
        enemy.active = false;
        createExplosion(enemy.x + enemy.width/2, canvas.height - 10, '#ef4444');
        state.wallHp -= 10; // Damage Wall
        setWallHp(state.wallHp); // Update React State for UI if needed, though we draw from ref
        
        if (state.wallHp <= 0) {
          setGameState('gameover');
          if (state.score > Number(localStorage.getItem('plane-shooter-highscore') || 0)) {
            setHighScore(state.score);
            localStorage.setItem('plane-shooter-highscore', String(state.score));
          }
        }
      }
    });

    // Collision Detection
    state.bullets.forEach((bullet) => {
      if (!bullet.active) return;
      state.enemies.forEach((enemy) => {
        if (!enemy.active) return;
        if (
          bullet.x < enemy.x + enemy.width &&
          bullet.x + bullet.width > enemy.x &&
          bullet.y < enemy.y + enemy.height &&
          bullet.y + bullet.height > enemy.y
        ) {
          bullet.active = false;
          enemy.hp--;
          createExplosion(bullet.x, bullet.y, '#fbbf24');
          
          if (enemy.hp <= 0) {
            enemy.active = false;
            createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2, enemy.color);
            state.score += 10;
            setScore(state.score);
            
            // Level Up Logic
            const newLevel = Math.floor(state.score / 100) + 1;
            if (newLevel > state.level) {
              state.level = Math.min(newLevel, 99); // Max Level 99
              setLevel(state.level);
              // Heal wall slightly on level up? Maybe.
              state.wallHp = Math.min(state.maxWallHp, state.wallHp + 10);
              setWallHp(state.wallHp);
            }
          }
        }
      });
    });

    // Player Collision (REMOVED: Player can pass through enemies)
    // state.enemies.forEach((enemy) => {
    //   if (!enemy.active) return;
    //   if (
    //     state.player.x < enemy.x + enemy.width &&
    //     state.player.x + state.player.width > enemy.x &&
    //     state.player.y < enemy.y + enemy.height &&
    //     state.player.y + state.player.height > enemy.y
    //   ) {
    //     // Player doesn't die anymore
    //     // Maybe add a sound or small particle effect later if needed
    //   }
    // });

    // Update Particles
    state.particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.05;
    });
    state.particles = state.particles.filter((p) => p.life > 0);

    // Cleanup
    state.bullets = state.bullets.filter((b) => b.active);
    state.enemies = state.enemies.filter((e) => e.active);

    // Draw Bullets
    state.bullets.forEach((bullet) => {
      ctx.fillStyle = bullet.color;
      ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });

    // Draw Enemies
    state.enemies.forEach((enemy) => {
      ctx.fillStyle = enemy.color;
      ctx.beginPath();
      ctx.moveTo(enemy.x, enemy.y);
      ctx.lineTo(enemy.x + enemy.width, enemy.y);
      ctx.lineTo(enemy.x + enemy.width / 2, enemy.y + enemy.height);
      ctx.closePath();
      ctx.fill();
    });

    // Draw Particles
    state.particles.forEach((p) => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    });

    // stateRef.current.animationId = requestAnimationFrame(gameLoop); // Handled by useEffect
  }, [createExplosion]);

  useEffect(() => {
    if (gameState !== 'playing') return;
    
    let animationId: number;
    const loop = () => {
      gameTick();
      animationId = requestAnimationFrame(loop);
    };
    loop();
    
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [gameState, gameTick]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
      stateRef.current.canvas = { width: canvas.width, height: canvas.height };
      
      if (gameStatusRef.current === 'start') {
        stateRef.current.player.x = canvas.width / 2 - 20;
        stateRef.current.player.y = canvas.height - 100;
      }
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const handleKeyDown = (e: KeyboardEvent) => {
      stateRef.current.keys[e.key] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      stateRef.current.keys[e.key] = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (gameStatusRef.current !== 'playing') return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left - stateRef.current.player.width / 2;
      const y = e.clientY - rect.top - stateRef.current.player.height / 2;
      
      stateRef.current.player.x = Math.max(0, Math.min(x, canvas.width - stateRef.current.player.width));
      stateRef.current.player.y = Math.max(0, Math.min(y, canvas.height - stateRef.current.player.height));
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (gameStatusRef.current !== 'playing') return;
      if (e.cancelable) e.preventDefault();
      if (e.touches.length === 0) return;

      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const touchX = touch.clientX - rect.left;
      const touchY = touch.clientY - rect.top;

      stateRef.current.dragOffset = {
        x: stateRef.current.player.x - touchX,
        y: stateRef.current.player.y - touchY
      };
      stateRef.current.isDragging = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (gameStatusRef.current !== 'playing') return;
      // Prevent scrolling
      if (e.cancelable) {
        e.preventDefault();
      }
      
      if (!stateRef.current.isDragging || e.touches.length === 0) return;

      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const touchX = touch.clientX - rect.left;
      const touchY = touch.clientY - rect.top;

      // Apply offset
      const newX = touchX + stateRef.current.dragOffset.x;
      const newY = touchY + stateRef.current.dragOffset.y;
      
      stateRef.current.player.x = Math.max(0, Math.min(newX, canvas.width - stateRef.current.player.width));
      stateRef.current.player.y = Math.max(0, Math.min(newY, canvas.height - stateRef.current.player.height));
    };
    
    const handleTouchEnd = () => {
      stateRef.current.isDragging = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);
    canvas.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('touchcancel', handleTouchEnd);
      // cancelAnimationFrame(stateRef.current.animationId); // Handled by useEffect
    };
  }, []);

  const startGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    stateRef.current = {
      ...stateRef.current,
      player: { 
        x: canvas.width / 2 - 20, 
        y: canvas.height - 100, 
        width: 40, 
        height: 40, 
        speed: 5, 
        color: '#3b82f6' 
      },
      bullets: [],
      enemies: [],
      particles: [],
      lastShot: 0,
      lastEnemySpawn: 0,
      score: 0,
      level: 1,
      wallHp: 100,
      keys: {},
    };
    
    setScore(0);
    setLevel(1);
    setWallHp(100);
    setGameState('playing');
    gameStatusRef.current = 'playing';
  };

  return (
    <div className="relative w-full h-full bg-zinc-900 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="block w-full h-full cursor-none touch-none"
      />
      
      {/* UI Overlay */}
      <div className="absolute top-4 left-4 text-white font-mono text-xl select-none pointer-events-none z-20 flex flex-col gap-1">
        <div>SCORE: {score}</div>
        <div className="text-sm text-yellow-400">LEVEL: {level}</div>
        <div className="text-sm text-green-400">WALL: {wallHp}%</div>
      </div>
      <div className="absolute top-4 right-4 text-white font-mono text-xl select-none pointer-events-none z-20 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-yellow-500" />
        HIGH: {highScore}
      </div>

      {gameState === 'start' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-10">
          <h1 className="text-5xl font-bold text-white mb-8 tracking-wider bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">
            星际战机
          </h1>
          <button
            onClick={startGame}
            className="group relative px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold text-xl transition-all hover:scale-105 shadow-[0_0_20px_rgba(37,99,235,0.5)] flex items-center gap-3"
          >
            <Play className="w-6 h-6 fill-current" />
            开始游戏
          </button>
          <p className="mt-6 text-zinc-400 text-sm">
            使用鼠标、触摸或方向键控制移动
          </p>
        </div>
      )}

      {gameState === 'gameover' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md z-10">
          <h2 className="text-4xl font-bold text-red-500 mb-2">GAME OVER</h2>
          <p className="text-2xl text-white mb-8">最终得分: {score}</p>
          <button
            onClick={startGame}
            className="px-8 py-4 bg-white text-black hover:bg-zinc-200 rounded-full font-bold text-xl transition-all hover:scale-105 flex items-center gap-3"
          >
            <RotateCcw className="w-6 h-6" />
            重新开始
          </button>
        </div>
      )}
    </div>
  );
}
