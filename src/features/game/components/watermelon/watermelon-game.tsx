import React, { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import { Button } from '@/components/ui/button';
import { Trophy, RefreshCw, Save, Upload } from 'lucide-react';
import { toast } from 'sonner';

// Fruits Configuration
const FRUITS = [
  { name: 'Cherry', radius: 15, color: '#F87171', score: 2 },        // Level 0
  { name: 'Strawberry', radius: 25, color: '#FB923C', score: 4 },    // Level 1
  { name: 'Grape', radius: 35, color: '#A78BFA', score: 6 },         // Level 2
  { name: 'Dekopon', radius: 45, color: '#FACC15', score: 8 },       // Level 3
  { name: 'Persimmon', radius: 55, color: '#FB923C', score: 10 },    // Level 4
  { name: 'Apple', radius: 65, color: '#EF4444', score: 12 },        // Level 5
  { name: 'Pear', radius: 75, color: '#84CC16', score: 14 },         // Level 6
  { name: 'Peach', radius: 85, color: '#F472B6', score: 16 },        // Level 7
  { name: 'Pineapple', radius: 95, color: '#FCD34D', score: 18 },    // Level 8
  { name: 'Melon', radius: 105, color: '#34D399', score: 20 },       // Level 9
  { name: 'Watermelon', radius: 120, color: '#10B981', score: 22 },  // Level 10
];

const GAME_WIDTH = 400;
const GAME_HEIGHT = 600;
const WALL_THICKNESS = 20;

export const WatermelonGame = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [nextFruitLevel, setNextFruitLevel] = useState(0);

  // Helper to create a fruit body
  const createFruit = (x: number, y: number, level: number, isStatic = false) => {
    const fruitConfig = FRUITS[level];
    const fruit = Matter.Bodies.circle(x, y, fruitConfig.radius, {
      isStatic: isStatic,
      label: 'fruit',
      restitution: 0.2, // Bounciness
      friction: 0.1,
      render: {
        fillStyle: fruitConfig.color,
        strokeStyle: '#000',
        lineWidth: 1,
      },
    });
    // @ts-expect-error adding custom property
    fruit.level = level;
    return fruit;
  };

  // Initialize Physics Engine
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    // Create engine
    const engine = Matter.Engine.create();
    engineRef.current = engine;

    // Create renderer
    const render = Matter.Render.create({
      element: containerRef.current,
      canvas: canvasRef.current,
      engine: engine,
      options: {
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
        wireframes: false,
        background: 'transparent',
        pixelRatio: window.devicePixelRatio,
      },
    });
    renderRef.current = render;

    // Wall Style
    const wallStyle = { fillStyle: '#71717a' }; // zinc-500

    // Create walls
    const ground = Matter.Bodies.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT + WALL_THICKNESS / 2,
      GAME_WIDTH,
      WALL_THICKNESS,
      { isStatic: true, render: wallStyle, label: 'wall' }
    );
    const leftWall = Matter.Bodies.rectangle(
      -WALL_THICKNESS / 2,
      GAME_HEIGHT / 2,
      WALL_THICKNESS,
      GAME_HEIGHT,
      { isStatic: true, render: wallStyle, label: 'wall' }
    );
    const rightWall = Matter.Bodies.rectangle(
      GAME_WIDTH + WALL_THICKNESS / 2,
      GAME_HEIGHT / 2,
      WALL_THICKNESS,
      GAME_HEIGHT,
      { isStatic: true, render: wallStyle, label: 'wall' }
    );

    // Add Top Line Sensor (Game Over Line)
    // const topLineY = 100;

    Matter.World.add(engine.world, [ground, leftWall, rightWall]);

    // Create runner
    const runner = Matter.Runner.create();
    runnerRef.current = runner;
    Matter.Runner.run(runner, engine);
    Matter.Render.run(render);

    // Collision Event
    Matter.Events.on(engine, 'collisionStart', (event) => {
      event.pairs.forEach((pair) => {
        const bodyA = pair.bodyA;
        const bodyB = pair.bodyB;

        // Check if both are fruits (have 'level' property)
        if (bodyA.label === 'fruit' && bodyB.label === 'fruit') {
          // @ts-expect-error custom property
          const levelA = bodyA.level;
          // @ts-expect-error custom property
          const levelB = bodyB.level;

          // @ts-expect-error custom property
          if (levelA === levelB && !bodyA.isMerging && !bodyB.isMerging) {
            // Merge!
            // @ts-expect-error custom property
            bodyA.isMerging = true;
            // @ts-expect-error custom property
            bodyB.isMerging = true;

            // Remove old bodies
            Matter.World.remove(engine.world, [bodyA, bodyB]);

            // Calculate new position (midpoint)
            const newX = (bodyA.position.x + bodyB.position.x) / 2;
            const newY = (bodyA.position.y + bodyB.position.y) / 2;

            const nextLevel = levelA + 1;

            if (nextLevel < FRUITS.length) {
              const newFruit = createFruit(newX, newY, nextLevel);
              Matter.World.add(engine.world, newFruit);
              
              // Add Score
              setScore((prev) => prev + FRUITS[nextLevel].score);
            } else {
              // Max level reached (Watermelon merges disappear or just stay?)
              setScore((prev) => prev + 100);
            }
          }
        }
      });
    });

    return () => {
      Matter.Render.stop(render);
      Matter.Runner.stop(runner);
      if (render.canvas) render.canvas.remove();
    };
  }, []);

  // Handle Drop
  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (gameOver || !engineRef.current || !renderRef.current) return;

    const rect = renderRef.current.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    
    // Clamp x to be within walls
    const clampedX = Math.max(WALL_THICKNESS + FRUITS[nextFruitLevel].radius, Math.min(x, GAME_WIDTH - WALL_THICKNESS - FRUITS[nextFruitLevel].radius));

    // Create the falling fruit
    const newFruit = createFruit(clampedX, 50, nextFruitLevel, false);
    Matter.World.add(engineRef.current.world, newFruit);

    // Randomize next fruit (0 to 3)
    setNextFruitLevel(Math.floor(Math.random() * 4));
  };

  const restartGame = () => {
    if (!engineRef.current) return;
    Matter.World.clear(engineRef.current.world, false); // Keep static bodies? No, clear all non-static
    
    // Re-add walls (Since clear removes everything if keepStatic is false, or we filter)
    // Actually World.clear(world, keepStatic)
    Matter.World.clear(engineRef.current.world, true); // Keep static (walls)
    
    setScore(0);
    setGameOver(false);
    setNextFruitLevel(0);
  };

  const saveGame = () => {
    if (!engineRef.current) return;
    const bodies = engineRef.current.world.bodies.filter(b => b.label === 'fruit');
    const saveData = bodies.map(b => ({
      x: b.position.x,
      y: b.position.y,
      level: (b as { level?: number }).level || 0,
      angle: b.angle,
      velocity: b.velocity,
      angularVelocity: b.angularVelocity
    }));
    
    localStorage.setItem('watermelon-save', JSON.stringify({
      score,
      nextFruitLevel,
      fruits: saveData
    }));
    toast.success('游戏进度已保存');
  };

  const loadGame = () => {
    const saved = localStorage.getItem('watermelon-save');
    const engine = engineRef.current;
    
    if (!saved || !engine) {
        toast.error('没有找到存档');
        return;
    }
    
    try {
        const data = JSON.parse(saved);
        setScore(data.score);
        setNextFruitLevel(data.nextFruitLevel);
        
        // Clear existing fruits
        const currentFruits = engine.world.bodies.filter(b => b.label === 'fruit');
        Matter.World.remove(engine.world, currentFruits);
        
        // Restore fruits
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data.fruits.forEach((f: any) => {
          const fruit = createFruit(f.x, f.y, f.level);
          Matter.Body.setAngle(fruit, f.angle);
          Matter.Body.setVelocity(fruit, f.velocity);
          Matter.Body.setAngularVelocity(fruit, f.angularVelocity);
          Matter.World.add(engine.world, fruit);
        });
        
        setGameOver(false);
        toast.success('游戏进度已读取');
    } catch (e) {
        toast.error('存档读取失败');
        console.error(e);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-background p-4 overflow-hidden">
      <div className="mb-4 flex items-center gap-4">
        <div className="flex flex-col items-center mr-4">
          <div className="text-sm text-muted-foreground uppercase font-bold tracking-wider">Score</div>
          <div className="text-3xl font-black text-foreground flex items-center gap-2">
            <Trophy className="text-yellow-500" />
            {score}
          </div>
        </div>
        <div className="flex flex-col items-center mr-4">
          <div className="text-sm text-muted-foreground uppercase font-bold tracking-wider">Next</div>
          <div 
            className="w-10 h-10 rounded-full border-2 border-border shadow-md"
            style={{ backgroundColor: FRUITS[nextFruitLevel].color }}
          />
        </div>
        <div className="flex gap-2">
            <Button onClick={saveGame} variant="outline" size="icon" className="rounded-full bg-background/80 hover:bg-accent" title="保存进度">
              <Save className="h-4 w-4 text-primary" />
            </Button>
            <Button onClick={loadGame} variant="outline" size="icon" className="rounded-full bg-background/80 hover:bg-accent" title="读取进度">
              <Upload className="h-4 w-4 text-primary" />
            </Button>
            <Button onClick={restartGame} variant="outline" size="icon" className="rounded-full bg-background/80 hover:bg-accent" title="重新开始">
              <RefreshCw className="h-4 w-4 text-primary" />
            </Button>
        </div>
      </div>

      <div 
        ref={containerRef} 
        className="relative shadow-2xl rounded-xl overflow-hidden border-4 border-border bg-card/50 backdrop-blur-sm"
        style={{ width: GAME_WIDTH, height: GAME_HEIGHT, cursor: 'pointer' }}
        onClick={handleContainerClick}
      >
        <canvas ref={canvasRef} />
        
        {/* Aim Line (Optional, follows mouse) */}
        
        {gameOver && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center backdrop-blur-sm">
            <div className="bg-card p-8 rounded-2xl shadow-xl text-center border border-border">
              <div className="text-4xl mb-4">😢</div>
              <h2 className="text-2xl font-bold mb-2 text-foreground">Game Over</h2>
              <p className="text-muted-foreground mb-6">Final Score: {score}</p>
              <Button onClick={restartGame} className="w-full">Try Again</Button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 text-sm text-muted-foreground">
        Click anywhere to drop the fruit. Combine same fruits to get a Watermelon!
      </div>
    </div>
  );
};
