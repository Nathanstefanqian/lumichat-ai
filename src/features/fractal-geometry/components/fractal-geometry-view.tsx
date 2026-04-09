import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Network, 
  GitBranch, 
  Layers, 
  Info, 
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Zap,
  Binary
} from 'lucide-react';
import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FractalInfo {
  id: string;
  title: string;
  points: string[];
  icon: LucideIcon;
}

const FRACTAL_KNOWLEDGE: FractalInfo[] = [
  {
    id: 'features',
    title: '1. 分形的基本特征',
    points: [
      '自相似性：局部与整体具有相似的形态，无论在哪个尺度下观察。',
      '无标度性：系统特征不依赖于大小尺度，表现出一种规律性。'
    ],
    icon: Network,
  },
  {
    id: 'definitions',
    title: '2. 分形的五个定义内容',
    points: [
      'a. 具有任意尺度下的比例细节，精确结构。',
      'b. 通常有某种自相似性，局部是整体的缩小版。',
      'c. 不是简单的图形，不能用传统几何语言描述。',
      'd. “分形维数”一般大于它的拓扑维数。',
      'e. 定义方式通常可以是简单的递归方式。'
    ],
    icon: Binary,
  },
  {
    id: 'models',
    title: '3. 分形几何学基本模型',
    points: [
      '递归模型：分形几何学的核心基础。',
      'L 系统模型：仿照语言学语法的图形构造算法。',
      '迭代函数系统 (IFS)：利用压缩仿射变换生成图形。'
    ],
    icon: GitBranch,
  }
];

