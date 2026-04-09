import React, { useEffect, useRef, useMemo } from 'react';

export const OceanBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // 性能优化：检测是否为移动端
  const isMobile = useMemo(() => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d', { alpha: false });
    if (!context) return;

    let animationFrameId: number;
    let width: number;
    let height: number;

    const FISH_COUNT = isMobile ? 6 : 15;
    const BUBBLE_COUNT = isMobile ? 12 : 30;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener('resize', resize);
    resize();

    // 使用接口定义对象结构，避免类初始化问题
    interface IFish {
      x: number;
      y: number;
      size: number;
      speed: number;
      color: string;
      oscillation: number;
    }

    interface IBubble {
      x: number;
      y: number;
      size: number;
      speed: number;
      opacity: number;
    }

    const createFish = (): IFish => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * (isMobile ? 15 : 20) + 10,
      speed: Math.random() * 1.5 + 0.5,
      color: `rgba(147, 197, 253, ${Math.random() * 0.4 + 0.2})`, // 调亮鱼的颜色
      oscillation: Math.random() * Math.PI * 2,
    });

    const createBubble = (): IBubble => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * (isMobile ? 3 : 5) + 1,
      speed: Math.random() * 1 + 0.5,
      opacity: Math.random() * 0.3 + 0.1,
    });

    const fishes = Array.from({ length: FISH_COUNT }, createFish);
    const bubbles = Array.from({ length: BUBBLE_COUNT }, createBubble);

    let cachedGradient: CanvasGradient | null = null;
    let lastWidth = 0;
    let lastHeight = 0;

    const render = () => {
      if (!cachedGradient || width !== lastWidth || height !== lastHeight) {
        cachedGradient = context.createLinearGradient(0, 0, 0, height);
        cachedGradient.addColorStop(0, '#0f172a'); // 顶部：深蓝色
        cachedGradient.addColorStop(1, '#1e3a8a'); // 底部：明亮的海洋蓝
        lastWidth = width;
        lastHeight = height;
      }

      context.fillStyle = cachedGradient;
      context.fillRect(0, 0, width, height);

      const rayCount = isMobile ? 3 : 5;
      for (let i = 0; i < rayCount; i++) {
        const rayX = (width / rayCount) * i + (Math.sin(Date.now() / 2000 + i) * 50);
        const rayWidth = isMobile ? 120 : 250;
        
        const rayGradient = context.createLinearGradient(rayX, 0, rayX + rayWidth, 0);
        rayGradient.addColorStop(0, 'transparent');
        rayGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.06)'); // 提高光线亮度
        rayGradient.addColorStop(1, 'transparent');
        
        context.fillStyle = rayGradient;
        context.beginPath();
        context.moveTo(rayX, 0);
        context.lineTo(rayX + rayWidth, 0);
        context.lineTo(rayX + rayWidth - 100, height);
        context.lineTo(rayX - 100, height);
        context.fill();
      }

      bubbles.forEach(b => {
        b.y -= b.speed;
        if (b.y < -20) {
          b.y = height + 20;
          b.x = Math.random() * width;
        }
        context.beginPath();
        context.fillStyle = `rgba(255, 255, 255, ${b.opacity})`;
        context.arc(b.x, b.y, b.size, 0, Math.PI * 2);
        context.fill();
      });

      fishes.forEach(f => {
        f.x += f.speed;
        f.oscillation += 0.05;
        f.y += Math.sin(f.oscillation) * 0.5;

        if (f.x > width + f.size * 2) {
          f.x = -f.size * 2;
          f.y = Math.random() * height;
        }

        context.fillStyle = f.color;
        context.beginPath();
        context.ellipse(f.x, f.y, f.size, f.size / 2.5, 0, 0, Math.PI * 2);
        context.fill();

        context.beginPath();
        context.moveTo(f.x - f.size * 0.8, f.y);
        context.lineTo(f.x - f.size * 1.5, f.y - f.size / 2);
        context.lineTo(f.x - f.size * 1.5, f.y + f.size / 2);
        context.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isMobile]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ background: '#0f172a' }}
    />
  );
};
