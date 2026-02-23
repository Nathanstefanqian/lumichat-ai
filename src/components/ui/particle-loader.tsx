import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
}

export const ParticleLoader = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const particles: Particle[] = [];
    let hue = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.parentElement?.clientWidth || window.innerWidth;
      const height = canvas.parentElement?.clientHeight || window.innerHeight;
      
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      
      // Fix visual size via CSS (usually handled by w-full h-full, but good to be explicit if needed, 
      // but here className handles it. We just need to scale context)
      ctx.scale(dpr, dpr);
    };

    window.addEventListener('resize', resize);
    resize();

    const createParticle = (x: number, y: number): Particle => {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2 + 0.5;
      return {
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 3 + 1,
        color: `hsl(${hue}, 70%, 60%)`,
        life: 0,
        maxLife: Math.random() * 100 + 50,
      };
    };

    const drawHeart = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, alpha: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(size / 10, size / 10);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      // Heart shape path
      ctx.bezierCurveTo(-5, -5, -10, 0, -10, 5);
      ctx.bezierCurveTo(-10, 10, -5, 15, 0, 20);
      ctx.bezierCurveTo(5, 15, 10, 10, 10, 5);
      ctx.bezierCurveTo(10, 0, 5, -5, 0, 0);
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha;
      ctx.fill();
      ctx.restore();
    };

    const animate = () => {
      const dpr = window.devicePixelRatio || 1;
      const logicalWidth = canvas.width / dpr;
      const logicalHeight = canvas.height / dpr;

      ctx.clearRect(0, 0, logicalWidth, logicalHeight);
      
      // Create new particles from center
      if (particles.length < 100) {
        particles.push(createParticle(logicalWidth / 2, logicalHeight / 2));
      }

      hue = (hue + 0.5) % 360;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        
        // Soft gravity/float
        p.vy -= 0.02; 

        const alpha = 1 - p.life / p.maxLife;
        
        // Draw glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = p.color;
        
        // Draw heart or circle
        if (Math.random() > 0.5) {
             drawHeart(ctx, p.x, p.y, p.size * 3, p.color, alpha);
        } else {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = alpha;
            ctx.fill();
        }
        
        ctx.shadowBlur = 0;

        if (p.life >= p.maxLife || p.x < 0 || p.x > logicalWidth || p.y < 0 || p.y > logicalHeight) {
          particles.splice(i, 1);
          i--;
        }
      }

      // Add romantic text
      ctx.font = '20px "Dancing Script", cursive, sans-serif'; // Fallback to sans-serif
      ctx.fillStyle = `hsl(${hue}, 70%, 80%)`;
      ctx.textAlign = 'center';
      ctx.globalAlpha = 0.8 + Math.sin(Date.now() / 500) * 0.2;
      ctx.fillText("Dreaming up your masterpiece...", logicalWidth / 2, logicalHeight / 2 + 80);

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="w-full h-full absolute inset-0 bg-black/10 backdrop-blur-[1px]" />;
};