export const FractalGeometryView: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeFractal, setActiveFractal] = useState<'tree' | 'snowflake' | 'mandelbrot'>('tree');
  const [iteration, setIteration] = useState(0);

  // 1. Fractal Tree Renderer
  const drawTree = (ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, length: number, depth: number) => {
    if (depth <= 0) return;

    const x2 = x + Math.cos(angle) * length;
    const y2 = y + Math.sin(angle) * length;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = `hsl(${120 + depth * 20}, 70%, 60%)`;
    ctx.lineWidth = depth * 0.8;
    ctx.stroke();

    drawTree(ctx, x2, y2, angle - 0.4, length * 0.75, depth - 1);
    drawTree(ctx, x2, y2, angle + 0.4, length * 0.75, depth - 1);
  };

  // 2. Koch Snowflake Renderer
  const drawKoch = (ctx: CanvasRenderingContext2D, p1: [number, number], p2: [number, number], depth: number) => {
    if (depth === 0) {
      ctx.beginPath();
      ctx.moveTo(p1[0], p1[1]);
      ctx.lineTo(p2[0], p2[1]);
      ctx.stroke();
      return;
    }

    const pA = [
      p1[0] + (p2[0] - p1[0]) / 3,
      p1[1] + (p2[1] - p1[1]) / 3
    ] as [number, number];

    const pC = [
      p1[0] + (p2[0] - p1[0]) * 2 / 3,
      p1[1] + (p2[1] - p1[1]) * 2 / 3
    ] as [number, number];

    const angle = -Math.PI / 3;
    const pB = [
      pA[0] + Math.cos(Math.atan2(pC[1] - pA[1], pC[0] - pA[0]) + angle) * (Math.sqrt((pC[0] - pA[0])**2 + (pC[1] - pA[1])**2)),
      pA[1] + Math.sin(Math.atan2(pC[1] - pA[1], pC[0] - pA[0]) + angle) * (Math.sqrt((pC[0] - pA[0])**2 + (pC[1] - pA[1])**2))
    ] as [number, number];

    drawKoch(ctx, p1, pA, depth - 1);
    drawKoch(ctx, pA, pB, depth - 1);
    drawKoch(ctx, pB, pC, depth - 1);
    drawKoch(ctx, pC, p2, depth - 1);
  };

  // 3. Mandelbrot Set Renderer
  const drawMandelbrot = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const maxIter = 100;
    const imageData = ctx.createImageData(width, height);
    
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        let a = (x - width / 1.5) / (width / 3);
        let b = (y - height / 2) / (height / 3);
        const ca = a;
        const cb = b;
        let n = 0;
        
        while (n < maxIter) {
          const aa = a * a;
          const bb = b * b;
          if (aa + bb > 4) break;
          const twoab = 2 * a * b;
          a = aa - bb + ca;
          b = twoab + cb;
          n++;
        }

        const pix = (x + y * width) * 4;
        if (n === maxIter) {
          imageData.data[pix] = 0;
          imageData.data[pix+1] = 0;
          imageData.data[pix+2] = 0;
        } else {
          const hue = (n / maxIter) * 360;
          imageData.data[pix] = hue % 255;
          imageData.data[pix+1] = (hue * 2) % 255;
          imageData.data[pix+2] = (hue * 3) % 255;
        }
        imageData.data[pix+3] = 255;
      }
    }
    ctx.putImageData(imageData, 0, 0);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width = canvas.offsetWidth;
    const height = canvas.height = canvas.offsetHeight;
    ctx.clearRect(0, 0, width, height);

    if (activeFractal === 'tree') {
      drawTree(ctx, width / 2, height - 50, -Math.PI / 2, height / 4, iteration + 1);
    } else if (activeFractal === 'snowflake') {
      ctx.strokeStyle = '#4488ff';
      ctx.lineWidth = 1;
      const p1: [number, number] = [width * 0.2, height * 0.7];
      const p2: [number, number] = [width * 0.8, height * 0.7];
      const p3: [number, number] = [width * 0.5, height * 0.7 - (width * 0.6 * Math.sqrt(3) / 2)];
      drawKoch(ctx, p1, p2, Math.min(iteration, 5));
      drawKoch(ctx, p2, p3, Math.min(iteration, 5));
      drawKoch(ctx, p3, p1, Math.min(iteration, 5));
    } else if (activeFractal === 'mandelbrot') {
      drawMandelbrot(ctx, width, height);
    }
  }, [activeFractal, iteration]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0a0a] text-white overflow-hidden font-sans">
      {/* Top Banner */}
      <div className="p-6 md:p-8 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-4 mb-2">
          <div className="p-3 bg-blue-500/20 rounded-2xl">
            <Layers className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">分形几何学 (Fractal Geometry)</h1>
            <p className="text-white/50 text-sm">研究非规则、无限复杂但具有自相似结构的图形学</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden p-4 md:p-6 gap-6">
        {/* Knowledge Section */}
        <div className="w-full md:w-1/3 flex flex-col gap-4 overflow-y-auto pr-2 scrollbar-hide">
          {FRACTAL_KNOWLEDGE.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors group"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                  {React.createElement(item.icon, { className: "w-5 h-5 text-blue-400" })}
                </div>
                <h2 className="text-lg font-bold text-blue-300">{item.title}</h2>
              </div>
              <ul className="space-y-3">
                {item.points.map((point, pIdx) => (
                  <li key={pIdx} className="flex gap-2 text-sm text-white/70 leading-relaxed">
                    <ChevronRight className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
          
          <div className="mt-auto p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex gap-3">
            <Zap className="w-5 h-5 text-orange-400 shrink-0" />
            <p className="text-xs text-orange-200/70">
              分形维数是分形几何的重要概念，它描述了图形填充空间的效率，通常是一个非整数。
            </p>
          </div>
        </div>

        {/* Visualizer Section */}
        <div className="flex-1 flex flex-col bg-black/40 border border-white/10 rounded-3xl overflow-hidden relative group">
          <div className="absolute top-6 left-6 z-20 flex gap-2">
            {(['tree', 'snowflake', 'mandelbrot'] as ('tree' | 'snowflake' | 'mandelbrot')[]).map((type) => (
              <button
                key={type}
                onClick={() => {
                  setActiveFractal(type);
                  setIteration(0);
                }}
                className={cn(
                  "px-4 py-2 rounded-full text-xs font-bold transition-all border",
                  activeFractal === type 
                    ? "bg-blue-500 border-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]" 
                    : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"
                )}
              >
                {type === 'tree' && '分形树 (L-System)'}
                {type === 'snowflake' && '科赫雪花 (递归)'}
                {type === 'mandelbrot' && '曼德勃罗集 (IFS)'}
              </button>
            ))}
          </div>

          <div className="absolute bottom-6 left-6 right-6 z-20 flex items-center justify-between pointer-events-none">
            <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-3 pointer-events-auto">
              <span className="text-xs text-white/50">迭代次数: {iteration}</span>
              <div className="flex gap-1">
                <button 
                  onClick={() => setIteration(Math.max(0, iteration - 1))}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setIteration(Math.min(10, iteration + 1))}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <button 
              onClick={() => setIteration(0)}
              className="bg-black/60 backdrop-blur-md p-2 rounded-2xl border border-white/10 pointer-events-auto hover:bg-white/10 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <canvas ref={canvasRef} className="w-full h-full cursor-crosshair" />
          
          {/* Legend */}
          <div className="absolute top-6 right-6 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-black/60 backdrop-blur-md p-3 rounded-xl border border-white/10 flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-400" />
              <span className="text-[10px] text-white/60">实时 Canvas 渲染</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};
